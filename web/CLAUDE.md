# IntentNorth — Claude Development Handoff

This is the source of the IntentNorth marketing site. Its address is:

https://intentnorth.app

instinctnorth.app is held as an alias and 301s to that; see `worker/index.ts`.
The old `intent-operating-system.isaac-stefaniw.chatgpt.site` preview host is
gone, and the product was named INTENT OS before it was named IntentNorth —
both still appear in image filenames and the Cloudflare worker name, which are
deliberately left alone because renaming them breaks live URLs and deploys.

Treat this source as the approved baseline, not a concept mock-up.

## Run locally

Requirements:

- Node.js 22.13 or newer
- npm

Nothing else. `dev`, `build`, `lint` and `test` run on Windows, macOS and Linux
without a POSIX shell. Only `npm run install:ci` — a hardened single-install
path used by hosted runners, not by contributors — is Linux-only.

Commands:

```bash
npm ci
npm run dev
```

Validation:

```bash
npm run lint
npm test
```

`npm test` performs the production build and runs the product-truth/rendering
guardrails. It discovers `tests/*.test.mjs` rather than naming them — the list
used to be hand-maintained in `package.json`, and a test file written, passing
and never run is not a guardrail.

Those guardrails read text. They cannot see a page that renders badly while
saying the right words — a sentence stacked one word per line down a 48px
column passes all of them, and reached the live site. `npm run test:layout`
renders the built site in headless Chromium and fails on text squeezed into a
ribbon, sideways scrolling, or elements covering each other. It reads its route
list out of `app/sitemap.ts` — the home page at eight widths, every other page
at three — so a page added to the sitemap is checked without being registered
anywhere else, and a page missing from it is checked by nothing and crawled by
nobody.

It is not part of `npm test`, because a browser download would break the
promise above that this project needs Node and npm and nothing else. It skips
with a message if no browser is present; CI installs Chromium and runs it with
`LAYOUT_STRICT=1` before every deploy, where skipping is a failure. If you
change layout, run it — and if you cannot, say that you did not rather than
reporting the change as checked.

## Where to work

- `app/page.tsx` — page narrative, interactive profile builder and pathway content
- `app/globals.css` — full visual system and responsive behaviour
- `app/layout.tsx` — metadata
- `components/intent-motion/` — learning-loop and shared-profile motion components
- `public/images/` — production image assets, including the two latest editorial WebP images
- `app/evidence/` — the whole practice library, searchable, generated at build time
- `app/<topic>/page.tsx` — the six search topic pages, built on `components/EvidenceTopic.tsx`
- `app/works-with-what-you-wear/page.tsx` — the wearable door
- `tests/` — non-negotiable positioning, wording and asset-delivery guardrails

The project uses Next.js 16, React 19, TypeScript, Vinext/Vite and deploys to Cloudflare Workers. Preserve `package-lock.json` and the existing build system unless the deployment platform is deliberately being changed. The hosting platform's `.openai/hosting.json` no longer exists; the build reads `wrangler.jsonc`, whose worker name is pinned because changing it creates a second site rather than updating this one.

## Product positioning

IntentNorth is not a calendar shaper, general life dashboard or readiness-score app.

The core value proposition is:

> Your results should change what happens next.

**State it in plain words, never in that form.** Isaac showed the site to
several people in September 2026 and none of them could say what the product
was. That sentence was in the hero lede at the time. On the page it now reads
"it changes the plan when your week changes, and tells you why" — the same
claim, in words a stranger can read. `tests/plain-language.test.mjs` fails the
build on the vocabulary that caused the problem, and the list there is the
record of which words those were.

The product observes a meaningful signal, changes the next load, target or protocol, and shows the reason. The essential proof pattern is:

**Before → signal → changed action → reason**

Calendar protection may exist, but it is not the category or differentiator.

## The library figures

The practice library is **204**, and the number is not in one file.
`src/features/knowledge/protocols.ts` declares 177 and then spreads in five
more — money, supplements, work, people and habits. Anything that counts the
library must read all six. The site published 177, 104, 145 and 188 until
September 2026 because both the extractor and the guardrail written to catch
exactly this read only `protocols.ts` — a check that counts the same wrong way
as the copy it is checking is worse than none, because it is believed.

The current figures, all generated rather than typed:

| | |
|---|---|
| Practices | 204 |
| Rated C or weaker | 122 |
| Carrying a safety note | 171 |
| Researchers and teachers credited | 212 |
| A / B / C / D / E | 15 / 67 / 73 / 41 / 8 |

