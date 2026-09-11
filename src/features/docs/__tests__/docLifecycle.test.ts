import fs from 'fs';
import path from 'path';

/**
 * One live document per question.
 *
 * docs/ accumulated three competitive reviews, two monetisation models with
 * opposite conclusions, and nine review records describing issues that were
 * already closed. MONETIZATION.md sold a free trial week and an AI coach for
 * four days after MONETISATION.md revision 3 reversed the first and
 * claims.test.ts forbade the second — both files sitting in the same
 * directory, looking equally authoritative.
 *
 * The rule is docs/DOC_LIFECYCLE.md. This is what stops it decaying back.
 */
const root = path.join(__dirname, '..', '..', '..', '..');
const archiveDir = path.join(root, 'docs', 'archive');
const MARKER = '**ARCHIVED — a record, not guidance.**';

const archived = fs
  .readdirSync(archiveDir)
  .filter((f) => f.endsWith('.md'))
  .sort();

describe('archived documents cannot be mistaken for live ones', () => {
  it('the archive is not empty', () => {
    expect(archived.length).toBeGreaterThan(0);
  });

  /** Everything before the document's own first heading. Reasons vary in length. */
  const preamble = (file: string) =>
    fs.readFileSync(path.join(archiveDir, file), 'utf8').split(/^# /m)[0];

  it.each(archived)('%s carries the archived header', (file) => {
    const head = preamble(file);
    expect(head).toContain(MARKER);
    expect(head).toMatch(/Superseded by `[^`]+`/);
    expect(head).toContain('Do not act on this document');
  });

  it.each(archived)('%s is listed in the DOC_LIFECYCLE ledger', (file) => {
    const ledger = fs.readFileSync(path.join(root, 'docs', 'DOC_LIFECYCLE.md'), 'utf8');
    expect(ledger).toContain(`\`${file}\``);
  });
});

/**
 * A reference to `docs/X.md` for an archived X is a stale path: it resolves to
 * nothing, and a reader who fixes it by guessing lands on the archived copy
 * without the header that says not to act on it.
 */
describe('no source or live document points at a moved file', () => {
  const SKIP = /node_modules|\.git|package-lock|docs[/\\]archive/;
  const EXT = /\.(ts|tsx|mjs|js|md|py)$/;

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (SKIP.test(p)) continue;
      if (entry.isDirectory()) walk(p, out);
      else if (EXT.test(entry.name)) out.push(p);
    }
    return out;
  }

  const files = walk(root);

  it('scans a real set of files', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it.each(archived)('nothing references docs/%s without the archive path', (file) => {
    const stale = new RegExp(`docs/${file.replace('.', '\\.')}`);
    const offenders = files.filter((f) => {
      const text = fs.readFileSync(f, 'utf8');
      // Strip the correct form first; whatever still matches is stale.
      return stale.test(text.split(`docs/archive/${file}`).join(''));
    });
    expect(offenders.map((f) => path.relative(root, f))).toEqual([]);
  });
});

/**
 * The failure that started this: two live documents answering one question.
 * A live document that declares itself superseded belongs in the archive.
 */
describe('no live document declares itself superseded', () => {
  const liveDocs = fs
    .readdirSync(path.join(root, 'docs'))
    .filter((f) => f.endsWith('.md'));

  it.each(liveDocs)('%s is not marked archived', (file) => {
    // The top of the file only. DOC_LIFECYCLE.md defines the header and so
    // necessarily quotes it further down -- asserting it, not declaring it.
    // Same case claims.test.ts notes for PRODUCT.md.
    const top = fs.readFileSync(path.join(root, 'docs', file), 'utf8').split(/^# /m)[0];
    expect(top).not.toContain(MARKER);
  });
});
