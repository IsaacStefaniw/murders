# Pathway honing — brief and method

**Written before the run, so the findings cannot be the ones I went looking for.**

## The ask

Send 1,000 profiles down each of the seven pathways, at varying skill
levels, weighted toward the main target market. Find where the programmes
are thin. Then build the questions, steps, plans and skills that thicken
them — so a pathway is worth paying for at every rung, not just the middle
one.

## What this is not

It is **not** the existing cohort simulation (`src/features/sim`). That one
runs humans through 182 days and measures adherence and retention: it
answers *"do people keep doing it?"*. This one answers a different and
prior question — *"is there enough there to do?"* — by auditing what each
pathway actually **builds** for each kind of person. A pathway can score
perfectly on adherence because it asks almost nothing of anybody.

It is also not a behavioural model. Nothing here predicts a human. Every
number below is a property of code output, deterministic and re-runnable.

## Population

7,000 profiles: 1,000 per pathway. Each is a real `LifeProfile` plus a real
intake answer set, fed through the real `PATHS[id].build()`.

**Market weighting.** The main target market is the person who pays $99 a
year: someone with a demanding week and the means to buy their way out of
running it themselves. That is `employed` and `selfDirected`. They get 60%
of the sample between them. The rest are represented because the app claims
to serve them and that claim has to survive contact with the builder.

| Week shape | Weight | Why this weight |
|---|---|---|
| `selfDirected` | 30% | The original case; highest willingness to pay |
| `employed` | 30% | The volume market, and the employer channel |
| `caring` | 12% | Real, underserved, and the hardest scheduling case |
| `shift` | 12% | The market nobody serves; a genuine wedge |
| `study` | 8% | Low ability to pay now, high lifetime value |
| `retired` | 8% | Expansion market; the association channel |

**Skill weighting.** Real cohorts skew to the bottom of any ladder, and the
bottom is where a thin programme does the most damage.

| Level | Weight |
|---|---|
| `foundation` | 35% |
| `developing` | 30% |
| `established` | 25% |
| `advanced` | 10% |

Seeded PRNG throughout. The same seed reproduces the same 7,000 people.

## What is measured

Seven checks. Each is a property of the built output, not an opinion.

1. **Builds at all.** Does `build()` return a plan with at least one
   milestone and at least one routine, without throwing, for every
   combination? A throw or an empty plan is a hard failure.

2. **Level differentiation.** Build the *same* profile at all four levels
   and diff the output — routine titles, routine count, weekly minutes,
   milestone titles. **If the four are identical, the ladder is decorative
   for that pathway.** `LEVEL_BLURB` promises the user something specific
   changes at each rung; this check is whether that promise is kept.

3. **Answer sensitivity.** For each intake question, hold everything else
   fixed and vary that one answer. If the build never changes, the question
   is dead weight — and the app says on screen *"Every question here
   changes the program — that's why they're asked."* A dead question makes
   that a lie.

4. **Market fit.** Does each week shape get a coherent programme? The known
   risks: a work pathway for a retiree, money options that assume a salary,
   a family pathway for someone without children, and anything that assumes
   a repeating week for a shift worker.

5. **Weekly load.** Total prescribed minutes per week, per profile, summed
   across started pathways. A number a real person cannot survive is a
   design failure even if every individual pathway is defensible.

6. **Insight coverage.** Does `insights()` return a concrete, personal line
   for every answer combination, or does some branch fall through to a
   platitude? Platitude rate is reported per pathway.

7. **Ladder reachability.** For each pathway and level, how much logged work
   does the next rung need, and is that a number a real person reaches
   inside a subscription year?

## Success criteria

The run is not the deliverable. The deliverable is the enhancement work it
justifies. But the run is judged on:

- Zero hard failures (check 1) across all 7,000.
- Every pathway differentiated across all four levels (check 2).
- Zero dead questions (check 3).
- No week shape with a systematically broken build (check 4).

Any of those failing is a finding to fix, not a number to report.

## Method

1. Write the harness (`src/features/sim/pathways.ts`) and the runner.
2. Run it. Record the raw output before interpreting it.
3. Write findings, ranked by how many of the weighted sample each affects.
4. Build the fixes — new questions, new level tuning, new plan content.
5. Re-run. The same harness is the regression test.
6. Lock the properties that must not regress as real unit tests.

## Standing constraints

Everything the app already promises still holds and is not up for
negotiation to make a number look better:

- Health, nutrition, recovery and finance content is education, never
  medical or financial advice.
- Recovery, urge and hardest-moment support is free, permanently.
- Substitute, never subtract: a constraint changes the movement, it never
  deletes the work.
- Nothing is claimed as shipped that is not shipped.

---

# Results

7,000 profiles, 1,000 per pathway, weighted as above. Run and re-run with:

