import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * The wearable pages, checked against the app's code and against the four
 * claims the research forbids.
 *
 * docs/WEARABLE_POSITIONING.md, researched 7 Sep 2026, lists eleven sentences
 * that are true of the code and eleven that are false, risky or unprovable.
 * The false ones are the tempting ones — "buy the band and cancel the
 * subscription" is the line going round the forums, and it would be the single
 * most effective thing we could say if it were true. It is not: Whoop's own
 * cancellation page says a cancelled membership cannot collect, upload or
 * analyse any data, so nothing reaches Apple Health and the band is inert.
 * Saying it would also put us under App Review guideline 2.3.1, which treats
 * misleading marketing as grounds for removal and account termination.
 *
 * So this test does two things a wording review would not. It pins the numbers
 * on the page to the constants in the app, and it fails the build on the
 * forbidden sentences no matter who writes them or how well.
 */

const PAGES = ["/works-with-what-you-wear", "/"];

async function render(route) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-wear`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request(`https://intentnorth.app${route}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200, `${route} did not render`);
  return (await response.text()).replace(/<!--.*?-->/g, "");
}

async function app(file) {
  return readFile(new URL(`../../src/features/${file}`, import.meta.url), "utf8");
}

test("the seven signals on the page are the seven the app reads", async () => {
  // READ_TYPES is the whole list, and the page promises "seven things from
  // Apple Health and nothing else". If someone adds an eighth read type to the
  // app, that sentence becomes false and this fails rather than the claim
  // quietly going stale.
  const healthkit = await app("health/healthkit.ts");
  const block = healthkit.slice(healthkit.indexOf("const READ_TYPES"), healthkit.indexOf("] as const"));
  const types = [...block.matchAll(/'HK\w+TypeIdentifier(\w+)'/g)].map((m) => m[1]);

  assert.equal(types.length, 7, `the app reads ${types.length} Health types; the page says seven`);
  assert.deepEqual(
    types.sort(),
    ["BodyMass", "HeartRateVariabilitySDNN", "Height", "RestingHeartRate", "SleepAnalysis", "VO2Max", "WaistCircumference"],
    "the set of Health types changed — the page lists them one by one",
  );

  const html = await render("/works-with-what-you-wear");
  assert.match(html, /Seven things from Apple Health/, "the page should state how many it reads");
  assert.match(html, /never write to Health/i, "read-only is the claim that earns the rest");
});

test("the thresholds on the page are the thresholds in the app", async () => {
  const readiness = await app("health/readiness.ts");
  const value = (name) => Number(new RegExp(`const ${name} = (\\d+);`).exec(readiness)?.[1]);

  assert.equal(value("BASELINE_DAYS"), 14, "the baseline window changed — the pages say fourteen days");
  assert.equal(value("SHORT_NIGHT_HOURS"), 6, "the short-night threshold changed — the pages say six hours");
  assert.equal(value("RHR_CAUTION_BPM"), 5, "the caution threshold changed — the page says five beats");
  assert.equal(value("RHR_BACK_OFF_BPM"), 10, "the back-off threshold changed — the page says ten");

  // The baseline is a median on purpose, and the page says so. A mean lets a
  // run of bad days redefine bad as normal, which is when the signal is most
  // needed — the reasoning is in the header comment of readiness.ts.
  assert.match(readiness, /median\(values\)/, "the baseline stopped being a median");

  for (const route of PAGES) {
    const html = await render(route);
    assert.match(html, /fourteen days/, `${route} should name the baseline window`);
    assert.match(html, /six hours/i, `${route} should name the short-night threshold`);
  }
});

