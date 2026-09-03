# Deploying the website

The site is a Cloudflare Worker. The build produces `dist/`, and
`.github/workflows/web-deploy.yml` ships it on manual dispatch.

Nothing here happens automatically. A push does not deploy, and per the handoff
rule in `CLAUDE.md` no deployment replaces the live site without Isaac's
explicit approval.

## One-time setup

### 1. Repository secrets

Both are needed before the workflow can do anything. Settings → Secrets and
variables → Actions:

| Secret | What it is |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | An API token with the **Workers Scripts: Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | The account the Worker belongs to, from the Cloudflare dashboard sidebar |

Use a scoped API token, not the Global API Key. The Global Key can do anything
to the account, and this only needs to replace one script.

### 2. The domains

Both names must be **on Cloudflare** — registered there, or registered
elsewhere with their nameservers pointed at Cloudflare. A Worker custom domain
cannot be attached to a zone Cloudflare does not host, and the deploy will
fail rather than warn.

Four hostnames attach to the same Worker:

| Hostname | Serves |
| --- | --- |
| `intentnorth.app` | the site |
| `www.intentnorth.app` | 301 → `intentnorth.app` |
| `instinctnorth.app` | 301 → `intentnorth.app` |
| `www.instinctnorth.app` | 301 → `intentnorth.app` |

The three redirects are the point of attaching them. An alias that resolves
nowhere protects the name from a squatter but does nothing for a person who
typed it; an alias pointed at the Worker sends that person to the real site
with their path intact. The rule lives in `worker/index.ts` — the
`ALIAS_HOSTS` set — and is covered by `tests/canonical-host.test.mjs`.

Attach each one in the dashboard: **Workers & Pages → intent-operating-system
→ Settings → Domains & Routes → Add → Custom domain**. Cloudflare creates the
DNS record and issues the certificate; allow a few minutes for the cert.

`www.intentnorth.app` is not a domain anyone owns or buys — it is a record
inside the `intentnorth.app` zone. Registrar will correctly say you do not have
it. Add it in the Domains & Routes panel above, typing the full hostname, or
skip it: the apex is canonical and the site is complete without it.

`.app` is on the HSTS preload list, so the whole TLD is HTTPS-only at the
browser level with no http fallback. In the minute or two before the
certificate finishes issuing, browsers show a hard security error rather than a
warning you can click past. That is the cert minting, not a broken attach.

**Status: `intentnorth.app` is attached and serving** (confirmed 3 Sep 2026 —
apex and `/privacy` both 200). `instinctnorth.app` is not attached, and it is
not known whether that zone is on this Cloudflare account.

The alternative is a `routes` array in `wrangler.jsonc`, which puts the wiring
in version control. It is deliberately not committed, for two reasons that both
still hold. An entry naming a zone the account does not hold fails every
subsequent deploy, including deploys that have nothing to do with domains — so
`instinctnorth.app` must be confirmed on this account first. And attaching a
custom domain needs more than the `Workers Scripts: Edit` scope the deploy
token was created with; it needs zone-level Workers Routes permission too, so
adding routes to config before widening the token converts a working deploy
into a failing one. Move the wiring into config when both are true.

### 3. Mail on intentnorth.app

`support@intentnorth.app` and `privacy@intentnorth.app` are published on the
support and privacy pages, and both need to reach a person before launch.
Cloudflare Email Routing forwards them to an existing inbox without running a
mail server; it needs the MX and TXT records it offers to add for you.

This is a release dependency. App Store review emails the support address, and
a user emailing it is usually describing something they would rather not have
to describe twice. `tests/legal-pages.test.mjs` asserts that every published
address sits on a domain the product owns — it cannot check that the mailbox
is answered.

## Deploying

1. Actions → **Deploy website** → Run workflow.
2. Leave **Replace the live website** unticked for a dry run. The workflow
   installs, lints, builds and runs the guardrails, then stops. This is the
   cheap way to find out whether `main` is shippable.
3. Tick it to deploy.

The guardrails run before the deploy step, so a positioning regression stops
the release rather than shipping and being noticed later.

## Verifying

Check in this order. Each step rules out a different failure.

```bash
# 1. The Worker itself, before DNS is involved.
curl -sS -o /dev/null -w '%{http_code}\n' https://intent-operating-system.isaacstef.workers.dev/

# 2. The canonical domain serves the site.
curl -sS -o /dev/null -w '%{http_code}\n' https://intentnorth.app/

# 3. Each alias redirects, and keeps the path.
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://instinctnorth.app/privacy
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.intentnorth.app/

# 4. The two pages Apple checks are reachable on the canonical domain.
curl -sS -o /dev/null -w '%{http_code}\n' https://intentnorth.app/privacy
curl -sS -o /dev/null -w '%{http_code}\n' https://intentnorth.app/support
```

Step 3 should print `301 https://intentnorth.app/privacy` and
`301 https://intentnorth.app/`. A `200` means the alias is serving a second
copy of the site — the Worker attached, but an older version without the
redirect.

Step 4 is a release dependency, not a nicety. App Store review rejects a
submission whose privacy policy or support URL 404s, and it rejects it late.

## The live site is deployed from a branch

Run 5 deployed from `claude/website-journey-powershell-nite39`, not from the
repository's default branch. `workflow_dispatch` takes whatever ref you give
it, and it does not care which one is default.

That leaves a live trap. The default branch does **not** contain the website
work — the rename, the legal pages, the canonical-host redirect, the film or
the library section. Dispatching this workflow from the default branch would
therefore not "redeploy the current site"; it would silently roll the live site
back to the August build, and `/privacy` and `/support` would start 404ing
again mid-App-Store-review.

Merge the branch into the default branch, or check the ref every time you
dispatch. The first is safer, because the second only has to be forgotten once.

## Worth knowing

**The Worker name is pinned.** `wrangler.jsonc` names it
`intent-operating-system`, which is the live Worker. The product has been
renamed twice; the Worker has not, because changing that name does not rename
anything — it creates a second Worker at a second URL and leaves the real site
serving the old build.

**A 301 is cached hard.** Browsers keep it. If `instinctnorth.app` is ever
promoted to canonical, everyone who visited it first will keep being sent to
`intentnorth.app` until their cache clears. Decide the canonical name before
the first alias deploy, not after.

**The compatibility date is split.** `wrangler.jsonc` carries the date that
deploys; `vite.config.ts` overrides it for `vite serve` only, because the
pinned wrangler ships an older workerd that will not boot against it. If a
deploy ever complains about the date, raise wrangler rather than lowering
`wrangler.jsonc` — that file is what production runs.
