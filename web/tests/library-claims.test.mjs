import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * The numbers on the page must equal the numbers in the app.
 *
 * A marketing figure that drifts from the code is not a typo — under s18 of
 * the Australian Consumer Law it is misleading conduct, and s18 has no intent
 * requirement. So this test does not check that the page says "177"; it counts
 * the library itself and checks the page agrees. When the library grows, this
 * test fails, and the copy gets updated in the same commit as the data.
 *
 * The count is line-anchored rather than brace-anchored on purpose. A brace
 * walker trips over apostrophes inside prose comments ("IntentNorth's"), which
 * open a phantom string and swallow real braces — that mistake under-counted
 * the library by more than half while looking entirely plausible.
 */
async function countLibrary() {
  const url = new URL("../../src/features/knowledge/protocols.ts", import.meta.url);
  const lines = (await readFile(url, "utf8")).split("\n");

  const start = lines.findIndex((l) => l.startsWith("export const PROTOCOLS: Protocol[] = ["));
  assert.ok(start > -1, "the PROTOCOLS array should be findable");
  const end = lines.indexOf("];", start + 1);
  // Without this, a reformat that changes the array terminator makes the slice
  // run to end-of-file and the failure reads "update the page copy", which
  // would send the next person to fix entirely the wrong thing.
  assert.ok(end > start, "the PROTOCOLS array should have a findable terminator");

  const protocols = [];
  let current = null;
  for (const line of lines.slice(start + 1, end)) {
    if (line === "  {") protocols.push((current = []));
    else if (current) current.push(line);
  }

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

  assert.equal(total, 177, "protocol count changed — update the page copy too");
  assert.equal(strong, 73, "A/B count changed — update the page copy too");
  assert.equal(safety, 145, "safety-line count changed — update the page copy too");
  assert.equal(people, 188, "attribution count changed — update the page copy too");

  for (const figure of [String(total), String(strong), String(safety), String(people)]) {
    assert.ok(html.includes(figure), `the page should state ${figure}`);
  }
  // The grade breakdown is spelled out in words; those must agree too.
  assert.match(html, new RegExp(`${grades.A === 13 ? "Thirteen" : grades.A} practices are grade A`, "i"));
  assert.ok(
    html.includes(`hundred and four`) && weaker === 104,
    "the weaker-evidence count in the copy must match the data",
  );
});

test("the page never implies the whole library is strongly evidenced", async () => {
  const html = await renderHome();
  // The failure mode this guards is "177 evidence-based practices" as a bare
  // boast. 104 of them are C or below, and the page has to carry that.
  assert.doesNotMatch(html, /177 (strongly|well|rigorously) evidenced/i);
  assert.match(html, /C, D or E/, "the weaker grades must be named on the page");
});

test("the screenshots the page names all exist", async () => {
  // The strip is eight <Image> tags built from a list of filenames. A typo
  // renders eight broken frames on the darkest section of the page, and no
  // existing test would have noticed.
  const { readFile, stat } = await import("node:fs/promises");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const listed = [...page.matchAll(/\{ file: "(app-[a-z-]+)"/g)].map(([, f]) => f);

  assert.ok(listed.length >= 6, `expected the screen list, found ${listed.length}`);
  for (const file of listed) {
    const info = await stat(new URL(`../public/images/app/${file}.jpg`, import.meta.url));
    assert.ok(info.size > 10_000, `${file}.jpg is missing or too small to be a screenshot`);
  }

});

test("the 5,376 figure ships with the derivation that lets a reader check it", async () => {
  // A bare five-figure number is a boast. With its six factors printed beside
  // it, a sceptic can multiply: 4 x 4 x 4 x 3 x 4 x 7 = 5,376.
  const html = await renderHome();
  assert.match(html, /5,376/);
  assert.equal(4 * 4 * 4 * 3 * 4 * 7, 5376, "the stated factors must multiply to the claim");
  for (const factor of [/four goals/i, /four levels/i, /four day-counts/i, /three equipment/i, /four focus lifts/i, /seven constraint states/i]) {
    assert.match(html, factor, `the derivation is missing a factor: ${factor}`);
  }
});
