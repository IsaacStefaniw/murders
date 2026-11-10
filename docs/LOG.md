# The log

Isaac's actual entries. **This is the first real data in the project** —
everything before it came from eleven simulated people, and the app's
own simulator has no model of anybody quitting anything.

The app cannot hold these yet: `BehaviourEvent` is the right shape and
it lives in a store on a phone, and there is no import path. So they
live here until there is one, in the fields the store will want.

Four questions per entry, and no more: **when, what was going on just
before, where, and did you have a plan.** They are the four fields
`features/behaviours/patterns.ts` needs, and a fifth question is a form
somebody abandons on a Tuesday.

`MIN_EVENTS_FOR_PATTERN` is **4**. Below that every read in
`patterns.ts` returns null, and nothing here will draw a line through
fewer.

---

## Entry 6 — Tuesday 10 November 2026, **15:21 AEST**. An urge, no slip.

Reported live: *"I am already craving a drink / vape need defence
mechanisms."*

| field | value |
| --- | --- |
| `occurredAt` | **Tuesday 15:21** |
| `trigger` | mid-afternoon, **an hour and nine minutes before work ends**; two days after a four-night run; ~2h after a 14-set lunch session |
| `context` | **at work.** Not home — and not even finished for the day |
| `detail` | **urge only. Nothing consumed.** Asked for defences rather than reporting a slip |
| `size` | — |

**Corrected within the hour.** I first wrote this as "~16:20, end of the
workday" from nothing but my own assumption that a craving in this plan
must be near the door. He gave the time: *"I'm AEST it's 3:21."* An hour
out, and in the direction that matters — I had it later than it was,
which is the same error this file has now recorded four times.

The practical cost of my guess was immediate and worse than the record:
I told him *"your sauna is in ten minutes, go now."* It was sixty-nine
minutes away and he was at a desk, so the one thing I handed him was the
one thing he could not do.

### The fourth correction, in the direction this file predicted

`docs/IF_THENS.md`, written before this entry existed:

> *"I have had this window wrong three times, always in the same
> direction. 20:30, then 18:00, now ~16:40. Each correction came from
> you rather than from anything the app or I measured, and each moved it
> earlier. **If there is a fourth correction it will probably move
> earlier again**, so the thing to watch is whether 16:40 is really the
> first one or just the first one that gets noticed."*

| | window | came from |
| --- | --- | --- |
| first | 20:30–22:00, the quiet house | reasoning |
| second | ~18:00, with dinner | him |
| third | ~16:40, at the door | him |
| **fourth** | **15:21, at work** | **him** |

**That is the only prediction in this project written as a falsifiable
claim about my own errors, and it held.** It is a thin kind of success —
being reliably wrong in a known direction is not insight — but it
answers the open question it posed. **16:40 was the first one noticed,
not the first one.** The urge precedes the act by over an hour, and
every number in this plan was fitted to the act.

### And it contradicts the cue, not just the timing

Every correction so far moved the *hour* earlier: 20:30, then 18:00,
then ~16:40. The model that came out of it was `SAME_CUE_TWO_ARRIVALS`
— *"Both of these start when you walk in the door... The cue is arriving
home with nothing left, not the hour."*

**He is not home, and he has not even finished work.** Tuesday is one of
the two days his partner collects the boys (`pickupDays: [1, 3, 4]` is
Monday, Wednesday, Thursday), so there is no doorway in this entry at
all — and at 15:21 there is no end-of-day either. The craving arrived
mid-afternoon, at a desk, **without the threshold and before the
transition.**

So the doorway was never the cue. It was the reliable *co-occurrence* of
the cue — because on three days out of five the state and the doorway
arrive within ten minutes of each other, and nothing in four entries
could tell them apart. Today is the day they came separately, and the
state came first.

**What that changes, and it is two things.**

1. If-then two is cued on *"When I pull up after pickup"*, so on a
   Tuesday or a Friday **it does not fire at all** — and Tuesday is the
   day this urge landed.
2. **The 16:25 desk decision is also too late**, and that was already
   the corrected version. `IF_THENS.md` moved "decide tonight" from
   17:30 to *"16:25, at your desk before you leave"* and called the car
   *"a manoeuvre, not a decompression."* Right about the place, an hour
   out on the time.

So every intervention in this plan sits downstream of where the process
starts. `trigger-if-then` (**grade A**) is explicit that the cue has to
be a real moment you would recognise from outside: **mid-afternoon at
the desk, with over an hour of work left**, is that moment, and nothing
in the plan is pointed at it.

### The defence that was already on the calendar — but 69 minutes away

