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
| Aero bike | — | **5 min** | — | **the warm-up, and the start of the session** |
| Bench press | 4 | 8 / 5 / 5 / 3 | **100 / 110 / 115 / 120** | the ramp, no spotter, rack safeties confirmed |
| Lat pulldown, wide grip | 4 | 15 | 80 | |
| Incline cable press | 3 | 14 | 80 | superset with ↓ |
| Close-grip push-ups | 3 | 10 | bodyweight | superset with ↑ |

**14 sets, 153 reps, about 12,200 kg of total work** — 10,445 kg of it
external, the rest being bodyweight on the push-ups at roughly 65% of
90 kg on the hands. Plus five minutes on the bike before the first set.

### Average rest — not recoverable for this session, and never again after it

He asked for his average rest and got a formula with a hole in it and a
table of five possible answers, because the start time was missing:

> `avg rest = (session minutes − 6.3 work − 1.0 transitions) / 10`

*"Start time should have been recorded above when I noted session
starting at bench press — sorry, after exercise bike, 5 mins before
that."*

**He is right that it should have been recorded, and wrong about which
number was missing — which is my fault for asking for the wrong one.**

`LoggedSet.at` is an ISO timestamp written on every set since the log
existed, and `WorkoutLog.durationMin` is saved when a session closes.
Nothing ever read either for timing. So the right measurement was never
a total duration minus estimated work; **it is the gaps between
consecutive sets**, and those need no start time at all. The five
minutes on the bike never enters it, because a warm-up is not rest
between sets.

`features/training/sessionTiming.ts` now computes it, and the workout
screen prints it. Two things it does that a mean alone would get wrong:

- **A superset is not rest.** The three incline-to-push-up changes are
  near-zero by design; counted as rest they drag the average down and
  make a disciplined session read as rushed.
- **One interruption moves a mean a long way.** A queue for the rack for
  eight minutes, across ten gaps, shifts the mean by nearly fifty
  seconds while the other nine were exactly as intended. The median is
  reported first, and the mean only when they disagree by more than
  fifteen seconds — at which point the disagreement is the finding.

**For 10 Nov the number is gone.** It was logged into a chat window, and
nothing in a chat window carries a timestamp this side of the
conversation. That is `THE_LOG_GAP` in one concrete instance: not a
missing feature, a missing capture. The next session logged in the app
reports its own rest without being asked.

For reference, the programme prescribes **93 s** as a weighted average
(120 s on the bench, 75 s on the accessories) for a 23-minute session.

### Food

| when | what | protein | fibre |
| --- | --- | --- | --- |
| morning | 2 rye toast, Vegemite, 10 blueberries | **7 g** | 5 g |
| lunch | chicken vermicelli, extra meat | **58 g** | 5 g |
| post-lift | whey in water, 1 scoop | **24 g** | — |
| afternoon | 2 protein bars | **21 g** | not counted |
| afternoon | 2 multigrain sourdough + avocado | **11 g** | 10 g |
| planned | whey in water, 1 scoop | **24 g** | — |
| planned | lasagne with vegetables | **33 g** | 8 g |
| | **the day** | **178 g** | **28 g** |

Target is **165–180 g protein and 30 g fibre**.

**He hits the protein target. First day in this project that has
happened**, and it is worth recording as a figure rather than a feeling:
178 g against a 165–180 band. Fibre lands 2 g short, which is a quarter
of an avocado.

Calories are not tracked here on purpose — `ISAAC_NUTRITION_9NOV.md`:
*"No logging, no calorie counting — the only number this plan keeps is
protein, because it is the one that protects muscle in a deficit."*

**The earlier reckoning in this file said 145 g and 18 g**, on the
prawns dinner and nothing in the afternoon. That was a projection from a
half-finished day and it read as a verdict. The fix is not a better
estimate, it is not writing a day's total before the day is over.

### Two things I am estimating, and the answer survives both

| | range | day total |
| --- | --- | --- |
| lasagne portion | 25–35 g protein | **170–180 g** |
| avocado | half → whole | 178 → **179 g**, fibre 28 → **33 g** |

