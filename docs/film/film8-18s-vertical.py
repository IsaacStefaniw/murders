"""The 9:16 social cut, per docs/FILM_BRIEF.md §6: the same three chapters
at feed speed. Copy above, phone below, nothing on the phone that is not
the app. Writes film8.html at 1080x1920.

  SHOTS=/path/to/shots python3 film8-18s-vertical.py
"""
import base64, os, pathlib

SHOTS = pathlib.Path(os.environ.get('SHOTS', 'shots'))
def b64(n):
    for ext, mime in (('jpg', 'image/jpeg'), ('png', 'image/png')):
        p = SHOTS / f'{n}.{ext}'
        if p.exists():
            return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
    raise FileNotFoundError(n)

NAMES = ['today-before', 'lib-card', 'lib-card-added', 'workout', 'workout-autoreg', 'coaches',
         'level-training', 'level-nutrition', 'level-money', 'level-work', 'level-recovery',
         'level-relationship', 'level-family']
IMG = {n: b64(n) for n in NAMES}
CTA = 'intentnorth.app'

CSS = """
:root{--paper:#f4f1e9;--ink:#111512;--soft:#263029;--muted:#59635b;--green:#4c6353;--ember:#ab5f40;
 --display:"Iowan Old Style","Palatino Linotype","Bitstream Charter",Charter,Georgia,serif;
 --ui:"DejaVu Sans","Liberation Sans",system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:var(--paper)}
body{font-family:var(--ui);color:var(--ink)}
.stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:
 radial-gradient(900px 900px at 50% 68%,rgba(199,210,195,.38),transparent 66%),var(--paper)}
.brand{position:absolute;left:72px;top:84px;font-family:var(--display);font-size:34px;letter-spacing:-.02em;color:var(--soft)}
.brand b{font-weight:400;color:var(--green)}
.copy{position:absolute;left:72px;right:72px;top:210px;height:520px}
.chap{display:flex;align-items:baseline;gap:18px;margin-bottom:22px;opacity:0;transform:translateY(14px);transition:all .5s cubic-bezier(.2,.8,.2,1)}
.chap.in{opacity:1;transform:none}
.chap .n{font:400 20px/1 var(--ui);color:var(--ember);letter-spacing:.18em}
.chap .t{font:400 18px/1.3 var(--ui);letter-spacing:.18em;text-transform:uppercase;color:var(--green)}
.line{font-family:var(--display);font-size:82px;line-height:1.04;letter-spacing:-.02em;color:var(--ink);
 opacity:0;transform:translateY(18px);transition:all .6s cubic-bezier(.2,.8,.2,1)}
.line.in{opacity:1;transform:none}
.sub{font:400 28px/1.45 var(--ui);color:var(--muted);margin-top:22px;opacity:0;transform:translateY(12px);transition:all .55s cubic-bezier(.2,.8,.2,1)}
.sub.in{opacity:1;transform:none}
.copy.out .chap,.copy.out .line,.copy.out .sub{opacity:0;transition:opacity .28s ease}
.phone{position:absolute;left:50%;top:790px;transform:translateX(-50%) translateY(50px);width:604px;height:1300px;
 border-radius:84px;padding:16px;background:linear-gradient(165deg,#2a3230,#0f1412);
 box-shadow:0 60px 120px -40px rgba(17,21,18,.45),0 0 0 1px rgba(17,21,18,.08);
 opacity:0;transition:opacity .6s ease,transform .9s cubic-bezier(.2,.8,.2,1)}
.phone.in{opacity:1;transform:translateX(-50%)}
.screen{width:572px;height:1268px;border-radius:68px;overflow:hidden;position:relative;background:#F7F5F1}
.screen img{position:absolute;left:0;top:0;width:572px;opacity:0;transition:opacity .35s ease}
.screen img.show{opacity:1}
.tap{position:absolute;width:52px;height:52px;border-radius:50%;border:4px solid var(--green);left:0;top:0;
 transform:translate(-50%,-50%) scale(.3);opacity:0}
.tap.go{animation:tap .9s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes tap{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}25%{opacity:.9}100%{opacity:0;transform:translate(-50%,-50%) scale(2.6)}}
.ring{position:absolute;left:14px;right:14px;border-radius:22px;border:3px solid var(--green);box-shadow:0 0 0 8px rgba(76,99,83,.14);opacity:0;transition:opacity .4s ease}
.ring.in{opacity:1}
.under{position:absolute;left:72px;right:72px;bottom:44px;text-align:center;font:400 19px/1.4 var(--ui);color:var(--muted);opacity:0;transition:opacity .4s ease}
.under.in{opacity:1}
.end{position:absolute;inset:0;background:var(--paper);display:grid;place-items:center;text-align:center;opacity:0;transition:opacity .8s ease}
.end.in{opacity:1}
.end .wm{font-family:var(--display);font-size:118px;letter-spacing:-.025em;color:var(--ink)}
.end .wm b{font-weight:400;color:var(--green)}
.end .tag{font-family:var(--display);font-size:40px;color:var(--soft);margin-top:18px;max-width:820px;line-height:1.2}
.end .cta{margin-top:44px;display:inline-block;border:2px solid var(--green);border-radius:999px;padding:20px 44px;font:400 28px/1 var(--ui);color:var(--green)}
.end .fine{font:400 20px/1.6 var(--ui);color:var(--muted);margin-top:52px;max-width:860px}
.rail{position:absolute;left:0;bottom:0;height:4px;width:100%;background:rgba(17,21,18,.06)}
.rail i{display:block;height:100%;width:0;background:var(--green)}
"""

