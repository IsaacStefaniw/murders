# How this app gets better

Isaac, 16 Sept 2026: *"What should we do next to turn this app into the
best version of itself — with the goal to be the #1 Health App that has
real changes on people's lives... I think we could get multiple review
streams going with all feedback centralising here."*

This is the answer to the second half — the machine. `REVIEW_STREAMS.md`
is what the machine produces. The first half, what to actually do next, is
the board in that file plus the three bets below.

---

## 1. The thesis, stated so it can be argued with

A health app changes a life in exactly one place: **the moment the plan
meets the week and loses.** Everything else — the library, the grading,
the scheduler, the seven coaches — is preparation for that moment. Most
apps in this category are excellent at the preparation and absent at the
moment, which is why their retention curves all look the same.

So the organising question for every decision from here is not "is this a
good feature". It is:

> **At the moment this person's week goes wrong, does the app do anything
> a notebook would not?**

Three sub-moments, in order of how much they matter:

1. **The slip.** Something happened that was not the plan. This is the
   moment the abstinence violation effect decides whether one becomes
   five, and it is the moment Isaac personally hit this week.
2. **The drift.** Nothing happened, for days. No single failure to react
   to, which is why almost nothing reacts to it.
3. **The window, before it opens.** The one moment where prevention is
   still cheap, and the only one the app can find and a person cannot.

The app now does something real at (1) and (3). It does almost nothing at
(2), and that is the largest single hole in the product.

## 2. What the app is already unusually good at

Naming these matters, because a review process with no protected list
optimises them away.

- **It grades its own evidence and publishes the weak grades.** 202 of the
  318 it grades are C or weaker and it says so. No competitor will copy
  this, because copying it means admitting the same thing.
- **It refuses to score people.** No streaks, no percentages, no adherence
  grade, no reset to zero. This is the hardest thing to hold and the
  easiest thing to lose to a well-argued feature request.
- **It computes intervention times from the person's own distribution.**
  Not 8pm because 8pm is when people drink — 8:15 because that is ahead of
  *their* window, on *their* weekdays.
- **It is on-device.** No account, nothing leaves the phone. That is a
  positioning moat and a constraint on every idea that starts "what if we
  used a model to…".
- **Everything is reasoned in the code.** The comments in this repo are
  the design history. That is why a review can be run against it at all.

## 3. The three bets

### Bet one — own the moment things go wrong

Built this round: `features/moments/aftermath.ts` and the breakout frame.
A slip now produces a four-step full-screen intervention — steady, the
trigger while it is fresh, an if-then for the situation that actually
happened, then what it cost and what does not change — and the plan it
produces is delivered back ahead of the next window.

What remains: **the drift.** Nobody has logged anything for five days, no
sessions are being marked, the plan is running on paper only. There is no
single event to hang a response on, so nothing responds. The app needs a
read of "this has quietly stopped" and one honest, non-guilting way back
in. That is the next breakout.

### Bet two — one more person

Every mechanism in this app is between a person and their phone. The
behaviour-change literature is unambiguous that the largest effects in
this category come from another human being knowing. The app has no
mechanism anywhere for a second person to know anything — and the
on-device constraint makes the obvious version impossible.

The version that is possible: the app composes the message and the person
sends it, from their own phone, to whoever they choose. `TELL_THEM` in
`features/coaches/reach.ts` is the seed of this and reaches almost
nothing. This is the highest-ceiling unbuilt thing in the product.

### Bet three — make the first week survivable

A health app deleted in week one changes nobody. The interview is
thorough, which is a strength for the person who finishes it and a cliff
for the person who does not. The measurable targets: time to first useful
output, number of questions before it, and what day three looks like when
the novelty has gone. The review stream on this reports into the board.

---

## 4. The machine

### Review streams

A workflow (`intentnorth-review-streams`) fans out specialist reviewers
over the real code, each returning structured findings with a file and
line. Round one ran seven:

| Stream | The question it asks |
| --- | --- |
| behaviour-change | Which techniques that actually move behaviour does this implement, and which high-yield ones are absent? Audited against the BCT taxonomy. |
| lapse-loop | What does a person receive in the ten minutes, 24 hours and 7 days after falling short? |
| first-week | Where does a real person with a busy Tuesday quit? |
| clinical-safety | Where could this harm somebody, and where should it hand off to a human and does not? |
| capture-honesty | Where does the app's record of what happened stop being true? |
| intervention-surface | What deserves to break the frame, and what would make it a nagging app? |
| competitive-delta | What does the best version of this category do at the moment of truth that we do not? |

### Three-lens adversarial verification

Every finding is then attacked by three independent verifiers before it
reaches the board, each with a different way of being right:

- **Code lens** — open the file, check the claim literally. Reviewers
  misread things and propose building what already exists.
- **Consequence lens** — would fixing this change what a person does in
  their week, or only change a screen? This kills most findings, and
  should.
- **House lens** — would the fix break a stated rule? No scores, no
  streaks, never overclaim evidence, on-device, never medical advice,
  never a scold. This is the one that protects §2.

Two refutations kill a finding. Verifiers default to refuting when
uncertain, so the board is short on purpose — a finding that survives
three hostile readings is worth acting on; one that squeaks through on
charity is not.

### What dies, recorded

Refuted findings are kept in the board with the reason. Without that, the
next round re-raises them, and a review process that keeps rediscovering
the same rejected ideas is a treadmill.

### The completeness critic

A final agent reads the board and names what all the streams missed —
including which stream was weakest. What it finds is the first input to
the next round.

### Rules for running it again

1. **The house rules are inputs, not outputs.** A stream that proposes a
   streak has misunderstood the product, not found a gap.
2. **Every finding cites a path and a line.** A finding that cannot be
   evidenced from a file is not a finding.
3. **One finding that changes a life beats five that change a screen.**
   Streams are capped at five findings and asked to rank their own.
4. **Nothing is built straight off the board.** The board says what is
   wrong. What to do about it is still a design decision, made here,
   against §1.
5. **Verify in a browser.** Every substantial change in this session was
   wrong in at least one way that only the running app revealed.

---

## 5. What "#1 health app" would have to mean

Not downloads. The claim this product can actually make, and should be
built to be able to make:

> Of the people who used it for eight weeks, most can name one thing about
> their week that is different, and point at when it changed.

That is measurable on-device without telemetry, it is the thing the review
streams are pointed at, and it is a claim no competitor built on streaks
and scores can make honestly.