**On target across the whole range**, so neither guess needs resolving.
Worth saying because this project has twice presented an estimate as a
measurement — here the conclusion does not depend on the estimate, and
that is the only reason to state it with any confidence.

Protein-bar fibre is **excluded**, not zero. A bar with 1.7 g of
declared carbohydrate is likely using a soluble fibre, which would put
the day at 32–34 g and on target for both. Left out because guessing
upward on a target he is trying to reach is the wrong direction to be
wrong in.

### The shake is doing real work tonight

**Without it the day is 154 g — 11 g short.** With it, 178 g. So it is
not a top-up out of habit; it is the difference between hitting the band
and missing it.

And the bars need no defence today. `ISAAC_NUTRITION_9NOV.md` already
settled this: *"Once you hit 165–180 g, the source stops mattering"*,
citing `protein-powder-is-food` (**grade B**, ISSN position stand, Jäger
et al. 2017 — no advantage for powder over meat, eggs, dairy or beans
once the total is met). The case against the bar was always about
fullness in an evening that falls apart, never about the bar.

Supplements: **creatine 4 g**, which is inside the 3–5 g/day the ISSN
position stand describes (`creatine-monohydrate`, **grade A**).

### "I want a balanced diet not just protein"

Correct, and the plan said something worse than narrow — it said
*"the only number this plan keeps is protein"*, which turned a
sequencing decision into a nutritional claim. Reworked in
`ISAAC_NUTRITION_9NOV.md` under **A balanced week**, from the library's
own grades rather than from preference.

The short version: **fibre is the one lever to add**, because it is the
only row that is both grade A and currently short. Oily fish is already
met by the mackerel and the salmon already in the week; the fish-oil
capsule is ruled out by its own trials (VITAL, ASCEND); the blood tests
are a GP conversation; and the multivitamin most people reach for when
they say "balanced" is graded **D**.

### Sauna — Sunday, and 16:30 today

**That is two this week, which is inside the band.** `sauna`, **grade
C**: *"Two to four sauna sessions a week, ~15–20 minutes at a heat you
tolerate well."* Nothing to add to the dose.

It is recordable, unlike mood was: `recovery.saunaMinutes` already
exists in `model/metrics.ts`, in minutes per week.

**Today's case is a different card from Sunday's**, because he lifted at
lunch. `sauna-recovery-low-heat`, **grade C**: *"Twenty minutes of
mild-to-moderate heat after a lifting session, for feeling human
tomorrow. Ten minutes still counts."* And it is already scheduled for
exactly today — its `days` field is `[2, 5]`, Tuesday and Friday.

Both cards are **C**, and the reason is worth knowing rather than
glossing: the headline heart finding is *"one Finnish population
followed for decades, with the headline result resting on 201 men in the
frequent-use group — a real and carefully collected observation, and a
single cohort measured once rather than a settled result."* The
after-lifting benefit is two small crossover trials of infrared cabins:
less soreness, better next-morning jump. And the card says plainly what
it does not do: *"heat does not add muscle. The only sauna-type trial
that measured size over six weeks found no difference."*

#### 16:30 is the right time, and not for a recovery reason

Both protocols anchor at **18:45**. For him 16:30 is better, and the
argument has nothing to do with heat.

`features/me/journal.ts`, `NO_TRANSITION`: *"Work ends at half four and
you are home with both boys about ten minutes later. There is no
decompression in your day for the drink to be competing with — it IS the
decompression, arriving at the only moment that has none."*

**A 16:30 sauna is that missing transition.** It occupies the exact
window the drink is cued in, it is performed rather than withheld, and
it removes him from the threshold instead of asking him to walk through
it and resist. That is if-then two in a different shape, and the shape
`trigger-if-then` (**grade A**) says works.

**And it only works on a Tuesday or a Friday**, which is why the
protocol's own `days: [2, 5]` is right by accident. Pickup is his on
Monday, Wednesday and Thursday (`pickupDays: [1, 3, 4]`); his partner
does Tuesday and Friday. Those two evenings are the only ones with a
gap at half four, and both of them are already lifting days.

#### The one rule to be strict about, and it is not a behaviour rule

`sauna-rehydrate`'s safety line, which is the most consequential
sentence in any of these cards:

