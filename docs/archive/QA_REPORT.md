> **ARCHIVED — a record, not guidance.**
> Superseded by `docs/DEVELOPMENT_PUSH.md`.
>
> Workstream C, 2026-09-06. Every row was turned into a jest test, which is now the live record. Reading this for open issues will mislead — they are closed.
>
> Do not act on this document. See `docs/DOC_LIFECYCLE.md`.

# QA report: functionality and deep QA (Workstream C)

Written 2026-09-06 on `claude/rename-murders-folder-goh5q0`. Covers the
work from commit `8c6f8c1` (the brief, 908 tests) to `ef4de29` (the
baseline fix). Four area passes ran in parallel, one per half day as
section 7 of `docs/archive/REVIEW_BRIEF.md` asks: scheduler and planner, training,
pathways with interview, entitlement, meals and goals, and the store with
persistence, health, behaviours, check-ins, metrics, notifications, backup,
the accessibility floor and the copy guard. Every row below was written as
a scenario first, turned into a jest test, and then either passed, was
fixed with the smallest change that made the test pass, or is listed as
open with a reproduction. Every claim in this document traces to a row in
one of the four area reports or to a commit on the branch.

## Summary

We tested the parts of the app that decide what a person is told to do and
when: how a day is laid out for every kind of week the interview offers,
what the training coach puts on the bar, what each coach builds from every
answer it can be given, whether the allergy gate holds, whether Plus locks
exactly what it should and nothing more, and whether what a person records
survives an edit, a restore or a time zone. The test count went from 908 to
1,487 and the suite count from 85 to 115. Along the way we found two things
the brief classes as P0: a training load could round up past the limit set
by a joint or balance constraint (112.5 kg against a 112 kg ceiling), and
regenerating the plan, which happens on every routine edit, goal add or
library toggle, wiped the day's completed, skipped, moved and added items.
Behind those sat a night shift that produced no work blocks at all, a
restore that would accept any pasted JSON and write it over the store, a
fish-allergic person who could be offered the tuna salad, a swap menu that
handed a foundation lifter the deadlift, and a whole morning in Sydney
during which a Health reading taken at 7am was "not today's".

All of that is fixed and tested on the branch, across six commits. Thirty
fixes are listed by severity in section 5. Twenty-two items remain open;
each has a reproduction, an owner and a proposed patch, and six of the
items the area passes handed to each other were closed by later commits and
are marked so. Nothing that remains open loses data or changes a load. The
free tier, the prices, the meaning of any interview question and every
practice's grade and safety line are untouched; where a fix would have
needed one of those, it is a proposal in section 6 instead. The gates were
green at each commit; the thirty routes of the web build render with zero
console errors.

## Tests before and after

Whole repository, `npx jest`:

| Point | Commit | Suites | Tests | Passed | Skipped | Failed |
|---|---|---|---|---|---|---|
| Before | `8c6f8c1` | 85 | 908 | 908 | 0 | 0 |
| After | `ef4de29` | 115 | 1,487 | 1,486 | 1 | 0 |

The one remaining skip is the store pass's T10 (the workout screen's sleep
pre-fill slices the ISO date; open item ST-O2 below). It names its owner
and the line to change. No pre-existing test was changed, skipped or
weakened by any pass; every skip that was added during the work has since
been un-skipped and passes, except T10.

Per area, as each pass counted its own suites (they overlap the whole in
places, so they are not meant to sum to it):

| Area | Suites before | Tests before | Suites after | Tests after | New suites |
|---|---|---|---|---|---|
| Scheduler and planner | 14 | 137 | 20 | 215 | dayShapes, workBlocks, moves, regeneration, placement, adaptationCopy |
| Training | 10 | 102 | 17 | 192 | programme.matrix, autoregulate, swap.rules, baseline.more, progression.more, ladder, inputs |
| Pathways, interview, entitlement, meals, goals | 18 | 277 | 24 | 538 | intakeMatrix, interviewMatrix, entitlementQa, allergenGate, parseGoalCorpus, ladderMatrix |
| Store, health, time and the rest | 18 | 210 | 28 | 346 | persistence, backup, actions, dates, localDay, coverage, healthkit, journey, checkins/store, metrics, accessibility, reconcile |

The count was taken with an uncommitted edit to
`src/app/session/workout.tsx` from another workstream in the tree. Jest
does not type-check, so a transient type error there does not affect the
number. Each area report records `npx tsc --noEmit -p .` clean and eslint
clean on its changed files at the time of its commit.

## Pipeline proof

Section 2 of the brief asks for one screenshot of every route to prove the
web build renders. Thirty routes were rendered in headless Chromium from
the exported web build; every one painted readable text and the console
recorded zero errors on every route:

`/welcome`, `/example-day`, `/interview`, `/today`, `/plan`, `/life`,
`/data`, `/library`, `/upgrade`, `/settings`, `/report`, `/household`,
`/plan/routines`, `/goals/new`, `/check-in/morning`, `/check-in/evening`,
`/session/workout`, `/session/breathe`, `/session/meditate`,
`/session/journal`, `/session/meals`, `/nutrition/preferences`,
`/training/history`, `/path/training`, `/path/nutrition`, `/path/money`,
`/path/work`, `/path/recovery`, `/path/relationship`, `/path/family`.

## Scenario tables

Verdicts: **pass** means the behaviour was already right and is now pinned
by a test; **fixed** means a failing test was written and the smallest
change made it pass; **open** means the failing test exists (skipped with
its reason) or a reproduction is given in section 6. Where a row was open
when the area report was written and a later commit closed it, the row
says so.

### Scheduler and planner

Area: `src/lib/scheduling/**`, `src/features/planner/**`, the move
surfaces in `src/features/today/**`. Commit `219b911`; the store-owned
rows closed in `019ec89`.

