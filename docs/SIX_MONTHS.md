# Walking the app, and ten lives through it

Two exercises, one afternoon. The app was built for web, served, and driven
in a real browser at 390×844 as a new user. Then ten personas were run
through the real engine for twenty-six weeks each.

Everything below was observed, not inferred. Where a finding is scoped to
the web build it says so.

---

## Part 1 — Walking the app

Onboarded as a 9–5 worker with a partner and kids, priorities Family ·
Health · Work, trains 3×, gym, sore joints, ambition *"Get strong enough to
keep up with my kids"*.

**Zero console errors and zero page errors through the entire flow.** The
interview is genuinely good: twelve questions, each with a reveal line that
tells you what your answer just bought. That mechanism is the best thing in
the product and it is the reason the rest of this list is worth fixing.

### 1.1 Tab navigation does not work on web — LAUNCH BLOCKER for the preview

Pressing Week, Coaches or Progress changes the URL — `/today` → `/plan` →
`/life` → `/data` — and **the screen stays on Today.** Verified with real
pointer events, not synthetic clicks.

The mechanism, from the DOM: every visited screen stays mounted at full
height with `display:flex; visibility:visible; opacity:1`. After three taps
there are seven full-screen containers stacked, all painting. Some carry
`aria-hidden="true"` — the navigator believes it has hidden them — but
nothing sets `display:none` or `visibility:hidden`, so they still render,
and Today wins because it was mounted first.

Scope, precisely:

- **iOS is almost certainly fine.** `react-native-screens` uses real native
  view controllers there; this is a web-renderer failure.
- **App Store screenshots are fine.** `scripts/store-shots/capture.js`
  opens `ctx.newPage()` per route, so each shot mounts one screen. That is
  also the proof the routing is correct and the workaround is a fresh load.
- **The shareable web preview is not fine.** `scripts/preview-web.sh`
  exists to produce a single-file preview to send people. Anyone who opens
  it can see exactly one tab. If that preview has been sent to anybody —
  investors, testers, the agency — they saw a one-screen app.

The same root cause has an accessibility consequence on every screen: while
the interview is open, the **welcome screen's buttons are still in the DOM
and still clickable** (`pointer-events: auto`, opacity 1) — "Continue",
"See an example day first", "Restore a backup". A screen-reader user on
question 3 can reach the buttons of a screen they left.

### 1.2 A new user is told their heart health is "Low" on day one

The Progress tab, on a fresh account, first visit:

> **0 across the 1 of 8 we can see**
> **Low on the American Heart Association's scale, where 75 and above is
> high and under 50 is low.**

One component readable. Activity is zero because the week was planned two
minutes ago and nothing has happened yet. That zero is averaged into a
composite of one, the composite is banded, and the band is printed under
the American Heart Association's name.

This is the `LAUNCH_BRIEF.md` §3 decision arriving as something worse than
a copy problem. A person's first contact with the measurement layer tells
them, with a medical body's name attached, that their cardiovascular health
is Low — from one component, on day one, before they have had a week.

`essential8.ts` already argues that an unwatched week must not read as a
zero. The guard only covers a week with no plan at all; a plan created
minutes ago counts as "watched", so day one is a real measured zero. It
is not one.

### 1.3 The plan does not serve the stated top priority

Priorities were Family (1), Health (2), Work (3). The plan built:

```
WEEKLY RHYTHM
  Wind down, screens away      S M · around 8:25pm
  Get strong enough to keep u… M W · around 12:05pm
```

Two items. **Nothing for family. Nothing for work.** The #1 priority
produces nothing at all, because `household` is `deferTo: 'family'` — the
app does not know whether there is a partner or children, so it cannot
build a family routine, so the priority is inert.

This is the gating problem from `LAUNCH_BRIEF.md` §2 with a face on it: the
user ranked family first, watched the app say *"Noted. When two things want
the same hour, family wins"*, and got a week with no family in it.

### 1.4 The ambition becomes the calendar block, truncated

"Get strong enough to keep up with my kids" appears on Today **five times**,
truncated every time as `Get strong enough to keep u…` — in NOW, in MINIMUM
WEEK, in NEXT, in FROM THE COACH, and as the 12:15pm block itself.

The workout is *named after the ambition*. So the block that should say
what to do says a slogan instead, cut off mid-word. `itemGuidance.ts`'s
rule is "NOTHING IS A BARE TITLE" — this is a bare title that is also too
long to read.

The simulation shows the general form of this: an ambition the composer
cannot classify lands in domain `personal` with **zero milestones** and
becomes a routine named after itself. "Six months without a drink",
"Finish my thesis without falling apart" and "Still carrying my own
shopping at 85" all produced a goal with no steps and a recurring calendar
block with no content. Anything it *can* classify gets 2–4 milestones.

### 1.5 A session is scheduled inside work hours, after promising not to

The interview said, in its own reveal lines:

> *"5 work days. Nothing gets scheduled over them."*
> *"Then your own time starts at 17:30, and that is where the evening plan goes."*

The session landed at **12:15pm**. Either the placement is wrong or the
promise is, and the promise is the more damaging of the two to get wrong
because the user watched the app make it.

### 1.6 The only coach-built session on day one is paywalled

> **YOUR COACHES BUILT 1 SESSION FOR TODAY**
> Wind down, screens away — **Plus** — around 8:25pm · 20 min
> *Run my day with Plus*

First day, first screen. The single thing the coaches produced is locked,
under a heading that announces they produced it.

### 1.7 Day-one noise

`ALREADY DONE` renders seven days × eight habit chips — **56 tappable
elements** — on an account with no history. Today renders **13 distinct
blocks** for a user with one real session, which is `LAUNCH_BRIEF.md` §7
confirmed on a real phone at real width.

