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

### The coupling held, and that is the good news

He said vaping happens *"only when drinking or stressed."* There was no
drink, and the vaping was **down** — *"much better than usual."* His
own model of himself predicted that, and the sequencing decision rests
on it: **quit the drink first, because the vape is downstream.** Entry
one is one point of support for the most important call in the plan.

It also supports the other half: with the drink absent, the vape did
not disappear. Stress alone was enough. So the vape needs its own
answer eventually, not just a dry fortnight.

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

### The plan answer was "sort of — I intended not to"

Which is the single most common answer, and the exact gap
`trigger-if-then` (**grade A**) exists to close. An intention and an
if-then are not the same thing and the difference between them is most
of the effect.

**Now written** — `docs/IF_THENS.md`, three of them, with the Monday
one cued on walking through the door rather than on a decision made
two hours and one football match earlier. Each has a back-up branch,
because the protocol says a plan that breaks needs somewhere to go.

---

## What this log cannot tell anybody yet

- **One entry.** Every function in `patterns.ts` returns null below
  four, and so does everything here. The window above is an
  *assumption* that one entry has contradicted, not a measured one.
- **One entry on a Monday says nothing about Mondays.** `weekdayShape`
  needs four occurrences before it reports a day at all, and reports
  one only when a small set of days holds most of them. That Monday
  was predicted does not make it a pattern — it makes it one
  confirmed instance of a reasoned guess.
- **No baseline.** *"Much better than usual"* has no number behind it,
  because nothing was counted before last night. From here it is
  comparable; backwards it is not.
- **Self-report, same as every entry will be.** `urge-log`'s own card
  says people under-record, most reliably on the occasions they least
  want to write down — so **a log is a floor, not a measurement.**
- **Nothing here is in the app.** These fields are the store's fields,
  and the import path does not exist yet.
