# Round three — the brief

Isaac, 17 Sept 2026: *"I really want an overall design review — can you use
your token learnings and run a pure design and interface review. I also
want a coach review — same as above. Focusing on breakouts, pathways,
interactions, lessons, protocol designs. RE Coach Training — there needs to
be a review of removing exercises, adding exercises, and program design. Do
similar program design review on all coaches. Also a protocol review to
ensure explanations are written on all protocols required."*

This is the brief for that round, written before the agents run, because
the last two rounds proved the brief is where the value is decided.

---

## 1. What the first two rounds actually cost, and bought

| | Round 1 | Round 2 |
| --- | --- | --- |
| Agents | 102 (7 streams + 90 verifiers + 1 critic) | 56 (4 streams + 2 lenses + 3 critics) |
| Findings raised | 31 | 24 |
| Survived verification | 15 | 3 |
| Best items came from | the 1 critic | the 3 critics |

Read that last row twice. **In both rounds the critics — a handful of
agents told "read the board and say what everyone missed" — outproduced
the streams that cost fifteen times more.** Round 2 was already redesigned
on that lesson and it held a second time, which makes it a pattern rather
than an accident.

### Why the streams underperform, specifically

Not because the agents are weak. Because of what they are reading.

Every trade-off in this codebase is argued in a docstring. `reach.ts`
opens with four hundred words on why a local notification and not email.
`protocols.ts` carries Isaac's correction about balance verbatim. A stream
told "review the notification system" reads my case for the notification
system and does one of two things: agrees, or re-proposes the alternative
the docstring already rejected. **The comments are a defence against
review.** That is good for maintenance and terrible for generation.

So a stream can only find something where the docstring is absent, wrong,
or lying. Round 2's three confirmed findings were exactly those three
shapes — and its own critic found the better ones by ignoring the
docstrings and asking what was never written down at all.

### The second lesson: measure before writing

Five times across two rounds, a correct-looking guard turned out to have a
large hidden behavioural cost, discovered only when a test or the cohort
went red:

- dropping unlived days from the sim put shift_nurse under the completion
  floor and turned coach benefit negative for two personas;
- wake-anchored slots fixed the nurse and broke the student; sleep-anchored
  did the reverse;
- `applyProtectTime` → `protected: true` looked strictly better and
  measured a cost, because the engine places a protected routine even when
  the day is full;
- `detectRegrow` read the library default and told minimal-capacity users
  their session "was shortened when weeks were harder";
- filtering the coach push on `neverNag` silenced 34 of 36 family
  practices — the whole shelf the feature exists for.

Four were withdrawn. The fifth survived only because it was measured
against the library *before* the fix was written rather than after the
tests failed.

**Rule for this round: a finding that proposes a guard, a filter, or a
change to the adaptation engine must state its blast radius as a number —
measured against the 323-protocol library or the ten personas — inside the
finding. A finding without that number is not a finding.**

---

## 2. What this round points at, and why it is different

The two dimensions Isaac named are precisely the two the docstrings
**cannot** self-justify. That is not a coincidence, and it is why this
round has a real chance of finding something the last two could not.

### Design and interface — the code cannot argue about this

A comment can say why a card exists. It cannot tell you the screen is
ugly, that the hierarchy is inverted, that three cards are competing for
the same glance, or that the thing a person came to do is below the fold.
No amount of reading `Today.tsx` answers "what does this look like".

**So the design agents do not read the code first. They look at the app.**
The web export is built, served, and driven with a real browser at phone
width; every screen in the product is captured as an image; the agents are
given the images. This is the one genuinely new capability this round has
and it is the whole reason it is worth running.

The brief to them is *pure design*: composition, hierarchy, rhythm,
density, type, colour, the grammar of the breakout frame, whether the
seven coaches read as seven voices or one, and whether a screen looks like
it was designed or accumulated. No feature requests. No "add a card".

### Program design — a domain question, not a code question

Isaac's sharpest ask, and the one nobody has reviewed at all:

> Is the training programme any good **as a programme**? Would a strength
> coach recognise it? And do the other six coaches have a programme at
> all, or just a shelf of practices?

