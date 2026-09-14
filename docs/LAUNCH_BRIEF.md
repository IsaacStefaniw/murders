# Launch brief — the work between here and 1.0

Supersedes `NEXT_SESSION.md` §§1–2. That brief was written from Isaac's
build-21 notes and was right about every symptom it listed. This one was
written after reading the code those symptoms come out of, and the list is
longer, because most of what is wrong is not on the list of things anyone
has noticed yet.

Isaac's instruction for this round: *"the app needs serious work still …
look at it more holistically and from the position of the world's leading
tech developer creating an incredible app."* So this does not open with
tickets. It opens with the single pattern that produces them.

---

## 0. The diagnosis

**This codebase converts problems into prose.**

When it meets a limitation it writes an exceptionally good comment about
the limitation, commits the comment, and leaves the limitation standing.
The reasoning is genuinely first-rate — better than most shipped health
products will ever have — and it is almost all pointed inward, at other
developers, in files users never see.

Seven instances, each verified in this session:

| What the code says | What the user gets |
|---|---|
| `essential8.ts`: BMI "says nothing about one person's build, and a heavily muscled person will score below where their health sits" | Isaac, at 11% body fat, scored **70** on body mass and was told it was one of his weak components |
| `howTo.ts`: 22 how-tos, written because the library "leaves you at the hardest moment: the first attempt" | `howToFor()` is imported by `app/library.tsx` and nowhere else. The Today detail — the actual moment of need — never calls it |
| `MetricObservation` carries `source` and `at` on every reading | No screen displays either. "Where did it get my BMI from?" |
| `dailyAsk.ts`: a complete model of what to ask and how often — the app's whole engagement loop | **Imported by nobody.** `asksFor()` has zero callers |
| `stress.ts`: a decision document concluding stress "shapes the PLAN" | **Imported by nobody.** It shapes nothing. The standing-decisions list records its conclusion as shipped behaviour |
| `lib/calendar/provider.ts`: "the loop that turns IntentNorth from sophisticated prototype into product" | **Imported by nobody** |
| `PaceCard`: "Add your age in your profile and this starts reading" | There is no age question in the profile. `age` is `deferTo: 'training'` — it is only ever asked inside the Training coach |

2,424 tests pass. They pass because **they test the reasoning, not the
reach.** A test asserting `asksFor()` returns the right questions in the
right order passes forever while no screen calls `asksFor()`. Four modules
in this repo are unreachable from any screen and every one of them is
fully covered.

Everything in §§1–6 below is downstream of this. The structural fix is
§6.1 and it is three hours of work.

---

## 1. The body-mass misread — the sharpest thing in the whole review

Isaac: *"my actual body fat % is around 11% which the app would know if it
had asked."*

This is not a copy problem. It is the app giving a specific real user a
wrong answer about his own body, twice, on two different screens, using a
measurement it already knew was the wrong instrument for him.

**What happened.** `weekHealth()` computes BMI from `body.weight` and
`body.height`, scores it on the published Life's Essential 8 table (25.2 →
70), and — because `biggestGap` picks the lowest-scoring observed
component — is capable of telling a man at 11% body fat that body mass is
where he has the most room. `pace.ts` then folds the same `bmiScore` into
its `le8` component, so the misread drags the markers headline down too.

**What makes it indefensible rather than merely crude.** The app was
already holding a better measurement of the same thing, on the same
screen. `BodyNumbers` computes and displays **waist ÷ height** — a
measure that separates the two things weight alone conflates, which is
`bodyEntries.ts`'s own stated reason for collecting waist. `essential8.ts`
never looks at it. Two cards on the Progress tab, one holding a good body
composition signal and one scoring him badly on a poor proxy, and no wire
between them.

**And the better measure still was never asked for.** There is no body
fat percentage anywhere in the codebase — not a metric key, not a
`BODY_ENTRIES` field, not a HealthKit identifier. `healthkit.ts` requests
seven identifiers and `HKQuantityTypeIdentifierBodyFatPercentage` and
`HKQuantityTypeIdentifierLeanBodyMass` are not among them. Any smart
scale writes the first; a DEXA scan gives both. Isaac has had a scan. The
app would have had the number for free.

