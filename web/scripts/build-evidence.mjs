#!/usr/bin/env node
/**
 * Extract the practice library into the JSON the website's evidence page reads.
 *
 * The library lives in the app, under src/features/knowledge/, and it is the
 * source of truth. Copying its contents into the website by hand would put
 * hundreds of facts in two places and guarantee they drift, so this reads the
 * app files at build time and writes app/evidence/library.json.
 *
 * It reads protocols.ts AND every file that protocols.ts spreads into
 * PROTOCOLS, because reading only protocols.ts is exactly the mistake this
 * project has already made once in public: the App Store description, the
 * website and five internal documents all published 177 practices when the
 * library held 204, because 177 is what a count of protocols.ts alone gives
 * you. The spread list is discovered from the array itself rather than
 * hard-coded, so the next satellite file is picked up without anybody
 * remembering to come back here.
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
function field(block, name, constants = {}) {
  const single = block.match(new RegExp(`^ {2,8}${name}:\\s*\\n?\\s*'((?:[^'\\\\]|\\\\.)*)'`, "m"));
  if (single) return single[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\").replace(/\s+/g, " ").trim();
  const double = block.match(new RegExp(`^ {2,8}${name}:\\s*\\n?\\s*"([^"]*)"`, "m"));
  if (double) return double[1].replace(/\s+/g, " ").trim();
  // Template literals, which the connection round uses to end eleven safety
  // notes with one shared paragraph about coercive control. That paragraph is
  // the single most important sentence on those cards, so the interpolation
  // is resolved rather than skipped — and an unknown name throws instead of
  // silently writing "${SOMETHING}" onto the website.
  // A bare reference — `safety: DEPENDENCE_LINE,`. The four urge practices
  // are written this way, and their clinical line had never reached the
  // website at all: the old parser looked only for a quoted string and
  // returned null without complaining.
  const ref = block.match(new RegExp(`^ {2,8}${name}: ([A-Z_]+),`, "m"));
  if (ref) {
    if (!(ref[1] in constants)) throw new Error(`${name} is set to ${ref[1]}, which was not found as a module constant`);
    return constants[ref[1]];
  }
  const tpl = block.match(new RegExp(`^ {2,8}${name}:\\s*\\n?\\s*\`([^\`]*)\``, "m"));
  if (!tpl) return null;
  return tpl[1]
    .replace(/\$\{([A-Z_]+)\}/g, (_, ref) => {
      if (!(ref in constants)) throw new Error(`${name} interpolates ${ref}, which was not found as a module constant`);
      return constants[ref];
    })
    .replace(/\s+/g, " ")
    .trim();
}

/** Module-level string constants the cards interpolate into their prose. */
function moduleConstants(text) {
  const out = {};
  for (const m of text.matchAll(/^(?:export )?const ([A-Z_]+) =\s*\n?\s*'((?:[^'\\]|\\.)*)';/gm)) {
    out[m[1]] = m[2].replace(/\\'/g, "'").replace(/\s+/g, " ").trim();
  }
  return out;
}

function list(block, name) {
  const match = block.match(new RegExp(`^ {2,8}${name}: \\[([^\\]]*)\\]`, "m"));
  if (!match) return [];
  return [...match[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
}

const root = await readFile(appFile, "utf8");

// Which satellite files PROTOCOLS spreads in, read off the array itself.
const arrayBody = root.slice(root.indexOf("export const PROTOCOLS: Protocol[] = ["));
const spreads = [...arrayBody.matchAll(/^ {2}\.\.\.([A-Z_]+),$/gm)].map((m) => m[1]);
if (spreads.length === 0) throw new Error("PROTOCOLS spreads nothing — did the array's shape change?");

const satellites = spreads.map((name) => {
  const imp = root.match(new RegExp(`import \\{ ${name} \\} from '(?:@/features/knowledge|\\.)/(protocols\\.[a-z]+)'`));
  if (!imp) throw new Error(`${name} is spread into PROTOCOLS but its import could not be found`);
  return path.resolve(path.dirname(appFile), `${imp[1]}.ts`);
});

const sources = [root, ...(await Promise.all(satellites.map((f) => readFile(f, "utf8"))))];
const source = sources.join("\n");
const constants = moduleConstants(source);
const starts = [...source.matchAll(/^ {2,8}id: '/gm)].map((m) => m.index);
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
    safety: field(block, "safety", constants),
    attribution: list(block, "attribution"),
    durationMin: Number(block.match(/^ {2,8}durationMin: (\d+)/m)?.[1] ?? 0) || null,
  };
});

// Every protocol that declares a safety line must carry one into the JSON.
// This is the check that caught three wrapped strings being dropped.
const declaresSafety = [...source.matchAll(/^ {2,8}safety:/gm)].length;
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
console.log(`  read from protocols.ts and ${satellites.length} spread files`);
console.log(`  written to ${path.relative(process.cwd(), out)}`);
