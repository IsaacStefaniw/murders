# Retraction register — check this before you cite

Three research rounds have now each found a retracted or overturned paper
sitting in the middle of their topic. That is a pattern, not bad luck:
the practices this library covers are exactly the famous, heavily
promoted findings that attract scrutiny.

Every round checks this file first, and adds to it. Verified at the
Crossref registry record on the date shown, and re-checkable in one
command: `harvest.js crossref <doi>`.

## The tool lesson, which nearly cost us

**The registry's `relation` and `update-to` fields are not reliable for
retractions.** All three papers below return `retraction_or_update: none`
in those fields. JAMA, PNAS and SAGE mark a retraction by prefixing the
**title** instead, and leave the relation empty.

`harvest.js crossref` now checks the title as well and prints a
`DO_NOT_CITE` flag and a warning. A round that trusted the relation field
alone — as the first two rounds did — would have passed all three.

There is a third signal: OpenAlex carries an `is_retracted` boolean.
`harvest.js abstract` reads it. Use all three.

## Retracted — do not cite

| Paper | DOI | Retracted | What it was the standard citation for | Where it hit us |
|---|---|---|---|---|
| Ariely D, Wertenbroch K. 2002. Procrastination, Deadlines, and Performance: Self-Control by Precommitment. *Psychological Science* 13(3) | 10.1111/1467-9280.00441 | 2 Sep 2026 | "People do better when they set their own deadlines." The canonical self-binding and commitment-device citation. | Money round, 6 days after retraction. Data Colada found Study 2 data tampered with or fabricated; a July 2026 replication failed. The commitment-savings evidence does not depend on it. |
| Shu LL, Mazar N, Gino F, Ariely D, Bazerman MH. 2012. Signing at the beginning makes ethics salient… *PNAS* 109(38) | 10.1073/pnas.1209746109 | 13 Sep 2021 | "Sign at the top of the form and people are more honest." | Money round, checked and not used. Fabricated insurance data. |
| Panagioti M, Geraghty K, Johnson J, et al. 2018. Association Between Physician Burnout and Patient Safety, Professionalism, and Patient Satisfaction. *JAMA Internal Medicine* 178(10):1317 | 10.1001/jamainternmed.2018.3713 | 18 May 2020 | "Burnout doubles patient-safety incidents." | Work round. **Still cited 824 times** and still circulating in burnout advocacy six years after retraction. |

### The confusion trap, which is the real danger here

**Panagioti 2017 is not retracted. Panagioti 2018 is.** Same first
author, same journal, adjacent years, same subject area.

| | DOI | Status |
|---|---|---|
| Panagioti 2017, *Controlled Interventions to Reduce Burnout in Physicians* | 10.1001/jamainternmed.2016.7674 | **Clean.** One 2024 erratum, correcting "Cohen Q" to "Cochran Q". No numbers changed. |
| Panagioti 2018, *Association Between Physician Burnout and Patient Safety…* | 10.1001/jamainternmed.2018.3713 | **Retracted.** |

The 2017 interventions meta-analysis is load-bearing for the Work round's
central burnout finding, and it is sound. Do not let the retraction of
its sibling take it down, and do not let a citation of the sibling ride
in on its reputation. Check the DOI, never the author-year.

## Overturned or seriously contested — cite only with the correction

Not retracted. Still wrong, or much smaller than advertised.

