"""The fifty-second film, per docs/PROBLEM_STATEMENT.md.

The problem is the one everyone recognises: you hear the advice, think it
is brilliant, and by Tuesday it is gone, because nobody researches it,
writes it down and puts it into their week. Then the app, one idea per
beat, one readable line per screen, the rest dimmed. No counts; the
evidence grading instead. Nothing on the phone that is not the app.

  MODE=landscape SHOTS=/path OUT=film10.html  python3 film10-50s-heard-it.py   # 1920x1080
  MODE=vertical  SHOTS=/path OUT=film10v.html python3 film10-50s-heard-it.py   # 1080x1920
"""
import base64, os, pathlib

MODE = os.environ.get('MODE', 'landscape')
SHOTS = pathlib.Path(os.environ.get('SHOTS', 'shots'))
def img(n):
    for ext, mime in (('jpg', 'image/jpeg'), ('png', 'image/png')):
        p = SHOTS / f'{n}.{ext}'
        if p.exists():
            return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
    raise SystemExit(f'missing shot {n}')

NAMES = ['today-before', 'int-2', 'int-3', 'int-4', 'int-5', 'coaches-tall',
         'workout', 'workout-autoreg', 'lib-card', 'lib-card-added', 'level-training']
IMG = {n: img(n) for n in NAMES}
L = MODE == 'landscape'
W, H = (1920, 1080) if L else (1080, 1920)
PW = 404 if L else 604            # phone outer width
SW = 380 if L else 572            # screen width
SH = int(SW * 900 / 420)          # screen height
PH = SH + 24 if L else SH + 32

