# Gate 2 — literature verification and grading: the SKILL pillar

Run 8 September 2026. Input: `gate1_mind_skill.md` (SKILL rows of its 126 traced
claims, its skill literature-only candidates, and its convergence table).
Method: `output/corpus/METHOD.md` pass one, `SOURCES.md` verification chain,
`RETRACTIONS.md` read before citing.

**This gate grades the practice, never the paper and never the speaker.** A
meta-analysis of 300 experiments does not make an A card unless the thing on
the card is the thing those experiments manipulated.

## How the verification was done, per paper

1. `harvest.js crossref <doi>` — registry record, author list (the METHOD
   author-list rule for researcher credits), and the retraction check. Per
   `RETRACTIONS.md` the `relation` field is unreliable, so the tool's title-prefix
   check and `DO_NOT_CITE` flag were used as the real signal.
2. `harvest.js abstract <doi>` — Europe PMC first, OpenAlex fallback for the APA
   journals (Psychological Bulletin, Journal of Educational Psychology and the
   rest elide abstracts from Crossref and Europe PMC). OpenAlex's `is_retracted`
   boolean read as the third signal.
3. Where the abstract did not state design, k or n, the number was chased to the
   paper's own reporting and the row says which source produced which figure.

Every row below is marked **VERIFIED** (design, k/n and the headline number all
confirmed at a named source), **PARTLY VERIFIED** (record and design confirmed,
one or more numbers not confirmable at registry or abstract level), or
**UNVERIFIED**.

## The headline, before the detail

The brief says this is "the best-evidenced pillar in the library relative to its
size" and that retrieval practice and spaced review were graded **up** to A. It
asked for the working to be shown rather than assumed.

**Both A grades survive, and they survive for different reasons.**
`blank-page-recall` survives cleanly — free recall with feedback is literally
the manipulation in Roediger & Karpicke's experiments and in the two big
meta-analyses. `spaced-review` survives on a narrower basis than its copy
currently claims, and the copy needs one fix: the card implies the gap size does
not matter, and the strongest single finding in the spacing literature is that
it does.

The regrade pressure in this pillar is not on the A grades at all. It is on
**`ship-monthly`, which is built on a paper retracted on 2 September 2026** and
carries the retracted author's name in its attribution line. That is the single
most urgent finding in this round.

---

# A. VERIFIED LEDGER

## A1 — Retrieval practice / the testing effect

### `blank-page-recall` — end the session by writing what you remember, then check it

| | |
|---|---|
| **Citation** | Roediger HL, Karpicke JD. 2006. Test-enhanced learning: taking memory tests improves long-term retention. *Psychological Science* 17(3):249–255 |
| **DOI / PMID** | 10.1111/j.1467-9280.2006.01693.x · PMID 16507066 |
| **Design** | Two within/between experiments, students, prose passages; repeated **free recall** without feedback vs repeated restudy, final test at 5 min, 2 days or 1 week |
| **n** | Not stated in the abstract — **PARTLY VERIFIED** on n (the classic figures are 120 and 180 students; neither is confirmable at Crossref or Europe PMC record level) |
| **Key result** | At 5 minutes, restudy beat testing. At 2 days and 1 week, prior testing produced substantially greater retention — and the restudy group was **more confident** they would remember. The crossover is the finding |
| **Retraction** | Crossref `retraction_or_update: none`; no title prefix; OpenAlex clean. **Clean.** |

Supporting meta-analyses, both checked at record level:

| Paper | DOI | Design | k / n | Result |
|---|---|---|---|---|
| Rowland CA 2014, *Psychological Bulletin* 140(6):1432–1463 | 10.1037/a0037559 | Meta-analysis, testing vs restudy | 358 citations; k not stated in abstract — **PARTLY VERIFIED** | Effortful processing is the moderator: **initial recall tests yield larger benefits than recognition tests**. Directly supports the blank page over multiple choice |
| Adesope O, Trevisan D, Sundararajan N 2017, *Review of Educational Research* 87(3):659–701 | 10.3102/0034654316689306 | Meta-analysis, practice testing vs all non-testing controls | 548 citations; k not in abstract — **PARTLY VERIFIED** | Practice tests beat restudy **and** beat every other comparison condition tested. Moderated by test format, participants, outcome construct |
| Dunlosky J, Rawson KA, Marsh EJ, Nathan MJ, Willingham DT 2013, *PSPI* 14(1):4–58 | 10.1177/1529100612453266 | Structured utility review of 10 techniques against 4 generalisability criteria | — | **Practice testing = high utility**, one of only two of the ten. **VERIFIED** from the abstract's own ranking |

**The honest limit, verified:**

| | |
|---|---|
| **Citation** | Pan SC, Rickard TC. 2018. Transfer of test-enhanced learning: meta-analytic review and synthesis. *Psychological Bulletin* 144(7):710–756 |
| **DOI / PMID** | 10.1037/bul0000151 · PMID 29733621 |
| **Design** | Meta-analysis of transfer effects, published and unpublished |
| **k / n** | **192 transfer effect sizes, 122 experiments, 67 articles, N = 10,382** — **VERIFIED**, all four figures stated in the Europe PMC abstract |
| **Key result** | Transfer relative to a non-testing re-exposure control **d = 0.40, 95% CI [0.31, 0.50]**. Strongest across test formats, to application and inference questions, to medical diagnosis problems. Weakest to rearranged stimulus–response items and to untested material merely seen during study. **Under PET-PEESE and selection-method bias correction the intercept dropped substantially, often indicating no positive transfer when none of the moderators is present** |
| **Retraction** | Clean at Crossref and OpenAlex |

**GRADE OF THE PRACTICE: A — confirmed, stands.**

Why A and not B: the practice on the card *is* the manipulation. Free recall of
studied material, at a delay, with feedback, against restudy of the same
material, is what Roediger & Karpicke did and what Rowland and Adesope pooled.
The card's two design choices — recall rather than recognition, and checking
afterwards — are both specifically supported rather than merely adjacent
(Rowland: recall > recognition; the feedback literature: recall without feedback
preserves errors). Dunlosky independently ranks it high-utility on
generalisability criteria the card actually meets. Hundreds of experiments, real
classrooms as well as labs, and the effect grows with delay.

Why not a caveat-driven downgrade on Pan & Rickard: transfer is a *different
claim* from retention, and this card only claims retention. Pan & Rickard's
bias-corrected intercept is a warning against writing "practice testing makes
you better at things you did not practise", which the card does not say.

**Copy fix required (not a regrade):** the card says "the gap widens the longer
you wait", which is right, and "meta-analyses covering hundreds of experiments",
which is right. Nothing to change. **One addition:** the card should not be
extended toward transfer claims in Gate 4, and `sources.md` should carry Pan &
Rickard as the boundary.

## A2 — Spacing / distributed practice

### `spaced-review` — fifteen minutes a day back over older material

| | |
|---|---|
| **Citation** | Cepeda NJ, Pashler H, Vul E, Wixted JT, Rohrer D. 2006. Distributed practice in verbal recall tasks: a review and quantitative synthesis. *Psychological Bulletin* 132(3):354–380 |
| **DOI / PMID** | 10.1037/0033-2909.132.3.354 · PMID 16719566 |
| **Design** | Meta-analysis / quantitative synthesis of the distributed-practice effect, separating **spacing** (massed vs spaced) from **lag** (less vs more spaced) |
| **k** | **839 assessments in 317 experiments across 184 articles** — **VERIFIED**, stated verbatim in the Europe PMC abstract |
| **Key result** | Inter-study interval and retention interval **operate jointly**: the ISI producing maximal retention **increases as the retention interval increases**. Spacing beats massing; the optimal gap is not a constant |
| **Retraction** | Clean at Crossref and OpenAlex |
| **Corroboration** | Dunlosky 2013 rates **distributed practice high utility** — one of only two of ten techniques. **VERIFIED** from the abstract |

**GRADE OF THE PRACTICE: A — stands, with a required copy correction.**

Why A and not B: 839 assessments, 317 experiments, across ages, materials and
delays, with a second independent high-utility rating from a different research
group using different criteria. The card's shape — same total minutes, spread
across days rather than piled up — is exactly the massed-versus-spaced contrast
those 317 experiments ran. This is as close to "many studies agree" as
behavioural science gets.

**Where the card's copy currently overstates the paper.** `spaced-review` says
"the advantage grows the longer you need to hold on to it". True. But the card
schedules **daily** review and says nothing about gap size, and the single most
practically important result in Cepeda is that **the best gap scales with how
long you need the material**. Daily review of something needed in six months is
a shorter gap than the evidence supports; it is not wrong, it is
under-optimised, and the card can say so in one sentence without complicating
the practice: *review the oldest first, and let the gap stretch as things stick*.
That is the card's existing "oldest and shakiest first" rule, given its reason.

**Scheduling note that survives verification:** the card's `tier: 'should'`
comment — that minimal-capacity trimming must preserve the spread rather than
collapse to adjacent days — is correct and is the one scheduling decision in
this pillar that the literature directly dictates. Keep it.

### NEW — the gap that stretches (spacing, dosed)

| | |
|---|---|
| **Citation** | Cepeda NJ, Vul E, Rohrer D, Wixted JT, Pashler H. 2008. Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychological Science* 19(11):1095–1102 |
| **DOI / PMID** | 10.1111/j.1467-9280.2008.02209.x · PMID 19076480 |
| **Design** | Large controlled study: facts taught, review after a gap of up to 3.5 months, final test at a further delay of up to 1 year |
| **n** | **More than 1,350 individuals** — **VERIFIED**, stated in the Europe PMC abstract |
| **Key result** | At any test delay, increasing the inter-study gap first **increased** and then gradually **reduced** final performance — an inverted U. The optimal gap rises with test delay, but **as a proportion of test delay it falls: about 20–40% for a one-week delay, about 5–10% for a one-year delay.** The authors' own conclusion is that many educational practices are highly inefficient |
| **Retraction** | Clean at Crossref and OpenAlex |

**GRADE OF THE PRACTICE: B.**

Why B and not A: this is one very large, well-designed experiment plus the
Cepeda 2006 synthesis behind it — but a card telling someone to lengthen the gap
on a schedule applies a curve estimated on fact learning to whatever the person
happens to be studying. The mechanism is A-grade; the dosing rule is one study's
ridgeline. The card must also not promise that an *expanding* schedule beats a
fixed one, which is a separate and much less settled question.

Why not C: n greater than 1,350 with both the gap and the retention interval
manipulated is a far stronger design than most of what this library grades C,
and the direction — longer horizon, longer gap — is unambiguous across the
whole surface.

## A3 — Interleaving

### `interleaved-practice` — one weekly session mixing problem types

| | |
|---|---|
| **Citation** | Brunmair M, Richter T. 2019. Similarity matters: a meta-analysis of interleaved learning and its moderators. *Psychological Bulletin* 145(11):1029–1052 |
| **DOI / PMID** | 10.1037/bul0000209 · PMID 31556629 |
| **Design** | Multilevel meta-analysis of the interleaving effect |
| **k** | **59 studies, 238 effect sizes, 158 samples** — **VERIFIED** from the abstract |
| **Key result** | Overall **Hedges' g = 0.42**. By material: paintings **g = 0.67** and other visual material high; **mathematics g = 0.34**; expository texts and tastes non-significant; and **words g = −0.39 — blocking beats interleaving.** Meta-regression: stronger where material is **more similar between categories**, **less similar within categories**, and more complex |
| **Retraction** | Clean |

