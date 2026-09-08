# Work & Leadership round — source ledger

One row per candidate in `protocols.ts`, in file order. Every paper was
checked at record level on 8 September 2026: bibliographic details and
retraction status at the Crossref registry, abstracts and figures via
Europe PMC, PubMed Central, or **OpenAlex** where the publisher hides them
— APA journals elide abstracts from both Crossref and Europe PMC, and
OpenAlex rescued seven papers in this round. Government and regulator
pages were opened directly. The three working ledgers are in `ledgers/`.

**Grade is the grade of the practice**, which is usually below the grade
of the strongest paper behind it. Ten cards were moved down on exactly
that distinction; `findings.md` itemises them.

**Retraction note.** One paper in scope is retracted and is not used
anywhere: Panagioti et al. **2018**, *Association Between Physician
Burnout and Patient Safety…*, JAMA Internal Medicine 178(10):1317, DOI
10.1001/jamainternmed.2018.3713, retracted 18 May 2020 and still cited
824 times. It is **not** the same paper as Panagioti et al. **2017**, the
interventions meta-analysis, which is clean and is load-bearing below.
See `../corpus/RETRACTIONS.md`.

## Recovery from work

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `move-after-the-hard-one` | Koch et al. 2024, daily-diary study of after-work exercise and mental detachment. Supporting: Sonnentag, Venz & Casper 2017, *Advances in recovery research*, J Occup Health Psychol, DOI 10.1037/ocp0000079 | Within-person daily diary; narrative review | 93 employees over 514 days (**PARTLY VERIFIED** — the sample figure came from a search summary, not a primary record) | C | The mechanism is well identified: what predicts skipping the session is still being mentally at work, not physical tiredness. But it is one diary study whose n could not be confirmed at source, and the card's instruction (start moving before deciding) has not itself been trialled. The general exercise evidence is stronger and lives elsewhere in the library. |
| `days-off-are-not-saturday` | Fritz C, Sonnentag S. 2005. Recovery, health, and job performance: effects of weekend experiences. J Occup Health Psychol 10(3):187–199 | Longitudinal, across a weekend, in emergency service workers | 87 | C | A real prospective design in exactly the non-desk population the brief cares about, which is rare and is why it is not D. One small single-occupation sample, self-report, and the practice as written (a protected block with people in it) is an inference from the predictors rather than a tested package. |
| `holiday-lift-and-fade` | de Bloom J et al. 2009. Do we recover from vacation? Meta-analysis of vacation effects on health and well-being | Meta-analysis of vacation studies | pooled | C | The finding is meta-analytic and the two effects are clean: about +0.43 during the break and about −0.38 after resumption. The card is expectation-setting copy rather than a practice, and nothing has tested whether telling someone the fade is coming helps them. Graded on the card, not the meta-analysis. |

## Burnout

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `burnout-is-not-a-personal-failing` | Panagioti M et al. 2017. Controlled Interventions to Reduce Burnout in Physicians. JAMA Intern Med 177(2):195, DOI 10.1001/jamainternmed.2016.7674 (**clean**; one 2024 erratum correcting "Cohen Q" to "Cochran Q", no numbers changed). Bes I et al. 2023, workplace interventions for healthcare workers. Maricuțoiu LP, Sava FA, Butta O. 2016, The effectiveness of controlled interventions on employees' burnout. Ahola K et al. 2017, interventions in people who already have burnout. Construct: Maslach C, Schaufeli WB, Leiter MP. 2001. Job burnout. Annu Rev Psychol 52:397–422, DOI 10.1146/annurev.psych.52.1.397 | Four meta-analyses of controlled trials; one review | pooled across trials | B | The evidence is A-grade and consistent: organisation-directed interventions SMD −0.45 against physician-directed −0.18; workload-focused −0.44; across all employees exhaustion moves d=.17 while depersonalisation (.04) and personal accomplishment (−.02) do not move at all; and in people who already meet the threshold, four pooled RCTs show no effect on exhaustion or cynicism. What the card asks a person to do — name the part of the job and who can change it — is not itself the tested intervention. Graded on the practice. Dreison 2018 dissents and is recorded in the ledger rather than buried. |

