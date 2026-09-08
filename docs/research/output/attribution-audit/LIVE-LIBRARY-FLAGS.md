# Flags in the shipped library

Found while auditing the research rounds; these are in the **live**
`src/features/knowledge/` files, not in a candidate round. The research
session cannot change them. They need an app-session decision.

Swept mechanically across all 204 cards carrying an attribution, on
8 September 2026.

## 0. URGENT — a shipped card is built on a retracted paper

**`ship-monthly`** (`protocols.ts:1626`, skill pillar, currently graded C).

Its `why` says that students who set their own spaced deadlines finished
better than those working to one distant deadline. Its entire attribution
line is `['Dan Ariely', 'Klaus Wertenbroch']`.

That is Ariely & Wertenbroch 2002, DOI 10.1111/1467-9280.00441,
**retracted 2 September 2026** after the data were found to be tampered
with or fabricated and a replication failed. The registry check prints
`DO_NOT_CITE`; Europe PMC types it "Retracted Publication".

**How it got missed is the more important part.** The paper has been in
`../corpus/RETRACTIONS.md` since the day the register was created. It was
filed under the money round, which found it, and nobody swept the
*already shipped* cards against the register. A register nobody sweeps
against is a bibliography.

That is now fixed: `../corpus/tools/retraction-sweep.js` checks every
card against the register by author and by claim pattern, and exits
non-zero so it can gate a build. **The rest of the library is clean** —
204 cards, one flagged, and it is this one.

**Proposed fix**, from the skill round: grade C to E, remove both
attribution credits, delete the deadline sentence from the `why`, and
keep the practice, which is sensible on its own and can be written warmly
without a fabricated study behind it.

## 1. Six cards breach the roster's Peterson rule

`COMMUNICATORS.md` says, of Jordan Peterson: *"keep, do not expand, and
never let his name be the only attribution on a card."*

Six cards have him as the only name. All six are in the connection
pillar, which is the pillar where a name on the card reaches someone who
did not ask for it, and four of them are about children or caring.

| file | id |
|---|---|
| `protocols.ts` | `friend-reach-out` |
| `protocols.ts` | `one-on-one-child` |
| `protocols.people.ts` | `carer-ask-for-cover` |
| `protocols.people.ts` | `teen-side-by-side` |
| `protocols.people.ts` | `teen-their-call` |
| `protocols.people.ts` | `adult-child-standing-call` |

His other seven credits satisfy the rule and sit beside Tim Ferriss,
Andrew Huberman or Barbara Fiese.

**Three options, and this is Isaac's call.** Add a second, genuinely
traceable name to each. Remove the credit and leave the field empty,
which the contract permits and which the Work round did twenty times.
Or replace him where another communicator demonstrably teaches the same
practice. The connection round is next but one and can do the work; the
rule breach exists now, which is why it is written down now.

Whichever way it goes, the author-list rule in `../corpus/METHOD.md`
applies to any replacement: a researcher credit requires that person on
the author list of a source in that card's row.

## 2. Three Sinclair credits sit in exactly the place the roster warns about

`COMMUNICATORS.md` recommends not adding **new** David Sinclair
attributions in longevity or supplements, because the library already
excludes by policy every compound he is associated with, and his name on
a longevity card puts a claim on the page that we refuse to make.

The three existing credits predate that guidance and are grandfathered by
it. Two of them are on longevity-adjacent cards:

| id | note |
|---|---|
| `sauna` | The pillar the roster names explicitly |
| `fasting-window` | Longevity-adjacent |
| `kitchen-closed` | Longevity-adjacent |

Not a breach, because the guidance was about additions. Worth a decision
anyway, since the recovery round has since written a much better-sourced
heat block and Rhonda Patrick's credits in that area were the only ones
in the whole audit that traced exactly, every time.

## 3. Concentration is high, and it is the top three

| Communicator | Cards |
|---|---|
| Peter Attia | 36 |
| Tim Ferriss | 34 |
| Andrew Huberman | 32 |
| Rhonda Patrick | 16 |
| Jordan Peterson | 13 |

218 distinct people are credited across 204 cards, which is genuinely
good breadth. But the top three carry 102 credits between them, and the
audit found that Huberman's are the least exact of any name checked: of
his 16 credits in the recovery round, 3 were exact, 11 adjacent and 2
untraceable.

That is not an argument for removing him. It is an argument for the
author-list rule and for pass two of every round, both now required. The
roster said to use him freely *and verify hard*, and the verification
half had not been happening.

## 4. What is clean

- **No card has an empty attribution** in the live library. Every one of
  the 204 names somebody. Given the Work round found twenty cards where
  an empty field is the honest answer, this is worth a look rather than
  celebrating: a library where every card happens to have a nameable
  populariser is a library that may have named some of them optimistically.
- **Tony Robbins**: zero sole credits. Rule satisfied.
- **David Sinclair**: zero sole credits.
- **Matthew Walker**: zero credits anywhere, across twelve sleep cards.
  The roster says his three credits are "about right", which suggests the
  count it was written against has since gone to zero. The audit judged
  two additions defensible, with the grades resting on primary literature
  rather than his book. Flagged, not assumed.