### The decision

There is a recorded decision against body-fat **tracking** —
`protocols.ts` line 2515 lists "waist/body-fat/progress-photo tracking" as
deliberately not shipped, because in the dieting pillar a recurring
tracking ritual invites a body-composition ideal. That decision is right
and stands. It is also not what is being asked for. **Accepting a reading
is not shipping a ritual**, and the proof is that waist is already on that
same "not shipped" list and has been a shipped metric, a HealthKit read
and a manual entry field for some time. The comment is stale.

So:

1. **Read body fat and lean mass from HealthKit**, and add body fat % to
   `BODY_ENTRIES`. One field, no schedule, no chart, no streak.
2. **Flag the BMI component as a known misread** when the app holds
   evidence that BMI is measuring the wrong thing for this person — body
   fat below the published healthy ceiling (roughly 25% for men, 32% for
   women) or waist-to-height under 0.5, while BMI is 25 or over. Both
   thresholds are published; neither is invented.
3. **A flagged component is excluded from `biggestGap`.** Telling a lean
   man his biggest opportunity is body mass is the failure mode, and it is
   one line to prevent.
4. **A flagged component drops out of `pace.ts`'s `le8Parts` and counts as
   unread**, widening the interval. This follows the existing rule that a
   component runs only as far as its own paper supports: an instrument
   known to be invalid for this person is not a measurement of this
   person, and pretending otherwise is worse than admitting we did not
   measure it.
5. **The row says so, in the person's terms.** Something like: *"BMI 25.2.
   Your body fat is 11%, so BMI is measuring the wrong thing for you — it
   cannot tell muscle from fat, and on you it reads the muscle as fat.
   Left out of the summary for that reason."*

No new composite. No re-scoring against a table that does not exist. The
published number stays available in the scoring disclosure for anyone
checking our arithmetic; it simply stops being presented as a finding
about a person it does not describe.

---

## 2. The questions the app never asks

Isaac: *"check all the gated questions as well."* Here is the full audit.

The interview has **36 steps. 13 are asked at signup. 23 are deferred**
into the pathway that consumes them — correct reasoning, because nobody
should face 36 questions before seeing anything, and `YourAnswers` exists
precisely because "later" was never arriving for people who never opened
that pathway.

Three things are wrong with how that plays out.

### 2.1 "About you" silently drops a third of what it promises

`YourAnswers` filters `INTERVIEW_STEPS` to `kind === 'single'`, because a
chip row cannot honestly stand in for free text or multi-select. Fair —
but the consequence is that **7 of the 23 deferred questions are
unreachable from the screen whose entire purpose is to make deferred
questions reachable**: `vision`, `household`, `partnerName`, `weight`,
`mind`, `moreOf`, `lessOf`.

The screen's own header says "Every question the app can ask, answerable
at any time." It is not. And `weight` being one of the seven is not
incidental — it is a body measurement gated behind the Nutrition coach,
feeding the same BMI component §1 is about.

**Fix:** render text and multi steps too. A `Field` for text and a
multi-select chip row already exist in `DeferredQuestions`; this is
reusing two components, not building anything.

### 2.2 The flagship instrument is gated behind a question that is itself gated

`paceHeadline()` returns `null` without `age`. `age` is `deferTo:
'training'` **and** `optional: true`. So the markers headline — the thing
the product leads with — cannot render at all for anyone who has not
opened the Training coach and answered an optional question inside it.
And when it fails, `PaceCard` tells the user to "add your age in your
profile", which is not a place that asks for age.

It compounds. `sexAtBirth` is also `deferTo: 'training'`, and grip and
gait cannot score without it. Four more components — `selfRatedHealth`,
`walkingPace`, `smokingStatus`, `drinkingBand` — are all `deferTo:
'recovery'`. **Six of the instrument's ten components and its headline
are gated behind opening one of two specific coaches**, and a person who
opens neither meets an instrument that reads almost nothing and reasonably
concludes the app does not work.

