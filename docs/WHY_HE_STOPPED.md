# Why he stopped, traced to the line of code

Isaac, 22 Oct 2026: *"The problem is that people stop using the app I've
stopped using it."*

Asked which was closest to what happened, he chose **"I opened it and it
was wrong — the plan didn't match my actual day"**, and on notifications,
**"On, and I ignored or killed them."**

This is the churn datum `STICKINESS_BRIEF.md` says the simulator cannot
produce. It is worth more than the whole of that brief, and it points
somewhere the brief does not.

---

## 1. What he was actually looking at

His own routines screen, from the real 45-day seed:

```
Strength workout              17:30   ← at work until 18:30
Message a friend, make a plan 17:30   ← the same minute as the above
The daily walk                17:45   ← at work
Easy cardio, talking pace     17:45   ← the same minute as the walk
Wind down, screens away       11:30   ← a sleep-anchored practice, at half eleven
Date night                    11:30   ← on a Friday
Get into the best shape of …  12:05   ← the `?? '12:05'` fallback for "no idea"
```

Meanwhile Today was placing those same things at 6:45pm, 8:50pm and
9:40pm, which is roughly right. **The plan coped. The screen he opened did
not know that.**

Measured across eleven personas and twenty-six weeks
(`npm run usertest:statedtime`): **36 of 63 active routines drift fifteen
minutes or more between the time the app shows and the time it runs. 28
drift an hour or more.** The worst is a night nurse whose wind-down shows
06:00 and runs 23:40 — a seventeen-hour gap.

## 2. Why, mechanically — three layers

**(a) `preferredStart` is a seed, printed as a fact.**
`protocols.startFor` resolves an anchor once, at routine creation:
`wakeTime + offset`, or `sleepTime − offset`, or the practice's literal
time, or noon. It takes no account of the other routines competing for the
same minute and none of the person's working hours. So five wake-anchored
practices all get the same time — `new_parent`'s screen genuinely says
five different things begin at 06:00 — and the placement pass spreads them
without ever writing back.

**(b) The adaptation engine relocates body-clock routines, permanently.**
`detectSlotMismatch` checks `routine.active` and nothing else. Not
`timeAnchored`, not `duringWork`, not work hours. Its three target slots
are morning 06:00, midday **11:30** and evening **17:30** — and for
somebody working 08:30 to 18:30, **two of the three are times they are at
their desk.** `applyMoveRoutine` then writes the new time onto the routine
for good.

`wind-down` is `{ kind: 'sleep', offsetMin: 35 }` and belongs at 22:25.
It was moved to lunchtime because it kept being skipped in the evening.
A wind-down breathing practice, rescheduled to midday, in writing, for
ever. This is the same class of error as `protein-breakfast` landing at
four in the afternoon — and the worse of the two, because placement moves
one day and this rewrites the routine.

**(c) Notifications fire on the placed item and never check work.**
`plannedNotifications` skips quiet hours, `fixed` items and `neverNag`
practices. Quiet hours come from sleep and wake only. **Nothing checks
whether the person is at work at `item.start`.** So alerts arrived for
things that could not happen, he learned they were noise, and he killed
them — after which the app has no way of reaching him at all, because
`DEFAULT_NOTIFICATION_SETTINGS` ships `enabled: false` and not one
notification kind is about absence.

## 3. The app has a welcome-back and no doorbell

`commitmentBudget` computes `daysAway` and has a dedicated `return` state
with exactly the right copy — *"Back after 11 days. Start with the daily
walk and nothing else"* — and a rationale about how coming back is the
moment an app is most tempted to hand you everything it was holding.

It can only render to somebody already holding the phone. **The product
cannot notice you are gone and cannot ask you back.**

Which is why a doorbell was *not* built in response to this. Given answer
(b) — notifications were on and got killed — a doorbell would have invited
him back to the thing he left, more loudly.

## 4. What shipped

**The screen stops lying.** `features/planner/learnedStart.ts` reads the
plan history and reports where each routine actually runs, with the same
three-day floor as `applyLearnedDurations` and a median rather than a mean
so one late finish does not move the reported time. The row now shows the
observed time, and explains the gap rather than just correcting it:

> Strength workout · M W F S · **7:35pm** · 30 min
> *You asked for 17:30, and you are at work until 18:30. It runs about 19:35.*

It does **not** write to `preferredStart`. That field is the person's
request and the screen invites them to set it — overwriting a request with
an observation would delete the one thing on that screen they control.

**The clash detector stops crying wolf.** `clashesWithWork` read
`preferredStart`, so it announced "5 things want a time you are at work"
about times the scheduler had already fixed. It now reads the real
placement and reports only what genuinely lands inside work — on his seed,
3 rather than 5. A false alarm is a worse failure than the silence it
replaced: it told him his week was broken while the week was being
handled. That line was added a fortnight ago, by me, reading the field
that is a lie.

## 5. What did NOT ship, and why — this needs your decision

The fix for §2(b) is two guards in `detectSlotMismatch`: never relocate a
`timeAnchored` routine, and never offer a slot the person is at work in.
Both are obviously correct. **Both are reverted, because they drop two
personas below the completion floor of 0.25** — `health_rebuilder` to
0.23, `shift_nurse` to 0.18, from baselines of 0.302 and 0.269.

The floor was not lowered and the change was not shipped.

But the reason it fails is the finding:

```
health_rebuilder   works 08:00-16:00
                   affinity health: { morning: 0.4, midday: 0.5, evening: 0.35 }
```

**Her ground truth says midday is her best slot, and the midday slot is
11:30, which is inside her working hours.** The simulator asserts she
completes things best while she is at work, rewards the app for scheduling
her there, and punishes a fix that refuses to. `affinityFor` reads
`truth.affinity[area][slot]` and nothing else — it has no concept of work,
or of sleep.

So: **the simulator has been over-rewarding impossible placements for its
whole life, which is why the app makes them.** Every slot-related cohort
result in this repo is measured against that model.

Fixing it means teaching `affinityFor` about working hours and sleep,
which will move every baseline in the project and may break the floor for
unrelated reasons. That is a change to the main measuring instrument and
it is not one to make unasked at the end of a long session.

**Decision needed: fix the simulator's completion model, re-baseline, and
then ship the adaptation guards.** Until that happens, the app will keep
moving wind-downs to lunchtime.

One smaller bug found inside my own first attempt and worth recording: the
work-hours check was `m >= start && m < end`, which is always false for a
span that wraps midnight — so it did nothing whatsoever for the night
nurse, the one persona whose entire week is a wrapped span. Fixed before
the measurement that produced the numbers above.

## 6. What this changes about the stickiness brief

`STICKINESS_BRIEF.md` recommended week one and making earned progress
visible, reasoned from a decay curve that holds at 55% for six months. It
flagged that the curve could not see churn. It now has a churn answer, and
the answer is that the thinness was never the problem — **the app was
wrong on its face, and then trained him to silence it.**

Levels, a doorbell and a paper planner are all answers to "there is no
reason to come back". His answer was "I came back and it was wrong". That
is the first thing to fix and none of those three touch it.

## 7. Reproducing any of this

```
npm run usertest:seed        # 45 days of Alex
npm run usertest:statedtime  # stated time vs actual placement, all personas
npm run usertest:atwork      # items scheduled inside working hours
npm run usertest:decay       # adherence by week over 26 weeks
npm run usertest:depth       # how far down a screen its own answer sits
```
