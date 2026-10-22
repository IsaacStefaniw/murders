# Position — CEO

Every number below is from a run I made myself on 22 Oct 2026, not quoted
from §2. Three of §2's figures have drifted against the current code and
the brief should be corrected: at-work items are **10.5%** (718 of 6841),
not 8.6%; week one is **43%**; and `career_optimiser` now declines **8**
points, not 3.

I override no §4 non-negotiable. Nothing below needs one.

---

## 1. Position

The brief is right that two coaches are the product, and wrong about
which half is hard. It calls "incorporate the other coaches" the hard
half. The hard half is that we have never once delivered the second
coach, and we are about to design its depth before we have opened its
door.

`npm run usertest:coachvalue`, target persona, 45 days: Training
`started: yes`, 161 items, 83 done. Nutrition `started: no`, **0 items,
0 done**. Not thin — off. `buildPlan.ts:605` is
`startsNutritionPath = Boolean(foodAim && foodAim !== 'none')`, and
`foodAim` in `script.ts` is `optional: true, deferTo: 'nutrition'`. The
key to the nutrition coach is asked inside the nutrition coach. Health is
Alex's first priority and the spine asks him nothing about food.
Meanwhile `features/nutrition/plan.ts` is 346 lines of protein anchor,
plate shape, one-lever-at-a-time ladder and three-week weight-trend
adaptation — written, tested, unreachable. §6 asks what nutrition's
equivalent of a four-week block is. Most of the answer is already in the
repo, behind a question we decided not to ask.

The second number sets the shape of the whole redesign.
`npm run usertest:decay`: `career_optimiser` is planned **1003 items**,
more than any of the eleven personas, and is the **only** persona that
gets worse — 61% → 53%. Everyone else improves. Our answer to the most
time-poor person we have is more to do, and he is the one we are failing.
So this is a subtraction project with a gamification brief stapled to it,
and subtraction is the part of my job nobody else has.

That resolves the apparent contradiction in starting nutrition.
Nutrition's artefact must be **decisions, not items**: a protein number, a
plate shape, one live lever. One or two scheduled things a week against
training's 161. If nutrition ships as thirty more rows on Today, I will
have made Alex's actual problem worse, and I will say so rather than
count the rows as progress.

On gamification: the unit §5 is reaching for exists and is not a rung. It
is the **block** — four phased weeks ending in a reassess, dated,
finished, nothing to reset. Rungs stay what `level.ts` already is, a
programme selector deciding what the block contains, not a trophy. What
the person sees is a shelf of blocks they have finished. That is
"levels", it breaks no rule, and it needs no arithmetic.

*(383 words)*

---

## 2. The one thing I would build first

**Ask about food in the interview spine, and persist what nutrition
already computes.**

Two parts, one week of work, no new design:

1. Move `foodAim` (and `foodTrouble`) into the spine for anyone who names
   `health` in `priorities`. Today both are `deferTo: 'nutrition'`, so the
   second of our two headline coaches is opt-in behind the door it unlocks.
2. Replace `mealPlan: { weekStart, dinners: Record<number, string> }` in
   `store.ts:724` with what `nutrition/plan.ts` already produces — the
   protein target, the plate shape, the live lever, and the weight trend
   it adapts against.

Why this one and not levels, and not a new nutrition artefact. A rung is a
label on an artefact; we have four written `LEVEL_BLURB` rungs for
nutrition and no artefact under them. And a level system cannot be the
spine of a product whose second coach is switched off: `earnedLevel` reads
`completionEvidence(doneDates)`, nutrition's `doneDates` is empty by
construction at 0 items, so nutrition is pinned at `foundation` for ever,
with `advanced` priced at 90 sessions across 32 weeks. Four labelled rungs
onto a coach that cannot start is a door leading nowhere, which is the
exact state that produced *"nothing else incentivised it."* My job
description forbids me from accepting it.

Why not fix the simulator first, which is the open decision in
`WHY_HE_STOPPED.md` §5. It is real — `usertest:atwork` reports
`shift_nurse 19:00-07:00 ... atWork 0`, which is impossible, and
`health_rebuilder` completing better at work (30%) than free (24%) is the
model rewarding placements she cannot make. But repairing the instrument
changes no one's life, and §9 already tells us ten TestFlight users
outrank the instrument. Turn the second coach on, then put it in front of
ten people. Re-baseline in the same quarter, not before it.