> *"Water, not alcohol: about half of sauna deaths in the Finnish
> national series involved drink, and that is the one rule worth being
> strict about."*

This plan already has a drink cued at 16:40 and a sauna now planned at
16:30, which puts the two closer together than anywhere else in the
week. **The sequence to never run is sauna then drink** — and it is a
safety point with a mortality series behind it, not a willpower one.

He also lifted at lunch, so he goes in already down on fluid.

| | |
| --- | --- |
| rehydrate | **~0.5 L of water per 20 minutes in the heat** (`sauna-rehydrate`, C) |
| water | before and after, out at the first dizziness |
| finish by | **20:30** — `finishBeforeSleepMin: 90` against a 22:00 bed. 16:30 is clear |
| cold plunge after | **grade E.** *"Enjoy it as a ritual, because that is what the evidence can honestly call it so far"* |

##### Three Wim Hof breath holds, in the sauna — 2:00, 2:15, 2:20

Reported live. The progression is the normal one: each round goes longer
because the hyperventilation before it drives CO₂ lower, and CO₂ is what
creates the urge to breathe. **That is also precisely what makes doing
it here dangerous**, so the two facts are the same fact.

**The mechanism, in one line.** Hyperventilating blows off CO₂ without
meaningfully raising oxygen stores. The urge to breathe is driven by
CO₂, so the alarm is removed while oxygen keeps falling — and
consciousness can go **without warning**. That is hypoxic syncope, and it
is why the Wim Hof Method's own first safety rule is never to practise
in or near water, and always sitting or lying somewhere a blackout would
be survivable. People have died doing this in water.

**A sauna is not such a place, and it compounds the risk twice over.**
Heat causes vasodilation and lowers blood pressure, which independently
causes fainting — that is why saunas have their own dizziness rule. And
fainting alone in a hot enclosed room is not a faint: it is prolonged
contact with hot surfaces and a rising core temperature with nobody to
end it.

**The two practices give opposite instructions in the same room.** Every
sauna card in this library says a version of *"out at the first hint of
dizziness — that is the body being sensible, not you being soft"*
(`sauna-after-endurance`). Wim Hof breathing works by pushing through
exactly that signal. There is no way to run both and obey either.

**The library has no Wim Hof protocol**, and that is not an oversight of
coverage. Of the breathing practices it ships — `Double-inhale sigh`,
`Box breathing`, `4-7-8`, `Cyclic sighing`, `Wind-down breathing` — not
one involves hyperventilation or a breath hold. The same curation that
deliberately left out a daily weigh-in left this out too.

**What this does not say.** Not that the practice is worthless, and not
that he should stop it. Breath holds on a floor, lying down, away from
heat and water, carry none of the above. The objection is entirely about
the room.

**And he already has the safe venue.** Told immediately after: *"Longest
breath hold out of sauna is 3.2"* — read as **3 minutes 20**, to match
the 2:00 / 2:15 / 2:20 given in the same conversation. So the practice
is established, the best work already happens out of the heat, and the
only change this asks for is that the sauna rounds join them there.
Which also makes the first framing slightly wrong: this was never a
question of whether he should take it up safely, it was three rounds in
the wrong room by somebody who has the right one.

Nothing about the sauna changes: it is still the right thing at 16:30
and still the transition the plan was missing. **The breathing moves out
of it.**

#### Eight litres of water a day

Stated 10 Nov. Worth putting next to the reference figures rather than
reacting to the size of it:

| | |
| --- | --- |
| EFSA adequate intake, men, **total water** including food | ~2.5 L |
| US NASEM, men, total water | ~3.7 L, of which ~3.0 L from drinks |
| **His stated intake, drinks alone** | **8 L** |

So roughly **two and a half to three times** the usual beverage figure.

**And his context genuinely supports more than average.** Brisbane in
November, 90 kg, four training sessions a week, futsal, and a sauna at
90°C for 20–25 minutes three or four times a week. That is a lot of
sweat, and a man doing all of it needs well above a sedentary baseline.
The volume on its own is not the thing to look at.