| | |
|---|---|
| **Citation** | Rohrer D, Dedrick RF, Stershic S. 2015. Interleaved practice improves mathematics learning. *Journal of Educational Psychology* 107(3):900–908 |
| **DOI** | 10.1037/edu0000001 |
| **Design** | Randomised classroom experiment; identical practice problems, order manipulated, over 3 months; unannounced test 1 or 30 days later |
| **n** | **126 seventh-grade students** — **VERIFIED** from the abstract |
| **Key result** | Interleaved beat blocked at both delays: **d = 0.42 at 1 day** and **d = 0.79 at 30 days** — **VERIFIED**, both stated |
| **Retraction** | Clean; OpenAlex `isRetracted: false` |

Origin paper, record verified but numbers not: Rohrer D, Taylor K. 2007. The
shuffling of mathematics problems improves learning. *Instructional Science*
35(6):481–498, **doi:10.1007/s11251-007-9015-8** — **PARTLY VERIFIED**. Crossref
record and author list confirmed; no abstract at Europe PMC or OpenAlex, so no
number from it is used.

**GRADE OF THE PRACTICE: B — confirmed, stands, and the card's existing hedge is
the correct one.**

Why B and not A: the pooled effect is real and moderate, but it **reverses sign**
for word learning and disappears for expository text. A practice that helps at
g = 0.67 for one material type and hurts at g = −0.39 for another is not "many
studies agree" — it is a conditional finding, and the condition is the point.
The card says "the benefit is clearest where the types are easy to confuse",
which is a fair plain-English rendering of Brunmair's between-category-similarity
moderator. **Verified as accurate; no change needed.**

Why not C: one randomised classroom trial with a 30-day unannounced test at
d = 0.79, plus a 59-study meta-analysis, is comfortably "tested and it held up"
provided the condition is stated. It is stated.

**One sentence Gate 4 should add:** interleave things you could mistake for each
other. Mixing unrelated topics, or vocabulary lists, is the case where blocking
actually won.

## A4 — Motor learning: the pillar's biggest evidence change, and it goes down

### `skill-one-external-cue` — one cue, pointed outward

The card claims the external-focus effect has been "replicated across hundreds of
small experiments, which makes it the most usable finding here". That was a fair
reading of the literature as it stood in 2021. It is no longer.

| | |
|---|---|
| **The pro case** | Chua LK, Jimenez-Diaz J, Lewthwaite R, Kim T, Wulf G. 2021. Superiority of external attentional focus for motor performance and learning: systematic reviews and meta-analyses. *Psychological Bulletin* 147(6):618–645 · **10.1037/bul0000335** · PMID 34843301 |
| **Design / k / n** | Systematic reviews plus meta-analyses. **73 studies / 1,824 participants** (performance); **40 studies / 1,274 participants** (retention and transfer); 12 studies / 216 (EMG); 9 studies / 272 (distal vs proximal) — **VERIFIED**, all stated |
| **Result** | External over internal focus: performance **g = 0.264 [0.217, 0.310]**; retention **g = 0.583 [0.425, 0.741]**; transfer **g = 0.584 [0.325, 0.842]**; EMG **g = 0.833 [0.453, 1.213]**. Not moderated by age, health status or skill level |
| **The reanalysis** | McKay B, Corson AE, Seedu J, De Faveri CS, Hasan H, Arnold K, Adams FC, Carter MJ. 2024. **Reporting bias, not external focus:** a robust Bayesian meta-analysis and systematic review of the external focus of attention literature. *Psychological Bulletin* 150(11):1347–1362 · **10.1037/bul0000451** · PMID 39480294 |
| **Design** | Robust Bayesian reanalysis **of those same data**, including several plausible publication-bias models |
| **Result** | **Moderate to strong evidence of publication bias in every analysis.** Bias-corrected means: performance **g = 0.01**, retention **g = 0.15**, transfer **g = 0.09**, EMG **g = 0.06**, distal-vs-proximal **g = −0.01**. Bayes factors favoured the null in all five, **BF01 = 1.3 (retention) to 5.75 (performance)**. Clear heterogeneity throughout; the authors conclude the effects depend on unknown contextual factors and average small to nil. Seven prior meta-studies had all reported external-focus superiority |
| **Retraction** | Both clean at Crossref and OpenAlex |

**GRADE OF THE PRACTICE: B → D. Regrade down. See section B.**

Why D and not C: the card's evidence claim is now specifically contradicted, by
a bias-corrected reanalysis of the very dataset the claim rests on, in the same
journal. That is the ego-depletion pattern the library already recognises in
`RETRACTIONS.md`, not the "some evidence, not settled" pattern.

Why D and not E: it is not untested — it is heavily tested, with real unexplained
heterogeneity, so the effect plausibly exists in some contexts. The practice
costs one written sentence before a session, is harmless, and carries genuine
expectancy value. Under the README's rule that keeps it in the library, written
warmly and graded honestly.

### `skill-interleaved-drills` — shuffle the drills (contextual interference)

| | |
|---|---|
| **The pro case** | Czyż SH, Wójcik AM, Solarská P, Kiper P. 2024. High contextual interference improves retention in motor learning: systematic review and meta-analysis. *Scientific Reports* 14:15974 · **10.1038/s41598-024-65753-3** · PMID 38987617 · PMC11237090, open access |
| **Design / k** | Systematic review and meta-analysis; 1,255 articles found, 294 full texts screened, **54 studies included**; three-level mixed model and random-effects model — **VERIFIED** |
| **Result** | High contextual interference has a **medium, statistically significant beneficial effect overall**. But **in the applied setting the benefit of random practice on retention was almost negligible**; large effect in older adults, medium in adults, and **negligible and non-significant in young participants** — **VERIFIED**, all stated in the open-access abstract |
| **The counter-case** | Ammar A, Trabelsi K, Boujelbane M, Boukhris O, Glenn J, Chtourou H, Schöllhorn W. 2023. **The myth of contextual interference learning benefit in sports practice:** a systematic review and meta-analysis. *Educational Research Review* 39:100537 · **10.1016/j.edurev.2023.100537** — **PARTLY VERIFIED.** Crossref record, journal, volume, page, year and full author list confirmed. No abstract at Europe PMC, OpenAlex or Semantic Scholar, so its reported small, non-significant effects favouring random practice are recorded as a **secondary report and are not used to set the grade** |
| **Retraction** | Both clean |

**GRADE OF THE PRACTICE: B → C. Regrade down. See section B.**

Why C and not B: the card tells an adult to shuffle the drills **in their own
sport**, and the best-verified meta-analysis says that in exactly that applied
setting the effect is almost negligible — the medium pooled effect is carried by
laboratory tasks. The card's own copy already concedes this, to its credit, but a
B asserts the practice held up, and in the setting the card actually schedules
it, it did not.

Why not D: 54 studies, a significant pooled effect, and a genuine signal in
adults and older adults. There is something here. It is smaller and more
context-dependent than a B implies.

### Checked, and a card deliberately not written

The same group applied the same correction to a second motor-learning staple,
and Gate 4 should see it before anyone proposes a "choose your own feedback"
card:

| | |
|---|---|
| **Citation** | McKay B, Bacelar MFB, Parma JO, Miller MW, Carter MJ. 2023. The combination of reporting bias and underpowered study designs has substantially exaggerated the motor learning benefits of self-controlled practice and enhanced expectancies: a meta-analysis. *International Review of Sport and Exercise Psychology* 18(1):242–262 |
| **DOI** | 10.1080/1750984x.2023.2207255 — Crossref record, journal, volume, issue, pages and full author list **VERIFIED** |
| **Result** | Naïve random-effects model **g = 0.44, k = 52, N = 2,061, 95% CI [0.31, 0.56]**; **publication status accounted for 48% of total heterogeneity**; pooling four experiments including three unpublished gave **g = 0.02, 95% CI [−0.17, 0.21]**; the p-curve of significant results lacked evidential value — **PARTLY VERIFIED**: figures as reported by the publisher, not confirmable at Europe PMC or OpenAlex, which do not index this journal |

**Consequence: no self-controlled-practice or enhanced-expectancies card in this
round.** Recorded in section C as declined.

## A5 — Deliberate practice: Ericsson against Macnamara

The pillar's most contested area. The honest answer is more interesting than
either camp's version.

| | |
|---|---|
| **The framework** | Ericsson KA, Krampe RT, Tesch-Römer C. 1993. The role of deliberate practice in the acquisition of expert performance. *Psychological Review* 100(3):363–406 · **10.1037/0033-295x.100.3.363** · 9,004 citations (OpenAlex) |
| **Design** | A **theoretical framework paper** with supporting studies of musicians, in a theory journal. Not an experiment, and not a general-population sample — **VERIFIED** at record level |
| **Claim** | Individual differences, even among elite performers, are closely related to assessed amounts of deliberate practice; characteristics believed to reflect innate talent follow from roughly ten years of intense practice |
| **Retraction** | Clean |

| | |
|---|---|
| **The meta-analysis** | Macnamara BN, Hambrick DZ, Oswald FL. 2014. Deliberate practice and performance in music, games, sports, education, and professions: a meta-analysis. *Psychological Science* 25(8):1608–1618 · **10.1177/0956797614535810** · PMID 24986855 |
| **Key result** | Variance in performance explained by deliberate practice: **games 26%, music 21%, sports 18%, education 4%, professions under 1%** — **VERIFIED**, every figure stated in the abstract |
| **Retraction** | Clean |

| | |
|---|---|
| **The sports follow-up** | Macnamara BN, Moreau D, Hambrick DZ. 2016. The relationship between deliberate practice and performance in sports: a meta-analysis. *Perspectives on Psychological Science* 11(3):333–350 · **10.1177/1745691616635591** · PMID 27217246 |
| **Key result** | **18% of variance in sports performance overall, but only 1% among elite-level performers.** Athletes who reached a high level **did not begin younger** than lower-skill athletes — **VERIFIED**, all stated |
| **Retraction** | Clean |

**GRADE OF THE PRACTICE (`skill-weak-link-block`): D — stands, unchanged.**

Why D and not C: the card is right that structured practice aimed at a named
weakness is what separates improving from accumulating mileage, and its copy
already carries the ~18% figure honestly. But **nobody has run the trial.**
Every number above is correlational — deliberate practice estimated
retrospectively and regressed on attained performance — so it cannot separate
"practice caused skill" from "skill caused more practice, and more enjoyable
practice". Neither camp has an experiment. D is the right grade for a practice
resting entirely on cross-sectional variance decomposition.

Why not C: it would take a trial randomising practice *structure* at matched
volume. For these domains that trial does not exist.

