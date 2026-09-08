import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The evidence page publishes the whole library, so it is the page most able
 * to disagree with the app. Its data is generated from the app's own files by
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
 * It counts across protocols.ts AND every file spread into PROTOCOLS. Reading
 * only protocols.ts is what this test used to do, and it is why the page went
 * out claiming to publish "all" of a library while holding 177 of its 204
 * practices: the count agreed with itself and with nothing else. The spread
 * list is read off the array so a new satellite file cannot slip past.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "../../src/features/knowledge");

async function librarySource() {
  const root = await readFile(path.join(appDir, "protocols.ts"), "utf8");
  const body = root.slice(root.indexOf("export const PROTOCOLS: Protocol[] = ["));
  const spreads = [...body.matchAll(/^ {2}\.\.\.([A-Z_]+),$/gm)].map((m) => m[1]);
  assert.ok(spreads.length > 0, "PROTOCOLS spreads nothing — did the array's shape change?");
  const files = spreads.map((name) => {
    const imp = root.match(new RegExp(`import \\{ ${name} \\} from '(?:@/features/knowledge|\\.)/(protocols\\.[a-z]+)'`));
    assert.ok(imp, `${name} is spread into PROTOCOLS but its import could not be found`);
    return path.join(appDir, `${imp[1]}.ts`);
  });
  const rest = await Promise.all(files.map((f) => readFile(f, "utf8")));
  return [root, ...rest].join("\n");
}

test("the published library matches the app's practice files", async () => {
  const json = JSON.parse(
    await readFile(new URL("../app/evidence/library.json", import.meta.url), "utf8"),
  );
  const source = await librarySource();

  const declared = [...source.matchAll(/^ {2,8}id: '/gm)].length;
  assert.equal(json.total, declared, "the published count disagrees with the app");
  assert.equal(json.practices.length, declared);

  const grades = {};
  for (const [, g] of source.matchAll(/^ {2,8}evidenceLevel: '([A-E])'/gm)) {
    grades[g] = (grades[g] ?? 0) + 1;
  }
  assert.deepEqual(json.counts, grades, "the published grade counts disagree with the app");

  const declaresSafety = [...source.matchAll(/^ {2,8}safety:/gm)].length;
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

  // No safety note may reach the page as an unresolved reference: the four
  // urge practices and the eleven connection cards write theirs as a constant
  // or a template literal, and "${VIOLENCE_ROUTE}" on screen would be worse
  // than no line at all.
  for (const practice of json.practices) {
    if (!practice.safety) continue;
    assert.doesNotMatch(practice.safety, /\$\{|^[A-Z_]+$/, `unresolved safety note on ${practice.id}`);
  }

  // The claim the page's own metadata leads with, checked against the data.
  const page = await readFile(new URL("../app/evidence/page.tsx", import.meta.url), "utf8");
  const weaker = json.counts.C + json.counts.D + json.counts.E;
  assert.ok(
    page.includes(`All ${json.total} practices`),
    `page metadata does not say "All ${json.total} practices"`,
  );
  assert.ok(
    page.includes(`${weaker} are rated Mixed or weaker`),
    `page metadata does not say "${weaker} are rated Mixed or weaker"`,
  );
});