### 2.3 Age is a decade bucket, and the error bars do not know it

This is a measurement defect, not a UX one, and it is the most serious
single finding in this document.

`age` is captured as a **decade midpoint** — `'25'` for 20s, `'35'` for
30s, `'45'` for 40s. The markers headline is
`Math.round(age + yearsEquivalent)`, reported to the year, with an
interval built from four variance terms: component estimation,
attenuation, test–retest (`MEASUREMENT_SE_YEARS = 1.2`), and coverage.

**There is no term for uncertainty in chronological age.** A uniform
decade bucket carries a standard deviation of about 2.9 years — larger
than the test–retest floor for five components combined. Folding it in
properly widens a typical interval by several years.

So `PaceHeadline` honours standing decision #5 — interval and coverage are
non-optional fields — in form while the interval itself is wrong by
roughly a factor of four. The app tells someone "41, give or take 3" off a
baseline it knows only to ±5.

**Fix: ask for a birth year.** One number, one field, exact, and it also
sharpens `fitnessLogHazard(vo2max, age)`. Until then, the age-quantisation
term must be added to the budget and the headline must stop claiming years
it cannot resolve. Both, ideally — the term should stay for anyone who
declines to give a year.

### 2.4 What should replace the gating model

Not "ask everything at signup". The right model is already written, in
`dailyAsk.ts`, and wired to nothing (see §6):

- ask at the rate the thing actually moves;
- never ask for anything Apple Health already supplies;
- at most two questions a day.

Extend it to take the deferred interview steps as a source, ranked by
**what each one unblocks**. Then a question gets asked because it unlocks
something the person can see is locked — not because they happened to
tap the right coach. And show the lock with its key attached: *"This reads
6 of 10 markers. Two questions would make it 9,"* with the two questions
right there.

---

## 3. The unit of communication — decided

Isaac, on the wellbeing overview: **"These scores are meaningless."** He
was looking at *Physical activity 60 · Nicotine 50 · Sleep (no data) ·
BMI 70*.

He is right, and `NEXT_SESSION.md` was right that the fix is not more
explanatory copy — there is already a "Why nicotine is in this" disclosure
under every row and it changed nothing. Here is the decision.

### Why a numeral is the wrong unit

Three separate faults, only one of which explaining harder could touch.

1. **No anchor.** A 0–100 reads as a school mark, so it lands as a verdict
   on the person. It is not one. It is a *position on a step function*.
   60 does not mean sixty per cent of anything; it means "between 60 and
   89 minutes".
2. **False commensurability.** Side by side in identical bars the
   components look like the same kind of thing. Activity 60 is one
   half-hour walk from 80. Nicotine 50 is *four more years of not smoking*
   from 75. Same bar, same visual gap, wildly different things to be told.
3. **No verb.** Every row was a noun.

### What replaces it

A sentence carrying the three things the numeral threw away: **what was
measured**, in the person's own units; **where the published threshold
sits**; and **what the distance between them costs.**

```
Physical activity
65 minutes of training the app saw this week.
Another 25 minutes reaches 90, the next step on the published
table. Full marks at 150 minutes a week.
From sessions you marked done; hard cardio counts twice.

Nicotine
You quit between one and five years ago.
Passing five years clear is the next step, and it is worth 25
points — the largest single step anywhere in this measure.
```

The numeral moves into the scoring disclosure, beside the table it came
from and the person's position on it, where anyone checking the arithmetic
can find it and nobody else has to.

### The composite and the band come off the card

Currently the card prints the mean of the four observed components and
labels it *"Intermediate on the American Heart Association's scale, where
75 and above is high and under 50 is low."*

Those cutoffs are published for the **eight**-component mean. Applying
them to a four-component mean and printing the Association's name beside
the result is precisely what `essential8.ts`'s own header forbids — *"it
is not a Life's Essential 8 score and must never be presented as one"* —
so this is not a new opinion, it is the module's recorded decision being
enforced against the card that broke it.