**The synthesis, which is the useful part.** Both camps are right about
different things. Ericsson's implied share is inflated by a factor of three to
five outside music and games, and collapses to about 1% at elite level — which
is exactly where the popular argument is aimed. But Macnamara's own numbers say
practice explains **a fifth of the difference in sport and a quarter in games**,
which is very large for a single modifiable variable. The deflating result and
the encouraging result are the same result: *practice is the biggest lever you
personally control, it is not the whole story, and both halves of that are good
news.* The library already names ten-thousand-hours as folklore. It should now
also say the backlash overcorrected.

## A6 — Habit formation, automaticity, and the 66 days

The brief and Gate 1 both asked what Lally's figure actually says. The answer is
better for this product than the folklore version, and it changes a scheduling
decision.

### The origin paper

| | |
|---|---|
| **Citation** | Lally P, van Jaarsveld CHM, Potts HWW, Wardle J. 2010 (issue 2010, online 2009). How are habits formed: modelling habit formation in the real world. *European Journal of Social Psychology* 40(6):998–1009 |
| **DOI** | 10.1002/ejsp.674 · open access · 2,045 citations (OpenAlex) |
| **Design** | Prospective observational study. Volunteers chose one eating, drinking or activity behaviour to do daily in the same context, for 12 weeks, completing the Self-Report Habit Index daily. Non-linear asymptotic curves fitted per individual |
| **n** | **96 volunteers; 82 provided enough data; the model fitted for 62; a good fit for 39** — **VERIFIED**, all four numbers stated in the abstract |
| **Key result** | Time to reach 95% of the individual's automaticity asymptote **ranged from 18 to 254 days** — **VERIFIED from the abstract**. The famous **66 days is a median drawn from the well-fitting subset, and is not in the abstract** — **PARTLY VERIFIED**, and it should never be printed as "it takes 66 days" |
| **The finding that matters most** | **Missing one opportunity to perform the behaviour did not materially affect the habit-formation process** — **VERIFIED**, stated in the abstract |
| **Retraction** | Clean; OpenAlex `isRetracted: false` |

### What has replaced it

| | |
|---|---|
| **Citation** | Singh B, Murphy A, Maher C, Smith AE. 2024. Time to form a habit: a systematic review and meta-analysis of health behaviour habit formation and its determinants. *Healthcare* 12(23):2488 |
| **DOI / PMID** | 10.3390/healthcare12232488 · PMID 39685110 · PMC11641623 · open access |
| **Design** | Systematic review and meta-analysis of experimental intervention studies using SRHI / SRBAI automaticity measures; PEDro quality rating |
| **k / n** | **20 studies, 2,601 participants**, mean age range 21.5–73.5 — **VERIFIED**. **11 of the 20 rated high risk of bias** — also verified, and it is the reason this is not an A |
| **Key result** | Four studies reported time to habit formation: **medians 59–66 days, means 106–154 days, individual range 4–335 days.** Pre-to-post improvement in habit score **SMD = 0.69, 95% CI [0.49, 0.88]**. Determinants that mattered: frequency, timing, type of habit, individual choice, affective judgements, behavioural regulation and preparatory habits — with **morning practices and self-selected habits showing greater habit strength** — **VERIFIED**, all stated |
| **Retraction** | Clean |

| | |
|---|---|
| **Citation** | Ma H, Wang A, Pei R, Piao M. 2023. Effects of habit formation interventions on physical activity habit strength: meta-analysis and meta-regression. *IJBNPA* 20:109 |
| **DOI / PMID** | 10.1186/s12966-023-01493-3 · PMID 37700303 · PMC10498635 · open access |
| **k** | **10 studies**, rated relatively high quality — **VERIFIED** |
| **Key result** | Habit-formation interventions increased physical-activity habit, **SMD = 0.31, 95% CI [0.14, 0.48]**. Meta-regression: **problem-solving as a component helped (β = 0.36 [0.17, 0.55]); social reward hurt (β = −0.40 [−0.74, −0.06])** — **VERIFIED** |
| **Retraction** | Clean |

**GRADE OF THE PRACTICE (a habit-formation card: pick one behaviour, one
context, repeat daily, expect two months): B.**

Why B and not A: two independent meta-analyses in different behaviour domains
agree on direction and magnitude, and the underlying mechanism is one of the
better-replicated ideas in health psychology. But 11 of Singh's 20 studies are
high risk of bias, Ma has only 10 studies, and the outcome in every one of them
is **self-reported automaticity**, not behaviour observed at a distance. That is
a real ceiling.

Why not C: SMD 0.69 and SMD 0.31 in two separate syntheses, plus a
192-participant RCT below, is more than "some evidence, not settled".

### Habit stacking, tested directly — and the answer is not what the genre says

| | |
|---|---|
| **Citation** | Keller J, Kwasnicka D, Klaiber P, Sichert L, **Lally P**, Fleig L. 2021. Habit formation following **routine-based versus time-based cue planning**: a randomized controlled trial. *British Journal of Health Psychology* 26(3):807–824 |
| **DOI / PMID** | 10.1111/bjhp.12504 · PMID 33405284 |
| **Design** | **Randomised controlled trial**, 84 days of daily questionnaires, multilevel models with days nested in participants |
| **n** | **192 adults, aged 18–77** — **VERIFIED** |
| **Key result** | **Median 59 days to peak automaticity** among those who formed habits. Both routine-based ("after breakfast") and time-based ("at 8am") cue planning increased automaticity and plan enactment, and **there were no between-condition differences.** **Repeated plan enactment was the key predictor of automaticity** — **VERIFIED**, all stated |
| **Retraction** | Clean |

**GRADE OF THE PRACTICE (habit stacking specifically — anchoring to an existing
routine rather than a clock time): C.**

Why C and not B: one good RCT, and its result is a **null on the distinction**.
Habit stacking is not wrong — it worked — it simply did not beat setting a time,
which is the specific claim the popular version makes. A card can honestly offer
either anchor; it cannot claim the routine anchor is superior.

Why not D: n = 192, randomised, 84 days of daily measurement, Lally on the
author list. This is a properly designed test, and what it found is that the
thing underneath both arms — *actually doing it, in response to the cue you
planned* — is what predicts automaticity.

**Two direct consequences for the library's scheduling model, which is the
product-shaped part of this section:**

1. **`anchor.kind` choice between `wake`/`sleep` and `fixed` is not an evidence
   question.** Keller found no difference. Pick whichever the person will
   actually enact. That resolves a design question the library has been
   answering by intuition.
2. **`neverNag` is directly supported for habit cards.** Lally: missing one
   opportunity did not materially affect habit formation. That is a rare case
   where the kindest copy line in the library — *one missed day does not undo
   this* — is a verified empirical finding rather than a nicety.
3. Singh's determinant list independently supports the library's existing bias
   toward **morning anchors** and toward **letting the person choose the
   behaviour**, both of which showed greater habit strength.

### Implementation intentions, for the record

Gollwitzer PM, Sheeran P. 2006. Implementation intentions and goal achievement:
a meta-analysis of effects and processes. *Advances in Experimental Social
Psychology* 38:69–119, **doi:10.1016/s0065-2601(06)38002-1**, 3,259 citations,
open access, **clean at Crossref and OpenAlex**. Publication type is
`book-chapter`; no abstract at Europe PMC or OpenAlex, so the classic
d ≈ 0.65 from 94 studies is **PARTLY VERIFIED** — record and author list
confirmed, effect size not confirmed at source in this round.

The library already carries this at A (`trigger-if-then`, mind pillar) and
`hard-conversation-opening` and `admin-if-then` lean on it. **No regrade
proposed and none investigated** — it is the mind round's card, not this one's.
Recorded here only because the skill pillar borrows the mechanism and Gate 4
should cross-reference rather than re-cite.

## A7 — Sleep and memory consolidation (cross-referenced, not duplicated)

The recovery round's `protocols.ts` was read. **It contains no
sleep-and-consolidation card** — its sleep entries are `sleep-need-calibration`,
`sleep-opportunity-tally`, `night-anchor-sleep`, `night-shift-light`,
`dark-glasses-home`, `no-drive-after-nights`, `pre-nights-nap`, `on-shift-nap`,
`caffeine-on-nights`, `jet-lag-light-direction`, `tracker-stages-are-estimates`,
and `heat-before-bed-gap`. Consolidation is a genuine gap, and it belongs to the
skill pillar rather than to recovery, because the practice it supports is about
when you practise, not about how you sleep.

| | |
|---|---|
| **Citation** | Schmid D, Erlacher D, Klostermann A, Kredel R, Hossner E-J. 2020. Sleep-dependent motor memory consolidation in healthy adults: a meta-analysis. *Neuroscience and Biobehavioral Reviews* 118:270–281 |
| **DOI / PMID** | 10.1016/j.neubiorev.2020.07.028 · PMID 32730847 |
| **Design** | Meta-analysis comparing sleep against an equivalent wake interval after motor learning |
| **k / n** | **48 studies; 53 sleep groups (n = 829) and 53 wake groups (n = 825)** — **VERIFIED**, all stated |
| **Key result** | Overall relative sleep gain in motor memory consolidation **g = 0.43**; finger tapping **g = 0.47**; mirror tracing **g = 0.62**. No subgroup differences for study design — **VERIFIED** |
| **Retraction** | Clean |

**GRADE OF THE PRACTICE (practise a motor skill on a day you will sleep
normally after it; treat sleep as part of the session): B.**

Why B and not A: 48 studies, 1,654 participants, consistent direction, real
effect. But the tasks are finger tapping and mirror tracing — laboratory
sequences, not sport or instrument — and the practical instruction that falls
out of it (do not schedule your hardest new-skill session on a night you will
sleep four hours) has never itself been tested.

Why not C: g = 0.43 pooled across 48 studies with a matched wake control is a
clean experimental contrast, not an association.

**On Waitzkin's "end every session on a rep done well" (Gate 1 claim 96):**
**UNVERIFIED as stated.** The sleep-consolidation literature above supports that
*what you practised* consolidates overnight; nothing found in this round tests
whether the **last** repetition is preferentially consolidated, or that ending on
a success changes the next day's performance. It is a plausible recency-plus-
consolidation inference and it is a lovely, cheap practice — but the mechanism
claim on the card would be ours, not the literature's. If Gate 4 writes it, it
is an **E**, framed as what it is: end on a good one because it is a better
place to stop, and the overnight part is a reasonable guess.

## A8 — The rest of the ledger, in short form

Same verification chain, condensed. Every DOI below was put through
`harvest.js crossref` and `harvest.js abstract`; all are **clean** on the
title-prefix check, the Crossref relation and the OpenAlex `is_retracted`
boolean unless the row says otherwise.

### Pretesting — guess before you read

| | |
|---|---|
| **Citation** | Richland LE, Kornell N, Kao LS. 2009. The pretesting effect: do unsuccessful retrieval attempts enhance learning? *Journal of Experimental Psychology: Applied* 15(3):243–257 · **10.1037/a0016496** · PMID 19751074 |
| **Design / n** | **Five experiments**, participants read an essay about vision; test condition asked about embedded concepts *before* reading, control got longer to read. Attention direction controlled for in every experiment (italics, bolded keywords, and in Exp 5 by showing the questions without asking for answers). n not stated in the abstract — **PARTLY VERIFIED** |
| **Key result** | Post-test performance was better in the pretest condition in **all five experiments — even analysing only items that were *not* successfully retrieved on the pretest.** Guessing wrong first beat reading longer — **VERIFIED** |
| **Grade of the practice** | **B.** Five within-paper experiments with the obvious confound designed out, plus a well-replicated wider literature. Not A: one lab, one material type (a single expository passage), and the classroom-scale evidence is thinner than for practice testing after study |

