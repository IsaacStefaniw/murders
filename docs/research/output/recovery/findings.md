# Recovery round — findings (revised after review)

Written 2026-09-08 against `docs/research/BRIEF-recovery.md`, then revised
the same day against `REVIEW.md` and the rewritten `docs/research/README.md`.
Twenty-two candidate protocols are in `protocols.ts` beside this file, each
with a row in `sources.md`. Three more are held back and described below.
Nothing here reaches a phone until Isaac has read it.

## What was checked, and how

**About 190 papers were opened and read at the record level**: the
publisher page, the PMC full text, or the Europe PMC / NCBI record for the
same PMID. For each, the title, first author, year, journal, design and
sample size were read from the record itself, never from a podcast, a
retailer's blog or a secondary article. The five per-topic ledgers in
`ledgers/` hold all of them, including the studies that argue against the
cards. Items that could not be opened are marked unverified there and were
not built on. Retraction Watch (through Crossref's embedded data and site
search) and Europe PMC's retraction filters were run on every load-bearing
author and paper: no retractions or expressions of concern on any source
used. PubPeer returned 403 to every automated query and could not be
checked; that gap is recorded rather than papered over.

Podcasts were used for what the contract says they are for: *The Drive*,
*Huberman Lab* and *FoundMyFitness* pointed at the sauna, cold, sleep and
longevity literatures quickly, and the papers were then opened. Every
`attribution` names people who have genuinely covered the practice in
public; the round leans on Andrew Huberman (16 cards), Peter Attia (10),
Rhonda Patrick (8) and Andy Galpin (4), with the researchers whose work the
card rests on beside them where a listener would know the name.

## Changes made after review

1. **The "corrections to the brief" section is gone.** The five citations
   it listed were wrong in the search prompts this round wrote for itself,
   not in the brief, which names researchers and journals and no papers.
   The corrections are still worth having and now sit at the end of this
   file under "Citations that circulate wrongly", with no source document
   invented for them.
2. **Conditional practices on unconditional schedules.** Three cards were
   event-driven in their copy and recurring in the scheduler:
   `cbt-i-signpost` (worst: "book a GP about insomnia" every Monday for
   everyone), `sleep-bank-ahead` and `debt-repay-over-nights`. They are
   held out of `protocols.ts` pending a `condition` field, with their
   content folded into the weekly `sleep-opportunity-tally` card, which is
   true every week: count the hours, count the broken nights, and the copy
   says what to do when either is short. Two more were rewritten as things
   that recur: `sleep-need-calibration` ("once a year on holiday") is now
   "on any alarm-free morning, note the length", checked on Sundays;
   `cold-for-tomorrow` ("after a competition") is now "after the week's
   hardest session", which for most people is a Saturday. A proposed shape
   for the field is at the end of this file.
3. **Four grades moved down**, none up: `cold-for-tomorrow` A→B (the
   Cochrane inputs are low quality and unblinded), and `sauna-rehydrate`,
   `sleep-opportunity-tally` and `caffeine-on-nights` B→C, in each case
   because the practice on the card is an untested inference from a
   well-measured fact. Spread is now A 1 · B 9 · C 9 · D 2 · E 1, which is
   45% A and B against the library's 40%.
4. **Every summary and why re-voiced** for the person about to do it:
   the smallest version that still works is named, the copy says what they
   get, nothing on a card undermines the practice it describes, and the
   `sauna-then-cold` E-grade card now says plainly that some of the effect
   is the ritual and the ritual works. Grades did not move for warmth.

## 1. What changed in this area's evidence since the library was written

- **Sauna: the trial evidence has arrived and it is modest.** The library's
  `sauna` card rests on the Finnish KIHD cohort, still the only cohort.
  New since then: a 41-person randomised trial of Finnish sauna four times a
  week at 79 °C in coronary patients (Debray 2023) found no change in
  vessel function, stiffness or blood pressure; the first meta-analysis of
  passive-heating RCTs (Hamaya 2025, 20 trials) found a pooled systolic
  fall of 2.5 mmHg that did not reach significance and nothing on vessel
  function, glucose or lipids; the one positive trial (Lee 2022, n=47)
  added sauna to exercise with no sauna-only arm, and its HRV analysis was
  null. None of this contradicts the cohort; it bounds it.
