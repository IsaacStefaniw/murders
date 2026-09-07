#!/usr/bin/env node
/**
 * Extract the practice library into the JSON the website's evidence page reads.
 *
 * The library lives in the app, in src/features/knowledge/protocols.ts, and it
 * is the source of truth. Copying its contents into the website by hand would
 * put 177 facts in two places and guarantee they drift, so this reads the app
 * file at build time and writes app/evidence/library.json.
 *
 * Parsing TypeScript with regular expressions is normally a bad idea. It is
 * done here rather than importing the module because the app file imports app
 * types and path aliases the website does not have, and standing up that
 * toolchain to read a data literal costs more than it saves. The parse is
 * line-anchored on the four-space indent of each field, which is what an
 * earlier brace-walking attempt got wrong: apostrophes inside prose opened
 * phantom strings and it under-counted 67 of 177.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/**
 * All six files, not one.
 *
 * protocols.ts declares 177 practices and then spreads in five more files —
 * money, supplements, work, people and habits — so the exported PROTOCOLS
 * array is 204. Reading only protocols.ts understated every library figure on
 * the site by 27 practices, and left 26 safety notes off a health page.
 */
const appDir = path.resolve(here, "../../src/features/knowledge");
const appFiles = [
  "protocols.ts",
  "protocols.money.ts",
  "protocols.supplements.ts",
  "protocols.work.ts",
  "protocols.people.ts",
  "protocols.habits.ts",
].map((name) => path.join(appDir, name));
const out = path.resolve(here, "../app/evidence/library.json");

const GRADE_MEANING = {
  A: { label: "Strong", meaning: "Repeatedly tested in people, with results that agree." },
  B: { label: "Good", meaning: "Solid human studies, with some room left for argument." },
  C: { label: "Mixed", meaning: "Reasonable evidence, smaller studies, or results that conflict." },
  D: { label: "Thin", meaning: "Early or indirect evidence. Worth trying, not worth promising." },
  E: { label: "Practice", meaning: "No trial behind it. Widely used, and openly labelled as experience rather than proof." },
};

/**
 * Module-level string constants, so a field written as an identifier or
 * interpolated into a template literal resolves to the words a reader sees.
 *
 * Two exist: DEPENDENCE_LINE in protocols.habits.ts, which four urge
 * protocols use as their whole safety note, and SUPPLEMENT_SAFETY_LINE,
 * which closes the safety note of all eight supplements. Both say the
 * things that most need saying — "that is a doctor's call", "stopping
 * suddenly after heavy daily drinking can be dangerous" — so resolving
 * them is not a tidiness exercise.
 */
function readConstants(text) {
  const table = new Map();
  for (const m of text.matchAll(/^(?:export )?const ([A-Z][A-Z0-9_]*) =\s*\n?\s*'((?:[^'\\]|\\.)*)';/gm)) {
    table.set(m[1], m[2].replace(/\\'/g, "'").replace(/\\\\/g, "\\"));
  }
  return table;
}

/**
 * Read one field, whatever shape the value is written in.
 *
 * Four shapes appear in the six files, and each one that this function did
 * not handle silently dropped a safety note rather than failing loudly:
 *
 *   1. A single- or double-quoted string on the same line.
 *   2. The same, wrapped to the next line by the formatter. Three protocols
 *      do this — fasting-window, portion-defaults and batch-cook — and two
 *      of them are the ones telling a reader with a history of restriction
 *      to skip the practice entirely.
 *   3. A template literal, used by the eight supplements so they can end on
 *      the shared safety line.
 *   4. A bare identifier, used by the four urge protocols.
 *
 * The safety-count guard below is what forced each of these to be written.
 */