### Motor imagery, with an actual dose

| | |
|---|---|
| **Citation** | Paravlic AH, Slimani M, Tod D, Marusic U, Milanovic Z, Pisot R. 2018. Effects and dose–response relationships of motor imagery practice on strength development in healthy adults. *Sports Medicine* 48(5):1165–1187 · **10.1007/s40279-018-0874-8** · PMID 29541965 |
| **Design / k / n** | Systematic review and meta-analysis; 717 studies screened, **13 articles, 370 participants** — **VERIFIED** |
| **Key result** | Motor imagery **moderately improved maximal voluntary strength** versus no-exercise control; **small effects in favour of physical practice** when compared head-to-head; imagery combined with physical practice vs physical practice alone was unclear. **Meta-regression dose: 4 weeks, 3 sessions a week, 2–3 sets per session, 25 repetitions per set, 15 minutes per session** — **VERIFIED**, all stated |
| **Grade of the practice (`skill-mental-rehearsal`)** | **C — stands.** 13 studies, 370 people, and the outcome is *strength*, not skill. It is exactly "some evidence, not settled". But the card can now carry a real dose instead of a vague one — see section B for the scheduling change |

### Prior knowledge beats general reading skill

| | |
|---|---|
| **Citation** | Recht DR, Leslie L. 1988. Effect of prior knowledge on good and poor readers' memory of text. *Journal of Educational Psychology* 80(1):16–20 · **10.1037/0022-0663.80.1.16** · 305 citations |
| **Design / n** | **64 junior-high students**, 2×2 on preassessed reading ability × preassessed baseball knowledge; read an account of a half-inning; nonverbal recall (moving figures), verbal retelling, summary and sentence-importance sort — **VERIFIED** |
| **Key result** | **Significant main effect of prior knowledge on every measure, and no interaction with reading ability** — **VERIFIED**. Knowing the domain mattered more than being a good reader |
| **Grade of the practice (build background before technique)** | **D.** One study, n = 64, children, one domain, 1988. It is a beautiful and genuinely counter-intuitive result, and it is a single experiment. Not C: nothing in this round replicates it, and it has never been tested as an adult self-study strategy |

### The photo-taking impairment effect

| | |
|---|---|
| **Citation** | Henkel LA. 2014 (online 2013). Point-and-shoot memories: the influence of taking photos on memory for a museum tour. *Psychological Science* 25(2):396–402 · **10.1177/0956797613504438** · PMID 24311477 |
| **Design / n** | **Two studies**, guided art-museum tour, participants directed to observe some objects and photograph others. n not stated in the abstract — **PARTLY VERIFIED** |
| **Key result** | Photographing a whole object → **fewer objects remembered, fewer details, worse memory for location**. But **zooming in to photograph a specific part eliminated the impairment entirely** — and memory for features *not* zoomed in on was just as strong — **VERIFIED** |
| **Grade** | **D as a time-back item**, and it must ship with the escape hatch: the effect disappears when the photo is a deliberate act of looking. Two studies, one lab, one setting; the later literature is mixed, and the card must say so |

### Note-taking by hand versus laptop — the brief named this, and it does not hold

| | |
|---|---|
| **The famous result** | Mueller PA, Oppenheimer DM. 2014. The pen is mightier than the keyboard. *Psychological Science* 25(6):1159–1168 |
| **The replication** | Morehead K, Dunlosky J, Rawson KA. 2019. How much mightier is the pen than the keyboard for note-taking? A replication and extension of Mueller and Oppenheimer (2014). *Educational Psychology Review* 31(3):753–780 · **10.1007/s10648-019-09468-2** · 107 citations. **Crossref record and author list VERIFIED; no abstract at Europe PMC or OpenAlex** |
| **Key result** | **PARTLY VERIFIED.** Preregistered replication and extension, adding eWriter and **no-notes** conditions. Test performance **did not consistently differ between any group**, including the group that took no notes at all; group differences shrank further after students studied their notes; a meta-analysis of the direct replications found small, **non-significant** effects favouring longhand. Figures taken from the publisher record and secondary reports, not confirmed at abstract level in this round |
| **Grade** | **Not a card in either direction.** See section D — this is a "you can stop worrying about it" item, not a practice |

### Far transfer does not happen — the antipattern, confirmed

| | |
|---|---|
| **Citation** | Sala G, Tatlidil KS, Gobet F. 2018. Video game training does not enhance cognitive ability: a comprehensive meta-analytic investigation. *Psychological Bulletin* 144(2):111–139 · **10.1037/bul0000139** · PMID 29239631 |
| **Design / k** | **Three random-effects meta-analyses: k = 310** (skill–ability correlation), **k = 315** (players vs non-players), **k = 359** (training effects) — **VERIFIED** |
| **Key result** | **Small or null overall effects in all three models. No evidence of a causal relationship between playing video games and enhanced cognitive ability.** The authors place it alongside working-memory training, music, brain training and chess as another failure of far transfer — **VERIFIED** |
| **Grade** | **Antipattern, confirmed.** Section D |

### Learning styles — already in `LEARNING_ANTIPATTERNS`, now with its source verified

| | |
|---|---|
| **Citation** | Pashler H, McDaniel M, Rohrer D, Bjork R. 2008. Learning styles: concepts and evidence. *Psychological Science in the Public Interest* 9(3):105–119 · **10.1111/j.1539-6053.2009.01038.x** · PMID 26162104 · 292 citations |
| **Design** | Commissioned systematic review, with a stated methodological precondition: to validate learning styles you need learners sorted by style, randomly assigned across instructional methods, one common final test, and a **crossover interaction** |
| **Key result** | Ample evidence that people **have** presentation preferences and that aptitudes differ. **Virtually no evidence of the required interaction.** Very few studies have even used a design capable of testing it; **several that did found results flatly contradicting the meshing hypothesis** — **VERIFIED**. The authors are careful: many specific versions have never been tested at all, so this is "no adequate evidence base", not "disproved in every form" |
| **Consequence** | The library's existing `LEARNING_ANTIPATTERNS` wording — "tested directly several times and the predicted benefit has not shown up" — is **accurate and now sourced.** Two additions proposed in section D |

### Growth mindset — Gate 1's DOI was wrong, and the correction matters

Gate 1 lists "Macnamara and Burgoyne 2023, doi:10.1037/bul0000368". **That DOI is
a different paper by different authors.** Both exist, both are in the same
double issue of *Psychological Bulletin*, and they reach different conclusions.
Citing the wrong one would have attributed a deflating result to the authors of
the more favourable one.

| | Macnamara & Burgoyne | Burnette et al. |
|---|---|---|
| **DOI** | **10.1037/bul0000352** · PMID 36326645 | **10.1037/bul0000368** · PMID 36227318 |
| **Journal** | *Psychological Bulletin* 149(3–4):133–173 | *Psychological Bulletin* 149(3–4):174–205 |
| **Authors (Crossref)** | Macnamara B, Burgoyne A | Burnette J, Billingsley J, Banks G, Knouse L, Hoyt C, Pollack J, Simon S |
| **k / n** | **63 studies, N = 97,672**; mindset-shifted subset 13 studies, N = 18,355; highest-quality subset **6 studies, N = 13,571** — **VERIFIED** | **53 independent samples** — **VERIFIED** |
| **Result** | Overall **d = 0.05 [0.02, 0.09]**, **non-significant after publication-bias correction**. Mindset-shifted subset **d = 0.04 [−0.01, 0.10]**, ns. Highest-quality subset **d = 0.02 [−0.06, 0.10]**, ns. **Authors with a financial incentive published significantly larger effects** — **VERIFIED** | Targeted subsamples with high implementation fidelity: academic achievement **d = 0.14 [0.06, 0.22]**; mental health **d = 0.32 [0.10, 0.54]**; social functioning **d = 0.36 [0.03, 0.68]**. **95% prediction intervals −0.08 to 0.35** and **0.07 to 0.57** — **VERIFIED** |
| **Retraction** | Clean | Clean |

**The honest reading, which is neither camp's:** growth-mindset interventions do
close to nothing on average for academic achievement, and the best-quality
subset is indistinguishable from zero. Where they do something it is small, and
it is concentrated in specific groups under high-fidelity delivery. Notably the
larger effect in Burnette is on **mental health**, not achievement.

**Consequence for this pillar: do not write a growth-mindset card, and add it to
the antipatterns.** Section D.

### Procrastination interventions — Gate 1's headline claim, tested

Gate 1 claim 88 (Ferrari on Mel Robbins): *two meta-analyses of procrastination
interventions found time-management training the least effective approach*, and
Gate 1 called it "the most interesting single result in the corpus". Both
meta-analyses were opened.

| | |
|---|---|
| **Citation** | van Eerde W, Klingsieck KB. 2018. Overcoming procrastination? A meta-analysis of intervention studies. *Educational Research Review* 25:73–85 · **10.1016/j.edurev.2018.09.002** · 251 citations |
| **Verification** | **PARTLY VERIFIED.** Crossref record, journal, volume, pages, year and author list confirmed. No abstract at Europe PMC, OpenAlex or Semantic Scholar; the abstract was read from the University of Amsterdam institutional repository record |
| **Design / k / n** | **24 studies, k = 44, N = 1,173.** Four intervention types compared: **self-regulation, CBT, other therapeutic approaches, and strengths/resources** |
| **Key result** | A large reduction in procrastination overall, stable at follow-up. **CBT reduced procrastination more strongly than the other types.** Intervention duration was not a significant moderator |
| **What it does NOT say** | **The abstract never mentions time-management training by name and reports no ranking that places it last.** Time management sits inside the "self-regulation" category, which was beaten by CBT — that is all that is confirmed |

| | |
|---|---|
| **Citation** | Rozental A, Bennett S, Forsström D, Ebert DD, Shafran R, Andersson G, Carlbring P. 2018. Targeting procrastination using psychological treatments: a systematic review and meta-analysis. *Frontiers in Psychology* 9:1588 · **10.3389/fpsyg.2018.01588** · PMID 30214421 · PMC6125391 · open access · PROSPERO CRD42017069981 |
| **Design / k / n** | RCTs only, against an inactive comparator; **1,639 records screened, 12 studies, 21 comparisons, N = 718** — **VERIFIED** |
| **Key result** | Overall **g = 0.34 [0.11, 0.56]** with significant heterogeneity (**I² = 61.14%**). **CBT subgroup (3 of 4 studies, N = 236): g = 0.55 [0.32, 0.77], heterogeneity gone (I² = 0.00%).** Egger's test not significant; fail-safe N = 370 — **VERIFIED**, every figure stated |
| **What it does NOT say** | It does not test time-management training as a category at all |

