# The Pace Instrument

A metric IntentNorth compiles, owns the calibration of, and publishes the
formula for.

Status: **provisional**. Every coefficient in `src/features/health/pace.ts`
is borrowed from somebody else's cohort. `PROVISIONAL` stays `true` until
they are fitted on our own people against observed outcomes, and nothing
renders the instrument without saying so.

---

## 1. The problem with the category

Isaac's framing was exact: *"proprietary scoring or supporting is similar
to other offerings suggesting people's biological age."* That category
divides cleanly, and it is worth being precise about where the line falls.

**Research-grade, laboratory required.**

| Instrument | Needs | What it is |
|---|---|---|
| PhenoAge (Levine 2018, *PLOS Medicine*) | 9-analyte blood panel | Trained on NHANES III mortality, validated in NHANES IV. Predicts all-cause and cause-specific mortality after adjusting for chronological age. |
| GrimAge (Lu 2019) | DNA methylation array | Best-performing epigenetic clock for mortality. |
| DunedinPACE (Belsky 2022, *eLife*) | DNA methylation array | Derived from within-person decline in 19 organ-system indicators across two decades of the Dunedin birth cohort. Reports a *rate*. |

**Consumer-grade, no laboratory.** Very largely a weighted questionnaire
with an age-shaped number on the end. The weights come from somebody's
judgement, the output has never been validated against an outcome, and the
owner cannot explain why the number moved. It is easy to build and worth
nothing.

Shipping the second kind would cost the one thing that differentiates this
product. The app has refused invented composites twice already, on the
record, in `BehaviourLog` and in `essential8.ts`. A third refusal is not
available — we would simply be doing the thing we said we would not.

## 2. The three decisions

Each is the inverse of what the consumer category does.

### 2.1 A rate, not a state

DunedinPACE's framing: biological years accrued per calendar year, 1.0
being ordinary. Better on both counts that matter.

- It does not claim to know an absolute nobody can measure.
- A rate responds to what somebody did this month. An age does not.

*"You are 52 when you are 45"* is not actionable. *"You are travelling at
1.15, and here is which of the modifiable things is setting it"* is.

The instrument therefore has two readouts, and they are different objects:

- **`yearsEquivalent`** — cross-sectional. Where the measured markers sit,
  expressed in years via the Gompertz mortality-rate doubling time of ~8
  years. Any competitor can compute this.
- **`pace`** — longitudinal. How `yearsEquivalent` is moving per calendar
  year. Requires a repeated series. **This is the asset.**

### 2.2 Weights from published hazard ratios

Every component carries a `Provenance` record: study, journal, sample,
design, effect size, evidence grade, and the caveat that would most easily
make it wrong. Contributions are log hazard ratios taken from those papers.

Adding a component means adding a citation. That is what "compile and
compound from many studies" has to mean in code if it is to mean anything,
and it is why the formula can be published without losing anything.

| Component | Source | Effect used |
|---|---|---|
| Grip strength | Leong 2015, *The Lancet* (PURE) — 139,691 people, 17 countries | 16% higher all-cause mortality per 5 kg decrement; outperformed systolic BP |
| Ten-second stand | Araujo 2022, *BJSM* — 1,702 adults 51–75 | ~80% higher all-cause mortality on failure, after adjustment |
| Walking speed | Studenski 2011, *JAMA* — 34,485 adults pooled from 9 cohorts | Predicted survival at every age; at 75, 10-year survival spanned 19%–87% |
| Cardiorespiratory fitness | Mandsager 2018, *JAMA Netw Open* — 122,007 adults | Elite vs lowest ≈ 80% lower mortality, no upper limit |
| CV health behaviours | Life's Essential 8, *Circulation* 2022 + cohort validations | ~20% lower all-cause mortality per 10 points |

### 2.3 The moat is the calibration, not the formula

Give the formula away. What cannot be copied is the **data shape**.

Every cohort in the table above has a baseline questionnaire and years of
follow-up. This app has *what a person actually did on each individual
day* — planned, completed, displaced, swapped, skipped — against function
tests repeated quarterly. Nobody has that pairing at daily resolution.

That is the research contribution, and the only durable asset here.

## 3. What is wrong with it, stated plainly

Summing log hazard ratios across studies is a modelling choice with four
known problems. The instrument is not worth shipping unless it says so.

1. **Different populations.** PURE is 17 countries, median 4 years of
   follow-up. Araujo is 1,702 Brazilians aged 51–75. Their hazard ratios
   are not strictly commensurable.
2. **Different adjustment sets.** Each paper adjusted for what its authors
   chose. Two components adjusted for different confounders cannot simply
   be added.
