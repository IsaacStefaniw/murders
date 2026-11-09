# The app, for one person

Isaac, 9 Nov 2026: *"I want to design this app for me now - no one
else. structure it just for me."*

This is the design. It is not a rewrite — it is a **subtraction plus
one new piece of logic**, and the new piece is the one thing the app
has never been able to do.

---

## 0. The four decisions already made

| | |
| --- | --- |
| notifications | **two a day (17:30, 21:45) plus a session reminder** |
| structure | **keep the four tabs, gut the contents** |
| the cut | **delete the simulator and the interview only.** The other five coaches stay dormant |
| evidence | **grades and citations always visible** |

All four are the conservative option, which is why this is buildable
rather than a quarter of work.

---

## 1. The one thing to flag before anything is deleted

**Deleting the simulator deletes the 0.25 completion floor.**

That floor is a standing instruction — *never lower it to make a build
pass* — and twice this month work was reverted rather than lower it.
Deleting it is a bigger act than lowering it, so it does not pass
quietly.

**The argument for doing it anyway:** the floor exists because there
was no real user. It simulated eleven people over 182 days to answer
"are we handing somebody a week they cannot complete?" There is now
exactly one user, and he can be asked. **Real logged completion beats
simulated completion**, and it arrives weekly instead of never.

**What has to replace it, or the safety net is simply gone.** The
floor's actual job was to catch a plan that got too crowded. One
assertion, against his own data:

> **If fewer than half the planned items in the last fortnight were
> completed, the app says so and proposes removing something.**

Not a score. Not a percentage on a screen. A sentence that appears
when it is true and never otherwise — which is what the floor was for
the whole time.

**Nothing else in the cut touches a standing rule.** No scores, no
streaks, nothing that resets to zero, on-device only, educational not
medical, copy plain and never a scold — all still hold, and all are
easier to hold with one user.

---

## 2. What gets deleted, measured not guessed

112,813 lines across `src/`. The cut:

| | lines | why |
| --- | --- | --- |
| `src/features/sim/` | **3,669** | eleven personas and an engine to model strangers |
| its nine test files | — | `scenarios`, `sim`, `cohort.fullsim`, `journeys.sim`, `pathways.audit`, `render.audit`, `scheduling`, `screens`, `tone` |
| most of `src/features/onboarding/` | **~4,650 of 4,952** | thirty-nine questions whose answers are now known facts |
| 4 routes | — | `interview.tsx`, `answers.tsx`, `plan-review.tsx`, `example-day.tsx` |
| 7 of 9 `tools/usertest` scripts | — | `decay`, `atwork`, `statedtime`, `coachvalue`, `foodquestion`, `nutritionfloor`, `seed` — all cohort instruments |

**About 8,300 lines, not the 35,000 a first glance suggested.** The
reason is in the next section and it is the good news.

### What the cut actually costs to do

I expected this to be a week. The real import surface of
`features/onboarding` outside itself is **four functions and one
type**:

```
store.ts               answersFromProfile, PATH_ANSWER_FOR, profilePatchFor
                       InterviewAnswers (type only)
health/paceInputs      InterviewAnswers (type only)
health/selfReport      InterviewAnswers (type only)
health/negativeHabits  InterviewAnswers (type only)
today/QuickLog         HABIT_PROTOCOL
```

Everything else that looked like a dependency was a **comment**
mentioning the module by name. `store.ts` and `health/thenAndNow.ts`
both appeared to import from `features/sim` and neither does.

So the cut is: move those four helpers and the type into a surviving
module, hard-code the answers, delete the rest.

### The move that makes it small

> **`answers` stops being state and becomes a constant.**

`ISAAC_ANSWERS`, a frozen `InterviewAnswers` in `src/features/me/`.
Every consumer keeps working unchanged — the health markers, the
negative-habit reads, `QuickLog` — because they only ever wanted the
answers, never the asking.

---

## 3. What gets built

Three new files, and the third is the point.

### `src/features/me/profile.ts` — the facts

```
work        08:00–16:30, Mon–Fri, office 2 min from home
lunch       45 min door to door
sleep       06:30 wake, 22:00 bed, broken some nights
boys        two, under 5, asleep 20:00–20:30
pickup      Isaac Mon/Wed/Thu · partner Tue/Fri
weight      90 kg
futsal      Monday 18:15
```