**VERDICT on claim 88: PARTLY VERIFIED, and overstated as put on air.** What is
verified is the useful half: **in both meta-analyses the cognitive-behavioural
approach outperformed the alternatives, and in neither did a scheduling or
self-regulation approach come out on top.** What is *not* verified — at either
source — is a ranking that puts time-management training last. Gate 1 was right
that this is the most interesting result in the corpus; it is just one notch
weaker than Ferrari's phrasing, and the time-back item in section D is written
to the evidence rather than to the quote.

### Imposter thoughts — Gate 1's open trace, closed

Gate 1 could not find the Tewfik paper in Europe PMC and asked Gate 2 to look at
Crossref or the *Academy of Management Journal* directly. Found:

**Tewfik BA. 2022. The impostor phenomenon revisited: examining the relationship
between workplace impostor thoughts and interpersonal effectiveness at work.
*Academy of Management Journal* 65(3):988–1018 · doi:10.5465/amj.2020.1627 ·
68 citations · clean at Crossref and OpenAlex.** Single-author, which matters for
the METHOD author-list rule: a **Basima Tewfik** researcher credit is
author-list-valid on any card citing this DOI. OpenAlex holds only a truncated
abstract, so the design and n are **UNVERIFIED** and this is a **mind-pillar**
card in any case — handed back rather than graded here.

### Two existing B cards re-checked and confirmed, so the round can say it looked

| Card | Source opened | Verdict |
|---|---|---|
| `skill-technical-block` (B) | Donovan JJ, Radosevich DJ. 1999. A meta-analytic review of the distribution of practice effect: now you see it, now you don't. *Journal of Applied Psychology* 84(5):795–805 · **10.1037/0021-9010.84.5.795** · 681 citations. **63 studies, 112 effect sizes, overall weighted d = 0.46** favouring spaced over massed — **VERIFIED**. Moderated by task type and inter-trial interval, and **effect sizes were significantly larger in low-rigour studies than high-rigour ones** | **B stands.** The spacing claim for motor and applied tasks is real and independently replicated outside the verbal literature. The card's phrase "among the better-replicated findings in motor learning" is fair. One honesty note for Gate 4: the rigour moderator means the true effect is at the lower end of 0.46, and spacing does more for simpler tasks than complex ones |
| `incubation-walk` (B) | Sio UN, Ormerod TC. 2009. Does incubation enhance problem solving? A meta-analytic review. *Psychological Bulletin* 135(1):94–120 · **10.1037/a0014212** · PMID 19210055. **VERIFIED**: positive incubation effect; **divergent-thinking tasks benefit more** than insight tasks; **longer preparation periods gave a greater effect**; **filling the break with a high-demand task shrank it**, and a low-demand task beat rest outright for linguistic insight problems. Plus Oppezzo M, Schwartz DL. 2014. Give your ideas some legs. *JEP:LMC* · **10.1037/a0036577** | **B stands, and the card's copy is unusually accurate** — the "only after real effort" safety line is literally Sio & Ormerod's preparation-period moderator, and "something undemanding" is literally their cognitive-demand moderator |

---

# B. REGRADES to the existing 22 skill cards

Net effect on the pillar: **A 2 · B 9 · C 7 · D 3 · E 1** becomes
**A 2 · B 7 · C 7 · D 4 · E 2**. Five cards move; four move down and one moves
down two grades because its evidence base was retracted. Nothing moves up —
this round found no under-graded skill card, which is what you would expect in
the library's strongest pillar.

## B1. `ship-monthly` C → **E**, and two attributions come off. Urgent.

**This is the most important single finding in the round.**

The card's `why` reads: *"the firmest evidence here is about the drift rather
than the work: students who set their own spaced deadlines finished better than
those working toward one distant one."* That is Ariely & Wertenbroch 2002, and
its authors are the card's entire attribution line.

```
harvest.js crossref 10.1111/1467-9280.00441
  title: "RETRACTED: Procrastination, Deadlines, and Performance:
          Self-Control by Precommitment"
  retraction_or_update: ["TITLE SAYS RETRACTED"]
  DO_NOT_CITE: true
```

Europe PMC independently types it **"Retracted Publication"**. It is already in
`RETRACTIONS.md` — retracted **2 September 2026**, found by the money round six
days after the fact, with the note that Data Colada found Study 2's data
tampered with or fabricated and a July 2026 replication failed. **`ship-monthly`
is a skill-pillar card resting on the same paper, and the register did not catch
it because nobody had cross-checked the skill cards against it.**

Required changes:
- **Attribution: remove `'Dan Ariely'` and `'Klaus Wertenbroch'`.** Under the
  standing rule in `RETRACTIONS.md` — where a practice rests on an Ariely paper,
  find independent corroboration or drop the practice — and under the
  author-list rule, both credits are now invalid.
- **The self-imposed-deadline sentence comes out of `why`.** This round found no
  replacement: nothing verified here shows that self-set spaced deadlines
  improve creative output.
- **Grade C → E.** What survives is the card's *second* half, which was already
  the honest half: work with no delivery date drifts, and evaluation plus time
  pressure can flatten creative work rather than sharpen it. That is a rationale,
  not evidence for the practice.
- **The practice itself stays**, written warmly. A monthly ship date with an
  audience of one is harmless, meaningful and adherence-positive, and the README
  is explicit that expectancy raises the value of a harmless low-grade practice
  without raising its grade.
- **Add to `RETRACTIONS.md`:** a line noting that the Ariely & Wertenbroch
  retraction reached the skill pillar as well as money, so the next round checks
  every pillar rather than the one that found it.

## B2. `skill-one-external-cue` B → **D**

Evidence: McKay et al. 2024, *Psychological Bulletin* 150(11):1347–1362,
**10.1037/bul0000451**, a robust Bayesian reanalysis of Chua et al. 2021's own
dataset. Bias-corrected g = 0.01 (performance) to 0.15 (retention); Bayes
factors favour the null in all five outcomes; moderate-to-strong publication
bias in every analysis. Seven prior meta-studies had reported superiority.

Required changes:
- Grade **B → D**.
- The `why` sentence "replicated across hundreds of small experiments, which
  makes it the most usable finding here" is now **false as stated** and must go.
  The replacement is more interesting: the raw literature is large and
  consistently positive, a 2024 reanalysis of the same data found the positivity
  is publication bias, and what remains is real but unexplained variation. Some
  people, some tasks, some cues.
- **Attribution: keep `'Gabriele Wulf'` and `'Rebecca Lewthwaite'`** — both are
  on the author list of Chua et al. 2021 (**10.1037/bul0000335**), so the credit
  is author-list-valid and the card is crediting who genuinely popularised the
  practice, which is what the credit is for.
- Keep the practice and the five minutes. Writing one cue before you practise
  costs nothing, and "aim it at what you want the ball to do" is a better
  instruction than most amateur coaching regardless of the effect size.
- **Add external focus of attention to `RETRACTIONS.md`** under "overturned or
  seriously contested", beside ego depletion and nudges. Same pattern, same
  register.

## B3. `skill-interleaved-drills` B → **C**

Evidence: Czyż et al. 2024, *Scientific Reports* 14:15974,
**10.1038/s41598-024-65753-3**, 54 studies. Medium significant pooled effect —
but "in the applied setting, the beneficial effect of random practice on
retention was almost negligible", and negligible and non-significant in young
participants. Ammar et al. 2023 (**10.1016/j.edurev.2023.100537**) is titled
"the myth of contextual interference learning benefit in sports practice",
though its numbers could not be confirmed at source this round.

Required changes:
- Grade **B → C**.
- The card's existing hedge is already correct and should be promoted from a
  caveat to the headline: this is a laboratory finding that thins out in real
  sport.
- **Attribution: `'Robert Bjork'` and `'Richard Schmidt'` currently fail the
  author-list rule** — neither is on Czyż or Ammar. Fix by citing **Schmidt RA,
  Bjork RA. 1992. New conceptualizations of practice. *Psychological Science*
  3(4):207–217 · doi:10.1111/j.1467-9280.1992.tb00029.x** in the card's
  `sources.md` row, which puts both names on an author list in one lookup and is
  in any case the paper that gave the field the idea.
- One usable note for the copy: Czyż found the **largest** effect in older
  adults and **none** in young participants. If the library ever segments by age,
  this card is worth more to a 55-year-old picking up a sport than to a 20-year-old.

## B4. `skill-mental-rehearsal` C → **C** (grade stands, dose changes)

Evidence: Paravlic et al. 2018, *Sports Medicine* 48:1165–1187,
**10.1007/s40279-018-0874-8**, 13 studies / 370 participants, with an explicit
dose–response meta-regression.

Required changes:
- **Grade unchanged at C** — 13 studies, 370 people, and the measured outcome is
  maximal voluntary strength rather than skill. Honest C.
- **Change the scheduling to the tested dose**: currently `days: [2, 5]`,
  `durationMin: 10`. The meta-regression's best-performing configuration is
  **three sessions a week of about 15 minutes, for four weeks**. Proposed:
  `days: [1, 3, 5]`, `durationMin: 15`. This is the rare case where a card can
  swap a made-up dose for a measured one.
- The `why` should say plainly that imagery beats nothing and **loses to real
  practice** — Paravlic found small effects favouring physical practice
  head-to-head — which is exactly what the card already implies and can now
  state with a source.
- **Attribution: `'Deborah Feltz'` is author-list-valid only if the card cites
  Feltz DL, Landers DM. 1983. *Journal of Sport Psychology* 5(1):25–57 ·
  doi:10.1123/jsp.5.1.25.** Cite it or drop the credit. **`'Andrew Huberman'` on
  this card is UNTRACED** — Gate 1 opened seven Huberman episodes and traced no
  mental-rehearsal claim to him. Per METHOD, an untraced credit comes off unless
  Gate 4 can trace it.

## B5. `spaced-review` A → **A** (stands), with one copy correction and an
attribution repair

- **Grade A confirmed.** Cepeda et al. 2006: 839 assessments, 317 experiments,
  184 articles. Dunlosky 2013 independently rates distributed practice
  high-utility. Donovan & Radosevich 1999 replicates the effect outside verbal
  material at d = 0.46 across 63 studies. This is as close to "many studies
  agree" as this library gets.
- **Copy correction.** The card is silent on gap size, and the single most
  practical result in the spacing literature is that **the right gap scales with
  how long you need to hold the material** (Cepeda et al. 2008, n > 1,350:
  20–40% of a one-week horizon, 5–10% of a one-year horizon). One sentence, and
  it turns the card's existing "oldest and shakiest first" rule from a heuristic
  into a reason.
- **Attribution repair, and it is a real METHOD-rule failure.** The card credits
  `'Robert Bjork'`, `'Elizabeth Bjork'`, `'John Dunlosky'`. Dunlosky is
  author-list-valid via **10.1177/1529100612453266**. **Robert Bjork is not on
  Cepeda or Dunlosky**; he becomes valid the moment the card cites **Bjork RA,
  Dunlosky J, Kornell N. 2013. Self-regulated learning: beliefs, techniques, and
  illusions. *Annual Review of Psychology* 64:417–444 ·
  doi:10.1146/annurev-psych-113011-143823**, which it should anyway.
  **Elizabeth Bjork is on neither and fails the rule** — either cite a source
  carrying her, or the credit comes off.
  **And two names that should be there are missing: `'Nicholas Cepeda'` and
  `'Harold Pashler'`, who are first and second author of the meta-analysis the
  card's entire A grade rests on.** That is the mirror image of the recovery
  round's problem — not a false credit, a missing one.

