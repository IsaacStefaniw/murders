# Recovery round — findings

Written 2026-09-08 against `docs/research/BRIEF-recovery.md` and the shared
contract in `docs/research/README.md`. Twenty-five candidate protocols are in
`protocols.ts` beside this file; every one has a row in `sources.md` with a
resolvable DOI or PMID and the grade reasoning. Nothing here reaches a phone
until Isaac has read it.

How the sources were checked. About 190 papers were opened at a publisher
page, PMC full text, or the Europe PMC / NCBI record for the same PMID
(PubMed's own HTML refuses non-cookie fetches, so the mirror of the record
was used). Title, first author, year, journal, design and sample size were
read from the record, not from a podcast or a secondary article. Items that
could not be opened are marked "unverified" in the ledgers and were not
built on. Retraction Watch (via Crossref's embedded data and site search)
and Europe PMC's retraction filters were run on every load-bearing author
and paper; PubPeer returned 403 to every automated query and could not be
checked directly. That gap is recorded rather than papered over.

Grade spread of the 25 candidates: A 3 · B 12 · C 7 · D 2 · E 1 (sleep 15, longevity 7, training 3). Strong
evidence is 60% of this round on its own, which is higher than the library's
40%; the reason is that the round's biggest gaps (shift-work light, the cold
interference effect, the CBT-I signpost, the sleep-debt trials) happen to
sit on randomised evidence, while the sauna block that the audience most
wants stays at C throughout. The reviewer should feel free to move any of
the B grades down; none of them should move up.

## 1. What changed in this area's evidence since the library was written

- **Sauna: the trial evidence has arrived and it is modest.** The library's
  `sauna` card rests on the Finnish KIHD cohort, which is still the only
  cohort. What is new is the controlled work testing the mechanism at the
  same dose: a 41-person randomised trial of Finnish sauna four times a week
  at 79 °C in coronary patients (Debray 2023) found no change in vessel
  function, stiffness or blood pressure, and the first meta-analysis of
  passive-heating RCTs (Hamaya 2025, 20 trials) found a pooled systolic
  reduction of 2.5 mmHg that did not reach significance, with nothing on
  vessel function, glucose or lipids. The one positive trial (Lee 2022,
  n=47) added sauna to exercise and had no sauna-only arm. The 2025 HRV
  analysis of that trial was null. None of this contradicts the cohort; it
  bounds it.
- **Cold after lifting: settled in direction, small in size.** Four pooled
  analyses through 2026 (Malta 2021, Grgic 2023, Piñero 2024, Yu 2026) agree
  that cold immersion after resistance training blunts hypertrophy and
  strength gains; the size is small to moderate and the credible interval
  on hypertrophy crosses zero. Endurance adaptation is unaffected (Broatch
  2017). This is now A-grade for the interference and belongs in protocol
  copy, which it has been given.
- **Alcohol and sleep has a real meta-analysis now.** The paper everyone
  cites, Ebrahim 2013, is a narrative review with a published methodological
  critique (Pressman 2015). Gardiner 2025 (27 polysomnography studies) gives
  the numbers: REM disruption from about two standard drinks, faster sleep
  onset only from about five. See the `alcohol-cutoff` regrade.
- **Consumer wearables have six independent PSG validations, 2019 to 2025,
  that agree.** Sleep detected well; wake inside the night missed about half
  the time; stage agreement fair to moderate (kappa 0.20 to 0.65). Apple's
  own whitepaper could not be read (PDF over the fetch limit) and is not
  cited.
- **HRV and the app's data path, confirmed.** Apple Health stores HRV as
  SDNN (`HKQuantityTypeIdentifierHeartRateVariabilitySDNN`, verified on the
  developer documentation). Oura and Whoop compute rMSSD (Whoop: API field
  `hrv_rmssd_milli`; Oura: named by an independent validation, not by its
  own page). Oura's Apple Health integration page (updated 19 Aug 2026)
  lists what it writes and HRV is absent; Whoop's page returned an error
  shell on every attempt and the secondary sources (Terra 2022, Whoop staff
  Aug 2025) say the same, with the stated reason that the statistics differ.
  So the brief's suspicion is right: **neither writes HRV into Apple
  Health**, and readiness leaning on sleep and resting heart rate is the
  honest state of things. Any HRV in Health on an Oura or Whoop user's phone
  is Apple Watch SDNN and is not comparable to the ring's number. The
  app's copy should not imply otherwise.
