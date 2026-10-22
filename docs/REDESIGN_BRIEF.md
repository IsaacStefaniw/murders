# The redesign brief

Isaac, 22 Oct 2026:

> *"let's be the gym trainer and go deep on nutrition - but also
> incorporate the other coaches and protocols. Can we create levels and
> gamify this? It really needs a redesign."*

This is the brief every agent and every session works from. It exists so
that nobody re-derives the diagnosis, and so that nobody proposes
something the evidence already rules out.

**Read `WHY_HE_STOPPED.md` first.** This brief assumes it.

---

## 1. The decision that has been made

Two coaches are the product. **Training** and **Nutrition.** Everything
else becomes supporting cast rather than a seventh door on a menu.

That is not a cut. "Incorporate the other coaches and protocols" is part
of the instruction, and it is the harder half: the 323 practices, the
seven voices and the researched ladders stay, and have to find a home
inside two coaches instead of beside them.

## 2. The evidence this is built on — all reproducible

Every number below comes from a script in `tools/usertest`. None of it is
borrowed from a vendor blog.

### What each coach gave the target persona in six weeks
`npm run usertest:coachvalue`

| coach | items | done | owns |
| --- | --- | --- | --- |
| **Training** | **148** | **79** | `trainingProgramme` — 4 weeks, sessions, sets, reps, rest, auto-regulation |
| Habits & urges | 32 | 12 | nothing |
| Relationship | 10 | 4 | nothing |
| Nutrition | 0 | 0 | `mealPlan` — `{ weekStart, dinners: Record<number,string> }`, i.e. seven strings |
| Money | 0 | 0 | nothing |
| Work & leadership | 0 | 0 | `workBlock` (thin) |
| Family & adventure | 0 | 0 | nothing |

**The law this produced**, and the single most important line in this
brief:

> **A coach is worth coming back for when it owns a progressing artefact.
> Otherwise it is a reminder.**

### Adherence over six months
`npm run usertest:decay`

Week 1 is **42%** — the worst week of twenty-six. It climbs to 55% by
week four and holds to week twenty-six. The climb is not the person
improving: `truth.adherence` is a fixed draw and no term in the sim's
completion model varies with time. **It is the app learning them, and
week one is the week before it has anything to learn from.**

Three personas decline over the six months — student −11, young
professional −7, `career_optimiser` −3. All three are young, time-poor,
and have no caring responsibility anchoring the week. **The target market
is among the decliners.** Everything that improves has external
structure: a roster, a child, a training block, a retirement.

### Where the plan is wrong
- `npm run usertest:statedtime` — **36 of 63 active routines drift 15+
  minutes between the time the app shows and the time it runs; 28 drift
  an hour or more.** Worst: a night nurse whose wind-down shows 06:00 and
  runs 23:40.
- `npm run usertest:atwork` — 8.6% of items are scheduled inside working
  hours, and those complete 5 to 34 points worse than items in free time.
- **Every work-hours comparison in the codebase is wrap-blind**
  (`start <= m < end`), so no night shift is protected anywhere.

### Why he personally stopped
Asked directly, he chose **"I opened it and it was wrong — the plan
didn't match my actual day"**, and **"notifications on, and I ignored or
killed them."** Then: *"Still I didn't want to come back really, the gym
trainer was ok but nothing else incentivised it either."*

## 3. What already exists and is invisible

Nobody should design a level system from scratch. There is one.

- `features/paths/level.ts` — a **four-rung ladder per coach**:
  `foundation → developing → established → advanced`, with
  `LEVEL_LABEL`, `LEVEL_BLURB` per path, `levelProgress` computing
  sessions-to-go and weeks-to-go, and `earnedLevel` gating the top rung
  on logged evidence.
- `features/paths/ladder.ts` + `nextRung.ts` — the researched practice
  ladders, rung by rung, with a coach line for reaching one.
- `features/training/programme.ts` — the only deep artefact: four-week
  blocks, phases, prescribed exercises, auto-regulation against logged
  lifts.
- `features/health/standing.ts` — what a published score MEANS, in words,
  instead of a numeral.
- `features/coaches/interrupt.ts` — one arbitrated interruption, two
  answers, always says why it fired.

All of the first two render only inside `/path/[id]`, two taps behind the
Coaches tab.

**The level system is built. It has never been the spine of the product.**

