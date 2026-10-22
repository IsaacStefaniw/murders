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
`npm run usertest:coachvalue`, and `npm run usertest:foodquestion`

**Corrected 22 Oct 2026. The first draft of this table was wrong about
nutrition, and it was the most important cell in it.**

The drafted table read Nutrition **0 items, 0 done** and the law below
was built on that zero. The zero is a harness artefact. `buildPlan`
starts the nutrition path only when `foodAim` is answered and is not
`'none'` — and of **eleven simulated personas, exactly one**
(`endurance_athlete`) **answers the food question.** Ten never switch
the coach on, `career_optimiser` among them. Six months of cohort
validation across eleven people never ran the nutrition coach once.

Answer the question and run the same persona again
(`npm run usertest:foodquestion`):

| | foodAim unanswered | foodAim answered |
| --- | --- | --- |
| paths started | training, recovery | **nutrition**, training, recovery |
| nutrition items planned | 0 | **96** |
| nutrition items done | 0 | **42** |
| nutrition routines | 0 | **3** |
| training items | 161 / 83 done | 161 / **78** done |

Nutrition is the second-largest coach in his week the moment it is
asked about — ninety-six items to training's hundred and sixty-one. It
is not thin. The thin thing is what it KEEPS — and the
precise defect is sharper than "seven strings".

`mealPlan` has **one writer in the whole codebase**: `saveMealPlan`,
called from `src/app/session/meals.tsx:228`, where **the person types
the dinners in themselves.** Nothing composes it, nothing progresses
it, nothing re-reads it to decide next week. Compare training:
`programme.ts` prescribes the sessions, the sets, the reps and the
rest, and auto-regulates them against logged lifts without being
asked.

> **Training hands the person a decision. Nutrition hands them a
> form.** Sixty items a week of a coach that has never decided
> anything.

(What this table cannot tell you: whether a real phone ends up with a
`mealPlan` in it. `SimSnapshot` has no `mealPlan` field, so the
simulator does not model it and must not be quoted about it. The claim
above is from reading `store.ts`, which is the right instrument for a
question about persisted state.)

Current, with the food question answered:

| coach | items | done | owns |
| --- | --- | --- | --- |
| **Training** | **161** | **78** | `trainingProgramme` — 4 weeks, sessions, sets, reps, rest, auto-regulation |
| **Nutrition** | **96** | **42** | `mealPlan`, which **the coach does not write** — see below |
| Recovery | 33 | 17 | nothing |
| Relationship | 8 | 6 | nothing |
| Habits & urges, Money, Work, Family | — | — | nothing |

Note the cost, which nobody expected and which is the first real
argument against simply switching nutrition on: training completions
fall **83 → 78** when nutrition starts. Ninety-six new items bought
forty-two completions and cost five. That is not free, and a redesign
that adds a coach without taking anything out is spending somebody's
Tuesday.

