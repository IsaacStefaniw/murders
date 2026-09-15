# Redesign: breakouts, coaches with a voice, and reviews that are the day

From Isaac's sketch and five points. This supersedes the navigation
sections of `BEFORE_LAUNCH.md`; the defect list there still stands.

---

## 0. The call on onboarding, and why it is right

> *"Ignore all the other BS about shortening it — let's ask significant
> questions up front which increases their commitment and then the value
> the app provides."*

Two reviewers argued for a shorter interview. They were wrong, and not
narrowly:

**The app's own numbers say so.** Of 36 interview steps, 13 are asked at
signup and **23 are deferred** into a coach the person may never open. The
consequences, all measured this week:

- Rank Family #1 → a week with nothing family-shaped, because `household`
  was deferred. The app literally answers *"when two things want the same
  hour, family wins"* and then builds nothing.
- The markers headline **cannot render at all** without `age`, an optional
  question deferred into the Training coach.
- **Six of ten** marker components are gated behind opening one of two
  specific coaches.
- **7 of the 23** deferred questions are unreachable even from the screen
  built to reach them.

Deferring was never kindness. It was the app declining to ask, and then
being unable to do its job.

**And the psychology supports the long version.** The reveal line after
every answer — *"5 work days. Nothing gets scheduled over them."* — is
effort-justification working as designed: the plan is valued because the
person watched themselves build it. That mechanism gets *stronger* with
more questions, not weaker, **provided every answer visibly buys
something.** A 30-question interview where each answer changes the plan on
screen beats a 12-question one where half the answers vanish.

The rule is therefore not "ask less". It is: **no question without a
payout, and no answer that goes nowhere.**

---

## 1. The shape: breakouts, not a tab bar

Today the app is four permanent tabs and everything competes inside them.
The sketch replaces that with **breakouts** — full-screen flows that own
the moment they belong to, entered and left deliberately.

```
  BREAKOUT A — SETUP          once, ~10 minutes, comprehensive
     Questions → Coaches intro → Priorities → First week → Adjust

  BREAKOUT B — THE DAY        the default surface
     Today  ·  interruptions from coaches

  BREAKOUT C — REVIEWS        end of day (20s) · end of week (2 min)

  BREAKOUT D — COACHES        seven rooms, entered on purpose
```

A breakout is a modal flow with its own header and exit, not a tab. You
are *in* the week review; you are not glancing at it beside four other
things.

---

## 2. BREAKOUT A — Setup

Eight sections, in the sketch's order. Each section opens with one line
saying what it unlocks, and closes with what it just changed.

| § | Section | What it asks | What it unlocks |
|---|---|---|---|
| 1 | **Bad habits** | what you want less of, how often, when it wins | the recovery coach, urge tools, the weekly count |
| 2 | **Positive habits** | what you already do — training, walking, fasting, sauna | these arrive as *already yours*, never prescribed back |
| 3 | **Goals** | the ambition, plus **one number and a date** | the trajectory engine: "at this rate you arrive in March" |
| 4 | **Lifestyle** | week shape, work days and hours, sleep window, capacity, constraints | every placement decision the scheduler makes |
| 5 | **Health** | **birth year**, sex at birth, height, weight, **body fat**, resting HR, **blood pressure**, **a blood panel if you have one** | the markers headline and 8 of 8 Essential 8 components |
| 6 | **Training** | experience, setup, days, **grip / gait / balance if you want to do them now** | the level you actually start at, not the bottom |
| 7 | **Money** | pay cycle, mortgage/offset, super, HELP, automation | the dated money year |
| 8 | **Work** | style, meeting load, travel, decision load | the named bet and the decision journal |

**Rules for the whole flow**

- **Every answer pays out on the screen it was given on.** Currently the
  reveal appears small, at the top of the *next* question. It should be
  full-size, on the same screen, before advancing.
- **A progress spine**, eight dots. People will give you ten minutes if
  they can see the end.
- **Everything is skippable, and skipping is priced**: *"Skip — your
  markers will read 6 of 10 instead of 9."*
- **Nothing is deferred.** `deferTo` stops meaning "ask later, maybe" and
  starts meaning "this section, if the answers before it make it
  relevant."

### A.2 The coaching intro

