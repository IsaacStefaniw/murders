# IntentNorth — website

The marketing site and profile builder, living in the same repository as the
app so positioning, product truth and (later) shared profile data stay in one
history.

Previously hosted on OpenAI's ChatGPT Sites platform. Those bindings have been
removed: `.openai/hosting.json` is gone and `vite.config.ts` no longer reads
it, so the site now builds anywhere.

## Run it

```bash
cd web
npm ci
npm run dev     # http://localhost:5173
```

Windows, macOS and Linux all take the same commands. The scripts run through
Node rather than a POSIX shell, so PowerShell needs no workaround — if you find
yourself typing `npx vite` by hand to get around a script, that is a bug in the
script, not the way in.

The one exception is `npm run install:ci`, which is Linux-only by design: it
uses `flock` and `/proc` to guarantee a single install on a shared runner.
Contributors want plain `npm ci`.

## Verify before shipping

```bash
npm run lint
npm test        # builds, then runs every guardrail
```

`tests/rendered-html.test.mjs` asserts the positioning line, the single CTA
vocabulary, the free/premium disclosure, the hardest-moment principle, the
absence of the word "prescription", and that images are served directly rather
than through the Next image optimiser. Treat a failure as a positioning
regression, not a flaky test.

`tests/canonical-host.test.mjs` asserts that the alias domain redirects rather
than serving a second copy of the site, and that localhost and the workers.dev
preview URL are left alone.

`tests/ui-components.test.mjs` has been reported hanging on Windows (a Vite
transport timeout loading `components/ui/sidebar.tsx`). It failed identically
on an untouched checkout, so it is an environment issue rather than a
regression. It passes on Linux and macOS; if it still hangs for you on Windows
after the cross-platform script work, that is worth a fresh look rather than
another workaround.

## Stack

Next.js 16 · React 19 · TypeScript · Vinext/Vite · Cloudflare Workers output.

- `app/page.tsx` — the whole page and the profile builder
- `app/globals.css` — the visual system
- `app/layout.tsx` — metadata, including OpenGraph
- `public/images/` — production WebP assets, served directly on purpose
- `worker/index.ts` — the Cloudflare Worker entry

## Deploying

See `DEPLOY.md` for the full checklist — secrets, domains, and how to verify a
deploy before pointing DNS at it.

In short: the build targets Cloudflare Workers, and
`.github/workflows/web-deploy.yml` deploys on manual dispatch once
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist as repository secrets.

Vercel is the alternative and needs no workflow — point it at this directory
and it will detect Next.js. Note that the canonical-host redirect lives in
`worker/index.ts`, which is Cloudflare-specific; on Vercel it would need
rebuilding as a redirect rule.

## Keeping the site honest

The app is the source of truth. `src/features/paths/definitions.ts` in the repo
root lists the shipped pathways; if the site's copy and that file disagree, the
file wins. This is what caused the earlier drift where the site showed five
pathways for seven shipped ones, and labelled the habits coach "Recover".