The sauna planned for **16:30**, an hour and nine minutes after this.
It is the right intervention and it is **not** an answer to the next
hour, which is the part I got wrong. `NO_TRANSITION`
had already named the hole; `sauna-recovery-low-heat`'s own `days: [2, 5]`
had already put a session in it on exactly Tuesday and Friday — the two
days the doorway if-then cannot fire. That alignment was luck, and it is
the right intervention anyway.

Both halves of the stand-in logic hold: it is **performed**, and it is a
competing action that **cannot co-occur** with either behaviour, which
is what `urge-stand-in` (C, habit reversal) actually asks for.

### One entry, and what it cannot say

An urge is not a slip and this one is a single observation. It does not
show the doorway is irrelevant — four entries landed near it. It shows
the doorway is **not necessary**, which is a smaller and more useful
claim.

---

## Entries 2–5 — Thursday 5 to Sunday 8 November 2026

Reported 10 Nov: *"I also drank and vaped Thursday, Friday, Saturday
and Sunday."*

| night | alcohol | vaping |
| --- | --- | --- |
| Thu 5 Nov | **yes** | yes |
| Fri 6 Nov | **yes** | yes |
| Sat 7 Nov | **yes** | yes |
| Sun 8 Nov | **yes** | yes |
| Mon 9 Nov | **zero** | yes, two small |

**Four consecutive drinking nights, five consecutive vaping nights.**

| field | value |
| --- | --- |
| `occurredAt` | **~18:00**, with or before dinner — his words |
| `trigger` | not recorded for these four |
| `context` | not recorded for these four |
| `size` | not recorded; recorded only for the Monday |

Asked whether the run was typical: **"worse than usual — a bad week."**
So near-daily is not the baseline, and nothing here should be read as
if it were.

---

## Entry 1 — Monday 9 November 2026, after futsal

Reported the same night: *"I vaped last night 2 small sessions in the
bathroom, which is much better than usual and I had 0 Alcohol."*

**Corrected.** The first version of this entry read "Saturday 8
November", which was wrong twice: 8 November 2026 is a **Sunday**, and
the night was **Monday the 9th, after futsal**. The weekday is the one
field `weekdayShape` reads, so a wrong one corrupts the exact function
that answers "which days carry this" — and it would have pointed at
the wrong day for as long as it stood. Asked rather than inferred, and
the answer changed the diagnosis below.

### vaping — slip

| field | value |
| --- | --- |
| `occurredAt` | **Monday ~19:15–20:30**, home from futsal into the back half of bedtime |
| `trigger` | **the kids — a hard bedtime**, stacked on top of a game |
| `context` | **bathroom, hiding it** |
| `detail` | two small sessions. An intention not to, but no if-then |
| `size` | **`small`** — his words: *"much better than usual"* |

### alcohol — clear

| field | value |
| --- | --- |
| `occurredAt` | — |
| `detail` | **zero** |

A clear night is an entry, not an absence. He reported it unprompted
and alongside a slip, which is the behaviour of somebody keeping score
of the right thing — and if the log only recorded slips, the record of
a good fortnight would be a blank screen.

---

## What entry 1 changed

### The plan named this hour before anything was logged

`docs/ISAAC_WEEK.md`, written on 9 Nov before any entry existed:

> **Monday 7:15pm is the highest-risk hour of your week for both the
> drink and the vape, and it recurs 52 times a year.**

Entry 1 is a Monday, after futsal, in the bathroom. **It happened on
the first Monday after that sentence was written.** The reasoning that
produced it was: post-game, hungry, tired, possibly with the team, on
one of his own midweek-at-home drinking nights.

That is one of the few predictions in this project that was made in
advance, written down, and then tested. It held — and the hour it
named is now the target of if-then number one in `docs/IF_THENS.md`.

### The chain was right in shape and wrong in timing

`profile.ts` modelled **one** chain:

> three hard hours → stress → vape. Boys asleep → quiet house → the
> drink.

The vape landed **during** the stretch, not after it. So it is two
chains sharing one cause:

| | window | behaviour |
| --- | --- | --- |
| hard stretch | **17:30–20:30** | **the vape** |
| quiet house | **20:30–22:00** | the drink |

**And this table is wrong too.** Entries 2–5 put the drink at
**~18:00, with or before dinner** — inside the hard stretch, not after
it. So there are not two windows. There is **one**:

| | window | behaviour |
| --- | --- | --- |
| **the hard stretch** | **17:30–20:30** | **both** |
| the quiet house | 20:30–22:00 | **nothing yet logged** |

The quiet window was the plan's central preoccupation and **not one
logged event has happened in it.** Three separate parts of the plan
are aimed at an empty room:

1. **The 19:30 kitchen close is after the drink starts.** A drink at
   18:00 is poured an hour and a half before the kitchen shuts.
2. **If-then two was cued on coming downstairs at 20:30** — by which
   time, on these four nights, it had already happened.
