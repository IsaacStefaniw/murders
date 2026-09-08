# Gate 2 — literature verification and grading: MIND

Run 8 September 2026. Input: `gate1_mind_skill.md` (48 episodes, 126 traced claims).
Method: `output/corpus/METHOD.md` two passes and the author-list rule.
Retraction register read first (`RETRACTIONS.md`); every DOI below was put through
`harvest.js crossref` for the registry record **and** the `DO_NOT_CITE` title check,
and through Europe PMC / OpenAlex for design, n and abstract.

**Grading discipline used throughout.** The grade is on the PRACTICE as this library
would schedule it — a named dose, at a named frequency, for a general adult user —
not on the paper and not on the speaker. A meta-analysis of clinician-delivered
8-week programmes does not make a 10-minute app session an A. Where the tested thing
and the shippable thing differ, the grade follows the shippable thing and the row
says so.

**Retraction status: no paper cited in this ledger is retracted.** All returned
`retraction_or_update: none` AND carried no retraction prefix in the Crossref title.
Two of Gate 1's claims lean on literatures already in `RETRACTIONS.md` as overturned
(ego depletion; the 3:1 positivity ratio) and are handled in section D, not cited.


## The seven things this gate settled

1. **Britton's numbers hold, with one correction and one that does not.** The one-in-ten
   functional-impairment figure is real (10.6%, Goldberg 2022). The 60%-of-them-were-teachers
   figure is real and was read verbatim from the open-access paper. The 5-15% clinical figure
   is a rounding of 6-14%. The claim that risk factors do not predict difficulty is **not**
   supported and Goldberg found the opposite for childhood adversity.
2. **The non-linear dose claim validates the library ten-minute sit, but not for the reason given.** The
   published finding is a *dose-proportional* increase in cortical arousal on polysomnography.
   There is no 30-minute threshold in either of Britton's two RCTs, and the dissertation she
   describes as unpublished is in fact those two papers.
3. **Haidt's 25-experiments claim is a living Google Doc, not a compilation.** His own
   published tally is 22 experiments and 16 positive. The only preregistered meta-analysis of
   social-media abstinence (N=4,674) is null on every outcome and null on dose. Gate 1's false-
   convergence call is upheld and the seam is exact: the attention literature supports the
   phone cards, the adolescent-mental-health literature does not.
4. **Behavioural activation is the round's best product finding.** Non-inferior to cognitive
   therapy (d=0.02 difference) across two independent meta-analyses, and its active ingredient
   is the one thing this app is structurally built to do: schedule the activity before the mood.
5. **The ten-minute meditation card should come down to C.** The brief dose the app actually ships measures
   g=0.21 across 65 RCTs with publication bias detected, and attenuates toward zero against an
   active control. The practice does not change; the grade and the copy do.
6. **The strongest single result in the round is not a mind practice.** Improving sleep moves
   depression, anxiety and rumination by roughly half a standard deviation with a dose-response
   (65 trials, N=8,608). That is the mind ladder's first rung and Gate 5 should open with it.
7. **Seven of eight new candidates ship with an empty or researcher-only attribution.** Nobody
   in 434 routed episodes covers behavioural activation, expressive writing, nature exposure or
   the abstinence nulls. That is the two-inlet design working.

---

## A. VERIFIED LEDGER

### A1 — Meditation adverse effects (Gate 1's top priority)

| practice | citation | DOI / PMID | design | n | key result with numbers | limitations / replication | grade of the PRACTICE | why not the grade above |
|---|---|---|---|---|---|---|---|---|
| **Tell the user, once and kindly, that meditation has adverse effects — and name the specific symptoms to watch for** | Goldberg SB, Lam SU, Britton WB, Davidson RJ. 2022. Prevalence of meditation-related adverse effects in a population-based sample in the United States. *Psychotherapy Research* 32(3):291–305 | 10.1080/10503307.2021.1933646 · PMID 34074221 · PMC8636531 | Population-based two-stage survey | 953 screened → 470 lifetime meditators → 434 completed the adverse-effect follow-up (92.3% response) | **32.3%** endorsed the general adverse-effect item; **50.0%** endorsed ≥1 specific item; **10.4%** had effects lasting ≥1 month; **10.6%** reported some degree of functional impairment; **1.2%** impairment lasting ≥1 month. Commonest: anxiety, traumatic re-experiencing, emotional sensitivity. **Childhood adversity associated with elevated risk.** Those reporting adverse effects were **equally glad** to have practised. | Cross-sectional, retrospective, self-report; no comparison activity, so the counterfactual rate for any reflective activity is unknown. Single study, not yet replicated in another population sample. | **B — as a disclosure practice** | Not A: one population survey, retrospective self-report, no control condition. Not C: the number is specific, the sample is population-based rather than a clinic, and the disclosure costs the user nothing. |
| **Same card — the clinical-trial counterpart** | Britton WB, Lindahl JR, Cooper DJ, Canby NK, Palitsky R. 2021. Defining and measuring meditation-related adverse effects in mindfulness-based programs. *Clinical Psychological Science* 9(6):1185–1204 | 10.1177/2167702621996340 · PMID 35174010 · PMC8845498 | Independent-assessor structured interview (44-item MedEx-I) inside three variants of an 8-week MBCT programme | **96** | **83%** reported ≥1 meditation-related side effect; **58%** one with negative valence; **37%** one with negative impact on functioning; **lasting bad effects in 6–14%**, associated with dysregulated arousal (hyperarousal, dissociation). Authors' framing: rates **similar to other psychological treatments**. | Small; one programme type; no non-meditation control arm, so causal attribution rests on the interview rather than randomisation. | **B (feeds the same card)** | Not A: n=96, single site, no control arm. |
| **Practise in a format you can stop or leave; alternate sitting with movement; titrate before a long retreat** | Lindahl JR, Fisher NE, Cooper DJ, Rosen RK, Britton WB. 2017. The varieties of contemplative experience. *PLOS ONE* 12(5):e0176239 | 10.1371/journal.pone.0176239 · PMID 28542181 · PMC5443484 · **open access** | Mixed methods: semi-structured interviews + follow-up questionnaire. **Purposive "deviant-case" sampling** — recruited *because* they had had difficulties | **60** practitioners (73 interviewed, 13 excluded) + **32** experts (11 overlapping) | 59 categories across 7 domains. **60% of practitioners identified as meditation teachers** (verbatim in Results). **43%** had >10,000 lifetime hours. **72%** of episodes began during or just after a retreat; **88%** bled into daily life. Median symptom duration **1–3 years** (days to >10 years); **73%** moderate-to-severe impairment in ≥1 domain; **17%** suicidality; **17%** inpatient hospitalisation. | **Cannot give a prevalence and the paper says so** — the 100% difficulty rate is a sampling artefact. Sample 94.5% White, 73% graduate/doctoral. The paper states plainly its influencing-factor list is **not** a risk-factor hypothesis. | **C — for the derived mitigations** | Not B: the mitigations are inferred from a qualitative, deliberately non-representative sample with no comparison group, and nobody has trialled "alternate sitting with walking" as protective. The *disclosure* earns B; the *mitigations* earn C. |

**Verdict on Gate 1's headline Britton numbers**

| Britton's on-air claim | Verdict | Which source confirmed which number |
|---|---|---|
| ~1 in 10 of everyone who has meditated reports an effect severe enough to impair functioning | **VERIFIED** | Goldberg 2022, Europe PMC record for 10.1080/10503307.2021.1933646: functional impairment **10.6%**. Honest refinement: that is *some degree of* impairment; impairment lasting ≥1 month is **1.2%**. A card should carry both numbers or neither. |
| 5–15% in a clinical sample | **PARTLY VERIFIED** | Britton 2021: **lasting bad effects 6–14%**. Her spoken 5–15% is a rounded restatement, not a separate finding. Use 6–14%. |
| 60% of those reporting difficulty were meditation teachers | **VERIFIED, verbatim** | PLOS ONE full text, Results / Sample characteristics — read from the open-access article, not the abstract. |
| The obvious risk factors (trauma, psychiatric history) did not predict who had difficulty | **UNVERIFIED — and partly contradicted** | VCE cannot test prediction (purposive sample, no comparison group) and warns its influencing-factor list is not a risk-factor hypothesis. **Goldberg 2022 found childhood adversity WAS associated with elevated risk.** Do not write "risk factors don't predict". Write the supported version: *most people who have difficulty are experienced practitioners, not fragile beginners* — which the 60%-teachers and 43%->10,000-hours figures do support. |
| Non-linear dose: under ~30 min/day improves sleep, above it produces cortical arousal | **PARTLY VERIFIED — direction yes, threshold no** | Britton WB, Haynes PL, Fridel KW, Bootzin RR. 2010. *Psychosomatic Medicine* 72(6):539–548, **10.1097/psy.0b013e3181dc1bad**, PMID 20467003. RCT, **n=26**, partially remitted depression, 8-week MBCT vs waitlist: practice was associated with **increased cortical arousal on polysomnography — more awakenings, more stage 1, less slow-wave sleep — in proportion to the amount of practice**, while *subjective* sleep and depression improved. Companion RCT (Britton et al. 2012, *Psychotherapy and Psychosomatics* 81(5):296–304, **10.1159/000332755**, PMID 22832540, **n=23** antidepressant users with sleep complaints) found improved continuity — less wake time, better efficiency — and **no change in sleep depth**. **No ~30-minute threshold appears in either paper.** Also: the dissertation *was* published — it is these two RCTs. |

