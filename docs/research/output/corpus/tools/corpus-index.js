#!/usr/bin/env node
/**
 * corpus-index.js — build the cross-field episode index, once, for every
 * coach at the same time.
 *
 * Why this exists: rounds used to do their own discovery, one brief at a
 * time. That refetches the same episodes (a Huberman sleep episode serves
 * recovery, mind and skill), and it makes convergence scoring impossible,
 * because you cannot see that six independent voices agree if you only
 * ever look at one pillar's slice.
 *
 * This walks the transcript aggregator's sitemaps plus the shows that
 * publish their own archives, routes every episode to the pillars it can
 * serve, and writes one index the whole project reads.
 *
 * Routing is deliberately generous. A false positive costs one fetch; a
 * false negative loses a practice nobody will ever look for again.
 *
 *   node corpus-index.js sitemaps       download aggregator sitemaps
 *   node corpus-index.js build          write index.tsv + a summary
 *   node corpus-index.js pillar <name>  list one pillar's episodes
 *
 * Output goes to the cache dir (HARVEST_CACHE, default OS temp), not the
 * repo: it is a work list, regenerable, and it names 30k+ URLs.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

const CACHE = process.env.HARVEST_CACHE || path.join(os.tmpdir(), 'intentnorth-harvest');
const SM = path.join(CACHE, 'sitemaps');
fs.mkdirSync(SM, { recursive: true });
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

// ── Pillar routing ────────────────────────────────────────────────────
// Keys match the app's Pillar type. Written against episode TITLES, which
// is all a sitemap gives; see the caveat about guest-titled shows below.
const PILLARS = {
  // Word boundaries matter more than they look: an unbounded "rest" eats
  // "interest", an unbounded "anger" eats "dangerous" and "manager".
  sleep: /sleep|insomnia|circadian|\bnap\b|jet.?lag|shift.?work|fatigue|dream|melatonin|\brest\b|tired|snor|apnea/i,
  longevity:
    /longevity|aging|ageing|lifespan|healthspan|blue zone|centenarian|mortality|sauna|cold plunge|cold exposure|heat therapy|autophagy|senescen|biological age/i,
  training:
    /strength|muscle|hypertroph|cardio|zone 2|vo2|exercise|training|lifting|weight|running|endurance|mobility|athlet|fitness|workout|performance|injur/i,
  nutrition:
    /protein|\bdiet\b|nutrition|fasting|carb|fat loss|creatine|omega|vitamin|\bgut\b|microbiome|alcohol|caffeine|sugar|eating|food|supplement|metabolic|obesity|weight loss/i,
  mind: /meditat|mindful|anxiety|depress|stress|therapy|\bcbt\b|self.?compassion|psychedelic|dopamine|trauma|mental health|emotion|happiness|purpose|meaning|\bfear|\banger\b|grief|resilien|nervous system|breath/i,
  wealth: /money|saving|invest|debt|finance|wealth|retire|budget|frugal|income|rich\b|financial/i,
  leadership:
    /productiv|deep work|\bfocus\b|burnout|leadership|management|meeting|career|negotiat|entrepreneur|work.?life|business|team|hiring|decision/i,
  connection:
    /relationship|marriage|\blove\b|dating|\bsex\b|parenting|family|friendship|lonel|communicat|conflict|attachment|divorce|intimacy|social/i,
  skill: /learning|memory|skill|practice|mastery|language|creativ|expert|talent|habit|discipline|motivation|\bgoal|procrastinat|attention/i,
};

// Roster names, for shows that title episodes by guest (JRE, Lex, Ferriss)
// where topic words never appear in the slug.
const ROSTER =
  /attia|huberman|rhonda.?patrick|galpin|layne.?norton|nuckols|trexler|kaeberlein|ben.?felix|sam.?harris|nippard|israetel|eric.?helms|tsatsouline|cal.?newport|adam.?grant|morgan.?housel|ramit.?sethi|esther.?perel|dan.?harris|judson.?brewer|kristin.?neff|rick.?hanson|barbara.?oakley|scott.?young|kirk.?parsley|matthew.?walker|sapolsky|feldman.?barrett|gottman|sue.?johnson|ericsson|kabat.?zinn|katy.?milkman|james.?clear|bj.?fogg|satchin.?panda|stuart.?phillips|schoenfeld|laukkanen|van.?loon|edmondson|sonnentag|maslach|amabile|gloria.?mark|duckworth|burkeman|mckeown|jocko|daniel.?pink|david.?allen|nir.?eyal|steven.?kotler|brene.?brown|gabor.?mate|robert.?lustig|tim.?spector|chris.?palmer|gina.?poe|jeff.?cavaliere|andy.?galpin|marie.?pierre|tommy.?wood|scott.?rick|hal.?hershfield|abigail.?sussman|richard.?thaler|benartzi|lusardi|scott.?pape/i;

// Shows worth indexing on the aggregator. Everything else there is news,
// politics, true crime and entertainment — see coverage.md.
const SHOWS =
  /^(the-)?(joe-rogan-experience|lex-fridman|rich-roll|modern-wisdom|diary-of-a-ceo|peter-attia|ten-percent-happier|armchair-expert|on-purpose|freakonomics|zoe-science|feel-better-live-more|school-of-greatness|shawn-ryan|mel-robbins|huberman)/;

function get(url, hops = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA } }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && hops < 5) {
          res.resume();
          return resolve(get(new URL(res.headers.location, url).toString(), hops + 1));
        }
        const c = [];
        res.on('data', (x) => c.push(x));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(c).toString('utf8') }));
      })
      .on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cmdSitemaps() {
  const idx = await get('https://podcasts.happyscribe.com/sitemap.xml');
  const maps = [...idx.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`# ${maps.length} sitemaps`);
  let n = 0;
  for (const u of maps) {
    const f = path.join(SM, path.basename(u));
    if (fs.existsSync(f)) { n++; continue; }
    await sleep(1000);
    const r = await get(u);
    if (r.status === 200) { fs.writeFileSync(f, r.body); n++; }
    process.stdout.write(`\r# fetched ${n}/${maps.length}`);
  }
  console.log(`\n# ${n} sitemaps in ${SM}`);
}

function routeTitle(title) {
  const pillars = Object.entries(PILLARS)
    .filter(([, re]) => re.test(title))
    .map(([k]) => k);
  return pillars;
}

function cmdBuild() {
  const files = fs.existsSync(SM) ? fs.readdirSync(SM).filter((f) => f.endsWith('.xml')) : [];
  if (!files.length) return console.log('# no sitemaps — run: node corpus-index.js sitemaps');
  const rows = [];
  const seen = new Set();
  for (const f of files) {
    const x = fs.readFileSync(path.join(SM, f), 'utf8');
    for (const m of x.matchAll(/<loc>https:\/\/podcasts\.happyscribe\.com\/([^<]*)<\/loc>/g)) {
      const parts = m[1].split('/').filter(Boolean);
      if (parts.length !== 2) continue;
      const [show, slug] = parts;
      if (!SHOWS.test(show)) continue;
      const url = `https://podcasts.happyscribe.com/${show}/${slug}`;
      if (seen.has(url)) continue;
      const title = slug.replace(/-/g, ' ');
      const pillars = routeTitle(title);
      const guest = ROSTER.test(title);
      if (!pillars.length && !guest) continue;
      seen.add(url);
      rows.push({
        source: 'aggregator',
        show,
        title,
        url,
        pillars: pillars.length ? pillars : ['(route by guest)'],
        rosterGuest: guest ? 'yes' : '',
      });
    }
  }
  const out = path.join(CACHE, 'index.tsv');
  fs.writeFileSync(
    out,
    'source\tshow\tpillars\trosterGuest\ttitle\turl\n' +
      rows.map((r) => [r.source, r.show, r.pillars.join('+'), r.rosterGuest, r.title, r.url].join('\t')).join('\n'),
  );
  const byPillar = {};
  for (const r of rows) for (const p of r.pillars) byPillar[p] = (byPillar[p] || 0) + 1;
  console.log(`# ${rows.length} routed episodes -> ${out}`);
  console.log('# roster-guest episodes: ' + rows.filter((r) => r.rosterGuest).length);
  console.log('\nBY PILLAR (an episode can serve several):');
  for (const [p, n] of Object.entries(byPillar).sort((a, b) => b[1] - a[1]))
    console.log(String(n).padStart(5) + '  ' + p);
  console.log('\n# NOTE: guest-titled shows (Rogan, Lex, Ferriss) carry no topic words');
  console.log('# in the slug, so they route by roster name only and are undercounted.');
  console.log('# Use `harvest.js search "<name>"` and `harvest.js tim "<name>"` for those.');
}

function cmdPillar(name) {
  const out = path.join(CACHE, 'index.tsv');
  if (!fs.existsSync(out)) return console.log('# run: node corpus-index.js build');
  const lines = fs.readFileSync(out, 'utf8').split('\n').slice(1);
  let n = 0;
  for (const l of lines) {
    const c = l.split('\t');
    if (!c[2]) continue;
    if (!c[2].split('+').includes(name)) continue;
    console.log(`${c[1]} | ${c[4]} | ${c[5]}`);
    n++;
  }
  console.log(`# ${n} episodes routed to "${name}"`);
}

(async () => {
  const [cmd, a] = process.argv.slice(2);
  try {
    if (cmd === 'sitemaps') await cmdSitemaps();
    else if (cmd === 'build') cmdBuild();
    else if (cmd === 'pillar') cmdPillar(a);
    else console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
  } catch (e) {
    console.error('error:', e.message);
    process.exit(1);
  }
})();
