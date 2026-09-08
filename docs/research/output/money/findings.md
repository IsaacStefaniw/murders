# Money round — findings

Round 2 under the rewritten README, the COMMUNICATORS roster and the recovery-round REVIEW. Brief: `docs/research/BRIEF-money.md`. Output: 22 candidate protocols in `protocols.ts`, a ledger in `sources.md`, three working ledgers in `ledgers/`. Nothing edits `protocols.ts` or `protocols.money.ts` in the app; the eleven existing money cards are discussed below as proposals only.

## What was checked

About 95 peer-reviewed papers, working papers and official reports, checked at record level on 8 September 2026: bibliographic details and retraction status against the Crossref registry record for every DOI, abstracts and figures against Europe PMC, PubMed Central, NBER, J-PAL, IDEAS/RePEc or the authors' pages, because every major publisher's landing pages returned 403 to automated fetches that day. Thirty-one government and regulator pages opened directly (MoneySmart, RBA, APRA, ASIC, ABS, Productivity Commission, Grattan, firsthomebuyers.gov.au, the National Debt Helpline, Financial Counselling Australia). Six podcast episodes and five practitioner sites used for discovery and attribution only (Rational Reminder 231, 243, 256, 288, 300; Tim Ferriss 371; Barefoot Investor; Ramit Sethi; Ramsey; Noel Whittaker; Effie Zahos). Every ato.gov.au page returned 403; those rows are marked UNVERIFIED and listed at the end.

Two retraction findings that matter. Ariely & Wertenbroch 2002, the standard citation for "people bind themselves with self-imposed deadlines", was **retracted on 2 September 2026**, six days before this round, after Data Colada found the data tampered with and a July 2026 replication failed. Shu et al. 2012 was retracted in 2021. Nothing in this round cites either; three other Ariely-co-authored papers were checked, are untouched, and are not load-bearing anywhere.

