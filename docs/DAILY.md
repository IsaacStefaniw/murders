# The daily three — mood, weight, sleep

Isaac, 10 Nov 2026: *"I want to record my mood, weight and sleep every
day as well."*

This is the record until the app can hold it. Same reason as
`docs/LOG.md`: a profile can be compiled into a build because it changes
rarely, and a daily number cannot. See `THE_LOG_GAP` in
`features/me/adopt.ts`.

---

## Where each of the three actually stands in the app

Asked for three things, and they are in three different states. Worth
saying before anything is recorded, because two of them are nearly done
and one does not exist.

| | metric key | captured where | state |
| --- | --- | --- | --- |
| **Sleep** | `sleep.hours` | Apple Health, else the pre-workout ask | **works** — duration only |
| **Weight** | `body.weight` | `features/health/BodyNumbers` by hand, or a smart scale via Health | **works** |
| **Mood** | — | the evening check-in, as a `Reflection` | **not a metric at all** |

**Mood is the gap, and it is worse than missing.** It is recorded — as
`Reflection.mood`, typed `1 | 2 | 3 | 4 | 5` in `types/domain.ts` — and
then nothing reads it. `readiness.ts`, `essential8.ts`, `paceInputs.ts`
and `summarise.ts` all read the `metrics` array, and mood is not in it.
So the one number he has actually volunteered unprompted is the one
number the model cannot see.

And the type cannot hold the answer he gave. **7.5 out of 10 is not
expressible in `1 | 2 | 3 | 4 | 5`.** Five chips reading "rough" to
"great" is a reasonable design for a one-tap evening close; it is the
wrong instrument for somebody who wants a daily series with half-points
in it, because a five-point scale rounds his 7.5 to a 4 and loses the
only thing a series is for.

**Sleep's gap is narrower but real.** `sleep.hours` holds a duration.
`features/health/sleepTiming.ts` wants the two clock times, and its own
argument is the reason: Windred and colleagues (*Sleep*, 2024) found
regularity a **stronger** predictor of all-cause mortality than
duration, across 60,977 UK Biobank participants and more than ten
million hours of accelerometry. Two people can average the same hours
while one sleeps 22:00–06:30 every night and the other alternates
21:00–05:30 and 00:00–09:00. Duration cannot see the difference.

So: **record the clock times, not the hours.** The hours fall out of
them; regularity does not fall out of the hours.

---

## Tuesday 10 November 2026

### Sleep

| field | value |
| --- | --- |
| to bed | **22:00** |
| up | **06:30** |
| time in bed | **8.5 h** |
| estimated asleep | **7.2–8.1 h** (at 85–95% efficiency) |
| regularity | **nothing to say yet** — one night is not a series |

**This is his stated schedule hit exactly.** `features/me/profile.ts`
records `sleepTime: '22:00'` and `wakeTime: '06:30'`, and last night was
both. Worth noting rather than passing over: the schedule in the plan is
usually the aspiration and this is the first night measured against it.

8.5 hours in bed scores full marks on Life's Essential 8, which puts the
optimum at 7–9 hours. The honest caveat is that **in bed is not asleep**
— self-reported time in bed runs about 10–15% above actual sleep, which
is the range above, and only a watch or a tracker narrows it.

### Mood

| field | value |
| --- | --- |
| score | **7.5 / 10** |
| recorded | volunteered, unprompted, same day |
| the app's own scale | **1–5, so it cannot hold this** |

No baseline. This is entry one, and the mistake this project has already
made twice is reading a single figure without the denominator — the
cohort zero that was a wiring bug, the 0.70 that was a twelve-rep
weight, and "much better than usual" with no baseline behind it. **7.5
means nothing yet.** It means something in a fortnight.

### Weight

**Not recorded, deliberately — the timing matters and this was the wrong
moment to ask.** See the next section. `profile.ts` carries 90 kg as a
stated figure, which is a starting point and not a reading.

### Training — Tuesday lunch, bench-led

| exercise | sets | reps | load | notes |
| --- | --- | --- | --- | --- |
| Bench press | 4 | 8 / 5 / 5 / 3 | **100 / 110 / 115 / 120** | the ramp, no spotter, rack safeties confirmed |
| Lat pulldown, wide grip | 4 | 15 | 80 | |
| Incline cable press | 3 | 14 | 80 | superset with ↓ |
| Close-grip push-ups | 3 | 10 | bodyweight | superset with ↑ |

