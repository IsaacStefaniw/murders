# Competitive review, second sweep

Written 2026-09-06 on `claude/rename-murders-folder-goh5q0` for Workstream A of
`docs/REVIEW_BRIEF.md`. It extends `docs/COMPETITIVE_REVIEW.md` (2026-09-04),
checks what in it has become false, and reads IntentNorth from the code, not
from older documents.

How the evidence was gathered. Every competitor claim below carries a source
URL in section 8 or is marked **unverified**. The review container could reach
web search but not the pages themselves (the egress proxy blocked
`apps.apple.com`, every vendor help centre and every vendor site), so no
screenshots were captured and no Australian App Store page could be read
directly. Prices are given in the currency the source showed; where an
Australian figure was found it is in A$, otherwise the US$ figure is given and
the A$ figure is marked unverified. Nothing here was invented to fill a gap.

What IntentNorth does, from the code as of this commit:

- Free forever, enforced in `src/features/plus/entitlement.ts`: the interview,
  the first insight, the day's shape, every urge, reset and lapse-recovery
  tool (`isAlwaysFreeRoutine`, `isAlwaysFreeProtocol`), breathing and sits up
  to two minutes (`FREE_MEDITATION_MAX_MIN`), the first five practices in each
  area of the library plus every urge tool (`splitLibrary`), backup and
  restore. Plus (A$14.99 a month, A$89.99 a year, A$249 once, per the brief;
  the paywall shows Apple's live price) runs the coaches: places the sessions
  and moves them. The offer is a dismissable card from day two
  (`src/features/plus/PlusNudge.tsx`); a locked session on Today opens the
  paywall on tap (`LockedSessions.tsx`).
- The library (`src/features/knowledge/protocols.ts`) grades every practice
  A to E for the strength of the evidence, names who popularised it, gives a
  one-line why, and carries a plain-words safety line on the health
  practices. Most of the library sits at B and C; a small A tier rests on
  meta-analyses; a handful of E practices are labelled as heuristics to test
  on yourself. The life-transition practices are marked `neverNag`: no
  streak, no score, no missed-it message, ever.
- The scheduler (`src/lib/scheduling/engine.ts`, `src/features/planner/`)
  is deterministic: free windows around fixed blocks, buffers, a reserved
  free fraction, priority tiers, the person's ranked life areas deciding
  ties, bedtime and protocol bounds, deadlines that may move earlier but
  never later. It reports what it moved and what it could not place, and
  Today says so in a sentence (`displaced.ts`: name the winner, never
  apologise for a full day).
- Training (`src/features/training/`): a four-week block from real
  availability, loads from a weighted twelve-week baseline
  (`baseline.ts`), session and exercise swaps that keep the movement
  pattern (`swap.ts`), a rest timer in the session, and auto-regulation
  (`autoRegulate`) that keeps the main work and drops accessories on a
  night under six hours or when the person's own HRV or resting heart rate
  is down against their own fourteen-day median (`health/readiness.ts`).
- Sleep debt and an energy shape now exist (`src/features/health/sleepDebt.ts`)
  and show on the readiness card; the energy shape is not yet used by the
  scheduler for placement.
- The morning check-in carries yesterday's unfinished items into today with
  one tap ("Left from yesterday", `src/app/check-in/morning.tsx`).
- Seven coaches (`src/features/paths/definitions.ts`): Training, Nutrition
  (protein anchor, plate shape, no logging), Money (an ordered ladder:
  automate, one month of buffer, expensive debt, three months, invest,
  raise the rate), Work, Habits and urges (trigger, replacement, a timed
  intervention before the usual window), Relationship, Family. Each has a
  four-rung level ladder where the top rung is earned from logs, never
  claimed on a form (`paths/level.ts`).
- No account, no server, nothing leaves the phone (`docs/PRIVACY.md`).

## 1. The matrix

Eight categories against twelve dimensions, with IntentNorth in the last
column. Cells are short on purpose; the per-app detail is in section 2.

| Dimension | Whole-day planners | Training | Recovery and readiness | Habits and urges | Mind | Food without logging | Money (Australia) | Family | IntentNorth |
|---|---|---|---|---|---|---|---|---|---|
| Five-second test | "Plan today from your tools" (Sunsama, Motion) or "block your day" (Structured) | "Log sets" (Hevy, Strong) or "we pick the workout" (Fitbod, JuggernautAI) | "Are you recovered" as a number or colour | "Build a routine" (Fabulous), "keep the chain" (Streaks), "grow a bird" (Finch), "days sober" (I Am Sober) | "Meditate, start here" | "Track and we adapt" (MacroFactor), "lessons plus a calorie budget" (Noom) | "See all your accounts" (Frollo, WeMoney), "your bank" (Up), "invest the change" (Raiz) | "One calendar for the house" | "The day is already decided, and here is why" |
| Time to first value | 14-day trial, first plan in one sitting; Motion and Reclaim need a calendar connected first | First logged set in minutes; Fitbod needs 10 to 15 workouts to personalise | Days: a baseline needs nights of wearable data | Minutes, with a first habit that is deliberately tiny | First session on day one, free | 15 to 20 minute quiz (Noom); 2 to 3 weeks for MacroFactor's expenditure to settle | Minutes after a bank link (Frollo, WeMoney); Up requires opening an account | Minutes after inviting the household | Twelve questions, then the first insight and Today, same sitting |
| Day two | The planning ritual, then rollover of what was unfinished (Sunsama); auto-rescheduled tasks (Motion, Reclaim); Replan is Pro (Structured) | Next routine in the rotation; Fitbod shows muscle recovery percentages | Recovery score in the morning and a strain or exertion target (Whoop, Athlytic) or a suggested activity (Gentler Streak) | Streak count, a new letter or lesson, the pet's mood | Session two of a course; Balance asks questions and assembles the next sit | Next lesson; MacroFactor waits for data | Categorised transactions; a credit score (WeMoney) | The shared week | The Plus card appears, the morning check-in offers yesterday's leftovers, readiness reads last night |
| Bad day (short night, meeting on the walk, skipped session) | Meeting lands: Motion and Reclaim move the task or habit to the next fit; Sunsama asks at shutdown; Structured asks via Replan. None read sleep | Skip: Fitbod recomputes muscle recovery from logged sets and days elapsed only; JuggernautAI takes a readiness rating and adjusts; Hevy and Strong log what you did | Short night: Whoop lowers the strain target; Rise recalculates the energy dips; Gentler Streak suggests rest via Go Gentler | Missed day: Streaks resets to zero; I Am Sober asks how many times and resets the date; Fabulous and Finch do not punish | Nothing changes; the next session is the next session | Nothing changes for a short night | Nothing | Nothing | Short night or low own-baseline HRV: main lifts stay, accessories rest, and the reason is written on the session. Meeting on the walk: the walk moves and Today says what won. Skip: asked once, never scored, and the level never drops silently |
| What is free | Sunsama and Motion: trial only. Reclaim: real free tier, one habit, one week ahead. Structured: most of the planner | Hevy: unlimited logging, four routines. Strong: three routines. Fitbod, JuggernautAI: trial only | Whoop: hardware plus membership, nothing free. Rise: trial. Athlytic: recovery score free, target exertion paid. Gentler Streak: tracking and widgets free | Fabulous: limited. Streaks: paid up front, US$5.99. Finch: the self-care tools. I Am Sober: counter and pledge. Reframe: trial only | Headspace: ten Basics sessions and some breathing. Calm: Daily Calm and day one of each course. Balance: everything, for a year. Waking Up: intro plus a no-questions scholarship | MacroFactor and Noom: trial only | Frollo: everything, no paid tier. WeMoney: most of it. Up: the bank account. Raiz: fee from the first dollar | Cozi: 30 days ahead. TimeTree: everything with ads. Skylight: hardware, then Plus | The interview, the day's shape, every urge and reset tool, breathing, two-minute practices, five practices per area, the full view of every program, backup |
| Paywall: when and how much | End of trial. Sunsama US$22 a month or US$204 a year; Motion US$19 a month annual (US$29 or US$49 monthly by source); Reclaim Starter US$10 a month; Structured Pro US$19.99 a year, US$64.99 once | Hevy Pro US$2.99 a month, US$23.99 a year, US$74.99 once; Strong Pro US$29.99 a year; Fitbod US$15.99 a month or US$95.99 a year after a 7-day trial with card; JuggernautAI US$34.99 a month or US$349.99 a year after 14 days | Whoop One A$299, Peak A$419, Life A$629 a year (or A$99 to 139 device plus A$300 a year after May 2026); Rise US$69.99 a year after 7 days; Athlytic Pro about US$2.99 a month or US$24.99 a year; Gentler Streak US$8.99 a month or US$39.99 a year | Fabulous US$39.99 a year after a 7-day trial shown after the quiz; Finch Plus US$9.99 a month or US$69.99 a year, cosmetic; I Am Sober Plus US$9.99 a month or US$39.99 a year (backups and groups behind it); Reframe US$99.99 a year after 7 days | Headspace US$12.99 a month or US$69.99 a year; Calm US$69.99 a year; Balance US$69.99 a year after the free year; Waking Up US$99.99 a year after 30 days, scholarship on request | MacroFactor US$11.99 a month or US$71.99 a year, card up front; Noom about US$209 a year or US$70 monthly, card up front | Frollo free; WeMoney Pro A$9.99 a month or A$98.99 a year; Up free account; Raiz A$2.50 to A$6.50 a month by plan | Cozi Gold US$39 a year; TimeTree Premium US$4.49 a month or US$44.99 a year; Skylight Plus A$124.99 a year | A card on day two, dismissable; locked sessions on Today open the paywall on tap. A$14.99 a month, A$89.99 a year, A$249 once |
| Reads the calendar | Yes, all four (Structured: Pro) | No | No | No | No | No | No | Yes, the shared one | Not yet: `src/lib/calendar/provider.ts` returns nothing; work hours are modelled |
| Reads the body | No | Fitbod: activity and Watch heart rate, not sleep or HRV; JuggernautAI: a typed readiness rating | Yes: sleep, HRV, resting heart rate; Whoop needs its band | No | No | MacroFactor: weight trend | No | No | Sleep hours, resting heart rate, HRV, weight, VO2 max from Apple Health, compared to the person's own median |
| Says why it did what it did | Motion and Reclaim reschedule silently by rule; Sunsama shows planned against actual | Fitbod shows muscle recovery; JuggernautAI shows the adjustment | Whoop, Athlytic and Gentler Streak explain the score | Streaks: a number | Balance: "based on your answers" | MacroFactor: weekly expenditure update | Frollo, WeMoney: categorisation | No | Every row has a reason line; the day has one sentence for what moved and which area won |
| Evidence grade shown | No | No | No | No | No | Noom cites psychology, ungraded | No | No | A to E on every practice, source named, where it stops |
| Account and data | Account and connected tools (all four) | Account (Hevy, Fitbod, JuggernautAI); Strong unverified | Account; Whoop band data to Whoop cloud | Account for most; Streaks is iCloud only | Account | Account | Bank link via Open Banking (Frollo, WeMoney); Up is a bank; Raiz an investment account | Account; Skylight is hardware plus account | None. No server. Backup is a file the person keeps |
| Widgets, Watch, Live Activity | Structured: widgets, Live Activities, Watch. Others unverified | Hevy: Live Activity rest timer, Watch. Strong: Watch with wrist rest timer. Fitbod, JuggernautAI: unverified | Whoop: own band; Athlytic and Gentler Streak: Watch native, widgets (Gentler Streak free) | Streaks: Watch, widgets. Others unverified | Unverified | Unverified | Unverified | Skylight is the widget | None yet; every one needs a native build (section 4) |

## 2. The apps, one at a time

Each entry answers the brief's questions in order: five-second test, time to
first value, day two, a bad day, what is free, the paywall, the one thing it
does better than IntentNorth, and the one thing IntentNorth does that it
cannot. Where the record could not be verified it says so.

### Whole-day planners

**Sunsama.** A daily planning ritual that pulls tasks from Jira, Linear,
Asana, Trello, Todoist, Google Calendar, Outlook and Slack into one day, with
time estimates and a guided shutdown at the end of the day. First value in
the first sitting during a 14-day trial with no card. Day two is the ritual
again, then rollover: unfinished tasks roll to tomorrow at midnight, or a
prompt asks which to roll. A bad day is handled at shutdown, by hand, and the
planned time against the actual time is what the shutdown is about. No free
tier. US$22 a month or US$17 a month billed as US$204 a year; a Power Pro
tier at US$50 a month annual. A$ unverified. Better than IntentNorth: planned
against actual time on every task, visualised on the calendar. IntentNorth
does what it cannot: place a gym session, a family dinner and a protein
anchor into the same evening and say which one won, from a profile rather
than a task list, with no account.

**Motion.** An AI calendar that auto-schedules tasks around meetings and
rebooks them when a meeting lands. First value after connecting a calendar
and adding tasks with deadlines; trial available. Day two: the schedule has
already moved. Bad day: a task displaced by a meeting is rebooked in the next
available slot without being asked, and a hard-deadline task can be pushed
outside working hours. No free tier. Pro AI US$19 a seat a month billed
yearly; US$29 monthly by one source, US$49 solo monthly by another. A$
unverified. Better: it reads the real calendar and reschedules within
seconds. IntentNorth does what it cannot: read last night's sleep and change
the session, and refuse to fill every minute (the reserved free fraction in
`engine.ts`).

**Reclaim.ai.** Habits with a rule ("lunch, weekdays, 11:30 to 2, ideally
12, 30 to 60 minutes") that the app places each day and moves to the next
best time inside the window when a meeting takes the slot. Real free tier:
one habit, one week of range, one calendar connection. Starter US$10 a user
a month billed annually. A$ unverified. Bad day: the habit moves inside its
window, and if nothing fits it is simply gone from that day; the source does
not say it tells you. Better: the habit rule with an ideal time and a range
is exactly the anchor and window model in `protocols.ts`, but it runs on the
real calendar. IntentNorth does what it cannot: name what lost the hour and
why, and hold a bedtime, a deadline that only moves earlier, and a person's
ranked areas.

**Structured.** A visual timeline planner with an inbox, sub-tasks, a
Pomodoro timer, Live Activities, widgets, Watch and Mac, most of it free.
Pro adds calendar and Reminders connection, recurring tasks, AI day drafting
and Replan (unfinished tasks reviewed in a prompt each morning or evening and
checked off, deleted, rescheduled or moved to the inbox). Pro US$19.99 a year
(one source says US$27.99) or US$64.99 once. A$ unverified. Better: the
timeline is beautiful and the widgets and Live Activities are free.
IntentNorth does what it cannot: build the day from a profile at all;
Structured plans what you type.

### Training

**Hevy.** A gym log. First set logged in minutes. Free forever with
unlimited logging, four routines, seven custom exercises and three months of
graphs. Pro US$2.99 a month, US$23.99 a year, US$74.99 once. A$ unverified.
A Live Activity shows the next exercise and the rest timer on the lock
screen, adjustable in 15-second steps, and routines sync to the Watch. Bad
day: it logs what you did; it does not change the plan. Better: the rest
timer on the lock screen and on the wrist. IntentNorth does what it cannot:
decide the session's content from a baseline, a night's sleep and the
minutes available, and say why (`autoRegulate`).

**Strong.** A gym log with a fully featured Watch app: tap to log a set, a
rest countdown on the wrist, a wrist notification when it is time. Free with
three routines; Pro US$29.99 a year or US$4.99 a month, lifetime available.
A$ unverified. Bad day: nothing changes. Better: three taps per set on the
wrist. IntentNorth does what it cannot: swap a session or an exercise and
keep the pattern, the sets and the rest, and drop the load rather than carry
a number that belonged to another lift (`swap.ts`).

**Fitbod.** Picks today's workout from muscle recovery, computed from the
sets logged and days elapsed, plus activity from Apple Health, Fitbit or
Strava and Watch heart rate. It does not read sleep, HRV or resting heart
rate. Trial: 7 days with a card, or three workouts by some sources; the
personalisation needs 10 to 15 workouts. US$15.99 a month or US$95.99 a
year; legacy subscribers pay US$12.99 and US$79.99. A$ unverified. Bad day:
a skipped session raises the muscle recovery percentages; a short night does
nothing. Better: the muscle-by-muscle recovery map and exercise variety.
IntentNorth does what it cannot: change today's session on a short night or
a low own-baseline HRV, and write the reason on the session.

**JuggernautAI.** A powerlifting coach with a daily readiness rating
(sleep, soreness, motivation) and per-set RPE feeding a rules engine that
adjusts load and volume, plus meet-day attempt selection. 14-day trial,
then US$34.99 a month or US$349.99 a year. A$ unverified. Bad day: the
readiness rating lowers the session. Better: the auto-regulation is deeper,
set by set. IntentNorth does what it cannot: read readiness from Apple
Health without typing, and it does everything JuggernautAI does not (the
rest of the week). JuggernautAI is also the price ceiling of the field: more
than three times IntentNorth Plus a year for one domain.

### Recovery and readiness

**Whoop.** A band with a recovery score, a strain score and a Strain Coach
that proposes a daily strain target: higher on green, lower on red, with a
haptic when the target is reached. Nothing free; the band and a membership.
Australia: One A$299, Peak A$419, Life A$629 a year by one source; a May
2026 change to a A$99 to 139 device plus about A$300 a year by another. Bad
day: red recovery, lower target, rest suggested. Better: continuous
heart-rate strain and the live target. IntentNorth does what it cannot:
turn the reading into a changed session, and place that session in a day
that also holds the school run. Whoop measures; IntentNorth decides.

**Rise.** Sleep debt against a personally estimated need and an energy
schedule with peaks, dips and a melatonin window, recalculated each
morning from how you slept. 7-day trial, US$69.99 a year, lifetime
available. A$ unverified. Bad day: the dips move and the debt grows.
Better: the energy schedule as a visual and the chronotype model.
IntentNorth now has sleep debt and an energy shape (`sleepDebt.ts`), but
the scheduler does not yet place deep work at the peak; that is section 3,
item 4. IntentNorth does what Rise cannot: change the training session and
the evening from the same night's data.

**Athlytic.** Apple Watch recovery from HRV and resting heart rate, with a
daily Target Exertion range. Free: the recovery score and basic summaries.
Pro about US$2.99 a month or US$24.99 a year unlocks the target exertion
and deeper sleep analytics. A$ unverified. Bad day: low recovery, low
target. Better: the exertion target from continuous heart rate. IntentNorth
does what it cannot: everything after the number.

**Gentler Streak.** A Watch fitness tracker that puts wellbeing first: Go
Gentler suggests the day's activity (including rest) from HRV, sleep and
recent activity, and Activity Status pauses the streak for illness, injury
or a break. Free: tracking, progress bar, widgets, the streak. Premium
US$8.99 a month, US$39.99 a year, lifetime about US$59.99 in promotions.
A$ unverified. Bad day: a rest day is suggested and the streak survives.
Better: the tone, and the streak that forgives. IntentNorth does what it
cannot: no streak at all on the practices that must never have one
(`neverNag`), and a session that changes rather than a suggestion to rest.

### Habits and urges

**Fabulous.** A routine builder that starts with one glass of water for
three mornings and stacks from there, with letters, journeys and audio
coaching. The trial offer appears after a long quiz and a signed commitment.
Limited free version; premium about US$39.99 a year with a 7-day trial,
with prices reported from US$16.99 to US$59.99 depending on promotion. A$
unverified. Users report cancellation friction. Bad day: a missed morning is
not punished. Better: the first three days are tiny and deliberate.
IntentNorth does what it cannot: put the practice at an hour that fits the
week and move it when the week moves.

**Streaks.** Up to a set number of daily tasks with a chain that resets to
zero on a missed required day; flexible schedules (weekly, specific days)
avoid accidental resets. One-time US$5.99, no subscription, Watch and
widgets, iCloud only. A$ unverified. Better: price, and the widget. IntentNorth
does what it cannot: refuse to count. Nothing in `patterns.ts` scores a
person; it reports co-occurrence and a time to intervene before the window.

**Finch.** A self-care pet: quick exercises grow a bird. The self-care tools
are free; Finch Plus (US$9.99 a month or US$69.99 a year) is largely
cosmetic plus more journeys and goal types. A$ unverified. Bad day: the bird
is kind. Better: the warmth; a reason to open the app that is not a
number. IntentNorth does what it cannot: a timed intervention 45 minutes
before the hour the behaviour usually lands, from the person's own logged
pattern, and a two-tap breath reset that is free with Plus off.

**I Am Sober.** A sobriety counter with daily pledges and milestones. On a
relapse the app asks how many times and resets the date, keeping the history
of runs. Free: the counter and the pledge. Plus US$9.99 a month or US$39.99
a year unlocks groups, lock, cloud backup and multiple trackers, after a
7-day trial. A$ unverified. Better: the community and the milestone
calendar. IntentNorth does what it cannot: keep backup and every lapse tool
free (it is a P0 in the brief to put them behind Plus), and place the
replacement behaviour into the evening at the hour the urge usually comes.

**Reframe.** A neuroscience-framed drink-less programme with a daily
reading, a toolkit (urge surfing, breathwork, SOS exercises, EFT tapping,
mocktails), trackers and a forum. 7-day trial then US$99.99 a year; coaching
US$9.99 to US$249.99 a month extra. A$ unverified. Better: the depth of the
readings and the community. IntentNorth does what it cannot: never charge
for the urge moment, and hold the urge tools beside the training, the
family and the money in one week.

### Mind

**Headspace.** Three Basics courses of ten sessions each; the first ten
and a few breathing exercises are free. US$12.99 a month with a 7-day trial
or US$69.99 a year with a 14-day trial; student US$9.99 a year (Australia
eligible); family US$99.99 a year. A$ unverified. Day two is session two.
Better: the voice and the course design. IntentNorth does what it cannot:
put the sit at the hour the day has room for, and level the practice from
minutes actually logged (`mind/practice.ts`).

**Calm.** A Daily Calm every day free, day one of every course free, one
breathing exercise, one Sleep Story, plus scenes. Completing a trial unlocks
the full 7 Days of Calm. US$16.99 a month, US$69.99 a year, family US$99.99,
lifetime US$399.99 to US$499.99; regional prices vary. A$ unverified. Better:
the sleep library. IntentNorth does what it cannot: a wind-down that is
placed against the person's own bedtime and a sleep debt that is theirs.

**Balance.** Daily questions assemble a personalised sit from thousands of
clips, in 10-day plans. The whole app is free for the first year, then
US$11.99 a month or US$69.99 a year. A$ unverified. Better: the free year,
and the questions each day. IntentNorth does what it cannot: place the sit
in a day and keep the two-minute reset free without a clock on it.

**Waking Up.** An introductory course of one short lesson and sit a day
for a month, then a library. 30-day trial, US$99.99 a year (one source says
US$129.99) or US$14.99 a month; a free year on request, no questions asked.
A$ unverified. Better: the scholarship policy and the teaching. IntentNorth
does what it cannot: anything outside the sit.

### Food without logging

**MacroFactor.** A food logger whose expenditure estimate is recomputed
weekly from weight trend and logged intake, adjusting targets. No free
version; 7-day trial with a card, then US$11.99 a month, US$47.99 for six
months or US$71.99 a year; needs two to three weeks of data. A$ unverified.
Better: the adaptive expenditure model. IntentNorth chose not to log food:
its nutrition plan is a protein anchor sized from body weight, a plate shape
and one lever at a time, read against a three-week weight trend
(`nutrition/plan.ts`). IntentNorth does what MacroFactor cannot: decide
dinner (`modalities/meals`, allergens failing closed) and put the walk after
the biggest meal into the evening.

**Noom.** A 15 to 20 minute quiz, a calorie range for a 16-week plan, and
daily psychology lessons of 5 to 15 minutes, with optional coaching. 7-day
trial with a card, then about US$209 a year or US$70 monthly. A$ unverified.
Better: the lesson library and the human coaches. IntentNorth does what it
cannot: change the plan when the week changes, and hold its nutrition
practices to a stated evidence grade and safety line.

**Australian meal planners.** RecipeRun plans a week from the household's
own recipes, builds one list, and shows indicative Woolworths, Coles and
ALDI prices by postcode; price unverified. Mealime (free tier), Paprika 3,
Plan to Eat, AnyList, Bring! and Listonic are the common alternatives; their
Australian prices are unverified. Better: recipe import and a supermarket
list. IntentNorth does what they cannot: decide the week's dinners from a
cooking-time answer and an allergy, and say "Dinner is decided" on Today.

### Money in Australia

**Frollo.** Free budgeting on Consumer Data Right Open Banking across more
than 100 institutions: categorisation, budgets, goals, bills, net worth, a
Financial Passport, savings challenges. No paid tier, no ads; the company
sells the platform to banks. Better: the live picture. IntentNorth does what
it cannot: the ordered ladder (`money/plan.ts`) with one step under the
spotlight and a weekly half-hour placed into the week; Frollo shows, it
does not schedule.

**WeMoney.** Free debt and budget tracking with Equifax and Experian credit
scores; Pro A$9.99 a month or A$98.99 a year for daily credit monitoring,
categories, no ads and desktop. Revenue also from marketplace commissions.
Better: the credit score and the debt view. IntentNorth does what it
cannot: keep money as education with no product to sell, and put the
automation nudge on payday into the plan.

**Up.** A bank: up to 50 named Savers, Round Ups, Pay Splitting on payday,
Groups for shared expenses. The account is free; the interest rate carries a
transaction condition. Better: the automation is real money moving. IntentNorth
does what it cannot: work with whichever bank the person already has, and
keep the weekly check-in beside the rest of life.

**Raiz.** Micro-investing round-ups into ETF portfolios; A$2.50 (Lite),
A$5.50 (Regular) or A$6.50 (Plus) a month, or a percentage above set
balances. Better: the money is invested. IntentNorth does what it cannot:
say "emergency buffer, then expensive debt, then investing" and refuse to
skip a step.

**Pocketbook successors.** Pocketbook closed on 5 August 2022. The
Australian alternatives in 2026 are Frollo and WeMoney (free, Open Banking),
Up (only by switching bank), BankSync and Finny (no bank link); PocketSmith
is paid. There is no single successor.

### Family

**Cozi.** Shared calendar, lists, recipes, free with 30 days of calendar
visible; Gold US$39 a year for ad-free, month view, more reminders, birthday
tracker and search; a Max tier adds AI email-to-event and meal plans. A$
unverified. Better: the whole household on one calendar with lists.
IntentNorth does what it cannot: protect one-on-one time and a booked-in
adventure against the gym and work, and show the week's shared moments and a
babysitter reminder ahead of date night (`household/week.ts`).

**TimeTree.** Shared calendars, unlimited members, chat, photos, free with
ads; Premium US$4.49 a month or US$44.99 a year, first month free, for
attachments, priority and a vertical view. A$ unverified. Better: the
group chat on an event. IntentNorth does what it cannot: place family time,
not just record it.

**Skylight.** A 15-inch wall calendar (JB Hi-Fi stocks it; A$ hardware
price unverified) with Plus at A$124.99 a year in Australia (US$79 in the
US) for email import, meal planning, chore rewards and a photo screensaver;
first month free. Laser has launched a subscription-free competitor in
Australia. Better: it is on the wall. IntentNorth does what it cannot:
decide what goes on the wall.

## 3. Five things to build over the air before growth

Each one is JavaScript only, ships to the approved build through
`expo-updates`, and is held from the production channel until Apple
approves 1.0 (brief, section 0). Costs are working days for one person,
including tests.

1. **"Usually 42 min": learned durations on every row, and the plan uses
   them.** Sunsama's planned-against-actual is the one planner feature
   people pay US$204 a year for, and IntentNorth already records the actual
   length of a workout (`durationMin` in `WorkoutLog`, set from `startedAt`
   in `src/app/session/workout.tsx`) but nothing else. Add `actualMin` to
   `PlanItem` on completion (from the session's elapsed time, or from
   "Start" to "Done" on the row in `src/features/today/item-actions.tsx`),
   compute a per-routine median in `src/lib/scheduling/adaptation.ts` next
   to `detectShrinkToFit`, show "usually N min" on
   `src/features/today/plan-item-row.tsx` once three actuals exist, and let
   the median stand in for `durationMin` when the scheduler places the
   routine. Cost: one day. Hygiene already keeps 120 days of full items
   (`src/state/hygiene.ts`), which is enough history.

2. **Move it, do not drop it.** Reclaim's rule is "the next best time within
   the window"; IntentNorth's engine places by tier, and a could-tier
   practice whose window is taken by a must-tier block is reported as
   unplaced rather than tried elsewhere (`placeRoutines` in
   `src/lib/scheduling/engine.ts`; the protein anchor at lunch on the
   example Monday, brief section 3, item 3). Add a second pass over
   `unplaced` that tries every remaining free window in the day for any
   non-deadline, non-time-anchored routine, records `movedFrom`, and leaves
   deadlines and time-anchored practices where they are so the displaced
   sentence stays honest. Add the scenario to `src/features/sim`. Cost: one
   day.

3. **A rest timer that survives a locked phone.** Hevy's Live Activity and
   Strong's wrist timer are native, but the useful half is not: when the rest
   ends, the person should feel it. `src/app/session/workout.tsx` counts
   down in state and does nothing at zero. Fire a haptic (`expo-haptics` is a
   dependency) at zero in the foreground, and schedule a one-shot local
   notification for the rest end through `src/lib/notifications.ts`
   (`expo-notifications` is a dependency and already schedules
   interventions), cancelled if the next set is logged early. Keep it
   outside the daily cap in `src/features/notifications/schedule.ts`, since
   it is the person's own timer. Cost: half a day.

4. **Put the energy shape into placement.** Rise's product is the energy
   schedule; IntentNorth computes `energyShape` in
   `src/features/health/sleepDebt.ts` and shows it on the readiness card
   only. Pass the shape into `buildDailyPlan` through `DayContext`
   (`src/lib/scheduling/engine.ts`) from `src/features/planner/generate.ts`,
   and let deep-work and study sessions (`duringWork`, `sessionType`
   deep work) prefer the peak window and the low-energy chores prefer the
   dip, with the reason line saying so ("at your peak, from your wake
   time"). Cost: one day, plus a simulation scenario for each energy
   profile.

5. **A swap that moves the rest of the week.** Fitbod and JuggernautAI
   rebuild the week after a change; IntentNorth's session swap is per date
   only, so a person who presses on Monday gets pressing again on Wednesday
   (brief section 3, item 1). In `src/features/training/swap.ts`, when a
   session is swapped for a date, rotate the block's remaining sessions for
   that week so the pattern order is preserved from the swapped one
   forward, and keep the log title logic in `src/features/training/log.ts`
   in step. Cost: one day, with the swap-with-a-logged-set case tested.

Next after these, in this order: a grade filter in the library
(`src/app/library.tsx`, half a day) so the differentiator is browsable; a
day-two "what changed since yesterday" line on Today from
`src/features/review/weeklyChanges.ts`; and the exertion target sentence
from Apple Health workouts, which is JavaScript (`@kingstinct/react-native-healthkit`
can read workouts and the HealthKit entitlement is already in the build)
but should wait until the usage string is confirmed to cover workouts.

## 4. Five things that need a native build

The 1.1 batch, one build and one review, unchanged in substance from the
last sweep and still true: none of them exist in the code (no target under
`ios/` for widgets, activities or intents; `NullCalendarProvider` still
returns nothing).

1. **Widgets.** Lock screen "next up at 5:45pm", home screen readiness and
   sleep debt, a Control Centre "Two-minute reset". Structured ships all of
   this free; Gentler Streak ships widgets free. `@bacons/apple-targets`
   with SwiftUI reading an App Group JSON the app writes.
2. **Live Activity.** The workout rest timer and the breathing session on
   the lock screen and Dynamic Island. Hevy's is the benchmark, adjustable in
   15-second steps from the widget.
3. **App Intents.** "Log a set", "Start a two-minute reset", "What's next",
   which also puts the app in Spotlight and Siri. Streaks and Hevy expose
   Shortcuts.
4. **Device calendar read.** `expo-calendar` behind the existing
   `CalendarProvider` interface so meetings become fixed blocks and the
   meeting-on-the-walk case is real rather than modelled. Read-only, same
   privacy story. Every planner in the set does this.
5. **Apple Watch.** Set logging and the rest countdown on the wrist, as
   Strong and Hevy do, and later live heart rate. Large; only after widgets
   prove the demand.

Sixth, a decision rather than a feature: Android, with Health Connect and
Play Billing. Every app in the set except Streaks, Athlytic, Gentler Streak
and Structured's Replan is on both platforms.

## 5. Three things to say louder because nobody else has them

1. **The day says what it moved and which part of your life won.** Motion
   and Reclaim reschedule silently; Sunsama asks you to do it; Fitbod and
   Whoop change a number. No app in the eight categories names the trade
   between the gym, the school run and the money check-in, because none of
   them holds all three. IntentNorth does, in one sentence at the top of
   Today, and adds "Nothing is lost; it goes back in the running tomorrow."
   Put that sentence in the film, on the site and in the store screenshots.

2. **Every practice is graded for how strong the evidence is, names its
   source and says where it stops.** Not one competitor shows an evidence
   grade; Noom cites psychology without grading it. Say A to E, say the
   safety line, say "we never write prescription", and say that the
   practices for the hardest seasons will never nag you because that is
   written in the data, not in a setting.

3. **The hardest moment is free forever, and nothing you enter leaves your
   phone.** I Am Sober puts backup and groups behind Plus; Reframe is
   US$99.99 a year after seven days; MacroFactor, Noom, Fitbod and
   JuggernautAI take a card before the first day. IntentNorth's urge, reset
   and lapse tools run with Plus off, are enforced in code
   (`isAlwaysFreeRoutine`), and there is no account to make. Whoop's own
   plan tiers are a reminder that the market has been trained to expect
   the cloud; say plainly that there is none.

A fourth worth a line rather than a headline: readiness is judged against
the person's own median, never a population band (`readiness.ts`). Whoop,
Athlytic and Gentler Streak also personalise, so it is not unique, but
"your own fourteen-day normal" is a sentence a stranger understands.

## 6. What changed since the last sweep

Things in `docs/COMPETITIVE_REVIEW.md` (2026-09-04) that are now false,
checked against the code at this commit and the sources below.

| Claim in the last sweep | Now |
|---|---|
| "No debt model, no energy curve" (section 2, row 1) | False. `src/features/health/sleepDebt.ts` computes need from the person's own nights, a fourteen-night debt with older nights weighted half, a bedtime to recover, and an energy shape; the readiness card shows them. The energy shape is not yet used for placement (section 3, item 4). |
| "Carry-over ritual: unresolved items are asked about, not carried" (section 2) and Tier A item 5 as open | False. The morning check-in lists "Left from yesterday" and one tap moves the item into today (`src/app/check-in/morning.tsx`, `moveItemToDate`). |
| "No persist `version` and no `migrate`" and "persisted state grows without bound" (section 3) | False. `src/state/hygiene.ts` carries `PERSIST_VERSION`, `migratePersisted` and `pruneHistory` (120 days of full items, 730 compact, caps on events, reflections, logs and suggestions), wired in `src/state/store.ts`. |
| "Telemetry has eight events and three call sites; five are never emitted" | False. All eight events now have call sites (`interview.tsx`, `plan-review.tsx`, `upgrade.tsx`, `path/[id].tsx`, `report.tsx`, `purchases.ts`). |
| "No CI runs tests, lint or typecheck" | False. `.github/workflows/ci.yml` runs typecheck, lint and jest on every push and pull request. |
| "Notification taps go nowhere" | Partly false. `src/lib/notifications.ts` registers a response listener and hands the payload to a handler; whether every payload routes to the right screen is a QA row for Workstream C, not settled here. |
| "No automatic update check on launch" | Still true. `checkAndApply` in `src/lib/updates.ts` is called only from `src/app/settings.tsx`. |
| "A 2.8 MB `web-preview.html` and a `dist/` directory are checked in" | Both are now in `.gitignore` (lines 8 and 49). Whether earlier commits still carry them is a history question this review did not run git to answer. |
| "Learned time estimates: adaptation reads logged actuals but never shows the estimate" | Still true, and narrower than it reads: only workouts record an actual duration (`WorkoutLog.durationMin`); plan items record none. Section 3, item 1. |
| Sunsama "$192/yr" | Now US$204 a year (US$17 a month annual) or US$22 monthly; a Power Pro tier exists. |
| Whoop "$239/yr" | Australian pricing is tiered: One A$299, Peak A$419, Life A$629 a year, with a May 2026 change to a device fee plus about A$300 a year reported. The single US figure no longer describes what an Australian sees. |
| Fitbod "~$16/mo" | US$15.99 a month or US$95.99 a year for new subscribers, a 2026 increase from US$12.99 and US$79.99. |
| "Live Activity rest timer: Hevy, Strong, Fitbod" | Hevy verified. Strong's Watch timer is verified; Strong and Fitbod Live Activities are unverified. |
| "177 protocols across nine pillars ... 145 safety lines" | The count is no longer said anywhere (brief section 0, rule 9, and `docs/PROBLEM_STATEMENT.md`). The library is still nine pillars, graded A to E, with a safety line on the health practices. |
| Bevel Pro "$99.99/yr" | Not re-checked. Unverified. |

Everything else in the last sweep's table stands: no widget, Live Activity,
App Intent, Watch or calendar read exists in the code; the price position
(A$89.99 a year for seven coaches) still sits under Sunsama, Motion, Fitbod,
JuggernautAI, Whoop, Reframe, Noom and MacroFactor, and above the
single-purpose logs.

## 7. What Isaac should know in three minutes

- The field has not moved on the thing IntentNorth is for. Nobody decides
  between domains, nobody shows evidence grades, and the two products that
  come closest to the day model (Reclaim's windows, Sunsama's actuals) run
  on a task list, not on a life.
- The first three over-the-air updates after approval, in order: learned
  durations (1), move-not-drop (2), the rest timer that survives a locked
  phone (3). Together they close the visible gap to Sunsama, Reclaim and
  Hevy for three and a half days of work.
- The native batch is unchanged and still needed for the daily glance:
  widgets first, then Live Activity, then calendar. Every planner and every
  Watch app in the set has at least one of these; IntentNorth has none.
- The price holds. The apps above IntentNorth's price do one thing; the
  apps below it log rather than decide.

## 8. Sources

Whole-day planners

- Sunsama pricing: https://www.morgen.so/blog-posts/sunsama-pricing ; https://ellieplanner.com/productivity-copilot/sunsama-pricing ; https://efficient.app/apps/sunsama
- Sunsama rollover, planned and actual time, shutdown: https://help.sunsama.com/docs/task-rollover-and-recurring-tasks-the-basics ; https://help.sunsama.com/docs/planned-and-actual-times ; https://www.sunsama.com/features/daily-planning-and-shutdown
- Motion pricing: https://www.morgen.so/blog-posts/motion-pricing ; https://ellieplanner.com/productivity-copilot/motion-app-pricing ; https://www.lindy.ai/blog/motion-app-pricing
- Motion auto-scheduling: https://www.usemotion.com/help/time-management/auto-scheduling ; https://www.usemotion.com/help/project-management/task/task-scheduling-faq
- Reclaim pricing and free tier: https://schedulingkit.com/pricing-guides/reclaim-ai-pricing ; https://www.morgen.so/blog-posts/reclaim-pricing
- Reclaim habits and time defence: https://help.reclaim.ai/en/articles/4129152-habits-overview-auto-schedule-flexible-time-for-your-routines ; https://help.reclaim.ai/en/articles/4129290-time-defense-settings-for-habits
- Structured free and Pro: https://apps.apple.com/us/app/structured-daily-planner-todo/id1499198946 ; https://daveswift.com/structured/ ; https://toolradar.com/tools/structured
- Structured Replan: https://help.structured.app/en/articles/4526850 ; https://help.structured.app/en/articles/4511874

Training

- Hevy pricing and free limits: https://www.sensai.fit/blog/hevy-review-2026 ; https://repreturn.com/hevy-pro-vs-free/
- Hevy Live Activity and rest timer: https://help.hevyapp.com/hc/en-us/articles/35649846517399-How-to-Use-Hevy-s-Live-Activity-on-iOS-and-Android ; https://www.hevyapp.com/features/workout-rest-timer/
- Strong pricing and free limit: https://repreturn.com/strong-app-review/ ; https://www.sensai.fit/blog/hevy-vs-strong-2026
- Strong Apple Watch: https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577 ; https://www.findyouredge.app/news/best-strength-training-apps-apple-watch-2026
- Fitbod pricing and trial: https://www.sensai.fit/blog/fitbod-review-2026 ; https://push-pull.app/blog/push-pull-vs-fitbod
- Fitbod recovery inputs: https://fitbod.me/blog/muscle-recovery/ ; https://fitbod.zendesk.com/hc/en-us/articles/360006269014-Muscle-Recovery ; https://www.sensai.fit/blog/workout-app-adjusts-for-fatigue
- JuggernautAI pricing and readiness: https://www.garagegymreviews.com/juggernautai-review ; https://aitoolsbakery.com/blog/juggernautai-review/ ; https://arvo.guru/vs/juggernaut-ai

Recovery and readiness

- Whoop Australia pricing: https://arnav.au/2026/08/12/whoop-subscription-australia-what-it-costs-and-which-tier-is-worth/ ; https://arnav.au/2026/08/22/compare-whoop-5-0-one-vs-peak-vs-life-comparison-and-data-exposure/ ; https://www.whoop.com/us/en/membership/
- Whoop Strain Coach: https://www.whoop.com/us/en/thelocker/strain-coach/ ; https://www.whoop.com/us/en/thelocker/how-does-whoop-strain-work-101/
- Rise pricing, trial and free use: https://help.risescience.com/hc/en-us/articles/4405177615639-What-subscription-plans-does-RISE-offer ; https://help.risescience.com/hc/en-us/articles/4405177919895-Can-I-use-RISE-for-free ; https://www.mattressclarity.com/accessories/rise-app-review/
- Rise energy schedule and sleep debt: https://www.risescience.com/blog/how-much-sleep-debt-do-i-have ; https://www.tapsmart.com/apps/review-rise/
- Athlytic pricing, free tier and target exertion: https://www.corahealth.app/compare/athlytic ; https://apps.apple.com/us/app/athlytic-fitness-recovery/id1543571755 ; https://www.healthappinsider.com/en/comparisons/athlytic-vs-bevel-vs-gentler-streak
- Gentler Streak pricing, free tier, Go Gentler, Activity Status: https://www.healthappinsider.com/en/reviews/gentler-streak-review ; https://docs.gentler.app/managing-your-subscription-account/view-your-gentler-streak-premium-membership-details ; https://www.bgr.com/lifestyle/gentler-streak-improves-apple-watch-health-measurements-in-major-update/ ; https://hrvzone.com/apps/gentler-streak

Habits and urges

- Fabulous: https://www.choosingtherapy.com/fabulous-app-review/ ; https://screensdesign.com/showcase/fabulous-daily-habit-tracker ; https://makeheadway.com/blog/fabulous-app-review/ ; https://spoonuniversity.com/school/cuny/fabulous-app-better-habits/
- Streaks: https://66streaks.com/blog/is-streaks-app-free/ ; https://streaksapp.com/ ; https://habi.app/insights/best-streak-tracker-apps/
- Finch: https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing ; https://habitbox.app/blog/finch-app-review ; https://www.autonomous.ai/ourblog/finch-self-care-app-review-full-breakdown
- I Am Sober: https://www.choosingtherapy.com/i-am-sober-app-review/ ; https://play.google.com/store/apps/details?id=com.thehungrywasp.iamsober ; https://iamsober.com/en/blog/relapse-and-recovery
- Reframe: https://www.choosingtherapy.com/reframe-app-review/ ; https://www.oarhealth.com/alcohol-use-disorder/treatment/reframe-drinking-app-review ; https://www.selfpause.com/resources/reframe

Mind

- Headspace: https://lifestack.ai/blog/headspace-pricing ; https://www.headspace.com/subscriptions ; https://help.headspace.com/hc/en-us/articles/115008192928-What-s-included-for-free ; https://www.headspace.com/meditation/basic-meditation
- Calm: https://carepaths.com/calm-app-pricing/ ; https://support.calm.com/hc/en-us/articles/360044707294-What-Free-Content-is-Available-on-the-Calm-App ; https://support.calm.com/hc/en-us/articles/360008536834-Calm-Premium-vs-Free-Features-Content-List-Benefits
- Balance: https://www.choosingtherapy.com/balance-meditation-app-review/ ; https://apps.apple.com/us/app/balance-meditation-sleep/id1361356590 ; https://support.balanceapp.com/hc/en-us/articles/4407700854171-What-is-Balance
- Waking Up: https://innercalmguide.com/articles/waking-up-review.html ; https://www.wakingup.com/ ; https://reefreview.net/blog/waking-up-meditation-app-guide/

Food without logging

- MacroFactor: https://arvo.guru/vs/macrofactor ; https://nutriscan.app/blog/posts/macrofactor-free-trial-2026-start-cancel-guide-2ee8910479 ; https://www.bentobunny.app/guides/macrofactor-cost
- Noom: https://www.noom.com/blog/weight-management/noom-cost/ ; https://bettercare.com/costs/noom-cost ; https://www.amyfoodjournal.com/blog/noom-review ; https://calorierankings.com/reviews/noom/
- Australian meal planners: https://reciperun.com.au/blog/best-shared-grocery-list-apps-australia ; https://www.slrp.com.au/blog/best-meal-planning-apps-for-couples-2026 ; https://www.foodieprep.ai/blog/meal-planning-apps-with-builtin-grocery-lists-a-2026-sidebyside-review

Money in Australia

- Frollo: https://frollo.com.au/ ; https://www.savings.com.au/budgeting-finance-tips/frollo ; https://subtracker.com.au/blog/best-budgeting-app-australia ; https://funance.com.au/blog/best-personal-finance-apps-australia
- WeMoney: https://www.wemoney.com.au/app ; https://www.wemoney.com.au/wemoney-free-credit-score ; https://subtracker.com.au/blog/best-budgeting-app-australia
- Pocketbook closure and successors: https://www.smartcompany.com.au/startupsmart/zip-pocketbook-closure/ ; https://www.finder.com.au/budgeting/alternatives-to-pocketbook ; https://getfinny.app/blog/best-budgeting-apps-australia-2026
- Up: https://up.com.au/saving/ ; https://up.com.au/features/round-ups/ ; https://www.finder.com.au/bank-accounts/up-everyday-account-review ; https://www.savings.com.au/news/up-launches-new-groups-feature-to-simplify-shared-expenses
- Raiz: https://raizinvest.com.au/fees ; https://www.finder.com.au/robo-advice/raiz-invest ; https://peakifi.com/investing/micro-investing/raiz-review-australia/

Family

- Cozi: https://www.cozi.com/compare-plans/ ; https://www.usecalendara.com/blog/cozi-pricing-2026 ; https://getsense.ai/blog/posts/cozi-gold-worth-it-2026
- TimeTree: https://support.timetreeapp.com/hc/en-us/articles/360000290802-How-much-does-TimeTree-cost ; https://timetreeapp.com/intl/en/premium ; https://toolstack.io/tools/timetree
- Skylight: https://au.myskylight.com/products/calendar-skylight-plus/ ; https://skylight.zendesk.com/hc/en-us/articles/35984779668379-What-does-a-Skylight-Calendar-cost ; https://www.jbhifi.com.au/products/skylight-15-smart-family-calendar-white ; https://www.gadgetguy.com.au/laser-digital-calendar-launch-no-subscription-skylight/

IntentNorth, from the code at this commit

- `src/features/plus/entitlement.ts`, `src/features/plus/PlusNudge.tsx`, `src/features/plus/LockedSessions.tsx`
- `src/features/knowledge/protocols.ts`
- `src/lib/scheduling/engine.ts`, `src/lib/scheduling/adaptation.ts`, `src/features/planner/generate.ts`, `src/features/planner/displaced.ts`
- `src/features/training/programme.ts`, `swap.ts`, `baseline.ts`, `log.ts`, `src/app/session/workout.tsx`
- `src/features/health/readiness.ts`, `sleepDebt.ts`, `healthkit.ts`, `ReadinessCard.tsx`
- `src/features/paths/definitions.ts`, `level.ts`; `src/features/money/plan.ts`; `src/features/nutrition/plan.ts`; `src/features/behaviours/patterns.ts`; `src/features/household/week.ts`; `src/features/mind/practice.ts`
- `src/app/(tabs)/today.tsx`, `src/app/check-in/morning.tsx`, `src/app/library.tsx`
- `src/state/hygiene.ts`, `src/lib/notifications.ts`, `src/lib/updates.ts`, `src/lib/telemetry.ts`, `src/lib/calendar/provider.ts`, `.github/workflows/ci.yml`, `.gitignore`