And the four-of-eight mean is not merely a noisier estimate of the eight.
It is a **biased** one: the four missing are diet, lipids, glucose and
blood pressure, systematically the ones a person is most likely to be
doing badly on without knowing.

What replaces the headline: what was read, what was not, and the one move
with the most published room behind it.

> *The most room is in physical activity — 65 minutes this week, against
> 150 for full marks. Four of the eight measures read; the four that
> cannot be are below.*

Nothing evidential is lost. The dose-response claim survives per
component, because each component's published table **is** what the
construct scores. "150 minutes a week is full marks on a measure with a
linear dose-response to mortality" is licensed. "You are a 60" never was.

---

## 4. Make the instrument complete

The largest capability gain available, and mostly published tables plus
data entry.

**4.1 The blood panel.** Diet, lipids, glucose and blood pressure are four
of eight in Life's Essential 8, and three of them are a panel many people
already have in a drawer. Adding entry screens and the published scoring
functions takes the wellbeing instrument from 4-of-8 to 7-of-8, and the
three added are where a large share of the risk actually sits.

Two traps to get right:

- **Units.** Lipids and glucose are mmol/L in Australia and mg/dL in the
  US. A silent unit mismatch is a confident invisible error in exactly the
  components that matter most. Store the unit with the reading; never
  infer it from locale.
- **A panel is a dated event, not a current value.** A cholesterol result
  from 2023 should read as a 2023 result, with its age visible, not as
  today's number. This is §5's provenance requirement, and here it is
  load-bearing rather than nice.

**4.2 Blood pressure** is a cuff, free at any pharmacy, and the single
largest contributor to cardiovascular risk at population level. It needs
systolic, diastolic, a date, and a note on whether the person is on
medication — the published table scores treated and untreated differently.

**4.3 Diet** is the one that genuinely needs a questionnaire, and the
honest move may be to leave it unread rather than approximate it. Decide
deliberately; do not let it default.

**4.4 Body composition** — §1.

**4.5 Social connection.** `stress.ts` flags this at the bottom of its own
header and it has been sitting there unactioned: Holt-Lunstad's
meta-analysis covers over three million people and puts social isolation
at about +29% all-cause mortality, loneliness +26%, living alone +32%.
That is larger than job strain, better replicated than perceived stress,
and **the app already runs connection ladders it could read from.** It is
better evidenced than several components already in the instrument. It is
the next component to add and nobody expects it.

---

## 5. Provenance, everywhere

*"Where did it get my BMI from?"* is not a bug report about BMI. It is a
person correctly declining to trust a health figure whose origin the app
will not state — and the app **knows**: every `MetricObservation` carries
`source` (`healthkit` / `user` / `derived` / `integration`) and `at`.

**The rule:** every derived number on every screen can say what it was
computed from, where each input came from, and when each was read.

> *Height 180 cm, entered by hand on 1 January. Weight 81.6 kg, from Apple
> Health on 13 September.*

This is the cheapest trust the product will ever buy, and it becomes
mandatory the moment §4 lands, because a two-year-old cholesterol result
presented as a current one is a different and worse failure than an
unexplained BMI.

---

## 6. Loops built and never connected

**6.1 A reach test, in CI — do this first.** No feature module ships
unreferenced from any screen. The script that found the four below took
twenty minutes to write and belongs in the suite permanently; it is the
only durable answer to the §0 pattern, because it makes the failure mode
impossible to commit rather than merely regrettable. Allow an explicit
opt-out list for the simulation harness.

**6.2 Wire `dailyAsk.ts`.** The daily-question cadence — the app's entire
engagement loop, the thing that makes it a daily product rather than a
weekly dashboard — is written, argued, tested and called by nobody. The
nightly sleep-timing question is the highest-value single ask in the
product: two clock times give both duration (which LE8 scores) and
regularity, which beat duration as a mortality predictor across 60,977
people and **cannot be recovered later from an average**. Every night it
is not asked is a night of that series permanently lost.

