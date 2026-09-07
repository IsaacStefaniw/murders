# Coach value review

Written 2026-09-07 on `claude/rename-murders-folder-goh5q0` (head `f0dc4f4`).

Isaac asked four things: how each coach can add value, given that the
training one is excellent and the rest need work; whether a person can
change what they want to train for; whether nutrition can carry supplements
with their evidence and put them on the shopping list; and how a goal like
"save $100,000" gets broken into milestones and reached. Seven audits ran
in parallel, one per coach, each against the public research and the best
apps in its field, and each shipped its top changes on the branch. This
document is the founder's copy: what every coach does now, what the
evidence says about each thing it does, what changed, what waits, and the
decisions only Isaac can make.

Ratings use three words. **Real value**: the evidence is clear and the app
acts on it. **Marginal**: defensible, but the effect is small or the
specific number is thin. **Theatre**: looks like coaching, changes nothing.
Every row names its evidence as the audit gave it. Grades (A to E) are the
library's own scale: A strong, B controlled trials or large cohorts,
C smaller or mixed, D expert practice, E heuristic. Everything here is
education, never advice; nothing in any coach names a product, a dose or a
treatment as a recommendation.

The seven audits and their commits:

| Coach | Commit |
|---|---|
| Training | `56b789d`, `5752b91` |
| Nutrition | `e483831` |
| Money | `676cee0` |
| Goal setting | `20fada9` |
| Work and leadership | `0f48406`, and the block re-aim in `f0dc4f4` |
| Habits and urges | `3a89848`, and the Today card in `f0dc4f4` |
| Relationship, Family | `60197f6` |

`73d5e07` fixed three date-bound tests that failed on the base commit and
told jest to ignore the agent worktrees; it touches no coach.

## Training

### What it does now

The training coach builds a four-week block from the person's own numbers.
Loads come from an estimated one-rep max weighted over twelve weeks and
decayed with the age of each reading; progression is double progression,
so load only rises when the prescribed reps were all done; the last week
is a deload nobody can skip. Constraints (a joint, a heart condition, a
pregnancy, an injury) substitute movements rather than deleting them, and
a stated ceiling is kept to the kilogram after rounding. A short night or a
low recovery read cuts accessories and keeps the main work. The level is
earned from the log, never chosen on a form; the deadlift and overhead
press wait at foundation until the hinge is learned. As of this branch the
intake asks what the person wants from training and where first, the
block honours the answer, the hub lets them change it without losing their
logs, and swapping a session moves the rest of the week on rather than
repeating tomorrow what was done today.

### The audit

| What the coach does | Rating | Evidence, as the audit gives it |
|---|---|---|
| Loads from the person's own estimated one-rep max, weighted over twelve weeks and decayed with age (`baseline.ts`, `programme.ts` `prescribe`) | Real value | Percent-of-max loading with a recent weighted baseline is the standard in every reviewed periodisation model. |
| Double progression on the top of the rep range; reps falling away hold the load (`log.ts` `suggestNext`) | Real value | Progressive overload only when the prescribed work was done is the rule with the best support. |
| Four-week block with a deload last, the same for everyone (`programme.ts` `PHASES`) | Real value | Planned reductions in volume reliably restore performance in trained people. |
| Constraints substitute and never subtract; ceiling applied after rounding; no near-maximal single beside a constraint (`constraints.ts`, `cappedLoad`) | Real value | A limit the app says it keeps must be kept to the kilogram. |
| Short night or low recovery read cuts accessories, keeps the main work (`autoRegulate`) | Real value | Sleep restriction lowers tolerable volume far more than expressible strength (the sleep-and-training literature). |
| Deadlift and overhead press withheld at foundation, the hinge taught first (`mains`, `LEVEL_TUNING.complexLifts`) | Real value | A coaching convention rather than a trial finding; the conservative one. |
| Level earned from the log; advanced only behind forty-eight sessions over twenty weeks (`paths/level.ts`, `training/level.ts`) | Real value | Training age, not absolute load, makes overreach tolerable. |
| The intake's own answer decides the block: muscle puts sets and accessories on the chosen area, leaner keeps the finisher and adds the walk, fitter gives a day to conditioning, keep runs the holding dose (`programme.ts`, `paths/definitions.ts`) | Real value | Volume directed at the target muscle is the best-supported hypertrophy lever; the walk outperforms any finisher for fat loss over months; intervals move peak aerobic fitness more per session; maintenance needs about a third of the building dose. |
| Effort words (RPE) capped by level, 7 at foundation (`effort.ts`) | Marginal | RPE is well validated in trained lifters and unreliable in beginners for a month or two; the cap protects a number the person cannot yet feel. |
| Population strength bands to place a starting level (`standards.ts`) | Marginal | Lifting-site submissions, self-selected; placement only, never a target. |
| The heavy top single in week 3 at established and above (`prescribe`, `topSingle`) | Marginal | A single at 90% tests the block and is a poor stimulus; morale and the retest are real, neither large. |
| Age 45+: four more warm-up minutes and a note (`estimateSessionMin`) | Marginal | Sensible; evidence for a specific warm-up length is weak either way. |
| The technical cue rotated per session (`TECHNICAL_CUES`) | Marginal | External-focus cueing has good support; whether a line of text on a phone changes what happens under the bar is unmeasured. |
| The finisher's five rounds of 30/60 on a leaner block | Theatre | Five minutes of intervals after lifting is a token; the walk is where the fat-loss evidence sits. Kept because people expect it. |
| "Sessions rotate so no two consecutive workouts repeat" as the boredom answer (`paths/definitions.ts` insights) | Theatre | The person who said "it gets repetitive" gets the same four-week structure as everyone; rotating accessories per block is not built. |
| The 6 to 7 h sleep chip (`workout.tsx`) | Theatre | It changes nothing: the test is `sleptHours < 6`. Recorded as QA TR-O4. |

### What changed on the branch

- `src/features/knowledge/questionBank.ts`: two fitness questions, "What do you want from training?" (`want`) and "Where first?" (`focus`), each with a "not sure" way out (`56b789d`, `5752b91`).
- `src/features/training/want.ts`: the training-side reading of the two answers, the follow-ups that fit each want, the answers the hub writes back, and `describeChange`, the one sentence read from the rebuilt block.
- `src/state/store.ts`: the intake answer is read ahead of the title regex when the block is built.
- `src/features/training/programme.ts`: the muscle, leaner, fitter and keep shapes; the conditioning session built from easy cardio around hard intervals; the holding dose for keep at any level.
- `src/features/training/TrainingHub.tsx`: "Change what I'm training for", the two questions again, only the follow-ups that fit, the block rebuilt with the goal and logs untouched.
- `src/features/training/swap.ts`: `sessionIndexFor` rotates the rest of the Sunday-to-Saturday cycle after a swap.
- `src/features/training/constraints.ts`, `src/app/session/workout.tsx`: the loaded variants the joint table never named (front squat, leg press, lunges, dips, hip thrusts, chin-ups) stay out of the swap menu beside a joints or recovering constraint (QA TR-O2).
- `src/features/training/level.ts`: `measuredTrainingLevel` takes the clock (QA TR-O5).
- `src/features/paths/definitions.ts`: the leaner path adds the daily walk.

