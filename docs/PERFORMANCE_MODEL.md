# Personal Performance Model

The Performance Intelligence layer: how INTENT moves from personalised
templates to continuously optimised personal programmes. North star:
*what should this specific person do today to make the greatest
sustainable progress toward the life they said they want — and why.*

## The model

Current state + desired state + constraints + evidence → adaptive
programme. Four bodies of knowledge, filled progressively:

- **Who you are** — profile (age, weight, household, work style, vision),
  asked only where the maths uses it, never required.
- **Where you are** — `features/model/metrics.ts`: MetricDefinition /
  MetricObservation / personalBest / trend. One framework for every
  domain (bench e1RM, body weight, deep-work hours, savings rate…).
  Nothing is measured because a phone can measure it.
- **Where you want to go** — goals, targets, milestones (existing layer).
- **What works for you** — the behavioural event stream + observations.

## Progressive Question Engine (`features/model/questionEngine.ts`)

Every possible question declares domain, importance, information gain,
burden, and answer source. INTENT asks **one** next-best question
(score = importance × infoGain / burden), never re-asks anything already
known from the profile, a metric, or a path intake, and cools down for
14 days after a skip. "I can make your training loads exact if I know
your bench press" — one question, never another assessment.

Three input kinds: `number` (→ profile fact or metric), `setEntry`
(weight×reps → e1RM observation), and `choice` (chips → merged into the
path's intake answers via `updatePathAnswers`, no rebuild). Every path
hub renders the shared `QuestionCard` for its domain, so **answering
more is always the user's choice** — each answer visibly sharpens the
plan (focus lift changes the block; food trouble reorders the lever
ladder; the money buffer reframes the first milestone).

The interview is the same engine's front door: a fuller gate (sleep
quality, pressure, food trouble in v5) builds buy-in and lands answers
where the engine looks, so nothing asked at the door is ever asked again.

## Foundations — build on what already exists

"What works for you" starts with what you already DO. The interview asks
which practices are already part of the user's life (fasting, gym
training, walking, running, meditation, sauna, cold, journaling); each
becomes an **established** routine — scheduled, labelled "already
yours", and upgraded, never prescribed back as if it were new. Knock-on
effects: an existing gym habit implies consistent training experience; a
faster's first nutrition lever (the eating window) is live from day one;
an established meditator starts the stillness practice at level 2.
Established routines are the most reliable minutes in the plan — the
engine builds the new asks around them.

## Pathway contract

ASSESS → PRESCRIBE → SCHEDULE → EXECUTE → MEASURE → LEARN → ADAPT →
REASSESS. Each deep pathway declares inputs, metrics, programme
generator, progression/regression rules, adaptation signals, safety
constraints and reassessment cadence.

## Training v2 — the reference implementation (`features/training/`)

Proof that the framework works:

- **Assess**: path intake + question engine (lift baselines as
  weight×reps → Epley e1RM observations).
- **Prescribe** (`buildProgramme`): split from real availability (≤3 days
  full-body, 4+ upper/lower), loads from the user's own e1RMs
  (percent-based) or RPE-anchored when no baseline exists, goal-shaped
  schemes (strength 4×6→5×5 + heavy top single in week 3; hypertrophy
  volume-led; fat loss adds finishers), sessions fit to the stated
  minutes, 45+ gets longer warm-ups.
- **Phases**: build → build → progress → deload/reassess. Week 4 ends in
  a retest, and the next block is computed from the new numbers.
- **Auto-regulate** (`autoRegulate`): short sleep or a tight window keeps
  the stimulus and cuts accessory volume — "Short night and a tight
  window — keeping the stimulus, cutting accessory volume."
- **Measure/Learn**: every lift logged updates e1RM, trends and PRs; the
  weekly report surfaces new records; the workout player runs the
  programme session for the day, auto-regulated.

The brief's acceptance test lives in
`features/training/__tests__/programme.acceptance.test.ts`: the 38-year-old
120kg-bench intermediate on 4 gym days and the dumbbell beginner on 3×30
minutes get materially different splits, volume, loads, exercises and
progressions — and observed performance changes the next block.

## Nutrition v2 (`features/nutrition/plan.ts`)

The second deep pathway. No logging, no counting: a **protein anchor**
(g/kg band by aim — fat loss keeps protein high to protect muscle), a
one-sentence plate, and a **lever ladder** — kitchen-closed, post-meal
walk, liquid calories, protein breakfast… — with exactly one lever live
at a time, ordered by the aim and reordered by the user's own
"where food goes wrong" answer.

