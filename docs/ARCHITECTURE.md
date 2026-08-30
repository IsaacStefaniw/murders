# Architecture

## Stack

- **Mobile:** React Native + Expo SDK 57 + TypeScript (strict), Expo Router.
  iOS first, Android preserved.
- **State:** Zustand (persisted to AsyncStorage) for app state; TanStack Query
  for async/server-derived state (AI calls, future Supabase sync).
- **Backend:** Supabase — Postgres + RLS, Auth, Edge Functions
  (`supabase/`). The app runs fully without it (demo mode, ADR-003).
- **Validation:** Zod for every AI output and (future) API boundary.
- **Testing:** Jest (`jest-expo`), focused on scheduling, adaptation,
  onboarding plan-building and AI parsing — the logic that must not break.

## Layout

```
src/
  app/            Expo Router routes — thin screens, no business logic
    (tabs)/       today / plan / life / intent
    check-in/     morning & evening modals
    goals/        goal creation modal
  components/     design system (text, screen, button, card, chip, …)
  constants/      theme tokens
  features/       feature logic, pure and testable
    onboarding/   interview script, answer → Life Operating Plan builder
    planner/      profile+routines → engine context
    today/        plan item row UI
    behaviours/   behaviour catalog (supportive copy, safety notes)
    review/       weekly stats computation
  lib/
    scheduling/   deterministic engine + adaptation engine (tested)
    ai/           provider abstraction, Zod schemas, agents, runStructured
    dates.ts      time helpers (minutes-from-midnight core)
    supabase.ts   client factory + configuration detection
  state/          Zustand store — single local-first source of truth
  types/          domain model (mirrors DB schema)
supabase/
  migrations/     SQL schema + RLS
  functions/      ai-proxy edge function (holds model API key)
  seed.sql        fictional dev data
```

## Key decisions (see DECISIONS.md for ADRs)

1. **Deterministic scheduling first.** The engine computes valid free windows
   and placements; AI prioritises and explains on top. AI can never produce an
   invalid schedule (ADR-002).
2. **Local-first demo mode.** All core loops run on-device with AsyncStorage.
   Supabase adds sync + auth + AI when configured (ADR-003).
3. **AI behind an abstraction.** One `AiProvider` interface; the only
   implementation calls a Supabase Edge Function so model keys never ship in
   the app. Every AI output is Zod-validated with deterministic fallback
   (ADR-004).
4. **Structured interview.** Onboarding maps answers directly to typed profile
   data; no reliance on parsing conversation.

## Extension points (architected, not built)

- `lib/ai/provider.ts` — swap model vendors server-side.
- `features/planner/generate.ts#workBlocks` — replace profile-derived work
  hours with a `CalendarProvider` (listCalendars/getEvents/…) when calendar
  integration lands.
- `visibility` column on shareable tables — household sharing without schema
  changes.
- `Suggestion.kind` union — new suggestion types (shorten_workout,
  connection, …) plug into the same accept/dismiss UI.
- `ai_recommendations` / `user_decisions` tables — server-side adaptation.
