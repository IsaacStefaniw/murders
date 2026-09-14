import fs from 'fs';
import path from 'path';

/**
 * Nothing ships that no screen can reach.
 *
 * ── The defect this test exists to prevent ──────────────────────────────
 *
 * A review of this repo found four modules that were written, argued at
 * length in their own headers, covered by passing tests, and imported by
 * nobody:
 *
 *   dailyAsk.ts             the entire daily-question cadence — what to
 *                           ask, how often, and the argument for asking
 *                           two things rather than three
 *   stress.ts               a decision document whose conclusion the
 *                           standing-decisions list recorded as SHIPPED
 *                           BEHAVIOUR while nothing imported it
 *   lib/calendar/provider.ts  the seam its own header calls "the loop that
 *                           turns IntentNorth from sophisticated prototype
 *                           into product"
 *   lib/context/location.ts   the geofencing contract
 *
 * Every one of them passed its tests the whole time, because a unit test
 * asserts that a function is CORRECT and says nothing about whether
 * anything CALLS it. `asksFor()` returning the right questions in the
 * right order is a true statement about a function no screen invokes.
 *
 * That is the failure mode this file closes. Correctness tests point
 * inward; this one points at the app.
 *
 * ── Why reachability rather than "is it imported" ───────────────────────
 *
 * A module imported only by another unreachable module is no better off,
 * so the test walks the whole import graph transitively from `src/app`,
 * which is the only place a user can actually arrive. A module is fine if
 * ANY path leads to it from ANY screen.
 *
 * ── On the opt-out list ─────────────────────────────────────────────────
 *
 * Deliberately small, and every entry carries a reason. A module being
 * hard to wire up is not one of them: the whole point is that "I will
 * connect it next session" is exactly what produced the four above.
 */

const SRC = path.join(__dirname, '..');

/**
 * Modules that legitimately never reach a screen.
 *
 * The simulation harness runs personas through the engine to produce the
 * audits in docs/; it is developer tooling that happens to live in src,
 * and it has no user-facing surface by design. Platform variants are
 * selected by the bundler's own resolution rather than by an import
 * statement, so the graph cannot see them. Type-only declaration files
 * emit nothing to import.
 */
const EXEMPT = [
  /^features\/sim\//,
  /^hooks\/use-color-scheme\.web\.tsx?$/,
  /\.d\.ts$/,
];

/**
 * The debt this test was written to find, listed so it can only shrink.
 *
 * These four are the reason the file exists. Wiring them up is real work —
 * the calendar seam in particular is a native integration — and holding
 * the whole suite red until it is done would mean either rushing it or
 * deleting this test, and the second is what would actually happen.
 *
 * So the baseline is explicit and it is enforced in BOTH directions. A new
 * stranded module fails the test immediately, which is the point. And
 * fixing one of these without deleting its line here ALSO fails, so the
 * list cannot quietly become a graveyard of things somebody once meant to
 * do. It shrinks or it stays honest; it cannot rot.
 *
 * Each entry, and what it costs while it sits here:
 *
 *   dailyAsk.ts   No question is asked on any cadence. Sleep regularity
 *                 needs a SERIES and cannot be recovered from an average,
 *                 so every night this is not wired is a night of data
 *                 permanently gone.
 *   stress.ts     Standing decision #6 says stress "shapes the plan". It
 *                 does not, and will not until something imports this.
 *   calendar      The planner cannot see a real diary, so every plan it
 *                 makes is a guess about a week it cannot observe.
 *   location      Undecided for 1.0. If it is out, delete it.
 *
 * See docs/BEFORE_LAUNCH.md §1.
 */
const KNOWN_STRANDED = [
  'features/health/dailyAsk.ts',
  'features/health/stress.ts',
  'lib/calendar/provider.ts',
  'lib/context/location.ts',
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      walk(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(SRC);
const rel = (f: string) => path.relative(SRC, f).split(path.sep).join('/');
const source = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));

/** Both import spellings this codebase uses: `@/features/x` and `./x`. */
function resolveSpec(spec: string, from: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (source.has(base + ext)) return base + ext;
  }
  return null;
}

const importers = new Map<string, Set<string>>(files.map((f) => [f, new Set<string>()]));
for (const [file, text] of source) {
  for (const m of text.matchAll(/(?:from|import)\s+'([^']+)'/g)) {
    const target = resolveSpec(m[1], file);
    if (target) importers.get(target)!.add(file);
  }
}

const screens = files.filter((f) => rel(f).startsWith('app/'));

/** Everything any screen can get to, by any chain of imports. */
function reachable(): Set<string> {
  const seen = new Set(screens);
  for (let changed = true; changed; ) {
    changed = false;
    for (const f of files) {
      if (seen.has(f)) continue;
      for (const importer of importers.get(f)!) {
        if (seen.has(importer)) {
          seen.add(f);
          changed = true;
          break;
        }
      }
    }
  }
  return seen;
}

describe('every module reaches a screen', () => {
  it('finds screens to walk from', () => {
    // A guard on the guard: if the walk or the path logic broke, every
    // module would look unreachable and the real test would read as a
    // catastrophe rather than as a bug in this file.
    expect(screens.length).toBeGreaterThan(20);
    expect(files.length).toBeGreaterThan(200);
  });

  it('leaves nothing written but unwired', () => {
    const seen = reachable();
    const stranded = files
      .map(rel)
      .filter((r) => !seen.has(path.join(SRC, r)))
      .filter((r) => !EXEMPT.some((e) => e.test(r)))
      .sort();

    const unexpected = stranded.filter((r) => !KNOWN_STRANDED.includes(r));
    expect({
      unexpected,
      hint:
        'This module cannot be reached from any screen, so nothing it does ' +
        'can happen to a user. Wire it to a screen, delete it, or — if it ' +
        'genuinely has no user-facing surface — add it to EXEMPT with the ' +
        'reason.',
    }).toEqual({ unexpected: [], hint: expect.any(String) });
  });

  it('keeps the known-stranded list honest', () => {
    const seen = reachable();
    const fixed = KNOWN_STRANDED.filter((r) => seen.has(path.join(SRC, r)));
    expect({
      fixed,
      hint:
        'These are reachable now. Delete them from KNOWN_STRANDED — the ' +
        'list is a debt being paid down, and an entry that no longer ' +
        'describes anything is how it would turn back into a graveyard.',
    }).toEqual({ fixed: [], hint: expect.any(String) });
  });
});
