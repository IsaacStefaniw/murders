#!/usr/bin/env node
/**
 * harvest.js — transcript and reference harvester for research rounds.
 *
 * Node only, no dependencies. Downloads a page with a browser user-agent,
 * caches it OUTSIDE the repository, extracts plain text, and prints the
 * things a researcher needs in order to trace claims to papers: word count,
 * keyword hit lines, and any DOIs, PubMed ids or journal links on the page.
 *
 * It never writes transcript text into the repo. The cache lives in the OS
 * temp directory (override with HARVEST_CACHE). What goes into
 * docs/research/output/ is the index: which episode, which claim, which
 * paper, in IntentNorth's own words. See ../SOURCES.md for the sites, the
 * terms and the rule.
 *
 * Commands
 *   node harvest.js search "<query>"          happyscribe cross-show search
 *   node harvest.js show <happyscribe-slug>   episode list for one show
 *   node harvest.js tim "<guest or topic>"    tim.blog transcript search
 *   node harvest.js fetch <url> [kw,kw,...]   cache + text + keyword lines
 *   node harvest.js refs <url>                DOIs / PMIDs / journal links
 *   node harvest.js links <url> <regex>       hrefs matching a pattern
 *   node harvest.js crossref <doi>            title, journal, year, retraction flag
 *   node harvest.js lit "<query>" [filter]    Europe PMC search, most-cited first
 *                                             filter: meta | review | rct | oa | any
 *   node harvest.js abstract <doi-or-pmid>    Europe PMC record: abstract, n, journal
 *   node harvest.js book "<query>"            NCBI Bookshelf search (free textbooks)
 *
 * Be polite: one request a second, cached forever, personal research use.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const CACHE = process.env.HARVEST_CACHE || path.join(os.tmpdir(), 'intentnorth-harvest');
fs.mkdirSync(CACHE, { recursive: true });

let last = 0;
async function polite() {
  const wait = 1000 - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
}

function get(url, hops = 0) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod
      .get(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/json;q=0.9,*/*;q=0.8' } }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && hops < 5) {
          const next = new URL(res.headers.location, url).toString();
          res.resume();
          return resolve(get(next, hops + 1));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, url, body: Buffer.concat(chunks).toString('utf8') }));
      })
      .on('error', reject);
  });
}

async function fetchCached(url) {
  const key = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  const file = path.join(CACHE, key + '.html');
  if (fs.existsSync(file)) return { status: 200, url, body: fs.readFileSync(file, 'utf8'), cached: true, file };
  await polite();
  const r = await get(url);
  if (r.status === 200 && !/Just a moment\.\.\./.test(r.body.slice(0, 2000))) fs.writeFileSync(file, r.body);
  return { ...r, file };
}