CSS = f"""
:root{{--paper:#f4f1e9;--ink:#111512;--soft:#263029;--muted:#59635b;--green:#4c6353;
 --display:"Iowan Old Style","Palatino Linotype","Bitstream Charter",Charter,Georgia,serif;
 --ui:"DejaVu Sans","Liberation Sans",system-ui,sans-serif}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:var(--paper)}}
body{{font-family:var(--ui);color:var(--ink)}}
.stage{{position:relative;width:{W}px;height:{H}px;overflow:hidden;background:
 radial-gradient({'1100px 800px at 72% 50%' if L else '900px 900px at 50% 68%'},rgba(199,210,195,.35),transparent 65%),var(--paper)}}
.brand{{position:absolute;left:{96 if L else 72}px;top:{64 if L else 84}px;font-family:var(--display);font-size:{26 if L else 34}px;letter-spacing:-.02em;color:var(--soft)}}
.brand b{{font-weight:400;color:var(--green)}}
.open{{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:{'0 96px' if L else '0 72px'};gap:{10 if L else 14}px}}
.open .l{{font-family:var(--display);font-size:{60 if L else 66}px;line-height:1.08;letter-spacing:-.02em;color:var(--ink);opacity:0;transform:translateY(14px);transition:all .45s cubic-bezier(.2,.8,.2,1)}}
.open .l.in{{opacity:1;transform:none}}
.open .l.k{{color:var(--green);margin-top:{22 if L else 26}px}}
.open.out{{opacity:0;transition:opacity .4s ease}}
.copy{{position:absolute;left:{96 if L else 72}px;{'top:0;height:1080px;width:800px;display:flex;flex-direction:column;justify-content:center' if L else 'right:72px;top:210px;height:520px'}}}
.line{{font-family:var(--display);font-size:{62 if L else 78}px;line-height:1.08;letter-spacing:-.02em;color:var(--ink);max-width:{760 if L else 936}px;
 opacity:0;transform:translateY(18px);transition:all .6s cubic-bezier(.2,.8,.2,1)}}
.line.in{{opacity:1;transform:none}}
.line em{{font-style:normal;color:var(--green)}}
.copy.out .line{{opacity:0;transition:opacity .28s ease}}
.phone{{position:absolute;{'left:1190px;top:50%;transform:translateY(-50%) translateY(60px)' if L else 'left:50%;top:790px;transform:translateX(-50%) translateY(50px)'};width:{PW}px;height:{PH}px;
 border-radius:{60 if L else 84}px;padding:{12 if L else 16}px;background:linear-gradient(165deg,#2a3230,#0f1412);
 box-shadow:0 60px 120px -40px rgba(17,21,18,.45),0 0 0 1px rgba(17,21,18,.08);
 opacity:0;transition:opacity .6s ease,transform .9s cubic-bezier(.2,.8,.2,1)}}
.phone.in{{opacity:1;transform:{'translateY(-50%)' if L else 'translateX(-50%)'}}}
.screen{{width:{SW}px;height:{SH}px;border-radius:{48 if L else 68}px;overflow:hidden;position:relative;background:#F7F5F1}}
.screen img{{position:absolute;left:0;top:0;width:{SW}px;opacity:0;transition:opacity .3s ease,transform 0s linear}}
.screen img.show{{opacity:1}}
.focus{{position:absolute;left:{10 if L else 14}px;right:{10 if L else 14}px;border-radius:{14 if L else 20}px;border:{2.5 if L else 3}px solid var(--green);
 box-shadow:0 0 0 3000px rgba(247,245,241,.62);opacity:0;transition:opacity .45s ease;pointer-events:none}}
.focus.in{{opacity:1}}
.tap{{position:absolute;width:{36 if L else 52}px;height:{36 if L else 52}px;border-radius:50%;border:{3 if L else 4}px solid var(--green);left:0;top:0;transform:translate(-50%,-50%) scale(.3);opacity:0}}
.tap.go{{animation:tap .8s cubic-bezier(.2,.8,.2,1) forwards}}
@keyframes tap{{0%{{opacity:0;transform:translate(-50%,-50%) scale(.3)}}25%{{opacity:.9}}100%{{opacity:0;transform:translate(-50%,-50%) scale(2.6)}}}}
.under{{position:absolute;{'left:1120px;width:544px;top:1000px' if L else 'left:72px;right:72px;bottom:44px'};text-align:center;font:400 {14 if L else 19}px/1.4 var(--ui);color:var(--muted);opacity:0;transition:opacity .4s ease}}
.under.in{{opacity:1}}
.end{{position:absolute;inset:0;background:var(--paper);display:grid;place-items:center;text-align:center;opacity:0;transition:opacity .8s ease}}
.end.in{{opacity:1}}
.end .wm{{font-family:var(--display);font-size:{96 if L else 112}px;letter-spacing:-.025em;color:var(--ink)}}
.end .wm b{{font-weight:400;color:var(--green)}}
.end .tag{{font-family:var(--display);font-size:{40 if L else 46}px;color:var(--ink);margin-top:{18 if L else 22}px;line-height:1.2;max-width:{900 if L else 900}px}}
.end .sub{{font:400 {24 if L else 28}px/1.5 var(--ui);color:var(--soft);margin-top:{22 if L else 26}px}}
.end .cta{{margin-top:{36 if L else 44}px;display:inline-block;border:1.5px solid var(--green);border-radius:999px;padding:{'16px 38px' if L else '20px 44px'};font:400 {22 if L else 28}px/1 var(--ui);color:var(--green)}}
.end .fine{{font:400 {15 if L else 19}px/1.6 var(--ui);color:var(--muted);margin-top:{40 if L else 52}px;max-width:{760 if L else 860}px}}
.rail{{position:absolute;left:0;bottom:0;height:3px;width:100%;background:rgba(17,21,18,.06)}}
.rail i{{display:block;height:100%;width:0;background:var(--green)}}
"""

BODY = """
<div class="stage">
 <div class="brand">Intent<b>North</b></div>
 <div class="open" id="open">
  <div class="l" id="o1">You hear it on a podcast.</div>
  <div class="l" id="o2">Morning light. Protein first. A walk after dinner.</div>
  <div class="l" id="o3">You think: that’s brilliant.</div>
  <div class="l k" id="o4">Then Tuesday happens, and it’s gone.</div>
  <div class="l" id="o5" style="margin-top:22px">Nobody researches it, writes it down and puts it into their week.</div>
  <div class="l k" id="o6">So it never happens.</div>
 </div>
 <div class="copy" id="copy"><div class="line" id="line"></div></div>
 <div class="phone" id="phone"><div class="screen" id="screen">__IMGS__<div class="focus" id="focus"></div><div class="tap" id="tap"></div></div></div>
 <div class="under" id="under"></div>
 <div class="end" id="end"><div>
   <div class="wm">Intent<b>North</b></div>
   <div class="tag">What you’d do if someone did the research for you.</div>
   <div class="sub">Free to start. Nothing you enter leaves your phone.</div>
   <div class="cta">For iPhone &nbsp;·&nbsp; intentnorth.app</div>
   <div class="fine">Australian-developed. Education and structured planning, not medical, psychological or financial advice.</div>
 </div></div>
 <div class="rail"><i id="rail"></i></div>
</div>
"""

