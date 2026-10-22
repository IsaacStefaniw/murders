# Position — Software Developer

Measured at commit 5d7f985, not drafted: **238 suites, 3,118 tests, all
green** (`npx jest`; 410 s and 383 s on two runs). `npx tsc --noEmit`
clean, `npx eslint src` clean. Every other number below is from a script
in `tools/usertest` that I ran at that commit, and where it disagrees with
§2 I say so. Other roles have since edited `sim/personas.ts` and added
`tools/usertest/foodquestion.test.ts`, so re-run before quoting me.

---

## 1. Position (361 words)

**The redesign's two expensive premises are both half-wrong, and it is the
cheap half that is wrong.**

§6 says nutrition owns seven strings. It does not.
`features/nutrition/plan.ts` is 346 lines of what §6 asks for: a protein
target from bodyweight and aim, a 30 g fibre figure, a four-lever ladder
reordered by where food goes wrong, and `assessNutrition` — adaptation off
a 21-day weight **trend**, with a 1%-of-bodyweight-per-week loss ceiling,
returning `advanceLever`. `NutritionHub.tsx:149` shows the advance button
only when the assessment says so. That is auto-regulation against logged
performance, confirmed by the person instead of applied silently — a
better design than `buildTrainingBlock`, which rebuilds on five triggers
and asks nobody.

Nutrition reads 0 routines / 0 items in `usertest:coachvalue` because
`startsNutritionPath = Boolean(foodAim && foodAim !== 'none')`
(`buildPlan.ts:605`) and the Alex persona carries no `foodAim`
(`personas.ts:562–593`; the only persona with one is at 441). This is
commit 3cc4a4a again: the coach is built, and the interview has no branch
that starts it. §6 is a one-day start bug wearing a five-day artefact's
clothes.

§5 is the opposite error. "A bad fortnight costs you time to the next
rung, never the rung" is not a design choice in this codebase, it is a
false statement about code. `earnedLevel` is a pure function of *present*
evidence, and present evidence shrinks on a schedule: `prunePlans` drops
days past `KEEP_PLAN_DAYS = 730`; `capList(workoutLogs, 500)` drops the
oldest logs. It shrinks sooner by a cause nobody would guess —
`pathLevelState` (`store.ts:2029–2039`) joins evidence on routine
**title**, so a copy edit to a routine's name resets that coach's level on
every installed phone. The level system is built. It is not durable, and
the brief is about to make it the spine.

Then the floor. `health_rebuilder` ends six months at **25%**
(`usertest:decay`) against a floor of 0.25 — zero margin — and **179 of
her 683 items (26%) already land inside her 08:00–16:00**, where the sim
scores her **30% against 24% in free time**. Giving her nutrition adds
items to the persona with no headroom. §6 and non-negotiable 6 collide,
and on current evidence §6 loses.

Order: start nutrition, make the rung durable, fix the sim, then build the
spine.

---

## 2. The one thing I would build first

**Start the nutrition coach.** One day.

A `startsNutritionPath` branch with parity to the training one landed in
3cc4a4a, a `foodAim` on the Alex persona, and `npm run usertest:coachvalue`
re-run the same afternoon.

Why that one and not the level spine: the spine costs 6 days (§4) and its
whole value rests on there being *two* coaches with progressing artefacts.
One day tells us whether nutrition already is one. If started nutrition
puts 60+ items in Alex's 45 days off code that already exists, §6's
framing is wrong and five days of block-building is not the first spend.
If it puts in 10, §6 is right and I am wrong, and we know that for the
price of an afternoon instead of a sprint.

It is also the only item in this redesign that improves a §2 number
without touching the simulator.

The second thing, not the first, is the durable rung (§4A). It is the
prerequisite for everything else, but it cannot be sequenced ahead of a
one-day measurement that might change what we build it for.

---

## 3. What is wrong with the proposed resolution in §5

Not the principle. The principle is right and I would ship it.

**§5 states a property of persisted state as though it were a display
choice.** There is no persisted rung, no high-water mark, and no record of
when a rung was reached. The ladder is recomputed on every call from a log
that `state/hygiene.ts` exists to destroy.

Three consequences, in order of how soon they bite:

