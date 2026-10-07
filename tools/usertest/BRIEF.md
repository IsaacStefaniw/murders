# The user test

How to brief an agent so what comes back is a person's hour, not a
reviewer's report.

---

## Why this exists

Three rounds of review — 267 agents — read the code and looked at
screenshots. Isaac then used the app for ten minutes and found two real
bugs neither round had touched:

- **"Protein at breakfast is showing at 4pm."** It only happens when the
  morning is full. Every screenshot came from one hand-written fixture
  whose morning was empty.
- **"The fibre has 0 recommendations on what to actually eat."** The
  how-to existed; none of the fixture's ten routines was a practice that
  had one, so the gap was not renderable in any image an agent was given.

Both escaped for the same reason. **The agents were given a frozen
artificial state and asked to review a screen. Isaac had a lived week and
was trying to do something.**

Everything below is an attempt to give an agent the second thing.

---

## The four mechanisms

### 1. They cannot read the screen

The most important one. An LLM handed `innerText` reads all eleven hundred
characters of the fibre rationale, perfectly, every time — and so never
discovers that the card tells a hungry person nothing about what to eat.

`look` returns what somebody *glancing* sees: headings, button labels, and
the first twelve words of any paragraph, with the rest replaced by a note
of how much was left. Reading the rest costs a `read`, which costs four
actions.

This is not a simulation of laziness. It is how attention actually works
on a phone, and it is the only way a reviewer can honestly report "I
looked at this and learned nothing".

### 2. Patience is finite

Every action spends from a budget. When it runs out the session ends where
it stands.

**Giving up is not a failed run. Giving up is the finding**, and where
they gave up is the most valuable line in the transcript.

### 3. They arrive mid-life

The seed is a week the simulator actually lived — crowded days, skipped
sessions, adaptations already applied, a diary with history in it. Not a
fixture. `tools/usertest/seed.test.ts` builds it from
`src/features/sim/`, anchored so the last simulated day is today.

### 4. They have a clock

`--time 16:20` sets the hour they opened the app. Both bugs found by hand
were time bugs.

---

## The brief template

Give the agent exactly this shape. **Do not give it the repository.** The
docstrings in this codebase argue for every decision in it, and an agent
that can read them is an agent that can be talked out of its own
experience. It gets the driver and nothing else.

### Write it as an acknowledged simulation, not an identity

The first version of this brief told the agent *"You are Priya. You are
not reviewing an app. Nobody is watching you."* All three runs were
rejected by the API before a single command was sent.

That is not a hurdle to route around, it is a correction. Instructing a
model to adopt a human identity and asserting that it is unobserved is
both the thing that got flagged and, on reflection, unnecessary. Think
aloud is a documented research protocol; it does not require the
participant to believe a fiction.

What the method actually needs is four constraints, and none of them is
about identity:

| What is needed | How it is enforced |
| --- | --- |
| They cannot absorb the whole screen | `look` truncates; `read` costs 4 |
| Their attention runs out | the patience budget |
| They arrive mid-life | the simulated seed |
| They want something specific | the task |

So the brief is written openly: *you are producing the think-aloud
narration of a character, in a usability session.* Same output, same
constraints, no pretence.

```
You are running a think-aloud usability session. You play <NAME>, and your
job is to produce the narration — what this person says out loud while
using the app.

<NAME>: <two lines of life — who they are, what their week looks like.>

THE SCENE: <where they are, what time it is, what just happened, what
mood they are in.>

WHAT THEY CAME FOR: <one concrete thing, in their words, not the app's.>

WHAT THEY ALREADY ASSUME: <one or two beliefs carried from other apps.>

They have been using this app about six weeks.

Narrate in first person, present tense, as them. What they are looking at,
what they think it means, what they are about to tap and why, how they
feel about the result.

This is a record of one person's experience, not an evaluation. Do not
write recommendations and do not balance the account — a participant who
is confused says so and moves on rather than working it out, because that
is what they do in life. If a screen leaves them none the wiser, that is
the single most useful line you can write.

Their hands:
  node tools/usertest/drive.js look
  node tools/usertest/drive.js tap "<visible label>"
  node tools/usertest/drive.js scroll <pixels>
  node tools/usertest/drive.js back
  node tools/usertest/drive.js read "<first few words of a paragraph>"

Each call returns what they can see and how much patience is left.
`screenshot` is a path — read it, that is their eyes.

They know only what is on the screen. No source code, no manual.

Stop when the patience runs out, when they get what they came for, or
when they have had enough — and say what they would do next in life.
```

