# AI system

Not one giant chatbot prompt — a set of logical agents over one provider
abstraction. Architectural separation is logical; all agents currently share
the same underlying model via the `ai-proxy` edge function.

## Agents

| Agent | Input (minimised) | Output schema | Fallback |
| --- | --- | --- | --- |
| Daily planner advisor (`plannerAdvice`) | Plan items: times, tiers, titles, areas | `PlannerAdviceSchema` | Engine summary + must-tier priorities |
| Reflection analyst (`analyseReflection`) | Mood + reflection text | `ReflectionSignalsSchema` | Mood-derived sentiment |
| Weekly review (`weeklyNarrative`) | Aggregated stats + highlights (no raw journal) | `WeeklyNarrativeSchema` | Template narrative from completion rate |
| Life Interview processor | *(future)* — structured answers are already the source of truth | — | Structured path |
| Goal planner / workout adapter / relationship planner | *(future)* | — | Deterministic versions exist (goal→routine builder, `shortenWorkout`) |

The **adaptation engine** (`lib/scheduling/adaptation.ts`) is deliberately
deterministic, not an LLM: skip-pattern detection and slot suggestions are
computed from behaviour history, with reason and confidence attached.

## Rules

1. **Structured output only.** Every agent has a Zod schema. Parse → validate
   → one retry with error feedback → deterministic fallback. Invalid AI output
   can never corrupt user data.
2. **No database access for models.** AI returns suggestions; mutations happen
   only through explicit application logic after user acceptance
   (`acceptSuggestion`).
3. **Data minimisation.** Inputs are built from structured fields (times,
   tiers, counts). Raw journal text goes only to the reflection analyst, whose
   job is to analyse it. Names/emails are never included.
4. **Transparency.** Every suggestion shown to the user carries its `reason`.
5. **Safety.** The system prompt forbids medical advice and moralising;
   behaviour copy is supportive; the alcohol pathway includes a professional-
   support note and never advises abrupt cessation.

## Memory architecture (schema ready, sync pending)

- **Stable profile** — `profiles.life_profile` (long-lived facts).
- **Active context** — short-term circumstances (travelling, injured); planned
  as JSONB with expiry.
- **Behaviour history** — `daily_plan_items`, `behaviour_events`,
  `user_decisions`.
- **Derived insights** — `ai_observations`: confidence + evidence +
  `review_after`. AI speculation is never permanently treated as fact.