- **HRV at the individual level.** Two meta-analyses of HRV-guided training
  (Düking 2021; Manresa-Rocamora 2021) find no significant pooled
  performance advantage over a fixed plan; a meta-analysis of athlete studies
  (Bellenger 2016) finds resting rMSSD rises slightly in both good adaptation
  and overreaching. A very large app cohort (Altini & Plews 2021, 28,175
  people) finds the biggest movers of nightly HRV are alcohol (about −12%)
  and illness (about −10%), not training. The library's `hrv-trend-check`
  already says most of this; it is now checkable.
- **The Why We Sleep problem is documented in the primary literature.**
  Two of the book's central claims were checked against the papers: the
  cancer claim is false as stated (Chen 2018, 65 studies, odds ratio 1.01
  for short sleep), and "the shorter you sleep, the shorter your life" is
  false as a monotonic claim (three meta-analyses agree on a U-shape with
  six hours indistinguishable from seven). The author's own 2019 reply
  concedes the WHO misattribution and the non-causal reading. No card in
  this round attributes anything to that book.
- **Longevity compounds have not moved.** Rapamycin's only 48-week RCT
  (PEARL 2025) missed its primary endpoint; TAME has not reported; NMN/NR
  have surrogate trials and two 2025 meta-analyses that disagree on muscle
  function; resveratrol's best RCT and cohort are null. The exclusion
  stands and no protocol was written.

## 2. Overclaims found

Each of these is a popularised claim, the paper it traces to, and the gap.
The first three belong in protocol copy and have been written in.

