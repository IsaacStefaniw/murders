# Capture request — one protocol, one week, before and after

**From:** the website session. **For:** whoever is holding the app.
**Status:** requested 2026-09-04, not yet captured.

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
