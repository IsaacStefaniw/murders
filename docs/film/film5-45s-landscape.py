import base64, pathlib
def b64(d,n): return base64.b64encode((pathlib.Path(d)/f'{n}.png').read_bytes()).decode()
SHOTS = {
 'coaches':   ('shots2','coaches'),
 'training':  ('shots2','training'),
 'workout':   ('shots2','workout'),
 'library':   ('shots2','library'),
 'dose':      ('shots4','20-level-card'),
 'recovery':  ('shots2','15-recovery'),
 'today':     ('shots','04-today'),
}
IMG = {k: b64(d,n) for k,(d,n) in SHOTS.items()}

# Placeholder until the domain resolves. Do not publish the film with a
# destination that 404s — an end card is a promise.
CTA = 'intentnorth.app'

CSS = """
:root{--ground:#0A100D;--ink:#F4F6F2;--dim:#93A79A;--accent:#7FD3A6;--deep:#2F5D4A;
 --display:"Bitstream Charter","Charter",Georgia,"DejaVu Serif",serif;
 --ui:"DejaVu Sans","Liberation Sans",system-ui,sans-serif;}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1280px;height:720px;overflow:hidden;background:var(--ground)}
body{font-family:var(--ui);color:var(--ink);display:grid;place-items:center}
.bg{position:absolute;inset:0;background:
 radial-gradient(900px 620px at 76% 42%,rgba(47,93,74,.44),transparent 62%),
 radial-gradient(720px 720px at 10% 84%,rgba(127,211,166,.12),transparent 60%),var(--ground);
 animation:drift 40s ease-in-out infinite alternate}
@keyframes drift{to{transform:scale(1.07) translate3d(-2%,-1%,0)}}
.grain{position:absolute;inset:0;opacity:.03;pointer-events:none;
 background-image:radial-gradient(rgba(255,255,255,.9) .5px,transparent .5px);background-size:3px 3px}
.stage{position:relative;width:1280px;height:720px}

.phone{position:absolute;top:50%;left:71.5%;transform:translate(-50%,-50%) scale(.88);
 width:292px;height:626px;border-radius:40px;padding:8px;
 background:linear-gradient(160deg,#2b3a33,#141c18);
 box-shadow:0 40px 90px -30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07),0 0 90px -20px rgba(127,211,166,.2);
 opacity:0;transition:opacity .7s ease,transform 1.1s cubic-bezier(.16,.9,.24,1)}
.phone.in{opacity:1;transform:translate(-50%,-50%) scale(1)}
.screen{width:100%;height:100%;border-radius:32px;overflow:hidden;position:relative;background:#F7F5F1}
.screen img{position:absolute;left:0;top:0;width:100%;opacity:0;transition:opacity .42s ease}
/* The incoming screen waits for the outgoing one to clear. */
.screen img.show{opacity:1;transition:opacity .42s ease .30s}
.ring{position:absolute;left:8px;top:59px;width:262px;height:77px;border-radius:12px;
 border:2px solid var(--accent);opacity:0;transition:opacity .5s ease;
 box-shadow:0 0 0 6px rgba(127,211,166,.16)}
.ring.in{opacity:1}

.copy{position:absolute;left:86px;top:50%;transform:translateY(-50%);width:530px;
 opacity:1;transition:opacity .38s ease}
.copy.hide{opacity:0}
.eyebrow{font:400 12.5px/1 var(--ui);letter-spacing:.24em;text-transform:uppercase;color:var(--accent);
 opacity:0;transform:translateY(12px);transition:all .6s cubic-bezier(.16,.9,.24,1);margin-bottom:18px}
.eyebrow.in{opacity:1;transform:none}
.line{font-family:var(--display);font-size:56px;line-height:1.08;letter-spacing:-.015em;
 opacity:0;transform:translateY(24px);transition:all .8s cubic-bezier(.16,.9,.24,1)}
.line.in{opacity:1;transform:none}
.sub{font:400 17.5px/1.55 var(--ui);color:var(--dim);margin-top:18px;max-width:450px;
 opacity:0;transform:translateY(14px);transition:all .7s cubic-bezier(.16,.9,.24,1)}
.sub.in{opacity:1;transform:none}

.spec{margin-top:24px;display:flex;flex-direction:column;gap:8px}
.row{display:flex;justify-content:space-between;align-items:baseline;gap:18px;
 border-bottom:1px solid rgba(255,255,255,.1);padding:9px 2px;
 opacity:0;transform:translateX(-22px);transition:all .6s cubic-bezier(.16,.9,.24,1)}
.row.in{opacity:1;transform:none}
.row .n{font:400 19px/1.2 var(--ui)}
.row .v{font:400 15px/1.2 var(--ui);color:var(--dim);white-space:nowrap}
.pills{margin-top:24px;display:flex;flex-wrap:wrap;gap:9px}
.pill{border:1px solid rgba(255,255,255,.17);border-radius:999px;padding:8px 15px;
 font:400 16px/1 var(--ui);background:rgba(255,255,255,.04);
 opacity:0;transform:translateY(12px) scale(.95);transition:all .55s cubic-bezier(.16,.9,.24,1)}
.pill.in{opacity:1;transform:none}
.pill.hot{border-color:var(--accent);color:var(--accent);background:rgba(127,211,166,.12)}
.quote{margin-top:24px;border-left:2px solid var(--accent);padding:2px 0 2px 18px;
 font-family:var(--display);font-size:25px;line-height:1.34;
 opacity:0;transform:translateY(16px);transition:all .7s cubic-bezier(.16,.9,.24,1)}
.quote.in{opacity:1;transform:none}
.quote em{font-style:normal;color:var(--accent)}
.qlabel{font:400 11.5px/1 var(--ui);letter-spacing:.22em;text-transform:uppercase;color:var(--dim);margin-bottom:10px}

.open{position:absolute;inset:0;display:grid;place-items:center;text-align:center}
.open .l{position:absolute;font-family:var(--display);font-size:64px;line-height:1.1;max-width:960px;
 opacity:0;transform:translateY(26px);transition:all .8s cubic-bezier(.16,.9,.24,1)}
.open .l.in{opacity:1;transform:none}
.open .l.bumped{opacity:0;transform:translateY(-80px) scale(.95)}
.open .l.win{color:var(--accent)}

.end{position:absolute;inset:0;display:grid;place-items:center;text-align:center;opacity:0;transition:opacity .9s ease}
.end.in{opacity:1}
.wordmark{font-family:var(--display);font-size:82px;letter-spacing:-.02em}
.wordmark b{font-weight:400;color:var(--accent)}
.tag{font:400 20px/1 var(--ui);color:var(--dim);margin-top:18px}
.cta{margin-top:34px;display:inline-block;border:1px solid rgba(127,211,166,.5);border-radius:999px;
 padding:13px 30px;font:400 18px/1 var(--ui);color:var(--accent);background:rgba(127,211,166,.08)}
.rail{position:absolute;left:0;bottom:0;height:2px;width:100%;background:rgba(255,255,255,.07)}
.rail i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--deep),var(--accent))}
"""

