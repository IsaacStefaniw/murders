# Stickiness: what the data says to do, and what it says not to

> **SUPERSEDED IN PART, 22 Oct 2026.** After reading this brief Isaac said:
> *"The problem is that people stop using the app I've stopped using it."*
> Asked which was closest, he chose **"I opened it and it was wrong — the
> plan didn't match my actual day"**, and on notifications **"On, and I
> ignored or killed them."**
>
> That is the churn datum §0 below says the simulator cannot produce, and
> it points somewhere this brief does not. **Read `docs/WHY_HE_STOPPED.md`
> first.** §0's recommendation — week one and visibility over a redesign —
> still holds, but it is no longer the first thing to do.


Isaac, 22 Oct 2026: *"The app is not stick enough we need to do a complete
redesign — let's brief ways based on successful apps to created stickiness.
Thinking reward based levels showing progress? Was also thinking of parting
it with a physical product such as a diary planner."*

Three questions in that, and they do not all get the same answer. This
brief takes them in the order the evidence decides, not the order they were
asked.

---

## 0. The headline, and it argues against a complete redesign

**I measured the cohort before writing anything.** `npm run usertest:decay`
runs all eleven personas for twenty-six weeks through the real engine with
the coaches on, and reports adherence week by week. The curve is not the
one a stickiness problem usually has:

```
week 1    42%   ← the worst week of the six months
week 2    52%
week 3    54%
week 4    55%
...
week 26   56%

first four weeks 51%  ·  last four weeks 55%  ·  +4 points
```

Adherence does not decay. It **climbs thirteen points in three weeks and
then holds for six months.** Eight of eleven personas end higher than they
started.

### Why that number means what it says

The simulated person does not get better at adherence. `truth.adherence` is
a fixed draw per persona; `habitBoost` keys off habits they already had, not
elapsed weeks; `affinityFor` depends on area and time of day. Nothing in the
completion probability varies with time.

So the thirteen points cannot be the person improving. They can only be the
app changing what it asks and when — the adaptation engine moving things
into slots that work and shedding what does not. The plan itself shrinks
19% over the six months, from about 27 items a week to about 22.

**Week one is the week before the app has any evidence to learn from. It is
the worst week it will ever give anybody, and in life it is the week people
decide whether to keep the app.**

### So the recommendation is narrower than a redesign

A redesign assumes the loop is wrong. The loop works — it recovers a bad
first week and holds a result for half a year. What it never does is
*show* anybody that, and what it never does is make week one good.

I would spend the quarter on **week one** and on **making earned progress
visible**, not on a rebuild. That is a smaller, cheaper, testable bet and
the decay curve is the argument for it. You can overrule this and I will
brief the redesign properly — but I would be doing it against the only
hard evidence either of us has.

### The caveat, stated loudly because it matters

**The simulator has no churn model. Nobody in it ever leaves.** It measures
adherence among people who keep using the app, which is the mechanism
underneath retention and not retention itself. The real curve is worse than
this one, because in life the people whose adherence collapses stop opening
the app and stop appearing in the average.

What the sim can locate is the weak week. What it cannot tell us is how
many people never reach week two. That number does not exist yet and ten
people in TestFlight would produce it.

---

## 1. The second finding, which is sharper and less comfortable

Per persona, first four weeks against last four:

| persona | change | |
| --- | --- | --- |
| endurance_athlete | 74% → 82% | +8 |
| entrepreneur | 66% → 75% | +9 |
| busy_parent_exec | 59% → 66% | +8 |
| shift_nurse | 24% → 35% | +10 |
| health_rebuilder | 19% → 27% | +8 |
| recovery_first | 27% → 34% | +7 |
| retired_active | 61% → 63% | +2 |
| new_parent | 45% → 44% | −1 |
| **career_optimiser** | **61% → 58%** | **−3** |
| young_professional | 51% → 44% | −7 |
| student | 43% → 32% | −11 |

