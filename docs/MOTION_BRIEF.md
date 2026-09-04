# Creative brief — three claims, three sequences

For the website session, from the website session. Written 4 Sep 2026 against
Isaac's positioning note and the sweep in `docs/COMPETITIVE_REVIEW.md`.

**One caveat stated up front.** This sandbox has no outbound network, so no
competitor site was opened to write this. Everything said about the market
below comes from the sourced sweep in `COMPETITIVE_REVIEW.md`, not from
looking. Where a claim about a competitor matters to a decision, it is marked
so it can be checked before anyone acts on it.

---

## 1. The diagnosis

The site currently has three motion pieces and one film. Two of them explain
the same idea — a signal arrives, the plan changes, here is why — once in the
hero and again 3,000 pixels later in the learning loop. The third, the shared
profile, explains a plumbing detail. None of them show the product Isaac
actually sells.

That is the whole problem. The animation is a diagram of a mechanism. The
product is a library, a programme and seven coaches, and a visitor cannot see
any of the three move.

The mechanism is not what a person is buying. It is how what they are buying
works. We have been advertising the engine.

---

## 2. The positioning

Isaac's three, in his order, because the order is an argument:

### a) Proven protocols, synthesised and rated

Not "we have content". **Every practice carries its evidence grade and its
safety line, and we publish the weak ones.**

The numbers are verified against `src/features/knowledge/protocols.ts`:
177 protocols, nine pillars, graded A 13 · B 60 · C 63 · D 33 · E 8, 145
safety lines, 188 people credited. Seventy-three are A or B. **One hundred and
four are C or weaker, and we say so on the page.**

That last sentence is the asset. Every competitor in this category presents
its content as uniformly good. Publishing that most of our own library is
mid-grade evidence is a costly signal — it is only worth doing if the grading
is real — and costly signals are the cheapest trust money can buy. Lead with
the weakness; it proves the strength.

### b) Programs that live with you

Not "we build you a plan". **You never build a program again, and the one you
have moves when your week moves.**

Four phased weeks — build, build, progress, deload — per goal
(`programme.ts`). A protocol added from the library becomes a routine and gets
placed at an hour the scheduler chooses, wake- or sleep-anchored where that
matters (`toRoutine`). It then answers to results the same way a training block
does: readiness `back-off` keeps every main lift and cuts the accessory list to
one; two missed Tuesdays and the next block stops scheduling Tuesdays.

"Lives with you" is the right phrase and should survive into the copy. A plan
you have to maintain is homework. This one does the maintaining.

### c) Seven coaches that build your life with intent

Not "seven features". **One profile, seven specialists, and the ladder is
shared.**

Seven pathways, four levels each, earned from the person's own log — with a
top rung that cannot be selected, only reached. 5,376 verified input
combinations. The competitive sweep's finding stands even after Isaac's
correction: Fitbod builds a workout, Rise reads a signal, Sunsama plans tasks.
Nobody runs seven and nobody makes them share what they know about you.

**Do not lead on cross-domain arbitration.** Isaac has ruled on this twice. The
laddering is the product; arbitration is a consequence.

---

## 3. The three sequences

One sequence per claim. Each replaces something currently on the page rather
than being added to it — the page is long, and a fourth diagram of the same
idea is worse than three good ones.

### Sequence 1 — "Choose one. It grades itself."

**Replaces:** nothing. This is new, and it goes where the library section is.

**Beat 1.** A wall of practices, dense, filterable, alive — not a list of
three. The density *is* the message: 177 is a number you should feel before
you read it.
**Beat 2.** One is chosen. Its grade badge and its safety line stay attached as
it moves. They are not a footnote; they travel with the practice.
**Beat 3.** It lands in a week, at an hour it picked, next to things already
there.
**Beat 4.** The reason for the hour.

**The honest hard part.** Beats 3 and 4 are the ones that prove the claim, and
they need real captures — the same seeded week before and after the add. That
request is already written and pushed: `docs/APP_CAPTURE_REQUEST.md`. Until
those frames exist this sequence can be built as an abstract diagram, but it
will be the weaker version, and we should say so in the commit rather than
pretend otherwise.

### Sequence 2 — "The plan grows."

