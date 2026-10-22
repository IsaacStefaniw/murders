# Position — Product Research

Owns the evidence. Reproduced every §2 figure on 22 Oct 2026 before
writing a word of this.

---

## 1. Position (400 words)

§2's decay section was corrected today, while I was measuring it. The
correction stopped one subsection short. Three numbers still do not
reproduce:

| | brief says | prints today |
| --- | --- | --- |
| `usertest:statedtime` | 36 of 63 drift 15+ min, 28 an hour or more | **46 of 72, and 35 an hour or more** |
| `usertest:atwork` | 8.6% of items inside working hours | **10.5%** |
| `usertest:coachvalue` | Training 148 items, 79 done | **161 / 83.** Nutrition still **0 / 0 / 0** |

All three moved the way the decay figures moved: worse. §8 says a
proposal citing no §2 number will be discarded. §2 is handing five roles
three numbers wrong by 12 to 28 per cent. Fix §2 first.

The corrected decay table also holds a mechanism nobody has read out.
`career_optimiser` is not merely the only decliner. He carries the
**largest plan in the cohort — 1003 items — the fewest weekly changes
(2), and 18 user moves**, against `new_parent`'s 123 and
`entrepreneur`'s 181. The app plans more for Alex than for anyone and
adapts less. §2's story is "the climb is the app learning them." For the
one customer, it barely learns. `atwork` says it from the other side: 6
of his routines clash with work — the most of any persona — on only 2%
of items. His clashes are few, concentrated, and unresolved.

The problem is not that levels are invisible. The ladder
is real, and `usertest:depth` shows `/life` already says *"Training and
Habits & urges are running. The other five are not"* at zero scrolls.
The app is honest and it is not enough. The same script says `/plan`
cannot answer *"is today a gym day, and when?"* at all.

Nutrition is where the attack belongs. Of its four promised claims,
three survive this project's citation standard; the fourth is held in
place by a unit test. Nutrition is also the coach with 0 items in six
weeks, which pins its four-rung ladder at `foundation` by construction:
`completionEvidence` counts days with a completed routine on the path's
own goal; nutrition starts none, so sessions = 0 for ever.

**Nutrition does not need a ladder or a better promise. It needs one
thing that completes.**

Ten people in TestFlight outrank all of this, including the three
numbers I just corrected.

---

## 2. The one thing I would build first

**A nutrition session that completes and counts.** Concretely: the
fifteen-minute weekly `meal-sketch` as a real session with a route, and
`post-meal-walk` as a daily routine the nutrition path actually starts —
both writing completions against the nutrition goal so
`store.ts:2041`'s `doneDates` is non-empty.

Why this one, over surfacing the ladder, over the nutrition artefact,
over week one:

- It is the only change that moves four measurements at once:
  `coachvalue`'s nutrition row off 0/0/0, the ladder off `foundation`,
  `depth`'s unanswered `/plan` question, and the `commitmentBudget`
  return state, which currently has nothing nutritional to offer a
  person coming back.
- It needs **no new evidence claim.** Both practices are already in
  `protocols.ts` at grade B with primary sources traced in
  `docs/research/output/nutrition/ledgers/gate2.md`. Every other
  nutrition proposal on the table requires inventing a claim.
- It is the precondition for everything else in §6 and §7. A four-week
  nutrition block, upper-rung practices from the other five coaches,
  levels on Today — all three are display layers over a counter that is
  currently stuck at zero. Build the counter first.

The brief's own law says it: *a coach is worth coming back for when it
owns a progressing artefact.* A progressing artefact requires something
to progress. Nutrition has a promise, a plan, levers, a hub and a
ladder, and no event.

---

## 3. What is wrong with the proposed resolution in §5

The principle is right and I verified it in the code rather than
agreeing with it. `completionEvidence` (`level.ts:425`) sets
`weeks: distinctWeeks(doneDates)`, and `distinctWeeks` (`level.ts:439`)
counts only ISO weeks containing a completion. A bad fortnight accrues
no weeks and loses no rung. **§5's claim that a bad fortnight costs you
time to the next rung and never the rung is mechanically true today.**
Credit where it is due.

