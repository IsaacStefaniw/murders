# Build plan — vertical slices

The app stays runnable after every slice.

## Slice 1 — First value ✅
Welcome → Life Interview → structured profile → Life Operating Plan review →
generated Today screen. **Done** (local demo mode).

## Slice 2 — Goals & scheduling ✅
Goal creation → routine generation → deterministic weekly scheduling →
Plan tab. **Done.**

## Slice 3 — Check-ins & adaptation ✅
Morning approval, evening reflection, behaviour logging, adaptation engine
(slot-mismatch suggestions with reasons). **Done.**

## Slice 4 — Weekly review ✅
Deterministic weekly stats + narrative (AI when backend configured, template
fallback otherwise). **Done.**

## The next milestone — calendar reality (external review, round 2)

Before more behavioural features or modalities: **calendar → planner →
Today → Move → calendar update**. The critical test: *a meeting lands at
12:00 → the workout no longer fits → INTENT notices → proposes 4:30 → the
user accepts → both plan and calendar reflect it.* The `CalendarProvider`
seam exists (`lib/calendar/provider.ts`) and `generateDailyPlan` already
consumes real events over modelled work hours; the native build supplies
the EventKit implementation.

And the success bar for TestFlight is not "it installs": **seven real days
without manually constructing the week**, real calendar connected, moves
and skips happening naturally — then on Sunday, does Monday's INTENT
plan differently because it learned how the week was actually lived?

## Slice 5 — Backend & accounts 🔜
- Deploy `supabase/` (migrations + ai-proxy function).
- Email auth screens; store↔Supabase sync mirror behind the existing store
  actions; conflict policy: last-write-wins per entity for MVP.
- Turn on AI narratives/advice via the proxy.

## Slice 6 — Household 🔜
- Partner invitation flow (schema ready).
- Shared calendar items + date-night planning with explicit visibility.
- Babysitter-message automation as the first "act with permission" feature.

## Slice 7 — Fitness depth
- Program generation from training preferences; in-the-moment shortening
  (engine's `shortenWorkout` already handles the time math).

## Slice 8 — Calendar integration
- `CalendarProvider` abstraction (list/get/create/update/delete/availability)
  starting with Apple EventKit via expo-calendar; sync architecture;
  replace profile-derived work blocks.

## Behavioural mechanics track (runs across slices)
See [BEHAVIOUR_DESIGN.md](BEHAVIOUR_DESIGN.md) for the full ranked backlog.
Shipped: peak-end reflections, fresh-start framing, don't-miss-twice nudge,
chief-of-staff Today (Now/Next/Tonight/Looking Ahead — tiers stay in the
engine, out of the UI), move/shorten/skip as recorded behavioural events
(`planEvents`) with recovery-first skip flows, anticipation engine v1
(weekly look-forward check, gap invitations with interest-drawn ideas),
domain-aware conversational goal wizard, behaviour trigger capture,
evidence-source model (manual → healthkit/location/calendar later), and
location provider interfaces for the native build.
Next: implementation intentions (cue capture), HealthKit/calendar
auto-completion, contextual bandit over nudge timing, geofenced context,
widget + notification actions.
The acceptance criterion is executable: `src/features/__tests__/acceptance.test.ts`
asserts a stated life (partner, kids, job, business, training, behaviours,
friends, fun) leaves visible evidence across the generated week.

## Later
Notifications engine with fatigue protection, friends & connection, health
integrations (Apple Health, WHOOP, Oura, Garmin, Strava), travel, supplements
& commerce (with `recommendation_reason` transparency), voice.
