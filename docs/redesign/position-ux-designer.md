# Position — UX Designer

What I looked at, before any of this. I seeded `career_optimiser` (45 days,
298 plan items, 105 completed, 11 routines), exported the web build, served
it, and read the rendered DOM of `/today`, `/plan`, `/life`, `/data`,
`/path/training` and `/path/recovery` at 390×844. Every number below that
is not labelled §2 came off those screens. One note on the instrument:
`depth.mjs` waits 3500ms for rehydration and on this machine that is too
short — it reported all four tabs NOT REACHED twice in a row while the
screens were in fact rendering. At 7000ms it reports what is really there.
I did not look at the interview, the onboarding flow, or any screen behind
`/session/`.

---

## 1. The position (398 words)

**The ladder is the right spine and it must not be a screen.** Build no
levels tab. Put the rung into the sentence the app already prints.

Measured: three of four tabs answer their own question at **zero scrolls**.
`/plan` cannot answer "is today a gym day, and when?" at all — NOT REACHED
in twenty flicks. Depth is not the disease. The words are. And the four
rung names — Foundation, Developing, Established, Advanced — appear on
**none of the four tabs**. Two taps down, `/path/training` reads:

> LEVEL · **Established**
> Sessions **0 / 100** · Weeks **0 / 40**
> "100 more sessions and 40 more weeks to reach Advanced."

Thirteen finished strength sessions in forty-five days, and the spine
renders as two empty bars and a ten-month wait. `trainingEvidence` counts
`logs.filter(l => l.sets.length > 0)`; the seed holds none. The coach that
supplied **148 of his items and 79 completions** (§2) scores him at nothing.
`/path/recovery` is worse: "LEVEL Developing", then four lines below,
"Developing is yours — your week has not caught up yet."

Those bars are `width: ${Math.round(frac * 100)}%`. §4.1 forbids
percentages. **The machinery §3 nominates as the spine is already the thing
§4 bans** — rightly: it reads zero on the only persona who would pay.

So, **three tabs: Today · Coaches · History.**

- **Today** opens as it does — date, then NOW — then carries two cards,
  Training and Nutrition, each headed with its rung and block week:
  *"Training · Established · block 1, week 1 · week 1 of training."* The
  rung is provenance for the thing being asked of him, not a trophy.
- **Coaches** absorbs Week: the seven days are what the two programmes put
  in the diary, and a tab for the calendar is a tab for the output. Five
  dead doors become one line — *"Sleep, money, work, your partner and your
  family are in here as practices the two programmes add."*
- **History** replaces Progress. Not "Progress" — that implies a measure.
  Not "Record" — a verb. It holds the rungs reached, dated.

`/data` today tells him: days something happened **18, was 20**; things
done **49, was 49**; time on them **19.6h, was 24.4h**. Not one line about
what he *built*. That is the −8 (§2) in plain English, and a dated rung
record is the only honest answer to it.

---

## 2. The one thing I would build first

**The rung record, counted from completed sessions, rendered on Today.**

Concretely, three changes that are one change:

1. `trainingEvidence.sessions` counts completed training items as well as
   logged sets. A session you finished is a session. Today it is not, and
   that single `filter` is why the spine reads 0/100 after six weeks.
2. Delete `LevelCard`'s two `Meter`s. They are a percentage bar with a
   fraction over them, they violate §4.1, and they are the *only* visual
   the level system has ever had.
3. Replace them with dated lines, per coach, oldest first:

   > Foundation — from 8 September, your first week.
   > Developing — from 29 September, after twelve sessions across six weeks.
   > Established — since 13 October.
   > Advanced — needs weights in the log. Nothing else is in the way.

**Why this one.** It is the smallest change that makes the ladder exist at
all. Every other proposal in this redesign — nutrition's artefact, the
interruption layer, folding five coaches in — is built on the assumption
that a person can see where they are. On the shipped build they cannot:
the word is absent from all four tabs and reads zero where it is present.
A dated list cannot empty, cannot be a percentage, and cannot reset, so it
is the only form of this that survives §4.1. And it is the founder's own
verdict applied a second time: *"these scores are meaningless"* — the fix
was removing the number, not annotating it. **0 / 100 is that number
again.**

One guard, because the critics will reach for it: *"block 1, week 1"* is
never shown alone. It is always *"block 3, week 2 · week 10 of training."*
The cumulative count only ever goes up, so nothing on the screen resets to
zero.

---

## 3. What is wrong with §5's proposed resolution

§5 says: *"A level you earn and keep is not a streak you can lose. A bad
fortnight costs you time to the next rung, never the rung."*

It is answering the wrong failure, and its own corollary makes the real one
worse.

**It is a defence against loss, and Alex's problem was absence.** He never
saw a level. Nothing was taken from him. A rung that cannot be lost is
worth nothing if it is never shown and reads 0/100 when it is.

**"Time to the next rung" is a loss, and the worse kind — unbounded and
unannounced.** A streak at least tells you plainly that it is gone. The
shipped sentence is "100 more sessions and 40 more weeks to reach
Advanced." Forty weeks. For a man who quit at six, ten months is
indistinguishable from never. Then §5's corollary — *show the rungs behind
as well as the one ahead* — prints his three climbed rungs directly above
that forty-week horizon, which does not read as a record. It reads as
*this is as far as you go.*