**A correction to this table's own method, 22 Oct.** The first version
of `foodquestion` reported Training 161/**95** where
`usertest:coachvalue` reports 161/**83** — two different numbers for
one named, deterministic persona. The harness filtered
`Object.keys(habitOdds)` where `makeUserOf` filters `HABIT_KEYS`, which
draws from the same seeded PRNG a different number of times and so
built a **different person**. Its nutrition column read 60/32; the
honest figures, once the baseline matched the baseline everybody else
measures, are **96/42**. `HABIT_KEYS` is now exported with a comment
saying why its order is load-bearing. Three wrong measurements of this
harness in one day, all of which looked like results.

**The law this produced survives the correction, and is better
evidenced by it**:

> **A coach is worth coming back for when it owns a progressing
> artefact. Otherwise it is a reminder.**

A zero was weak evidence for that law: a coach that delivers nothing
might simply be absent. Ninety-six items is strong evidence. Nutrition
put ninety-six things in his week, he did forty-two of them, it never once
wrote down what it had decided — and his verdict was *"the gym trainer
was ok but nothing else incentivised it either."* Thirty-two completed
nutrition items left no trace a person could return to. **That is the
law demonstrated rather than assumed.**

Two consequences nobody should lose:

1. **§6 does not change.** Nutrition still needs a progressing
   artefact, for exactly the reason it always did, and now with a
   measured sixty items a week to hang on it rather than a blank.
2. **The food question is a product bug of its own, independent of the
   redesign.** It is `optional` in an interview whose own
   `sections.ts` says setup asks everything, and ten of eleven
   simulated people decline it. If simulated people skip it, real
   people skip it, and skipping it silently removes half the product
   the brief has just decided to build. Before anything else is
   designed: a person who skips the food question must not thereby
   lose the coach.
3. **Switching it on is not the increment.** Ninety-six items and no
   artefact is sixty-odd reminders a week for the one persona the app
   is already losing. Two seats said this independently and they are
   right: the branch ships WITH the artefact or it makes things worse,
   and it would make them worse in the most expensive way available —
   by re-proving the law on a real person.

### Adherence over six months
`npm run usertest:decay`

**Corrected 22 Oct 2026, same day this brief was written.** The first
draft of this section carried three numbers that do not reproduce, and
five role positions were written against them before anyone re-ran the
script. The figures below are what it prints today. The correction is
recorded rather than quietly overwritten, because the whole point of
§2 is that a number in this brief can be checked, and a brief that
edits its own history is no better than a vendor blog.

| | drafted | measured today |
| --- | --- | --- |
| pooled week 1 | 42% | **43%** |
| by week four | "climbs to 55% and holds" | **47%**; first four weeks 47%, last four 52% |
| decliners | student −11, young professional −7, career_optimiser −3 | **career_optimiser −8, and nothing else** |

Week 1 is **43%** — and it is still the worst week of twenty-six, which
is the claim that mattered and the one that survived. The climb to 52%
is slower and smaller than drafted: five points over six months, not
thirteen in a fortnight. The climb is not the person improving —
`truth.adherence` is a fixed draw and no term in the sim's completion
model varies with time. **It is the app learning them, and week one is
the week before it has anything to learn from.**

**One persona declines: `career_optimiser`, 61% → 53%, −8 points over
1003 planned items** — the largest plan in the cohort. `student` reads
**+7** and `young_professional` **+12**, so the drafted sentence that
"the target market is among the decliners" was built on two personas
that are in fact improving.

The sentence survives anyway, and more sharply than it deserved to.
`career_optimiser` is the persona closest to Alex: the only one in the
cohort who would pay AU$89.99, and the only one the app is losing. The
others improve because something outside the app holds the week — a
roster, a child, a retirement, a race. **He is held by nothing, so the
product has to be the thing that holds it.** One decliner who is the
customer is a worse finding than three decliners who are not.

### Where the plan is wrong
- `npm run usertest:statedtime` — **46 of 72 active routines drift 15+
  minutes between the time the app shows and the time it runs; 35 drift
  an hour or more** (drafted as 36 of 63 and 28; re-measured 22 Oct, and
  it has got worse, not better). Worst: a night nurse whose wind-down
  shows 06:00 and runs 23:40.
- `npm run usertest:atwork` — **10.5% of items (718 of 6841) are
  scheduled inside working hours** (drafted as 8.6%; re-measured 22 Oct).
  The pooled figure hides the finding. Per persona it runs from 1% to
  **34%**, and it is worst for `student` (34%), `health_rebuilder` (26%)
  and `new_parent` (23%) — **not for the target.** `career_optimiser` is
  2%, 18 items of 1003. So the at-work clash is a real defect and it is
  **not** why Alex left; a redesign that fixes it and expects him back has
  mistaken somebody else's problem for his.
  `shift_nurse` reads **0%** at work, which is not a clean week — it is
  the wrap-blind comparison failing to see a 19:00–07:00 shift at all.
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

### The citation this section was first built on, withdrawn

**Corrected 22 Oct 2026.** The first draft of §5 read:

> *"Supporting evidence, from the one primary source in the retention
> literature worth citing — Duolingo's own published tests: a rule that
> let a single exercise keep a streak alive moved nothing and attracted
> the least active users."*

**Neither half of that traces, and it is withdrawn in full.** Sent to
check it, the research seat found:

- The ">40% more 7-day streaks" figure circulating as Duolingo's is
  **not Duolingo's**; it traces to a third-party design blog. Duolingo's
  own published numbers for streak decoupling are **+3.3% D14
  retention, +1% DAU, +10.5% more daily learners on a streak at 20 days
  (+19% for new learners)** — roughly a quarter of the effect the draft
  implied, in the direction the draft wanted.
- **"Attracted the least active users" appears in no source that could
  be found.** It was asserted here and in the research role definition,
  and traced by neither.
- Worse, the citation argues against its own conclusion. Duolingo's
  **largest** reported lift is Streak Wager at **+14% D7** — and a
  wager is **loss-framed**. §5 cited Duolingo for "nothing can be lost"
  over Duolingo's best published result from loss.
- The pages could not be read directly: `blog.duolingo.com` and
  `making.duolingo.com` are both DNS-unreachable from this container,
  so even the corrected figures are **a search engine's rendering, not
  a primary read.** Graded accordingly.

Rule 5 of §4 says every health claim carries a citation, sample, design
and caveat and the grade is never overclaimed. This brief broke its own
rule 5 in the section asking everyone else to be rigorous, and did it
in the direction of the answer it had already chosen. It is recorded
here rather than deleted, because the failure is the instructive part.

### The one primary source that does exist

Rewley J, Guszcza J, Dierst-Davies R, Steier D, Szwartz G, Patel M.
**Loss Aversion Explains Physical Activity Changes in a Behavioral
Gamification Trial.** *Games for Health Journal* 2021;10(6):430–436.
doi:10.1089/g4h.2021.0130. Trial NCT03311230.

- **Design:** randomised, 602 participants, three level-based
  gamification arms; 70 points allocated weekly, 10 lost per missed day.
- **Finding:** participants exhibit loss aversion **"so long as the loss
  relates to something that was earned rather than endowed."**
- **Caveat, and it is load-bearing:** the effect **did not survive the
  12-week follow-up** in any arm but competition.

Read honestly, that source does not support §5 — it names earned loss as
the active ingredient, and §5 removes exactly that. It also does not
support streaks, because the effect did not last. It is cited here
because it is the best primary evidence that exists and it is
inconvenient, which is the only reason worth citing anything.

### What there is no evidence for, either way

**No primary trial compares an accumulated non-losable level against a
losable streak for the same behaviour.** Rewley/STEP UP has no
non-losable arm. NCT07220044 (streak versus tally, 30 days) is
registered with no results posted.

So **§5 is a hypothesis, not a resolution**, and this brief should stop
calling it one. It may still be the right thing to build — on rule 1,
which is a decision about what this product refuses to be, not a claim
about what works.

### The objection that survived the round

Three of four seats attacked §5 on latency rather than loss, and the
research seat found the sharper version in the code:

> Because the ladder is **monotonic**, "show the rungs behind as well as
> the one ahead" produces a screen that **cannot change when the
> person's life does.** Somebody four weeks into doing nothing sees the
> identical screen they saw the day they stopped.

§5 solves "do not punish the bad week" by making the bad week
**invisible** — and the churn datum was never *"it punished me"*, it was
**"I opened it and it was wrong."** A screen that cannot be wrong
because it cannot change is the same failure wearing a kinder face.

What the rungs are missing is not loss. It is the app saying what it
observed about the last fortnight, beside the rung, without grading it —
which `planner/learnedStart.ts` already does for times and nothing does
for anything else.

### What must be decided, not assumed
- Can anything be *lost*? (The proposal says no; the one primary source
  says earned loss is the active ingredient; rule 1 says no anyway.)
- **How often does this thing fire?** `LEVEL_GATES` makes the first rung
  unreachable before about week four and the top before week 32. The
  real user left at week six. A reward that fires three times in eight
  months cannot be the reason to open the app on a Tuesday.
- Is the unit **above** the rung or **below** it? Three seats
  independently answered below, and named the same thing: **the numbered
  four-week block, which ends because four weeks passed rather than
  because somebody performed.** A thing that ends is the only honest
  urgency available to a product that refuses to keep score, and it
  cannot become a scold under rule 7.
- Does the display corollary survive at all? Two seats say no on the
  same ground: filled-and-unfilled segments are read as a progress bar
  whatever they are called, and `paths/LevelCard.tsx` already renders
  two `Meter` bars at `sessions / gate.sessions` and `weeks /
  gate.weeks` — percentages drawn as rectangles, which §4.1 forbids.

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
