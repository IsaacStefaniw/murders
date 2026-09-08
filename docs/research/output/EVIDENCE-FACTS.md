# Answers to the five asks — facts and sources, not copy

Written 8 September 2026 in response to a review of the marketing
proposal. **This document deliberately contains no website copy.** It
contains verified facts, the exact sentences that are defensible, and the
limits on each. Copy gets written against the guardrails by whoever owns
the page.

The boundary in the review is correct and worth restating: research
produced "Join the waitlist" as a call to action for a site that
structurally cannot store an email. That is what happens when research
writes copy. So this stops at the facts.

---

## 1. The sources manifest

**Built.** `corpus/tools/build-manifest.js` walks every ledger, extracts
each identifier with the context it sits in, and records how far the paper
was read. It writes two files:

- **`manifest.json`** — machine-readable. Render page numbers from
  `counts` here so they cannot go stale.
- **`MANIFEST.md`** — human-readable, 791 rows, one per paper.

Rerunning it twice produces identical counts, which was checked.

### The computed counts

| Measure | Value |
|---|---|
| Papers cited, with a DOI | **791** |
| Additional identifiers cited as PMID only | 409 |
| Read at least to registry level (bibliography and retraction checked) | 439 |
| Read at least to abstract level | 305 |
| Full text opened and read | 43 |
| Ledger files scanned | 76 |

Depth breakdown: `cited 352 · registry 134 · abstract 262 · fulltext 43`.

### How depth is assigned, and the limit that must travel with it

Depth is read from what each ledger row says about itself, never assumed.
A row claiming a full-text read is counted as full text; a row citing
Europe PMC or OpenAlex is counted as abstract; a row recording a Crossref
check is registry; a bare identifier is `cited`.

**This is a floor, not a measurement.** A row that does not describe how it
was read counts as `cited` even where it was read closely. So:

> **The defensible sentence:** "IntentNorth's research ledgers cite 791
> papers by DOI. 439 of them were checked at least to registry level for
> bibliography and retraction status."

Do not publish the full-text figure of 43 as though it were the whole of
the close reading. It is the subset where a ledger row happened to say so.

### For `/evidence`

`manifest.json` is the file to link and to render from. The counts object
is stable and named. If the page says a number that is not read from that
file, it will be wrong within a round.

---

## 2. The 113 denominator, and why it must not be a restraint claim

**Direct answer: no.** 113 is the **output**, not a funnel. It is the
number of candidate cards written across eight rounds. It is not
"113 assessed, 2 survived".

**The restraint claim as proposed is not available**, because rounds did
not systematically log every candidate considered and rejected. The
ledgers do name and reason about declined candidates — **at least 59 of
them**, counted from the explicit declined and held sections — but that
is a floor, not a complete funnel, and two rounds record their declines in
prose that the count does not capture. Publishing 59 as a denominator
would be inventing precision.

### The two numbers, and the framing that stops them colliding

They are different populations at different stages, and the page has to
say which is which in the same breath as the number.

| | Population | Cards | A grades | Share |
|---|---|---|---|---|
| **Shipped** | What is in the app today | 204 | 15 | 7% |
| **Proposed** | The 2026 research rounds, not yet merged | 113 | 2 | 2% |

> **The defensible framing:** "The library in the app today holds 204
> practices, 15 of them graded A. This year's research added 113 more, of
> which 2 are graded A."

Two sentences, two stated populations, no shared denominator. A reader
cannot construct a contradiction from that because neither number is
offered as a proportion of the other.

**What must not be said:** "only 2 of 113 earned an A" in a context that
implies 113 were assessed and 111 rejected. They were 113 written.

**The claim that is available and is stronger anyway** is in section 5:
this year's rounds graded existing cards *down* far more often than up,
and that is a funnel we did record.

---

## 3. The corpus, defined

### What was searched

