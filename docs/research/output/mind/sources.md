# Mind round — source ledger

48 papers opened at Crossref registry level on 8 September 2026 and, where a record existed, at Europe PMC or OpenAlex abstract level, plus one open-access full text read directly. **Retraction check clean across all 48** — no DO_NOT_CITE flag, no retraction prefix in any title, no OpenAlex `is_retracted`. One paper returns a `new_version` relation, which is a superseded edition rather than a retraction, and it is not cited.

**Grade is the grade of the practice.** Full working in `ledgers/gate2.md`.

## Candidates

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `sitting-check` | Goldberg SB et al. 2022, prevalence of meditation-related adverse effects: N=434 of 953 screened, 10.6% functionally impairing, 1.2% lasting a month or more. Britton WB et al., Varieties of Contemplative Experience, PLOS ONE, open access, read in full — 60% of those reporting difficulties were meditation teachers, verified verbatim from the results section. Britton WB et al. 2010, DOI 10.1097/psy.0b013e3181dc1bad — dose-proportional cortical arousal on polysomnography, n=26 RCT | Prevalence survey; mixed-methods study; small RCT with objective measurement | 434 of 953; 26 | C | **Graded down from Gate 2's B.** The prevalence figures are verified and solid and the warning signs come straight from the primary literature. But a monthly self-review has never itself been trialled. Content verified, practice untested. Its value is safety rather than effect, and the grade must not borrow the strength of the prevalence data. **Correction carried forward: there is no 30-minute dose threshold anywhere in the literature.** Gate 1 carried it from a transcript; Gate 2 could not find it. What exists is the dose-proportional arousal finding above. |
| `worry-window` | Stimulus-control treatment for worry, Borkovec and successors | Small randomised trials | small, mostly students | C | The practice is exactly what was tested, which keeps it above D. The trials are small, predominantly student samples, and the technique is usually delivered inside a therapist-guided package rather than alone. |
| `talk-to-yourself-by-name` | Kross E et al. on distanced self-talk; Moser JS et al. on the event-related-potential evidence | Short laboratory stressors and speech tasks | small per study | C | Consistent direction across several small experiments, with an objective marker in at least one. Short laboratory stressors, small samples, modest effect. |
| `compassion-break` | Ferrari M et al. 2019, self-compassion interventions meta-analysis; Neff KD on the construct and its measurement | Meta-analysis of randomised trials | pooled across many RCTs | B | Tested repeatedly as an intervention with consistent modest effects on distress and wellbeing, and the five-minute written version is close to what was trialled. Not A: self-report outcomes, short follow-ups, heterogeneous packages. |
| `two-hours-outside` | White MP et al. 2019, Scientific Reports, nature contact and health and wellbeing | Cross-sectional survey | 19,806 | C | Very large, and the threshold shape is the useful part: no association below about 120 minutes a week, a plateau above it, and no difference whether the time came as one long visit or several short ones. Cross-sectional, so it cannot carry causation and cannot go higher. |
| `write-it-three-times` | Pennebaker JW and successors on expressive writing. Clinical-population estimate: Frisina PG et al. 2004, DOI 10.1097/01.nmd.0000138317.30764.63, d=0.19 | Many small randomised trials; meta-analysis in clinical populations | pooled | C | Decades of trials of exactly this protocol, which is why it is not D, and a small honest effect. The three-sessions-then-stop design is the tested one and it is the detail most often dropped. |
| `say-the-loss-out-loud` | **None.** No trial of this practice exists. The negative evidence, that stage models of grief are unsupported, is well established | — | — | D | Experienced practice ahead of the research, graded honestly. Kept because it is harmless, it is what bereavement services actually advise, and the alternative the culture supplies is worse and is already contradicted in the library. |

## Regrades proposed

**Net: A 1 · B 15 · C 18 · D 5 · E 1 becomes A 1 · B 16 · C 16 · D 6 · E 1.** A-plus-B moves from 40% to 42.5%, deliberately close to flat. A depth round, not an inflation round.

### Up

| card | now | proposed | evidence |
|---|---|---|---|
| `one-small-act` | C | **B** | Ekers D et al. 2014, DOI 10.1371/journal.pone.0100100: 26 RCTs, N=1,524, SMD −0.74 against control and −0.42 against medication. Cuijpers P et al. 2007, DOI 10.1016/j.cpr.2006.11.001: 16 studies, N=780, d=0.87, and **d=0.02 against cognitive therapy** — non-inferior to a far more complex treatment, across two independent meta-analyses seven years apart. Not A: every trial is a therapist-guided course in a depressed sample and study quality is rated low. **This should become the pillar's most prominent card.** |
| `best-possible-self` | C | **B** | Carrillo A et al. 2019, DOI 10.1371/journal.pone.0222386: 29 studies, 2,909 participants; wellbeing d+=0.325, optimism 0.334, positive affect 0.511, and it beat gratitude interventions head-to-head on affect. **Keep 15 minutes** — the meta-analysis found a trend for shorter total practice being more effective, a rare case of evidence endorsing the smaller version. |
| `gratitude-letter` | C | **B** | Choi J et al. 2025, PNAS, DOI 10.1073/pnas.2425193122: preregistered, 145 papers, 163 samples, 727 effect sizes, **24,804 participants across 28 countries, g=0.19, robust to publication bias**. Still a small effect, and a small effect that survives that scrutiny is a tested one. Not A: g=0.19 is at the edge of noticeable and the cross-country variation is unexplained. |

### Down

