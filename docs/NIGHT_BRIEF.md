# Night brief — six waves to shippable

Written for myself, to be executed unattended. The test for every change:
**does it strengthen the loop?** (VISION.md — Goal → Milestones → Program →
Check-ins → Adaptation). Anything that doesn't, doesn't get built tonight.

Standing constraints: no fabricated evidence; health, money and food content
is education, never advice; nothing that moralises food; recovery support is
never gated; every wave ends green (tsc + lint + jest) and committed.

---

## Where the product actually is

Strong: the scheduler, the 177-protocol knowledge library, the goal
composer, paths, the behaviour pattern engine, the Personal Performance
Model's shape.

Weak, and all of it in the same place — **the app cannot see what you
actually did, and cannot tell you where you are heading.**

- Training records a tick per set. No weight, no reps. So `strength.*.e1rm`
  — the spine of the Performance Model — has never once been fed by a real
  session. The model has a memory and nothing puts anything in it.
- Meditation is a countdown. Isaac's note: "should be guided."
- There is no chart anywhere in the app, and no data screen. Isaac asked
  for one directly.
- Nothing projects. `assessGoals` marks a milestone done from evidence and
  `goal_stalled` notices silence, but nothing says *at this rate you arrive
  in March and your target is January.* That sentence is the co-pilot.
- Goals and milestones cannot be edited. A plan you cannot change is a
  plan you abandon.
- Nutrition preferences (allergies, intolerances, dislikes, favourites)
  exist in `food.ts` and reach no screen.
- The intervention timing built tonight has no way to reach a phone.

## The waves

### A — Training capture
Weight and reps per set, editable during and after. Last-time reference
inline ("last time: 100 kg × 5"), which is the single most used feature of
every gym app that works. Epley e1RM written to the metrics stream, so the
model finally has training input. A completed session stays editable.

### B — Guided meditation
Scripted, timed guidance riding the same elapsed-time phase engine as
`breathe.tsx` (all state derived from elapsed seconds — no timer drift, no
audio dependency). Several scripts across practices, progressing with the
existing `features/mind` practice levels.

### C — Trajectory and data
The projection engine: for any metric-backed goal, fit the trend, project
to target, compare with the deadline, and say plainly whether the current
rate arrives in time and what change closes the gap. Then chart primitives
built from plain views — no new native dependency — and a Data screen:
metric trends, training volume, adherence shape, behaviour windows,
milestone velocity. Honest empty states everywhere; "not enough yet" is a
real answer.

### D — Flexibility
Nutrition preferences wired end to end: allergies, intolerances, dislikes,
favourites, dietary pattern, filtering the rotation and failing closed on
allergens. Dish swap. Goal editing: rename, retarget, edit and reorder
milestones, archive. Routine editing: time, days, duration, off.

### E — Notifications
Make the computed intervention times reach the phone. A thin adapter so the
app degrades to in-app-only when permission is refused or the module is
absent. Quiet hours, a hard cap on how much the app may say in a day, and
`neverNag` honoured all the way to the notification layer. Adds a native
dependency — flag clearly that this needs a fresh build.

### F — Honesty and docs
PRODUCT.md opens with "AI-powered" and the paywall sells an "AI coach";
the shipped build performs zero inference. Fix the claims to match the
code. Update the docs the waves touched. Full gate, then a written
summary of everything that changed.
