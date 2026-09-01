# Who INTENT is for

## The problem this document exists to fix

Until this round, INTENT was built for one person: a founder or executive in
their thirties or forties, employed in the sense that they set their own
hours, with a partner and children, who wanted to train four times a week.
Nothing said so. It was expressed instead as a hundred small assumptions
that only became visible when someone outside that description tried to use
the app.

Two of them were defects rather than mismatches:

- **A working week was invented for people who do not have one.**
  `buildPlan` backfilled an empty `workDays` array with Monday to Friday,
  unconditionally. Anyone retired, caring at home, studying, or between jobs
  had a 9-to-5 written into their profile and blocked out of their calendar,
  and their entire first plan was built around a job they do not have.

- **Choosing not to train was impossible.** There was no zero on the chip
  list, and `Number(x) || 3` read `'0'` as falsy and returned three anyway.
  Someone recovering from surgery had to claim at least one training session
  a week to get past the screen, and was then held to three.

The rest were softer and just as excluding: an ambition placeholder that read
"Grow the business to $2m", a sleep question whose earliest option still had
you up past half nine at night, four money answers with nothing for a person
on a fixed income, and a household question that could not describe a
sharehouse or a parent being cared for.

## Week shape, not persona

A persona is a marketing object — a name, an age, a photograph. It cannot be
asked in one tap and it cannot be branched on, because two people with the
same persona can have completely different weeks, and a night-shift nurse and
a founder who works until 2am can need the same scheduling behaviour.

What changes the app's behaviour is narrower: **does this person have working
hours, are those hours theirs to set, and is their time their own.** That is
one question, asked second in the interview, and it routes everything after
it. The markets below are named by the shape of the week they have.

| Market | Week shape | What the app does differently |
|---|---|---|
| **Employed professional** | `employed` | Fixed hours. The plan owns the edges of the day — before work and after it. |
| **Operator** — founder, exec, freelancer | `selfDirected` | Hours are theirs, which is the problem. Work expands to fill everything, so the rest of life gets a claim on the day first. |
| **Shift worker** — nursing, trades, hospitality, emergency, FIFO | `shift` | The week does not repeat. Shift options include nights; the plan follows the roster rather than the other way round, and says so. |
| **Student / early career** | `study` | Timetabled blocks, casual work, little money, a lot of unstructured time. The opposite failure mode to the operator. |
| **Carer** — at home with children, or caring for a parent | `caring` | Their hours are real work and are blocked as such. What they lack is control over when interruptions land, so the plan leans flexible. |
| **Retiree / third act** | `retired` | The structural opposite of every other market: too little shape, not too little time. No work blocks at all — the week is built from what the person already has in it. |

### The seventh market, deliberately not a shape

**The rebuilder** — coming back from illness, burnout, divorce, or
redundancy — cuts across all six. Making it a week shape would force someone
to choose between describing their week and describing their situation. It is
already expressed by `capacity: 'minimal'` plus the constraints answer, both
of which apply to any shape.

## What each market is asked

The spine is twelve questions, every one a single tap or a short line.
Four of the six markets are asked **fewer** than twelve, because week shape
lets them skip what does not apply.

| | employed / selfDirected / shift / study / caring | retired |
|---|---|---|
| Name | ✓ | ✓ |
| Week shape | ✓ | ✓ |
| Priorities | ✓ | ✓ |
| Capacity | ✓ | ✓ |
| Working days | ✓ — relabelled per shape | — |
| Working hours | ✓ — shift options for `shift` | — |
| What's already fixed in the week | — | ✓ |
| Sleep | ✓ | ✓ |
| Energy | ✓ | ✓ |
| Movement / training days | ✓ — includes **none** | ✓ — reframed, walking counts |
| Constraints | ✓ | ✓ |
| Existing habits | ✓ | ✓ |
| One ambition | ✓ — placeholder per market | ✓ |
| **Total** | **12** | **11** |

Everything else is deferred to the coach that consumes it, and asked there.

## Constraints, and the line the app will not cross

`constraints` is in the spine despite being optional, on the same test that
already puts existing habits there: **it changes what gets built, not merely
when.** Asked a fortnight later it arrives after the app has spent two weeks
prescribing barbell squats to someone whose knee will not take them — and the
likely outcome of that is not a corrected plan. It is a deleted app and a
person who now believes this sort of thing is not for them.

The implementation rule is **substitute, never subtract.** A plan that answers
"my knees hurt" by deleting leg work hands back a programme with a hole in it
and teaches someone their body is the problem. Every swap keeps the movement
pattern and drops the cost: a hinge is still a hinge from a box, a press is
still a press on an incline.

Three details that matter:

- A substituted movement **loses its barbell identity**, so a goblet squat is
  never logged against a squat baseline and cannot corrupt the strength
  numbers the app later reports.
- Intensity is lowered as a **ceiling, not a subtraction**, so several
  constraints together cannot stack into something useless.
- Balance work goes **first in the session**, while there is attention left
  for it. Balance work done tired is both the least useful and least safe
  version of it.

INTENT is not a clinician and must never behave like one. These are the
conservative default an experienced coach would pick knowing one sentence
about someone, and the app says exactly that on screen: *"a sensible default,
not an assessment"*. Anything that hurts, or any condition being managed, is
a conversation for a professional.

## No user manual

The test: **can someone use every screen without being told how?**

- **Screens name themselves.** "What you're building", "The week ahead",
  "What the numbers say" — not "Life", "Plan", "Data".
- **Jargon is gone from anything a person reads.** RPE became "hard, about 2
  reps left in you". "Estimated 1RM" became "your strongest single lift".
  "Build, build, peak, deload" became "two building, one peak, then an easier
  week to let it all catch up". The numbers stay in the model where they do
  the work.
- **Nothing gives directions.** "You can add behaviours to reduce from
  Settings" was the last instruction in the app; it is now a button that goes
  there. Telling someone where to go is a manual. Taking them is a product.
- **The one non-obvious interaction is explained once.** Every row on Today
  is tappable and opens three actions, which is not discoverable by looking.
  A single line says so, and it is derived from whether anything has ever
  been completed — so it disappears by itself, nobody has to dismiss it, and
  there is no flag to migrate or get wrong.
- **Empty is never blank.** A plan with no goals says "No goals yet, and that
  is a fine place to start" rather than showing a heading with nothing under
  it.
