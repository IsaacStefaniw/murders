# The overhaul — a thousand reviewers, twice

Written 2026-09-04. Isaac asked for a complete overhaul of the app before
launch: overhaul it, hand the result to other sessions to review as a
thousand different users, aggregate what they said, implement it, and hold
the release until Apple approves 1.0. This is the record of that loop.

Nothing here has been published. The changes sit on the branch, gated by
`tsc`, `eslint` and 886 tests, and go out as an over-the-air update after
approval (see `docs/RELEASE.md`).

## How the review ran

1. **The pack.** A Playwright walk of the web build captured both
   journeys (the interview to the first day; the free tier through every
   hub, the library and the paywall) as text and screenshots, thirty-one
   screens in all (`A01`–`A31`). Reviewers read the pack, not the code.
2. **The people.** `docs/review/personas.py` draws a thousand personas
   from the markets in `docs/MARKETS.md` plus the rebuilder, with age,
   household, week shape, a health condition where the market has one,
   a budget and a reason for opening the app. Seeded, so the same
   thousand can be drawn again.
3. **The reviewers.** Fifty agents, twenty personas each, each writing to
   the brief in `docs/review/REVIEWER_BRIEF.md`: what they understood,
   where they stopped, what confused them, the words they did not know,
   whether they would pay, and a fixed set of tags so the answers add up.
4. **The aggregate.** `docs/review/aggregate.py` counts tags, severity,
   would-pay and understanding, by market, and lists the most-quoted
   confusions and jargon. The full round-one report is
   `docs/review/round1-report.md`.
5. **Round two.** After the overhaul, a hundred fresh personas on the
   rebuilt pack, same brief (`REVIEWER_BRIEF_R2.md`), same tags, so the
   two rounds compare. Report: `docs/review/round2-report.md`.

## What a thousand people said (round one, n = 1,000)

Understood what it is after the first screen and the interview: 96%.
Would pay: yes 40%, maybe 39%, no 21%. Mean severity 2.5 on a scale
where 5 is "delete immediately".

| Finding | Share | What they said |
|---|---|---|
| Health condition ignored | 31% | Chose pregnant, on medication, a heart condition, ADHD; the plan never mentioned it. |
| Paywall too early | 30% | A price between the plan review and the first day. |
| Jargon | 24% | "Life Operating Plan", "the ladder", "Zone 2", "connect an account", "Build web-preview". |
| Interview too long | 20% | Twelve questions before anything is shown. |
| Price too high | 15% | Mostly students, carers and retirees. |
| Free tier unclear | 14% | Could not tell what the free version does. |
| Copy too long | 12% | Hub intros and the plan review. |

What they liked, in the same order: would recommend 38%, the reasons on
every line 31%, privacy 22%, tone 16%, the evidence grades 12%.

## What changed

**Batch one** (`008005a`), the top of the list:

- The paywall moved off the path. The offer became a card on Today with a
  "Not now" that stays dismissed; every locked session still opens the
  paywall on tap. Nothing about what is free or paid changed.
- Health conditions are heard. Three new constraints (blood sugar,
  hormonal, mental health); the plan review names every constraint and
  says what it changes; hormonal and mental-health constraints cap
  training intensity the way the physical ones already did.
- The words. "Your plan" for "Life Operating Plan"; "Change my answers"
  for "Retune"; "Easy cardio (Zone 2)" and "Hard intervals (VO₂ max)";
  "Double-inhale sigh"; area for pillar; the dev build tag hidden on web.
  A test (`src/features/copy/__tests__/jargon.test.ts`) keeps them out.
- Shorter: the welcome, the Today intro, the plan review, the nutrition
  and library intros; one "Log what I did" instead of two.
- The suggestion card waits for the second day, because a pattern needs
  days to exist.
- The paywall says the annual price per month, billed once.
- Captions moved from 12 to 14pt.

**Batch two** (`0b0323e`): an example day before the first question. The
same builder and scheduler the interview feeds, run on a made-up person,
shown as the day it produces, reachable from the welcome screen.

**Batch three** (`edbae06`), from round two:

- The Plus card waits for the second day. On the first, the day is the
  pitch.
- What is free is said plainly: "free for as long as you like"; the
  program card says "built and waiting"; the urge tools are open in the
  library in every case, matching the rule that already ran them free.
- "Your steps" for "the ladder" on Money; "steps" for "milestones" as a
  label; heart-rate variability spelled out before HRV; "easy cardio" in
  the programme line; a plain sentence for evidence grade B.