| Claim | Paper | What it actually found | Gap |
|---|---|---|---|
| "Sauna four times a week cuts all-cause mortality by 40%" | Laukkanen 2015 JAMA Intern Med | HR 0.60 (0.46–0.80) for 4–7×/week vs once, in 2,315 Finnish men measured once by questionnaire; the 4–7×/week group was 201 men with 62 deaths; session length was not associated with all-cause mortality | An adjusted hazard ratio in one never-replicated cohort is not a cut; two letters in the same journal argued the size is implausible for a causal effect, and the authors agreed causation is unproven |
| "Sauna is a cardio workout" | Ketelhut 2019 (n=19); Hussain 2022 (n=10); Kunutsor 2018 | Heart rate and pressure during sauna resemble 60–100 W cycling because of heat, not muscular work; infrared produced no exercise-like response; fitness dominated sauna in the joint cohort analysis (HR 0.51 vs 0.74) | No oxygen-uptake, energy-expenditure or muscle adaptation equivalence has ever been shown |
| "Sauna improves deep sleep by 70%" | Unindexed 1976 report of 5 athletes (unverified); Haghayegh 2019 | No sauna trial with sleep as an outcome exists; the meta-analysis is warm baths at 40–42 °C one to two hours before bed | The sauna-specific claim is E; the library's `sauna` card currently says sauna "reliably helps … sleep" and should not |
| "Infrared has the same evidence as Finnish sauna" | Hussain & Cohen 2018; Beever 2009 | 25 of 40 dry-sauna studies are infrared, mostly small clinical heart-failure series; the review says it cannot distinguish the modalities | Every mortality, dementia, stroke and hypertension association is Finnish-sauna KIHD data. Two "infrared meta-analyses" quoted on retailer sites (a 2024 Eur J Prev Cardiol 17-study analysis; a 2023 JACC 89-patient RCT) could not be found in any journal and should be treated as fabricated until someone produces a DOI. This matters for Steam Saunas' own copy. |
| "Sauna detoxes heavy metals" | Genuis 2011 (n=20) | Metals are detectable in sweat | Detectability is not body-burden reduction; no study measured a fall in total burden |
| "Cold plunges boost dopamine 250% for hours" | Šrámek 2000 (about 10 men) | One hour of head-out immersion at 14 °C raised plasma noradrenaline 530% and dopamine 250%, measured during the immersion | Sixty minutes, not three; no post-immersion time course; plasma is not brain. The library's `cold-finish` card says "for hours" and should not |
| "Cold water burns fat / activates brown fat for weight loss" | Yoneshiro 2013 (n=12); van der Lans 2013 (n=17) | 0.7 kg of fat after six weeks of two hours a day at 17 °C air; brown-fat recruitment with no body-composition change | No immersion trial has measured fat loss; the acute energy burn is during the immersion |
| "Cold showers cut sick days by a third" | Buijze 2016 (n=3,018) | Self-reported sickness absence fell 29%; days ill did not change; 30 seconds performed the same as 90 | People were ill just as often; they went to work anyway. One trial, unblinded, self-report |
| "Cold plunges boost immunity" | Kox 2014; Zwaag 2022; Cain 2025 | The famous RCT combined breathing, meditation and cold; the dismantling study found cold alone did little and breathing drove the effect; the pooled immune effect is null and acute inflammation rises | No trial shows fewer infections |
| "Ice baths reduce muscle inflammation" | Peake 2017 (n=9) | Intramuscular inflammatory cells and cytokines after lifting did not differ between cold and active recovery | The mechanism most often cited is not supported by the direct biopsy study |
| "You can catch up on the weekend" | Depner 2019 (n=36); Banks 2010 (n=159); Belenky 2003 (n=66) | Weekend recovery clawed back about an hour and did not prevent a 9–27% fall in insulin sensitivity; one 10-hour night and three 8-hour nights left performance below baseline | True for felt alertness and for the mortality association (Åkerstedt 2019); false for metabolic and performance recovery |
| "Less than seven hours doubles your cancer risk" | Chen 2018 (65 studies, 1.55M people) | Short sleep OR 1.01; long sleep OR 1.02 | The real WHO/IARC finding concerns night-shift work with circadian disruption, a different exposure |
| "Eight hours is the number" | Hirshkowitz 2015; Watson 2015; Kitamura 2016 | Consensus is 7–9 hours and "7 or more"; individual need in one laboratory ranged 7.3–9.3 hours | No consensus body ever said eight |
| "A nightcap helps you sleep" | Gardiner 2025 (27 studies); Landolt 1996 (n=10) | Sleep onset shortens only at about five drinks; REM is disrupted from about two; a moderate amount taken six hours before bed, fully cleared by lights-out, still doubled second-half wakefulness | It helps you fall asleep only at amounts that damage the rest of the night, and clearing it by bedtime does not remove the effect |
| "Your watch measures deep sleep" | Robbins 2024; Schyvens 2025; Miller 2022; Lee 2023; Chinoy 2021 | Stage kappa 0.20–0.65; deep-sleep epoch hit rate about 50% for Apple Watch S8; wake specificity 18–54% | No consumer device records brain activity; stages are inferred from movement and heart rate |
| "A low HRV means you are overtrained" | Bellenger 2016 (27 studies); Altini & Plews 2021 (28,175 people) | Resting rMSSD rises slightly in both adaptation and overreaching; alcohol and illness move nightly HRV far more than training | A low reading is a prompt to check sleep, alcohol and illness, not a diagnosis |
| "Wearables detect illness days early" | Miller 2020 (Whoop, n=271); Mason 2022 (Oura, 73 cases in 63,153) | Whoop flagged 20% of positives two days before symptoms and 34% of symptomatic negatives; Oura sensitivity 82%, specificity 63%, no positive predictive value reported | At 63% specificity roughly one healthy night in three would alert; at a 0.1%/day infection rate the arithmetic predictive value of an alert is about 0.2% (my arithmetic on their numbers) |
| "Shift workers adapt to nights" | Folkard 2008 | Under 3% of permanent night workers show complete circadian adjustment; under 25% a useful partial one | Engineered partial adaptation is achievable with light, glasses and a fixed dark day sleep; spontaneous adaptation is not |
| "Light in the morning cures jet lag" | Khalsa 2003; Bin 2019 | The direction rules are sound physiology; nine of thirteen field studies of non-drug interventions were negative | The direction is right; the benefit on a real trip is unproven |
| "VO2 max is the single best predictor of longevity" | Mandsager 2018 (122,007); Kokkinos 2022 (750,302) | One of the strongest predictors in referred clinical samples using treadmill-estimated METs | "Single best" has never been tested head-to-head; it is a marker that also absorbs subclinical disease |
| "Sitting is the new smoking" | Vallance 2018 | Sedentary behaviour HR 1.22 vs smoking RR 2.8 (heavy smokers 4.1–4.4); 190 vs over 2,000 excess deaths per 100,000 per year | About an order of magnitude apart, and sitting's association is largely offset by 30–40 min a day of moderate activity (Ekelund 2020); smoking's is not |
| "Older adults need double the protein" | Bauer 2013; Deutz 2014; Nunes 2022 | 1.0–1.2 g/kg for healthy older adults, 25–50% above the general guideline, by consensus | "Double" is the plateau from young trained lifters in Morton 2018, not an older-adult requirement |
| "Walk 10,000 steps" | Paluch 2022 (15 cohorts, 47,471) | The curve flattens at 6,000–8,000 (over 60) and 8,000–10,000 (under 60) | Not harmful, simply not where the curve turns; the library's `step-floor` already has this right |

