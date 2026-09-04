# Capture request — one protocol, one week, before and after

**From:** the website session. **For:** whoever is holding the app.
**Status:** captured 2026-09-04 — frames 1–3 delivered as `web/public/images/app/app-protocol-*.jpg`; frame 4 not reachable from the product as it stands. Provenance and the reason in `docs/APP_SCREENSHOTS.md`.

## What the site needs, and why it cannot draw it

The library section now makes the strongest claim on the page: 177 practices
that grade themselves, then *run* themselves. Add one and it is planned into a
real week, at an hour the scheduler picks, and it then answers to your results
the same way a training block does. That claim is true — `toRoutine` in
`src/features/knowledge/protocols.ts`, the scheduler, and the app's own library
copy at `src/app/library.tsx:116` all say so — and the website currently asks
visitors to take it on trust.

The learning-loop animation was extended to say the loop is not training-only
(`web/components/intent-motion/MotionProofs.tsx`), but it says it in a sentence
under a drawn diagram. `web/CLAUDE.md` boundary 10 is explicit: product motion
must show reproducible behaviour, and a hand-drawn diagram is not evidence of
the app working. So the honest version of this claim needs real pixels, and
real pixels can only come from a build.

This is the single highest-value capture left. Everything else on the page has
either a screenshot or a number behind it; this has neither.

## The four frames

One protocol, one week, captured from the same seeded state so that the only
difference between frames is the thing being demonstrated. If the week, the
date, the timezone or the seed shift between frames, the sequence stops being a
proof and becomes an illustration with photographs in it.

| # | Route and state | Must show |
|---|---|---|
| 1 | `/library`, one protocol open | The protocol with its evidence grade and safety line, and the **Add to my plan** button unpressed (`src/app/library.tsx:73`) |
| 2 | `/plan` (Week tab), **before** the add | The week ahead with the chosen day expanded. The protocol is absent. |
| 3 | `/plan` (Week tab), **after** the add, same week | The same day, same other items, with the protocol now placed — at whatever hour the scheduler gave it |
| 4 | `/plan` or `/today`, after the week changes | The same protocol at a **different** time, with the app's reason for moving it |

Frame 4 is the one that matters and the one that takes setup. Frames 2 and 3
show a to-do list being appended to; only frame 4 shows the thing the page is
selling, which is that the placement is not fixed. Whatever produces it —
`detectMoveOutcome` after three manual moves that were then completed, a
sleep-anchored protocol shifting because the wake time moved, or a hard week
shrinking the plan — is fine, as long as the reason string on screen is the
app's own output rather than a caption written for it.

## Choosing the protocol

Prefer one that is **open on the free tier** (the first
`FREE_PROTOCOLS_PER_PILLAR` in each pillar). A visitor who installs the app and
cannot find the practice from the animation without paying has been shown a
paywall dressed as a feature.

Prefer one that is **anchored** rather than free-floating — sleep- or
wake-anchored — because an anchored protocol has a visible reason to move when
the week moves, which is what frame 4 has to demonstrate. `morning-light` fits
both, and already appears in `app-library.jpg`, so the strip would read
continuously.

## Fix this before capturing

`src/lib/scheduling/adaptation.ts:194` interpolates `routine.title.toLowerCase()`
into the suggestion sentence:

> You've moved 6 of your last 6 **training that sticks** sessions to the evening

The doc comment at `:152` shows the intended shape with a generic noun — "6 of
your last 8 workouts". Any multi-word routine title garbles it, and every
protocol title is multi-word. Frame 4 is likely to surface exactly this
sentence, so the bug lands in the marketing material unless it is fixed first.
It was raised in `docs/APP_SCREENSHOTS.md` when it appeared in `app-today.jpg`;
this is the second capture it would spoil.

## Capture settings

Match `docs/APP_SCREENSHOTS.md` exactly, so these frames sit beside the existing
eight without a visible seam:

- fresh `expo export --platform web` of the capture commit
- headless Chromium, 420×900 CSS pixels, 3× scale, `Australia/Sydney`
- downsampled to 840×1800 JPEG
- the same seeded `localStorage` state as the App Store screenshots: onboarded,
  Plus on, sex at birth recorded, twelve logged workouts across six weeks

## What to hand back

The four JPEGs, plus a block for `docs/APP_SCREENSHOTS.md` recording the commit
they came from, the route and state of each, and — for frame 4 — what was done
to the seed to produce the adaptation. That last part is the provenance that
matters: without it, nobody can tell later whether the frame still reflects what
the app does, and a stale product screenshot fails silently.

If frame 4 turns out not to be reachable from a seed in a reasonable amount of
work, say so and hand back the first three. Three real frames and an honest gap
is a better outcome than a fourth frame that was staged.

---

## Answered — 4 Sep 2026

Frames one to three are captured, from one seed, with provenance in
`docs/APP_SCREENSHOTS.md`. They are on the site: the library capture carries
the rating explainer, and the before/after pair shows the same Monday going
from fifteen planned items to sixteen with Morning light at 7:25am.

**Frame four was not captured, and should not be.** The app session found that
when a family block takes Morning light's hour, the scheduler drops the
ten-minute practice rather than moving it into the free minutes left in its
window. They recorded that as a scheduler weakness rather than staging around
it, which is exactly what this request asked for — three real frames and an
honest gap beats a fourth that was arranged.

That weakness is now the most useful thing this request produced. A practice
that quietly disappears when the week gets busy is the opposite of the claim
the site makes about it, so it is a product bug worth fixing before it is a
capture worth taking. When the scheduler moves the practice within its window
instead of dropping it, frame four becomes reachable and this section can be
deleted.

---

## Second request — a first Monday worth showing (4 Sep 2026)

`app-protocol-3-week-after.jpg` is now the hero image on the site, so it is the
first thing a stranger sees of the product. Isaac's verdict on it: "the first
day needs to show better protocols and structure — it's not a great day 1."

He is right, and the reason is visible in the frame. The Monday reads:

    7:00   Protein at breakfast
    7:25   Morning light
    8:15   Training that sticks        (30m)
    9:00   Work
    9:15   Deep work block             (1h)
    10:15  Growth block: A week that produces  (1h 30m)
    11:45  Work
    12:45  The urge answer: two-minute reset

Three problems for a first impression. **"Work" appears twice as a bare word**
with no duration and no next step, which reads like a gap in the data rather
than a plan. **Two abstract blocks back to back** — "Deep work block" then
"Growth block: A week that produces" — are hard to tell apart and neither says
what you would actually do. And **the whole afternoon and evening are absent**
from the crop, so the day looks front-loaded and thin: no meals, no wind-down,
nothing after 12:45.

What the site needs is a Monday that shows the range Isaac wants the product
known for. Ideally one seeded day containing, roughly in order: morning light,
breakfast, a training session, one protected work block, lunch, a short
meditation or breathing practice, an afternoon reset, dinner already decided,
a wind-down, and one relationship or family item. That is the "all-encompassing"
claim in a single screenshot, and no words on the page can do it as well.

Two asks, in order of value:

1. **A seeded first Monday with that spread**, captured full-length so the
   evening is in frame. If the seed cannot produce all of it, the closest
   honest version plus a note on what is missing and why.
2. **The bare "Work" entries** — if those are calendar placeholders, they
   should either carry a duration and a next step like everything else, or not
   be rendered as plan items. As they stand they make the plan look incomplete
   in the one frame most people will see.

Same provenance rules as before: one seed, documented, in
`docs/APP_SCREENSHOTS.md`. And if the honest answer is that the app does not
yet produce a day that full, that is a product finding worth more than a
photograph — say so and we will show something else.