function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|h\d|br|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function hrefs(html, base) {
  const out = new Set();
  for (const m of html.matchAll(/href="([^"#?]+)/g)) {
    try {
      out.add(new URL(m[1], base).toString());
    } catch {}
  }
  return [...out];
}

const CLAIM = /\b(study|studies|trial|meta-analys|systematic review|randomi[sz]|cohort|placebo|participants|subjects|et al|percent|per cent|\d+\s?%|\b(19[5-9]\d|20[0-2]\d)\b)/i;

async function cmdSearch(q) {
  const r = await fetchCached('https://podcasts.happyscribe.com/search?q=' + encodeURIComponent(q));
  const links = hrefs(r.body, r.url).filter((u) => /^https:\/\/podcasts\.happyscribe\.com\/[a-z0-9-]+\/[a-z0-9-]+$/.test(u));
  for (const u of links) console.log(u);
  console.log(`# ${links.length} episode links for "${q}"`);
}

async function cmdShow(slug) {
  let page = 1;
  const seen = new Set();
  for (;;) {
    const r = await fetchCached(`https://podcasts.happyscribe.com/${slug}` + (page > 1 ? `?page=${page}` : ''));
    if (r.status !== 200 || !r.url.includes('/' + slug)) break;
    const links = hrefs(r.body, r.url).filter((u) => u.startsWith(`https://podcasts.happyscribe.com/${slug}/`));
    let fresh = 0;
    for (const u of links) if (!seen.has(u)) { seen.add(u); fresh++; console.log(u); }
    if (!fresh) break;
    page++;
    if (page > 40) break;
  }
  console.log(`# ${seen.size} episodes for ${slug}`);
}

async function cmdTim(q) {
  // WordPress search is fuzzy, so keep only transcript slugs that carry a
  // word of the query (surnames, topic words); pass a topic phrase to widen.
  const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length >= 4);
  const out = new Set();
  for (let page = 1; page <= 3; page++) {
    const r = await fetchCached(`https://tim.blog/page/${page}/?s=` + encodeURIComponent(q + ' transcript'));
    if (r.status !== 200) break;
    const links = hrefs(r.body, r.url).filter((u) => /tim\.blog\/20\d\d\/\d\d\/\d\d\/.*transcript/.test(u));
    let fresh = 0;
    for (const u of links) {
      const slug = u.toLowerCase();
      if (tokens.length && !tokens.some((t) => slug.includes(t))) continue;
      if (!out.has(u)) { out.add(u); fresh++; }
    }
    if (!links.length) break;
  }
  for (const u of out) console.log(u);
  console.log(`# ${out.size} transcript links for "${q}"`);
}

async function cmdFetch(url, kws) {
  const r = await fetchCached(url);
  if (r.status !== 200) return console.log('HTTP', r.status, r.url);
  const t = text(r.body);
  const txt = r.file.replace(/\.html$/, '.txt');
  fs.writeFileSync(txt, t);
  const words = t.split(/\s+/).length;
  console.log(`# ${r.url}\n# ${words} words, text cached at ${txt}${r.cached ? ' (cached)' : ''}`);
  const lines = t.split('\n');
  const kw = (kws || '').split(',').map((s) => s.trim()).filter(Boolean);
  let n = 0;
  for (const l of lines) {
    const hitKw = kw.length ? kw.some((k) => l.toLowerCase().includes(k.toLowerCase())) : true;
    if (hitKw && CLAIM.test(l) && l.length > 40) {
      console.log('- ' + (l.length > 400 ? l.slice(0, 400) + '…' : l));
      if (++n >= 80) { console.log('# (truncated at 80 lines; read the cached text)'); break; }
    }
  }
  if (!n) console.log('# no claim-shaped lines matched; try other keywords or read the cached text');
}