## 3. Contradicted practices

Things people do that the evidence is against, with the citation. The first
five have been written into protocol copy in this round.

1. **Ice bath after every lifting session in a muscle-building block.**
   Roberts 2015 (J Physiol, n=21), Fyfe 2019 (n=16), Fuchs 2020 (n=12), and
   four pooled analyses (Malta 2021; Grgic 2023; Piñero 2024; Yu 2026).
   Written into `cold-on-non-lifting-days` and `cold-for-tomorrow`.
2. **Sauna as a substitute for exercise.** Kunutsor 2018 (fitness HR 0.51
   vs sauna 0.74); Hussain 2022; Hamaya 2025. Written into
   `sauna-after-endurance` and the `sauna` regrade note.
3. **Post-workout sauna for muscle growth.** Ahokas 2025 (n=40, null);
   Stadnyk 2018 (n=10, null); Labidi 2021 (n=15, null). Written into
   `sauna-recovery-low-heat`.
4. **Sleep hygiene as the treatment for chronic insomnia.** Edinger 2021
   (AASM: conditional against as a single component); Chung 2018 (15
   studies); Espie 2019 (it was the losing control arm). Written into
   `cbt-i-signpost`.
5. **Sleeping in at the weekend to repay the week.** Depner 2019; Banks
   2010; Belenky 2003. Written into `debt-repay-over-nights`.
6. **Alcohol anywhere near the sauna.** Kenttämies 2008 (alcohol in half of
   all Finnish sauna deaths, 1990–2002); Yang 2018 (79% of Korean sauna
   deaths); Hannuksela 2001. In every heat safety line.
7. **First-trimester heat loads.** Moretti 2005 (meta-analysis, OR 1.92 for
   neural-tube defects with maternal hyperthermia); Milunsky 1992. In every
   heat safety line; customary Finnish practice does not override it.
8. **Standing desks as a cardiovascular measure.** Shrestha 2018 (Cochrane:
   about 100 min less sitting, no health endpoint); Ahmadi 2024 (83,013,
   thigh-worn devices: standing unrelated to major heart disease, and past
   two hours a day associated with circulatory problems in the legs).
   Written into `desk-day-offset`.
9. **Two naps on a night shift.** Slanger 2016 (Cochrane: non-significant
   increase in sleepiness, very low quality). Written into `on-shift-nap`.
10. **A thirty-minute nap straight before safety-critical work.** Hilditch
    2016 (impairment to at least 47 minutes; none after a 10-minute nap).
    Written into `on-shift-nap` and `pre-nights-nap`.
11. **Driving home after a night shift as routine.** Lee 2016 (near-crashes
    in 6 of 16 post-shift drives, none after sleep). Written into
    `no-drive-after-nights`.
12. **Comparing Apple Health HRV with the ring's HRV.** SDNN vs rMSSD,
    different sampling, and the vendors do not sync it. Written into the
    `hrv-trend-check` note below.
13. **Trusting deep-sleep minutes as a measurement.** Every PSG validation
    in the wearables ledger. Written into `tracker-stages-are-estimates`.