## B6. `blank-page-recall` A → **A** (stands), one credit added

- **Grade A confirmed**, on Roediger & Karpicke 2006 (the manipulation is the
  practice), Rowland 2014 (recall beats recognition — which is why the card says
  *blank page* and not *quiz app*), Adesope 2017 (beats every control tested),
  and Dunlosky 2013 (high utility, one of two out of ten).
- Existing researcher credits **all pass the author-list rule**: Roediger and
  Karpicke on 10.1111/j.1467-9280.2006.01693.x, Dunlosky on
  10.1177/1529100612453266.
- **Add `'Andrew Huberman'`** — see section E. This is a missing credit worth
  having: the most recognisable name in the corpus teaches exactly this practice
  and is not on the library's best card.
- **Boundary note for `sources.md`:** cite Pan & Rickard 2018
  (**10.1037/bul0000151**) as the limit. Retrieval practice transfers less than
  the headline implies, and under bias correction may not transfer at all absent
  specific moderators. The card claims retention, not transfer, and must not
  drift.

## B7. Cards checked and left alone

| Card | Grade | Why no change |
|---|---|---|
| `interleaved-practice` | B | Brunmair g = 0.42 with a sign reversal for words; Rohrer 2015 d = 0.79 at 30 days in a real classroom. Copy verified accurate, including the confusability hedge. **Attribution note: `'Robert Bjork'` fails the author-list rule here too** — same fix as B3, or add `'Kelli Taylor'` (Rohrer & Taylor 2007) |
| `skill-weak-link-block` | D | Ericsson 1993 is a theory paper; Macnamara 2014/2016 are correlational variance decompositions. No experiment exists. D is right and the copy's 18% figure is verified |
| `skill-technical-block` | B | Donovan & Radosevich 1999, d = 0.46 across 63 studies, confirmed |
| `incubation-walk` | B | Sio & Ormerod 2009 confirmed, and the card's two moderators are the paper's two moderators |
| `questions-not-highlights` | B | **Borderline, left at B.** The negative half (highlighting and rereading are low-utility) is verified at Dunlosky 2013. The positive half — writing your *own* questions — is genuinely less studied than answering ready-made ones, and the card says so. **Attribution: `'Henry Roediger'` fails the author-list rule unless the card cites a Roediger source; `'Barbara Oakley'` is UNTRACED in this corpus** |
| `self-explain-pass`, `teach-it-back`, `creative-session-daily`, `volume-pass`, `idea-capture`, `talk-rehearsal-spaced`, `speaking-low-stakes-rep`, `talk-filmed-runthrough`, `hard-conversation-opening`, `reflective-listening-rep`, `skill-filmed-rep` | — | Not re-litigated. None is in this round's six priorities, none has a load-bearing source in `RETRACTIONS.md`, and the round's effort went where the brief pointed it. `reflective-listening-rep` has a **missing credit** flagged by Gate 1 (Adam Grant, motivational interviewing) — a Gate 4 attribution question, not a grade question |

---

# C. NEW CARD CANDIDATES

Six, not twelve. The brief says to run this pillar short or last and that "thin
entries still subtract"; the honest yield of a verification round on the
library's strongest pillar is a handful of well-sourced additions and the
antipattern extensions in section D, which are probably worth more.

**No `Protocol` objects here — that is Gate 4's job.** Scheduling shape,
proposed grade and the flags a writer needs, nothing more.

### C1. Let the gap stretch — **B**

- **The practice.** Once a week, look at what you have been reviewing and push
  the oldest, most solid items further out — from daily to every few days to
  weekly — keeping the shaky ones close.
- **Source.** Cepeda et al. 2008, **10.1111/j.1467-9280.2008.02209.x**, n > 1,350;
  Cepeda et al. 2006, **10.1037/0033-2909.132.3.354**, 839 assessments.
- **Grade B, not A**: the mechanism is A-grade, the *dosing rule* is one
  ridgeline estimated on fact learning, and expanding schedules have not reliably
  beaten equal-interval ones head to head.
- **Shape.** Weekly · 10 minutes · `anchor: { kind: 'fixed' }`, weekend morning ·
  `energy: 'morning'` · `tier: 'could'` · pairs with and depends on
  `spaced-review`, which must exist first.
- **Flags.** No safety note needed. Not `neverNag` — a missed week means the
  gaps stay where they are, which is fine, so the nudge is harmless.

### C2. Guess before you read — **B**

- **The practice.** Before opening the chapter, video or lesson, write down three
  questions you think it will answer and your best guess at each. Then read.
  Being wrong is the point.
- **Source.** Richland, Kornell & Kao 2009, **10.1037/a0016496** — five
  experiments, pretesting beat extended study **even on items the pretest failed
  to retrieve**, with attention-direction confounds designed out.
- **Grade B, not A**: five experiments from one lab on one expository passage;
  the classroom-scale evidence is much thinner than for post-study testing.
- **Shape.** Weekdays, or whichever days the person studies · 3–5 minutes ·
  `anchor` should attach to the **start** of the existing study block, so
  `fixed` at the same time as `blank-page-recall` minus the session length, or a
  `wake` offset matching the person's study slot · `energy: 'any'` ·
  `tier: 'could'`.
- **Flags.** The safety line writes itself and it is the warm kind: *you are
  supposed to get these wrong — a wrong guess is what makes the right answer
  stick.* No health caution needed.

### C3. One behaviour, one cue, sixty days — **B**

- **The practice.** Choose one small behaviour and one cue you meet every day —
  a routine ("after I put the kettle on") or a time ("at 7am"), whichever you
  will actually notice. Do it in response to that cue, daily, and expect about
  two months before it stops taking a decision.
- **Source.** Lally et al. 2010, **10.1002/ejsp.674**; Keller et al. 2021 RCT,
  **10.1111/bjhp.12504**, n = 192; Singh et al. 2024 meta,
  **10.3390/healthcare12232488**, 20 studies / 2,601 participants, SMD 0.69;
  Ma et al. 2023, **10.1186/s12966-023-01493-3**, SMD 0.31.
- **Grade B, not A**: outcomes are self-reported automaticity, 11 of Singh's 20
  studies are high risk of bias, and Ma has only 10 studies.
- **Shape.** Daily, all seven · 5 minutes · anchor kind is **deliberately the
  person's choice**, because Keller found routine-based and time-based cues
  equally effective and that is a verified null, not a gap · `tier: 'should'`.
- **Flags — and this one matters.** **`neverNag: true`, and for once the
  justification is empirical rather than kind:** Lally found that missing one
  opportunity did not materially affect habit formation. The card should say the
  number honestly too — **not "66 days"**, but *most people land somewhere
  between two and four months, and the measured spread runs from about three
  weeks to most of a year*.

### C4. Sleep is the second half of the session — **B**

- **The practice.** When you are learning something physical — an instrument, a
  lift, a language's pronunciation, a craft — put the hardest new session on a
  day you will sleep normally afterwards, not the night before a 4am start.
- **Source.** Schmid et al. 2020, **10.1016/j.neubiorev.2020.07.028** — 48
  studies, 53 sleep groups (n = 829) vs 53 wake groups (n = 825), **g = 0.43**.
- **Grade B, not A**: the tasks are finger tapping and mirror tracing, and the
  scheduling instruction itself has never been tested.
- **Shape.** This is a **scheduling constraint rather than a session**. Cleanest
  as a weekly 5-minute planning prompt · `anchor: { kind: 'fixed' }` Sunday
  evening · `tier: 'could'`. Gate 3 should consider whether the planner can
  express it as a rule instead of a card.
- **Flags.** **Cross-pillar: cross-reference the recovery round rather than
  duplicating.** Recovery's `protocols.ts` was read and contains **no
  consolidation card** — its twelve sleep entries are all about sleep
  opportunity, shift work, light and trackers. This belongs to skill because the
  behaviour it changes is when you practise. `goalDomains` should carry both.
  No safety note beyond the standing sleep-advice boundary.

### C5. Learn the ground before the technique — **D**

- **The practice.** Before buying another book on how to study a subject, spend
  a session just getting the basic map of it — the names, the shape, the
  vocabulary. Comprehension technique cannot compensate for not knowing what the
  passage is about.
- **Source.** Recht & Leslie 1988, **10.1037/0022-0663.80.1.16** — n = 64,
  prior knowledge had a main effect on every measure and **did not interact with
  reading ability**; poor readers who knew baseball beat good readers who did not.
- **Grade D, not C**: one study, 64 children, one domain, 1988, never tested as
  an adult self-study strategy.
- **Shape.** Once, at the start of a new subject, rather than recurring · 30
  minutes · `anchor: { kind: 'fixed' }` · `tier: 'could'`.
- **Flags.** None. It is a framing card and it is free.

### C6. Finish on one you got right — **E**

- **The practice.** When the session is nearly over, do one repetition you know
  you can do well, and stop there.
