# INTENT OS — website

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

On Windows, `npm run dev` fails because the script uses POSIX env syntax. Use:

```bash
WRANGLER_LOG_PATH=.wrangler/wrangler.log npx vite
```

## Verify before shipping

```bash
npm run lint
npm run build
node --test tests/rendered-html.test.mjs   # product-truth guardrails
```

`tests/rendered-html.test.mjs` asserts the positioning line, the single CTA
vocabulary, the free/premium disclosure, the hardest-moment principle, the
absence of the word "prescription", and that images are served directly rather
than through the Next image optimiser. Treat a failure as a positioning
regression, not a flaky test.

`tests/ui-components.test.mjs` currently hangs on Windows (a Vite transport
timeout loading `components/ui/sidebar.tsx`). It fails identically on an
untouched checkout; it is an environment issue, not a regression.

## Stack

Next.js 16 · React 19 · TypeScript · Vinext/Vite · Cloudflare Workers output.

- `app/page.tsx` — the whole page and the profile builder
- `app/globals.css` — the visual system
- `app/layout.tsx` — metadata, including OpenGraph
- `public/images/` — production WebP assets, served directly on purpose
- `worker/index.ts` — the Cloudflare Worker entry

## Deploying

The build already targets Cloudflare Workers, so that is the least-friction
host. `.github/workflows/web-deploy.yml` is ready and runs on manual dispatch;
it needs two repository secrets before it will work:

- `CLOUDFLARE_API_TOKEN` — a token with Workers Scripts: Edit
- `CLOUDFLARE_ACCOUNT_ID`

A custom domain is then attached in the Cloudflare dashboard.

Vercel is the alternative and needs no workflow — point it at this directory
and it will detect Next.js.

## Keeping the site honest

The app is the source of truth. `src/features/paths/definitions.ts` in the repo
root lists the shipped pathways; if the site's copy and that file disagree, the
file wins. This is what caused the earlier drift where the site showed five
pathways for seven shipped ones, and labelled the habits coach "Recover".
