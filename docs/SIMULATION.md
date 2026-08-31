# Cohort simulation — 2,000 users × 26 weeks

`src/features/sim/` runs synthetic users through the **real product code**
(plan generation, all adaptation detectors with the evidence hierarchy,
suggestion accept/apply, weekly-review changes, anticipation) — nothing
mocked. Each user has a *stated* profile (what they told the interview) and
a *hidden ground truth* (when they actually complete things), so we can
measure whether INTENT converges on truth it was never told.

**v2 adds the modality-session and goal-progression layer**
(`sim/modalities.ts`): completed plan items resolve through the real
registry (`sessionForItem`) and *execute* — `buildWorkout` under simulated
time pressure, the breath protocol table, the meditation floor, and
milestone ticking for the business review and goal-linked blocks. Any
invalid session from product code (unresolvable stamped `sessionType`, a
workout overrunning its window, a session below its shortening floor)
counts as a **contract violation**, asserted zero.

Run: `SIM_USERS=2000 SIM_DAYS=182 npx jest --testMatch "<rootDir>/src/features/sim/__tests__/cohort.fullsim.ts"`
(deterministic; ~105 s). A 12-user smoke lives in the normal suite.

## Personas (weighted)
busy_parent_exec 29% (says morning person, is an evening completer — the
core adaptation test) · young_professional 19% · health_rebuilder 20%
(overcommits: 5× training, low real capacity) · new_parent 16% (low
capacity, family-first) · entrepreneur 16%.

## Headline results (post-fix run)

