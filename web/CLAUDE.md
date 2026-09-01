# INTENT OS — Claude Development Handoff

This archive is the exact source behind the live INTENT OS marketing site at:

https://intent-operating-system.isaac-stefaniw.chatgpt.site

The supplied source corresponds to the production release completed on 31 August 2026. Treat it as the approved baseline, not a concept mock-up.

## Run locally

Requirements:

- Node.js 22.13 or newer
- npm
- Linux is preferred because the supplied build scripts use `flock` and GNU `timeout`

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

`npm test` performs the production build and runs the product-truth/rendering guardrails.

## Where to work

- `app/page.tsx` — page narrative, interactive profile builder and pathway content
- `app/globals.css` — full visual system and responsive behaviour
- `app/layout.tsx` — metadata
- `components/intent-motion/` — learning-loop and shared-profile motion components
- `public/images/` — production image assets, including the two latest editorial WebP images
- `tests/` — non-negotiable positioning, wording and asset-delivery guardrails

The project uses Next.js 16, React 19, TypeScript, Vinext/Vite and Cloudflare-compatible output. Preserve `package-lock.json`, the existing build system and `.openai/hosting.json` unless the deployment platform is deliberately being changed.

## Product positioning

INTENT OS is not a calendar shaper, general life dashboard or readiness-score app.

The core value proposition is:

> Your results should change what happens next.

The product observes a meaningful signal, changes the next load, target or protocol, and shows the reason. The essential proof pattern is:

**Before → signal → changed action → reason**

Calendar protection may exist, but it is not the category or differentiator.

## Product-truth boundaries

Keep these constraints intact in every iteration:

1. Never fabricate product screens, customer results, user counts, beta claims or testimonials.
2. Sleep-informed training is available today and can be represented as shipped behaviour.
3. Broader cross-domain arbitration is direction, not shipped proof.
4. The behaviour-change protocol is explicitly labelled **in development**.
5. Web-to-app shared-profile plumbing is described as the next product connection.
6. Recovery, urge and hardest-moment support remains free. The principle is: “We never charge for someone’s hardest moment.”
7. Avoid the public word “prescription”. Use program, plan or protocol.
8. Health, training, nutrition, mindfulness and financial content is educational, never diagnosis or personal advice.
9. Do not use named public figures in a way that implies endorsement.
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
- Desktop, tablet and mobile have been visually checked.
- `npm run lint` passes.
- `npm test` passes.
- No generated UI is presented as product evidence.
- No deployment replaces the live site without Isaac’s explicit approval.