## Feedback

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `keep-it-about-the-work` | Kluger AN, DeNisi A. 1996. The effects of feedback interventions on performance. Psychological Bulletin 119(2):254–284 | Meta-analysis | 607 effect sizes | C | The headline is A-grade and genuinely surprising: more than a third of feedback interventions reduced performance, and the mechanism is attention moving from task to self. The card turns that into a question you ask in the moment, which nobody has tested. The mechanism justifies the practice; it does not grade it. |
| `a-rating-is-one-persons-view` | Scullen SE, Mount MK, Goff M. 2000. Understanding the latent structure of job performance ratings. J Applied Psychology 85(6):956–970 | Latent-variable decomposition of multi-source ratings | large multi-rater samples | C | The measurement is strong and the numbers are stark: 62% and 53% of rating variance was the rater, against 21% and 25% for the person being rated. But the card is a reframing exercise written for the week after a bad review, and reframing exercises of this kind have not been trialled. |

## Job crafting

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `job-crafting-two-columns` | Oprea BT et al. 2019, effectiveness of job-crafting interventions: meta-analysis. Rudolph CW et al. 2017, Job crafting: a meta-analysis, J Vocational Behavior. Origin: Wrzesniewski A, Dutton JE. 2001, Crafting a job, Acad Manage Rev 26(2):179–201, DOI 10.2307/259118 | Meta-analysis of intervention studies; meta-analysis of correlations | pooled | B | This is one of the few practices in the pillar tested as an intervention rather than described: crafting rose g=0.26 and work engagement g=0.31. The two-column shape is not decoration — the trials that worked planned for the organisation and the person together. Not A: modest effects, heterogeneous programmes, and the correlational half cannot carry causation. |
| `take-on-the-harder-thing` | Rudolph CW et al. 2017 (above) | Meta-analysis of correlations | pooled | C | The asymmetry is real and useful: increasing challenging demands relates to other-rated performance at rc=0.422, the strongest performance link of any crafting dimension, while the meta-analytic factor analysis found "decreasing hindering demands" does not group with the other three. It is correlational, and asking for harder work has never been tested as an assignment. |

## Shift work, as work

Sleep-side shift cards belong to the recovery round and are cross-referenced, not rewritten: `night-anchor-sleep`, `night-shift-light`, `dark-glasses-home`, `no-drive-after-nights`, `pre-nights-nap`, `on-shift-nap`, `caffeine-on-nights`.

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `count-the-quick-returns` | Vedaa Ø et al. 2017, quick returns and health, registry cohort. Djupedal ILR et al. 2024, cluster-randomised trial of a roster intervention reducing quick returns | Registry cohort; cluster RCT | 66 units, 1,314 workers (RCT) | C | The eleven-hour threshold is the figure both studies used, so the card gives a real number rather than a vibe. But the trialled intervention was an employer reducing quick returns, and it bought only about d=−0.13 on insomnia while halving them. The card asks a person to *count* them, which is a different act entirely and untested. Grading it B would borrow the trial's standing for a practice the trial did not test. |
| `plan-the-ride-home` | Williamson A, Feyer AM. 2000, moderate sleep deprivation produces impairments equivalent to alcohol intoxication, Occup Environ Med. Smithies et al. 2026, FIFO commute-fatigue modelling. Cross-references `no-drive-after-nights` (B), which rests on Lee ML et al. 2016 PNAS 113(1):176–181, DOI 10.1073/pnas.1510383112 | Laboratory equivalence study; modelling; within-person on-road study | 16 (Lee, on-road) | C | The danger is B-grade and the app already carries the behaviour card at B. This card is the *arrangement made four days earlier*, which is sensible and has no trial behind it. Two cards, two honest grades. |
| `ask-for-forward-rotation` | Bambra CL et al. 2008, shifting schedules: the health effects of reorganizing shift work, Am J Prev Med. Klein Hesselink J et al. 2010, effects of a forward-rotating roster | Systematic review of roster interventions; intervention study | pooled | C | Forward rotation, faster rotation and self-scheduling are the three roster features with review-level support, so the content of the ask is well founded. The card is a preparation exercise for a conversation whose outcome nobody controls, and no study has tested asking. |

## Transitions

