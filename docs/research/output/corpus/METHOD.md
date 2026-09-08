# The standing method — every round, every coach

Written 8 September 2026 after Isaac asked a question the first two rounds
could not answer well: *did you actually read the transcripts, for all the
coaches?*

The honest answer was no. This file is the fix, and it is a requirement,
not a suggestion. `SOURCES.md` says where things are and `coverage.md`
says what is reachable; this says what a round must do with them.

**Proposed for `docs/research/README.md`.** The research session writes
only under `docs/research/output/`, so it sits here until the app session
folds it into the contract.

## What went wrong, precisely

The recovery round shipped 22 cards carrying **56 attribution credits** —
Andrew Huberman 16, Peter Attia 10, Rhonda Patrick 8, Andy Galpin 4 — and
its source ledger contains **zero episode references**. Its findings file
says podcasts "pointed at the literatures quickly", which is the right
use, but nothing recorded *which episode*, so no credit can be checked by
anyone, including us.

The papers in that round are fine. They were opened, graded and
retraction-checked at record level, and a review confirmed it. The gap is
the other half of the job.

That matters more than it sounds, because of what the contract already
says attribution is for: somebody opens a card, reads a name they
recognise, and starts from confidence rather than suspicion. Given
expectancy, that recognition is part of why the practice works for them.
A credit nobody traced is a claim about a real person's public teaching,
made from memory. Some will be right. The ones that are not are the
expensive kind of wrong, because the informed half of the audience is
exactly the half that will notice.

## The two passes, both required

A round is not done until both have run. They are independent and can run
in parallel.

### Pass one — the literature decides what is true

Unchanged from the first two rounds, which did this well.

1. `harvest.js lit "<topic phrase>" meta`, then again with `any`, reading
   the recent end as well as the most-cited.
2. `harvest.js abstract <doi>` for design, n, publication type,
   open-access status, citation count.
3. `harvest.js crossref <doi>` for the registry record **and the
   retraction or update relation**. Not optional: a load-bearing paper in
   the money round had been retracted six days earlier.
4. `harvest.js book "<topic>"` where mechanism or background is thin.
5. Every protocol gets a `sources.md` row with a resolvable DOI or PMID
   and two sentences of grade reasoning.

### Pass two — the communicators decide whose name is on the card

This is the pass that was missing.

6. `harvest.js search "<name>"` and `harvest.js tim "<name>"` for every
   roster name the brief touches, plus the brief's topic phrases. Go to
   the show's own site for shows the aggregator does not carry —
   `coverage.md` lists which.
7. `harvest.js fetch <url> "kw,kw"` on the episodes worth mining, and
   read the cached text where a claim needs context.
8. `harvest.js refs <url>` on the show's own episode page to get the
   papers the host listed, and check them against what pass one found.
9. **Every `attribution` name must be traceable to something you opened.**
   Record it. Where an episode overstates its paper, record that too —
   it is usually enthusiasm rather than dishonesty, and it is often the
   most interesting thing in the round.

## The new required artefact: `episodes.md`

Each round writes `docs/research/output/<area>/episodes.md` beside its
protocols, sources and findings. One row per episode actually opened:

| show | guest | date | URL | topics | cards it bears on |

Plus a credit ledger, one row per (card id, attributed name):

| card id | name | verdict | evidence | what they say, in our own words |

with `verdict` one of:

- **TRACED** — a specific episode, chapter, article or topic page where
  that person teaches *this* practice.
- **TRACED (adjacent)** — they cover the topic but not this practice.
  Reword the credit rather than removing it.
- **RESEARCHER** — a scientist credited for the underlying work rather
  than for popularising it. Legitimate, and it must say so.

  **The author-list rule.** A researcher credit requires that person on
  the author list of a source in that card's own `sources.md` row.
  Verify it with `harvest.js crossref`.

  This one rule would have caught every error the audit of the first two
  rounds found. Four recovery credits named researchers who are on no
  paper the card cites — credited by association with a field rather than
  with the work, which reads as authoritative and is not true. It costs
  one lookup.
- **UNTRACED** — searched properly, found nothing. **The credit comes
  off the card.** An empty attribution line is honest; a false one is
  not, and the recognition only works while it is real.

A round with no `episodes.md` is not finished, however good its papers.

## Backfill for what already shipped

- **Recovery and money**: audited together, output in
  `output/attribution-audit/`. All 47 cards and 116 credits.

  Recovery was the one with the real problem, and the audit confirms it
  precisely. Of Andrew Huberman's 16 credits, 3 are exact, 11 adjacent
  and 2 untraceable. Of Peter Attia's 10, 3 are exact, and on one card
  his stated public position runs *opposite* to what the card says. Four
  researcher credits fail the author-list rule above. The roster warned
  about exactly this when it said to use Huberman freely *and verify
  hard*.

  Two findings are the other way round and matter as much. **Rhonda
  Patrick's 8 credits all trace exactly**, several to the precise figure
  on the card, and she is under-used. And **Matthew Walker has zero
  credits** across 12 sleep cards, while Huberman and Attia are credited
  for material that on several of those cards is Walker's guest series on
  their own shows.

  The money round did the job properly. Its residual issues are
  structural rather than false: a host credited four times where the
  practice belongs to the guest, and twelve cards crediting no person at
  all because the Australian block reads as government agencies.
- **Every future round**: pass two from the start. Cheaper than an audit,
  and it finds *missing* credits as well as wrong ones, which is the
  upside — an uncredited card where a well-known voice demonstrably
  teaches the practice is a recognition opportunity left on the floor.

## What this is for

The goal Isaac set is that the coaches embody the leading voices in each
field *and* are right. Those are two different jobs, done in two
different places, and the library only has something competitors cannot
copy while both are done properly.

Pass one is why the grades can be trusted. Pass two is why anyone opens
the card in the first place.