New, and the thing the sketch is most insistent about. After the
questions, before the plan: **meet the coaches.** One screen each, only
for the coaches your answers actually switched on.

Each says, in its own voice: who I am, what I will do for you, what I will
ask of you, and the one thing I will never do. Then: **"Bring me in"** or
**"Not now."**

That last choice is the whole point — a coach you *chose* is one you
listen to.

### A.3 Priorities summary

The sketch has this as its own screen: what you said matters, in order,
and what each one will cost you in hours a week. This is the last honest
moment before a plan exists, and the place to say *"family first means
three evenings — is that right?"*

### A.4 First week, then adjust

The plan, then immediately the ability to move it. The sketch shows the
week grid here, before anything is committed. **Nobody should meet their
plan for the first time on a Monday morning.**

---

## 3. The coaches get a voice

Seven coaches exist and have **no personality whatsoever** — `PATHS`
entries with titles like "Training", "Money", "Work & leadership" and not
one line of character. They are configuration screens wearing the word
coach.

Give each a name, a voice, and a standing rule. Not mascots — *specialists
with a manner*, the way a good gym has one person who talks about load and
another who talks about sleep.

Each coach needs four things in code:

```ts
interface CoachVoice {
  name: string;          // the human name
  discipline: string;    // "strength and conditioning"
  opener: string;        // how it introduces itself
  promise: string;       // what it will do
  ask: string;           // what it needs from you
  refusal: string;       // the thing it will never do
  interrupts: CoachInterrupt[];
}
```

The **refusal** is the character. The training coach that says *"I will
never tell you to train through pain"* is instantly more trustworthy than
one that lists features. Every coach already has this material in its
protocols' `safety` lines — it just has no mouth to say it with.

### Interruptions — the sketch's strongest idea

> *"allow them to interrupt the user at points with a different screen to
> ask questions and actually coach them"*

A coach interruption is **a full screen, not a card.** It arrives when the
coach has something to say, says it, asks one thing, and leaves.

Triggers, from data the app already has:

| Coach | Fires when | Asks |
|---|---|---|
| Training | three sessions held in a row | "Ready for more load, or hold here?" |
| Training | a session missed twice at the same hour | "Tuesday 6:15 isn't working. Thursday?" |
| Recovery | sleep under 6h for three nights | "Today's session or tomorrow's?" |
| Family | 17:15 and work is still running | "Dinner in 45. Making it, or shall I say 20 late?" |
| Nutrition | the fibre protocol added a week ago | "How's it going? Want the worked day?" |
| Money | the offset check is due | "Two minutes. Is your offset actually linked?" |
| Work | the block died three Tuesdays running | "Meetings ate it. Move it, or defend it?" |

**The governing rule already exists** and must apply here: `mayOffer` /
`commitmentBudget` allows at most one new thing at a time. **One
interruption, ever, at once.** A coach that interrupts twice in a day is a
notification, not a coach.

---

### How far a coach can reach

Isaac: *"they should be able to email users as well as prompt in app."*
Three channels, in order of what exists today.

**1. In-app — built.** The interrupt frame above. Free, instant, and the
only one where the coach can actually ask something and get an answer.

**2. Local notification — already built and already wired.**
`useNotificationSync` is mounted in `_layout.tsx` and
`plannedNotifications` computes a queue with quiet hours honoured. The
coaches simply do not use it. This is the fastest out-of-app voice
available and it costs nothing: *"Dinner in 45"* can fire tonight, no
server, no account, no address.

**3. Email — genuinely new, and a real decision.** It cannot be done
without breaking one of two things:

- An address plus a server to send from. That ends "no account, nothing
  leaves your phone", which is the product's clearest differentiator and
  the one line the user in testing said stopped them bouncing.
- Or the device composing a message the person sends themselves — which
  is a share sheet, not a coach emailing you.

There is a middle path worth considering: **email is opt-in, address-only,
and severed from plan data.** The server knows an address and a schedule;
it never sees what you do. The weekly coach digest is composed on-device
and either sent through the share sheet or rendered into a notification —
the server's only job is the nudge, not the content.