| # | Scenario | Verdict | Test |
|---|---|---|---|
| A1 | Employed 9 to 17:30: two work blocks around lunch, nothing overlaps, every due routine placed or reported | pass | planner/__tests__/dayShapes.test.ts |
| A2 | Early shift 05:00 to 13:00, up at 04:30: one block, no lunch carve, morning light reported when it cannot fit | pass | dayShapes.test.ts |
| A3 | Late shift 14:00 to 22:00, night-owl sleep: one block, protected dinner reported unplaced rather than placed over the shift | pass (documented) | dayShapes.test.ts |
| A4 | Night shift 22:00 to 06:00 and the interview's 19:00 to 07:00: the shift is on the plan, in two pieces across midnight | **fixed** | dayShapes.test.ts, workBlocks.test.ts |
| A5 | Four on, four off (Mon to Thu 07:00 to 19:00): on-days carved, off-days empty | pass (the roster itself is known open, brief item 2) | dayShapes.test.ts |
| A6 | Carer with a school run: fixed runs and caring hours, morning light before the run, nothing overlaps | pass | dayShapes.test.ts |
| A7 | Retiree with weekAnchors: no work blocks, anchors placed flexible, nothing after 21:00, every day of the week | pass | dayShapes.test.ts |
| A8 | Student 10:00 to 15:00: timetable blocks around lunch | pass | dayShapes.test.ts |
| A9 | Wake time after sleep time (22:00 to 06:00): plan builds, no overlaps once unwrapped, everything inside the waking span | pass (display limitation, S5) | dayShapes.test.ts |
| A10 | workEnd equals workStart: no work at all, plan still builds | pass | dayShapes.test.ts |
| B1 | Lunch carved only when the hours span 12:00 to 13:30; every ordinary interview option carves it | pass | workBlocks.test.ts |
| B2 | During-work carve at 09:15 starts the day (no Work sliver under 30 min) | pass | generate.test.ts (existing) |
| B3 | A short tail folds into the plain Work block before it, never into a carve | pass | workBlocks.test.ts |
| B4 | anchorToWorkEnd sits against the end of the hours, including a shift that ends at 07:00 next morning | **fixed** (with A4) | workBlocks.test.ts |
| B5 | Two carves preferring the same start are serialised and both survive | pass | workBlocks.test.ts |
| B6 | A carve longer than the work day is reported unplaced, not lost | **fixed** | workBlocks.test.ts |
| B7 | A second carve pushed past the end of the day is reported unplaced, not lost; not reported on a day it is not due | **fixed** | workBlocks.test.ts |
| B8 | Blocks never overlap, never leave the hours, never have zero length, for all twelve hour options with four carves on top | pass | workBlocks.test.ts |
| C1 | Could-tier displaced by must-tier: dropped by window (the example Monday's protein anchor) and dropped by budget both appear in `unplaced` | pass (documented: dropped and reported, not moved to another meal; brief item 3) | scheduling/__tests__/placement.test.ts |
| C2 | reservedFreeFraction by capacity: minimal < steady < push placed; push still leaves at least 20% free | pass | placement.test.ts |
| C3 | finishBeforeSleepMin: bounded routine moved earlier, or reported when nothing earlier is free | pass | placement.test.ts |
| C4 | Bedtime guard: nothing placed ends after sleep or starts before wake, for four sleep patterns including 08:30 to 00:15 | pass | placement.test.ts |
| C5 | Morning light anchored to wake time (05:00 to 05:20, 06:30 to 06:50, 08:30 to 08:50) and lands there; gives way to a 05:00 shift honestly | pass | placement.test.ts |
| C6 | Sleep-anchored wind-down for a 00:15 bedtime lands 23:40 to 00:00 on the same date | pass | placement.test.ts |
| D1 | moveWithBump to a free slot: nothing displaced, nothing overlaps, movedFrom set | pass | planner/__tests__/moves.test.ts |
| D2 | moveWithBump with bumps: displaced list is exactly the items whose start changed, cascades included | pass | moves.test.ts |
| D3 | A skipped item is neither bumped nor reported as moved, and is not priced as a bump | **fixed** | moves.test.ts |
| D4 | A fixed block ending "00:00" is a clash for a move (`overlapsFixed`) and for the picker (`hitsFixed`) | **fixed** | moves.test.ts |
| D5 | candidateStartsFor with notBefore: nothing before now, nothing past midnight, night owl included | pass | moves.test.ts |
| D6 | pastStartsFor: latest first, every offer ended before now; placing there is as honest as any move | pass | moves.test.ts |
| D7 | moveItemToDate: gone from today, on tomorrow without overlap, movedFrom and routineId kept, status planned | pass | moves.test.ts |
| D7b | moveItemToDate into a tomorrow with no room | open at the time, store-owned; **closed in `019ec89`** (store F5), test un-skipped and passing | moves.test.ts |
| D8 | shortenItem: start kept, end shrinks, original length recorded; longer is a no-op | pass | moves.test.ts |
| D9 | Quick-add into a full evening: lands at the chosen time, displaced list equals the set of items whose start changed, no overlaps | pass | moves.test.ts |
| D10 | 300 seeded random days times a random target: moved item lands, immovables never move, nothing lost, no new overlap ever | pass (after the D3 fix) | moves.test.ts |
| E1 | Regeneration keeps a completed item | open at the time, store-owned; **closed in `019ec89`** (store F4), un-skipped | planner/__tests__/regeneration.test.ts |
| E2 | Regeneration keeps a skipped status | as E1 | regeneration.test.ts |
| E3 | Regeneration keeps a user-moved item at its moved time | as E1 | regeneration.test.ts |
| E4 | Regeneration keeps a quick-added block | as E1 | regeneration.test.ts |
| E5 | Regeneration never resurrects a deactivated routine, across the week | pass | regeneration.test.ts |
| E6 | Regeneration never resurrects a routine removed from that weekday | pass | regeneration.test.ts |
| F1 | Pattern sentence after four moves is one grammatical sentence with the title intact | pass | scheduling/__tests__/adaptationCopy.test.ts |
| F2 | No detector lower-cases or wedges a multi-word title ("Training that sticks", "Date night with Sam", "Zone 2 cardio"): movePattern, missedTwice, slotMismatch | **fixed** | adaptationCopy.test.ts |
| F3 | Second-day gate for suggestions | not covered (lives in `store.ts` `refreshSuggestions`, outside the area) | none |
| G1 | Whole area under TZ=Australia/Sydney, Australia/Perth, Pacific/Auckland, UTC | pass; identical results in all four, no date-keyed difference | all files |

### Training

Area: `src/features/training/**`, `src/app/session/workout.tsx`,
`src/app/training/history.tsx`. Commit `671a2f7`; the baseline age and
the level-card wording in `ef4de29`.

| # | Scenario | Verdict | Test file |
|---|---|---|---|
| 1 | buildProgramme matrix: 4 equipment by 4 goals by 4 levels by 14 constraint sets (none, each of the nine alone, three pairs, all nine) by ages 25/45/60 by pushHarder by with/without baselines; 10,752 blocks build without throwing | pass | training/__tests__/programme.matrix.test.ts |
| 2 | Every load at or below ceiling times baseline for the lift it was computed from, strictly, rounding included | **fixed** (F1) | programme.matrix.test.ts |
| 3 | No barbell movement and no computed load on bodyweight; no computed load on home/dumbbells either | pass | programme.matrix.test.ts |
| 4 | No `Deadlift` or `Overhead press` as programmed work at foundation, any equipment/goal/constraints/pushHarder | pass | programme.matrix.test.ts |
| 5 | No near-maximal single (reps "1" / "top single") beside any constraint, including the three that only lower the ceiling | pass | programme.matrix.test.ts |
| 6 | Every programmed movement has a pattern in swap.ts (finishers and the balance opener excepted), across levels and constraints | **fixed** (F2) | programme.matrix.test.ts |
| 7 | estimatedMin at or below sessionMin, and the number shown equals what the exercises left actually take | **fixed** (F4, the honest number) | programme.matrix.test.ts |
| 8 | Four weeks, phases build/build/progress/deload, deload last | pass | programme.matrix.test.ts |
| 9 | Session count = clamp(daysAvailable, 2, 5) for 1 to 7; 3 days or fewer full-body, 4 to 5 upper/lower; unique titles | pass | programme.matrix.test.ts |
| 10 | Age 45+ gets the note and four more warm-up minutes; 25 gets neither | pass | programme.matrix.test.ts |
| 11 | Nothing the person reads (notes, session notes, week focus) says "prescri…", "diagnos…", "treatment", "clinical", "medical advice" | **fixed** (F6) | programme.matrix.test.ts |
| 12 | The focus note promises a heavy top set only where the block gives one, and does not name a lift the constraints swapped out | **fixed** (F3) | programme.matrix.test.ts |
| 12b | The focus lift gets the lead slot's volume, not a lighter session | **fixed** (F7) | programme.matrix.test.ts |
| 13 | autoRegulate: sleep {5, 6.5, 8, unknown} by readiness {ready, caution, back-off, unknown} by availableMin {15, 20, 30, 45, 60}: every main movement kept in order, accessories cut before any main set, no main below two sets, loads unchanged, estimate honest | **fixed** (F4) | autoregulate.test.ts |
| 14 | autoRegulate fits the window whenever the main work at two sets fits; otherwise says so rather than clamping | **fixed** (F4) | autoregulate.test.ts |
| 15 | autoRegulate under 15 minutes answers as `buildWorkout` does (null); 15 exactly is a session | **fixed** (F5) | autoregulate.test.ts |
| 16 | Short night alone: one accessory, "short night" note; back-off alone: one accessory, "your own recovery numbers"; both: "short recovery and a tight window"; time alone: "Only N minutes"; 6 to 7 h, 6 h, caution, ready, unknown: untouched; the programmed session is never mutated | pass | autoregulate.test.ts |
| 17 | alternativesFor on every equipment for every movement in the table: never itself, same pattern only, equipment the person has only; no barbell for home/dumbbells/bodyweight; empty for an unknown movement | pass | swap.rules.test.ts |
| 18 | alternativesFor never offers the deadlift, trap-bar deadlift or overhead press to a block that withholds them, nor a loaded lift back to a joints/recovering constraint; still has something to offer; agrees with what the block programmed | **fixed** (F2) | swap.rules.test.ts |
| 19 | applyExerciseSwaps drops loadKg, sets rpe (keeps an existing one), keeps sets/reps/rest, marks swappedFrom; no leak across sessions, programmes or the next block; swap to itself is a no-op; keys cannot collide | pass | swap.rules.test.ts |
| 20 | Baseline: a corrected set (lower value on the same log id) replaces the number, through the store | pass | baseline.more.test.ts |
| 21 | Baseline: a deleted session takes its number with it; deleting the only loaded set leaves no estimate, through the store | pass | baseline.more.test.ts |
| 22 | Baseline: a retest older than the window with nothing after (floor, fromRetest) and with sessions after (they win, the pre-retest peak stays gone) | pass | baseline.more.test.ts |
| 23 | Baseline: two lifts on one day stay separate; one session gives one reading per lift | pass | baseline.more.test.ts |
| 24 | Baseline: a bodyweight set under a main-lift name and a set over twelve reps estimate nothing; a session of only such sets leaves the baseline where it was | pass | baseline.more.test.ts |
| 25 | Baseline: decay reaches the 0.85 floor at exactly 84 days and stops; applied per observation; never above what was lifted; rounded to 0.1 kg; a fresh reading exact | pass | baseline.more.test.ts |
| 26 | suggestNext: falling away / held below top / top on every set / too few working sets / heavy single then back-offs; step 5 for squat and deadlift, 2.5 for bench, OHP and non-main lifts; lastPerformance picks the heaviest set, skips sessions without the exercise, does not rank unloaded above loaded | pass | progression.more.test.ts |
| 27 | Level ladder: latestMaxes weighted and per lift; measuredTrainingLevel null without profile, foundation/developing/established by band, never advanced; trainingEvidence via the strength route and the log | pass | ladder.test.ts |
| 28 | levelFor: claim (capped at established), measured outranks claim upward only, log outranks both, advanced only from the log with the standard through the 48/20 or 100/40 gate, step-back caps and never lifts; the hub sentence for countdown, unlocked, blocked-by-standard, shorter gate, top of the ladder | pass | ladder.test.ts |
| 29 | sessionsPerWeekFloor through deriveTrainingInputs: 5+ lifts 3 to 5, 3 to 4 lifts 2 to 3, never lowers, unset leaves alone, clamps downstream; constraints, session length and equipment carried | pass | inputs.test.ts |

Not covered, by design of the pass: the three screen-level swap rows in
the brief (a swap with a logged set, a swap on the free tier, the log title
after a swap) need a rendered `workout.tsx`; there is no component-test
harness in this area and none was added.

### Pathways, interview, entitlement, meals, goals

Commit `5134d1e`; the hydration row closed in `019ec89`.

Pathways (`src/features/paths`):

| # | Scenario | Verdict | Test |
|---|---|---|---|
| P1 | Every intake answer combination per pathway builds at every level for a family on a steady week and a solo person on a minimal week (full cartesian product of `PATHS[id].questions`: 128 training, 16 nutrition, 288 money, 720 work, 784 recovery, 64 relationship, 64 family, by 4 levels by 2 profiles) | **fixed** (family) | paths/__tests__/intakeMatrix.test.ts "builds for … without throwing, duplicating or orphaning" |
| P2 | No duplicate practice under two names in one build: title, protocolId, `session:<type>` | pass | same |
| P3 | No orphan protocol id in any build | pass | same |
| P4 | `goal.routineIds` names only routines in the build; milestone titles unique | **fixed** (family) | same |
| P5 | Every insight line is a sentence (never `undefined`) for every answer combination | **fixed** (recovery) | intakeMatrix "never hands out an insight that is not a sentence" |
| P6 | No duplicates after `mergeRoutines` with the interview's routines, three interview shapes (family/employed, retired/minimal, self-directed/push), every pathway, every answer combo, foundation and advanced; store's restart rule mirrored (previous goal's routines retired) | pass | intakeMatrix "leaves one of each practice active after the merge" |
| P7 | Every rung changes something: `ladderFor` across levels adds a routine or a milestone, notes grow by one, nothing is dropped | pass | intakeMatrix "every rung adds a routine or a milestone and says why" |
| P8 | `fitLadderToBudget` at minimal capacity: only must/should rungs, fit is the identity | pass | intakeMatrix "gives a minimal week only the required rungs" |
| P9 | Family pathway for a household with no children on the profile, every combo | pass | intakeMatrix "family builds for a household with no children" |
| P10 | Family with a partner and no kids keeps one dinner after the interview merge | pass | intakeMatrix "family with a partner and no kids keeps one dinner" |
| P11 | Relationship pathway for someone with nobody on the profile, every combo, every level | pass | intakeMatrix "relationship builds for someone with nobody" |
| P12 | Weekend-only window keeps every relationship routine on Sat/Sun | pass | intakeMatrix "a weekend-only window" |
| P13 | Family `ages` is multi-answer: "primary,under5" sizes the outing to the youngest | **fixed** | intakeMatrix "sizes the outing to the youngest" |
| P14 | Every good-weekend answer puts a different Saturday on the plan | pass | intakeMatrix "every good-weekend answer" |
| P15 | Recovery: every behaviour in `BEHAVIOUR_CATALOG` by every trigger by every replacement, both profiles; behaviour, goal title, one urge answer, tier by capacity, no collisions | pass | intakeMatrix "%s × every trigger × every replacement" |
| P16 | Recovery intake offers exactly the catalogue | pass | intakeMatrix "offers every behaviour the app can track" |
| P17 | Each replacement is its own answer (tidy and water were handed the breath reset) | **fixed** | intakeMatrix "gives each replacement its own answer" |
| P18 | Every trigger has its own first insight line (tired and lowmood pushed `undefined`) | **fixed** | intakeMatrix "answers every trigger with a sentence" |
| P19 | `withLadder` covers on session type: breath rung skipped when the answer is already a breath; added when it is a walk | pass | intakeMatrix "covers a session type" |
| P20 | Nutrition every aim by cooking by trouble: builds, eating window only for weight, meal sketch always | pass | intakeMatrix "nutrition: every aim × cooking × trouble" |
| P21 | Money every mode by automation reshapes milestones; check-in always present | pass | intakeMatrix "money: every mode × automation" |
| P22 | Work every style by team: deep work for non-managers, one-on-ones for directs/leaders, big-bet milestones | pass (see PW-O3) | intakeMatrix "work: every style builds" |

Interview (`src/features/onboarding/buildPlan.ts`, `script.ts`, `constraints.ts`):

| # | Scenario | Verdict | Test |
|---|---|---|---|
| I1 | One dimension at a time from three baselines (employed family, retired minimal, night-shift solo): weekShape, capacity, 10 households, every constraint and all, every habit and all, every mind and all and none, foodAim by foodTrouble, money by automation including retired/student values, lessOf each and all and with breathing, six work-hour shapes including 19:00 to 07:00, every sleep option, trainingDays 0 to 6 by every setup | pass | onboarding/__tests__/interviewMatrix.test.ts "%s: every answer builds a sound plan" |
| I2 | 2,000 seeded whole interviews: no throw, `dedupeRoutines` holds (one routine per protocol), unique ids, no orphan protocol, goals and routines consistent, dinner rule, zero training means zero, minimal caps, pathStarts exact, intentions mirror lessOf, habits established | **fixed** (dangling routineIds) | interviewMatrix "two thousand people" |
| I3 | Family dinner carries `protocolId: 'device-free-meal'`, protected, must, 7 days, exactly one, iff partner or kids | pass | I1/I2 check |
| I4 | Orphan rule: no routine references a protocol id that does not exist | pass | I1/I2 check |
| I5 | Routines applicable to sex at birth: every routine the interview can produce applies for undefined/male/female/preferNotToSay; no produced protocol carries `appliesTo` | pass | interviewMatrix "every routine the interview can produce applies to everyone" |
| I6 | `describeConstraints` for every `PhysicalConstraint`: label, effect, no verdict language; type and interview options agree | pass | interviewMatrix "the constraints the plan says back" |
| I7 | Hours across midnight, retiree anchors, carer with a working week | pass | interviewMatrix "shapes of a working week" |
| I8 | trainingDays '0' with a fitness ambition still schedules the ambition's sessions | open (PW-O4) | none |

Entitlement (`src/features/plus`):

| # | Scenario | Verdict | Test |
|---|---|---|---|
| E1 | With Plus off, `runningRoutines` on a real plan (interview plus nutrition, money, recovery, training, work, family, relationship and a hand-added urge tool) runs exactly the recovery goal's routines and urge protocols; with Plus, everything | pass | plus/__tests__/entitlementQa.test.ts "runs the recovery coach and the urge tools, and nothing else" |
| E2 | `sessionsPlusWouldRun` is the exact complement of what ran, for every weekday, active only, earliest first | pass | entitlementQa "the locked list is the complement" |
| E3 | `splitLibrary` opens exactly five per area plus every urge tool, first-listed five, for all four sex-at-birth states | pass | entitlementQa "opens exactly five per area" |
| E4 | `isAlwaysFreeProtocol` is exactly urge-log and urge-surf | pass | entitlementQa "only the urge tools are always free" |
| E5 | `meditationLengthNeedsPlus` for 1 to 30 minutes, both states | pass | entitlementQa "draws the line at the two-minute reset" |
| E6 | `entitlementFromPurchases` monthly, annual: live, expiry at the exact instant, expired, no expiry, null expiry | pass | entitlementQa "%s is Plus while live" |
| E7 | Lifetime wins, never expires; pending grants nothing for each product; ids are the three sold | pass | entitlementQa |
| E8 | `grantedEntitlement` is Plus with source dev | pass | entitlementQa "is Plus, from a source that names itself" |
| E9 | The development grant survives an honest "nothing owned" only in a development build | **fixed** | entitlementQa "survives an honest nothing owned only in a development build" |
| E10 | `grantedEntitlement(` is called from exactly one screen, inside its `__DEV__ ?` branch; `refreshEntitlement` reconciles with `__DEV__` | **fixed** | entitlementQa "is only ever handed out from inside a __DEV__ branch"; "the StoreKit refresh keeps the grant" |
| E11 | A persisted grant is dropped at hydration on a release build | open at the time (PW-O1); **closed in `019ec89`** (store F6), un-skipped and passing | entitlementQa |

Meals (`src/features/modalities/meals`, `src/features/nutrition`):

| # | Scenario | Verdict | Test |
|---|---|---|---|
| M1 | For every allergen in `ALLERGEN_LABELS`: listed, excluded with label; "may contain", excluded; unreviewed, excluded; clean, allowed; through `allergenExclusion`, `filterDishes`, `rankDishes` (excluded score 0) | pass | meals/__tests__/allergenGate.test.ts "excludes a dish that lists it" |
| M2 | For every allergen, the seed corpus honoured through `allowedDishTitles`, `suggestAllowedWeek` (three weeks, deterministic), `nextAllowedDish` from every start including unknown; at least 3 dishes left | pass | allergenGate "is honoured by the seed corpus" |
| M3 | Every dish in `DISHES` is reviewed, uniquely id'd and titled, allergen listed once, valid enums | pass | allergenGate "every dish is reviewed" |
| M4 | Pattern claims never contradicted by the allergen list or anchor (vegan/vegetarian/pescatarian/gluten_free/dairy_free/kosher/halal) | pass | allergenGate "a dietary pattern claim is never contradicted" |
| M5 | Dairy-free / gluten-free label on a dish that "may contain" milk / gluten | open (PW-O2); the test pins that the allergy gate still excludes them | allergenGate "a pattern is a preference, never an allergy" |
| M6 | Every intolerance removes exactly the dishes listing it; every pattern keeps exactly the dishes claiming it; stacked rules hold | pass | allergenGate "intolerances and patterns, each on its own" |
| M7 | `suggestWeek` / `suggestAllowedWeek` deterministic, seven days, leftovers on day 4, with and without preferences | pass | allergenGate "the week" |
| M8 | Allergies that empty the list never fall back to the unchecked pool | **fixed** (P1) | allergenGate "never serves the unchecked pool" |
| M9 | Quick-only cook with allergies: quick dishes only, all reviewed | pass | allergenGate |
| M10 | Nutrition ladder: every aim by cooking by trouble by leverLevel 0 to 9: one frontier, no duplicate lever, level clamped, protocol ids exist | pass | nutrition/__tests__/ladderMatrix.test.ts |
| M11 | Trouble promotes its counter-lever first for every aim; "nowhere" changes nothing; protein target honest without weight | pass | ladderMatrix |

Goals (`src/features/goals`):

| # | Scenario | Verdict | Test |
|---|---|---|---|
| G1 | `parseGoal` on 42 realistic strings across every domain | **fixed** (6 misses) | goals/__tests__/parseGoalCorpus.test.ts "%s → %s" |
| G2 | Targets and timeframes read where present; "I want to" stripped | pass | parseGoalCorpus "reads the number and the deadline" |
| G3 | Every corpus goal drafts milestones with `doneWhen`, unique titles, described; non-behaviour goals get a routine and a check-in; routineIds consistent | pass | parseGoalCorpus "drafts milestones with conditions" |
| G4 | The plain planner never leaves a fitness/business/career/finance/relationship/family/experience/behaviour goal without rungs | **fixed** (via G1) | parseGoalCorpus "the plain planner never leaves" |
| G5 | `assessGoal` ticks a metric rung (lte body weight; gte savings) from a reading and unticks it on a corrected later reading | pass | parseGoalCorpus "assessGoal ticks from a reading" |
| G6 | A confirmed rung never unticks; the latest reading decides regardless of arrival order | pass | same |
| G7 | "Meditate every day" is a health goal that gets a sit, not a strength workout; preset domain corrected | **fixed** | goals/__tests__/presets.test.ts (existing) and the corpus |

### Store, persistence, health, behaviours, check-ins, metrics, notifications, backup, accessibility floor, copy guard

Commit `019ec89`; the baseline age and the two wording rows in `ef4de29`.

| # | Area | Scenario | Verdict | Test |
|---|---|---|---|---|
| P1 | Persistence | PERSIST_VERSION is 1 and `migratePersisted` is the store's `migrate` under key `intent-os-store` | pass | state/__tests__/persistence.test.ts |
| P2 | Persistence | A version-0 blob shaped as the MVP wrote it (nine keys) hydrates through the real middleware without loss; every newer key takes its default | pass | persistence.test.ts |
| P3 | Persistence | A version-0 blob shaped as the pre-interview-split build wrote it (24 keys, no answers) hydrates; `interviewAnswers` reconstructed from the profile; stored answers are left alone when present | pass | persistence.test.ts |
| P4 | Persistence | A version-1 blob from before session/exercise swaps hydrates; `sessionSwaps`, `exerciseSwaps`, `plusNudgeDismissedAt` default | pass | persistence.test.ts |
| P5 | Persistence | A version-0 blob with `goals: "oops"`, `plans: []`, `metrics: {}` is repaired, the profile and routines kept, and the blob rewritten at version 1 | pass | persistence.test.ts |
| P6 | Persistence | `answersFromProfile` round-trips through `profilePatchFor`: re-applying every reconstructed answer changes no profile field (people ids included); `trainingSetup` is never claimed for an outdoors profile | pass | persistence.test.ts |
| P7 | Persistence | A pelvic-floor routine stored active for a man is switched off on hydrate; left running for a woman; the switch-off reaches storage | pass | persistence.test.ts |
| P8 | Persistence | `partialize` writes no functions and no `hydrated`; the slice survives JSON exactly | pass | persistence.test.ts |
| P9 | Persistence | Repairs made in `onRehydrateStorage` (in-place mutation of `get()`) are carried into the next persisted write | pass | persistence.test.ts |
| P10 | Persistence | `setHydrated` restores the preview-lab clock offset; `resetAll` zeroes it | pass | persistence.test.ts |
| B1 | Backup | Export a full state (onboarded, path, workout log, metrics, behaviour event, swaps, dismissals); restore on a clean store; persisted slice byte-for-byte equal and storage holds the backup verbatim | pass | state/__tests__/backup.test.ts |
| B2 | Backup | Not JSON / empty paste: refused, state and storage untouched | **fixed** | backup.test.ts |
| B3 | Backup | JSON but not a store payload; `state` not an object; a list that is not a list; a profile that is not a profile; a newer version: refused without wiping | **fixed** | backup.test.ts |
| B4 | Backup | A version-0 backup is migrated on the way in (lists repaired, rewritten at version 1); one with the version stripped is treated as 0 so the repair still runs | **fixed** | backup.test.ts |
| A1 | Actions | `saveWorkoutLog` stamps every e1RM at local noon of the log date (asserted under Sydney, Perth, Auckland, UTC) | pass | state/__tests__/actions.test.ts |
| A2 | Actions | `updateLoggedSet` / `removeLoggedSet` re-derive; the corrected estimate replaces the old one; personal best follows | pass | actions.test.ts |
| A3 | Actions | `removeWorkoutLog` removes only its metrics; logs stay date-ordered | pass | actions.test.ts |
| A4 | Actions | `setItemStatus`: completed keeps given evidence, manual evidence otherwise; skipped/reopened record their events; unknown item ignored | pass | actions.test.ts |
| A5 | Actions | `moveItem` returns the displaced list, keeps every item, records the bumps as intent-initiated | pass | actions.test.ts (and existing moveItem.test.ts) |
| A6 | Actions | `addPlanItem` never leaves two movable items overlapping and names what it displaced | pass | actions.test.ts |
| A7 | Actions | `startPath` twice drops the previous goal, deactivates its routines, keeps the new answers | pass | actions.test.ts |
| A8 | Actions | `toggleProtocol` adds, deactivates, re-activates without duplicating; refuses a practice that does not apply to the sex at birth and an unknown id | pass | actions.test.ts |
| A9 | Actions | `swapSession` per date, cleared by null; `swapExercise` per block and session, cleared by null or the same name | pass | actions.test.ts |
| A10 | Actions | `dismissPlusNudge` stamps; `resetAll` returns the persisted slice to its clean value byte-for-byte after a full state | pass | actions.test.ts |
| A11 | Actions | `regeneratePlan` on seven consecutive days keeps intention and protected behaviour, drops approval, keeps items sorted and dated | pass | actions.test.ts |
| A12 | Actions | `addMetric`, `appendHealthObservations`, `saveWorkoutLog` cap the stream at 2000, newest kept | pass | actions.test.ts |
| A13 | Actions | `updateMetric` flips a rung both ways; `removeMetric` un-ticks every evidence rung; note kept unless replaced | pass | actions.test.ts (and existing journeys.test.ts) |
| A14 | Actions | The strength baseline the next block reads is not discounted for a session logged this morning | open at the time (ST-O1); **closed in `ef4de29`**, un-skipped and passing | actions.test.ts |
| R1 to R4 | Handed over | The four store-owned rows from the other passes: regeneration keeps a completed, skipped, moved or added item (scheduler E1 to E4); the reconcile rules one at a time; `moveItemToDate` into a full tomorrow bumps or refuses (scheduler D7b); a persisted development grant is dropped at hydration on a release build (pathways E11) | **fixed** (F4, F5, F6) | planner/__tests__/reconcile.test.ts (new, 13 tests) and the un-skipped rows in regeneration, moves and entitlementQa |
| T1 | Time | `toDateKey`, `todayKey`, `dateKeyToDate`, `addDays`, `weekdayOf`, `weekStartOf`, `toMinutes`, `toHHMM`, `formatTime`, `nowMinutes` agree under all four zones | pass | lib/__tests__/dates.test.ts |
| T2 | Time | Week starts are Mondays through the Sydney (4 Oct 2026) and Auckland (27 Sep 2026) daylight-saving weeks; `addDays` never repeats or skips a key across a change; every day of 2026 maps to a Monday at most 6 days back | pass | dates.test.ts |
| T3 | Time | `setClockOffsetMs` moves `todayKey` and `nowMinutes` as one; `advanceToNextMorning` lands at 07:30 the next local day and plans it; `jumpToEvening` at 19:00 and never backwards; `resetClock` returns to zero | pass | dates.test.ts, actions.test.ts |
| T4 | Time | The Today "tonight" window (17:00) opens on local minutes | pass | dates.test.ts |
| T5 | Time | `dateKeyOfIso` reads the local day of an instant and disagrees with a UTC slice exactly when the zone does | **fixed** (new helper) | dates.test.ts |
| T6 | Health/Time | A 07:00 local HRV or RHR reading counts as today's at 11:00 local, in Sydney | **fixed** | health/__tests__/localDay.test.ts |
| T7 | Health/Time | The baseline excludes today's reading by local day | **fixed** | localDay.test.ts |
| T8 | Health/Time | A Health sync at 11:00 does not write a second sleep reading beside a 07:00 hand entry for the same local day; yesterday's entry does not block today's sync | **fixed** | localDay.test.ts |
| T9 | Health/Time | Sleep debt counts one night per local date, last write wins | **fixed** | localDay.test.ts |
| T10 | Time | The workout screen's "logged sleep today" finds a 07:00 Sydney reading at 11:00 | **open** (ST-O2), skipped | localDay.test.ts |
| H1 | Health | `readinessFrom` compares to the person's own median; the same number is back-off for one person and nothing for another | pass (existing) | readiness.test.ts |
| H2 | Health | `readinessCoverage` names what is missing in words; one baseline is enough to read; four readings are not a baseline | pass | health/__tests__/coverage.test.ts |
| H3 | Health | HRV 86% nothing / 85% caution / 70% back-off; RHR +4 nothing / +5 caution / +10 back-off; better-than-usual says nothing; sleep 6.0 fine, 5.9 caution; zero baseline never divided by; every signal names its numbers and never a population band | pass | coverage.test.ts |
| H4 | Health | Sync windows in `healthkit.ts` are 18h sleep, 48h HRV/RHR/weight, 90d VO2max/waist, 5y height; a stale reading the window let through is still not today's | pass | coverage.test.ts |
| H5 | Health | `snapshotObservations`: onChangeOnly metrics recorded only on change; rounding to a tenth; healthkit source | pass | coverage.test.ts (and existing summarise.test.ts) |
| H6 | Health | Conditioning never classifies in any branch (rising, falling, flat, low number, high number); wobble under 1.0 is flat; a change older than 90 days is not a trend | pass | coverage.test.ts |
| H7 | Health | HealthKit adapter with the binding replaced: off iOS nothing is asked; refused or thrown authorization is false; granted records the connection and syncs a first snapshot; throttled unless forced; a failing query leaves other signals intact | pass | health/__tests__/healthkit.test.ts |
| H8 | Health | Every `BODY_ENTRIES` key is a `METRICS` key with a sane range; a hand-entered HRV reads exactly like a synced one | pass | coverage.test.ts |
| BH1 | Behaviours | Through the store: silent until the fourth log; four Friday-night logs give window `21:15–22:15`, days `Fridays`, intervention `20:30` with the exact line | pass | behaviours/__tests__/journey.test.ts |
| BH2 | Behaviours | `logPastBehaviourEvent` keeps the given instant, size, and a trigger attached later | pass | journey.test.ts |
| BH3 | Behaviours | With sleep read those mornings, `coFactor` says "3 of the 4 followed a night under 6.5 hours" and never a cause | pass | journey.test.ts |
| BH4 | Behaviours | `dueInterventions` fires on Friday and not Tuesday; `plannedNotifications` queues one at 20:30 naming the window, no verdict words; a switched-off intention is left alone | pass | journey.test.ts |
| BH5 | Behaviours | Every catalogue entry has template, log prompt and detail hint with no verdict word; `answerDeferredQuestion('lessOf')` creates one intention per behaviour from the template and never a twin; profile and answers updated | pass | journey.test.ts |
| C1 | Check-ins | Asked while there is no reading; silent once answered; asked again after the cadence with the last value carried | pass | checkins/__tests__/store.test.ts |
| C2 | Check-ins | "Not now" holds for DISMISS_DAYS, returns after, survives a relaunch through storage, and is forgotten the moment the question is answered | pass | store.test.ts |
| C3 | Check-ins | `answerCheckin` writes the reading with the `check-in` note and re-runs the evidence pass so a rung can tick | pass | store.test.ts |
| M1 | Model | `personalBest` lowest for RHR and waist, highest for lifts, ties to the later reading, unknown key higher-is-better, empty is null | pass | model/__tests__/metrics.test.ts |
| M2 | Model | `trend` first-vs-latest inside the window, null with one point, half-unit flat both ways; `latest` by time not insertion | pass | metrics.test.ts |
| M3 | Model | `observe` stamps an ISO instant and a unique id; every definition has a direction and a unit; `recentRecords` honours lower-is-better and needs history | pass | metrics.test.ts |
| N1 | Notifications | Existing adapter and schedule suites (local-time triggers, "already past" on today, cap, quiet hours) under Sydney, Perth, Auckland, UTC | pass (existing, verified in four zones) | notifications/__tests__/* |
| X1 | A11y | Button: role, label from title, disabled state; Chip: role, selected and disabled state, visible label; Field: required label reaching `accessibilityLabel`, hint, disabled state; every `hint` prop reaches `accessibilityHint` | pass | components/__tests__/accessibility.test.ts |
| X2 | A11y | `caption` at least 14, `secondary` at least 15, `body` at least 16; no screen sets a font size under 14 (charts.tsx excluded, ST-O4) | pass | accessibility.test.ts |
| J1 | Copy | `SDNN` banned (found in BodyNumbers.tsx hint) | **fixed** | copy/__tests__/jargon.test.ts |
| J2 | Copy | `standard prescription` banned (found in paths/LevelCard.tsx) | open at the time (ST-O3); **closed in `ef4de29`**, guard now active | jargon.test.ts |
| J3 | Copy | `prescribed` banned (found in paths/level.ts established blurb) | open at the time (ST-O3); **closed in `ef4de29`**, guard now active | jargon.test.ts |

Time-zone matrix for the store pass (`TZ=<zone> npx jest` over state, lib,
health, behaviours, checkins, model, notifications, components, copy):

| Zone | Before the fixes | After the fixes |
|---|---|---|
| UTC | all pass | 443 passed, 3 skipped at the time |
| Australia/Sydney | `localDay.test.ts` 4 of 7 fail (F2) | 442 passed; the one failure was ST-O1, since closed |
| Australia/Perth | as Sydney | as Sydney |
| Pacific/Auckland | as Sydney | as Sydney |

## Fixes by severity

Every fix began as a failing test. Severity is the area report's where it
gave one; where it did not, the level is assigned here from the table in
section 5 of the brief and marked with an asterisk.

### P0

| Fix | File | What was wrong | What is now true | Commit |
|---|---|---|---|---|
| Training F1: a load could round up past the constraint ceiling | `src/features/training/programme.ts` | `round2p5(base × safePct)` ran after the ceiling, so 80% of 140 kg became 112.5 kg for someone whose balance constraint capped the lift at 112 kg; the same on the top single. A wrong load, small in kilograms, P0 by the brief's table. | `cappedLoad()` takes the lesser of the rounded load and the ceiling floored to 2.5 kg; no load is ever above ceiling times baseline, the top single included. Unconstrained blocks change only where a heavy single at a baseline that is not a multiple of 2.5 kg now rounds down instead of up. | `671a2f7` |
| Store F4: regenerating the plan wiped the day's record | `src/features/planner/reconcile.ts` (new), `src/state/store.ts` `regeneratePlan` | `regeneratePlan` replaced `plans[date].items` wholesale. A completed workout came back planned, a skip was forgotten, a moved block snapped back, an added block vanished, on `addGoal`, `updateRoutine`, `toggleProtocol`, `startPath`, `acceptSuggestion`, `applyWeeklyChanges`, `setEntitlement` and `answerDeferredQuestion`. Toggling a practice in the library at 9pm erased everything ticked off that day. Data loss under section 5 of the brief. Found by the scheduler pass (E1 to E4), fixed by the store pass. | `reconcilePlan(fresh, previous, runningRoutineIds, {wake, sleep})` keeps every non-fixed previous item that is completed or skipped (a record, kept whatever happened to its routine) and every planned item the person moved, shortened, added or logged (a decision, kept while its routine still runs today). Fresh items for a routine a kept item already covers are dropped, so a completed workout gets no planned twin. Kept items are placed through `moveWithBump` so nothing overlaps, then put back byte-identical. Fixed blocks are always the fresh ones. | `019ec89` |

### P1

| Fix | File | What was wrong | What is now true | Commit |
|---|---|---|---|---|
| Scheduler 1: work hours that cross midnight | `src/features/planner/generate.ts` | `workBlocks` returned `[]` whenever `workEnd <= workStart`. The interview offers "Nights (7pm to 7am)"; anyone who picked it had no work on the plan at all and the whole shift was free time (a wind-down landed at 21:55, mid-shift). A market the interview explicitly addresses got a wrong plan every work day. | `carveWorkDay` treats a crossing shift as one span from its start to its end plus 1440 minutes, runs the same carve logic, and gives each date the pieces that fall on it: the evening piece (`Work 19:00-00:00`) on the night it starts and the morning piece (`Work 00:00-07:00`) on the day it ends, when the previous weekday is a work day. A carved routine stays whole on the day it starts, so a shutdown anchored to work end sits at 06:50 to 07:00 the next morning. Equal hours still mean no work. | `219b911` |
| Training F2: the swap menu was a back door | `src/features/training/swap.ts`, `constraints.ts`, `src/app/session/workout.tsx` | `alternativesFor` offered `Deadlift` and `Trap-bar deadlift` beside a foundation lifter's hinge and `Overhead press` beside their dumbbell press, the two lifts the level withholds, one tap away; and offered `Bench press`, `Squat`, `Barbell row` back to a joints or recovering constraint that had swapped them out. Seven joint-safe movements had no pattern, so a constrained block could not swap anything. | `alternativesFor(name, equipment, rules)` takes the block's own rules: `complexLiftsAllowed(programme.inputs)` (new export, also used by `buildProgramme` so the two cannot disagree) and the programme's constraints, filtered through `COMPLEX_LIFTS` and `ruledOutByConstraints()`. The joint-safe movements are in the pattern table. The workout screen passes the rules. | `671a2f7` |
| Pathways 7: a fish-allergic person could be offered the tuna salad | `src/features/modalities/meals/rotation.ts` `suggestAllowedWeek` | When a person's allergies emptied the allowed list, the week fell back to the unchecked title pool. | The week reads "Your own dinner — nothing on our list fits yet" (`NO_SAFE_DISH`) with leftovers mid-week; `nextAllowedDish` stays put. | `5134d1e` |
| Store F1: restore accepted a backup the app could not open and replaced everything with it | `src/state/backup.ts` (new), `src/app/settings.tsx` | `restoreBackup` checked only that `JSON.parse(text).state` was truthy, wrote the text over `intent-os-store` and rehydrated. A paste of `{"state":{"goals":"oops"},"version":1}`, a mangled list, a non-object profile or a newer version replaced a working state with one the next render fell over on (`goals.filter is not a function`). A backup with `version` stripped was trusted as current, so the version-0 repairs never ran. | `checkBackup` refuses with a reason a person can act on: not JSON, empty, no `state` object, a newer version, a profile without a `firstName`, lists that are not lists, `plans` not a record. Nothing is written on refusal; settings shows the reason. A blob without a version is written back as version 0 so the migration repairs it. A valid current backup passes through byte-for-byte. | `019ec89` |
| Pathways 9*: a meditation goal built a strength workout | `src/features/goals/goalPlanner.ts` | Health goals naming meditation took the health default, a strength workout titled "Meditate every day". A completed journey with a wrong result. | Such a goal gets the `meditation-10` sit and two milestones. | `5134d1e` |

### P2

| Fix | File | What was wrong | What is now true | Commit |
|---|---|---|---|---|
| Scheduler 2*: a during-work block that does not fit was silently dropped | `src/features/planner/generate.ts` | A during-work routine longer than the hours, or pushed past the end of the day by an earlier carve, was not on the plan, not in `unplaced`, and (because `generateDailyPlan` filters `duringWork` routines out of engine placement) nowhere else. | `carveWorkDay` returns `{ blocks, uncarved }`; `generateDailyPlan` appends `uncarved` to `unplaced`, so the Today line covers it like anything the engine turned away. Only routines due that weekday are reported. | `219b911` |
| Scheduler 3*: skipped items were bumped, and a block ending at midnight never clashed | `src/features/planner/moveWithBump.ts` | A skipped item was treated as occupying its hour and as movable, so a move into its slot bumped it and reported "Walk moved to 5:20pm" about a thing the person had skipped, and the picker priced the slot as "moves 1". Overlap arithmetic used `toMinutes(end)`, so a block ending "00:00" read as ending at minute zero and never clashed; a move into a night shift showed no `overlapsFixed`. | `occupies(item) = status !== 'skipped'`; skipped items pass through unchanged and are never in `displaced`. `endOf` goes through `durationMinutes`, so "00:00" ends clash correctly. The 300-seed fuzz holds. | `219b911` |
| Training F3: the focus note described a different block | `src/features/training/programme.ts` | "Focus: bench … week 3 adds a heavy top set" was pushed for every baselined focus lift, including foundation and developing (which never get one) and a constrained lifter whose next note said "No heavy single this block"; and it named a lift a joint constraint had swapped out. | The top-set clause appears only when the level has it and no constraint vetoes it; the note appears only when the lift is still programmed after constraints. | `671a2f7` |
| Training F4: the minutes shown were clamped, not estimated | `src/features/training/programme.ts` | `estimatedMin` in `buildProgramme` and `autoRegulate` was `min(estimate, window)`, so a twenty-minute window showed "~20 minutes" for a session that could not be trimmed below twenty-three. | The honest number. `estimateSessionMin` is exported so a screen's number can be checked against the exercises beside it. Every session in the 10,752-block matrix still fits its `sessionMin`. | `671a2f7` |
| Training F5: under fifteen minutes the two paths disagreed | `src/features/training/programme.ts`, `src/app/session/workout.tsx` | `buildWorkout` returns null under 15 minutes and the screen says a walk beats a rushed workout; `autoRegulate` handed back three lifts at two sets labelled "~14 minutes". | `autoRegulate` returns null under `MIN_SESSION_MIN` (15) and the screen takes the branch it already had for the non-programme path. | `671a2f7` |
| Training F7: choosing the deadlift or overhead press as the focus made the session lighter | `src/features/training/programme.ts` | The focus lift was moved to the front but `primary` was still read from the slot, and those two are non-primary slots; a deadlift focus gave Deadlift 3×6 at 125 and dropped Squat from 4×6 at 105 to 3×6 at 97.5. | The slot that leads because it is the focus lift is programmed as primary: Deadlift 4×6 at 135, Squat 3×6 at 97.5, the same total sets as without a focus, inside the 0.5 to 0.9 band and the ceiling. | `671a2f7` |
| Pathways 1*: recovery insights for two triggers were `undefined` | `src/features/paths/definitions.ts` | The `tired` and `lowmood` triggers are on the intake but had no line, so the hub's first sentence was `undefined`. | Both have a line; an unknown trigger falls back to the "not sure" line. | `5134d1e` |
| Pathways 2*: two replacement answers changed nothing | `src/features/paths/definitions.ts` | `tidy` and `water` were offered and then handed the breath reset, so two of six taps changed nothing. | Each is its own urge answer ("one small job with your hands", "make a drink, slowly"). | `5134d1e` |
| Pathways 3*: the family `ages` answer ignored a second child | `src/features/paths/definitions.ts` | A multi-answer question was compared with `===`, so "primary,under5" got the three-hour outing. | `answered(answers, 'ages', 'under5')` sizes the outing to the youngest. | `5134d1e` |
| Pathways 4*: a duplicate milestone on every family build | `src/features/paths/definitions.ts` `withLadder` | Every family build carried "One outing that actually happened" twice (goal plan plus foundation rung). | A rung's milestone is skipped when the pathway already made the same promise; the pathway's wording wins. | `5134d1e` |
| Pathways 5*: a goal pointed at a routine dedupe had removed | `src/features/onboarding/buildPlan.ts` | A business ambition with `Deep work` in moreOf produced two deep-work routines; `dedupeRoutines` dropped the goal's and the goal kept pointing at a routine that no longer existed. | The goal points at the surviving twin, which adopts the goal if it had none. | `5134d1e` |
| Pathways 6: the development grant survived on a release build | `src/features/plus/entitlement.ts`, `src/lib/purchases.ts` | `refreshEntitlement` preserved a `source: 'dev'` grant against an honest "nothing owned" unconditionally, so a grant persisted by a development build survived on a release build of the same device. | `reconcileEntitlement(current, next, devBuild)`: preserved only when `__DEV__`; a real purchase replaces it in either. | `5134d1e` |
| Pathways 8*: six realistic goals fell to the personal domain | `src/features/goals/goalPlanner.ts` | `meditat\b` never matched "meditate" or "meditation"; "Get strong again", "Get promoted", "Ask for a pay rise", "Pay off the credit card", "Build an emergency fund" all got no domain milestones. | Matchers are `meditat\w*`, `strong\w*|fit|fitter`, `promot\w*|pay rise`, `pay off|credit card|loan|emergency fund|money`. Order unchanged, so behaviour still wins ("cut down", "less", "stop"). | `5134d1e` |
| Store F2: readiness, sync dedupe and sleep debt read "today" in UTC | `src/lib/dates.ts` (`dateKeyOfIso`), `src/features/health/readiness.ts`, `summarise.ts`, `sleepDebt.ts` | `toISOString().slice(0, 10)` compares UTC dates. In Sydney a reading taken at 07:00 is dated yesterday in UTC until 10:00 to 11:00 local, so `readinessFrom` returned null all morning, `baselineFor` included that morning's reading in the baseline it was judging against, a sync after 10:00 wrote a second `sleep.hours` beside a 07:00 hand entry, and sleep debt counted a 06:00 sync and an 11:00 correction as two nights. | Every "which day" read goes through `dateKeyOfIso` or `toDateKey`. The health suites pass under Sydney, Perth, Auckland and UTC. | `019ec89` |
| Store F5: a move to a full tomorrow landed on top of something | `src/state/store.ts` `moveItemToDate` | With no free slot on the target day the item fell back to its own start and was appended: an overlap, nothing displaced, nothing reported. Found by the scheduler pass (D7b). | The chosen time is granted and the target day re-laid with `moveWithBump`; knock-on moves are recorded and returned. When even the bump finds no room, nothing changes on either day and the one entry returned names the item with `to: null`. | `019ec89` |
| Store F6: a development Plus grant survived hydration into a release build | `src/state/store.ts` `onRehydrateStorage` | App data survives a development build being replaced by a release build; `entitlement.source === 'dev'` hydrated and `refreshEntitlement` returned early when StoreKit was unreachable. Found by the pathways pass (E11). | `if (state.entitlement?.source === 'dev' && !__DEV__) state.entitlement = NO_ENTITLEMENT;` and only that. The wider one-liner first proposed would have replaced a real purchase with nothing at every launch until StoreKit answered, locking a paying person out of an offline launch; the test pins the narrower line and asserts the wider one is absent. | `019ec89` |
| Today: "It already happened…" discarded its knock-on list | `src/features/today/item-actions.tsx` `recordHappened` | Putting an item at the time it happened can move something planned for that time. `moveItem` returned the displaced list and the action threw it away, so the person was never told. Found by the scheduler pass (open item S3). | The displaced list is captured and shown, the same as any other move. | `de0c69c` |
| Training: the baseline aged in fractional days | `src/features/training/baseline.ts` | `ageDays` was `(now - at) / 86400e3` from local noon of the session date, so a session logged this morning read as a fraction of a day old by tonight and lost a sliver of its value (expected 111, received 110.9). The journeys test failed in every zone after noon local. Found by the store pass (ST-O1). | The age is `Math.floor` of the days; the discount is per week, so hours are noise. A same-day estimate has age 0. | `ef4de29` |

### P3

| Fix | File | What was wrong | What is now true | Commit |
|---|---|---|---|---|
| Scheduler 4*: titles were lower-cased into pattern sentences | `src/lib/scheduling/adaptation.ts` | Three detectors lower-cased the routine title: "Morning training that sticks isn't sticking.", "Two training that sticks sessions slipped.", "You keep moving date night with sam to the evening." | "Training that sticks keeps slipping in the morning. …", "Date night with Sam slipped twice in a row. Protect the next one?", "You keep moving Zone 2 cardio to the evening. Make that the default?". Payloads, reasons and confidences unchanged. | `219b911` |
| Training F6: "prescribed" in a note the person reads | `src/features/training/programme.ts` | "Established block — full prescribed volume…", against non-negotiable 5. | "full volume". A matrix test keeps "prescri…", "diagnos…", "treatment", "clinical", "medical advice" out of every note, session note and week focus. | `671a2f7` |
| Pathways 10*: the "Meditate daily" preset declared the wrong domain | `src/features/goals/presets.ts` | The preset said `personal` because that is what the broken matcher returned. | `health`. No text or commitment changed. | `5134d1e` |
| Store F3: `SDNN` in a hint a person reads | `src/features/health/bodyEntries.ts` (entries moved out of `BodyNumbers.tsx` so a test can read them) | The HRV hint used the clinical abbreviation. | "The number your watch gives for heart-rate variability (HRV). Only ever compared against your own two-week normal." `jargon.test.ts` bans `\bSDNN\b` in string literals. | `019ec89` |
| Paths: the last two "prescription" phrases on screen | `src/features/paths/LevelCard.tsx`, `src/features/paths/level.ts`, `src/features/copy/__tests__/jargon.test.ts` | The level card's hint read "Return to the standard prescription for this level." and the established-level blurb "Full prescribed volume and intensity…". Found by the training pass (TR-O1) and the store pass (ST-O3, J2 and J3 skipped). | "Back to the plan this level normally runs." and "Full volume and intensity…". The jargon guard no longer skips those two phrases. | `ef4de29` |

## Open items

Each has a reproduction. Items the area passes handed to each other and a
later commit closed are kept here, marked closed, so the trail is complete.
Owners are workstreams or, for product and content decisions, Isaac.

### Closed since the area reports

| Id | Item | Closed by |
|---|---|---|
| S1 | `regeneratePlan` wipes the day's record (P0/P1, scheduler E1 to E4) | `019ec89`, store F4 |
| S2 | `moveItemToDate` into a full day lands on top of something (P2, D7b) | `019ec89`, store F5 |
| S3 | "It already happened…" discards its knock-on list (P2) | `de0c69c` |
| PW-O1 | A persisted development grant reaches a release build when StoreKit cannot answer (P2) | `019ec89`, store F6, with the narrower line explained above |
| ST-O1 | The strength baseline is discounted for a session logged this morning (P2) | `ef4de29` |
| ST-O3, TR-O1 | "prescription" and "prescribed" in the level card and the established blurb (P3) | `ef4de29` |

### Still open

**S4 (P3, library owner).** A during-work routine on a profile with no
work hours never appears and is never reported. Reproduction: a retiree
(`workDays: []`) adds "Deep work block" from the library; `carveWorkDay`
returns nothing for a non-work day and the engine never sees `duringWork`
routines, so the practice shows as "on" and never lands. Not reported
because the honest line would be "there are no work hours for it", which
`displaced.ts` has no wording for; "did not fit today" would be a fib.
Proposed patch: in the library, hide or flag during-work practices when
`profile.workDays` is empty.

**S5 (P3, data model).** An inverted day (wake 22:00, sleep 06:00) is
correct but displays in date order. Pinned in `dayShapes.test.ts` A9: the
plan builds and nothing overlaps once unwrapped, but an item placed at
01:00 stores "01:00" on the same date and sorts before the 22:00 items, so
Today lists the small hours first. A plan is a calendar date; not fixed.

**S6 (P3, Today owner).** Today's "now" item test reads
`toMinutes(i.end) > now`, so an item ending "00:00" is never "now"
(`src/app/(tabs)/today.tsx:131`, still present). True of the night-owl
wind-down (23:40 to 00:00) and now of the night shift's evening piece
(19:00 to 00:00): while on shift the Work block is not highlighted as
current. Proposed patch, one line:
`toMinutes(i.start) + durationMinutes(i.start, i.end) > now`.

**S7 (note, whoever wires the calendar provider).** `generateDailyPlan`
uses calendar events instead of `workBlocks` when any are given, and
during-work routines are then neither carved nor reported. The store passes
`[]` today so nothing is affected.

**S8 (note, brief items 2 and 4).** The shift roster and lunch as a window
are unchanged. The profile still models work as weekdays plus one pair of
hours; A5 pins what that can express. A shift longer than twelve hours that
also crosses midnight would give a pre-midnight piece that `durationMinutes`
treats as a data error (its wrap guard is 720 min); every option the
interview offers is within that.

**S9 (not covered, store owner).** The second-day gate for suggestions
(scheduler F3) lives in `store.ts` `refreshSuggestions` and has no test
from this pass.

**TR-O2 (P3, coaching decision, Isaac).** A joints or recovering swap can
still offer loaded variants the constraint table does not name.
Reproduction: `alternativesFor('Goblet squat — to a box, comfortable
depth', 'gym', { complexLifts: false, constraints: ['joints'] })` includes
`Front squat`, `Leg press`, `Dumbbell lunges`; the press pattern includes
`Dips`. F2 blocks exactly what `JOINT_SAFE` swaps away and the complex
lifts; whether front squats or dips belong beside a sore knee or shoulder
is a coaching call. Proposed patch: a `JOINT_LOADED` list in
`constraints.ts` next to `JOINT_SAFE`, fed into `ruledOutByConstraints`.

**TR-O3 (behaviour change to know about, Isaac).** With F4 a session that
cannot be trimmed to its window says so: a fifteen-minute window on an
upper session shows "~23 minutes" (three lifts at two sets plus an
eight-minute warm-up) instead of "~15". The alternative, dropping a main
lift, breaks "main work kept". If a session that fits at any cost is
preferred, `fitToTime` needs a rule for which main lift goes last; a
product decision.

**TR-O4 (by design, recorded because a reviewer will ask).** The 6 to 7 h
sleep chip changes nothing (`sleptHours < 6` is the short-night test), and
readiness `caution` changes nothing; only `back-off` does.

**TR-O5 (P3, training owner).** `measuredTrainingLevel(metrics, profile)`
does not take a clock while `latestMaxes(metrics, now)` does, so a reading
exactly on a band bar drifts under it by the time a test runs. Not
user-facing; the ladder test uses clear margins. Proposed patch: thread
`now` through for determinism.

**TR (not covered, needs a component harness).** A swap with a logged set,
a swap on the free tier, and the log title after a swap need a rendered
`workout.tsx`.

**PW-O2 (decided 7 Sep 2026: keep the label, show the may-contain line).** Eight dishes claim `dairy_free`
or `gluten_free` while listing milk or gluten under `mayContain`.
Reproduction: `DISHES.filter(d => (d.compatible.includes('dairy_free') &&
d.mayContain.includes('milk')) || (d.compatible.includes('gluten_free') &&
d.mayContain.includes('gluten'))).map(d => d.id)` gives
chicken-fajita-tray-bake, lamb-kofta-salad, shakshuka,
black-bean-sweet-potato-tacos, minestrone-butter-beans, greek-yoghurt-bowl
and two more. The allergy gate excludes all of them (M5 pins it); the
pattern label does not. Proposed: drop the pattern from those records, or
reword the pattern labels as "…-compatible as written". Not changed, being
a claim about food.

**PW-O3 (decided 7 Sep 2026: hands-on work gets no focus block; fixed in the work pathway).** Work pathway: every style except
`manager` gets the deep-work carve, including `physical` ("On my feet,
hands-on work"). Reproduction: `PATHS.work.build({ style: 'physical', team:
'solo' }, profile).routines.some(r => r.protocolId === 'deep-work')` is
true; a plumber is handed a ninety-minute thinking block carved from the
work day. Proposed: physical gets the shutdown ritual and weekly shape
only.

**PW-O4 (P3, interview owner).** trainingDays "None for now" with a
fitness ambition ("Run a half marathon") still schedules the ambition's
sessions. Reproduction: `buildLifeOperatingPlan({ trainingDays: '0',
ambition: 'Run a half marathon' }).routines.some(r => r.sessionType ===
'workout')` is true. Contradictory input; the plan review should say which
answer won.

**PW-O5 (P3, question-meaning decision, Isaac).** Money options for the
retired and student markets (`lasting`, `getting_on_top`) flow into the
money path as `mode: 'lasting'`, which is not one of its modes; the build
silently takes the saving branch. Reproduction: `buildLifeOperatingPlan({
weekShape: 'retired', money: 'lasting' }).pathStarts`.

**PW-O6 (P3, paths owner).** The family pathway for a profile with no
children builds "One-on-one with each child" (the intake presumes kids;
grandparents may start it). Reproduction: `PATHS.family.build({}, {
...profile, people: [], kidsCount: undefined })`.

**PW-O7 (P3, meals owner).** The fallback dinner pool `DINNERS` has three
titles the food model does not know ("Mince, beans & salsa bowls",
"Slow-cooker stew (set it in the morning)", "Chilli con carne (cook once,
eat twice)"), so a saved week from before preferences were declared has a
"current" the cycle button cannot find and restarts at the top. Proposed:
derive `DINNERS` from `DISHES`.

**PW-O8 (P3, paths owner).** Dead branches in insights: recovery reads
`answers.wave`, money reads `answers.buffer`, work reads
`answers.meetingLoad`, family reads `answers.horizon`; none is asked by
that pathway. Guarded, harmless; tidy in passing.

**PW-O9 (P3, paths owner).** The recovery foundation rung "Two-minute
reset — available instantly" has no `sessionType`, so it is not runnable as
a breath session from Today the way the pathway's own breathe answer is.

**ST-O2 (P2, training owner; the one remaining jest skip).** The workout
screen's sleep pre-fill slices the ISO date:
`src/app/session/workout.tsx:69` reads `m.at.slice(0, 10) === today` with
`today = todayKey()` (local). In Sydney a sleep reading entered or synced at
07:00 is not found until about 10:00. Reproduction: the skipped test in
`src/features/health/__tests__/localDay.test.ts` ("reads the day of a
reading locally"); it asserts the file uses `dateKeyOfIso(m.at)`. Proposed
patch: `dateKeyOfIso(m.at) === today`; the helper exists since F2. The file
is being edited by another workstream at the time of writing, which is why
the one-line change is not in `ef4de29`.

**ST-O4 (P3, visual decision, Isaac).** Chart axis ticks are 9pt
(`src/components/charts.tsx:224`). Every chart carries an
`accessibilityLabel` that says the numbers in words, so VoiceOver is
served; the ticks are small for the reading-glasses persona. Reproduction:
remove the `charts.tsx` exclusion in the "no screen sets a font size under
14" test. Proposed: 12pt ticks inheriting Dynamic Type, or drop the tick
row and keep the label.

**ST-O5 (P3, goals owner).** `assessGoal` uses UTC "today" when the store
does not pass one (`src/features/goals/composer.ts:391`). Only the `state`
and `reason` fields depend on it and the store reads only `autoDone` and
`autoUndone`, so no visible defect was found; the same UTC-slice pattern as
F2.

### Hunches, no reproduction, not counted

- `smartMoveOptions` "This afternoon" uses `allSlots` capped at 12 and
  round-robined across windows; on a day with many short gaps the
  afternoon slot may be missed even though one exists.
- `nearestSlot` in `moveWithBump` uses `computeFreeWindows` with a
  20-minute minimum, so a 10-minute practice cannot be bumped into a
  15-minute gap and reads as "no room".
- The `label` text variant is 12pt uppercase; the brief's 14pt floor is
  applied to captions and `label` is an eyebrow, but the 62-year-old
  persona may still find it small.

## What this means for the release

Nothing here has been built or published; the fixes are on the branch and
wait on Apple's approval of 1.0 like everything else.

**What a person sees differently on day one.** Someone who answers
"Nights (7pm to 7am)" gets their shift on the plan, in two pieces, with the
shutdown ritual at ten to seven in the morning, instead of an empty day
with a wind-down mid-shift (`219b911`). Someone with a sore knee or a
recovery constraint never sees a load above their ceiling, never sees a
focus note promising a top set the block then withdraws, and cannot swap
their way back to the deadlift or the barbell squat (`671a2f7`). A
fish-allergic person is told there is no safe dish rather than being
offered the tuna salad (`5134d1e`). "Meditate every day" gets a sit, and
"Pay off the credit card" gets money milestones, instead of a strength
workout and no rungs (`5134d1e`). The recovery hub's first sentence is a
sentence for every trigger, and every replacement tap does something
(`5134d1e`). The session estimate is honest, a fifteen-minute window says a
walk beats a rushed workout on both paths, and the word "prescribed" or
"prescription" appears nowhere a person reads (`671a2f7`, `ef4de29`).
Suggestions name a practice as the app names it (`219b911`).

**Data safety.** Editing a routine, adding a goal or toggling a practice
in the library no longer erases what was completed, skipped, moved or
added that day (`019ec89`). Restoring a backup refuses anything the app
could not open, with a reason, and leaves the current state alone; a good
backup round-trips byte for byte (`019ec89`). Moving an item to a full
tomorrow bumps or refuses and says so, never a silent overlap (`019ec89`).
"It already happened" tells the person what it moved (`de0c69c`). Every
earlier persisted shape hydrates without loss, and a development Plus grant
is dropped on a release build without touching a real purchase (`019ec89`).
Nothing about the free tier changed: the always-free routines and urge
tools are pinned by test (E1, E4).

**Load safety.** The two P0 items above were both about what goes on the
bar or what is kept on record. Beyond them: a load never rounds past the
constraint ceiling (`671a2f7`); the swap menu obeys the block's rules
(`671a2f7`); a focus on the deadlift or overhead press is programmed at
full volume rather than lightening the session (`671a2f7`); the strength
baseline the next block reads is not discounted for a session logged the
same day (`ef4de29`); and a Health reading taken at 7am counts as today's
all morning, so readiness and the auto-regulated session see it and the
baseline does not (`019ec89`). Still open on this front: ST-O2, the
workout screen's sleep pre-fill, one line, waiting on the file.

## Integration seams

Workstream D. Six suites under `src/features/integration/__tests__/`, one
per seam, thirty-seven tests, each driving the real store from a reset
through the interview builder, the plan review's pathway starts and
onward, asserting at every hop, green under UTC and Sydney. Whole suite
after: 121 suites, 1,524 tests.

| # | Seam | Verdict |
|---|---|---|
| 1 | Interview answer to profile to routine to plan item to Today row, every deferred answer | Fixed |
| 2 | Logged set to metric to weighted baseline to next block's load to hub number to level card | Pass |
| 3 | Apple Health sleep to readiness to auto-regulated session to the note | Pass |
| 4 | Behaviour log to pattern to timed intervention to the breath session, Plus off | Pass |
| 5 | Goal with a metric target to milestone ladder to a satisfying reading to the tick to the weekly report | Pass |
| 6 | Backup, restore on a clean store, seams one to five still true | Pass |

**Seam one had three holes** (commit `bf8895c`): a late money answer was
written under a key the money coach never reads, so "paying down debt"
changed nothing and the hub kept talking about investing; the coach hubs
re-asked the intake's own questions and, through a skip rule, never
offered the food-trouble or automation questions; a pressure answer left
the work block's deep-hours target stale. All three fixed in
`src/features/onboarding/buildPlan.ts` and `src/state/store.ts`, pinned by
the seam tests.

**Open from this workstream.** Deferred answers whose only consumer is
the opening interview's builder (sleep quality, mind, more-of, household
fields) land on the profile and never on the calendar; a `routinesForAnswer`
step is proposed in the scratch report. Three path keys (`setup`, `age`,
`weightKg`) are written and never read. Notifications are off by default,
so the timed intervention is a card before it is a push.