**Replaces:** the learning-loop diagram, which currently animates one lift
going from 100kg to 102.5kg. That is a true, small, and slightly dull claim.

**Beat 1.** Week one. Sparse — three sessions and a protocol.
**Beat 2.** Weeks pass. The week fills: the block phases through build, build,
progress, deload; protocols accumulate; the shape thickens.
**Beat 3.** A hard week. It *shrinks* — and this beat is non-negotiable. Every
competitor's marketing shows a line going up. Showing the plan get smaller
when life gets harder is the single most differentiating four seconds
available to us, and it is true: the recovery pathway shrinks itself when a
week is hard, and readiness cuts accessories rather than cancelling sessions.
**Beat 4.** It recovers and continues. Not back to zero.

**Why this beats the current one.** Growth over weeks is the product's actual
timescale. A single set-to-set progression is a feature demo.

### Sequence 3 — "Seven, and they know each other."

**Replaces:** the shared-profile diagram, which makes this point in the
abstract and in the language of form fields.

**Beat 1.** Seven coach marks, quiet, arranged around one profile.
**Beat 2.** One opens. A real pathway, a real rung, the level blurb verbatim
from `LEVEL_BLURB`.
**Beat 3.** It closes; a second opens — and it already knows the sleep answer
the first one has. No repeated interview.
**Beat 4.** All seven, one profile, one ladder.

**The trap to avoid.** Seven of anything animating at once is a screensaver.
One at a time, deliberately, with the others held still.

---

## 4. Craft rules

Six, drawn from what has actually gone wrong on this site.

1. **Motion must carry information, or it should not move.** Every beat above
   changes a fact on screen. Nothing fades in because fading is nice.
2. **One thing moves at a time.** The hero card animates one row of seven, and
   it works because six rows hold still. That is the pattern.
3. **The still frame has to work.** Reduced motion, a screenshot, a scroll-past
   — all land on the final frame. If the final frame does not make the argument
   alone, the sequence is decoration. Every piece gets a *Play it again*
   control so a reduced-motion reader can opt in.
4. **No layout jump. Ever.** The hero swap crossfades in a grid cell and holds
   654px through four stages. `npm run test:layout` fails the build on a
   collision, a ribbon or sideways scroll at eight widths.
5. **Every number traces to code.** No exceptions, no rounding for rhythm. Three
   false claims have reached this live site — a volume percentage, reps in
   reserve, and a set-drop that belonged to a different code path. All three
   were written because a sentence sounded right.
6. **A diagram is labelled as a diagram only when a reader could mistake it for
   a screenshot.** The abstract stage rail could not, and its disclaimer was
   removed. The film's screens could, and its note stays.

---

## 5. Conversion craft, applied honestly

- **Costly signals over adjectives.** "104 of 177 are C-grade or weaker" does
  more than any superlative, because a liar would not say it.
- **Specificity as proof.** "9:45pm, because the slip window is after 10pm"
  outperforms "smart reminders" and cannot be written by a competitor who does
  not have the mechanism.
- **The objection, answered in the same viewport.** The objection to a
  seven-domain product is that it must be shallow. The ladder answers it. They
  should be adjacent, not three screens apart.
- **Price framing already correct.** "One price for all seven, not one per
  coach" is the right frame against a stack of single-purpose subscriptions.
  Keep it.
- **What is missing is the ask.** The page persuades, states a price, and then
  offers nothing to download. That is the largest single conversion defect on
  the site and it is not a motion problem — it needs Isaac's decision on what
  to promise before App Store approval.

---

## 6. Done means

- A visitor who watches nothing still gets all three claims from still frames.
- A visitor who watches sees a library become a plan, a plan grow and survive a
  bad week, and seven coaches share one profile.
- Every number on screen traces to a file.
- `npm test` and `npm run test:layout` pass; both run in CI before deploy.
- Checked on a real phone, by a person, before it is called done. Two layout
  bugs reached this live site in two days and Isaac found both on his handset.
  That is the standard the automation is trying to reach, not one it has met.

## 7. What I would cut

The shared-profile diagram, once sequence 3 exists. It explains plumbing —
"web-to-app profile linking is the next product connection" — which is a
roadmap note wearing an animation's clothes. Roadmap belongs in words.
