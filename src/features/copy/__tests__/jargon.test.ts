import fs from 'fs';
import path from 'path';

/**
 * The words a thousand reviewers did not understand, kept out of the
 * screens for good.
 *
 * Round one of the persona review (docs/OVERHAUL_REPORT.md) flagged these
 * more than any others. Each has a plain replacement in the copy now; this
 * test is what stops the old term drifting back in through a new screen.
 * Comments and identifiers are allowed to keep them — only string literals
 * and JSX text are checked, which is what a person reads.
 */
const BANNED: { phrase: RegExp; why: string }[] = [
  { phrase: /Life Operating Plan/i, why: 'say "your plan"' },
  { phrase: /connect an account/i, why: 'there is no account' },
  { phrase: /['"“]The ladder['"”]/, why: 'say "levels you earn"' },
  { phrase: /title: 'Zone 2 cardio'/, why: 'say "Easy cardio (Zone 2)"' },
  { phrase: /title: 'VO₂ intervals'/, why: 'say "Hard intervals (VO₂ max)"' },
  { phrase: /in every pillar are open/, why: 'say "area"' },
  { phrase: /Retune — retake/, why: 'say "Change my answers"' },
  { phrase: /Build web-preview/, why: 'the build tag is hidden on web' },
];

const ROOTS = ['src/app', 'src/features', 'src/components'];
const SKIP = /__tests__|\.test\.|\/sim\//;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !SKIP.test(p)) out.push(p);
  }
  return out;
}

/** Strip comments so a historical note about the old wording does not fail the build. */
function withoutComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('the words reviewers could not follow stay out of the screens', () => {
  const files = ROOTS.flatMap((r) => walk(path.join(process.cwd(), r)));

  it('scans a real set of screens', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  for (const { phrase, why } of BANNED) {
    it(`never shows ${phrase} — ${why}`, () => {
      const hits = files.filter((f) => phrase.test(withoutComments(fs.readFileSync(f, 'utf8'))));
      expect(hits.map((f) => path.relative(process.cwd(), f))).toEqual([]);
    });
  }
});
