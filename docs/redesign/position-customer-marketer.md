# Position — Customer Manager / Marketer

Role: the outside view. What a stranger understands in five seconds, why
they pay, what they say to a friend. Written against `REDESIGN_BRIEF.md`
§8, `PERSONA.md`, `MONETISATION.md` and two scripts run on this build on
22 Oct 2026.

---

## 1. Position

Isaac's two-coach decision is right, and the listing we have today does
not describe it. The App Store promotional text still opens *"Seven
coaches, one profile"*, and `npm run usertest:coachvalue` on this build
reports Nutrition: started **no**, 0 routines, **0 items, 0 done** across
Alex's forty-five days. We are selling a two-coach product whose second
coach has never put a single thing in anybody's week. That is the one
failure my role is specifically forbidden to allow: copy the build cannot
keep.

So my position is narrow. Do not write new positioning. Make the
positioning already shipped true, in this order — nutrition owns
something that progresses, then the sentence, then the price.

On who it is sold to: **do not change the target market, change what the
product supplies them.** Today's `usertest:decay` run shows one persona
still declining — `career_optimiser`, 61% → 53%, eight points down — and
it is the closest thing in the cohort to Alex. (§2's other two decliners
do not reproduce here: `young_professional` reads +12 and `student` +7,
pooled week 1 reads 43% rather than 42%. Somebody should reconcile that
before §2 is quoted again; I am citing what the script printed.) Every
persona that improves has a roster, a child or a retirement holding the
week. Alex has none of those, earns well, and is the only person in the
cohort who will pay AU$89.99. The conclusion is not a different buyer. It
is that the product has to **be** the external structure Alex is missing,
because nothing else in his week will supply it. That is what a four-week
block is, and it is why "week three of four" sells better than any level
name.

One thing we currently do backwards. We ask AU$89.99 after the first
insight — inside week one, measured at 43%, the worst of twenty-six
weeks, before the programme has progressed once. We charge at the moment
the product is least able to prove itself, and the first thing a person
gets for the money is the thinnest week they will ever have. That is
Isaac's decision of 2026-09-03 and it is the one I would ask him to
reopen.

*(356 words.)*

---

## 2. The one thing I would build first

**Nutrition's four-week block, and the Sunday screen that produces it.**
Not recipes, not a database — a decision artefact with the same mechanical
shape as the training block: four weeks that differ from each other, five
weeknight dinners named in advance, a protein number from the one weight
figure we already collect, and one anchor that steps up across the block
(week 1: five dinners decided; week 4: one protein source batched on a
named day). No logging, no tally, no calories — which is the whole
difference, and the sellable part.

Why this one, in marketing terms rather than product ones:

- The promise is **already written and already shipped**: *"No diet, no
  logging. Protein-first dinners decided once a week, a walk that blunts
  the glucose spike, and your own protein number."* It is a good promise.
  Seven strings do not keep it. The cheapest honesty available to us is
  to make an existing sentence true rather than draft a new one.
