# Behavioural design review & roadmap

An audit of INTENT against the behavioural science literature — Kahneman &
Tversky (judgement under uncertainty, prospect theory, peak-end), Thaler &
Sunstein (choice architecture), Gollwitzer (implementation intentions),
Milkman (fresh starts, temptation bundling), Wood (context-dependent habits),
Fogg (B = MAP), Deci & Ryan (self-determination theory) — and the concrete
mechanics that follow from it. Each item is tagged **SHIPPED**, **BUILD NEXT**,
or **LATER**.

The ethical line, first: INTENT nudges only toward the user's *stated*
intentions, always shows its reasoning, and optimises intention-completion —
never engagement. Variable-reward slot machines, guilt loops and streak
hostage-taking are permanently out of scope. This isn't just ethics; it's
strategy — trust is the moat for an app this close to someone's life.

---

## 1. What the current build already gets right

| Principle | Where it lives |
| --- | --- |
| **Defaults do the work** (Thaler). Choice architecture's strongest tool: the interview *generates* the weekly rhythm — training slots, family dinner, wind-down — as opt-out, not opt-in. The user edits a plan instead of assembling one. | `buildPlan.ts`, plan-review screen |
| **Planning fallacy correction** (Kahneman & Tversky). People systematically overcommit; the engine refuses to fill >75% of free time and enforces buffers. The app is structurally incapable of producing the overstuffed day the user would write for themselves. | `engine.ts` reserved slack |
| **Active commitment** (Cialdini consistency). Morning "Looks good" is a micro-contract. Committed plans get followed at materially higher rates than presented plans. | morning check-in |
| **No what-the-hell effect** (Polivy & Herman). A lapse framed as failure triggers abandonment ("day's ruined, may as well…"). Occurrences are "data, not judgement"; copy never moralises. | behaviour catalog, Life tab |
| **Reason-giving** (Langer's "because" studies; SDT autonomy). Every suggestion carries its evidence. Compliance *and* trust go up when the system explains itself. | `Suggestion.reason`, SuggestionCard |
| **Change the context, not the willpower** (Wood). The adaptation engine moves the workout to when the user actually completes things rather than exhorting them to become a morning person. This is the app's soul — keep every future feature on this side of the line. | `adaptation.ts` |
| **Concrete > inspirational** (System 1 cues). "You have 26 minutes free" fires action; "Crush your goals" fires nothing. | copy throughout |

## 2. Shipped in this review

### 2a. Peak-end rule — evening reflection ends on the good moment
Kahneman: memory of an episode ≈ its peak plus its end. The reflection now
asks "what got in the way" *before* "what went well", so the last cognitive
act of the day is retrieving a positive — which is also the three-good-things
gratitude effect (Seligman): reliably improves next-day affect, which
improves next-day follow-through. **SHIPPED** (`check-in/evening.tsx`).

### 2b. Fresh-start effect — temporal landmarks in plan framing
Milkman & Dai: aspirational behaviour spikes at temporal landmarks (Mondays,
month starts). Monday and first-of-month plans now open with fresh-start
framing, and the weekly review is positioned as closing a chapter.
**SHIPPED** (`engine.ts#summarise`). LATER: schedule goal re-commitment
prompts at landmarks (post-holiday, birthday).

### 2c. "Don't miss twice" — the anti-fragile streak
Streaks weaponise loss aversion but shatter (one miss → total loss → collapse).
The evidence-backed alternative: a single miss is noise; *two consecutive
misses* are the fork where habits unravel. The adaptation engine now detects
two consecutive skips of a routine and offers to protect the next session —
one accepted tap raises its salience to Must. Misses never "break" anything;
there is nothing to lose, only a pattern to reset. **SHIPPED**
(`adaptation.ts#detectMissedTwice`, tested).

## 3. Build next — ranked by effect size per unit of effort

### 3a. Implementation intentions (the single biggest lever)
Gollwitzer's meta-analysis: "when **[cue]**, I will **[action]**" plans
roughly double follow-through vs. goals alone (d ≈ 0.65). The behaviour
intention feature should capture the *cue*:

- At behaviour setup: "When does it usually happen?" → chips (evening on the
  sofa, stressed after work, kids in bed, social settings, waiting around).
- Store as `ifThenPlan` on the intention; surface the full sentence on the
  Today card: *"When the kids are in bed → phone goes on the shelf."*
- With notifications (3f) the cue becomes a delivery time: the nudge arrives
  at the moment of the cue, not at a random hour.

### 3b. Auto-completion — kill manual logging before it kills retention
Manual logging is the #1 churn engine of every tracking app. Nothing the
phone already knows should ever be asked:

- **HealthKit** (workouts, sleep, steps): a watch-detected workout
  auto-completes the plan item — the user gets a confirmation, not a chore.
  Sleep data powers late-night detection and energy predictions.
- **Calendar (EventKit)**: real commitments replace the modelled work block —
  free windows become true. The `CalendarProvider` seam already exists.

### 3c. Contextual bandit — the self-learning core
Every nudge is an experiment. Log `(nudge kind, slot, weekday, copy variant)
→ (acted-within-30min | completed | dismissed | ignored)` and run **Thompson
sampling** per user over nudge-timing arms. Deterministic, cheap, on-device;
no LLM required.

- **Cold start:** interview answers set priors (energy profile → workout-slot
  prior), so day one already feels personal.
- **Fatigue as cost:** two consecutive ignores of a nudge type halve its
  frequency and force a copy/channel change — the promised fatigue
  protection becomes a bandit penalty, not a hand-tuned rule.
- **Confidence gates:** act only at N ≥ 3 with separated estimates
  (`adaptation.ts` already establishes this pattern).
- Schema is ready: `user_decisions`, `ai_observations` (confidence, evidence,
  review_after).

### 3d. Location & activity context (on-device only)
- **Geofences** (home / gym / office — user labels once): arrive at gym →
  offer the session, shortened to the time available; leave the office late →
  offer plan compression before the evening collapses; inside protected
  family dinner → total nudge silence.
- **Motion activity:** never nudge while driving; a detected walk can count
  toward movement.
- **Charging + evening + at home** ≈ wind-down moment — the doomscroll-risk
  window where the protect-intention nudge earns its keep.
- Privacy: all context signals are processed on-device; location never leaves
  the phone (PRIVACY.md applies in full).

### 3e. Friction asymmetry (make good easy, bad effortful)
- **Widget / lock-screen:** today's next block at a glance — acting on the
  plan must not require opening the app (the app's success metric is *not
  opening it*).
- **Notification actions:** Done / Skip / Move from the notification itself.
- **Siri App Intent:** "log a drink" in two seconds, hands-free — logging
  friction is behaviour-tracking's kill switch.
- **Screen Time API** (FamilyControls/DeviceActivity — needs a dev build +
  Apple entitlement): during protected windows, opening a doomscroll app
  costs a deliberate pause ("20-second rule", Achor). The only genuinely
  effective in-the-moment phone intervention on iOS.
- **Everything-decided workouts:** the plan says *when*; it should also say
  *what* (exercises, sets) — decision fatigue at the gym door is a skip.

### 3f. Present-bias bridging
Hyperbolic discounting: 11pm-you doesn't feel tomorrow's 6am. Decisions are
already pre-made in the morning (good); add the **T-35min wind-down nudge** —
"Tonight-you wanted a 10:15 bed. Start winding down?" — which converts a
far-off intention into a present-moment default.

### 3g. Temptation bundling
Milkman: pair a *want* with a *should*. Learn wants in the interview
("podcast? series?") and bundle: "Save the next episode for the treadmill."

## 4. Later
- **Social accountability** (friends module): visible commitments to a chosen
  partner produce large adherence gains — strictly opt-in, per-goal.
- **Ethical positive surprise:** unexpected, *specific*, informational
  recognition ("third lunchtime session in a row — that's a habit forming")
  supports intrinsic motivation; scheduled contingent rewards undermine it
  (overjustification effect). Never gamify with points/coins.
- **Energy modelling:** completion × time-of-day × sleep-proxy regression
  feeding the planner's energy matching.

## 5. Measurement — does any of this work?
Every mechanic above must move the North Star (Weekly Intent Completion Rate)
for *this user*, or the bandit retires it. Instrument per-nudge outcomes from
day one; the difference between a nudge and nagging is evidence.
