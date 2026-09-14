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

## 5. What calibration actually requires

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

## 6. Open questions for Isaac

**6a. Does this surface as a number at all?** The engine is identical
either way, so it has not blocked the build — but it is the decision that
most affects whether this helps people or harms them. Three options, in my
order of preference:

1. **No composite on screen.** Show the components, each with its
   provenance, and the pace only once there is a real series. Safest,
   least marketable, most consistent with everything the app already does.
2. **Composite shown, heavily qualified**, as `essential8.ts` does it —
   coverage stated every time, "provisional" attached, never called an age.
3. **A headline number.** Marketable, and the thing that puts us in the
   category we are trying not to be in.

**6b. Regulatory.** Under the TGA, software that predicts disease risk can
be a medical device. Framing matters materially: a reading with named
components, observational caveats and no diagnostic claim sits much more
safely than "your heart age is 52". Worth a proper opinion before anything
ships publicly, not after.

**6c. The research arm is a different company function.** Consent, ethics
approval, a registered analysis plan and an external statistician are not
things to bolt on later — the data collected before they exist is largely
unusable for publication. If the research ambition is real, the consent
architecture should land before the cohort does, not after.

---

*Nothing in this document or the module it describes is medical advice, and
no instrument here diagnoses anything.*