3. **Correlated predictors.** Grip, gait and chair-stand overlap. Summing
   them counts the shared part several times, inflating the total.
4. **Reverse causation.** Undiagnosed illness makes people slow and
   unsteady before it kills them. Some of every association here is the
   disease showing up in the test.

`ATTENUATION = 0.6` is a blunt correction for (3) and a partial one for the
rest. **It is a judgement, not a finding**, and it is the single largest
source of error in the module. It is a named exported constant precisely so
that it can be argued with and replaced.

## 4. Design rules, enforced by tests

These are in `src/features/health/__tests__/pace.test.ts` and fail the
build when broken.

- **Nothing is rewarded for being exceptional beyond what the paper
  supports.** PURE reports a decrement effect; reading it backwards as an
  unbounded bonus for a strong grip is an extrapolation it does not carry.
  Grip above the threshold contributes zero, not a negative.
- **Binary studies produce binary components.** Araujo tested pass/fail at
  ten seconds. Eleven seconds and forty seconds are the same result here.
  Inventing a dose curve is exactly the move the module exists to avoid.
- **Extrapolation is capped.** Gait speed is capped at 1.4 m/s, past which
  the cohorts thin out.
- **The reference is a healthy person, not an average one.** 1.0 means "no
  added hazard from anything measured".
- **Coverage is always stated.** A two-component reading may never pass as
  a whole one.
- **`FORBIDDEN_CLAIMS`** — phrases that may not appear anywhere: *your
  biological age is*, *reverse your age*, *you will live*, *life
  expectancy*, *clinically proven*.