**The real defect: the ladder has no cadence, and §5 looks for the missing
unit in the wrong direction.** §5 asks whether there is a unit of progress
*above* the rung. There is not, and there does not need to be. The unit
that is missing is *below* it. Four rungs gated at 12/36/100 sessions and
6/16/40 weeks give Alex, at roughly 2.2 strength sessions a week, **one**
visible event in his first six months on training and **zero** on
nutrition, whose rung-two gate is 10 sessions across 4 weeks against an
artefact that is seven strings. Three visible events in a year is not a
ladder. It is four settings with a waiting room.

And the unit below already exists, researched and shipped:
`programme.ts`'s four-week block. *Block 3, week 2 · week 10 of training*
moves every seven days, is a fact rather than a grade, and only goes up.
Read that next to Duolingo: their finding was that the standard had to be
**clearer**, not lower. A standard you meet once a quarter is not unclear.
It is inaudible.

**Rule 7, which is mine to defend.** The failure mode of "gamify" here is
not the scold and not the cheerlead. It is the line that does both at once,
and it has already shipped: *"Developing is yours — your week has not
caught up yet"*, live on `/path/recovery`, four lines under a card that
already says the level is Developing. One clause congratulates, the next
corrects, and together they contradict the card above them. My rule for
every rung line is therefore mechanical: **a date and a fact, no adjective,
no verb of praise.** "Established since 13 October." Not "Nice work."
Not "you've slipped." A date cannot be wrong on the week it lands.

---

## 4. The falsifiable prediction

**Primary, measurable this week in `tools/usertest`.** Add a script that
walks each persona's six-month sim and counts *ladder events* — the number
of times `earnedLevel` returns a higher rung than it did the week before,
per coach.

> **Prediction: `career_optimiser` produces at most 2 ladder events across
> all seven coaches in 26 weeks, and 0 on nutrition.** Under the current
> gates and his ~2.2 completions a week he reaches training's `established`
> near week 16 and nothing after it, and nutrition owns nothing a session
> can be counted from.

If he clears three or four rungs in 26 weeks, my cadence argument is wrong
and §5's four rungs are sufficient on their own. I would drop it.

**Secondary, checkable from a single screenshot in TestFlight.**

> **Prediction: of ten testers, fewer than three log a single weighted set
> in week one, so at the end of week one the training level card reads
> `Sessions 0 / 100` for seven or more of them** — the same zero the
> 45-day seed produces, on people who have trained.

That is the number that must be false before any level system can be the
spine, and it is falsified by eight people typing a bench press number.

---

## 5. The screen, line by line, in render order

`/today`, Thursday 22 October, the `career_optimiser` seed. Lines marked
**new** do not exist today. Everything else is on the shipped screen and
stays, in this order.

```
TODAY                                              ‹ Yesterday

Thursday, 22 October
Light morning, full afternoon. Start slow on purpose.

NOW
Nothing needs you right now.
The daily walk at 6:45pm.
```

**new, from here — two cards, Training then Nutrition, directly under NOW:**

```
TRAINING · ESTABLISHED · block 1, week 1 · week 1 of training

Tomorrow, 7:35pm — Chest, shoulders & back A.
Bench press 3 × 6–10, about three reps left in you.

Thirteen sessions finished since 8 September. None of them has a
weight against it, so the block is still guessing your loads.

[ Put a weight on Tuesday's bench ]

Established because you said so at the start, and that is believed.
Advanced needs weights in the log — nothing else is in the way.
```

```
NUTRITION · FOUNDATION · rung 1 of 4

Protein at breakfast. Nothing above this rung works while
breakfast is coffee.

Three mornings in the last three weeks — that is the rung holding.
Rung 2 is a protein number of your own, and it needs your weight.

Tonight: chicken traybake. It is on the shopping list.
```

**shipped, unchanged, from here:**

```
TONIGHT
7:15pm — ahead of it
When the pull starts, I do the two-minute breath reset.
Doom scrolling usually lands 8pm–11pm. The hour before is where
the evening still bends.
[ Line up something else ]

6:45pm · 35m   The daily walk
8:30pm         The urge answer: two-minute reset
10:25pm        Wind down, screens away
Bed by 11pm.

FROM THE COACH
Long, slow exhales shift the nervous system toward rest; a
consistent pre-sleep routine is one of the most reliable
sleep-quality improvements there is.
Behind Wind down, screens away at 22:25 · after the public work of
Andrew Huberman · Tim Ferriss

ANY TIME          Breathe  Journal  Meditate  Plan meals
ALREADY DONE      I did something else   Log a run, row or ride

FRIDAY · SOMETHING TO LOOK FORWARD TO
Date night · 8:50pm
```

### What is deliberately absent

No bar. No fraction. No percentage. No count of days. No "Well done" and
no "you've slipped". The two rung headers are the only new furniture, they
are nine words each, and they sit above the fold on a 390×844 screen — so
the question *"where am I in this?"* joins *"what do I do next?"* at zero
scrolls, which is the one thing the shipped build cannot do anywhere.

The sentence I would defend hardest in a review: **"Thirteen sessions
finished since 8 September. None of them has a weight against it, so the
block is still guessing your loads."** It is plain, it is specific, it
names a consequence rather than a failing, and it is the opposite of both
"Great work — 13 sessions!" and "Log your lifts to keep your level." It
also happens to be the single most useful thing the app could say to this
person, and today it says nothing at all.
