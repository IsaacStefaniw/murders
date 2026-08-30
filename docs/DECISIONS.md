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