`scripts/build-evidence.mjs` regenerates `app/evidence/library.json` before
every build, and refuses to finish if a declared safety note fails to parse.
That guard has now caught fifteen of them: three wrapped onto the next line by
the formatter, four written as the bare constant `DEPENDENCE_LINE`, eight as
template literals. A safety note missing from the website is the worst thing
this site can do quietly, so do not soften that check into a warning.

## The wearable claims

Written to `docs/WEARABLE_BRIEF.md` and `docs/WEARABLE_POSITIONING.md`, both
researched 7 Sep 2026. Six sentences are permanently out, and
`tests/wearable-claims.test.mjs` fails the build on each of them however well
it is phrased:

1. **"Buy the band and cancel the subscription."** Whoop's own cancellation
   page says a cancelled membership cannot collect, upload or analyse any
   data, so nothing reaches Apple Health at all. Oura's Health integration on
   Gen3 and Ring 4 is listed as needing an active membership, so cancelling
   would break the exact sync we depend on. App Review 2.3.1 treats misleading
   marketing as grounds for removal and account termination.
2. **"Works with your Oura or Whoop HRV."** Both compute RMSSD; Apple Health
   stores SDNN. Neither writes HRV to Health at all. **Lead on sleep and
   resting heart rate**, which are close to universal — anything leading on
   variability quietly excludes the two brands most likely to be reading.
3. **"Works with any wearable."** Suunto sends neither sleep nor resting heart
   rate. Name only Apple Watch, Garmin via Connect, and Withings; those are
   the three families that were checked.
4. **"Replaces your Whoop / Oura / Garmin."** We need them to keep writing.
5. **"The only app that reads your band and changes the plan."** Training
   Today does exactly that, for runners.
6. **"We measure."** We read what the device wrote. Say reads, never measures.

Also held back until it ships: the day-one claim. The app reads the most
recent Health sample, so someone with two years of ring history still waits
fourteen days for a baseline. Once the sixty-day backfill lands, the line is
"your ring has been learning your normal for two years, and IntentNorth reads
that history on the first morning" — the sentence no competitor can write.
The guardrail permits it the moment `healthkit.ts` carries the backfill.

The wearable story is a door, not the hero. The hero has to keep working for
the person with no device, who is the larger market.

## Marketing measurement, and the line it does not cross

Isaac's decision, 7 Sep 2026: **the privacy promise is about the app and the
health data in it, not about whether a marketing website may count visits and
retarget.** That line is real and every privacy-forward company draws it.
`app/analytics.tsx` carries Google Analytics, the Meta pixel and the Reddit
pixel; paste the IDs into `ANALYTICS` there and they switch on. They are public
IDs, visible in any page's source, so they are committed rather than hidden in
an env var that would silently disable measurement in a build nobody checked.
With the IDs empty, no third-party script ships at all.

**The questionnaire's answers never leave the browser, and no event carries
them.** This one is not a preference. Step 02 of the profile builder asks what
someone wants to reduce and one option is "an urge I want support with", which
makes the answer set health information under s6 of the Privacy Act 1988 —
sensitive information, needing consent under APP 3.3, not merely disclosure.
Meta's Business Tools Terms separately prohibit sending health data to the
pixel; doing it is the conduct behind the US hospital-pixel litigation.

Nothing is lost by the boundary: an ad platform optimises on the event, not on
its payload, so a bare `profile_complete` buys the same audience as one stuffed
with answers. `track()` therefore takes **no second parameter** — the safety is
structural rather than a rule to remember —  and
`tests/analytics-boundary.test.mjs` enforces the closed event list, the empty
payload, the answers never appearing in a `gtag`/`fbq`/`rdt`/`fetch` call, and
that `/privacy` describes whatever is actually wired.

Whatever else changes here, these stay true and are separately guarded: there
is no analytics SDK in the app, no advertising identifiers or ad networks in
it, and Apple Health data is never used for advertising. The App Store privacy
label and the `/whoop-alternative` comparison both rest on them.

## Product-truth boundaries

Keep these constraints intact in every iteration:

