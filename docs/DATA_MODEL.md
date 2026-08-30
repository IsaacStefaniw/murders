# Data model — the Personal Life Graph

Client types live in `src/types/domain.ts`; the database schema in
`supabase/migrations/`. Keep this file honest when either changes.

## Core entities

```
profiles ── life_profile (JSONB: stable facts — priorities, people,
│           work pattern, wake/sleep, training prefs, more-of/less-of)
│
├─ households ── household_members (role: owner/partner/member)
│
├─ goals ── goal_milestones
│    └─ routines            goal → recurring behaviour → schedule
│
├─ routines                 days[], duration, preferred window, energy,
│                           flexible, protected, tier — engine input
│
├─ daily_plans ── daily_plan_items
│                           the engine's output + user outcomes
│                           (completed/skipped/rescheduled) — the
│                           behaviour history the system learns from
│
├─ behaviour_intentions ── behaviour_events
│                           supportive tracking: occurrence, trigger, context
│
├─ reflections              morning/evening check-ins (mood, text)
├─ journal_entries          always private by default
│
├─ ai_observations          derived insights: confidence, evidence,
│                           review_after — hypotheses, never facts
├─ ai_recommendations       suggestions with reason + payload + status
├─ user_decisions           accepted/dismissed/ignored — feeds adaptation
│
└─ notification_preferences granular category toggles
```

## Conventions

- All times of day are `time` columns (client: `"HH:MM"` strings; engine:
  minutes-from-midnight). Dates are `date` (client: `"YYYY-MM-DD"`).
- `days smallint[]` uses `0=Sunday … 6=Saturday`, matching JS `Date.getDay()`.
- `visibility` enum on shareable resources: `private` (default),
  `shared_with_partner`, `household`, `specific_people`.
- JSONB where flexibility beats joins (`life_profile`, observation content,
  recommendation payloads); relational columns where the engine or RLS needs
  them.

## Deliberately not built yet

Tables for calendar connections/events, workouts, places, trips, integrations
and commerce are deferred until their vertical slices — schema sophistication
without a consuming feature is cost, not progress.