- **Cold after lifting: settled in direction, small in size.** Four pooled
  analyses through 2026 agree that cold immersion after resistance training
  blunts hypertrophy and strength gains; endurance adaptation is unaffected
  (Broatch 2017). Now in protocol copy.
- **Alcohol and sleep has a real meta-analysis.** Ebrahim 2013, the paper
  everyone cites, is a narrative review with a published critique
  (Pressman 2015). Gardiner 2025 (27 polysomnography studies) gives the
  numbers: REM disruption from about two drinks, faster onset only from
  about five. See the `alcohol-cutoff` regrade.
- **Consumer wearables have six independent PSG validations, 2019 to
  2025, that agree.** Sleep detected well; wake inside the night missed
  about half the time; stage agreement fair to moderate.
- **HRV and the app's data path, confirmed.** Apple Health stores HRV as
  SDNN (verified on the developer documentation); Oura and Whoop compute
  rMSSD (Whoop's API field `hrv_rmssd_milli`; Oura named by an independent
  validation). Oura's Apple Health page (updated 19 Aug 2026) lists what it
  writes and HRV is absent; Whoop's page could not be opened and the
  secondary sources say the same, giving the differing statistics as the
  reason. **Neither writes HRV into Apple Health.** Readiness leaning on
  sleep and resting heart rate is the honest state, and the app's copy
  should not imply more.
- **HRV-guided training** shows no significant pooled performance advantage
  over a fixed plan (Düking 2021; Manresa-Rocamora 2021); resting rMSSD
  rises slightly in both good adaptation and overreaching (Bellenger 2016);
  in 28,175 app users the biggest movers of nightly HRV are alcohol (about
  −12%) and illness (about −10%), not training (Altini & Plews 2021).
- **Two central claims from *Why We Sleep* fail against the papers**: the
  cancer claim (Chen 2018, 65 studies, odds ratio 1.01 for short sleep) and
  the monotonic "shorter sleep, shorter life" (three meta-analyses agree on
  a U-shape with six hours indistinguishable from seven). No card here
  attributes anything to that book, and the round added no Walker credits.
- **Longevity compounds have not moved.** Rapamycin's only 48-week RCT
  (PEARL 2025) missed its primary endpoint; TAME has not reported; NMN/NR
  have surrogate trials and two 2025 meta-analyses that disagree;
  resveratrol's best RCT and cohort are null. The exclusion holds.

## 2. What is genuinely well supported

The practices this round would put in front of somebody tomorrow.

- **Bright light on nights, dark glasses home, a fixed dark day sleep.**
  Randomised in the laboratory (Crowley 2003, n=67), replicated in real
  nurses and police by an independent group (Boivin 2002, 2012). It moves
  the clock nine to eleven hours against four or five without it. Three
  cards: `night-shift-light`, `dark-glasses-home`, `night-anchor-sleep`.
- **The evening nap before the first night, and one short nap at the low
  point.** Schweitzer 2006 (laboratory 68, field 53); Zion 2019 (109
  nurses); Martin-Gill 2018 (13 studies pooled). The shift-work
  countermeasures with the best evidence the Cochrane reviewers could find.
- **Not driving home after nights.** Lee 2016: near-crashes in 6 of 16
  post-shift drives on a closed track, none after sleep.
- **Cold water kept away from lifting, and used after the hardest session
  of the week.** The interference effect is the best-established finding in
  the cold literature; the soreness and next-day-power effect is the second.
  Together they tell someone exactly when to plunge.
- **The strength floor.** Two independent meta-analyses of cohorts (Momma
  2022; Shailendra 2022): any muscle-strengthening activity is associated
  with 10–27% lower mortality, with the association strongest at 30–60
  minutes a week. The kindest shape in the round.
- **Reading the tracker for timing and totals, not stages.** Six PSG
  validations agree, and it lets people keep enjoying the device.