Three personas decline. They are the young, time-poor, career-focused ones
with no caring responsibility anchoring their week — **and one of them is
`career_optimiser`, which is Alex, the one person `docs/PERSONA.md` says
this product is for.**

The ones that improve all have external structure: a shift roster, a child,
a training block, a retirement. The ones that decline are the ones whose
week is theirs to shape, which is exactly the freedom that makes it
collapse.

**The app's adherence improves for everybody except the segment it is being
built for.** That is where the stickiness problem actually lives, and it is
a much more specific target than "the app is not sticky".

---

## 2. We already built reward-based levels. They are two taps deep.

This is the part worth knowing before designing anything new.

`src/features/paths/level.ts` has a four-rung ladder per coach —
`foundation → developing → established → advanced` — across seven coaches.
`levelProgress` already computes how many sessions and how many weeks are
left to the next rung. On top of that, `features/paths/ladder.ts` and
`nextRung.ts` hold the researched practice ladders, each a sequence of rungs
with a coach line for reaching one.

The rules were argued through when it was built, and two of them are exactly
what a reward system needs:

- **The top rung is earned, never claimed.** `advanced` is not on the intake
  form. It needs logged work over real time.
- **Stepping back is always available and never automatic.** "We never
  demote someone silently for not logging — a thin log is far more often a
  busy fortnight than a lie."

All of it renders inside `/path/[id]` and nowhere else, which as of the last
session is two taps behind the Coaches tab. Nothing on Today, nothing on
Progress, nothing on the Week tab says which rung you are on or what the
next one needs.

**Your instinct is right and the build is largely done.** The gap is
surfacing, not inventing.

---

## 3. "Reward based levels" against the house rules — resolved

The house rules are explicit: no scores, no percentages, no streaks, a
missed Tuesday is never a reset to zero. `PERSONA.md` §3.3 resolves
accountability as *being known, not being graded*. And last week the 0–100
numerals came off the wellbeing card for precisely this reason.

So "reward based levels showing progress" sounds like the thing the product
was built to refuse. It is not, and the distinction is sharp enough to be a
rule:

> **A level you earn and keep is not a streak you can lose.**

- A **streak** is a state destroyed by one miss. It punishes the bad week,
  which is the week a person most needs the app. It is the mechanic that
  gets apps deleted in week three.
- A **level** is evidence that accumulated. A bad fortnight costs you time
  to the next rung. It never takes the rung away.

Levels pass. Streaks fail. The existing `level.ts` already sits on the right
side of that line — it says so in its own header.

The same test applied to progress display: **a bar that empties is a
scoreboard; a ladder you have climbed is a record.** Show the rungs behind
as well as the one ahead.

---

## 4. What the outside evidence actually supports

Worth saying plainly, because this project holds every health claim to a
citation with a sample, a design and a caveat: **most of the retention
literature is vendor marketing and does not survive that standard.**