**6.3 Wire `stress.ts`, or stop claiming it.** Standing decision #6 says
stress is "asked, used for planning, and not scored". The first and third
are true; the second is not, because nothing imports the module. Either
connect it to the planner or amend the decision — but an entry in
"decisions that must not be relitigated" describing behaviour the app does
not have is worse than either.

**6.4 The calendar loop.** `lib/calendar/provider.ts` names the loop that
turns this from a prototype into a product — *calendar → planner → Today →
Move → calendar update* — with the acceptance test already written in its
header: a meeting lands at 12:00, the workout no longer fits, the app
notices, proposes 4:30, the user accepts, both plan and calendar update.
`generateDailyPlan` already accepts events. The provider is a null
implementation and nobody imports it. This is the largest single leap in
perceived intelligence available, and most of the work is done.

**6.5 `lib/context/location.ts`** is the same story at lower stakes.
Decide whether it is in or out for 1.0 and delete it if it is out.

---

## 7. Today does not answer its own question

`(tabs)/today.tsx` can render **16 distinct card-level blocks**, plus 8
inline `Card`s, 7 `SectionHeader`s and roughly 30 text blocks, on the
screen a person opens at 6:40am to find out what to do now.

Every one of those blocks is individually well-argued. Together they are a
wall, and "the app needs serious work still" is what a wall feels like.

**The rule Today should follow: one job — the next action.** Concretely:

1. **One "now" block.** What is happening, or what is next, with the one
   control that matters.
2. **The day's list**, scannable, nothing above it.
3. **At most one interruption**, chosen by a single arbiter.

The arbiter already exists — `commitmentBudget` / `mayOffer` in
`features/budget/commitment` — and currently governs offers only. Extend
it to *every* interrupting card: readiness, check-in, suggestion, trial
review, ritual, tonight, budget, Plus nudge, welcome-back. One slot, one
winner, everything else waits for a day it is the most important thing.

**And a copy rule to go with it: the first line does the work.** The
writing in this app is genuinely excellent and there is far too much of it
on screen at once. Every card's first line should be a complete answer on
its own; everything else goes behind a disclosure. That is a mechanical
edit across roughly forty components and it will do more for how the app
*feels* than any single feature here.

---

## 8. Smaller, confirmed, still real

- **§2.1 — how-tos at the moment of need.** `howToFor()` reaches
  `library.tsx` only. Thread it through `guidanceFor()` into
  `ItemGuidanceView` so the Today detail shows it. Small, and it is the
  literal answer to *"no explanation for fibre meals?"*
- **§2.2 — day navigation.** *"I can't remember what was or wasn't
  included but I need to check."* Today is today-only. The morning
  check-in already reads yesterday's leftovers, so the data path exists;
  what is missing is the ability to look. Distinct from the backdating
  already shipped.
- **§2.5 — the pre-test. Verified: no work needed.** `app/answers.tsx`
  exists and is linked from Settings under "About you". Isaac was on build
  21; it landed in 22. **But** it is three taps deep behind Settings and
  named after a concept rather than an action, which is most of why he
  could not find it — and per §2.1 it is also incomplete. Surface it from
  Progress, where the locked measurements are.

---

## 9. §2.3 — weekly quantities: decided

*"Can I easily add in number of drinks or vaping occasions for a week?"*

`BehaviourLog` refuses a quantity on purpose: *"a number here would become
a total, a total would become a chart, and the chart would be a
restriction scoreboard aimed at the people least well served by one."*
That objection is sound and it is **specifically about a daily running
tally displayed back as a score.**

What Isaac is asking for is not that. A weekly standing number — "how many
in a usual week" — is a **measurement**, and the app already collects one:
`drinkingBand`, asked once during onboarding, never updatable, coarser
than the thing it is estimating, and feeding a published guideline
comparison and a `pace.ts` component.

**The resolution: a weekly quantity is a measurement; a daily tally is a
scoreboard. Ship the first, keep refusing the second.**

- Replace the one-shot `drinkingBand` with a weekly figure that can be
  updated, entered at most once a week.
- Display it only against the published guideline (NHMRC: no more than ten
  standard drinks a week, no more than four on any day). Never as a
  streak, never as "days clean", never as a trend line down.
