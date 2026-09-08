# Gate 2 — literature verification, NUTRITION

Run 8 September 2026. Input: `scratchpad/gate1_nutrition_training.md`
(125 traced claims; the N-marked rows worked here). Method per
`output/corpus/METHOD.md` and `SOURCES.md`; retraction status checked
against `output/corpus/RETRACTIONS.md` and at the Crossref registry
record for every load-bearing DOI.

No transcript text is reproduced anywhere. Every claim is written in
IntentNorth's own words. No `Protocol` objects in this file — that is
Gate 4.

**Verification chain used on every row below**: Crossref registry record
(`harvest.js crossref`) for bibliography *and* the retraction/title flag,
then Europe PMC (`harvest.js abstract`) for design, n and abstract, then
Europe PMC `fullTextXML` for the numbers that live in the results section
rather than the abstract. Where a number is quoted below, the row says
which of those three confirmed it.

**Headline**: the protein number does not survive. Gate 1's read was
correct, and is now verified from the paper's own full text — including
one thing Gate 1 did not have, which is that **Morton 2018's own
discussion recommends a figure far higher than the one four famous people
quote from it**. Details in section B.

---

## A. VERIFIED LEDGER

Grades are of the **practice on the card**, never of the paper and never
of the speaker. Scale per `docs/research/README.md`: `A` many studies
agree · `B` tested and it held up · `C` some evidence, not settled ·
`D` early days · `E` unproven.

### A1 — Protein: total intake, paired with lifting

| Field | Detail |
|---|---|
| **Practice** | Eat more protein than the RDA if you lift — and stop chasing a decimal |
| **Citation** | Morton RW, Murphy KT, McKellar SR, Schoenfeld BJ, Henselmans M, Helms E, Aragon AA, Devries MC, Banfield L, Krieger JW, Phillips SM. *A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults.* Br J Sports Med 2018;52(6):376–384 |
| **DOI / PMID** | 10.1136/bjsports-2017-097608 · PMID 28698222 · PMC5867436 · open access |
| **Retraction** | Crossref registry record: `retraction_or_update: none`, and the title carries no retraction prefix (the JAMA/PNAS/SAGE trap `RETRACTIONS.md` warns about). OpenAlex `is_retracted` false. **CLEAN.** Cited 763 times (Europe PMC) |
| **Design** | Systematic review + random-effects meta-analysis + meta-regression of RCTs with resistance training ≥6 weeks, plus a **two-phase break-point analysis** |
| **n** | 49 studies, 1,863 participants overall. **The break-point analysis rests on 42 study arms and 723 participants**, across intakes of 0.9–2.4 g/kg/day (confirmed: Europe PMC full text, discussion) |
| **Key result** | Supplementing protein on top of training added **0.30 kg fat-free mass (95% CI 0.09–0.52)** and **2.49 kg to one-rep max (95% CI 0.64–4.33)**. The paper's own framing: that is a **27% addition to the 1.1 kg of FFM the training produced by itself, and a 9% addition to the 27 kg of strength**. The break point was **1.62 g/kg/day, p = 0.079, 95% CI 1.03–2.20** (confirmed: full text, figure 5 legend and discussion) |
| **Limitations / replication** | Three things the popular version drops. **(1) p = 0.079** — the break point is not statistically significant, in the paper, on its face. **(2) The CI of 1.03–2.20 spans 1.17 g/kg of an analysed range of 1.5 g/kg** — roughly four-fifths of the data. **(3) The paper's own discussion concludes that, given that CI, it may be prudent to recommend around 2.2 g/kg/day** — a higher figure than anyone quoting the paper uses. Also: the effect of supplementation was *larger* where baseline protein intake was already higher (22 studies, 988 participants, p = 0.045), which is the opposite shape to a ceiling. Replication: Tagawa 2021 (A2) and Nunes 2022 (A3) both find gains continuing above the break point, in larger datasets |
| **Grade of the practice** | **B** |
| **Why B and not A** | The *direction* replicates across three independent datasets, which is what B rewards. It is not A because the practice as usually written — "hit 1.6 g/kg" — states a number this analysis does not establish, and because once the training is separated out the protein contribution is small: about a tenth of the strength gain, about a quarter of the lean-mass gain. Grading this A would be grading the enthusiasm |

### A2 — Protein: is there a ceiling?

| Field | Detail |
|---|---|
| **Practice** | Do not treat any figure as a ceiling — more protein keeps helping a little, further up than the popular number implies |
| **Citation** | Tagawa R, Watanabe D, Ito K, Ueda K, Nakayama K, Sanbongi C, Miyachi M. *Dose–response relationship between protein intake and muscle mass increase: a systematic review and meta-analysis of randomized controlled trials.* Nutrition Reviews 2021;79(1):66–75 |
| **DOI / PMID** | 10.1093/nutrit/nuaa104 · PMID 33300582 · PMC7727026 · open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 75 times |
| **Design** | Systematic review, meta-analysis and **multivariate spline dose–response model** of RCTs. Registered UMIN000039285 |
| **n** | **105 articles, 138 intervention groups, 5,402 participants** — more than twice Morton's dataset. Resistance-training subset: 53 articles, 72 groups, 2,325 people (confirmed: Europe PMC full text, results) |
| **Key result** | Each extra 0.1 g/kg/day of protein was associated with **+0.39 kg lean body mass (95% CI 0.36–0.41) below 1.3 g/kg/day** and **+0.12 kg (95% CI 0.11–0.14) above it**. The slope falls; it does not reach zero, and it stays positive across the whole analysed range of **0.5 to 3.5 g/kg/day**. In the model that adjusts for bodyweight change, **the effect above 1.3 g/kg/day continued to rise in the resistance-training arms** (confirmed: full text, results and discussion) |
| **Limitations / replication** | This is a spline over between-study variation, not a within-person titration, so the slope is an association across trials rather than a personal dose curve. Two authors are affiliated with a company selling protein products (Meiji) — a reason to read the direction rather than the decimal, and worth noting that the direction found is the *less* commercially convenient one: small returns accruing gradually rather than a specific product dose being required. Its inflection (1.3) does not match Morton's break point (1.62), which is itself the finding: two large analyses of one literature put the elbow in different places |
| **Grade of the practice** | **B** |
| **Why B and not A** | A replicated dose–response direction in the largest dataset available earns B. Not A because the two best analyses disagree on where the curve bends, because the design cannot separate protein from the energy and food-quality changes that ride with it, and because the increments are far too small for a person to perceive |

### A3 — Protein: what the newest large review actually concludes

| Field | Detail |
|---|---|
| **Practice** | Protein earns its keep when it is paired with lifting; the amount that matters differs by age |
| **Citation** | Nunes EA, Colenso-Semple L, McKellar SR, Yau T, Ali MU, Fitzpatrick-Lewis D, Sherifali D, Gaudichon C, Tomé D, Atherton PJ, Robles MC, Naranjo-Modad S, Braun M, Landi F, Phillips SM. *Systematic review and meta-analysis of protein intake to support muscle mass and function in healthy adults.* J Cachexia Sarcopenia Muscle 2022;13(2):795–810 |
| **DOI / PMID** | 10.1002/jcsm.12922 · PMID 35187864 · PMC8978023 · open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 186 times |
| **Design** | PROSPERO-registered (CRD42020159001) systematic review, **three-level random-effects meta-analysis and meta-regression**, GRADE-rated by the authors |
| **n** | **74 RCTs** in healthy, non-obese adults |
| **Key result** | Extra protein enhanced lean-body-mass gain **in the trials that included resistance exercise**: SMD 0.22 (95% CI 0.14–0.30), 62 studies, authors' GRADE **moderate**. The LBM effect was significant **in people ≥65 at 1.2–1.59 g/kg/day** and **in people <65 at ≥1.6 g/kg/day** with resistance training. Lower-body strength: SMD 0.40 at ≥1.6 g/kg/day with training, 19 studies, GRADE **low**. Bench press: SMD 0.18 (0.03–0.33), GRADE low. **Handgrip: unclear. Physical function tests: marginal** |
| **Limitations / replication** | Same senior author as Morton (Stuart Phillips), so this refines rather than independently replicates — but it is a *larger* dataset from the same lab reaching a *smaller* claim, which is the honest direction of travel. Note what it does not say: **no break point, no ceiling, no single number**. It is also the best available answer to "does extra protein do anything without training", and the answer is: not measurably for mass or lower-body strength |
| **Grade of the practice** | **B** for "protein plus lifting". **D** for "protein for muscle or strength without lifting" |
| **Why B and not A** | The authors' own GRADE is moderate for lean mass and low for every strength outcome; a library A would sit above the evidence rating the researchers applied to their own work. Not C, because 74 RCTs agreeing on direction and surviving the subgroup splits is a genuinely replicated finding |

### A4 — The per-meal protein ceiling (a time-back finding)

| Field | Detail |
|---|---|
| **Practice** | Stop splitting protein into small doses to "stay under the limit" — a big feed is not wasted |
| **Citation** | Trommelen J, van Lieshout GAA, Nyakayiru J, Holwerda AM, Smeets JSJ, Hendriks FK, van Kranenburg JMX, Zorenc AH, Senden JM, Goessens JPB, Gijsen AP, van Loon LJC. *The anabolic response to protein ingestion during recovery from exercise has no upper limit in magnitude and duration in vivo in humans.* Cell Rep Med 2023;4(12):101324 |
| **DOI / PMID** | 10.1016/j.xcrm.2023.101324 · PMID 38118410 · PMC10772463 · open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 59 times |
| **Design** | Parallel-group, randomised, double-blind, placebo-controlled trial using intrinsically labelled milk protein and a **quadruple stable-isotope tracer** feeding–infusion protocol; three arms (0 g / 25 g / 100 g protein) after one bout of whole-body resistance exercise |
| **n** | **36 healthy, recreationally active young men** — 12 per arm (confirmed: Europe PMC full text, Subjects section) |
| **Key result** | 100 g produced a **greater and longer (>12 h)** anabolic response than 25 g, with a dose–response rise in dietary-protein-derived amino acid appearance in plasma and incorporation into muscle. Whole-body net protein balance, mixed-muscle, myofibrillar, **muscle connective** and plasma protein synthesis all rose further at the larger dose. Protein ingestion had a negligible effect on breakdown or on amino-acid oxidation — the "the excess just gets burned off" premise did not hold |
| **Limitations / replication** | 36 young men, one meal, one exercise bout. It is a mechanism study, not an outcome study: nobody has shown that eating this way changes muscle mass over months. It is the other side of the same coin as the widely-cited saturation review (Hudson, Bloomer & Campbell, *Nutrients* 2020, doi:10.3390/nu12051441 — Crossref clean, cited 38), which concluded that the effect of distribution **cannot be disentangled from the effect of quantity**, and that for adults already eating 0.8–1.3 g/kg/day, having **at least one meal with enough protein in it** is what helps, independent of distribution. Both point the same practical way |
| **Grade of the practice** | **C** for "a big feed is not wasted"; **B** for "the daily total matters more than how you split it" |
| **Why C and not B on the first half** | One elegantly instrumented trial in 36 young men, measuring synthesis rather than muscle. The *practical* half — stop rationing protein across meals — grades B because the distribution review reaches it independently from a different literature. The stronger claim, that one 100 g meal equals four 25 g meals over months, is untested and must not be written |
| **Why this is a time-back and not just a card** | The 40–50 g ceiling is a rule people obey at real cost: shift workers who can only eat twice, older people with small appetites, anyone whose day has one family meal in it. Removing it gives them their own pattern back |

### A5 — The leucine threshold: NOT verified as stated

| Field | Detail |
|---|---|
| **Practice claimed** | A meal must clear a leucine threshold to switch on muscle protein synthesis; plant sources therefore need a bigger serve |
| **Citation** | Wilkinson K, Koscien CP, Monteyne AJ, Wall BT, Stephens FB. *Association of postprandial postexercise muscle protein synthesis rates with dietary leucine: a systematic review.* Physiol Rep 2023;11(15):e15775 |
| **DOI / PMID** | 10.14814/phy2.15775 · PMID 37537134 · PMC10400406 · open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 27 times |
| **Design** | Quantitative systematic review pooling trials that gave a protein bolus within an hour of resistance exercise and measured both plasma leucine and muscle protein synthesis (delta from basal) |
| **n** | Study-level pooling; units are trial arms, not individuals |
| **Key result** | Ingested leucine dose was associated with the size of the synthesis response **in older adults only** (0–2 h: r² = 0.64, p = 0.02; whole postprandial period: r² = 0.18, p = 0.01) and **not in younger adults**. **No plasma leucine variable** — peak, rate of rise or total availability — predicted the response in either group. The authors state that they found **no threshold**, in either age group |
| **Limitations / replication** | This is the disconfirming review for the leucine-trigger hypothesis and it comes from a lab that works on the topic, not from a critic. It does not say leucine is irrelevant; it says the *threshold* framing is unsupported and the *trigger* framing is unsupported outright |
| **Grade of the practice** | **D** for "clear a leucine threshold". **C** for the practical residue: "a plant protein source generally needs a bigger serving to do the same job as an animal one" |
| **Verdict on Gate 1 claim 62** | **PARTLY VERIFIED — the mechanism does not hold as stated.** The practical residue survives on protein quality and digestibility grounds, and must be written as a plate instruction rather than a milligram figure |