| Measure | Value | How |
|---|---|---|
| Episode transcripts on the aggregator | **36,198** | All 38 sitemaps crawled, 7 September 2026 |
| Shows on the aggregator | **1,018** | Same crawl |
| Shows kept as relevant | **17** | Named below |
| Episodes routed to at least one pillar | **836** | `corpus-index.js`, keyword and roster-name routing over episode titles |
| Transcripts and reference pages actually read | **190** | Cached files |
| Words read | **2.6 million** | Word count of those files |

The 17 shows: Joe Rogan, Armchair Expert, Diary of a CEO, Mel Robbins
(two feeds), On Purpose, Lex Fridman, School of Greatness, Shawn Ryan (two
feeds), Ten Percent Happier, Freakonomics, Rich Roll, Modern Wisdom, Zoe
Science & Nutrition, Peter Attia Drive, Feel Better Live More. Plus, from
their own sites, the Tim Ferriss archive, Huberman Lab reference lists,
FoundMyFitness, Rational Reminder, Sigma Nutrition and Stronger By
Science.

### Date range, measured rather than assumed

The sitemaps carry only the crawl date, so a range was not recoverable
from them. It was established by **sampling**: 68 episodes, stratified at
four per show across all 17 shows, fetched for their published date.
**All 68 returned one.**

- **Earliest sampled: 26 April 2018. Latest: 6 July 2026.**
- Distribution is uneven and weighted recent: 2024 accounts for 28 of the
  68 sampled.

> **The defensible sentence:** "A stratified sample of 68 episodes across
> all 17 shows returned publication dates from April 2018 to July 2026."

Not "the corpus covers 2018 to 2026", which claims completeness the sample
does not support.

### How "appeared in none" was established — and its real limit

This is the claim that needs the most care, and the honest version is
narrower than the strong one.

**Method used:** title and slug search across the routed aggregator index,
plus full-text search of the free Tim Ferriss transcript archive, plus
reference-list extraction from Huberman Lab episode pages, per researcher
name.

**Not used:** show notes, published guest lists, other podcast platforms,
YouTube, or any show not in the 17 above.

So the finding is about **our searched corpus**, not about the whole
podcast world. A researcher could have appeared on a show we do not index
and we would not know.

> **The defensible sentence:** "We searched our corpus of 836 routed
> episodes plus the full Tim Ferriss transcript archive for each of the
> leading researchers named in our briefs. Eleven learning and mind
> researchers, four work researchers and nine relationship researchers
> returned no episodes."

Not "these researchers have never been on a podcast."

**One known false-positive class**, worth stating because it shows the
search is fallible in both directions: a name search returned four
apparent hits for one relationship researcher which were all news items
about an unrelated lawsuit against a similarly-named company. Her true
count in our corpus is zero. That correction is recorded in
`corpus/coverage.md`.

---

## 4. The retraction, settled

**Both accounts are true. They are different authors and different
events, and the proposal conflated them.**

Verified by checking the repository:

### Event one — excluded before shipping

`docs/KNOWLEDGE.md` describes round three excluding "don't shop hungry",
naming the smaller-plate effect as having failed its first pre-registered
test, and keeping the whole bottomless-bowl lineage out "including its
author from every attribution".

**That is the Brian Wansink lineage, and it checks out.** A search of the
entire `src/` and `docs/` tree returns **zero** occurrences of his name.
The library carries a comment in `protocols.ts` recording the exclusion,
and a live card explicitly distinguishes the portion-size evidence it does
use from the smaller-plate claim it does not.

> **True sentence:** "We excluded a body of widely repeated eating advice
> before it ever shipped, once its source was traced to retracted work."

### Event two — shipped, then caught

Ariely & Wertenbroch 2002, the standard citation for self-imposed
deadlines, was **retracted on 2 September 2026**. The card `ship-monthly`
carries that finding in its reasoning and both authors in its attribution.
It shipped before the retraction and was caught by the skill round six
days after it.

**It is still live and awaiting the fix**, which is the honest state.
Proposed: grade to E, both credits removed, the deadline sentence deleted,
the practice kept.

