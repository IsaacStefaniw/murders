const { chromium } = require(process.env.SP + '/pw/node_modules/playwright');
const fs = require('fs');
(async () => {
  const state = fs.readFileSync(process.env.SP + '/seeded-state.json', 'utf8');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Sydney' });
  await ctx.addInitScript((s) => { try { localStorage.setItem('intent-os-store', s); } catch {} }, state);
  // "route#Visible text" scrolls that text into view before the shot.
  for (const spec of process.env.ROUTES.split(',')) {
    const [r, anchor] = spec.split('#');
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    await page.goto('http://127.0.0.1:8787' + r, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errs.push('nav:' + e.message.slice(0, 60)));
    await page.waitForTimeout(2500);
    let found = '';
    if (anchor) {
      const loc = page.getByText(anchor, { exact: false }).first();
      try { await loc.scrollIntoViewIfNeeded({ timeout: 4000 }); await page.evaluate(() => window.scrollBy(0, -80)); await page.waitForTimeout(600); found = 'anchored'; }
      catch { found = 'ANCHOR NOT FOUND'; }
    }
    const name = (r.replace(/^\//, '').replace(/\//g, '-')) + (anchor ? '-' + anchor.toLowerCase().replace(/[^a-z]+/g, '-').slice(0, 18) : '') + '-6.7.png';
    await page.screenshot({ path: process.env.SP + '/store-shots/' + name });
    const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 90);
    console.log(`${name.padEnd(44)} ${found.padEnd(16)} "${text}"${errs.length ? '  ERR:' + errs[0] : ''}`);
    await page.close();
  }
  await browser.close();
})();
