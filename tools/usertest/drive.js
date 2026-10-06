#!/usr/bin/env node
/**
 * The hands and eyes of a simulated user.
 *
 * ── What this is for ────────────────────────────────────────────────────
 *
 * Three rounds of review ran agents over the code and over screenshots of
 * a hand-written fixture. Isaac then found two real bugs in ten minutes of
 * ordinary use. This is the attempt to close that gap: an agent that is
 * given a life, a task and a pair of hands, and is never told it is
 * reviewing anything.
 *
 * ── The four things that make it a person rather than a reviewer ────────
 *
 * 1. IT CANNOT READ THE SCREEN. This is the important one. An LLM handed
 *    `innerText` reads all eleven hundred characters of the fibre
 *    rationale, perfectly, every time, and therefore never discovers that
 *    the card tells a hungry person nothing about what to eat. `look`
 *    returns what somebody GLANCING sees: headings, button labels, and the
 *    first dozen words of any paragraph. The rest costs a `read`, the way
 *    it costs attention in life.
 *
 * 2. PATIENCE IS FINITE. Every action spends from a budget, and `read`
 *    costs four times a tap. When it runs out the session ends where it
 *    stands. Giving up is not a failed run; giving up is the finding, and
 *    where they gave up is the most valuable line in the transcript.
 *
 * 3. IT ARRIVES MID-LIFE. The seed is a week the simulator actually lived
 *    — crowded days, skipped sessions, a diary with history in it — not a
 *    tidy fixture. Breakfast only lands at 4pm when the morning is full.
 *
 * 4. IT HAS A CLOCK. `--time` sets the hour it opens the app. Both bugs
 *    found by hand were time bugs, and a review of one frozen instant
 *    cannot see the dimension this product is about.
 *
 * ── Usage ───────────────────────────────────────────────────────────────
 *
 *     node tools/usertest/drive.js start <persona> --time 16:20
 *     node tools/usertest/drive.js look
 *     node tools/usertest/drive.js tap "Start"
 *     node tools/usertest/drive.js read "Thirty grams of fibre"
 *     node tools/usertest/drive.js scroll 400
 *     node tools/usertest/drive.js back
 *     node tools/usertest/drive.js stop
 *
 * Each command reconnects to a Chrome left running between calls, so an
 * agent can drive it across turns and react to what it finds.
 */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const HERE = __dirname;
const SEEDS = process.env.USERTEST_SEEDS ?? path.join(HERE, 'seeds');
const RUNS = path.join(HERE, 'runs');
const STATE = path.join(RUNS, 'session.json');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = 9333;
const APP = process.env.USERTEST_APP ?? 'http://localhost:8099';
const KEY = 'intent-os-store';

/** What a glance costs, and what actually reading costs. */
const COST = { look: 1, tap: 1, scroll: 1, back: 1, read: 4 };

/** Words of a paragraph somebody takes in without deciding to read it. */
const SKIM_WORDS = 12;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadSession() {
  if (!fs.existsSync(STATE)) {
    console.error('No session. Run: drive.js start <persona>');
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(STATE, 'utf8'));
}

function saveSession(s) {
  fs.writeFileSync(STATE, JSON.stringify(s, null, 2));
}

function logStep(session, line) {
  fs.appendFileSync(path.join(RUNS, `${session.run}.log`), line + '\n');
}

async function connect() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];
  return { browser, page };
}

/**
 * What is actually on screen, as somebody glancing would take it in.
 *
 * Headings and controls come through whole — they are short and the eye
 * lands on them. Body text is cut to `SKIM_WORDS` with a note of what was
 * left, which is the mechanism that lets a reviewer discover "this told me
 * nothing" instead of silently absorbing eleven hundred characters.
 */