**What this does to `meditation-10`.** It **validates the dose without validating the
stated reason.** The published finding is a *dose-proportional* arousal effect, so less
practice means less arousal, which favours a short sit — but the 30-minute inflection
point is an on-air simplification and must not be printed as a number. The honest line:
*arousal effects on sleep track how much you practise, so a short sit is the conservative
choice.* Grade unchanged at B; see section B for what does change.

### A2 — Haidt's "25 experiments, 16 causal" (Gate 1's highest-value target)

**What the claim actually is.** Haidt, Rausch and Twenge maintain a public,
living Google-Doc review (linked from jonathanhaidt.com/social-media and
anxiousgeneration.com/reviews) collecting studies on social media and adolescent
mental health. Its experiments tab is where the figure comes from. The published
statement of that tally is **22 experiments, 16 finding significant evidence of harm
(or of benefit from getting off social media for long enough)**. Haidt said "25" on
On Purpose. Because the document is a living count that grows, the denominator drifts
between his tellings while the numerator he quotes stays at 16.

**Verdict: PARTLY VERIFIED, and it is not a peer-reviewed compilation.** The
numerator/denominator he gave is not the pair his own published tally gives, the
tally is self-maintained by the thesis's proponents with no registered inclusion
criteria and no risk-of-bias assessment, and it is not indexed in Europe PMC or
Crossref because it is a Google Doc, not a paper. **A living document curated by the
side arguing the thesis is not a systematic review, and this library must not cite
it as one.** Gate 1 was right to call this a false convergence.

**Gate 1 also mis-stated one thing, and it needs correcting.** Haidt is not only a
compiler here. He is a co-author of a peer-reviewed specification-curve paper, so
the "Haidt versus Orben/Przybylski" framing is a genuine methodological argument in
the literature, not a populariser against scientists.

| paper | DOI | design | n | key result | status |
|---|---|---|---|---|---|
| Orben A, Przybylski AK. 2019. The association between adolescent well-being and digital technology use. *Nature Human Behaviour* 3(2):173–182 | 10.1038/s41562-018-0506-1 · PMID 30944443 | Specification curve analysis across three large social datasets | **355,358** | Association between digital technology use and adolescent well-being is **negative but small — at most 0.4% of the variance**. Authors: too small to warrant policy change. | Clean. 486 citations. |
| Twenge JM, **Haidt J**, Lozano J, Cummins KM. 2022. Specification curve analysis shows that social media use is linked to poor mental health, especially among girls. *Acta Psychologica* 224:103512 | 10.1016/j.actpsy.2022.103512 · PMID 35101738 | Re-analysis of the **same three datasets** with different specification constraints (social media separated from total screen time; sexes analysed separately; mediators excluded from controls; scales weighted equally) | same datasets | Reproduced the original result under the original configuration. Under the revised constraints, **among girls, median betas −0.11 to −0.24** for social media and mental health. | Clean. 73 citations. **Note it is a re-analysis of Orben and Przybylski's own data, not independent evidence.** |
| Odgers CL, Jensen MR. 2020. Annual Research Review: adolescent mental health in the digital age. *Journal of Child Psychology and Psychiatry* 61(3):336–348 | 10.1111/jcpp.13190 · PMID 31951670 | Narrative synthesis of reviews, preregistered cohorts and intensive longitudinal studies | — | Most research is correlational; a mix of small positive, negative and null associations. The most rigorous preregistered studies find associations **unlikely to be of clinical or practical significance** and unable to separate cause from effect. | Clean. 419 citations. |
| **Lemahieu L, Vander Zwalmen Y, Mennes M, Koster EHW, Vanden Abeele MMP, Poels K. 2025. The effects of social media abstinence on affective well-being and life satisfaction: a systematic review and meta-analysis. *Scientific Reports* 15(1)** | 10.1038/s41598-025-90984-3 · PMC11880199 · **open access, preregistered** | Systematic review + meta-analysis of abstinence experiments | **10 studies, N=4,674, 38 effect sizes** | **No significant effect** of social-media abstinence on positive affect, negative affect, or life satisfaction. **No relationship between abstinence duration and any outcome.** | Clean. The single most important paper for this library, because abstinence is the practice an app would actually schedule. |
| **Plackett R, Blyth A, Schartau P. 2023. The impact of social media use interventions on mental well-being: systematic review. *JMIR* 25:e44922** | 10.2196/44922 · PMC10457695 · **open access** | Systematic review (narrative synthesis, no meta-analysis), **adults only** | **23 studies** of 2,785 screened | 9/23 improved wellbeing, 7/23 mixed, 7/23 null. Broken down by type: **therapy-based (CBT) interventions 5/6 (83%) improved wellbeing; limiting social media use 1/5 (20%); full abstinence 3/12 (25%).** Depression the most-improved outcome (7/10). **Quality poor — 22/23 rated weak globally, 70% convenience samples of university students.** | Clean. |

**Practice-level conclusions, and the grades**

| practice | grade | why this grade and not the one above |
|---|---|---|
| **Reduce or abstain from social media in order to feel better (adult user)** | **D** | The only preregistered meta-analysis of the abstinence experiments (Lemahieu 2025, N=4,674) is **null on every outcome and null on dose**, and the adult systematic review finds abstinence the *least* effective of the three intervention types tested (3/12). The direction of the popular claim is not supported for adults. It is not E because the underlying observational association is real and small, several individual trials are positive, and the practice is free and harmless — but a library that graded this B or C would be reading a Google Doc as a meta-analysis. |
| **Change what the phone does rather than how long you hold it — kill the notification, park the device for a defined block** | **B (unchanged)** | This is a different literature: attention and interruption (Leroy; Kushlev), which the existing `notification-audit` card already cites, not the adolescent-mental-health literature. **Gate 1's "false convergence" call is correct and this is the seam.** Keep the two apart. |
| **Restrict a teenager's social media** | **not written** | Out of scope: this library's audience is adults, the evidence is contested at the level of what the effect even is, and Haidt himself says on air the harm claim is specific to early adolescence. Declined, with reasons, rather than written thin. |

**Attribution consequence.** Do not credit Haidt for an adult phone or social-media
card. His public position is about early adolescence, he is a party to a live
scientific dispute, and the tally he quotes is not a peer-reviewed compilation. If a
card ever ships in this territory it should carry the researchers on both sides or
nobody, and say the question is contested.

### A3 — The mind brief's core topics (mostly literature-inlet; podcast coverage zero or near-zero)

