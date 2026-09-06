# Usability review

Workstream B of `docs/REVIEW_BRIEF.md`, section 4B. Branch
`claude/rename-murders-folder-goh5q0`, walked on 2026-09-06 against the served
web export of the build at `671a2f7` and re-checked after the fixes below.

Screenshots are named by relative name (`<journey>-<persona>-<step>.png`, with a
`-full.png` full-page capture and a `.txt` of the screen's own words beside
each). They live in the review session's capture folder, not in the repo; the
names are stable and the walker scripts (`walk.js`, `ulib.js`, `personas.js`,
`overflow.js`, `aggregate.py`) sit beside them, so the pack can be rebuilt from
any commit.

## Summary

Nine people walked twelve journeys, and the app held up in the places that
matter most for App Review and for trust: dark mode, the small screen, labelled
controls, the always-free rule on the urge tools, and a month on the free tier
that never degrades. Two things were genuinely wrong. After swapping an
exercise the logger kept the old lift's load, so one tap recorded a back
squat's 160 kg against a front squat; and a person who said "sore joints or
back" and tapped Train on day one was handed a deadlift, despite the plan review
promising kinder movements. Both are fixed on the branch, along with a restore
path that did not exist on a clean phone, a hint that told free users to tap
rows that were not there, library copy that promised automatic scheduling the
free tier does not do, and a breath reset that at 9pm sat five sections down.
The fixes are in `d7727f0` (screens) and `019ec89` (Settings), with two
local-day follow-ups in `964694f`.