Adaptation reads the **body-weight trend over three weeks and at least
three weigh-ins — never one day's reading**: flat while cutting →
switch on the next lever; losing faster than ~1%/week → ease (that pace
costs muscle); building and sliding → add the fourth feed. The energy
aim never judges by the scale at all. `NutritionHub` shows the anchor,
the trend, the verdict, the ladder, and one question.

## Work & Leadership v2 (`features/work/programme.ts`)

An executive coaching block, same shape as training: four weeks — audit
& protect → the one lever → subtract → review & reset — each with ONE
leadership practice (owners-and-dates, a real one-on-one or a defended
meeting-free morning by role, a written no, the Friday memo) and an
honest deep-hours target computed from work style × meeting load ×
pressure. Weekly deep hours are the measured number; below target and
not improving reads as a calendar problem, never a discipline lecture.

## Money v2 (`features/money/plan.ts`)

A planning engine, not a budget app: the ordered ladder (automate → one
month of buffer → kill expensive debt → three months → automate
investing → raise the rate) with the intake answers marking steps done
and exactly one step under the spotlight. One measured number — the
savings rate — judged by its 90-day trend. Education, never financial
advice.

## Mind v2 (`features/mind/practice.ts`)

A stillness practice that progresses like training: every completed
breath or meditation session logs its minutes automatically; the last
four weeks of minutes set the level (two-minute resets → five steady
minutes → ten-minute sits → sits + NSDR). The level is a mirror, not a
lock. Lives on the recovery path — a steadier nervous system is the
quiet ally of every urge intention.

## Cross-pathway intelligence v1

With multiple deep pathways on one model, the trade-offs start flowing
through it: the workout player asks one chip's worth of "last night?"
— logged as sleep.hours — and a short night auto-regulates today's
session (stimulus kept, accessories cut, reason stated). Sleep →
training is the first edge; sleep → nutrition and calendar-load →
work-target ride the same metrics.

## Goal composer v1 (`features/goals/composer.ts`)

The universal loop (docs/VISION.md) applied to arbitrary goals. The goal
planner already turns one sentence into domain-shaped milestones and a
recurring behaviour; the composer is the layer above it:

- **Measurable rungs.** Where a numeric target can be read from the goal
  ("Save $40k", "Bench 120kg", "Get to 80kg"), milestones become rungs
  with explicit `doneWhen` conditions — a metric threshold, a completed-
  session count, or a consistency streak. `confirm` rungs remain the
  honest fallback for what a number can't see (finishing the book,
  running the race).
- **Check-in schema.** Every composed goal declares how progress is
  measured, at what cadence, and at whose effort: `health` (arrives from
  Apple Health), `plan` (counted from completed sessions, no logging),
  or `ask` (one question at the stated cadence — a savings goal asks
  weekly, a revenue goal monthly). Never a form.
- **Evidence pass.** `assessGoal` checks rungs off from metrics and the
  plan-event stream and states the verdict with its reason ("At $12,000 —
  $8,000 from Halfway"). The store runs it after every metric, health
  sync and completed session, so a check-in's effect is visible the
  moment it lands. States: on-track / stalled (reuses the 21-day stall
  window) / need-data / done.
- **Approval.** The wizard's review step shows each rung's done-when and
  the tracking plan before "Make it real" — the draft is legible, and
  the user edits it, not the engine.

Archetypes v1: savings ladder (fractional rungs at 10/25/50/100%),
strength target (consistency streaks, then the e1RM the workouts already
produce), endurance event, body-weight target (read-only via Health),
revenue target, sessions-of-real-work for creative goals. Everything
else keeps the planner's ladder as confirm rungs. Deterministic
throughout, so the simulation lab can gate future archetypes.

## Evidence quality

Protocols now carry `evidenceLevel` A–E (meta-analytic → heuristic),
shown in the library. Expert communicators are discovery sources; the
grade reflects the research, not the messenger.

## UX doctrine

Complexity behind the glass. The user sees their numbers, this week's
prescription, and at most one question. Never 800 variables.

## What's next

All five paths now run deep on the shared model. The next layers:
prepare-for-this work sessions (walk in ready for the board meeting,
the hard conversation) · richer sleep context (bedtime consistency,
resting HR when HealthKit lands) · protocol preference learning (which
levers this user actually keeps) · sauna/heat protocol depth · the
global optimisation pass that arbitrates between pathways when the week
can't hold everything.