### A6 — Late eating: the physiology

| Field | Detail |
|---|---|
| **Practice** | Move the day's eating earlier where you can |
| **Citation** | Vujović N, Piron MJ, Qian J, Chellappa SL, Nedeltcheva A, Barr D, Heng SW, Kerlin K, Srivastav S, Wang W, Shoji B, Garaulet M, Brady MJ, Scheer FAJL. *Late isocaloric eating increases hunger, decreases energy expenditure, and modifies metabolic pathways in adults with overweight and obesity.* Cell Metab 2022;34(10):1486–1498.e7 |
| **DOI / PMID** | 10.1016/j.cmet.2022.09.007 · PMID 36198293 · PMC10184753 · not open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 120 times |
| **Design** | Randomised, controlled, **crossover** trial (NCT02298790) with nutrient intake, physical activity, sleep and light exposure all held constant — an unusually tight design for a nutrition question |
| **n** | **16 adults** with overweight or obesity (5 women; mean age 37; mean BMI 28.7). Confirmed at the publisher's own article record |
| **Key result** | Eating late raised hunger (p < 0.0001) and the waking and 24-hour ghrelin:leptin ratio (p < 0.0001; p = 0.006), **lowered waking energy expenditure (p = 0.002)** and lowered 24-hour core temperature (p = 0.019). Adipose gene expression shifted toward less lipolysis and more adipogenesis |
| **Limitations / replication** | Sixteen people. A four-hour timing shift under laboratory control is not a life. And its most quotable finding, the expenditure one, **does not replicate** — see A7 |
| **Grade of the practice** | **C** |
| **Why C and not B** | A beautifully controlled crossover in 16 people whose headline mechanism is contradicted by a larger free-living trial. The appetite half replicates and is the half worth writing |

### A7 — Late eating: why the popular explanation is the wrong one

| Field | Detail |
|---|---|
| **Practice** | Load the day's food earlier because it makes the evening easier, not because it burns more |
| **Citation** | Ruddick-Collins LC, Morgan PJ, Fyfe CL, Filipe JAN, Horgan GW, Westerterp KR, Johnston JD, Johnstone AM. *Timing of daily calorie loading affects appetite and hunger responses without changes in energy metabolism in healthy subjects with obesity.* Cell Metab 2022;34(10):1472–1485.e6 |
| **DOI / PMID** | 10.1016/j.cmet.2022.08.001 · PMID 36087576 · PMC9605877 · open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 78 times |
| **Design** | Randomised **crossover** (NCT03305237): two 4-week calorie-restricted but **isoenergetic** weight-loss diets, morning-loaded (45/35/20 across breakfast, lunch, dinner) versus evening-loaded (20/35/45) |
| **n** | **30 people** with overweight or obesity, each completing both arms |
| **Key result** | **No difference in total daily energy expenditure, none in resting metabolic rate, and none in weight loss.** The morning-loaded arm reported **significantly lower hunger**. The authors' own conclusion: a big breakfast may help by supporting compliance, not by changing metabolism |
| **Limitations / replication** | 30 people, four weeks per arm, under calorie restriction. It settles the mechanism question, not the long-run outcome question |
| **Grade of the practice** | **B** for the *mechanism* claim — earlier eating helps by reducing evening hunger, not by raising expenditure. **C** for the practice of loading the day earlier |
| **Why B on the mechanism and not A** | An isoenergetic crossover that directly tests the popular explanation, landing with Vujović's appetite half and against Vujović's expenditure half — two independent groups, one conclusion on appetite. Not A because two crossover trials totalling 46 people is not "many studies agree" |
| **Note for copy** | This is the most useful correction in the round after protein. "Eat earlier because you burn more in the morning" is not supported. "Eat earlier because your body clock raises hunger at night whatever you have already eaten" is |

### A8 — Early time-restricted eating: the metabolic case

| Field | Detail |
|---|---|
| **Practice** | An early eating window improves metabolic markers even without weight loss |
| **Citation** | Sutton EF, Beyl R, Early KS, Cefalu WT, Ravussin E, Peterson CM. *Early time-restricted feeding improves insulin sensitivity, blood pressure, and oxidative stress even without weight loss in men with prediabetes.* Cell Metab 2018;27(6):1212–1221.e3 |
| **DOI / PMID** | 10.1016/j.cmet.2018.04.010 · PMID 29754952 · PMC5990470 · not open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited **1,162 times** |
| **Design** | Supervised controlled-feeding **crossover**: a 6-hour eating window with dinner before 3pm versus a 12-hour window, 5 weeks per arm, weight deliberately held constant |
| **n** | **8 men with prediabetes.** Eight |
| **Key result** | Improved insulin sensitivity, beta-cell responsiveness, blood pressure, oxidative stress and appetite, with no weight change |
| **Limitations / replication** | The citation count (1,162) is wildly out of proportion to the sample (8), which is itself worth recording: this is one of the most-cited tiny trials in nutrition. Eight men, one sex, one metabolic state, and a window — last bite before 3pm — that almost nobody will live with. **A card must not present this as what time-restricted eating does for a general adult** |
| **Grade of the practice** | **D** |
| **Why D and not C** | n = 8, single site, and described by its own authors as proof-of-concept. The direction is interesting and the design is honest; the evidence is early. Anything above D would be grading the citation count |

### A9 — Time-restricted eating for weight: the null

| Field | Detail |
|---|---|
| **Practice** | A late 16:8 window, on its own, is not a weight intervention |
| **Citation** | Lowe DA, Wu N, Rohdin-Bibby L, Moore AH, Kelly N, Liu YE, Philip E, Vittinghoff E, Heymsfield SB, Olgin JE, Shepherd JA, Weiss EJ. *Effects of time-restricted eating on weight loss and other metabolic parameters in women and men with overweight and obesity: the TREAT randomized clinical trial.* JAMA Intern Med 2020;180(11):1491–1499 |
| **DOI / PMID** | 10.1001/jamainternmed.2020.4153 · PMID 32986097 · PMC7522780 |
| **Retraction** | Crossref: `retraction_or_update: none`, **and the title was checked for a retraction prefix** — deliberately, because `RETRACTIONS.md` records that JAMA marks retractions in the title and leaves the relation field empty. **CLEAN.** Cited 409 times |
| **Design** | 12-week randomised clinical trial delivered through a mobile app; ad-libitum eating noon–8pm versus three structured meals a day |
| **n** | **116 participants** (mean age 46.5; 60% men), with an in-person subset of 50 (25 per arm) |
| **Key result** | Weight fell within the TRE arm (−0.94 kg, 95% CI −1.68 to −0.20, p = 0.01) but **not more than control** (between-group −0.26 kg, 95% CI −1.30 to 0.78, p = 0.63). The authors conclude that time-restricted eating on its own is not more effective than eating across the day. The much-repeated lean-mass concern is a **secondary outcome in the 50-person in-person subset** — carry it as a caution, never as a finding |
| **Limitations / replication** | The window tested was noon–8pm — the *easy* version, not the early one — so this trial does not test A6–A8. Protein intake was neither controlled nor protected |
| **Grade of the practice** | **E** for "use a late eating window to lose weight". **C** for "a consistent eating window is a structure worth having", which is what the library's `fasting-window` card actually claims |
| **Why E on the weight claim** | A 116-person randomised trial with a null between-group result is not "some evidence, not settled" — it is a direct test that came back negative. The library should say so, kindly, and keep the card for the reason the card already gives |

### A10 — The adherence half of meal timing: NOT peer-reviewed

| Field | Detail |
|---|---|
| **Practice claimed (Gate 1 claims 104–106)** | In a very large community study of a ten-hour window: most participants were already inside ~11 hours; completers lost about a kilogram; people who did it inconsistently ended up hungrier and lower in energy than at baseline; and people find it far easier to start later than to stop earlier |
| **Citation** | Bermingham K, Pushilal A, Polidori L, Wolf J, Bulsiewicz W, Spector T. *Ten hour time-restricted eating (TRE) is associated with improvements in energy, mood, hunger and weight in free-living settings: the ZOE BIG IF study.* In: *The 14th European Nutrition Conference FENS 2023*, Proceedings 2024;91:120 |
| **DOI** | 10.3390/proceedings2023091120 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN** — but see below |
| **Design** | **Conference proceedings abstract**, not a peer-reviewed full paper. App-delivered community intervention (NCT05558423): one baseline week of habitual eating, then a two-to-three-week phase with a ≤10-hour window, self-reported outcomes, self-selected participants, no control arm |
| **n** | Reported in the range of 37,000 completers out of roughly 148,000 who engaged. **Not verifiable from a peer-reviewed record** |
| **Key result** | Self-reported energy and mood improved; hunger fell slightly; about a kilogram of weight change among completers |
| **Limitations / replication** | **This is the important verification finding of the section.** Europe PMC carries no full-paper publication of the Big IF study by any of its authors (searched by author and by title across the whole index). The commercial sponsor is also the study team: the author list includes ZOE's co-founder and its chief executive. There is no control group, participants selected themselves, every outcome is self-reported, and the intervention ran for weeks. **The specific adherence finding Gate 1 rates most highly — that inconsistent fasters ended up worse than baseline — could not be located in any peer-reviewed source.** UNVERIFIED |
| **Grade of the practice** | **E** as a standalone claim. **D** if written as an observation about how people behave rather than as a finding about what fasting does |
| **What may be written** | The *behavioural* observation — people find it easier to push the start of the window later than to bring the end of it earlier — is plausible, is consistent with the appetite physiology in A6/A7, and is genuinely useful for laddering. It must be written as the library's own reasoning with an honest empty attribution, **not** as "a study found". Section C sets out what the card should say |

### A11 — Ultra-processed food: the controlled trial

| Field | Detail |
|---|---|
| **Practice** | Where a swap is available, choose the less processed version of the same food — you will eat less without trying |
| **Citation** | Hall KD, Ayuketah A, Brychta R, Cai H, Cassimatis T, Chen KY, Chung ST, Costa E, Courville A, Darcey V, Fletcher LA, Forde CG, Gharib AM, Guo J, Howard R, Joseph PV, McGehee S, Ouwerkerk R, Raisinger K, Rozga I, Stagliano M, Walter M, Walter PJ, Yang S, Zhou M. *Ultra-processed diets cause excess calorie intake and weight gain: an inpatient randomized controlled trial of ad libitum food intake.* Cell Metab 2019;30(1):67–77.e3 |
| **DOI / PMID** | 10.1016/j.cmet.2019.05.008 · PMID 31105044 · PMC7946062 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 1,120 times |
| **Design** | **Inpatient randomised crossover** at the NIH Clinical Center. Two weeks on an ultra-processed diet and two weeks on an unprocessed one, in random order, with meals **matched for presented calories, energy density, macronutrients, sugar, sodium and fibre**. Participants ate as much or as little as they liked |
| **n** | **20 weight-stable adults** (mean age 31; mean BMI 27) |
| **Key result** | Energy intake was **508 ± 106 kcal/day higher** on the ultra-processed diet (p = 0.0001), from carbohydrate (+280 kcal, p < 0.0001) and fat (+230 kcal, p = 0.0004) but not protein (−2 kcal, p = 0.85). Weight change tracked intake closely (r = 0.8, p < 0.0001): **+0.9 ± 0.3 kg** on ultra-processed (p = 0.009), **−0.9 ± 0.3 kg** on unprocessed (p = 0.007) |
| **Limitations / replication** | Twenty people, four weeks, one site, and **not replicated at this level of control by anyone**. Detained participants eating provided food is not a life. What it does establish is causation for the intake effect, which is far more than the epidemiology can do |
| **Grade of the practice** | **B** |
| **Why B and not A** | One causal trial in 20 people, however good — that is not "many studies agree". It is not C because the design is close to the best obtainable for the question, the effect is large, and it sits on top of an enormous population literature pointing the same way (A12). It is the strongest single experiment in the whole nutrition pillar |
| **Verdict on Gate 1 claims 63 and 71** | **VERIFIED, both, to the number.** Layne Norton and Rhonda Patrick describe this trial accurately and independently. Recording that, because most of this section records the opposite |

### A12 — Ultra-processed food: the population evidence