BODY = """
<div class="stage">
 <div class="bg"></div><div class="grain"></div>
 <div class="open" id="open">
  <div class="l" id="o1">A coach asks<br>before they prescribe.</div>
  <div class="l" id="o2">Then changes it<br>when you change.</div>
  <div class="l" id="o3">That is the whole job.</div>
 </div>
 <div class="copy" id="copy">
  <div class="eyebrow" id="eb"></div>
  <div class="line" id="ln"></div>
  <div class="sub" id="sb"></div>
  <div class="pills" id="pl"></div>
  <div class="spec" id="sp"></div>
  <div class="quote" id="qt"></div>
 </div>
 <div class="phone" id="phone"><div class="screen" id="screen">__IMGS__<div class="ring" id="ring"></div></div></div>
 <div class="open" id="close"><div class="l" id="c1">Seven coaches.<br>One plan that changes.</div></div>
 <div class="end" id="end"><div>
   <div class="wordmark">Intent<b>North</b></div>
   <div class="tag">Become who you intend to be.</div>
   <div class="cta">__CTA__</div>
 </div></div>
 <div class="rail"><i id="rail"></i></div>
</div>
"""

JS = r"""
const $=(id)=>document.getElementById(id), wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const on=(e,c='in')=>e.classList.add(c), off=(e,c='in')=>e.classList.remove(c);
const shot=(n)=>{document.querySelectorAll('#screen img').forEach(i=>i.classList.remove('show'));
  const el=document.querySelector(`#screen img[data-n="${n}"]`); if(el)el.classList.add('show');};
const TOTAL=44000; $('rail').style.transition=`width ${TOTAL}ms linear`;

function pills(items){ $('pl').innerHTML=items.map(t=>`<span class="pill${t.hot?' hot':''}">${t.t||t}</span>`).join(''); }
function spec(rows){ $('sp').innerHTML=rows.map(r=>`<div class="row"><span class="n">${r[0]}</span><span class="v">${r[1]}</span></div>`).join(''); }
async function reveal(sel,step=110){ const els=[...document.querySelectorAll(sel)];
  for(const e of els){ on(e); await wait(step);} }
function clearAll(){ ['pl','sp','qt'].forEach(id=>{$(id).innerHTML='';off($(id));}); }

async function beat(o){
  $('eb').textContent=o.eyebrow; $('ln').innerHTML=o.line; $('sb').innerHTML=o.sub||'';
  if(o.img) shot(o.img);
  on($('eb')); await wait(130); on($('ln')); await wait(180); if(o.sub) on($('sb'));
  if(o.pills){ pills(o.pills); await wait(260); await reveal('#pl .pill',95); }
  if(o.spec){ spec(o.spec); await wait(260); await reveal('#sp .row',115); }
  if(o.quote){ $('qt').innerHTML=`<div class="qlabel">${o.qlabel||'On screen, verbatim'}</div>${o.quote}`;
    await wait(280); on($('qt')); }
  if(o.ring) { const r=$('ring');
    r.style.top=o.ring.top+'px'; r.style.height=o.ring.h+'px';
    await wait(320); on(r); }
  await wait(o.hold||2800);
  $('copy').classList.add('hide'); off($('ring'));
  await wait(420);
  off($('eb')); off($('ln')); off($('sb')); off($('qt')); clearAll();
  $('copy').classList.remove('hide');
  await wait(120);
}

(async()=>{
 await wait(400); $('rail').style.width='100%';
 // Arithmetic, not motivation. The film's thesis is that a day is finite,
 // which is the only problem IntentNorth is uniquely able to solve.
 on($('o1')); await wait(1700); $('o1').classList.add('bumped'); await wait(220);
 on($('o2')); await wait(1700); $('o2').classList.add('bumped'); await wait(220);
 $('o3').classList.add('win'); on($('o3')); await wait(2100);
 $('o3').classList.remove('in'); $('o3').classList.add('bumped');
 await wait(600); $('open').style.display='none';

 shot('training'); on($('phone'));

 // The spine is the coaching, not the calendar. Every beat here is a thing
 // a good coach does; the week-shaping arrives at the end as the small
 // layer that assembles them, which is what it actually is.
 await beat({eyebrow:'It asks first',
  line:'A programme,<br>not a plan you found.',
  sub:'Every answer changes what gets built. Nothing here is decoration.',
  spec:[['Where are you starting from?','fresh · returning · consistent'],
        ['What usually kills it?','no time · no energy · boredom'],
        ['Anything you are managing?','joints · heart · pregnancy · recovering']],
  img:'training', hold:3300});

 await beat({eyebrow:'Then it builds',
  line:'Sets, reps, rest<br>and load. Decided.',
  sub:'Sized to the days you actually have, before you walk in.',
  spec:[['Deadlift','3\u20136 \u00b7 rest 150s'],
        ['Overhead press','6\u201310 \u00b7 rest 90s'],
        ['Lat pulldown','8\u201312 \u00b7 rest 90s'],
        ['Core: plank','45 sec']],
  img:'workout', hold:3100});

 await beat({eyebrow:'And it shows its working',
  line:'Where it got that,<br>and where it stops.',
  sub:'Distilled in its own words from public teaching. Every practice carries a source, an evidence grade and its limits.',
  pills:['Ferriss','Huberman','Attia','Rhonda Patrick','Peterson','Sinclair'],
  img:'library', hold:3300});

 await beat({eyebrow:'It changes when you change',
  line:'Last night<br>changed today.',
  sub:'Heart-rate variability and resting heart rate against your own baseline \u2014 never a population band.',
  quote:'Your own recovery numbers are down this morning \u2014 <em>main work stays, accessories rest today</em>.',
  qlabel:'The programme\u2019s own words',
  img:'workout', hold:3600});

 await beat({eyebrow:'You set the dose',
  line:'Both directions,<br>always.',
  sub:'It never quietly decides you are struggling, and it never leaves you bored. You say, and the block rebuilds.',
  img:'dose', ring:{top:528,h:28}, hold:3300});

 await beat({eyebrow:'Habits and urges',
  line:'Not willpower.<br>Engineering.',
  quote:'Name the moment the urge usually wins, and put a <em>rehearsed answer in that exact window</em>.',
  img:'recovery', hold:3300});

 await beat({eyebrow:'And only then, the week',
  line:'It fits into<br>the days you have.',
  sub:'The last, small layer \u2014 after the seven coaches have decided what is worth doing.',
  img:'today', hold:2600});

 $('phone').classList.remove('in'); await wait(600);
 on($('c1')); await wait(2600); $('c1').classList.add('bumped'); await wait(600);
 $('close').style.display='none';
 on($('end')); await wait(3600);
})();
"""

imgs = "\n".join(f'<img data-n="{k}" src="data:image/png;base64,{v}">' for k,v in IMG.items())
html = ("<!doctype html><html><head><meta charset='utf-8'><style>" + CSS + "</style></head><body>"
        + BODY.replace('__IMGS__', imgs).replace('__CTA__', CTA) + "<script>" + JS + "</script></body></html>")
pathlib.Path('film5.html').write_text(html)
print('film5.html', round(pathlib.Path('film5.html').stat().st_size/1e6,2), 'MB')