| practice | citation | DOI / PMID | design | n | key result with numbers | limitations / replication | grade of the PRACTICE | why not the grade above |
|---|---|---|---|---|---|---|---|---|
| **Behavioural activation — schedule one activity you value and do it whether or not the mood has arrived** | Ekers D, Webster L, Van Straten A, Cuijpers P, Richards D, Gilbody S. 2014. Behavioural activation for depression: an update of meta-analysis of effectiveness and subgroup analysis. *PLOS ONE* 9(6):e100100 · with Cuijpers P, van Straten A, Warmerdam L. 2007. Behavioral activation treatments of depression: a meta-analysis. *Clinical Psychology Review* 27(3):318–326 | 10.1371/journal.pone.0100100 (**OA**, 347 cites) · 10.1016/j.cpr.2006.11.001 (PMID 17184887, 618 cites) | Meta-analyses of RCTs | Ekers: **26 RCTs, 1,524 participants** (k=25, N=1,088 vs control; k=4, N=283 vs medication). Cuijpers: **16 studies, 780 participants** | Ekers: **SMD −0.74** (95% CI −0.91 to −0.56) vs controls; **−0.42** (−0.83 to −0.00) vs antidepressant medication. Cuijpers: **d = 0.87** (0.60–1.15) vs control; **d = 0.02** against cognitive therapy — equivalent to CT while being far simpler; gains held at follow-up. | Ekers states study quality was low in the majority of studies and follow-up periods short. All trials are of a **multi-session, therapist-guided protocol in clinically depressed samples**. There is no meta-analytic evidence for the single-scheduled-activity fragment in a non-depressed general population. | **B** | Not A: the meta-analytic effect belongs to a course of therapy, not to the one scheduled activity an app delivers, and Ekers himself flags low study quality. It moves up from the library's current C because the active ingredient — schedule the activity, act before the mood — is exactly what a scheduler can deliver, it replicates across two independent meta-analyses seven years apart, and it is non-inferior to cognitive therapy. |
| **Route to MBCT by name where someone has had recurrent depression** (a referral line, not a card) | Kuyken W, Warren FC, Taylor RS, Whalley B, Crane C, Bondolfi G, et al. 2016. Efficacy of mindfulness-based cognitive therapy in prevention of depressive relapse: an individual patient data meta-analysis. *JAMA Psychiatry* 73(6):565 | 10.1001/jamapsychiatry.2016.0076 · PMID 27119968 · PMC6640038 | **Individual-patient-data meta-analysis** of randomised trials | **9 studies, 1,258 patients** (mean age 47.1, 75% female) | Reduced risk of depressive relapse over 60 weeks: **HR 0.69** (0.58–0.82) vs no MBCT; **HR 0.79** (0.64–0.97) vs active treatments including antidepressants. Larger benefit where residual symptoms were more pronounced. | An 8-week clinician-led group programme. IPD meta-analysis is the strongest design in this whole round, but **this library cannot deliver it and must not imply it does.** | **not a card — a named clinical route** | The evidence would support an A-grade *treatment*. The library does not write treatment (README hard constraint). Naming MBCT and routing to a clinician is the correct use, and it closes Gate 1's gap that Zindel Segal is uncited anywhere in the library. |
| **Third-person / distanced self-talk before something stressful** | Kross E, Bruehlman-Senecal E, Park J, Burson A, Dougherty A, Shablack H, et al. 2014. Self-talk as a regulatory mechanism: how you do it matters. *Journal of Personality and Social Psychology* 106(2):304–324 | 10.1037/a0035173 · PMID 24467424 | Seven studies, lab-based social-stress paradigms (first impressions, public speaking) | **total N = 585** across 7 studies (~83 each) | Non-first-person self-talk improved performance as judged by objective raters, reduced distress, reduced maladaptive post-event processing, and shifted appraisal from threat toward challenge. An internal meta-analysis (study 6) found **no moderation by trait social anxiety**. | Single research group; lab stressors; single session; short horizon. No independent multi-lab replication located. Outcomes are proximal, not clinical. | **C** | Not B: seven studies from one lab averaging ~83 participants each, no independent replication, and the outcome is immediate lab distress rather than anything that persists. Not D because the internal replication across seven designs is real, the manipulation costs nothing, and the direction is consistent. **This is the brief's rumination gap, answered honestly.** |
| **Expressive writing (Pennebaker paradigm) for health outcomes** | Frisina PG, Borod JC, Lepore SJ. 2004. A meta-analysis of the effects of written emotional disclosure on the health outcomes of clinical populations. *Journal of Nervous and Mental Disease* 192(9):629–634 | 10.1097/01.nmd.0000138317.30764.63 · PMID 15348980 | Meta-analysis | **9 studies** | **d = 0.19** — small, in clinical populations. | Nine studies only; small, heterogeneous samples; the authors themselves call for proper RCTs. The paradigm's fame vastly exceeds this number. | **C** | The brief predicted the honest grade sits below its fame, and it does. Not B: one small, old meta-analysis at d=0.19. Not D: the effect is positive and significant, the practice is free, and it supports the library's existing writing cards rather than replacing them. |
| **Rumination-focused CBT** | Watkins ER, Mullan E, Wingrove J, Rimes K, Steiner H, Bathurst N, et al. 2011. Rumination-focused cognitive-behavioural therapy for residual depression: phase II randomised controlled trial. *British Journal of Psychiatry* 199(4):317–322 | 10.1192/bjp.bp.110.090282 · PMID 21778171 | Phase II RCT, TAU vs TAU plus up to 12 sessions | **42** | Improved residual symptoms and remission rates; effects mediated by change in rumination. | n=42, phase II, and the authors state plainly there was **no attentional control group**, so specific versus non-specific therapy effects cannot be separated. | **not a card — treatment** | Same reason as MBCT. Recorded so the coach knows rumination has a real treatment literature to point at rather than only a self-help trick. |
| **Compassion-based practice, evidenced independently of its inventors** | Kirby JN, Tellegen CL, Steindl SR. 2017. A meta-analysis of compassion-based interventions: current state of knowledge and future directions. *Behavior Therapy* 48(6):778–792 | 10.1016/j.beth.2017.06.003 · PMID 29029675 | Meta-analysis of RCTs | **21 RCTs, 1,285 participants** | Self-compassion **d = 0.70** (k=13), depression **d = 0.64** (k=9), anxiety **d = 0.49** (k=9), psychological distress **d = 0.47** (k=14), wellbeing **d = 0.51** (k=8), compassion for others **d = 0.55** (k=4). **Effects held when active-control comparisons were included.** Little sign of publication bias. | The authors' own caveat: the evidence base relies predominantly on **small sample sizes**. The trials test multi-week group programmes, not a single written exercise. | **B** | **This resolves Gate 1's partly-false-convergence flag on self-compassion.** Kirby, Tellegen and Steindl are independent of Neff and Germer, and the effect survives active controls, so the practice is not an artefact of its inventors evaluating their own programme. Not A: small samples throughout, and the tested unit is a programme rather than the single exercise this library would schedule. |
| **Gratitude practice** | Choi H, Cha Y, McCullough ME, Coles NA, Oishi S. 2025. A meta-analysis of the effectiveness of gratitude interventions on well-being across cultures. *PNAS* 122(28) | 10.1073/pnas.2425193122 · PMC12280877 · **OA, preregistered** | Preregistered meta-analysis | **145 papers, 163 samples, 727 effect sizes, 24,804 participants, 28 countries** | **Hedges' g = 0.19** (0.15–0.22) — small. Larger when the outcome was positive affect, when intervention types were combined, and in randomised designs. **Robust against publication bias and influential cases.** Significant between-country variation that no moderator explained. | Small effect; heterogeneous; most trials brief and in convenience samples. | **B** | The effect is small, but this is by far the best-powered evidence in the positive-psychology family — 24,804 participants, preregistered, publication-bias-robust. A small effect that survives that scrutiny earns a B. Not A: g=0.19 sits at the edge of what a person would notice, and the cross-cultural variation is unexplained. |
| **Best possible self writing** | Carrillo A, Rubio-Aparicio M, Molinari G, Enrique A, Sánchez-Meca J, Baños RM. 2019. Effects of the Best Possible Self intervention: a systematic review and meta-analysis. *PLOS ONE* 14(9):e0222386 | 10.1371/journal.pone.0222386 · **OA** | Meta-analysis | **29 studies in 26 articles, 2,909 participants** | Wellbeing **d+ = 0.325**, optimism **0.334**, positive affect **0.511**; small effects on negative affect and depressive symptoms. **BPS outperformed gratitude interventions on positive affect (0.326) and negative affect (0.485).** A trend suggested **shorter total practice time was more effective**, not longer. | Mostly brief single-session student studies; short follow-up; small effects at the clinical end. | **B** | Up from the library's current C. A dedicated meta-analysis of 29 studies at d+ 0.33–0.51 on the affect outcomes, beating gratitude head-to-head. Not A: self-reported affect over short horizons, with nothing showing durability past weeks. **Product note: the shorter-is-better trend supports keeping `best-possible-self` at 15 minutes rather than lengthening it.** |
| **Positive-psychology interventions as a class** — the ceiling for gratitude, BPS, kindness and values cards | Bolier L, Haverman M, Westerhof GJ, Riper H, Smit F, Bohlmeijer E. 2013. Positive psychology interventions: a meta-analysis of randomized controlled studies. *BMC Public Health* 13:119 | 10.1186/1471-2458-13-119 · **OA**, 776 cites | Meta-analysis of RCTs | **39 studies, 6,139 participants** | Subjective wellbeing **SMD 0.34**, psychological wellbeing **0.20**, depression **0.23**. Small but still significant at 3–6 month follow-up. | **Indications of publication bias were found and study quality varied considerably.** Effects were larger where study design was of *lower* quality — a warning the authors report themselves. | **ceiling-setter, not a card** | Use it to cap the family. No positive-psychology exercise in this library should be graded above B on its own literature, because the class effect is 0.20–0.34 with acknowledged publication bias. |
| **Slow or extended-exhale breathing for stress** | Fincham GW, Strauss C, Montero-Marin J, Cavanagh K. 2023. Effect of breathwork on stress and mental health: a meta-analysis of randomised controlled trials. *Scientific Reports* 13(1) | 10.1038/s41598-022-27247-y · **OA** | Meta-analysis of RCTs | Stress: **12 RCTs, 785 adults**; anxiety k=20; depression k=18 | Stress **g = −0.35** (−0.55 to −0.14); anxiety **g = −0.32**; depression **g = −0.40**. Heterogeneity I² = 42% on the primary outcome. | **Most studies at moderate risk of bias**, and the authors close by warning explicitly against a miscalibration between hype and evidence. | **B** | Confirms the existing B on `cyclic-sighing` rather than raising it. Not A: twelve trials, 785 people, moderate risk of bias throughout, and the authors themselves ask for restraint. |
| **A single defensible dose for breathing practice** | Zaccaro A, Piarulli A, Laurino M, Garbella E, Menicucci D, Neri B, Gemignani A. 2018. How breath-control can change your life: a systematic review on psycho-physiological correlates of slow breathing. *Frontiers in Human Neuroscience* 12:353 | 10.3389/fnhum.2018.00353 · **OA**, 417 cites | Systematic review, mechanistic | **15 articles** eligible from 2,461 screened | Slow breathing raises HRV and respiratory sinus arrhythmia, increases EEG alpha and decreases theta, and is associated with increased comfort, relaxation, vigour and alertness and reduced arousal, anxiety, anger and confusion. | **It does not answer the dose question, and Gate 1 expected it to.** Fifteen studies, no pooled effect, no dose–response, no minutes recommendation. | **mechanism only — sets no grade and no dose** | **Correction to Gate 1's plan:** nothing in this literature licenses one consistent dose across the library's breathing cards. Keep each card at the dose its own trial used, and say the dose is not settled. |
| **Time outdoors, counted weekly rather than per session** | White MP, Alcock I, Grellier J, Wheeler BW, Hartig T, Warber SL, Bone A, Depledge MH, Fleming LE. 2019. Spending at least 120 minutes a week in nature is associated with good health and wellbeing. *Scientific Reports* 9(1) | 10.1038/s41598-019-44097-3 · **OA**, 364 cites | Cross-sectional, nationally weighted survey | **19,806** | Versus no nature contact, **≥120 min/week** raised the odds of reporting good health (**OR 1.59**, 1.31–1.92 at 120–179 min) and high wellbeing (**OR 1.23**, 1.08–1.40). Peak at **200–300 min/week, then no further gain**. **It made no difference whether the 120 minutes came as one long visit or several short ones.** Consistent in older adults and people with long-term conditions. | **Cross-sectional and self-reported.** The authors say plainly that prospective and intervention studies are the critical next step. Causality is not established. | **C** | Not B: one cross-sectional survey, however large, cannot separate people who feel well going outside from going outside making people feel well. Not D: n≈20,000, nationally weighted, with a clean exposure–response shape and a plateau. **The product finding is the split-insensitivity — count outdoor minutes weekly, do not police the length of one session.** |
| **Worry postponement — a fixed slot to worry, instead of suppressing it in the moment** | Krzikalla C, Buhlmann U, Schug J, Kopei I, Gerlach AL, Doebler P, Melzig CA. 2024. Worry postponement from the metacognitive perspective: a randomized waitlist-controlled trial. *Clinical Psychology in Europe* 6(2) | 10.32872/cpe.12741 · **OA** | Randomised waitlist-controlled trial; two sessions, six days of practice | **47** with GAD + **35** with hypochondriasis | Significant Time×Group interaction on negative metacognitions and worry. The **only** significant post-hoc effect was lower worry in the treated GAD group versus waitlist; large pre-post effect on worry, small on metacognitions; held at four-week follow-up. **No significant effect in the hypochondriasis group.** | Small; waitlist control, so expectancy is uncontrolled; clinical samples rather than general adults. The paper also notes that **earlier worry-postponement work using the stimulus-control rationale did not support efficacy in GAD**, so the literature is genuinely mixed. | **C** | Not B: one small waitlist-controlled trial in a clinical sample, a mixed prior literature, and no test in the general adult population this library serves. Not D: the mechanism is specific, the trial is randomised, and the effect held to follow-up. |
| **Improve sleep in order to improve mental health** — the ladder claim, not a mind practice | Scott AJ, Webb TL, Martyn-St James M, Rowse G, Weich S. 2021. Improving sleep quality leads to better mental health: a meta-analysis of randomised controlled trials. *Sleep Medicine Reviews* 60:101556 | 10.1016/j.smrv.2021.101556 · **OA**, 691 cites | Meta-analysis of RCTs | **65 trials, 72 interventions, N = 8,608** | Composite mental health **g = −0.53**; depression **−0.63**; anxiety **−0.51**; **rumination −0.49**; stress −0.42; positive psychosis symptoms −0.26. **Dose–response: greater improvement in sleep produced greater improvement in mental health.** | Sleep interventions are heterogeneous and mostly CBT-I variants; outcomes self-reported. Still the cleanest causal test available. | **A — for the ordering claim only** | **The strongest single result in the round, and it is not a mind practice at all.** Improving sleep moves depression, anxiety **and rumination** by roughly half a standard deviation with a dose–response. Gate 5 should open the mind ladder with sleep, and the mind coach should say so before offering a meditation. The A attaches to the sequencing claim; no individual sleep protocol inherits it. |