async function glance(page) {
  return page.evaluate((skimWords) => {
    const vh = window.innerHeight;
    const out = [];
    const seen = new Set();

    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh;
    };

    // Controls first: these are what a person looks for.
    const controls = [...document.querySelectorAll('[role="button"],[role="tab"]')]
      .filter(visible)
      .map((e) => (e.innerText || '').trim().replace(/\s+/g, ' '))
      .filter(Boolean);

    // Then text, in document order, truncated unless it is short.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode;
    while (node) {
      if (node.children.length === 0 && visible(node)) {
        const t = (node.innerText || '').trim().replace(/\s+/g, ' ');
        if (t && !seen.has(t)) {
          seen.add(t);
          const words = t.split(' ');
          if (words.length <= skimWords) out.push(t);
          else {
            out.push(
              `${words.slice(0, skimWords).join(' ')}… [${words.length - skimWords} more words — spend a \`read\` on it if you care]`,
            );
          }
        }
      }
      node = walker.nextNode();
    }

    const el = [...document.querySelectorAll('*')]
      .filter((e) => e.scrollHeight > e.clientHeight + 40)
      .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    const scroll = el
      ? { at: Math.round(el.scrollTop), of: Math.round(el.scrollHeight - el.clientHeight) }
      : { at: 0, of: 0 };

    return { controls, text: out, scroll, url: location.pathname };
  }, SKIM_WORDS);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  fs.mkdirSync(RUNS, { recursive: true });

  if (cmd === 'start') {
    const persona = rest[0];
    const arg = (flag, dflt) => {
      const i = rest.indexOf(flag);
      return i >= 0 ? rest[i + 1] : dflt;
    };
    const time = arg('--time', null);
    const scheme = arg('--scheme', 'light');
    const budget = Number(arg('--budget', 40));

    const seedPath = path.join(SEEDS, `${persona}.json`);
    if (!fs.existsSync(seedPath)) {
      console.error(
        `No seed for '${persona}'. Have: ${fs.readdirSync(SEEDS).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.replace('.json', '')).join(', ')}`,
      );
      process.exit(2);
    }
    const wrap = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

    /**
     * The hour they opened the app.
     *
     * The store already carries `clockOffsetMs` because the app needed to
     * be testable at a chosen time; this just uses it. Without it every
     * run happens at whatever moment the container is at, and a product
     * whose whole thesis is about moments gets reviewed at one.
     */
    if (time) {
      const [h, m] = time.split(':').map(Number);
      const now = new Date();
      const want = new Date(now);
      want.setHours(h, m, 0, 0);
      wrap.state.clockOffsetMs = want.getTime() - now.getTime();
    }

    // A browser left running, so the agent can drive it across turns.
    try {
      process.kill(Number(fs.readFileSync(path.join(RUNS, 'chrome.pid'), 'utf8')));
    } catch {
      /* nothing was running */
    }
    const proc = spawn(
      EXE,
      [
        `--remote-debugging-port=${PORT}`,
        // Outside the repo: a Chrome profile is tens of megabytes of churn
        // and does not belong in a working tree.
        '--user-data-dir=' + path.join(require('node:os').tmpdir(), 'intentnorth-usertest-profile'),
        // The container runs as root and Chrome refuses the sandbox there.
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        '--headless=new',
        `--force-color-profile=srgb`,
        'about:blank',
      ],
      { detached: true, stdio: ['ignore', fs.openSync(path.join(RUNS, 'chrome.out'), 'a'), fs.openSync(path.join(RUNS, 'chrome.err'), 'a')] },
    );
    proc.unref();
    fs.writeFileSync(path.join(RUNS, 'chrome.pid'), String(proc.pid));
    await sleep(2500);

    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
    const ctx = browser.contexts()[0];
    await ctx.addInitScript(
      ([k, v]) => {
        try {
          localStorage.setItem(k, v);
        } catch {
          /* private mode */
        }
      },
      [KEY, JSON.stringify(wrap)],
    );
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(APP, { waitUntil: 'networkidle' });
    await sleep(3500);

    const run = `${persona}-${Date.now()}`;
    const session = { persona, run, budget, spent: 0, time, scheme, steps: 0 };
    saveSession(session);
    logStep(session, `# ${persona} opened the app at ${time ?? 'now'} (${scheme})`);

    const g = await glance(page);
    console.log(JSON.stringify({ patienceLeft: budget, ...g }, null, 2));
    await browser.close();
    return;
  }

  /**
   * Did anybody actually use the app?
   *
   * The pilot's three runs were rejected by the API before a single
   * command was sent, and the workflow received `undefined` for each —
   * which is the same shape as a clean run with no findings. Its
   * extraction pass caught it only by opening the run directory by hand.
   *
   * Silent failure that looks like success is worse than a crash, so the
   * harness can now be asked, and answers with an exit code.
   */
  if (cmd === 'verify') {
    const min = Number(rest[0] ?? 5);
    if (!fs.existsSync(STATE)) {
      console.log(JSON.stringify({ ok: false, why: 'No session was ever started.' }));
      process.exit(3);
    }
    const s = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    const log = path.join(RUNS, `${s.run}.log`);
    const actions = fs.existsSync(log)
      ? fs.readFileSync(log, 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).length
      : 0;
    const ok = actions >= min;
    console.log(
      JSON.stringify(
        {
          ok,
          persona: s.persona,
          run: s.run,
          actions,
          spent: s.spent,
          budget: s.budget,
          why: ok
            ? undefined
            : `Only ${actions} action(s) were taken. A run this short did not use the app — treat it as a harness failure, not as a clean result.`,
        },
        null,
        2,
      ),
    );
    process.exit(ok ? 0 : 3);
  }

  if (cmd === 'stop') {
    try {
      process.kill(Number(fs.readFileSync(path.join(RUNS, 'chrome.pid'), 'utf8')));
    } catch {
      /* already gone */
    }
    console.log('stopped');
    return;
  }

  const session = loadSession();
  const cost = COST[cmd];
  if (cost === undefined) {
    console.error(
      `Unknown command '${cmd}'. One of: ${Object.keys(COST).join(', ')}, start, stop, verify`,
    );
    process.exit(2);
  }
  if (session.spent + cost > session.budget) {
    console.log(
      JSON.stringify({
        patienceLeft: 0,
        gaveUp: true,
        note: 'You are out of patience. Stop here and say what you were in the middle of trying to do, and what you would have done next in real life — put the phone down, ask someone, or look somewhere else.',
      }),
    );
    return;
  }

  const { browser, page } = await connect();
  session.spent += cost;
  session.steps += 1;

  try {
    if (cmd === 'tap') {
      const label = rest.join(' ');
      const hit = await page.evaluate((want) => {
        const all = [...document.querySelectorAll('[role="button"],[role="tab"]')].filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        const norm = (s) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
        const target =
          all.find((e) => norm(e.innerText) === norm(want)) ??
          all.find((e) => norm(e.innerText).startsWith(norm(want))) ??
          all.find((e) => norm(e.innerText).includes(norm(want)));
        if (!target) return null;
        target.scrollIntoView({ block: 'center' });
        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return (target.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      }, label);
      await sleep(1500);
      logStep(session, `tap "${label}" -> ${hit ?? 'NOTHING THERE'}`);
      if (!hit) {
        console.log(
          JSON.stringify({
            patienceLeft: session.budget - session.spent,
            tapped: null,
            note: `Nothing on this screen says "${label}". That counts as a tap — you looked for it and it was not there.`,
            ...(await glance(page)),
          }, null, 2),
        );
        saveSession(session);
        await browser.close();
        return;
      }
    }

    if (cmd === 'scroll') {
      const by = Number(rest[0] ?? 500);
      await page.evaluate((d) => {
        const el = [...document.querySelectorAll('*')]
          .filter((e) => e.scrollHeight > e.clientHeight + 40)
          .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
        if (el) el.scrollTop += d;
        else window.scrollBy(0, d);
      }, by);
      await sleep(600);
      logStep(session, `scroll ${by}`);
    }

    if (cmd === 'back') {
      await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
      await sleep(1200);
      logStep(session, 'back');
    }

    if (cmd === 'read') {
      const want = rest.join(' ');
      const full = await page.evaluate((w) => {
        const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');
        const els = [...document.querySelectorAll('*')].filter(
          (e) => e.children.length === 0 && norm(e.innerText),
        );
        const hit =
          els.find((e) => norm(e.innerText).toLowerCase().startsWith(w.toLowerCase())) ??
          els.find((e) => norm(e.innerText).toLowerCase().includes(w.toLowerCase()));
        return hit ? norm(hit.innerText) : null;
      }, want);
      logStep(session, `read "${want}" (${full ? full.length : 0} chars)`);
      console.log(
        JSON.stringify(
          {
            patienceLeft: session.budget - session.spent,
            read: full ?? `Nothing starting "${want}" on this screen.`,
            note: 'That cost four actions. Was it worth it?',
          },
          null,
          2,
        ),
      );
      saveSession(session);
      await browser.close();
      return;
    }

    const shot = path.join(RUNS, `${session.run}-${String(session.steps).padStart(2, '0')}.png`);
    await page.screenshot({ path: shot });
    const g = await glance(page);
    console.log(
      JSON.stringify(
        { patienceLeft: session.budget - session.spent, screenshot: shot, ...g },
        null,
        2,
      ),
    );
  } finally {
    saveSession(session);
    await browser.close();
  }
}

main().catch((e) => {
  console.error('DRIVER ERROR', e.message);
  process.exit(1);
});