function field(block, name, constants) {
  const single = block.match(new RegExp(`^    ${name}:\\s*\\n?\\s*'((?:[^'\\\\]|\\\\.)*)'`, "m"));
  if (single) return clean(single[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\"));

  const double = block.match(new RegExp(`^    ${name}:\\s*\\n?\\s*"([^"]*)"`, "m"));
  if (double) return clean(double[1]);

  const template = block.match(new RegExp(`^    ${name}:\\s*\\n?\\s*\`([^\`]*)\``, "m"));
  if (template) {
    return clean(template[1].replace(/\$\{([A-Z][A-Z0-9_]*)\}/g, (whole, id) => {
      const value = constants.get(id);
      // An unresolved placeholder would publish "${SUPPLEMENT_SAFETY_LINE}"
      // to a reader as though it were the warning. Better to stop the build.
      if (value === undefined) throw new Error(`${name} interpolates ${id}, which is not a string constant this script can read`);
      return value;
    }));
  }

  const identifier = block.match(new RegExp(`^    ${name}: ([A-Z][A-Z0-9_]*),$`, "m"));
  if (identifier) {
    const value = constants.get(identifier[1]);
    if (value === undefined) throw new Error(`${name} is written as ${identifier[1]}, which is not a string constant this script can read`);
    return clean(value);
  }

  return null;
}

function clean(text) {
  return text.replace(/\s+/g, " ").trim();
}

function list(block, name) {
  const match = block.match(new RegExp(`^    ${name}: \\[([^\\]]*)\\]`, "m"));
  if (!match) return [];
  return [...match[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
}

const sources = await Promise.all(appFiles.map((file) => readFile(file, "utf8")));
const source = sources.join("\n");
const constants = readConstants(source);

// The spread lines are how protocols.ts pulls the other five in. If one is
// ever added or removed there and not here, this catches it rather than
// silently publishing a short library again.
const spreads = [...sources[0].matchAll(/^ {2}\.\.\.([A-Z_]+_PROTOCOLS),$/gm)].map((m) => m[1]);
if (spreads.length !== appFiles.length - 1) {
  throw new Error(
    `protocols.ts spreads ${spreads.length} other files (${spreads.join(", ")}) but this script reads `
    + `${appFiles.length - 1}. Add the missing file, or the site will understate the library again.`,
  );
}

const starts = [...source.matchAll(/^ {4}id: '/gm)].map((m) => m.index);
if (starts.length === 0) throw new Error("no protocols found — the app files' shape changed");

const practices = starts.map((start, i) => {
  const block = source.slice(start, starts[i + 1] ?? source.length);
  const grade = field(block, "evidenceLevel", constants);
  return {
    id: field(block, "id", constants),
    title: field(block, "title", constants),
    grade,
    gradeLabel: GRADE_MEANING[grade]?.label ?? null,
    pillar: field(block, "pillar", constants),
    summary: field(block, "summary", constants),
    why: field(block, "why", constants),
    safety: field(block, "safety", constants),
    attribution: list(block, "attribution"),
    durationMin: Number(block.match(/^ {4}durationMin: (\d+)/m)?.[1] ?? 0) || null,
  };
});

// Every protocol that declares a safety line must carry one into the JSON.
// This is the check that caught three wrapped strings being dropped.
const declaresSafety = [...source.matchAll(/^ {4}safety:/gm)].length;
const carriesSafety = practices.filter((p) => p.safety).length;
if (declaresSafety !== carriesSafety) {
  throw new Error(
    `${declaresSafety} protocols declare a safety note but only ${carriesSafety} parsed. `
    + "A safety note silently missing from the website is not an acceptable failure — fix the parse.",
  );
}

const missing = practices.filter((p) => !p.id || !p.title || !p.grade);
if (missing.length) throw new Error(`${missing.length} practices are missing an id, title or grade`);

const counts = practices.reduce((acc, p) => ({ ...acc, [p.grade]: (acc[p.grade] ?? 0) + 1 }), {});

await mkdir(path.dirname(out), { recursive: true });
await writeFile(
  out,
  `${JSON.stringify({ generated: "by scripts/build-evidence.mjs from the app's protocols.ts", total: practices.length, counts, gradeMeaning: GRADE_MEANING, practices }, null, 1)}\n`,
);

console.log(`evidence: ${practices.length} practices — ${Object.entries(counts).sort().map(([g, n]) => `${g} ${n}`).join(", ")}`);
console.log(`  with a safety note: ${practices.filter((p) => p.safety).length}`);
console.log(`  written to ${path.relative(process.cwd(), out)}`);
