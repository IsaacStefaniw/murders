# Designing for the operator

Isaac: *"let's focus on our main users — ambitious, busy professionals,
time poor but love optimising and working on these — let's make it the
best possible app for them."*

This document takes that seriously as a constraint rather than a
demographic. Everything below follows from four facts about that person.

> **They already have a calendar, and it is brutal.**
> **They will give you four seconds, forty times a week.**
> **They will answer thirty questions if each one visibly buys something.**
> **They do not want to be told they are doing well. They want to know what
> to change.**

Call them the operator. Most of what is wrong with the app right now is
that it was built for someone with more time and less appetite for detail.

---

## 1. The journeys, as stories

The numbers from `SIX_MONTHS.md`, read as six months of a life.

### The entrepreneur — the app works, and barely matters

Morgan gets 23 items a week and does 15 of them, week one and week
twenty-six alike. The coaches add **6%** — the smallest gain in the cohort.

He was already doing this. He trains four times, he holds an eating window,
he has a deep-work block. The app is a beautifully argued mirror. Six
months in it has taught him nothing he did not know and changed nothing he
did not already do.

**This is the operator, and it is the most important journey in the set** —
because it is the one that churns. Not from frustration. From "what is this
for?"

### The marathoner — the app is transformative, for one reason

Kira goes from 10.8 to **30.7** completions a week with the coaches on:
+184%, the largest by a distance. 82% completion at week twenty-six, the
highest in the cohort, and rising.

Why her and not Morgan? She has **one hard number and a date** — sub-3 in
October. Everything the app schedules is legibly in service of it, so
nothing feels like admin. Morgan's ambition is "grow the business to $2m",
which the composer turned into four milestones and a weekly review block.
Kira's turned into a training programme.

**The lesson: the app is excellent when it owns a measurable objective and
mediocre when it is a life-admin layer.** For the operator, pick the
objective and own it completely.

### The rebuilder — six months of being told she failed

Casey is handed 17.7 items a week and completes 4.7. **27% at week
twenty-six**, having started at 19%. Her goals are touched in 12% of weeks.
The weekly review deactivated two routines in twenty-six weeks.

She said `capacity: minimal` at signup and the plan never believed her.
Nearly thirteen things a week, every week, for half a year, that she did
not do.

This is not a niche persona. **This is the operator in a bad quarter** —
and every operator has one. The app has no gear for it.

### The nurse — the app is worth exactly nothing

Priya: 3.7 completions a week with the coaches off. 3.7 with all seven on.
59 items it could never place. Her week shape answer changed nothing.

She is not the target user, but she is the proof of a general defect: **the
planner has one model of a week**, and the operator's week — a Tuesday that
detonates, a Thursday in another city — is closer to hers than to the
nine-to-five the planner assumes.

### The retiree — the plan ignored the goal

Bill wants to be carrying his own shopping at 85. He got a daily walk, a
date night, a wind-down, and a calendar block called `Still carrying my own
shopp…`. No strength work — the single best-evidenced intervention for
exactly that outcome — and no grip or balance test, though the app has all
three and they are the markers that matter at his age.

**The goal was stated in plain words and the plan did not serve it.** That
failure is not about being 75.

---

## 2. What is structurally wrong

### 2.1 The app is a second calendar

Today is a list of timed blocks. The operator already keeps a calendar, at
work, that wins every conflict. A second one they must maintain is a tax.

The app's own best feature quietly admits this: `commitmentBudget` exists
to stop it asking for too much. But the *shape* is still a diary.

**What the operator wants from Today is not a schedule. It is an answer.**

### 2.2 Sixteen places to log something

`logCompletedActivity`, `logCardio`, `logBehaviourEvent`, `addMetric`,
`setWeeklyCount`, `saveWorkoutLog` are reached from **sixteen different
components** across three tabs. QuickLog and LogDidIt sit on the same
screen doing nearly the same job — and until this session, one of them
double-logged.

For a person who loves optimising, capture is the core loop. It is the one
thing that must be instant and in one place, and it is currently scattered
and inconsistent.

### 2.3 Capacity is a fact, not a dial

`capacity` is asked once — minimal / steady / push — and then treated as a
property of the person. It is a property of *the week*. The operator's
capacity swings by a factor of three between a normal week and a launch
week, and the only way to change it is Settings → About you → scroll.

Casey's journey is what happens when the app cannot hear "not this week".

### 2.4 Four tabs, and one of them is a filing cabinet

Today · Week · Coaches · Progress. Coaches is a *configuration* surface —
you set a coach up and it runs. Configuration does not deserve a quarter of
the tab bar; capture does, and capture has none.

### 2.5 The questions stop paying out

The interview's reveal lines are the best writing in the product:

> *"5 work days. Nothing gets scheduled over them."*
> *"Then those stay yours. They go in as things you already do, not as
> things to start."*

Every answer visibly buys something. That mechanism **disappears the moment
onboarding ends.** The 23 deferred questions surface inside coaches with no
payoff line, and the app never says what answering would unlock.

For the operator this is backwards. They will happily answer thirty
questions — but only if each one is priced and the prize is named.

---

## 3. Ideas

### 3.1 Restructure: **Now · Week · Log · Signal**

Four tabs, each answering one question the operator actually asks.

**NOW** — *"What do I do in the next ten minutes?"*

Above the fold, always, nothing else competing:

```
   6:15am · 45 min
   Strength — lower body
   [ Start ]        [ Not today ]

   ─────────────────────────────
   Then: Deep work 9:00 · Dinner 7:00
```

One thing, one verb, one escape. The rest of the day is a thin list below
it. Everything currently on Today — readiness, check-in, coach note,
tonight, budget, look-back, minimum week, Plus nudge — becomes **at most
one card**, chosen by the arbiter that already exists (`commitmentBudget` /
`mayOffer`), currently used for offers only.

Thirteen blocks becomes three.

**WEEK** — *"This week is chaos. Make it smaller."*

Not a second calendar. A triage surface whose primary control is the
capacity dial, live and weekly:

```
   This week          [ Minimal ]  [ Normal ]  [ Room to push ]
   Picked Normal — 11 things. Minimal would be 4: the training,
   and the two you have never missed.
```

That single control is the answer to Casey, and to every operator's bad
quarter. It costs one tap and it is the difference between an app that
survives a hard fortnight and one that gets deleted during it.

**LOG** — *"I did a thing. Two seconds."*

One surface for all sixteen. A single sheet: recent things first (their
own routines, then habits), then measurements (weight, body fat, a blood
panel), then the weekly numbers. One place, always in the same place,
reachable in one tap from anywhere.

For the optimiser this is not a utility screen — it is the screen that
makes everything else true.

**SIGNAL** — *"Is it working, and what do I change?"*

One question, answered in the first sentence, before any number:

```
   Your cardio fitness is up 1.8 points since June.
   Nothing else has moved enough to say.

   The most room is in sleep: 6h20 a night against
   the seven where the table tops out. About forty
   minutes earlier to bed is the whole gap.
```

Then the detail, behind disclosures. This is `LAUNCH_BRIEF.md` §3 —
measurement, threshold, distance — as the whole screen's organising
principle rather than one card's.

Coaches moves into Week (or Settings) as setup, where it belongs.

### 3.2 Make every question priced and paid

Two changes, both using machinery that already exists.

**Price it.** Every deferred question gets the reveal treatment onboarding
already does — a line before saying what answering buys, and a line after
saying what just changed:

> *Before:* Two taps. Your programme starts where you actually are instead
> of at the bottom.
> *After:* Moved from foundation to intermediate. Your next session is two
> sets heavier.

**Rank it by unlock, and show the ledger.** One surface — "What the app
doesn't know yet" — ordered by what each answer switches on:

```
   Your markers read 6 of 10.

   Birth year          → the headline, and a tighter margin   [ answer ]
   Sex at birth        → grip and gait                        [ answer ]
   A blood panel       → 3 of the 4 biggest components        [ enter ]
```

For a person who loves optimising, that is not a chore list. It is a
progress bar they want to fill — and it turns the gating problem
(`LAUNCH_BRIEF.md` §2) from a hidden defect into the most compelling screen
in the app.

### 3.3 Close the loop: every change gets a verdict

The app currently never asks *did that work?* `experiments.ts` and
`TrialReview` do exactly this for thin-evidence practices. Extend the
pattern to every deliberate change:

> *You added the 6:15 sessions three weeks ago. Since then: resting heart
> rate down 3, sleep unchanged, and you have kept 8 of 9. Keep it?*

One lever at a time, a fixed window, a verdict. That is the optimiser's
native loop and the app has the parts for it already.

### 3.4 Own one number

Kira's +184% is the whole argument. The app is transformative when it owns
a measurable objective and mediocre as a life-admin layer.

So at setup, after the ambition, ask one more question: **what number will
tell us this is working, and by when?** Then make it the first line of
Signal for six months.

Morgan — the closest persona to the operator — did not get one, and the app
became a mirror.

### 3.5 Cheap things that matter to this user specifically

- **Truncation.** `Get strong enough to keep u…` renders five times on one
  screen. Separate the goal's *name* from the block's *instruction*: the
  block should say "Strength — lower body", the goal keeps the sentence.
- **One-tap "not today"** that reschedules rather than deletes, on every
  item. The operator's most common interaction is not completing — it is
  deferring, and doing it honestly.
- **Widen the capture window.** Logging reaches back seven days. An
  operator reconciles on Sunday; make it two weeks.
- **The 56-chip grid on day one.** Collapse to one control.

---

## 4. What I would do in order

1. **Now reduced to one job**, with the existing arbiter doing the choosing
   (§3.1). Biggest single change to how the app feels.
2. **The capacity dial, weekly** (§3.1 WEEK). The answer to a bad quarter,
   and the cheapest retention win available.
3. **One Log surface** (§3.1 LOG), consolidating sixteen entry points.
4. **The unlock ledger** (§3.2). Turns the worst structural problem into
   the most persuasive screen.
5. **Signal rebuilt around measurement → threshold → distance** (§3.1),
   which is `LAUNCH_BRIEF.md` §3 finally landing.
6. **Own one number** (§3.4).
7. **Verdicts on changes** (§3.3).

Items 1–3 are structure and could be done in a fortnight. Items 4–7 are
what makes this the operator's app rather than a good general one.

---

*A note on what not to lose. The reveal lines, the refusal to invent
composites, the insistence on naming what the app cannot see — these are
the reasons this product could be excellent rather than merely competent.
Nothing above asks for less rigour. It asks for the rigour to be spent on
the four seconds the operator actually gives you.*
