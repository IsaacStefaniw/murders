import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * The sleep-debt tool on the site is a copy of the app's method, and copies
 * drift. If someone tunes the app's need window or the weighting and nobody
 * touches the website, the site quietly starts publishing a different number
 * from the product it is advertising — and the page's whole claim is that it
 * runs "the method IntentNorth uses".
 *
 * So this pins the constants against src/features/health/sleepDebt.ts. When it
 * fails, the fix is to update the tool, not the test.
 */
const APP = new URL("../../src/features/health/sleepDebt.ts", import.meta.url);
const TOOL = new URL("../app/sleep-debt/SleepDebtTool.tsx", import.meta.url);

test("the web tool uses the app's sleep-debt constants", async () => {
  const app = await readFile(APP, "utf8");
  const tool = await readFile(TOOL, "utf8");

  const constants = [
    ["NEED_MIN_H", 7],
    ["NEED_MAX_H", 9],
    ["NEED_FALLBACK_H", 7.5],
    ["MIN_NIGHTS_FOR_NEED", 7],
  ];

  for (const [name, expected] of constants) {
    const inApp = app.match(new RegExp(`${name} = ([\\d.]+)`));
    assert.ok(inApp, `${name} is gone from the app — the tool is now describing something that does not exist`);
    assert.equal(Number(inApp[1]), expected, `${name} changed in the app; update the website tool to match`);

    const inTool = tool.match(new RegExp(`${name} = ([\\d.]+)`));
    assert.ok(inTool, `${name} is missing from the website tool`);
    assert.equal(Number(inTool[1]), expected, `${name} disagrees with the app`);
  }

  // The two rules the page describes in words must still be the ones in code.
  // Matching the 0.75, not the variable name — the name is incidental and
  // pinning it makes this fail for a rename, which teaches people to delete
  // the test rather than fix the drift.
  assert.match(app, /percentile\([a-zA-Z]+, 0\.75\)/, "the app no longer takes the upper quarter of nights");
  assert.match(tool, /percentile\([a-zA-Z]+, 0\.75\)/, "the tool no longer takes the upper quarter of nights");
  assert.match(app, /i < half \? short \* 0\.5 : short/, "the app no longer halves older nights");
  assert.match(tool, /i < half \? short \* 0\.5 : short/, "the tool no longer halves older nights");

  // DEBT_SHOW_H is what the page calls "under about two hours, not worth a
  // sentence" — the one number the copy states in prose.
  const showApp = app.match(/DEBT_SHOW_H = ([\d.]+)/);
  assert.equal(Number(showApp?.[1]), 2, "the app's reporting floor moved; the page prose says two hours");
});