1. **A copy edit demotes people.** `pathLevelState` builds
   `mine = routines.filter(r => r.goalId === goalId).map(r => r.title)` and
   scores history with `plan.items.some(i => mine.has(i.title))`. Plan
   items were written with the title the routine had on the day
   (`generate.ts:165`) and past plans are never regenerated. Rename a
   routine — which this repo does routinely — and that coach's evidence
   drops to the days since the rename. The level goes backwards and the
   person did nothing.
2. **Retaking a path can demote too.** `startPath` drops the old goal and
   mints a new `goalId`, and `mine` is built from the new one. Today the
   title join accidentally rescues most of it. That is luck, not design.
3. **Time demotes.** `prunePlans` drops every day past 730, and nutrition's
   advanced gate is 90 sessions across 32 weeks. The person this hurts is
   the one returning after a long gap — exactly the person
   `commitmentBudget` already has the right copy for ("Back after 11 days.
   Start with the daily walk and nothing else"). The promise fails for its
   own intended beneficiary.

And the corollary is unimplementable as written. "Show the rungs behind as
well as the one ahead" needs the dates the rungs were reached. They are not
stored and cannot be recovered. For every existing install the honest
backfill is a single entry dated `paths[id].startedAt` with
`answers.level` — which is lossy, permanent, and has to be admitted in
copy rather than faked.

So: §5 is not resolved by agreeing with it. It is resolved by a persisted
`pathRungs` high-water mark and a `routineId` join, and until those exist
"a level you earn and keep" is a sentence in a brief.

---

## 4. Feasibility and cost

Estimates are engineer-days at this codebase's test standard (a change
lands with tests; `scenarios.test.ts` stays green without being edited).

### A. A level spine as the product — 6 days

What `level.ts` needs that it has not got:

| need | why | new persisted state |
| --- | --- | --- |
| rung history | §5's corollary cannot render without dates | **yes** |
| monotonic floor | `earnedLevel` is a pure function of shrinking evidence | **yes** (same field) |
| `routineId` join | title join resets evidence on a copy edit | no |
| memoisation | `pathLevelState` rescans all plans per call | no |

- **Persisted state: one field.** `pathRungs: Partial<Record<PathId,
  { level: PathLevel; at: string }[]>>`, append-only, ≈4 entries × 2 paths.
  `partialize` persists any non-function key automatically, so the storage
  side is free. `PERSIST_VERSION` goes 1 → 2 and `migratePersisted` gets
  its second step — the framework is already there and currently holds an
  identity migration, so this is the change it was built for.
- **Migration, honestly:** an existing install knows two facts,
  `paths[id].startedAt` and `answers.level`. The backfill is one entry per
  path at the start date. Somebody twelve weeks in gets a one-rung ladder
  instead of their real climb, for ever. That is unrecoverable and must be
  said on the screen, not hidden.
- **`levelFor` takes `max(earned, highWater)`.** This is the change that
  makes §5 true in code. Three lines plus tests.
- **Join on `routineId`.** `compactItem` keeps `routineId` in
  `KEPT_ITEM_KEYS`, so the fix works on already-pruned history. Keep the
  title match as a fallback for days compacted before routine ids were
  reliable.
- **Cost of rendering it.** `pathLevelState` iterates
  `Object.values(plans)` × items on every call, unmemoised, and is called
  through a Zustand `get()` rather than a selector. At `KEEP_PLAN_DAYS =
  730` and the cohort's ~6 items/day that is ~4,400 item reads per call;
  two coaches on Today is ~9,000 per render. Memoise on
  `(plans, routines, goalId)` before this is a spine, not after.

**3 days** for the field + migration + monotonic floor + the id join,
**1 day** memoisation, **2 days** for the Today spine across two coaches.
*Assumes:* no new ladder content, `LEVEL_GATES` / `LEVEL_LABEL` /
`LEVEL_BLURB` / `LevelCard` reused as they stand, and **no sim re-baseline
needed, because levels change nothing about where an item is scheduled.**

### B. Nutrition's progressing artefact — 1 + 4 days

**The migration is not the work.** `mealPlan` is read in three files at
five sites (`session/meals.tsx`, `(tabs)/today.tsx:255`,
`nutrition/shopping.tsx`) and written by one action (`store.ts:2506`).
`state/__tests__/persistence.test.ts:30` asserts the key persists.

