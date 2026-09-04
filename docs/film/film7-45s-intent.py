"""The hero film, per docs/FILM_BRIEF.md: one phone, three chapters,
nothing on the phone that is not the app.

Writes film7.html at 1920x1080. Screens come from SHOTS (a directory of
PNGs captured at 420x900 / 420x2400 CSS px, 3x) and are inlined as data
URIs, so the file is self-contained and the recorder needs no server.

  SHOTS=/path/to/shots python3 film7-45s-intent.py
"""
import base64, os, pathlib

SHOTS = pathlib.Path(os.environ.get('SHOTS', 'shots'))
def b64(n):
    # JPEG at 2x the displayed width is preferred: a fifth of the bytes of the
    # PNG capture, which is what keeps the page's parse and decode short.
    for ext, mime in (('jpg', 'image/jpeg'), ('png', 'image/png')):
        p = SHOTS / f'{n}.{ext}'
        if p.exists():
            return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
    raise FileNotFoundError(n)

NAMES = ['today-before', 'lib-top', 'lib-tall', 'lib-card', 'lib-card-added', 'today-tall',
         'workout', 'workout-autoreg', 'coaches', 'coaches-tall',
         'hub-training', 'hub-nutrition', 'hub-money', 'hub-work', 'hub-recovery',
         'hub-relationship', 'hub-family',
         'level-training', 'level-nutrition', 'level-money', 'level-work', 'level-recovery',
         'level-relationship', 'level-family']
IMG = {n: b64(n) for n in NAMES}
CTA = 'intentnorth.app'

