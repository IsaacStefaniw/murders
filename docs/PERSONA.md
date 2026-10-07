# The one person this is for

Isaac, 6 Oct 2026: *"Working Professional, doing well in career but needs
guidance and coaching to do better, conscious of health and appearance,
likes training / workouts, nutrition and hacks to get better, needs to be
held accountable to not get stuck in bad habits, highly stressful, time
poor. This is our first target market, let's design the app and review
solely for this style of persona."*

Then: *"the person is also an intermediate gym user"* and *"quite social,
with lots of healthy habits."*

And the constraint on all of it: *"let the questions create the app but
this is our target and how it should be reviewed."* The persona does not
get hard-wired into the product. The interview still builds the plan; this
document decides who we are building for and who we review as.

Everything below is downstream of those sentences. Where this document and
any other disagree about who the app is for, this one is right.

---

## 1. Who they are

**Alex. 34. Senior enough to be busy, not senior enough to control the
diary.** Eight to ten years in. Good at the job — they are not here
because their career is in trouble. They are here because they suspect
they are running at eighty per cent of what they could be and nobody has
ever coached them on the rest of it.

- **Earns well, spends time badly.** Money is not the problem. Hours are.
- **Intermediate in the gym.** Knows the lifts, has numbers, trains three
  or four times a week when the job allows. A block that opens with "learn
  the patterns before load" is an insult that loses them in week one.
  Misses weeks to work, not to laziness.
- **Already does most of it.** Walks, runs sometimes, sauna, has tried
  meditation and cold. This is not somebody who needs a list of things to
  start — it is somebody who needs help holding what they already have.
  An app that prescribes back the habits they already own has misread them
  completely.
- **Social.** Friends, a partner, dinners, rounds. The people in their life
  are not a nice-to-have to be trimmed when the week gets tight; they are
  part of what "doing well" means. Plans with other people in them survive
  a bad week. Plans with only themselves in them do not.
- **Reads this stuff.** Huberman, Attia, protocols, zone 2, creatine. Can
  tell a decent study from a supplement advert and enjoys being able to.
- **Cares how they look**, and will not say so first. Says "health". Means
  health, and also the shirt fitting better.
- **Drinks more than they intend to on a bad week.** Scrolls at midnight.
  Not in trouble — in a groove they do not like. Both are social or
  end-of-day rather than solitary: the drinking happens with people after
  a long week, and the scrolling is what the evening collapses into. A
  product that treats either as a discipline problem has the wrong model.
- **Stressed in a way that is structural, not acute.** The job will not get
  less demanding. The plan has to survive that, not wait it out.

## 2. What they are actually buying

Not information. They already have more information than they can use —
that is the condition this product meets them in.

They are buying **a coach who knows their week**: something that decides
what matters this week, says it in one line, defends the block when work
runs over, and tells them the truth about what happened without making
them feel like a child about it.

The thing they will pay for is **somebody else holding the plan** so they
do not have to.

## 3. The five things that must be true

In order. If a change does not serve one of these, it is for somebody
else.

### One — it answers in seconds, not paragraphs

Time poverty is the binding constraint and it beats every other virtue in
this product. A screen they cannot act on inside about eight seconds has
failed, however well-researched its contents.

This is the rule the app currently breaks most often, and it breaks it
with its own best writing.

### Two — it coaches, rather than schedules

"Needs guidance and coaching to do better" is the whole premise. A
calendar that happens to contain squats is not a coach. A coach says what
to do next, why it is that and not the other thing, and what changes if it
goes well.

### Three — it holds them to it, without keeping score

The hardest requirement in the product, and the one with a genuine
tension in it: they explicitly want accountability, and the house rules
forbid streaks, percentages and any reset to zero.

The resolution is that accountability here means **being known**, not
being graded. A thing that says "that is three Tuesdays in a row the 6pm
has lost to work — move it or drop it" is accountability. A number going
down is a scoreboard. The first is what they asked for; the second is what
makes people delete the app in week three.

### Three-and-a-half — it starts from what they already do

A direct consequence of "lots of healthy habits", and the one most likely
to be got wrong quietly. The interview asks `existingHabits` and its own
note says why: an app that misses this "would have spent its first week
telling someone who has meditated daily for a decade to try meditating."