| Field | Detail |
|---|---|
| **Practice** | Same practice as A11; this is the evidence that makes it worth doing at all |
| **Citation** | Lane MM, Gamage E, Du S, Ashtree DN, McGuinness AJ, Gauci S, Baker P, Lawrence M, Rebholz CM, Srour B, Touvier M, Jacka FN, O'Neil A, Segasby T, Marx W. *Ultra-processed food exposure and adverse health outcomes: umbrella review of epidemiological meta-analyses.* BMJ 2024;384:e077310 |
| **DOI / PMID** | 10.1136/bmj-2023-077310 · PMID 38418082 · PMC10899807 · open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 623 times |
| **Design** | PROSPERO-registered (CRD42023412732) **umbrella review** of existing meta-analyses of cohort, case-control and cross-sectional studies, with pre-specified evidence-classification criteria and GRADE |
| **n** | 45 unique pooled analyses; **9,888,373 participants** |
| **Key result** | Direct associations with 32 of 45 health parameters (71%). "Convincing" (class I) evidence for cardiovascular-disease mortality (RR 1.50, 1.37–1.63) and type 2 diabetes (dose–response RR 1.12, 1.11–1.13), plus anxiety and combined common mental disorders. "Highly suggestive" (class II) for all-cause mortality (RR 1.21, 1.15–1.27), heart-disease mortality, depressive outcomes, adverse sleep outcomes, wheezing and obesity |
| **Limitations / replication** | **The honest half, which most retellings drop**: of those 45 pooled analyses the authors themselves graded **22 low quality and 19 very low quality, with only four moderate**. Even the class-I cardiovascular-mortality association carries a GRADE of *very low*. It is observational throughout, the Nova classification is contested, and people who eat the most ultra-processed food differ from those who eat the least in income, time and much else |
| **Grade of the practice** | **B**, jointly with A11 |
| **Why B and not A** | Ten million people is not a substitute for study quality, and the authors' own GRADE ratings are mostly low or very low. The reason to act is the combination — an enormous consistent population signal plus one tight causal trial — and that combination is exactly what B describes |

### A13 — The "brain rewiring" study: overstated

| Field | Detail |
|---|---|
| **Practice claimed** | Five days of snack-food overfeeding rewires the brain and changes reward sensitivity, with effects persisting a week later |
| **Citation** | Kullmann S, Wagner L, Hauffe R, Kühnel A, Sandforth L, Veit R, Dannecker C, Machann J, Fritsche A, Stefan N, Preissl H, Kroemer NB, Heni M, Kleinridders A, Birkenfeld AL. *A short-term, high-caloric diet has prolonged effects on brain insulin action in men.* Nat Metab 2025;7(3):469–477 |
| **DOI / PMID** | 10.1038/s42255-025-01226-9 · PMID 39984682 · PMC11946887 · open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 15 times |
| **Design** | Controlled feeding study over 5 days with follow-ups; the paper describes a randomised controlled design but allocation was **unequal — 18 to the high-calorie arm, 11 to the control** (confirmed: Europe PMC full text) |
| **n** | **29 male volunteers**, aged 19–27, BMI 19–25. All men, all young, all healthy weight |
| **Key result** | Liver fat rose in the high-calorie arm (group-by-visit interaction p = 0.008), brain insulin responsiveness was altered, and some changes persisted after the overfeeding stopped, **without body-weight or body-composition change**. The change in brain insulin responsiveness correlated with the change in liver fat (n = 28, r = 0.434, p = 0.02) and with the reported change in saturated-fat intake (n = 29, r = 0.531, p = 0.003) |
| **Limitations / replication** | Twenty-nine young men in unequal groups for five days. Liver fat moved between roughly 1.1% and 1.6% on average — a real change and still far below any clinical threshold. No replication. |
| **Grade of the practice** | **D**, and there is no practice here to card |
| **Verdict on Gate 1's flag** | **CONFIRMED.** Gate 1 flagged that FoundMyFitness describes Hall's trial accurately on one half of a page and describes this 29-man five-day study as brain-rewiring on the other. The check bears that out: the trial is real, small, single, non-replicated, all-male, and reports a correlation between a brain measure and a liver measure. "Rewiring" is not what it shows. **The library should cite Hall and the BMJ umbrella review and should not cite this at all** |

### A14 — Fibre

