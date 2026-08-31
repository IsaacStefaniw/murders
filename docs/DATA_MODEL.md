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


## Added in the training / measurement round

**`WorkoutLog` and `LoggedSet`** — what actually happened in a session,
separate from the plan item that says *that* it happened. Only a log can
feed a strength baseline or be corrected the next morning. Weight and reps
are stored as typed; estimates are derived on read and never written back
over the input. A session's e1RM observations are keyed to the log and
replaced on every save, so correcting a set corrects the baseline rather
than leaving a phantom personal best beside it.

**`Goal.targetDate`** — optional. Plenty of goals are directions rather than
deadlines, and a required date manufactures a failure nobody signed up for.
Where one exists, the trajectory engine can say whether the current rate
arrives in time.

**`BehaviourEvent.detail` and `.size`** — free text and a relative-to-usual
band. Deliberately not a quantity: a number becomes a total, a total becomes
a chart, and the chart is a restriction scoreboard aimed at the people least
served by one.

**`FoodPreferences`** — allergies, intolerances, dietary patterns, dislikes,
favourites, and an append-only enjoyment log. The allergen gate is
fail-closed: a dish is only offered when we positively know it is free of a
declared allergen, so "may contain" excludes and so does an unreviewed
ingredient list.

**`NotificationSettings`** — off by default, with a hard daily cap. Quiet
hours are derived from the person's own sleep time rather than fixed.
