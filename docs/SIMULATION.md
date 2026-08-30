# Cohort simulation — 2,000 users × 26 weeks

`src/features/sim/` runs synthetic users through the **real product code**
(plan generation, all adaptation detectors with the evidence hierarchy,
suggestion accept/apply, weekly-review changes, anticipation) — nothing
mocked. Each user has a *stated* profile (what they told the interview) and
a *hidden ground truth* (when they actually complete things), so we can
measure whether INTENT converges on truth it was never told.

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

Simulation ≠ users: personas are hand-built and acceptance probabilities
are guesses. The sim validates machinery and catches regressions; only the
seven-real-days experiment validates the product.
