import base64, pathlib
def b64(d,n): return base64.b64encode((pathlib.Path(d)/f'{n}.png').read_bytes()).decode()
WORKOUT = b64('shots2','workout')
CTA = 'intentnorth.app'

# 9:16. One claim, told once. In a feed you get one idea and about three
# seconds to land it, so this is the coaching claim and nothing else: a real
# session, decided, that moves when your own numbers move.
HTML = """<!doctype html><html><head><meta charset='utf-8'><style>
:root{--ground:#0A100D;--ink:#F4F6F2;--dim:#93A79A;--accent:#7FD3A6;--deep:#2F5D4A;
 --display:"Bitstream Charter","Charter",Georgia,"DejaVu Serif",serif;
 --ui:"DejaVu Sans","Liberation Sans",system-ui,sans-serif;}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:720px;height:1280px;overflow:hidden;background:var(--ground)}
body{font-family:var(--ui);color:var(--ink)}
.stage{position:relative;width:720px;height:1280px;overflow:hidden}
.bg{position:absolute;inset:0;background:
 radial-gradient(680px 700px at 50% 62%,rgba(47,93,74,.5),transparent 64%),
 radial-gradient(560px 560px at 12% 8%,rgba(127,211,166,.13),transparent 62%),var(--ground);
 animation:drift 20s ease-in-out infinite alternate}
@keyframes drift{to{transform:scale(1.08) translate3d(-2%,1%,0)}}
.grain{position:absolute;inset:0;opacity:.03;background-image:radial-gradient(rgba(255,255,255,.9) .5px,transparent .5px);background-size:3px 3px}

.hero{position:absolute;left:56px;right:56px;top:0;height:1280px;display:grid;place-items:center;text-align:center}
.hero .l{position:absolute;font-family:var(--display);font-size:72px;line-height:1.08;
 opacity:0;transform:translateY(30px);transition:all .72s cubic-bezier(.16,.9,.24,1)}
.hero .l.in{opacity:1;transform:none}
.hero .l.bumped{opacity:0;transform:translateY(-70px) scale(.94)}
.hero .l.win{color:var(--accent)}

.top{position:absolute;left:52px;right:52px;top:74px;text-align:center}
.head{font-family:var(--display);font-size:52px;line-height:1.1;
 opacity:0;transform:translateY(24px);transition:all .7s cubic-bezier(.16,.9,.24,1)}
.head.in{opacity:1;transform:none}
.head.out{opacity:0;transform:translateY(-28px)}
.quote{margin-top:8px;font-family:var(--display);font-size:38px;line-height:1.3;text-align:left;
 border-left:3px solid var(--accent);padding-left:20px;
 opacity:0;transform:translateY(20px);transition:all .7s cubic-bezier(.16,.9,.24,1)}
.quote.in{opacity:1;transform:none}
.quote em{font-style:normal;color:var(--accent)}
.qlabel{font:400 14px/1 var(--ui);letter-spacing:.22em;text-transform:uppercase;color:var(--dim);margin-bottom:14px;text-align:left}

.phone{position:absolute;left:50%;top:400px;transform:translateX(-50%) translateY(80px);
 width:410px;height:880px;border-radius:52px;padding:9px;
 background:linear-gradient(160deg,#2b3a33,#141c18);
 box-shadow:0 40px 90px -28px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07),0 0 100px -18px rgba(127,211,166,.24);
 opacity:0;transition:opacity .6s ease,transform 1s cubic-bezier(.16,.9,.24,1)}
.phone.in{opacity:1;transform:translateX(-50%) translateY(0)}
.screen{width:100%;height:100%;border-radius:44px;overflow:hidden;position:relative;background:#F7F5F1}
.screen img{position:absolute;left:0;top:0;width:100%}
.ring{position:absolute;left:11px;top:84px;width:374px;height:110px;border-radius:17px;
 border:3px solid var(--accent);opacity:0;transition:opacity .45s ease;
 box-shadow:0 0 0 8px rgba(127,211,166,.17)}
.ring.in{opacity:1;animation:pulse 1.6s ease-in-out 2}
@keyframes pulse{50%{box-shadow:0 0 0 16px rgba(127,211,166,.07)}}

.end{position:absolute;inset:0;display:grid;place-items:center;text-align:center;opacity:0;transition:opacity .7s ease}
.end.in{opacity:1}
.wordmark{font-family:var(--display);font-size:76px;letter-spacing:-.02em}
.wordmark b{font-weight:400;color:var(--accent)}
.tag{font:400 22px/1 var(--ui);color:var(--dim);margin-top:20px}
.cta{margin-top:38px;display:inline-block;border:1px solid rgba(127,211,166,.55);border-radius:999px;
 padding:15px 34px;font:400 21px/1 var(--ui);color:var(--accent);background:rgba(127,211,166,.08)}
</style></head><body>
<div class="stage">
 <div class="bg"></div><div class="grain"></div>
 <div class="hero" id="hero">
  <div class="l" id="h1">A coach asks before<br>they prescribe.</div>
  <div class="l" id="h2">Then changes it<br>when you change.</div>
  <div class="l" id="h3">Seven coaches.<br>One plan that changes.</div>
 </div>
 <div class="top">
  <div class="head" id="hd">Every session decided<br>before you walk in.</div>
  <div class="quote" id="qt"><div class="qlabel">And when your numbers move</div>
   Your own recovery numbers are down this morning — <em>main work stays, accessories rest today</em>.</div>
 </div>
 <div class="phone" id="phone"><div class="screen"><img src="data:image/png;base64,__WORKOUT__"><div class="ring" id="ring"></div></div></div>
 <div class="end" id="end"><div>
  <div class="wordmark">Intent<b>North</b></div>
  <div class="tag">Become who you intend to be.</div>
  <div class="cta">__CTA__</div>
 </div></div>
</div>
<script>
const $=(i)=>document.getElementById(i), wait=(m)=>new Promise(r=>setTimeout(r,m));
(async()=>{
 await wait(250);
 $('h1').classList.add('in');  await wait(1750); $('h1').classList.add('bumped');
 await wait(200);
 $('h2').classList.add('win','in'); await wait(1700); $('h2').classList.add('bumped');
 await wait(300); $('hero').style.display='none';

 $('phone').classList.add('in'); await wait(320);
 $('hd').classList.add('in');    await wait(560);
 await wait(2300);

 $('hd').classList.add('out');   await wait(430);
 $('hd').style.display='none';
 $('qt').classList.add('in');    await wait(3600);

 $('qt').classList.remove('in'); $('phone').classList.remove('in');
 await wait(560);
 $('hero').style.display='grid'; $('h3').classList.add('in'); await wait(1900);
 $('h3').classList.add('bumped'); await wait(420); $('hero').style.display='none';
 $('end').classList.add('in');
})();
</script></body></html>"""

pathlib.Path('film6.html').write_text(HTML.replace('__WORKOUT__',WORKOUT).replace('__CTA__',CTA))
print('film6.html', round(pathlib.Path('film6.html').stat().st_size/1e6,2),'MB')
