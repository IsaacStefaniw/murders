# Position — Product Manager

IntentNorth redesign. Written 22 Oct 2026 against `docs/REDESIGN_BRIEF.md`
§8, `docs/WHY_HE_STOPPED.md`, and the code. Every number below was printed
by a script in this repo today, not copied from the brief.

---

## 1. Position (400 words max)

Nutrition is not thin. It was never switched on.

I re-ran the scripts. `usertest:coachvalue`, `career_optimiser`, 45 days,
paths started: **Training 161 items planned, 83 done. Nutrition 0 and 0,
with the `started` column reading `no`.** Training supplied **83 of the
107 completed items** in that life — 78% of everything he did came from
one of seven coaches. (§2's table still prints the pre-fix 148/79; the
decay figures in §2 were corrected today and my run matches them exactly
— week one 43%, 47% → 52%, `career_optimiser` −8.)

Two lines explain the zero. `startsNutritionPath` in `buildPlan.ts`
requires `foodAim`, an optional interview question marked
`deferTo: 'nutrition'` — the target persona is never asked, so the coach
never starts. And when it does start, what persists is
`saveMealPlan(weekStart, dinners)`: seven strings, overwritten weekly,
with no week two inside it.

So the redesign does not need a nutrition coach invented. It needs one
joined. `nutrition/plan.ts` already holds the protein target, the 30 g
fibre number, nine levers with protocol ids, and `assessNutrition`, which
reads a 21-day weight trend and returns tighten / ease / advance.
`meals/food.ts` holds dishes with ingredients, amounts, effort, protein
anchor and a fail-closed allergen gate. `batch.ts` turns seven dinners
into two cooks. `shopping.ts` builds the aisle list. Four modules and no
artefact above them.

Build the artefact: a four-week nutrition block, specified in §2. Its
length is not borrowed from training — four weeks is the window
`assessNutrition` already measures (21 days, three observations).

On levels: `level.ts` is a difficulty dial and its own docstrings say so.
It should stay one. The gamification Isaac asked for twice is not four
rungs in eight months; it is "training block 4, nutrition block 3, and
here is what changed since block 1" — a unit that turns over weekly,
completes monthly, and is kept.

On the other five coaches: practices inside the two blocks, plus the
interrupt layer. A wind-down is recovery work in week four of a training
block, not a sixth door. Nothing is deleted and nothing gets a tab.

The order matters more than any of it. One persona in the cohort declines
and it is the customer. He is held by nothing outside the app, so the
product has to hold the week — and a week is held by something that
progresses, not by a ladder whose second rung is a month away.

*(390 words.)*

---

## 2. Nutrition's equivalent artefact — the §6 answer

