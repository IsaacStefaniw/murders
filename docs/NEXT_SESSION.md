# Brief for the next session

Written at the end of a long session so the next one starts effective
instead of re-deriving. Read this first.

---

## 1. The headline verdict

Isaac, after using build 21 on his phone: **"These scores are
meaningless."**

That is the most important line in this document, and it is not a bug
report — it is a product verdict on the wellbeing overview. He was looking
at *Physical activity 60 · Nicotine 50 · Sleep (no data) · BMI 70* and
none of it told him anything he could act on.

He is right. Those are Life's Essential 8 component scores, correct against
the published tables, and a person reading "Nicotine 50" learns nothing.
The number is an input to a construct, not a message to a human. The next
session's first job is to decide whether these are shown at all, and if so
what sentence replaces the numeral.

**Do not fix this by adding explanatory copy under each number.** That was
already tried — there is a "Why nicotine is in this" disclosure under every
one, and it did not stop him from calling them meaningless. The problem is
that the number is the wrong unit of communication, not that it lacks a
footnote.

Also on his list: *"To be honest the app needs serious work still."* Treat
the whole of §2 as one connected UX failure rather than eight tickets.

## 2. Confirmed defects, with root cause where it is known

### 2.1 The protocol how-to never renders where people meet protocols

**Confirmed.** `howToFor()` in `features/knowledge/howTo.ts` holds 22
written how-tos, including `fibre-30`. It is imported in exactly one place:
`app/library.tsx`.

The Today item detail — which is where Isaac saw "Thirty grams of fibre"
and asked "no explanation for fibre meals?" — shows summary, why,
attribution and safety, and never touches `HOW_TO`.

So the guidance he asked for two rounds ago ("assume that people haven't
done them before") was written, tested, and wired to a screen nobody
visits at the moment of need. Fix is small: render `howToFor(protocol.id)`
in the Today detail view.

### 2.2 No way to move between days

He cannot see what he logged yesterday, and said so: *"I can't remember
what was or wasn't included but I need to check."*

Today is today-only. Wants arrows at the top of the app to step back and
adjust. Note this is DIFFERENT from the backdating work already shipped —
that lets you file something under an earlier date from today's screen; it
does not let you go and look at Tuesday.

### 2.3 Weekly quantities cannot be entered

*"Can I easily add in number of drinks or vaping occasions for a week?"*

Currently: `BehaviourLog` refuses a quantity on purpose (it would become a
tally somebody is failing), and `drinkingBand` is one standing answer set
during onboarding.

This needs a decision, not just a build. The refusal is a real principle
with a real reason, and he is asking for the thing it refuses. The likely
resolution is that a WEEKLY standing number is a different object from a
DAILY running tally — the first is a measurement, the second is a
scoreboard — but that needs thinking through rather than assuming.

### 2.4 No provenance on any figure

*"Where did it get my BMI from?"*

**Not a bug.** Height comes from Apple Health (`healthkit.ts`, five-year
window) or manual entry in `BodyNumbers`; weight the same. The 25.2 is real.

But the app never says so, and a health figure whose origin a person cannot
trace is one they are right to distrust. Every derived number on these
screens should be able to say what it was computed from and when.

### 2.5 The pre-test cannot be found

*"Can I take the pre test I can't find it!"*

`app/answers.tsx` ("About you") exists and is linked from Settings under
Profile — but it landed in build 22, and he was on 21. Should resolve
itself on the next install. **Verify before rebuilding it.**

### 2.6 Users cannot supply data they already have

*"I've done BMI test before and blood tests etc. Add areas where I can
include this stuff."*

This is the biggest single unlock in the list and it is worth understanding
why. The markers instrument reads 4 of 8 Essential 8 components, and the
four it cannot see are diet, blood lipids, blood glucose and blood
pressure — three of which are a blood panel somebody may already have in a
drawer, and one of which is a pharmacy cuff.

Letting people type those in takes the instrument from half-blind to
complete, and they are the components carrying a large share of the risk.
`features/health/pace.ts` already has the component slots with `blocked`
reasons; they need entry screens and scoring functions (PhenoAge's
thresholds, Levine 2018, are the obvious source).

Also wanted: body composition from a scan he has already had.

## 3. Decisions that must NOT be relitigated

These were argued through with reasoning in commit messages and module
headers. Changing them needs a new argument, not a fresh opinion.

1. **No invented composites.** Every coefficient traces to a published
   effect with a citation, sample, design and caveat. See `pace.ts` header.
2. **`PROVISIONAL` stays true** until coefficients are fitted on our own
   cohort.
3. **Measurement movement is never reported as improvement.** `progress.ts`
   exists solely for this.
4. **A component runs only as far as its own paper supports.** Grip and
   gait floor at zero (decrement effects); fitness and Essential 8 may go
   negative (their papers support it).
5. **Interval and coverage are non-optional fields** on `PaceHeadline`, so
   the headline number cannot be rendered without what it is worth.
6. **Stress is asked, used for planning, and not scored** — see
   `stress.ts` for the three reasons, the third being decisive.
7. **Markers are held out of any App Review build.** `EXPO_PUBLIC_MARKERS`,
   build-time, never a hidden in-app toggle (2.3.1).
8. **Say what a behaviour does, never that it is bad** (`catalog.ts`).

## 4. State of play

- Branch `claude/rename-murders-folder-goh5q0` is the repo default. No
  merge step exists; pushing to it is shipping to trunk.
- 2,424 tests, tsc and eslint clean.
- App rejected twice (2.1(b), then 2.3.8 icon). Icon fixed. **Not yet
  resubmitted.** A resubmission needs a fresh build with `markers` left
  OFF.
- Builds 20–23 are internal TestFlight with markers ON. From build 23 the
  Settings screen shows its build tag, so a tester can tell what they have.
- Standing instruction: no OTA publish, no App Store submission without
  explicit say-so.

## 5. Suggested shape for the next session

1. Answer §1 first. Everything else is easier once the unit of
   communication is settled.
2. Then §2.6 (user-supplied data) — it is the largest capability gain and
   makes the instrument whole.
3. Then §2.1, §2.2, §2.4 as one pass: they are all "the app knows things it
   does not show you".
4. §2.3 needs a decision before a build.

Do a render-and-walk of the real screens early. Every defect on this list
was found by Isaac using the app on a phone, and none of them by the 2,424
tests — which says something about where the remaining risk lives.
