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

## ADR-005 — Text-only minimal tab bar (2026-08-30, revised 2026-09-01)

**Decision:** Four text tabs, custom minimal tab bar, no icon library.
Settings lives behind Coaches, not in the tab bar.

**Reason:** Matches the calm/near-empty design language, avoids an icon
dependency, and keeps the surface area small.

**2026-09-01 revision — the labels.** The bar had grown to five: Today,
Plan, Life, Data, Intent. Three of those were abstract nouns that could
have sat on any screen in the app, and one was the product's own name — a
tab called "Intent" tells a first-time user nothing about what is behind
it. It was also the thinnest of the five, and everything on it (the week's
report, suggestions, the weekly review) answered the same question the
numbers tab already asks. It merged in.

Now **Today · Week · Coaches · Progress**. The rule the four follow is to
name the content, not the concept: "Week" is a calendar, "Coaches" is where
the seven coaches live. Neither needs a sentence underneath it, which was
the whole point.

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

---

## ADR-014 — A claim opens the door; evidence keeps it open (2026-09-01)

**Decision:** Every pathway has a four-rung level (Foundation, Developing,
Established, Advanced). A declared experience level is believed immediately
up to Established. Advanced is earned from logged work only, never selected.
Stepping back is always available and never automatic.

**Reason:** `experience` sat on TrainingInputs and was never read — a
first-timer and a decade-deep lifter received byte-identical blocks. Fixing
it raised the harder question of who decides the level.

Making people prove themselves before the app takes them seriously is an
insult and they leave. Letting a form field unlock top singles and an
overreach week is unsafe for whoever picks the flattering option. So the
claim buys everything short of the top rung, and the top rung needs a log.

For training, Advanced additionally requires three baselined lifts and
measured progress on two, over at least eight weeks. Deliberately NOT a
population strength table: we never ask anyone's sex, and applying one
sex's numbers to everybody would make the gate quietly wrong for half the
people it judges. Training age is also the better question — it is what
decides whether top singles are a tool or a stunt.

Demotion is never automatic. A thin log is far more often a busy fortnight
than a lie, and an app that quietly decides you were exaggerating is one
people stop being honest with.

**Consequences:** A Foundation block cannot produce a deadlift or overhead-
press baseline, so nobody reaches Advanced without passing through the
levels where those lifts are taught. That is intended, not incidental.

---

## ADR-015 — A short interview spine, depth asked by the coach that wants it (2026-09-01)

**Decision:** Ten opening questions — nine the scheduler cannot build a
correct first week without, plus existing habits. The other eighteen move
to the pathway that consumes them and are asked one at a time. Every spine
question shows what it just changed.

**Reason:** Twenty-eight questions stood between opening the app and seeing
it do anything: too long to survive for someone still deciding whether to
bother, and no more convincing for the length, because a question that
changes nothing you can see is just a form.

Length is not the problem — unrewarded length is. Four questions to set up
the Training coach is configuration you asked for; the same four in a wall
of twenty-eight from a stranger is an interrogation. Same questions,
opposite experience.

Existing habits is core despite being optional, because it decides whether
a routine is created as an established anchor or prescribed back as
something new. Answered later it would change nothing already built, and
the app would have spent its first week telling someone who has meditated
daily for a decade to try meditating.

**Consequences:** Profiles created before the split have no stored answers,
so they are reconstructed from the profile on rehydration. What the profile
cannot prove stays unanswered and is asked once — `outdoors` is where both
`outdoors` and `walking` land, and guessing wrong hands a walker a barbell
programme.

---

## ADR-016 — Recovery signals are read against the person, never a population (2026-09-01)

**Decision:** HRV and resting heart rate are compared only to the person's
own fourteen-day median, excluding today. VO₂max prescribes from the
individual's ninety-day direction and never classifies them. BMI is shown
only beside waist-to-height and beside the sentence saying what it cannot
tell.

**Reason:** Healthy adults span roughly 20ms to 200ms of SDNN, so one
person's excellent is another's alarming, and colouring a number against a
published band tells half the users something false. VO₂max reference
tables are split by sex, which we do not ask for. BMI shown bare tells a
strong person they are overweight — wrong, and the kind of wrong that costs
every other claim the app makes.

A median rather than a mean because a bad run must not quietly redefine bad
as normal; excluding today because otherwise an unusual morning compares
against itself and looks ordinary.

**Consequences:** The readiness card is silent most mornings, which is what
makes it worth reading on the morning it appears. A low reading costs
accessory volume and never the main work — the session people actually skip
is the one that got cancelled for them.