- **Heat finishing well before bed, and drinking back what it took.**
  Borrowed from the warm-bath meta-analysis and a 674-person measurement;
  both C on the card because the sauna-specific step is inferred, both
  worth doing tonight.
- **CBT-I for chronic insomnia**, held as a card but carried in the ledger
  copy: the strongest recommendation in the 2021 AASM guideline, 87 RCTs
  pooled, a 1,711-person digital trial. An app cannot deliver it; it can
  tell someone when it is time.

## 3. Where the popular version overstates the paper

Recorded plainly and without scorn. The first three are in protocol copy.

| Claim | Paper | What it actually found | Gap |
|---|---|---|---|
| "Sauna four times a week cuts all-cause mortality by 40%" | Laukkanen 2015 JAMA Intern Med | HR 0.60 (0.46–0.80) for 4–7×/week vs once, in 2,315 Finnish men measured once by questionnaire; the 4–7×/week group was 201 men with 62 deaths; session length was not associated with all-cause mortality | An adjusted hazard ratio in one never-replicated cohort is an association; two letters in the same journal argued the size is implausible for a causal effect and the authors agreed causation is unproven |
| "Sauna is a cardio workout" | Ketelhut 2019 (n=19); Hussain 2022 (n=10); Kunutsor 2018 | Heart rate and pressure during sauna resemble 60–100 W cycling because of heat, not muscular work; infrared produced no exercise-like response; fitness dominated sauna in the joint analysis (HR 0.51 vs 0.74) | No oxygen-uptake, energy or muscle-adaptation equivalence has been shown; the sauna is an addition to exercise, and a good one |
| "Sauna improves deep sleep by 70%" | An unindexed 1976 report of 5 athletes (unverified); Haghayegh 2019 | No sauna trial with sleep as an outcome exists; the meta-analysis is warm baths at 40–42 °C one to two hours before bed | The sauna-specific claim is E; the library's `sauna` card says sauna "reliably helps … sleep" and should not |
| "Infrared has the same evidence as Finnish sauna" | Hussain & Cohen 2018; Beever 2009 | 25 of 40 dry-sauna studies are infrared, mostly small clinical series; the review cannot distinguish the modalities | Every long-run association is Finnish-sauna KIHD data. Two "infrared meta-analyses" quoted on retailer sites (a 2024 Eur J Prev Cardiol 17-study analysis; a 2023 JACC 89-patient RCT) could not be found in any journal and should be treated as fabricated until someone produces a DOI. This bears on Steam Saunas' own copy. |
| "Sauna detoxes heavy metals" | Genuis 2011 (n=20) | Metals are detectable in sweat | Detectability is not body-burden reduction |
| "Cold plunges boost dopamine 250% for hours" | Šrámek 2000 (about 10 men) | One hour at 14 °C raised plasma noradrenaline 530% and dopamine 250%, measured during the immersion | Sixty minutes, not three; no post-immersion time course; plasma is not brain. The library's `cold-finish` card says "for hours" and should not |
| "Cold water burns fat" | Yoneshiro 2013 (n=12); van der Lans 2013 (n=17) | 0.7 kg of fat after six weeks of two hours a day at 17 °C air; brown fat recruited with no body-composition change | No immersion trial has measured fat loss |
| "Cold showers cut sick days by a third" | Buijze 2016 (n=3,018) | Self-reported sickness absence fell 29%; days ill did not change; 30 seconds performed the same as 90 | People were ill just as often; they went to work anyway. Thirty seconds is the evidence-based length |
| "Cold plunges boost immunity" | Kox 2014; Zwaag 2022; Cain 2025 | The famous RCT combined breathing, meditation and cold; the dismantling study found breathing drove the effect; the pooled immune effect is null | No trial shows fewer infections |
| "Ice baths reduce muscle inflammation" | Peake 2017 (n=9) | Intramuscular inflammatory markers after lifting did not differ between cold and active recovery | The commonest stated mechanism is not supported by the direct biopsy study |
| "You can catch up on the weekend" | Depner 2019 (n=36); Banks 2010 (n=159); Belenky 2003 (n=66) | A weekend recovered about an hour and did not prevent a 9–27% fall in insulin sensitivity; one 10-hour night and three 8-hour nights left performance below baseline | True for felt alertness and for the mortality association (Åkerstedt 2019); the repayment is several earlier nights |
| "Less than seven hours doubles your cancer risk" | Chen 2018 (65 studies, 1.55M people) | Short sleep OR 1.01; long sleep OR 1.02 | The WHO/IARC finding concerns night-shift work, a different exposure |
| "Eight hours is the number" | Hirshkowitz 2015; Watson 2015; Kitamura 2016 | Consensus is 7–9 hours and "7 or more"; individual need in one laboratory ranged 7.3–9.3 hours | No consensus body ever said eight |
| "A nightcap helps you sleep" | Gardiner 2025 (27 studies); Landolt 1996 (n=10) | Sleep onset shortens only at about five drinks; REM is disrupted from about two; a moderate amount six hours before bed, fully cleared, still doubled second-half wakefulness | Fewer drinks matters more than earlier drinks |
| "Your watch measures deep sleep" | Robbins 2024; Schyvens 2025; Miller 2022; Lee 2023; Chinoy 2021 | Stage kappa 0.20–0.65; deep-sleep epoch hit rate about 50% for Apple Watch S8; wake specificity 18–54% | Stages are inferred from movement and heart rate; timing and totals are what the device gets right |
| "A low HRV means you are overtrained" | Bellenger 2016; Altini & Plews 2021 | Resting rMSSD rises slightly in both adaptation and overreaching; alcohol and illness move nightly HRV far more than training | A low reading is a prompt to check sleep, alcohol and illness |
| "Wearables detect illness days early" | Miller 2020 (Whoop, n=271); Mason 2022 (Oura, 73 cases) | Whoop flagged 20% of positives two days early and 34% of symptomatic negatives; Oura sensitivity 82%, specificity 63%, no predictive value reported | At 63% specificity about one healthy night in three would alert; the arithmetic predictive value of an alert at a 0.1%/day infection rate is about 0.2% (my arithmetic on their numbers) |
| "Shift workers adapt to nights" | Folkard 2008 | Under 3% of permanent night workers show complete adjustment | Engineered partial adaptation with light, glasses and a fixed day sleep is achievable; spontaneous adaptation is not |
| "Light in the morning cures jet lag" | Khalsa 2003; Bin 2019 | Sound physiology; nine of thirteen field studies negative | The direction is right; the size of the benefit on a real trip is unknown |
| "VO2 max is the single best predictor of longevity" | Mandsager 2018; Kokkinos 2022 | One of the strongest predictors in referred clinical samples | "Single best" has never been tested head-to-head; it is also a marker of subclinical disease |
| "Sitting is the new smoking" | Vallance 2018 | Sedentary HR 1.22 vs smoking RR 2.8 (heavy smokers 4.1–4.4) | An order of magnitude apart, and sitting's association is largely offset by 30–40 minutes a day of moderate activity (Ekelund 2020) |
| "Older adults need double the protein" | Bauer 2013; Deutz 2014; Nunes 2022 | 1.0–1.2 g/kg for healthy older adults, a quarter to a half above the general guideline | "Double" is the plateau from young trained lifters (Morton 2018) |
| "Walk 10,000 steps" | Paluch 2022 (15 cohorts) | The curve flattens at 6,000–8,000 (over 60) and 8,000–10,000 (under 60) | Not harmful; not where the curve turns; `step-floor` already has this right |

