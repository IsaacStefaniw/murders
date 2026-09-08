# The numbers, for marketing

Counted on 8 September 2026 from the actual work, not estimated. Every
figure below is reproducible from this repository, and each one says how
it was measured so nobody has to defend a number they cannot source.

**Read the "do not say" column.** Several of these become false with one
wrong verb.

## Tier 1 — safe to publish as written

| Claim | Number | How it was measured |
|---|---|---|
| Research papers cited | **791** | Unique DOIs across all research output, de-duplicated, malformed matches removed |
| Papers with a PubMed identifier | **409** | Unique PMIDs |
| Expert conversations read | **190** | Cached transcripts and reference pages actually opened |
| Words of expert conversation read | **2.6 million** | Word count of those transcripts |
| Named sources cited | **110** | Unique episode and article URLs cited in the ledgers |
| Practice cards written | **113** | Across eight coaches |
| Cards in the library once merged | **317** | 204 live plus 113 new |
| Experts credited | **218** | Distinct people credited in the live library |
| Coaches researched | **8 of 9** | Supplements remains |
| Words of research written | **470,000** | The ledgers, source rows and findings behind the cards |

## Tier 2 — safe with the wording given

| Claim | Number | The wording matters because |
|---|---|---|
| "The equivalent of **293 hours** of listening" | 293 | We **read transcripts**. We did not listen. At 150 words a minute, 2.6 million words is 293 hours of speech. Say "the equivalent of", or say "read". **Do not say "hours listened".** |
| "Searchable across **36,198** episodes from **1,018** shows" | 36,198 | That is the corpus we can search, not the corpus we read. Say "searchable across", never "we analysed". |
| "**219 randomised trials and 167,864 participants** behind our falls-prevention card" | exact | True of that one card. Do not generalise it to the library. |
| "**24,804 people across 28 countries** behind our gratitude card" | exact | Same. Per-card, not library-wide. |

## Tier 3 — the trust claims, which are the interesting ones

These are harder to copy and worth more than the volume numbers.

**Half our new cards carry no famous name.** 56 of 113, exactly 50%. Not
an oversight. The researchers whose work the best cards rest on do not do
podcasts: across five pillars we searched the entire corpus for the
leading names in each field and found **zero episodes** for eleven
learning and mind researchers, four work researchers, and nine
relationship researchers. Where nobody has earned the credit, the line is
empty.

**We grade down more often than up.** Across eight rounds, thirty existing
cards were regraded. Six rounds moved cards **down**, including our own
only top-grade card in recovery. No round upgraded a card that a previous
round had already graded.

**Two of 113 cards claim settled science.** The grade spread is A 2, B 31,
C 51, D 26, E 3. Most of what anyone can tell you about your own life is
not settled, and the app shows you which is which.

**We caught three retracted papers still in circulation**, one of them
cited 824 times six years after retraction, and one that had reached a
card in our own library. The checker now refuses them by name.

**85 of 113 cards carry a safety line. 50 can never be nagged about.**
Cards about grief, redundancy, caring and shift rosters do not get streaks
or adherence scores.

## Lines you could run

- "791 papers. 2.6 million words of expert conversation. 113 practices."
- "We read the whole paper, not the abstract. Twice this year that changed the answer."
- "Half our practices have no famous name on them, because the people who did the research do not have podcasts."
- "Two of our 113 new practices claim to be settled science. We will tell you which."
- "We grade our own advice down more often than up."
- "Three of the papers behind popular advice have been retracted. We check every one."

## Claims to avoid

| Do not say | Because |
|---|---|
| "Hours listened to" | We read transcripts. Use "read" or "the equivalent of". |
| "We analysed 36,000 episodes" | We can search that many. We read 190. |
| "Peer-reviewed app" or "clinically proven" | Neither is true and both invite trouble. |
| "Backed by 791 studies" | The studies back individual cards at stated grades, not the app as a whole. "Cites 791 papers" is the safe form. |
| Any per-card number as a library-wide claim | The falls card has 219 trials behind it. Most cards have far less, and the grade says so. |
| A protein figure, a divorce-prediction figure, or "as bad as 15 cigarettes a day" | All three failed verification this year and are in the retraction register. |

## Where the numbers come from

Reproduce any of them:

```bash
node docs/research/output/corpus/tools/check-round.js <round>
node docs/research/output/corpus/tools/retraction-sweep.js
```

Card counts, grade spreads and attribution totals come from the first.
The papers, words and sources come from counting the ledgers under
`docs/research/output/`.
