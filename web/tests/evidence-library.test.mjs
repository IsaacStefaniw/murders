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
 */
test("the published library matches the app's practice file", async () => {
  const json = JSON.parse(
    await readFile(new URL("../app/evidence/library.json", import.meta.url), "utf8"),
  );
  const source = await readFile(
    new URL("../../src/features/knowledge/protocols.ts", import.meta.url),
    "utf8",
  );

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
  assert.equal(weaker, 104, "the 'mixed or weaker' figure changed — the page copy says 104");
});