14. **Long daily naps (an hour or more) as routine in older adults.** Yamada
    2015 (11 cohorts: CVD RR 1.82, mortality RR 1.27 for naps ≥60 min; none
    under 60). Association only, and confounded by illness, but a flag for
    something wrong with the night. Not written as a card; belongs in the
    `nap-protocol` copy.
15. **Chasing exactly eight hours.** No consensus body recommends it;
    individual need varies by about two hours. Written into
    `sleep-need-calibration`.
16. **Trusting how sleepy you feel as the gauge.** Van Dongen 2003 (felt
    sleepiness plateaus while performance keeps falling); Rupp 2009.
    Written into `sleep-opportunity-tally`.
17. **A low-protein diet in midlife to live longer (from Levine 2014).**
    A single cohort with one day's food recall and about 21 diabetes deaths
    behind the headline; criticised in Science; not replicated. In the
    `protein-after-sixty-five` copy.

## 4. Regrades proposed

For existing protocols. The reviewer decides; the reasoning is the point.

| Protocol | Now | Proposed | Reasoning |
|---|---|---|---|
| `alcohol-cutoff` | B | **C**, with the copy rewritten | The card's claim is timing: "the fix is timing rather than abstinence", "last drink at least four hours before bed". The only controlled timing study (Landolt 1996, n=10) found a moderate amount taken six hours before bed, fully metabolised by lights-out, still doubled second-half wakefulness, and the meta-analysis (Gardiner 2025) shows the effect is driven by amount, with REM disruption from about two drinks. The architecture facts in the why are right; the instruction they are attached to is not supported. Suggested summary: "Fewer drinks matters more than earlier drinks: on a night that matters, one, and stop early." Keep the deadline anchor. |
| `stimulus-control` | A | **B** | The card says this component "has the most standalone randomised evidence" inside CBT-I. The 2021 AASM guideline gives multicomponent CBT-I a strong recommendation and stimulus control a conditional one, and the standalone meta-analytic base for sleep restriction (Maurer 2021, eight RCTs, g about 0.9) is now larger than for stimulus control. A component with a conditional recommendation is "tested and held up", not "many studies agree". The practice is unchanged and still excellent. |
| `sauna` | C | **C**, copy edited | Keep the grade. Remove "reliably helps relaxation and sleep": there is no sauna trial with sleep as an outcome, and the 70% deep-sleep figure traces to an unindexed 1976 report of five athletes. Say instead that the cohort is one Finnish population measured once, that the headline group was 201 men, and that the randomised evidence at the same dose is modest. The `finishBeforeSleepMin: 60` should become 90 to match `heat-before-bed-gap` (the bath data say one to two hours; sauna is a larger heat load). |
| `cold-finish` | C | **C**, copy edited | Keep the grade. Remove "spikes alertness and mood chemistry for hours": the catecholamine paper measured during a one-hour immersion with no time course. Thirty seconds is the evidence-based length (Buijze 2016: 30 s performed the same as 60 or 90), so "30–60 seconds" can become "30 seconds". Add one line on lifting days: this card sits in the training pillar and a morning cold shower before an evening session is fine, but the same person should read `cold-on-non-lifting-days` before adding a plunge. |
| `nap-protocol` | C | **C**, copy edited | Keep the grade. "Twenty minutes or ninety" should become "ten minutes of sleep, twenty in bed": in the head-to-head laboratory comparison (Brooks & Lack 2006) ten minutes of actual sleep beat twenty, which took about 35 minutes to pay off, and thirty produced inertia. The ninety-minute option has no comparable trial support and adds a long nap that the older-adult cohort data flag; consider dropping it. Add: no naps at all while working through insomnia (both CBT-I components forbid them). |
| `hrv-trend-check` | C | **C**, copy added | Keep the grade and the card. Add two facts the app now depends on: Apple Health holds SDNN, the ring and the strap show rMSSD, and neither Oura nor Whoop writes HRV into Health, so the number the app can read is the Watch's and is not the ring's. Add that in the largest dataset alcohol and illness move nightly HRV far more than training does. |
| `caffeine-cutoff` | B | **B**, confirmed | Gardiner 2025 supports it: a large amount disturbed polysomnography-measured sleep even twelve hours before bed, a small one did not at four. The ten-hour rule stands; the card could add that the size of the last coffee matters as much as the hour. |
| `step-floor` | B | **B**, confirmed | Paluch 2022 (15 device-measured cohorts) is the A-grade source for the 6,000–8,000 plateau and could replace the current citation wording. It is a meta-analysis, so a case for A exists, but round two graded the same walking literature B on purpose (`daily-walk`) and consistency matters more than one letter. |
| `wake-anchor` | B | **B**, confirmed | Windred 2024 (60,977, accelerometry) is verified: regularity out-predicted duration for mortality and duration added nothing once regularity was in the model. |

