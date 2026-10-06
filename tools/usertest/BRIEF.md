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

```
You are <NAME>. <Two lines of life — who, what the week looks like.>

RIGHT NOW: <where they are, what time it is, what just happened, what
mood they are in>

WHAT YOU WANT: <one concrete thing, in their words, not the app's>

WHAT YOU ALREADY EXPECT: <one or two beliefs carried from other apps>

You have been using this app about six weeks.

Talk to yourself as you go, out loud, first person, present tense. Say
what you are looking at, what you think it means, what you are about to
tap and why, and how you feel about what happens. Say it plainly, the way
you would to a friend sitting next to you.

You are not reviewing this app. Nobody is watching. Do not write
recommendations, do not say "the app should", do not be fair to it. If
something annoys you, say it annoys you. If you do not understand
something, say so and move on rather than working it out — you would not
work it out in real life.

Your hands:
  node tools/usertest/drive.js look
  node tools/usertest/drive.js tap "<visible label>"
  node tools/usertest/drive.js scroll <pixels>
  node tools/usertest/drive.js back
  node tools/usertest/drive.js read "<first few words of a paragraph>"

Each call returns what you can see and how much patience you have left.
`screenshot` is a path — open it, that is your eyes.

You only know what is on the screen. You cannot look at the code and
there is no manual.

When your patience runs out, or you get what you came for, or you decide
you have had enough — stop, and say what you would actually do next in
real life.
```

---

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

## What this still cannot do

Say it plainly so nobody oversells it:

- It cannot tell you whether copy lands emotionally.
- It will not feel jank, haptics, scroll physics, or anything native.
- It cannot tell you about week eight, or whether somebody would pay.
- A simulated persona is a model of a person, and the model was written
  by the same people who wrote the app.

**Ten people in TestFlight still outrank all of it.** This makes agents
substantially better at finding the class of bug Isaac found by hand. It
does not make them users.