```
PATH_N=1000 npx jest --testMatch "<rootDir>/src/features/sim/__tests__/pathways.audit.ts"
```

## Before

| path | same at all 4 levels | live questions | no milestones |
|---|---|---|---|
| training | 1000 (100%) | 2/2 | 0 |
| nutrition | 1000 (100%) | 1/2 | 0 |
| money | 1000 (100%) | 1/4 | 0 |
| work | 1000 (100%) | 2/4 | 0 |
| recovery | 1000 (100%) | 1/3 | 0 |
| relationship | 1000 (100%) | 3/3 | **1000** |
| family | 1000 (100%) | 2/3 | **1000** |

## After

| path | same at all 4 levels | live questions | no milestones | mean new min/wk |
|---|---|---|---|---|
| training | 0 (0%) | 2/2 | 0 | 269 |
| nutrition | 0 (0%) | 2/2 | 0 | 259 |
| money | 0 (0%) | 4/4 | 0 | 143 |
| work | 0 (0%) | 4/4 | 0 | 339 |
| recovery | 0 (0%) | 3/3 | 0 | 183 |
| relationship | 458 (46%) | 3/3 | 0 | 65 |
| family | 0 (0%) | 3/3 | 0 | 412 |

Zero throws and zero empty builds throughout, before and after.

## Findings, in the order they mattered

**1. The ladder was decorative in all seven pathways.** 100% of builds were
identical across all four levels. `LEVEL_BLURB` makes twenty-eight specific
promises about what changes at each rung and `buildGoalPlan` never received
a level, so none were kept. Six of the seven did not even render the level
card. Fixed by `features/paths/programme.ts`: an additive rung ladder,
applied centrally in `withLadder` so a new pathway cannot forget it, and
the level card now renders on every hub.

**2. Relationship and family produced no milestones at all** — 2,000 of
2,000. A goal with no rungs gives the weekly report nothing to write back
and the hub nothing to show, which is most of why those two pathways felt
inert. Fixed at source in `goalPlanner`, not papered over by the ladder,
so a deliberately-minimal build still has progress.

**3. Eight of twenty-one intake questions were dead** — money's `leak`,
`raise` and `automation`; work's `team` and `bigBet`; nutrition's
`cooking`; family's `goodWeekend`. The intake screen says on its face
*"Every question here changes the program — that's why they're asked."*
For eight questions that was false. All now change the build.

**4. Two of the eight were never dead — my harness could not see them.**
Recovery's `behaviour` and `trigger` change the goal title and pre-tick
milestones, and the first shape function compared neither. Fixed the
harness before fixing anything else; without it I would have "fixed" two
questions that already worked and reported it as progress.

**5. The first ladder overloaded the week.** Family reached 440 minutes a
week on average and 565 at the top. Two causes: a near-duplicate (the
rung's one-on-one practice alongside the protocol's, deduplicated by exact
title, which missed it) and counting a device-free family meal as three
new hours when it is dinner eaten differently. Both fixed — concept-level
dedupe, and a re-labelled-time exclusion the budget honours.

**6. The first allowance cut the wrong thing.** Capping the whole pathway
trimmed its own prescriptions — the aerobic session out of training, the
eating window out of nutrition — which existing tests caught. The
allowance now governs only what the ladder adds. What a pathway itself
prescribes is the promise and is never trimmed.

**7. The ladder ignored a deliberate shrink.** The relationship pathway
makes itself small when someone says things are hard or that there is no
window; the first ladder added to those plans anyway. The journey tests
caught it. Relationship's 46% "identical across levels" is that
suppression working, and is the one figure in the After table that should
not be zero.

## One guardrail was widened, deliberately

`journeys.test.ts` required every routine to trace back to a graded
protocol. Rung routines are programme structure — a weekly review, a
planning block, a shutdown — and make no health claim, so inventing
protocol ids for them would have defeated the rule rather than satisfied
it. The rule is now: every routine traces back to a graded protocol **or**
is marked `ladderRung`. What must never exist is a block the app cannot
explain. This was a judgement call and is worth overruling if it reads
wrong.

## Known, measured, not fixed

**Family asks for ~6.9 hours a week at the top rung** (412 min mean, 530
max of genuinely new time). Every one of those routines is `should` tier,
so the allowance cannot trim them, and they are the pathway's own promise
rather than ladder additions. The honest fix is a `replacesExistingTime`
flag on protocols themselves rather than the hard-coded set the budget
uses now — that set is four ids chosen by hand and will drift.

**`standardsMet` is false for six of seven pathways.** Only training has a
discipline-specific standard computable from a log. The other six gate the
top rung on volume alone, which is honest but blunt — there is currently
no way for the money pathway to know whether someone is actually good at
money.

**Insight coverage is thinnest where the ladder is deepest.** Family
averages 1.72 personal lines against money's 4.04. Not a failure, but the
family hub says least at exactly the point the plan asks most.
