# Position — Product Manager

IntentNorth redesign. Written 22 Oct 2026 against `docs/REDESIGN_BRIEF.md`
§8, `docs/WHY_HE_STOPPED.md`, and the code.

**Scripts I ran, and what they printed.** `npm run usertest:coachvalue` —
Training 161 planned / 83 done, Nutrition 0 / 0, Habits 33 / 18,
Relationship 12 / 6; `started` reads `no` for nutrition. `npm run
usertest:decay` — pooled week one 43%, first four weeks 47%, last four
52%, and one decliner: `career_optimiser` 61% → 53%, −8 points over 1003
planned items. These match §2's corrected table. §2's coachvalue table
still prints the pre-fix 148/79; the script prints 161/83 today, and the
line that matters — Nutrition 0 and 0 — is unchanged.
`npm run usertest:foodquestion` — not my script; another role added it
while I was writing, and I have run it: 1 of 11 personas is ever asked
`foodAim`; answered, nutrition delivers 60 planned / 32 done; and in both
arms, after 45 days, `mealPlan: none`.

---

## 1. Position (400 words max)

Nutrition is not thin, and it is not silent either. It is sixty reminders
with nothing behind them.

`usertest:coachvalue`, `career_optimiser`, 45 days: **Training 161 items
planned and 83 done; Nutrition 0 and 0.** Training supplied **83 of the
107 completed items** — 78% of everything he did came from one coach of
seven.

But that zero is mostly a harness artefact, and `usertest:foodquestion`
says so: **one of eleven personas is ever asked `foodAim`** — the
optional, deferred interview question `startsNutritionPath` hangs on — and
the target persona is not one of them. Answer it and nutrition puts **60
items in the week, 32 of them done**, with no new code.

And in both arms, after 45 days: **`mealPlan: none`.** The coach ran six
weeks and its artefact was never created, because only `saveMealPlan`,
from a screen he must go and find, writes it. That is `startPath` never
building the training block — the bug that left him opening an empty box
labelled kg for six weeks — repeated, verbatim, in nutrition.

So §2's law is not a hypothesis here, it is a description: sixty prompts a
month, nothing that persists. A reminder.

The artefact is the work; the branch is a line of code. Everything it
needs already exists: `plan.ts` has the protein target, the 30 g fibre
number, nine levers with protocol ids, and `assessNutrition` reading a
21-day weight trend; `food.ts` has dishes with ingredients, amounts,
effort and a fail-closed allergen gate; `batch.ts` turns seven dinners
into two cooks; `shopping.ts` builds the aisle list. Four modules and no artefact above them. §2 below
specifies one: a four-week block, four weeks being the window
`assessNutrition` already measures.

On levels: `level.ts` is a difficulty dial, its docstrings say so, and it
should stay one. The unit Isaac has asked for twice is the **numbered
block** — thirteen a year per coach, kept for ever — not four rungs in
eight months.

On the other five coaches: practices inside the two blocks, plus the
interrupt layer. A wind-down is recovery work in week four of a training
block, not a sixth door. Nothing is deleted; nothing gets a tab.

One persona in the cohort declines and it is the customer. Nothing outside
the app holds his week, so the product has to — and a week is held by
something that progresses.

*(382 words.)*

---

## 2. Nutrition's equivalent artefact — the §6 answer