CSS = """
:root{--paper:#f4f1e9;--paper2:#e9e5da;--ink:#111512;--soft:#263029;--muted:#59635b;
 --green:#4c6353;--sage:#c7d2c3;--ember:#ab5f40;
 --display:"Iowan Old Style","Palatino Linotype","Bitstream Charter",Charter,Georgia,serif;
 --ui:"DejaVu Sans","Liberation Sans",system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden;background:var(--paper)}
body{font-family:var(--ui);color:var(--ink)}
.stage{position:relative;width:1920px;height:1080px;overflow:hidden;background:
 radial-gradient(1100px 800px at 72% 50%,rgba(199,210,195,.35),transparent 65%),var(--paper)}
.brand{position:absolute;left:96px;top:64px;font-family:var(--display);font-size:26px;letter-spacing:-.02em;color:var(--soft)}
.brand b{font-weight:400;color:var(--green)}

.copy{position:absolute;left:96px;top:0;height:1080px;width:760px;display:flex;flex-direction:column;justify-content:center}
.chap{display:flex;align-items:baseline;gap:18px;margin-bottom:22px;opacity:0;transform:translateY(14px);transition:all .6s cubic-bezier(.2,.8,.2,1)}
.chap.in{opacity:1;transform:none}
.chap .n{font:400 15px/1 var(--ui);color:var(--ember);letter-spacing:.18em}
.chap .t{font:400 14px/1.3 var(--ui);letter-spacing:.2em;text-transform:uppercase;color:var(--green)}
.line{font-family:var(--display);font-size:66px;line-height:1.06;letter-spacing:-.02em;color:var(--ink);max-width:720px;
 opacity:0;transform:translateY(18px);transition:all .75s cubic-bezier(.2,.8,.2,1)}
.line.in{opacity:1;transform:none}
.sub{font:400 22px/1.5 var(--ui);color:var(--muted);margin-top:22px;max-width:560px;
 opacity:0;transform:translateY(14px);transition:all .7s cubic-bezier(.2,.8,.2,1)}
.sub.in{opacity:1;transform:none}
.quote{margin-top:26px;border-left:3px solid var(--green);padding:4px 0 4px 22px;max-width:600px;
 font-family:var(--display);font-size:30px;line-height:1.32;color:var(--soft);
 opacity:0;transform:translateY(14px);transition:all .7s cubic-bezier(.2,.8,.2,1)}
.quote.in{opacity:1;transform:none}
.quote em{font-style:normal;color:var(--green)}
.qlabel{font:400 12px/1 var(--ui);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
.copy.out .chap,.copy.out .line,.copy.out .sub,.copy.out .quote,.copy.out .coachlist{opacity:0;transition:opacity .32s ease}

.coachlist{margin-top:26px;display:grid;grid-template-columns:1fr;gap:6px;max-width:720px}
.coach{display:grid;grid-template-columns:270px 1fr;gap:20px;align-items:baseline;padding:11px 0;border-bottom:1px solid rgba(17,21,18,.08);
 opacity:.3;transition:opacity .35s ease}
.coach .cn{font-family:var(--display);font-size:32px;letter-spacing:-.01em;color:var(--ink)}
.coach .cp{font:400 19px/1.4 var(--ui);color:var(--muted)}
.coach.on{opacity:1}
.coach.on .cn{color:var(--green)}

.phone{position:absolute;left:1190px;top:50%;transform:translateY(-50%) translateY(60px);width:404px;height:870px;
 border-radius:60px;padding:12px;background:linear-gradient(165deg,#2a3230,#0f1412);
 box-shadow:0 60px 120px -40px rgba(17,21,18,.45),0 0 0 1px rgba(17,21,18,.08);
 opacity:0;transition:opacity .7s ease,transform 1.1s cubic-bezier(.2,.8,.2,1)}
.phone.in{opacity:1;transform:translateY(-50%)}
.screen{width:380px;height:846px;border-radius:48px;overflow:hidden;position:relative;background:#F7F5F1}
.screen img{position:absolute;left:0;top:0;width:380px;opacity:0;transition:opacity .4s ease,transform 0s linear;will-change:transform}
.screen img.show{opacity:1}
.tap{position:absolute;width:36px;height:36px;border-radius:50%;border:3px solid var(--green);left:0;top:0;
 transform:translate(-50%,-50%) scale(.3);opacity:0;pointer-events:none}
.tap.go{animation:tap .9s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes tap{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}25%{opacity:.9}100%{opacity:0;transform:translate(-50%,-50%) scale(2.6)}}
.ring{position:absolute;left:10px;right:10px;border-radius:16px;border:2.5px solid var(--green);box-shadow:0 0 0 6px rgba(76,99,83,.14);
 opacity:0;transition:opacity .5s ease}
.ring.in{opacity:1}
.wipe{position:absolute;left:0;right:0;top:0;height:100%;pointer-events:none;
 background:linear-gradient(to bottom,rgba(247,245,241,0) 0%,#F7F5F1 14%);transform:translateY(0);}
.wipe.go{transition:transform 3.2s cubic-bezier(.4,.1,.2,1);transform:translateY(105%)}
.wipe.off{display:none}
.under{position:absolute;left:1120px;width:544px;top:1000px;text-align:center;font:400 14px/1.4 var(--ui);color:var(--muted);
 opacity:0;transition:opacity .5s ease}
.under.in{opacity:1}

.end{position:absolute;inset:0;background:var(--paper);display:grid;place-items:center;text-align:center;opacity:0;transition:opacity .9s ease}
.end.in{opacity:1}
.end .wm{font-family:var(--display);font-size:104px;letter-spacing:-.025em;color:var(--ink)}
.end .wm b{font-weight:400;color:var(--green)}
.end .tag{font-family:var(--display);font-size:34px;color:var(--soft);margin-top:14px}
.end .cta{margin-top:40px;display:inline-block;border:1.5px solid var(--green);border-radius:999px;padding:16px 38px;
 font:400 22px/1 var(--ui);color:var(--green)}
.end .fine{font:400 16px/1.6 var(--ui);color:var(--muted);margin-top:44px;max-width:760px}
.rail{position:absolute;left:0;bottom:0;height:3px;width:100%;background:rgba(17,21,18,.06)}
.rail i{display:block;height:100%;width:0;background:var(--green)}
"""

