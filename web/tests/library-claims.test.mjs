import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * The numbers on the page must equal the numbers in the app.
 *
 * A marketing figure that drifts from the code is not a typo — under s18 of
 * the Australian Consumer Law it is misleading conduct, and s18 has no intent
 * requirement. So this test does not check that the page says a number; it
 * counts the library itself and checks the page agrees. When the library
 * grows, this test fails, and the copy gets updated in the same commit as the
 * data.
 *
 * It counts every file spread into PROTOCOLS, not just protocols.ts. Counting
 * only protocols.ts is how the page came to publish 177 while the library held
 * 204 — the count agreed with the page and with nothing else, which is the
 * precise failure a consumer-law guard is supposed to catch. The spread list
 * is read off the array so a new satellite file cannot slip past.
 *
 * The count is line-anchored rather than brace-anchored on purpose. A brace
 * walker trips over apostrophes inside prose comments ("IntentNorth's"), which
 * open a phantom string and swallow real braces — that mistake under-counted
 * the library by more than half while looking entirely plausible.
 */
async function libraryFiles() {
  const dir = new URL("../../src/features/knowledge/", import.meta.url);
  const root = await readFile(new URL("protocols.ts", dir), "utf8");
  const body = root.slice(root.indexOf("export const PROTOCOLS: Protocol[] = ["));
  const spreads = [...body.matchAll(/^ {2}\.\.\.([A-Z_]+),$/gm)].map((m) => m[1]);
  assert.ok(spreads.length > 0, "PROTOCOLS spreads nothing — did the array's shape change?");
  const rest = await Promise.all(
    spreads.map(async (name) => {
      const imp = root.match(new RegExp(`import \\{ ${name} \\} from '(?:@/features/knowledge|\\.)/(protocols\\.[a-z]+)'`));
      assert.ok(imp, `${name} is spread into PROTOCOLS but its import could not be found`);
      return readFile(new URL(`${imp[1]}.ts`, dir), "utf8");
    }),
  );
  return [root, ...rest];
}

async function countLibrary() {
  const protocols = [];
  for (const text of await libraryFiles()) {
    const lines = text.split("\n");
    const start = lines.findIndex((l) => /^export const [A-Z_]+: Protocol\[\] = \[$/.test(l));
    assert.ok(start > -1, "each library file should declare one Protocol[] array");
    const end = lines.indexOf("];", start + 1);
    // Without this, a reformat that changes the array terminator makes the
    // slice run to end-of-file and the failure reads "update the page copy",
    // which would send the next person to fix entirely the wrong thing.
    assert.ok(end > start, "the array should have a findable terminator");

    let current = null;
    for (const line of lines.slice(start + 1, end)) {
      if (line === "  {") protocols.push((current = []));
      else if (current) current.push(line);
    }
  }

  const grades = {};
  let safety = 0;
  const people = new Set();
  for (const protocol of protocols) {
    const body = protocol.join("\n");
    const grade = /^ {2,8}evidenceLevel: '([A-E])'/m.exec(body);
    if (grade) grades[grade[1]] = (grades[grade[1]] ?? 0) + 1;
    if (/^ {2,8}safety:/m.test(body)) safety += 1;
    const attribution = /^ {2,8}attribution: \[(.*?)\],/ms.exec(body);
    if (attribution) for (const [, n] of attribution[1].matchAll(/'([^']+)'/g)) people.add(n);
  }
  return { total: protocols.length, grades, safety, people: people.size };
}

async function renderHome() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-library`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("https://intentnorth.app/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  return response.text();
}

test("the library figures on the page match the library in the app", async () => {
  const { total, grades, safety, people } = await countLibrary();
  const html = await renderHome();

  const strong = grades.A + grades.B;
  const weaker = total - strong;

  assert.equal(total, 321, "protocol count changed — update the page copy too");
  assert.equal(strong, 116, "A/B count changed — update the page copy too");
  assert.equal(safety, 282, "safety-line count changed — update the page copy too");
  assert.equal(people, 255, "attribution count changed — update the page copy too");

  // The page leads with the weaker count rather than the A/B one now — "205 of
  // the 321 are Mixed or weaker" says more than "116 graded A or B", because a
  // reader can tell what the first one costs us to admit. The data check above
  // still pins all four figures; this checks what the page actually states.
  for (const figure of [String(total), String(weaker), String(safety), String(people)]) {
    assert.ok(html.includes(figure), `the page should state ${figure}`);
  }
  // The grade breakdown is spelled out in words; those must agree too.
  assert.match(html, new RegExp(`${grades.A === 15 ? "Fifteen" : grades.A} practices are grade A`, "i"));
  assert.ok(
    html.includes(`two hundred and five`) && weaker === 205,
    "the weaker-evidence count in the copy must match the data",
  );
});

test("the page never implies the whole library is strongly evidenced", async () => {
  const html = await renderHome();
  // The failure mode this guards is "321 evidence-based practices" as a bare
  // boast. 205 of them are C or below, and the page has to carry that.
  assert.doesNotMatch(html, /\d+ (strongly|well|rigorously) evidenced/i);
  assert.match(html, /C, D or E/, "the weaker grades must be named on the page");
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
  const html = await renderHome();
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
  const html = await renderHome();

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