- **Source.** **None directly.** Gate 1 claim 96 (Josh Waitzkin, Tim Ferriss Show
  #375). The overnight-consolidation half is supported in general
  (**10.1016/j.neubiorev.2020.07.028**); the specific claim that the *last*
  repetition is preferentially consolidated is **UNVERIFIED** — nothing found in
  this round tests it.
- **Grade E, and the copy must say so** in the library's usual warm register:
  this is a craftsman's habit, not a finding, and the reason to do it is that it
  is a better place to stop.
- **Shape.** Attaches to whatever practice session already exists rather than
  standing alone · 2 minutes · `tier: 'could'`.
- **Flags.** Do **not** write the consolidation mechanism as though it were
  established. That would be the exact error this pipeline exists to catch.

### Declined, and why

| Candidate | Why not |
|---|---|
| **Self-controlled practice** — let the learner choose when they get feedback | McKay et al. 2023, **10.1080/1750984x.2023.2207255**: naïve g = 0.44 (k = 52, N = 2,061) collapses to **g = 0.02 [−0.17, 0.21]** once unpublished experiments are included, with publication status explaining 48% of heterogeneity and a p-curve lacking evidential value |
| **Growth-mindset self-talk** | Macnamara & Burgoyne 2023, **10.1037/bul0000352**: d = 0.05 overall, non-significant after bias correction; d = 0.02 in the highest-quality subset. Goes to section D instead |
| **A reconsolidation / memory-rewriting practice** | Gate 1 claim 34 records Ranganath saying plainly that the human evidence is far weaker than the animal work. His restraint is the finding. Not written |
| **Value-directed remembering** ("decide in advance what is worth remembering") | Gate 1 gives **10.3758/BF03194325** for this. That DOI is Castel, Benjamin, Craik & Watkins 2002, *"The effects of aging on selectivity and control in short-term recall"* — an ageing study using the point-value technique, not a demonstration that pre-deciding what matters improves ordinary study. The practice may well be sound; **the citation does not support it** and no substitute was verified this round |
| **Study somewhere new / novelty at encoding** | Gate 1 claim 37. Not traced to a specific paper in this round; the dopaminergic-tagging mechanism is animal work. Left for a later round |
| **A "learn a language / instrument as an adult" card** | The brief names adult learners as a gap and it is a real one. Nothing verified here is specific to adults — Recht & Leslie is children, Rohrer is seventh-graders, Cepeda is undergraduates. Declining rather than dressing up a general finding as an adult-specific one |

---

# D. TIME BACK

Six items against roughly thirty returned — five new cards, five regrades,
twenty-two cards re-checked. That is at the low end of the README's one-in-five,
which is right for a pillar whose good news is the point.

Two of these extend `LEARNING_ANTIPATTERNS`, which already carries highlighting,
rereading and learning styles.

### D1. Buying a planner to fix procrastination

**What people can stop.** Buying the app, the colour-coded calendar, the
time-blocking course, on the theory that procrastination is a scheduling failure.

**The evidence.** Two meta-analyses of procrastination interventions — van Eerde
& Klingsieck 2018 (**10.1016/j.edurev.2018.09.002**, 24 studies, k = 44,
N = 1,173) and Rozental et al. 2018 (**10.3389/fpsyg.2018.01588**, 12 studies,
21 comparisons, N = 718) — both find that **the cognitive-behavioural approach
outperforms the alternatives**. Rozental: overall g = 0.34 [0.11, 0.56] with
I² = 61%, and the CBT subgroup g = 0.55 [0.32, 0.77] with heterogeneity gone.
Neither found a scheduling or self-regulation approach on top.

**Stated honestly**, because Gate 1's source overstated it: neither paper
names time-management training as *the least effective* approach. What they show
is that it is not the winner, and that the thing that works addresses how you
feel about starting rather than when you have pencilled it in.

**What the person gets back.** The money and the setup evenings. And a better
target: the lever is the first two minutes and the feeling attached to them.

### D2. Growth-mindset self-talk as a performance lever

**What people can stop.** Working on believing that ability is malleable, as a
technique for doing better at things.

**The evidence.** Macnamara & Burgoyne 2023, *Psychological Bulletin*
149(3–4):133–173, **10.1037/bul0000352**: 63 studies, N = 97,672, overall
**d = 0.05 [0.02, 0.09]**, **non-significant after correcting for publication
bias**; in the 13 studies that demonstrably shifted mindsets, d = 0.04, ns; in
the 6 highest-quality studies, **d = 0.02 [−0.06, 0.10]**. Authors with a
financial incentive published significantly larger effects. The friendlier
meta-analysis in the same issue (Burnette et al., **10.1037/bul0000368**, 53
samples) gets d = 0.14 for academic achievement only in targeted subsamples
under high implementation fidelity, with a 95% prediction interval of −0.08 to
0.35.

**What the person gets back.** The minutes, redirected to retrieval practice,
which is not small. Say it kindly: believing you can improve is a fine thing to
believe and it is probably true. It is just not the lever.

**Proposed:** add to `LEARNING_ANTIPATTERNS`.

### D3. Brain training and "cognitive" games for transfer

**What people can stop.** Paying for brain-training subscriptions, or playing
action games, in order to get better at thinking generally.

**The evidence.** Sala, Tatlidil & Gobet 2018, *Psychological Bulletin*
144(2):111–139, **10.1037/bul0000139**: three meta-analyses (k = 310, 315 and
359) all returning small or null effects, and **no evidence of a causal
relationship** between playing video games and enhanced cognitive ability. The
authors place it alongside working-memory training, music and chess as another
instance of the general failure of far transfer.

**What the person gets back.** The subscription, and the belief that the way to
get better at your actual thing is some other thing. Practise the thing.

**Proposed:** add to `LEARNING_ANTIPATTERNS`.

### D4. Worrying about handwriting versus laptop notes

**What people can stop.** Rewriting notes by hand, or feeling guilty for typing,
on the strength of the famous pen-versus-keyboard result.

**The evidence.** Morehead, Dunlosky & Rawson 2019, *Educational Psychology
Review* 31(3):753–780, **10.1007/s10648-019-09468-2** — a preregistered
replication and extension of Mueller & Oppenheimer 2014. **PARTLY VERIFIED**
(Crossref record confirmed; abstract read from publisher and secondary sources,
not from Europe PMC or OpenAlex, which do not carry it). Test performance did
not consistently differ between conditions — **including a group that took no
notes at all** — and a meta-analysis of the direct replications found small,
non-significant effects favouring longhand.

**What the person gets back.** The transcription evenings. Use whichever you
will actually review, and spend the saved time on `blank-page-recall`, where the
evidence is not equivocal.

**Because this one is PARTLY VERIFIED, write it as "you can stop worrying about
this", never as "that study was wrong".**

### D5. Chasing the perfect internal cue — and the honest update to the external one

**What people can stop.** Believing there is a right place to put your attention
that unlocks the movement, and hunting for it.

**The evidence.** The internal-focus half of the antipattern is already in the
library and is unaffected. What is new is that the *external* half has moved
too: McKay et al. 2024, **10.1037/bul0000451**, found moderate-to-strong
publication bias across seven prior meta-studies and, after correction, effects
of g = 0.01 to 0.15 with Bayes factors favouring the null.

**What the person gets back.** The search. One cue, aimed at what you want to
happen, and then get on with the reps — and the freedom to stop if a different
cue suits you, because the literature does not actually know which is better.

**This is the one item here that is a softening rather than a debunk**, and the
copy has to hold that: the advice is unchanged, the certainty is not. See B2.

### D6. Photographing things you want to remember

**What people can stop.** Photographing the museum label, the whiteboard, the
recipe, instead of looking at it.

**The evidence.** Henkel 2014, *Psychological Science* 25(2):396–402,
**10.1177/0956797613504438**: two guided-museum-tour studies; photographing an
object whole meant remembering fewer objects, fewer details and worse locations
than simply observing. **But zooming in to photograph one specific part
eliminated the effect entirely**, and memory for the parts *not* zoomed in on
was just as good.

**What the person gets back.** Fifteen seconds of actually looking. And the
escape hatch is the interesting half — a photograph taken as an act of attention
does no harm at all. **The card must say the later literature is mixed.**

### Regrade inputs, not time-back — recorded so nobody writes them as debunks

- **Retrieval practice does not transfer as far as the headline implies**
  (Pan & Rickard 2018, **10.1037/bul0000151**, d = 0.40 [0.31, 0.50] but the
  bias-corrected intercept often indicates no transfer absent the moderators).
  This does not mean stop doing retrieval practice. It means do not promise it
  makes you better at things you never practised.
- **Deliberate practice explains a fifth of the difference in sport, not all of
  it** (Macnamara 2014/2016). Nobody should practise less because of this.

---

# E. ATTRIBUTION

Per METHOD: **populariser credits** must trace to something opened;
**researcher credits** require that person on the author list of a source in the
card's own `sources.md` row, verified at Crossref. Every author list below was
read from `harvest.js crossref` output in this round.

## E1. Credits to ADD

| Card | Add | Kind | Basis |
|---|---|---|---|
| `blank-page-recall` | **Andrew Huberman** | populariser | Gate 1 claim 29 and its section E: School of Greatness, /andrew-huberman-the-1-reason-why-faith-based-practices-matter-when-it-comes-to-your-mental-health — he teaches that learning is better understood as not-forgetting and that self-testing is the highest-yield study behaviour. That is this card's practice, stated as this card states it. **The library's best-evidenced card carries none of the corpus's recognisable names; this fixes it** |
| `spaced-review` | **Nicholas Cepeda**, **Harold Pashler** | researcher | First and second author of **10.1037/0033-2909.132.3.354** and of **10.1111/j.1467-9280.2008.02209.x**, the two papers the A grade rests on. Author-list rule satisfied twice over. A missing credit, not a false one |
| `spaced-review` | **Robert Bjork** — **conditional** | researcher | Currently **fails** the author-list rule (not on Cepeda, not on Dunlosky 2013). Becomes valid the moment the card cites **10.1146/annurev-psych-113011-143823** (Bjork, Dunlosky & Kornell 2013), which it should |
| `skill-interleaved-drills` | **Robert Bjork**, **Richard Schmidt** — **conditional** | researcher | Both currently fail. Both become valid by citing **10.1111/j.1467-9280.1992.tb00029.x** (Schmidt & Bjork 1992), one lookup, and it is the field's founding statement |
| `interleaved-practice` | **Kelli Taylor** | researcher | On the author list of **10.1007/s11251-007-9015-8** (Rohrer & Taylor 2007), the origin paper. Rohrer already credited and valid |
| `skill-mental-rehearsal` | **Deborah Feltz** — **conditional** | researcher | Valid only if the card cites **10.1123/jsp.5.1.25** (Feltz & Landers 1983). Otherwise the credit comes off |
| `reflective-listening-rep` | **Adam Grant** | populariser | Gate 1 claim 81, 10% Happier #321 — he teaches the motivational-interviewing rule that whether you reflect back sustain talk or change talk decides which grows. Sharpens the practice as well as crediting it. **William Miller** already on the card is author-list-valid only if a Miller & Rollnick source is cited |

## E2. Credits to REMOVE

| Card | Remove | Why |
|---|---|---|
| `ship-monthly` | **Dan Ariely**, **Klaus Wertenbroch** | Their paper, **10.1111/1467-9280.00441**, is **retracted** — `DO_NOT_CITE`, Europe PMC type "Retracted Publication". Both credits are now invalid under the author-list rule, and `RETRACTIONS.md` carries a standing rule on this author |
| `skill-mental-rehearsal` | **Andrew Huberman** | **UNTRACED.** Gate 1 opened seven Huberman episodes across four shows and traced no mental-rehearsal claim to him. Per METHOD an untraced credit comes off unless Gate 4 can trace it |
| `questions-not-highlights` | **Barbara Oakley** — flagged, not decided | **UNTRACED in this corpus.** She is a genuine populariser of exactly this material (Learning How to Learn), but Gate 1 found no episode and this round found no source with her on the author list. Gate 4 should trace her to something specific or take the credit off |
| `questions-not-highlights` | **Henry Roediger** — **conditional** | Not on Dunlosky et al. 2013. Valid the moment the card cites **10.1111/j.1467-9280.2006.01693.x** |

## E3. Cards that should ship with EMPTY or researcher-only attribution

Gate 1's structural finding was that **eleven of the strongest names in the two
briefs have zero episodes between them in a 434-row corpus** — Robert and
Elizabeth Bjork, Roediger, Karpicke, Rohrer, Wulf, Guadagnoli among them. It
also confirmed **zero routed episodes** for spaced repetition, deliberate
practice, learning styles or interleaving. This round's new cards inherit that.

| New card | Attribution |
|---|---|
| **C1 Let the gap stretch** | Researcher-only: **Nicholas Cepeda**, **Harold Pashler**, **Doug Rohrer** — all three on **10.1111/j.1467-9280.2008.02209.x**. **No populariser.** Nobody in the corpus teaches spacing dose |
| **C2 Guess before you read** | Researcher-only: **Lindsey Richland**, **Nate Kornell** — both on **10.1037/a0016496**. **No populariser** |
| **C3 One behaviour, one cue, sixty days** | Researcher: **Phillippa Lally** — on **10.1002/ejsp.674** and on **10.1111/bjhp.12504**, so valid on either source. Populariser: **James Clear**, traced by Gate 1 to The Drive #183 for environment-and-cue design over willpower — but **only if the card's copy stays on cue-and-repetition and does not carry identity framing**, which Clear himself says on that episode is the least scientific part of his book (Gate 1 claim 43) |
| **C4 Sleep is the second half of the session** | **Empty.** No communicator in the corpus teaches practice-session scheduling around sleep. Schmid et al. are not names anyone will recognise, and a researcher credit nobody knows adds nothing |
| **C5 Learn the ground before the technique** | Researchers **Donna Recht** and **Lauren Leslie** — both on **10.1037/0022-0663.80.1.16**. Populariser **Ryan Holiday**, traced by Gate 1 (claim 114) to On Purpose. This is a clean case where the populariser genuinely teaches the specific study |
| **C6 Finish on one you got right** | **Josh Waitzkin**, via **Tim Ferriss** — Tim Ferriss Show #375, traced by Gate 1 (claim 96). It is his method and the card should say so, which is also the honest way to grade it E: this is a great practitioner's habit, not a result |

## E4. Named-risk check for this pillar

Nothing new. Gate 1 confirmed no Sinclair, Peterson, Robbins or Walker content
in the mind/skill corpus and proposed no credit for any of them; this round
proposes none either. The two Peterson sole-attributions Gate 1 found are both
**connection**-pillar cards (`friend-reach-out`, `one-on-one-child`) and are out
of scope here — flagged onward, unchanged.

Two of the additions above are Andrew Huberman credits, and the roster's rule is
use freely, verify hard. Both were verified: one is **added** because Gate 1
traced him teaching exactly the practice, and one is **removed** because Gate 1
traced him teaching no such thing. That is the rule working in both directions in
the same round.

---

# F. ADDITIONS PROPOSED TO `RETRACTIONS.md`

The register asks each round to add what it finds, with the replacement claim
recorded beside it. Three entries.

**1. A retracted paper found inside the skill pillar, not just money.**
Ariely & Wertenbroch 2002 (**10.1111/1467-9280.00441**) is already listed as
hitting the money round. It is also the entire evidence base of the skill card
`ship-monthly`. **Add a line to the existing row: this retraction reached two
pillars, and it was found in the second one only because a later round
cross-checked its own cards against the register.** The lesson for the next
round is that a retraction entry is a search term for every existing card, not
just for the round that found it.

**2. New row under "overturned or seriously contested".**

| Claim as it circulates | Original | What actually holds |
|---|---|---|
| An external focus of attention (on the effect of the movement) is reliably better than an internal one (on the body part) | Seven meta-studies, most comprehensively Chua, Jimenez-Diaz, Lewthwaite, Kim & Wulf 2021, 10.1037/bul0000335, reporting g = 0.26 to 0.58 | McKay et al. 2024, 10.1037/bul0000451, robust Bayesian reanalysis of those same data: moderate-to-strong publication bias in every analysis; bias-corrected g = 0.01 (performance), 0.15 (retention), 0.09 (transfer), 0.06 (EMG), −0.01 (distal vs proximal); Bayes factors favour the null throughout (BF01 1.3–5.75). Real heterogeneity remains, so say "it depends and nobody knows on what", never "external focus is better" |

**3. Second new row, same section.**

| Claim as it circulates | Original | What actually holds |
|---|---|---|
| Letting learners control their own practice or feedback schedule improves motor learning | The self-controlled-practice literature, naïve pooled g = 0.44 (k = 52, N = 2,061) | McKay, Bacelar, Parma, Miller & Carter 2023, 10.1080/1750984x.2023.2207255: publication status explains 48% of heterogeneity; pooling four experiments including three unpublished gives g = 0.02 [−0.17, 0.21]; the p-curve lacks evidential value |

**Also worth recording as a near-miss, not a retraction:** Gate 1 attributed the
deflating growth-mindset meta-analysis to "Macnamara and Burgoyne 2023,
doi:10.1037/bul0000368". That DOI is **Burnette et al.**, a different paper by
different authors in the same double issue, reaching a **more favourable**
conclusion. Both are real, both are clean, and citing the wrong one would have
put a deflating result under the wrong author list — which is the author-list
rule failing in a way nobody would have noticed. The correct DOI is
**10.1037/bul0000352**. This is the same shape of error as the
Panagioti-2017-versus-2018 trap already in the register: **check the DOI, never
the author-year.**

---

# G. WHAT THIS ROUND CHECKED, AND THE TALLY

**42 DOIs put through the full chain** — Crossref registry record and retraction
check, then Europe PMC or OpenAlex for abstract, design and n. Plus seven
Crossref bibliographic searches to resolve papers Gate 1 could not locate or
located wrongly (Ammar 2023, Macnamara & Burgoyne 2023, Tewfik 2022, Recht &
Leslie 1988, Schmidt & Bjork 1992, Feltz & Landers 1983, Oppezzo & Schwartz
2014), and two targeted web lookups where no free index carried the abstract
(van Eerde & Klingsieck via the University of Amsterdam repository; Morehead
2019).

**Opened and deliberately not used:** Theobald et al. 2020,
**10.1073/pnas.1916903117** — active learning narrowed achievement gaps by 33%
in exam scores (15 studies, 9,238 students) and 45% in pass rates (26 studies,
44,606 students); verified and clean. It is strong evidence about *teaching
format*, and this library writes practices a person schedules for themselves, so
it earns a line in `findings.md` as the anti-learning-styles argument stated
positively, and nothing more. Europe PMC sweeps for elaborative interrogation
and for generation-effect meta-analyses returned nothing usable in this pillar
beyond Dunlosky's own review.

**Retraction results.** One `DO_NOT_CITE` (Ariely & Wertenbroch 2002), caught by
the title-prefix check exactly as `RETRACTIONS.md` warns — its Crossref
`relation` field would have said nothing. Every other paper clean on all three
signals: Crossref relation, Crossref title prefix, OpenAlex `is_retracted`.

**Verification status of the ledger.**

| Status | Count | Notes |
|---|---|---|
| **VERIFIED** — design, k/n and headline number all confirmed at a named source | 24 | Every paper carrying an A or B grade decision: Cepeda 2006 and 2008, Pan & Rickard 2018, Brunmair & Richter 2019, Rohrer 2015, Chua 2021, McKay 2024, Czyż 2024, Macnamara 2014 and 2016, Lally 2010, Keller 2021, Singh 2024, Ma 2023, Schmid 2020, Paravlic 2018, Donovan & Radosevich 1999, Sio & Ormerod 2009, Recht & Leslie 1988, Dunlosky 2013, Pashler 2008, Sala 2018, Rozental 2018, Theobald 2020 |
| **VERIFIED, retraction** | 1 | Ariely & Wertenbroch 2002 — `DO_NOT_CITE` at Crossref, "Retracted Publication" at Europe PMC |
| **PARTLY VERIFIED** — record and design confirmed, one or more numbers not confirmable at any free index | 12 | Rowland 2014 (k), Adesope 2017 (k), Roediger & Karpicke 2006 (n), Rohrer & Taylor 2007 (all), Ammar 2023 (all), McKay 2023 (numbers), van Eerde & Klingsieck 2018 (via repository), Gollwitzer & Sheeran 2006 (effect size), Morehead 2019 (all), Richland 2009 (n), Henkel 2014 (n), Ericsson 1993 (a theory paper — nothing to verify beyond the record) |
| **RECORD ONLY** — resolved by Crossref bibliographic search to repair an attribution, not to set a grade | 3 | Schmidt & Bjork 1992, Feltz & Landers 1983, Oppezzo & Schwartz 2014 |
| **UNVERIFIED** | 2 | Tewfik 2022 (truncated abstract; a mind-pillar card in any case) and the "end on a good rep" mechanism, which has no paper at all |

The **PARTLY VERIFIED** rows are concentrated in APA and Elsevier education
journals that elide abstracts from every free index — the exact failure mode
`SOURCES.md` documents. **None of them carries a grade on its own**: in every
case a VERIFIED paper does the grading work and the partly-verified one
corroborates.

## Grade distribution after this round

| | Now | After |
|---|---|---|
| A | 2 | **2** |
| B | 9 | **7** (−2: external cue → D, interleaved drills → C) |
| C | 7 | **7** (−1 ship-monthly → E, +1 interleaved drills) |
| D | 3 | **4** (+1 external cue) |
| E | 1 | **2** (+1 ship-monthly) |
| **Total existing** | 22 | 22 |
| **New candidates** | — | B ×4, D ×1, E ×1 |

Existing cards, after regrade: **A 2 · B 7 · C 7 · D 4 · E 2** — 41% A+B,
against the pillar's previous 50%. Including the six new candidates:
**A 2 · B 11 · C 7 · D 5 · E 3**, which is 46% A+B for 28 cards. That is higher
than the Work round's post-correction 42%, and it should be: this pillar has two
findings with 300-plus experiments behind them and Work has none. **Every A here
is a case where the practice on the card is the manipulation in the studies**,
which was the test set for this round and the one the first Work draft failed.

## What the Skill coach can say on a Tuesday that it could not before

- *"One missed day does not undo this."* Not encouragement — Lally measured it.
- *"Either anchor works. Pick the one you'll notice."* Keller randomised 192
  people to routine-based versus time-based cues and found no difference.
- *"Most people are somewhere between two and four months, and the spread is
  huge."* Instead of 21 days, or 66.
- *"Guess first, get it wrong, then read."* Five experiments, and it works even
  on the items you failed to retrieve.
- *"Let the gap stretch as it sticks — and if you need this in a year, the gap
  should be months, not days."*
- *"Interleave the things you could mix up. Blocking is fine for everything
  else."* Now a rule with a number behind it rather than "add variety".
- *"Put the hard new session on a night you'll sleep."*
- *"Practice explains about a fifth of the difference between athletes. That is
  the largest thing you control, and it isn't everything — both halves are good
  news."*
- And, in the honest register the library trades on: *"We had this one graded
  too high. A 2024 reanalysis found the studies behind it were selectively
  published. The advice hasn't changed; our confidence has."*

## Handover to Gate 3 and Gate 4

1. **Fix `ship-monthly` first.** It cites a retracted paper and credits its
   authors. Everything else in this file can wait a round; that cannot.
2. **The four conditional attributions** (Robert Bjork ×2, Richard Schmidt,
   Deborah Feltz) are each fixed by adding one already-identified DOI to a
   `sources.md` row. Cheap, and it brings four cards into compliance with the
   author-list rule.
3. **C4 is a scheduling rule wearing a card's clothes.** Gate 3 should decide
   whether the planner can express "don't put the hard new session before a
   short night" as a constraint rather than as a fifth thing in someone's week.
4. **Cross-pillar:** C3 (habit formation) overlaps the mind pillar's habits
   cluster and `protocols.habits.ts`; C4 overlaps recovery, which has no
   consolidation card. One card each, multiple `goalDomains`, per PIPELINE Gate 3.
5. **`LEARNING_ANTIPATTERNS` gains two entries** (growth-mindset self-talk;
   brain training and far transfer) and one sharpening (learning styles: name
   the meshing hypothesis, and keep Pashler's own caution that many versions
   have simply never been tested).
