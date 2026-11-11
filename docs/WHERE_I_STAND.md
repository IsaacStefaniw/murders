# Where Isaac stands — 10 November 2026

Everything stated or measured in one place. **38 years old**, born 1988,
187 cm, 90 kg.

Two rules this page keeps, both from the repo rather than invented here:

- **No percentiles against the general population.** `standards.ts`:
  *"Nobody has one-rep-max tested a representative sample of adults on
  these lifts... EVERY figure available comes from people who lift and
  chose to record it. A percentile against the general population would
  therefore be invented, however carefully, and the app does not invent
  numbers."* The same applies to body fat and breath holds.
- **Where a figure is convention rather than a dataset, it says so.**

---

## 1. The age number, and what it is worth

**+1.6 years.** The markers instrument reads his measured markers as
sitting where a 39½-year-old's usually do.

| it can see | contribution |
| --- | --- |
| vaping | **+2.1 years** raw |
| alcohol, at 11–20 drinks/week | +0.5 raw |
| | ×0.6 attenuation → **+1.6** |

| drinking band | reading |
| --- | --- |
| up to 10/week | +1.3 |
| **11–20** | **+1.6** |
| 21–35 | +2.2 |
| 35+ | +4.0 |

**It is reading 2 of 10 components.** Grip, balance, gait, fitness,
self-rated health, connection, sleep regularity and the Essential 8
composite are all blank. So this is not a summary of his health; it is a
summary of the two things the instrument can currently carry evidence
for, and both are things he is quitting.

Caveats that apply to every figure above: `PROVISIONAL = true`,
`ATTENUATION = 0.6` is *"a judgement, not a result"*, nothing was
measured — all self-reported — and the feature is not in his build.

## 2. What the instrument cannot see, which is most of him

| | | in the reading |
| --- | --- | --- |
| trains 4×/week | **20 years** | activity component already at its 100 ceiling |
| sauna 3–4×/week, 90 °C, 20–25 min | **20 years** | **nothing** — not a component |
| breath hold | **3:20** | **nothing** — not a component |
| body fat | **13%** | **removes** a component (BMI misread) |
| four main lifts | see §4 | **nothing** — not components |
| 8 L water daily | | **nothing** |
| creatine 4 g | grade **A** protocol | **nothing** |

Six of those are genuinely good and contribute zero. That is the honest
shape of a ten-slot instrument, not a bug — but it means **the number
understates him and the number is still the number.**

## 3. Against the population — the one representative figure

**71% of Australian men aged 18–64 do not meet the recommended two days
a week of muscle-strengthening activity.** AIHW 2022, a national survey
rather than a self-selected sample. Non-compliance rises with age.

He does **four days, and has for twenty years.**

That is the whole of what this repo will say about him versus the
population, and it is about the habit rather than the kilos — because it
is the only figure drawn from a sample that includes people who do not
train.

### Three comparisons that are convention, not data

Flagged rather than omitted, because they are informative and they are
not measurements.

| | him | ordinary rule of thumb |
| --- | --- | --- |
| body fat, male, 38 | **13%** | athletic/fitness range; a typical man his age sits around 22–25% |
| voluntary breath hold | **3:20** | untrained, no preparation: 30–60 s |
| sauna frequency | **3–4/week** | the `sauna` card recommends 2–4 |

None of these comes from a cited dataset in this repo. They place him
without pretending to measure him.

## 4. The four lifts — among people who train and log

`COMPARISON_CLASS`, not the general population.

| lift | × bodyweight | position | next mark |
| --- | --- | --- | --- |
| **Bench** | **1.47×** | past the **second** of four | third at **135 kg** |
| **Overhead** | **0.89×** | past the **second** of four | third at **81 kg** |
| Deadlift | 1.56× | past the first | second at 157.5 kg |
| Squat | 1.22× | past the first | second at 135 kg |

**The overhead press is 1 kg from the third mark.**

`assessStrength` returns "beginner" overall and it is not reported here
or on any screen — `standards.ts` records that failure directly: *"the
screen printed the MEDIAN band over an uneven profile, so a 130 kg bench
came out 'Beginner'."*

**The gap worth training:** deadlift at **1.06× his bench** where
1.2–1.3 is ordinary, and squat at **0.83×** against roughly 1.25–1.3.
Two readings and nothing separates them — the lower body is behind, or
the squat and deadlift figures are stated and untested. **A tested squat
and deadlift settles it**, and the whole lower-body conclusion rests on
those two numbers.

## 5. The day, where it has been measured

| | him | target / reference |
| --- | --- | --- |
| protein | **178 g** | 165–180 — **hit** |
| fibre | 28 g | 30 — 2 short |
| sleep, 9 Nov | 22:00–06:30, **8.5 h** | 7–9 h is full marks on Essential 8 |
| mood | 7.5/10 | **one reading. Not yet a mood.** |
| creatine | 4 g | ISSN 3–5 g/day, **grade A** |
| water | 8 L | ~2.5–3× the usual beverage figure |

**One night of sleep and one mood score.** Neither is a pattern, and
`mood.moodStanding` says so in the app's own words: *"It is a number,
not yet a mood."*

## 6. What is actually dragging the number, and what would move it

| lever | worth | status |
| --- | --- | --- |
| **stop vaping** | **~1.3 years** | in progress, the single biggest lever available |
| **drinking band down** | up to **~2.7 years** from the top band | 2 days dry after a 4-night run |
| four free questions | adds 4 components | **unasked** |
| a week of bed/wake times | adds sleep regularity | **cannot be backfilled** |
| a ten-second stand | adds balance | free |
| a $30 dynamometer | adds grip | unbought |

**The two things dragging it are the two he is quitting.** Everything
else about him is either good, unmeasured, or invisible to the
instrument.

The vaping caveat is the instrument's own and it is severe: *"no
long-term mortality cohort for it exists, so that figure follows the
American Heart Association's judgement rather than a measured
outcome."* The alcohol figure is the stronger one — Wood et al. 2018,
*The Lancet*, 599,912 drinkers, **grade A**.

---

*Sources are the repo's own graded library and the figures run through
`readPace`, `assessStrength` and `liftContext` on his stated numbers,
not computed by hand. Nothing here is medical advice, and the two things
driving the number both have real medical help behind them.*