Two things are wrong.

### (a) §5's supporting citation is overstated by roughly four times, in the direction of its own conclusion

§5 leans hardest on *"decoupling streak maintenance from the daily goal
reported >40% more 7-day streaks."* That is not Duolingo's figure.
Duolingo's own published numbers for that test are **+3.3% D14
retention, +1% daily active learners, +10.5% more daily learners on a
streak in 20 days, and +19% for new learners.** The ">40%" traces to a
third-party design blog. Separately, *"attracted the least active
users"* does not appear in Duolingo's post; the traceable version is a
Duolingo product leader saying DAU did not budge and *"no one felt that
doing a single exercise counted as doing Duolingo."* The conclusion —
the standard needed to be clearer, not lower — survives. The number does
not, and a brief that disqualifies vendor blogs cannot rest its central
argument on one.

Worse for §5's framing: the largest result Duolingo reports is **Streak
Wager, +14% D7 — a loss-framed mechanic.** You stake in-game currency
and lose it if you break the streak. §5 cites Duolingo for *nothing
should be losable* while Duolingo's own best-performing published test
is a wager.

### (b) The corollary, not the principle, is the error

> *"A ladder you have climbed is a record. Show the rungs behind as well
> as the one ahead."*

Because the ladder is monotonic, that screen **cannot change when the
person's life does.** Someone four weeks into doing nothing sees the
identical screen they saw the day they stopped. §5 solves "don't punish
the bad week" by making the bad week invisible.

The churn datum is not *it punished me.* It is **"I opened it and it was
wrong."** A record that cannot move down cannot notice. And the one
primary RCT of exactly this mechanic says the noticing is the active
ingredient: Rewley et al. (*Games for Health Journal* 2021;10(6):430–436,
602 participants, NCT03311230) analysed STEP UP's three level-based
gamification arms — 70 points allocated weekly, 10 lost per missed day —
and concluded participants exhibit loss aversion *"so long as the loss
relates to something that was earned rather than endowed."* §5 removes
precisely the earned loss that sentence identifies.

**I am not arguing for losable rungs**, and the caveat matters: in STEP
UP the effect did not survive the 12-week follow-up in any arm except
competition. The loss mechanic bought behaviour during the intervention
and did not outlive it, which is the exact failure rule 1 exists to
prevent.

What is missing is a third element that is neither a rung nor a loss:
**the app saying what it has observed about the last fortnight, beside
the rungs, without grading it.** `planner/learnedStart.ts` already does
exactly this for times — it reports the observed value, explains the gap,
and refuses to overwrite the person's stated request. That pattern is
built, argued through and shipped. §5 should adopt it rather than invent
a display.

---

## 4. Falsifiable prediction

### The measurement I would write next

`tools/usertest/ladder.test.ts` — the sixth script, roughly the
twenty-minute job the role description promises. For all eleven personas
across twenty-six weeks, call the same `pathLevelState` path the app
calls (`store.ts:2041`) once per week per path, and report: the rung at
weeks 4, 12 and 26, and **the count of weeks in which any displayed rung
changed.**

### The prediction

If my position is right:

1. `career_optimiser`'s **nutrition rung is `foundation` at week 4, week
   12 and week 26 — zero changes in twenty-six weeks.**
2. Across all eleven personas and all seven paths, the **median number
   of weeks in which a displayed rung changes is ≤ 3 of 26.**
3. **Training is the only path whose rung changes more than twice** for
   any persona.

### What kills it

If nutrition reaches `developing` (10 sessions across 4 distinct weeks)
for **any** persona by week 12, then the ladder is a live surface rather
than a setting, "pinned by construction" is wrong, and §5's display
should be built and I should be ignored. If the cohort median rung-change
count is ≥ 8 of 26, the same.

### The TestFlight version

If surfacing the ladder is the lever, the rung line should be among the
most-tapped elements on Today. My prediction: **fewer than 2 of 10
testers tap the rung line in week 2 or later**, because it has not
changed since they last looked. Five or more and I am wrong.