**The five-line version.** A **four-week nutrition block**, built once and
re-built at the end: fixed anchors (protein min/max and per-meal grams
from weight, 30 g fibre, one plate sentence) standing in for the e1RM
baselines; **prescriptions** standing in for exercises — a lever, the days
it applies, and a dose in food words ("kitchen closes 20:30", "a palm at
breakfast, 5 mornings", "10 minutes after dinner"), with a swap list and
named unprescribed days as the rest interval; **seven prescribed dinners**
standing in for the session, each a real `Dish` with its protein anchor,
its fibre sources, its effort and its cook-run, instead of a string; four
**phases** — establish, build, build, hold — where only the dose moves and
at most one new lever arrives per week; and **auto-regulation against the
two numbers we already have and no food log**: the 21-day weight trend via
`assessNutrition`, and whether the block's own prescribed days actually
ran, read from the plan history the level ladder already reads.

### The shape, concretely

```ts
// src/features/nutrition/block.ts  — new, pure, mirrors training/programme.ts
export interface NutritionBlock {
  id: string;
  createdAt: string;              // block start (a Monday)
  inputs: NutritionInputs;        // aim/cooking/trouble/leverLevel — exists
  level: PathLevel;               // from pathLevelState('nutrition') — exists
  anchors: {                      // the "baselines"
    proteinMinG: number; proteinMaxG: number;   // proteinTarget() — exists
    perMealG: number; meals: number;            // exists
    fibreG: number;                             // FIBRE_TARGET_G — exists
    plate: string;                              // PLATE[aim] — exists
    weightAtStartKg?: number;                   // the only number collected
  };
  weeks: [NutritionWeek, NutritionWeek, NutritionWeek, NutritionWeek];
  reviewAt: string;               // createdAt + 21 days = assessNutrition's window
  notes: string[];                // traceable: inputs + anchors + phase → this week
}

export interface NutritionWeek {
  week: 1 | 2 | 3 | 4;
  phase: 'establish' | 'build' | 'hold';
  focus: string;                  // "Protein lands at breakfast. Nothing else moves."
  prescriptions: Prescription[];  // 1–4, never more
  dinners: Record<Weekday, PrescribedDinner>;  // replaces Record<number, string>
  cookRuns: CookRun[];            // batch.ts — exists
  unprescribed: Weekday[];        // >= 2. Nutrition's rest days, said out loud.
}

export interface Prescription {   // the exercise row
  leverId: string;                // LEVERS key — exists
  protocolId?: string;            // citation + knowledge page — exists
  title: string;                  // LEVERS[].title — exists
  days: Weekday[];                // the "sets": which days it applies
  dose: string;                   // the "reps": "by 20:30", "10 min", "a palm"
  swapFor: string[];              // alternative levers at the same rung
  liveSince: number;              // the week it went live. Nothing resets.
}

export interface PrescribedDinner {
  dishId?: string; title: string;
  anchor: ProteinAnchor;          // Dish.proteinAnchor — exists
  fibreFrom: string[];            // from Dish.keyIngredients — exists
  effort: CookingEffort; prepMin: number;       // exists
  fromCookRun?: string;           // "Sunday's chilli, second night"
  swappedFrom?: string;           // nextAllowedDish() — exists
}
```

### The four weeks (the progression, not a repeating Monday)

| week | phase | what moves |
| --- | --- | --- |
| 1 | establish | Exactly one prescription live — the `trouble` answer's counter-lever, which `buildNutritionPlan` already promotes. Three unprescribed days. Dinners anchored, two cook runs. |
| 2 | build | The live prescription's `days` widen (3 → 5). At most one new lever. |
| 3 | build | Second lever's days widen. Dinner rotation refreshes within the allowed pool. |
| 4 | hold | Nothing new, no dose increase, dinners rotate for variety. `reviewAt` falls here, and the block ends because four weeks passed. |

### Auto-regulation — the honest analogue of lifting against a log

Two inputs, both already in the store, neither a food log:

1. `assessNutrition(inputs, metrics)` on the three-week weight trend.
   `ease` → drop a prescription's days. `tighten` + `advanceLever` → one
   new lever in the next block. `need-data` → ask for a weigh-in, change
   nothing. `steady` (energy aim) → the scale is never the judge and the
   block says so.
2. Whether the prescribed days ran — the same derivation
   `pathLevelState('nutrition')` already performs over `plans`. A
   prescription that rarely ran is re-prescribed at a lower dose or
   swapped, in words, and **never added to while something is being
   missed**. That is `autoRegulate`'s rule ("keep the stimulus when sleep
   or time collapses") applied to food.

### Developer estimate

New: `block.ts` (~300 lines, pure; the table above is the whole decision
tree), `regulate.ts` (~80 lines wrapping `assessNutrition`),
`weekOfBlock`/`blockComplete` (copied from `programme.ts`, including its
day-29 cliff fix), store slice `nutritionBlock: NutritionBlock | null` +
`buildNutritionBlock()` + a `mealPlan → block.weeks[0].dinners` migration
(`mealPlan` is a persisted key — `state/hygiene.ts` and
`persistence.test.ts` both have to learn the new one). Reused unchanged:
`plan.ts`, `food.ts`, `rotation.ts`, `batch.ts`, `shopping.ts`,
`level.ts`. Screens: `session/meals.tsx` (244 lines) renders a block week
instead of seven chips; `NutritionHub.tsx` gains the block header.

**One developer: 4 days model + tests, 3 days screens + migration.**

---

## 3. The one thing I would build first

**Week one of the nutrition block, end to end, and the one condition that
starts the coach at all.**

Not levels. Not the rungs-behind display. Not a doorbell. The law in §2 is
that a coach is worth coming back for when it owns a progressing artefact
— and the measurement says nutrition owns nothing that reaches the week:
**0 items in 45 days.** Every other candidate is a layer on top of that
zero.

Why week one rather than the whole block: a real user notices week one on
day one, and weeks two to four are the same builder with a different
phase argument. Why the start condition in the same increment: an artefact
nobody is handed measures identically to no artefact. `startsNutritionPath`
needs to be true for someone whose plan already contains a training block
or who put health in their priorities — `career_optimiser` does both and
is still never asked `foodAim`.

It also stays inside the §4 fence in a way a training change does not. The
block's prescriptions anchor to meals and evenings — breakfast, dinner,
the kitchen closing — not to `detectSlotMismatch`'s three slots (06:00,
11:30, 17:30), two of which are inside a desk job. The one exception is
reused rather than re-argued: the same `shiftWrapsMidnight` guard that
withholds the training coach withholds the nutrition block, until the work
window understands midnight.