test("a short night really does keep the main work and cut the rest", async () => {
  // Both pages say the hard lifts stay and the smaller exercises come out.
  // That is autoRegulate's short-night branch, and it is a claim about
  // behaviour rather than about a number, so it is checked at the source.
  const programme = await app("training/programme.ts");
  assert.match(
    programme,
    /const shortNight = ctx\.sleptHours != null && ctx\.sleptHours < 6;/,
    "autoRegulate no longer branches on a short night",
  );
  assert.match(
    programme,
    /exercises\.filter\(\(e\) => !e\.accessory\)\.concat\(exercises\.filter\(\(e\) => e\.accessory\)\.slice\(0, 1\)\)/,
    "the short-night path no longer keeps the main work and cuts to one accessory",
  );
  assert.match(
    programme,
    /'Short night — main work stays, accessories rest today\.'/,
    "the page quotes this sentence as the app's own; it must still be the app's own",
  );
});

test("the four forbidden wearable claims are absent", async () => {
  // Each of these is in docs/WEARABLE_POSITIONING.md section 6 under "false,
  // risky, or unprovable". They are listed here in the form a well-meaning
  // rewrite would reach for, not as exact strings.
  const forbidden = [
    // The cancel claim has to be caught as advice, not as discussion: the page
    // spends two paragraphs explaining why cancelling breaks the thing we
    // depend on, and a blunt /cancel/ would fail on the refutation. So these
    // match the recommendation forms — the imperative and the permission.
    { pattern: /(buy|get|keep) (it|them|the (band|ring|device|hardware|watch)) and cancel/i, why: "cancelling stops Whoop's data entirely and breaks the Oura sync we depend on" },
    { pattern: /cancel (it|your|the) [\w ]{0,20}(membership|subscription)[\w ]{0,20}and (keep|still|carry on|use)/i, why: "a cancelled Whoop collects nothing, so nothing reaches Apple Health" },
    { pattern: /you can cancel/i, why: "we do not give advice about another company's billing, and it would be wrong here" },
    { pattern: /replaces? your (whoop|oura|garmin)/i, why: "we cannot replace what we do not measure" },
    { pattern: /works with (any|every) (wearable|device)/i, why: "Suunto sends neither sleep nor resting heart rate" },
    { pattern: /(your|the) (oura|whoop) (hrv|heart.rate variability)/i, why: "both compute RMSSD; Apple Health stores SDNN, so neither writes HRV to Health" },
    { pattern: /the only app that/i, why: "Training Today reads Health, computes readiness and prescribes a session" },
    { pattern: /\b(we|intentnorth) measures?\b/i, why: "we read what the device wrote; say 'reads', never 'measures'" },
  ];

  for (const route of PAGES) {
    const html = await render(route);
    for (const { pattern, why } of forbidden) {
      assert.doesNotMatch(html, pattern, `${route}: ${why}`);
    }
  }

  // Absence is half of it. The wearable page is the one place a reader arrives
  // already holding the cancel idea, so it has to say why not, in Whoop's own
  // words rather than ours.
  const wear = await render("/works-with-what-you-wear");
  assert.match(wear, /collect, upload or analyse/i, "the page must refute the cancel advice with Whoop's own wording");
  assert.match(wear, /active membership/i, "and say that Oura's Health sync is listed as needing one");
});

test("the day-one history claim stays off until the backfill ships", async () => {
  // The strongest sentence available to this page is that a ring which has
  // been learning your normal for two years is read on the first morning.
  // It is not true yet: the app reads the most recent Apple Health reading,
  // so a person with two years of history still waits fourteen days for a
  // baseline. docs/WEARABLE_BRIEF.md: do not publish it until the sixty-day
  // backfill ships. This is the guard that stops it going out early.
  const healthkit = await app("health/healthkit.ts");
  const backfilled = /BACKFILL|initialSync|SIXTY_DAYS|60 \* 24/.test(healthkit);

  const html = await render("/works-with-what-you-wear");
  const claimsHistory = /(first morning|from day one|two years of (ring |band )?history)/i.test(html);

  assert.ok(
    !claimsHistory || backfilled,
    "the page claims history is read on the first morning, and healthkit.ts still reads only the latest sample",
  );
});
