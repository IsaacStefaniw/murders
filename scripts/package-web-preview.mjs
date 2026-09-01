/**
 * Package the web export as one self-contained page for an Artifact.
 *
 * Everything is inlined because the artifact sandbox blocks every external
 * fetch: the JS bundle, the stylesheet, and the dozen images expo-router
 * references. A relative URL that would resolve on a normal host silently
 * fails there, so nothing may be left pointing outside the file.
 *
 * Run: node scripts/package-web-preview.mjs [outFile]
 * Requires `npx expo export --platform web` to have been run first.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const DIST = 'dist';
const out = process.argv[2] ?? 'web-preview.html';

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const pick = (dir, test) => {
  const hit = walk(dir).find(test);
  if (!hit) throw new Error(`nothing matching in ${dir} — run expo export first`);
  return hit;
};

let js = readFileSync(pick(`${DIST}/_expo/static/js/web`, (f) => /entry-.*\.js$/.test(f)), 'utf8');
const css = readFileSync(pick(`${DIST}/_expo/static/css`, (f) => f.endsWith('.css')), 'utf8');

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml' };
let inlined = 0;
for (const file of walk(`${DIST}/assets`)) {
  const ref = '/' + relative(DIST, file).split(/[\\/]/).join('/');
  if (!js.includes(ref)) continue;
  const mime = MIME[extname(file).slice(1).toLowerCase()] ?? 'application/octet-stream';
  js = js.split(ref).join(`data:${mime};base64,${readFileSync(file).toString('base64')}`);
  inlined += 1;
}

// A literal </script> would close the tag early. The escaped form is
// identical inside every JS string and regex it can appear in.
js = js.split('</script').join(String.raw`<\/script`);

writeFileSync(
  out,
  `<title>INTENT</title>
<style>
/* React Native Web's reset, plus an override of the host page's own body
   margin and font so the app owns the full viewport. */
html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }
body { background: #F7F5F1; }
@media (prefers-color-scheme: dark) { body { background: #141614; } }
#root { display: flex; height: 100%; flex: 1; }
${css}
</style>

<div id="root"></div>

<script>
/*
 * Expo Router matches window.location.pathname against its route table, and
 * this page is served from a generated sub-path, so the first match fails
 * and the app renders "Unmatched Route" instead of booting. Metro inlines
 * the base URL at build time, leaving no runtime hook — so the path is
 * rewritten before the bundle evaluates. Same-origin History API: nothing
 * is fetched and no navigation happens.
 *
 * The original path is restored on pagehide so a refresh reloads THIS page
 * rather than one the host has never heard of.
 */
(function () {
  try {
    var mount = location.pathname;
    if (mount !== '/') {
      history.replaceState(null, '', '/');
      addEventListener('pagehide', function () {
        try { history.replaceState(null, '', mount); } catch (e) {}
      });
    }
  } catch (e) {
    /* A host that forbids replaceState leaves the app where it was. */
  }
})();
</script>

<script>
${js}
</script>
`,
  'utf8',
);

const mb = (statSync(out).size / 1e6).toFixed(2);
console.log(`${out} — ${mb} MB, ${inlined} assets inlined`);
