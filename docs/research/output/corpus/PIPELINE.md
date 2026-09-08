# The research pipeline — restructured

Written 8 September 2026, replacing the one-brief-at-a-time structure.

Isaac's direction: *research first, as much as possible; podcasts as the
first gate, then research articles, then build into the coaching
segments, define protocols and ladder into the best coaches known to
humanity — their knowledge base can allow them to learn and craft their
journeys and protocols.*

This supersedes the sequencing in `docs/research/README.md` ("The nine
briefs, in the order worth running them"). The briefs themselves survive
and are still the per-coach specification. What changes is that they stop
each doing their own discovery and start consuming one shared corpus.

## Why the old structure was wrong

Nine sequential rounds, each doing its own discovery, has three faults
that only became visible once the corpus was measured.

**It refetches everything.** A single Huberman sleep episode bears on
recovery, mind and skill. Under the old structure three separate rounds
would each find it, each fetch it, and each read it for their slice only.

**It makes convergence impossible.** The roster's best prioritisation
signal is that six independent credible people land on the same practice.
You cannot see that from inside one pillar's slice. Convergence is a
property of the whole corpus.

**It let the transcript pass be skipped without anyone noticing.** The
recovery round shipped 56 attribution credits with zero episode
references, and nothing in the structure caught it, because discovery was
internal to a round and invisible afterwards.

## The corpus, measured

Built once, cross-field, by `tools/corpus-index.js`:

**836 episodes routed to at least one pillar** from the transcript
aggregator, 61 of them featuring a roster name.

| Pillar | Episodes |
|---|---|
| skill | 233 |
| mind | 225 |
| connection | 183 |
| nutrition | 91 |
| wealth | 72 |
| leadership | 69 |
| training | 57 |
| sleep | 53 |
| longevity | 32 |

Plus, from the shows that publish their own archives: 850+ full Tim
Ferriss transcripts, 427 Huberman Lab episodes with free reference lists,
and the FoundMyFitness transcripts and topic pages (its sauna page alone
carries 97 linked papers).

Two things fall straight out of that table.

**The podcast corpus is richest exactly where the library is weakest on
sourcing and thinnest where it is strongest.** Skill, mind and connection
have 641 episodes between them and have never been researched. Sleep and
longevity, the two pillars already done, have 85.

**Guest-titled shows are undercounted.** Rogan, Lex and Ferriss name
episodes after the guest, so no topic word appears in the slug. Those
route by roster name only. For them the entry point is a name search, not
a topic search, which is a method note rather than a gap.

## The gates

### Gate 0 — Corpus. Once, not per round.

`corpus-index.js sitemaps` then `build`. Produces the routed episode
index. Regenerate when a round finds it stale. The index lives in the
cache, not the repo: it is a work list naming tens of thousands of URLs
and it is reproducible in two commands.

### Gate 1 — Podcast discovery. Cross-field, all nine pillars at once.

Read the routed episodes. For each, extract every practice claim in our
own words, with the paper or researcher the speaker points at. Output one
shared claims table, not nine.

Then score convergence: how many independent credible communicators land
on the same practice, and are they citing each other or the same single
study. **Convergence sets the order of work. It never sets a grade and it
is never evidence.**

**One honest caveat on podcast-first, now measured rather than asserted.**
Podcast attention is not evidence weight, and the gap is larger than it
looks. The Work round's transcript pass searched the whole aggregator
index *and* the entire Tim Ferriss archive for the four best-evidenced
researchers in that pillar — Sonnentag, Maslach, Amabile, Edmondson — and
found **zero episodes between them**. Gloria Mark appeared once, as a
guest on Freakonomics. Meanwhile the query "burnout" returned twenty
episodes, **none of them by a burnout researcher**.

A pure podcast-first funnel would therefore have missed psychological
detachment, the progress principle, psychological safety and the
individual-versus-organisational burnout finding, while faithfully
capturing twenty episodes of people talking about burnout without the
evidence. It would systematically over-weight whatever is currently
sellable.

So Gate 1 has two inlets, and podcast-first governs priority rather than
eligibility:

1. **Podcast convergence** decides what gets verified first, and supplies
   the names that go on the cards.
2. **A literature sweep per pillar** (`harvest.js lit "<topic>" meta`)
   catches the well-evidenced practices nobody is talking about.

Anything arriving through inlet 2 gets a card with an honest empty or
researcher-only attribution, which is exactly what the credit rules
already allow. The Work round's strongest new candidate, the drive home
after a night shift, has nobody in the corpus covering it and will ship
with an empty attribution. That is the system working, not failing.

### Gate 2 — Literature. Verification and grading.

For every candidate practice from Gate 1: find the papers, read design
and n, grade the practice (not the paper, and not the speaker), and check
the retraction status at the registry. Record where the episode overstates
the paper.

This is the gate the first two rounds already did well. It does not
change.

### Gate 3 — Coaching segments.

Assign each verified practice to the coach or coaches that will speak to
it. Cross-pillar practices get one card and multiple `goalDomains`, not
duplicate cards. This is where a shared corpus pays off directly: shift
work spans recovery, work and nutrition, and under the old structure that
was a coordination note between three rounds that never actually ran
together.

### Gate 4 — Protocols.

Write the `Protocol` objects: the honest grade, the warm copy, the
scheduling shape, the safety line, the attribution. Unchanged, and the
existing rules all still apply.

### Gate 5 — Ladders.

New, and the part the current library is thinnest on. A pillar is not a
list of good practices; it is an order. The money round has one and it is
the best thing in it: automate, then buffer, then expensive debt, then
three months, then invest. Each rung is a finish line, and the coach can
say "that is the hard one done".

Every pillar needs its ladder made explicit: what comes first, what is
wasted until the rung below is solid, and what the coach says at each
transition. Recovery has an implicit one (sleep opportunity before sleep
quality before heat and cold). Nobody has written it down.

### Gate 6 — The knowledge base.

What the coach reads in order to craft a journey, as opposed to what it
shows on a card. Card copy is one screen; the knowledge base is the
reasoning behind it — why this rung comes before that one, what to say
when someone stalls, which practice to offer when the obvious one is
refused, where the evidence is thin enough that the coach should say so.

Each round contributes to it rather than only emitting cards.

## What each round now produces

| Artefact | Status | What it is |
|---|---|---|
| `protocols.ts` | existing | Candidate `Protocol` objects |
| `sources.md` | existing | One row per card: papers, design, n, grade reasoning |
| `findings.md` | existing | What changed, what is solid, what is overstated, time back, regrades |
| `episodes.md` | **new, required** | Every episode opened, and a credit ledger with a verdict per card and name |
| `ladder.md` | **new** | The pillar's order, and what the coach says at each rung |

A round with no `episodes.md` is not finished, however good its papers.
That rule is in `METHOD.md` and it exists because the recovery round
would have failed it.

## Where things actually stand

| Pillar | Gate 0 | Gate 1 | Gate 2 | Gates 3–5 | Output |
|---|---|---|---|---|---|
| sleep, longevity (recovery) | — | retrofitted by audit | done | done | `output/recovery/` + audit |
| wealth (money) | — | partial, ledger only | done | done | `output/money/` + audit |
| leadership (work) | done | done | done | done | `output/work/` |
| mind | done | done | running | — | `output/gate1/mind-skill.md` |
| skill | done | done | running | — | `output/gate1/mind-skill.md` |
| connection | done | running | — | — | — |
| nutrition, training | done | — | — | — | — |
| supplements | done | — | — | — | — |

The Work round was the first to run both passes and the first to produce
`episodes.md` and `ladder.md`. Mind and skill were mined together in one
Gate 1 pass, which is the restructure working as intended: 48 episodes
read once and used for both pillars.

The attribution audit backfills recovery and money, and it produced a
third artefact nobody planned for: `output/attribution-audit/LIVE-LIBRARY-FLAGS.md`,
recording rule breaches in the shipped library that only an app session
can fix.

After that, the remaining pillars should run in the order the corpus
suggests rather than the order the old README set:

1. **Mind** (242 episodes) and **skill** (233) — the richest podcast
   coverage in the corpus and both untouched.
2. **Connection** (183) — third richest, and the pillar where warmth
   matters most.
3. **Nutrition** (91) and **training** (57) — good coverage, and the
   pillars where the literature is strongest, so Gate 2 carries more of
   the load.
4. **Supplements** — narrow and rule-bound, runs last regardless.

That is close to the reverse of the old order, which was set by how thin
each pillar was rather than by what could actually be sourced well.

## The finding that keeps repeating, now across three pillars

Every round run under this structure has found the same thing, and it is
the strongest argument for the two-inlet design.

| Round | Best-evidenced researchers | Podcast episodes found |
|---|---|---|
| work | Sonnentag, Maslach, Amabile, Edmondson | **0 between them** |
| mind, skill | Dimidjian, the Bjorks, Roediger, Karpicke, Rohrer, Wulf, Pennebaker, Segal, Goldberg and two others | **0 between them** |

Meanwhile the same corpus returns twenty episodes on burnout by no
burnout researcher, and nothing at all on behavioural activation,
retrieval practice, spaced repetition or deliberate practice.

The practical rule this produces: **the more rigorous the underlying
science, the less likely a podcast covers it.** Podcast discovery finds
what is being sold and what is being argued about. The literature inlet
finds what is true and quiet. A library built on either alone would be
badly wrong in a different direction, and the cards that come through the
quiet inlet are the ones that ship with an empty attribution.
