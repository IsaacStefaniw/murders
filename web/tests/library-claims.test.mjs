import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * The numbers on the page must equal the numbers in the app.
 *
 * A marketing figure that drifts from the code is not a typo — under s18 of
 * the Australian Consumer Law it is misleading conduct, and s18 has no intent
 * requirement. So this test does not check that the page says "204"; it counts
 * the library itself and checks the page agrees. When the library grows, this
 * test fails, and the copy gets updated in the same commit as the data.
 *
 * It counts all six files, not one. protocols.ts declares 177 practices and
 * then spreads in money, supplements, work, people and habits — so the real
 * library is 204. This test read only protocols.ts and therefore passed while
 * every figure on the site was understated by 27 practices, 26 safety notes
 * and 24 credited people. A guardrail that counts the same wrong way as the
 * copy it is guarding is worse than no guardrail, because it is believed.
 *
 * The count is line-anchored rather than brace-anchored on purpose. A brace
 * walker trips over apostrophes inside prose comments ("IntentNorth's"), which
 * open a phantom string and swallow real braces — that mistake under-counted
 * the library by more than half while looking entirely plausible.
 */
const LIBRARY_FILES = [
  "protocols.ts",
  "protocols.money.ts",
  "protocols.supplements.ts",
  "protocols.work.ts",
  "protocols.people.ts",
  "protocols.habits.ts",
];

function readArray(lines, file) {
  const start = lines.findIndex((l) => /^export const [A-Z_]+: Protocol\[\] = \[$/.test(l));
  assert.ok(start > -1, `${file} should declare a Protocol[] array`);
  const end = lines.indexOf("];", start + 1);
  // Without this, a reformat that changes the array terminator makes the slice
  // run to end-of-file and the failure reads "update the page copy", which
  // would send the next person to fix entirely the wrong thing.
  assert.ok(end > start, `${file}'s array should have a findable terminator`);

  const protocols = [];
  let current = null;
  for (const line of lines.slice(start + 1, end)) {
    if (line === "  {") protocols.push((current = []));
    else if (current) current.push(line);
  }
  return protocols;
}

async function countLibrary() {
  const files = await Promise.all(LIBRARY_FILES.map(async (name) => ({
    name,
    lines: (await readFile(new URL(`../../src/features/knowledge/${name}`, import.meta.url), "utf8")).split("\n"),
  })));

  // The spread lines are how protocols.ts pulls the other five in. If a
  // seventh file is ever added there and not here, this fails rather than
  // quietly under-counting the library the way this test used to.
  const spreads = files[0].lines.filter((l) => /^ {2}\.\.\.[A-Z_]+_PROTOCOLS,$/.test(l));
  assert.equal(
    spreads.length,
    LIBRARY_FILES.length - 1,
    `protocols.ts spreads ${spreads.length} other files but this test reads ${LIBRARY_FILES.length - 1}`,
  );

  const protocols = files.flatMap((file) => readArray(file.lines, file.name));

  const grades = {};
  let safety = 0;
  const people = new Set();
  for (const protocol of protocols) {
    const body = protocol.join("\n");
    const grade = /^ {4}evidenceLevel: '([A-E])'/m.exec(body);
    if (grade) grades[grade[1]] = (grades[grade[1]] ?? 0) + 1;
    if (/^ {4}safety:/m.test(body)) safety += 1;
    const attribution = /^ {4}attribution: \[(.*?)\],/ms.exec(body);
    if (attribution) for (const [, n] of attribution[1].matchAll(/'([^']+)'/g)) people.add(n);
  }
  return { total: protocols.length, grades, safety, people: people.size };
}

async function render(route) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-library`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request(`https://intentnorth.app${route}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  return response.text();
}

/**
 * The figures live on /evidence now, not on the home page.
 *
 * Isaac's call on 8 Sep: the counts do not add value to a stranger, the ideas
 * behind them do. So the home page states the ideas and /evidence carries the
 * arithmetic for anyone who came to check.
 *
 * That change could have gutted this test, because what it used to assert was
 * "the four figures appear on the home page and are right". It asserts
 * something stronger now: the figures are right on the page that carries them,
 * AND no stale figure appears anywhere on the site. The second half is the one
 * that would actually have caught September's failure — 177, 104, 145 and 188
 * were live for weeks and a test demanding their presence was what let them
 * stay.
 */
const STALE = [
  // The understated set, from before the six-file count was fixed.
  ["177", "the practice count from before the five spread files were counted"],
  ["104", "the C-or-weaker count from the same miscount"],
  ["145", "the safety-note count from the same miscount"],
  ["188", "the attribution count from the same miscount"],
  // Off-by-one neighbours, which is how a hand-edited figure usually goes wrong.
  ["203 practices", "one short"],
  ["205 practices", "one over"],
];

test("the library figures on /evidence match the library in the app", async () => {
  const { total, grades, safety, people } = await countLibrary();

  const strong = grades.A + grades.B;
  const weaker = total - strong;

  assert.equal(total, 204, "protocol count changed — update /evidence too");
  assert.equal(strong, 82, "A/B count changed — update /evidence too");
  assert.equal(safety, 171, "safety-line count changed — update /evidence too");
  assert.equal(people, 212, "attribution count changed — update /evidence too");

  // /evidence is generated from library.json, so this checks the render rather
  // than the data — the data is checked by tests/evidence-library.test.mjs.
  const evidence = await render("/evidence");
  for (const figure of [String(total), String(weaker), String(safety)]) {
    assert.ok(evidence.includes(figure), `/evidence should state ${figure}`);
  }
});

