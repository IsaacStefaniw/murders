# App Store screenshots, reproducibly

Every store screenshot is the real app — the web build, rendered by headless
Chromium at Apple's exact pixel sizes, with a seeded state injected into
`localStorage` before first paint. Nothing is mocked and every sentence on
them is the app's own output, which is the same rule the website holds to.

1. `npx expo export --platform web --output-dir <dir>`
2. Seed a state: run the store in a jest probe (onboard, start pathways,
   `seedDemoHistory()`, save ~12 `WorkoutLog`s across six weeks so e1RM,
   Session history, the level card and Progress all have data, add a metric
   goal with a target date so a trajectory exists) and write
   `{ state: partialize(getState()), version }` to `seeded-state.json`.
   **Run it under `TZ=Australia/Sydney`** — timestamps written in the
   container's UTC render six hours out on a Sydney device, which is how a
   doom-scrolling window landed at 05:30 under "Tonight".
3. `WEBDIST=<dir> node serve.js &` — a static server with SPA fallback,
   because the export is single-page and `/today` must resolve to it.
4. `SP=<scratch> ROUTES=/today,/data,... node capture.js` — 6.7" (1290×2796)
   and 6.9" (1320×2868). `capture2.js` takes `route#Visible text` and
   scrolls that text into view first, for cards below the fold.

Playwright is installed outside the repo (`npm i playwright` in a scratch
directory with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`) and pointed at the
preinstalled Chromium, so `package.json` — and the runtime fingerprint —
are untouched.