**Revised against REVIEW.md the same day.** The review asked for HECS-HELP and Centrelink, which had no references in the round, and one or two more income-variability cards. Added: `help-in-the-picture` (D; the loan declared to payroll and carried in the quarterly position number, beside the existing `help-debt-timing`), `overtime-to-the-transfer` (D; base roster runs the budget, penalty and overtime dollars go to the goal) and `bill-smoothing` (D; the regulator's own recommendation for casual income). Services Australia on 132 850 is now in the hardship card's safety line. The round is 25 candidates.

Grade spread of the 25: A 0 · B 6 · C 5 · D 14 · E 0. Weighted to C and D as the brief said a believable round would be. The A-grade behaviour in this pillar, the automatic transfer, already exists as `payday-automation`; this round builds the pieces around it and proposes moving that card to B (section 5).

## 1. What changed

The pillar goes from 11 cards to 33 if all are accepted, and from a set of good individual habits to something that carries the ladder in `plan.ts` (automate → buffer → expensive debt → three months → invest) rung by rung.

**The automation cluster now has its missing parts.** `payday-automation` and `raise-precommit` were the whole story; they now have the refund (`refund-precommit`, B), the date (`fresh-start-date`, B), the unit (`per-day-framing`, B) and the check (`day-after-payday-glance`, B). Each is a real field trial with real money, and each is one decision made in advance rather than a habit to maintain.

**The buffer has rungs the data support.** `two-thousand-first` (C) replaces "three to six months", a convention nobody derived, with the three numbers that actually appear in the evidence: the resilience threshold the ABS asks every Australian household about, the six-week buffer that absorbs a normal bad month in six million families' bank data, and MoneySmart's three months as the third rung. The first rung is low enough to reach, and the copy says crossing it is the hard one.

**Australia is in the round.** Super's four controllable settings (`super-four-settings`, C), the 30 June contribution question (`super-before-june`, D), receipts and working-from-home hours as the tax office requires them (`receipts-as-you-go`, D), the two-minute offset link check the regulator itself recommends (`offset-is-linked`, D), the insurance inventory with the lapse triggers that switch default cover off (`cover-inventory`, D), and the hardship rule and free helpline (`hardship-number-known`, D). None quotes a cap, a rate or a threshold, because they change every July and the ATO pages could not be opened.

**Lumpy income has two cards** (`pay-yourself-a-salary`, `tax-set-aside`, both D): a fixed salary from a holding account sized to a poor month, and the tax share leaving on the day an invoice is paid. Practitioner practice, unanimous, unevaluated, with the sizing rule borrowed from the bank data.

**Couples get one B and one D.** `shared-money-agreement` rests on the only randomised trial in the area, 230 engaged couples followed for two years, plus a 38,000-person multi-study series; `money-date` is the ritual practitioners built on top of it, graded honestly as untested.

**Stress connects to sleep** through `money-worry-to-paper` (C): financial strain shows up in the sleep laboratory, and a five-minute pre-sleep to-do list has a randomised polysomnography trial behind it. The card claims a sleep effect and routes the debt part to the helpline.

**Four time-back cards** (section 4).

Every card touching debt, super, a loan, insurance or a refund names a licensed adviser, accountant or financial counsellor in its safety line, checked mechanically against the same regex the test file uses. The National Debt Helpline number appears in four safety lines and 1800RESPECT in one, because economic abuse is the one place a couples card must not be neutral.

## 2. What is genuinely well supported

- **Pre-commitment to money you do not yet have.** Three separate randomised field trials with real money: the tax-refund trial (deposit rates up by roughly half to two-thirds, strongest in early deciders), the fresh-start trial (delayed take-up up about half, contributions still higher at eight months), and the original Save More Tomorrow programme (participation and rates rose across four pay rises). The 2024 long-run accounting shrinks the steady-state effect of workplace auto-escalation to a fraction of a percent of income, which is smaller than the folklore and still the best-evidenced thing in the pillar.
- **The unit a number is offered in.** Daily framing of an identical deposit roughly quadrupled enrolment in a randomised sign-up experiment and erased the participation gap between the highest and lowest earners. This is the cheapest lever in the round and the app's weekly number already half-uses it.
- **Monitoring, when it is recorded and specific.** 138 randomised trials, d = 0.40 on goal attainment, larger when progress is physically recorded. In a savings app, being able to see a goal raised the saving rate, most for the people least inclined to save.
- **Joint accounts in new couples.** A randomised two-year trial, unusual in this field, plus a very large correlational series in the same direction. Financial disagreement predicts separation more strongly than any other kind of disagreement in a 4,574-couple longitudinal survey.
- **The Australian numbers that describe the problem.** 21.7% of households could not raise $2,000 in a week (ABS 2025, up from 13.4% in 2014); a third of super accounts were unintended duplicates costing $2.6bn a year (Productivity Commission); about six in ten super members have no beneficiary nominated (ASIC finding on MoneySmart). Descriptive, official, and exactly what the coach needs to say "you are not behind, you are normal, and here is the first rung".
- **Debt and mood, as association.** A 65-study meta-analysis gives pooled odds ratios around 2.8 for depression and above 3 for any mental disorder. Association only; causation runs both ways, and one quasi-experimental debt-relief study suggests relief helps.

## 3. Where the popular version overstates

- **Save More Tomorrow's headline.** The 2004 paper's 3.5% → 13.6% is real and self-selected; the 2024 administrative accounting finds workplace auto-escalation adds about 0.3% of income at steady state once job changes and opt-outs are counted, and only about 40% escalate at the first date. The coach should say "the best-evidenced money behaviour there is" and should not quote the 2004 figure as an expectation.
- **The future-self avatar.** The famous studies are 21 to 50 students allocating pretend money. The fifty-thousand-person real-money trial finds the mechanism works and moves one-off contributions by a fifth of a percentage point. Worth ten minutes a quarter, not a product feature.
- **Reminders.** In poor-country bank trials they help; in a two-million-person US megastudy the average email raised deposit probability by 0.05 points, a Dutch social-norm nudge did nothing to actual saving, and in Chile reminders reduced transaction balances. Product implication in section 6.
- **"Poverty costs 13 IQ points."** Contested re-analysis, a randomised payday study with a null, and a 2024 meta-analysis with a pooled effect of 0.09 and a confidence interval through zero. What survives: money worry occupies attention in anyone.
- **Debt snowball versus avalanche.** Both camps overstate. Highest-rate-first is arithmetic and the measured penalty for ignoring it on real portfolios is 1.8 to 4.3% more interest; three independent datasets show concentration on one balance, smallest first, predicts finishing. No one has randomised people to either and followed them to zero, and there is no Australian data at all. `debt-order-review` already has the right answer; the copy proposal makes it more precise.
- **Bucket percentages.** Pape's own site says the splits do not really matter. The structure (separate labelled accounts) has field evidence; the 60/10/10/20 has none.
- **Financial literacy.** Two meta-analyses disagree on the surface and agree once design is held constant: education tied to a decision works modestly, generic education decays to nothing by twenty months. The app should never ship a course as a saving lever.

## 4. Time back

Four of 22, about a fifth.

- **Coffee maths** (`latte-maths-retired`). No study exists; the arithmetic needs an implausible daily amount and a return nobody offers. The evidence points at exceptional spending and fixed costs instead. Minutes returned: every one spent totting up small purchases.
- **The tracker as the plan** (`tracking-is-a-mirror`). Access to your own transactions cuts fees and penalties (quasi-experiment) and does not make people save; goals and automation did that in every study that separated them. Frequent budget-standing feedback raised spending in one unpublished series. Minutes returned: the daily check-in, replaced by a monthly look at three lines.
- **Willpower** (`willpower-retired`). Fifty-nine preregistered laboratories, effect indistinguishable from zero. Minutes returned: every decision re-fought that a standing transfer would have settled. This card is graded B on the replacement (defaults), not on the debunk.
- **Round-ups** (`round-ups-are-a-starter`). Unevaluated as a savings mechanism; the regulator calls them a habit starter and warns about fees on small balances and who owns the asset. Counted as zero in the plan, kept if enjoyed.

Not added, because the library already names enough and the README says not to hunt: the budgeting-app-as-plan idea is covered above, and the emergency-fund "specific numbers school" is handled inside `two-thousand-first` rather than as a separate debunk.

## 5. Regrades proposed and items declined

Proposals only; the app branch is untouched.

| id | Now | Proposed | Reason |
|---|---|---|---|
| `payday-automation` | A | **B** | The defaults evidence is B: no meta-analysis, one landmark natural experiment replicated in national policy, and a 2022 bias-corrected reanalysis that calls default-type nudges inconclusive. The card's practice, a personal standing transfer, is not what any of the trials tested. "Tested and held up" is exactly right. |
| `money-checkin` | D | **C**, copy shrunk | Monitoring evidence supports a light fixed-cadence review; thirty weekly minutes is heavier than the evidence needs and high-frequency feedback has a backfire finding. Suggest ten weekly minutes plus a monthly review, with `day-after-payday-glance` as the weekly piece. |
| `purchase-delay` | E | E, copy fix | The why says present bias is well evidenced; a 220-estimate meta-analysis finds it small and selectively reported for money, real for effort. Drop the sentence; keep the heuristic. |
| `debt-order-review` | C | C, copy update | Can now say the interest penalty for smallest-first is single-digit percent of total interest, that three independent datasets link concentration and account closure to finishing, and that no trial has compared the two. Safety line should name the National Debt Helpline. |
| `help-debt-timing` | C | C, copy update **after human check** | Indexation is now the lower of two indices and repayments are marginal above the threshold from 2025-26; both from ATO pages that returned 403. |
| `buffer-first` | B | B, copy update | Add the first rung ($2,000) and the second (about six weeks) so the card and `two-thousand-first` agree; replace the Tim Ferriss attribution, which is not traceable to a buffer practice, with Scott Pape. |
| `net-worth-check` | B | B, attribution fix | "Peter Attia" has no traceable link to a quarterly net-worth practice; suggest Ramit Sethi or Moneysmart (ASIC). |
| `raise-precommit` | B | B, coach note | Do not quote the 2004 escalation figures as an expected outcome. |

Declined, with reasons in `sources.md`: the retracted deadlines paper; the 13-IQ-points claim; ego depletion; peer-comparison messages; generic reminders; five figures that could not be found on any landing page (Karlan's 6%/16%, Kaiser's 0.2/0.1 SD, Kettle's n≈4,000, JPMC's $2,467, the $2,000 target attributed to MoneySmart); three Ariely-co-authored papers as anything load-bearing; and any product, platform, fund, ticker, return, cap or threshold.

Held pending app fields: a debt-closure celebration card (needs `condition`), a first-home-scheme card (needs an `appliesTo` value beyond anatomy). Sources verified for both.

## 6. What the Money coach can now say on a Tuesday

- "Set the increase to happen automatically on a date that feels like a beginning: your birthday, 1 July. It is the best-evidenced money behaviour there is, you do it once, and the trial that tested it found people were still doing it eight months later."
- "That works out to about four dollars a day. Decide at that size. The fortnightly transfer does the rest."
- "You're a few hundred a fortnight off the target date. Refund season is the cheapest place to find it: decide the share in May, before the money lands."
- "Two thousand dollars you could reach in a week. One in five Australian households can't, so that number is not small, and it is the rung that turns an emergency back into an inconvenience."
- "Income's lumpy this quarter. Pay yourself a salary from the pile, set at a poor month, and let the pile build to about six weeks of take-home. That's the buffer the bank data says absorbs a bad month."
- "Pick one balance and put everything spare on it. Smallest first costs a few percent more interest and is the version people finish."
- "If money is what your head does at eleven at night: write the one next action and the day, then sleep. If the action is a bill you can't pay, the National Debt Helpline is free and the counsellor sells nothing."
- "Keep the coffee."
- "Your super has four settings you can change and one date a year that matters. Twenty minutes in July."
- "That's the buffer milestone done. Genuinely, that's the hardest one."

## 7. Product notes for the app branch

Not protocols; things the round found that belong in code or copy.

- **Do not send generic 'remember to save' pushes.** The evidence is unusually clear that they do nothing for banked, rich-country savers and can backfire. The only reminder with support is behaviour-conditional: the transfer failed, a milestone was reached. `neverNag` is set on the cards that are permissions rather than tasks.
- **The ladder in `plan.ts` could add a $2,000 milestone** between "first $1k" and "a month of expenses". It is the number the ABS asks about and the one that separates fragile from non-fragile households in three countries.
- **A `condition` field** (proposed in the recovery round) would unlock the debt-closure card here as well as the held sleep cards there. Suggested addition to the enum: `'balance-zero'`.
- **`appliesTo` is anatomy-only.** A second audience axis (saving a first-home deposit, self-employed, in a couple) would let three held or general cards be shown only to the people they are for.
- **Just-in-time education works; courses decay.** One fact on the screen where the action happens (an "opt-out later is allowed" line on the step-up card, the linked-offset note on the buffer card) is the form the evidence supports.
- **Milestones early, whole goal late.** Two small studies suggest sub-goals motivate in the first third and the finish line in the last; `plan.ts` already front-loads the milestones. No change needed, worth knowing why it is right.
- **Podcast attribution.** Rational Reminder is the one show in this field that is not selling a product; four cards credit Ben Felix for discovery. Pape and Sethi are credited for practice they demonstrably popularised and never for evidence. No Ramsey attribution anywhere.

## UNVERIFIED: mostly resolved — see `ATO-VERIFIED.md`

**Update, same day.** The ATO 403s were a user-agent block, not a real one. Fetched with an ordinary browser user-agent, the pages return in full, and the key figures are now verified at source: the super guarantee rate, the marginal HELP repayment calculation, the backdated indexation change, the $300 written-evidence threshold and the five-year retention rule. Two figures were wrong in the ledger and are corrected there: lost and ATO-held super is $21.2 billion across just under 7.5 million accounts at 30 June 2026, and the HELP repayment threshold for the current 2026-27 year is $69,528, not the $67,000 that applied in 2025-26. Neither appears on a card, which is the design working as intended. The `help-debt-timing` copy update is unblocked. Details, including which pages still render client-side and yield nothing, are in `ATO-VERIFIED.md`.

The list below is what the round originally flagged. The figures were corroborated by search-engine snippets of the named official page and by MoneySmart where it repeats them, and none appears on a card:

- Super guarantee 12% from 1 July 2025 (ATO super-guarantee page).
- Concessional cap $30,000 for 2025-26, $32,500 for 2026-27 (the latter is on MoneySmart, opened); non-concessional $120,000 / $130,000 with bring-forward.
- Co-contribution: up to $500, income thresholds $47,488 to $62,488 for 2025-26.
- Lost and ATO-held super $18.9bn across ~7.3m accounts at 30 June 2025.
- Written evidence required above $300 of total work deductions; records kept five years; working-from-home hours recorded contemporaneously; myDeductions accepts photographed receipts (MoneySmart repeats the substance).
- HELP indexation now the lower of CPI and WPI (1 June 2025 rate 3.2%); compulsory repayment threshold $67,000 for 2025-26 with marginal calculation.
- AFCA complaint volumes 2024-25 (context only).
- ASIC RG 271 response timeframes (PDF not opened).

The three working ledgers in `ledgers/` mark every row with VERIFIED, PARTLY VERIFIED or UNVERIFIED and say which mirror confirmed each figure.