Recommendation: **ship notifications now** (a week's work, no
architectural cost, and it delivers most of what "reach the user outside
the app" means), and treat email as a deliberate v1.1 decision with the
privacy trade written down rather than discovered.

## 4. Protocol suggestions

Point 4 of the five. The library has ~200 graded protocols and the app
essentially never offers one — you browse them or you do not get them.

A suggestion is a **coach interruption with a specific shape**: here is a
practice, here is what it is for, here is the grade and the caveat, one
tap to put it in the week, one tap to never see it again. Tied to a coach
so it arrives from someone rather than from the software.

---

## 5. BREAKOUT C — The reviews

The sketch is unambiguous here and the current screens are wrong.

Today's evening check-in is a **5-point mood scale and two free-text
boxes**. The sketch shows **the actual items, marked**. That is better on
every axis: faster, it is the data the adaptation engine needs, and it
gives closure rather than homework.

### End of Day — 20 seconds

```
   END OF DAY                        Tuesday

   ┌──────────────────────────────┐
   │  Strength — lower body   ✓ ✗ + │
   │  Family dinner           ✓ ✗ + │
   │  Wind down               ✓ ✗ + │
   └──────────────────────────────┘

   ✓ did it   ✗ didn't   + did something else

   ───────────────────────────────
   RESULT            ▁▃▄▆  ↗
   Four of five this week.

   TOMORROW
   6:15  Strength — upper       [ move ]
```

Three columns, one row per item, whole day done in three taps. The `+`
column is the one people will use most — it is the "I did something else"
capture, and it is currently a separate control buried on Today.

Then one line of result, and tomorrow's first thing with a move button.
**The review ends by setting up the next day**, which is what makes it
worth opening.

### End of Week — 2 minutes

The sketch draws a **time grid**: hours down the left, days across, each
cell marked.

```
   END OF WEEK                    8–14 Sep

         M  T  W  T  F  S  S
   6am   ✓  ✗  ✓  ✓  ✗  ·  ·
   7am   ·  ·  ·  ·  ·  ✓  ·
   10am  ✓  ✓  ✗  ✓  ✓  ·  ·

   ───────────────────────────────
   WHAT CHANGES NEXT WEEK
   • 6am Tuesday died twice.  [ move to 7am ]  [ drop it ]
   • Room for one more?       [ + ]  [ − ]
   • Everything 30 min later  [ shift ]

   tap and move
```

Three things the sketch calls out and the app cannot currently do:

1. **Plan changes** — proposed from what actually happened, not offered
   blind.
2. **+ or −** — the capacity dial, weekly, as a direct control.
3. **Time changes** — drag on the grid. *"tap and move."*

The grid is the honest picture: you see the shape of your week, including
that everything at 6am died. No score, no percentage, no streak.

---

## 6. What this means for the code

**Keep, unchanged:** the scheduler (zero contract violations over ten
six-month runs), the protocol library and its grading, the refusal to
invent composites, `commitmentBudget`, the reveal mechanic.

**Build:**

1. `features/coaches/voices.ts` — the seven `CoachVoice` records.
2. `features/coaches/interrupt.ts` — trigger evaluation, one at a time,
   through `mayOffer`.
3. A `CoachScreen` breakout component — full screen, one question, two
   answers.
4. `app/setup/` — the eight-section flow replacing `app/interview.tsx`.
5. `app/review/day.tsx` and `app/review/week.tsx` — the two grids.
6. The measurement questions that do not exist yet: birth year, body fat,
   blood pressure, a blood panel.

**Delete or absorb:** the evening check-in's mood scale and text boxes
(replaced by the day grid); `QuickLog`'s 56-chip habit wall (replaced by
the `+` column); the "Earlier today" ledger (the day review *is* the
ledger).

**Un-defer:** `deferTo` becomes a section assignment rather than a
postponement. The 23 deferred questions move into their sections in
Breakout A, and `YourAnswers` becomes the place to *change* answers rather
than the place they were supposed to eventually appear.

---

## 7. Order

