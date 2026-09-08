# The nine-pillar merge — what landed, and what is left

Written 8 September 2026, when the eight verified rounds were merged into
the shipped library. The rounds' own records are under
`docs/research/output/<round>/`; this is what happened to them.

## What landed

**113 new cards**, in `src/features/knowledge/protocols.research.ts`,
grouped by the round that produced them. The library goes 204 → 317.

| round | cards | A+B |
|---|---|---|
| connection | 12 | 0% |
| mind | 7 | 14% |
| money | 25 | — |
| nutrition | 7 | 14% |
| recovery | 22 | — |
| skill | 6 | 33% |
| training | 8 | 25% |
| work | 26 | 42% |

Supplements was the ninth pillar and did not run. It is the one round
still outstanding, and its carve-out rules are stricter than the rest, so
it should be briefed separately rather than folded into a general round.

**Seventeen regrades**, fourteen of them down. Three up: behavioural
activation, the best-possible-self exercise and gratitude writing all
gained better evidence than they had when they were first graded.

**The corrections the rounds found in the shipped library**, which is the
half that would have been easy to skip:

- `ship-monthly` was live, graded C, and built entirely on a paper
  retracted in September 2026. Grade to E, both credits off, the card now
  names the retraction rather than resting on it.
- Six connection cards had one name as their only attribution, against the
  roster's own rule. Four take a traced replacement, two take an empty
  attribution because the round looked and found nobody.
- Ten connection cards had no safety field at all. Twenty now carry one of
  two shared paragraphs, and every card in the pillar is `neverNag`.
- `meditation-10`'s safety line was seven words on the most-used card in
  the app.
- `shutdown-ritual` sat at a fixed 17:10 for an audience half of which is
  not on a nine-to-five.
- The website was publishing 177 of the library. Three separate pieces of
  tooling counted `protocols.ts` alone, including the consumer-law guard
  written to catch exactly this.

## What is left

**For Isaac to decide.**

- **`sauna` still credits David Sinclair.** The audit calls this "not a
  breach" — the guidance was about new additions — but it is a longevity
  card, which is the pillar the roster names. A brand call rather than an
  evidence call, so it was left alone.
- **`help-debt-timing` needs a human check.** Indexation is now the lower
  of two indices and repayments are marginal above the threshold from
  2025-26. Both facts come from ATO pages that returned 403 to the round.
  The card is unchanged pending someone loading those pages.

**Identified but not itemised.** The connection round reports "five
further failing credits" found by applying the author-list rule across
the whole pillar, and two bibliography corrections. Neither list appears
in any of its output files, so they could not be applied. Worth asking
the round for the itemisation before the next merge.

**Held pending a `condition` field.** Five cards across two rounds are
event-driven and cannot be scheduled honestly without it:
`cbt-i-signpost`, `sleep-bank-ahead`, `debt-repay-over-nights`, a
debt-closure celebration, and a first-home-deposit card. The recovery
round proposes a shape:

```ts
condition?: {
  kind: 'tally-below' | 'tally-above' | 'before-event' | 'after-run' | 'balance-zero';
  source: string;
  threshold?: number;
  forNights?: number;
}
```

evaluated by the planner before placement, so a held card is placed for a
bounded window when its condition is true and never otherwise. Until
something like it exists these cards should not ship. `neverNag` is the
partial substitute the merge used for cards that read as conditional but
could still be scheduled — it stops the scoring, not the placement.

**A second audience axis.** `appliesTo` is anatomy-only. Saving a first
home deposit, being self-employed, being in a couple: three held or
general cards would be shown only to the people they are for.

**A product change the audit asked for.** "You may stop at any time"
belongs in the guided-session player itself, not only on a card somebody
read once before starting. A safety note reachable only outside the
session is not reachable during it, which is when it is needed.

## The rule that came out of this merge

Every piece of tooling that counts the library reads every file spread
into `PROTOCOLS`, discovered from the array rather than hard-coded. Three
separate tools got this wrong in the same way, and each one agreed with
itself, which is why nobody noticed for so long.