---

## 3. What is wrong with the proposed resolution in §5

**§5 answers the loss question, and loss is not the live failure. Latency
is — and §5's display corollary condemns the component it would promote.**

The proposal's whole weight rests on "a bad fortnight costs you time to
the next rung, never the rung." Check the prices. `LEVEL_GATES.training.developing`
is **12 sessions across 6 weeks**. Alex left at six weeks. The first rung
on our best coach cannot move inside the window in which our one real user
churned, and pooled week one is 43% — the worst week of twenty-six.
A level you cannot lose is also a level you cannot feel. Whether a bad
fortnight costs the rung is a question about month four, and we are losing
people in week one.

Worse, the corollary is self-refuting against shipped code. §5 says *"a
bar that empties is a scoreboard; a ladder you have climbed is a
record"* — and `features/paths/LevelCard.tsx` renders two `Meter` bars,
`sessionFrac = evidence.sessions / gate.sessions` and `weekFrac =
evidence.weeks / gate.weeks`. Those are percentages drawn as rectangles.
Week-one Alex sees **0 of 12** and **0 of 6**: two empty bars and, per the
"show the rungs behind" corollary, an empty record behind him as well.
The counters are at least monotonic — `doneDates.length` and
`distinctWeeks` never shrink — so nothing regresses. They *freeze*. A
card that reads "12 more sessions and 6 more weeks" unchanged for a
fortnight is rule 7's scold delivered by arithmetic rather than by copy,
and it is the one thing on that screen a bad fortnight is guaranteed to
produce.

So my answer to §5's three open questions: nothing is lost, agreed; the
unit above the rung is the **finished block**, not a new abstraction; and
"gamify" survives rule 7 only if we delete the two meters. Show the
blocks, not the distance.

---

## 4. Falsifiable prediction

**Primary, one command, cheap to kill.** Add `foodAim: 'energy'` to
`career_optimiser`'s answers in `src/features/sim/personas.ts` — no new
artefact, no new content, one line — and re-run
`npm run usertest:coachvalue`. I predict Nutrition comes back
`started: yes` with **more than 30 items in 45 days** and non-zero done,
out of code that already exists. The arithmetic is checkable before the
run: `PATHS.nutrition.build` creates two routines, `days: [1,2,3,4,5]`
and `days: [0]`, which is six a week, so 45 days is about 38 if every one
of them gets placed.

If it comes back at 0 items, or under 10, **I am wrong**: nutrition really
is thin content rather than unreachable content, §6's build-a-new-artefact
plan is right and my "build first" is wrong, and the week should go to the
artefact instead.

**Secondary, the one that matters more.** If volume is what is killing the
target market, then capping Alex's week — any cap, however crude — moves
`career_optimiser` in `usertest:decay` from −8 points toward zero or
positive **without dropping any cohort persona below 0.25**. Falsified if
he still declines after the cap, or if the cap needs the floor lowered to
pass. The floor is not lowered; the proposal is withdrawn instead.

**In TestFlight.** Of ten users, more than half open the nutrition coach
in week one and at least three still have a live lever in week three. If
nutrition is opened once and never again, two deep coaches is the wrong
answer and "be the gym trainer" was right all along.

---

## 5. Required of this seat alone

**What this product refuses to be:** a product that keeps score — it will
never show you a number about yourself that can go the wrong way, and it
would rather be forgotten than be the app you open to find out how badly
you are doing.

**The single thing I would cut:** the **Coaches tab**. Seven doors, four
of which put zero items in Alex's week across 45 days, is the surface
that produced *"nothing else incentivised it."* Cutting the tab deletes no
research — the 323 practices and the ladders live on inside the two
programmes, in `coaches/interrupt.ts`, and as the upper rungs, exactly as
§7 requires — but it forces that choice to be made this quarter instead of
deferred, because with the tab gone there is nowhere for an unplaced coach
to hide.
