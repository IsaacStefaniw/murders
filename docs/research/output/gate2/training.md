# Gate 2 — literature verification, TRAINING pillar

Run 8 September 2026. Input: `scratchpad/gate1_nutrition_training.md`
(125 traced claims; the TRAINING rows worked here). Method per
`output/corpus/METHOD.md`; retraction checks per `RETRACTIONS.md`
(title-prefix + OpenAlex `is_retracted`, never the relation field alone).

Every paper below was opened at Crossref for the bibliographic record and
at Europe PMC / OpenAlex for design, n and abstract. Where a number could
not be got from an abstract, the full text was opened and that is said.

**Grading discipline note before anything else.** The training pillar
currently runs A 3 · B 10 · C 10 · D 4 · E 0 — 48% at A+B, already the
hottest pillar in the library. This round comes back **cooler**: the
single A is proposed down to B, and the new candidates are weighted to C.
Nothing here is graded above the pillar's existing temperature.

---

## B. THE `strength-minimum-weekly` VERDICT

*(Section B first, because it is the priority and because the rest of the
ledger reads differently once it is settled.)*

### The three papers, all opened

**1. Momma H, Kawakami R, Honda T, Sawada SS. 2022.** *Muscle-strengthening
activities are associated with lower risk and mortality in major
non-communicable diseases: a systematic review and meta-analysis of cohort
studies.* Br J Sports Med 56(13):755–763.
DOI `10.1136/bjsports-2021-105061` · PMID 35228201 · PMC9209691 · open
access · cited 176 · PROSPERO CRD42020219808.
Crossref: authors and record confirmed, `retraction_or_update: none`, no
title prefix. **Clean.**

Design: systematic review and meta-analysis of prospective cohort studies.
**16 studies.** Result, verbatim in substance: muscle-strengthening
activity associated with **10–17% lower risk** of all-cause mortality,
CVD, total cancer, diabetes and lung cancer, independent of aerobic
activity. **J-shaped associations with maximum risk reduction
(approximately 10–20%) at approximately 30–60 min/week** for all-cause
mortality, CVD and total cancer; L-shaped for diabetes. The paper's own
conclusion says the influence of *higher* volumes "is unclear".

**2. Shailendra P, Baldock KL, Li LSK, Bennie JA, Boyle T. 2022.**
*Resistance Training and Mortality Risk: A Systematic Review and
Meta-Analysis.* Am J Prev Med 63(2):277–285.
DOI `10.1016/j.amepre.2022.03.020` · PMID 35599175 · not open access ·
cited 58 · PROSPERO CRD42019136654.
Crossref: record confirmed, `retraction_or_update: none`, no title prefix.
**Clean.**

Design: systematic review and meta-analysis. **10 studies in the
meta-analyses.** Any resistance training vs none: all-cause mortality
**RR 0.85 (0.77–0.93), 6 studies**; CVD mortality RR 0.81 (0.66–1.00),
4 studies; cancer mortality RR 0.86 (0.78–0.95), 5 studies. **The
dose-response arm is 4 studies**, nonlinear, with a **maximum risk
reduction of 27% at around 60 min/week (RR 0.74, 0.64–0.86)**, and
reductions diminishing at higher volumes.

**This is where the card's "27%" comes from, and it is one number from
four cohorts.** That matters below.

**3. Zhang Y, Lee DH, Rezende LFM, Ma Y, Giovannucci E. 2026.**
*Long-term resistance training with all-cause and cause-specific
mortality: assessing dose-response and joint associations with aerobic
physical activity.* Br J Sports Med 60(12):874–883.
DOI `10.1136/bjsports-2025-110503` · PMID 42230125 · PMC13397323 ·
cited 0 (new).
Crossref: record confirmed, `retraction_or_update: none`, no title prefix.
**Clean.**

This is Gate 1's "2026 prospective analysis of 147,374". **Confirmed
exactly**: 147,374 participants (31,540 men, 115,834 women) across three
cohorts — Health Professionals Follow-up Study 1992–2022, Nurses' Health
Study 2002–2021, Nurses' Health Study II 2003–2021 — followed up to 30
years, **35,798 deaths**. Exposure assessed by validated questionnaire at
baseline **and biennially thereafter**, analysed as a cumulative average
of repeated measures.

Abstract headline: 90–119 min/week associated with **13% lower all-cause
mortality (HR 0.87, 0.81–0.95)**, 19% lower cardiovascular mortality
(HR 0.81, 0.67–0.97), **27% lower neurological-disease mortality
(HR 0.73, 0.58–0.92)**, adjusted for aerobic activity. No additional
benefit above 120 min/week.

### The number the abstract does not give, and which settles this

The abstract reports only the 90–119 band, which is what the podcast page
repeated. **The full text (Table 2, multivariable + aerobic-PA-adjusted)
was opened at PMC and carries the whole curve:**

| Resistance training | HR for all-cause mortality (95% CI) | Risk reduction |
|---|---|---|
| none | 1.00 (reference) | — |
| 1–29 min/week | 0.95 (0.92–0.97) | 5% |
| 30–59 min/week | 0.91 (0.87–0.95) | 9% |
| 60–89 min/week | 0.91 (0.86–0.96) | 9% |
| **90–119 min/week** | **0.87 (0.81–0.95)** | **13%** |
| ≥120 min/week | 0.92 (0.86–0.98) | 8% |

P for nonlinearity < 0.001; the authors describe a quadratic association
"levelling at around ≥120 min/week".

**Read that column honestly and the conflict mostly dissolves.**

- The curve is **not** a story about 90–120 minutes being the target. It is
  a story about **the first half hour buying most of what is on offer**:
  zero → 30 minutes moves the hazard ratio from 1.00 to 0.91. The whole
  next *ninety* minutes moves it from 0.91 to 0.87, and then back to 0.92.
- The 30–59 and 90–119 confidence intervals **overlap substantially**
  (0.87–0.95 against 0.81–0.95). A four-percentage-point gap with that
  much overlap, in an observational cohort with self-reported exposure, is
  not a finding you build a prescription on.
- The ≥120 band being *worse* than 90–119 (0.92 vs 0.87) is the tell. A
  genuinely monotonic dose-response does not do that. It is noise in the
  upper bands, and the authors handle it by calling the top a plateau
  rather than a peak.
- **Cancer mortality runs the other way entirely.** In this cohort the
  cancer-mortality benefit appears *only* at the low doses — HR 0.91
  (0.86–0.97) at 1–29 min/week and HR 0.88 (0.81–0.97) at 30–59 min/week —
  and not at the higher ones. If anything, the cancer arm of the newest and
  largest study is an argument *for* the card's existing number.

### Do the three actually conflict? Partly, and for identifiable reasons

They are not measuring quite the same exposure, and the direction of each
difference is predictable.

1. **Exposure breadth.** Momma and Shailendra pool cohorts measuring
   *muscle-strengthening activity* broadly — gym work, calisthenics,
   bodyweight, bands. Zhang's questionnaire item is narrower: "weight
   machine/resistance training", and the paper states in its own
   limitations that it **did not capture calisthenics or Pilates**. Someone
   doing 45 minutes of machines plus uncounted bodyweight work is
   classified into a lower band than their true dose. That systematically
   **pushes Zhang's apparent optimum upward**.
2. **Regression dilution.** The pooled analyses rest largely on a single
   baseline measurement. Zhang uses a cumulative average of measurements
   repeated every two years for up to thirty. Correcting measurement error
   in an exposure steepens the curve and moves the apparent optimum out —
   this is the standard, expected consequence, not a new biological
   finding.
3. **Where they genuinely disagree, the newest one wins, and it is good
   news.** Momma and Shailendra both report **diminishing or J-shaped**
   associations at higher volumes — the "too much lifting may be bad"
   implication that the card already grades as thin. Zhang, with far better
   exposure measurement and more deaths than either pooled analysis, finds
   **a plateau and no decline**: ≥120 min/week is still HR 0.92 with a CI
   excluding 1. **The J-shape does not replicate.** That half of the older
   evidence should come off the card, and it makes the card kinder rather
   than harsher.

So: **not a contradiction about whether a strength floor works. A genuine
disagreement about where the optimum sits, driven by how the exposure was
measured, on top of an underlying curve that is nearly flat from thirty
minutes onward in every one of the three.**

### The verdict

**The number: change it — but not to 90–120.**

Writing "90–120 minutes" onto the card would repeat the podcast page's
error in the opposite direction: taking one band's point estimate from one
cohort family and calling it the target. The honest statement of all three
papers together is:

> Any muscle-strengthening work at all is associated with meaningfully
> lower mortality than none. **Most of what the evidence can see is bought
> by the first thirty to sixty minutes a week.** There is probably a little
> more available up to around two hours, and above two hours the newest and
> largest analysis finds no further gain — a ceiling, not a floor.

That sentence is true of Momma (peak 30–60), true of Shailendra (peak ~60),
and true of Zhang (0.91 by 30 minutes; 0.87 at best; flat after 120). The
card's prescription — **30–60 minutes across two sessions** — survives
intact as a *floor*. What must go is the phrase "**with the association
strongest around thirty to sixty minutes a week**", which is now contested
by the largest study and was never more than one dose-response arm of four
cohorts anyway. Replace it with the plateau framing, and add the ceiling.

**The grade: A → B.**

The card should not keep its A, and the reasoning is not the 2026 paper —
it is what the 2026 paper exposes about the original grade.

Why not A:
- **Every input is observational.** There is no randomised trial of
  resistance training against a mortality endpoint and there will not be
  one. Healthy-user bias and reverse causation are not adjustable away, and
  the card already concedes this in copy while carrying a grade that does
  not.
