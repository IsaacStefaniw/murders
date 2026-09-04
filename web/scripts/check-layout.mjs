#!/usr/bin/env node
/**
 * Look at the page, instead of reading it.
 *
 * Every other guardrail in this project inspects text. That is the right check
 * for a false claim and no check at all for a broken one: a sentence rendered
 * one word per line down a 48px column passes every assertion we have, because
 * the words are correct and only their geometry is wrong. Two such bugs reached
 * the live site in two days, and both were found by Isaac on his phone rather
 * than by this suite.
 *
 * So this renders the built site in headless Chromium at real widths and
 * asserts things a reader would notice:
 *
 *   1. No text is squeezed into a ribbon (the one-word-per-line failure).
 *   2. The page does not scroll sideways.
 *   3. Elements that must not cover each other do not.
 *
 * It is deliberately not part of `npm test`. CLAUDE.md promises this project
 * builds with Node and npm and nothing else, and a browser download is not
 * nothing. CI installs Chromium and runs it before deploying; locally it runs
 * only if a browser is already there, and says so plainly when it is not.
 */
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveLocalCli, sitesEnv } from "./sites-env.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.LAYOUT_PORT ?? 4317);
const BASE = `http://127.0.0.1:${PORT}`;
const WIDTHS = [360, 393, 430, 620, 768, 1024, 1280, 1440];

// A text block this narrow, carrying this much text, over this many lines is
// not a design decision. The thresholds are loose on purpose: the failure this
// catches produced 19 lines in a 48px column, an order of magnitude clear of
// anything intentional.
const RIBBON = { maxWidth: 150, minChars: 40, minLines: 5 };

const MUST_NOT_COVER = [
  [".hero-trust", ".today-card"],
];

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  const message = "check-layout: playwright-core is not installed, so the page was not rendered.";
  if (process.env.LAYOUT_STRICT) {
    console.error(`${message} LAYOUT_STRICT is set, so this is a failure.`);
    process.exit(69);
  }
  console.error(`${message} Install it to run this check locally; CI runs it on every deploy.`);
  process.exit(0);
}

function browserPath() {
  if (process.env.LAYOUT_CHROMIUM) return process.env.LAYOUT_CHROMIUM;
  return undefined; // Let playwright find its own download.
}

/** The stylesheet the built HTML asks for, so a stale server cannot be measured. */
async function builtStylesheets() {
  const dir = path.join(projectRoot, "dist", "client", "assets");
  try {
    return (await readdir(dir)).filter((f) => f.endsWith(".css"));
  } catch {
    return [];
  }
}

const vinext = resolveLocalCli("vinext");
if (!vinext) {
  console.error("check-layout: vinext is unavailable. Run npm ci first.");
  process.exit(69);
}

const env = sitesEnv();
env.PORT = String(PORT);
const server = spawn(process.execPath, [vinext, "start", "--port", String(PORT)], {
  cwd: projectRoot,
  env,
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => { serverLog += d; });
server.stderr.on("data", (d) => { serverLog += d; });

function stop() {
  if (!server.killed) server.kill("SIGKILL");
}
process.on("exit", stop);

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    if (server.exitCode !== null) {
      console.error(`check-layout: the server exited before serving.\n${serverLog}`);
      process.exit(70);
    }
    try {
      const res = await fetch(BASE, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error(`check-layout: the server never answered on ${BASE}.\n${serverLog}`);
  process.exit(70);
}

await waitForServer();

// The stale-server trap: a dead `vinext start` holding the port means the
// browser is handed the previous build's stylesheet and every measurement below
// describes code that is no longer on disk. Catch it before measuring.
const html = await (await fetch(BASE)).text();
const asked = [...html.matchAll(/\/assets\/([^"']+\.css)/g)].map((m) => m[1]);
const built = await builtStylesheets();
const stale = asked.filter((f) => built.length && !built.includes(f));
if (stale.length) {
  console.error(
    `check-layout: the server is serving ${stale.join(", ")}, which is not in dist/client/assets `
    + `(${built.join(", ")}). Something older is holding port ${PORT}; the measurements would be fiction.`,
  );
  process.exit(70);
}

const browser = await chromium.launch({ executablePath: browserPath() });
const failures = [];

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  // Let the in-view motion components settle on their final stage.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  const found = await page.evaluate((cfg) => {
    const out = { ribbons: [], overflow: null, covered: [] };

    const doc = document.documentElement;
    if (doc.scrollWidth > doc.clientWidth + 1) {
      out.overflow = { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
    }

    for (const el of document.querySelectorAll("body *")) {
      // Only leaf-ish text: an element whose children are inline emphasis, not
      // structure. Measuring a wrapper would report its children's text.
      const ownText = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE || ["B", "I", "EM", "STRONG", "SPAN", "SMALL"].includes(n.nodeName))
        .map((n) => n.textContent)
        .join("")
        .trim();
      if (ownText.length < cfg.minChars) continue;

      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      if (box.width > cfg.maxWidth) continue;

      const lh = parseFloat(getComputedStyle(el).lineHeight) || 16;
      const lines = Math.round(box.height / lh);
      if (lines < cfg.minLines) continue;

      out.ribbons.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className?.toString?.().slice(0, 60) ?? "",
        width: Math.round(box.width),
        lines,
        chars: ownText.length,
        text: ownText.slice(0, 70),
      });
    }

    for (const [aSel, bSel] of cfg.pairs) {
      const a = document.querySelector(aSel);
      const b = document.querySelector(bSel);
      if (!a || !b) continue;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      if (!ra.width || !rb.width) continue;
      const vertical = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      const horizontal = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      if (vertical > 1 && horizontal > 1) {
        out.covered.push({ a: aSel, b: bSel, vertical: Math.round(vertical), horizontal: Math.round(horizontal) });
      }
    }

    return out;
  }, { ...RIBBON, pairs: MUST_NOT_COVER });

  for (const r of found.ribbons) {
    failures.push(`${width}px  text ribbon: <${r.tag} class="${r.cls}"> is ${r.width}px wide holding ${r.chars} characters over ~${r.lines} lines — "${r.text}…"`);
  }
  if (found.overflow) {
    failures.push(`${width}px  the page scrolls sideways: content ${found.overflow.scrollWidth}px in a ${found.overflow.clientWidth}px viewport`);
  }
  for (const c of found.covered) {
    failures.push(`${width}px  ${c.b} covers ${c.a} by ${c.vertical}px vertically and ${c.horizontal}px horizontally`);
  }

  console.log(`  ${String(width).padStart(5)}px  ${found.ribbons.length + (found.overflow ? 1 : 0) + found.covered.length === 0 ? "clean" : "PROBLEMS"}`);
  await page.close();
}

await browser.close();
stop();

if (failures.length) {
  console.error(`\ncheck-layout: ${failures.length} problem(s) a reader would see:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\ncheck-layout: no ribbons, no sideways scroll, nothing covered.");