- Counts of practices are gone from the Life tab and the paywall. The
  grading is what is said instead (`docs/PROBLEM_STATEMENT.md`).

## Round one against round two

| | Round one (n = 1,000) | Round two (n = 100) |
|---|---|---|
| Understood what it is | 96% | 99% |
| Would pay: yes | 40% | 42% |
| Mean severity (5 worst) | 2.52 | 2.37 |
| Health condition ignored | 31% | 4% |
| Interview too long | 20% | 9% |
| Jargon | 24% | 20% |
| Unclear what it is | 4% | 1% |
| Interview missing option | 8% | 5% |
| Paywall too early | 30% | 44% |
| Free tier unclear | 14% | 23% |
| Would recommend | 38% | 47% |
| Reasons helpful | 31% | 54% |
| Privacy trust good | 22% | 48% |

The two rises are the same finding and are what batch three answers.
Moving the paywall off the path put the Plus card on Today, where
reviewers met it the moment the plan was approved, before a free day had
been lived. It read as the same gate with a new name, and with the card in
front of them people asked harder what the free version was. The card now
waits a day. That is not yet measured; a third round on the current build
is the check.

The jargon that remained in round two was a different list from round
one: "Zone 2" (26 mentions), HRV (22), "milestones" (14), VO₂ max (11),
"the ladder" (7), the evidence-B sentence (6). Batch three took the last
four; "Zone 2" and VO₂ max stay in brackets after their plain names
because the practices are known by those names and the library is where
people look them up.

Where people stopped moved too. In round one the largest stop was the
paywall (A21, 73 of 185 stops). In round two it was the Coaches tab on
the free tier (A23, 10 of 22), where the program cards said "runs with
Plus" without saying what was already built. That card is reworded.

## By market

| Market | Understood r1 → r2 | Would pay r1 → r2 | Severity r1 → r2 |
|---|---|---|---|
| Employed professional | 96% → 100% | 44% → 68% | 2.5 → 1.9 |
| Operator: founder, exec, freelancer | 99% → 100% | 42% → 58% | 2.5 → 2.4 |
| Shift worker | 95% → 100% | 32% → 24% | 2.7 → 2.6 |
| Carer at home | 98% → 100% | 45% → 27% | 2.4 → 2.5 |
| Student or early career | 96% → 90% | 37% → 20% | 2.5 → 2.7 |
| Rebuilder | 94% → 100% | 45% → 40% | 2.5 → 2.2 |
| Retiree or third act | 95% → 100% | 27% → 20% | 2.7 → 3.0 |

Round two's market cells are small (five to twenty-five people) and the
would-pay column swings with them. Two patterns hold across both rounds
and are not fixed by copy: shift workers want a roster, not a set of
work days; carers, students and retirees find the price high for what
they would use.

## What remains

Ordered by how often it came up and how much it would take.

1. **A roster for shift workers.** The interview takes work days and
   hours as one pattern. Nurses, FIFO and hospitality reviewers asked for
   a rotating roster (four on, four off; earlies and lates). This is a
   data-model change to the profile and the scheduler, not copy.
2. **A grade filter in the library.** People who liked the grades wanted
   to see only A and B. Small.
3. **Progress for goals that are not training.** Money and habits
   reviewers asked to see a running number (episodes cut, weeks on
   track) rather than the day's items. The metrics exist; the screen
   does not.
4. **A single-coach price.** Money-only and habits-only reviewers asked
   to pay for one program. A pricing decision before it is code.
5. **A named mental-health track.** The constraint is now heard and the
   breathing and urge tools are free, but reviewers with anxiety or ADHD
   wanted to see it named on the Coaches tab. Content, and a clinical
   line to hold.
6. **Larger default text.** 8% in round one, 12% in round two, mostly
   over fifty. The app honours Dynamic Type; the default is the
   question.
7. **A third review round** on the current build, to measure batch three
   the way round two measured batches one and two.

## What did not change, on purpose

- The free tier and the price. Reviewers asked for a free week of Plus
  and for a single-coach price; both are Isaac's decisions, not the
  overhaul's.
- The twelve questions. Reviewers who found the interview long were
  fewer once the example day existed and the reveals were shorter; the
  questions themselves each gate something the plan uses.
- The word "coach". Five percent found it odd for money or family. The
  screens now say "a coach here is a program, not a person" once, and
  the word stays because it is the one that tested best on the website.
- Nothing is published until Apple approves 1.0.