async function cmdRefs(url) {
  const r = await fetchCached(url);
  if (r.status !== 200) return console.log('HTTP', r.status, r.url);
  const dois = new Set([...r.body.matchAll(/10\.\d{4,9}\/[^\s"'<>)\]]+/g)].map((m) => m[0].replace(/[.,;]+$/, '')));
  const pmids = new Set([...r.body.matchAll(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/g)].map((m) => m[1]));
  const journals = hrefs(r.body, r.url).filter((u) =>
    /(doi\.org|pubmed|ncbi\.nlm\.nih\.gov|nature\.com|science\.org|cell\.com|thelancet|nejm|jamanetwork|bmj\.com|plos|sciencedirect|springer|wiley|oup\.com|academic\.oup|sagepub|frontiersin|mdpi|nber\.org|ssrn\.com|journals\.humankinetics|physiology\.org|tandfonline|karger|cambridge\.org|psycnet|apa\.org)/.test(u),
  );
  for (const d of dois) console.log('DOI ' + d);
  for (const p of pmids) console.log('PMID ' + p);
  for (const j of journals) console.log('LINK ' + j);
  console.log(`# ${dois.size} DOIs, ${pmids.size} PMIDs, ${journals.length} journal links`);
}

async function cmdLinks(url, pattern) {
  const r = await fetchCached(url);
  const re = new RegExp(pattern);
  const out = hrefs(r.body, r.url).filter((u) => re.test(u));
  for (const u of out) console.log(u);
  console.log(`# ${out.length} links`);
}

async function cmdCrossref(doi) {
  await polite();
  const r = await get('https://api.crossref.org/works/' + encodeURIComponent(doi));
  if (r.status !== 200) return console.log('HTTP', r.status);
  const m = JSON.parse(r.body).message;
  const rel = m.relation || {};
  const flags = Object.keys(rel).filter((k) => /retract|update|correction|concern/i.test(k));
  const upd = (m['update-to'] || []).map((u) => u.type).concat(flags);
  console.log(
    JSON.stringify(
      {
        doi: m.DOI,
        title: (m.title || [])[0],
        container: (m['container-title'] || [])[0],
        year: (m.issued && m.issued['date-parts'] && m.issued['date-parts'][0][0]) || null,
        volume: m.volume,
        issue: m.issue,
        page: m.page,
        authors: (m.author || []).slice(0, 6).map((a) => `${a.family || ''} ${a.given ? a.given[0] : ''}`.trim()),
        retraction_or_update: upd.length ? upd : 'none',
      },
      null,
      1,
    ),
  );
}

const EPMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest/';

const LIT_FILTERS = {
  meta: ' AND (PUB_TYPE:"Meta-Analysis" OR PUB_TYPE:"Systematic Review")',
  review: ' AND PUB_TYPE:"Review"',
  rct: ' AND PUB_TYPE:"Randomized Controlled Trial"',
  oa: ' AND OPEN_ACCESS:y',
  any: '',
};

async function litQuery(query, f) {
  // Sort server-side by citation count: the default is newest-first, which
  // buries the landmark papers under this month's minor ones.
  await polite();
  const url = `${EPMC}search?query=${encodeURIComponent(query + f)}&format=json&pageSize=25&resultType=core&sort=${encodeURIComponent('CITED desc')}`;
  const r = await get(url);
  if (r.status !== 200) return null;
  return JSON.parse(r.body);
}

async function cmdLit(q, filter) {
  const f = LIT_FILTERS[filter || 'any'];
  if (f === undefined) return console.log('filter must be one of: ' + Object.keys(LIT_FILTERS).join(', '));
  // Bare multi-word queries are treated loosely and, sorted by citations,
  // return the most-cited papers in all of medicine rather than yours. Try
  // the exact phrase first; if that is empty, AND the terms but confine
  // each to the title and abstract so the match has to be about the topic.
  const bare = !/[:"()]|\bAND\b|\bOR\b/.test(q);
  const words = q.trim().split(/\s+/).filter((w) => w.length > 2);
  let j = null;
  let used = q;
  if (bare && words.length > 1) {
    used = `"${q}"`;
    j = await litQuery(used, f);
    if (!j || !j.hitCount) {
      used = words.map((w) => `TITLE_ABS:${w}`).join(' AND ');
      j = await litQuery(used, f);
    }
  } else {
    j = await litQuery(used, f);
  }
  if (!j) return console.log('# search failed');
  const rows = (j.resultList && j.resultList.result) || [];
  for (const x of rows.slice(0, 25)) {
    console.log(
      [
        x.pubYear || '????',
        'cited:' + (x.citedByCount || 0),
        x.isOpenAccess === 'Y' ? 'OA' : '--',
        x.doi ? 'doi:' + x.doi : 'PMID:' + (x.pmid || x.id),
        (x.journalTitle || x.bookOrReportDetails?.publisher || '').slice(0, 30),
        (x.title || '').replace(/\s+/g, ' ').slice(0, 110),
      ].join(' | '),
    );
  }
  console.log(`# ${j.hitCount} hits for ${used}${f ? ' [' + filter + ']' : ''}, top ${rows.length} by citations`);
}

async function cmdAbstract(id) {
  const q = /^\d+$/.test(id) ? `EXT_ID:${id}` : `DOI:"${id}"`;
  await polite();
  const r = await get(`${EPMC}search?query=${encodeURIComponent(q)}&format=json&pageSize=1&resultType=core`);
  if (r.status !== 200) return console.log('HTTP', r.status);
  const x = ((JSON.parse(r.body).resultList || {}).result || [])[0];
  if (!x) return console.log('# not found in Europe PMC — try Crossref, PMC or the publisher');
  const ab = (x.abstractText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const ns = [...ab.matchAll(/\b(?:n\s?=\s?|N\s?=\s?)(\d[\d,]*)/g)].map((m) => m[1]);
  console.log(
    JSON.stringify(
      {
        title: x.title,
        authors: x.authorString,
        journal: x.journalInfo && x.journalInfo.journal && x.journalInfo.journal.title,
        year: x.pubYear,
        volume: x.journalInfo && x.journalInfo.volume,
        pages: x.pageInfo,
        doi: x.doi,
        pmid: x.pmid,
        pmcid: x.pmcid,
        types: x.pubTypeList && x.pubTypeList.pubType,
        openAccess: x.isOpenAccess,
        citedBy: x.citedByCount,
        sampleSizesInAbstract: ns.length ? ns : 'none stated',
      },
      null,
      1,
    ),
  );
  if (ab) console.log('\nABSTRACT (source text — summarise, never paste into the library):\n' + ab);
  else
    console.log(
      '\n# no abstract in the Europe PMC record (usual for closed-access psychology and economics).' +
        (x.pmcid ? ` Full text: https://pmc.ncbi.nlm.nih.gov/articles/${x.pmcid}/` : ' Try Crossref, the author page, or RePEc.'),
    );
}

async function cmdBook(q) {
  await polite();
  // Relevance order, and drop the drug-reimbursement reviews that dominate
  // Bookshelf by volume and are never what a behaviour round wants.
  const s = await get(
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=books&retmode=json&sort=relevance&retmax=40&term=' +
      encodeURIComponent(q),
  );
  if (s.status !== 200) return console.log('HTTP', s.status);
  const meta = JSON.parse(s.body).esearchresult;
  const ids = meta.idlist || [];
  if (!ids.length) return console.log('# no Bookshelf hits');
  await polite();
  const d = await get(
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=books&retmode=json&id=' + ids.join(','),
  );
  const res = JSON.parse(d.body).result || {};
  const NOISE = /reimbursement review|therapeutic area|committee discussion|model parameters|^background$|^aim \d|cadth|clinical review report/i;
  let shown = 0;
  for (const id of ids) {
    const x = res[id];
    if (!x) continue;
    const book = x.booktitle || x.title || '';
    const chapter = x.title || '';
    if (NOISE.test(book) || NOISE.test(chapter)) continue;
    console.log(
      [
        (x.pubdate || '').slice(0, 7),
        book.slice(0, 60),
        chapter && chapter !== book ? '› ' + chapter.slice(0, 60) : '',
        `https://www.ncbi.nlm.nih.gov/books/${x.bookaccession || 'NBK' + id}/`,
      ].join(' | '),
    );
    if (++shown >= 15) break;
  }
  console.log(`# ${shown} shown of ${meta.count} Bookshelf hits for "${q}" (drug-review noise filtered)`);
}

(async () => {
  const [cmd, a, b] = process.argv.slice(2);
  try {
    if (cmd === 'lit') await cmdLit(a, b);
    else if (cmd === 'abstract') await cmdAbstract(a);
    else if (cmd === 'book') await cmdBook(a);
    else if (cmd === 'search') await cmdSearch(a);
    else if (cmd === 'show') await cmdShow(a);
    else if (cmd === 'tim') await cmdTim(a);
    else if (cmd === 'fetch') await cmdFetch(a, b);
    else if (cmd === 'refs') await cmdRefs(a);
    else if (cmd === 'links') await cmdLinks(a, b || '.');
    else if (cmd === 'crossref') await cmdCrossref(a);
    else console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
  } catch (e) {
    console.error('error:', e.message);
    process.exit(1);
  }
})();
