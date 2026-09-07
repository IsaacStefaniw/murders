# Research rounds — the shared contract

Nine briefs sit beside this file, one per coach and one per uncovered
pillar. **Read this first, then your brief.** This half is identical for
every round; the brief is what makes yours different.

You have web access. The session that wrote these does not. That is the
entire reason you exist: everything here has to be traced to a primary
source you can actually open, and the value you add over the existing
library is verification, not volume.

## What you are producing

Candidate `Protocol` objects for `src/features/knowledge/protocols.ts`,
plus a source ledger. **You are not shipping to users.** A human reviews
every entry before it goes near a build. Nothing you write reaches a phone
without Isaac reading it first.

The library is at **204 protocols**, graded A 15 · B 67 · C 73 · D 41 · E 8.
Read `docs/KNOWLEDGE.md` in full before starting — it is the sourcing
policy, it is binding, and it records what previous rounds already
excluded and why.

## The three source types, and what each is worth

**Peer-reviewed research is the only thing that sets a grade.** Journals,
systematic reviews, meta-analyses, position stands from professional
bodies. This is the evidence.

**Science journalism and journals' own summaries** help you find the
research and understand its context. They never set a grade on their own.

**Podcasts are discovery sources. They are never evidence.** This is the
rule that matters most, and the one that will be hardest to hold.

### Working with podcast transcripts

Transcripts are widely available and genuinely useful — a good long-form
episode will surface a body of work in an hour that would take you a day
to find cold. Use them for that and nothing else.

Four rules, all binding:

1. **Never reproduce transcript text.** Not a sentence, not a phrase.
   Every protocol is written in IntentNorth's own words. This is already
   policy for the whole library; it applies with particular force here
   because a transcript is a copyrighted work.
2. **Trace every claim to the study.** A podcaster says "there's a study
   showing X" — your job is to find that study, open it, and read the
   abstract and methods. If you cannot identify the study, the claim does
   not enter the library. No exceptions, however well-known the speaker.
3. **Grade the study, never the speaker.** A confident presentation of a
   single small crossover trial is a C. Fame is not evidence and the grade
   must not move because someone respected said it with conviction.
4. **Record where the podcast and the paper disagree.** This happens
   constantly, and catching it is one of the most valuable things you can
   do. When a popularised claim overstates what the paper found, write it
   into `findings.md` under **Overclaims found**, naming the claim, the
   paper, and the gap. Several of these belong in protocol copy as things
   people believe that the evidence does not support.

Attribution credits whose public teaching popularised a practice. It
implies no endorsement of IntentNorth, the UI says so, and you should
never write as though anyone has endorsed anything.

## Grading

`A` many studies agree · `B` tested and it held up · `C` some evidence,
not settled · `D` early days · `E` unproven. The precise wording is in
`protocols.ts` (`EVIDENCE_PLAIN` / `EVIDENCE_PRECISE`).

**A round that comes back mostly A and B has failed.** The current library
is 7% A. That is honest, it is the product's whole differentiator, and a
round that inflates it damages the thing it was meant to enrich. Most of
what anyone can teach you about your own life is not an A, and the app
says so out loud.

**Grade in both directions.** If you find an existing protocol graded
above what its evidence supports, say so — previous rounds moved
`daily-walk` from A to B on exactly that basis. A downgrade with reasoning
is as valuable as a new entry.

## Four things that will catch you out

**Retractions and failed replications.** Check every load-bearing study.
Retraction Watch, PubPeer, and the paper's own landing page. A previous
round traced "don't shop hungry" to a retracted paper and excluded the
whole lineage including its author from every attribution. Do the same.

**Underpowered single studies presented as settled.** Nutrition, sleep and
psychology are all full of these. n=12 crossover designs are C at best.

**Predatory and low-bar journals.** Some venues publish nearly everything
submitted. Check the venue before you lean on a paper.

**Effect sizes that are real but trivial.** A statistically significant
result that moves the outcome by 2% is not a practice worth putting in
someone's week. Say so rather than shipping it as a D.

## Say what does not work

Every brief must return practices the evidence contradicts, not only ones
it supports. The library already names the ten-thousand-hours framing,
blocked repetition, internal body-part cueing, foam rolling, movement
screens, the 10% running rule, the "23 minutes to refocus" figure,
micro-breaks raising output, the smaller-plate effect, the five stages of
grief, psychological debriefing, learning styles, highlighting and
rereading. Add to that list. A library that only ever adds practices never
tells anyone what to stop doing.

## Hard constraints

- **Education, never advice.** Never "prescription". Use programme, plan,
  practice, protocol. A test bans cure and prescription language.
- **Safety notes** in plain words on every health entry. 182 of 204 carry
  one.