### For each other proposal on the table, the result that would falsify it

| proposal | what would kill it |
| --- | --- |
| §1, two coaches are the product | Nutrition started and still contributing < 10% of completed items at week 12 in `coachvalue` — i.e. it is a second door, not a second coach |
| §5, levels as the spine | the ladder script above, either falsifier |
| §6, nutrition needs a four-week block | a nutrition block built and `decay` showing `career_optimiser` still negative over 26 weeks — then the artefact was never the lever |
| §7, other coaches as practices and interrupts | `coachvalue` after the merge showing the five absorbed coaches contributing fewer completed items than the 12 + 6 Habits and Relationship manage today as standalone doors |
| §2's week-one thesis | a smaller week-one plan that does not raise pooled week 1 above 43% — the climb was never about plan size |

---

# Appendix — sources, grades and caveats

Every external figure below was found with WebSearch in this session and
the source is named. Where I read only a search engine's rendering of a
page rather than the page, I say so. Where I found nothing, Appendix C
says nothing.

## A. §5 — accumulated progress versus loss-framed mechanics

| claim | grade | source | caveat |
| --- | --- | --- | --- |
| In this codebase, a bad fortnight costs time to the next rung and never the rung | **verified in code, not an outcome claim** | `src/features/paths/level.ts:425` `completionEvidence`, `:439` `distinctWeeks`, consumed at `src/state/store.ts:2041` | A fact about the implementation. No evidence either way that users prefer it, or notice it |
| Loss of **earned** progress drives behaviour change within an intervention | **B** — one RCT secondary analysis, named registration, 602 participants | Rewley J, Guszcza J, Dierst-Davies R, Steier D, Szwartz G, Patel M. *Loss Aversion Explains Physical Activity Changes in a Behavioral Gamification Trial.* Games for Health Journal 2021;10(6):430–436, doi 10.1089/g4h.2021.0130. NCT03311230 | Secondary analysis of a trial not designed to test framing. Levels plus weekly point allocation (70 points, −10 per missed day), so losability is confounded with the weekly reset. **The effect did not survive the 12-week follow-up in any arm except competition.** Paywalled: I read the abstract and publisher record, not the full text |
| Gamification increases physical activity | **B** | Meta-analysis of 16 RCTs, 2,407 participants: Hedges **g = 0.42, 95% CI 0.14–0.69** (JMIR 2022, *Evaluating the Effectiveness of Gamification on Physical Activity*) | Heterogeneous, downgraded for risk of bias by the authors' own reply, and it pools whole interventions. **No component is isolated** — points, levels, badges, competition and social support are never separated |
| Reward-feedback mechanics (points, badges) specifically help | **C** | Children/adolescent systematic review: pooled **SMD 0.15, 95% CI 0.01–0.29** on moderate-to-vigorous activity | Lower bound effectively zero. Children and adolescents, not adults. Described as "superior efficacy" on an effect that barely clears the null |
| Loss framing beats gain framing in general | **contradictory — no defensible direction** | Pro: Patel MS et al., *Framing Financial Incentives to Increase Physical Activity*, Ann Intern Med 2016;164(6), doi 10.7326/M15-1635 — only the loss arm beat control, and on proportion of participant-days hitting the goal, **not mean daily steps**. Con: an adolescent obesity RCT (PMC11478643) found gain framing superior; a smartphone deposit-contract RCT (PMC11042509) called its loss-framing result "unexpected" and worse than gain, urging research on boundary conditions before practice | I opened no full texts. All of these are **financial** incentives, not levels. Populations differ wildly. The 2016 trial drew a published commentary noting no baseline step data, so the generic 7,000-step goal may have been wrong for participants |
| Accumulated / endowed progress increases persistence | **C, and do not quote the numbers** | Nunes & Drèze 2006, endowed progress (car-wash loyalty card, reported ~34% completion with two pre-stamped spaces vs ~19% blank); Kivetz, Urminsky & Zheng 2006, goal gradient, J Marketing Research | **I could not open either paper.** Every figure here comes from secondary summaries that themselves flag the numbers as approximate. Single card cycle, consumer purchase, not health behaviour, and one summary notes the effect was never shown to persist across repeated cycles. **These numbers should not enter the brief** |