- **`FORBIDDEN_SELF_CLAIMS`** — *validated*, *proven*, *precise*, *your
  true*. Permitted about published instruments ("the SPPB is validated in
  older adults" is a true sentence about thirty years of work), forbidden
  about ours until `PROVISIONAL` is false.

## 5. Day one: the questionnaire

*"Can the pre questionnaire help you land in this bucket then? and show
improvements... people are not starting from 0."*

That is the correction the instrument needed. Somebody opening the app is
not **unmeasured**, they are **unasked** — they arrive carrying thirty
years of training or thirty years of smoking, and greeting that with
"nothing measured yet" is both useless and untrue.

Two questions carry most of what can be had for free, and both look like
small talk:

| Question | Source | Effect |
|---|---|---|
| **Self-rated health** — "in general, how would you say your health is?" | DeSalvo 2006, *J Gen Intern Med* — 22 pooled cohorts | vs excellent: good 1.23, fair 1.44, **poor 1.92** — and it survives adjustment for comorbidity, function, cognition and depression |
| **Usual walking pace** — slow / steady / brisk | Yates & Celis-Morales 2017, *Eur Heart J* — 420,727 UK Biobank participants | slow vs brisk 1.31–2.16 depending on body-mass tertile |

Self-rated health is the most striking finding in the module: one
question, no equipment, and it outperforms much of what a longevity panel
measures. People know something about themselves that no lab result
contains.

Walking pace is a **proxy** for the measured gait test, which means
somebody has a mobility reading from day one.

Four levels of self-rated health, not the usual five — DeSalvo reports
pooled risks for exactly excellent / good / fair / poor, and interpolating
a fifth would put an invented number beside four real ones.

### 5.1 Proxies are proxies

Every questionnaire component is marked `self-reported` and carries a
wider interval (`SELF_REPORT_SE_MULTIPLIER = 1.6`). When the measured
version arrives it **replaces** the proxy rather than averaging with it —
two instruments answering the same question at different precision should
not be blended; the better one takes over.

## 6. Showing improvement without lying about it

This is the one trap in the feature, and it has its own module
(`progress.ts`).

**The scenario.** Somebody answers two questions at signup and reads 48. A
fortnight later they buy a dynamometer, do the four tests, and read 43.

Nothing about them changed. They did not get five years younger in a
fortnight. The figure moved because the instrument stopped guessing.
Reporting that as *"you improved by 5 years"* would be a lie the person
has no way of catching — and a lie with a particular shape: flattering,
arriving early, and caused entirely by the user doing something the app
asked them to do. That is the exact structure of a metric built to make
people feel good rather than to tell them anything.

**So every movement is attributed.** Between any two readings each
component moved for exactly one of three reasons, kept separate all the
way to the screen:

| Kind | Meaning | May be called improvement? |
|---|---|---|
| `sharper` | Was blank and now has a value, **or** was asked and is now measured | **No** |
| `changed` | Same component, same kind of measurement, different value | **Yes** — the only case |
| `lost` | Had a value, no longer does | No — and shown rather than silently widening the interval |

The headline splits into `yearsFromChange` and `yearsFromMeasurement`,
which sum to the total. Only the first is ever congratulated.

One case was found by a test and is worth noting: somebody can measure two
new markers that both read *at reference*. The figure does not move at all,
so the naive copy is "nothing has moved" — true about the number, wrong
about the reading, because the interval just got tighter. Measuring more
and finding nothing wrong is a result, and the copy now says what it
bought.

### 6.1 Why this is also the better product

*"You are 2 years better on the markers, and 3 years of the move is just
us knowing more"* is a sentence almost no health app would write. It is
also the sentence that makes the 2 believable. An app that has visibly
refused to take credit for the 3 has earned the right to be believed about
the 2.

## 7. What calibration actually requires

From `CALIBRATION_REQUIREMENTS`, in code so the distance to done is visible
to anyone reading the module.

1. Function tests on a fixed schedule, so within-person change is measured
   rather than inferred.
2. The daily behavioural record — the part no cohort study has.
3. **An outcome to fit against.** Mortality is not available to us at any
   plausible scale. The realistic targets are incident diagnosis,
   hospitalisation, and measured change in the function tests themselves.
4. Separate, revocable consent for research use, held apart from consent to
   use the app.
5. An external statistician and a registered analysis plan, written before
   the data is looked at.
6. Enough people, for long enough. **This is years, not quarters.**

## 8. The presentation decision

**Decided: a headline number.** Isaac chose it over showing components
alone or a heavily qualified composite.

Built with one engineering constraint that follows from the figure's real
uncertainty: `PaceHeadline` makes `plusMinus` and `coverage` **non-optional
fields**, so there is no code path that hands a caller the number without
what it is worth. The interval renders beside the figure at body size, not
behind a tap.

That is not a compromise on the decision — it is the better version of it.
The interval narrows visibly as somebody measures more, so the honest thing
and the engaging thing coincide:

| Markers read | Interval | If all five measured |
|---|---|---|
| 1 of 5 | ±11 years | ±10 |
| 3 of 5 | ±8 years | ±5 |
| 5 of 5 | ±6 years | ±6 |

*"Give or take 8, or about 5 if you do the other two tests"* is a better
call to action than any bare number, and it is true.

### 6.1 Where the width comes from

Four sources, combined in quadrature, all exported so they can be argued
with. None is a published quantity; each is a stated approximation chosen
to be honest about width rather than flattering.

1. **Component estimation error** — approximated from evidence grade
   (`GRADE_RELATIVE_SE`), since we do not hold every published CI.
2. **`ATTENUATION` uncertainty** — it is a judgement, so it carries error
   proportional to what it shrinks (`ATTENUATION_RELATIVE_SE = 0.25`).
3. **Test–retest error** (`MEASUREMENT_SE_YEARS = 1.2`) on each marker
   actually read. This one matters: without it the interval collapses for
   somebody sitting at every reference level, because estimation error is
   proportional to effect size and the effect is zero. A measurement is not
   certain for having come out average. It also sets the floor — five
   markers at this floor is about ±5 years, and the instrument never claims
   better.
4. **Coverage** (`UNREAD_COMPONENT_YEARS = 2.5`) per marker not read.

### 6.2 Sharing

`paceShareText` puts the interval, the coverage and the caveat in the
**body** of the shared message, not behind a link. A number that leaves the
app loses its screen and with it every qualification underneath. The shared
text is longer than a boast, deliberately: if the shareable artefact is not
the honest one, there was no point being honest on screen.

### 6.3 Naming

The card is headed **"Your markers"** and the copy reads *"your markers sit
where a 43-year-old's usually do"* rather than *"your IntentNorth Age is
43"*. Same number, same prominence, same shareability — it just does not
assert that we measured an age, which we did not. Say the word if you want
the branded name instead; it is a one-line change and the tests that would
need revisiting are named in §4.

**6d. Regulatory.** Under the TGA, software that predicts disease risk can
be a medical device. Framing matters materially: a reading with named
components, observational caveats and no diagnostic claim sits much more
safely than "your heart age is 52". Worth a proper opinion before anything
ships publicly, not after.

**6e. The research arm is a different company function.** Consent, ethics
approval, a registered analysis plan and an external statistician are not
things to bolt on later — the data collected before they exist is largely
unusable for publication. If the research ambition is real, the consent
architecture should land before the cohort does, not after.

---

*Nothing in this document or the module it describes is medical advice, and
no instrument here diagnoses anything.*
