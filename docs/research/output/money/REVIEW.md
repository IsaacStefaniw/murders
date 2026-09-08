# Money round — review

Reviewed 8 September 2026 against the live library and the `Protocol`
interface. Checked, not assumed.

## Verdict

**Accept, subject to two small additions.** This is a better round than the
first recovery one, and the grading is exactly right.

| Check | Result |
|---|---|
| Typechecks against the real interface | **0 errors**, 22 objects |
| Safety notes | **22/22** |
| Licensed-professional routing (constraint) | **28 references** |
| Product, platform, ticker or return figure | **none** (the only match was the file's own header stating the rule) |
| Grade spread | B 6 · C 5 · D 11 · **A 0** |

## Zero A grades is the right answer

The pillar goes from 11 protocols to 33 and not one of them claims to be
settled science. Behavioural finance has had a hard decade, several famous
effects have shrunk under scrutiny, and a money round that came back
claiming A-grade certainty would have been a warning sign rather than a
strong result. D 11 out of 22 is honest.

This also fixes the concern from the recovery round, where the spread ran
hot at 60% A+B. Across the two rounds now the library's overall balance
holds.

## The roster landed

Attribution shows the `COMMUNICATORS.md` roster was actually used:
MoneySmart (ASIC) 12, Ramit Sethi 7, **Scott Pape 5**, Ben Felix 4,
Australian Taxation Office 4, then Benartzi, Thaler, Hershfield, Sussman.

That is the right shape for this pillar: the government source carries the
most weight, the two big recognisable money voices carry the practice, and
the researchers carry the mechanism.

## Genuinely Australian

superannuation 15 · offset accounts 11 · MoneySmart 13 · ATO 12.

This is the thing most money content cannot do for this audience, and it is
the strongest single reason the money coach is now worth opening.

## Two additions before merge

**1. HECS-HELP is missing entirely** (0 references), as is Centrelink (0).
HECS is close to universal among the graduate professionals in this
audience, the indexation timing genuinely changes what an optimal
repayment looks like, and it is exactly the kind of local specific that
makes the coach feel like it knows where the person lives. Add it.

**2. Income variability got less than the brief asked for.** Founders,
tradespeople and shift workers with overtime are a large slice of the
target audience and most budgeting content assumes a stable fortnightly
wage. Worth one or two more cards.

Neither blocks the merge — add them and the round is done.

## Note on the recovery revision

Checked at the same time. All four review items landed:

- **Conditional schedules fixed properly.** Three cards removed
  (`cbt-i-signpost`, `debt-repay-over-nights`, `sleep-bank-ahead`); the two
  kept were *rewritten to be genuinely recurring* — "on any morning you
  wake without an alarm", "after the hardest session of the week" — rather
  than left mismatched. That is the right fix, not a dodge.
- **Fabricated corrections section removed.**
- **Grades pulled back**: A 3 → 1, B 12 → 9. 45% A+B against the library's
  40%, which is fine.
- 25 → 22 protocols, still typechecks clean.

Good responsiveness. Nothing further needed on recovery.