> **True sentence:** "One shipped card rested on a paper retracted in
> September 2026. We found it six days later with a sweep we built for
> exactly that, and the rest of the library came back clean."

### Why they are different, and why it matters to the copy

Different authors, different papers, different years, different responses.
One is proactive exclusion, one is reactive correction. **Both are good
copy and they are different sentences.** Running them as one story would
be the same error the retraction register exists to prevent: check the
identifier, never the author-year.

---

## 5. What was downgraded or removed

The most differentiated material, and it is a recorded funnel rather than
an inferred one.

**30 existing cards were regraded across eight rounds. Six of the eight
rounds moved cards down. No round upgraded a card that a previous round
had already graded.**

### Specific downgrades, with the reasoning

| Card | Was | Now | Why |
|---|---|---|---|
| The strength floor | A | **B** | Checking a conflict with a 147,374-person cohort showed the A rested on an agreement between pooled analyses that no longer exists. **The prescription survived; the grade did not.** |
| External focus of attention in motor learning | B | **D** | A robust Bayesian reanalysis of the field's own dataset found publication bias in every analysis and corrected effects near zero, against seven earlier reviews reporting the opposite. |
| The pillar's most-used meditation card | B | **C** | 65 trials and 5,489 people put the effect at g=0.21 with publication bias detected, and it shrinks further against active controls. |
| Interleaved practice drills | B | **C** | 54 studies: a medium pooled effect overall, "almost negligible" in applied settings, null in young participants. |
| A body-scan sleep card | C | **D** | Six trials, 330 people, no significant effect on most sleep outcomes, and objectively measured arousal pointing the wrong way. |
| An evening journalling card | B | **C** | Its mood claim holds. **Its sleep claim has no support** and the nearest meta-analysis is null. |
| A respite card for carers | C | **D** | Pooled trials found no significant effect on any carer outcome. |
| A protein-at-breakfast card | B | **C** | The per-meal ceiling and the amino-acid threshold underneath it were both searched for and neither was found. |
| `ship-monthly` | C | **E** proposed | Rests on a retracted paper. |

### Things removed or refused outright

- **A famous protein figure.** Four leading communicators state it as
  settled; the source paper's own analysis puts it at p=0.079 with a
  confidence interval spanning four-fifths of the range, and its
  discussion argues for a considerably higher number. **No card in the
  nutrition round names an amount.**
- **A divorce-prediction accuracy figure.** Real in the papers;
  crossvalidation drops accuracy from 89.7% to 69.3% and sensitivity from
  91.9 to 46. Not shipped.
- **"As bad as fifteen cigarettes a day."** Not in the paper it is
  attributed to.
- **A time-restricted-eating adherence claim**, withdrawn at verification:
  it traces to a conference abstract authored by the company's own chief
  executive, with no control group and no peer-reviewed publication.
- **A static-stretching debunk**, declined after checking. Discovery had
  cited the paper on chronic stretching rather than acute; the correct one
  finds a cost only at holds over a minute, nothing on jumping or
  sprinting, and its authors explicitly reject dropping stretching from
  warm-ups.
- **The strongest evidence in the mind round** — a therapist-delivered
  relapse-prevention programme — **deliberately not built**, because the
  app should not deliver treatment.
- **Three areas of a brief** (teenagers, blended families, adult siblings)
  returned nothing verifiable and were left empty rather than padded.

> **The defensible sentence:** "This year we regraded 30 existing
> practices. Six of our eight research rounds graded practices down, and
> none upgraded anything a previous round had already graded."

---

## Regenerating any of this

```bash
node docs/research/output/corpus/tools/build-manifest.js
node docs/research/output/corpus/tools/retraction-sweep.js
node docs/research/output/corpus/tools/check-round.js <round>
```

The first produces the manifest and its counts. The second checks the
shipped library against the retraction register and exits non-zero if
anything is flagged. The third reports a round's card count, grade spread
and attribution totals.
