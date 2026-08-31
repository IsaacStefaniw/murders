# Decision log

Short ADR-style entries for consequential decisions only.

---

## ADR-001 — Repository naming (2026-08-30)

**Decision:** The project is `intent-os` everywhere in code (package name, app
slug, docs). The GitHub repository itself is still named `murders`.

**Reason:** The repo name predates the project and cannot be changed from
inside the repository — renaming a GitHub repo is an owner action in GitHub
Settings (Settings → Repository name → `intent-os`). GitHub redirects the old
URL automatically, so the rename is safe at any time.

**Consequences:** No code references "murders". Once the owner renames the
repo, only local clone directories need updating.

---

## ADR-002 — Deterministic scheduling engine, AI on top (2026-08-30)

**Decision:** A pure, tested TypeScript engine computes free windows and
places routines (buffers, protected time, reserved slack, tier-based
dropping). LLMs never emit schedules; they prioritise, explain and suggest
among valid placements.

**Alternatives considered:** LLM-generated schedules (rejected: hallucinated
conflicts, unverifiable, slow, expensive); constraint-solver library
(rejected: overkill for MVP interval placement).

**Consequences:** Scheduling is instant, offline, and testable (22 unit
tests). AI quality issues can never corrupt a day plan.

---

## ADR-003 — Local-first with demo mode; Supabase when configured (2026-08-30)

**Decision:** Zustand + AsyncStorage is the source of truth on device. The
app is fully functional with zero backend. When `EXPO_PUBLIC_SUPABASE_*` env
vars exist, Supabase provides auth, sync and the AI proxy.

**Reason:** The core loop (plan → act → observe → adapt) must work on day one
and offline; a backend requirement would block validation of the product
hypothesis. Also satisfies the offline requirement cheaply.

**Alternatives considered:** Supabase-required with offline queue (rejected
for MVP complexity); WatermelonDB/SQLite sync (premature).

**Consequences:** Sync layer is the next backend milestone; the store's
action-based API is the seam where mirroring to Supabase slots in. Auth UI is
deferred until sync exists (nothing to sync yet).

---

## ADR-004 — AI via edge-function proxy with Zod-validated outputs (2026-08-30)

**Decision:** One `AiProvider` interface. The sole implementation calls the
`ai-proxy` Supabase Edge Function (JWT-gated), which holds the model API key
and forwards minimised inputs. Every agent defines a Zod schema, one retry,
and a deterministic fallback.

**Reason:** No secrets in the client; vendor swap is server-side; core
features keep working when AI is down (fallbacks are real implementations,
not error states).

**Consequences:** AI features degrade gracefully to deterministic behaviour.
The model never has database access; accepted suggestions flow through
explicit store actions.

---

## ADR-005 — Text-only minimal tab bar (2026-08-30)

**Decision:** Four text tabs (Today / Plan / Life / Intent), custom minimal
tab bar, no icon library.

**Reason:** Matches the calm/near-empty design language, avoids an icon
dependency, and keeps the surface area small. Settings lives behind Life, not
in the tab bar.

**Consequences:** Revisit if user testing shows discoverability problems.


## ADR: estimated 1RM is claimed only for unambiguous barbell lifts

A goblet squat is not a back squat and a Romanian deadlift is not a
deadlift. Writing either into `strength.*.e1rm` corrupts the baseline every
future prescription is computed from, and the person never learns why their
loads went strange. `liftFor()` is deliberately strict and returns null on
anything ambiguous; sets past twelve reps make no strength claim either,
because Epley drifts badly there and a twenty-rep set is an endurance fact.
A session of accessories is recorded in full and claims nothing. A false
negative costs one metric reading; a false positive costs the programme.

## ADR: no chart library

The app has no `react-native-svg`, not even transitively — the icon set is
SF Symbols. Adding one to draw a sparkline would mean a native dependency
and a fresh build for the sake of a line. Charts are built from flexbox with
percentage heights. The constraint chose bars over lines, which is the
better answer at this size anyway: a line four hundred pixels wide invites
people to read a slope off eight noisy points, and where a slope is
trustworthy the trajectory engine states it in words instead.

## ADR: consistency is shown as a dot grid, never a streak

A streak counts consecutive days and resets to zero on one missed Tuesday,
which punishes the ordinary shape of a life. A grid shows a good fortnight
with one gap in it as a good fortnight. Nothing in the Data tab scores the
person: no adherence percentage, no grade.

## ADR: projections refuse to run on thin data

Three readings across fourteen days is the floor, below which the answer is
"not enough yet". A projection is a promise about the future and a wrong one
costs more trust than a blank space. The fit is least squares rather than
first-vs-last, so one bad-scales morning moves the answer a little instead
of turning a slow month into a crisis. Direction of progress comes from the
goal's own condition, never from the gap between now and target — a 100 kg
bench goal with 105 kg on the bar is achieved, and inferring direction from
the gap reports "going the wrong way" at the moment the person succeeded.

## ADR: notifications are capped, quiet-hour-aware, and off by default

The failure mode is not a bug — it is a person turning notifications off,
and with them the one nudge that would have landed. Hard cap of three a day,
priority-ordered, with anything past the cap dropped rather than deferred.
Quiet hours derive from the person's own bedtime, and a notification landing
inside them moves EARLIER, never later — the same rule the scheduler applies
to a deadline anchor. Nothing is ever sent about a `neverNag` protocol.
Permission is requested at the moment someone opts in, never on launch: iOS
offers that prompt once.

## ADR: no marketing claim outruns the code

PRODUCT.md opened with "AI-powered" and the paywall sold an "AI coach" while
the shipped build performed zero inference. Both are corrected, the paywall
now separates what runs from what does not, and `claims.test.ts` fails if
either drifts again. Delete that test in the same commit that turns a model
on — not before.
