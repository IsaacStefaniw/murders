# Review brief — competitors, usability, functionality, deep QA

For the session that picks this up. Written 2026-09-05 at commit `67e94f9`
on `claude/rename-murders-folder-goh5q0`. Everything here is on that
branch; nothing in this brief lives anywhere else.

This is a review with teeth. The deliverable is not a document about the
app. It is the app, better, with every finding either fixed and tested or
written down with a reproduction and a reason it was not fixed. The
standard for a finding is the standard a user would hold: a screenshot or
a test, the exact steps, what happened, what should have happened.

## 0. Non-negotiables

These are Isaac's standing rules. They do not bend for a good reason.

1. **Push only to `claude/rename-murders-folder-goh5q0`.** Never another
   branch. Never force-push. Another session (the website session) pushes
   to the same branch: fetch and merge before every push, never rebase.
2. **Nothing goes live until Apple approves 1.0.** No `eas update`, no
   `eas build`, no App Store Connect changes, no website deployment. The
   app is in review (build 16 was rejected for a missing Terms of Use
   link; the metadata fix is in `docs/APP_STORE.md`). "I don't want any
   changes to negatively effect our app review with apple."
3. **Secrets.** The ASC `.p8` lives only in the GitHub secret
   `ASC_KEY_P8`. Never paste a token or key into chat, a commit, or a
   file. `.env*` and `*.p8` are never committed.
4. **No model identifiers** in commits, PR text, code or comments. The
   commit trailers are the ones every commit on the branch already carries.
5. **Health, nutrition, recovery and finance content is education, never
   advice.** Every practice carries a source, a grade and where it stops.
   Never write "prescription". "Program", "plan" or "practice".
6. **Urge, reset and lapse-recovery support is free forever.** The rule is
   enforced in `src/features/plus/entitlement.ts` (`isAlwaysFreeRoutine`,
   `isAlwaysFreeProtocol`). Anything that puts it behind Plus is a P0.
7. **Never fabricate.** No invented testimonials, results, pricing, App
   Store availability, screenshots or UI. Every screenshot is the real
   build (`scripts/store-shots/README.md`). Every sentence on a screenshot
   is the app's own output.
8. **Gates before every commit:** `npm run typecheck`, `npm run lint`,
   `npm test` (908 tests at this commit, all passing), and for anything
   under `web/`, `cd web && npm test`. A red gate is not committed.
9. **Words.** `src/features/copy/__tests__/jargon.test.ts` bans the terms
   a thousand reviewers could not follow. Read the glossary in
   `docs/POSITIONING_REVIEW.md` and `docs/PROBLEM_STATEMENT.md` before
   writing any copy. No counts of practices; the grading is the point.
10. **Nothing non-media under `web/public/`.**

## 1. The product, in one page

IntentNorth is an iPhone app (Expo SDK 57, React Native 0.86, React 19,
TypeScript strict, Expo Router, Zustand persisted under the key
`intent-os-store`). A twelve-question interview builds a profile and a
plan; seven coaches (Training, Nutrition, Money, Work & leadership, Habits
& urges, Relationship, Family & adventure) each run a program of practices
drawn from a graded library (`src/features/knowledge/protocols.ts`,
evidence A to E, source and safety line on every one); a deterministic
scheduler (`src/lib/scheduling`, `src/features/planner`) places them into
the person's real days and re-places them when the day changes, saying why.

The problem it solves, in the customer's words, is in
`docs/PROBLEM_STATEMENT.md`: you hear it on a podcast, think it's
brilliant, and it is gone by Tuesday, because nobody researches it, writes
it down and puts it in the week. That document wins over anything older
that says something different.

Free forever: the interview, the first insight, the day's shape, every urge
and reset tool, breathing, the two-minute practices, a full view of every
program, backup and restore. Plus (A$14.99 a month, A$89.99 a year, A$249
once) runs the coaches: it places the sessions into the days and moves them
when the day changes. The offer is a dismissable card on Today from the
second day, never a gate (`src/features/plus/PlusNudge.tsx`).

Markets are in `docs/MARKETS.md`: employed professionals, operators,
shift workers, carers at home, students, retirees, and the rebuilder.

## 2. Getting to the latest code and running it

```
git fetch origin claude/rename-murders-folder-goh5q0
git checkout claude/rename-murders-folder-goh5q0
npm ci
npm run typecheck && npm run lint && npm test
```