---

## 4. What is wrong with the proposed resolution in §5

**§5 is litigating loss when the live failure is rate — and "earn and
keep" is not true in the code today.**

*The mechanical half.* No rung is stored anywhere. `pathLevelState`
re-derives it on every read from `plans`, and `prunePlans` keeps 120 days
whole, compacts to `KEEP_PLAN_DAYS = 730`, and drops everything older. For
the six non-training coaches the evidence is matched by **routine title**
against the routines currently attached to the path's goal, so a rename or
a rebuilt path takes history with it. And `trainingProgramme` is a single
nullable slot: finishing a block overwrites it. "A ladder you have climbed
is a record" has nothing to render — there is no `blocksCompleted` and no
`rungsReached`. §5 as written is a promise the storage layer breaks
silently, which is the worst class of broken promise this product can
make.

*The half that matters.* The gates are in `LEVEL_GATES`. Nutrition:
10 sessions/4 weeks → 30/12 → **90/32**. Training: 12/6 → 36/16 →
**100/40**. By construction the first rung event cannot happen before week
four, and the top one not before week 32. Week one is the worst week
measured (43% pooled) and the one real user quit at six weeks. **A reward
that fires three times in eight months cannot be the reason to open the
app on a Tuesday**, lost or kept. Debating whether the rung survives a bad
fortnight is debating the paint on a door that opens twice a year.

So, to §5's three open questions:

- **Can anything be lost?** Nothing banked — but it must be *stored* to be
  kept, append-only, which is a day's work and is not done. What can and
  should fall is the **dose**, which is auto-regulation, not punishment.
- **The unit above the rung?** There isn't one above. There is one
  *below*, and it is the right one: the **numbered block**. Thirteen a
  year per coach against four rungs in two years.
- **Does gamify survive rule 7?** Only if the unit completes on the
  calendar rather than on performance. A block ends because four weeks
  passed. That is why it can never become a scold — there is no version of
  a bad fortnight in which the block fails you.

---

## 5. Falsifiable prediction

If I am right, after week-one-of-the-block ships with the start condition:

1. **`npm run usertest:coachvalue`**, same persona, same 45 days:
   Nutrition goes from **0 planned / 0 done** to **≥ 60 planned and ≥ 25
   done**, and **Training's share of completed items falls from 78%
   (83 of 107) to below 60%.** If Nutrition's done count comes in under
   15, or Training stays above 70%, the artefact is not delivering a week
   and I am wrong.
2. **`npm run usertest:decay`** with the block on: **no persona below the
   0.25 floor**, and **`career_optimiser`'s first-four → last-four change
   is ≥ 0** (it is −8 today). That second clause is the risky one: it says
   the week-four reassess lowers the dose for the person whose job outruns
   him. If he stays negative, the auto-regulation I am claiming does not
   work and the block is just more items in a week he cannot do.
3. **TestFlight, ten testers, four weeks:** **≥ 6 run a second weekly
   "set the week" session in week two**, and **≥ 4 reach `reviewAt` with
   at least three weigh-ins** (the minimum `assessNutrition` needs). Fewer
   than three second sessions means nutrition is a settings screen with a
   shopping list, and the whole position collapses.