I searched for it. Day-30 retention for health and fitness apps is quoted
anywhere from ~3% to ~8%, the figures trace to roundups rather than to
primary data, and the widely repeated streak statistics ("3.6× more
likely", "21% churn reduction") conflict with each other and with their
supposed sources. Treat all of it as directional.

The exceptions are Duolingo's own published experiments, which report
numbers against named tests:

| test | reported result |
| --- | --- |
| Streak Wager — bet in-game currency on keeping a 7-day streak | significant lifts at D1/D7/D14; **D7 best at +14%** |
| Weekend Amulet — keep the streak through an unused weekend | **+4%** likelihood of returning a week later, −5% streak loss |
| Decoupling streak maintenance from the daily goal | **>40%** more learners on a 7-day-or-longer streak |
| A one-exercise rule that kept the streak alive | **failed** — no DAU movement, and it drew the *least* active users |

That last row is the most useful one for us, and it is a failure rather than
a win: **lowering the standard until it is easy to meet bought nothing and
attracted the wrong people.** Duolingo's own conclusion was that the
standard needed to be clearer, not lower. Read that next to the completion
floor of 0.25 in our own sim, which has never been allowed to drop to make
a build pass.

The second useful row is the Amulet: permission to miss a period *without
losing standing* improved return rate. That is our design already, arrived
at from a different direction.

---

## 5. Mechanics, each judged against the rules rather than listed

| mechanic | where it works | verdict here |
| --- | --- | --- |
| Earned tiers / levels | Duolingo, Strava, martial arts | **Build — already built, invisible** |
| The next rung, named, with what it needs | Duolingo's path, climbing grades | **Build — `levelProgress` computes it already** |
| Rungs already climbed, kept permanently | belts, badges | **Build — this is the honest "progress" display** |
| Permission to miss without losing standing | Duolingo Amulet | **Already our design — say it out loud** |
| Streaks with reset to zero | Duolingo, Snapchat | **Refuse — house rule, and it punishes the bad week** |
| Percentage / 0–100 scores | most health apps | **Refused last week, deliberately** |
| Leaderboards, ranking against others | Strava segments | **Refuse — never score a person against another** |
| Milestones on a real goal | Full Focus, Strava goals | **Have it — `goal.milestones`, under-surfaced** |
| Other people in the plan | Strava clubs, Peloton | **Underbuilt and high value — see §6** |
| One question a day | Duolingo, journalling apps | **Built — `dailyAsk.ts`** |
| A weekly ritual with a verdict | Whoop weekly, Spotify Wrapped | **Built — `/review/week`, and now honest about its window** |
| Variable-reward notifications | most of consumer mobile | **Constrained — `neverNag` exists on purpose** |
| A physical artefact | Full Focus, Hobonichi, Oura | **Genuinely new lever — §7** |

The pattern in the right-hand column is the finding: **almost everything on
the list is already in the codebase and not on a screen.** That is the same
disease as the whole of last session — the app knows and does not say.

---

## 6. The thing that is actually missing: other people

One row above is neither built nor refused, and it is the one the decline
data points at.

The three declining personas are the three with no external structure. The
mechanic that supplies structure from outside, without scoring anybody, is
**other people** — and `PERSONA.md` §1 already says it in the persona's own
terms: *"Plans with other people in them survive a bad week. Plans with
only themselves in them do not."*

What exists: one `friend-reach-out` practice, the follow-through added last
session that turns a sent message into a Saturday, and the connection
marker. What does not exist: anything where another person knows what you
said you would do.

This is the highest-value unbuilt mechanic on the list, it does not violate
a single house rule, and it is pointed straight at the segment that
declines. It is also the hardest, because the product is on-device only with
no account — so a shared commitment has to work through the OS share sheet
and somebody else's memory rather than through a server. That constraint is
a design problem, not a blocker, and `features/coaches/reach.ts` already
composes sentences to send to somebody.

---

## 7. The diary planner, assessed honestly

### Why it is strategically interesting

A surface in the house, touched daily, that is not a phone. For a persona
who is time-poor and screen-tired, that is genuinely differentiating, and it
is the one thing a competitor cannot copy with an over-the-air update. It
also puts the brand in the room on the days the app is not opened, which is
the only retention mechanism on this list that works while the app is shut.

### What the comparable models actually are

- **Full Focus Planner** (Michael Hyatt): paper-first, *no official app*. A
  90-day planner, so replaced quarterly, sold with an annual subscription
  shipping once a year. The brand claims 100,000+ customers — their own
  marketing figure, not independent data. The relevant lesson is the
  **cadence**: a 90-day consumable creates repeat purchase without a
  subscription argument.
- **Oura / Whoop / Peloton**: hardware whose value depends on a paid
  subscription. The thing that makes this work is customer expectation that
  payment continues — not whether the object functions unpaid.
- **Hobonichi**: I could not get sourced figures and will not invent them.

### Three shapes it could take

**(a) Companion notebook.** The app plans, the planner is where you write.
Cheapest to produce, generic stock, no personalisation. Also the least
defensible — it is a nice notebook with a logo, and the app does no work
that the notebook needs.

**(b) The printed quarter.** The app generates *your* next ninety days —
your routines, your slots, your coach's rungs — and it is printed and
posted. This is the only shape where the planning engine is the product,
which is the whole reason it would be ours rather than anybody's. It is also
the one with real operational teeth: per-unit print cost, a fulfilment
partner, a ninety-day deadline that cannot slip, and the obvious failure
mode that **the plan changes in week two and the paper does not.** That last
one is not fatal — the app already treats the plan as something that adapts,
so the paper would have to be the *intent* and the app the *adaptation* —
but it needs designing rather than hand-waving.

**(c) Brand artefact.** An undated diary with the method printed in the
front. Marketing object, not a product.

### What I would do

**(b), prototyped once, for one person, before any inventory exists.**
Generate Alex's ninety days as a PDF from the real planner, print one, and
look at it. That is a day's work and it answers the question no amount of
briefing will: *is a printed version of this plan actually good?* If the
PDF is thin, the planner is thin, and we find that out for the price of a
day instead of a print run.

It is also a monetisation change, not just a retention one — physical goods,
different margins, different tax and shipping. That belongs beside
`docs/MONETISATION.md` and it is a separate decision from whether to build
it.

---

## 8. What I would do, in order

1. **Surface the ladder.** Rung, next rung, and what it needs — on Today
   and Progress, not two taps inside Coaches. New mechanics: none. This is
   shipping something already built and tested.
2. **Fix week one.** It is the worst week the app ever gives anybody and the
   only week that decides anything. Start the plan nearer the size it
   converges to (it sheds 19% anyway), and build it around work hours
   rather than detecting the clash afterwards. Measurable in the sim the
   same day.
3. **Show the six months.** "You have kept about half of a full week, every
   week, for twenty-six weeks" is a remarkable sentence and the app has
   never said anything like it. Needs care: 55% must read as the sustained
   result it is, not as a half-empty bar. This is where the no-scoreboard
   rule earns its keep.
4. **Then the planner prototype**, one PDF, before anything is ordered.
5. **Other people**, as the quarter's real bet, aimed at the declining
   segment.

---

## 9. What I need from you

1. **Does "reward based levels" mean the earned ladder, or something that
   can be lost?** I would argue hard for the former and §3 is the argument.
   If you want something losable, say so and I will design the least
   punishing version — but it breaks a stated rule and that should be a
   decision, not a drift.
2. **Is a complete redesign still what you want**, given that the loop
   recovers week one and holds for six months? I would spend the money on
   week one and on visibility instead.
3. **Which planner shape** — and are you willing to see one PDF before
   committing to inventory?
4. Still open from 7 Oct, and both need your word rather than mine: the
   **OTA standing instruction** in `NEXT_SESSION.md` §4, and the
   **seventy-two commits that are not on trunk.**

---

## Sources

The Duolingo figures are from their own blog and are the only ones here I
would put weight on. Everything else is vendor-published and is marked as
such above.

- [Duolingo: how streaks keep learners committed](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
- [Duolingo's growth feature: streaks, iterated](https://elsewhere.news/en/linearcapital/duolingobolt)
- [RevenueCat: combining subscriptions and physical products](https://www.revenuecat.com/blog/growth/combining-subscriptions-physical-products)
- [Full Focus: why I decided to publish a paper planner](https://fullfocusplanner.com/why-paper-planner/)
- [Is there a Full Focus app?](https://www.onfocus.news/is-there-a-full-focus-app-options-for-digital-users/)
- [Fitness app retention statistics](https://fitnessrefined.co/fitness-app-retention-statistics/)
- [Wellness app retention design playbook](https://keytotech.com/blog/wellness-app-retention-design-playbook)
- [Streak vs tally feedback, 30-day trial (registered, no results posted)](https://clinicaltrials.gov/study/NCT07220044)

The in-house figures are reproducible: `npm run usertest:decay`.