## What comes back, and what to do with it

The transcript is **not** a findings list, deliberately. Asking an agent
for findings is what produced round three's colour-token audit: entirely
accurate, and worth nothing.

A separate pass reads the transcripts and extracts findings, anchored to
moments: *"Sam spent four actions reading the fibre rationale and came
away not knowing what to eat"* is a finding with a timestamp on it.

Then the existing three-lens verification runs as usual — code,
consequence, house — because it has earned its place twice, including
catching two findings that described a pre-fix version of the repo.

---

## A run that did nothing must say so

The pilot's extraction pass earned its keep by refusing to invent: it
opened the run directory, found `spent: 0` and a missing log, and reported
"nobody used this app" rather than producing findings from nothing.

It also named the hole that let it happen. **A failed run returned
`undefined`, which is the same shape as a clean run with no findings.**
Silent failure that looks like success is worse than a crash, so a run
with no actions now fails the pass loudly and by name.

Before spawning three, run one, and check it spent most of its budget.

## Navigation cost, as a number

One finding was that five to seven of about thirty actions went on
getting somewhere rather than learning anything. That is the kind of
finding that produces a redesign nobody asked for, because "cut
navigation" has no target in it.

`npm run usertest:depth` gives it one. Each tab exists to answer one
question; the tool opens it on a lived seed and counts the thumb-flicks
before the sentence that answers it is on screen.

```
/today   What do I do next?                 0 scrolls
/plan    Is today a gym day, and when?      1 scroll
/life    What are my coaches doing?         0 scrolls
/data    Am I better than six weeks ago?    0 scrolls
```

It measures scrolling only. The companion measurement — taps from app
open to each answer — was written and thrown away: matching a tab by its
label hits "this week" or a heading before it reaches the tab bar, so the
run silently stays put and reports a journey it never took. Same failure
mode as the one `drive.js verify` exists for. Counting taps needs testIDs
on the tab bar.

## What this still cannot do

Say it plainly so nobody oversells it:

- It cannot tell you whether copy lands emotionally. A model narrating
  "this annoys me" is producing text about annoyance, not annoyance.
- It will not feel jank, haptics, scroll physics, or anything native.
- It cannot tell you about week eight. Every seed ends today, so nobody
  has lapsed, come back, or watched the app get something wrong three
  Thursdays running.
- **It cannot review anything that reads `metrics`.** The engine does not
  model the store's `Metric` records at all, so the practice counts, the
  trajectories and the focus-hours chart on the Progress tab are empty on
  EVERY seed, however long the run. A reviewer will report that blankness
  and be describing the harness. Those panels need a hand-entered state or
  a different method.
- **It only knows what the snapshot carries.** This has now bitten twice —
  a pre-resolved final day, and a plan history silently truncated to 21
  days because the engine pruned its own working copy. Both produced
  findings about the app that were findings about the seed. Before trusting
  a finding that an app screen is EMPTY or a figure is WRONG, measure the
  seed: `python3 -I -c` over `tools/usertest/seeds/*.json` takes a minute
  and has changed what got built every time it was run.
- It cannot tell you whether anybody would pay.
- **The persona was written by the same people who wrote the app, so it
  wants what the app offers.** A real person's goal arrives from outside
  the product's vocabulary; these are drawn from inside it. This is the
  deepest limit and no amount of harness fixes it — it came from the
  pilot's own extraction pass, which is the best argument for keeping that
  pass honest.

**Ten people in TestFlight still outrank all of it.** This makes agents
substantially better at finding the class of bug Isaac found by hand. It
does not make them users.