BODY = """
<div class="stage">
 <div class="brand">Intent<b>North</b></div>
 <div class="copy" id="copy">
  <div class="chap" id="chap"><span class="n" id="cn"></span><span class="t" id="ct"></span></div>
  <div class="line" id="line"></div>
  <div class="sub" id="sub"></div>
 </div>
 <div class="phone" id="phone"><div class="screen" id="screen">__IMGS__<div class="ring" id="ring"></div><div class="tap" id="tap"></div></div></div>
 <div class="under" id="under"></div>
 <div class="end" id="end"><div>
   <div class="wm">Intent<b>North</b></div>
   <div class="tag">Seven coaches. One profile.<br>Built with intent.</div>
   <div class="cta">__CTA__</div>
   <div class="fine">Australian-developed. Nothing you enter leaves your phone.<br>Education and structured planning, not medical, psychological or financial advice.</div>
 </div></div>
 <div class="rail"><i id="rail"></i></div>
</div>
"""

JS = r"""
const $=(id)=>document.getElementById(id), wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const on=(e,c='in')=>e.classList.add(c), off=(e,c='in')=>e.classList.remove(c);
const TOTAL=18500; $('rail').style.transition=`width ${TOTAL}ms linear`;
function show(n){ document.querySelectorAll('#screen img').forEach(i=>i.classList.toggle('show',i.dataset.n===n)); }
async function copy({chap,title,line,sub}={}){
  const c=$('copy'); c.classList.add('out'); await wait(280);
  ['chap','line','sub'].forEach(id=>off($(id))); c.classList.remove('out');
  if(chap){ $('cn').textContent=chap; $('ct').textContent=title; }
  $('line').innerHTML=line||''; $('sub').innerHTML=sub||'';
  if(chap){ on($('chap')); await wait(110); }
  on($('line')); await wait(140); if(sub) on($('sub'));
}
async function tapAt(x,y){ const t=$('tap'); t.style.left=x+'%'; t.style.top=y+'%'; t.classList.remove('go'); void t.offsetWidth; t.classList.add('go'); await wait(600); }
function ring(top,h){ const r=$('ring'); r.style.top=top+'%'; r.style.height=h+'%'; on(r); }
(async()=>{
 await Promise.all([...document.querySelectorAll('#screen img')].map(i=>i.decode().catch(()=>{})));
 document.title='GO';
 await wait(250); $('rail').style.width='100%';
 show('today-before'); on($('phone'));
 await copy({line:'A week built<br>with intent.'}); await wait(1500);

 show('lib-card');
 await copy({chap:'01',title:'Proven protocols, rated',line:'177 practices.<br>Graded A to E.',sub:'One tap and it is in your week.'});
 $('under').textContent='Attribution credits public work and implies no endorsement of IntentNorth.'; on($('under'));
 await wait(1100); await tapAt(50,29.7); await wait(120); show('lib-card-added'); await wait(1500); off($('under'));

 show('workout');
 await copy({chap:'02',title:'Programs that live with you',line:'A short night<br>changed today’s session.'});
 await wait(900); await tapAt(31,13.8); await wait(100); show('workout-autoreg'); ring(6.2,4.6); await wait(2200); off($('ring'));

 show('coaches');
 await copy({chap:'03',title:'Seven coaches, one profile',line:'Built with intent.',sub:'Training · Nutrition · Money · Work · Habits &amp; urges · Relationship · Family'});
 await wait(1200);
 for(const n of ['training','nutrition','money','work','recovery','relationship','family']){ show('level-'+n); await wait(520); }
 await wait(300);
 on($('end')); await wait(3200);
})();
"""

imgs = "\n".join(f'<img data-n="{k}" src="{v}">' for k, v in IMG.items())
html = ("<!doctype html><html><head><meta charset='utf-8'><style>" + CSS + "</style></head><body>"
        + BODY.replace('__IMGS__', imgs).replace('__CTA__', CTA) + "<script>" + JS + "</script></body></html>")
out = pathlib.Path(os.environ.get('OUT', 'film8.html'))
out.write_text(html)
print(out, round(out.stat().st_size / 1e6, 1), 'MB')