### A4 — The honest ceiling on everything meditation-shaped

| practice | citation | DOI | design | n | key result | limitations | grade |
|---|---|---|---|---|---|---|---|
| **Any mindfulness-based intervention** | Goldberg SB, Riordan KM, Sun S, Davidson RJ. 2022. The empirical status of mindfulness-based interventions: a systematic review of 44 meta-analyses of randomized controlled trials. *Perspectives on Psychological Science* 17(1):108–130 | 10.1177/1745691620968771 | **Umbrella review of meta-analyses** | **44 meta-analyses, k = 336 RCTs, N = 30,483**, 160 effect sizes | Superior to **passive** controls across most populations and outcomes, **d = 0.10–0.89**. Against **active** controls the effects were **typically smaller and less often statistically significant**. Similar or superior to specific active controls and to evidence-based treatments. Moderate heterogeneity, few consistent moderators, generally robust to publication bias. **Reporting of adverse effects was inconsistent** and power may be lacking for active-control comparisons. | The d range is enormous and driven by which comparison and which outcome; the honest single number is "small against an active control". | **Sets the ceiling: no meditation card in this library goes above B.** |
| **The methodological warning that should sit under every mind card** | Van Dam NT, van Vugt MK, Vago DR, Schmalzl L, Saron CD, Olendzki A, Meissner T, Lazar SW, Kerr CE, Gorchov J, Fox KCR, Field BA, **Britton WB**, Brefczynski-Lewis JA, Meyer DE. 2018. Mind the hype: a critical evaluation and prescriptive agenda for research on mindfulness and meditation. *Perspectives on Psychological Science* 13(1):36–61 | 10.1177/1745691617709589 · PMID 29016274 · PMC5758421 | Critical review / position paper | — | Mindfulness is inconsistently defined, frequently mismeasured, and the public claims outrun the evidence; the authors' stated aim includes minimising harm and curbing misinformation. 559 citations. | A position paper, not a trial. It sets no effect size and therefore no grade. | **Anchors the copy, not the grade.** Note for the author-list rule: **Britton is an author here**, so she is a legitimate researcher credit on any card citing it. |

### A5 — Podcast claims checked at registry level (Gate 1 block 1 and 2)

Only the rows that change something are listed. Everything here was checked at Crossref
and, where a record existed, at Europe PMC or OpenAlex.