The training coach has a real engine — `buildProgramme`, `autoRegulate`,
build/progress/deload phases, `swap.ts` (press for a press, hinge for a
hinge), `sessionEdits.ts` (drop and add, scoped to one session,
reversible). That is more programme design than anything else in the app,
and it has never been reviewed by anything that knows what periodisation
is.

The other six have `paths/programme.ts` and a ladder. Whether that
constitutes a programme is the question.

### Protocol explanations — already measured

I ran this audit before writing the brief, so the agents start from the
number instead of spending a turn finding it:

```
323 protocols
  missing `summary` (what to do):        0
  missing `why` (why it works):          0
  health-area, missing `safety`:         0
  carrying a how-to of any kind:         0   ← there is no such field
```

**Correction, written after the round ran.** The last line of that audit
was wrong, and the protocol reviewer caught it. There is no `howTo` FIELD,
which is what I checked — but there is a `HOW_TO` map in
`features/knowledge/howTo.ts` holding numbered, first-attempt steps for 22
practices, with a worked example where a target needs one. It is good
writing and it was already tested.

It rendered in exactly one place: the Library tab, behind a disclosure, on
a browse screen somebody opens when they are curious. It was absent from
the moment the plan meets the week — the only moment this product claims
to be for. Somebody opening "Zone 2, 40 min" at 06:40 got a title, a
sentence and an evidence grade, while the instructions for doing the thing
sat on a different screen. It is now shown in the Today item detail too.

Which makes the real finding better than the one this brief set up: the
missing half was not unwritten, it was written and not delivered. The rest
of the section stands, and the open question sharpens — 22 of 323 is not
an answer anybody should be satisfied with.

So the explanation Isaac is asking about is not missing — it does not
exist as a concept for most of the library. Every protocol says what to do in one sentence and why
it works in a paragraph. **Neither of those tells somebody how to actually
do it.** "Zone 2" has a beautiful `why` and a one-line `summary`, and a
person who has never done it still cannot do it.

That was pending work item §2.1 ("render the protocol how-to in the Today
item detail"), open since before either round. The blocker was never the
screen and never the writing — the steps existed and the detail view was
already there. They had simply never been connected. Now done.
The question for the review is not "are explanations missing" (measured:
they are not) but **"is one sentence and a paragraph of evidence enough to
act on, and for which protocols is it plainly not?"**

---

## 3. The shape of the round

Three groups, deliberately small, all critic-shaped rather than
stream-shaped — told what to look at, not what to look for.

1. **Design critics**, given screenshots of the running app, no code.
2. **Coach critics**, one per dimension Isaac named: breakouts, pathways,
   interactions, lessons, protocol design, and program design across all
   seven.
3. **Protocol critic**, given the audit number above and asked the
   actionable question rather than the measured one.

Then the same adversarial verification that has worked twice — code lens,
consequence lens, house lens, two refutations kill a finding — because the
verification layer is the half of this machine that has been earning its
keep.

### The house rules are inputs, not findings

Unchanged, and any agent that proposes breaking one has misunderstood the
product rather than found a gap:

- No scores, no percentages, no streaks, no adherence grade.
- A missed Tuesday is a missed Tuesday, never a reset to zero.
- Never invent evidence, never overclaim a grade.
- On-device only. No account, nothing leaves the phone.
- Educational structure, never medical advice.
- Copy is plain and specific. Never a scold, never a cheerlead.

### And the protected list

From `OPERATING_MODEL.md` §2, because a review with no protected list
optimises away the things that make this app worth shipping: it grades its
own evidence and publishes the weak grades; it refuses to score people; it
computes intervention times from the person's own distribution; it is
on-device; and everything is reasoned in the code.

---

## 4. What would make this round worth its tokens

One sentence, so it can be checked afterwards:

> **A change to how the app looks or how a coach programmes that Isaac can
> see on his phone and immediately recognise as better — not a board entry
> arguing that it would be.**

Rounds 1 and 2 produced eighteen confirmed findings and a very good board.
What they did not produce is a screen that looks different. This round is
pointed at that.
