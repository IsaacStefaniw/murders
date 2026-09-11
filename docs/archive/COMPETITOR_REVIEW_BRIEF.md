> **ARCHIVED — a record, not guidance.**
> Superseded by `docs/COMPETITIVE_REVIEW_3.md`.
>
> The brief that commissioned the third sweep. The sweep exists; the brief is spent.
>
> Do not act on this document. See `docs/DOC_LIFECYCLE.md`.

# Competitor review brief, for a session with real web access

Written 2026-09-07 for a separate session whose network can reach vendor
sites and the App Store. The last two sweeps (`docs/archive/COMPETITIVE_REVIEW.md`,
`docs/archive/COMPETITIVE_REVIEW_2.md`) were done from a container whose proxy
blocked every vendor site and apps.apple.com, so their prices and trial
mechanics are search-sourced and marked unverified. This brief is the
verified pass. Its output feeds two live decisions: whether Plus gets a
free week or a free first session, and whether a single-coach price
exists. It is research, not a build task. Do not edit code.

## What IntentNorth is, in one paragraph

An iPhone app. A twelve-question interview builds a profile; seven coaches
(training, nutrition, money, work and leadership, habits and urges,
relationship, family) each run a program of practices drawn from a graded
library (evidence A to E, source named, where it stops), and a scheduler
places them into the person's actual days and moves them when the day
changes, saying why. Free forever: the interview, the day's shape, the
habits you already have, every urge and reset tool, breathing, a full view
of every program. Plus runs the coaches: A$14.99 a month, A$89.99 a year,
A$249 once. No account, nothing leaves the phone. Made in Brisbane. The
problem it solves, in the customer's words, is in
`docs/PROBLEM_STATEMENT.md`; read that first.

## Non-negotiables for this session

- Read only. Do not edit code, docs other than the one deliverable, or
  anything under `web/`.
- Never fabricate. A claim about a competitor has a URL, a screenshot, or
  is marked unverified. A price is the one the Australian App Store or the
  vendor's AU page shows, in A$; if only USD is shown, say so.
- Where a free trial exists, start it only if it can be cancelled inside
  the session; otherwise read the paywall and record what it says.
- No model identifiers in the document. Plain English.
- Push only to `claude/rename-murders-folder-goh5q0`, one file:
  `docs/COMPETITIVE_REVIEW_3.md`. Fetch and merge before pushing; other
  sessions push to the same branch.

## The set

One deep pass on each, as a paying user for the first three days where
the trial allows it, not as a feature-list reader.

| Category | Apps | Why they matter to us |
|---|---|---|
| Whole-day planners | Sunsama, Motion, Reclaim, Structured, Akiflow | Carry-over ritual, learned durations, calendar reads, the shutdown, how they price a "planner" |
| Training | Hevy, Strong, Fitbod, JuggernautAI, Boostcamp | Session swap, exercise substitution, rest timer, progression rules, Watch, how they price |
| Recovery and readiness | Whoop, Rise, Athlytic, Gentler Streak, Bevel | Sleep debt, exertion target, a bad night changing the day, hardware lock-in |
| Habits and urges | Fabulous, Streaks, Finch, I Am Sober, Reframe, Quit Genius, one sec | The moment of the urge, lapse recovery, streak psychology, what is behind the paywall |
| Mind | Headspace, Calm, Balance, Waking Up | First session, voice, progression, Balance's free first year |
| Food without logging | MacroFactor, Noom, Australian meal planners (Dinnerly, HelloFresh's app, Cookidoo) | Protein target, dinner decided once, shopping list, allergen handling |
| Money, Australia | Frollo, WeMoney, Up, Raiz, Spriggy, the big-four bank apps' goal features | Named goal with a date, automation on payday, the buffer before investing, weekly check-in |
| Family and relationship | Cozi, TimeTree, Skylight, Paired, Lasting | Shared calendar, one-on-one time, the weekly check-in, how a couples app prices |

## The twelve dimensions, recorded per app

1. Five-second test: what is it, who is it for, what would I do next, from
   the App Store listing alone.
2. Time to first value: minutes from install to something useful.
3. Day two: what it shows a returning user.
4. A bad day: short night, meeting on the walk, skipped session. What
   changes, and does it say why.
5. What is free, exactly, and for how long.
6. The paywall: when it appears (install, after onboarding, day two,
   feature tap), what it says, what it costs in A$ monthly, yearly and
   lifetime, whether there is a trial and how long, whether the trial
   needs a card.
7. Single-feature or tiered pricing: does anyone sell one part of the
   product separately.
8. What happens to a person who never pays, a month in.
9. Evidence: does it show any grade, source or study for what it
   prescribes. Screenshot.
10. Privacy: account required, data leaving the device, what the App
    Store privacy label says.
11. The one thing it does better than IntentNorth.
12. The one thing IntentNorth does that it cannot.

## Three questions the review must answer, with evidence

1. **Trials.** Across the set, how many offer a free trial of the paid
   tier, how long, card up front or not, and what the paywall says on the
   day the trial ends. Our round-three review found a free week or a free
   first Plus session was the single most requested change among people
   who said "maybe" to paying (`docs/archive/USABILITY_REVIEW.md`, round three).
   Isaac's current model is pay from day one (`docs/MONETISATION.md`
   revision 3). The review should say, with the field's numbers, what a
   free week would cost and buy.
2. **Single-coach pricing.** Does anyone in the set sell one module of a
   broader product separately, at what price, and how do they gate it in
   the app. Our reviewers who wanted only Money or only Relationship asked
   for this. Our entitlement is app-wide today.
3. **Evidence on screen.** Does any competitor show an evidence grade or a
   source for a practice. We believe none do. Prove it or correct it.

## Deliverable

`docs/COMPETITIVE_REVIEW_3.md`, in this order:

1. The matrix: eight categories against the twelve dimensions, one row
   per app, verified cells marked with a source, unverified cells marked.
2. The three answers above, each in under three hundred words with the
   evidence.
3. A pricing table: every app, A$ monthly, yearly, lifetime, trial length,
   card up front, single-feature option.
4. Five things to build over the air before growth, each with what it
   closes and a cost guess in days; five that need a native build; three
   things to say louder because nobody else has them. Check these against
   `docs/archive/COMPETITIVE_REVIEW_2.md` sections 3 to 5 and say what changed.
5. What the last two sweeps got wrong, cell by cell.
6. Sources, one URL per claim.

## What already exists, so nothing is repeated

- `docs/archive/COMPETITIVE_REVIEW.md` and `docs/archive/COMPETITIVE_REVIEW_2.md`: the two
  earlier sweeps. Read them; do not restate them.
- `docs/archive/USABILITY_REVIEW.md` and `docs/review/round3-report.md`: what a
  hundred personas said about our paywall and price.
- `docs/archive/COACH_VALUE_REVIEW.md`: what each coach does now, so the
  comparison is against the current build, not last week's.

Done when Isaac can read the pricing table and the three answers in five
minutes and make the trial and single-coach decisions from them.
