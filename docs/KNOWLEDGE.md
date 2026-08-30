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