| Claim as it circulates | Original | What actually holds |
|---|---|---|
| Willpower is a depletable resource ("ego depletion") | Baumeister et al. 1998, 10.1037/0022-3514.74.5.1252 | Two preregistered multi-lab replications: 23 labs, N=2,141, d=0.04; and 36 labs, N=3,531, d=0.06 with the paradigm chosen by proponents. Treat as unproven. |
| Nudges work, d≈0.45 | Mertens et al. 2022, 10.1073/pnas.2107346118 | Maier et al. 2022 re-analysis: no evidence of an overall effect after publication-bias correction. DellaVigna & Linos: real nudge units get +1.4pp where papers report +8.7pp. Defaults are the partial exception. |
| Poverty costs about 13 IQ points | Mani et al. 2013, 10.1126/science.1238041 | Contested re-analysis; a randomised payday study found no cognitive effect; a 2024 Bayesian meta-analysis puts the differential effect at g≈0.09 with the interval crossing zero. Say "money worry crowds out attention", never the IQ figure. |
| The 3:1 positivity ratio | Fredrickson & Losada 2005, 10.1037/0003-066X.60.7.678 | The mathematical basis was formally withdrawn. The ratio is not a finding. |
| "Burnout doubles patient-safety incidents" | Panagioti 2018 | Retracted, above. |
| Individual resilience training fixes burnout | genre claim, no single source | Panagioti 2017: organisation-directed SMD −0.45 against physician-directed −0.18. Ahola 2017: in people who already have burnout, four pooled RCTs show no effect on exhaustion or cynicism. |
| The feedback sandwich | genre claim | Three studies exist in total; one null, one positive in 91 students where the authors cannot isolate their own mechanism. |
| Video calls are exhausting because of Bailenson's four mechanisms | Bailenson 2021 | A theory paper with **no participants**, whose author says the arguments are untested. The tested finding is Shockley 2021, 1,408 observations with the camera manipulated. |

## Expressions of concern

| Paper | Status |
|---|---|
| Mazar N, Amir O, Ariely D. 2008. The Dishonesty of Honest People. *J Marketing Research* | Expression of concern, 2024. A 25-lab replication, N=5,786, found a small effect in the opposite direction. |
| Heyman J, Ariely D. 2004. Effort for Payment. *Psychological Science* | Expression of concern, 2021. |

**Standing rule on this author.** Dan Ariely now has two retractions and
two expressions of concern. Three further Ariely-co-authored papers have
been checked across the rounds and are clean, but none is load-bearing
anywhere and none should become so. Where a practice rests on an Ariely
paper, find independent corroboration or drop the practice.

## Numbers that trace to nothing

Not papers. Figures that circulate as though they were, and that a round
searched for and could not find at any source. Never print these.

- "It takes 23 minutes to refocus after an interruption."
- "Meeting recovery takes 45 minutes."
- "Half of people change their personality-instrument type within five weeks."
- The no-meeting-day percentages of 71, 55 and 52, which are not in the
  article they are attributed to.
- "Flow makes you five times more productive", which traces to a
  consulting firm's self-report survey, not to peer-reviewed work.
- The latte-factor arithmetic, which has no study behind it at all.
- Karlan's reminder figures of 6% and 16%; Kaiser's 0.2 and 0.1 standard
  deviations; a $2,467 buffer figure; a $2,000 emergency-fund target
  attributed to the Australian regulator, which its page does not say.

## Sweep the library against this file, do not just read it

A register nobody enforces is a bibliography.

`tools/retraction-sweep.js` checks every shipped card against the rows
above, by author and by claim pattern, and exits non-zero so it can gate
a build. Run it whenever this file changes and before any round ships.

It exists because of a near-miss worth recording. Ariely & Wertenbroch
2002 was entered here the day the register was created, filed under the
money round that found it. Days later the skill round discovered that a
live card, `ship-monthly`, had that paper as its reasoning and both its
attribution credits. The register had the answer the whole time and
nobody had asked it about the cards already shipped.

The sweep now finds that card in under a second, and reports the rest of
the library clean.

## How to add to this file

When a round finds one: the DOI, the date checked, what it was the
standard citation for, and what survives instead. A retraction is only
useful to the next round if the replacement claim is recorded beside it.

**Then add it to the sweep.** `retraction-sweep.js` carries its own copy
of the author list and the claim patterns; a row added here and not there
is a row that stops being enforced.
