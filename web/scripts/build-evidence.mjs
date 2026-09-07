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
const appFile = path.resolve(here, "../../src/features/knowledge/protocols.ts");
const out = path.resolve(here, "../app/evidence/library.json");

const GRADE_MEANING = {
  A: { label: "Strong", meaning: "Repeatedly tested in people, with results that agree." },
  B: { label: "Good", meaning: "Solid human studies, with some room left for argument." },
  C: { label: "Mixed", meaning: "Reasonable evidence, smaller studies, or results that conflict." },
  D: { label: "Thin", meaning: "Early or indirect evidence. Worth trying, not worth promising." },
  E: { label: "Practice", meaning: "No trial behind it. Widely used, and openly labelled as experience rather than proof." },
};

/**
 * Read one field, whether the value sits on the same line or wraps to the next.
 *
 * Three protocols wrap — fasting-window, portion-defaults and batch-cook —
 * because the formatter breaks long strings. A same-line-only regex silently
 * dropped exactly those three safety notes, and two of them are the ones
 * warning a reader with a history of restriction to skip the practice
 * entirely. Losing those quietly is the worst failure this script could have.
 */
function field(block, name) {
  const single = block.match(new RegExp(`^    ${name}:\\s*\\n?\\s*'((?:[^'\\\\]|\\\\.)*)'`, "m"));
  if (single) return single[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\").replace(/\s+/g, " ").trim();
  const double = block.match(new RegExp(`^    ${name}:\\s*\\n?\\s*"([^"]*)"`, "m"));
  return double ? double[1].replace(/\s+/g, " ").trim() : null;
}

function list(block, name) {
  const match = block.match(new RegExp(`^    ${name}: \\[([^\\]]*)\\]`, "m"));
  if (!match) return [];
  return [...match[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
}

const source = await readFile(appFile, "utf8");
const starts = [...source.matchAll(/^ {4}id: '/gm)].map((m) => m.index);
if (starts.length === 0) throw new Error("no protocols found — the app file's shape changed");

const practices = starts.map((start, i) => {
  const block = source.slice(start, starts[i + 1] ?? source.length);
  const grade = field(block, "evidenceLevel");
  return {
    id: field(block, "id"),
    title: field(block, "title"),
    grade,
    gradeLabel: GRADE_MEANING[grade]?.label ?? null,
    pillar: field(block, "pillar"),
    summary: field(block, "summary"),
    why: field(block, "why"),
    safety: field(block, "safety"),
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