- **The A was awarded partly for agreement on the number** — the recovery
  round's own `sources.md` row says so: *"Two independent pooled analyses,
  same direction, same 30–60 minute optimum"*. **That agreement is now
  broken.** The largest and best-measured analysis puts the point estimate
  elsewhere and finds no J-shape. The direction survives; the concordance
  that justified the top grade does not.
- **The 27% is thinner than it reads.** It comes from a **four-study**
  dose-response arm inside a ten-study review. The card presents "10–27%"
  as a range across a body of work; the top of it is one number from four
  cohorts.
- **Exposure is self-reported throughout**, and Zhang names measurement
  error as its first limitation. All three cohort families are
  overwhelmingly white, middle-aged-to-elderly, and in Zhang's case health
  professionals — Zhang says so.
- **Internal calibration.** `desk-day-offset` sits at **B** on a
  *device-measured* harmonised meta-analysis of nine cohorts plus a
  million-person self-report analysis, with the round's stated reason being
  that the specific figure rests on nine cohorts over a few years. A
  self-reported exposure whose optimum moves between sources cannot sit a
  full grade *above* that. One of the two is mis-set, and it is this one.

Why not C: the direction is genuinely robust. Twenty-six cohorts across two
independent pooled analyses plus 147,374 people and 35,798 deaths with
thirty years of repeated measures, all pointing the same way, all adjusted
for aerobic activity, is about as strong as observational epidemiology
gets. B is "good evidence" and that is exactly what this is.

**Answer to the question as put: the card should change both — its number
and its grade.** Keep the 30–60 minutes across two sessions as the
prescription, because that is the floor all three papers support and the
one people can actually reach. Delete "the association is strongest around
thirty to sixty minutes a week", because it is no longer safe to say.
Replace it with the flat-curve-plus-ceiling framing, which is more useful
copy anyway: *the first half hour is where nearly all of it is, and two
hours is where it stops.* And move the grade to **B**, which is where the
evidence has been sitting the whole time.

One thing to add rather than remove: **the neurological-disease mortality
result (HR 0.73, 0.58–0.92 at 90–119 min/week) is new and nothing in the
library says it.** Grade it C on its own — a single cause-specific arm of a
single cohort family, never replicated — but it is a genuinely fresh reason
to lift, and it belongs in the `why` as an early finding rather than a
headline.

---

## PRIORITY TWO — the strength-floor convergence, verified base by base

Gate 1 counted six independent voices on "roughly an hour a week in two
sessions", resting on four evidence bases. **Verified separately, they do
not carry equal weight, and the ranking is not the one the convergence
count implies.**

| Evidence base | What it actually establishes | Weight |
|---|---|---|
| **Prospective cohorts** (Momma 2022; Shailendra 2022; **Zhang 2026**) | That *any* weekly strengthening beats none for mortality, and that the curve is nearly flat from 30 minutes on. **This is the base that carries the weight** — 26 pooled cohorts plus 147,374 people with 35,798 deaths and thirty years of repeated exposure measurement. | **Heaviest.** Observational, but nothing else in this pillar is close on scale. |
| **Volume meta-regressions** (Pelland 2026, 67 studies / 2,058 participants; Schoenfeld 2017, 15 studies / 34 groups) | That strength shows **considerably more pronounced diminishing returns than hypertrophy** — Nuckols' claim 83, and Pelland's own abstract says it in those terms. This is the *mechanism* under a low strength floor. | **Second.** Randomised, but the samples are 79% male, mean age 25 — not this audience. |
| **The minimum-dose systematic review** (Androulakis-Korakakis 2020) | That one set, 6–12 reps at ~70–85% 1RM, 2–3x/week, to failure, for 8–12 weeks produces significant 1RM gains in trained men. | **Third, and thinner than its title suggests** — see below. |
| **Tracer / immobilisation studies** (van Loon, Gate 1 claims 5, 6) | Not verified here — it is nutrition-pillar work and belongs to the nutrition Gate 2. Cited by Gate 1 as one of the four bases; **this round did not open those papers and does not claim them.** | **Unverified in this round. Do not count it.** |
| **Coaching practice** (Israetel, Galpin, Smith-Ryan) | Nothing. Convergence of practitioners is a prioritisation signal and never evidence, per `PIPELINE.md`. | **Zero evidentiary weight, real attribution weight.** |

**So the six voices are really two-and-a-half evidence bases**, and the
honest sentence is: *the cohorts say any is far better than none and the
curve flattens early; the randomised volume work says strength in
particular plateaus fast; the minimum-dose review is small and men-only.*
That is still a good answer to the brief's number-one question. It is not
four independent literatures agreeing on a number.

### The `Minimum Effective Training Dose` review — verified, and smaller than its title

**Androulakis-Korakakis P, Fisher JP, Steele J. 2020.** *The Minimum
Effective Training Dose Required to Increase 1RM Strength in
Resistance-Trained Men: A Systematic Review and Meta-Analysis.*
Sports Medicine 50(4):751–765. DOI `10.1007/s40279-019-01236-0` ·
PMID 31797219 · not open access · cited 60 · PROSPERO CRD42018108911.
Crossref clean, no title prefix, no OpenAlex retraction flag.

Gate 1 was right that this paper exists, is exactly on the brief's
priority topic, and has **zero podcast coverage**. That much is confirmed.

What it found: from 2,629 records, **6 studies** met inclusion. All six
showed that a single set performed 1–3 times a week produced significant
1RM gains. Meta-analysis of 5 studies: overall 1RM **+12.09 kg
(8.16–16.03)**, squat **+17.48 kg (8.51–26.46)**, bench press **+8.25 kg
(0.68–15.83)**. The authors' own conclusion calls the result
"**suboptimal, yet significant**".

**Four limits that decide its grade, and none are visible from the title.**
- **The search was conducted by one reviewer** — no dual independent
  screening, which is the standard safeguard against selection error in a
  systematic review.
- The meta-analysis pools **within-group pre-post change in the
  lowest-dose arms**. There is no pooled control comparison, so the
  estimate cannot separate training from familiarisation and regression to
  the mean.
- The bench-press interval runs from **0.68 kg** to 15.83 kg. It excludes
  zero by a hair. Squat is the robust half of this result; bench is not.
- Resistance-trained **men** only. The paper says explicitly that it is
  unclear whether this holds for the deadlift, for trained women, or for
  highly trained athletes.