**14 sets, 153 reps, about 12,200 kg of total work** — 10,445 kg of it
external, the rest being bodyweight on the push-ups at roughly 65% of
90 kg on the hands.

### Food

| when | what | cal | protein | fibre |
| --- | --- | --- | --- | --- |
| morning | 2 rye toast, Vegemite, 10 blueberries | ~200 | **7 g** | 5 g |
| lunch | chicken vermicelli, extra meat | ~795 | **58 g** | 5 g |
| post-lift | whey in water, 1 scoop | ~120 | **24 g** | — |
| | **so far** | **~1,115** | **89 g** | **10 g** |
| planned | garlic prawns, rice & peas | ~760 | **56 g** | 8 g |
| | **day, as planned** | **~1,875** | **145 g** | **18 g** |

Target is **165–180 g protein and 30 g fibre**. As planned he finishes
**20–35 g short on protein and 12 g short on fibre** — and the fibre gap
is the larger one in proportion. The fix is in the shopping list
already: Greek yoghurt, and the tin of cannellini beans.

Supplements: **creatine 4 g**, which is inside the 3–5 g/day the ISSN
position stand describes (`creatine-monohydrate`, **grade A**).

### The one interaction worth flagging

`creatine-monohydrate`'s own safety line: *"A kilo or so of water in the
first weeks is normal and is not fat."*

He has asked to start recording weight daily **while taking creatine.**
If the creatine is new, the next fortnight of daily readings will show a
rise of roughly a kilo that is water in muscle, and reading that as fat
is precisely the failure the weight protocol warns about. Two protocols
that are individually fine and collide when run together — worth saying
once, at the start, rather than in two weeks when the line goes up.

---

## When to record the weight

**06:50. Twenty minutes after you wake, after the toilet, before you eat
or drink anything, in the same clothes or none.**

That is not a guess — it is the anchor the repo's own protocol already
carries. `weekly-weight-trend`, **evidence level B**:

```
anchor: { kind: 'wake', offsetMin: 20, windowMin: 90 }
```

Wake is 06:30 in `profile.ts`, so the slot is 06:50 with a ninety-minute
window. The conditions matter more than the minute: overnight you lose
several hundred grams of water through breathing and sweat and the gut
is at its emptiest, which makes first-thing-after-the-toilet the
lowest-variance moment in the day. Every later moment carries whatever
you have eaten, drunk, and sweated since.

**Today, post-training, is the worst moment of the day to do it.** You
have just finished fourteen sets and are drinking a shake; a reading now
is a measurement of dehydration followed by rehydration.

### Daily or weekly — and the repo argues with you here

The protocol says **once a week**, same day, and the library's own
comment says a daily weigh-in was **deliberately not shipped**:

> *Deliberately NOT shipped: waist/body-fat/progress-photo tracking
> (same evidence, much closer to a body-composition ideal), a daily
> weigh-in, and refeed/"flexible day" protocols.*

Its safety note has the reason, and it is cited rather than asserted: a
randomised trial in young women found **daily weighing produced more
mood swing and lower body satisfaction** than a control activity. That
is not hypothetical harm.

**And the resolution is a distinction the protocol does not draw: record
daily, read weekly.**

- The cited harm is in **reading** the daily number — treating one
  morning as a verdict on a week. It is not in the scale touching the
  floor.
- A seven-day mean built from seven readings is a **better** estimate
  than a single weekly reading, by roughly the square root of seven: one
  Sunday morning carries the full day-to-day noise of water, salt and
  glycogen, and a week of mornings averages most of it out.

So the honest version for you: **step on every morning at 06:50, and
only ever look at the seven-day average and the line across the last
month.** `BODY_ENTRIES` already says exactly this — *"The nutrition plan
adapts to the trend in this, not to any single morning."*

**And the stopping rule, said once.** If the daily number starts
deciding what you have earned to eat, or the morning reading sets the
mood of the day, go back to weekly or drop it entirely. The protocol's
own line: *"If the weekly reading leaves you more anxious than informed,
delete it and lose nothing that matters."* You have asked this app to
help you stop drinking and vaping in the same fortnight; a second thing
that can go compulsive is worth watching.