Every card here carries `neverNag`.

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `the-weekday-shape` | McKee-Ryan FM et al. 2005. Psychological and physical well-being during unemployment: a meta-analytic study. J Applied Psychology 90(1):53–76. Later shrinkage: Sterud 2025 (d=0.19, GRADE low) | Meta-analysis | hundreds of studies | B | Time structure, social contact and coping resources are the moderators that track wellbeing during unemployment across a very large pooled literature, and they point away from the job search rather than at it, which is the card's whole point. It is **correlational**: nobody randomised people to keep a weekday shape. Moved down from A on that basis. |
| `rehearse-dont-just-send` | Liu S, Huang JL, Wang M. 2014. Effectiveness of job search interventions: a meta-analytic review. Psychological Bulletin | Meta-analysis of randomised and quasi-experimental job-search interventions | pooled | B | Unusually prescriptive and the reason the card has two halves: odds of employment roughly OR 2.67, and interventions worked only where skill development **and** motivation enhancement were both present. Not A because the tested packages were multi-session group programmes, and "rehearse out loud with someone" is a cheap approximation of them, not the thing itself. |
| `name-the-rejection-first` | Caplan RD et al. 1989. Job seeking, reemployment, and mental health: a randomized field experiment. J Applied Psychology | Randomised field experiment | 928 | C | Inoculation against setbacks was a *named active component* of a large randomised programme, which is better than most things in this pillar. It was never isolated and tested on its own, and the card is that component extracted. Cross-references the existing `if-then-plan` (A) rather than restating implementation-intention evidence. |
| `list-the-doors-once` | Services Australia; Workforce Australia programme pages (JobSeeker Payment, Career Transition Assistance for 45+, Transition to Work for 15–24, Parent Pathways) | Rules of the system | — | D | A route, not an outcome. No amounts and no eligibility claims appear on the card, because those change and are not ours to state. |

## Meetings

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `start-at-the-minute` | Allen JA, Lehmann-Willenbrock N, Rogelberg SG. 2018, on late meeting starts and meeting outcomes | Field study with rated outcomes | — | B | A direct test of the practice itself with an objective-ish outcome: late starts produced ideas rated worse in quality and feasibility, not merely fewer. It is one study, not randomised at the meeting level, which is why it is not A. |
| `stand-for-the-short-ones` | Bluedorn AC et al. 1999. The effects of stand-up and sit-down meeting formats on meeting outcomes. J Applied Psychology 84(2):277–285 | Controlled experiment on meeting format | — | B | The practice was manipulated directly: sit-down meetings ran about 34% longer with no better decisions. The card carries the caveat the popular version drops, that standing groups were slightly less satisfied and used slightly less of their information. One experiment, hence not A. |
| `cameras-off-is-fine-here` | Shockley KM et al. 2021. The fatiguing effects of camera use in virtual meetings: a within-person field experiment. J Applied Psychology, DOI 10.1037/apl0000948, PMID 34423999. **Do not cite Bailenson 2021** (10.1037/tmb0000030), which is a theory paper with no participants whose author says the arguments are untested | Within-person field experiment, camera manipulated | 1,408 observations | B | The camera was actually manipulated and fatigue tracked it, with larger effects for women and newer employees — which is why the card is addressed to whoever runs the meeting. One organisation, one period. |
| `ten-minutes-after-the-bad-one` | Allen JA et al. 2022, meeting recovery and the meeting-to-work transition, J Occup Environ Med, PMC9729359 | Cross-sectional survey | — | C | The phenomenon has an empirical anchor: recovery need relates to meeting quality and relevance. The widely repeated "45 minutes" figure has **no traceable peer-reviewed source** and does not appear on the card or in the copy. |

## Non-desk work

| id | Primary source(s) | Design | n | Grade | Why this grade, not the one above |
|---|---|---|---|---|---|
| `heat-work-week` | Flouris AD et al. 2018. Workers' health and productivity under occupational heat strain: a systematic review and meta-analysis. Lancet Planetary Health. Morris NB et al. 2020, umbrella review of heat-mitigation strategies. Safe Work Australia, *Managing the risks of working in heat* — upgraded from a Guide to a **Model Code of Practice on 19 September 2025** | Meta-analysis; umbrella review; regulator code | pooled | B | Heat acclimatisation over roughly a week is well established physiologically and the occupational risk figures are meta-analytic. Flouris downgrades two of its own six outcomes for industry funding, which is recorded. Not A: the card's package (build-up plus planned shade and breaks) is assembled from the components rather than trialled whole. |
| `the-break-is-for-how-you-feel` | Albulescu P et al. 2022. "Give me a break!" A systematic review and meta-analysis on the efficacy of micro-breaks. PLoS One 17(8):e0272460, DOI 10.1371/journal.pone.0272460, PMC9432722 | Meta-analysis of experimental micro-break studies | pooled | A | The practice on the card *is* the tested thing, and the card's claim is exactly what the meta-analysis found rather than what people wish it found: vigor d=0.36 and fatigue d=0.35 both moved, while performance did not (d=0.16, p=.116, significant only for low-demand tasks). It also carries the practical moderator, that ten minutes was not enough after heavy work. A meta-analysis of experiments testing the practice itself, reported honestly, earns A. |