- **No substances** beyond the existing supplements carve-out in
  `protocols.supplements.ts`, which has its own rules: no amount beyond
  what a named position stand states, every entry `neverNag`, and
  `SUPPLEMENT_SAFETY_LINE` verbatim. Still excluded: rapamycin, metformin,
  NAD precursors, resveratrol, hormone therapy, anything needing a result
  or a professional to decide.
- **Money entries** must name a licensed professional as the next step and
  may never name a product, platform, ticker or return figure. Enforced by
  test.
- **Anchor direction is correctness, not taste.** Whether something
  anchors to wake, to sleep, or to a fixed time changes what it is. The
  caffeine cutoff shipped wrong for exactly this reason. Deadlines
  (`anchor.deadline`) may be moved earlier and never later.
- **`neverNag`** on anything where a missed day carries no meaning —
  bereavement, redundancy, life transitions, supplements.
- **`appliesTo`** on anything not for everybody: `femaleAnatomy`,
  `pregnancy`, `menopause`. A man found pelvic floor training in his
  library once. Do not let it happen again.
- **Decline the parts that need clinical judgement.** A previous round
  refused to write the return-to-training half of its own brief because
  graded reintroduction after a named injury is a clinician's call. That
  refusal was correct. Make the same call where it applies and say why.

## Deliverables

Write to `docs/research/output/<your-area>/`:

**`protocols.ts`** — candidate objects, valid TypeScript against the
`Protocol` interface, ready to paste. Every field. Unique ids that do not
collide with the existing 204.

**`sources.md`** — one row per protocol: id, the primary source with DOI
or PMID and a resolvable link, study design, sample size, the grade, and
**two sentences on why that grade and not the one above it**. The grade
reasoning is the part a reviewer cannot reconstruct and the part that
makes the entry checkable.

**`findings.md`** — five sections:
1. What changed in this area's evidence since the library was written
2. **Overclaims found** — popularised claims the papers do not support
3. **Contradicted practices** — things people do that the evidence is
   against, with the citation
4. **Regrades proposed** — existing protocols whose grade should move, up
   or down, with reasoning
5. **What I declined to write, and why**

## Volume

Quality over count. **15-25 genuinely new, well-sourced protocols** is a
strong round. Forty thin ones is a worse outcome than twelve good ones,
and the reviewer's time is the constraint. If your area is already dense,
spend the round on regrades, contradicted practices and depth instead —
say so in `findings.md` rather than padding.

## Where this lands

One list feeds the interview, the goal wizard, the library screen, the AI
planner's context and the scheduler. A protocol is not a document — it is
a thing the engine places in a real person's week, at a real hour, with a
duration it has to honour. Write the scheduling shape as carefully as the
evidence.

## The nine briefs, in the order worth running them

| # | Brief | Pillar(s) | Now | Why this position |
|---|---|---|---|---|
| 1 | `BRIEF-recovery.md` | sleep 11, longevity 7 | 18 | Thinnest area, and where the sauna audience lands. Heat is the single biggest gap in the library. |
| 2 | `BRIEF-money.md` | wealth 11 | 11 | Joint-thinnest, carries the goal ladder, and Isaac rates it as needing work. |
| 3 | `BRIEF-work.md` | leadership 23 | 23 | Weakest grade spread (D 9, E 3). Shift work and non-desk roles are the association and employer wedge. |
| 4 | `BRIEF-nutrition.md` | nutrition 32 | 32 | Dense already; depth on protein, satiety, shift-work eating, alcohol. |
| 5 | `BRIEF-training.md` | training 27 | 27 | Strongest coach. Minimum effective dose and older adults are the gaps. |
| 6 | `BRIEF-relationships.md` | connection 31 | 31 | Widest gap between popular confidence and evidence. No A grades permitted. |
| 7 | `BRIEF-mind.md` | mind 40 | 40 | Largest pillar. Adverse effects of meditation is the priority. |
| 8 | `BRIEF-supplements.md` | (carve-out) | — | Narrow, rule-bound, high care. |
| 9 | `BRIEF-skill.md` | skill 22 | 22 | Best-evidenced already. Run short or run last. |

One brief per session. They are independent — nothing in brief 5 depends
on brief 1 having run — but where two overlap the later one should read
the earlier one's `findings.md` and cross-reference protocol ids rather
than duplicating. The known overlaps: shift work spans recovery, work and
nutrition; money-and-couples spans money and relationships; sleep and
consolidation spans recovery and skill.

## Handing one over

Give the session this README, its brief, and read access to the
repository. It needs `docs/KNOWLEDGE.md`,
`src/features/knowledge/protocols.ts` and, for the supplements round,
`protocols.supplements.ts`. It does not need the rest of the app.

It writes only to `docs/research/output/<area>/`. It does not edit
`protocols.ts`, does not run builds, and does not touch the branch that
carries the app. A human merges candidates in after review.