## 4. Time-back findings

Things people can stop, framed as the minutes they get back. Kept to about
a fifth of the round.

1. **The ice bath after every lifting session.** Twenty cold minutes back,
   twice a week, and better gains for it. Roberts 2015; Fyfe 2019; Fuchs
   2020; Malta 2021; Grgic 2023; Piñero 2024; Yu 2026.
2. **The post-workout sauna for muscle.** Keep it for the pleasure and the
   next-day ease; stop expecting it to grow anything. Ahokas 2025 (n=40,
   null); Stadnyk 2018; Labidi 2021.
3. **Sleep-hygiene checklists as the fix for chronic insomnia.** AASM 2021
   recommends against hygiene alone; Chung 2018; Espie 2019 (it was the
   losing control arm). The time goes into asking for the programme that
   works.
4. **The weekend lie-in as repayment.** Depner 2019; Banks 2010; Belenky
   2003. Two earlier nights midweek do what the lie-in promised.
5. **The standing desk as a heart measure.** Ahmadi 2024 (83,013): standing
   unrelated to heart disease, and past two hours a day linked to leg
   circulation trouble. Sit, stand, whatever; walk at lunch.
6. **The second nap on a night shift.** Slanger 2016: no extra benefit. One
   good ten-minute one.
7. **Chasing eight hours.** No consensus body recommends it; need varies by
   about two hours.