BODY = """
<div class="stage">
 <div class="brand">Intent<b>North</b></div>
 <div class="copy" id="copy">
  <div class="chap" id="chap"><span class="n" id="cn"></span><span class="t" id="ct"></span></div>
  <div class="line" id="line"></div>
  <div class="sub" id="sub"></div>
  <div class="quote" id="quote"></div>
  <div class="coachlist" id="coaches"></div>
 </div>
 <div class="phone" id="phone"><div class="screen" id="screen">__IMGS__<div class="wipe off" id="wipe"></div><div class="ring" id="ring"></div><div class="tap" id="tap"></div></div></div>
 <div class="under" id="under"></div>
 <div class="end" id="end"><div>
   <div class="wm">Intent<b>North</b></div>
   <div class="tag">Seven coaches. One profile. Built with intent.</div>
   <div class="cta">__CTA__</div>
   <div class="fine">Australian-developed. Nothing you enter leaves your phone.<br>Education and structured planning, not medical, psychological or financial advice.</div>
 </div></div>
 <div class="rail"><i id="rail"></i></div>
</div>
"""

JS = r"""
const $=(id)=>document.getElementById(id), wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const on=(e,c='in')=>e.classList.add(c), off=(e,c='in')=>e.classList.remove(c);
const TOTAL=46000; $('rail').style.transition=`width ${TOTAL}ms linear`;
let current=null;
function show(n,{y=0,pan=null,dur=0}={}){
  document.querySelectorAll('#screen img').forEach(i=>{ if(i.dataset.n!==n) i.classList.remove('show'); });
  const el=document.querySelector(`#screen img[data-n="${n}"]`);
  el.style.transition='opacity .4s ease, transform 0s linear'; el.style.transform=`translateY(${y}px)`;
  el.classList.add('show'); current=el;
  if(pan!==null){ requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.style.transition=`opacity .4s ease, transform ${dur}ms linear`; el.style.transform=`translateY(${pan}px)`; })); }
}
function panTo(y,dur,ease='linear'){ current.style.transition=`opacity .4s ease, transform ${dur}ms ${ease}`; current.style.transform=`translateY(${y}px)`; }
async function copy({chap,title,line,sub,quote,qlabel}={}){
  const c=$('copy'); c.classList.add('out'); await wait(340);
  ['chap','line','sub','quote'].forEach(id=>off($(id))); $('coaches').innerHTML=''; c.classList.remove('out');
  if(chap){ $('cn').textContent=chap; $('ct').textContent=title; }
  $('line').innerHTML=line||''; $('sub').innerHTML=sub||'';
  $('quote').innerHTML=quote?`<div class="qlabel">${qlabel||'The app’s own words'}</div>${quote}`:'';
  if(chap){ on($('chap')); await wait(140); }
  if(line){ on($('line')); await wait(160); }
  if(sub) on($('sub'));
  if(quote){ await wait(200); on($('quote')); }
}
async function tapAt(xPct,yPct){ const t=$('tap'); t.style.left=xPct+'%'; t.style.top=yPct+'%'; t.classList.remove('go'); void t.offsetWidth; t.classList.add('go'); await wait(650); }
function ring(topPct,hPct){ const r=$('ring'); r.style.top=topPct+'%'; r.style.height=hPct+'%'; on(r); }
const COACHES=[
 ['hub-training','Training','Sets, reps, rest and load. Decided.'],
 ['hub-nutrition','Nutrition','No diet, no logging. Your own protein number.'],
 ['hub-money','Money','Automation first. The goal paid before the month starts.'],
 ['hub-work','Work &amp; leadership','Protected thinking time. A review that changes next week.'],
 ['hub-recovery','Habits &amp; urges','Not willpower. Engineering.'],
 ['hub-relationship','Relationship','Small, repeatable attention.'],
 ['hub-family','Family &amp; adventure','The weekend that actually happens.'],
];

(async()=>{
 // Decode every screen before the clock starts, so no beat stalls on a
 // decode; then tell the recorder the timeline has begun.
 await Promise.all([...document.querySelectorAll('#screen img')].map(i=>i.decode().catch(()=>{})));
 document.title='GO';
 await wait(300); $('rail').style.width='100%';
 // 0.0–2.6 product first
 show('today-before'); on($('phone'));
 await copy({line:'A week built<br>with intent.'});
 await wait(2000);

 // 01 protocols
 show('lib-top');
 await copy({chap:'01',title:'Proven protocols, synthesised and rated',line:'177 practices.<br>Graded A to E.',sub:'Every one credited to the public work behind it.'});
 $('under').textContent='Attribution credits public work and implies no endorsement of IntentNorth.'; on($('under'));
 await wait(1800);
 // pan the tall library: image is 2400 css tall at 420 wide → 2171px at 380 wide
 show('lib-tall',{y:0,pan:-620,dur:4200});
 await copy({chap:'01',title:'Proven protocols, synthesised and rated',line:'Where it came from.<br>How good the evidence is.<br>Where it stops.'});
 await wait(2300);
 await copy({chap:'01',title:'Proven protocols, synthesised and rated',line:'145 carry a<br>plain-words safety line.'});
 await wait(2000);
 // choose one
 show('lib-card');
 await copy({chap:'01',title:'Proven protocols, synthesised and rated',line:'One tap.<br>It is in your week.'});
 await wait(700); await tapAt(50,29.7); await wait(120);
 show('lib-card-added'); await wait(2200);
 off($('under'));

 // 02 living program
 show('today-tall'); const w=$('wipe'); w.classList.remove('off'); w.classList.remove('go'); void w.offsetWidth;
 await copy({chap:'02',title:'Programs that live with you',line:'Placed into the days<br>you actually have.'});
 w.classList.add('go'); await wait(2600); w.classList.add('off');
 ring(10.4,10.2);
 await copy({chap:'02',title:'Programs that live with you',line:'It moves when<br>your day moves.',quote:'“Name one thing moved to 8:50pm — <em>health had the hour it wanted</em>, and that is the order you set.”'});
 await wait(3600); off($('ring'));
 show('workout');
 await copy({chap:'02',title:'Programs that live with you',line:'A short night<br>changed today’s session.'});
 await wait(900); await tapAt(31,13.8); await wait(100); show('workout-autoreg'); ring(6.2,4.6);
 await wait(2600); off($('ring'));
 show('today-tall',{y:-300,pan:-1150,dur:2400});
 await copy({chap:'02',title:'Programs that live with you',line:'And it tells you why.',sub:'Every line on the day carries its reason.'});
 await wait(2400);

 // 03 seven coaches
 show('coaches');
 await copy({chap:'03',title:'Seven coaches that build your life with intent',line:'One profile.<br>Seven programs.'});
 await wait(1900);
 const c=$('copy'); c.classList.add('out'); await wait(320); ['line','sub','quote'].forEach(id=>off($(id))); $('line').innerHTML=''; $('sub').innerHTML=''; c.classList.remove('out');
 $('coaches').innerHTML=COACHES.map(([,n,p],i)=>`<div class="coach" id="c${i}"><span class="cn">${n}</span><span class="cp">${p}</span></div>`).join('');
 for(let i=0;i<COACHES.length;i++){
   const [img]=COACHES[i];
   document.querySelectorAll('.coach').forEach(e=>e.classList.remove('on')); on($('c'+i),'on');
   // The hub's name first, then its level card: where you are, and the ladder.
   show(img,{y:0,pan:-90,dur:700}); await wait(700);
   show(img.replace('hub-','level-')); await wait(950);
 }
 show('coaches-tall',{y:-560,pan:-760,dur:2200});
 await copy({chap:'03',title:'Seven coaches that build your life with intent',line:'Each with a level you earn<br>and a ladder you climb.'});
 await wait(2500);

 // end
 on($('end')); await wait(3800);
})();
"""

imgs = "\n".join(f'<img data-n="{k}" src="{v}">' for k, v in IMG.items())
html = ("<!doctype html><html><head><meta charset='utf-8'><style>" + CSS + "</style></head><body>"
        + BODY.replace('__IMGS__', imgs).replace('__CTA__', CTA) + "<script>" + JS + "</script></body></html>")
out = pathlib.Path(os.environ.get('OUT', 'film7.html'))
out.write_text(html)
print(out, round(out.stat().st_size / 1e6, 1), 'MB')
