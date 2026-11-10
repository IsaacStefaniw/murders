# Day one — 10 November 2026

*"especially improvements, how much younger I am metabolic age"*

Born **1988**, so **38** on the repo's own method
(`ageOf`: the calendar year minus the birth year, which carries about
half a year of error because a person is somewhere inside their birth
year).

This is the baseline. It is not flattering and that is the point: an
improvement needs a before, and today is the before.

---

## The first number it gave me was wrong, and it was wrong the nice way

Running the instrument on his profile returned **−6.5 years** — six and
a half years younger than 38.

**It was an artefact of one night's sleep.** `readPace` builds its Life's
Essential 8 composite from whichever parts it can see, and the gate read
`le8Parts.length > 0`. So:

| step | value |
| --- | --- |
| one night, 8.5 hours | `sleepScore` = **100** |
| mean of one part | **100 out of 100** |
| `le8LogHazard(100)` | **−1.1157** |
| through the Gompertz doubling time | **−12.9 years** |
| after `ATTENUATION` of 0.6 | **−7.7 years** |

**One eighth of a composite, reported as a perfect cardiovascular
profile, paying out seven and a half years.** Nothing else in the reading
came close, so a single good night was the whole answer.

It matters here more than on the Essential 8 card, because this
component is one of only two in the instrument allowed to go **negative
without limit** — Essential 8 is validated as linear across its full
range, so being excellent earns credit rather than merely avoiding a
penalty. A component that can pay out unboundedly must not be computed
from one eighth of itself.

### The first fix was worse, and my own test hid it

I set the floor to `essential8.BAND_MIN_COMPONENTS`, which is **4**,
because reusing the existing named constant looked like the disciplined
move. **There are only three parts to have.** `readPace` scores activity,
sleep and body mass and nothing else — nicotine is excluded to avoid
double-counting, and diet, lipids, glucose and blood pressure are not
among its inputs. A floor of four does not guard the component, it
deletes it, permanently and silently.

Two of my own tests passed anyway. One asserted `BAND_MIN_COMPONENTS`
equalled 4 instead of exercising a four-part reading. The other wrapped
its only real assertion in `if (strong.logHazard !== null)` — never
true, because the floor I had just set was higher than the number of
parts that exist. **A vacuous test is worse than no test, because it is
counted.** The suite reported green on a change that had disabled a
health component.

The floor is now `LE8_MIN_PARTS = 3`, all of what can be seen, and every
case in that suite asserts a value rather than a constant, with no `if`
around any of them.

### And the part still not fixed

A floor stops a composite of one paying out. **It does not bound the
pay-out.** Three parts all at 100 is still a mean of 100, still −12.9
raw years and −7.7 after attenuation — the full credit of an
eight-component construct, earned by showing three.

`essential8.ts` states the principle it breaks: *"It is not a Life's
Essential 8 score and must never be presented as one — half the
components missing is half the construct missing, and the three blood
measures are where a lot of the risk actually sits."*

Left open on purpose. Closing it means choosing a calibration — scaling
the contribution by coverage is the obvious candidate and is also a
method I would be inventing, in one sitting, on the surface of this app
where a wrong number costs the most. It belongs in a change of its own,
beside `PROVISIONAL` and `ATTENUATION`. There is a test holding it
visible rather than blessing it.

**And `progress.ts` named this failure before it happened**, in a file
written from his own earlier request:

> *"It would also be a lie with a particular shape: flattering, arriving
> early, and caused entirely by the user doing something the app asked
> them to do. That is the exact structure of a metric designed to make
> people feel good rather than to tell them anything, and it is what the
> whole instrument exists to not be."*

He logged one night because the app asked him to, and the app handed
back six and a half years. Fixed, with a regression test.

---

## The honest reading

**Older, not younger. About +1.3 to +2.2 years, from 2 of 10
components.**

| what it can see | contribution |
| --- | --- |
| **vaping** | **+2.1 years** raw |
| **alcohol** (11–20 drinks a week) | **+0.5 years** raw |
| | ×0.6 attenuation → **+1.6 years** |