1. Never fabricate product screens, customer results, user counts, beta claims or testimonials.
2. Sleep-informed training is available today and can be represented as shipped behaviour.
3. Broader cross-domain arbitration is direction, not shipped proof.
4. The behaviour-change protocol is explicitly labelled **in development**.
5. Web-to-app shared-profile plumbing is described as the next product connection.
6. Recovery, urge and hardest-moment support remains free. The principle is: “We never charge for someone’s hardest moment.”
7. Avoid the public word “prescription”. Use program, plan or protocol.
   One approved exception: the films open on “A coach asks before they
   prescribe.” Isaac reviewed this line and kept it — it disclaims
   prescribing rather than claiming it. Do not “correct” it, and do not
   read it as licence to use the word in written copy, where the
   guardrail in `tests/rendered-html.test.mjs` still fails the build.
8. Health, training, nutrition, mindfulness and financial content is educational, never diagnosis or personal advice.
9. Do not use named public figures in a way that implies endorsement.
   The 45s film shows six named educators. The no-endorsement line is
   burned into the footage beside them at body-text size, and the page
   repeats it under the film. Both are required: a viewer who never
   presses play must still see why those names are there. If the film
   is ever re-cut, the caption has to survive the re-cut.
10. Product motion must show reproducible behaviour. AI-generated video is acceptable only for editorial/lifestyle moments, not evidence of the app working.

## Conversion architecture

The primary CTA vocabulary is deliberately consistent: **Build my profile**.

The profile flow currently:

1. Discloses the free/premium boundary.
2. Captures up to four positive outcomes.
3. Captures up to three patterns the user wants to reduce.
4. Captures constraints such as sleep and workload.
5. Creates an explicit 12-week commitment.
6. Reveals a personalised operating-profile preview.

Premium is disclosed before the commitment and offered after the reveal. Do not introduce a fake checkout. The current preview is stored only on the device; do not imply that web-to-app profile sync already exists.

## Behaviour-change model

The site treats harmful patterns as systems to redesign rather than character flaws:

1. Notice the cue.
2. Interrupt the automatic path.
3. Make a useful replacement action easier.
4. Measure the result and adapt or recover without shame.

The evidence section links to primary or peer-reviewed sources. Preserve the distinction that Kahneman developed foundational work on fast, automatic judgement, while Richard Thaler and Cass Sunstein popularised the nudge/choice-architecture framing.

Current research anchors:

- COM-B behaviour model — Michie, van Stralen and West (2011): https://pubmed.ncbi.nlm.nih.gov/21513547/
- Goal-progress monitoring meta-analysis — Harkin et al. (2016): https://pubmed.ncbi.nlm.nih.gov/26479070/
- Habit formation systematic review — Singh et al. (2024): https://pmc.ncbi.nlm.nih.gov/articles/PMC11641623/
- Meditation systematic review — Goyal et al. (2014): https://pubmed.ncbi.nlm.nih.gov/24395196/

If discussing topics associated with Andrew Huberman, Rhonda Patrick, David Sinclair, Sam Harris or other public educators, trace the claim to the underlying study and avoid implied endorsement.

## Visual direction

Maintain the approved editorial system:

- warm ivory, eucalyptus, charcoal and restrained amber
- premium, calm and human rather than quantified-self neon
- generous but purposeful spacing
- strong typographic contrast
- real-life stakes paired with precise product causality
- motion used to demonstrate change over time, not as decoration

Desktop must remain compositionally full and balanced. Test at 1440px and 1280px as well as tablet and mobile. The latest WebP images are intentionally served directly; routing them through the Next image optimiser previously caused desktop failures in the hosted runtime.

Respect `prefers-reduced-motion`, keyboard navigation, focus visibility, semantic headings, alt text and touch targets.

## Highest-value next development

1. Replace the web-native hero causality animation with a 3–5 second silent recording of the real app: health/sleep data arrives, the sleep signal updates, training volume changes, and the reason appears. Retain the current diagram as the poster/fallback and reduced-motion state.
2. Connect assessment answers to the app’s existing progressive profile so paid users are never re-asked known questions.
3. Add privacy-safe funnel instrumentation for CTA click, profile start, each step completion, reveal, premium intent and return visit.
4. Test one variable at a time: headline, proof treatment, CTA microcopy, assessment length and reveal framing.
5. Expand pathway-specific intake and plan depth only when the application can genuinely use those inputs to change daily actions.

## Definition of done for future changes

- The category difference is understandable in the first viewport.
- A sceptical visitor can see what signal caused what change.
- Shipped and developing capabilities remain clearly distinguished.
- Desktop, tablet and mobile have been visually checked — `npm run test:layout`
  is that check when a person cannot look, not a substitute for looking.
- `npm run lint` passes.
- `npm test` passes.
- No generated UI is presented as product evidence.
- No deployment replaces the live site without Isaac’s explicit approval.

