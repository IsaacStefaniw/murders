/**
 * How far down a screen its own answer sits.
 *
 * ── Why this exists ─────────────────────────────────────────────────────
 *
 * One of the fifteen review findings was navigation cost: across three
 * measured sessions, five to seven of about thirty actions went on getting
 * somewhere rather than learning anything. That is the kind of finding
 * that produces a redesign nobody asked for, because "cut navigation" has
 * no target in it.
 *
 * So it gets a number instead. Each of the four tabs exists to answer one
 * question (`docs/PERSONA.md` §6: "if this is the only thing they see
 * today, was today better?"). This opens the tab on a lived seed and
 * counts the thumb-flicks before the sentence that answers it is on
 * screen. Zero is the target. One is fine. Four is a finding with a
 * number attached.
 *
 * Run it against a served web export:
 *
 *     npx expo export --platform web
 *     npx serve -s dist -l 8099
 *     npm run usertest:seed
 *     node tools/usertest/depth.mjs
 *
 * ── What it deliberately does not measure ───────────────────────────────
 *
 * TAPS. The obvious companion measurement — taps from app open to each
 * answer — was written first and thrown away: matching a tab by its label
 * hits "this week" or a heading before it reaches the tab bar, so the run
 * silently stays on the same screen and reports a journey it never took.
 * A measurement that fails by looking like a success is worse than no
 * measurement, which is the same lesson as `drive.js verify`. Counting
 * taps needs testIDs on the tab bar; until then this measures scrolling
 * only and says so.
 */

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.USERTEST_BASE ?? 'http://localhost:8099';
const PERSONA = process.env.USERTEST_PERSONA ?? 'career_optimiser';
const CHROME =
  process.env.USERTEST_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/** Where the store persists. Wrong key means an empty app and a useless run. */
const STORE_KEY = 'intent-os-store';

/** One comfortable thumb-flick on a phone. */
const STEP = 600;
const MAX_SCROLLS = 20;

/**
 * The question each screen exists to answer, and the text that answers it.
 *
 * Several needles per screen where the answer has more than one shape — on
 * Progress the comparison reads "is down:" or "look much like" depending
 * on the week, and a run that only knew one of them would report a screen
 * as failing when it was answering.
 *
 * Needles match the DOM, not the render: a label uppercased by
 * `textTransform` is still mixed case in the text node, which cost one run
 * before it was noticed.
 */
const SCREENS = [
  {
    route: '/today',
    question: 'What do I do next?',
    needles: ['Nothing needs you right now', 'needs you', 'Day complete'],
  },
  {
    route: '/plan',
    question: 'Is today a gym day, and when?',
    needles: ['Strength workout'],
  },
  {
    route: '/life',
    question: 'What are my coaches doing?',
    needles: ['Next:', 'are running', 'is running'],
  },
  {
    route: '/data',
    question: 'Am I better than six weeks ago?',
    needles: ['is down:', 'is up:', 'look much like', 'of history so far'],
  },
];

const seed = readFileSync(join(HERE, 'seeds', `${PERSONA}.json`), 'utf8');

const browser = await chromium.launch({
  executablePath: CHROME,
  // The container runs as root, where Chromium's sandbox refuses to start.
  args: ['--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(([key, blob]) => localStorage.setItem(key, blob), [STORE_KEY, seed]);

/** True when any of the needles is rendered inside the viewport. */
const onScreen = (needles) =>
  page.evaluate((list) => {
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) {
      const text = (walk.currentNode.textContent || '').trim();
      if (!list.some((n) => text.includes(n))) continue;
      const el = walk.currentNode.parentElement;
      if (!el) continue;
      const box = el.getBoundingClientRect();
      if (box.height === 0) continue;
      if (box.top < window.innerHeight && box.bottom > 0) return text.slice(0, 70);
    }
    return null;
  }, needles);

let worst = 0;
let missing = 0;

for (const { route, question, needles } of SCREENS) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  // The store rehydrates from localStorage asynchronously; measuring before
  // it lands measures the empty state.
  await page.waitForTimeout(3500);
  await page.mouse.move(195, 420);

  let scrolls = 0;
  let found = await onScreen(needles);
  while (!found && scrolls < MAX_SCROLLS) {
    await page.mouse.wheel(0, STEP);
    await page.waitForTimeout(260);
    scrolls += 1;
    found = await onScreen(needles);
  }

  if (found) worst = Math.max(worst, scrolls);
  else missing += 1;

  console.log(`${route.padEnd(8)} ${question}`);
  console.log(
    found
      ? `         ${scrolls} scroll${scrolls === 1 ? '' : 's'} — "${found}"`
      : `         NOT REACHED in ${MAX_SCROLLS} flicks`,
  );
}

await browser.close();

console.log(`\nworst: ${worst} scroll${worst === 1 ? '' : 's'}; unreachable: ${missing}`);
// A screen that cannot answer its own question at all is the failure worth
// a non-zero exit; depth alone is a number to read, not a gate.
process.exit(missing > 0 ? 3 : 0);