| Gate 1 claim | verdict | source and numbers |
|---|---|---|
| 6, 8, 119 — Neff on self-compassion raising motivation, the 7-day letter, self-compassion ≠ self-esteem | **VERIFIED at the level of the practice, via an independent route** | Kirby, Tellegen & Steindl 2017 (10.1016/j.beth.2017.06.003), 21 RCTs, N=1,285, self-compassion d=0.70, depression d=0.64, holding against active controls. Neff and Germer are not authors, which is what Gate 1's convergence flag required. |
| 10 — Germer's "backdraft" | **VERIFIED, and from an unexpected source** | Galante et al. 2014 (10.1037/a0037249), meta-analysis of 22 RCTs of kindness-based meditation, states in its own results that **exposure may initially be challenging for some people**. A clinical observation confirmed inside a meta-analysis is a strong footing for a safety line. |
| 11 — compassion for self and others rise together | **PARTLY VERIFIED** | Kirby 2017: compassion for others d=0.55 (k=4 only) alongside self-compassion d=0.70 (k=13). The "trait self-compassion alone does not predict compassion for others" half was not located and should not be printed. |
| 18, 122 — Goleman/Davidson: reliable beginner effects are calm and focus; the wandering-mind-is-the-rep line | **VERIFIED as a ceiling** | Goldberg et al. 2022 umbrella (10.1177/1745691620968771): 44 meta-analyses, 336 RCTs, N=30,483 — superior to passive controls d=0.10–0.89, **smaller and often nonsignificant against active controls**. Goleman's honest ceiling is the right one. Claim 122 is a teaching line with no study behind it; use it as copy, credit him, grade nothing on it. |
| 20 — meditation makes people more likely to help someone on crutches | **VERIFIED at registry** | Condon P, Desbordes G, Miller WT, DeSteno D. 2013. Meditation increases compassionate responses to suffering. *Psychological Science* 24(10):2125–2127, **10.1177/0956797613485603**, 137 citations. A three-page research report; Europe PMC and OpenAlex carry no abstract. **A single small lab study — it may be quoted as a nice finding, it may not carry a grade.** |
| 21 — the marshmallow test predicts life outcomes | **CONTRADICTED** | Watts TW, Duncan GJ, Quan H. 2018 (**10.1177/0956797618761661**): an extra minute of waiting at age 4 predicted ~0.1 SD in age-15 achievement — **half the original bivariate correlation, and reduced by two thirds** once family background, early cognitive ability and home environment were controlled; most of the variance came from waiting at least **20 seconds**. Behavioural outcomes at 15 were smaller and rarely significant. Confirmed again by a preregistered follow-up to age 26 (**10.1111/cdev.14129**, n=702): bivariate r=.17 for education and −.17 for BMI, **almost all regression-adjusted coefficients nonsignificant**. Goleman's on-air version also conflates Mischel's study with a New Zealand birth cohort. Do not repeat. |
| 23 — breathing pattern is emotion-specific (Philippot 2002) | **UNVERIFIED** | Not indexed in Europe PMC under any query tried. Low-n lab work in a specialist journal. Do not build on it. |
| 24, 25 — SKY breathing for veterans; SKY beating other interventions at Yale | **VERIFIED but far weaker than it sounds** | Seppala EM et al. 2014, *Journal of Traumatic Stress*, **10.1002/jts.21936**: **n=21 total — 11 active, 10 waitlist.** PTSD d=1.16 with a **95% CI of 0.20 to 2.04**, which is an interval consistent with almost anything. Waitlist control, unblinded, and the author is inside the tradition that teaches SKY. **Gate 1's conflict-of-interest flag is upheld. Not a card, and PTSD is clinical territory this library declines.** |
| 26 — the 90-minute caffeine delay | **UNVERIFIED, and no trial exists** | No randomised trial or systematic review of *delaying caffeine after waking* was located in Europe PMC under four query forms. The 90 minutes is an inference from the cortisol awakening response, not a tested protocol. The populariser concedes the same point on air. **Time back — see section D.** Cross-reference the recovery round; caffeine timing is a sleep-pillar item. |
| 27 — NSDR replenishes basal-ganglia dopamine | **holds at D** | Kjaer 2002, PET, n≈8. Confirms the library's existing D on `nsdr` is right rather than harsh. |
| 40 — 40–50% of daily behaviour is habitual | **VERIFIED at registry** | Wood W, Quinn JM, Kashy DA. 2002. Habits in everyday life: thought, emotion, and action. *JPSP* 83(6):1281, **10.1037/0022-3514.83.6.1281**, 204 citations. Experience-sampling, so it is a description of one student and community sample, not a law. Use "roughly two in five", never "43%". |
| 47 — willpower as the most important habit; ego depletion | **REFUTED — already in `RETRACTIONS.md`** | Two preregistered multi-lab replications: 23 labs N=2,141 d=0.04; 36 labs N=3,531 d=0.06. Not cited, not written. |
| 1, 2 — Brewer on the inverted-U for anxiety | **PARTLY VERIFIED** | No paper supports an inverted-U for *anxiety* and performance. The best-supported modern account runs the other way: Eysenck MW, Derakshan N, Santos R, Calvo MG. 2007. Anxiety and cognitive performance: attentional control theory. *Emotion* 7(2):336, **10.1037/1528-3542.7.2.336**, 2,420 citations — anxiety impairs processing efficiency. Brewer's direction is right; his citation-history story about the 1908 mouse study was not independently verified here and should not be retold as fact. |
| 82 — Adam Grant on imposter thoughts | **LOCATED — Gate 1's open trace is closed — but PARTLY VERIFIED** | Tewfik BA. 2022. The impostor phenomenon revisited: examining the relationship between workplace impostor thoughts and interpersonal effectiveness at work. *Academy of Management Journal* 65(3):988–1018, **10.5465/amj.2020.1627**. Sole author. Not retracted (OpenAlex `is_retracted: false`). **The finding is about interpersonal effectiveness via an other-focused orientation — not about task performance being unharmed.** Grant's on-air version reshapes it. Field studies in a management journal, not experiments. |
| 83 — the cynical-genius illusion | **VERIFIED** by Gate 1 at registry (Stavrova & Ehlebracht 2019, 10.1177/0146167218783195). Not re-opened. |
| 105–108 — Haidt on phones and adolescent mental health | see **A2** | |
| 110 — Suzuki: meditation produces plasticity in prefrontal attention networks | **UNVERIFIED as stated** | Van Dam et al. 2018 (10.1177/1745691617709589) is a fifteen-author critical review devoted in part to exactly this overreach in the imaging literature. **Do not print a neuroplasticity mechanism on any meditation card.** |
| 118 — seven minutes a day is enough | **UNVERIFIED, and asserted by the founder of the largest meditation company** | No source. Do not use. Britton's dose reasoning answers the question properly. |

---

## B. REGRADES to the existing mind cards

Six changes, three up and three down, plus five holds recorded with their reasons because
a hold that has been argued is worth as much as a change. Net effect on the pillar:
**A 1 · B 15 · C 18 · D 5 · E 1 → A 1 · B 16 · C 16 · D 6 · E 1.** A-plus-B moves from
40% to 42.5%, which is deliberately close to flat. This was a depth round, not an
inflation round.

### Upgrades

| card | now | proposed | evidence | reasoning |
|---|---|---|---|---|
| `one-small-act` | C | **B** | Ekers 2014, 26 RCTs N=1,524, SMD −0.74 vs control and −0.42 vs medication (10.1371/journal.pone.0100100); Cuijpers 2007, 16 studies N=780, d=0.87, and **d=0.02 against cognitive therapy** (10.1016/j.cpr.2006.11.001) | The card's own `why` already makes the honest argument — it takes the non-clinical core of behavioural activation and grades it for the use. What has changed is that the core is now shown to be **non-inferior to cognitive therapy** while being far simpler, across two independent meta-analyses seven years apart. That is "tested and it held up". It stays out of A because every trial is of a therapist-guided course in a depressed sample and Ekers reports low study quality. **This should become the most prominent card in the pillar** — the brief says so, and the evidence now says so too. |
| `best-possible-self` | C | **B** | Carrillo 2019, 29 studies, 2,909 participants: wellbeing d+=0.325, optimism 0.334, **positive affect 0.511**, and it **beat gratitude interventions head-to-head** on affect (10.1371/journal.pone.0222386) | The card was graded before a dedicated meta-analysis existed. One now does, with 29 studies and effects at the upper end of the positive-psychology range. Not A: self-reported affect, short follow-ups, nothing durable past weeks. **Keep 15 minutes** — the meta-analysis found a trend for *shorter* total practice being more effective, which is a rare case of the evidence endorsing the smaller version. |
| `gratitude-letter` | C | **B** | Choi 2025, PNAS, preregistered: **145 papers, 163 samples, 727 effect sizes, 24,804 participants, 28 countries, g=0.19, robust to publication bias** (10.1073/pnas.2425193122) | The card's `why` currently says "later meta-analyses land on small effects" and grades C on that basis. The effect is still small — but it is now small **and** measured across 24,804 people in a preregistered analysis that survived publication-bias correction. A small effect that survives that is a tested effect. Not A: g=0.19 is at the edge of noticeable, and unexplained cross-country variation means we cannot promise it for any given person. The Kumar undersociality half of the card's `why` stays as written; it is the more robust half and the card is right to say so. |

### Downgrades

| card | now | proposed | evidence | reasoning |
|---|---|---|---|---|
| `meditation-10` | B | **C** | Schumer, Lindsay & Creswell 2018, *JCCP* 86(7):569–583, **10.1037/ccp0000324**: 65 RCTs, **5,489 participants**, brief mindfulness (single session to two weeks), **g = 0.21, with publication bias detected**. Goldberg 2022 umbrella: effects against **active** controls are smaller and often nonsignificant. Dawson 2019, 51 RCTs (10.1111/aphw.12188): against active controls MBIs improve **only distress and state anxiety** | **This is the round's most important regrade.** The library grades the practice, and the practice here is a short sit — which is precisely what Schumer measured. g=0.21 with acknowledged unpublished nulls, attenuating toward zero against an active control, is "some evidence, not settled", not "tested and it held up". Nothing about the practice changes and nothing about the copy should get colder; it should get *more specific*. The current `why` — "the single most common daily practice among the high performers Ferriss has interviewed" — is an anecdote doing evidential work and must be replaced. |
| `evening-journal` | B | **C** | Choi 2025 gratitude g=0.19; Frisina 2004 written disclosure **d=0.19** in clinical populations (10.1097/01.nmd.0000138317.30764.63); Dawson 2019 found **no benefit for sleep** from mindfulness-based interventions | The card's `why` claims brief written gratitude and reflection "reliably improve mood **and sleep quality**". The mood half is a small effect; **the sleep half has no support and the nearest meta-analytic evidence is null.** Remove the sleep claim, keep the card — it is cheap, people like it, and the mood effect is real — and grade it for what it is. |
| `body-scan-sleep` | C | **D** | Gong 2016, *J Psychosom Res* 89:1–6, **10.1016/j.jpsychores.2016.07.016**: **6 RCTs, 330 participants**; on the overall analysis mindfulness meditation improved total wake time and sleep quality but had **no significant effect on sleep onset latency, total sleep time, wake after sleep onset, sleep efficiency, ISI, PSQI or DBAS**. Plus Dawson 2019 (no sleep benefit) and Britton 2010 (**dose-proportional increases in cortical arousal on polysomnography**, 10.1097/psy.0b013e3181dc1bad) | Three independent lines point the same way and one of them is objectively measured and in the wrong direction. Six trials and 330 people with most outcomes null is "early days". **The card stays** — it is pleasant, it is harmless, expectancy is a real mechanism and people report liking it — but it should not claim a sleep-onset benefit it does not have, and the honest grade is D. This is the regrade I would most like a second reader on. |

### Holds, argued

