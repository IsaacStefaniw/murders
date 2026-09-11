import fs from 'fs';
import path from 'path';

/**
 * The App Store listing is read by more strangers than the website, and
 * nothing checked it.
 *
 * web/tests/ checks the rendered site. jargon.test.ts checks the screens.
 * publishedCounts.test.ts names docs/APP_STORE.md in a comment but only ever
 * asserts against protocols.ts — it never opens the file. So the listing was
 * the one surface with no guard at all, and it carried "a training block built
 * from your own lifts" as its promotional line: the single most-read sentence
 * in the listing, in a word the website is forbidden to use.
 *
 * The listing gets the strictest tier. A website visitor arrived on purpose.
 * An App Store browser did not, and leaves faster.
 *
 * Editing this file does not change the live listing. A failure here means
 * App Store Connect needs the same edit.
 */
const root = path.join(__dirname, '..', '..', '..', '..');
const DOC = fs.readFileSync(path.join(root, 'docs', 'APP_STORE.md'), 'utf8');
const VOCAB = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'vocabulary.json'), 'utf8')) as {
  banned: { term: string; web: string; app: string; why: string }[];
};

/** The body of a `## <heading>` section, up to the next `##`. */
function section(heading: RegExp): string {
  const lines = DOC.split('\n');
  const start = lines.findIndex((l) => /^## /.test(l) && heading.test(l));
  if (start === -1) throw new Error(`no section matching ${heading}`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^## /.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

/** Store copy is written as a blockquote; the prose around it is our own notes. */
const quoted = (body: string) =>
  body
    .split('\n')
    .filter((l) => l.startsWith('>'))
    .map((l) => l.replace(/^>\s?/, ''))
    .join('\n')
    .trim();

const FIELDS = [
  { name: 'Promotional text', text: quoted(section(/Promotional text/)), limit: 170 },
  { name: 'Description', text: quoted(section(/^## Description/)), limit: 4000 },
  { name: "What's New", text: quoted(section(/What's New/)), limit: 4000 },
];

const rx = (term: string) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');

describe('the App Store listing reads like the website, not like us', () => {
  it.each(FIELDS)('$name is present and non-trivial', ({ text }) => {
    expect(text.length).toBeGreaterThan(40);
  });

  it.each(FIELDS)('$name uses no word a stranger would look up', ({ text }) => {
    const found = VOCAB.banned
      .filter(({ web }) => web !== 'allowed')
      .filter(({ term }) => rx(term).test(text))
      .map(({ term, why }) => `"${term}" — ${why}`);
    expect(found).toEqual([]);
  });

  it.each(FIELDS)('$name fits the field Apple gives it', ({ text, limit }) => {
    expect(text.length).toBeLessThanOrEqual(limit);
  });

  /**
   * The same boundary claims.test.ts enforces on the paywall. The build runs
   * no inference; getAiProvider() returns null without a configured backend.
   */
  it('sells no AI the build does not run', () => {
    const all = FIELDS.map((f) => f.text).join('\n').toLowerCase();
    for (const claim of ['ai-powered', 'ai coach', 'our ai', 'powered by ai']) {
      expect(all).not.toContain(claim);
    }
  });

  it('keywords fit Apple\'s 100-character field', () => {
    const body = section(/Keywords/);
    const field = body.match(/`([^`]+)`/)?.[1];
    expect(field).toBeDefined();
    expect(field!.length).toBeLessThanOrEqual(100);
    expect(field).not.toMatch(/,\s/); // no spaces after commas: they cost characters
  });
});