| card | now | proposed | evidence |
|---|---|---|---|
| `meditation-10` | B | **C** | Schumer MC, Lindsay EK, Creswell JD. 2018, J Consult Clin Psychol 86(7):569–583, DOI 10.1037/ccp0000324: 65 RCTs, **5,489 participants**, brief mindfulness, **g=0.21 with publication bias detected**. Goldberg 2022 umbrella: effects against active controls are smaller and often nonsignificant. Dawson AF et al. 2019, DOI 10.1111/aphw.12188, 51 RCTs: against active controls, improvement only in distress and state anxiety. **The round's most important regrade.** The practice is a short sit, which is precisely what was measured. Nothing about the practice changes and the copy should not get colder, only more specific. Its current line about being the most common daily practice among interviewed high performers is an anecdote doing evidential work and must go. |
| `evening-journal` | B | **C** | The mood half is Choi 2025 (g=0.19) and Frisina 2004 (d=0.19). **The sleep half has no support and the nearest meta-analytic evidence is null** (Dawson 2019 found no sleep benefit). Remove the sleep claim and keep the card. |
| `body-scan-sleep` | C | **D** | Gong H et al. 2016, J Psychosom Res 89:1–6, DOI 10.1016/j.jpsychores.2016.07.016: **6 RCTs, 330 participants**, with no significant effect on sleep onset latency, total sleep time, wake after sleep onset, sleep efficiency, or three standard sleep indices. Plus Dawson 2019, and Britton 2010's objectively measured arousal pointing the wrong way. The card stays because it is pleasant and harmless and expectancy is real, but it must not claim a sleep-onset benefit it does not have. **The regrade most worth a second reader.** |

### Holds, argued

| card | grade | why |
|---|---|---|
| `trigger-if-then` | **A holds** | The brief asked for a hard look at the pillar's only A and it survives on multiple independent meta-analyses in different domains: Toli A et al. 2016, DOI 10.1111/bjc.12086, 29 studies N=1,636; mental contrasting with implementation intentions 2021, DOI 10.3389/fpsyg.2021.565202, 21 studies and **15,907 participants**, g=0.336; substance use 2020, DOI 10.1016/j.drugalcdep.2020.108120. Direction agrees everywhere. **The copy should carry the modest number, around g=0.3, not the large one.** |
| `loving-kindness` | C holds | Galante J et al. 2014, DOI 10.1037/a0037249: 22 RCTs; against active controls explicitly inconclusive, quality low to moderate. A textbook C, and the card already says so honestly. |
| `open-monitoring` | C holds | The thinner half of the literature and rarely tested alone. **Its safety line is the best in the pillar and should be the template for the rest.** |
| `nsdr` | D holds | Kjaer TW et al. 2002 PET study, n≈8. Confirmed by the populariser's own description. |
| `phone-parked` | D holds, new rationale | Not because the evidence worsened but because the reasoning was wrong. The attention case supports it; the screen-time-and-wellbeing case does not. |
| `outdoor-reset` | C holds, reshaped | White 2019 changes the shape rather than the grade: count toward a weekly total of about 120 minutes rather than defending a 15-minute block. Pairs with `two-hours-outside`. |
| `cyclic-sighing` | B holds | Fincham GW et al. 2023, DOI 10.1038/s41598-022-27247-y: 12 RCTs, 785 adults, stress g=−0.35. Confirms B and does not lift it; the authors themselves warn against hype. **Correction: Zaccaro 2018 does not supply a dose**, contrary to what Gate 1 expected. |

## Declined

| Candidate | Why |
|---|---|
| Mindfulness-based cognitive therapy for relapse | Kuyken W et al. 2016 individual-patient meta-analysis, 9 studies, 1,258 patients, hazard ratio 0.69. **The best evidence in the round, and the app must not deliver it.** Name it, route to a clinician, and say plainly that the strongest thing in the category is not what this app is. |
| Rumination-focused cognitive behavioural therapy | Treatment. Same reason. |
| Breathing-based meditation for post-traumatic stress | n=21 total, waitlist control, author inside the tradition, and it is clinical. Declined on all three counts. |
| Social-media abstinence as a wellbeing practice | Lemahieu L et al. 2025, preregistered meta-analysis, 10 studies, N=4,674: **null on every outcome and null on dose.** Plackett R et al. 2023 in adults: abstinence helped in 3 of 12 studies against 5 of 6 for therapy-based approaches. |
| Anything about teenagers and phones | Contested, out of audience, and the library would be taking a side in a live scientific dispute. |
| A reconsolidation protocol | Gate 1 recorded the researcher's own restraint about the human evidence. The restraint is the finding. |
| A dopamine-budget mechanism | A model, not a measured quantity. |
| Psychedelics in any form | The single interaction warning belongs in the meditation safety text, said once. |
| Any neuroplasticity claim on any meditation card | Van Dam NT et al. 2018 exists precisely because of that overreach. |
| An imposter-thoughts card | Tewfik BA 2022, DOI 10.5465/amj.2020.1627, is real and not retracted, but it is field research on interpersonal effectiveness, the on-air version reshapes it, and there is no practice in it, only a reassurance. If it is wanted it is coach copy at D, not a schedulable card. |

## The phones claim, resolved

Gate 1 flagged this as a false convergence and it was right. The widely repeated tally is **22 experiments with 16 positive, not 25 and 16**, and the compilation is a self-maintained document rather than a peer-reviewed analysis. The decisive counter-evidence is Lemahieu 2025 above: preregistered, 10 studies, 4,674 people, null on every outcome and null on dose. The library's attention and notification cards keep their B, because they rest on a different literature about divided attention at encoding.