8. **Comparing the Watch's HRV with the ring's.** SDNN and rMSSD are
   different numbers and the vendors do not sync them. Pick one and trend it.
9. **Long daily naps as routine past sixty** (an hour or more). Yamada 2015
   (11 cohorts): associated with higher cardiovascular risk, almost certainly
   as a marker of a bad night; a reason to fix the night, not a card.

Alcohol near the sauna and first-trimester heat loads are contradicted
outright (Kenttämies 2008; Yang 2018; Hannuksela 2001; Moretti 2005;
Milunsky 1992) and sit in every heat safety line rather than here.

## 5. Regrades proposed, and what I declined to write

### Regrades, for existing protocols

| Protocol | Now | Proposed | Reasoning |
|---|---|---|---|
| `alcohol-cutoff` | B | **C**, copy rewritten | The card's instruction is timing ("the fix is timing rather than abstinence"). The only controlled timing study (Landolt 1996, n=10) found a moderate amount six hours before bed, fully cleared by lights-out, still doubled second-half wakefulness, and Gardiner 2025 shows the effect is driven by amount. The architecture facts are right; the instruction is not supported. Suggested summary: "Fewer drinks matters more than earlier drinks: on a night that matters, one, and stop early." Keep the deadline anchor. |
| `stimulus-control` | A | **B** | The 2021 AASM guideline gives multicomponent CBT-I a strong recommendation and stimulus control a conditional one, and the standalone meta-analytic base for sleep restriction (Maurer 2021) is now larger. A component with a conditional recommendation is "tested and held up". The practice is unchanged and still excellent. |
| `sauna` | C | **C**, copy edited | Remove "reliably helps relaxation and sleep"; say the cohort is one Finnish population measured once with the headline group at 201 men, and that the randomised evidence at the same dose is modest. `finishBeforeSleepMin` 60 → 90 to match `heat-before-bed-gap`. Written warmly: it is still the thing the audience bought, and the ritual is real. |
| `cold-finish` | C | **C**, copy edited | Remove "for hours" (the catecholamine paper measured during a one-hour immersion, no time course); "30–60 seconds" can become "30 seconds" (Buijze 2016: equal to 60 and 90). Add one line pointing at `cold-on-non-lifting-days`. |
| `nap-protocol` | C | **C**, copy edited | "Twenty minutes or ninety" → "ten minutes of sleep, twenty in bed" (Brooks & Lack 2006: ten beat twenty; thirty produced inertia). Consider dropping the ninety. Add: no naps while working through insomnia with a clinician. |
| `hrv-trend-check` | C | **C**, copy added | Add that Apple Health holds SDNN, the ring and strap show rMSSD, neither vendor writes HRV into Health, and that alcohol and illness move nightly HRV more than training does. |
| `caffeine-cutoff` | B | **B**, confirmed | Gardiner 2025 supports it; the card could add that the size of the last coffee matters as much as the hour. |
| `step-floor` | B | **B**, confirmed | Paluch 2022 (15 device-measured cohorts) is the A-grade source for the plateau; round two graded the same walking literature B on purpose and consistency matters more than one letter. |
| `wake-anchor` | B | **B**, confirmed | Windred 2024 (60,977, accelerometry) verified. |

No upgrades proposed.

### Held pending a `condition` field