### §5's own Duolingo citations, checked

| as cited | status |
| --- | --- |
| Streak Wager, +14% D7 | **Confirmed present in Duolingo's own post** — significant D1/D7/D14 lifts, largest at D7, +14% |
| Weekend Amulet, +4% return a week later, −5% streak loss | **Confirmed.** Caveat: a First Round Review interview reports 2.1% D7 / 4% D14 for the Amulet instead; I could not reconcile the two, and the blog is the better source |
| Decoupling streak from daily goal, **">40% more 7-day streaks"** | **WRONG — not Duolingo's figure.** Their published numbers: **+3.3% D14 retention, +1% DAU, +10.5% more daily learners on a streak in 20 days, +19% for new learners.** The 40% traces to a third-party design blog. The nearest 40% in Duolingo's own post is unrelated: almost 40% of learners active two days running with no streak had the "intense" daily goal |
| One-exercise rule failed and **"attracted the least active users"** | **Half verifiable.** The failure is real — a Duolingo product leader describes DAU not budging and the team concluding *"no one felt that doing a single exercise counted as doing Duolingo."* **The activity-level split is not in any source I found.** It is asserted in §5 and in my own role description, and neither traced it |
| All four | **blog.duolingo.com and making.duolingo.com are DNS-unreachable from this environment.** I read these pages only through a search engine's rendering. Nobody should call them primary-verified until someone opens the page |

## B. The nutrition promise, claim by claim

The promise, at `src/features/paths/definitions.ts:324`:

> *"No diet, no logging. Protein-first dinners decided once a week, a
> walk that blunts the glucose spike, and your own protein number."*

### 1. "No diet" — not an evidence claim

A product constraint, correctly stated as one. No grade applies. Worth
recording that the *outcome* evidence runs mildly the other way: every
controlled feeding trial delivers a pre-specified diet and they achieve
high fidelity — 87% of participant-days for meal timing and 94% for food
consumption in one time-restricted feeding trial (PMC9182754). "No diet"
trades measured efficacy for presumed adherence. That is a legitimate
trade for this persona and **no screen says it is a trade.**

### 2. "No logging" — the evidence points the other way, and the app's version of the trade is still the right one

- Digital self-monitoring of diet and activity: mean weight loss
  **2.87 kg** (Berry et al., *Obesity Reviews* 2021, doi 10.1111/obr.13306).
- Self-weighing within multi-component interventions: **−3.4 kg** mean
  difference across 15 trials, with **no significant difference between
  weekly and daily** weighing (Madigan et al., IJBNPA 2015,
  doi 10.1186/s12966-015-0267-4).
- Dietary food logging: a systematic review of 59 studies **could not
  pool at all** for heterogeneity, and its adherence–weight association
  is explicitly flagged as confounded by motivation (*Public Health
  Nutrition*, 2021). A meta-review found **no BCT consistently related
  to improved outcomes** (PMC7429262).

**Grade on what the app retains: B.** The app drops food logging — the
weaker, unpoolable evidence — and keeps weight, which is the one with
the −3.4 kg and the finding that weekly is enough. That is the right half
to keep and it is a better-reasoned position than the promise text
implies. Caveat: abstracts and publisher records only, no full texts.

### 3. "Protein-first dinners decided once a week" — split, and the weaker half is load-bearing

- **Protein-first direction: B.** `meal-sketch` (`protocols.ts:571`) is
  already graded B and already carries the honest range.
- **"Decided once a week" as a pre-commitment mechanic: no primary
  evidence found.** I searched for meal-planning and weekly-menu RCTs
  on diet quality and adherence. What exists is feeding trials, which
  pre-specify everything and therefore cannot separate the planning from
  the food, and a cluster-RCT protocol with no results posted
  (PMC11007920). The only usable adjacent datum: when adherence lapsed
  in feeding trials, participants generally cited **lack of menu
  variety** — which argues for rotation, and
  `src/features/modalities/meals/rotation.ts` already exists.