**And I would not replace it.** `{ weekStart, dinners }` is the dinner
decision, which is a thing the promise names ("protein-first dinners
decided once a week"). Replacing it costs five read sites and a migration
and buys nothing §6 asks for. The gap is not the dinners; it is that
nothing records progress.

What to add instead:

```
nutritionBlock: {
  id; createdAt; aim;
  leverHistory: { leverId: string; onAt: string }[];
  verdicts:     { at: string; verdict: NutritionVerdict }[];
} | null
```

`PERSIST_VERSION` 1 → 2 (the same bump as §4A — do them together, one
migration step, not two). Backfill `leverHistory` from
`Number(paths.nutrition.answers.leverLevel)` and `paths.nutrition.startedAt`
— the only two facts an existing install holds, so the dates are
approximate and the screen says so.

**`leverLevel` must come out of the answers bag.** It currently lives in
`paths.nutrition.answers` as a *string* (`buildPlan.ts:733`,
`NutritionHub.tsx:153`). Every lever change is a `Record<string,string>`
write with no history, which is why nutrition has progression and no
progress.

**Day 1 — start the coach.** `startsNutritionPath` branch parity, a
`foodAim` on the Alex persona, re-run `coachvalue`.

**Days 2–5 — the block.** Persist it, wire levers to the week
(`LEVERS` already carry `protocolId`s — `protein-breakfast`,
`post-meal-walk`, `fibre-30`, `caffeine-cutoff`,
`protein-powder-is-food` — and `toggleProtocol` already exists; switching a
lever on should call it), the migration, and tests.

*Assumes:* no new nutrition content, no food logging, `assessNutrition`
unchanged, and that the drift problem is **out of scope** — adding
nutrition items makes `statedtime` worse, see §5 of `WHY_HE_STOPPED.md`.

One hazard to fix in passing: `PATHS.nutrition.build` pushes "Decide
tomorrow's food before you are hungry" (`definitions.ts:366-380`) with no
`protocolId` and no `sessionType`, so `routineKey` returns null and
`mergeRoutines` cannot dedupe it. Retaking nutrition adds it again, for
ever. `mergeRoutines`' own docstring warns about exactly this ("a household
with kids ended up with three Saturday-morning family blocks").

### C. Five coaches into two (§7) — the interruption layer, 3 days

**Cheapest to build: option 2.** `coaches/interrupt.ts` has six arbitrated
triggers (`TRIGGERS`, line 723), `urgency` ordering, the `mayOffer`
commitment gate, persisted dedupe (`coachInterrupts: { id; at; answerId? }[]`)
and a screen. A new trigger is one pure function
`(InterruptInput) => CoachInterrupt | null` plus a line in the array. Zero
persisted-state change, zero migration. ~0.5 day each, five coaches ≈
**3 days**. Its own docstring already names the two triggers it wants and
the fields they need (`Routine.createdAt` for nutrition, a confirmed flag
for money) — both one-field additions.

**Cheapest to be WRONG about: also option 2,** and that is the answer that
matters. Deleting a bad trigger is removing a line from `TRIGGERS`; the
persisted ids go inert and nothing on anybody's phone changes.

**Most expensive to be wrong about: option 3, the ladder's upper rungs.**
`advancePathToEarnedLevel` → `PATHS[id].build(answers with the new level)`
→ `withLadder` → `mergeRoutines` → `routines[]`, persisted. Routines are
user data. A rung you later decide was wrong has already written practices
into installed weeks, and no code change takes them back — only a
migration that deactivates them by id, which also deactivates the ones the
person has since made their own. Option 1 is the same hazard with more
content work on top.

**So: interruption layer first for all five; promote a practice to a rung
only once a trigger has been accepted on it.** That is a sequencing
argument with reversibility behind it rather than taste.

### D. The simulator — must it be fixed first?

**Yes for anything that changes where items land. No for the rest, and the
rest is most of the redesign.**

What I measured:

- `usertest:atwork`: `health_rebuilder` completes **30% of items scheduled
  inside her 08:00–16:00 against 24% of items in her free time**. The
  harness asserts she does better at work. **179 of her 683 items (26%)**
  are placed there.
- **5 of the 10 weighted cohort personas have their single best simulated
  slot inside their own stated working hours**: `young_professional`
  (evening 0.70, works 09:00–18:30), `health_rebuilder` (health midday
  0.50, 08:00–16:00), `new_parent` (midday 0.55, 09:00–17:30), `student`
  (evening 0.60, growth 0.80, 10:00–18:00), `career_optimiser` (evening
  0.68, 08:30–18:30). `SLOT_STARTS` is `{ morning: '06:45', midday:
  '12:15', evening: '17:45' }` (`engine.ts:44`), and `engine.ts:367–382`
  **actively relocates** items to that best slot when the gap exceeds 0.2,
  then scores them there (line 384). The sim does not merely tolerate
  impossible placements. It manufactures them and pays for them.
- `shift_nurse` reads **0 items at work on a 19:00–07:00 shift**.
  `clashesWithWork` tests `effective >= ends` with `ends = 07:00`
  (`atWork.ts:103`) and `eveningLoad` returns null when `sleeps <= ends`.
  Wrap-blind, confirmed, exactly as §2 says.

**Two §2 numbers are now stale, and in the same direction.** Pooled
at-work share is **10.5% (718 of 6,841)**, not 8.6%. `statedtime` reads
**46 of 72 routines drifting 15+ minutes, 35 an hour or more**, not 36 of
63. Commit 3cc4a4a — starting the training coach — made both worse by
adding nine routines, and nobody re-ran the scripts. §2's decay table was
corrected today; these two have not been.

**Cost of the fix.** `affinityFor` has **five call sites**
(`engine.ts:351, 368, 373, 384, 537`) and the fix is a multiplier: a
wrap-aware availability term from `workHours` and `sleep`. One afternoon
of code. The cost is the re-baseline, and it is not the suite — all 238
suites pass in 410 s and only `scenarios.test.ts` holds hard cohort
numbers. The cost is that three of its assertions are knife-edges:

- the **0.25 floor**, with `health_rebuilder` at **25%** today — zero
  margin. Taking her best slot away costs points she does not have.
- **"the pathway coaches add real volume"** requires *every* persona to do
  more with coaches on, plus a median gain above 1/week.
- `personas.ts:541` records that this already broke once, when one persona
  landed on different seeds.

**1 day** for the availability term, **1 day** for the wrap fix across
`atWork.ts` and the placement pass, **4–6 days** of re-baselining in which
two personas will go through the floor and the only permitted answers are
better pruning or better placement. **6–8 days, and it can fail.**
*Assumes:* the `roster` feature is not pulled in, and `truth.affinity`
values are left alone — adjusting a persona to pass is forbidden and I am
not proposing it.

**The sequencing this licenses.** The level spine and the nutrition block
read completions and a weight trend. Neither changes a start time, so
both can be built and validated against the current instrument. Nutrition's
**levers** put items in the week, and those cannot. Ship the durable rung
in front of the sim fix; hold the levers behind it.

---

## 5. A falsifiable prediction

**Primary.** Add a `foodAim` to the Alex persona and the missing
`startsNutritionPath` parity branch — no line written in
`features/nutrition/plan.ts` — and `npm run usertest:coachvalue` will move
Nutrition from **0 routines / 0 items / 0 done** to **≥3 routines, ≥60
items and ≥20 done over the 45 days**. In the same run,
`usertest:atwork` pooled share rises above **10.5%** and
`usertest:statedtime` exceeds **46 of 72** drifting, because the new
routines get `preferredStart` seeds from `protocols.startFor` the same way
the training ones did.

**What falsifies it:** started nutrition returning fewer than 20 items. Then
the artefact really is the blocker, §6's five days is the right first
spend, and my §1 is wrong.

**Secondary (§5).** Rename one routine title in a protocol definition, run
`usertest:seed`, and that path's `levelProgress.sessionsToGo` jumps back
towards the full gate on an account that has changed nothing else. If it
does not, the title join is harmless and my §3 objection collapses.

**TestFlight.** If the spine ships without `pathRungs`, the first
"my level went down and I didn't do anything" report will trace to a copy
change or a path retake, **not** to a missed week. If the first one traces
to a bad fortnight, §5 was right as written and I was wrong.

---

## 6. Role-specific: modules, reuse, and the floor

### Modules each proposal touches

| proposal | modules |
| --- | --- |
| Level spine | `paths/level.ts`, `state/store.ts` (`pathLevelState`, `startPath`, `advancePathToEarnedLevel`), `state/hygiene.ts` (`PERSIST_VERSION`, `migratePersisted`), `paths/LevelCard.tsx`, `app/(tabs)/today.tsx`, `training/TrainingHub.tsx`, `app/path/[id].tsx`, `training/level.ts` |
| Nutrition artefact | `nutrition/plan.ts` (read only — it is already right), `nutrition/NutritionHub.tsx`, `onboarding/buildPlan.ts:605,723-735`, `paths/definitions.ts:320-380`, `state/store.ts` (`saveMealPlan`, new block, `toggleProtocol`), `state/hygiene.ts`, `sim/personas.ts` (the Alex `foodAim`) |
| Five into two | `coaches/interrupt.ts` (`TRIGGERS`), `coaches/voices.ts`, `paths/ladder.ts` + `nextRung.ts` + `ladders.research.ts`, `budget/commitment.ts`, `planner/mergeRoutines.ts` |
| Sim fix | `sim/engine.ts:44-56,351-384,537`, `sim/personas.ts` (types only), `planner/atWork.ts`, `lib/scheduling/adaptation.ts`, `sim/__tests__/scenarios.test.ts` baselines, all five `tools/usertest` scripts |

### What already exists that each should reuse

- **Levels:** `LEVEL_GATES`, `LEVEL_LABEL`, `LEVEL_BLURB`, `levelProgress`,
  `earnedLevel`, `gateFor`, `distinctWeeks`, `completionEvidence`,
  `trainingEvidence`, `LevelCard`. All of it. The only genuinely new code
  is one persisted field and `max(earned, highWater)`.
- **Nutrition:** `buildNutritionPlan`, `assessNutrition`, `proteinTarget`,
  `FIBRE_TARGET_G`, the `LEVERS` table with its protocol ids,
  `model/metrics.trend`, `toggleProtocol`. §6's "equivalent of
  auto-regulation" is written, tested (`plan.test.ts`,
  `ladderMatrix.test.ts`) and shipped behind an unstarted path.