What is open is mostly product, and most of it is the free tier's first two
days. Day one carries a full-width "Run my day with Plus" button; the free day
has no rows at all, so "the day's shape" is Work and a bedtime, and the walk
four people said was already part of their life is locked behind Plus. The
ambition becomes a session titled with the ambition itself ("Lose 8 kg without
a diet, 12:05pm, 45 min"). Every market except the employed professional gets a
plan review that departs from what that market was promised: office hours for a
mother at home, a noon workout on a night nurse's sleep day, a 6:15am strength
session for a retiree who said walking counts, and no daylight or movement for a
rebuilder who was told the plan keeps both in every day. These are the two
numbers round three will move, `paywall_too_early` and `free_tier_unclear`, and
they are Isaac's calls. There is no shopping list, and the money hub shows two
different step lists. Eight glossary words are still on screen, each with a file
and a replacement below.

## Method

### The nine

One persona per market row in `docs/MARKETS.md` (drawn from the persona pools in
`docs/review/personas.py`), plus Isaac and the 62-year-old on an SE the brief
asks for. The brief says twelve; nine covers every row once, and the three
spare seats were spent on running every journey for every persona rather than on
a second employed professional.

| id | Market row | Who | Viewport |
|---|---|---|---|
| priya | Employed professional | 34, 9 to 5:30, partner, sore knee, "lose 8 kg without a diet" | 390 by 844 |
| dan | Operator | 44, freelance, sets his own hours, partner and teenagers, "stop working until midnight" | 390 by 844 |
| nkechi | Shift worker | 29, night-shift nurse (Tue Wed Fri Sat 7pm to 7am), energy unreliable, "sleep properly on nights" | 390 by 844 |
| liam | Student, early career | 22, sharehouse, night owl, runs, trains four days | 390 by 844 |
| mel | Carer | 38, at home with three young children, postpartum, "two hours a week that are mine" | 390 by 844 |
| graham | Retiree | 68, grandchildren and volunteering, balance and back, walking is his training | 390 by 844 |
| tom | Rebuilder | 51, back from burnout, four-day week, on medication, no training for now | 390 by 844 |
| isaac | Isaac | founder, sets his own hours, partner and kids, trains four days | 390 by 844, dark mode |
| judith | 62 on an iPhone SE | part-time three days, sore knees, menopause sleep, reading glasses | 320 by 568 |

### The twelve journeys

Numbered as in the brief. Each was scripted with an expected outcome; a
departure is a finding.

1. Cold open to first day: welcome, example day, the twelve questions, plan review, Today.
2. Day two: what changed, the Plus card, the suggestion, the morning and evening check-ins.
3. The bad day: a short night before training, a meeting on the walk, an item that already happened, one that will not, a skipped session, and tomorrow. Walked on the free seed (`j3-*`) and again on a Plus seed (`j3plus-*`) because the free day had nothing to move.
4. A week: the Week tab, moving across days, the report, the level card after the first logged session.
5. Every coach's hub, free and Plus: what is locked, what it says, whether the card's promise matches the program.
6. The library: find Morning light, read the grade, add it, find it on the plan, remove it, see it gone.
7. The workout: start, swap the session, swap an exercise, log a set, edit it, rest timer, finish, the baseline on the hub afterwards.
8. The urge: from Today at 9pm, two taps to the breath reset, free with Plus off.
9. Meals: preferences with an allergy, the week's dinners, the shopping list, the allergen gate.
10. Money: the intake, the steps, the weekly check-in, the automation nudge.
11. Settings: backup, restore on a clean state, notifications, delete everything, the privacy line.
12. The paywall: from the card, from a locked session, restore purchases, and a month in without paying.

Each persona's walk is driven by Playwright against the web export, with every
screen captured as a screenshot and as text. The walker's notes are tallied by
`aggregate.py`; the counts in the findings come from that tally.

### The cold open, measured

| Measure | Result |
|---|---|
| Welcome to first paint | 3.5 to 3.6 s for every persona (web export) |
| Welcome to first Today, scripted | 28.7 to 31.4 s wall clock, 21 to 26 taps |
| Words on the welcome | 54 |
| Words on the example day | 221 |
| Words across the twelve questions, including the reveal lines | 503 (tom) to 560 (nkechi); the heaviest single screen is question 10 at 84 words |
| Words on the plan review | 173 |
| Words on the first Today | 124 |
| Words to the first Today, skipping the example day | about 875 |
| Terms a reader would look up on the way in | "Zone 2" (plan review, `Easy cardio (Zone 2)`), "prescribes" (question 11), and `17:30` and `06:30` in the reveals after the options said "9 – 5:30" |

The scripted time is a floor; a person reading will take longer. Taps and
words are the stable measures. A retiree is asked eleven questions, everyone
else twelve, as `docs/MARKETS.md` says. Nobody met a question they could not
answer.

## Findings, ranked by how many of the nine hit them

Ranked by persona count first, then severity. Severity is section 5 of the
brief. "Fixed" names the commit on the branch; "open" gives the proposed fix
and the file. Each finding names the row in the walker's report it comes from.

### 1. A wrong load after an exercise swap

- Personas: 9 of 9. Severity P0 (a wrong load).
- Journey 7, step "swap an exercise, log a set", Plus seed.
- Expected: a swapped-in front squat has no numbers. The screen itself says "swapped in for Squat — go by effort until it has its own numbers".
- Actual: the kg field was prefilled with 160, the back squat's programmed load, and one tap logged "160 kg × 6" against Front squat.
- Screenshots: `j7-dan-05-before-log.png`, `j7-isaac-06-after-log.png` (dark), `j7-priya-03-session-swapped.png`.
- Cause: `SetLogger` seeded its draft weight once on mount and was keyed by the programmed name, so a swap kept the squat's instance.
- Status: fixed in `d7727f0`. `src/app/session/workout.tsx` keys the logger by the lift on screen (`key={e.name}`), so a swap remounts it with the new movement's own numbers, which are none.

### 2. Restoring a backup on a clean phone was impossible

- Personas: 9 of 9. Severity P1 (a journey that cannot be completed).
- Journey 11, step "restore on a clean state".
- Expected: after "Delete everything", or on a new phone, a place to paste the backup.
- Actual: `/settings` rendered a blank screen before the interview (`if (!profile) return <Screen />`) and the welcome had no restore. The only way in was to answer twelve questions and then replace them. The backup copy on Settings says "restore it on the other side", which was not true.
- Screenshots: `j11-dan-07-settings-clean.png` (blank), `j11-dan-06-after-delete.png` (welcome after delete), `j11-priya-01-settings.png` (the promise).
- Status: fixed. `src/app/settings.tsx` renders a restore-only screen when there is no profile (landed in `019ec89`, which swept the file in while this review ran); `src/app/welcome.tsx` gains a ghost "Restore a backup" button (`d7727f0`).

### 3. "Tap a row to start it" on a Today with nothing to tap

- Personas: 9 of 9. Severity P2.
- Journeys 1 and 2, the first and second Today on the free tier.
- Expected: the one non-obvious interaction is explained once, when there is a row to try it on.
- Actual: the hint sat above "NOW · An open day · Add something" and a list of locked sessions. Nothing on the screen was a row. Because the hint keyed on "never completed anything", a free user saw it forever.
- Screenshots: `j2-priya-01-today-morning.png`, `j1-judith-17-today.png` (SE), `j1-isaac-17-today.png` (dark).
- Status: fixed in `d7727f0`. `src/app/(tabs)/today.tsx` shows the hint only when there is a Now, Earlier, Next or Tonight row.

### 4. The library promises automatic scheduling the free tier does not do

- Personas: 9 of 9. Severity P2.
- Journey 6, steps "add it, find it on the plan".
- Expected: add Morning light, see it on the week.
- Actual: the practice persisted (checked in `localStorage`) but no day on the Week tab showed it, not even as a locked row, while the caption read "On your plan — pause it · IntentNorth schedules this into your week automatically." The hub footer under a "Runs with Plus" card said the same.
- Screenshots: `j6-priya-03-after-add.png`, `j6-priya-04-week-after-add.png` (Week tab: Work, Work, nothing else), `j5-priya-free-training.png`.
- Status: copy fixed in `d7727f0`. `src/app/library.tsx` now says "On your plan. Plus places it into your days; until then it is listed on its coach's hub."; `src/app/path/[id].tsx` says "With Plus these go into your real days automatically" when not on Plus.
- Open: show an added practice as a locked row on the Week tab the way Today does, so "find it on the plan" is possible without paying. `src/app/(tabs)/plan.tsx`, reusing the `src/features/plus/LockedSessions.tsx` logic.

### 5. At 9pm the breath reset is a scroll away, not two taps

- Personas: 9 of 9. Severity P2.
- Journey 8.
- Expected: two taps from Today at 9pm to the breath reset.
- Actual: scroll, tap Breathe, tap a pattern. On the SE, Breathe was two screens down, under the Plus card, the suggestion, Now, three locked sessions and Tonight. The tools themselves were free: no Plus mark anywhere on the breathing screen, so the always-free rule held.
- Screenshots: `j8-judith-01-today-9pm.png` (SE), `j8-priya-01-today-9pm.png`, `j8-priya-02-breathe.png`.
- Status: fixed in `d7727f0`. `src/app/(tabs)/today.tsx` puts an "Any time" row with Breathe, Journal and Meditate directly under Now after 8pm; Plan meals and Train stay in the later row.
- Open: "Urge? Breathe" on the Coaches tab only appears once something is chosen under "Working on", and nine of nine had nothing there (`j8-priya-04-coaches-9pm.png`). Show the shortcut in that empty state too: `src/app/(tabs)/life.tsx`.

### 6. Day one carries a primary "Run my day with Plus"

- Personas: 9 of 9. Severity P2. Open, product decision.
- Journey 1, the first Today.
- Expected (brief, section 1): the offer is a dismissable card from the second day; on the first, the day itself is the pitch.
- Actual: the card does wait, but `LockedSessions` renders "YOUR COACHES BUILT 1 SESSION FOR TODAY · Wind down, screens away · Plus" and a full-width green "Run my day with Plus", the most prominent control on the first Today for all nine. Round two's `paywall_too_early` will read this as the paywall.
- Screenshots: `j1-priya-17-today.png`, `j1-isaac-17-today.png`, `j1-graham-17-today.png`.
- Proposed fix: on the first day list the locked sessions without the button (a tap on a card still opens `/upgrade`), or hold the whole block to day two like the card. A `firstDay` prop on `src/features/plus/LockedSessions.tsx`. Note that the first-day gate in `today.tsx` now reads the local day (`964694f`), so the gate itself is correct for an evening sign-up in Sydney; this finding is about what sits inside it.

### 7. The free day has no rows, so the bad day cannot be walked

- Personas: 9 of 9. Severity P2. Open, product decision.
- Journey 3, all six steps, free tier.
- Expected: "the day's shape" is free. Priya, Graham, Mel and Judith said walking is already part of their life and were told at question 11 "Then those stay yours. They go in as things you already do."
- Actual: "The daily walk" is a locked Plus session for all four. The free day is Work and "Bed by 10:30pm". Nothing to move, nothing that already happened, nothing to skip; the walker logged `NO_MOVE`, `NO_HAPPENED` and `NO_SLEEP` for every persona.
- Screenshots: `j3-priya-01-today.png`, `j4-priya-01-week.png` ("2 planned" is two Work blocks), `j1-priya-q11.png`.
- The mechanics work on the Plus seed: `j3plus-priya-05-move-picker.png` ("Move to… Next free window (7:30am) · This afternoon (4:30pm) · Tomorrow · Choose time · It already happened…"), `j3plus-priya-09b-skip-options.png` ("Can't make it? Move to tomorrow · Find another time · Skip this week"), `j3plus-priya-10-after-skip.png` (the skipped item is gone and "4pm Weekly meal sketch" moved in). Row actions read "Start · Done · Move · Skip".
- Proposed fix: an `established` routine (something the person already does) is part of the day's shape and should be placed free. `isAlwaysFreeRoutine` in `src/features/plus/entitlement.ts`. Isaac's call, since it changes what the free tier holds.

### 8. No shopping list

- Personas: 9 of 9. Severity P2. Open.
- Journey 9, step "the shopping list".
- Expected: a list to shop from after "Lock in the week".
- Actual: none anywhere in the flow; "Saved — on your Today screen ✓" is the end. The allergen gate held: with Peanuts declared, no nut appeared in any of nine weeks, and the gate ("Anything you can't eat? … Set allergies and preferences / Nothing to avoid") is clear and asked once.
- Screenshots: `j9-dan-04-meals-week.png`, `j9-dan-05-locked-in.png`.
- Proposed fix: a per-dish ingredient list in `src/features/nutrition` and a "Shopping list" section under the week in `src/app/session/meals.tsx`.

### 9. The money hub shows two different step lists and a question after the program is built

- Personas: 9 of 9. Severity P2. Open.
- Journey 10.
- Expected: one list of steps, and the intake finished once it is finished.
- Actual: "YOUR STEPS, IN ORDER" (six, with "✓ Kill the expensive debt" already ticked for someone who has logged nothing) and "STEPS · 0 OF 8" on the same screen; above both, "Money — want IntentNorth in the loop? … Last one — after this the coach has everything it needs" although the program was just built. The preview puts "Pay-rise rule" and "Set up one automatic transfer" both at 7pm Sunday. The weekly check-in ("Money check-in S · around 7:30pm · 30 min") and the automation nudge ("→ Automate one transfer on payday · This is the step") are present and clear.
- Screenshots: `j10-priya-02-money-hub.png`, `j10-priya-03-after-rate.png`.
- Proposed fix: one steps list (`src/features/money/MoneyHub.tsx` against `src/features/paths`), no tick without a log, and drop the deferred question once the intake is complete.

### 10. The ambition becomes a session titled with the ambition

- Personas: 9 of 9. Severity P2. Open.
- Journey 1, plan review and first Today.
- Expected: a block a stranger can read as a thing to do at a time.
- Actual: "Lose 8 kg without a diet · M W F · around 12:05pm" on the plan review and "Lose 8 kg without a diet · Plus · around 12:05pm · 45 min" on Today; "Feel like myself again · T S · around 12:05pm" for Tom; "Stop working until midnight · Health" for Dan, filed under the wrong area; Isaac's is cut inside the title, "Growth block: Grow the business without m…".
- Screenshots: `j1-priya-15-plan-review.png`, `j2-priya-01-today-morning.png`, `j1-tom-15-plan-review.png`, `j1-dan-15-plan-review.png`, `j1-isaac-15-plan-review.png`.
- Proposed fix: title the block "Time on: <ambition>" or "Growth block" with the ambition as the caption, and infer the area from the words (Dan's is Work, Nkechi's "Sleep properly on nights" is Health). `src/features/onboarding/buildPlan.ts` and `src/features/goals/goalPlanner.ts`.

### 11. Priority cards break words in half

- Personas: 9 of 9 at 390 px, worse on the SE. Severity P3.
- Journey 1, plan review.
- Expected: "Relationship" and "Life admin" on one line each.
- Actual: "Relations / hip" and "Life / admin" in a three-across grid.
- Screenshots: `j1-priya-15-plan-review-full.png`, `j1-judith-15-plan-review.png`.
- Status: fixed in `d7727f0`. `src/app/plan-review.tsx` lays priorities out as three rows (number, name).

### 12. 24-hour times among 12-hour ones

- Personas: 9 of 9. Severity P3.
- Journey 1 (questions 7 and 8) and journey 3 on the Plus seed.
- Expected: one clock. The options say "9 – 5:30"; the rest of the app says "5pm".
- Actual: "Then your own time starts at 17:30" and "Up at 06:30, down at 22:30" in the interview reveals; "18:45 — ahead of it" beside "5pm" on the move picker.
- Screenshots: `j1-priya-q07.png`, `j1-priya-q08.png`, `j3plus-priya-05-move-picker.png`.
- Status: fixed on Today in `d7727f0` (`src/app/(tabs)/today.tsx` formats the "ahead of it" time with the app's `formatTime`). Open in the interview: the `workHours` and `sleep` reveals in `src/features/onboarding/script.ts` should go through `formatTime`.

### 13. Glossary words still on screen

- Personas: 9 of 9. Severity P3.
- Every journey. One fixed ("Protocols" in Settings, now "Practices", `019ec89`), one fixed by the QA workstream ("Full prescribed volume" on the level card, `ef4de29`), the rest open. The full list with file and replacement is in the glossary section below.
- Screenshots: `j12-dan-03-upgrade.png`, `j3plus-dan-04-row-actions.png`, `j3plus-dan-01-today.png`, `j1-priya-q11.png`, `j5-priya-plus-training.png`, `j1-priya-15-plan-review.png`, `j12-dan-07-library-month-in.txt`.

### 14. Two "Not now" buttons on one screen, and "Make the change" answering a question

- Personas: 9 of 9 on day two. Severity P3. Open.
- Journey 2, the second Today.
- Expected: one dismiss per screen, and a button that answers the question above it.
- Actual: the Plus card's "Not now" and, four lines later, "Saturday morning is wide open — a morning to yourself? … Make the change / Not now".
- Screenshot: `j2-priya-01-today-morning.png`.
- Proposed fix: `src/components/suggestion-card.tsx`, "Yes, put it in" / "Leave it". Suggestions are always questions.

### 15. "Train" on the free tier hands a sore back a deadlift

- Personas: 3 of 9, the three who declared a constraint (priya, graham, judith). The stock session was the same for all nine; for the other six it was not wrong. Severity P1 (a wrong load for a declared constraint).
- Journey 3, any tap on Today's "Train" chip before a block exists.
- Expected: the plan review said "Loaded, jarring movements are swapped for kinder versions of the same pattern"; Graham's added "balance work goes first in a session".
- Actual: "STRENGTH · Deadlift 3–6 · Overhead press · Lat pulldown…" with no swap and no balance slot.
- Screenshots: `j3-graham-02-workout.png` (68, balance and back), `j3-priya-02-workout.png` (sore joints), `j1-priya-15-plan-review.png` (the promise).
- Status: fixed in `d7727f0`. `src/app/session/workout.tsx` runs the stock session through `applyConstraints` from `src/features/training/constraints.ts`, the same rules the block uses: hinge to a box, floor press, landmine press, chest-supported row, and a balance slot first for `balance`.

### 16. "Money & security" came back as "Life admin"

- Personas: 2 of 9 (nkechi, judith). Severity P2.
- Journey 1, plan review priorities.
- Expected: the label the person chose in the interview.
- Actual: "Life admin".
- Screenshots: `j1-judith-15-plan-review.png`, `j1-nkechi-15-plan-review.png`.
- Status: fixed in `d7727f0`. `src/app/plan-review.tsx` `AREA_LABELS.admin` matches the interview's option.

### 17. On an iPhone SE, day two opens on nothing but the Plus card

- Personas: 1 of 9 (judith); applies to every small phone. Severity P2. Open.
- Journey 2, the second Today.
- Expected: the day above the fold.
- Actual: the card's 52-word body plus two buttons fill 320 by 568 to the tab bar; the day starts below the fold.
- Screenshot: `j2-judith-01-today-morning.png`.
- Proposed fix: `src/features/plus/PlusNudge.tsx`, one line of body ("Plus places the sessions into your days and moves them when the day changes."); the free list already lives on the paywall.

### 18. Market departures from the plan review

- Personas: one each (graham, mel, nkechi, tom, and the daily walk for priya, mel, graham, judith). Severity P2. Open.
- Journey 1, plan review. Detailed one per market in the next section, with what each market needs.

### 19. Smaller things seen once each

Severity P3. Open unless marked.

| What | Screenshot | Where | Status |
|---|---|---|---|
| The morning intention landed under "TONIGHT" as a bare sentence ("One thing at a time today. / Bed by 10:30pm.") | `j2-priya-03-after-morning.png` | `src/app/(tabs)/today.tsx` | Fixed in `d7727f0`, labelled "Your intention for today" |
| Progress shows the "Saturday morning is wide open" suggestion on day one while Today deliberately hides it | `j1-priya-20-progress.png` | `src/app/(tabs)/data.tsx`, apply the same `firstDay` rule | Open |
| Coaches tab: "1 more question and this coach has everything it needs" under a question that belongs to no coach | `j1-priya-19-coaches.png` | `src/features/onboarding/DeferredQuestions.tsx` | Open |
| Family hub (Plus) lists "One outing that actually happened" twice, and "One-on-one time with each of them" beside "One-on-one time with each child" | `j5-priya-plus-family.png` | `src/features/paths` | Open |
| Week tab on the free tier: "2 planned" means two Work blocks; "0 planned · Nothing planned. A rest day is a plan too." on a Sunday that has a locked wind-down | `j1-priya-18-week.png` | `src/app/(tabs)/plan.tsx`, count only non-fixed items | Open |
| The library header states how many practices are open as a number, against rule 9 of the brief (the grading is the point) | `j6-priya-01-library-top.png` | `src/app/library.tsx` | Open, a wording decision for Isaac |

### Two follow-ups in the same files

`964694f` touched `src/app/(tabs)/today.tsx` and `src/app/session/workout.tsx`
after the screen fixes: the first-day gate on Today and the sleep pre-fill on
the workout sliced ISO timestamps as UTC days and now read the local day, and
an item ending at midnight is measured by length so it can be "now". Neither
was a persona finding; both change screens the personas walked, and the
captures for journeys 1, 2 and 7 were re-checked afterwards.

## Market departures

One per market row, with what that market needs. All from journey 1's plan
review; all open, in `src/features/onboarding/buildPlan.ts` and
`src/features/onboarding/script.ts`.

| Market | Persona | What the plan review did | Screenshot | What the market needs |
|---|---|---|---|---|
| Employed professional | priya | The closest to the promise: wind down, daily walk, the ambition block, easy cardio, around fixed hours. "The daily walk" runs "M T W T F S", not daily, and "Easy cardio (Zone 2)" needs the glossary. | `j1-priya-15-plan-review.png` | The plan owns the edges of the day. A walk called daily should be daily; a title should not need a lookup. |
| Operator | dan | "Stop working until midnight" filed under Health with "2 steps mapped"; "Wind down, screens away" at 10:40pm, after the hour he is trying to stop at. | `j1-dan-15-plan-review.png` | Hours are his and work expands to fill them, so the rest of life needs a claim on the day first: a shutdown anchor before the wind-down, and the ambition read as Work. |
| Shift worker | nkechi | "Strength workout M W · around 12:05pm" and "Wind down S M · around 10:40pm". Wednesday noon is her sleep after a Tuesday night; 10:40pm is mid-shift. | `j1-nkechi-15-plan-review.png` | The week does not repeat. The plan should follow the roster and say so. This is known item 2 in the brief (a roster, not work days and hours); the evidence is here. |
| Student, early career | liam | Holds: four strength days, easy cardio, the degree block. "Wind down, screens away" at 11:40pm reads as late for a night owl but is consistent with his sleep answer. | `j1-liam-15-plan-review.png` | Timetabled blocks and a lot of unstructured time. No departure of note. |
| Carer | mel | Question 6 asks "Roughly which hours are you on?" with "7 – 3 · 8 – 4 · 9 – 5:30 · 9:30 – 6:30 · I set my own hours · Later start", office hours for a mother at home with three under five; then "Strength workout M · around 6:15am". | `j1-mel-q06.png`, `j1-mel-15-plan-review.png` | Her hours are real work and are blocked as such; what she lacks is control over when interruptions land. The `workHours` options for `caring` should be "All day", "School hours", "Mornings", "Evenings", and the plan should lean flexible rather than fix a 6:15am session. |
| Retiree | graham | Said walking counts and so does the garden; got "Strength workout M W F · around 6:15am" and a goal "Train 3× a week". "Volunteering T · 9:30am" and "Time with family T · 10am" overlap. | `j1-graham-15-plan-review.png` | Too little shape, not too little time. Build the week from what he already has in it, keep fixed things from overlapping, and let walking be the training he said it was. |
| Rebuilder | tom | The reveal promised "keeps daylight, movement and sleep in it every day". The plan is "Wind down S M" and the ambition block. No morning light, no movement. | `j1-tom-15-plan-review.png` | The `mentalHealth` constraint should add morning light and a walk as established-style routines, so the promise on the reveal is kept on the review. |

Two personas outside the market rows: Isaac's plan review holds (four strength
days, sauna, a growth block) apart from the truncated title in finding 10
(`j1-isaac-15-plan-review.png`). Judith's holds apart from "Life admin"
(finding 16) and "The daily walk" on six days (`j1-judith-15-plan-review.png`).

## Glossary words still on screen

From the tally over every captured screen. "Fixed" names the commit.

| Word on screen | Where seen | File | Replacement | Status |
|---|---|---|---|---|
| "Protocols from the public work of…" | Settings | `src/app/settings.tsx` | "Practices from the public work of…" | Fixed, `019ec89` |
| "Full prescribed volume and intensity" | Plus training hub level card, `j5-priya-plus-training.png` | `src/features/paths/level.ts` | "Full volume and intensity" | Fixed, `ef4de29` |
| "Guided sits beyond the reset" | Paywall, every persona, `j12-*-03-upgrade.png` | `src/features/plus/entitlement.ts` line 181 | "Guided meditations beyond the reset" | Open |
| "next rung: …" in every row's guidance line | Plus Today row actions, `j3plus-dan-04-row-actions.png` | `src/features/today/item-guidance-view.tsx` line 58; also `src/features/goals/composer.ts` line 425 ("No reading yet for the next rung.") | "next step" | Open |
| "…and that is the order you set" | Plus Today, every persona, `j3plus-dan-01-today.png` | `src/features/planner/displaced.ts` lines 171, 173, 191 | "because you put health first" (the area named) | Open |
| "never prescribes it back to you" | Question 11, eight of nine (the retiree is not asked it), `j1-priya-q11.png` | `src/features/onboarding/script.ts` line 627 | "never hands it back to you as if it were new" | Open |
| "AGAINST THE POPULATION TABLES" | Plus training hub, every persona, `j5-priya-plus-training.png` | `src/features/training/TrainingHub.tsx` lines 112 and 127 | "Compared with other lifters" | Open |
| "Easy cardio (Zone 2)" as a routine title | Plan review and Today for priya and liam, `j1-priya-15-plan-review.png` | `src/features/knowledge/protocols.ts` line 229 | "Easy cardio — a pace you can talk at". Note `src/features/copy/__tests__/jargon.test.ts` line 20 currently asks for the "(Zone 2)" form, so the test's advice changes with it. | Open |
| "skip this protocol entirely" in a practice's safety line | Library, `j12-dan-07-library-month-in.txt` | `src/features/knowledge/protocols.ts` line 409 | "skip this practice entirely" | Open |
| `17:30`, `06:30`, `22:30` in the interview reveals | Questions 7 and 8, every persona, `j1-priya-q07.png`, `j1-priya-q08.png` | `src/features/onboarding/script.ts`, the `workHours` and `sleep` reveals | Through `formatTime`, "5:30pm", "6:30am" | Open |

## What held

- Dark mode: contrast holds on every screen Isaac walked (`j1-isaac-01-welcome.png`, `j1-isaac-17-today.png`, `j7-isaac-06-after-log.png`).
- Small screen: no clipped text and no horizontal scroll on fourteen key routes, free and Plus, at 320 by 568 (`overflow.js`). The interview chips, plan review, paywall and workout all wrap cleanly (`j1-judith-01-welcome.png`, `j12-judith-03-upgrade.png`).
- Labels: every chip and button is a labelled `button` role with `aria-selected` or `aria-disabled`. Plan rows announce "<title>, <time>. Press and hold to move it."; exercise cards announce "<lift>, n of m sets recorded"; sets have "Edit set 1".
- Paywall copy: reads in five seconds on the SE (`j12-judith-03-upgrade.png`): price, period, what renews, one "Not now". "Free, always" is listed in five lines. "Restore purchases" answers "No Plus purchase found on this Apple ID." (`j12-dan-04-after-restore.png`). "Habits & urges · Always free — we never charge for someone's hardest moment" is on Coaches, and the breathing screen carries no Plus mark (`j8-priya-02-breathe.png`).
- A month without paying (`j12-priya-05-today-month-in.png`, `j12-priya-06-coaches-month-in.png`, `j12-priya-07-library-month-in.png`): Today, Coaches and the library look exactly as they did on day two: the card, the shape of the day, the open practices in every area. Nothing degrades.
- The workout: session swap, exercise swap with "Back to Squat", "Log set", "Edit set 1", "Rest · 119s", "Finish here — it counts", and the level card afterwards ("Established · 12 / 48 sessions · 36 more sessions and 13 more weeks to reach Advanced") all present (`j7-dan-02-workout.png` through `j7-dan-10-hub-after.png`).
- Backup: "Save a backup", "Restore", and "Delete everything" with a "Keep my data" confirm, then welcome (`j11-dan-05-delete-confirm.png`, `j11-dan-06-after-delete.png`). The privacy line is in Settings ("Everything lives on this device only…") and on welcome ("No account. Nothing you enter leaves your phone.").
- Meals: the allergen gate is asked once and held across nine weeks with Peanuts declared (`j9-dan-04-meals-week.png`).
- The bad day on Plus: move, "It already happened…", skip with "Move to tomorrow · Find another time · Skip this week", and tomorrow re-laid (`j3plus-priya-05-move-picker.png`, `j3plus-priya-10-after-skip.png`).

## Round three

A hundred fresh personas, none used in round two, on the pack built from
the fixed export (commit `964694f`, forty-two screens). Same brief, same
tags, so the three rounds compare. Full report:
`docs/review/round3-report.md`.

| | Round one (1,000) | Round two (100) | Round three (100) |
|---|---|---|---|
| Understood what it is | 96% | 99% | 99% |
| Would pay: yes | 40% | 42% | 37% |
| Mean severity (5 worst) | 2.52 | 2.37 | 2.34 |
| Paywall too early | 30% | 44% | 13% |
| Free tier unclear | 14% | 23% | 18% |
| Health condition ignored | 31% | 4% | 7% |
| Interview too long | 20% | 9% | 11% |
| Jargon | 24% | 20% | 32% |
| Copy too long | 12% | 11% | 20% |
| Interview missing option | 8% | 5% | 13% |
| Would recommend | 38% | 47% | 45% |
| Reasons helpful | 31% | 54% | 45% |
| Privacy trust good | 22% | 48% | 50% |
| Evidence grades helpful | 12% | 10% | 17% |

**What the numbers say.** Holding the Plus card to the second day did
what it was meant to: the paywall complaint fell by two thirds and is now
below round one. Understanding, trust and the reasons on every line held.
Would-pay dipped within the noise of a hundred-person sample (thirty-seven
against forty-two), with the same three markets driving it as before:
students, carers and retirees on price.

**What rose, and what was done about it.** Jargon rose to a third, and
the list was short and specific: "Zone 2" (34 mentions), HRV (29), VO₂ max
(14), "the aerobic base" (13). The two practice titles now read "Easy
cardio, talking pace" and "Hard intervals", with the technical name in the
summary where a person who wants it can find it; "the aerobic base" is
"the easy, steady work" everywhere; the guard bans all three from titles.
Copy too long doubled, concentrated on the plan review's reveals and the
evidence-grade sentence; that is the next copy pass and is listed under
open items. Interview missing option rose to thirteen, almost all from
shift workers (a roster) and carers (work-day questions that assume a
job), which are the two market departures already recorded above.

**Where people stopped.** Eighty-three did not stop. Five stopped on the
Coaches tab on the free tier, three on a coach hub, two on a plan review
that showed a training example to someone who came for money or drinking.
Nobody stopped on the paywall.