**The five-line version.** A **four-week nutrition block**, built when the
coach starts and re-built when it ends: fixed **anchors** (protein
min/max and per-meal grams from weight, 30 g fibre, one plate sentence)
standing in for the e1RM baselines; **prescriptions** standing in for
exercises — a lever, the days it applies, a dose in food words ("kitchen
closes 20:30", "a palm at breakfast, five mornings", "ten minutes after
dinner"), a swap list, and named unprescribed days as the rest interval;
**seven prescribed dinners** standing in for the session, each a real
`Dish` with its protein anchor, fibre sources, effort and cook run instead
of a bare string; four **phases** — establish, build, build, hold — in
which only the dose moves and at most one new lever arrives per week; and
**auto-regulation against the two numbers we already have and no food
log**: the 21-day weight trend through `assessNutrition`, and whether the
block's own prescribed days ran, read from the plan history
`pathLevelState` already reads.

### The shape, concretely

```ts
// src/features/nutrition/block.ts  — new, pure, mirrors training/programme.ts
export interface NutritionBlock {
  id: string;
  createdAt: string;              // block start (a Monday)
  inputs: NutritionInputs;        // aim/cooking/trouble/leverLevel — exists
  level: PathLevel;               // pathLevelState('nutrition') — exists
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
  swapFor: string[];              // alternatives at the same rung
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

### The four weeks — the progression, not a repeating Monday

| week | phase | what moves |
| --- | --- | --- |
| 1 | establish | Exactly one prescription live — the `trouble` answer's counter-lever, which `buildNutritionPlan` already promotes to the front. Three unprescribed days. Dinners anchored, two cook runs. |
| 2 | build | The live prescription's `days` widen (3 → 5). At most one new lever. |
| 3 | build | The second lever's days widen. Dinners refresh within the allowed pool. |
| 4 | hold | Nothing new, no dose increase, dinners rotate for variety. `reviewAt` falls here, and the block ends because four weeks passed. |

### Auto-regulation — the honest analogue of lifting against a log

Two inputs, both already in the store, neither a food log:

1. `assessNutrition(inputs, metrics)` on the three-week weight trend.
   `ease` → drop a prescription's days. `tighten` with `advanceLever` →
   one new lever in the next block. `need-data` → ask for a weigh-in and
   change nothing. `steady` (the energy aim) → the scale is never the
   judge, and the block says so in words.
2. Whether the prescribed days ran — the same derivation over `plans`
   that `pathLevelState('nutrition')` already performs. A prescription
   that rarely ran is re-prescribed at a lower dose or swapped, in words,
   and **never added to while something is being missed**. That is
   `autoRegulate`'s rule — "keep the stimulus when sleep or time
   collapses" — applied to food.

### Developer estimate

New: `block.ts` (~300 lines, pure; the table above is the whole decision
tree), `regulate.ts` (~80 lines wrapping `assessNutrition`),
`weekOfBlock` / `blockComplete` (lifted from `programme.ts`, including its
day-29 cliff fix), store slice `nutritionBlock: NutritionBlock | null` +
`buildNutritionBlock()` + a `mealPlan → weeks[0].dinners` migration
(`mealPlan` is a persisted key, so `state/hygiene.ts`, `migratePersisted`
and `persistence.test.ts` all have to learn the new one). Reused
unchanged: `plan.ts`, `food.ts`, `rotation.ts`, `batch.ts`, `shopping.ts`,
`level.ts`. Screens: `session/meals.tsx` (244 lines) renders a block week
instead of seven chips; `NutritionHub.tsx` gains the block header.

**One developer: 4 days model + tests, 3 days screens + migration.**

---

## 3. The one thing I would build first

**Week one of the nutrition block, end to end — with the interview branch
that starts the coach as its first commit, not as the increment.**

Not levels. Not the rungs-behind display. Not a doorbell.

The branch is a line and I would ship it on day one: `startsNutritionPath`
should be true for anyone whose plan already contains a training block or
who named health a priority, instead of hanging on an optional question
**1 of 11 personas is ever asked**. Measured, it takes nutrition from
0/0 to 60/32.

But the measured consequence of shipping *only* that line is sixty
reminders and `mealPlan: none` after six weeks — which is the state §2's
law already predicts is worthless, and the state that produced "nothing
else incentivised it." Switching the coach on without giving it an
artefact is the most expensive available way to re-prove the law. It also
adds roughly nine items a week to the one persona the app is already
losing, which is why the branch and the block ship together.

Why week one rather than all four: a real user sees week one on day one,
and weeks two to four are the same builder with a different phase
argument. Why the block creation goes in `startPath('nutrition')`: because
`mealPlan: none` after 45 days of a running coach is the training bug
verbatim, and it is the single cheapest thing on this list to get wrong
twice.

It also stays inside the §4 fence where a training change would not. The
block's prescriptions anchor to meals and evenings — breakfast, dinner,
the kitchen closing — not to `detectSlotMismatch`'s three slots (06:00,
11:30, 17:30), two of which are inside a desk job. The one exception is
reused rather than re-argued: the `shiftWrapsMidnight` guard that
withholds the training coach withholds the nutrition block too, until the
work window understands midnight.

---

## 4. What is wrong with the proposed resolution in §5

**§5 litigates loss when the live failure is rate — and "earn and keep" is
not true in the code today.**

*The mechanical half.* No rung is stored anywhere. `pathLevelState`
re-derives it on every read from `plans`, and `prunePlans` keeps 120 days
whole, compacts out to `KEEP_PLAN_DAYS = 730`, and drops everything older.
For the six non-training coaches the evidence is matched by **routine
title** against the routines currently attached to the path's goal, so a
rename or a rebuilt path takes history with it. And `trainingProgramme` is
a single nullable slot: finishing a block overwrites it. "A ladder you
have climbed is a record" has nothing to render — there is no
`blocksCompleted` and no `rungsReached`. As written, §5 is a promise the
storage layer breaks silently, which is the worst class of promise this
product can make.

*The half that matters.* The gates are in `LEVEL_GATES`. Nutrition:
10 sessions / 4 weeks → 30 / 12 → **90 / 32**. Training: 12 / 6 → 36 / 16
→ **100 / 40**. By construction the first rung event cannot happen before
week four and the top one not before week 32. Week one is the worst week
measured (43% pooled) and the one real user quit at six weeks. **A reward
that fires three times in eight months cannot be the reason to open the
app on a Tuesday**, lost or kept. Arguing over whether the rung survives a
bad fortnight is arguing about the paint on a door that opens twice a
year.

To §5's three open questions:

- **Can anything be lost?** Nothing banked — but it has to be *stored* to
  be kept, append-only, and that is not done. What can and should fall is
  the **dose**: that is auto-regulation, not punishment, and the block
  says which lever it eased and why.
- **The unit above the rung?** There isn't one above. There is one
  *below*, and it is the right one: the **numbered block**. Thirteen a
  year per coach against four rungs in two years.
- **Does gamify survive rule 7?** Only if the unit completes on the
  calendar rather than on performance. A block ends because four weeks
  passed. That is precisely why it can never become a scold: there is no
  version of a bad fortnight in which the block fails you.

---

## 5. Falsifiable prediction

The prediction has to distinguish the artefact from the interview branch,
because the branch alone already moves the item counts. So it is a
differential, and the control arm is runnable today.

1. **Control — the branch without the block.** Start nutrition for every
   persona that justifies it, ship no artefact, and run
   `usertest:decay`: nutrition delivers its ~60 planned / 32 done per 45
   days, `mealPlan` stays `none`, and **`career_optimiser`'s first-four →
   last-four change stays negative** (−8 today). If merely switching the
   coach on reverses his decline, then items are the mechanism, the
   artefact is not, and my position is wrong — ship the line and stop.
2. **Treatment — the block.** `nutritionBlock` is non-null on day one for
   every started persona, **a second block exists by day 29** (against
   `mealPlan: none` for 45 days today), **no persona falls below the 0.25
   floor**, and **`career_optimiser`'s first-four → last-four change is
   ≥ 0**. That last clause is the risky one: it claims the week-four
   reassess lowers the dose for the person whose job outruns him. If he
   stays negative with the block in, the auto-regulation I have specified
   does not work and the block is just more items in a week he cannot do.
3. **TestFlight, ten testers, four weeks.** **≥ 6 run a second weekly
   "set the week" session in week two**, and **≥ 4 reach `reviewAt` with
   at least three weigh-ins** — the minimum `assessNutrition` needs.
   Fewer than three second sessions means nutrition is a settings screen
   with a shopping list attached, and the whole position collapses.

The number that would refute me in favour of §5: if the rungs-behind
display shipped *alone* and week-four-plus opens rose, the ladder was the
missing incentive and the artefact was not.

---

## 6. The first increment, in enough detail to start

**One week, one developer.**

1. `src/features/nutrition/block.ts` — `buildNutritionBlock(inputs,
   level, prefs, metrics, nowIso)`, pure, returning all four weeks; week
   content from the table in §2. Reuses `buildNutritionPlan`,
   `proteinTarget`, `allowedDishTitles`, `planBatch`.
2. `buildPlan.ts` — `startsNutritionPath` becomes
   `Boolean(foodAim && foodAim !== 'none') || wantsTraining ||
   priorities.includes('health')`, with the existing `shiftWrapsMidnight`
   guard applied as it is for training. `aim` falls back to `'unsure'`,
   which `normaliseAim` handles and the hub already explains in words.
3. Store: `nutritionBlock` + `buildNutritionBlock()`, called from
   `startPath('nutrition')` **and** from the paths that rebuild
   training's block (intensity, step-back, a routed answer), so the two
   coaches behave the same way. `mealPlan` migrates into
   `weeks[0].dinners`; `hygiene.ts`, `migratePersisted` and
   `persistence.test.ts` updated.
4. `session/meals.tsx` renders week N: the focus line, the live
   prescription with its dose and swap list, seven dinners with anchor and
   cook run, then the existing shopping list.
5. Today's row reads from the block: *"Tonight: salmon, rice & broccoli —
   your protein anchor. Ten-minute walk after."*

**Stopping rule.** `usertest:foodquestion` shows a non-null block in both
arms and a second block by day 29; `usertest:decay`, re-run with nutrition
started, shows no persona under 0.25. If the floor breaks, **the dose
drops** — week one starts with three prescribed days instead of five. The
floor is not touched.

**Then, each with its dependency named:**

- **Weeks 2–4 and `regulate.ts`** — needs week one shipped, because a
  reassess needs a block that has run. *(Week 2.)*
- **`blocksCompleted`, append-only, both coaches** — needs two artefacts
  to count. This is where the gamification lands, and where §5's "record"
  becomes renderable. *(Week 3.)*
- **Teach `affinityFor` about work and sleep, re-baseline, then ship the
  two `detectSlotMismatch` guards** — depends on nothing and blocks
  everything after it; it is the decision `WHY_HE_STOPPED` §5 asks for.
  Third rather than first only because it moves every baseline in the
  project, and the three measurements above have to be readable first.
  *(Weeks 4–5.)*
- **The other five coaches as practices inside the two blocks and as
  interrupts** — needs the blocks to have weeks to hang them in.

---

## 7. What I am deferring, and why each waits

- **Levels as the spine, and the rungs-behind display.** Waits: there is
  no `blocksCompleted` to render, and four rungs in eight months is too
  slow to be the mechanism. It becomes the display *of* the blocks.
- **A doorbell or absence notification.** Waits indefinitely;
  `WHY_HE_STOPPED` §3 settled it. He killed notifications because they
  were wrong, and louder wrong is worse.
- **Lunches, eating out, travel mode, enjoyment ratings** (`food.ts`
  already has the type). Waits for block one's reassess to say which
  levers people actually keep.
- **Money, work and family artefacts.** Waits indefinitely. §7's answer
  for them is practices and interrupts; two deep coaches beat four
  shallow ones.
- **The night shift.** Waits on the roster feature and the wrap-blind
  comparison, exactly as the training block does.
- **Protein or fibre logging, in any form.** Never. It is the thing the
  promise is built against.

---

## 8. §4 check

Nothing here overrides a non-negotiable. The one item worth naming out
loud: the block reads whether prescribed days ran. That number is **input
to auto-regulation and is never shown** — no count, no percentage, no bar.
Levers carry forward between blocks (`liveSince`), a block completes
because four weeks passed rather than because a week went well, and every
week names its unprescribed days. A missed Tuesday stays a missed Tuesday.
On-device, pure functions, no account, no telemetry. Every lever already
carries its protocol id and its citation, and the one new claim surface —
the dose — is phrased as structure, never as advice.