| card | grade | why it holds |
|---|---|---|
| `trigger-if-then` | **A holds** | The brief asked for a hard look at the pillar's only A. It survives, on **multiple independent meta-analyses in different domains**: Toli, Webb & Hardy 2016 (10.1111/bjc.12086) 29 studies N=1,636 d+=0.99 in clinical and analogue samples; mental contrasting with implementation intentions 2021 (10.3389/fpsyg.2021.565202) 21 studies **15,907 participants** g=0.336 with publication bias noted; substance-use reduction 2020 (10.1016/j.drugalcdep.2020.108120) 21 studies, alcohol g=0.31. Direction agrees everywhere; magnitude in the best-powered work is around g=0.3, not d=0.99. **A is right — "many studies agree" — but the copy should carry the modest number, not the large one.** |
| `loving-kindness` | **C holds** | Galante 2014 (10.1037/a0037249): 22 RCTs, depression g=−0.61, compassion 0.61, self-compassion 0.45 **against passive controls**; against **active** controls the results are explicitly inconclusive, methodological quality is low to moderate, and confidence intervals are wide because the studies are small. That is a textbook C, and the card's existing copy already says so honestly. |
| `open-monitoring` | **C holds** | Goldberg 2022 confirms open monitoring is the thinner half of the literature and rarely tested alone. The card already says this. **Its safety line is the best in the pillar and should be the template for the others.** |
| `nsdr` | **D holds** | Kjaer 2002 PET, n≈8. Confirmed by the populariser's own description. |
| `phone-parked` | **D holds** | Not because the evidence got worse but because the *rationale* was wrong. The attention case (Leroy; divided attention at encoding) supports it; the screen-time-and-wellbeing case does not — see A2. Same grade, different `why`. |
| `outdoor-reset` | **C holds, reshaped** | White 2019 (n=19,806) is cross-sectional so it cannot lift the grade, but it changes the shape: the threshold that matters is **≥120 minutes a week**, and **it made no difference whether that came as one long visit or several short ones**. The card should count toward a weekly total rather than defending a 15-minute block. |
| `cyclic-sighing` | **B holds** | Fincham 2023 (10.1038/s41598-022-27247-y): 12 RCTs, 785 adults, stress g=−0.35. Confirms B, does not lift it — the authors themselves warn against hype. Note that **Zaccaro 2018 does not supply a dose** and Gate 1's hope that it would should be corrected in `findings.md`. |

---

## C. NEW CARD CANDIDATES

**Eight, not fifteen.** The brief says this is a depth-and-honesty round and that fifteen
thin additions would make the library worse. Everything below has a meta-analysis or a
randomised trial behind it, a shape the scheduler can actually honour, and a reason to
exist that no current card covers. Gate 4 writes the `Protocol` objects; this is the
specification, not the object.

| # | practice | proposed grade | frequency | duration | anchor kind | `neverNag`? | safety line needed? |
|---|---|---|---|---|---|---|---|
| 1 | **The honest check on your own sitting** — once a month, five minutes reviewing how the practice is actually going against the specific things that can go wrong (more anxious than before, thoughts louder not quieter, feeling detached from yourself or the world, sleep getting worse, old material surfacing), with an explicit off-ramp | **B** | monthly | 5 min | `fixed`, daytime, wide window | **yes** | **yes — this card IS the safety line.** See section F for the required wording |
| 2 | **Worry window** — a fixed slot to worry on purpose; when a worry arrives outside it, note it and put it in the slot rather than arguing with it | **C** | daily, weekdays | 15 min | `fixed`, late afternoon or early evening, never within an hour of sleep | **yes** | **yes** — short. Not for panic or intrusive thoughts after trauma; those route to a clinician |
| 3 | **Say it about yourself, not to yourself** — two minutes before something that matters, describe the situation using your own name and "you" instead of "I" | **C** | as needed, and a standing weekday slot to build the habit | 2 min | `deadline` (before the event), fallback `fixed` morning | yes | no — but the copy must not promise it works on grief or on real threat |
| 4 | **The compassion break** — five minutes of deliberate, plain kindness toward yourself in the wording you would use for a friend, written or spoken | **B** | 3 days a week | 5 min | `fixed`, any time; pairs well after `one-small-act` | **yes** | **yes** — backdraft. Kindness toward yourself can surface the pain it is meant to soothe, and that is expected rather than a failure |
| 5 | **Two hours outside a week** — counted as a weekly total, in any combination | **C** | weekly target | 30–60 min per outing, 120 min per week | `fixed` weekend block, with weekday outings counting toward the same total | yes | sun sense only; the existing `outdoor-reset` line covers it |
| 6 | **Write the hard thing, three times, then stop** — three sessions in one week writing continuously about the thing that is sitting there, then deliberately finish | **C** | three sessions, once, not recurring | 15 min | `fixed` evening, but **not** within 90 min of sleep | **yes** | **yes — the strongest safety line of the eight.** Not for trauma someone is still inside. See section F |
| 7 | **Say the loss out loud to one person** — ask someone to listen to what it is actually like, rather than to console | **D** | fortnightly while it is needed, then stops | 30 min | `fixed`, weekend | **yes, emphatically** | **yes** — and the card carries **no attribution**; see section E |
| 8 | **Sleep first** — not a mind card at all: the mind coach's opening move when someone arrives with low mood, anxiety or rumination is to check whether sleep is the upstream problem | **A for the ordering claim** | — | — | — | — | This belongs in **Gate 5's ladder** and in the coach's knowledge base, not on a card of its own. Recorded here so it is not lost |

**Marginal, and I recommend declining it.** An "imposter thoughts are common and do not
wreck your work" card. Tewfik 2022 (10.5465/amj.2020.1627) is real, located, and not
retracted — but it is field-study management research about *interpersonal* effectiveness,
Grant's on-air version reshapes it, and there is no practice in it, only a reassurance.
If Gate 3 wants the reassurance it belongs in coach copy at **D**, not as a schedulable card.

### What I declined to write, and why

- **MBCT for depressive relapse.** The best evidence in this whole round (Kuyken 2016 IPD
  meta-analysis, 9 studies, 1,258 patients, HR 0.69) and the library must not deliver it.
  Name it, route to a clinician, and say plainly that this is the strongest thing in the
  category and it is not what the app is.
- **Rumination-focused CBT** (Watkins 2011). Same reason. Treatment.
- **SKY / breathing-based meditation for PTSD.** n=21 total, waitlist control, author
  inside the tradition, and PTSD is clinical. Declined on all three counts.
- **Social-media abstinence as a wellbeing practice.** The evidence is null; see A2 and D.
- **Anything about teenagers and phones.** Contested, out of audience, and the library
  would be taking a side in a live scientific dispute.
- **A reconsolidation protocol.** Gate 1 recorded Ranganath's own restraint on this and
  the restraint is the finding.
- **A dopamine-budget mechanism.** A model, not a measured quantity.
- **Psychedelics, in any form**, including the meditation interaction. The single
  interaction warning belongs in section F's safety text, said once, and nowhere else.
- **Any neuroplasticity claim on any meditation card.** Van Dam 2018 exists precisely
  because of that overreach.

---

## D. TIME BACK

Seven items against roughly thirty-five things this gate returned — about one in five,
which is the proportion the README asks for. All framed as a gift.

| what someone can stop | what the evidence actually says | what they get back |
|---|---|---|
| **Waiting ninety minutes for the first coffee** | **No randomised trial and no systematic review of delaying caffeine after waking exists** — four Europe PMC query forms returned nothing. The ninety minutes is an inference from the cortisol awakening curve, never a tested protocol, and **the populariser who made it famous says on air that a review found no evidence for it and that he still recommends it anyway.** | Ninety normal minutes of your own morning, for anyone who does not actually get an afternoon crash. Cross-reference the recovery round: caffeine *within about eight hours of bed* is the claim that does have evidence. |
| **Repeating positive affirmations, if you are someone who needs them** | Wood JV, Perunovic WQE, Lee JW. 2009. Positive self-statements: power for some, peril for others. *Psychological Science*, **10.1111/j.1467-9280.2009.02370.x**. People with **low** self-esteem who repeated a positive self-statement, or focused on how it was true, **felt worse** than those who did not. People with high self-esteem felt better, but only slightly. | The daily embarrassment of saying something to a mirror that you do not believe — and the small dose of feeling worse that came with it. The library's own `values-writing` (B) does the job the affirmation was meant to do, and it works by a different route. |
| **Rationing willpower** — saving decisions, avoiding "depleting" tasks, treating discipline as a tank | Already in `RETRACTIONS.md` as overturned: two preregistered multi-lab replications, **23 labs N=2,141 d=0.04** and **36 labs N=3,531 d=0.06** with the paradigm chosen by the theory's own proponents. | The energy spent on the budgeting. Environment and cue design do the same job and need no discipline — which is what `cue-audit`, `launch-pad` and `trigger-if-then` already are. |
| **Growth-mindset self-talk as a general performance lever** | Macnamara BN, Burgoyne AP. 2023. *Psychological Bulletin* 149(3–4):133–173, **10.1037/bul0000352**: **63 studies, N=97,672, d=0.05**, and **nonsignificant after correcting for publication bias**; the 6 highest-quality studies (N=13,571) give **d=0.02, CI −0.06 to 0.10**; authors with a financial incentive published significantly larger effects. The companion meta-analysis in the same issue (Burnette et al. 2023, **10.1037/bul0000368**, 53 samples) finds **d=0.14 for achievement and d=0.32 for mental health in targeted subsamples with high implementation fidelity**, with 95% prediction intervals that include zero. | The effort. **Say it kindly and say the second half too**: there may be something real for specific people in specific circumstances, but as a general lever it is close to nothing, and the minutes are better spent on the practices in this pillar that are not close to nothing. (Note for the skill round: Gate 1 attributed 10.1037/bul0000368 to Macnamara and Burgoyne. **It is Burnette, Billingsley, Banks, Knouse, Hoyt et al.** Macnamara and Burgoyne are 10.1037/bul0000352. Two different papers, same issue, opposite conclusions — the author-list rule catches this.) |
| **Quitting social media in order to feel better** (adults) | Lemahieu et al. 2025, *Scientific Reports*, **10.1038/s41598-025-90984-3**: preregistered meta-analysis, **10 studies, N=4,674, 38 effect sizes — no significant effect on positive affect, negative affect or life satisfaction, and no relationship with how long the abstinence lasted.** Plackett 2023, **10.2196/44922**, 23 adult studies: full abstinence improved wellbeing in **3 of 12** studies and limiting use in **1 of 5**, while therapy-based approaches improved it in **5 of 6**. | The detox weekend, and the guilt when it does not stick. **Keep the version that does work**: kill the notification, park the device for a defined block of work. That is a different literature and the library already grades it B. |
| **Working out the right amount of nerves before something that matters** | No paper supports an inverted-U between anxiety and performance in humans. The best-supported account runs monotonically the other way — Eysenck et al. 2007 attentional control theory, **10.1037/1528-3542.7.2.336**, 2,420 citations: anxiety degrades processing efficiency. | Permission to simply try to be less anxious, instead of managing toward an optimum that does not exist. **This sharpens `stress-reappraisal` rather than contradicting it** — relabelling arousal as readiness is still supported; hunting for the perfect level of nerves is not. |
| **Believing a childhood test decided how disciplined you are** | Watts, Duncan & Quan 2018, **10.1177/0956797618761661**: the correlation was half the original size and dropped by two thirds with controls; most of the variance came from waiting **20 seconds**. A preregistered follow-up to age 26 (**10.1111/cdev.14129**, n=702) found almost all regression-adjusted coefficients nonsignificant. | The story about yourself. It was never a prophecy, and the library's whole habits cluster is built on the opposite premise: the cue and the environment do the work, not the trait. |

