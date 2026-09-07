import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * The evidence page publishes the whole library, so it is the page most able
 * to disagree with the app. Its data is generated from the app's own file by
 * scripts/build-evidence.mjs, which runs before every build — this checks the
 * generated output still matches the source it was generated from, and that
 * the safety notes all made it across.
 *
 * The safety check exists because the first version of the parser dropped
 * three of them: fasting-window, portion-defaults and batch-cook wrap their
 * safety string onto the next line, and two of those are the notes telling a
 * reader with a history of restriction to skip the practice entirely. A
 * silently missing safety note is the worst thing this page could do.
 *
 * It reads all six practice files, not just protocols.ts. protocols.ts holds
 * 177 of the 204 and spreads the other five in, so a check anchored on that
 * one file agreed with a generator that had the same blind spot — which is
 * exactly how 27 practices and 26 safety notes stayed off the site.
 */
const LIBRARY_FILES = [
  "protocols.ts",
  "protocols.money.ts",
  "protocols.supplements.ts",
  "protocols.work.ts",
  "protocols.people.ts",
  "protocols.habits.ts",
];

test("the published library matches the app's practice file", async () => {
  const json = JSON.parse(
    await readFile(new URL("../app/evidence/library.json", import.meta.url), "utf8"),
  );
  const sources = await Promise.all(LIBRARY_FILES.map((name) =>
    readFile(new URL(`../../src/features/knowledge/${name}`, import.meta.url), "utf8")));
  const source = sources.join("\n");

  // If protocols.ts ever spreads a seventh file, this fails here rather than
  // publishing a short library that every other check agrees with.
  const spreads = [...sources[0].matchAll(/^ {2}\.\.\.[A-Z_]+_PROTOCOLS,$/gm)].length;
  assert.equal(spreads, LIBRARY_FILES.length - 1, "protocols.ts spreads a file this test does not read");

  const declared = [...source.matchAll(/^ {4}id: '/gm)].length;
  assert.equal(json.total, declared, "the published count disagrees with the app");
  assert.equal(json.practices.length, declared);

  const grades = {};
  for (const [, g] of source.matchAll(/^ {4}evidenceLevel: '([A-E])'/gm)) {
    grades[g] = (grades[g] ?? 0) + 1;
  }
  assert.deepEqual(json.counts, grades, "the published grade counts disagree with the app");

  const declaresSafety = [...source.matchAll(/^ {4}safety:/gm)].length;
  const carries = json.practices.filter((p) => p.safety).length;
  assert.equal(
    carries,
    declaresSafety,
    `${declaresSafety} practices declare a safety note but ${carries} were published`,
  );

  // Every practice needs the three things the page promises to show.
  for (const practice of json.practices) {
    assert.ok(practice.title, `a practice has no title: ${practice.id}`);
    assert.match(practice.grade, /^[A-E]$/, `bad grade on ${practice.id}`);
    assert.ok(practice.gradeLabel, `no plain-word label on ${practice.id}`);
  }

  // The claim the page leads with, computed rather than typed.
  const weaker = json.counts.C + json.counts.D + json.counts.E;
  assert.equal(weaker, 122, "the 'mixed or weaker' figure changed — the page copy says 122");
});