**Grade of the practice ("when the week collapses, one hard set per main
lift, two or three times, holds and even builds strength"): C.** Not B,
because a six-study within-group synthesis screened by a single reviewer
cannot carry a B on its own. Not D, because all six studies agreed in
direction, the squat effect is large with a comfortable interval, and it
is independently corroborated by Pelland's finding that strength's
diminishing returns set in early.

**This is still the single most useful card in the round for the brief's
stated audience**, and it is more useful graded honestly at C with the
"suboptimal, yet significant" framing intact than inflated to B.

---

## PRIORITY THREE — Zone 2, verified carefully and fairly

Gate 1's L13 said the phrase returns essentially nothing outside elite
endurance training-intensity-distribution reviews. **Confirmed, and it can
now be said with citations rather than as a search result.**

### What the search actually returns

Running `lit "zone 2 training"` and `lit "training intensity distribution
endurance" meta` returns, in order of citation: the training
characteristics of world-class distance runners; a polarisation index for
classifying intensity distributions; lactate-guided threshold intervals;
training-intensity distribution in elite swimmers; middle- and
long-distance runners; best-practice characteristics described by
Norwegian world-class endurance coaches; and endurance training in Olympic
winter sports. **Every review-level hit is about elite or sub-elite
endurance athletes.** There is no meta-analysis of "Zone 2 training" in
ordinary adults, because the exposure has never been defined well enough
to meta-analyse.

### The two papers that settle it

**Sitko S, Artetxe X, … Seiler S, Zabala M, Valenzuela PL, Viribay A. 2025.**
*What Is "Zone 2 Training"?: Experts' Viewpoint on Definition, Training
Methods, and Expected Adaptations.* Int J Sports Physiol Perform
20(11):1614–1617. DOI `10.1123/ijspp.2024-0303` · PMID 40010355 · cited 9.
Crossref clean.

A commentary from a panel of **14 applied sport scientists and
professional coaches** (Seiler and Mujika among them). Two findings matter
and both cut against the branded protocol:

- **There is no clear consensus among coaches, athletes and scientists
  regarding the definition of zone 2 training** — the paper says so in its
  own background. The panel had to *manufacture* a definition in 2025,
  immediately below the first lactate or ventilatory threshold, for a term
  already being prescribed to the general public as a number on a watch.
- The panel's own expectation is that the adaptations from Zone 2
  **might not be unique to zone 2 and could also be induced at slightly
  higher and lower intensities.** The people most invested in the concept
  say it is not special.

This is **expert opinion**, the lowest evidence tier, and a commentary
rather than a study. It cannot support a practice. It is decisive about a
*definition*, which is what it was asked here.

**Storoschuk KL, Moran-MacDonald A, Gibala MJ, Gurd BJ. 2025.**
*Much Ado About Zone 2: A Narrative Review Assessing the Efficacy of Zone 2
Training for Improving Mitochondrial Capacity and Cardiorespiratory Fitness
in the General Population.* Sports Medicine 55(7):1611–1624.
DOI `10.1007/s40279-025-02261-y` · PMID 40560504 · cited 3.
Crossref clean.

Its conclusions, in substance: the popular positioning of Zone 2 as *the
optimal* intensity for mitochondrial and fatty-acid oxidative capacity
largely stems from **observational data of elite endurance athletes** who
do large volumes of it and already have high mitochondrial capacity;
current evidence **does not support** Zone 2 as the optimal intensity for
those outcomes; and higher intensities should be prioritised for
cardiometabolic benefit, **particularly in the context of lower training
volumes**.

**Weight it honestly, because it is not a neutral document.** It is a
**narrative review**, not a systematic one — no protocol, no pooled
estimate, no risk-of-bias assessment. And **Martin Gibala is an author**:
the field's leading interval-training researcher, arguing against the
low-intensity position. That is a legitimate scientific argument from an
interested party and should be reported as such rather than deployed as a
verdict. It establishes that the Zone 2 optimality claim is
**unsupported**. It does not establish that intervals are better.

### The fair half: what IS supported for easy aerobic work in ordinary adults

This matters more than the debunk and the library should lead with it.

- **Aerobic training raises cardiorespiratory fitness.** Uncontested,
  hundreds of RCTs, every population.
- **Cardiorespiratory fitness is strongly and consistently associated with
  lower mortality.** Kodama 2009 (33 cohorts, 102,980 people): RR 0.87
  (0.84–0.90) per 1 MET. Lang 2024 (26 systematic reviews, 199 cohorts,
  over 20.9 million observations): high vs low CRF HR 0.47; 11–17% lower
  all-cause mortality per MET.
- **Accumulated moderate-to-vigorous activity offsets long sitting** —
  already in the library at B on `desk-day-offset`, device-measured.
- **Easy-paced work is the pace people sustain.** The library's own
  founding premise. Neither Zone 2 paper touches it, and it is the
  strongest argument for the practice.

### Verdict on the practice, and on the branding

**The practice — steady conversational-pace cardio, two sessions a week —
keeps its B.** It is a fine way to accumulate the aerobic volume the
CRF-and-mortality literature is about, and it is the version people
actually do. Nothing found in this round argues against doing it.

**Four things should come off the card, and they are branding rather than
practice:**
1. The label. "Coaches call it Zone 2" attaches the card to a term whose
   own expert panel could not define until 2025.
2. The mitochondrial mechanism claim, which Storoschuk 2025 disputes
   directly.
3. "The biggest return per unmiserable minute for most people." This is
   the specific claim under dispute, and it is **most wrong for exactly the
   person this library is built for** — see 4.
4. Any implication that a heart-rate band on a watch identifies it. The
   panel's definition is a lactate or ventilatory threshold, not a
   percentage of maximum heart rate.

**And one thing should go on, because it is the most useful finding the
Zone 2 verification produced:** Storoschuk's qualifier — *particularly in
the context of lower training volumes*. **When the week is short,
intensity is what to protect.** That is the same conclusion Smith-Ryan
reaches from her intervention trials (Gate 1 claim 29) and Galpin from his
reading of the high-intensity literature (claim 37), from completely
different directions. Three independent routes to one practical rule, and
it is exactly the rule the brief's audience needs. It belongs in the
training ladder.

**Precise, not dismissive.** The honest summary is not "Zone 2 is
nonsense". It is: *easy aerobic work is genuinely good for you and is the
pace you will keep doing; the branded protocol, its optimality claim and
its watch-zone are extrapolated from elite endurance athletes; and if your
week is short, the hard session is the one to protect.*
---

## A. VERIFIED LEDGER

Every row: the practice, the citation, DOI/PMID, design, n, the numbers,
limitations and replication, the **grade of the practice**, and why that
grade and not the one above. Retraction status checked at Crossref (record
**and** title prefix) and at OpenAlex (`is_retracted`) for all twenty
papers — **all clean, none flagged, none appear in `RETRACTIONS.md`**.

Verification marks: **VERIFIED** = every number below came from the paper's
own abstract or full text. **PARTLY VERIFIED** = the direction confirmed,
a stated figure not found at source. **UNVERIFIED** = not opened this round.

---

### 1. The strength floor — 30 to 60 minutes a week, two sessions
**VERIFIED** (Crossref + Europe PMC for all three; PMC full text for the
dose curve). Momma 2022 `10.1136/bjsports-2021-105061` PMID 35228201 ·
Shailendra 2022 `10.1016/j.amepre.2022.03.020` PMID 35599175 ·
Zhang 2026 `10.1136/bjsports-2025-110503` PMID 42230125.
**Design:** two meta-analyses of prospective cohorts + one three-cohort
prospective analysis with repeated exposure measures.
**n:** 16 cohorts; 10 cohorts (4 in the dose-response arm); 147,374
participants / 35,798 deaths / up to 30 years.
**Result:** see section B for the full table. Headline: any vs none
10–17% (Momma), RR 0.85 (Shailendra), and a curve that is HR 0.91 by 30
min/week and 0.87 at its best point (Zhang).
**Limitations:** all observational; self-reported exposure throughout;
cohorts overwhelmingly white and middle-aged-to-elderly, and in Zhang's
case health professionals; the three disagree on where the optimum sits;
the J-shape in the two older analyses **does not replicate** in the newest.
**GRADE: B** — see section B for the full reasoning.
**Not A** because the concordance on the number that justified the A is
gone, everything is observational, and `desk-day-offset` sits at B on a
*device-measured* evidence base.

---

### 2. One hard set per lift, two or three times a week, when the week collapses
**VERIFIED.** Androulakis-Korakakis, Fisher, Steele 2020, Sports Medicine
50(4):751–765. `10.1007/s40279-019-01236-0` PMID 31797219.
**Design:** systematic review + meta-analysis of within-group pre-post
change in lowest-dose arms. **n:** 6 studies included, 5 meta-analysed;
resistance-trained men.
**Result:** overall 1RM +12.09 kg (8.16–16.03); squat +17.48 kg
(8.51–26.46); bench +8.25 kg (0.68–15.83). Protocol: 1 set, 6–12 reps,
~70–85% 1RM, 2–3x/week to failure, 8–12 weeks.
**Limitations:** single-reviewer search; no pooled controls; bench CI
almost touches zero; men only; deadlift, women and highly trained
explicitly unresolved by the authors.
**GRADE: C.** **Not B** — six studies, one reviewer, uncontrolled pre-post
pooling. **Not D** — six of six agreed, the squat effect is large and
comfortably clear of zero, and Pelland 2026 independently corroborates
early diminishing returns for strength.

---

### 3. Volume drives size; strength plateaus much earlier
**VERIFIED.** Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC.
2026, Sports Medicine 56(2):481–505. `10.1007/s40279-025-02344-w`
PMID 41343037. Supporting: Schoenfeld BJ, Ogborn D, Krieger JW. 2017,
J Sports Sci 35(11):1073–1082. `10.1080/02640414.2016.1210197`.
**Design:** multilevel Bayesian meta-regressions, adjusted for
intervention duration and training status; and a meta-regression.
**n:** 67 studies / 2,058 participants (79.1% male, 20.9% female, mean age
25.2 ± 5.2); and 34 treatment groups from 15 studies.
**Result:** posterior probability that the volume slope exceeds zero =
**100% for both hypertrophy and strength**, with diminishing returns for
both and **"the diminishing returns for strength being considerably more
pronounced"**. Frequency: negligible for hypertrophy, 100% posterior for
strength with diminishing returns. Schoenfeld: each additional weekly set
= ES +0.023, **+0.37% muscle**; higher vs lower volume ES difference
0.241 (+3.9%); the three-level categorical model was only a **trend**
(p = 0.074).
**Limitations:** young trained men; the "fractional" set-quantification is
the authors' own novel analytic choice; the per-set effect is genuinely
small; nobody has directly tested "strength plateaus at N sets" as a
hypothesis.
**GRADE: B.** **Not A** — the sample is not this library's audience, the
key analytic decision is bespoke, and Schoenfeld's categorical test did
not reach significance. **Not C** — two large independent syntheses of the
same literature agree in direction and the volume effect is certain.

---

### 4. Frequency matters less than the week's total sets
**VERIFIED.** Grgic J, Schoenfeld BJ, Davies TB, Lazinica B, Krieger JW,
Pedisic Z. 2018, Sports Medicine 48(5):1207–1220.
`10.1007/s40279-018-0872-x` PMID 29470825.
**Design:** systematic review + meta-analysis. **n:** 22 studies; mean
Downs & Black 18/27, only 4 rated good quality; mostly untrained.
**Result:** unequated, effect sizes rose with frequency (0.74 / 0.82 /
0.93 / 1.08 for 1 / 2 / 3 / 4+ per week, p = 0.003). **Volume-equated
subgroup: no significant frequency effect (p = 0.421).** Authors conclude
the frequency effect is "primarily driven by training volume".
**Limitations and replication:** the null is a *subgroup* analysis in
mostly *untrained* people of moderate methodological quality — and
**Pelland 2026 disagrees**, finding a 100%-posterior independent frequency
effect on strength. The two best syntheses of this question do not agree.
**GRADE: C.** **Not B** — a subgroup null contradicted by the newer and
larger analysis cannot carry B. **Not D** — both papers agree that volume
is the dominant term, which is the practical claim.
**What survives for copy:** *how many sets you do in the week matters more
than how you spread them.* Not: *frequency does not matter.*

---

### 5. You do not have to reach failure to get stronger
**VERIFIED.** Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I,
Steele J, Zourdos MC. 2024, Sports Medicine 54(9):2209–2231.
`10.1007/s40279-024-02069-2` PMID 38970765.
**Design:** series of exploratory multilevel meta-regressions, adjusted
for load, volume-equating method, duration, training status. **n:** not
stated in abstract; multiple sensitivity analyses run.
**Result:** for **strength**, the confidence intervals of the marginal
slopes for estimated RIR **contained a null point estimate in every
best-fit model** — proximity to failure has a negligible relationship with
strength gain. For **hypertrophy**, slopes were negative with CIs
excluding null — muscle size increases as sets are terminated closer to
failure.
**Limitations:** the authors describe it as exploratory and caution
against strong interpretation; **RIR was estimated retrospectively from
study descriptions rather than measured**; overall model fit is described
as "modest".
**GRADE: C.** **Not B** — retrospectively estimated exposure, exploratory
design, modest fit, and the authors say so themselves. **Not D** — it is
large, carefully adjusted, and the strength/hypertrophy dissociation is
coherent with Pelland's independent finding that the two outcomes have
different dose-response shapes.

---

### 6. When you think you have two reps left, you probably have three
**VERIFIED, with the magnitude qualified.** Halperin I, Malleron T,
Har-Nir I, Androulakis-Korakakis P, Wolf M, Fisher J, Steele J. 2022,
Sports Medicine 52(2):377–390. `10.1007/s40279-021-01559-x` PMID 34542869
(record via Crossref). Supporting: Bastos V, Machado S, Teixeira D. 2024,
Percept Mot Skills 131(3):940–970, `10.1177/00315125241241785` — a
**scoping review** of 31 studies / N=855, so context, not evidence.
**Design:** scoping review + exploratory multilevel meta-analysis.
**n:** 12 studies, **414 participants**, 262 effect sizes across 12
clusters.
**Result:** participants **underpredicted** reps to failure by **0.95
reps (95% CI 0.17–1.73)**. Accuracy improved slightly closer to failure,
with heavier loads (≤12 reps), and in later sets. **Between-participant
variation was small** (SD 1.45 reps).
**Limitations:** heterogeneity **I² = 97.9%** — near-total; the interval
spans 0.17 to 1.73 reps, i.e. from "no practical error" to "nearly two".
**And a correction to Gate 1: training status did NOT influence prediction
accuracy** (β = −0.006, 95% CI −0.02 to 0.007). Gate 1's claim 87 says
accuracy improves "with weeks of practice" — that comes from Remmert's
separate six-week follow-up, not from this meta-analysis, and this
meta-analysis found no training-background effect.
**GRADE: C.** **Not B** — with I² at 97.9% the pooled figure is barely
interpretable; only the *direction* is safe. **Not D** — the interval
excludes zero, the between-person SD is small, and the practical
instruction ("add one to your estimate") does not depend on the exact
number.

---

### 7. Falls prevention in over-65s: balance and resistance work, supervised, for months
**VERIFIED.** Pillay J, Gaudet LA, Saba S, Vandermeer B, Ashiq AR,
Wingert A, Hartling L. 2024, Systematic Reviews 13:289.
`10.1186/s13643-024-02681-3` PMID 39593159 · PMC11590344 · open access ·
cited 43. Commissioned to inform the **Canadian Task Force on Preventive
Health Care**.
**Design:** three systematic reviews with **network meta-analyses**;
CINeMA for benefit outcomes, GRADE for the rest.
**n:** 290 studies across the three reviews; **219 RCTs reporting on
167,864 participants**, 59 intervention nodes, eight networks.
**Result:** about half the interventions in each network reached at least
low certainty for benefit. The *fallers* outcome had the most interventions
at **moderate** certainty (18 of 57). Of the 21 interventions prioritised
for moderate certainty of some benefit, **14 were exercise-focused**, the
majority **supervised (more than two sessions) and longer than three
months**, with **balance/resistance and group Tai Chi** carrying the most
outcomes at low-or-better certainty. **No moderate-certainty intervention
focused on walking.** Adding other components to exercise "does not appear
to substantially increase benefits." Vitamin D and most single-component
exercise interventions are probably associated with minimal adverse
effects. On preferences: balance/resistance is **clearly preferred over
Tai Chi and other exercise forms**, and there was **high certainty that
individual delivery is preferred over group** for balance/resistance.
**Limitations:** the review's own certainty tops out at moderate; for
fractures, hip fractures, long-term-care admission and quality of life
most interventions had **very low** certainty, often from lack of data;
effects "appear most applicable to those with elevated fall risk"; the
effective programmes were supervised and long, which an app cannot
deliver.
**GRADE: B.** **Not A** — the paper's own GRADE/CINeMA ceiling is
moderate, and the delivery format that produced the effect (supervised,
3+ months) is not the format the library ships. **Not C** — 219 RCTs and
167,864 participants with a formal network meta-analysis for a national
task force is the strongest evidence base anywhere in this pillar, by an
order of magnitude.
**This is the round's most valuable verified finding, and Gate 1 was right
that it has zero podcast coverage.**

---

### 8. Resistance training past 65 — strength improves a lot, size barely
**VERIFIED.** Borde R, Hortobágyi T, Granacher U. 2015, Sports Medicine
45(12):1693–1720. `10.1007/s40279-015-0385-9` PMID 26420238 · PMC4656698 ·
open access · cited 455.
**Design:** systematic review + meta-analysis of RCTs, with random-effects
meta-regression on training variables. **n:** 25 RCTs, mean age ≥65,
healthy.
**Result:** **muscle strength SMD 1.57** (25 studies) — large. **Muscle
morphology SMD 0.42** (9 studies) — small. 1RM upper body SMD 1.61 (11
studies), lower body 1.76 (19 studies); isometric MVC lower body 0.76
(4 studies). Training period and intensity were significant moderators in
meta-regression; time under tension and inter-set rest also identified.
**Limitations:** **poor overall methodological quality — mean PEDro 4.6**;
heterogeneity **I² = 80%**; the dose-response arms are meta-regressions on
small subsets; healthy old adults only, so frail and mobility-limited
populations are explicitly out of scope.
**GRADE: B.** **Not A** — PEDro 4.6 with I² at 80% is a weak evidence base
however many trials it contains. **Not C** — 25 RCTs with an SMD of 1.57
in the direction of the practice, replicated everywhere.
**Best copy value in the round for over-65s:** *what training gives an
older body back is strength, not size.* Which converges with Gate 1
claim 78 (strength falls ~3%/yr past fifty while mass falls ~1%) from a
completely different direction, and reframes the whole older-adult section
away from muscle mass.

---

### 9. Moving the load fast — "power training" for older adults
**VERIFIED, and downgraded from what the podcast says.**
Jiménez-Lupión D, Chirosa-Ríos L, Martínez-García D, Rodríguez-Pérez M,
Jerez-Mayorga D. 2023, Arch Phys Med Rehabil 104(9):1514–1525.
`10.1016/j.apmr.2023.01.022` PMID 36868491. Plus: Morrison RT, Taylor S,
Buckley J, Twist C, Kite C. 2023, J Physiother, `10.1016/j.jphys.2023.05.018`
PMID 37328359.
**Design:** two systematic reviews + meta-analyses of RCTs.
**n:** 12 studies / 478 subjects (meta-analysed arms: 6 studies / 217 on
30-second sit-to-stand; 4 studies / 142 on Timed Up and Go); and 19 trials
/ 1,055 participants.
**Result, Jiménez-Lupión:** TUG **MD −0.31 s (95% CI −0.63 to 0.00),
p = 0.05**; 30s-STS **MD 1.71 reps (95% CI −0.26 to 3.67), p = 0.09**.
**Neither reaches significance** — yet the paper's stated conclusion is
that power training "increases functional capacity related to fall risk
further than other types of exercise". **Recorded as an overstatement of
its own numbers.**
**Result, J Physiother:** high-velocity vs traditional resistance
training — SPPB SMD 0.27 (0.02–0.53) and TUG SMD 0.35 (0.06–0.63), both
rated **low-quality evidence**; all other outcomes "very uncertain"; mean
CERT intervention-reporting score 53%, two of nineteen trials rated high
quality. Conclusion: "**similar effects** to TRT for functional
performance… it is unclear whether the benefit is large enough to be
clinically worthwhile."
**GRADE: C.** **Not B** — one meta-analysis has two non-significant
primary results and the other rates its own significant results as
low-quality with unclear clinical worth. **Not D** — two independent
reviews point the same way, the direction favours moving the load fast,
and nothing suggests it is worse.
**What must not be written:** that power training beats strength training
for older adults, or that power "predicts mortality better than strength
or mass". The first is not supported by these two reviews; the second was
not verified in this round at all.

---

### 10. Cardiorespiratory fitness and mortality — and where the popular framing breaks
**VERIFIED.** Kodama S, Saito K, … Sone H. 2009, JAMA 301(19):2024–2035.
`10.1001/jama.2009.681` PMID 19454641 · cited 2,217. And Lang JJ,
Prince SA, … Tomkinson GR. 2024, Br J Sports Med 58(10):556–566.
`10.1136/bjsports-2023-107849` PMID 38599681 · PMC11103301 · open access ·
cited 140.
**Design:** meta-analysis of observational cohorts; and an **overview of
systematic reviews**.
**n:** 33 studies / 102,980 participants / 6,910 deaths (Kodama);
26 systematic reviews, 199 unique cohorts, **over 20.9 million
observations** (Lang).
**Result:** per 1-MET higher fitness, RR 0.87 (0.84–0.90) for all-cause
mortality and 0.85 (0.82–0.88) for CHD/CVD (Kodama); low vs high CRF
RR 1.70 (1.51–1.92). Lang: high vs low CRF **HR 0.47 (0.39–0.56)**;
11–17% lower all-cause mortality per MET; incident heart failure high vs
low HR 0.31 (0.19–0.49).
**Limitations — and this is the part the popular framing skips:**
- **Lang's own GRADE certainty across all included studies is "very
  low-to-moderate".** The umbrella review that is quoted as proof says
  its evidence is weak-to-middling.
- **Everything is observational and baseline-measured.** These papers show
  that fitness *predicts* death. **None of them shows that raising your
  fitness lowers your risk of dying.** No trial has tested that endpoint.
  "VO₂ max is the strongest predictor of longevity, so raise it" fuses a
  measured association with an untested intervention claim.
- **Reverse causation is severe.** Low measured fitness is partly a marker
  of undiagnosed disease.
- **CRF is measured objectively while nearly every competing risk factor
  in these cohorts is self-reported.** That mechanically inflates CRF's
  apparent predictive edge over diet, smoking and activity. "Stronger
  predictor than almost anything else" is partly an artefact of
  measurement quality, not only of biology.
**GRADE of the association: B.** **Not A** — observational, GRADE
very-low-to-moderate by the umbrella's own assessment, reverse causation
unresolved. **Not C** — 199 cohorts and 20.9 million observations all
pointing one way is as consistent as this kind of evidence gets.
**GRADE of "raising your VO₂ max extends your life": not gradeable — it
has not been tested.** Say so.
**What survives, and it is plenty:** interval training reliably raises
measured fitness in RCTs, higher fitness tracks with less of almost
everything bad, and it is a good reason to do hard sessions. Just not a
causal promise about lifespan.

---

### 11. Exercise snacks — short vigorous bursts, several times a day
**VERIFIED.** Rodríguez M, Quintana-Cepedal M, Cheval B,
Thøgersen-Ntoumani C, Crespo I, et al. 2026, Br J Sports Med
60(2):133–141. `10.1136/bjsports-2025-110027` · PROSPERO CRD42024616514.
**Design:** systematic review + meta-analysis of **RCTs vs non-exercising
controls**. **n:** 11 RCTs, **n = 414**, 69.1% women, mean ages 18.7 to
74.2.
**Definition used:** structured bouts ≤5 min, at least twice daily, ≥3
days/week, for ≥2 weeks. Interventions ran 4–12 weeks.
**Result:** cardiorespiratory fitness in adults **g = 1.37 (0.58–2.17),
k = 6, I² = 71.4%, moderate certainty**. Muscular endurance in older
adults g = 0.40 (0.06–0.75), k = 4, I² = 0%, **very low certainty**.
**No significant effect on lower-limb strength, body composition, blood
pressure or blood lipids.** Compliance **91.1%**, adherence **82.8%**.
**Limitations:** six RCTs on the primary outcome with n small and I² 71%;
an effect size of 1.37 from a few minutes a day is implausibly large and
is the classic signature of small-study inflation. Supporting context
from the observational side: Stamatakis 2022 (below), and a 2019
six-week stair-climbing trial in 24 sedentary adults (Gate 1 claim 73,
**PARTLY VERIFIED** — the trial exists in the search index at
`10.1139/apnm-2018-0675` but the specific 5% VO₂peak / 12% peak-power
figures were not confirmed at source this round; do not print them).
**GRADE: B for cardiorespiratory fitness in inactive adults.** **Not A** —
six small RCTs with high heterogeneity and an inflated-looking effect.
**Not C** — it is randomised evidence with GRADE-moderate certainty and
exceptional adherence, which is the rarest combination in this pillar.
**GRADE: D for anything metabolic.** The review looked for blood pressure,
lipids and body composition and **found nothing**. That null is the most
useful sentence on the card: *this makes you fitter; it does not fix your
bloods.*

---

### 12. Brief vigorous bursts in daily life (VILPA) and mortality
**VERIFIED, and the popular version overstates it.** Stamatakis E,
Ahmadi MN, Gill JMR, Thøgersen-Ntoumani C, Gibala MJ, et al. 2022,
Nature Medicine 28(12):2521–2529. `10.1038/s41591-022-02100-x` ·
open access · cited 239.
**Design:** prospective cohort, **wrist-worn device-measured** exposure
(UK Biobank). **n:** 25,241 non-exercisers, mean age 61.8, 6.9 years mean
follow-up, **852 deaths**; plus 62,344 exercisers / 1,552 deaths for the
parallel vigorous-activity analysis.
**Result:** at the sample median of **3 bouts per day lasting 1–2 minutes
each**, 38–40% lower all-cause and cancer mortality risk and 48–49% lower
CVD mortality risk. At the median **4.4 min/day**, 26–30% and 32–34%.
Near-linear dose-response.
**Limitations:** a single cohort; **852 deaths is a small event count for
effects of this size**; exposure is one week of accelerometry at baseline;
6.9 years of follow-up; and a 40% mortality reduction from about four
minutes a day is larger than almost any established medical intervention —
which is a signature of residual confounding and reverse causation, not of
a strong finding. **Gate 1 correctly recorded that FoundMyFitness'
exercise-intensity page states this causally ("reduces all-cause mortality
by up to 40%"); the paper says "associated with".**
**GRADE: C.** **Not B** — one cohort, few events, short follow-up, and an
effect size that should itself prompt caution. **Not D** — the exposure is
device-measured rather than self-reported, which is a real methodological
advance over the questionnaire cohorts, the dose-response is near-linear,
and the parallel analysis in 62,344 exercisers reproduces it.

---

### 13. Tendons adapt to load, and high-strain resistance work is what does it
**VERIFIED.** Lazarczuk SL, Maniar N, Opar DA, Duhig SJ, Shield A,
Barrett RS, Bourne MN. 2022, Sports Medicine 52(10):2405–2429.
`10.1007/s40279-022-01695-y` PMID 35657492 · PMC9474511 · open access ·
cited 57 · PROSPERO CRD42019141299.
**Design:** systematic review + meta-analysis with meta-regression.
**n:** 61 articles, **763 participants**; Achilles (33 studies) and
patellar (24) tendons; resistance training the main intervention (49).
**Result:** loading produced **moderate increases in stiffness (SMD 0.74,
0.62–0.86)**, **large increases in modulus (SMD 0.82, 0.58–1.07)** and
**small increases in cross-sectional area (SMD 0.22, 0.12–0.33)**.
Meta-regression: stiffness gains are driven by **modulus, not size**.
Resistance training produced greater modulus gains than other training
types (SMD 0.90, 0.65–1.15), and **high-localised-strain protocols beat
low-strain ones** for both modulus (0.82, p = 0.009) and stiffness (1.04,
p = 0.007). Effects larger in adults.
**Limitations:** **every outcome is a surrogate mechanical property.**
Not one of these 61 studies shows that a training-induced increase in
tendon stiffness produces fewer injuries in general trainees. Lower limb
only.
**GRADE: B for the adaptation claim** ("tendons do adapt to load, and to
high-strain loading in particular"). **Not A** — surrogate outcomes and
763 participants across 61 small studies. **Not C** — a well-registered
meta-analysis with consistent, moderate-to-large effects and a coherent
mechanism.
**GRADE: C for any injury-prevention framing.** If a card says "so you get
hurt less", that step is unproven and the grade must reflect it. This also
supplies the evidence Attia's on-air tendon reasoning (Gate 1 claim 113)
does not have.

---

### 14. Doing cardio alongside lifting — how much it actually costs
**VERIFIED, both papers.** Wilson JM, Marin PJ, Rhea MR, Wilson SMC,
Loenneke JP, Anderson JC. 2012, J Strength Cond Res 26(8):2293–2307.
`10.1519/jsc.0b013e31823a3e2d` · cited 332. Superseded in part by
Huiberts RO, Wüst RCI, van der Zwaard S. 2024, Sports Medicine
54(2):485–503. `10.1007/s40279-023-01943-9` PMID 37847373 · open access · cited 41 ·
PROSPERO CRD42022370894.
**Design:** two meta-analyses of controlled trials.
**n:** 21 studies / 422 effect sizes; and **59 studies / 1,346
participants**, aged 18–50, interventions ≥4 weeks.
**Result, Wilson 2012:** hypertrophy ES 1.23 (strength only) vs 0.85
(concurrent); strength 1.76 vs 1.44; **power 0.91 vs 0.55 — the largest
interference**. Concurrent training with **running, but not cycling**,
produced significant decrements in hypertrophy and strength. Endurance
frequency (r −0.26 to −0.35) and duration (r −0.29 to −0.75) correlated
negatively with gains.
**Result, Huiberts 2024:** **lower-body strength blunted in males
(SMD −0.43, −0.64 to −0.22) but not females (0.08, −0.34 to 0.49); group
difference p = 0.03.** No sex differences for upper-body strength
(p = 0.67), power (p = 0.37) or VO₂max (p = 0.13). Untrained — but not
trained — participants showed impaired VO₂max gains. **Hypertrophy data
insufficient to conclude anything.**
**Limitations:** the two disagree on magnitude and moderators; Wilson is
fourteen years old; Huiberts' female null rests on far fewer trials than
its male estimate and the authors say more studies on women are warranted;
and **none of this was studied at the dose an ordinary adult does** — two
easy sessions a week is nothing like the concurrent-training protocols in
these trials.
**GRADE: C.** **Not B** — two syntheses that disagree, extrapolated well
outside the doses studied. **Not D** — 80 studies between them, consistent
in direction, and the moderator pattern (running > cycling; power most
affected) is coherent.
**What survives for copy:** at ordinary doses the cost is small; where it
shows is power and lower-body strength; it is larger in men than women on
current evidence; and if you are worried, ride rather than run.

---

### 15. Static stretching before lifting — the cost is real, small, and confined to long holds
**VERIFIED, and it overturns the debunk everyone was expecting.**
Warneke K, Lohmann LH, et al. 2024, *Revisiting the stretch-induced force
deficit: A systematic review with multilevel meta-analysis of acute
effects*, J Sport Health Sci 13(6):805–819.
`10.1016/j.jshs.2024.05.002` PMID 38735533 · open access · cited 18.
Companion: Warneke K, Lohmann LH, Behm DG, Wirth K, Keiner M, Schiemann S,
Wilke J. 2024, *Effects of Chronic Static Stretching on Maximal Strength
and Muscle Hypertrophy*, Sports Med Open 10:45.
`10.1186/s40798-024-00706-8` PMID 38637473 · open access · cited 19.
**Design:** multilevel meta-analysis with robust variance estimation,
restricted to **controlled pre-post trials**; and a systematic review +
meta-analysis with meta-regression of RCTs.
**n:** 83 studies, over 400 effect sizes, **2,012 participants**; and
42 studies, **1,318 participants**.
**Result, acute:** static stretching caused a **small** maximal-strength
loss, **ES −0.21 (p = 0.003)** against passive controls, and −0.17 to
−0.28 against active controls. **The large deficit (ES −0.84) appears only
at stretching durations of ≥60 seconds per bout.** And — decisively —
**no negative (or even positive) effects were found for athletic
performance such as jumping and sprinting.** The authors state that their
results **do not support previous recommendations to exclude static
stretching from warm-up routines**.
**Result, chronic:** chronic static stretching produced **small strength
increases (d = 0.30)**, not decreases, and is described as a possible
minor alternative to resistance training.
**Limitations:** the acute strength deficit is real for isolated
single-joint strength tests (leg extension, calf raise); it is not shown
for compound performance; the chronic effects are small and the
dose-response is not established.
**GRADE: B** for the practice "keep pre-lift holds short — around thirty
seconds a muscle — and stretch freely at other times". **Not A** — the
long-hold subgroup effect is a moderator analysis and compound-lift
performance was not directly tested. **Not C** — 83 studies with over 400
effect sizes, restricted to controlled designs, multilevel and robust
variance estimated, is the best-designed synthesis in this entire round.
**Two corrections to Gate 1 recorded in section G.**

---

### Not verified this round, and therefore not gradeable

- **Israetel's unstable-surface claim** (Gate 1 claim 26 — force falls to
  ~60% of a true 1RM). He says he ran the study; no paper was found.
  **UNVERIFIED. Do not write the 60% figure.**
- **The Schoenfeld-lab general-warm-up study** (claims 25, 51). Not
  located. The practice it would support conflicts with the library's own
  well-evidenced `training-warmup` card, which rests on cluster-randomised
  injury-prevention trials. **UNVERIFIED, and see section E.**
- **"Powerpenia" and the nine-year survival cohort** (claims 79, 80).
  Not located. **UNVERIFIED.**
- **Deloads and detraining.** Searched; no meta-analysis of planned
  deloads or of strength retention across a two-week break was found. The
  brief asks for this and the literature does not appear to have it in
  synthesised form. `deload-week` stays at D and its existing copy — which
  already says no trial has shown scheduled lighter weeks lower injury
  rates — remains the honest position.
- **van Loon's tracer and immobilisation work** (claims 2–7). Nutrition
  pillar. Not opened here; belongs to the nutrition Gate 2.

---

## C. REGRADES to the existing 27 training cards

Both directions. Three of the eight recommendations below are **holds with
copy fixes rather than grade moves**, which is the honest outcome when a
card was already right.

| Card | Now | Proposed | Why |
|---|---|---|---|
| `strength-minimum-weekly` *(longevity pillar, recovery round output)* | **A** | **B** | The full verdict is section B. The concordance on 30–60 minutes that justified the A is broken by Zhang 2026; everything is observational and self-reported; `desk-day-offset` sits at B on device-measured data. **Also change the number**: keep 30–60 min across two sessions as the prescription, delete "the association is strongest around thirty to sixty minutes a week", add the two-hour ceiling and the neurological-mortality finding (as an early, C-grade aside). |
| `strength` | **A** | **A — hold, fix the copy** | The practice graded for its proximate outcome — getting stronger — is A: hundreds of RCTs, huge effects, replicated to age 65+ (Borde SMD 1.57) and in both sexes. But two things in the card are wrong. Its `why` sells the practice on **longevity** ("among the strongest known predictors of healthy later life"), which is the observational claim now graded B. And its summary says **"most days you can manage"**, which nothing supports: Grgic and Pelland both say the week's total sets matter more than the spread, and Zhang's mortality curve is flat from thirty minutes. Rewrite to lead with strength and function, and set two-to-three days as the shape. That is both truer and kinder. |
| `zone2` | **B** | **B — hold, rewrite** | Full reasoning in Priority Three. The practice is fine. The branding, the mitochondrial mechanism, "the biggest return per unmiserable minute", and the implied watch-zone all come off. Add: when the week is short, protect the hard session. |
| `vo2-intervals` | **B** | **B — hold, fix the `why`** | "Peak aerobic capacity correlates with long-term health more strongly than almost any other fitness measure" is defensible (Lang 2024) but must not imply that raising it is a proven life-extender — no trial has tested that endpoint, and CRF's apparent predictive edge is partly an artefact of being measured objectively while its competitors are self-reported. Also worth adding from Gate 1 claim 29: **sub-maximal intervals still work, they just take longer to show** — which makes this card reachable for someone who cannot face 4×4 hard. |
| `stretch-target-rom` | **B** | **B — hold, and credit it** | This card already says "short holds barely move strength, and the measurable drop-off shows up mainly after long holds tested immediately afterwards". Warneke 2024 confirms it almost to the number: ES −0.21 overall, −0.84 only at ≥60 s per bout, and nothing at all on jumping or sprinting. **A card that was right before the paper existed.** Add the citation; change nothing else. |
| `end-range-strength` | **B** | **B — hold, upgrade the sourcing** | Its `why` currently hedges that the tendon work "is small and short-term". Lazarczuk 2022 replaces that with a registered meta-analysis of 61 studies, and adds the actionable detail: **high localised strain is what drives the adaptation**. Keep B. Keep the honest limit that these are mechanical properties, not injury outcomes. |
| `balance-single-leg` | **B** | **B — hold, and split** | The card is honest that the falls evidence sits in over-65s and does not transfer to midlife. That remains right. But Pillay 2024 is far stronger evidence for the over-65 case than anything the card cites, and it carries findings the card cannot hold — supervision, duration, individual-over-group delivery, and the walking null. **Recommend a separate over-65 card (D2 below) rather than loading this one.** |
| `daily-walk` | **B** | **B — hold, add one limit** | Pillay 2024: **no walking-focused intervention reached moderate certainty for falls prevention.** Walking is excellent for many things; it is not the falls lever, and an older reader should not infer that it is. A sentence, not a regrade. |
| `deload-week` | **D** | **D — hold** | Searched; no synthesised evidence found for planned deloads. Its existing copy already states this. Nothing to change. |
| `movement-snacks` | **C** | **C — hold** | Its glucose-crossover base is untouched by this round. Note that **"exercise snacks" (vigorous, ≤5 min, 3+ days/week) is a different practice** with a different evidence base, and belongs on its own card (D3), not folded in here. |
| `training-warmup` | **B** | **B — hold** | Gate 1's claims 25 and 51 (a general cardio warm-up adds nothing) are about **performance in the session**. This card is about **injury rates in cluster-randomised trials**. They are different claims, the source for the first was not located, and writing the debunk would put the library in contradiction with its own better-evidenced card. **Explicitly declined.** |

**Net effect on the pillar's spread:** one A → B, everything else held.
Training moves from A 3 · B 10 · C 10 · D 4 to **A 3 · B 10 · C 10 · D 4**
(the regraded card lives in the longevity pillar, not this one), and the
longevity pillar loses its only A. New candidates below add 2 B, 5 C and
1 D, taking the training pillar to roughly **A 3 · B 12 · C 15 · D 5** —
**43% at A+B, down from 48%.** The round runs cooler than the pillar,
which is the direction `PIPELINE.md` says it should go.

---

## D. NEW CARD CANDIDATES

Eight, not fifteen. The brief says this is the strongest coach in the
library and that a round coming back large in an already-strong pillar has
misread it. Every one below has a safety line, because the integrity test
enforces it on this pillar. No `Protocol` objects — that is Gate 4's job.

**D1 · The one-set week** — proposed **C**
*Practice:* when the week collapses, one hard set per main lift — squat or
leg press, a press, a pull — taken close to failure, two or three times.
Fifteen minutes.
*Evidence:* Androulakis-Korakakis 2020 (ledger 2), corroborated by Pelland
2026 on early diminishing returns for strength.
*Shape:* `sessionType: 'workout'` so it runs through the real player with
set logging and e1RM capture. Two or three days. Short enough to survive a
minimal-capacity ceiling. This is the card the brief's twenty-minute
person opens.
*Copy note:* the authors' own word is **"suboptimal, yet significant"** —
say that. It is the honest and the encouraging framing at once: this is
not your best week, and it still counts.
*Safety:* Close to failure is not grinding. Stop the set when form
changes, not when the rep fails. Warm up the movement with two lighter
ramping sets first — a single working set does not mean a cold one. No
pushing through joint pain. Educational structure, not medical advice.

**D2 · Steady on your feet, past sixty-five** — proposed **B**
*Practice:* two or three sessions a week combining balance work with
resistance work, kept up for at least three months.
*Evidence:* Pillay 2024 (ledger 7) — 219 RCTs, 167,864 participants,
network meta-analysis for the Canadian Task Force. **The strongest
evidence base in the pillar and it has zero podcast coverage.**
*Shape:* `sessionType: 'workout'`. Three days. Should carry an `appliesTo`
age condition. The card must be honest that the trials that produced this
were **supervised and ran longer than three months** — so the app version
is the unsupervised approximation of a supervised programme, and someone
at real risk of falling should be doing it with a physiotherapist.
*Copy note:* three findings from the same review make this warmer than it
sounds. Balance/resistance work was **what participants preferred** over
Tai Chi and other forms. **Individual delivery was preferred over group,
with high certainty** — so doing it alone at home is the format people
want. And **adding more components does not add benefit** — the exercise
is the whole intervention, so nobody needs a programme.
*Safety:* Balance practice means something solid within reach — a bench, a
worktop, a door frame — for every set, and no eyes-closed work unless
someone is with you. If you have fallen in the last year, are dizzy on
standing, or take medication that affects balance, start this with a
physiotherapist rather than alone. Educational structure, not medical
advice.

**D3 · Exercise snacks** — proposed **B**
*Practice:* if you currently do no formal exercise, put three to five
bursts of one to five minutes of genuinely hard effort into the day —
stairs, a fast walk uphill, sit-to-stands — on most days.
*Evidence:* Rodríguez 2026 (ledger 11) for the randomised fitness effect;
Stamatakis 2022 (ledger 12) for the observational mortality association,
which must be graded and worded separately at **C**.
*Shape:* Not `sessionType: 'workout'` — this is distributed through a day,
not a session. `duringWork: true`. Most days.
*Copy note:* the honest sentence is the null. **This makes you fitter. It
does not move your blood pressure, your lipids or your body composition** —
the review looked and found nothing. And the adherence figures are the
best in this round: 91% compliance, 83% adherence. This is the
"you have no time" card and it is randomised, which almost nothing else
here is.
*Safety:* Hard means hard for you — breathing too heavily to talk, not
gasping. Build up over a couple of weeks rather than starting at your
ceiling. Chest pain, unusual breathlessness, or dizziness on the stairs is
a reason to see a doctor before continuing. Educational structure, not
medical advice.

**D4 · Add one to your estimate** — proposed **C**
*Practice:* when you think you have two reps left, you probably have
three. On your last set, do one more than you meant to.
*Evidence:* Halperin 2022 (ledger 6) — underprediction of 0.95 reps.
*Shape:* Runs inside the existing set-logging player; no separate session.
Could sit as a coaching line on `strength` rather than a card of its own —
**Gate 3's call.**
*Copy note:* two honest limits. The heterogeneity is near-total, so "about
one rep" is a direction rather than a measurement. And **the meta-analysis
found no effect of training background on accuracy** — this is not a skill
that experience fixes, which is oddly reassuring: it is not that you are
bad at it, it is that everybody is.
*Safety:* This applies to the last set of an exercise you know well, with
a load you can put down safely, and never on a barbell over your body
without a rack or a spotter. If form changes, the set is over regardless
of the count. Educational structure, not medical advice.

**D5 · Leave two in the tank when the goal is strength** — proposed **C**
*Practice:* if what you want is to be stronger rather than bigger, stop
each set with a couple of reps left. It costs you nothing measurable and
it makes the session repeatable.
*Evidence:* Robinson 2024 (ledger 5) — strength gains were similar across
a wide range of RIR; hypertrophy was not.
*Shape:* A loading rule inside `strength` and D1 rather than a scheduled
protocol. Gate 3 to decide whether it is a card or a coaching line.
*Copy note:* this is the gift half of the failure literature and it pairs
with D4 as the two halves of one idea: *you are closer to failure than you
think, and for strength you did not need to get there.*
*Safety:* Leaving reps is the conservative choice and needs no caution of
its own; the caution belongs to the alternative. If you do train to
failure, do it on movements you can abandon safely. Educational structure,
not medical advice.

**D6 · Move one lift fast** — proposed **C**
*Practice:* past sixty, on one exercise a session, drive the lifting phase
as fast as you can with a moderate load, and lower it under control.
*Evidence:* Jiménez-Lupión 2023 and the J Physiother 2023 review
(ledger 9).
*Shape:* A modifier on an existing session rather than a session. Should
carry an `appliesTo` age condition.
*Copy note:* **must be written down from what the podcasts say.** The
honest statement is that moving the load fast is *not worse* than moving
it slowly and *may be slightly better* on two walking-and-standing tests —
not that power beats strength and not that it predicts mortality. One
review's two primary results did not reach significance; the other rates
its own positive results as low-quality and says the clinical worth is
unclear.
*Safety:* Fast on the way up, controlled on the way down — never a
snatching or dropping movement. Moderate load, well short of a maximum,
and on machines or bodyweight rather than free weights unless you are
practised. Any joint pain ends the set. Educational structure, not medical
advice.

**D7 · Load the tendons on purpose** — proposed **C**
*Practice:* once or twice a week, include slow heavy work through a long
range on one lower-limb movement — a slow calf raise, a slow split squat,
a slow leg extension — three seconds up, three seconds down.
*Evidence:* Lazarczuk 2022 (ledger 13). High localised strain produced the
largest gains in tendon modulus and stiffness; resistance training beat
other training types.
*Shape:* An add-on block to an existing session. `sessionType: 'workout'`.
*Copy note:* **grade C, not B, because of the step the card wants to
take.** The adaptation is B-grade and well measured. The reason people
want it — fewer injuries — is not shown by any of the 61 studies. Write
the mechanism and the honesty, not the promise. This is also the general
robustness practice the brief permits, and it stays well clear of
rehabilitation, which the brief forbids.
*Safety:* Slow and heavy is where people tear things by rushing the
progression — add load every second or third week, not every session. This
is for a healthy tendon. **If a tendon is already painful, this is a
physiotherapist's decision, not an app's.** Educational structure, not
medical advice.

**D8 · Ride rather than run on your cardio days** — proposed **D**
*Practice:* if you are training for strength and also doing cardio, put
the cardio on a bike rather than on your feet, and keep it away from leg
day.
*Evidence:* Wilson 2012 and Huiberts 2024 (ledger 14).
*Shape:* A scheduling rule, not a session. Likely a coaching line rather
than a card — **Gate 3's call, and the honest recommendation is that this
may not deserve a card at all.**
*Copy note:* graded **D** deliberately. Two meta-analyses that disagree,
fourteen years apart, extrapolated well below the training doses they
studied, with the interference effect concentrated in men and in power
rather than in anything most people measure. At two easy sessions a week
the cost is probably nothing. The one genuinely useful line is the sex
finding: **lower-body strength interference showed in men and not in
women**, which is a rare piece of female-specific evidence in a literature
that has almost none — and the authors say the female estimate needs more
trials.
*Safety:* Nothing here asks anyone to train harder, so the only caution is
the general one: new modality, build in over a fortnight. Educational
structure, not medical advice.

---

## E. TIME BACK

Four to ship against eight new candidates and one regrade — one in five,
per the README. And one **declined**, which is the more interesting entry.

**T1 · Grinding every set to failure, when what you want is to be
stronger.** Robinson 2024 found strength gains were similar across a wide
range of proximity to failure — the confidence interval for the RIR slope
contained zero in every best-fit model. **Ship.** This is the gift in its
purest form: you stop earlier, you keep the result, and the session stops
being something to dread. It pairs with D5 and it is graded C, so the copy
should say the analysis is exploratory.

**T2 · Chasing a "Zone 2" heart-rate band on a watch.** Fourteen sport
scientists could not agree what Zone 2 was until 2025, and when they did
agree they placed it at a **lactate or ventilatory threshold** — not at a
percentage of maximum heart rate — and said the adaptations are probably
not unique to it. **Ship.** The gift is specific and it removes a source
of daily failure: go at a pace where you can hold a conversation, and stop
watching the number. The practice stays; the instrument goes.

**T3 · Adding extra components to an older person's exercise programme.**
Pillay 2024, from 219 RCTs: adding other interventions to exercise "does
not appear to substantially increase benefits". **Ship.** For someone over
sixty-five who has been handed a home-hazard checklist, a vitamin, a
multifactorial assessment and a class, this says the exercise is the
intervention and the rest is optional.

**T4 · Assuming a two-hour week is the target.** Zhang 2026 finds no
additional benefit above 120 minutes a week, and the cancer-mortality
benefit appears only at the *lowest* doses. **Ship**, worded as a ceiling
rather than a debunk: there is a point past which more strength training
stops buying you anything the mortality data can see, and it arrives
sooner than the internet implies.

**DECLINED · Static stretching before lifting.** The brief names it. Gate 1
listed a 2024 meta-analysis as "the paper that settles the size of the
cost". **It does not settle it, and the paper that does says the opposite
of the folklore.** Warneke's acute meta-analysis — 83 studies, 2,012
participants, controlled designs only — finds a *small* strength deficit
(ES −0.21), a large one **only at holds of sixty seconds or more**, and
**no deficit at all on jumping or sprinting**, and its authors state
explicitly that their results do not support excluding static stretching
from warm-ups. Writing this debunk would have been wrong. **Recorded as a
near-miss: this is the round's clearest case of the round's own
expectations nearly overriding the evidence.**

**DECLINED · The general cardio warm-up.** Gate 1 has it twice (claims 25,
51) and the underlying Schoenfeld-lab study was not located. It also
addresses *session performance*, while the library's `training-warmup` card
addresses *injury rates in cluster-randomised trials*. Writing the debunk
would set the library against its own better-evidenced card on a
misreading of what the two claims are about.

**HELD · The 8–12 rep range as "the" hypertrophy range.** Gate 1's G5, and
a good candidate. Robinson 2024 and Pelland 2026 both support the shape of
the claim indirectly — hypertrophy tracks proximity to failure and total
volume rather than a rep window. But the direct source (Schoenfeld's
load-and-rep-range meta-analyses) was not opened this round.
**PARTLY VERIFIED. Hold for the next pass rather than ship on inference.**

---

## F. ATTRIBUTION

From Gate 1 where traced, empty where not. **The author-list rule applied:
a researcher credit requires that person on the author list of a source in
that card's own `sources.md` row, verified at Crossref.** Author lists were
read from the Crossref records above.

### Researcher credits that PASS the author-list rule

| Name | Passes on | Verified where |
|---|---|---|
| **Martin Gibala** | Stamatakis 2022 (VILPA), `10.1038/s41591-022-02100-x`; and Storoschuk 2025, `10.1007/s40279-025-02261-y` | Crossref author arrays. The brief names him and he is creditable on the exercise-snacks card **and** on a corrected Zone 2 card. |
| **Emmanuel Stamatakis** | Stamatakis 2022, first author | Crossref |
| **Mike Zourdos** | Robinson 2024 (`10.1007/s40279-024-02069-2`) and Pelland 2026 (`10.1007/s40279-025-02344-w`) | Crossref. Gate 1 names him as the originator of the RIR-based RPE scale; the rule is satisfied on both the proximity-to-failure and volume cards. |
| **James Steele** | Androulakis-Korakakis 2020 (`10.1007/s40279-019-01236-0`) and Robinson 2024 and Halperin 2022 | Crossref. The brief names him; he clears the rule on three of this round's cards. |
| **James Fisher** | Androulakis-Korakakis 2020 and Halperin 2022 | Crossref. Brief-named, rule satisfied. |
| **Brad Schoenfeld** | Schoenfeld 2017 (`10.1080/02640414.2016.1210197`) and Grgic 2018 (`10.1007/s40279-018-0872-x`) | Crossref. Brief-named, rule satisfied on the volume and frequency material. |
| **Israel Halperin** | Halperin 2022 (`10.1007/s40279-021-01559-x`), first author | Crossref |
| **Patroklos Androulakis-Korakakis** | first author of the minimum-dose review, and on Halperin 2022 | Crossref |

### Researcher credits that FAIL the rule and must NOT be written

- **Eric Helms.** Gate 1 offers him for the reps-in-reserve card. He is
  **not** on the author list of Robinson 2024, Halperin 2022 or Bastos
  2024. He is therefore **not a researcher credit** on any card in this
  round. He *is* a legitimate **communicator credit**, TRACED to
  strongerbyscience.com/reps-in-reserve/, where Gate 1 opened the URL and
  where he defines autoregulation. Write it that way, and note that the
  brief flags he currently carries no library credit at all.
- **Keith Baar.** Brief-named for tendon work. **Not** on the Lazarczuk
  2022 author list. No credit available on D7 without a source he is on.
- **Stuart Phillips.** Brief-named. Not on any training-pillar source in
  this round. Nutrition Gate 2's business, not this one.

### Communicator credits, from Gate 1, with verdicts

| Card | Name | Verdict | Evidence |
|---|---|---|---|
| `strength-minimum-weekly` | **Rhonda Patrick** | **TRACED** | foundmyfitness.com/topics/muscle-power, where she carries the 147,374 cohort. She is the only one of the card's three names Gate 1 opened a URL for on this practice. |
| `strength-minimum-weekly` | **Peter Attia** | **TRACED (adjacent)** | His DOAC blueprint clip gives his own three-resistance-day week (claim 112) — the topic, not this practice. Reword, do not remove. |
| `strength-minimum-weekly` | **Andy Galpin** | **TRACED (adjacent)** | "At least once a week in a deficit" (claim 116). Adjacent. Reword. |
| D3 exercise snacks | **Rhonda Patrick** | **TRACED** | foundmyfitness.com/topics/exercise-snacks. Gate 1 notes this page states its own limitations correctly, which is exactly what this card teaches — an unusually clean credit. |
| D3 exercise snacks | **Martin Gibala**, **Emmanuel Stamatakis** | **RESEARCHER** | Author-list rule satisfied on Stamatakis 2022. Must be labelled as researcher credits. |
| D4 / D5 (RIR) | **Eric Helms**, **Mike Zourdos** | **TRACED** (Helms, communicator) / **RESEARCHER** (Zourdos) | strongerbyscience.com/reps-in-reserve/ for Helms; Robinson 2024 and Pelland 2026 for Zourdos. |
| D6 power over sixty | **Rhonda Patrick** | **TRACED**, with a caveat | foundmyfitness.com/topics/muscle-power. But her page's strength of claim runs ahead of the two meta-analyses. Credit her for popularising the practice; do not import her framing. |
| D1 one-set week | **Mike Israetel** | **TRACED** | DOAC, claim 50 — one hour a week in two or three twenty-minute sessions, a couple of hard sets per muscle. He teaches this practice publicly. He is also a flagged commercial interest (a training app), and this claim happens to run *against* his product's incentive, which counts in its favour. |
| D1 one-set week | **Steele**, **Fisher**, **Androulakis-Korakakis** | **RESEARCHER** | Author-list rule satisfied. |
| D2 falls | — | **EMPTY** | Zero podcast coverage, confirmed. A researcher credit for the Pillay/Hartling group is available under the author-list rule if Gate 4 wants one. **An empty attribution here is the two-inlet design working, exactly as `PIPELINE.md` predicts.** |
| D7 tendon | **Peter Attia** | **TRACED (adjacent)** | DOAC blueprint, claim 113 — he gives the reasoning (strength outlives tendon pliability) and names no paper. Lazarczuk supplies the evidence he does not. Adjacent, and worth keeping as a reworded credit. |
| D8 concurrent | — | **EMPTY** | Nobody in the corpus covers it (Gate 1 L14). |
| `zone2` | **Peter Attia** | **TRACED — but flag for Gate 4** | He genuinely popularised Zone 2 for a general audience, so the credit is real. The problem is the `water-with-meals`/Valtin problem in reverse: the card is about to walk back the framing the credited person popularised. Recommendation — keep him (the card still teaches easy aerobic volume, which he does teach), remove the "Coaches call it Zone 2" line, and make sure no corrected sentence reads as though he endorses the correction. **Isaac's call if Gate 4 disagrees.** |

---

## G. CORRECTIONS TO GATE 1, AND OVERSTATEMENTS RECORDED

Per `README.md`, recorded without scorn.

1. **Gate 1's L16 points at the wrong paper.** It offers
   `10.1186/s40798-024-00706-8` — Warneke's **chronic** static-stretching
   meta-analysis — as "the paper that settles the size of the cost" of
   **pre-lift** stretching. They are different questions. The chronic paper
   finds stretching *increases* strength slightly (d = 0.30). The acute
   paper (`10.1016/j.jshs.2024.05.002`) is the right one and it finds the
   cost small and confined to long holds. **The debunk the brief asked for
   should not be written.**
2. **Gate 1's claim 81 is accurate but incomplete, and the gap is where
   the whole conflict lives.** The 90–120 minute figure is what Zhang
   2026's *abstract* reports, and the FoundMyFitness page repeated it
   faithfully. The dose-response table in the full text shows the curve is
   nearly flat from thirty minutes, which changes the reading entirely.
   Not an error by anyone — a reminder that a dose-response paper's
   abstract reports its best band, not its shape.
3. **Gate 1's claim 87 attributes to Halperin's meta-analysis a finding it
   does not contain.** Halperin 2022 explicitly found that **training
   status did not influence prediction accuracy**. The "it improves with
   weeks of practice" finding comes from Remmert's separate six-week
   follow-up, which was not opened this round.
4. **Jiménez-Lupión 2023 overstates its own results.** Both primary
   meta-analytic outcomes have confidence intervals crossing zero (TUG
   p = 0.05, 30s-STS p = 0.09), and the conclusion nonetheless asserts
   that power training "increases functional capacity related to fall risk
   further than other types of exercise". This is a paper overstating
   itself, not a podcast overstating a paper — worth recording because the
   library's usual failure mode is the other one.
5. **Storoschuk 2025 is a narrative review by an interested party.**
   Gibala is the field's leading interval researcher arguing against the
   low-intensity position, in a review with no protocol, no pooled
   estimate and no risk-of-bias assessment. It is sufficient to show the
   Zone 2 optimality claim is *unsupported*. It is not sufficient to show
   intervals are better, and the library should not use it that way.
6. **Confirmed: Gate 1's zero-podcast-coverage findings hold** for the
   minimum effective dose review (L1), the falls-prevention network
   meta-analysis (L4) and concurrent training (L14). Three of the four
   best-evidenced things in this round are covered by nobody in the
   corpus, and the strongest of them — 219 RCTs and 167,864 participants —
   is covered by nobody at all.

---

## What the training coach can say on a Tuesday that it could not before

- *"You've got fifteen minutes. One hard set on each of three lifts.
  The people who study this call that suboptimal and significant in the
  same sentence — take the second half."*
- *"You're 68. This is the best-evidenced thing in the whole library —
  219 trials and 167,000 people — and it's balance work plus some
  strength work, on your own, for a few months. Not a class, not a
  gadget."*
- *"You think you've got two reps left. You've probably got three.
  Everybody does — it doesn't get better with experience."*
- *"If what you want is to be stronger, you can stop with a couple left
  in the tank. It doesn't cost you the strength. It costs you the dread."*
- *"You don't need the watch to tell you it's Zone 2. Fourteen sports
  scientists couldn't agree what Zone 2 was until last year. Go at a pace
  where you could hold a conversation."*
- *"Two hours a week is a ceiling, not a target. Past that, the data stops
  being able to see any more benefit."*
- *"You can keep stretching before you lift. Just keep the holds under
  about thirty seconds — that's where the cost shows up, and it's small
  even then."*