- **The learning is real.** Schedule↔life alignment (flexible minutes
  scheduled in the user's true best slot) rises **59.4% → 69.6%** over 26
  weeks — INTENT converges on ground truth it never saw, purely from
  moves/completions/skips. Weekly completion +2.6 pts overall; entrepreneur
  +5.6 (the persona with the sharpest slot preferences gains most).
- **Engine health:** 0 errors, 0 overlap violations across 364,000
  simulated days; 0.5 unplaced items/user-week.
- **Detector economics:** move_routine and protect_time each fire ~4× per
  user over six months (not naggy) with ~65% acceptance. Median time to
  first accepted adaptation: week 1 — the system feels alive immediately.
- **Values stay on the calendar:** 74% of user-weeks contain a relationship
  moment, 81% a family/enjoyment moment beyond dinner (solo personas pull
  the averages down by design).

## Bugs and design flaws the simulation caught (fixed)

1. **Engine overlap bug:** two during-work carve-outs sharing a preferred
   start (Deep work + a growth block, both Monday 09:15) were emitted
   overlapping. Found within seconds — 4 violations/user, one per Monday.
   Fixed in `workBlocks` (later carve shifts behind the earlier);
   regression test added.
2. **Anticipation spam:** uncapped, the gap detector nudged ~2×/week
   (106,000 suggestions cohort-wide) — violating the "one good suggestion"
   doctrine. Fixed: 14-day cooldown in the store and detector pipeline →
   26,000 (−75%).
3. **Pruning the wrong things:** the weekly review could rest a user's
   *last* relationship/family/enjoyment routine — and the anticipation
   engine then nagged the hole it created, forever. Fixed: the last active
   routine serving a connection area is never offered for resting.

## Capacity-aware planning (shipped from this finding)

**health_rebuilder plateaus (~25% → 26%).** Their problem isn't slot choice
— it's volume vs. capacity. This produced Interview v3's capacity question
("Running on fumes / Full but functional / Room to push"): minimal capacity
caps training days, shortens sessions, trims nice-to-haves to 2×/week and
reserves 35% of free time. Re-run results: **new_parent's entire curve
lifted** (early completion 38.9% → 42.1% before any adaptation — better
initial plans, not just better learning) and **unplaced items fell 84%**
(0.49 → 0.08/user-week — minimal weeks actually fit now). Note the honest
metric nuance: per-item completion *rate* is capacity-invariant by
construction in the sim; the real-world win volume buys is *fewer failures
experienced per week*, which is what the what-the-hell effect feeds on.

## v2 run — modalities executed, goals progressed (post-fix)

Sessions actually run through the real generators across 364,000 simulated
days with **0 contract violations**: ~104k breath sessions, ~58k workouts
(34% intelligently shortened when time compressed — main work kept, never
abandoned), ~15k business reviews, ~8k meditations, ~30k goal-linked
blocks (money check-ins, trip planning). Goal milestones: **97.1%
completed** (business 100%, finance 97%, career 94%, fitness 87%); 92.6%
of milestone-bearing goals fully done; only 6.7% still stalled at week 26.

### What the v2 layer caught (all fixed)

1. **Real product bug — the business coach was unreachable.** During-work
   routines carved into work blocks (`workBlocks`) dropped `routineId`/
   `goalId`, so the Growth block's plan item couldn't launch
   `/session/review/:goalId` — the flagship business-coach session was
   dead on arrival from Today, and its completions fed no learning. First
   run showed business milestones at **6.8%** and zero `business_review`
   sessions. Fixed: `FixedCommitment` carries both ids through the engine.
2. **Parser gap:** "Lose 10 kg and keep it off" (a core target-user
   ambition) fell through to `personal` — no milestones, no gym-coach
   link. Fixed: weight phrasing (`kg/kilos/lbs`) routes to fitness.
3. **Goals stalled silently.** The `goal_stalled` suggestion kind existed
   in the type system but *nothing produced it* — 88% of milestone-bearing
   goals were stalled at week 26 and INTENT never said a word. Shipped
   `detectGoalStalled` (21 quiet days → one nudge proposing a concrete
   30-minute block; per-goal 21-day cooldown; accepting schedules it).
   Ablation at 2,000 users: the detector alone cuts still-stalled goals
   **15.0% → 6.7%** and lifts fully-completed goals **82.8% → 92.6%**
   (career +15 pts, fitness +12 pts). Acceptance 60% at ~2 nudges per
   goal-holding user over six months — help, not nagging.

## v3 — the iterative engine loop (run → learn → improve → re-run)

Three measured iterations, each fixing the weakest thing the previous run
exposed, validated at 2,000 users × 26 weeks:

1. **Anticipation fidelity.** v2 fed the gap detector only lived days, so
   every week looked empty and it fired at max cadence for everyone
   (26,000 nudges). The app actually generates the week ahead (Today
   ensures 7 days), so the sim now does too. Honest economics: **26,000 →
   1,664** — the detector is a true safety net, firing roughly once per
   user per six months, only when the generated week genuinely holds
   nothing enjoyable.
2. **Shrink-to-fit detector** (`detectShrinkToFit`). The `shorten_workout`
   suggestion kind existed with no producer — same gap class as
   `goal_stalled`. When a routine keeps slipping and *no better slot
   exists* (the move detectors claim those first), INTENT now offers a
   smaller version (⅔ duration, never below the modality floor).
   health_rebuilder — flat at +0.1 pts for three runs — moved to **+1.7**
   in isolation; cohort completion lift **+1.9 → +3.5 pts**. Caveat: the
   gain rides on a modelled assumption (smaller ask → up to +15% start
   probability); the seven-real-days experiment is the real test.
3. **Recovery-first weekly review.** The review was resting routines on
   the same trigger (skip ≥ 60%) the shrink detector uses — amputating
   what adaptation would rather shrink; 10% of users lost 3+ routines.
   Now it proposes shrinking first and rests only routines already at
   their floor: routines rested **2,164 → 1,438**, over-pruned users
   **160 → 115**, goals stalled at end **6.7% → 3.2%** (smaller kept
   sessions keep feeding milestones).

Final state: completion 49.9% → 53.4% (+3.5 pts), alignment +8.4 pts,
milestones 98.5% done, 0 errors / 0 contract violations across 364,000
days. One deliberate trade, stated plainly: absolute completions dip 2.6%
(resting failing routines removes their occasional wins) while
*experienced failures* per user-week fall ~16% (8.5 → 7.2) — fewer
failures is what the what-the-hell effect feeds on, and the report now
tracks volume alongside rate so this trade stays visible.

## v4 — goal direction: the engine optimises movement toward stated goals

The loop's objective function changed from "was the schedule followed" to
"did the week move the user's goals". Three engine changes, one
measurement change:

1. **Every goal-linked block knows its next step.** `generateDailyPlan`
   now stamps `focus` (the review-set lever, else the next undone
   milestone) onto goal-linked items — fixed carve-outs included — and
   Today shows it ("Growth block · Next step: Define the gap"). Plans
   don't just contain goal time; they point it.
2. **Proactive underserved-goal detector** (`detectGoalUnderserved`,
   producing the previously unproduced `plan_adjustment` kind). Fires on
   the cause before the 21-day stall backstop catches the symptom: an
   active goal whose calendar footprint collapsed (all linked routines
   rested, or recent linked blocks all slipped) gets one concrete
   30-minute block aimed at its next milestone. Deliberately narrow — 234
   nudges across 2,000 users over six months (55% accepted) — because the
   v3 mechanics (shrink-to-fit, recovery-first) already prevent most
   calendar collapse. Ablation at 500 users: still-stalled goals
   5.1% → 3.6%, fully-finished goals 94.4% → 96.1%.
3. **Goal-direction suggestions surface first.** The store orders fresh
   suggestions goal-serving kinds first; Today shows one suggestion, so
   that one is the one that moves a goal.

Measurement now scores the objective directly: **goal-serving weeks**
(of weeks beginning with an open milestone goal, how many completed
something that moved it — 52.5%) and **median weeks to a finished goal**
(10). The 52.5% has a structural reading: most milestone goals run one
linked block per week, so a single skipped block idles the goal for a
week — raising cadence for behind-schedule goals is the next lever, and
it now has a metric that will show whether it works.

Simulation ≠ users: personas are hand-built and acceptance probabilities
are guesses. The sim validates machinery and catches regressions; only the
seven-real-days experiment validates the product.

## v5 — existing habits: capture, anchor, measure (2000 × 26 weeks × 3 arms)

The humans in the cohort now HAVE habits (per-persona odds: gym, walking,
fasting, meditation, sauna, cold, journaling, running), and activity
matching a true habit completes more reliably (~1.2× boost — a modelling
assumption, like shrink-relief). The ablation arm (`SIM_HABITS=0`) keeps
the humans identical but builds their plans blind to those habits —
measuring exactly what asking one interview question is worth.

**Findings (capture+tuning vs blind):**

1. **Capture's win is volume, not percentage.** Completion *rate* is a
   wash (54.6% vs 54.2% — anchors add planned items and completions in
   proportion). The real number: **things actually done per user-week
   9.7 vs 8.3 (+17%)** — organising existing habits pulls a sixth more
   real, kept practice inside the system, where the engine can schedule,
   shorten, and learn from it.
2. **Whole practices only exist if you ask.** Journal sessions 2,197 vs
   **zero** blind; meditation sessions +49%. Nobody's plan invents the
   journaling they already do — capture is the only door.
3. **Alignment improves faster with capture** (+7.7 vs +6.2 pts) — habit
   anchors hand the adaptation engine more true signal per week.
4. **Cost found and tuned: minimal-capacity overload.** Daily anchors
   crowded the calendars of users whose habits already lived happily
   outside it — new_parent finished *below* the blind arm (46.0 vs 47.3).
   Fix: at minimal capacity, habit anchors track at most 3 core days.
   new_parent slope recovered to the best of all arms (+4.8 pts, 46.6
   final); nothing else regressed.
5. **Watch item:** the weekly review rests more routines under capture
   (1,685 vs 1,211; over-pruned users 149 vs 69) — more inventory, more
   pruning. Established routines arguably deserve pruning *immunity*
   (resting someone's real habit is nonsense); candidate for v6.

Engine health across all arms: 0 errors, 0 overlaps, 0 contract
violations. Verdict: habit capture ships, with the capacity cap.
