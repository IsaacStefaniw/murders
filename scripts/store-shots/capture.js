const { chromium } = require(process.env.SP + '/pw/node_modules/playwright');
const fs = require('fs');
(async () => {
  const state = fs.readFileSync(process.env.SP + '/seeded-state.json', 'utf8');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const sizes = [['6.7', 430, 932], ['6.9', 440, 956]];
  const routes = (process.env.ROUTES || '').split(',');
  for (const [tag, w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Sydney' });
    await ctx.addInitScript((s) => { try { localStorage.setItem('intent-os-store', s); } catch {} }, state);
    for (const r of routes) {
      const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
      await page.goto('http://127.0.0.1:8787' + r, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errs.push('nav:' + e.message.slice(0, 80)));
      await page.waitForTimeout(2500);
      const name = (r === '/' ? 'root' : r.replace(/^\//, '').replace(/\//g, '-')) + '-' + tag + '.png';
      await page.screenshot({ path: process.env.SP + '/store-shots/' + name });
      const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 110);
      console.log(`${name.padEnd(28)} ${w * 3}x${h * 3}  "${text}"${errs.length ? '  ERR:' + errs[0] : ''}`);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
