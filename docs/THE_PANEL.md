# Seven reviewers, one app

Isaac asked for a panel: research, psychology, design, product, user, sales,
CEO. Each was briefed separately, given the same 26 real screenshots
captured from the running app at 390×844, the full text of every screen,
and the codebase. None saw another's answer.

What follows is where they converged, where they contradicted each other,
and what I verified in the code afterwards — because a confident reviewer
is not evidence.

---

## 1. Unanimous

Six or seven of seven, independently.

### 1.1 The day-one "Low" is the most damaging string in the app

Every reviewer found it unprompted. Progress, fresh account, first visit:

> **0 across the 1 of 8 we can see · Low on the American Heart
> Association's scale, where 75 and above is high and under 50 is low.**

The growth reviewer put the knife in: *"You tell a high-performing
optimiser his cardiovascular health is Low, from zero data, under a
medical body's name, right before asking for money. He knows it's wrong,
so he concludes the rest is wrong too."* And noted the irony — it is an
invented score from nothing, which is the one thing this product says it
refuses to do.

**Fixed this session.** The band is withheld below four readable
components.

### 1.2 The plan does not serve the stated #1 priority

Alex, as the user: *"I said Family was my number one and there is nothing
family-shaped anywhere on this screen."*

The psychologist connected it to the mechanic: the interview's reveal line
promises *"When two things want the same hour, family wins"* and the plan
delivered ninety seconds later contains no family item. *"A promise made
and visibly broken inside 90 seconds is worse than no promise — it
retroactively reprices every other reveal as marketing."*

Cause is known (`LAUNCH_BRIEF.md` §2): `household` is `deferTo: 'family'`,
so the app does not know there is a family to plan for. **Not yet fixed.**

### 1.3 The interview is the best asset, and it stops paying out

All seven praised it. The CEO: *"Noom's whole conversion engine is that
mechanism and you have built it better."* The psychologist identified why
it works — each answer becomes immediately consequential, the active
ingredient behind effort-justification effects.

And all of them noted it ends at onboarding. The 23 deferred questions
surface with no payoff line, and `09-about-you` renders *"16 questions have
not been put to you yet"* — which the psychologist called *"a debt ledger
with no prices and no prizes."*

### 1.4 Own one number and a date

Four reviewers arrived at this from different directions, all citing the
same simulation result: the marathoner with a hard target gains **+184%**;
the entrepreneur — closest to the target user — gains **+6%** because the
app is a mirror to him.

The growth reviewer: *"A mirror does not convert at AU$149."* The CEO:
*"The +6% is not a tuning problem. It is the product being a planner for
someone who does not need one."*

### 1.5 The day-one paywall is fatal

`Today` announces **"YOUR COACHES BUILT 1 SESSION FOR TODAY"** and the one
session is locked. *"You are charging for proof-of-value before value has
been proven."*

---

## 2. Where they disagreed — the useful part

### 2.1 Restructure now, or ship now?

`THE_OPERATOR.md` proposed four new tabs. **Both the CEO and the PM
rejected that**, and they are probably right.

> **CEO:** *"Its four-tab restructure is the right diagnosis and the wrong
> order — it rebuilds navigation for users you do not have."*

> **PM:** *"Signal without markers is a thin screen, and the rename is
> churn. Keep Progress, gutted."*

Both keep exactly one item from it: Now reduced to one job. This is a
direct contradiction of a document I wrote earlier this session, and the
dissent is better argued than the original.

### 2.2 The markers instrument: hero or liability?

**CEO:** the only defensible asset in the repository, and it is currently
compiled out of every production build. *"You are charging for the
scheduling, which is the commodity, and giving away the measurement, which
is the moat."*

**PM:** *"Liability now, asset at month 12."* On day one it reads 6 of 10
components, needs an age captured as a decade bucket, and the *rate* — the
actual product — needs a series nobody has yet.

They are not really in conflict: it is the long-term moat and the wrong
thing to ship first. But Isaac has to choose, and the choice is which
fight to have with App Review.

### 2.3 Seven coaches

