// Records a film master with headless Chromium and encodes it.
//   PW=/path/with/node_modules FFMPEG=/path/to/ffmpeg node record.js film7.html 1920 1080 46500 out/intentnorth-intent-45s
// Produces <out>.webm (VP9), <out>.mp4 (H.264, faststart) and <out>-poster.jpg.
const { chromium } = require((process.env.PW || '.') + '/node_modules/playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'); const path = require('path');
const [,, html, W, H, MS, out] = process.argv;
const width = +W, height = +H, ms = +MS;
(async () => {
  const dir = fs.mkdtempSync(path.join(path.dirname(out), 'rec-'));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, recordVideo: { dir, size: { width, height } } });
  const t0 = Date.now();
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(html));
  // The master sets its title to GO once every screen is decoded and the
  // timeline starts; everything recorded before that is load time and is
  // trimmed, so the film's clock is the design's clock.
  await page.waitForFunction(() => document.title === 'GO', null, { timeout: 60000 });
  const lead = (Date.now() - t0) / 1000;
  await page.waitForTimeout(ms);
  await ctx.close(); await browser.close();
  const raw = fs.readdirSync(dir).map((f) => path.join(dir, f)).find((f) => f.endsWith('.webm'));
  const ff = process.env.FFMPEG || 'ffmpeg';
  const run = (args) => execFileSync(ff, ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  const ss = Math.max(0, lead - 0.15);
  // The screencast's clock runs slow under load (frames arrive late and are
  // stamped late), so the raw file is longer than the wall time it covers.
  // Measure it and retime to the design's clock; the frames are the same.
  const probe = (() => { try { execFileSync(ff, ['-i', raw], { stdio: 'pipe' }); } catch (e) { return String(e.stderr); } return ''; })();
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe);
  const rawDur = m ? (+m[1] * 3600 + +m[2] * 60 + +m[3]) : NaN;
  const factor = rawDur ? (rawDur - ss) / (ms / 1000) : 1;
  console.log('lead trimmed', ss.toFixed(2), 's; raw', rawDur.toFixed(2), 's; retime factor', factor.toFixed(3));
  const vf = `setpts=PTS/${factor.toFixed(4)}`;
  run(['-ss', ss.toFixed(2), '-i', raw, '-vf', vf, '-r', '25', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out + '.mp4']);
  run(['-ss', ss.toFixed(2), '-i', raw, '-vf', vf, '-r', '25', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', '-row-mt', '1', '-an', out + '.webm']);
  run(['-ss', String(Math.max(0, ms / 1000 - 3.2)), '-i', out + '.mp4', '-frames:v', '1', '-q:v', '3', out + '-poster.jpg']);
  fs.rmSync(dir, { recursive: true, force: true });
  for (const f of ['.mp4', '.webm', '-poster.jpg']) console.log(out + f, (fs.statSync(out + f).size / 1e6).toFixed(2), 'MB');
})();