1. **The two review screens.** ✅ Built. Smallest, most used, and they
   replace screens that are actively worse. They also produce the data
   everything else needs.

   `app/review/day.tsx` is the three-column ✓/✗/+ grid, ending with
   tomorrow's first thing. `app/review/week.tsx` is the time grid, reached
   from the Week tab, with the proposals under it derived from what
   actually happened — a dead slot named by routine, weekday and hour, the
   morning shift offered only when the early hours died and later ones
   lived, and the capacity dial as a direct `+` / `−`. Tap and move is a
   tap, not a drag: seven columns on a 390pt phone leave 45 points each,
   and a drag target that size is a demo rather than a control.

   Two things only the browser found, both about reviewing mid-week: a
   Saturday that has not arrived was counted in the denominator ("7 of 9"
   for one miss), and it was counted as a death in the slot tally ("died
   three times" after two). Both now stop at today.
2. **Coach voices and the interrupt frame.** ✅ Built. The character work
   is cheap and it changes how the whole app reads.

   `features/coaches/voices.ts` is the seven records — Ren, Mara, Nell,
   Ivo, Sol, Juno, Bo — and each refusal names a constraint the code
   already keeps, pinned by tests so a removed mechanism turns a coach
   into a liar loudly rather than quietly.

   `features/coaches/interrupt.ts` is the frame: one at a time, two
   answers, and it always says why. Four triggers, each off data that
   exists — a dead slot (the week review's own evidence, said by a person
   on the day it matters), three sessions held in a row, three short
   nights, and the family block work is about to eat. `mayOffer` gates
   only the interruptions that ADD something; a strained week is exactly
   when moving a dead Tuesday matters most.

   Nutrition ("the fibre protocol you added a week ago") and money ("is
   your offset actually linked?") are not built: both need a field that
   does not exist — `Routine.createdAt`, and a confirmed flag on the money
   step. Four triggers that fire beat six where two never can.
3. **Setup as eight sections** ✅ Built, un-deferring everything, with the
   payout on the same screen.

   `features/onboarding/sections.ts` holds the eight, what each unlocks and
   what skipping each one costs. Setup now runs every question the person's
   answers have not ruled out — 35 rather than 13 — with an eight-dot
   spine, section headers, a priced skip on every section and a per-
   question skip everywhere else. The reveal is full size, on the screen
   the answer was given on, before advancing; only the 18 questions that
   have something to reveal cost the extra tap.

   `deferTo` stops meaning "asked later, maybe" and starts meaning "the
   coach that still wants this if you skipped it". Under the old rule a
   skipped SPINE question could never be offered by anyone again, which
   was the un-deferring's own failure mode.

   Two orderings only a test could have caught: `lessOf` and `moreOf`
   compute their options from `weekShape`, and `moreOf` also reads
   `household` — asked before either, a retiree gets a shift worker's list
   of vices and a parent gets one with no children in it. There is now a
   test that derives dependency rather than trusting a comment: change an
   earlier answer, see whether a later step's options, placeholder, prompt
   or skipIf move, and demand the ordering if they do.

   Still thin: §8 Work has one question. The brief wants meeting load,
   travel and decision load there, and none of them exist as steps yet.
4. **The missing measurements.** Blood pressure, lipids and glucose are
   built; the birth year is next.

   `features/health/bloodwork.ts` carries the three remaining Life's
   Essential 8 tables from the same 2022 paper the other four come from,
   including the medication deductions — the part an app is most tempted
   to drop, because it makes the number worse for people doing the right
   thing about it. Readings are entered in mmol/L and mmHg, the units an
   Australian pathology report prints, and they expire: a blood pressure
   counts for six months and a panel for two years, after which it is
   still shown and no longer counted.

   These three matter more than the four the app can already see. A person
   at 100 on activity, sleep, nicotine and BMI with a blood pressure of
   165/100 does not have excellent cardiovascular health, and "4 of 8
   observed · High" said to them is the worst sentence in the product.
5. **Protocol suggestions** through the interrupt frame.

---

## 8. One thing to decide

The seven coaches keep their scope in this design. Two reviewers wanted
four of them cut, and the reasoning was about focus rather than quality —
but a coach with a name, a voice and one good interruption is a different
proposition from a configuration screen, and three of them (family, work,
money) now have concrete rebuilds specified in `BEFORE_LAUNCH.md` §6.

Recommendation: **keep all seven, ship the voices, and let the
interruption triggers decide which ones earn their place.** A coach with
nothing to interrupt about is one you will be able to cut on evidence
rather than argument.