**Nor is it near the excretory limit.** Healthy kidneys clear roughly
0.8–1.0 litres an hour. Eight litres across sixteen waking hours is
about 0.5 L/h — comfortably inside it, provided it is spread. The danger
in every documented case of water intoxication is **volume taken fast**,
not volume taken.

### The actual gap: eight litres of PLAIN water against a 90°C sauna

`electrolytes-who-needs-them` is graded **D** and is sceptical of the
whole category — and it names his case anyway, unprompted, in its own
list of exceptions:

> *"The genuine cases are the long ones: heat, endurance beyond an hour
> or two, **repeated sauna sessions**, and anyone who sweats heavily and
> salts visibly."*

Sweat carries sodium. Replacing a heavy, repeated sodium loss with
large volumes of plain water is the mechanism behind hyponatraemia, and
it is the one way the eight litres could matter. Not the litres. The
litres **with nothing in them**, on sauna days.

`sauna-rehydrate` (**C**) sets the replacement at about half a litre per
twenty minutes in the heat — so ~0.5–0.6 L for his session. That figure
is a replacement for what the sauna took, on top of the day, not part of
the eight.

### Two costs that are not safety and are easy to miss

**Sleep.** Eight litres is a great deal of urine, and anything drunk
late becomes a night interrupted. He hit 22:00–06:30 exactly on 9 Nov,
and sleep is one of only two Essential 8 parts the app can currently
read. Front-loading the day and tapering after about 19:00 protects it
at no cost to the total.

**The morning weigh-in, which starts this week.** Eight litres a day is
a large daily fluid turnover, and the 06:50 reading sits on top of
whatever last night's balance was. Third reason in two days that the
daily number measures something other than fat — after creatine putting
a kilo of water on and the sauna taking several hundred grams off.
**Read the weekly average.**

### What would actually be worth changing

1. **Salt around the sauna**, not a sachet every day. The card is grade
   D for ordinary use and names repeated sauna sessions as the
   exception; this is the exception.
2. **Spread it.** Never a large volume quickly — that is the only
   pattern that has ever hurt anybody.
3. **Taper after 19:00**, for the sleep rather than the safety.
4. **One symptom set worth knowing, said once:** headache, nausea,
   confusion or unusual heaviness after a big sweat-and-water day is the
   hyponatraemia picture. It is a doctor on the day, not something to
   push through or drink more at.

**One open question:** whether the eight litres is water alone or all
fluid. With the shakes and anything else it would be higher again.

### And a third wrinkle on the daily weigh-in

Creatine puts about a kilo of water **on**. A sauna takes several
hundred grams **off**, and tomorrow is a 06:50 reading.

Two protocols, both fine, both moving the scale in opposite directions,
and **neither of them moving fat.** This is the third time in two days
that the daily weight number has turned out to be measuring something
other than what it looks like. The rule stands and is now earning its
keep: **step on daily, read only the weekly average.**

### What the dinner swap costs the week

Lasagne is not in the repo's `DISHES` library and it is not Tuesday's
dish. Two knock-ons, one of which is perishable:

- **The 300 g of prawns were tonight.** Fresh prawns keep about two days
  in the fridge. **Freeze them tonight**, not Thursday.
- **If the lasagne uses the turkey mince, Thursday loses its dinner.**
  The 500 g of turkey mince is Thursday's bolognese, which is one of the
  two dishes that feeds another day. A shop-bought lasagne leaves
  Thursday intact; a homemade one does not.

The clean version: prawns into the freezer now, out for Thursday, and
the bolognese moves to whichever evening the mince survives to.

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

## Wednesday 11 November 2026

### Sleep

| field | value |
| --- | --- |
| to bed | **22:00** |
| up | **06:00** |
| time in bed | **8.0 h** |
| night before | 22:00–06:30, 8.5 h |

**Two nights, and both bedtimes are 22:00 exactly.** That is the half
that matters most. `sleepTiming.ts`: Windred et al., *Sleep* 2024,
60,977 UK Biobank participants — **regularity predicted all-cause
mortality more strongly than duration.** Two nights is not a series and
nothing can be read from it yet, but the thing being held steady is the
right thing.

8.0 h is still inside the 7–9 that Life's Essential 8 scores full marks
for. The half hour is not the story.

### Mood