- **Five into two:** `coachInterrupts`/`nextInterrupt` arbitration,
  `mayOffer`, `voiceFor`, `rungFor`/`nextRung`/`solidityFrom`,
  `ALL_LADDERS`, `mergeRoutines`.
- **Honest display:** `health/standing.ts` for what a rung *means* in
  words — the brief's rule 1 problem is largely solved there already, and
  a ladder that borrows its vocabulary does not need a number.
- **Migrations:** `PERSIST_VERSION` / `migratePersisted` currently hold an
  identity step placed there for exactly this moment. Use one bump for both
  new fields.

### The one thing most likely to break the floor

**Starting the nutrition coach for `health_rebuilder`.**

She ends six months at **25%** against a floor of **0.25** — zero margin.
**26% of her 683 items already land inside 08:00–16:00.** Her best
simulated slot for `health` is midday 0.50, and the sim's midday start is
12:15, inside those hours — so the harness will place new nutrition items
there, score them at 0.50 × adherence, and the real guard against that is
reverted. Her `moreOf` is `['Reading', 'Time outdoors']`, so she has no
meal routine today and every nutrition routine would be net new volume on
the persona with the least room in the cohort.

That is §6 and non-negotiable 6 meeting head-on, and it is the first thing
I would run before committing to §6's artefact.

Two smaller ones, for the record:

- `coachInterrupts` is persisted and **not capped** — it is absent from
  `pruneHistory`'s `capList` calls. Five coaches' worth of triggers makes
  that list grow faster than six did.
- `career_optimiser` is §2's only decliner (**61% → 53%, −8 points**) and
  has the **largest plan in the cohort at 1,003 items** — and only **18 of
  them (2%)** are at work. His problem is not placement; it is volume. Every
  proposal in this brief adds items to his week. That tension deserves a
  number before the redesign assumes more is better.