## Time back

| id | What is retired | Source | Grade | Why this grade |
|---|---|---|---|---|
| `stop-building-sandwiches` | The praise-criticism-praise structure | Parkes J et al. 2013 (N=20 and N=350 medical students): sandwiches changed what people thought of the feedback, not what they did with it. Prochazka J et al. 2020: positive effect in 91 students on a maths test, where the authors could not separate the structure from there simply being something positive in the message. Mechanism against it: Kluger & DeNisi 1996. Origin of the practice: Mary Kay Ash, *The Mary Kay Way* (2008), chapter 6 | D | Three studies in total, one null, one confounded, and a mechanism that argues against it. Retiring it is well founded; what replaces it (stay on the work) is the Kluger & DeNisi mechanism, untested as an instruction. |
| `write-alone-then-pool` | Group brainstorming out loud | Mullen B, Johnson C, Salas E. 1991. Productivity loss in brainstorming groups: a meta-analytic integration. Basic Appl Soc Psychol 12(1):3–23, DOI 10.1207/s15324834basp1201_1. Mechanism: Diehl M, Stroebe W. 1987, J Pers Soc Psychol 53(3):497–509 | A | Meta-analytic, consistent across decades, and the practice on the card is literally the tested comparison condition (nominal groups). The moderators are usable as written: the loss grows with group size, with an experimenter present, and when contributions are spoken rather than written. |
| `stop-worrying-about-multitasking` | Both halves of the multitasking folklore | Wiradhany W, Nieuwenstein MR. 2017. Cognitive control in media multitaskers: two replication studies and a meta-analysis. Atten Percept Psychophys 79(8):2620–2641, PMC5662702. **Correction on record** (10.3758/s13414-017-1456-9) fixing participant counts in study 1; conclusions unaffected | C | 14 tests at average power 0.81 produced 5 significant effects, of which 2 survived a Bayesian analysis; the 39-effect meta-analysis went non-significant after correcting for small-study effects. The card's positive half (switching costs) is covered by an existing library card. |
| `the-personality-workshop` | Type instruments as a team-composition tool | Pittenger DJ. 1993, Rev Educ Res 63(4):467, DOI 10.2307/1170497; Pittenger DJ. 2005, Consult Psychol J 57(3):210–221. Both records verified; neither abstract is exposed, so **no retest percentage is quoted**, and the widely repeated "half change type in five weeks" figure is UNVERIFIED and must not be used | D | The critique is standard and the absence of predictive evidence is the finding. Graded D rather than E because the card keeps what is defensible — the conversation — and only retires the instrument. |
| `the-open-plan-promise` | Open plan as a collaboration driver | Bernstein ES, Turban S. 2018. The impact of the "open" workspace on human collaboration. Phil Trans R Soc B 373(1753):20170239, DOI 10.1098/rstb.2017.0239, PMC6030579 | B | Two corporate headquarters measured before and after with wearable sociometric badges and message logs, which is objective measurement rather than opinion survey: face-to-face interaction fell roughly 70% with a matching rise in electronic messaging. Not randomised, two sites, hence not A. |

## Declined, and figures never to print

- **Panagioti 2018** (burnout → patient safety). Retracted; see above.
- **A shift-worker sleep card of any kind.** Written and graded by the recovery round. Duplicating it would be worse than the gap.
- **Any card telling a night worker their cancer risk.** The IARC classified the *hazard* and says in its own material that this does not indicate the level of risk. Half of that sentence is frightening and wrong.
- **A FIFO mental-health card.** Two Australian samples from the same period point in opposite directions (Gilbert 2023 against Asare 2021). Route to support; never characterise how the person feels.
- **Any personal-practice card framed as a fix for a bad roster.** Everything an app can offer sits in the bottom two tiers of the hierarchy of controls.
- **Untraceable figures, none of which appear anywhere in this round**: "meeting recovery takes 45 minutes"; the meeting-free-day percentages of 71, 55 and 52, which are not in the article they are attributed to; "half of people change type within five weeks"; "flow makes you five times more productive", which traces to a consulting firm's self-report survey.
- **Two papers bibliographically clean but numerically unverifiable**, so no figure from either enters copy: Paul & Moser 2009, and Dawson & Reid 1997. Sterud 2025 and Williamson & Feyer 2000 are used instead, both open access, same claims.