| | |
| --- | --- |
| today | **7 / 10** |
| yesterday | 7.5 / 10 |

Reading two. `mood.moodStanding(2)` is the honest line: *"A fortnight is
where a run of days starts to have a shape; nothing before that is worth
drawing a line through."* A half-point between two readings is noise
until there is something to be noise against.

### Feeling a little unwell — and this is the entry that matters

**This is the morning after the exact combination flagged in writing
yesterday**, so it gets raised before anything else rather than
explained away.

Tuesday was: fourteen working sets, a 90 °C sauna for 20–25 minutes,
three Wim Hof breath holds **inside** it, around eight litres of plain
water, two protein shakes, and no salt mentioned anywhere.

`sauna-rehydrate`'s safety note, written into this file yesterday:

> *"Headache, nausea, confusion or unusual heaviness after a big
> sweat-and-water day is the hyponatraemia picture. It is a doctor on
> the day, not something to push through or drink more at."*

**So the question that decides everything today is what kind of
unwell**, and the branches do not overlap:

| if it is | then |
| --- | --- |
| **headache, nausea, confusion, heaviness** | **the sodium picture. A doctor today, and do NOT drink more water at it.** |
| sore throat, blocked nose, aching | a virus, and two children under five are in daycare |
| flat, foggy, low energy | the likeliest ordinary reading — see below |

### Answered: not the sodium picture

*"Still 7, just a tiny bit flat, smallest hint of a cold."*

**No headache, no nausea, no confusion, no heaviness.** That closes the
hyponatraemia branch, and it is closed out loud rather than left hanging
— it was raised hard enough yesterday to deserve a clear clearance.

What is left is a head cold starting, on a flat day.

### Training on it — the neck rule, stated as the convention it is

| symptoms | |
| --- | --- |
| **above the neck** — runny nose, sneezing, mild sore throat | training is generally fine, at reduced intensity |
| **below the neck** — chest congestion, fever, body aches, productive cough | rest |

Today is above the neck, so the session stands in `autoRegulate`'s
back-off shape: **keep the squat, drop the accessories.** Its own
comment is the reason — *"the session someone actually skips is the one
that got cancelled for them."* The app's line on the conditioning slot
is blunter and applies to the cardio rather than the lifting: *"skip it
when unwell."*

**And `readiness.ts` states what it refuses to do**, so nobody waits for
the app to catch this: *"whether someone is unwell, and it must not
start to."* It reads HRV and resting heart rate against his own
baseline. It does not diagnose.

### The sauna, with a cold

**Fine today without a fever.** A small randomised trial (Ernst and
colleagues, 1990) found regular sauna bathing reduced common-cold
incidence — small, old, not replicated at scale, so nothing to lean on,
but twenty years of it is the context and a hint of a cold is a poor
reason to break it.

**Fever is the hard line**, because heat on top of a raised core
temperature is not a wash.

Still true, and more so today: **salt around it, and do not run eight
litres while unwell.**

### The three ordinary explanations, none of which needs a diagnosis

1. **Day three without alcohol after four consecutive nights.** Malaise,
   poor energy and a flat mood are the common shape of the first dry
   week, and this is squarely in it.
2. **Tuesday's load.** Fourteen sets plus twenty-five minutes at 90 °C
   plus three breath holds is a lot of total stress in one afternoon,
   and the sauna is not recovery when it is stacked on top of the
   session rather than separated from it.
3. **The breath holds in the heat**, which is the one thing in that list
   that should not have happened at all.

### What changes today

- **Salt with food today**, and if the sauna happens, salt around it.
  `electrolytes-who-needs-them` is grade D for ordinary use and names
  repeated sauna sessions as its exception.
- **Do not run eight litres today**, and especially not plain. Drink to
  thirst until he knows what this is.
- **Today's session is Lower A, squat-led, at lunch.** `autoRegulate`
  already takes a readiness of `back-off` and cuts accessory volume
  while leaving the main work — its own comment says *"the session
  someone actually skips is the one that got cancelled for them."* That
  is the right shape: keep the squat, drop the accessories, and stop if
  it feels wrong rather than finishing it on principle.
- **The breath holds move out of the sauna**, which was already decided
  and is now overdue.

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