JS = r"""
const $=(id)=>document.getElementById(id), wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const on=(e,c='in')=>e.classList.add(c), off=(e,c='in')=>e.classList.remove(c);
const TOTAL=50000;
let current=null;
function show(n,{y=0,pan=null,dur=0}={}){
  document.querySelectorAll('#screen img').forEach(i=>{ if(i.dataset.n!==n) i.classList.remove('show'); });
  const el=document.querySelector(`#screen img[data-n="${n}"]`);
  el.style.transition='opacity .3s ease, transform 0s linear'; el.style.transform=`translateY(${y}px)`;
  el.classList.add('show'); current=el;
  if(pan!==null){ requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.style.transition=`opacity .3s ease, transform ${dur}ms cubic-bezier(.3,.1,.2,1)`; el.style.transform=`translateY(${pan}px)`; })); }
}
async function copy(html){ const c=$('copy'); c.classList.add('out'); await wait(280); off($('line')); $('line').innerHTML=html; c.classList.remove('out'); on($('line')); }
async function tapAt(x,y){ const t=$('tap'); t.style.left=x+'%'; t.style.top=y+'%'; t.classList.remove('go'); void t.offsetWidth; t.classList.add('go'); await wait(560); }
function focus(top,h){ const f=$('focus'); f.style.top=top+'%'; f.style.height=h+'%'; on(f); }
(async()=>{
 await Promise.all([...document.querySelectorAll('#screen img')].map(i=>i.decode().catch(()=>{})));
 document.title='GO';
 $('rail').style.transition=`width ${TOTAL}ms linear`; await wait(60); $('rail').style.width='100%';

 // 0–9.5 the problem everyone recognises, no phone
 await wait(250); on($('o1')); await wait(1300); on($('o2')); await wait(1500); on($('o3')); await wait(1200); on($('o4'));
 await wait(1800); on($('o5')); await wait(1500); on($('o6'));
 await wait(1700); $('open').classList.add('out'); await wait(420);

 // 9.5–13.5 what it is
 show('today-before'); on($('phone'));
 await copy('IntentNorth does that part. One iPhone app that turns what you hear into a plan for <em>your actual week</em>.');
 await wait(3600);

 // 13.5–19 graded, sourced, bounded
 show('lib-card'); await copy('Every practice is graded for how strong the evidence is — <em>A to E</em> — with its sources named, and where it stops.');
 await wait(600); focus(12.4,5.8); await wait(4400); off($('focus'));

 // 19–22.5 one tap
 await copy('One tap and it’s in your week, at an hour that fits.');
 $('under').textContent='Attribution credits public work and implies no endorsement of IntentNorth.'; on($('under'));
 await wait(700); await tapAt(50,29.7); show('lib-card-added'); await wait(2000); off($('under'));

 // 22.5–26.5 tell it once
 show('int-2'); await copy('Tell it about your life once.');
 await wait(600); await tapAt(22.8,52.7); show('int-3');
 await wait(550); await tapAt(13.1,51.5); await wait(150); await tapAt(63.2,51.5); show('int-4');
 await wait(550); await tapAt(58,63.7); show('int-5'); await wait(800);

 // 26.5–31 the seven areas
 show('coaches-tall',{y:-430,pan:-600,dur:2600});
 await copy('A program for each part of life: training, food, sleep, habits, money, work, family.');
 await wait(3800);

 // 31–35.5 the day, decided, with the reason
 show('today-before'); await copy('Every morning, the day is already decided. <em>Every line says why.</em>');
 await wait(500); focus(10.5,9.8); await wait(3400); off($('focus'));

 // 35.5–40 short night
 show('workout'); await copy('Short night? Today’s session changes on its own.');
 await wait(1000); await tapAt(31,13.8); show('workout-autoreg'); await wait(120); focus(6.2,4.6);
 await wait(2700); off($('focus'));

 // 40–44 levels you earn
 show('level-training'); await copy('Levels you earn from what you log — <em>not from a form</em>.');
 await wait(3600);

 // 44–50 end
 on($('end')); await wait(4800);
})();
"""

imgs = "\n".join(f'<img data-n="{k}" src="{v}">' for k, v in IMG.items())
html = ("<!doctype html><html><head><meta charset='utf-8'><style>" + CSS + "</style></head><body>"
        + BODY.replace('__IMGS__', imgs) + "<script>" + JS + "</script></body></html>")
out = pathlib.Path(os.environ.get('OUT', 'film10.html' if L else 'film10v.html'))
out.write_text(html)
print(out, round(out.stat().st_size / 1e6, 1), 'MB')