test("no stale library figure appears anywhere on the site", async () => {
  // Every page, because a corrected figure that survives on one forgotten
  // page is the same misleading conduct as one that survives everywhere.
  const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const routes = [...sitemap.matchAll(/^\s*\{ url: "https:\/\/intentnorth\.app(\/[a-z0-9-]*)"/gm)].map((m) => m[1]);
  assert.ok(routes.length >= 13, `expected the whole route list, found ${routes.length}`);

  for (const route of routes) {
    const html = await render(route);
    // Strip the JSON-LD and the head: prices and years legitimately contain
    // three-digit runs, and this is a check on prose.
    const body = html.slice(html.indexOf("<body")).replace(/<script[\s\S]*?<\/script>/g, "");
    for (const [figure, why] of STALE) {
      assert.ok(
        !new RegExp(`\\b${figure}\\b`).test(body),
        `${route} still says "${figure}" — ${why}`,
      );
    }
  }
});

test("the page never implies the whole library is strongly evidenced", async () => {
  const html = await render("/");
  // The failure this guards is "204 evidence-based practices" as a bare boast.
  // Most of the library is C or below and the page has to carry that — as an
  // idea now rather than a ratio, since the ratio moved to /evidence.
  assert.doesNotMatch(html, /204 (strongly|well|rigorously) evidenced/i);
  assert.match(
    html,
    /Most practices are not an A/,
    "the home page must still admit that most of the library is not strong evidence",
  );
  assert.match(
    html,
    /allowed to come out low/,
    "and say that the rating can go against us, which is what makes it worth reading",
  );
});

test("the screenshots the page names all exist", async () => {
  // Every screen the page names, wherever it names one — the click-through
  // steps, the three how-it-works steps, and any inline <img>. A typo renders
  // a broken frame on the darkest section of the page and no other test would
  // notice. Matching the field rather than the surrounding brace, because the
  // shape of these lists has now changed twice and the check should not.
  const { readFile, stat } = await import("node:fs/promises");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const listed = [...page.matchAll(/file: "(app-[a-z0-9-]+)"/g)].map(([, f]) => f);

  assert.ok(listed.length >= 6, `expected the screen list, found ${listed.length}`);

  // app-today.jpg is held back a second time, for a different reason than the
  // first. The retake is accurate to HEAD, but the sleep-debt paragraph on it
  // ships over the air only once Apple approves 1.0 — build 16, the one in
  // review, does not have it. Publishing it now would show a reviewer
  // functionality the binary they are testing does not contain, in the exact
  // window where that comparison is being made. Restore it the day the update
  // ships; see docs/APP_SCREENSHOTS.md.
  assert.ok(
    !listed.includes("app-today"),
    "app-today shows the sleep-debt line, which is not in the build under review — restore it once the OTA ships",
  );
  for (const file of listed) {
    const info = await stat(new URL(`../public/images/app/${file}.jpg`, import.meta.url));
    assert.ok(info.size > 10_000, `${file}.jpg is missing or too small to be a screenshot`);
  }

});

test("the 5,376 figure stays off the page", async () => {
  // Four of the five cold reviewers rejected this number and none defended it.
  // "A developer's changelog" (Sam). "You counted a cartesian product; my
  // spreadsheet also generates infinite unique plans, and hashing proves
  // nothing about quality" (Dev). "5,376 is a worse number than 1 — it means
  // nothing was chosen for me" (Priya). "Decoration masquerading as proof"
  // (the plain-language reviewer).
  //
  // The figure is true and the derivation was sound. It answered a question
  // nobody asked, in the voice of the people who built it. This guard keeps it
  // off, rather than keeping it honest.
  const html = await render("/");
  assert.doesNotMatch(html, /5,376/, "the combinatorics boast is back");
  assert.doesNotMatch(html, /hashed/i, "engineering process is not a selling point");
});

test("the price on the page is the price Isaac set", async () => {
  // Prices are the one number a visitor will hold you to, and unlike the
  // library figures there is no code constant to check them against:
  // purchases.ts reads displayPrice from StoreKit at runtime, deliberately,
  // because the App Store localises per storefront. So this test is the
  // record — the three tiers Isaac set on 4 Sep 2026, in the three kinds
  // purchases.ts knows about (annual, monthly, lifetime).
  //
  // If a price changes in App Store Connect, change it here in the same
  // commit. A website quoting a price the store does not charge is the
  // kind of thing s18 exists for.
  const html = await render("/");

  for (const [tier, price] of [["Yearly", "AU$89.99"], ["Monthly", "AU$14.99"], ["Lifetime", "AU$249"]]) {
    assert.ok(html.includes(price), `the ${tier} price ${price} is missing from the page`);
  }

  // The currency must be named. "$89.99" to a US reader is a different claim
  // from AU$89.99, and the page has no way of knowing who is reading it.
  assert.doesNotMatch(
    html,
    /(?<!AU)\$89\.99/,
    "the yearly price must always carry its currency",
  );
  assert.match(html, /Australian dollars/, "the page must state which dollars these are");

  // No checkout on the website. CLAUDE.md forbids a fake one, and Apple
  // handles the real one.
  assert.doesNotMatch(html, /Buy now|Subscribe now|Start free trial|Enter card/i);
});