**PM:** cut to three (Training, Nutrition, Recovery) and flag off Money,
Work, Relationship, Family — noting that Family is the *cause* of §1.2, so
cutting the coach deletes the bug. And disputing the +32% figure: *"that is
pathways on vs off — it is not evidence that seven beats three."*

**Research** disagrees implicitly: the unoccupied position is that
*"everyone else sells you a number; nobody schedules the response into
Tuesday"* — which needs breadth to be true.

### 2.4 Privacy

**Research:** keep local-first but ship encrypted export and backup —
*"'No account' is the sellable half; 'no backup' is the churn half, and
they are separable."*

**Growth:** wants three explicit trades against stated principle —
telemetry in 1.0, optional email capture at the paywall, on-device
shareable artifacts. Flagged as trades, not oversights, which is the right
way to put them.

---

## 3. What the research found

Verified figures with sources; the rest was flagged as unretrievable
(reddit, App Store review text and several vendor sites are blocked by
this environment's proxy, and the reviewer said so rather than inventing
quotes).

- **The software-only ceiling is about US$100/yr.** Strava $79.99,
  MacroFactor $89.99, Fitbod $95.99, Bevel Pro $99.99, Google Health
  Premium $99.99. AU$89.99 sits inside it and is arguably underpriced.
- **Whoop now sells blood panels** ($199–$899/yr), Function Health is
  $365/yr at a $2.5B valuation, Superpower $349/yr. The instrument layer
  is being commoditised from above.
- **SuperAge** — free, $49.99/yr premium, on-device processing, sells
  "body age / fitness age / metabolic age" from Apple Health. The closest
  competitor to the markers instrument, cheap, and it invents exactly the
  composite this product refuses.
- **Peter Attia's Outlive app is live** at outlive.com, early access.
  Same thesis, same audience, and that audience's own guru.
- **Whoop sued Bevel in March 2026** over trade dress — a $3B incumbent
  will litigate a software-only app for resembling its scores and layout.
- Academic work in 2026 supports the refusal: *"reduction of complex human
  biology into a single score… creates a translation gap that leads to
  user anxiety."*

---

## 4. What I verified afterwards

Reviewers are confident, which is not the same as correct.

**Confirmed true:**
- Tab bar tap target is **~29pt** (`paddingVertical: Spacing.xs` = 4, plus
  a 21pt line) against Apple's 44pt minimum. A real HIG violation.
- The type scale is 34/26/18/16/15/14/12 — the bottom four steps are
  ratios of 1.125, 1.07, 1.07. `secondary` vs `body` is a distinction that
  exists in code and not in the eye.
- `Fonts` is defined in `theme.ts` and **never used**; `text.tsx` sets
  `fontFamily` nowhere.
- The pruner filtered to `completed || skipped`, so untouched items were
  invisible to the one mechanism meant to shed load. **Fixed.**

**Confirmed false:**
- One reviewer read `"EARLIER — DID IT HAPPEN?"` as asking about the
  future in past tense, assuming a 6:40am session. The capture ran at
  21:07; the session was at 12:15pm. The section was correct. The
  contradiction directly above it — "Day complete" while items sat
  unanswered — was real, and is fixed.

---

## 5. The four sentences worth keeping

> **CEO:** *"Your reasoning is better than your reach, and you keep
> spending the reasoning on readers who don't exist."*

> **Psychologist:** *"Thirteen undone items a week for 26 weeks does not
> just churn the user — it teaches them they are a person who doesn't
> follow plans, and they carry that to the next app."*

> **Designer:** *"The app currently signals 'thoughtful indie journaling
> tool.' The target user buys 'instrument.'"*

> **Alex:** *"It's the only one that plans around your real week instead of
> your imaginary one — and nothing you type ever leaves your phone."*

That last one is the marketing copy. He wrote it himself, unprompted,
after using it.

---

## 6. The one thing they all danced around

Every reviewer eventually said a version of the same sentence: **this
product is excellent at reasoning and poor at reaching a person.**

The CEO put a kill criterion on it that is worth writing on a wall:

> *"If 90 days from now the docs folder has grown faster than the user
> count, that is the kill signal, whatever the metrics say."*

This document makes it worse, not better. It is the fourth this session.
The count that matters is still zero.
