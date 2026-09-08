#!/usr/bin/env node
/**
 * build-manifest.js — the sources manifest.
 *
 * Walks every research ledger, extracts each paper with its identifier,
 * and records HOW FAR IT WAS READ. Emits machine-readable JSON plus a
 * human manifest, both with counts computed rather than typed, so a
 * marketing page can render the number from the file instead of copying
 * it and letting it rot.
 *
 *   node build-manifest.js            write manifest.json + MANIFEST.md
 *   node build-manifest.js --counts   print the totals only
 *
 * READ DEPTH is assigned from what the ledger row actually says, never
 * assumed. Four values, weakest to strongest:
 *
 *   cited     — the identifier appears; the row records no depth.
 *   registry  — bibliographic record and retraction status checked at
 *               Crossref. This is the floor for anything load-bearing.
 *   abstract  — abstract read (Europe PMC, OpenAlex, or the record).
 *   fulltext  — the full text was opened and read.
 *
 * A paper appearing in several rounds keeps its DEEPEST reading.
 *
 * VERIFICATION STATUS is taken from the ledger's own marking where it
 * gives one: verified / partly / unverified.
 *
 * The honest caveat, stated here because it belongs in the artefact:
 * depth is inferred from the prose of the row, so it is a floor rather
 * than a precise measure. A row that says nothing about how it was read
 * is counted as `cited`, even if it was in fact read closely. The
 * headline number to publish is therefore total identifiers, with the
 * depth breakdown offered as the honest detail underneath.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.argv.includes('--root')
  ? process.argv[process.argv.indexOf('--root') + 1]
  : 'docs/research/output';

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) out = out.concat(walk(p));
    // Skip our own output, or the manifest counts itself and inflates.
    else if (/\.(md|ts)$/.test(f) && !/^(MANIFEST\.md|manifest\.json|NUMBERS\.md)$/.test(f)) out.push(p);
  }
  return out;
}

const DEPTH_ORDER = { cited: 0, registry: 1, abstract: 2, fulltext: 3 };

function depthOf(ctx) {
  const t = ctx.toLowerCase();
  if (/full text|full-text|read in full|opened in full|read the whole|pmc full/.test(t)) return 'fulltext';
  if (/abstract|europe pmc|openalex|epmc/.test(t)) return 'abstract';
  if (/crossref|registry|record verified|verified \(crossref|retraction-check|doi verified/.test(t)) return 'registry';
  return 'cited';
}

function statusOf(ctx) {
  const t = ctx.toLowerCase();
  if (/\bunverified\b/.test(t)) return 'unverified';
  if (/partly verified|partially verified/.test(t)) return 'partly';
  if (/\bverified\b/.test(t)) return 'verified';
  return 'not stated';
}

// The unit of context is the table row or paragraph the identifier sits
// in, because that is where the ledger records how it was read.
function contextAround(text, index) {
  let start = text.lastIndexOf('\n', index);
  let end = text.indexOf('\n', index);
  if (start < 0) start = 0;
  if (end < 0) end = text.length;
  let ctx = text.slice(start, end);
  if (ctx.length < 120) {
    const s2 = Math.max(0, index - 400);
    const e2 = Math.min(text.length, index + 400);
    ctx = text.slice(s2, e2);
  }
  return ctx;
}

const files = walk(ROOT);
const papers = new Map();

function record(id, kind, file, ctx) {
  const round = path.relative(ROOT, file).split(path.sep)[0].replace(/\.md$/, '');
  const depth = depthOf(ctx);
  const status = statusOf(ctx);
  const key = kind + ':' + id;
  const prev = papers.get(key);
  if (!prev) {
    papers.set(key, { id, kind, depth, status, rounds: new Set([round]), files: new Set([path.relative(ROOT, file).split(path.sep).join('/')]) });
    return;
  }
  prev.rounds.add(round);
  prev.files.add(path.relative(ROOT, file).split(path.sep).join('/'));
  if (DEPTH_ORDER[depth] > DEPTH_ORDER[prev.depth]) prev.depth = depth;
  if (prev.status === 'not stated' && status !== 'not stated') prev.status = status;
  if (prev.status === 'unverified' && status === 'verified') prev.status = 'verified';
}

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/10\.\d{4,9}\/[^\s"'<>)\],;|]+/g)) {
    const id = m[0].replace(/[.,;:]+$/, '').toLowerCase();
    if (id.length < 12 || /[()]/.test(id)) continue; // malformed capture
    record(id, 'doi', f, contextAround(text, m.index));
  }
  for (const m of text.matchAll(/PMID[:\s]+(\d{6,9})/gi)) record(m[1], 'pmid', f, contextAround(text, m.index));
}

// A paper with both a DOI and a PMID is one paper. We cannot resolve that
// mapping offline, so PMIDs are reported separately and never added to
// the DOI count. The headline number is DOIs.
const all = [...papers.values()].map((p) => ({ ...p, rounds: [...p.rounds].sort(), files: [...p.files].sort() }));
const dois = all.filter((p) => p.kind === 'doi');
const pmids = all.filter((p) => p.kind === 'pmid');

const byDepth = (list) => list.reduce((a, p) => ((a[p.depth] = (a[p.depth] || 0) + 1), a), {});
const byStatus = (list) => list.reduce((a, p) => ((a[p.status] = (a[p.status] || 0) + 1), a), {});
const byRound = {};
for (const p of dois) for (const r of p.rounds) byRound[r] = (byRound[r] || 0) + 1;

const counts = {
  generated: new Date().toISOString().slice(0, 10),
  papersWithDoi: dois.length,
  identifiersWithPmidOnly: pmids.length,
  depth: byDepth(dois),
  readAtLeastAtRegistry: dois.filter((p) => DEPTH_ORDER[p.depth] >= 1).length,
  readAtLeastAtAbstract: dois.filter((p) => DEPTH_ORDER[p.depth] >= 2).length,
  fullTextRead: dois.filter((p) => p.depth === 'fulltext').length,
  status: byStatus(dois),
  byRound,
  ledgerFilesScanned: files.length,
};

if (process.argv.includes('--counts')) {
  console.log(JSON.stringify(counts, null, 2));
  process.exit(0);
}

fs.writeFileSync(path.join(ROOT, 'manifest.json'), JSON.stringify({ counts, papers: all }, null, 1) + '\n');

const rows = dois
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((p) => `| ${p.id} | ${p.depth} | ${p.status} | ${p.rounds.join(', ')} |`)
  .join('\n');

const md = `# Sources manifest

Generated by \`corpus/tools/build-manifest.js\` on ${counts.generated}. Do not edit by hand; regenerate it.

**Every number on this page is computed from the ledgers.** A marketing page should render these from \`manifest.json\` rather than copying them, so they cannot go stale.

## Counts

| Measure | Value |
|---|---|
| Papers cited, with a DOI | **${counts.papersWithDoi}** |
| Additional identifiers cited as PMID only | ${counts.identifiersWithPmidOnly} |
| Read at least to registry level (bibliography and retraction checked) | ${counts.readAtLeastAtRegistry} |
| Read at least to abstract level | ${counts.readAtLeastAtAbstract} |
| Full text opened and read | ${counts.fullTextRead} |
| Ledger files scanned | ${counts.ledgerFilesScanned} |

Depth breakdown: ${Object.entries(counts.depth).map(([k, v]) => `${k} ${v}`).join(' · ')}

Verification status as recorded by the ledgers: ${Object.entries(counts.status).map(([k, v]) => `${k} ${v}`).join(' · ')}

By round (note: \`gate1\` and \`gate2\` hold copies of ledgers that also sit inside the round folders, so these overlap by design; the total above is de-duplicated): ${Object.entries(counts.byRound).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}

## How read depth is assigned, and its honest limit

Depth is read from what each ledger row says about itself, never assumed:

- **fulltext** — the row says the full text was opened and read.
- **abstract** — the row cites the abstract, Europe PMC or OpenAlex.
- **registry** — the row records a Crossref check of bibliography and retraction status. This is the floor for anything load-bearing.
- **cited** — the identifier appears and the row records no depth.

**The limit, stated plainly.** Depth is inferred from prose, so it is a floor rather than a measurement. A row that does not describe how it was read counts as \`cited\` even if it was read closely. So the defensible published claim is the total, with the depth breakdown offered underneath as the honest detail. Do not publish the full-text figure as though it were the whole of the close reading.

A paper appearing in several rounds keeps its deepest reading. A paper with both a DOI and a PMID cannot be de-duplicated offline, so PMID-only identifiers are reported separately and never added to the DOI count.

## The papers

| identifier | read to | status as recorded | rounds |
|---|---|---|---|
${rows}
`;

fs.writeFileSync(path.join(ROOT, 'MANIFEST.md'), md);
console.log(`# ${counts.papersWithDoi} papers with a DOI, ${counts.fullTextRead} read in full text`);
console.log(`# wrote ${path.join(ROOT, 'manifest.json')} and MANIFEST.md`);