- Same shape for vaping occasions, with the caveat `essential8.ts` already
  states: the published nicotine table scores *status*, not count, so a
  weekly count improves the guideline comparison and the conversation, and
  changes the LE8 component not at all. Say that rather than implying the
  number moves a score it does not move.

This also retires a real inconsistency: the app currently refuses to let
someone record how much they drink while scoring them on a one-off
estimate of exactly that, made before they had any reason to be accurate.

---

## 10. Sequence

Ordered by what unblocks what, not by size.

**First — stop the bleeding (days, not weeks)**
1. §6.1 reach test in CI. Everything else regresses without it.
2. §1 body composition: HealthKit reads, manual entry, misread flag,
   `biggestGap` exclusion, `le8Parts` exclusion.
3. §2.3 birth year, and the age-quantisation term in the error budget.
4. §3 unit of communication: per-component sentences, composite and band
   off the card.

**Second — make it worth opening (the daily product)**
5. §6.2 wire `dailyAsk.ts`; nightly sleep-timing question live.
6. §7 Today reduced to one job, one arbitrated interruption.
7. §2.1 "About you" renders text and multi steps; surface it from
   Progress.
8. §8 how-tos in the Today detail; day navigation.

**Third — make the instrument whole**
9. §4.1–4.2 blood panel and blood pressure entry, with units and dates.
10. §5 provenance on every derived figure.
11. §4.5 social connection as a component.

**Fourth — the leap**
12. §6.4 the calendar loop.

**Standing, throughout**
- §7's first-line rule applied as each card is touched.
- §6.3 resolve stress.ts either way.
- §6.5 decide location in or out.

---

## 11. Standing decisions — amended

`NEXT_SESSION.md` §3 listed eight. They hold, with three amendments earned
by argument rather than opinion:

- **#4 — "a component runs only as far as its own paper supports"** now
  also means a component drops out when the app holds evidence it is
  invalid for *this person*. See §1.
- **#5 — "interval and coverage are non-optional"** is necessary but was
  not sufficient: an interval that omits a known error term is a confident
  wrong number wearing the uniform of an honest one. The budget must
  account for every quantised or self-reported input, age included. See
  §2.3.
- **#6 — "stress is asked, used for planning, and not scored"** is
  currently false in the middle clause. §6.3.

And one added, which is the whole of §0:

- **#9 — A limitation written down is not a limitation handled.** Prose
  about a defect, however well argued, is not a mitigation of it. If the
  right answer is to accept the limitation, the user has to be able to see
  the reasoning on the screen where it bites — not in a header comment
  addressed to whoever reads the file next.

---

## 12. Launch state

- Branch `claude/rename-murders-folder-goh5q0` is the repo default; pushing
  to it ships to trunk. No merge step.
- 2,424 tests, tsc and eslint clean, on this session's baseline.
- Rejected twice (2.1(b), then 2.3.8 icon). Icon fixed. **Not resubmitted.**
  A resubmission needs a fresh build with `EXPO_PUBLIC_MARKERS` **off**.
- Builds 20–23 internal TestFlight, markers on. From 23 the Settings screen
  carries its build tag.
- Standing instruction: no OTA publish, no App Store submission without
  explicit say-so.

**Two open questions for Isaac, neither blocking:**

1. **The tab bar has no icons** — four words, by deliberate design. It is
   handsome and it is a real deviation from what iOS users scan for.
   Worth one round of testing against an iconed version before 1.0 rather
   than after.
2. **Diet (§4.3)** — approximate it from what the app already sees, or
   leave it honestly unread? The instrument is defensible either way, and
   this is a product call rather than an evidence one.

---

*A closing note on where the risk lives. Every defect in Isaac's build-21
list was found by one person using the app on a phone for an afternoon.
None was found by 2,424 tests. Everything in this document was found by
reading the code against that afternoon's complaints. Neither method is
the one that is missing: what is missing is anybody using the real
screens, on a real phone, with a real week of data behind them, before the
build goes out. Do a render-and-walk early next session, and make it a
standing step.*