### Proposed and not done

- Muscle-by-muscle freshness from the log, the Fitbod idea: `freshness(logs, now)` in a new `src/features/training/recovery.ts`, ordering the swap chips freshest pattern first and letting `autoRegulate` cut an accessory in a pattern trained under 36 hours ago. About a day; waits on Isaac saying yes.
- Per-set effort feeding the next set, the JuggernautAI idea: an effort chip on `SetLogger.tsx`, two rules in `log.ts` (a set two points over target drops the next set's load 5%; every rep at 9+ across sessions is "hold"). Half a day; waits on Isaac.
- The rest timer and next exercise on the lock screen, the Hevy idea: an ActivityKit Live Activity started from `addSet` in `workout.tsx`. Native build; waits for Apple's approval of 1.0.
- The question engine asks the lift again after a fresh intake because it reads `focusLift` and the intake writes `focus`: one line in `isAnswered` in `src/features/knowledge/questionEngine.ts`. Not in this round's ownership.
- A `dependsOn` on `DomainQuestion`, honoured by `src/app/path/[id].tsx`, so the intake shows only the follow-ups that fit, as the hub does.
- The 6 to 7 h sleep chip should do something or the chips should be two (TR-O4). Product decision.
- Rotating accessory choices per block for the person who finds it repetitive. Not built.

## Nutrition

### What it does now

The nutrition coach asks two things at intake, what the person wants
(energy, weight, muscle, or not sure) and how they cook on a weeknight, and
takes one number, their weight, for the protein target. It builds a goal
with a Sunday meal sketch and a walk after the biggest meal, then runs one
lever at a time from a ladder ordered for the aim. The hub shows the
protein target, now beside a fibre target, a three-week weight trend read
from at least three readings with an honest verdict, and the live lever.
The meals session asks the allergen gate once and lays a week of dinners
from the allowed pool. New on this branch: the week becomes a shopping
list grouped by aisle, a supplements group sits in the library with its
evidence and one shared safety line, and anything the person already takes
can be switched on so it appears on the list beside the dinners.

### The audit

| What the coach does | Rating | Evidence, as the audit gives it |
|---|---|---|
| Protein target from weight, scaled to the aim | Real value | ISSN position stand (Jäger et al. 2017): 1.4 to 2.0 g/kg for exercising adults. A for trained people, B for the general adult. |
| Weight trend over three weeks, at least three readings, never one day | Real value | Zheng 2015 (Obesity), Pacanowski 2014, IJBNPA 2015 meta-analysis: frequent self-weighing associates with more loss and less regain. B. |
| Dinners decided once behind the allergen gate | Real value | Gollwitzer, Sheeran, Adriaanse: implementation intentions tested on food. A. The fail-closed gate is the right safety posture. |
| Walk after the biggest meal | Real value | Buffey et al., Sports Medicine 2022: 2 to 5 minutes of light walking cut post-meal glucose about 17% versus sitting. B for glucose, C downstream. |
| Protein at breakfast as the foundation rung | Real value | Trials show a protein-anchored first meal steadies appetite; the weight effect is modest. B. |
| One lever at a time | Real value | Consistent with the library's one-lever practice. |
| The trend verdict copy ("information, not failure") | Real value | Honest about pace and about muscle. |
| Fibre | Was missing, now a number and a lever | Reynolds et al., Lancet 2019: 185 prospective studies, 58 trials; 15 to 30% lower all-cause and cardiovascular mortality at 25 to 29 g/day. A. It was a milestone label the hub never showed. |
| Alcohol | Was marginal, now a lever with the number | NHMRC 2020: no more than 10 standard drinks a week, no more than 4 on any day. B for the guideline, C for drink-free days as a tactic. |
| The `kitchen-closed` lever copy | Theatre in the copy, now fixed | Liu et al., NEJM 2022 (n=139, 12 months): time-restricted eating added nothing to calorie restriction. The line "the eating window does the work" overclaimed; the protocol grade (C) was right. |
| `liquid-calories` lever | Marginal | No protocol behind it; `default-drink-water` (B) is the evidence and the lever now links to it. |
| `fourth-feed` (muscle) | Marginal | Reasonable for lifters; graded nowhere. |
| `plate-half-veg` | Marginal | It is the fibre lever in disguise. |
| The "Not sure" intake aim | Was broken, now a real answer | Choosing it crashed the hub (`LADDER['unsure']` undefined). Normalised to the energy ladder. |
| Rung ladder (weigh-in, cook-ahead, phase review) | Marginal | The developing rung promised fibre it did not deliver; the advanced "phase review" is a training-block concept with no nutrition content. |
| Shopping list | Was missing | Usability finding 8: nine people out of nine asked for it. Australian planners (Pick My Meal, Plate Planner, WiseList) do this by default. |
| Supplements | Were missing by policy | Now a graded, sourced group with the safety line. See the supplements section below. |

### What changed on the branch

- `src/features/nutrition/plan.ts`: `fibreTargetG` beside the protein target; the `fibre-30` and `drink-free-days` levers; "not sure" normalised to the energy ladder instead of throwing; the eating-window copy stops overclaiming; `liquid-calories` links to the water default.
- `src/features/nutrition/NutritionHub.tsx`: fibre shown with the Lancet line in plain words; the "what you take already" toggles; the shopping list entry.
- `src/features/modalities/meals/shopping.ts`: `buildShoppingList`, a pure function over the locked-in week that inherits the allergen gate, groups by aisle in shop order, shows an amount only where the dish states one (written for two), adds lunch protein anchors, and `shareShoppingListText` for the share sheet.
- `src/features/modalities/meals/food.ts`: amounts on the dishes that state them.
- `src/app/nutrition/shopping.tsx`: the list screen; `src/app/session/meals.tsx`: the way in from the meals session.
- `src/features/knowledge/protocols.supplements.ts`: the supplements group, spread into the library once at the end of the array in `src/features/knowledge/protocols.ts`.
- `src/features/nutrition/supplements.ts`: the toggles, stored under `paths.nutrition.answers.supplements` through the existing `updatePathAnswers`.
- `src/features/paths/definitions.ts`: the one-pan insight now honoured by the effort filter.

### Proposed and not done

- A daily lesson on Today, the Noom idea: one library `why` paragraph a day for the live lever. Cheap; a product call about Today's real estate.
- Household size on the shopping list. Amounts are for two; the profile knows partner and kids. A product decision about how much the list should presume.
- The protein band for the sedentary adult: the energy aim uses 1.6 to 2.0 g/kg, which the evidence pins to exercisers; 1.2 to 1.6 is more honest for someone not training. Needs the training path's state; a cross-coach decision.
- Supplements on the intake rather than the hub: the brief asked for a question only if the answer changes the plan, and it changes the list, so it is a toggle. If Isaac wants it at intake, add to `PATHS.nutrition.questions` as `multi: true` with the same values.
- Retailer export: share-as-text reaches Notes, Messages and the retailer apps' paste; a direct Coles or Woolworths cart is a partnership decision.

## Money

### What it does now

The money coach asks what the goal is about, where money goes missing,
what happened to the last rise, whether anything is automated and, now,
whether there is a buffer. It builds one ordered list of steps from those
answers, in the order the arithmetic supports: automate a transfer on
payday, one month of expenses banked, the expensive debt, then the leaks
the person named; the rungs add three months, investing running by itself
and the raise rule, under the same titles so nothing shows twice. The hub
asks for the target, the date and what is there now, and turns them into a
monthly and weekly amount, dated milestones and one honest sentence about
where the current pace lands. The weekly check-in asks the one number a
person can answer, dollars put away this week, and that number moves the
total the goal reads. The Australian shape is in the copy: an offset counts
as paying down the loan, super is pre-tax and locked, HELP is indexed in
June, and where the surplus goes is a licensed adviser question. Education,
never financial advice.

### The audit

| What the coach does | Rating | Evidence, as the audit gives it |
|---|---|---|
| "Automate one transfer on payday" as the first step; `payday-automation` (A) | Real value | Thaler and Benartzi, Save More Tomorrow (JPE 2004): auto-enrolled saving rates 3.5% to 13.6% over four raises; Beshears, Choi, Laibson and Madrian on deployed plans. The mechanism is the default, not the budget. |
| Buffer, then expensive debt, then investing; refusing to skip | Real value | Moneysmart: at least three months of expenses first; Vanguard AU and Morningstar AU on the buffer stopping forced selling. The general case (card and BNPL debt before investing) is arithmetic. |
| Weekly money check-in placed into the week | Real value in shape; was theatre in content | Harkin et al. 2016 (Psychological Bulletin, 138 studies): prompting progress monitoring raises attainment; more when recorded. The block asked for a monthly percentage nobody knows. Now asks dollars in this week. |
| "Savings rate (last month)" as the one number | Theatre | Not computable without income and spend; the path sat in need-data. Kept as the optional second number. |
| The six-step list with the spotlight | Marginal, now one list | Right idea; was duplicated by "Steps, 0 of 8", ticked the debt step for a saver, and the words differed (usability finding 9). |
| Insights ("Sunday, 30 minutes. Small and weekly beats big and never") | Marginal | True, generic, not personal numbers. |
| Raise pre-commitment (`raise-precommit`, B) | Marginal | SMarT is real; a weekly block for a once-a-year decision was the calendar filling a slot. |
| Subscription audit, purchase delay, position check (C, E, B) | Marginal | Reasonable, honestly graded, none sized to the person. |
| No target, no date, no monthly amount, no dated milestones | Was the biggest gap, now built | Gargano and Rossi, Journal of Finance 2024: users who set a specific saving goal saved more. Locke and Latham on specific goals with feedback. CommBank Goal Tracker and Up do this; a JDM randomised study found sub-goal groups timelier; Kivetz, Urminsky and Zheng 2006 on effort rising as the target nears, so early small rungs matter. |
| "Kill the expensive debt" ticked for a saver | Defect, fixed | A tick with no log. A saver now never sees a debt step. |
| Two blocks at Sunday 7pm | Defect, fixed | The transfer set-up moves off the slot the pay-rise rule and the check-in shared. |
| Next-best question card above the steps | Defect in order, fixed | The card sits after the program that was just built. |

### What changed on the branch

- `src/features/money/plan.ts`: `moneySteps`, one answer-driven list with nothing ticked unless the person said so; `savingsPlan`, a target, a date and what is there now turned into the monthly and weekly amount, the landing date, dated milestones and the honest sentence; `monthlyCapacityFrom`, the pace from the last eight weeks of check-ins; `stepDetail`, the sentence under each step (`676cee0`).
- `src/features/money/MoneyHub.tsx`: the target card ("Work out the monthly amount"), the plan card with the next dated milestone, "What went in this week?" writing `finance.weeklyIn` and `goal.<id>.saved`, a wizard goal with a dollar target linked so the coach and the goal never disagree about the same money.
- `src/features/paths/definitions.ts`, `src/features/paths/programme.ts`: buffer asked at intake; the rungs under the shared titles; the question card below the program; the transfer set-up off Sunday 7pm; the Australian copy.
- `src/features/knowledge/protocols.money.ts`: buffer first (B), a target with an amount and a date (B), the student loan date before paying extra (C).
- `src/features/model/metrics.ts`: a label for the weekly-in metric (`f0dc4f4`).

### Proposed and not done

- A month of expenses on the hub. `savingsPlan` accepts `monthlyExpenses` and dates "A month of expenses banked" as a step; the hub does not ask for it, so that rung only appears on the goal screen. Product decision about one more field.
- Interest. `savingsPlan` accepts a rate and the hub passes none, so every figure is arithmetic with no return assumed, and the card says so. Adding a rate field is a product decision, and the copy would have to keep saying it is not a projection.

## Goal setting

### What it does now

A sentence typed into the goal wizard becomes a domain, a target and a
date: "Save $100,000 by June 2028" is heard as money, $100,000 and 30 June
2028, where before the year was thrown away and "in October" was not heard
at all. The planner builds the routines that go on the calendar; the
composer replaces its milestones with a ladder where it can read a number.
Every step now carries a date computed from the pace the target implies,
the routine that gets there in its own words, and one "when X, I will Y"
line. The check-in cadence matches the pace. The goal screen says where the
plan lands from day one, and where the real rate lands once readings
arrive. The review screen opens with the one number the goal moves on.
Behaviour goals, whose streak steps could never tick because nothing on the
calendar carried their id, are dated steps the person confirms, with the
urge tool as the how.

### The audit

| What the composer drafted | Rating | Evidence, as the audit gives it |
|---|---|---|
| Specific target and date parsed from the sentence | Real value now | Locke and Latham (2002): specific difficult goals beat "do your best" in about 90% of comparisons; feedback on progress is a stated moderator. The date was decoration before. |
| Dated near steps under a far target | Was missing everywhere | Bandura and Schunk (1981): proximal sub-goals built progress and self-efficacy; distal goals alone "had no demonstrable effects". |
| One "when X, I will Y" line on every step | Was missing everywhere | Gollwitzer and Sheeran (2006): 94 tests, 8,000+ participants, d = 0.65 for implementation intentions. The library carried `if-then-plan`; no step used it. |
| The check-in cadence as the mechanism | Real value | Harkin et al. (2016): 138 studies, N = 19,951; monitoring raised attainment, more when physically recorded. |
| The wizard's "why" step | Marginal | Oettingen's mental contrasting (WOOP) needs the obstacle and the plan; the wish and outcome were there, the obstacle and plan were not. The intention line is the plan half. |
| Savings ladder (was 10/25/50/100%, weekly ask) | Was marginal, now real | Williamson et al. (2022): process goals d about 1.36, outcome goals 0.09. A ladder of amounts with no behaviour under each was an outcome-only goal in costume. The first step was a tenth of the target; $10k on a $100k goal is not proximal for someone at $12k. |
| Business or career revenue ladder | Marginal | Same shape; monthly cadence right for revenue. |
| Strength (lift kg): streaks then e1RM at target | Real value | Rides the number the workouts already produce; consistency before load. Now dated. |
| Endurance event: streaks, longest run, the event | Real value | Honest that only the person calls the day. Now dated back from the event. |
| Body weight: weigh-ins then the Health trend | Real value | Trend not morning; Health-sourced. Now with a pace. |
| Personal or creative: sessions of real work | Real value | The honest measure. |
| Relationship, family, friends: weeks running of the ritual | Real value | An honest process ladder with no number. |
| Behaviour (quit or cut down): streak steps | Theatre, now fixed | The planner created no routine for behaviour goals, so no completion carried the goalId and no streak step could tick. |
| Experience: pick, dates, budget, book | Real value | Concrete, human-confirmed. |
| Health (sleep, food, meditation) | Marginal | "A week of morning light" is right but was a confirm, not the count the plan already knows. |
| Landing date only after three readings over two weeks (`goalTrajectory`) | Was a gap | A new goal showed no landing date for a fortnight when the plan's own pace implied one. `paceLanding` says it from day one. |

### What changed on the branch

- `src/features/goals/goalPlanner.ts`: `parseGoal` hears "by June 2028", "in October", "by end of 2027"; the timeframe becomes the target date (`20fada9`).
- `src/features/goals/composer.ts`: every step dated, with `how` and `intention`; `savingsPace`; the savings, debt, lift, half-marathon, weight, habit and relationship shapes; `paceLanding`; `assessGoal` reads the local day (QA ST-O5).
- `src/types/domain.ts`: `dueDate`, `how`, `intention` on a milestone; `pace` on a goal.
- `src/app/goals/new.tsx`: the wizard pre-selects the parsed date and asks where the person is now (and, for savings, a month of expenses).
- `src/app/goals/[id].tsx`: the dated steps and the landing line.
- `src/app/session/review/[goalId].tsx`: opens with the one number the goal moves on.

### Proposed and not done

- `savingsPace` moves into `savingsPlan` in `src/features/money/plan.ts` (the audit's own note). Engineering; needs the product call on month counting above.
- The obstacle half of mental contrasting: the wizard's "why" could ask what usually gets in the way and attach the intention to it. Product decision about one more wizard step.

## Work and leadership

### What it does now

The work coach asks what the bottleneck is, who the person leads, the big
bet, their work style and, now at intake, their meeting load. It builds a
focus block sized from style, meetings and pressure, a Tuesday one-on-ones
block for people with reports, and the ladder: shutdown ritual, weekly
shape, delegation pass, the quarter's one outcome. On this branch the
shutdown asks for tomorrow's first thing and carries it onto the next work
day as the goal's next step, so it reads as "Next step" on the first work
block on Today; the weekly review asks three questions and changes next
week from the answers (a block lost to meetings moves to the start of the
day, messages get a batching slot, drift shrinks the block to one that can
be held); focus time is read from the blocks the plans already hold, with
the typed number kept as a correction; and a meeting-load or pressure
answer given later re-aims the block already running without restarting
it at week one.

### The audit

| What the coach does | Rating | Evidence, as the audit gives it |
|---|---|---|
| Shutdown ritual (foundation rung) | Real value, was unfinished | Masicampo and Baumeister 2011: making a specific plan for an unfinished goal removes its intrusion as well as finishing does. Wendsche and Lohmann-Haislah 2017 (91 samples, 38,000 employees): evening detachment associates with lower fatigue. The routine existed and asked nothing. |
| Deep-work block for makers | Real value | Switching cost replicated (Rubinstein, Meyer and Evans 2001; Monsell 2003); attention residue (Leroy 2009). Mechanism B, the practice D. The honest claim is "switching costs you; a block removes switches". |
| Deep hours target from style, meetings and pressure | Real value, was wrong for two markets | Honest arithmetic; `varies` gave NaN and `physical` got a thinking block carved from a shift (QA PW-O3). |
| Deep hours typed once a week | Marginal | The app already knows which focus blocks were held; Sunsama's planned-versus-actual done by hand. Now derived, with the typed number as correction. |
| `assessWork` verdict ("a calendar problem, not a discipline problem") | Real value | The right line; the stored targets went stale when the meeting-load answer arrived later. |
| Four-week block themes | Marginal | Good shape; coaching prose with nothing under it, and only week 2 differed by role. Every week now differs between manager, maker and hands-on. |
| Weekly practices (meeting owners, say no, Friday memo) | Marginal to real | Meeting owners and one-on-ones are C; "say no in writing" and the memo are D. |
| Weekly review session | Real value, was half built | Gollwitzer and Sheeran 2006 and Sheeran, Listrom and Gollwitzer 2024 on plans; Harkin 2016 on recorded progress. A review that produces a plan for next week has support; one that describes last week has none. |
| One-on-ones routine for directs and leaders | Real value | Gallup engagement surveys; Flinchum, Kreamer, Rogelberg and Gooty 2023: weekly beats fortnightly. Observational, C. |
| Delegation pass (established rung) | Marginal | Adams et al. 2021 (subtraction neglect) is the only robust experiment nearby, and it shows people do not think of removing things. D. Could land twice; the rungs now declare what they cover. |
| Bottleneck answers `admin`, `people`, `direction`, `visibility`, `skills` | Theatre, now fixed | Asked, then nothing in the work build changed. Admin, people, visibility and direction each add one practice now. |
| Question card: direct reports, decision volume | Theatre | `directs` and `decisionLoad` were stored and read by nothing; the "decision journal" the prompt promised does not exist. |
| "Executive block" on screen | Theatre, fixed | Reviewers stopped on it. Now "your focus block", with a guard. |
| Meeting load | Was theatre, now real | Laker et al. 2022 (MIT SMR, 76 companies) is a self-report survey, D at best; Kushlev and Dunn 2015 (n = 124) on batching email is the one controlled result, C. The insight promised the block would move and it did not. |
| Big-bet milestones; the quarter's one outcome | Marginal | Fine; nothing reads the answer. |

### What changed on the branch

- `src/features/work/shutdown.ts`: `closeDay` and `restoreLever`; tomorrow's first thing becomes the goal's next step for the day it is for, and the week's lever is put back once that day has passed (`0f48406`).
- `src/features/work/review.ts`: `weekReviewChanges`; did the block survive, what ate it, the one lever; what each answer changes.
- `src/features/work/focus.ts`: `weeklyFocus` and `summariseFocus`; blocks planned and held, eight weeks against the target.
- `src/features/work/programme.ts`: the meeting-load answer moves the block (heavy before the first call, light adds a third, a manager in a heavy week gets a slot for cutting one); `varies` gets a real number; every week differs by variant; a block re-aims from a later answer.
- `src/features/work/WorkHub.tsx`, `src/features/work/WorkNumbers.tsx`: close the day, the three questions, the derived focus hours, "your focus block".
- `src/features/paths/definitions.ts`, `src/features/paths/programme.ts`: meeting load at intake; bottleneck answers add a practice; rungs declare what they cover.
- `src/features/knowledge/protocols.work.ts`: one meeting-free morning (D), messages in batches (C), cut or shorten one meeting (D), each with a safety line.
- `src/state/store.ts`: `updatePathAnswers` re-aims the running work block (`f0dc4f4`).
- `src/app/(tabs)/data.tsx`: focus hours on Progress.

### Proposed and not done

- `physical` still gets the focus carve (PW-O3). The audit recommends the shutdown and the weekly shape only, no carve, with the block available from the library, because the switching-cost evidence is about cognitive work. The test pins today's behaviour as a product decision for Isaac.
- A carer (`weekShape` `caring`) should skip the carve and the meeting-load question and keep the shutdown, the weekly shape and the six-area check. Interview file; not owned this round.
- Retire `decision-volume` and ask `directs` only when the team answer is directs or leaders. Question engine; not owned.
- Route the work goal to the three-question review from the review session (`src/app/session/review/[goalId].tsx`). Not owned.
- A `firstThing` field on `DailyPlan` and a "First thing" line on Today's morning card. Today reads it through `nextFocus` for now; the store field is a proposal.

## Habits and urges

### What it does now

The habits coach is the recovery pathway and everything in it is free
forever. A person names the behaviour, the moments it usually wins (more
than one now) and what stands in its place, or asks the coach to pick one
matched to the trigger. The urge log records an occurrence at the time it
happened and answers with the mechanism if one applies; after four logs
the pattern engine finds the window it clusters in and times a nudge
ahead of it on the days it lives on. New on this branch: a Tonight card on
Today from day one with the if-then plan in the person's words, wins as
clear nights counted and days since the last one in numbers that only go
up, a lapse turned into the next hour's plan rather than a reset, a
stand-in that fits the trigger, a setup checklist per behaviour, and the
breath session opened straight on the fastest reset from the urge button.
The hub draws the clinical line per behaviour: nicotine replacement through
a GP or quitline, the bank block and a helpline for gambling, shakes and
sweats for alcohol.

### The audit

| What the coach does | Rating | Evidence, as the audit gives it |
|---|---|---|
| Time-first urge log, no quantity | Real value | Michie's taxonomy work and the alcohol meta-regression: prompting self-recording associates with larger effects; used in only 29% of digital alcohol interventions. |
| Mechanism at the moment, graded | Real value | Informing without shaming; the evening-glucose and late-caffeine lines change a Tuesday. |
| Pattern window, days and lead time | Real value | Timed ahead of the window from the person's own logs; silent until four logs. The best thing in the coach. |
| Short-sleep co-factor | Real value, narrow | True; only fires with Health data. |
| The if-then plan | Was the gap, now leads | Gollwitzer and Sheeran: 94 studies, d = 0.65, larger when contingent and rehearsed; the "then" must be an action performed. The intake stored a trigger tag, not a sentence. |
| Breath session | Real value | The toolkit. Was a chooser away when the urge is now. |
| "One miss is noise, two is the fork" | Real value | Marlatt on the abstinence violation effect; Lally: one missed day does not slow habit formation, two in a row do. No surface acted on it. |
| No streak anywhere | Real value and a gap | Right to refuse a reset-to-zero streak; wrong to show nothing. I Am Sober's counter from day one is what the reviewers asked for. |
| Alcohol and gambling safety notes | Real value | Drink Less RCT (5,602 people, eClinicalMedicine 2024); daily drinking with withdrawal is a doctor's job; self-exclusion and bank blocks for gambling. |
| Vaping | Was missing its safety note | RCTs since 2024 (This is Quitting; JAMA 2025 varenicline in 16 to 25 year olds); NRT and a quitline roughly double the odds. Fixed. |
| The 24-hour window label beside 12-hour times | Marginal | A usability finding; now a plain-words line. |
| Week pressure line | Marginal | A count and a direction; rarely read. |
| The intake's single trigger and single replacement | Marginal, fixed | Lost half of what people said; `unsure` always breathed even when the trigger said boredom. Habit reversal training (Azrin and Nunn): the competing response must match the cue. |
| The fixed "urge answer" hour by trigger | Marginal | 12:45 for stress is a guess; the timed intervention replaces it once there is a pattern. |
| Foundation rung: two-minute reset block 20:00 to 22:00 | Theatre, fixed | A daily calendar block with no session type, not even runnable. Now runnable. |
| Developing rung: evening check | Marginal, fixed | Now the urge log. |
| Established and advanced rungs | Theatre, mostly | Weekly and yearly reviews with no content; the weekly one is now the three-moment if-then plan. |
| Hub insight lines | Marginal | True sentences nobody reads twice; the plan leads now. |
| Social support | Right not to build | SmokeFree Buddy RCT null; reviews find little for partner support. "Tell one person who will ask on Friday" is the honest version. |

### What changed on the branch

- `src/features/behaviours/tonight.ts`: `ifThenPlan`, `tally` (clear nights and days since, never reset), `nextHour`, `standInFor`, `timingLine`, `tonightModel` (`3a89848`).
- `src/features/behaviours/TonightCard.tsx`: the card; wired under Tonight on `src/app/(tabs)/today.tsx` in `f0dc4f4`.
- `src/features/behaviours/environment.ts`, `EnvironmentChecklist.tsx`: the setup per behaviour (charge it in the kitchen, nothing in the house on the off nights, the bank gambling block) with the daily-drinking guard above the alcohol list.
- `src/features/behaviours/catalog.ts`: vaping carries the safety note smoking already had.
- `src/features/knowledge/questionBank.ts`, `src/features/paths/definitions.ts`: the trigger takes more than one answer; "help me pick" matched to the trigger; the if-then sentence as the first insight; the clinical line per behaviour.
- `src/features/paths/programme.ts`: the foundation rung runnable; the evening check is the urge log; the weekly review is the if-then plan.
- `src/app/session/breathe.tsx`: `?urge=1` skips the chooser and starts on the sigh; finishes on it passed, go again, or it happened, with the stand-in.
- `src/features/knowledge/protocols.habits.ts`: tonight in your own words (B), a stand-in that fits the trigger (C), ten minutes first (C), after a slip the next hour (C); every id urge-prefixed and free by the entitlement rule.

### Proposed and not done

- The paywall banner should say the urge tool is free forever. The card carries the line; `PlusNudge` is not the habits coach's file.
- The gambling catalogue line names an Australian phone number; the brief wants helplines generic. The new content is generic; the catalogue line is a proposal.
- Friction at the moment of opening an app (the one sec finding, Grüning 2023 PNAS: 36% of opens abandoned) needs the Screen Time entitlement the app does not have. The checklist teaches the setup instead.

## Relationship

### What it does now

The relationship coach now asks who it is about before anything else: a
partner, someone new, nobody right now, or not sure yet. Nobody gets the
friends practices and no partner-shaped promise. Then temperature,
obstacle and window. A hard or no-window answer gets the first five minutes
and one spoken appreciation; conflict gets the written third-person look at
the last argument, the one version of repair with a trial behind it;
drifting adds answering the small things; work gets the monthly state of
us. The weekly two-of-you check-in is three questions on the household hub
and two of the answers land on next week's plan: the swap on Monday
evening, the thing they asked for mid-week with their name on it. The
message it sends is grouped by day, says who each line is for, asks what to
move, and is signed by the sender rather than the product.

### The audit

| What the coach does | Rating | Evidence, as the audit gives it |
|---|---|---|
| The first five minutes (`partner-reunion`) | Real value | Daily-diary stress spillover work; five minutes, costs nothing. |
| Name one thing (`partner-appreciation`) | Real value | Specific spoken appreciation has small experiments; the cheapest practice here. Gottman's 5:1 supports the direction, not a number to count. |
| Weekly two-of-you check-in (`partner-checkin-weekly`, E) | Was marginal, real with structure | As written it was a 20-minute block called "logistics". With three questions whose answers change next week it is the thing the household hub is for. |
| State of us (`state-of-us`, C) | Real value | Cordova et al. 2014, the Marriage Checkup RCT (n = 215): an annual structured check-in, small-to-medium gains at two years. Monthly, not weekly, is what has evidence. |
| Repair, rehearsed (`repair-rehearsal`, D) | Marginal, replaced for conflict | Finkel et al. 2013 (Psychological Science): three 7-minute written reappraisals of the last fight from a neutral third party's view eliminated the year-two decline. One RCT, one site, C. The rehearsed phrase is untested. |
| Turning toward bids | Added at D | Gottman's observational cohort (86% versus 33%); the divorce-prediction equation fell to about 29% positive predictive value on a fresh sample (Heyman and Slep 2001). Plausible, cheap, untested alone. |
| Shared novelty | Added at C | Aron et al. 2000: couples assigned a novel joint task reported more closeness; replicated in small samples. There was no couples version; `family-adventure` was about the kids. |
| Rung: one ritual that survives a bad week | Marginal | Leaves the person to invent it on a Wednesday at 8pm. |
| Rung: the conversation you have been putting off | Theatre | A calendar block for an unnamed conversation. |
| Rung: repair check | Marginal | No structure; duplicates state-of-us in spirit. |
| Every combination assumed a partner | Defect, fixed | A profile with nobody on it got partner practices. |

### What changed on the branch

- `src/features/knowledge/questionBank.ts`: "Who is this about?" (`with`) ahead of temperature (`60197f6`).
- `src/features/paths/definitions.ts`: the build by who it is about; conflict gets the written reappraisal; drifting adds turning toward; solo gets the friends practices.
- `src/features/relationship/checkin.ts`: `CHECKIN_QUESTIONS`, `checkinPlanItems` (the swap on Monday 19:00, the ask for them on Wednesday 19:30), `checkinShareText`.
- `src/app/household.tsx`: the three questions on the hub; who has what; the message grouped by day and signed by the sender.
- `src/features/knowledge/protocols.people.ts`: answer the small things (D), the last argument as a stranger would see it (C), something neither of you has done (C).

### Proposed and not done

- A shared prompt both people answer (the Paired idea) and logistics inside the entry (the TimeTree idea) need a second account. The "partner accounts coming" card stays. Product and store decision.
- Digital couples programmes with a coach (OurRelationship, PaarBalance) are structured courses; whether the app wants course content is a product decision.

## Family

### What it does now

The family coach reads who is in the household before it builds anything:
under fives, primary, teenagers, grown up and moved out, the grandchildren,
a parent being cared for, a partner. It has five shapes. A carer's two
hours that are theirs go in before anything else, with a weekly ask for
cover and ten daily minutes that are not caring, and no outing survives.
Teenagers get side-by-side time, one real decision a week and the
device-free meal. Young kids keep the outing, the one-on-one and the meal.
A grandparent gets the standing day with the grandchildren. A couple with
no kids gets the couple's version of adventure; kids-only rungs and
milestones are stripped from any household that cannot use them. The
household hub shows who has what this week: yours alone, the two of you,
one at a time, everyone.

### The audit

| What the coach does | Rating | Evidence, as the audit gives it |
|---|---|---|
| One-on-one with each child (`one-on-one-child`, D; `child-led-play`, C) | Real value | Child-directed play is the first component of PCIT and Incredible Years; gains after as few as four sessions. Needed a teen version. |
| Device-free family meal | Real value, confounded | Dallacker et al. 2018 and Robson et al. 2020 meta-analyses; Goldfarb et al. 2015: studies adjusting for family connectedness are much less likely to find an effect. C, and the copy says so. |
| One unmoveable ritual (`family-ritual-anchor`) | Real value | Fiese's family-routine literature (correlational). Small and repeatable. |
| Rung: one outing in the diary before the week starts | Real value | It is the implementation intention that makes the outing happen. |
| Booked-in family adventure (3 h Saturday) | Marginal | The strongest part is "in the diary", not the outing; three hours weekly is a load. With teenagers or a carer it is wrong outright. |
| Time with teenagers | Was missing | Milkie, Nomaguchi and Denny 2015: engaged family time with adolescents relates to fewer risky behaviours; Vasquez et al. 2016 (36 studies) on autonomy support; Kaap-Deeder 2023: a moment of autonomy support lifts mood the same day. Side-by-side, on their terms, real decisions. C. |
| The carer's own recovery | Was missing | Meta-analyses of carer interventions (PLOS One 2021; 2025): respite and social support buffer strain to distress, and the break has to actually happen. C. |
| Stretch the anticipation (trip) | Marginal | Nawijn is observational; the branch was dead because `horizon` is never asked here. |
| Look back at it together | Marginal | Small savouring studies; ten minutes, harmless. |
| Rung: protected family evening | Marginal | Near-duplicate of the ritual anchor. |
| Rung: the family year | Theatre-adjacent | A Sunday hour to "map the year"; no structure. |
| Household hub: shared list, share-as-text | Marginal, now structured | Flat list ending "planned with IntentNorth"; nothing a partner could act on. Cozi's per-person view is the borrowed idea. |
| Babysitter reminder | Real value, small | The one logistics feature that makes a date night happen. |
| Family pathway for no kids (QA PW-O6) | Defect, fixed | "One-on-one with each child" for a grandparent, a carer or a couple. |

### What changed on the branch

- `src/features/family/composition.ts`: `composition` and `familyVariant` (carer, teens, young kids, grandparent, no kids) read from the intake first and the profile second; `withoutMatching` strips kids-only and outing content (`60197f6`).
- `src/features/family/householdWeek.ts`: `householdWeek`, `whoHasWhat`, `householdShareText`, `nextDateNight`.
- `src/features/knowledge/questionBank.ts`: "How old are the kids, if there are kids?" gains grown up and no kids; "Anyone else this time is for?" (the grandchildren, a parent I care for).
- `src/features/paths/definitions.ts`, `src/features/paths/programme.ts`: the five builds; the carer's hours first; teenagers' practices; the standing day with the grandchildren.
- `src/app/household.tsx`: who has what; the message grouped by day.
- `src/features/knowledge/protocols.people.ts`: two hours that are yours (C), ask for cover once a week (D), ten minutes that are not caring (D), the drive the dog the dishes (D), one decision that is theirs (C), the standing call (D). The carer entries never nag and point past tired to a GP.

### Proposed and not done

- A `caredFor` and `grandchild` relation on `Person` in `src/types/domain.ts`. The interview names those people with fixed strings and `composition.ts` matches on the string, which is fragile. Store change.
- The trip branch: `horizon` belongs to the experience domain and is never asked in the family pathway. Either ask it here or drop the branch. Product decision.

## The $100,000 example, end to end

The goal: "Save $100,000 by June 2028", typed into the goal wizard on
7 September 2026 by someone with $12,000 set aside, $4,500 a month of
expenses, and no transfer automated. Two functions produce the numbers.
The goal screen is `composeGoalDraft` in `src/features/goals/composer.ts`,
which uses its own `savingsPace`. The money hub is `savingsPlan` in
`src/features/money/plan.ts`. Both were run on these inputs on the branch
head to produce the lines below.

**The sentence becomes a goal.** `parseGoal` in
`src/features/goals/goalPlanner.ts` reads the domain as money, the target
as $100,000 and "by June 2028" as 30 June 2028. The wizard pre-selects the
date and asks where the person is now and a month of expenses.

**The pace.** `savingsPace(12000, 100000, '2026-09-07', '2028-06-30')`
in the composer: 662 days is 21 whole months; $88,000 over that is $4,191 a
month. The goal stores `pace: { perMonth: 4046, startValue: 12000,
targetValue: 100000 }`.

**The steps, each dated where the straight line from $12,000 today to
$100,000 on 30 June 2028 crosses the amount** (the composer's
`dateAtValue`):

| Step | By | Done when |
|---|---|---|
| The transfer set up on payday | 14 Sep 2026 | You call it done |
| First $1,000 more: $13,000 set aside | 15 Sep 2026 | Reaches $13,000 |
| A quarter of the way: $25,000 set aside | 14 Dec 2026 | Reaches $25,000 |
| Halfway: $50,000 set aside | 20 Jun 2027 | Reaches $50,000 |
| Three quarters: $75,000 set aside | 25 Dec 2027 | Reaches $75,000 |
| Done: $100,000 set aside | 30 Jun 2028 | Reaches $100,000 |

The transfer step appears only because the automation answer was "no" or
"partial"; an unasked question is not a no. "A month of expenses banked"
is dropped here because $4,500 is already under the $12,000 set aside; for
someone with $15,000 of monthly expenses it would sit second, dated
30 September 2026. Every amount step carries the same how, "$4,191 a month
moved on payday, before anything else · Money check-in on Sundays", and
the same intention, "When pay lands, I will move the $4,191 before
anything else is spent." The planner puts the money check-in on Sundays,
30 minutes.

**The check-in.** One question, weekly: "How much is set aside toward
“Save $100,000 by June 2028” right now?" It writes `goal.<id>.saved`, the
metric every amount step reads.

**The landing line, from `paceLanding` in the composer.** Day one, no
readings: "At $4,191 a month from $12,000 you land on 30 Jun 2028." Three
months in with $22,000 set aside: "At $3,345 a month you land on
16 Nov 2028 — You said 30 Jun 2028; that needs $4,191 a month from here."
With $27,000: "At $5,017 a month you land on 23 Feb 2028 — about 18 weeks
ahead of 30 Jun 2028." The fitted trajectory takes over once it has three
readings over two weeks.

**The money hub reads the same goal.** `linkedTarget` in
`src/features/money/MoneyHub.tsx` finds the wizard goal by its
`goal.<id>.saved` check-in and takes the target and the date from it, so
the hub says "Read from your goal “Save $100,000 by June 2028”" and the
two never disagree about the same money. The hub's card comes from
`savingsPlan({ target: 100000, byDate: '2028-06-30', startingBalance:
12000 })`:

- Heading: "$100,000 by June 2028".
- Sentence, before any weekly entry: "To land on June 2028 you need $4,191 a month, about $967 a week."
- Under it: "$12,000 there now · next: a quarter there, $25,000 by January 2027".
- The rungs: the first $1,000 (reached), a tenth of the way (reached), a quarter there $25,000 by January 2027, halfway $50,000 by July 2027, three quarters $75,000 by January 2028, done $100,000 by June 2028.

**The weekly number moves it.** "What went in this week?" on the hub
writes `finance.weeklyIn` and adds to `goal.<id>.saved`.
`monthlyCapacityFrom` turns the last eight weeks of entries into a pace,
and the sentence changes to the honest one: at $4,000 a month, "At $4,000
a month you land on June 2028. To land on June 2028 you need $4,191 a
month." Ahead of the date it says so; nothing going in is said plainly
rather than as a date in the year 2100.

**The steps under the spotlight.** `moneySteps` for a saver with no
automation: one transfer automated on payday, one month of expenses
banked, the target and the date written down, then the leaks and the raise
rule the person named. The rungs add three months banked, investing set up
to run by itself, and the transfer raised a notch, under the same titles.
Nothing is ticked unless the person said so.

**One arithmetic, since the review.** The goal composer's `savingsPace` now counts whole calendar months with the money coach's own `monthsBetween` (exported from `src/features/money/plan.ts`) and rounds the monthly amount up, and `savingsPlan` rounds up the same way, so that many transfers reach the target on the date. The goal screen and the hub say the same number, and the plan's own pace lands on the target date by construction. Lifts and body weight keep the fractional month, because "3 kg a month" is a pace, not a count of transfers.

## Supplements, and the line we hold

The sourcing policy in `docs/KNOWLEDGE.md` said "no substances" and meant
that no library entry should ever put a compound into somebody's week on
the app's say-so. Isaac asked for supplements with evidence. The honest
version of that request is not a list of things to take; it is a list of
what the public evidence shows, graded the same way as everything else.

**The group** lives in `src/features/knowledge/protocols.supplements.ts`
and is spread into the library once, at the end of the array in
`src/features/knowledge/protocols.ts`. Every entry is never-nag, so a
skipped supplement carries no meaning and the adaptation engine can never
say someone is behind on a substance. Where an amount appears it is the
one the named position stand or guideline states, described as theirs.

| Entry | Grade | The evidence, as the audit gives it |
|---|---|---|
| Creatine, the plain kind | A | ISSN position stand (Kreider et al. 2017): the most-tested sports supplement; safe in healthy adults; needs resistance training to matter. |
| Protein powder is food, not a supplement | B | The ISSN stand prefers whole foods and treats powder as convenience; no evidence beyond the protein target. |
| Vitamin D: test before you take | B | VITAL (NEJM 2019, n = 25,871) and D-Health: no benefit in people not deficient; benefit is for the deficient, which only a blood test can say. |
| Omega-3 from fish, before a capsule | B | VITAL and ASCEND: capsules did not lower heart disease overall; AHA: two fish meals a week. |
| Caffeine: before training, far from bed | A | ISSN position stand (Guest et al. 2021) for performance; Gardiner et al. 2023 meta-analysis for the sleep cutoff. |
| Magnesium, with the evidence as it is | D | Mah and Pitre 2021 and a 2024 review: low to very-low certainty, no basis for routine use. One of the most-bought supplements in the country; graded D on purpose and says so. |
| Melatonin is about timing, not sleep | C | AASM 2017: not for chronic insomnia; timed small amounts for jet lag and shift work. A pharmacy or doctor product for adults in Australia. |
| Iron, and anything else that needs a test first | B | RCPA position statement; Haemochromatosis Australia: never without ferritin and haemoglobin; overload is common enough that unneeded iron can harm. |

**The safety line** is one exported string, `SUPPLEMENT_SAFETY_LINE`, and
every entry ends on it, so the policy is enforced by the test that reads
it back rather than by authors remembering: "Education, never advice:
nothing here tells you to take anything, and no amount on this card
outranks a label or a professional. Talk to a doctor or pharmacist before
starting anything — especially if you take any medication, because
interactions are real; if you are pregnant or breastfeeding; if you have a
kidney or liver condition; or if you have any history of disordered
eating." Each entry adds its own line in front: the kidney condition for
creatine, allergen labels for powders, blood calcium for vitamin D, blood
thinners for fish oil, palpitations and pregnancy for caffeine, children
and iron poisoning.

**What stays excluded**, listed in the note beside the longevity group in
`protocols.ts` and repeated at the top of the supplements file: rapamycin,
metformin, NAD precursors, resveratrol, hormone therapy, and anything that
needs a result or a professional to decide.

**How it reaches the shopping list.** "Anything you take already" changes
the list and not the plan, so it is a toggle on the nutrition hub, not an
intake question. `SUPPLEMENT_CHOICES` in `src/features/nutrition/supplements.ts`
names what can be switched on (creatine, protein powder, oily fish twice a
week, vitamin D, iron, magnesium), each pointing at its library entry so
the grade, the source and the safety line are one tap from the switch, and
each carrying the library's own condition beside it ("only after a blood
test showed low", "only after a ferritin test", "the evidence is thin").
The answer is stored under `paths.nutrition.answers.supplements` through
the existing `updatePathAnswers`, comma-joined like every multi answer, and
read with `parseSupplements`. `buildShoppingList` in
`src/features/modalities/meals/shopping.ts` adds each switched-on item
under its aisle (supplements, pharmacy, or the fish counter for the
sardines) with the condition as its note. The screen at
`src/app/nutrition/shopping.tsx` says it plainly: "Anything under
Supplements or Pharmacy is there because you switched it on — the list
never suggests one. Educational structure, not dietary or medical advice."
Caffeine and melatonin have library entries and no toggle: neither is a
thing to buy on the app's word.

## Changing what you train for

Before this branch the block guessed strength, muscle or fat loss from the
words in the goal title, and there was no way to say it plainly or to
change it.

**The two questions**, in `src/features/knowledge/questionBank.ts` under
fitness. "What do you want from training?" (`want`): get stronger, build
muscle, get leaner, get fitter for running or a sport, keep what I have,
or not sure. "Where first? The lift, the body area or the distance that
fits." (`focus`): the bench, the back squat, the deadlift, the overhead
press; upper, lower or whole body; 5 km, 10 km or more, a sport; or
"Wherever you say". Both carry a not-sure way out because the simulation's
rule caught a forced choice (`5752b91`). The store reads the answer ahead
of the title regex when it builds the block.

**What each answer changes in the block** (`src/features/training/programme.ts`,
`56b789d`):

- Stronger: the main lifts first, loads stepping up each week; the chosen lift opens every session it is in, with a heavy top set in week 3 at established and above.
- Muscle: an extra set on the chosen area's lifts and an extra accessory for the area, listed first, with the loaded ones filtered through the joint rule.
- Leaner: the finisher stays on every session but the deload, and the path adds the daily walk, which is where the fat-loss evidence sits.
- Fitter: one lifting day becomes a conditioning session built from easy cardio around hard intervals, a round more in the peak week, easy pace only in the deload and beside a heart condition, a pregnancy or an injury; the easy session stays in the week.
- Keep what I have: no more than three sessions at the same dose, no peak week, no top single, no overreach, at any level.

**The hub control.** "Change what I'm training for" on
`src/features/training/TrainingHub.tsx` asks the two questions again,
showing only the follow-ups that fit the want (`focusOptionsFor` in
`src/features/training/want.ts`; keep has none, because the point is all
of it). It writes the answers through `updatePathAnswers`, including
`focusLift` so the question engine does not ask the lift again, rebuilds
the block from the current numbers with the goal and the logs untouched,
and shows one sentence from `describeChange`, read from the rebuilt block
rather than the answers so it cannot promise a top set the constraints
vetoed or a conditioning day that was not built: "Was getting stronger;
now building muscle: 3 sessions a week, an extra set and an extra
accessory on the upper body." The hub's list leaves "not sure" out: a
person changing what they train for has one in mind.

**The session swap now rotates the week.** `sessionIndexFor` in
`src/features/training/swap.ts`: the day after a swap runs the session
after the swapped one, the days before it keep what they were, and the
order never crosses the Sunday-to-Saturday cycle, so the session just done
is never the next one offered. This was competitive review item 5.

## What Isaac decides

- Training: whether `physical` work and a trade's day keep the focus carve at all; this is the work coach's PW-O3, pinned by a test as a product decision. Decided 7 Sep 2026: no focus block for hands-on work; shutdown and weekly shape only, the block stays in the library. Done.
- Training: whether the 6 to 7 h sleep chip should do something or the chips should be two (QA TR-O4).
- Training: yes or no to the freshness function, the per-set effort chip, and the lock-screen rest timer once Apple approves 1.0.
- Training: whether accessories rotate per block for the person who finds it repetitive.
- Nutrition: whether Today gets a daily lesson line for the live lever.
- Nutrition: whether the shopping list scales to household size, and how much it presumes.
- Nutrition: whether the energy aim's protein band drops to 1.2 to 1.6 g/kg for someone not training; a cross-coach call.
- Nutrition: whether "anything you take already" stays a hub toggle or moves to the intake.
- Nutrition: whether to pursue a retailer cart integration or leave share-as-text.
- Money: which month count the app uses for the savings pace. Decided by the code on 7 Sep 2026: whole calendar months from one function, rounded up. Done.
- Money: whether the hub asks for a month of expenses, and whether it ever takes an interest rate.
- Goals: whether the wizard asks for the obstacle, the missing half of mental contrasting.
- Work: whether a carer skips the carve and the meeting-load question (interview file).
- Work: whether `decision-volume` is retired and `directs` asked only of people who lead.
- Work: whether the work goal's review routes to the three questions, and whether Today gets a "First thing" line of its own.
- Habits: whether the paywall banner states that the urge tool is free forever.
- Habits: whether the gambling catalogue line drops the Australian number for a generic helpline.
- Relationship: whether partner accounts are built, which is what a shared prompt and logistics inside an entry need.
- Relationship: whether the app carries course content of the OurRelationship kind.
- Family: whether `Person` gains `caredFor` and `grandchild` relations (store change).
- Family: whether the family pathway asks `horizon` or drops the trip branch.