Three cards whose copy is event-driven and whose schedule the interface
cannot make conditional. Their sourcing is kept at the end of `sources.md`.

- **`cbt-i-signpost`** (A): "if sleep has been broken most nights for three
  months, book a GP and ask about CBT-I". Content folded into the weekly
  ledger card. Should fire once, when the ledger's broken-night count has
  been over threshold for twelve weeks.
- **`sleep-bank-ahead`** (C): "the week before a known run of short
  nights, an extra hour of opportunity each night". Should fire in the
  seven days before a roster block or event the person has entered.
- **`debt-repay-over-nights`** (B): "after a run of short nights, bed an
  hour earlier for three to five nights, wake time unchanged". Folded into
  the ledger card. Should fire for a fixed run of nights when the weekly
  tally is short.

A proposed shape, for the app session to weigh rather than for this round
to build: `condition?: { kind: 'tally-below' | 'tally-above' | 'before-event' | 'after-run'; source: string; threshold?: number; forNights?: number }`, evaluated by the planner before placement, so a held card is placed for a bounded window when its condition is true and never otherwise. Until something like it exists, these three should not be pasted.

### Declined

- **Sleep restriction therapy as a card.** The most effective component of
  CBT-I (Maurer 2021) and the one with a documented cost (about 53 ms of
  reaction time in the first fortnight) and contraindications a clinician
  screens for. Named and routed to; not delivered. The same call the injury
  round made about return to training.
- **Waon therapy and any heat protocol for heart failure.** A supervised
  inpatient treatment that missed its primary endpoint. Out of scope.
- **Sauna guidance in pregnancy beyond the contraindication.** Finnish
  custom is reported in sources whose content could not be read, and it is
  D-level practice against an A-grade teratology signal.
- **Melatonin for shift work or jet lag.** A substance; the supplements
  carve-out's business. The Cochrane reviews are in the ledgers, not built on.
- **Cold water as a treatment for depression.** One case report (n=1),
  confounded by exercise, outdoors and company; the one RCT on mood found
  no difference. The urge and mood tools elsewhere carry the route to help.
- **Illness-detection features from wearables.** Specificity of 63% and no
  reported predictive value. A product claim, not a practice.
- **Any compound.** The evidence has not moved to outcome level.
- **Exact intervals the evidence does not give**: hours after lifting
  before a plunge is safe; how long before bed a sauna must end; which
  clock time an anchor must sit at. Each card says its number is borrowed
  or untested.

## What the Recovery coach can now say on a Tuesday

- "You lifted at six; the plunge goes in tomorrow morning, and you keep
  both the gains and the buzz."
- "Nights start Thursday: a nap at half seven tonight, the big coffee before
  one, glasses on at the door, and the nine-to-one block is protected all
  week."
- "Sauna's at seven, so it's finished by half eight and bed at ten. Drink
  half a litre when you come out."
- "The tracker says you slept from eleven to six; that part it gets right.
  Ignore the deep-sleep number."
- "Strength floor's done for the week — two sessions, forty minutes. That's
  the hour the data can see."
- "Three short weeks in the ledger now. Two earlier nights this week, wake
  time stays. If it's still broken next month, we book the GP."

## Citations that circulate wrongly, checked and corrected during the round

These were wrong in the search prompts this round wrote for itself, and are
recorded so the next round does not chase them. None of them appears in the
brief.

- "Minors & Waterhouse 1981/1983, Ergonomics or Chronobiologia" does not
  exist under those venues; the anchor-sleep papers are Int J Chronobiol
  1981 (PMID 7239725) and J Physiol 1983 (PMID 6663508).
- "Leong et al. 2023 Sleep Health" (napping and brain volume) does not
  exist; the paper is Paz, Dashti & Garfield 2023.
- "López-Bueno 2022 Lancet Healthy Longevity" (grip strength) does not
  exist; the dose-response meta-analysis is Ageing Res Rev 2022 (PMID
  36332759).
- Ebrahim 2013 is a narrative review with a published critique, not a
  meta-analysis; Gardiner 2025 carries the alcohol numbers.
- Pietilä 2018's "about 4,000" is participants (4,098), not nights.
