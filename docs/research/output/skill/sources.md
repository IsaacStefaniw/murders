# Skill & Craft round — source ledger

One row per candidate in `protocols.ts`, then the evidence behind the five
proposed regrades, then what was declined. 42 DOIs went through the full
chain on 8 September 2026: Crossref for bibliography **and** the
title-prefix retraction check, then Europe PMC or OpenAlex (including its
`is_retracted` flag) for abstract, design and n. 24 verified, 12 partly
verified, 3 record-only, 2 unverified. Full working in `ledgers/gate2.md`.

**Grade is the grade of the practice.** Two candidates were graded below
Gate 2's proposal on that basis and `findings.md` says which and why.

## Candidates

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `let-the-gap-stretch` | Cepeda NJ, Vul E, Rohrer D, Wixted JT, Pashler H. 2008. Spacing effects in learning: a temporal ridgeline of optimal retention. Psychological Science 19(11), DOI 10.1111/j.1467-9280.2008.02209.x. Underlying: Cepeda NJ et al. 2006, Psychological Bulletin 132(3):354, DOI 10.1037/0033-2909.132.3.354 | Large multi-session experiment establishing a gap-to-retention ridgeline; meta-analysis | >1,350; 839 assessments across 317 experiments | B | The spacing effect itself is A-grade and already carries the library's `spaced-review`. This card is the **dosing rule**, which is a single ridgeline estimated on fact learning, and expanding schedules have not reliably beaten equal-interval ones head to head. Tested and it held up; not "many studies agree" about *this* instruction. |
| `guess-before-you-read` | Richland LE, Kornell N, Kao LS. 2009. The pretesting effect: do unsuccessful retrieval attempts enhance learning? J Exp Psychol Applied, DOI 10.1037/a0016496 | Five experiments, with attention-direction confounds designed out | five experiments, one expository passage | C | **Graded down from Gate 2's B.** The design is good and the striking result — the benefit appears even on items the pretest failed to retrieve — is exactly what makes the practice worth trying. But it is five experiments from one laboratory on one piece of reading, with much thinner classroom-scale evidence than post-study testing has. One lab is "some evidence, not settled". |
| `one-behaviour-one-cue` | Lally P, van Jaarsveld CHM, Potts HWW, Wardle J. 2010. How are habits formed? Eur J Soc Psychol, DOI 10.1002/ejsp.674. Keller J et al. 2021, RCT comparing routine-based and time-based cues, Br J Health Psychol, DOI 10.1111/bjhp.12504 (n=192, 84 days, Lally a co-author). Meta-analyses: Singh B et al. 2024, DOI 10.3390/healthcare12232488 (20 studies, 2,601 participants, SMD 0.69); Ma H et al. 2023, DOI 10.1186/s12966-023-01493-3 (SMD 0.31) | Longitudinal observational; randomised trial; two meta-analyses | 96; 192; 2,601; 10 studies | B | Multiple independent sources agreeing, including a randomised trial of the specific design question the card answers. Not A: outcomes are self-reported automaticity, 11 of Singh's 20 studies are at high risk of bias, and Ma pools only 10. **Two findings are load-bearing for the card's copy.** The Keller null on routine versus time cues resolves an anchor question the library had been answering by intuition, so the card hands the choice to the person. And Lally found that missing one opportunity did not materially affect habit formation, which is an *empirical* justification for `neverNag` rather than a kind one. |
| `sleep-is-the-second-half` | Schmid D, Erlacher D, Klostermann A, Kredel R, Hossner E-J. 2020. Sleep-dependent motor memory consolidation in healthy adults: a meta-analysis. Neurosci Biobehav Rev, DOI 10.1016/j.neubiorev.2020.07.028 | Meta-analysis, sleep groups against wake groups | 48 studies, 53 sleep groups (829) against 53 wake groups (825), g=0.43 | C | **Graded down from Gate 2's B.** The meta-analysis is solid and the effect is moderate. The card, however, asks you to *schedule practice a certain way*, and that instruction has never been tested. The tasks are finger tapping and mirror tracing rather than a guitar. Cross-pillar: the recovery round has no consolidation card, so this belongs here, and `goalDomains` carries both. |
| `learn-the-ground-first` | Recht DR, Leslie L. 1988. Effect of prior knowledge on good and poor readers' memory of text. J Educ Psychol 80(1):16, DOI 10.1037/0022-0663.80.1.16 | Experiment crossing reading ability with domain knowledge | 64 children | D | One study, 64 children, one domain, 1988, never tested as an adult self-study strategy. The result is memorable — poor readers who knew the game beat good readers who did not, on every measure, with no interaction — and it is a good prior rather than a finding. |
| `finish-on-a-good-one` | **None.** The consolidation half is supported in general (Schmid 2020, above); the specific claim that the *last* repetition is preferentially consolidated is **UNVERIFIED** and nothing found this round tests it | — | — | E | Unproven, and the copy says so. Kept because it is harmless, meaningful, and adherence-positive, which the contract explicitly permits: expectancy raises the value of a harmless low-grade practice and never its grade. |

## The five proposed regrades

