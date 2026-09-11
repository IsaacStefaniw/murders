import fs from 'fs';
import path from 'path';

/**
 * The words a thousand reviewers did not understand, kept out of the screens.
 *
 * Round one of the persona review (docs/archive/OVERHAUL_REPORT.md) flagged
 * these more than any others. Each has a plain replacement in the copy now;
 * this test is what stops the old term drifting back in through a new screen.
 *
 * Rewritten 11 September 2026, for four faults found auditing it:
 *
 * 1. It shared exactly one term with the website's list. "deload", "rung",
 *    "accessories" and "training block" were banned on the site as unreadable
 *    by a first-time reader, and shipping here, to a person who reads them
 *    every morning. Both surfaces now read shared/vocabulary.json, which
 *    carries a tier per surface so a divergence has to be written down.
 * 2. Four rules matched exact source formatting — `title: 'Zone 2 cardio'`
 *    matched that literal, that quote style, that spacing. Prettier could
 *    defeat them. Tiers replace them: a "prominent" term is banned in a
 *    title, a label or a button and allowed in body text.
 * 3. The header said only string literals and JSX text were checked. It
 *    actually regexed the whole source, identifiers included, which is why
 *    a rule for "rung" would have tripped on `NextRungCard`. Now it really
 *    does extract strings and JSX text.
 * 4. An `open` field turned any rule into `it.skip` — a guardrail that
 *    reports green while the jargon ships. No entry used it. It is gone.
 */
const root = path.join(__dirname, '..', '..', '..', '..');
const VOCAB = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'vocabulary.json'), 'utf8')) as {
  banned: { term: string; web: string; app: string; why: string }[];
};

/**
 * Rules that are about this build rather than about vocabulary, so they do
 * not belong in the list the website shares.
 */
const APP_ONLY: { phrase: RegExp; why: string }[] = [
  { phrase: /All 177 practices/, why: 'say what the grading is, not the count — and the count is stale' },
  { phrase: /in every pillar are open/, why: 'say "area"' },
  { phrase: /Retune — retake/, why: 'say "Change my answers"' },
  { phrase: /['"“]The ladder\b/, why: 'say "levels you earn" or "your steps"' },
];

const ROOTS = ['src/app', 'src/features', 'src/components'];
const SKIP = /__tests__|\.test\.|[/\\]sim[/\\]/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (SKIP.test(p)) continue;
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

/** Strip comments so a historical note about the old wording does not fail the build. */
const withoutComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/**
 * Blank out `${...}` inside template literals. The interpolation is code, not
 * copy: `${prescribedSets}` renders a number, and reading the identifier as
 * user-facing text reports a violation that nobody can see on a screen.
 */
const withoutInterpolations = (src: string) => src.replace(/\$\{[^{}]*\}/g, '${}');

/**
 * What a person actually reads: string literals and the text between JSX tags.
 * Identifiers, imports and keys are not copy — `NextRungCard` is a component.
 */
function visibleCopy(src: string): string {
  const code = withoutInterpolations(withoutComments(src));
  const strings = code.match(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g) ?? [];
  const jsxText = (code.match(/>[^<>{}]{3,}</g) ?? []).map((s) => s.slice(1, -1));
  return [...strings, ...jsxText].join('\n');
}

/** Copy in a title, label, heading or button — where a "prominent" term is banned. */
function prominentCopy(src: string): string {
  const code = withoutInterpolations(withoutComments(src));
  const keyed =
    code.match(
      /\b(title|label|heading|subtitle|header|cta|button|buttonLabel|name)\s*:\s*(['"`])(?:\\.|(?!\2)[^\\])*\2/gi,
    ) ?? [];
  const headings = (code.match(/<(H1|H2|H3|Title|Heading)[^>]*>([^<]{3,})</gi) ?? []);
  return [...keyed, ...headings].join('\n');
}

const rx = (term: string) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');

describe('the words reviewers could not follow stay out of the screens', () => {
  const files = ROOTS.flatMap((r) => walk(path.join(root, r)));
  const copy = new Map(files.map((f) => [f, visibleCopy(fs.readFileSync(f, 'utf8'))]));
  const prominent = new Map(files.map((f) => [f, prominentCopy(fs.readFileSync(f, 'utf8'))]));

  it('scans a real set of screens', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  const checked = VOCAB.banned.filter((b) => b.app !== 'allowed');

  it('reads the shared vocabulary', () => {
    expect(checked.length).toBeGreaterThan(15);
  });

  for (const { term, app, why } of checked) {
    const where = app === 'prominent' ? 'in a title, label or button' : 'anywhere';
    it(`never shows "${term}" ${where} — ${why}`, () => {
      const source = app === 'prominent' ? prominent : copy;
      const hits = files.filter((f) => rx(term).test(source.get(f)!));
      expect(hits.map((f) => path.relative(root, f))).toEqual([]);
    });
  }

  for (const { phrase, why } of APP_ONLY) {
    it(`never shows ${phrase} — ${why}`, () => {
      const hits = files.filter((f) => phrase.test(copy.get(f)!));
      expect(hits.map((f) => path.relative(root, f))).toEqual([]);
    });
  }
});