- The whole adaptive-nutrition category charges for logging. MacroFactor
  sells itself as the "smartest macro tracker and nutrition coach" with
  the fastest food logger on the market, at US$71.99/year, subscription
  only ([App Store listing](https://apps.apple.com/us/app/macrofactor-macro-tracker/id1553503471)).
  "Decided, not logged" is a real shelf position next to that, and it is
  one we are currently not occupying because we have nothing to put on it.
- It is the only build that makes the one sentence survive a stranger.
  Half of a two-coach sentence is currently unsupported.

What I would **not** build first: levels, a doorbell, or a planner. All
three are answers to "there is no reason to come back", and
`WHY_HE_STOPPED.md` already established his answer was "I came back and
it was wrong."

---

## 3. What is wrong with the proposed resolution in §5

§5 says: *"A level you earn and keep is not a streak you can lose."*

It is correct, and it is not a reason to open the app today.

**The objection: a level that cannot be lost has no clock, and §5 never
notices.** A streak's retention power is entirely its clock — it makes
today different from tomorrow. §5 removes the clock, correctly, and puts
nothing in its place, so it answers "is this fair?" and leaves "why today?"
unanswered. Rule 1 is satisfied by a mechanic that moves nobody, which is
exactly Duolingo's own finding as §5 quotes it.

**Second: the display corollary is a scoreboard wearing a hat.** "Show the
rungs behind as well as the one ahead" renders as four states per coach,
two coaches, filled and unfilled. A stranger reads a row of filled and
unfilled segments as a progress bar whatever we name it, and §4.1 forbids
bars. A bar that fills photographs identically to a bar that empties.

**Third, and the one I would actually change: the unit is wrong.** §5 asks
whether there is "a unit of progress above the rung". There is, it already
exists, and it is below the rung rather than above it: **the block.** Four
weeks — build, build, progress, deload — that *ends*. A thing that ends is
the only honest urgency available to a product that refuses to score
people: week 2 of 4 arrives whether or not you feel like it, and missing
Tuesday does not make it week 1 again. It is also the external structure
the declining personas lack, supplied by the app instead of by a roster.

And a rung is a label about the person. "Established" is a grade written
in words, which sits closer to the line `PERSONA.md` §3.3 draws than §5
admits. "Week 3 of 4, and the squat target moved" is a statement about
the plan. Sell the second. Keep the ladder as the quiet record behind it,
not as the spine.

So: keep §5's rule (nothing is lost), reject §5's unit (the rung),
promote the block, and drop the rungs-behind display.

---

## 4. A falsifiable prediction

**Primary, measurable in `tools/usertest`.** If my position is right —
that the decliners decline for want of a second progressing artefact, not
for want of a level system — then after nutrition owns a four-week block
and week one is cut to a calibration week:

1. `usertest:decay` pooled **week 1 rises above 50%** from the 43% printed
   today, *and* the pooled 26-week rate does not fall below its current
   52% last-four-weeks figure; and
2. `career_optimiser` — the one persona that still declines on this build,
   61% → 53% — comes out at **change ≥ 0 points**.

If `career_optimiser` still declines after nutrition is deep, I am wrong:
the problem is placement, not thinness, and the roles arguing for the
scheduler fix should win the quarter. Note the honest hazard in (1): a
calibration week changes the denominator, so judge it on **items done in
week 1** as well as the rate, or it proves nothing.

**Secondary, TestFlight, ten people.** Ask each, unprompted: *"what does
it do?"* If my positioning is right, **six or more of ten use a training
word and a food word in one sentence**, and none needs two sentences. If
three or more say "coaches", or "it does a lot of things", the two-coach
decision has not reached the surface and the listing is still selling
seven doors. This is answerable by ten people in a week and it is the
cheapest test in this document.

---

## The three things this role owes, uniquely

### The one sentence

> **"IntentNorth decides your training and your food for the week — the
> sets, the reps and the dinners — and fits them round the job and sleep
> you already have, so the deciding is done before you get there."**

It survives "so what does it actually do": sets and reps and dinners are
nouns a stranger can picture, and "fits them round the job you already
have" is the thing no other app in the category claims.

**The honest caveat, and it is mine to enforce:** that sentence is not yet
true. "Your food for the week" is seven strings and 0 items in 45 days. We
do not say it in the store, on the site, or in a TestFlight email until
nutrition owns a block. Until then the truthful sentence is the training
half only — which is a smaller product and a sellable one.

### The moment they would pay

The end of the first session the app prescribed and auto-regulated — when
the next target moved because of a number they put in, and they can see
the rule that moved it. That is the first moment the product has done
something they could not have done from a podcast.

It is not where the paywall is. The paywall is after the first insight, in
the week measured at 43%, before any target has moved. Moving it costs
some day-one revenue and buys refund-rate, rating and word-of-mouth. I am
not pretending that decision is unmade; I am asking for it back.

### The sentence they would say to a friend

> "It writes my gym programme and tells me what to eat — and it knows I'm
> at work until half six."

Three clauses, all concrete, no category language, and the third is the
one that makes the other two believable to somebody who has bought this
kind of thing before.

---

## Answers to the four questions put to me

**What is this app, in one sentence?** Above, in quotes. In four words
behind it: *the deciding is done.*

**What follows from the target market being among the decliners?** Keep
Alex; he is the only persona who will pay. Stop expecting him to arrive
with a week-shaped life. The improving personas are held by a roster, a
child or a retirement; Alex is held by nothing, so the product has to be
the thing that holds him — a block with a week number, not a level with a
name. The one secondary lever that is on-brand and does not need an
account, a referral graph or data leaving the phone: `PERSONA.md` says
plans with other people in them survive a bad week, so the plan should
name the people he already has (the training partner, Friday dinner),
on-device, as part of the block.

**The diary planner — straight verdict: no.** Not "later", not "a smaller
version". Four reasons, in descending order of how much they cost:

1. **It is the opposite promise.** We sell "somebody else holds the
   plan". A paper planner hands the plan back and asks him to write it
   out. The product that beats us to his Tuesday evening is not Hevy; it
   is a notebook. We should not ship the competitor.
2. **The danger is that it works.** A person who has written Tuesday onto
   paper has no reason to open the app on Tuesday. A companion artefact
   that substitutes for the product is worse than one that fails.
3. **It contradicts the one claim we cannot lose.** "No account, nothing
   leaves your phone" is the trust close in the App Store description.
   Shipping a physical object requires a name and a postal address — the
   first personal data this product has ever collected, collected by a
   company whose entire differentiator is that it collects none.
4. **It is a second business.** Print runs, minimum order quantities,
   stock, shipping, returns, a storefront and support email, funded
   pre-launch by a solo founder, against an app with **zero users and a
   rejected submission history** (`APP_STORE.md`, build 16, 2.1(b)). Any
   hour spent on it is an hour not spent on the 0-item nutrition coach.

The real appetite under the idea is legitimate: Alex wants a physical
record of progress that is not a score (`PERSONA.md` §5 names this
tension). The free version of that is one printable page — "your block,
four weeks, one page" — generated from the data already on the phone,
shared through the share sheet that already exists. Zero cost of goods,
no address, and it measures the appetite before anything is printed. If
that page gets used, revisit paper. If it does not, the planner was never
the thing.

**A first week that is structurally the worst.** Three moves, in order:

1. **Say it out loud and make it the mechanic.** Week one is the week the
   app knows least — 43% pooled, the worst of twenty-six, and §2 is clear
   that the later climb is the app learning the person, not the person
   improving. So name it on the screen: *"Week one is deliberately small.
   It is the week we learn when things actually happen."* Unstated, a 43%
   week reads as a broken app. Stated, it reads as on schedule. This is
   the cheapest retention change in the document and it is copy.
2. **Shrink it to match.** Plan a calibration week — the training
   sessions, the one Sunday food decision, and the anchors he already has
   named and protected (`PERSONA.md` §3.5). Nothing new in week one
   except the block itself. The first week should be the week with the
   fewest items in it, not the week we hand him everything we were
   holding — which `commitmentBudget` already knows how to say for a
   returning user and has never been told to say to a new one.
3. **Do not charge inside it.** See §1. Ask for the money after the first
   target moves.

---

## Sources

- Scripts run on this build, 22 Oct 2026: `npm run usertest:decay`,
  `npm run usertest:coachvalue`. Both passed; figures quoted are from
  their output, and where they disagree with §2 the disagreement is
  flagged rather than smoothed.
- Repo: `REDESIGN_BRIEF.md`, `WHY_HE_STOPPED.md`, `PERSONA.md`,
  `MONETISATION.md`, `APP_STORE.md`, `src/features/paths/definitions.ts`.
- [MacroFactor on the App Store](https://apps.apple.com/us/app/macrofactor-macro-tracker/id1553503471)
  — competitor positioning and price, cited for category contrast only.