| if the drinking band is | the reading is |
| --- | --- |
| none, or up to 10 a week | **+1.3 years** |
| 11–20 a week | **+1.6 years** |
| 21–35 a week | **+2.2 years** |
| more than 35 a week | **+4.0 years** |

**Which band is his is an open question.** Four consecutive nights in a
week he called *"worse than usual"*, and no unit count anywhere in the
log. The spread above is the whole answer until he counts a week.

### The two things it can see are the two things he is quitting

That is not a coincidence and it is the useful part. **Stopping the vape
is worth about 1.3 years by this instrument's own arithmetic** — it is
the single largest lever in the reading, and it is the one already in
progress.

The caveat is the instrument's own, and it is severe: *"The vaping level
is the weakest thing in this instrument: no long-term mortality cohort
for it exists, so that figure follows the American Heart Association's
judgement rather than a measured outcome."* Vaping has not existed long
enough for anybody to have a mortality cohort. The 1.2 hazard is a
reasoned placement, not a measurement.

The alcohol figure is the better-evidenced of the two: Wood et al. 2018,
*The Lancet*, 599,912 current drinkers pooled across 83 prospective
studies, **grade A**. Its caveat: *"Current drinkers only, so it says
nothing about whether drinking nothing beats drinking a little."*

---

## Eight of ten components are blank, and most of them are cheap

| component | what it needs | cost |
| --- | --- | --- |
| **self-rated health** | one question | **free** |
| **feeling connected** | one question | **free** |
| **walking pace** | one question, or four measured metres | **free** |
| **ten-second stand** | ten seconds and a wall | **free** |
| **sleep regularity** | a week of bed and wake times | **a week** |
| cardiorespiratory fitness | some outdoor walks with Apple Health | weeks |
| grip strength | a hand dynamometer | ~$30 |
| Essential 8 composite | 4 of its 8 parts | see below |

**Four of those are free and unasked.** `dailyAsk.ts` already argues that
self-rated health is a monthly instrument and the function tests are
quarterly, so this is not a daily burden — it is one sitting.

And the Essential 8 composite needs **four parts**, of which he has one.
The reachable ones: **his weight** (which needs his height, and BMI may
well be a misread for a 90 kg lifter — `essential8.bmiMisread` exists
for exactly that), **activity minutes**, and **a week of sleep**. Blood
pressure, cholesterol and glucose are a GP visit.

### Sleep regularity is the one that cannot be backfilled

`sleepTiming.ts`: Windred et al., *Sleep* 2024, 60,977 UK Biobank
participants and over ten million hours of accelerometry — **regularity
predicted all-cause mortality more strongly than duration.** It needs a
series of clock times and cannot be recovered from an average later.
Every night not recorded is a night permanently missing from it.

---

## What this reading is not

- **`PROVISIONAL = true`** in `pace.ts`, and its own comment: false only
  once the coefficients are fitted on real cohort data against observed
  outcomes. They are not.
- **`ATTENUATION = 0.6`** is *"a judgement about the size of that
  overlap, not a result, and it is the first thing real data should
  replace."* Every figure above passes through it.
- **It is not in his build.** `MARKERS_ENABLED` needs
  `EXPO_PUBLIC_MARKERS=1`, deliberately unset — see
  `features/health/flag.ts`, including the open TGA question about
  whether software predicting disease risk is a medical device.
- **Two self-reported negatives are not a metabolic age.** Nothing here
  was measured. Every number came from something he told me.
- **It is not medical advice**, and the two things driving it both have
  real medical help that works better than planning does.

## And when it will say something about improvement

`progress.ts` exists to keep three reasons for a moving number apart:
the person changed, the instrument stopped guessing, or the evidence
behind a component changed. **Only the first is an improvement.**

So the next reading will be a better reading, and almost none of that
will be him getting healthier. The improvement he is asking about shows
up when the vape stops and the drinking band drops — and the baseline
above is what it will be measured against.

*Computed 10 Nov 2026 by running `readPace` on `ISAAC_PROFILE`, not by
hand.*
