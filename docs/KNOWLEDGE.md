# The knowledge base — sourcing policy and architecture

`src/features/knowledge/protocols.ts` is INTENT's evidence-based practice
library: structured protocols for sleep, training, nutrition, longevity,
mind, wealth, leadership and connection that the engine can plan
automatically.

## Sourcing policy

- **Ideas, not text.** Each protocol distils a practice discussed in the
  *public* teaching of well-known evidence-focused communicators — Tim
  Ferriss, Andrew Huberman, Peter Attia, Rhonda Patrick, Jordan Peterson,
  David Sinclair — and the research they cite. Everything is written in
  INTENT's own words; no transcript or article text is reproduced.
- **Attribution, not endorsement.** `attribution` credits whose public
  work popularised a practice. The UI states explicitly that this implies
  no endorsement of INTENT by these people.
- **No overclaiming.** Evidence language is calibrated ("associated with",
  "reliably improves") and a test bans cure/prescription language. Health
  protocols carry a plain-words `safety` note; the library header and
  every surface repeat "educational structure, not medical advice."
- **No substances.** The library contains behaviours only — no
  supplements, dosing, or anything requiring clinical judgement.

## Research rounds — how the base grows

The library is enriched by **build-time research agents**, one per pillar.
They produce candidate protocols as a reviewed change to this repository;
they never generate guidance live for a user. Two reasons, both binding:

- **It protects the simulation lab.** 2,000 users x 26 weeks runs in
  seconds because the engine is pure functions. Runtime model calls would
  make our published evidence impossible to reproduce.
- **It protects the claims.** Every protocol carries an evidence grade, a
  safety note and attribution under the sourcing policy above, and a human
  reviews each entry before it ships.

Each candidate must arrive with: what to do in one sentence; why it works
in plain words without overclaiming; an A-E grade **with the reasoning**;
a plain-words safety note; whose public teaching popularised it, as credit
not endorsement; and the scheduling shape (duration, days, and whether it
anchors to wake, to sleep, or to a fixed time). Anchor direction is a
correctness property, not a preference — the caffeine cutoff shipped wrong
for exactly this reason.

**Grade honestly or not at all.** A round where everything comes back A or
B has failed. The first round (August 2026) added 27 protocols across
relationships, family and adventure, money, leadership and mind, and
produced exactly two A grades. Connection protocols are graded C to E
throughout, and an integrity test now forbids an A in that pillar: nothing
about couple or family behaviour has support at the level of morning light
or strength training, and the library should say so.

Round two added 66 more across twelve pillars — sport and skill
acquisition, mobility, injury prevention, sleep depth, endurance,
longevity, focus and digital hygiene, learning, stress and burnout,
career, creative practice, and friendship. Across 119 protocols the
spread is A 6, B 43, C 40, D 23, E 7: strong evidence is 41% of the
library, and the integrity test holds it under half.

**Grade in both directions.** Round two also graded *up* where it was
deserved — retrieval practice and spaced review are genuinely A, among
the best-replicated findings in any pillar — and graded *down* on review:
`daily-walk` moved A to B, because it rested on the same observational
walking literature that had earned `step-floor` a B.

**Say what does not work.** A library that only ever adds practices never
tells anyone what to stop doing. Rounds are asked to name popular
practices the evidence contradicts, and several now appear in the
protocols' own copy: the ten-thousand-hours framing, blocked repetition,
internal body-part cueing, foam rolling and movement screens, the 10%
running rule, the "23 minutes to refocus" statistic, and the claim that
micro-breaks raise output. `LEARNING_ANTIPATTERNS` carries highlighting,
rereading and learning styles as a first-class piece of content.

Round three (177 protocols) ramped nutrition from 5 to 27 — it was the
thinnest pillar carrying a full pathway — and broadened goal coverage to
what people actually type: dieting and weight, meal planning, fibre and
gut and alcohol, the food environment, quitting, parenting, purpose,
communication, life admin, life transitions, and women's health, which
the library had ignored entirely.

**Two properties the protocol data could not previously express.**
`neverNag` marks a practice that must never produce a streak, an
adherence score or a missed-it suggestion: the adaptation engine learns
the same way on everything, so it cannot know not to tell someone three
weeks bereaved that they are 40% adherent. And `knowledgeContext` is now
scoped — past 150 protocols the full library stopped fitting a prompt, so
unscoped returns an index and scoped returns the summaries.

**Refusing retracted work is part of the job.** Round three excluded
"don't shop hungry" outright once an agent traced its modern source to a
retracted paper, named the smaller-plate effect as having failed its
first pre-registered test, and kept the whole bottomless-bowl lineage out
of the library — including its author from every attribution. The
five-stages model of grief is named as unsupported rather than used, and
nothing resembling psychological debriefing appears: it is one of the few
interventions in that literature whose evidence points the wrong way.

**The safety line tightens where the subject demands it.** Dieting
protocols all carry a safety note naming disordered eating and routing to
a GP or dietitian, and the library states no calorie target, goal weight
or rate of loss. Longevity excludes every compound. Injury prevention
declined to write the return-to-training half of its own brief, because
graded reintroduction after a named injury is clinical judgement. Women's
health excludes contraception, fertility and hormone therapy, and says
plainly that the popular cycle-phase training template is not supported.

**A grade taxonomy that fits reality.** Round two exposed a mismatch: very
large, consistent, meta-analysed cohort evidence (VO2 max and mortality,
say) is stronger than "moderate observational" but is not a controlled
trial. B and C were reworded rather than quietly mis-grading the
protocols.

Money protocols carry an extra constraint enforced by test: anything
touching debt, investing or a position number must name a licensed
professional as the next step, and no protocol may name a product,
platform, ticker or return figure.

## How the base enriches the pathways

One list feeds every surface, so the app stays coherent and reviewable:

1. **Interview → plan**: routines the interview builds (strength, sauna,
   wind-down, meditation, meal sketch, money check-in, deep work, friend
   reach-out) are stamped with `protocolId`, linking them to their
   evidence story.
2. **Goal wizard**: `buildGoalPlan` composes knowledge bundles — a fitness
   goal arrives with strength *and* Zone 2 (capacity-aware); business
   goals get the weekly-review protocol behind the growth block.
3. **Library screen** (`/library`, from Life and Settings): every protocol
   browsable with its what/why/attribution/safety; one tap
   (`toggleProtocol`) schedules it into the real week, anchored to the
   user's wake/sleep times, and the adaptation engine then learns on it
   like anything else.
4. **AI agents**: `knowledgeContext()` is injected into the planner and
   weekly-review system prompts with a hard instruction to recommend only
   from the library — the model narrates and personalises; it does not
   invent protocols.
5. **Scheduling**: `toRoutine` respects modality floors, capacity
   (minimal keeps could-tier practices ≤2×/week), and wake/sleep anchors.

## Adding a protocol

Add one object to `PROTOCOLS`. The integrity tests enforce: unique id,
substantive summary/why, attribution present, safety note on
training/longevity entries, modality-floor compliance, and prompt-sized
`knowledgeContext()`. If it serves a goal domain, list it in
`goalDomains` and the goal wizard and library pathways pick it up
automatically.