### `src/features/me/week.ts` — the fixed week

The planner currently solves a problem that no longer exists: **where
does this go?** It is known. Monday lunch upper, Tuesday 17:00 upper,
Wednesday lunch lower, Friday 17:00 lower, Thursday walk, futsal
Monday night.

So the week is **declared, not computed** — and `detectSlotMismatch`
never again moves a routine into working hours, which is the specific
mechanism that made the app wrong on its face.

Daily spine: 06:45 breakfast · 08:00 deep work · 17:30 decide ·
18:30 walk · 19:00 bath and books · 19:30 kitchen closed ·
21:45 log · 22:00 bed. Monday overrides four of those.

### `src/features/training/progression.ts` — the actual feature

**This is why the app should exist instead of the document.**

Everything else in the plan works on paper. This does not: given last
session's logged sets, what goes on the bar today?

```
lastSession: squat 3 sets, 10/10/9 reps at 87.5 kg, 1 left in the tank
  → top of range on every set → 92.5 kg today, back to 6–10

lastSession: squat 3 sets, 7/6/5 reps at 87.5 kg, 0 left
  → under range and no reserve → hold 87.5 kg, and say why
```

Double progression, which **removes percentages from the block
entirely** — and percentages are what produced the 90 kg bench you
spotted as a fifteen-rep weight. It cannot drift light, because the rep
range polices it. It cannot drift heavy, because the reserve does.

`trainingProgramme` already stores blocks and already reads logged
lifts. What is missing is this function and a screen that shows **last
time's numbers next to today's**.

---

## 4. The four tabs, gutted

Same shape, new contents. Each answers exactly one question.

### Today — *"what do I do next?"*

Today's session with **last session's numbers beside it**. Today's
food. Tonight's one thing. Monday-aware: on Monday it says eat at
16:45, futsal at 18:15, and does not ask for a walk.

### Plan — *"what is this week?"*

The four-week block and which week it is. The seven dinners. The
shopping list, which already generates itself from `DISHES`.

### Life — *"am I holding the line?"* **(the biggest change)**

Stops being seven coach doors. Becomes **the quits**:

- days since the last drink, and the named events for this month
- days since the last vape
- the urge log, and what it has actually shown about triggers
- the Monday 19:15 note, because it recurs 52 times a year

No streaks. Days-since is a count that is **true**, and a slip resets a
number without erasing the eleven weeks behind it.

### Data — *"am I better than six weeks ago?"*

Lifts over time. Weight trend. What the log says. The evidence grades
stay visible here, since that is the tab where a claim gets checked.

---

## 5. Build order

Each step leaves a working app. Nothing is deleted before its
replacement exists.

1. **`me/profile.ts` + `me/week.ts` + `ISAAC_ANSWERS`.** The facts, the
   fixed week, the frozen answers. Nothing deleted yet. The app starts
   reading constants instead of asking questions.
2. **`training/progression.ts` + the Today session card.** The feature.
   This is the one worth building even if nothing else gets done.
3. **The completion sentence from §1** — the floor's replacement,
   against real logged data.
4. **Delete `sim/` and the cohort scripts.** Only now, because §1 and
   step 3 are in place.
5. **Delete the interview, move the four helpers, drop the 4 routes.**
6. **Gut the Life tab into the quits.**
7. **Notifications: 17:30, 21:45, and one before each session.**

**Step 2 is the whole value.** If this stalls after step 2, the app is
already better for you than it has ever been.

---

## 6. What this design is still wrong about

- **It assumes the week stays fixed.** Futsal was missing from three
  versions of the plan because nothing asked. A declared week is only
  better than a computed one while the declaration is true.
- **Nothing here is validated.** The simulator is being deleted, so
  there is no instrument left except you using it. That is a genuine
  trade and the right one at n=1, but it means every claim about this
  design is a guess until a fortnight has passed.
- **The dormant coaches will rot.** Left in and routed out, they stop
  being tested and stop compiling against changes. In six months they
  are not a dormant feature, they are dead code with opinions. Worth
  revisiting once you know whether you miss any.
- **Two of your seven goals still have no home.** Deep work and being
  a good parent are in the plan document and are not in this design,
  beyond the 19:00 phone rule. That is honest rather than solved.