No upgrades are proposed. The round found nothing in the existing sleep or
longevity cards graded below what its evidence supports.

## 5. What I declined to write, and why

- **Sleep restriction therapy as a card.** It is the single most effective
  component of CBT-I (Maurer 2021) and it is also the one with a documented
  cost: reaction time slowed by about 53 ms in the first two weeks in the
  same group's acute study, and the protocol's contraindications (bipolar
  disorder, epilepsy, untreated sleep apnoea, safety-critical work) need a
  clinician to screen for. Setting a person's time in bed to their average
  sleep time and titrating it weekly is a clinician's call. `cbt-i-signpost`
  names the programme and routes to it; it does not deliver it. This is the
  same call the injury round made about return to training.
- **Waon therapy and any heat protocol for heart failure.** WAON-CHF
  (n=149) is a supervised inpatient medical treatment that missed its
  primary endpoint. Out of scope.
- **Sauna guidance in pregnancy beyond the contraindication.** The Finnish
  custom (short sauna in healthy pregnancy) is reported in Finnish-language
  sources whose content could not be read, and it is D-level practice
  against an A-grade teratology signal for first-trimester hyperthermia.
  Every heat card excludes the first trimester and routes the rest to a
  doctor. Nothing more is written.
- **Melatonin for shift work or jet lag.** A substance, handled by the
  supplements carve-out (`melatonin-timing`). The Cochrane reviews (Liira
  2014; Herxheimer & Petrie 2002) are recorded in the ledgers for the
  reviewer and not built on.
- **Cold water as a treatment for depression.** The load-bearing source is
  a single case report (van Tulleken 2018, n=1) confounded by exercise,
  outdoors and company. The one RCT examining mood found no difference. An
  E-grade card with a mental-health claim on it is not education; it is a
  liability, and the urge and mood tools elsewhere in the app carry the
  route to help.
- **Illness-detection features from wearables.** Specificity of 63% and no
  reported positive predictive value. Not a practice; a product claim the
  app should not echo.
- **Any compound.** Rapamycin, metformin, NAD precursors, resveratrol: the
  evidence has not moved to outcome level (section 1). The exclusion holds.
- **Exact intervals the evidence does not give.** How many hours after
  lifting a cold plunge becomes safe (the ">8 h" figure is an expert
  proposal); how long before bed a sauna must end (borrowed from bath
  data); which clock time an anchor sleep must sit at. Each card says the
  number is borrowed or untested rather than inventing one.
- **Standing-desk cards, brown-fat cards, contrast-therapy cards as
  benefits.** Standing is not activity; cold does not meaningfully move fat;
  contrast is not better than cold alone. `sauna-then-cold` is written as an
  E precisely so the audience that will do it anyway finds an honest card
  rather than silence.

## Corrections to the brief's own citations

Recorded so the next round does not chase them.

- "Minors & Waterhouse 1981/1983, Ergonomics or Chronobiologia" does not
  exist under those venues; the anchor-sleep papers are Int J Chronobiol
  1981 (PMID 7239725) and J Physiol 1983 (PMID 6663508).
- "Leong et al. 2023 Sleep Health" (napping and brain volume) does not
  exist; the paper is Paz, Dashti & Garfield 2023.
- "López-Bueno 2022 Lancet Healthy Longevity" (grip strength) does not
  exist; the dose-response meta-analysis is Ageing Res Rev 2022 (PMID
  36332759).
- Ebrahim 2013 is a narrative review, not a meta-analysis, and has a
  published critique; Gardiner 2025 carries the alcohol numbers.
- Pietilä 2018's "about 4,000" is participants (4,098), not nights.