## 4. The non-negotiables

A proposal that breaks one of these is not a proposal. They were each
argued through with evidence; changing one needs a new argument, not a
fresh opinion.

1. **No scores, no percentages, no streaks, and nothing that resets to
   zero.** A missed Tuesday is a missed Tuesday.
2. **Accountability means being known, not being graded** (`PERSONA.md`
   §3.3).
3. **On-device only.** No account, nothing leaves the phone. Funnel
   telemetry is four fields and is off in every 1.0 build.
4. **Educational structure, never medical advice.**
5. **Every health claim carries a citation, sample, design and caveat,
   and the grade is never overclaimed.**
6. **The cohort completion floor is 0.25 and is never lowered to make a
   build pass.** Two changes were reverted this month rather than lower
   it.
7. **Copy is plain and specific: never a scold, never a cheerlead.**
8. **Markers are held out of any App Review build** (`EXPO_PUBLIC_MARKERS`).

## 5. The live tension, and the proposed resolution to attack

Isaac has asked for levels and gamification twice. Rule 1 forbids the
usual implementation of both. This is the central design question of the
redesign and it is **not** resolved by refusing it.

The proposed resolution, for the agents to stress-test rather than
accept:

> **A level you earn and keep is not a streak you can lose.**
>
> A streak is a state destroyed by one miss, so it punishes the week a
> person most needs the app. A level is accumulated evidence: a bad
> fortnight costs you time to the next rung, never the rung.
>
> Corollary for display: **a bar that empties is a scoreboard; a ladder
> you have climbed is a record.** Show the rungs behind as well as the
> one ahead.

Supporting evidence, from the one primary source in the retention
literature worth citing — Duolingo's own published tests: a rule that let
a single exercise keep a streak alive **moved nothing and attracted the
least active users**, and their conclusion was that the standard needed
to be *clearer*, not lower. Read that next to the 0.25 floor.

What must be decided, not assumed:
- Can anything be *lost*? (The proposal says no.)
- Is there a unit of progress above the rung — the thing that makes four
  rungs across two coaches feel like a journey rather than a setting?
- Does "gamify" survive rule 7, or does it become a scold the first time
  somebody has a bad fortnight?

## 6. What "deep on nutrition" has to mean

Training is the benchmark and the test is mechanical: **what is
nutrition's equivalent of a four-week block with prescribed exercises,
sets, reps, rest and auto-regulation against logged performance?**

Today nutrition owns `{ weekStart, dinners: Record<number, string> }`.
Seven strings. Its promise is already right — *"No diet, no logging.
Protein-first dinners decided once a week, a walk that blunts the glucose
spike, and your own protein number"* — and the promise is not kept by
seven strings.

Constraints that make this hard and must be respected: no food logging
(rule 1 in spirit — a tally somebody is failing), no diet, no calorie
counting, and the only number collected is weight, used for a protein
target.

## 7. What "incorporate the other coaches" has to mean

Five coaches and most of 323 protocols have to live inside two. The
options are not equal and the choice needs an argument:

- **As practices inside the two programmes** — a wind-down becomes part
  of the training block's recovery, not a sixth coach.
- **As the interruption layer** — `coaches/interrupt.ts` already lets any
  coach say one thing at the right moment without owning a tab.
- **As the ladder's upper rungs** — connection and habits practices
  become things the two programmes unlock.

What is NOT acceptable: deleting the researched content, or leaving five
doors that lead nowhere, which is the state that produced *"nothing else
incentivised it."*

## 8. What every agent must deliver

Not opinions. Each role produces:

1. **A position** on the redesign, in its own voice, 400 words maximum.
2. **The one thing it would build first**, and why that one.
3. **The thing it believes is wrong with the proposed resolution in §5.**
4. **A falsifiable prediction** — something that would show up in
   `tools/usertest` or in TestFlight if the position is right.

A position that cannot be wrong is not a position. A proposal that cites
no number from §2 will be discarded.

## 9. What this cannot tell us, said once so nobody forgets

The simulator **has no churn model.** Nobody in it leaves. It measures
adherence among people who keep using the app, so every curve in §2 is
the optimistic case and the one real user quit. Telemetry is off, so
there is no funnel data either.

**Ten people in TestFlight outrank all of it.** Any design here is a
hypothesis until that happens.
