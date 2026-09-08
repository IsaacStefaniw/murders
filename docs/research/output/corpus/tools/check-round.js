// check-round.js — validate a candidate round against the Protocol interface
// rules and every id already in the library or in another round.
// live library. Usage:  node check-round.js <area> [otherArea ...]
// Run from the repo root.
const fs = require('fs');
const area = process.argv[2];
const others = process.argv.slice(3);
const file = `docs/research/output/${area}/protocols.ts`;

const src = fs.readFileSync(file, 'utf8');
const body =
  src.replace(/^import[^;]*;/m, '').replace(/export const [A-Z_]+: Protocol\[\] =/, 'const __c =') + '\n;__c';
const cands = eval(body);

const libFiles = ['protocols.ts', 'protocols.money.ts', 'protocols.habits.ts', 'protocols.people.ts', 'protocols.supplements.ts', 'protocols.work.ts'];
let lib = libFiles.flatMap((f) =>
  [...fs.readFileSync('src/features/knowledge/' + f, 'utf8').matchAll(/^\s+id: '([^']+)'/gm)].map((m) => m[1]),
);
for (const o of others)
  lib = lib.concat(
    [...fs.readFileSync(`docs/research/output/${o}/protocols.ts`, 'utf8').matchAll(/^\s+id: '([^']+)'/gm)].map((m) => m[1]),
  );

const AREAS = ['family', 'relationship', 'health', 'work', 'growth', 'enjoyment', 'admin'];
const PILL = ['sleep', 'training', 'nutrition', 'longevity', 'mind', 'wealth', 'leadership', 'connection', 'skill'];
const KEYS = ['id','evidenceLevel','title','pillar','area','goalDomains','summary','why','attribution','days','durationMin','anchor','energy','tier','sessionType','duringWork','safety','neverNag','appliesTo','finishBeforeSleepMin'];
const banned = ['cure', 'treats ', 'prescrib', 'dose', 'supplement stack'];
const wealthBanned = ['etf', 'index fund', 's&p', 'bitcoin', 'crypto', '% return', 'guaranteed'];

const errs = [];
const seen = new Set();
for (const p of cands) {
  if (seen.has(p.id)) errs.push('dup ' + p.id);
  seen.add(p.id);
  if (lib.includes(p.id)) errs.push('CLASH ' + p.id);
  if (!/^[a-z0-9-]+$/.test(p.id)) errs.push(p.id + ' bad id');
  if (p.summary.length <= 10) errs.push(p.id + ' summary too short');
  if (p.why.length <= 30) errs.push(p.id + ' why too short');
  if (!Array.isArray(p.attribution)) errs.push(p.id + ' attribution not array');
  if (p.durationMin < 5) errs.push(p.id + ' duration < 5');
  if (!['A','B','C','D','E'].includes(p.evidenceLevel)) errs.push(p.id + ' grade');
  if (!PILL.includes(p.pillar)) errs.push(p.id + ' pillar ' + p.pillar);
  if (!AREAS.includes(p.area)) errs.push(p.id + ' area ' + p.area);
  if (!['any','morning','midday','evening'].includes(p.energy)) errs.push(p.id + ' energy ' + p.energy);
  if (!['must','should','could'].includes(p.tier)) errs.push(p.id + ' tier');
  if (!p.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) errs.push(p.id + ' days');
  if (p.anchor.kind === 'fixed' && !/^\d\d:\d\d$/.test(p.anchor.start)) errs.push(p.id + ' anchor.start');
  if (p.anchor.kind !== 'fixed' && typeof p.anchor.offsetMin !== 'number') errs.push(p.id + ' anchor.offsetMin');
  if (typeof p.anchor.windowMin !== 'number') errs.push(p.id + ' anchor.windowMin');
  const t = JSON.stringify(p).toLowerCase();
  for (const b of banned) if (t.includes(b)) errs.push(p.id + ' banned "' + b + '"');
  if (p.pillar === 'wealth') {
    for (const b of wealthBanned) if (t.includes(b)) errs.push(p.id + ' wealth-banned "' + b + '"');
    if (/debt|invest|position|super|loan|offset|refund|insur/.test(t) && !(p.safety && /adviser|professional|accountant|charity/.test(p.safety.toLowerCase())))
      errs.push(p.id + ' money card without a professional route');
  }
  if (['training', 'longevity'].includes(p.pillar) && !p.safety) errs.push(p.id + ' needs safety');
  for (const k of Object.keys(p)) if (!KEYS.includes(k)) errs.push(p.id + ' unknown key ' + k);
}

const g = {}, ar = {}, at = {};
for (const p of cands) {
  g[p.evidenceLevel] = (g[p.evidenceLevel] || 0) + 1;
  ar[p.area] = (ar[p.area] || 0) + 1;
  for (const x of p.attribution) at[x] = (at[x] || 0) + 1;
}
const ab = ((g.A || 0) + (g.B || 0)) / cands.length;
console.log(`${area}: ${cands.length} cards`);
console.log('grades  ', g, `  A+B ${(ab * 100).toFixed(0)}%`);
console.log('areas   ', ar);
console.log('empty attribution:', cands.filter((p) => !p.attribution.length).length);
console.log('attributions', Object.keys(at).length ? at : '(none)');
console.log(`neverNag ${cands.filter((p) => p.neverNag).length} | safety ${cands.filter((p) => p.safety).length} | timeAnchored ${cands.filter((p) => p.anchor.timeAnchored).length}`);
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'OK no errors');
process.exit(errs.length ? 1 : 0);
