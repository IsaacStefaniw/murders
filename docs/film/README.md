# The masters

These generate the HTML the films are rendered from. Anything that needs to
appear in the frame — a disclaimer, a changed end card, a different CTA —
is changed HERE and re-rendered once. Compositing it onto a finished encode
instead costs a generation of quality.

The brief every master answers to is `docs/FILM_BRIEF.md`.

| Master | Output | Size | Length |
|---|---|---|---|
| `film7-45s-intent.py` | `intentnorth-intent-45s` | 1920×1080 | ~47s |
| `film8-18s-vertical.py` | `intentnorth-intent-18s-vertical` | 1080×1920 | ~19s |
| `film5-45s-landscape.py`, `film6-16s-vertical.py` | the previous cut, kept for the record | | |

## Rendering

1. Export the app for web and serve it: `npx expo export --platform web
   --output-dir <dir>` then `WEBDIST=<dir> node scripts/store-shots/serve.js`.
2. Seed a state with all seven coaches started and Plus on (the film seed:
   `seeded-state-film.json`, built from the store-screenshot seed by calling
   `startPath` for the four pathways it lacked).
3. Capture the screens the masters name, at 420×900 CSS px and 3× scale,
   plus 420×2400 for the hubs and the library so the phone can pan. The
   capture scripts (`capture-film.js`, `capture-levels.js`) sit beside the
   masters in the app session's scratchpad; they are short Playwright
   scripts that seed `localStorage` and screenshot routes.
4. Downscale the captures to 2× the displayed width and save as JPEG at
   quality 92: `SHOTS` for the hero is 760px wide, for the vertical 1144px.
   A fifth of the bytes, and the page then decodes in under a second.
5. `SHOTS=<dir> OUT=film7.html python3 film7-45s-intent.py`
6. `PW=<dir with node_modules/playwright> FFMPEG=<ffmpeg> node record.js
   film7.html 1920 1080 47000 out/intentnorth-intent-45s`

`record.js` waits for the master to set `document.title = 'GO'` (it does so
once every screen has decoded), trims the load time, measures the
screencast's slow clock and retimes it to the design's, then writes H.264
(`crf 20`, `yuv420p`, `+faststart`), VP9 and a poster. ffmpeg came from the
`imageio-ffmpeg` wheel; Chromium is the one Playwright is pointed at.

The screenshots are not committed: they are the build's output and are
regenerated from it, which is the only way the rule "every sentence on the
phone is the app's own" stays checkable.
