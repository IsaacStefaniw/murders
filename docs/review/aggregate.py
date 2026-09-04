"""Aggregate the reviewer batches into counts by tag, market, severity and
would-pay, plus the most-quoted confusions and jargon. Writes report.md."""
import json, os, glob, collections, re, sys

D = os.path.dirname(os.path.abspath(__file__))
RUN = sys.argv[1] if len(sys.argv) > 1 else 'round1'
files = sorted(glob.glob(os.path.join(D, RUN, 'out', 'agent-*.json')))
personas = {p['id']: p for p in json.load(open(os.path.join(D, 'personas-all.json')))}
rows = []
bad = []
for f in files:
    try:
        data = json.load(open(f))
        if isinstance(data, dict) and 'reviews' in data: data = data['reviews']
        for r in data:
            if isinstance(r, dict) and r.get('id'): rows.append(r)
    except Exception as e:
        bad.append((os.path.basename(f), str(e)[:80]))

n = len(rows)
tags = collections.Counter(t for r in rows for t in (r.get('tags') or []))
sev = collections.Counter(int(r.get('severity') or 0) for r in rows)
pay = collections.Counter((r.get('would_pay') or '?').lower() for r in rows)
understood = sum(1 for r in rows if r.get('understood_what_it_is') is True)
stopped = collections.Counter((r.get('stopped_at') or 'did not stop') for r in rows)
by_shape = collections.defaultdict(list)
for r in rows:
    p = personas.get(r['id'], {}); by_shape[p.get('week_shape', '?')].append(r)

def norm(s): return re.sub(r'\s+', ' ', str(s)).strip().lower()
jargon = collections.Counter(norm(j) for r in rows for j in (r.get('jargon_flagged') or []))
conf = collections.Counter(norm(c)[:90] for r in rows for c in (r.get('confusions') or []))
missing = collections.Counter(norm(c)[:90] for r in rows for c in (r.get('missing') or []))
changes = collections.Counter(norm(c)[:90] for r in rows for c in (r.get('top_changes') or []))
liked = collections.Counter(norm(c)[:90] for r in rows for c in (r.get('liked') or []))

L = []
L.append(f'# Persona review — {RUN}\n')
L.append(f'{n} persona reviews from {len(files)} agents' + (f'; {len(bad)} files unreadable: {bad}' if bad else '') + '\n')
L.append(f'- Understood what it is after the first screen and interview: **{understood}/{n} ({100*understood/max(n,1):.0f}%)**')
L.append(f'- Would pay: yes {pay.get("yes",0)} · maybe {pay.get("maybe",0)} · no {pay.get("no",0)}')
L.append('- Severity (5 = delete immediately): ' + ' · '.join(f'{k}: {sev.get(k,0)}' for k in range(5, 0, -1)))
L.append('\n## Tags, most to least\n')
L.append('| Tag | Count | % |\n|---|---|---|')
for t, c in tags.most_common(): L.append(f'| {t} | {c} | {100*c/max(n,1):.0f}% |')
L.append('\n## By week shape\n')
L.append('| Market | n | understood | would pay yes | mean severity | top tags |\n|---|---|---|---|---|---|')
for s, rs in sorted(by_shape.items(), key=lambda kv: -len(kv[1])):
    u = sum(1 for r in rs if r.get('understood_what_it_is') is True)
    y = sum(1 for r in rs if (r.get('would_pay') or '').lower() == 'yes')
    ms = sum(int(r.get('severity') or 0) for r in rs) / max(len(rs), 1)
    tt = collections.Counter(t for r in rs for t in (r.get('tags') or [])).most_common(4)
    L.append(f'| {s} | {len(rs)} | {u} | {y} | {ms:.1f} | {", ".join(t for t,_ in tt)} |')
L.append('\n## Where people stopped\n')
for k, c in stopped.most_common(12): L.append(f'- {k}: {c}')
L.append('\n## Jargon flagged (top 40)\n')
for k, c in jargon.most_common(40): L.append(f'- {c} × "{k}"')
L.append('\n## Confusions (top 40, first 90 chars)\n')
for k, c in conf.most_common(40): L.append(f'- {c} × {k}')
L.append('\n## Missing (top 30)\n')
for k, c in missing.most_common(30): L.append(f'- {c} × {k}')
L.append('\n## Top changes asked for (top 40)\n')
for k, c in changes.most_common(40): L.append(f'- {c} × {k}')
L.append('\n## What landed (top 25)\n')
for k, c in liked.most_common(25): L.append(f'- {c} × {k}')
open(os.path.join(D, RUN, 'report.md'), 'w').write('\n'.join(L))
json.dump({'n': n, 'tags': tags, 'severity': sev, 'pay': pay, 'understood': understood}, open(os.path.join(D, RUN, 'summary.json'), 'w'), indent=1)
print('\n'.join(L[:12]))