**This is the claim with the least evidence behind it and it is the one
the entire nutrition artefact is built on.** If §6 builds a four-week
nutrition block around "decided once a week", it is building on a
mechanism nobody has tested. That is allowable — rule 4 says educational
structure, not medical advice — but it must be labelled, not graded.

### 4. "A walk that blunts the glucose spike" — B, and the grade is honest; the copy is not

- `post-meal-walk` carries `evidenceLevel: 'B'` at `protocols.ts:478`.
- The repo's own gate-2 ledger (`docs/research/output/nutrition/ledgers/gate2.md:753`)
  names the primary source: **Buffey AJ et al., *Sports Medicine*
  2022;52(8):1765–1787, doi 10.1007/s40279-022-01649-4 — 7 randomised
  crossover trials; light walking superior to standing for attenuating
  postprandial glucose.** I independently confirmed the existence and
  direction of this review by search; I did not open the full text.
- A second meta-analysis of 7 acute studies finds intermittent standing
  breaks significantly reduce postprandial glucose versus prolonged
  sitting, with light walking better still.
- The ledger states the limit in its own words: **"all acute, all
  one-day, no long-run outcome."**

**Verdict: the B grade is honest for the acute glucose outcome. The
card's `why` line is not.** *"A tiny habit with an outsized metabolic
effect"* claims a metabolic outcome from a one-day surrogate the repo's
own ledger says has no long-run data. Rewrite the line; keep the grade.

### 5. "Your own protein number" — this is the claim that outruns its evidence, and the app's own library is the thing that says so

This is the inconvenient finding and it is the clearest one in this
document.

**What the project's own research round concluded:**

- `docs/research/output/nutrition/findings.md` §9: *"**No card in this
  round names a protein amount**, deliberately, and the safety line on
  the protein card says why in one clause. That is unusual and it is the
  point."*
- `docs/research/output/nutrition/ladder.md`: *"Asking for a protein
  number. **Give a range, never a point.**"*
- `gate2.md:746` on `meal-sketch`: the ~1.6–2.2 g/kg/day range is
  *"already the honest range rather than the false point — it is the only
  place in the corpus, podcast or library, that gets this right. **Change
  the verb, not the number.**"*

**The underlying paper, verified independently of the repo.** Morton et
al. 2018 (*A systematic review, meta-analysis and meta-regression of the
effect of protein supplementation on resistance training-induced gains
in muscle mass and strength in healthy adults*): break point **1.62
g/kg/day at p = 0.079**, 95% CI **1.03 to 2.20**, stated in the paper's
own figure caption; the authors' discussion suggests ~2.2 g/kg/d may be
prudent. Confirmed through two independent routes including the paper's
hosted PDF. The repo's reading of this paper is accurate.

**What the app actually ships:**

- `src/features/nutrition/plan.ts:80` — `PROTEIN_PER_KG`:
  `energy: [1.6, 2.0]`, `weight: [1.8, 2.2]`, `muscle: [1.8, 2.2]`. The
  energy band's **2.0 ceiling is narrower than the honest range and I can
  find no source for it.** The 1.6 floor is the non-significant break
  point, used as a floor.
- `proteinTarget` computes `perMealG = minG / meals`, and
  `src/features/nutrition/NutritionHub.tsx:86` renders:
  **"≈ {perMealG} g across {meals} meals. *Hit that* and most of
  nutrition takes care of itself."** A per-meal protein number, with an
  imperative verb, resting on a per-meal threshold this project's own
  regrade log says does not exist. `src/features/knowledge/regrades.ts`,
  `protein-breakfast`, **B → C on 2026-09-08**: *"The per-meal ceiling
  and the leucine threshold underneath it do not survive: the systematic
  review finds no threshold in either age group."*
- It is **test-locked.** `src/features/nutrition/__tests__/plan.test.ts:28`
  asserts `perMealG === 35`; `:31` asserts `minG === 144` with the
  comment `// 1.6 g/kg`. Anyone who corrects the card breaks the suite,
  which is why this has survived a regrade that was published against it.