For this persona almost every box is ticked. The plan they should get is
mostly **anchors** — things they already do, named and protected — with a
small number of genuinely new things. A plan that reads as a list of
instructions has failed before they have read the second line.

### Four — it is specific enough to act on tonight

"Hacks to get better" is a taste for the concrete. Thirty grams of fibre
is a target; a tin of chickpeas is a protocol. They want the second and
will forgive the first only once.

### Five — it is honest about evidence, loudly

This is the one person who genuinely wants the grades — who will respect
a D more than a confident claim, because they have been sold confident
claims before. The app's self-grading is not a compliance feature for
this person. **It is the differentiator**, and it is currently set in the
smallest type on the screen.

## 4. What this means we are not building

Said plainly, because the cost of one target market is the things it
rules out.

| Not for Alex | Why it is in the product |
| --- | --- |
| The money coach | Built. Alex's money is fine. |
| The family coach's full depth | Alex may not have kids — though the partner and the friends are squarely in. |
| Night shifts and roster shapes | Real machinery, serving a real person who is not this one. |
| The retired and student personas | Cohort safety nets. |
| Most of 323 protocols | Breadth bought for a population. |

**None of this gets deleted.** It is tested, it works, and a second market
is a quarter's work rather than a rebuild. But nothing in that column gets
another hour until Alex's product is finished, and nothing in it earns a
place on Alex's screens.

The sim's ten-persona cohort stays exactly as it is, for the opposite
reason: it is the safety net that proves a change has not broken somebody,
and a safety net you only test with the person you like is not one.

## 5. The honest tensions

Written down rather than resolved, because a persona document that has no
tensions in it has not been thought about.

- **Appearance versus no scores.** Alex wants to see themselves change.
  The product refuses to score people. The answer is probably measurement
  without judgement — a number they chose, over time, with no target
  attached — but that is a design problem, not a solved one.
- **Accountability versus never scolding.** See §3.3. The line is between
  being known and being marked.
- **Hacks versus honest evidence.** The taste for optimisation is exactly
  the appetite that supplement adverts feed. The grades are what make
  serving that appetite defensible, which is another reason they cannot
  stay illegible.
- **One market versus the sim.** Narrowing the product must not narrow the
  test cohort. Those are different instruments.

## 6. How to use this

Three questions, for any proposed change:

1. **Does Alex have eight seconds for this?**
2. **Is this coaching, scheduling, or decoration?**
3. **If this is the only thing they see today, was today better?**

And one for review: a finding is only a finding if it cost Alex something.
A defect that only reaches the night nurse is real, recorded, and not this
quarter's work.

---

## 7. What the app currently gives Alex

Measured, not argued. Six weeks of simulated life on the current build,
seeded through `tools/usertest`:

```
coaches started          1 of 7   — recovery (habits). No training coach.
                                    No nutrition coach.
routines                 10, of which SIX fall in 17:30–20:30
completion               46 of 135 (34%), 43 explicitly skipped
the ambition on screen   "Get into the best shape of …"
sleep anchor             "Wind down, screens away" — turned OFF by the
                         adaptation engine after repeated misses
```

Read that against §3.

- **It does not coach the two things they came for.** The person who likes
  training and nutrition gets neither coach started. The one that does
  start is the habits coach — which is right, and alone.
- **It puts six things in one evening.** Strength, the daily walk, zone 2,
  sauna, a friend message and the shape goal, all between 17:30 and 20:30,
  for somebody whose evening is the only time they own. Time poverty is
  the binding constraint and the plan is built as though it is not.
- **It truncates their ambition to an ellipsis** on the block that is
  supposed to represent it.
- **It quietly switched off the sleep anchor** rather than making it
  smaller or asking.

None of this is a bug in the sense of something being broken. Every piece
works as designed. It is what the product does when it is built for a
population and met by the person we are actually selling to.

---

## 8. The review, as Alex, on the current build

Three sessions on `tools/usertest`, each with a question and about thirty
actions of patience: **06:40** (is today a gym day, before or after work?),
**21:50 after a couple of drinks** (does it know this is a pattern?), and
**Sunday 10:15** (am I better than six weeks ago?). All three ran for real
— 26, 23 and 26 actions.

