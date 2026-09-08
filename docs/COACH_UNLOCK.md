# Unlocking the coaches with the corpus

Written 8 September 2026, after the research run closed with 113 candidate
protocols, 500+ verified papers and six pillar ladders.

## The proposition, stated properly

People buy self-improvement. They listen to hundreds of hours of it. Then
almost nothing changes, and not because they lack discipline — because the
advice arrives as a pile rather than a plan. Nobody can hold 317 practices
in their head, work out which four apply to them this month, decide what
order they go in, and then find the hour.

**That is the job. The coaches do the remembering and the sequencing.**

The research run bought the raw material for it. This document is how the
material becomes behaviour.

## The finding that shapes everything below

`evidenceLevel` is on all 204 shipped protocols and **it is used for
nothing.** It appears in exactly three render sites — `library.tsx:79`,
`meditate.tsx:201`, `item-guidance-view.tsx:44` — and influences no
decision anywhere in the app. It is a label printed on a card.

We are the only app in this category that has graded content at all.
Grading it and then not using it is the single largest piece of value
sitting unclaimed in the codebase.

---

## 1. Make the grade load-bearing

**Where:** `src/features/planner/generate.ts`, the arbitration seam.

The day is finite and the scheduler already decides what moves and what
gets dropped. Today it decides on tier, anchors and capacity. It should
also decide on evidence.

- When the day is over-full, **the D goes before the B.**
- When two protocols want the same hour, **the better-evidenced one wins.**
- When capacity is minimal, the could-tier cut takes the weakest evidence
  first rather than the last thing added.

And it says so, in the arbitration line the app already shows:

> "Two things moved to make room for strength training — it is the
> best-evidenced thing in your week."

No competitor can copy this, because copying it requires having graded
every practice first, honestly, including the ones that come out badly.

**Test it:** an over-loaded day with one A and one D competing for the
same window drops the D, every time, and names the reason.

## 2. Ladders become rungs, not lists

**Where:** `src/features/paths/level.ts` (`PathLevel`, `LEVEL_GATES`) —
the scaffold already exists.

Six rounds produced a `ladder.md`: an *order*, not a list. What comes
first, what is wasted until the rung below is solid, and the line the
coach says at each transition. From the work ladder:

> **Rung 1 — The day has an end.** Nothing above this rung works while
> work never finishes.

That is the whole proposition in one sentence, and it is currently sitting
in a markdown file.

Encode each ladder as ordered rungs with entry conditions. Then:

- The coach **never offers rung 4 to someone whose rung 1 is not solid.**
  This is the anti-overwhelm mechanism, and it is why a person who
  listened to forty hours of podcasts still cannot start.
- Promotion is **earned and announced.** `earnedLevel()` already computes
  this from real sessions; the ladder supplies the words.
- The work ladder needs **two tracks that converge** — desk and non-desk —
  because half this audience does not control their own hours. That
  distinction is already in the intake.

## 3. Plan the dose, not the presence

**Where:** `generate.ts` and `weekReport.ts`.

The corpus carries doses, not just practices: 30–60 minutes a week of
strength-type work for the mortality association; a 14-day median for a
readiness baseline; the protein target that is a consensus figure rather
than a trial result.

The weekly plan currently places sessions. It should **target the
evidenced dose and report against it** — "you are at 35 of the 30–60
minutes the evidence associates with the benefit" — which is a far more
motivating number than a completion percentage, and it is true.

Where a dose is contested, say so rather than inventing precision. The
strength-minutes finding is already disputed between two cohorts in the
round's own notes.

## 4. "You have heard this before" — attribution as intake

**Where:** the interview, and `questionBank.ts`.

The library credits 212 distinct people. Recognition is a product feature:
somebody who reads a name they know starts from confidence rather than
suspicion, which feeds expectancy and adherence both.

Use it at intake. Show a short list of recognisable practices with their
names attached and ask **which of these you already do.** Three things
happen at once:

- Established habits get captured, which the free tier already places and
  which the simulation showed is worth +17% completed activity a week.
- The person sees the app knows the material they have been consuming.
- The coach can then say the most valuable sentence it has:
  **"You are already doing three of these. Here is the one that is
  missing."**

## 5. The time-back surface

**Where:** a new screen, and the weekly report.

Every app in this category only ever adds. The register the rounds built —
retractions, overclaims, contradicted practices, figures that trace to
nothing — lets us do the opposite.

A screen that says **what you can stop doing**, with the citation:

- the ten-thousand-hours framing
- foam rolling and movement screens before lifting
- the smaller-plate effect
- cold plunges in the hours after lifting, if muscle is the goal
- the five stages of grief
- learning styles, highlighting, rereading

Giving somebody twenty minutes back is worth more than adding a
twenty-minute practice, and it is the most quotable thing we have.

## 6. Gate on what actually moderates

**Where:** `questionBank.ts`, `DOMAIN_QUESTIONS`.

The corpus knows which few variables genuinely change the plan. Shift work
changes sleep, eating and the whole work ladder. Age over 65 changes the
protein target and the training emphasis. Income variability changes every
money card.

Ask the questions that change the plan. Skip the rest. A shorter intake
that branches hard beats a longer one that branches weakly, and the
interview has already been cut twice for length.

## 7. The one-thing selector

**Where:** the Today coach note.

At 317 protocols the coach's job stops being *listing* and becomes
*choosing*. Given the person's constraints, their level on the ladder,
what they already do and what the evidence says, there is one next thing.

Say one. The library is there for the person who wants the other 316.

---

## Order of work

1. **Grade into arbitration** (§1). Smallest change, largest and most
   defensible payoff, no new content required.
2. **Ladders into rungs** (§2). Six exist already.
3. **One-thing selector** (§7). Follows directly from 1 and 2.
4. **Attribution at intake** (§4).
5. **Dose targets** (§3).
6. **Time-back screen** (§5) — highest marketing value, so worth doing
   before any launch push.
7. **Question gating** (§6).

All of it is JavaScript and rides the held over-the-air update. None of it
touches the binary Apple is reviewing.

## Before any of it ships

The 113 candidates are **not merged and not reviewed**. The shipped
library is 204. Nothing on the website may claim otherwise until they are
in, and the merge needs a human pass — grades, the conditional-schedule
class of defect, and the attribution fixes the audit proposed.