**The web build is the review surface.** There is no simulator here. The
app exports to web and renders faithfully in headless Chromium; every
screenshot and every persona review to date was taken that way.

```
EXPO_PUBLIC_OFFER_PREVIEW='[{"productId":"app.intentnorth.plus.annual","displayPrice":"A$89.99"}]' \
  npx expo export --platform web --output-dir <scratch>/webdist
WEBDIST=<scratch>/webdist setsid nohup node scripts/store-shots/serve.js &   # port 8787
```

Kill the server with `fuser -k 8787/tcp`. Never `pkill -f` with a pattern
that appears in your own command line: it kills the shell.

**Playwright** is installed outside the repo (`npm i playwright` in a
scratch directory with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`) and pointed at
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Capture at 420×900
CSS pixels, scale 3, `isMobile`, `Australia/Brisbane`; a tall viewport
(420×1720) for full-length screens, because React Native Web scrolls
inside its own container and `fullPage` captures nothing below the fold.

**Seeding a state.** Inject into `localStorage` before first paint with
`addInitScript`. Build the seed in a jest probe: onboard, start pathways,
`seedDemoHistory()`, save about twelve `WorkoutLog`s across six weeks, add
a metric goal with a target date, set `entitlement: { plus: true, source:
'dev' }`, then write `{ state: partialize(getState()), version }`. Run the
probe under `TZ=Australia/Sydney`; the container is UTC and a seed written
in UTC lands six hours out on the device. A jest probe goes under
`src/**/__tests__/*.test.ts` (that is the only test match) and is deleted
before committing.

**The persona pipeline** is in `docs/review/`: `personas.py` draws a
seeded thousand from the markets, `REVIEWER_BRIEF.md` is what each
reviewing agent is told, `aggregate.py` produces the report, and the two
reports from the overhaul are there for comparison. Round three on the
current build is part of this brief (section 4).

**The cohort simulation** (`src/features/sim`, `docs/SIMULATION.md`) runs
thousands of profiles through the real code for weeks. It is the fastest
way to find scheduler and pathway defects at scale, and it is the place to
add a scenario when you find one by hand.

## 3. What has already been done, so you do not do it again

Read `docs/OVERHAUL_REPORT.md` first. A thousand reviewers, then a hundred,
and what changed between them. Since that report, on this branch:

- The example day (`/example-day`) runs the full pipeline with every coach.
- Work-day carving no longer leaves slivers; a during-work block that would
  run past the end of the day is pulled back in; a shutdown ritual anchors
  to the end of the work hours (`src/features/planner/generate.ts`).
- One family dinner, one breath reset, whatever combination of coaches runs
  (`src/features/paths/__tests__/oneOfEach.test.ts`).
- The training intake asks how often you train now and has options for
  someone it is going well for; a block never hands a five-day lifter three
  days (`sessionsPerWeekFloor`).
- Sessions and exercises can be swapped on the workout screen
  (`src/features/training/swap.ts`), per date and per block respectively.
- The strength baseline is weighted, not the last thing logged
  (`src/features/training/baseline.ts`).
- "It already happened…" on the move picker puts an item at the time it
  happened and marks it done (`pastStartsFor`).

**Known and open, in Isaac's order of interest.** These are yours if you
get to them, and each one is a defect to reproduce first:

1. A session swap does not shift the rest of the week's rotation.
2. Shift workers get work days and hours, not a roster. Data model change.
3. The scheduler drops could-tier practices when a higher-priority block
   takes their window rather than moving them (the protein anchor at lunch
   is unplaced on the example Monday; the fourth frame of
   `docs/APP_CAPTURE_REQUEST.md` could not be produced for this reason).
4. Lunch is a window kept free of work, not an item the nutrition coach
   places.
5. A grade filter in the library; progress for goals that are not training;
   a named mental-health track; larger default text (12% of round two).
6. Whether the per-session estimated max should ignore sets above eight
   reps entirely.
7. A single-coach price and a free week of Plus are pricing decisions, not
   yours. Do not build them.

## 4. The four workstreams

Run them in this order. Each has a deliverable and a definition of done.

### A. Competitor review (one day)

`docs/COMPETITIVE_REVIEW.md` is the last sweep, with sources. Do not
repeat it; extend it, and check whether anything in it has become false.

**The set.** One deep pass on each of these, as a paying user for the
first three days, not as a feature-list reader:

| Category | Apps | What to steal, what to beat |
|---|---|---|
| Whole-day planners | Sunsama, Motion, Reclaim, Structured | Carry-over ritual, learned time estimates, the shutdown, calendar reads |
| Training | Hevy, Strong, Fitbod, JuggernautAI | Session swap, exercise substitution, rest timer, progression rules, Watch |
| Recovery and readiness | Whoop, Rise, Athlytic, Gentler Streak | Sleep debt, exertion target, how a bad night changes the day |
| Habits and urges | Fabulous, Streaks, Finch, I Am Sober, Reframe | The moment of the urge, lapse recovery, streak psychology |
| Mind | Headspace, Calm, Balance, Waking Up | First session, voice quality, progression |
| Food without logging | MacroFactor, Noom, Australian meal planners | Protein target, dinner decided, the walk after |
| Money (Australia) | Frollo, WeMoney, Pocketbook successors, Up, Raiz | The ladder, automation, weekly check-in |
| Family | Cozi, TimeTree, Skylight | Shared calendar, one-on-one time, the booked-in adventure |

For each app, record with screenshots: the five-second test (what is it,
who is it for, what would I do next), time to first value, what day two
looks like, what a bad day looks like (short night, meeting on the walk,
skipped session), what is free, what the paywall says and when it appears,
and the one thing it does better than IntentNorth. Then the reverse: the one
thing IntentNorth does that it cannot.

**Deliverable.** `docs/COMPETITIVE_REVIEW_2.md`: a matrix of the eight
categories against twelve dimensions, five things to build over the air
before growth with a cost and a file, five things that need a native build,
and three things to say louder because nobody else has them. Every claim
about a competitor has a source or a screenshot. Prices in the currency
the store shows an Australian.

**Done when** Isaac can read the matrix in three minutes and knows what the
next three over-the-air updates are.

### B. Usability (two days)

Walk the app as twelve people, not as its author. Use the markets in
`docs/MARKETS.md` and pick one persona from each row of
`docs/review/personas.py`, plus these two: Isaac himself (trains four days,
founder, family), and a 62-year-old with reading glasses on an iPhone SE
with Larger Text on.

**The journeys.** Each one is a script with an expected outcome; a
departure is a finding.

1. Cold open to first day: welcome, example day, twelve questions, plan
   review, Today. Time it. Count the words. Note every term that needs
   the glossary.
2. Day two: what changed, the Plus card, the suggestion, the morning
   check-in, the evening check-in.
3. The bad day: short night before a training day, a meeting on the walk,
   an item that already happened, an item that will not happen, a skipped
   session, and what tomorrow looks like after all of it.
4. A week: the Week tab, moving across days, the report, the level card
   after the first logged session.
5. Each coach's hub from the free tier and from Plus: what is locked, what
   it says, whether the promise on the card matches the program.
6. The library: find morning light, read the grade, add it, find it on the
   plan, remove it, and see it gone.
7. The workout: start, swap the session, swap an exercise, log a set, edit
   it, rest timer, finish, the baseline on the hub afterwards.
8. The urge: from Today at 9pm, two taps to the breath reset, and whether it
   is free with Plus off.
9. Meals: preferences with an allergy, the week's dinners, the shopping
   list, and whether the allergen gate holds.
10. Money: the intake, the steps, the weekly check-in, the automation nudge.
11. Settings: backup, restore on a clean state, notifications, delete
    everything, and the privacy line.
12. The paywall: from the card, from a locked session, restore purchases,
    and what a person who never pays can still do a month in.

**Heuristics to hold each screen against.** Can a stranger say what this
screen is for in five seconds. Does every line say why it is there. Is the
next action obvious and single. Does it read at Larger Text without
truncation. Does VoiceOver announce every control with its state. Does dark
mode hold contrast. Does anything take more than three taps that should
take one. Does any word appear that a reader would have to look up.

**Round three of the persona review.** Rebuild the pack from the current
build (both journeys, every screen as text and screenshot, as
`docs/review/REVIEWER_BRIEF_R2.md` describes), run a hundred fresh
personas with the same tags, and compare against round two in
`docs/review/round2-report.md`. The two numbers that matter most:
`paywall_too_early` (44% in round two, before the card moved to the second
day) and `free_tier_unclear` (23%).

**Deliverable.** `docs/USABILITY_REVIEW.md`: findings ranked by how many of
the twelve hit them, each with a screenshot, the persona, the step, the
expected and the actual. Fixes for everything small pushed to the branch
with tests. The round-three report under `docs/review/round3-report.md`
with the comparison table.

**Done when** every journey above has been walked by every persona and the
round-three numbers are in the report beside rounds one and two.

### C. Functionality and deep QA (three days)

This is the part that matters most and the part most likely to be skimped.
The app is deterministic by design: nearly everything can be tested without
a device. The rule is that a finding becomes a failing test before it
becomes a fix.

**Scheduler** (`src/lib/scheduling`, `src/features/planner`):

- Day shapes: employed 9–5:30, shift (early, late, night, four-on-four-off),
  carer with a school run, retiree with anchors, student with a timetable.
  Work hours that cross midnight. A wake time after a sleep time.
- Fixed blocks: lunch carve, during-work carves, slivers, tail folds, a
  block anchored to work end, two carves preferring the same start, a carve
  longer than the work day.
- Placement: could-tier practices displaced by must-tier, the free-time
  reserve by capacity, protocol bounds (finish before sleep), the bedtime
  guard, the morning-light wake anchor.
- Moves: to a slot, with bumps, to tomorrow, shorten, "it already
  happened", drag-to-move, quick-add into a full day, and the displaced
  list being honest every time.
- Regeneration: what a plan keeps when the routines change (done items,
  moved items, skipped items) and what it must never resurrect.
- Suggestions and adaptation (`src/lib/scheduling/adaptation.ts`): the
  pattern sentence after four moves, the message grammar, the second-day
  gate.

**Training** (`src/features/training`):

- `buildProgramme` across every equipment, goal, level, constraint set,
  age band, push-harder and step-back, with and without baselines. Loads
  never above the constraint ceiling; no barbell for bodyweight; no
  deadlift or overhead press at foundation.
- Auto-regulation for each sleep band and readiness band and each
  available-minutes value down to 15.
- Session swap per date; exercise swap per block; a swap with a logged set;
  a swap on the free tier; the log title after a swap.
- The weighted baseline against every rule in
  `src/features/training/__tests__/baseline.test.ts`, then the ones it does
  not cover: a corrected set, a deleted log, a retest older than the window,
  two lifts on one day, a bodyweight set.
- The level ladder (`src/features/paths/level.ts`, `training/level.ts`):
  claim, measured, earned, step-back, and the sentence the hub shows.

**Pathways** (`src/features/paths`): every intake answer combination per
pathway builds, no duplicate practices under two names, every rung changes
something, `fitLadderToBudget` at minimal capacity, the family and
relationship pathways for households without kids, the recovery pathway
for every behaviour in the catalogue and every trigger and replacement.

**Entitlement** (`src/features/plus`): with Plus off, exactly the
always-free routines run; the library opens five per area plus every urge
tool; a locked session opens the paywall; restore on a clean install; the
grant expiry; the development grant never reaching a release build.

**Health** (`src/features/health`): readiness from HRV and resting heart
rate against the person's own baseline, never a population band; missing
data says so; a Health sync landing after mount pre-fills the sleep chips;
stale readings are ignored by the windows in `healthkit.ts`.

**Meals** (`src/features/modalities/meals`): the allergen gate excludes on
"may contain" and on unreviewed ingredients; every dish in `DISHES` has a
reviewed ingredient list or is excluded for anyone with a declared allergy.

**Persistence** (`src/state/store.ts`): `PERSIST_VERSION` and every
migration in `onRehydrateStorage`; a state from each earlier version
hydrates without loss; backup and restore round-trip byte for byte; a
profile without interview answers reconstructs them.

**Time.** Every date-keyed feature under `TZ=Australia/Sydney`,
`TZ=Australia/Perth`, `TZ=Pacific/Auckland` and `TZ=UTC`: plan keys, metric
timestamps at local noon, week starts, the "tonight" window, recentLogs
cutoffs, and the quick-add test that failed on a Saturday until it was
pinned to a weekday.

**Accessibility floor** (`src/features/a11y` and the test that pins it):
no text column at a fixed width, every control labelled, every chip with
its selected state, minimum 14pt captions.

**Web-specific:** the build tag hidden on web, `EXPO_PUBLIC_OFFER_PREVIEW`
never reaching a native build, StoreKit calls guarded.

**How to work it.** For each area: read the tests that exist, write the
scenario table before touching the code, turn each row into a test, run
it, and fix what fails with the smallest change that makes the test pass.
Add the scenario to the simulation when it is a scheduler or pathway
behaviour. Commit per area with a message that says what was wrong and
what is now true, in the style of the branch's history.

**Deliverable.** `docs/QA_REPORT.md`: the scenario tables per area with
pass, fixed or open against each row; the count of tests before and after;
every open row with a reproduction and the reason it is open. The tests
themselves, on the branch.

**Done when** every table has no row without a verdict, the gates are
green, and the test count is materially higher than 908 for reasons the
report can name.

### D. Integration (half a day)

The app is one system. After A, B and C, walk the six integration seams
end to end and write a test for each:

1. Interview answer to profile field to routine to plan item to Today row
   to the reason line, for every deferred answer in `PATH_ANSWER_FOR`.
2. Logged set to metric to baseline to next block's load to the hub's
   number to the level card.
3. Apple Health sleep to readiness to the auto-regulated session to the
   note on the workout screen.
4. A behaviour log to the pattern to the timed intervention on Today to the
   breath session, with Plus off.
5. A goal with a metric target to the milestone ladder to a reading that
   satisfies a rung to the milestone ticking itself and the report.
6. Backup on one state, restore on a clean one, and every one of the above
   still true.

## 5. Severity, evidence and the fix policy

| Severity | Meaning | Policy |
|---|---|---|
| P0 | Data loss, a wrong load or dose, always-free support behind Plus, a crash, anything that would fail App Review | Fix now, test, commit, tell Isaac in the summary |
| P1 | A journey cannot be completed, or completes with a wrong result | Fix in this review |
| P2 | Wrong or confusing on first contact; a departure from the expected outcome | Fix if under an hour, else report with a patch proposal |
| P3 | Polish, wording, spacing | Fix in passing, never at the cost of a P1 |

Evidence for every finding: the commit, the route, the seed or the steps,
a screenshot or a failing test, expected, actual. A finding without a
reproduction is a hunch and goes in a separate list.

Never widen the app to fix a finding. Never disable, skip or quarantine a
test. Never change the free tier, the price, the questions' meaning, or a
practice's grade or safety line without Isaac's word; those are product
decisions and belong in the report as proposals.

## 6. Reporting

Three documents on the branch when you are done, plus this brief updated
with what changed:

- `docs/COMPETITIVE_REVIEW_2.md`
- `docs/USABILITY_REVIEW.md` and `docs/review/round3-report.md`
- `docs/QA_REPORT.md`

And one summary to Isaac, short, in this order: what is fixed, what is
open and why, the round-three numbers against rounds one and two, the three
competitor moves that matter, and what should ship in the first
over-the-air update after approval. Numbers in tables, not prose. No
headers in a message under five hundred words.

## 7. Order of work and budget

| Day | Work |
|---|---|
| 1 morning | Section 2: checkout, gates, web export, one screenshot of every route to prove the pipeline |
| 1 | Workstream A |
| 2–3 | Workstream B, including round three |
| 4–6 | Workstream C, one area per half day, committing per area |
| 7 morning | Workstream D |
| 7 | Reports, the summary, final gates, merge from origin, push |

Commit at least once per half day. Fetch and merge from origin before every
push; the website session is active on the same branch.

## 8. Handover checklist

- [ ] On the branch, at or after `67e94f9`, gates green before starting
- [ ] Web export served, one screenshot per route captured and readable
- [ ] `docs/OVERHAUL_REPORT.md`, `docs/PROBLEM_STATEMENT.md`,
      `docs/POSITIONING_REVIEW.md`, `docs/COMPETITIVE_REVIEW.md`,
      `docs/MARKETS.md`, `docs/RELEASE.md`, `web/CLAUDE.md` read
- [ ] Section 0 acknowledged in the first message to Isaac
- [ ] A, B, C, D each with its deliverable on the branch
- [ ] Test count before and after, in the QA report
- [ ] Nothing published, nothing built, nothing deployed