| Field | Detail |
|---|---|
| **Practice** | Build the day toward roughly 30 g of fibre (the library's existing `fibre-30`, graded A) |
| **Citation** | Reynolds A, Mann J, Cummings J, Winter N, Mete E, Te Morenga L. *Carbohydrate quality and human health: a series of systematic reviews and meta-analyses.* Lancet 2019;393(10170):434–445 |
| **DOI** | 10.1016/S0140-6736(18)31809-9 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 1,112 times |
| **Design** | A **series** of systematic reviews and meta-analyses pooling prospective cohorts alongside randomised controlled trials — the design the existing card already describes correctly |
| **n** | 185 prospective studies and 58 clinical trials |
| **Key result** | Unchanged from what the card says |
| **Grade of the practice** | **A — hold.** This is one of the two A grades in the pillar that survives the round intact |
| **Why A holds** | Hard outcomes are observational, but the trials move the intermediate outcomes in the same direction, the dose–response is monotonic, the finding replicates across dozens of cohorts and decades, and — the part that matters for a library — the practice on the card *is* the exposure that was measured. That last test is where most nutrition A grades fail, and this one passes |

### A15 — Fat and fibre for satiety: the NULL Gate 1 did not expect

| Field | Detail |
|---|---|
| **Practice claimed (Gate 1 item L9)** | Fibre and fat together improve satiety |
| **Citation** | Warrilow A, Mellor D, McKune A, Pumpa K. *Dietary fat, fibre, satiation, and satiety — a systematic review of acute studies.* Eur J Clin Nutr 2019;73(3):333–344 |
| **DOI / PMID** | 10.1038/s41430-018-0295-7 · PMID 30166637 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 45 times |
| **Design** | PRISMA systematic review of acute studies with an embedded meta-analysis |
| **n** | 1,490 records screened down to **12 studies** |
| **Key result** | **No significant effect** of any fat–fibre interaction on satiety. Fat, per unit of energy, had a *weak* effect on satiation. The authors suggest the null may reflect insensitive study designs rather than a true absence, and say the question warrants further investigation |
| **Grade of the practice** | **E** as a fat-plus-fibre satiety claim |
| **Verdict on Gate 1 item L9** | **NOT VERIFIED.** Gate 1's literature inlet nominated this as "the paper for" satiety as a practice. It is a null with twelve studies in it. Do not build a card on it. The satiety card that *can* be built is A16 |

### A16 — Satiety through how food is eaten, not what is in it

| Field | Detail |
|---|---|
| **Practice** | Slow the meal down — and choose the version of a food that takes more chewing |
| **Citation** | Krop EM, Hetherington MM, Nekitsing C, Miquel S, Postelnicu L, Sarkar A. *Influence of oral processing on appetite and food intake — a systematic review and meta-analysis.* Appetite 2018;125:253–269 |
| **DOI / PMID** | 10.1016/j.appet.2018.01.018 · PMID 29408331 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 100 times |
| **Design** | Systematic review and random-effects meta-analysis; 12,161 records screened to 38 papers describing 40 studies and 70 subgroups |
| **n** | 65 comparisons for food intake, 22 for hunger, 15 for desire to eat |
| **Key result** | Chewing-related oral processing significantly reduced **food intake (ES −0.28, 95% CI −0.36 to −0.19)** and, less strongly, **self-reported hunger (ES −0.20, 95% CI −0.30 to −0.11)**. Texture manipulation and eating rate moved intake markedly; appetite ratings moved less |
| **Limitations / replication** | Almost entirely acute laboratory meals. Nobody has shown that eating slower changes body weight months later. The lubrication half of the mechanism is barely studied |
| **Grade of the practice** | **C — hold**, and upgrade the *copy* rather than the grade |
| **Why C and not B** | Same reason the existing `slow-plate` card gives: single-meal laboratory work, no long-run outcome. What is new is the **mechanism** — texture governs how long a mouthful is chewed, so eating rate is largely a property of the food rather than of the person's willpower. That is the reframe Gate 1 claim 100 asked for, and it is a copy change and an attribution change, not a regrade |

### A17 — Alcohol: the moderate-drinking question

| Field | Detail |
|---|---|
| **Practice** | Planned drink-free days; and the library naming no safe amount |
| **Citation** | Zhao J, Stockwell T, Naimi T, Churchill S, Clay J, Sherk A. *Association between daily alcohol intake and risk of all-cause mortality: a systematic review and meta-analyses.* JAMA Netw Open 2023;6(3):e236185 |
| **DOI** | 10.1001/jamanetworkopen.2023.6185 · open access |
| **Retraction** | Crossref: `retraction_or_update: none`, **title checked for a retraction prefix** per the JAMA rule in `RETRACTIONS.md`. **CLEAN.** Cited 189 times |
| **Design** | Systematic review and meta-analysis of cohort studies, with mixed linear regression modelling that adjusts for **former-drinker bias** and other study-quality criteria — i.e. the design built specifically to test the sick-quitter artefact |
| **n** | 107 cohort studies, **4,838,825 participants, 425,564 deaths, 724 risk estimates** |
| **Key result** | Once former-drinker bias and sampling variation are adjusted for, **low and moderate intake showed no significant mortality advantage** over lifetime non-drinking, with increased risk appearing at higher intakes and **starting at lower intakes for women than men** |
| **Supporting** | van de Luitgaarden IAT et al. *Alcohol consumption in relation to cardiovascular diseases and mortality: a systematic review of Mendelian randomization studies.* Eur J Epidemiol 2022;37(7):655–669, doi:10.1007/s10654-021-00799-5, Crossref clean, cited 61. 24 MR studies; **null associations for cardiovascular disease (67% of studies) and diabetes (75%)**, one detrimental association for all-cause mortality. The authors' own conclusion is more cautious than the popular one: methodological heterogeneity means it is **not yet possible to draw firm causal conclusions** |
| **Grade of the practice** | **C — hold** on `drink-free-days` |
| **Why C and not B** | Grade the practice, not the paper. The *evidence about alcohol* is now very strong and the existing card's copy already states it correctly. The *practice* — naming drink-free days in advance — has no trial behind it; it is an if-then plan applied to alcohol. C is right, and the strength of Zhao does not move it |
| **Correction to Gate 1** | Gate 1 (item L7) treats Mendelian randomisation as "the method that actually resolved the moderate-drinking question". The MR review itself says it has not resolved it. **The bias-adjusted cohort meta-analysis is the stronger citation**, and MR is corroboration |

### A18 — Hydration and cognition: the claim does not survive

| Field | Detail |
|---|---|
| **Practice claimed (Gate 1 claim 41)** | Losing about 1% of body weight in fluid measurably reduces word recall and executive function |
| **Citations** | Goodman SPJ, Moreland AT, Marino FE. *The effect of active hypohydration on cognitive function: a systematic review and meta-analysis.* Physiol Behav 2019;204:297–308, doi:10.1016/j.physbeh.2019.03.008 · PMID 30876770 · Crossref clean, cited 29. **And** Wittbrodt MT, Millard-Stafford M. *Dehydration impairs cognitive performance: a meta-analysis.* Med Sci Sports Exerc 2018;50(11):2360–2368, doi:10.1249/MSS.0000000000001682 · PMID 29933347 · Crossref clean |
| **Design / n** | Two meta-analyses that disagree. Goodman: no impairment overall (**g = −0.177, 95% CI −0.532 to 0.179, p = 0.331**), and none in any subdomain, independent of whether fluid loss was above or below 2% of body mass. Wittbrodt: 33 studies, 413 subjects, 280 effect estimates; a small but significant overall impairment (**ES −0.21, 95% CI −0.31 to −0.11**) — **but at ≤2% body-mass loss the effect was ES −0.14, 95% CI −0.27 to 0.00, i.e. not significant** |
| **Key result** | **Neither meta-analysis supports an effect at 1%.** The more favourable of the two finds the effect only above 2% body-mass loss and explicitly non-significant below it. The less favourable finds nothing at any level and states that recommendations to avoid moderate hypohydration on cognitive grounds are not substantiated |
| **Grade of the practice** | **E** for "1% dehydration measurably impairs thinking". **D — hold** for the existing `water-with-meals` card |
| **Verdict on Gate 1 claim 41** | **NOT VERIFIED, and Gate 1's suspicion was right.** This was flagged as high value if it held. It does not hold. The existing D-grade card already says the confident claims rest on small studies with mixed replication — **that copy was correct before this round and is now better sourced**, which is a pleasing result for a card the library graded conservatively |

### A19 — Eating around shift work

| Field | Detail |
|---|---|
| **Practice** | On night shift, keep eating in the daytime hours where the roster allows it, rather than eating through the night |
| **Citation** | Chellappa SL, Qian J, Vujovic N, Morris CJ, Nedeltcheva A, Nguyen H, Rahman N, Heng SW, Kelly L, Kerlin-Monteiro K, Srivastav S, Wang W, Aeschbach D, Czeisler CA, Shea SA, Adler GK, Garaulet M, Scheer FAJL. *Daytime eating prevents internal circadian misalignment and glucose intolerance in night work.* Sci Adv 2021;7(49):eabg9910 |
| **DOI / PMID** | 10.1126/sciadv.abg9910 · PMID 34860550 · PMC8641939 · open access |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN** |
| **Design** | 14-day inpatient circadian protocol with simulated night work, randomised to nighttime or daytime eating, with constant-routine assessment of central (core temperature) and peripheral (glucose, insulin) rhythms before and after |
| **n** | **19 participants** — 10 in the nighttime-eating arm, 9 in the daytime-eating arm (confirmed: Europe PMC full text) |
| **Key result** | Nighttime eating produced misalignment between the central clock and the peripheral glucose rhythm and **impaired glucose tolerance**; restricting meals to daytime **prevented both** |
| **Supporting** | Grant CL et al. *Timing of food intake during simulated night shift impacts glucose metabolism: a controlled study.* Chronobiol Int 2017;34(8):1003–1013, doi:10.1080/07420528.2017.1335318, Crossref clean, cited 78. Four nights of simulated night work; **n = 11 (4 eating at night, 7 not)**. Glucose area-under-curve rose only in the eating-at-night condition. Tiny, and pointing the same way |
| **Limitations / replication** | Nineteen people in a laboratory, plus an eleven-person corroboration. Simulated night work is not night work: real shift workers have families, commutes, canteens and rosters. Nobody has run this as a field trial |
| **Grade of the practice** | **C** |
| **Why C and not B** | Two small laboratory studies agreeing, with a plausible mechanism and no field replication. Not D, because the design of the larger one is genuinely strong — randomised, inpatient, with endogenous circadian phase measured rather than assumed — and because the effect is on a hard physiological outcome rather than a questionnaire |
| **Safety and tone** | This is the pillar's most important card for people who cannot choose their hours, and it must never read as a reason to skip food on a night shift. The practice is *shifting* the meal, not removing it |

### A20 — Sleep loss shows up on the plate

| Field | Detail |
|---|---|
| **Practice** | After a short night, expect appetite to run ahead of need — plan the day's food rather than deciding it hungry |
| **Citation** | Fenton S, Burrows TL, Skinner JA, Duncan MJ. *The influence of sleep health on dietary intake: a systematic review and meta-analysis of intervention studies.* J Hum Nutr Diet 2021;34(2):273–285 |
| **DOI / PMID** | 10.1111/jhn.12813 · PMID 33001515 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 49 times |
| **Design** | Systematic review and meta-analysis of **intervention** studies — trials that actually manipulated sleep and measured what people then ate |
| **n** | 24 publications included; 15 in the meta-analysis |
| **Key result** | Partial sleep restriction (≤5.5 h/night) **raised daily energy intake** (SMD 0.37, 95% CI 0.21–0.52), and raised fat, protein and carbohydrate intake with it |
| **Limitations / replication** | Short laboratory sleep restrictions, mostly days rather than weeks, in mostly young healthy participants. It shows intake rises; it does not show that anything downstream follows |
| **Grade of the practice** | **B** for the finding; **C** for the practice built on it |
| **Why** | The finding is a meta-analysis of experiments where sleep was manipulated, which is as good as this question gets — B. The *practice* (plan the day's food after a bad night) has not itself been tested, so the card grades C. This is the seam Marie-Pierre St-Onge owns and the library currently has nothing on it |

### A21 — What you eat by day changes the night

| Field | Detail |
|---|---|
| **Practice** | More fibre and less saturated fat across the day, for the night's sake as well as the day's |
| **Citation** | St-Onge MP, Roberts A, Shechter A, Choudhury AR. *Fiber and saturated fat are associated with sleep arousals and slow wave sleep.* J Clin Sleep Med 2016;12(1):19–24 |
| **DOI / PMID** | 10.5664/jcsm.5384 · PMID 26156950 · PMC4702189 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 171 times |
| **Design** | Randomised crossover **inpatient** study (NCT00935402); the analysis reported here is a within-study **linear regression of self-selected day-5 food intake against that night's polysomnography** — i.e. observational inside a controlled study |
| **n** | **26 normal-weight adults** aged 30–45 |
| **Key result** | Greater fibre intake predicted **less stage 1 sleep (p = 0.0198) and more slow-wave sleep (p = 0.0286)**. A higher percentage of energy from saturated fat predicted **less slow-wave sleep (p = 0.0422)**. Higher sugar and non-fibre carbohydrate were associated with more arousals (p = 0.032 and 0.048). Sleep after a day of self-selected eating had less slow-wave sleep and a longer onset latency than after controlled feeding |
| **Limitations / replication** | 26 people; regression on a single day of food and a single night of sleep; p-values clustered just under 0.05 across several outcomes, which is a multiple-comparison risk the paper does not fully address. The authors say explicitly that using diet to manage sleep **needs to be tested** and has not been |
| **Grade of the practice** | **C** |
| **Why C and not B** | A cross-sectional association inside a controlled study in 26 people, never replicated at scale, with the authors' own caution attached. Not D, because the exposure was measured properly, the outcome is polysomnography rather than a questionnaire, and the direction agrees with the fibre literature the library already grades A. It is a genuinely new card and it belongs to two pillars |

### A22 — Self-monitoring

| Field | Detail |
|---|---|
| **Practice** | Some form of recording what you eat, done for a bounded period |
| **Citation** | Burke LE, Wang J, Sevick MA. *Self-monitoring in weight loss: a systematic review of the literature.* J Am Diet Assoc 2011;111(1):92–102 |
| **DOI / PMID** | 10.1016/j.jada.2010.10.008 · PMID 21185970 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited **798 times** |
| **Design** | Systematic review of studies published 1993–2009 covering dietary self-monitoring, exercise self-monitoring and self-weighing |
| **n** | 22 studies (15 dietary, 1 exercise, 6 self-weighing) |
| **Key result** | A significant association between self-monitoring and weight loss was found **consistently** — and the authors state plainly that **the level of evidence is weak** because of methodological limitations, predominantly white and female samples, and reliance on self-report |
| **Grade of the practice** | **C — hold** on `meal-photo-log`; **B — hold** on `weekly-weight-trend` |
| **Why not A, despite 798 citations** | The review's own verdict on its own evidence is "weak". Gate 1 (item L8) nominated this as an 800-citation review of the thing the app is built to do, which is true and is a good reason to keep the cards — but citation count is not evidence quality, and the honest grade is the one the authors gave. The library's existing grades were already right |

### A23 — Time-back verifications

| Practice somebody can stop | Source | Verdict |
|---|---|---|
| **Avoiding soy for hormonal reasons** | Reed KE, Camargo J, Hamilton-Reeves J, Kurzer M, Messina M. *Neither soy nor isoflavone intake affects male reproductive hormones: an expanded and updated meta-analysis of clinical studies.* Reprod Toxicol 2021;100:60–67, doi:10.1016/j.reprotox.2020.12.019, PMID 33383165. Crossref clean, cited 45. **41 studies**; total testosterone measured in 1,753 men, free testosterone in 752, estradiol in 1,000, oestrone in 239, SHBG in 967 | **VERIFIED.** No significant effect on any hormone, at any dose, over any duration, under any statistical model. One caution for attribution: the senior author has long-standing links to the soy industry, so the *finding* should be stated and the *card* should not lean on him as a communicator. **Ship as a time-back** |
| **Avoiding low- and no-calorie sweetened drinks as a swap for sugary ones** | McGlynn ND et al. *Association of low- and no-calorie sweetened beverages as a replacement for sugar-sweetened beverages with body weight and cardiometabolic risk.* JAMA Netw Open 2022;5(3):e222092, doi:10.1001/jamanetworkopen.2022.2092. Crossref clean (title checked), cited 106. Network meta-analysis of **17 RCTs, 24 comparisons, 1,733 adults** | **VERIFIED with an important nuance.** Substituting these drinks for sugary ones was associated with **−1.06 kg body weight (95% CI −1.71 to −0.41)**, lower BMI, lower body-fat percentage and lower liver fat, GRADE moderate. But note: **substituting water for sugary drinks was not associated with any outcome** in the three trials that tested it (n = 429) — almost certainly a power problem, not evidence against water. Write this as *an option beside `default-drink-water`*, never as a reason to prefer it. All participants had overweight or obesity and were at risk of or living with diabetes |
| **The per-meal protein ceiling** | A4 above | **VERIFIED.** Ship |
| **Treating 1.6 g/kg as a target to hit** | A1, A2, A3; section B | **VERIFIED.** Ship, as a precision gift rather than a stop-doing-this |
| **"Eat earlier because you burn more in the morning"** | A7 | **VERIFIED as wrong.** The mechanism is appetite. Ship as a correction inside the card copy rather than as its own time-back |
| **"1% dehydration wrecks your concentration"** | A18 | **VERIFIED as unsupported.** Ship as a reassurance, not a debunk: nobody needs to carry a two-litre bottle to think straight |
| **Doing intermittent fasting intermittently** | A10 | **NOT VERIFIED** — the only source is a conference abstract by the company that sells the programme. Do not ship as a finding. See section C for what may be said instead |

### A24 — Candidate the corpus is not promoting: the dietary portfolio

| Field | Detail |
|---|---|
| **Practice** | A defined set of cholesterol-lowering foods eaten together — plant sterols, soy protein, viscous fibres, nuts |
| **Citation** | Jenkins DJA, Kendall CWC, Marchie A, Faulkner DA, Wong JMW, de Souza R, Emam A, Parker TL, Vidgen E, Lapsley KG, Trautwein EA, Josse RG, Leiter LA, Connelly PW. *Effects of a dietary portfolio of cholesterol-lowering foods vs lovastatin on serum lipids and C-reactive protein.* JAMA 2003;290(4):502–510 |
| **DOI / PMID** | 10.1001/jama.290.4.502 · PMID 12876093 |
| **Retraction** | Crossref: `retraction_or_update: none`, **title checked for a retraction prefix** per the JAMA rule. **CLEAN.** Cited 349 times |
| **Design** | Randomised controlled trial, three parallel arms, one month, outpatient |
| **n** | **46 healthy hyperlipidaemic adults** (25 men, 21 postmenopausal women), 14–16 per arm |
| **Key result** | LDL cholesterol fell **8.0%** on the low-saturated-fat control diet, **30.9%** on the diet plus 20 mg lovastatin, and **28.6%** on the dietary portfolio. C-reactive protein fell 33.3% and 28.2% respectively. **No significant difference between the statin arm and the food arm** |
| **Limitations / replication** | 46 people for one month, with the intermediate outcome (LDL) rather than heart attacks. The portfolio amounts are large and the diet is demanding. Later work by the same group extends it; nobody has powered it to events |
| **Grade of the practice** | **C** |
| **Why C and not B** | One small short trial on a surrogate outcome, from the group that designed the diet. Not D, because it is a properly randomised comparison against an active drug control with a large, biologically coherent effect. **This is the strongest candidate found in the round that no communicator in the corpus is promoting** — a literature-inlet card with an honest researcher-only attribution |
| **Safety** | Cholesterol is a clinical matter. Any card must route to a GP and must never be written as an alternative to prescribed medication |

### A25 — Higher-than-RDA protein: the method that supports the direction

| Field | Detail |
|---|---|
| **Practice** | Treat the RDA as a floor for someone who lifts, not a target |
| **Citation** | Bandegan A, Courtney-Martin G, Rafii M, Pencharz PB, Lemon PW. *Indicator amino acid-derived estimate of dietary protein requirement for male bodybuilders on a nontraining day is several-fold greater than the current recommended dietary allowance.* J Nutr 2017;147(5):850–857 |
| **DOI / PMID** | 10.3945/jn.116.236331 · PMID 28179492 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 39 times |
| **Design** | Indicator amino acid oxidation (IAAO) with graded protein intakes from 0.1 to 3.5 g/kg/day, isoenergetic, mixed-effects change-point regression; registered NCT02621294 |
| **n** | **8 trained men**, studied 4–8 times each — 42 experiments |
| **Key result** | Estimated Average Requirement **1.7 g/kg/day**; upper 95% CI (the RDA-equivalent) **2.2 g/kg/day** — around 2.6 times the Institute of Medicine figure |
| **Limitations / replication** | Eight men, at rest, on a non-training day, fed an amino-acid mixture rather than food. IAAO is a short-term tracer method that estimates a requirement from oxidation, not an outcome. The between-person coefficient of variation in this literature runs near 20%, which is itself the point |
| **Grade of the practice** | **C** for "more than the RDA if you lift"; the direction is also carried by A1–A3, which is why the composite grade in section B is B |
| **Why this matters** | It is independent of the whole supplementation-meta-analysis literature — a different method, a different question, a different failure mode — and it lands on the same range. **The convergence that survives is between 1.7 and 2.2, not on 1.6** |

### A26 — Protein before bed

| Field | Detail |
|---|---|
| **Practice** | A protein-containing snack in the last hour before bed on training days |
| **Citation** | Snijders T, Res PT, Smeets JS, van Vliet S, van Kranenburg J, Maase K, Kies AK, Verdijk LB, van Loon LJ. *Protein ingestion before sleep increases muscle mass and strength gains during prolonged resistance-type exercise training in healthy young men.* J Nutr 2015;145(6):1178–1184 |
| **DOI / PMID** | 10.3945/jn.114.208371 · PMID 25926415 |
| **Retraction** | Crossref: `retraction_or_update: none`; clean title. **CLEAN.** Cited 120 times |
| **Design** | Randomised trial across a 12-week progressive resistance-training programme; pre-sleep supplement (27.5 g protein, 15 g carbohydrate) versus a **non-caloric placebo**; outcomes by DXA, CT and muscle biopsy plus regular 1RM testing; registered NCT02222415 |
| **n** | **44 young men** (mean age 22) |
| **Key result** | Strength rose more in the protein group (+164 ± 11 kg versus +130 ± 9 kg of summed 1RM). Muscle mass and fibre-level hypertrophy also favoured the protein group |
| **Limitations / replication** | **The design flaw that matters and is rarely mentioned**: the comparator was a non-caloric placebo, so the trial cannot separate "protein before bed" from "27.5 g more protein per day". The mechanism half is better supported — Res et al. 2012 (doi:10.1249/MSS.0b013e31824cc363, cited 141, Crossref clean) and the older-men randomised trial (doi:10.3945/jn.117.254532, cited 74, Crossref clean) both show pre-sleep protein is digested, absorbed and incorporated overnight rather than wasted. Gate 1 records a second, independent fifteen-year programme (Ormsbee's, at Florida State) reporting no sleep disruption and no fat-storage penalty, which is corroboration of *safety* rather than of *benefit* |
| **Grade of the practice** | **C** |
| **Why C and not B** | The overnight-incorporation mechanism is solid; the *outcome* trial confounds timing with total intake, and no trial has compared pre-sleep protein against the same protein eaten earlier in the day. Not D, because there is a 12-week randomised outcome trial with biopsy-level measurement behind it. Write it as "if you are short of protein for the day, the last hour before bed is a real place to put it" — which is true on both readings — and never as "night-time protein is special" |
| **Scheduling note for Gate 4** | This is `anchor.kind: 'sleep'`, and it is food, not a supplement. Per the supplements header rules it stays in nutrition **provided the card names a meal or snack rather than a powder** — see section G |

---

## B. THE PROTEIN VERDICT

### What Morton 2018 actually shows

Read in full, the paper is better than its reputation and says something
different from what it is famous for.

**1. The break point is 1.62 g/kg/day and it is not statistically
significant.** The figure legend states it: `break point = 1.62 g
protein/kg/day, p = 0.079`. That is in the published paper, in the figure
everybody reproduces, and it is not a hostile reading — it is the caption.

**2. Its confidence interval spans 1.03 to 2.20**, on an analysed range of
0.9 to 2.4 g/kg/day. The interval covers roughly four-fifths of the data
the analysis had. An estimate that wide is a statement about how little
the data constrain the answer.

**3. The break-point analysis is the smallest part of the paper.** The
headline meta-analysis has 49 studies and 1,863 participants. The break
point rests on **42 study arms and 723 participants**.

**4. The paper's own recommendation is higher than 1.6.** Its discussion
reasons from that wide interval to the conclusion that it may be prudent
to recommend around **2.2 g/kg/day** for someone seeking to maximise
training-induced gains in fat-free mass. **Four Tier-1 communicators quote
this paper for a number the paper itself argues against.** Not one of them
is misrepresenting it deliberately; they are quoting the abstract's last
sentence, which does say "~1.6", rather than the discussion, which says
2.2. That is how a number becomes settled without anybody deciding it.

**5. The paper contains a finding that is the wrong shape for a ceiling.**
In its univariate meta-regression, a **higher baseline protein intake was
associated with a *larger* benefit** from adding protein (22 studies, 988
participants, p = 0.045). If 1.6 were a saturation point, that
relationship should run the other way.

**6. The effect being argued about is small.** Adding protein to training
was worth **0.30 kg of fat-free mass (95% CI 0.09–0.52)** and **2.49 kg of
one-rep max (95% CI 0.64–4.33)**. The paper frames these itself as 27% and
9% additions to what the training produced on its own — and says, in as
many words, that training is a far more potent stimulus for strength than
protein is. The single most-argued-about number in the pillar decorates
the smaller of two levers.

### What the later work shows

**Tagawa 2021** (105 articles, 5,402 people — more than twice Morton's
dataset) fits a spline rather than a two-phase break and finds the slope
*bending*, not stopping: +0.39 kg lean mass per 0.1 g/kg/day below
1.3 g/kg/day, +0.12 kg above it, staying positive to 3.5 g/kg/day, and
**continuing to rise above 1.3 in the resistance-training arms** in the
adjusted model. Its elbow is 1.3, not 1.62. Two large analyses of one
literature, two different elbows.

**Nunes 2022** (74 RCTs, PROSPERO-registered, from Morton's own senior
author) reports **no break point at all**. What it reports instead is
where the benefit is detectable: in people ≥65 at 1.2–1.59 g/kg/day, and
in people <65 at ≥1.6 g/kg/day, in both cases **only alongside resistance
exercise**. It grades its own lean-mass evidence moderate and every
strength outcome low.

**Bandegan 2017** comes at it from a completely different method —
indicator amino acid oxidation rather than supplementation trials — and
lands at an Estimated Average Requirement of **1.7** with an upper bound
of **2.2** g/kg/day.

**Greg Nuckols' analysis is verified, and it is more careful than its
summary.** His article at strongerbyscience.com/protein-science/ was
opened and read (11,755 words). He states the p = 0.079, the 1.03–2.20
interval, and the supplementary figures showing higher baseline intakes
associated with larger benefits. He goes further than Gate 1 recorded: he
identifies **Simpson's paradox** as the likely cause of the apparent break
point — 39 of the 49 studies used untrained participants, and the trained
studies clustered at high protein intakes, so a between-study regression
mixes two different populations. He examines the individual trials
underneath the break point and finds several whose *control* groups were
already at or above it (around 1.63 g/kg in Cribb, 1.63 in Hoffman 2009,
1.58 in Kerksick) and which nonetheless showed further gains when intake
rose. **And he ends up somewhere moderate**: benefits extending to at
least 1.7 g/kg with a plausible range up to 2.35, while noting that
someone sticking at 1.62 "wouldn't be leaving too many gains on the
table". He also declines to fault the Morton authors, calling the
oversight an easy one to make and their analysis better than anything
before it.

He adds two things the whole discourse is missing. **Between-person
variation is large** — the coefficient of variation in this literature
runs around 20%, so any single figure is a population average sitting on
top of a wide spread. And **women are barely represented**: of the 50
longitudinal studies he worked through, half were male-only and only nine
were female-only, none at high protein intakes.

### The verdict

**The direction survives, decisively. The number does not.**

What can honestly be written:

- **More protein than most people eat, paired with lifting, produces a
  small real gain in lean mass and strength.** Graded **B**. Replicated
  across Morton, Tagawa, Nunes and, by a different method entirely,
  Bandegan.
- **The gain is small, and the training is the large lever.** 9% added to
  the strength gain, 27% added to the lean-mass gain. This belongs in the
  copy, because a person who eats more protein and does not lift has
  bought almost nothing, and Nunes says so directly.
- **There is no established number.** The honest statement is a range with
  its own uncertainty attached: **somewhere around 1.6 to 2.2 g/kg/day for
  someone training, with real variation between people, and no evidence
  that hitting a specific figure inside that range matters.** Every
  independent line — Morton's own discussion, Tagawa's spline, Bandegan's
  IAAO, Nuckols's re-analysis — lands inside that range and none of them
  lands on a point.
- **There is no ceiling.** Nothing in the literature supports "above X is
  wasted". Tagawa's slope stays positive to 3.5 g/kg/day, Morton's paper
  finds larger benefits at higher baselines, and Trommelen's tracer work
  shows a 100 g feed is incorporated rather than oxidised.
- **What must not be written**: 1.6 g/kg/day as a target, a threshold, a
  requirement, or a ceiling. Not in copy, not in a summary, not as an
  aside. The library's `meal-sketch` card currently carries
  "~1.6–2.2 g/kg/day across the day" — which, remarkably, is **the range
  rather than the point, and is therefore already correct**. It needs a
  softer verb, not a new number.

### What the four communicators get wrong, fairly stated

Rhonda Patrick, Peter Attia, Layne Norton and Andy Galpin all state
1.6 g/kg/day as the settled figure, and all four route to Morton 2018.
None of them is wrong about the direction, and each of them is right that
most people eat less protein than would help them. Gate 1's roster note
holds: this is enthusiasm, not dishonesty.

What happened is specific and worth naming precisely, because it is the
most instructive thing in the round:

- **They are quoting the abstract, not the paper.** The abstract's closing
  sentence contains "~1.6 g/kg/day". The discussion, four pages later,
  recommends 2.2. A number in a conclusion sentence travels; a number in a
  discussion paragraph does not.
- **They dropped the p-value and the interval.** Both are in the figure
  caption. Neither survives into any retelling found in this round.
- **Convergence made it feel checked.** Four credible people saying the
  same number reads like four independent confirmations. It is one paper,
  cited four times. This is exactly the failure mode `COMMUNICATORS.md`
  warned convergence could produce, and it is the clearest example the
  research programme has found in any pillar.
- **Only Nuckols went and read the analysis.** He is Tier 1, he publishes
  his re-analysis rather than his conclusion, and on this question he is
  right where four more famous people are wrong. He is also more moderate
  than a summary of his position suggests, which matters: he is not saying
  1.6 is useless, he is saying it is not a finding.

**The commercial point.** 1.6 g/kg is one of the most repeated numbers in
the category. A library that states the range, names the uncertainty,
tells the reader that the training is the bigger lever, and does it warmly
is doing something no competitor is doing — and it is doing it on the
single most-quoted number in consumer nutrition. That is worth a paragraph
of copy rather than a footnote.

**One thing to avoid.** The correction must not be written as "the experts
are wrong". It should be written as a relief: *nobody has to hit a number.
Somewhere in this range, with lifting, is the whole finding — and the
lifting is the bigger half.* That is both truer and kinder, and it is the
version a person can act on.

---

## C. MEAL TIMING — the physiology, the adherence, and what the card says

Gate 1 called this a ladder problem rather than a grading problem. That
reading is confirmed, with one correction that changes how it should be
written.

### The physiology half — verified, and better than expected

Four independent lines, three of them properly controlled:

| Finding | Source | Design and n | Strength |
|---|---|---|---|
| Eating late raises hunger and shifts appetite hormones | Vujović 2022 (A6) | Randomised crossover, everything else controlled, **n = 16** | **Verified** |
| Morning-loaded eating lowers hunger — and does **not** change energy expenditure or weight loss | Ruddick-Collins 2022 (A7) | Isoenergetic randomised crossover, 4 weeks per arm, **n = 30** | **Verified**, and it overturns the popular mechanism |
| The same meal produces a much larger glucose response at night than in the day | Leung GKW, Huggins CE, Ware RS, Bonham MP, *Time of day difference in postprandial glucose and insulin responses*, Chronobiol Int 2020;37(3):311–326, doi:10.1080/07420528.2019.1683856, Crossref clean | Systematic review of acute postprandial studies; 15 eligible, **10 meta-analysed**; glucose SMD **−1.66 (95% CI −1.97 to −1.36)** in favour of daytime | **Verified**, and the effect is large |
| Eating in the daytime prevents the circadian misalignment and glucose intolerance that night eating produces | Chellappa 2021 (A19) | 14-day inpatient randomised circadian protocol, **n = 19** | **Verified** |
| When people ate predicted how much weight they lost | Garaulet M et al., *Timing of food intake predicts weight loss effectiveness*, Int J Obes 2013;37(4):604–611, doi:10.1038/ijo.2012.229, Crossref clean, cited 469 | Observational within a **420-person** 20-week weight-loss programme; late lunch eaters lost less (p = 0.002) with no difference in intake, composition, estimated expenditure, appetite hormones or sleep duration | **Verified as an association**; it cannot show causation and the authors do not claim it |

**The correction Gate 1 did not have.** The popular explanation for
"eat earlier" — that you burn more in the morning — is **not supported**.
Ruddick-Collins tested it directly under isoenergetic conditions and found
no difference in total daily energy expenditure, none in resting metabolic
rate and none in weight loss. What did differ was hunger. So the honest
mechanism is: **the body clock raises appetite in the evening and lowers
glucose tolerance at night, regardless of what you have already eaten.**
That is a kinder claim as well as a truer one, because it stops framing an
evening appetite as a failure of character.

Composite grade for the physiology: **C**, with the *mechanism* claim at
**B**. Four small-to-medium controlled studies agreeing, no long-run
outcome trial, and one large observational cohort pointing the same way.

### The adherence half — the source does not hold up

Gate 1's three most useful adherence findings (claims 104–106) all trace
to the ZOE Big IF study. Verification found:

- It is published as a **conference proceedings abstract** (FENS 2023;
  Proceedings 2024;91:120, doi:10.3390/proceedings2023091120), not as a
  peer-reviewed paper.
- **No full publication exists.** Europe PMC was searched by title and by
  every author; there is no journal article of the Big IF study.
- There is **no control group**, participants selected themselves, and
  every outcome is self-reported through the sponsor's own app.
- The author list includes the company's co-founder and its chief
  executive.

Gate 1 was right that reporting an unflattering result about your own
product counts in your favour. It does not convert an unreviewed abstract
into evidence. In particular, **the specific finding Gate 1 rated highest
— that people who fasted inconsistently ended up hungrier and lower in
energy than at baseline — could not be traced to any peer-reviewed
source.** It must not be written as a finding.

The **null that can be cited** is stronger and cleaner: TREAT (A9), a
116-person randomised trial, found a late 16:8 window produced no more
weight loss than eating across the day.

### So what is the actual conflict?

Not the one Gate 1 described. Once the sources are checked, the tension is
narrower and easier to resolve:

- **Physiology says**: earlier is better, and the mechanism is appetite
  and overnight glucose handling, not calorie burning.
- **Trials say**: compressing the window *late* achieves nothing
  measurable for weight (TREAT).
- **Nothing peer-reviewed says**: that people find it easier to start
  later than to stop earlier, or that half-doing it is worse than not
  doing it.

So the good version and the easy version are not in conflict on the
evidence. They are in conflict on **plausibility and lived experience**,
and the library should say so in its own voice rather than borrowing an
abstract's authority for it.

### What the card should say

**One card, not two, and it is a cutoff rather than a fast.**

The library already has the right object: `kitchen-closed`, an
`anchor.deadline: true` cutoff anchored to sleep. It should be the
carrier, and `fasting-window` should stop being the headline.

The instruction, in substance:

1. **Set a last-bite time, not a window length.** The evidence is about
   *when the eating stops*, not about how many hours it spans. A cutoff is
   also the object the scheduler already models correctly — a deadline
   that may move earlier and never later.
2. **Say what it buys, honestly.** Less evening hunger, and a meal that
   your body handles better. Not weight loss: TREAT tested that and found
   nothing.
3. **Name the harder half as the better half, and offer the easier half
   first.** Bringing dinner forward is the version with the physiology
   behind it. Starting the day later is the version most people reach for.
   The ladder should be explicit: *if moving dinner earlier is not
   available this month, holding a consistent last-bite time is still
   worth something, and it is the rung below.*
4. **Do not build the card on consistency-or-nothing.** The claim that
   doing it some days is worse than not doing it at all has no
   peer-reviewed source, it is discouraging, and the README's expectancy
   section is explicit that copy which undermines a practice somebody is
   about to attempt is partly self-fulfilling. Write the opposite:
   consistency helps, and three nights is three nights.
5. **Carry the protein caveat.** Compressing an eating window without
   protecting protein intake is the one real risk the trial literature
   flags (TREAT's in-person subset; and Gate 1's claim 13 from van Loon,
   about people whose fat-free mass is already low). This belongs on the
   card, not in a footnote.
6. **Carry the safety line the library already uses.** The existing
   `kitchen-closed` and `fasting-window` safety notes route disordered
   eating correctly and should be kept verbatim in shape.

**Grade for the card: C.** Some evidence, not settled. That is up from
nothing for the mechanism and down from how confidently the practice is
usually sold.

**And a shift-work variant, graded C separately** (A19): on nights, the
practice is not a cutoff at all — it is keeping the main eating in the
daylight hours where the roster allows. Same physiology, opposite-looking
instruction, and it is the audience the brief asks for by name.

---

## D. REGRADES to the existing 32 nutrition cards

The pillar currently sits at **A 5 · B 13 · C 10 · D 4 · E 0** — the most
A grades of any pillar. The brief says that is right because some
nutrition findings are genuinely well replicated, and asks that this be
tested rather than assumed. It was tested. **Four of the five A grades
hold. One B moves down. Nothing moves up.**

### The five A grades, examined

| Card | Verdict | Reasoning |
|---|---|---|
| `fibre-30` | **A — holds** | 185 prospective studies and 58 trials (Reynolds 2019, Crossref clean, cited 1,112); monotonic dose–response; trials move the intermediate outcomes in the same direction as the cohorts move the hard ones. Critically, **the practice on the card is the exposure that was measured** — which is where most nutrition A grades fail. It passes |
| `one-lever-only` | **A — holds, and gets a better source** | The card currently rests on "one four-programme trial". The stronger citation is **Johnston BC et al., *Comparison of weight loss among named diet programs in overweight and obese adults: a meta-analysis*, JAMA 2014;312(9):923–933, doi:10.1001/jama.2014.10397** (Crossref clean, title checked per the JAMA rule; cited 411): a Bayesian network meta-analysis of **48 randomised trials and 7,286 people**, concluding that differences between named diets were small and that the practice supported is recommending any diet the person will adhere to. That is the card's exact claim, at meta-analytic scale. **Add the citation; keep the grade** |
| `trouble-window-plan` | **A — holds** | Adriaanse MA et al., *Do implementation intentions help to eat a healthy diet?*, Appetite 2011;56(1):183–193, doi:10.1016/j.appet.2010.10.012 (Crossref clean, cited 215): 23 studies; **d = 0.51 for adding a healthy behaviour, d = 0.29 for removing an unhealthy one**. The card already states that asymmetry correctly and already insists the line ends in a move the person makes. That is unusually careful copy and it is why the grade survives |
| `meal-if-then` | **A — holds, with a caveat recorded** | Same meta-analysis. One honest note the card does not carry: **the authors state that effect sizes for promoting healthy eating may be inflated by less-than-optimal control conditions**. That is a caveat for the copy, not a regrade — 23 studies agreeing on direction is still "many studies agree". If the mind round revisits implementation intentions generally, this pair should be revisited with it |
| `creatine-monohydrate` (carve-out) | **A — holds for the muscle claim only** | See section G. The muscle case is unchanged. The brain case must not ride on the same grade |

### Regrade proposed: one, downward

| Card | Now | Proposed | Reasoning |
|---|---|---|---|
| `protein-breakfast` | **B** | **C** | Two findings this round undercut the card's specific rationale. First, the distribution review (Hudson, Bloomer & Campbell 2020, doi:10.3390/nu12051441) concludes that **the effect of protein distribution cannot be disentangled from the effect of total quantity**, and that for people already eating 0.8–1.3 g/kg/day what helps is having *at least one* sufficiently protein-containing meal — not that it be breakfast. Second, the best trial of a specifically high-protein breakfast (Leidy HJ et al., AJCN 2013;97(4):677–688, doi:10.3945/ajcn.112.053116, Crossref clean, cited 142) is a **20-person, 6-day crossover in overweight adolescent girls** which improved fullness and reduced evening snacking but found **no difference in daily energy intake**. The practice is still worth keeping and the copy is still warm and true — but "tested and it held up" overstates a 20-person crossover plus an unresolvable distribution question. **C, and the card keeps its place.** Note this is a judgement call flagged as such: it is the only regrade in the round and it should be reviewed rather than applied silently |

### Cards that hold, with copy or source upgrades rather than regrades

| Card | Grade | What changes |
|---|---|---|
| `protein-anchor-meals` | **B — holds** | The satiety meta-analysis behind it is untouched. **Copy change**: the card currently implies a per-meal target. Per A4, a per-meal figure is a floor and not a ceiling, and the useful instruction is "build the plate around it" — which the card already says. Add nothing numeric |
| `meal-sketch` | **B — holds** | The card's "~1.6–2.2 g/kg/day across the day" is, remarkably, **already the honest range rather than the false point** — it is the only place in the corpus, podcast or library, that gets this right. **Change the verb, not the number**: it should read as a range people land inside rather than a figure to hit. See section B |
| `kitchen-closed` | **C — holds** | Substantial copy upgrade available. The mechanism is now B-grade and it is not the one the card implies. Replace "supports metabolic rhythm" with the appetite-and-overnight-glucose mechanism (A6, A7, Leung 2020). **Also**: the `David Sinclair` credit should come off — see section H |
| `fasting-window` | **C — holds, rewritten** | TREAT (A9) is a direct 116-person randomised test of the compressed-window practice and it came back null for weight. The card does not claim weight loss — which is why it survives — but it must not imply it either. Rewrite around *consistency as structure*, and remove any suggestion of metabolic benefit from window length alone. **Add the protein caveat** (compressing the window without protecting protein is the one real risk the trials flag). **Remove the `David Sinclair` credit** |
| `slow-plate` | **C — holds** | Better source and a much better mechanism. Krop 2018 (A16) is 40 studies, 70 subgroups, food intake ES −0.28. And the reframe: **eating rate is largely a property of the food's texture rather than of the person's willpower**. That is the single kindest correction available in this pillar |
| `water-with-meals` | **D — holds, and is vindicated** | The card's existing copy — that confident claims about mild under-drinking rest on small studies with mixed replication — is now backed by two meta-analyses (A18), the more favourable of which finds **no significant effect below 2% body-mass loss**. A library card that graded conservatively before the evidence arrived, and was right. Worth recording |
| `drink-free-days` | **C — holds** | The alcohol *evidence* is now far stronger than when the card was written (Zhao 2023: 107 cohorts, 4.8 million people, 425,564 deaths). The *practice* — naming the days in advance — still has no trial. **Grade the practice.** C stands; the copy can state the new numbers with more confidence |
| `default-drink-water` | **B — holds** | Add the honest second-best option per A23 (McGlynn 2022): swapping a sugary drink for a low- or no-calorie sweetened one was associated with −1.06 kg and better markers, GRADE moderate. Write it as *an option beside water*, never instead of it |
| `post-meal-walk` | **B — holds** | Better source: Buffey AJ et al., Sports Med 2022;52(8):1765–1787, doi:10.1007/s40279-022-01649-4 (Crossref clean, cited 68) — 7 randomised crossover trials; light walking was superior to standing for attenuating postprandial glucose. Honest limit: all acute, all one-day, no long-run outcome |
| `weekly-weight-trend`, `meal-photo-log` | **B / C — hold** | Burke 2011 is cited 798 times **and grades its own evidence weak** (A22). The library's existing grades already match the authors' own assessment. No change |
| `fermented-food-daily`, `veg-first`, `home-cooked-nights`, `order-before-arrival`, `batch-cook`, `portion-defaults`, `plate-up-in-the-kitchen`, `what-is-in-reach`, `eat-off-the-screen`, `kitchen-shutdown`, `maintenance-mode` | unchanged | Not re-examined this round; nothing found that bears on them. Recorded so the absence is deliberate rather than an omission |

**Net effect on the spread: A 5 · B 12 · C 11 · D 4 · E 0.** The pillar
keeps the most A grades in the library, and now it has earned them.

---

## E. NEW CARD CANDIDATES

No `Protocol` objects — that is Gate 4. Practice, grade, scheduling shape,
safety, and what makes each one worth a slot.

### E1 — Choose the less-processed version of the same food

- **Grade: B** (A11 + A12)
- **Why it earns a slot**: the brief names ultra-processed food as a
  priority and the library has nothing on it. It is also the one place in
  nutrition where a controlled causal experiment exists.
- **The practice**: not "avoid ultra-processed food" — that is a category
  instruction most people cannot act on. It is: *at the moment of a swap
  you are already making, take the version with fewer steps between the
  ingredient and the plate.* Porridge oats rather than the flavoured
  sachet. Bread from the bakery counter rather than the long-life loaf.
- **Scheduling shape**: weekly, `sessionType: 'meal_plan'`, sitting
  alongside `meal-sketch` — this is a shopping-list decision, not a
  mealtime one. `tier: 'could'`.
- **Copy must carry**: the 500 calories a day from Hall's trial is the
  most surprising number in the pillar and it should be stated with its
  n = 20 beside it. And the honest half: the population evidence covers
  ten million people and the authors graded most of it low or very low
  quality.
- **Safety**: this card is a cost-of-living tripwire. Less-processed food
  is more expensive and takes more time, and a card that implies otherwise
  will land badly. It must say plainly that convenience food is not a
  moral failure, that a swap made where a swap is available is the whole
  practice, and that nothing here is a reason to eat less.

### E2 — Eat in the daylight on night shift

- **Grade: C** (A19, supported by Leung 2020 and Grant 2017)
- **Why it earns a slot**: the brief names shift-work eating explicitly;
  it spans recovery, work and nutrition; and Gate 1's widening of "who
  counts as a shift worker" — anyone regularly awake between about 10pm
  and 4am, including new parents and carers — makes it far more broadly
  useful than an occupational card.
- **The practice**: keep the substantial eating in the daytime hours the
  roster allows, and make the night-shift intake the smaller one.
- **Scheduling shape**: this needs `timeAnchored: true` meals and has to
  interact with the roster, so it is a Gate 3 conversation with the
  recovery and work pillars rather than a standalone object. A cutoff
  anchor will not work here.
- **Safety**: **the single most important safety line in the round.** This
  must never read as a reason to skip food on a night shift. Working
  hungry at 3am is worse than eating at 3am. The practice is moving a
  meal, not removing one. Anyone driving home afterwards needs food.

### E3 — What you eat by day changes the night

- **Grade: C** (A21)
- **Why it earns a slot**: the nutrition-and-sleep seam is unoccupied in
  the library, and it is the seam Marie-Pierre St-Onge owns (section H).
- **The practice**: fibre earlier in the day and less saturated fat at
  dinner, framed as something you get back that night rather than
  something you give up.
- **Scheduling shape**: it attaches to `fibre-30` (already `should`,
  wake-anchored) rather than needing its own daily slot. A weekly
  reflection card, or a `goalDomains` addition to `fibre-30`. Gate 3 call.
- **Safety**: ordinary food, no amounts. The standard eating-disorder
  routing.

### E4 — Plan the day's food after a short night

- **Grade: C** (A20; the underlying finding is B)
- **Why it earns a slot**: it turns a bad night into a plan instead of a
  verdict, which is exactly the brief's "make a bad week a non-event".
- **The practice**: on a morning after a short night, decide the day's
  meals before appetite does. Not restriction — *deciding*.
- **Scheduling shape**: conditional, triggered by the sleep data the app
  already has. `neverNag`, `tier: 'could'`. This is the clearest example
  in the round of a card the app can trigger and a static library cannot.
- **Safety**: must not imply that being hungry after bad sleep is a
  failure of will. The finding is that intake rises; the card's job is to
  make that unsurprising.

### E5 — Protein before bed on training days

- **Grade: C** (A26)
- **The practice**: a protein-containing snack in the last hour before
  bed, on days you trained — written as food, not as a powder.
- **Scheduling shape**: `anchor: { kind: 'sleep', offsetMin: 60 }`, days
  matched to training days.
- **Copy must carry**: the honest framing is "if you are short of protein
  for the day, this is a real place to put it", because the outcome trial
  cannot separate timing from total intake.
- **Safety**: routes to the same protein safety line as the existing
  protein cards (kidney conditions, disordered eating, a doctor's existing
  advice).
- **Routing note**: stays in nutrition **only if written as food**. See
  section G.

### E6 — The cholesterol-lowering plate

- **Grade: C** (A24)
- **Why it earns a slot**: it is the best candidate in the round that no
  communicator in the corpus is promoting — a literature-inlet find with
  a randomised comparison against an active drug behind it, and an honest
  researcher-only attribution.
- **The practice**: build a plate that combines the four components
  together — plant sterols, soy protein, viscous fibre, nuts — rather than
  chasing any one of them.
- **Scheduling shape**: `meal_plan`, weekly.
- **Safety**: **this one needs the most care in the pillar.** Cholesterol
  is a clinical matter. The card must route to a GP, must never be written
  as an alternative to prescribed medication, and must never imply that
  someone can come off a statin. The trial's own comparison was against a
  drug and that is exactly why the copy has to be careful.

### E7 — Pick the version that takes chewing

- **Grade: C** (A16)
- **Why it earns a slot, beside `slow-plate` rather than replacing it**:
  `slow-plate` asks the person to change their behaviour; this asks them
  to change the food, which is easier and is where the effect actually
  comes from. Whole fruit over juice, a thing to bite over a thing to
  drink.
- **Scheduling shape**: attaches to the same meal `slow-plate` uses;
  possibly better as a copy extension of that card than a new object.
  Gate 3 call.
- **Safety**: standard. Explicitly not for anyone with a chewing,
  swallowing or dental difficulty — this is the card where the existing
  older-adult protein guidance (soft, minced, blended) points the opposite
  way, and the two must not collide.

### Declined, and why

- **Any card built on the ZOE Big IF adherence findings.** The source is a
  conference abstract from the company that sells the programme (A10).
- **Anything built on the 29-man five-day overfeeding study** (A13).
- **Fat-plus-fibre for satiety** — the systematic review is a null with
  twelve studies in it (A15).
- **A "1.6 g/kg" target, in any card, in any wording** (section B).
- **A protein number for women.** Nuckols suspects the optimum is 10–15%
  lower and says so honestly; there is no evidence base to write it from,
  and inventing one would be exactly the prescription the brief forbids.
- **Anything requiring a calorie figure, a goal weight or a rate of
  loss.** Nothing in this round needed one, which is worth saying: the
  whole nutrition finding set of this round is expressible without a
  single prescriptive number.

---

## F. TIME BACK

The README's rule: roughly one in five of what a round returns, framed as
a gift rather than a lecture. Gate 1 nominated sixteen candidates across
both pillars; the nutrition ones were checked and **three ship as
standalone time-back cards, three ship as corrections inside existing card
copy, and two are declined.** Three standalone against eight new-card
candidates is 27% — close to the target, and deliberately not higher,
because a round that is mostly debunking has misread the job.

### Ships as its own card

**F1 — You can stop rationing protein across meals.**
Verified at A4. The "you can only use 40–50 g at a sitting" rule is an
artefact of studies that stopped measuring too soon; a 100 g feed is
digested, absorbed and incorporated over more than twelve hours, and
amino-acid oxidation barely moves. *What it gives back*: the pattern of a
person's actual life. Shift workers who can eat twice. Older people with
small appetites. Anyone whose day has one big family meal in it. **This is
the best time-back in the round because it removes a rule people were
obeying at real cost.**
Grade of the correction: **C**, on one 36-person mechanism trial plus a
distribution review reaching the same practical answer.

**F2 — Soy will not do anything to your hormones.**
Verified at A23. Reed 2021: 41 studies; testosterone measured in 1,753
men, free testosterone in 752, oestradiol in 1,000, SHBG in 967. **No
significant effect on any hormone, at any dose, over any duration, under
any statistical model.** *What it gives back*: one of the cheapest, most
available protein sources in the country, plus the mental cost of
avoiding it. Grade: **B**.
*Attribution caution*: the senior author has long-standing industry links.
State the finding; do not lean on him as the communicator. Layne Norton is
the traced communicator here (Gate 1 claim 61).

**F3 — Nobody needs to carry a two-litre bottle to think straight.**
Verified at A18, and this is the one where Gate 1's suspicion was right.
Two meta-analyses; the *more favourable* of the two finds **no
significant cognitive effect below 2% body-mass loss** (ES −0.14, 95% CI
−0.27 to 0.00), and the other finds nothing at any level. The claim that
1% fluid loss measurably harms recall and executive function is not
supported by either. *What it gives back*: the bottle, the tally, and the
low-grade anxiety about being slightly behind on water all day. Grade of
the correction: **B**. It pairs with the existing `water-with-meals` card,
whose copy was already right.

### Ships as a correction inside existing copy, not as its own card

**F4 — Nobody has to hit 1.6 g/kg.** Section B. Written as a precision
gift: there is a range, people vary, and the lifting is the bigger half.
Belongs in `meal-sketch` and `protein-anchor-meals`, not as a debunk card.

**F5 — "Eat earlier because you burn more in the morning" is not
true.** A7. Ruddick-Collins tested it isoenergetically and found no
difference in total daily energy expenditure, resting metabolic rate or
weight loss. The reason to eat earlier is appetite and overnight glucose
handling. Belongs inside `kitchen-closed`, and it makes that card kinder
as well as truer.

**F6 — Water is not the only acceptable swap for a sugary drink.**
A23. A low- or no-calorie sweetened drink in place of a sugary one was
associated with −1.06 kg and better cardiometabolic markers, GRADE
moderate, with no evidence of harm. Belongs beside `default-drink-water`
as an option, never as a replacement for it.

### Declined

**F7 — "Doing intermittent fasting intermittently is worse than not doing
it."** Gate 1 rated this the rarest and most useful kind of time-back.
**It cannot be shipped.** The only source is a conference abstract from
the company selling the programme (A10), there is no control group, and
the finding appears in no peer-reviewed publication. It is also
discouraging copy about a practice somebody may be halfway through, which
the README's expectancy section specifically warns against. Declined on
both grounds.

**F8 — Fear of fructose, including in fruit.** Gate 1 marked this
optional. Nothing was opened this round that traces it to a source, and
the rule is not to go hunting. Left on the list.

---

## G. SUPPLEMENT ROUTING

`protocols.supplements.ts` was read in full including its header. The
three binding rules — **no amount beyond what the named public source
states, described as theirs**; **every entry `neverNag`**; **graded
honestly in both directions** — govern everything below, as does the
standing exclusion of anything needing a blood result or a professional to
decide.

The carve-out holds eight entries. **This round proposes no new entries
and one structural change.**

| Candidate | Where it came from | Routing decision | Which rule governs |
|---|---|---|---|
| **Creatine — loading is unnecessary** | Gate 1 claims 18, 52 | **Carve-out, no change needed.** The existing `creatine-monohydrate` card already says a loading week is "faster, not better", and already states three to five grams a day filling stores over three to four weeks. That figure is the ISSN position stand's own (Kreider R et al., *ISSN position stand: safety and efficacy of creatine supplementation*, JISSN 2017;14(1), doi:10.1186/s12970-017-0173-z — **Crossref clean**). Two new traceable credits are available (section H) | Rule 1: the number on the card is the stand's, and it stays |
| **Creatine — the saturation timescale conflict** | Patrick says 3–4 weeks; Israetel says 7–10 days | **RESOLVED in favour of the card as written.** Rule 1 permits only the position stand's figure, and the card already carries it. Israetel's 7–10 days is a loading-protocol figure, not the low-dose saturation figure, so the two are describing different things rather than contradicting each other. **No change** | Rule 1 |
| **Creatine — a brain dose** | Gate 1 claim 19, a German dose-response study | **Recorded, not written.** No position stand states a brain dose | Rule 1 forbids it outright |
| **Creatine and cognition** | Gate 1 claims 19, 20 | **Carve-out, graded DOWN and stated separately from the muscle claim.** Verified source: McMorris T, Hale BJ, Pine BS, Williams TB, *Creatine supplementation research fails to support the theoretical basis for an effect on cognition: evidence from a systematic review*, Behav Brain Res 2024;466:114982, doi:10.1016/j.bbr.2024.114982 — **Crossref clean**. The review confirms creatine raises brain creatine content but finds the cognitive results **equivocal**, criticises the supplementation regimens used, and calls for research in stressed populations. So the honest position is **early and unresolved (D), not disproven** — Gate 1's "currently unsupported by the review literature" is slightly harder than the review itself. Write it as: the muscle case is A and the brain case is early | Rule 3, both directions |
| **Creatine — gummies** | Gate 1 claim 21 | **Carve-out, as a form note on the existing card.** The card already says plain monohydrate is the form the evidence used. The third-party testing finding strengthens that sentence; it is not a new entry, and the specific product-test result was not independently verifiable at Gate 2 so it should be described as "independent testing has found" rather than with a percentage | Rule 1 |
| **Creatine — 10 g/day in midlife women** | Gate 1, from Attia 378 | **Recorded, not written.** No position stand states it. A leading researcher saying it on a podcast does not change that | Rule 1 |
| **The structural question Gate 1 raised** | Five findings now attach to one card | **Split it.** The muscle claim is A and the brain claim is D, and a single card cannot show two grades. The recommendation is **one A-grade entry (`creatine-monohydrate`, unchanged) plus one D-grade entry for the brain claim**, following the `magnesium-honest` precedent exactly — a widely-bought promise, graded at what the reviews actually say, and saying so. That precedent is already in the file and already works | Rule 3 |
| **Collagen** | Gate 1 claim 10, van Loon | **DECLINE, with the evidence recorded.** There is a 2024 meta-analysis (Bischof K, Moitzi AM, Stafilidis S, König D, Sports Med 2024;54(11):2865–2888, doi:10.1007/s40279-024-02079-0, Crossref clean, cited 11): 19 RCTs, 768 participants, fat-free mass SMD 0.48 — but the authors themselves rate the certainty **low to moderate**. Against it, van Loon's own group published a direct null on the mechanism (Kirmse M et al., *Collagen peptide supplementation during training does not further increase connective tissue protein synthesis rates*, Med Sci Sports Exerc 2024;56(12):2296–2304, doi:10.1249/mss.0000000000003519, Crossref clean). **And decisively for this file: no position stand names a collagen amount**, so rule 1 leaves nothing writable. If Isaac wants it, the only honest form is a D entry that states no dose and says the mechanism study from the field's leading lab came back null |
| **Pre-sleep protein** | Gate 1 claims 4, 38 | **Route to NUTRITION, not the carve-out** — as candidate E5, and Gate 1's reasoning is right. A protein feed before bed is food. The routing test is the wording: **if the card names a snack it is nutrition; if it names a powder it becomes a supplement entry and inherits rule 1**, which would then forbid the 27.5 g and 40 g figures from the trials. Write it as food |
| **Protein powder — whey versus casein** | Gate 1 claims 1, 8 | **Carve-out, as a refinement of `protein-powder-is-food`, not a new entry.** The acute digestion difference is real; nothing establishes it changes long-run outcomes, and the card must not imply it does. The existing card's position — powder is convenience, whole food is the default — is unchanged and correct |
| **Protein powder — the target on the card** | The card cites the ISSN stand's 1.4–2.0 g/kg/day | **No change, and worth noting why.** That is a *position stand's range*, stated as theirs, which is exactly what rule 1 permits — and it is a range rather than a point, so it does not inherit the Morton problem. The card is already right |
| **Vitamin D** | — | **No change.** Nothing found this round. The test-first framing stands |
| **Omega-3** | — | **No change.** Nothing found this round |
| **Caffeine** | — | **No change.** Nothing found this round |
| **Ginger; MCT oil** | Gate 1 claim 124, St-Onge | **DECLINE.** Pilot-scale, and the MCT work is the industry-funded arm the researcher flags herself. Declining it is also the right way to honour her own conflict handling |
| **Probiotics; the "gut reset" cluster** | Gate 1 section F | **DECLINE**, unchanged. Named commercial protocols; several would need a clinician, which the carve-out forbids outright |
| **Electrolytes / sodium replacement** | Gate 1 claim 110, Galpin | **DECLINE the individualised half.** Sweat testing is a service the source sells and needs a measurement. The general point — that replacing fluid includes replacing sodium — can sit in hydration copy without becoming an entry. Note that A18 weakens the case for the whole hydration-optimisation frame anyway |

**Summary: nothing new enters the carve-out. One entry splits.** That is
the right shape for a file whose whole design premise is that a list of
substances is not the deliverable.

---

## H. ATTRIBUTION

Per `METHOD.md`: a credit needs a specific episode, article or topic page
where that person teaches **this** practice. A researcher credit
additionally requires that person **on the author list of a source in the
card's own `sources.md` row**, verified at Crossref. Where Gate 1 traced
it, the credit is carried below with its trace; where it did not, the line
is empty and stays empty.

### Verified: Marie-Pierre St-Onge has zero credits, and it is the largest gap in the pillar

**Confirmed by direct search of the shipped library.** `St-Onge` returns
**zero** matches across `protocols.ts` and `protocols.supplements.ts`.
Gate 1's claim that she is the most under-used name found in the round is
correct.

For context, the same search across the whole library returns: Peter Attia
37, Andrew Huberman 32, Rhonda Patrick 17, Layne Norton 1, **Andy Galpin
0, Luc van Loon 0, Greg Nuckols 0, Kevin Hall 0, Danny Lennon 0, Alan
Flanagan 0, Daniel Lieberman 0, Mike Israetel 0, Frank Scheer 0, Marta
Garaulet 0, David Jenkins 0**. (The one `Hall` match in the library is
Jeffrey Hall on a connection card — a different person entirely, and a
good illustration of why the author-list rule exists.)

**Where St-Onge belongs.** She satisfies both credit types at once, which
is rare: she is the researcher on the author list *and* the communicator
who teaches it publicly.

| Card | Credit type | Basis |
|---|---|---|
| **E3 — what you eat by day changes the night** | **RESEARCHER + communicator** | She is first author of St-Onge MP, Roberts A, Shechter A, Choudhury AR, *Fiber and saturated fat are associated with sleep arousals and slow wave sleep*, J Clin Sleep Med 2016;12(1):19–24, doi:10.5664/jcsm.5384 — **author-list rule satisfied, verified at Crossref**. And she teaches it in public on her Huberman Lab episode (opened at Gate 1, with its 25-item reference list) |
| **E4 — plan the day's food after a short night** | **communicator; RESEARCHER pending** | She is the communicator for the whole sleep-and-intake seam. The author-list rule is satisfied **only if** one of her own energy-intake trials is in the card's `sources.md` row; if the row carries only the Fenton 2021 meta-analysis she is **not** on the author list and the credit must say "populariser", not researcher. Gate 4 must check this rather than assume it |
| `kitchen-closed`, `fasting-window` | **communicator** | Her delayed-mealtime and meal-timing work is the spine of the mechanism these cards now carry |
| Cross-reference to recovery | — | Her sleep-restriction and insulin-sensitivity trials belong to the recovery pillar, not here. Flag for that round rather than duplicating |

### Other credits available, all traced by Gate 1 to an opened source

| Practice / card | Name | Type | Trace |
|---|---|---|---|
| **E1 — ultra-processed food** | **Kevin Hall** | **RESEARCHER** | First author of the Cell Metabolism 2019 inpatient trial. Author-list rule satisfied and verified at Crossref. He has zero library credits and is the single most important uncredited name in this pillar |
| **E1 — ultra-processed food** | **Layne Norton**, **Rhonda Patrick** | communicators | Both describe the Hall trial accurately and independently (Gate 1 claims 63 and 71); the trial appears on Norton's own published Huberman Lab reference list, and it is the spine of Patrick's topic page |
| **Protein: the honest range** (`meal-sketch`, `protein-anchor-meals`) | **Greg Nuckols** | communicator | strongerbyscience.com/protein-science/, opened and read in full at Gate 2 (11,755 words). He states the p = 0.079, the 1.03–2.20 interval and the supplementary figures. **This is his finding and nobody else in the corpus has it.** Zero library credits currently |
| **Protein: the honest range** | **Stuart Phillips** | **RESEARCHER** | Senior author of both Morton 2018 and Nunes 2022 — author-list rule satisfied at Crossref for both. Worth stating plainly that the researcher behind the famous number is also the researcher behind the later, more careful analysis that declines to give one |
| **F1 — the per-meal ceiling** | **Luc van Loon** | **RESEARCHER + communicator** | Senior author of Trommelen 2023 (Crossref-verified), and he teaches it on Attia Drive 299 (opened at Gate 1). Both credit types satisfied. Zero library credits currently |
| **E5 — protein before bed** | **Luc van Loon** (originator), **Michael Ormsbee** (independent programme) | RESEARCHER / communicator | van Loon is on the Snijders 2015 author list (Crossref-verified). Ormsbee is a communicator credit only unless one of his papers enters the `sources.md` row — **do not give him a researcher credit on van Loon's paper** |
| **Meal timing works through appetite, not expenditure** (`kitchen-closed`) | **Frank Scheer**, **Marta Garaulet** | **RESEARCHERS** | Both on the Vujović 2022 author list; Garaulet is first author of the 2013 timing-and-weight-loss cohort. Author-list rule satisfied at Crossref for both |
| Same | **Alan Flanagan**, **Danny Lennon** | communicators | Sigma Nutrition Radio 488, opened at Gate 1, which names the underlying papers. **Lennon is Tier 1 on the roster and carries no library credit at all** |
| **E2 — night-shift eating** | **Sarah Chellappa**, **Frank Scheer** | **RESEARCHERS** | Both on the Science Advances 2021 author list, Crossref-verified |
| **E6 — the cholesterol-lowering plate** | **David Jenkins** | **RESEARCHER** | First author of the JAMA 2003 trial, Crossref-verified. **No communicator credit is available and the line should stay otherwise empty** — this is a literature-inlet card and an honest empty attribution is the system working |
| `slow-plate` / **E7** | **Marlou Lasschuijt** | communicator, and RESEARCHER only if her work is in the row | Sigma Nutrition Radio 526. **Barbara Rolls keeps the existing satiety credit.** Note that the Krop 2018 meta-analysis (A16) carries neither of their names, so if that becomes the card's source neither gets a researcher credit from it |
| `drink-free-days` | **Tim Stockwell** | **RESEARCHER — verify the row** | He is an author on Zhao 2023 (Crossref-verified). He is already credited on the card. If Gate 4 adds Zhao 2023 to that card's `sources.md` row, the credit is properly grounded for the first time |
| `creatine-monohydrate` | **Rhonda Patrick**, **Mike Israetel** | communicators | Attia Drive 369 and the DOAC episode respectively, both opened at Gate 1. Both teach the exact practice the card teaches (loading is unnecessary). Patrick is already credited on other cards and her recovery-round credits all traced exactly; this is an easy, honest addition |
| **F2 — soy** | **Layne Norton** | communicator | Named on his published Huberman Lab reference list. **Do not credit the meta-analysis's senior author as a communicator** — state the finding and leave it at that |

### Credits that should come OFF

| Card | Credit | Verdict |
|---|---|---|
| `kitchen-closed` | **David Sinclair** | **UNTRACED — remove.** Nothing in Gate 1 or Gate 2 traces a meal-timing or eating-cutoff practice to him, and `COMMUNICATORS.md` names him as a risk. The card now has far better names available (Scheer, Garaulet, Flanagan, Lennon, St-Onge). This is not a judgement call any more: there are traced credits to put in its place |
| `fasting-window` | **David Sinclair** | **UNTRACED — remove**, same reasoning. Gate 1 flagged this as Isaac's call; Gate 2's position is that once traced alternatives exist, `METHOD.md`'s rule applies — a credit nobody traced comes off |
| `sauna` (longevity, out of this pillar's scope) | **David Sinclair** | **Flagged, not acted on.** This is the recovery pillar's card. Recording it so the third Sinclair credit is not lost between rounds |
| `water-with-meals` | **Heinz Valtin** | **Reword, do not remove.** Gate 1 is right: he is the physiologist who *debunked* the eight-glasses rule, and crediting him beside a recommendation to drink a glass with every meal reads as endorsement. The card's own copy already describes his actual finding correctly. Reword the credit to say what he found, and add the two hydration meta-analyses (A18) to the row |
| `slow-plate` | **Andrew Huberman** | **UNTRACED for this practice — reword or remove.** Nothing in this round traces eating rate to him. Lasschuijt is the better second name. Consistent with the recovery audit's finding that 11 of his 16 credits there were adjacent rather than exact |

### Where the podcast and the paper differ — recorded without scorn

Per the README, these are recorded because they are the most interesting
thing in the round, and most of them are enthusiasm.

1. **1.6 g/kg as settled.** Four Tier-1 voices, one paper, and the paper's
   own discussion recommends 2.2. Section B. The most consequential.
2. **"1% dehydration measurably impairs cognition."** Neither meta-analysis
   supports an effect below 2% body-mass loss (A18).
3. **"A leucine threshold switches on muscle protein synthesis."** The
   systematic review finds no threshold in either age group and no plasma
   leucine variable predicting the response (A5).
4. **"Ultra-processed food rewires the brain."** A 29-man, five-day,
   unequally-allocated study in healthy young men, never replicated (A13).
   The same page describes the Hall trial accurately, which is the point.
5. **"Eat earlier because you burn more in the morning."** Directly tested
   isoenergetically and found not to hold (A7).
6. **The ZOE ten-hour-window findings.** Not overstatement so much as
   over-sourcing: a conference abstract carried as though it were a
   published study (A10).
7. **Mendelian randomisation "resolved" the moderate-drinking question.**
   The MR review says it has not; the bias-adjusted cohort meta-analysis
   is the stronger citation (A17).

And two the other way, recorded because they matter as much:

- **Layne Norton and Rhonda Patrick describe the Hall trial accurately and
  independently**, to the number (A11). Genuine convergence.
- **Greg Nuckols is right where four more famous people are wrong, and is
  more moderate than his summary suggests** — he does not say 1.6 is
  useless, he says it is not a finding, and he explicitly declines to
  fault the Morton authors. That is what Tier 1 looks like.

---

## What Gate 3 gets that it did not have

The nutrition coach can now say, on a Tuesday, things it could not say
before:

- *"You don't have to hit a protein number. Somewhere in a range, with
  some lifting, is the whole finding — and the lifting is the bigger
  half."*
- *"You can stop splitting your protein up. A big meal isn't wasted."*
- *"If dinner can come earlier, that's the version with the science behind
  it — and it works by making the evening easier, not by burning more."*
- *"Night shift this week. Keep the real meal in the daylight where you
  can, and never work hungry at 3am."*
- *"Bad night's sleep? Your appetite is going to run ahead of you today.
  That's physiology, not weakness — so let's decide lunch now."*
- *"More fibre today is also a better night tonight."*
- *"Soy is fine. It was always fine."*
- *"You don't need to carry the bottle around."*

That is eight new sentences, and not one of them contains a calorie
figure, a goal weight or a rate of loss.