**Is the app's existing grade honest? There is no grade.** The "Your
numbers" block in `NutritionHub` renders the protein target, the per-meal
figure and the fibre figure with **no `evidenceLevel`, no citation and no
provenance.** The only graded element on that screen is the supplement
list (`NutritionHub.tsx:211`). `src/features/health/provenance.ts` exists
precisely so that *"a health figure whose origin a person cannot trace is
one they are right to distrust"* — and the single screen that keeps the
nutrition promise is the one nutrition surface outside that machinery.

**The honest summary: three of four claims are evidence-backed at the
grade the app implies. The fourth — "your own protein number" — is
contradicted by this project's own published research round, ships a
ceiling with no source and a per-meal figure whose threshold was
regraded away six weeks ago, carries no grade at all, and is held in
place by two unit tests.** Nutrition becoming half the product makes
this the most-read number in the app.

### 6. The fibre figure on the same screen — the opposite case, worth recording

`NutritionHub` also shows *"about 30 g/day"* with *"across 185 long-term
studies, people eating around this much had 15–30% fewer early deaths
than those eating least."* That is **Reynolds A, Mann J, Cummings J, et
al. *Carbohydrate quality and human health: a series of systematic
reviews and meta-analyses.* Lancet 2019;393:434–445,
doi 10.1016/S0140-6736(18)31809-9** — ~135 million person-years, 185
prospective studies and 58 clinical trials. The abstract does report a
**15–30%** decrease in all-cause and cardiovascular mortality comparing
highest with lowest fibre consumers. Two caveats the screen omits: it is
**observational**, and the Lancet series graded the fibre evidence
**moderate**. *"Fewer early deaths"* reads causal where the paper is
associational. The number is right; one word is wrong.

## C. What I could NOT find evidence for

Stated plainly, because "no primary evidence found" is a finding.

1. **Any primary trial comparing an accumulated, non-losable level
   against a losable streak for the same behaviour.** Nothing. Rewley /
   STEP UP is the closest and it varies losable points *inside* a level
   system — it has no non-losable arm. The registered trial the stickiness
   brief found (NCT07220044, streak versus tally feedback, 30 days) is
   still registered with no results posted. **This is the central
   question of §5 and there is no primary evidence on it in either
   direction.** §5 should be labelled a hypothesis, not a resolution.
2. **">40% more 7-day streaks" as a Duolingo figure.** It is not theirs.
3. **"The one-exercise rule attracted the least active users."** No
   source splits that result by activity level. Asserted in §5 and in my
   own role definition; traced by neither.
4. **Primary verification of any Duolingo figure by opening Duolingo's
   own page.** Both domains are DNS-unreachable from this environment.
5. **Any RCT of weekly meal planning as a pre-commitment device** on diet
   quality or any health outcome in free-living people.
6. **Any evidence that post-meal walking changes a long-run outcome** —
   weight, HbA1c, mortality. The repo's own gate-2 ledger reached the
   same conclusion independently.
7. **A source for the 2.0 g/kg ceiling** in `PROTEIN_PER_KG.energy`.
8. **Any effect size isolating levels** from points, badges, competition
   or social support in a health RCT. Every gamification meta-analysis I
   found pools whole interventions.
9. **Day-30 retention for health apps from a primary source.** Same
   conclusion `STICKINESS_BRIEF.md` §4 reached; I did not improve on it.
10. **Any churn number for this app.** §9's point stands. The simulator
    cannot produce one, telemetry is off, and the sample is one.

---

## The sentence this document is not allowed to omit

Every in-house figure above comes from a simulator with **no churn
model**. Nobody in it leaves. `career_optimiser`'s −8 points is measured
among people who kept using the app; the real curve is worse, and the one
real user quit. Three of the five §2 figures I checked had drifted in six
weeks, which is how much weight any of them should carry.

**Ten people in TestFlight outrank all of it — including this document.**
Everything in §2, everything in §5, my build-first recommendation and my
own prediction are hypotheses until that happens.