---

## E. ATTRIBUTION

The author-list rule from `METHOD.md` applied to every candidate: a **RESEARCHER** credit
requires that person on the author list of a source in that card's own `sources.md` row,
verified at Crossref. A **TRACED** credit requires the specific episode Gate 1 opened.
Where nobody qualifies, the line is **empty**, and that is the correct outcome, not a gap.

| card / candidate | credit | verdict | the evidence that makes it real |
|---|---|---|---|
| #1 The honest check on your own sitting | **Willoughby Britton** | **TRACED + RESEARCHER (both)** | Populariser: Tim Ferriss Show #705, tim.blog/2023/11/23/dr-willoughby-britton-transcript/ — 21,201 words, the whole episode is this practice. Researcher: she is on the author list of **all five** sources this card would cite — 10.1371/journal.pone.0176239, 10.1080/10503307.2021.1933646, 10.1177/2167702621996340, 10.1097/psy.0b013e3181dc1bad, 10.1177/1745691617709589. This is the strongest single credit produced by either of the two gates. |
| #1, second name | **Simon Goldberg** | **RESEARCHER** | Author on 10.1080/10503307.2021.1933646 (the 10.6% figure) and on 10.1177/1745691620968771 (the 44-meta-analysis umbrella). **No podcast presence anywhere in the 434 routed rows** — a researcher-only credit, correctly labelled. |
| #1, third name if wanted | **Richard Davidson** | **RESEARCHER** | Author on both Goldberg papers. He also appears as a populariser via Goleman's 10% Happier #307, but only for the ceiling claim, not for adverse effects. Credit him as a researcher here. |
| #2 Worry window | **Nir Eyal** | **TRACED** | Diary of a CEO Moment 197 — he teaches scheduled worry time and rates it his top technique. |
| #2, researcher name | — | **EMPTY** | Krzikalla et al. 2024 is a German clinical-trial group with no public profile in this corpus. Adding a name nobody recognises buys nothing; the credit line carries Eyal alone. |
| #3 Say it about yourself, not to yourself | **Ethan Kross** (researcher) + **Charan Ranganath** (populariser) | **RESEARCHER + TRACED** | Kross is first author on 10.1037/a0035173, which is the card's only source — the author-list rule is satisfied exactly. Ranganath teaches it on Feel Better Live More #444, citing Kross by name. |
| #4 The compassion break | **Kristin Neff** and **Chris Germer** | **TRACED** | 10% Happier, /kryptonite-for-the-inner-critic-kristin-neff and #310 /310-the-scientific-case-for-self-compassion-chris-germer. **They must not also be given researcher credit on this card**: neither is on the author list of Kirby 2017 or Galante 2014, which are the sources that actually carry the grade. Populariser credit only. |
| #4, researcher name | **James Kirby** | **RESEARCHER** | First author of 10.1016/j.beth.2017.06.003, the meta-analysis independent of the programme's inventors — which is precisely why this card can be graded B. |
| #5 Two hours outside a week | **Mathew White** | **RESEARCHER** | First author of 10.1038/s41598-019-44097-3, the source of the 120-minute figure. |
| #5, populariser | — | **EMPTY** | Nature exposure returned **zero episodes** in the routed corpus. The existing `outdoor-reset` credits Marc Berman and Stephen Kaplan, which are attention-restoration researcher credits and stay, provided their papers stay in that card's sources row. |
| #6 Write the hard thing, three times, then stop | **James Pennebaker** | **RESEARCHER — conditional** | The brief names him and he is the paradigm's originator, but **he is not an author of Frisina 2004** (Frisina, Borod, Lepore), which is the card's grading source. Under the author-list rule the credit **fails unless a Pennebaker paper goes into the sources row**. Gate 4 must either add one or drop the name. Do not credit him by association with the paradigm. |
| #6, populariser | — | **EMPTY** | Expressive writing returned **zero episodes** in the routed corpus. |
| #7 Say the loss out loud to one person | — | **EMPTY, deliberately** | The practice traces to **David Kessler** (Mel Robbins, /what-nobody-tells-you-about-grief-and-loss) and it is a good practice. But Kessler is the co-author who extended the Kübler-Ross stage model, and **the library already names the five stages as unsupported**. Crediting him would put the name most associated with the model the library contradicts on a grief card, in front of the half of the audience that knows the lineage. **Use the practice, leave the line empty, and say why in `findings.md`.** Gate 1 recommended this and the evidence supports it: Hewson et al. 2023 (10.1080/07481187.2023.2223593), a systematic review of **79 studies**, concludes the literature **still cannot confirm whether retaining or relinquishing bonds is helpful**. There is no stage sequence to credit anyone for. |
| `one-small-act` (regraded to B) | **Neil Jacobson** | **RESEARCHER — currently failing, easily fixed** | Jacobson is **not** on Ekers 2014 or Cuijpers 2007. He is first author of the study that isolated the active ingredient: **Jacobson NS, Dobson KS, Truax PA, Addis ME, Koerner K, Gollan JK. 1996. A component analysis of cognitive-behavioral treatment for depression. *JCCP* 64(2):295–304, 10.1037/0022-006x.64.2.295**, 306 citations. **Add that paper to the card's sources row and the credit becomes legitimate.** Without it, it comes off. |
| `one-small-act`, second name | **David Richards** | **RESEARCHER — passes** | Richards D is on the author list of 10.1371/journal.pone.0100100. Verified at Crossref. |
| `one-small-act`, third name worth adding | **Sona Dimidjian** | **RESEARCHER — passes if her trial is cited** | **Dimidjian S, Hollon SD, Dobson KS, Schmaling KB, Kohlenberg RJ, Addis ME, et al. 2006. Randomized trial of behavioral activation, cognitive therapy, and antidepressant medication in the acute treatment of adults with major depression. *JCCP* 74(4):658–670, 10.1037/0022-006x.74.4.658.** The brief names her by name and she has **zero episodes** in the corpus. This is inlet 2 working exactly as `PIPELINE.md` describes. |
| `gratitude-letter` (regraded to B) | **Martin Seligman**, **Amit Kumar** | **RESEARCHER — conditional** | Neither is on Choi 2025. The card's `why` already describes Seligman's gratitude-visit trial and Kumar's undersociality work, so **both credits survive only while those two papers stay in the sources row alongside the PNAS meta-analysis.** Flagged so the regrade does not accidentally break the attribution. |
| `best-possible-self` (regraded to B) | **Laura King**, **Gabriele Oettingen** | **RESEARCHER — conditional, same pattern** | Neither is on Carrillo 2019. King's originating study and an Oettingen mental-contrasting paper must stay in the sources row. |
| `meditation-10` (regraded to C) | **Tim Ferriss**, **Andrew Huberman** | **TRACED (adjacent)** | Both teach a daily sit in public and Gate 1 opened episodes for both. Neither is a researcher here and neither should be. **The `why` must stop resting on "the most common practice among the high performers Ferriss has interviewed"** — that is an anecdote carrying an evidence claim. Keep the names, change the sentence. |
| `evening-journal` (regraded to C) | **Tim Ferriss**, **Jordan Peterson**, **Andrew Huberman** | **TRACED (adjacent) — and see F** | Gate 1 confirms **no Peterson episode appears anywhere in the 434 routed mind/skill rows.** He is not a sole credit here so the roster rule is satisfied, but this credit is the weakest of the three and nothing in this round strengthens it. |
| `phone-parked` | add **Charan Ranganath** | **TRACED — a missing credit** | School of Greatness, /1-memory-expert-the-no. He teaches divided attention at encoding, which is the card's *correct* rationale — better sourced than the current Newport/Ferriss framing, and it keeps the card away from the social-media-and-wellbeing literature that does not support it. |
| `trigger-if-then` (A holds) | **Peter Gollwitzer**, **Paschal Sheeran** | **RESEARCHER — verify against whichever meta the sources row cites** | Neither is on the three meta-analyses this gate opened (Toli/Webb/Hardy; the MCII meta; the substance-use meta). The credit is safe only while Gollwitzer & Sheeran 2006 stays in the sources row. Standard for this card, recorded so a future re-source does not silently break it. |
| Anything on adult phone or social-media use | **Jonathan Haidt** | **DO NOT CREDIT** | His public position concerns early adolescence; the tally he quotes is a self-maintained Google Doc, not a peer-reviewed compilation; and he is a party to a live methodological dispute (he is a co-author of 10.1016/j.actpsy.2022.103512, which re-analyses Orben and Przybylski's own data). Crediting him would take a side. |

**Credits this round confirms should NOT be added, having searched properly.** Behavioural
activation, expressive writing, worry postponement's actual literature, nature exposure,
the meditation-adverse-effects literature beyond Britton herself, gratitude's modern
meta-analysis, and the social-media abstinence nulls **all have no communicator in this
corpus**. Seven of the eight new candidates ship with an empty or researcher-only line.
That is the two-inlet design working, and `findings.md` should say so rather than
apologise for it.

---

## F. SAFETY

The mind pillar carries real risk and this gate found more of it than expected. Four
things need a clinical route, and one of them needs to move out of the card layer
altogether.

### F1 — Meditation adverse effects: what the safety line must contain

The library's current lines are not adequate. `meditation-10` says only *"Non-clinical;
no therapeutic claims"* — that is a lawyer's sentence, not a coach's, and it is on the
pillar's most-used card. `open-monitoring` already has the right shape and should be the
template.

The note must, on the evidence verified above:

1. **Give the real number, and both halves of it.** About **one in ten** people who have
   ever meditated report an effect that impaired functioning to some degree; for about
   **one in a hundred** that impairment lasted a month or more (Goldberg 2022). In an
   8-week programme, **6–14%** had a lasting bad effect (Britton 2021). Say both, or say
   neither — the first number alone reads as far more alarming than the data are.
2. **Say the reassuring part in the same breath, because it is also true.** People who
   reported adverse effects were **equally glad to have practised** (Goldberg 2022), and
   the rates are **similar to those of other psychological treatments** (Britton 2021).
   That is the sentence that stops the note frightening people off a practice that helps.
3. **Never phrase it as user error.** **60% of the people in the Varieties study who
   reported difficulty were meditation teachers themselves**, and 43% had more than
   10,000 lifetime practice hours. "You must be doing it wrong" is not available.
4. **Name the specific symptoms**, not "if it feels worse": more anxiety rather than less;
   old or traumatic material resurfacing; thoughts becoming more frequent rather than
   fewer; difficulty with everyday executive tasks; feeling detached from yourself or from
   the world; words or concepts losing their meaning; sleep getting worse. These are the
   categories the Varieties taxonomy actually produced.
5. **Guarantee the off-ramp, in the player and not only on the card.** "You may stop at
   any time, and stopping is not failing" belongs in the guided-session UI itself. This is
   the one recommendation in this document that is a product change rather than a copy
   change, and it is the one I would prioritise.
6. **Do not screen people out — monitor instead.** Goldberg 2022 found childhood adversity
   associated with elevated risk, so the risk is not uniform; but the Varieties sample was
   experienced practitioners, so it is not concentrated in beginners either. Monitoring
   with an off-ramp is the defensible design. **Do not write "risk factors don't predict
   who has difficulty"** — that is Gate 1's one unverified Britton claim and Goldberg
   contradicts it.
7. **Say it once, kindly, and mean it.** The brief is explicit: said once, not as a
   disclaimer on every session. Candidate card #1 is where it lives.
8. **One line, once, on compounds.** Combining psychedelics with intensive meditation is a
   common presentation in Britton's clinical caseload. The library does not write
   compounds; it can say once that the combination is where trouble concentrates, and
   then never again.

### F2 — Retreats

Britton's concrete, checkable advice survives verification as a *derived* practice at C:
**72% of the difficulties in the Varieties study began during or immediately after a
retreat.** The safe version the library may say: try an afternoon or a single day at home
before committing to a residential retreat; prefer formats that alternate sitting with
walking or movement; and treat "you may not leave" as a reason to choose a different
retreat. Frame it as how to choose well, never as a warning about meditation itself.

### F3 — Where a clinical route is mandatory

| trigger | route | why this round makes it firmer |
|---|---|---|
| **Suicidality or self-harm** | Immediate crisis routing, named Australian services in copy. `one-small-act` already carries this and its wording is good. | **17% of the Varieties sample reported suicidality and 17% required inpatient hospitalisation.** That is a selected sample and cannot give a rate — but it establishes that the severe end of this category is genuinely severe. |
| **Depression that has not lifted for weeks, or recurrent depression** | Name **MBCT** and route to a clinician. | Kuyken 2016, IPD meta-analysis, 9 studies, 1,258 patients, **HR 0.69** for relapse over 60 weeks. This is the strongest treatment evidence in the round and the library must point at it rather than imitate it. |
| **Trauma resurfacing during a practice** | Stop the practice, route to a therapist. | Traumatic re-experiencing was among the **three commonest** adverse effects in Goldberg 2022, and childhood adversity raised risk. This is not a rare edge case. |
| **Psychosis-adjacent experiences** — loss of sense of self, perceptual changes, beliefs that concern the people around them | Stop, route to a doctor. | These are explicit domains in the Varieties taxonomy, and the paper discusses the differential-diagnosis problem directly. |
| **Panic, or fear that is steering choices** | Already correctly routed on `stress-reappraisal`. Unchanged. | — |
| **Grief that is not moving** | Route to a clinician; do not imply a required path. | Hewson 2023, 79 studies: the field **cannot confirm** whether holding on or letting go is better. The honest coach line is that there is no schedule and no correct sequence — which is also the library's existing position on the five stages, now with a citation. |

### F4 — Two safety lines that need writing before their cards ship

- **Candidate #6, expressive writing.** Three sessions and then stop is part of the safety
  design, not a scheduling convenience: the paradigm produces short-term distress by
  design, and an open-ended recurring version invites rumination. The line must say that
  it is for something that has settled rather than something someone is still inside, that
  feeling worse for an hour afterwards is expected, and that it is not for trauma. It must
  also not sit within 90 minutes of sleep.
- **Candidate #4, the compassion break.** Backdraft is real enough to appear in a
  meta-analysis — Galante 2014 states in its results that kindness-based practice **may
  initially be challenging for some people**. The line should say that kindness toward
  yourself can bring up the pain it is meant to soothe, that this is expected rather than
  a sign of doing it wrong, and that stopping there is a fine outcome.

### F5 — Breathwork

The brief warns about hyperventilation and breath holds. **Nothing in this round proposes
either**, and nothing should: Fincham 2023 covers slow-breathing and mixed protocols at
g=−0.35 and Zaccaro 2018 supplies mechanism for *slow* breathing only. The existing
`cyclic-sighing` (extended exhale) is the right shape, stays at B, and needs no new
contraindication. If any future round proposes a hold or a hyperventilation protocol, the
in-water contraindication must be written before the protocol is.

---

## Coverage note — what this gate opened

**48 papers opened at registry level and, where a record existed, at abstract level**,
across Crossref, Europe PMC and OpenAlex, plus one open-access full text read in the
browser-free chain (the Varieties of Contemplative Experience article at PLOS, from which
the 60%-teachers figure was read verbatim in the Results section rather than inferred from
the abstract).

**Retraction check: all clean.** No paper in this ledger returned a `DO_NOT_CITE` flag,
carried a retraction prefix in its Crossref title, or showed `is_retracted: true` at
OpenAlex. One paper — the Cochrane review of behavioural activation in non-communicable
disease, 10.1002/14651858.cd013461.pub2 — returns a **`new_version`** relation. That is a
superseded Cochrane edition, **not** a retraction; it is not cited above, and a later round
should pick up the current version rather than this one.

**Two Gate 1 traces closed:** Basima Tewfik's impostor paper (10.5465/amj.2020.1627, found
at Crossref exactly where Gate 1 predicted, outside Europe PMC), and Britton's
"unpublished" dissertation, which turns out to be published as two randomised trials
(10.1097/psy.0b013e3181dc1bad and 10.1159/000332755).

**One Gate 1 error corrected:** doi:10.1037/bul0000368 is Burnette et al., not Macnamara
and Burgoyne. Macnamara and Burgoyne 2023 is doi:10.1037/bul0000352, and the two papers
reach opposite conclusions in the same issue of *Psychological Bulletin*. The skill round
needs to know this.