| id | Now | Proposed | Evidence |
|---|---|---|---|
| `ship-monthly` | C | **E**, both credits removed | Its `why` and its entire attribution line come from Ariely & Wertenbroch 2002, DOI 10.1111/1467-9280.00441, **retracted 2 September 2026**. `harvest.js crossref` returns `DO_NOT_CITE`; Europe PMC types it "Retracted Publication". Nothing verified this round shows that self-set spaced deadlines improve creative output. What survives is the card's second half, which was always the honest half: work with no delivery date drifts, and evaluation plus time pressure can flatten creative work. Keep the practice, written warmly. |
| `skill-one-external-cue` | B | **D** | McKay B et al. 2024, Psychological Bulletin 150(11):1347–1362, DOI 10.1037/bul0000451 — a robust Bayesian reanalysis of the field's own dataset (Chua et al. 2021, DOI 10.1037/bul0000335). Bias-corrected g runs 0.01 to 0.15; Bayes factors favour the null in all five outcomes; moderate-to-strong publication bias in every analysis. Seven prior meta-studies had reported superiority. The card's line about being "replicated across hundreds of small experiments" is now false as written. **Attribution stays**: Wulf and Lewthwaite are on the Chua author list, so the credit is author-list-valid and they did popularise the practice. |
| `skill-interleaved-drills` | B | **C** | Czyż SH et al. 2024, 54 studies: a medium pooled effect overall, but "almost negligible" in the applied setting, and null in young participants. |
| `skill-mental-rehearsal` | C | **C**, dose corrected | Paravlic AH et al. 2018 meta-regression gives the measured dose: about 15 minutes across 3 days per week. The card currently specifies 10 minutes twice, which was invented rather than derived. |
| `spaced-review` | A | **A**, copy fix | The A survives on Cepeda 2006 (839 assessments, 317 experiments). But the card is silent on gap size, and Cepeda 2008 is the strongest practical result in the literature. Add the gap guidance, or pair it with `let-the-gap-stretch`. |
| `blank-page-recall` | A | **A**, confirmed | Tested rather than assumed. The card **is** the manipulation (Roediger & Karpicke 2006). Rowland 2014 shows free recall beats recognition, which is exactly why the card says blank page rather than quiz app. Adesope 2017 beats every control condition. Dunlosky 2013 rates practice testing high-utility, one of only two of ten techniques to earn it. The boundary is Pan & Rickard 2018 (192 effects, N=10,382, d=0.40), which is about transfer rather than retention. **Attribution: add Andrew Huberman** — Gate 1 traced him teaching this practice explicitly and he is not currently on the card. **Also add Cepeda and Pashler**, who are missing from the card whose A grade partly rests on their work. |

## Time back

Six items, at the low end of the contract's one in five, which is right for
a pillar whose good news is the point. Two extend the library's existing
`LEARNING_ANTIPATTERNS` rather than becoming cards.

| Item | Evidence | Note |
|---|---|---|
| Buying a planner to fix procrastination | van Eerde W, Klingsieck KB. 2018, Educational Research Review, DOI 10.1016/j.edurev.2018.09.002 (24 studies, k=44, N=1,173); Rozental A et al. 2018, Front Psychol, DOI 10.3389/fpsyg.2018.01588 (12 studies, 21 comparisons, N=718; overall g=0.34 [0.11, 0.56], I²=61%; the cognitive-behavioural subgroup g=0.55 [0.32, 0.77] with heterogeneity gone) | **Stated more carefully than the podcast that raised it.** Neither paper names time-management training as *least* effective. What they show is that it is not the winner, and that what works addresses how you feel about starting rather than when you pencilled it in. |
| Growth-mindset self-talk as a performance lever | Macnamara BN, Burgoyne AP. 2023, Psychological Bulletin 149(3–4):133–173, DOI 10.1037/bul0000352: 63 studies, N=97,672, d=0.05 [0.02, 0.09], **non-significant after publication-bias correction**; d=0.02 in the six highest-quality studies; authors with a financial incentive published significantly larger effects | **Citation trap, recorded.** Gate 1 cited DOI 10.1037/bul0000368 for this. That is Burnette et al., a *different* paper by different authors in the same double issue reaching a friendlier conclusion. Same shape as the Panagioti trap in `../corpus/RETRACTIONS.md`. |
| Self-controlled practice | McKay B et al. 2023, DOI 10.1080/1750984x.2023.2207255: naïve g=0.44 (k=52, N=2,061) collapses to **g=0.02 [−0.17, 0.21]** once unpublished experiments are included; publication status explains 48% of heterogeneity; the p-curve lacks evidential value | Declined as a card, recorded as time back. |
| External focus of attention | McKay 2024, above | Proposed for the "overturned or seriously contested" section of `../corpus/RETRACTIONS.md`, beside ego depletion and nudges. Same pattern. |
| Highlighting, rereading, learning styles | Already named in `LEARNING_ANTIPATTERNS` | Confirmed, not re-litigated. |

## Declined

| Candidate | Why |
|---|---|
| Value-directed remembering | Gate 1's DOI (10.3758/BF03194325) is Castel et al. 2002 on **ageing and short-term recall**, not a demonstration that pre-deciding what matters improves study. The practice may be sound; the citation does not support it and no substitute was verified. |
| A reconsolidation or memory-rewriting practice | Gate 1 records the researcher himself saying the human evidence is far weaker than the animal work. His restraint is the finding. |
| Study somewhere new / novelty at encoding | Not traced to a specific paper; the mechanism is animal work. Left for a later round. |
| An adult-specific language or instrument card | The brief names adult learners as a real gap. Nothing verified this round is specific to adults: Recht & Leslie is children, Rohrer is seventh-graders, Cepeda is undergraduates. Declining rather than dressing a general finding as an adult-specific one. |
| Growth-mindset self-talk | See time back. |