Fifteen findings, every one anchored to a quote. The six that matter, by
what they cost Alex:

### 1. "It's all decided" — except the one number he came for

Tapping the squat row gives an empty box labelled **kg** and a reps box
prefilled 5. No prescription, no "last time 92.5", no history. The header
says *"STRENGTH — ~36 minutes. It's all decided."* and the footer says
*"Form over load; leave one rep in the tank"* — the beginner line, to an
intermediate lifter, on the one screen where loads belong.

**Fixed.** The screen now claims only what it knows. Where no main lift
has a load — from the programme, from `suggestNext`, or from the last
performance — the header reads *"~35 minutes. The loads are yours to
set."*, there is a card that goes and gets them, and the footer is read
off `trainingLevelState().level` rather than assuming a beginner.

### 2. The app gives two opposite answers to "is today a lifting day"

`/plan/routines` says *"Strength workout — M W F S"*. Tuesday is not in
it. The **Train** chip on Today opens a full strength session anyway and
calls it decided. **Verified in code and fixed**: the chip was
unconditional, and `/session/workout` builds a stock session whatever the
plan says.

### 3. The end of the day omits the drink and reports the protocol that failed as Done

**The worst moment, and the worst sentence this product has said.** Alex
logs a drink at 21:50. The app responds well — *"That is five this week"*,
*"11 of your last 11 have been 20:15–23:00."* Four minutes later the
end-of-day screen says *"Easy cardio and The urge answer happened"*, never
mentions the drink, and reports the two-minute reset as **Done**.

Structural, not a slip: `dayRows` reads `plan.items` and nothing else, so
the screen could not have seen a behaviour event if it tried. **Verified
and fixed** — it now says what the day also held, counted and not graded.

### 4. The scheduler put his whole week in the hour he does not have

Every health item is scheduled between 17:30 and 18:45. Alex finishes at
18:30. The review grid, on the same account, knows the 6pm slot is ✗ ✗ ✗.
The one sentence a coach would write — *your evening slot has failed three
weeks running and you finish at half six; train before work or move it to
the weekend* — is derivable from two screens the app already renders, and
it is never said.

**Fixed**, and it turned out to be a whole missing class of detector
rather than a missing sentence. Every detector in `adaptation.ts` is
BEHAVIOURAL: it waits for repeated failure and then reacts.
`src/features/planner/atWork.ts` is the other kind — structural, true on
day one, before any evidence exists, and so three weeks cheaper for the
person. Routines now say it on `/plan/routines`:

> 5 things want a time you are at work — you finish at 18:30. Either they
> move, or they all land in the same evening.
>
> 8 things want the 4.5 hours between finishing and sleeping.

and per row: *"You are at work until 6:30pm — this cannot start when it
says."* It moves nothing by itself. People leave early, work from home,
have a gym in the building.

### 5. A 0–100 score, on a number that is wrong, in a product that forbids scoreboards

*"Physical activity — 100"* on a full bar, captioned "235 minutes of
training the app watched this week", on a morning the Week tab reads
*"Training 1/12"*. Both the forbidden thing and a false version of it.
This is work item §1, now with a second reason.

**Half fixed, and half of it was not true.** The number is not false:
`activityMinutes` filters `status !== 'completed'`, verified before
anything was changed. The defect was two honest measures — minutes over a
rolling seven days, items over the planning week — both labelled "this
week". The caption now names its own window: *"115 minutes of training
completed in the last 7 days"*. Worth recording that the finding
overstated itself, for the same reason the harness correction below is
recorded. The 0–100 score itself stands and is still work item §1.

### 6. The Coaches tab, six weeks in, is an unanswered setup question

It cannot be scrolled past its own onboarding: *"If life is genuinely
working three years from now — what does it look like?"*, asked at 06:40
on a Tuesday and again at 21:52 on a bad night. The tab named after the
thing he is paying for.

### What was NOT a finding, and why that matters

The reviewer reported the app pre-resolving the day — tonight's walk
marked *Skipped* at breakfast. **That was my harness, not the app.** The
simulation lives through its last day, so the seed arrived with that
evening already resolved. Fixed in `seed.test.ts`: today resets to
`planned`, history before it stands.

Worth stating plainly, because a review instrument that cannot be caught
lying is not an instrument.
