#!/usr/bin/env node
/**
 * retraction-sweep.js — check the live library against RETRACTIONS.md.
 *
 * Why this exists: the register was built after three rounds each found a
 * retracted paper in their own topic. Nobody then checked the CARDS
 * ALREADY SHIPPED against it. The skill round found `ship-monthly` — a
 * live card whose reasoning and both attribution credits come from
 * Ariely & Wertenbroch 2002, retracted 2 September 2026. It had been in
 * the register for days, filed under a different round.
 *
 * A register nobody sweeps against is a bibliography. Run this whenever
 * RETRACTIONS.md changes, and before any round ships.
 *
 *   node retraction-sweep.js [path-to-knowledge-dir]
 *
 * Two checks, both deliberately noisy: a false positive costs one read,
 * a false negative ships a retracted claim to a phone.
 *
 *  1. AUTHOR — any card crediting an author of a retracted paper.
 *  2. CLAIM  — any card whose text matches a phrase pattern for a
 *              finding that is retracted or has been overturned.
 *
 * Exit code 1 if anything is flagged, so it can gate a build.
 */

const fs = require('fs');
const path = require('path');

const DIR = process.argv[2] || 'src/features/knowledge';

// Keep in step with ../RETRACTIONS.md. Adding a row there means adding
// one here, or the register drifts out of enforcement again.
const RETRACTED_AUTHORS = [
  { name: 'Dan Ariely', paper: 'Ariely & Wertenbroch 2002 (retracted 2026) and Shu et al. 2012 (retracted 2021)' },
  { name: 'Klaus Wertenbroch', paper: 'Ariely & Wertenbroch 2002, retracted 2 Sep 2026' },
  { name: 'Maria Panagioti', paper: 'Panagioti et al. 2018, retracted 2020 — note the 2017 paper is CLEAN' },
];

const CLAIM_PATTERNS = [
  {
    id: 'self-imposed-deadlines',
    re: /(own|self[- ]?(imposed|set)|their own).{0,60}deadline|deadline.{0,40}(precommit|pre-commit)/i,
    note: 'Traces to Ariely & Wertenbroch 2002, RETRACTED 2 Sep 2026. Data found tampered with or fabricated; a 2026 replication failed.',
  },
  {
    id: 'ego-depletion',
    re: /willpower.{0,50}(finite|limited|depleti|runs out|muscle|resource)|(depleti|deplete).{0,40}self[- ]control/i,
    note: 'Ego depletion. Two preregistered multi-lab replications (23 labs N=2,141 d=0.04; 36 labs N=3,531 d=0.06) find essentially nothing.',
  },
  {
    id: 'positivity-ratio',
    re: /three (positives?|good).{0,30}(for )?(every|each) (one )?negative|3:1 (positivity|ratio)|positivity ratio/i,
    note: 'The 3:1 positivity ratio. Its mathematical basis was formally withdrawn.',
  },
  {
    id: 'poverty-iq',
    re: /\b13 IQ\b|IQ points.{0,40}(poverty|poor|money)|(poverty|money worry).{0,40}IQ points/i,
    note: 'Mani et al. 2013 as popularly stated. A 2024 meta-analysis puts the differential effect at g≈0.09 with the interval crossing zero.',
  },
  {
    id: 'burnout-patient-safety',
    re: /burnout.{0,60}(double|twice).{0,40}(safety|incident|error)/i,
    note: 'Panagioti et al. 2018, RETRACTED 2020, still cited 824 times.',
  },
  {
    id: 'refocus-23-minutes',
    re: /23 minutes|twenty[- ]three minutes/i,
    note: 'The refocus figure traces to nothing citable. Already named in the library as a debunk; flag only if asserted as fact.',
  },
  {
    id: 'zoom-fatigue-mechanisms',
    re: /(nonverbal|non-verbal) overload|four (causes|mechanisms).{0,30}(zoom|video)/i,
    note: 'Bailenson 2021 is a theory paper with no participants. Cite Shockley 2021 instead.',
  },
];

function cards(file) {
  const s = fs.readFileSync(file, 'utf8');
  const out = [];
  const re = /\{\s*\n\s*id: '([^']+)',([\s\S]{0,2600}?)\n  \},/g;
  let m;
  while ((m = re.exec(s))) {
    const body = m[2];
    const attr = (body.match(/attribution: \[([^\]]*)\]/) || [, ''])[1]
      .split(',').map((x) => x.trim().replace(/'/g, '')).filter(Boolean);
    const line = s.slice(0, m.index).split('\n').length;
    out.push({ id: m[1], body, attr, file: path.basename(file), line });
  }
  return out;
}

const files = fs.readdirSync(DIR).filter((f) => /^protocols.*\.ts$/.test(f));
const all = files.flatMap((f) => cards(path.join(DIR, f)));
const flags = [];

for (const c of all) {
  for (const a of RETRACTED_AUTHORS) {
    if (c.attr.includes(a.name))
      flags.push({ kind: 'AUTHOR', card: c, detail: `credits ${a.name} — ${a.paper}` });
  }
  for (const p of CLAIM_PATTERNS) {
    if (p.re.test(c.body))
      flags.push({ kind: 'CLAIM', card: c, detail: `matches "${p.id}" — ${p.note}` });
  }
}

console.log(`# swept ${all.length} cards in ${files.length} files under ${DIR}`);
if (!flags.length) {
  console.log('# clean against RETRACTIONS.md');
  process.exit(0);
}
console.log(`\n!! ${flags.length} flag(s)\n`);
for (const f of flags) {
  console.log(`[${f.kind}] ${f.card.file}:${f.card.line}  ${f.card.id}`);
  console.log(`         ${f.detail}`);
  if (f.card.attr.length) console.log(`         attribution: [${f.card.attr.join(', ')}]`);
  console.log('');
}
console.log('Every CLAIM flag needs a human read: the pattern may be matching the');
console.log('library correctly DEBUNKING the claim, which is the right thing to do.');
process.exit(1);
