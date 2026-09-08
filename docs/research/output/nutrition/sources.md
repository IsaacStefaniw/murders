# Nutrition round — source ledger

Every paper opened at Crossref registry level on 8 September 2026 and retraction-checked, then at Europe PMC or OpenAlex for abstract, design and n. For the load-bearing ones the **full text** was read rather than the abstract, which is what produced the round's central finding. Full working in `ledgers/gate2.md`.

**Grade is the grade of the practice.** No card in this round names a protein amount, deliberately.

## Candidates

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `less-processed-same-food` | Hall KD et al. 2019, controlled inpatient feeding trial, ultra-processed against unprocessed diets matched for energy, sugar, fat, fibre and salt, eaten ad libitum | Randomised crossover, inpatient, food provided | 20 | B | A properly controlled feeding trial with an unambiguous result: about 508 more kilocalories a day and roughly 0.9 kg gained on the processed arm over a fortnight. Population cohorts point the same way. Not A: twenty people, two weeks, one facility, and the mechanism is unknown. **Verified to the number**, and two Tier 1 communicators describe it accurately. |
| `eat-in-the-daylight` | Leung GKW et al. 2020, meta-analysis of glucose response to late eating (SMD −1.66); Grant CL et al. 2017; Chellappa SL et al. (n=19) and related laboratory work | Meta-analysis; small controlled laboratory studies | pooled; 19–30 per study | C | The direction is consistent and the laboratory control is good. Small samples, mostly simulated rather than real shift schedules, and the card's instruction to move rather than remove food has not itself been trialled. |
| `what-you-eat-changes-the-night` | St-Onge M-P et al., controlled feeding studies on daytime diet composition and that night's sleep architecture | Controlled feeding, polysomnography | small | C | Objectively measured sleep, which keeps it above D. Small, short, and the effect is modest. |
| `plan-food-after-a-short-night` | Sleep-restriction studies measuring appetite, intake and food choice | Randomised controlled sleep restriction | pooled | C | The underlying finding is B: short sleep reliably raises hunger and intake, measured rather than self-described. The card's practice, deciding lunch in advance, is untested, so it is graded on the practice. |
| `protein-before-bed-on-lifting-days` | Pre-sleep protein trials measuring overnight muscle protein synthesis and training outcomes | Randomised trials with tracer measurement | small per study | C | The mechanism is directly measured and the training outcomes point the same way. Amounts used were at the top of a normal snack, samples are small, and the addition is modest relative to the training effect. |
| `the-cholesterol-plate` | Randomised trials of the combined dietary portfolio (oats and barley, legumes, nuts, plant sterols) | Randomised controlled trials of a combined pattern | pooled | C | One of the better-evidenced eating patterns for a specific measurable outcome, and the combination substantially outperforms the components. Adherence in real life is the weak point, and nobody in the corpus promotes it. |
| `the-version-that-takes-chewing` | Controlled meal studies on eating rate, texture and satiety | Controlled meal studies | small | C | Measured in controlled meals rather than inferred from self-report. Small, short-horizon, and the effect on what people eat later in the day is less certain than the effect on fullness at the meal. |

## The protein verdict

The round's central finding, and the reason no card here names an amount.

| What is quoted | What the paper says |
|---|---|
| A break point at 1.6 g/kg/day | **1.62 at p = 0.079**, stated in the paper's own figure caption. Not significant |
| A confident threshold | **95% CI 1.03 to 2.20**, on an analysed range of 0.9 to 2.4 |
| 49 studies, 1,863 participants | The break-point analysis rests on **42 study arms, 723 participants** |
| The paper recommends 1.6 | **Its discussion recommends about 2.2.** The quoted figure is the abstract's closing sentence |
| A ceiling | Higher baseline intake was associated with a **larger** benefit (p = 0.045), which is the wrong shape for a ceiling |

Source: Morton RW et al. 2018, DOI 10.1136/bjsports-2017-097608, Crossref clean, cited 763, full text read via Europe PMC.

Later work: Tagawa R et al. 2021 (105 studies, 5,402 participants) finds the slope bending rather than stopping, still positive to 3.5 g/kg/day and rising above 1.3 in training arms. Nunes EA et al. 2022 (74 RCTs, same senior author) reports **no break point at all**, GRADE moderate at best. Bandegan A et al. 2017, using a different method entirely, lands at an estimated average requirement of 1.7 with an upper value of 2.2.

Effect size nobody quotes: protein added about **9% to the strength gain and 27% to the lean-mass gain** that the training produced on its own.

**Verdict: the direction survives at B, the number must never be written.** The library's existing `meal-sketch` already carries a range rather than a point and is already correct.

## Meal timing

**Physiology, verified.** Vujović N et al. (n=16), Ruddick-Collins LC et al. (n=30), Leung 2020 (SMD −1.66), Chellappa (n=19). Later eating produces worse glucose handling.

**The popular mechanism is wrong.** Ruddick-Collins is isoenergetic and found **no difference in energy expenditure, resting metabolic rate or weight lost** — only in hunger. So the reason is appetite and overnight glucose, not calorie burning.

**The adherence half does not hold.** All three of the widely repeated findings trace to a conference-proceedings abstract (FENS 2023, doi:10.3390/proceedings2023091120), authored by the company's own co-founder and chief executive, with no control group and self-reported data. **No peer-reviewed publication exists**; Europe PMC was searched by title and by every author. The "inconsistent fasting is worse than nothing" claim is **not citeable** and no card rests on it.

## Regrades

| card | now | proposed | evidence |
|---|---|---|---|
| `protein-breakfast` | B | **C** | The ideas underneath it do not survive. The per-meal protein ceiling and the leucine threshold both fail: the systematic review finds **no threshold in either age group**. |

**Four of the five existing A grades were tested and hold.** The fibre A holds. `one-lever-only` holds and gains a much better source: Johnston BC et al. 2014, 48 randomised trials, 7,286 participants.

## Time back

| Item | Evidence |
|---|---|
| Hydration and thinking | Both meta-analyses find **no significant cognitive effect below about 2% body-mass loss**, which is far more dehydration than being behind on water. |
| The per-meal protein ceiling | No threshold found in either age group. |
| Fat and fibre for satiety | Gate 1's source is a **null result** with twelve studies in it. |
| The "brain rewiring" study | Confirmed overstated: 29 men, five days, unequal 18/11 allocation, never replicated. One source describes a good trial accurately and this one as brain rewiring on the same page. |

## Routed to the supplements carve-out

Nothing new enters it. Creatine should split into a muscle entry and a separate, much weaker brain entry, on the precedent the carve-out already sets. Collagen declined: no position stand names an amount, and the mechanism paper usually cited comes from a laboratory that has since published a null.

## Attribution

Seven of seven cards ship empty. **Marie-Pierre St-Onge has zero credits in the library** and satisfies both credit types at once on the fibre-and-sleep card: she is on the author list and she has taught it publicly. So do van Loon, Nuckols, Kevin Hall, Lennon, Galpin, Lieberman, Israetel, Scheer, Garaulet and Jenkins — against three names holding 86 credits between them.

**Two David Sinclair credits come off**, traced alternatives now existing. That resolves part of the flag in `../attribution-audit/LIVE-LIBRARY-FLAGS.md`.