### 1.8 The progress counter visibly skips

The interview shows "8 of 12" then "10 of 12". A step was conditionally
skipped and the counter was not renumbered, so the user watches it jump.

---

## Part 2 — Ten lives, six months

Five personas existed. Read end to end they describe one person: a working
adult, mostly partnered, mostly nine-to-five, all under about forty-five,
and **not one of them answers `weekShape`** — a core signup question with
six values. Four of the six shapes the product sells to had never been run.

Five were added: a night-shift nurse, a 75-year-old, a student, someone
whose goal is stopping drinking, and a marathoner. They carry `weight: 0`,
so the weighted population sample is unchanged; select them by name.

### 2.1 The engine is solid

Ten users × 182 days: **zero errors, zero overlap violations, zero contract
violations.** Nothing in the scheduler or the session generators broke over
six simulated months. That is not nothing.

### 2.2 The pathway coaches were never being measured

`runUser` dropped `pathStarts` on the floor. The real approval screen
(`plan-review.tsx`) calls `startPath` for each, so **every cohort number
ever produced was measuring a product with three of its seven coaches
switched off.** The engine now takes `startPaths`, and the ablation is the
answer to "are the coaches adding value?":

| persona | done/week, coaches off → on | change |
|---|---|---|
| endurance_athlete | 10.8 → 30.7 | **+184%** |
| student | 3.8 → 7.1 | +87% |
| young_professional | 5.8 → 10.5 | +81% |
| health_rebuilder | 3.3 → 4.7 | +42% |
| retired_active | 9.9 → 13.2 | +33% |
| recovery_first | 5.9 → 7.8 | +32% |
| busy_parent_exec | 14.7 → 19.2 | +31% |
| new_parent | 6.9 → 8.8 | +28% |
| entrepreneur | 15.0 → 15.9 | +6% |
| **shift_nurse** | **3.7 → 3.7** | **0%** |

**Yes, the coaches add value** — a median of about +32% in things actually
completed per week. That is the clearest good news in this document.

Two caveats worth holding. Completion *rate* often falls as volume rises
(young_professional 55% → 44%, new_parent 45% → 42%), which is the trade
`report.ts` already names. And the gain is not distributed evenly.

### 2.3 The app is worth nothing to a night-shift worker

`shift_nurse`: **3.7 → 3.7 completions a week.** Identical to one decimal
with every coach switched on. She accumulates **59 unplaced items** over
six months and finishes the half-year completing 35% of a week that was
already the thinnest in the cohort.

Her `weekShape: 'shift'` answer and her 19:00–07:00 hours change nothing
the planner does. The interview even promises they will: *"Then the plan
follows your roster rather than a fixed week."*

A related detail found while writing her: **none of the five options on the
sleep question describes a night shift.** They are all daytime wake/bed
pairs. She cannot answer it correctly, so everything downstream of sleep is
wrong for her before the plan is built.

### 2.4 The person who most needs help is served worst

`health_rebuilder` — low capacity, overcommits, states five training days —
ends six months **completing 27% of her week**, having been handed about
17.7 items a week and finishing 4.7. Her goals are served in **12% of
weeks**.

The weekly review is supposed to prune to something survivable. Over
twenty-six weeks it deactivated two routines. She spent half a year
receiving roughly thirteen failures a week.

### 2.5 Four of ten finish six months with no milestone goal

`retired_active`, `student`, `recovery_first` and `new_parent` end the run
with no milestone-bearing goal. Three of them stated a clear ambition and
got an unmilestoned `personal` goal and a calendar block named after their
own sentence (§1.4).

`retired_active` is the sharpest case. A 75-year-old with joint and balance
constraints whose stated aim is *"Still carrying my own shopping at 85"*
receives a daily walk, a date night, a wind-down and a block called "Still
carrying my own shopp…". No strength work — the single best-evidenced
intervention for exactly that aim — and no function tests, though grip,
gait and balance are the markers most meaningful at his age and the app
already has all three.

---

## What this changes about the plan

`LAUNCH_BRIEF.md`'s sequence holds, with additions and one reorder:

**Before anything else**
1. **§1.1 web tab navigation.** Cheap to work around (fresh page per
   route), and until it is fixed the web preview misrepresents the app.
2. **§1.2 the day-one "Low" band.** This is `LAUNCH_BRIEF.md` §3, and the
   walk moved it from a copy decision to a launch blocker.

**New, from this exercise**
3. **§2.3 shift workers.** Either the planner honours a roster or the
   interview stops offering "Shifts, or hours that move" as an answer.
   Shipping a week shape that changes nothing is worse than not offering
   it.
4. **§1.3 priorities that build nothing.** Ranking family first must
   produce something, which means asking `household` at the point the
   priority is stated rather than deferring it to a coach the user may
   never open.
5. **§1.4 unclassified ambitions.** A goal with no steps and a calendar
   block named after a sentence is the composer's failure mode, and it hits
   the three most distinctive personas.
6. **§2.4 pruning.** The weekly review must actually cut. 27% after six
   months is the product failing the person it was most designed for.
7. **§1.6 the paywalled first session.** A first day whose only coach
   output is locked.

**Already on the list, now with evidence**
- Today's density (§1.7) — 13 blocks, 56 habit chips, one real session.
- The gating problem (§1.3, and `retired_active` getting no strength work).

---

*Method note. The walk used Playwright against the real web export at
390×844. The simulation used the real engine, real planner, real session
generators and real pathway builds — `sim/pathways.ts` says it best: every
number it produces is a deterministic property of the code, so a finding is
a defect rather than a forecast. The ten-life run is now
`sim/__tests__/scenarios.test.ts` so it does not have to be rediscovered.*