3. **`detachment-window` at 20:30** is still a good thing to do with a
   blank ninety minutes. It is not the intervention.

The one thing that survives is **17:30 "decide tonight"**, which sits
fifteen to thirty minutes before the drink. It was placed on a
reasoned guess about the hard stretch, and it is the only piece aimed
at the window the data actually names.

**This moves an intervention.** The plan put "decide tonight" at 17:30
and treated 20:30 as the danger. A decision at 17:30 cannot cover a
thing that happens at 19:20 in a bathroom — by then he is three
refusals into a bedtime. The vape needs something *inside* the stretch,
not a decision before it.

One entry is one entry, and four is the bar. But a model that survives
first contact in shape and fails in timing is worth saying out loud
rather than leaving quietly wrong.

**And the Monday detail sharpens it further.** This was not an ordinary
bedtime — it was a bedtime with a football match in front of it. So
the state was hungry, physically tired, and walking into three hard
hours compressed into one. The 17:30 "decide tonight" slot sits before
he leaves for the game; the risk is at 19:15 when he walks back in.
A decision made two hours and one match earlier is not the same
decision.

### The coupling — corrected, because entry 1 had no baseline

**What this section said first, and why it was wrong.** It read "the
coupling held, and that is the good news": no drink, vaping down, his
own model of himself vindicated, one point of support for the
sequencing call. Written when Monday was the only entry in the file.

Entries 2–5 arrived a day later and Monday is **the first dry night
after four consecutive drinking nights.** That is not a plan working.
**It is day one**, and the honest reading is nearly the opposite of the
one above:

- *"Much better than usual"* now has a baseline, and the baseline is
  four nights in a row. The comparison was always against something; I
  just could not see what.
- **The vape happened anyway.** On the one night with no alcohol, the
  vape still occurred. The coupling says the vape rides on the drink;
  entry 1 shows the drink is not necessary for it.
- So the sequencing call — **drink first, because the vape is
  downstream** — is *weakened* by entry 1 rather than supported by it.
  It may still be right; it is right for different reasons than I gave,
  and entry 1 is not evidence for it.

**This is the error this project keeps making in a new costume:** a
number read without its denominator. The cohort zero that was a wiring
bug, the 0.70 that was a twelve-rep weight, and now a "much better than
usual" with no baseline behind it. Each time the figure was real and
the reading was wrong.

### Hiding it is the most consequential answer in the entry

Not a character question — a structural one, and it costs both levers
this app has:

- **No cue to change.** A locked room has no environment to adjust.
- **Nobody to help.** His own profile records, twice, that *"plans with
  other people in them survive a bad week; plans with only themselves
  in them do not."* Futsal is the proof of that. A behaviour nobody
  else knows about is, structurally, a plan with only himself in it.

The honest recommendation, said once and then not repeated: **tell his
partner.** Not as a confession and not as a promise — as the thing that
makes it a plan with another person in it, which is the one category of
plan his own data says survives.

The drink is different and that difference is useful: it happens at the
dinner table, in front of everybody, so it is **already** a plan with
another person in it. One of the two is hidden and one is not, and they
should not be treated the same way.

### The plan answer was "sort of — I intended not to"

Which is the single most common answer, and the exact gap
`trigger-if-then` (**grade A**) exists to close. An intention and an
if-then are not the same thing and the difference between them is most
of the effect.

**Now written** — `docs/IF_THENS.md`, three of them, with the Monday
one cued on walking through the door and the second one moved to the
kitchen at 18:00 once entries 2–5 showed where the drink actually is.
Each has a back-up branch, because the protocol says a plan that breaks
needs somewhere to go.

---

## What this log cannot tell anybody yet

- **Five entries from one run are not five observations.**
  `MIN_EVENTS_FOR_PATTERN` is met on paper, and that is not the same as
  a pattern being known. Thursday to Monday is a single consecutive
  stretch.
- **It was a bad week, by his own account.** So nothing here describes
  a normal one. What a normal week looks like is still unknown, and a
  fortnight of entries is the only thing that will say.
- **`weekdayShape` has nothing to report.** Five consecutive days,
  nearly evenly, is not a concentration — no Thursday pattern, no
  weekend pattern, and the Monday prediction holding once does not make
  Mondays one either.
- **Four of the five nights have no trigger, context or size.** Only
  the Monday was questioned at the time. The gaps are left as gaps.
- **No baseline before 5 November.** *"Much better than usual"* is
  comparable forwards from here and not backwards.
- **Self-report, same as every entry will be.** `urge-log`'s own card
  says people under-record, most reliably on the occasions they least
  want to write down — so **a log is a floor, not a measurement.** That
  these four nights were reported unprompted is the reason to trust it
  as a floor at all.
- **Nothing here is in the app.** These fields are the store's fields,
  and the import path does not exist yet.