And the number that would refute me in favour of §5: if the rungs-behind
display shipped *alone* and week-four-plus opens rose, then the ladder was
the missing incentive and the artefact was not.

---

## 6. The first increment, in enough detail to start

**Scope, one week, one developer.**

1. `src/features/nutrition/block.ts` — `buildNutritionBlock(inputs,
   level, prefs, metrics, nowIso)`, pure, returning all four weeks. Week
   content from the table in §2. Reuses `buildNutritionPlan`,
   `proteinTarget`, `allowedDishTitles`, `planBatch`.
2. `buildPlan.ts` — `startsNutritionPath` becomes
   `Boolean(foodAim && foodAim !== 'none') || wantsTraining ||
   priorities.includes('health')`, with the existing `shiftWrapsMidnight`
   guard applied as it is for training. `aim` falls back to `'unsure'`,
   which `normaliseAim` already handles and the hub already explains.
3. Store: `nutritionBlock` + `buildNutritionBlock()` action, called from
   `startPath('nutrition')` — the exact bug `WHY_HE_STOPPED` records for
   training ("`startPath` never built the block"), not repeated.
   `mealPlan` migrates into `weeks[0].dinners`; `hygiene.ts`,
   `migratePersisted` and `persistence.test.ts` updated.
4. `session/meals.tsx` renders week N: the focus line, the one live
   prescription with its dose and swap list, seven dinners with anchor and
   cook run, then the existing shopping list.
5. Today's row reads from the block: *"Tonight: salmon, rice & broccoli —
   your protein anchor. Ten-minute walk after."*

**Stopping rule:** `usertest:coachvalue` shows Nutrition non-zero and
`usertest:decay` shows no persona under 0.25. If the floor breaks, the
dose drops (fewer prescribed days in week one) — the floor is not touched.

**Then, each with its dependency:**

- **Weeks 2–4 + `regulate.ts`** — depends on week one shipping, because
  the reassess needs a block that has run. *(Week 2.)*
- **`blocksCompleted`, append-only, both coaches** — depends on two
  artefacts existing to count. This is where the gamification lands.
  *(Week 3.)*
- **Fix `affinityFor` to know about work and sleep, re-baseline, then ship
  the two `detectSlotMismatch` guards** — depends on nothing, blocks
  everything after it, and is the decision `WHY_HE_STOPPED` §5 asks for.
  It goes third rather than first only because it moves every baseline in
  the project, and the three measurements above have to be readable first.
  *(Week 4–5.)*
- **The other five coaches as practices in the two blocks and as
  interrupts** — depends on the blocks having weeks to hang them in.

---

## 7. What I am deferring, and why each waits

- **Levels as the spine, and the rungs-behind display.** Waits: there is
  no `blocksCompleted` to render and four rungs in eight months is too
  slow to be the mechanism. It becomes the display *of* the blocks.
- **A doorbell / absence notification.** Waits indefinitely:
  `WHY_HE_STOPPED` §3 already settled it. He killed the notifications
  because they were wrong; louder wrong is worse.
- **Lunches, eating out, travel mode, enjoyment ratings
  (`food.ts` has the type).** Waits for block one's reassess to say which
  lever people actually keep.
- **Money, work, family artefacts.** Waits indefinitely. §7's answer for
  them is practices and interrupts, and two deep coaches beat four
  shallow ones.
- **The night shift.** Waits on the roster feature and the wrap-blind
  comparison, exactly as the training block does.
- **Protein or fibre logging in any form.** Never. It is the thing the
  promise is built against.

---

## 8. §4 check

Nothing here overrides a non-negotiable. The one item worth naming: the
block reads whether prescribed days ran. That number is **input to
auto-regulation and is never shown** — no count, no percentage, no bar.
Levers carry forward between blocks (`liveSince`), the block completes
because four weeks passed rather than because a week went well, and every
week names its unprescribed days. A missed Tuesday stays a missed Tuesday.
On-device, pure functions, no account. Every lever already carries its
protocol id and its citation.
