# Skill & Craft round — findings

Round 5, and the first pillar where the honest answer was mostly "this is
already right". Brief: `docs/research/BRIEF-skill.md`. Output: six
candidates in `protocols.ts`, a row per card in `sources.md`, the credit
ledger in `episodes.md`, the pillar's order in `ladder.md`, the Gate 1 and
Gate 2 working in `ledgers/`.

## What was checked

42 DOIs through the full chain: Crossref for bibliography and the
title-prefix retraction check, then Europe PMC or OpenAlex for abstract,
design and n. 24 verified, 12 partly verified, 3 record-only, 2
unverified. Gate 1 mined 48 episodes for mind and skill together, which is
the restructure working: read once, used twice.

## 1. What changed

Six new cards and five regrades, and **the regrades matter more**. Four of
the five move down, one of them by two grades because its evidence base was
retracted. Nothing moved up. In the library's strongest pillar that is the
expected shape, and a round that came back with fifteen additions and no
downgrades would have been the warning sign.

## 2. The urgent one

**`ship-monthly` is a live card built on a retracted paper.**

Its reasoning is that students who set their own spaced deadlines finished
better than those working to one distant deadline, and both its attribution
credits are that study's authors. The paper was retracted on 2 September
2026 after its data were found tampered with or fabricated and a
replication failed.

**How it was missed is the point.** That paper had been in
`../corpus/RETRACTIONS.md` since the register was created, filed under the
money round that found it. Nobody swept the *already shipped* cards against
the register. A register nobody enforces is a bibliography.

Fixed: `../corpus/tools/retraction-sweep.js` now checks every card by
author and by claim pattern and exits non-zero so it can gate a build. It
finds this card in a second and reports the other 203 clean. The register
now says that a row added there and not to the sweep stops being enforced.

Proposed: grade to E, both credits off, the deadline sentence out, and keep
the practice. A monthly ship date with an audience of one is harmless,
meaningful and adherence-positive, and the contract is explicit that
expectancy raises the value of such a practice without raising its grade.

## 3. Both A grades survive, and they were tested rather than assumed

The brief says retrieval practice and spaced review were graded *up* to A
in an earlier round. That is exactly the kind of claim a verification round
should try to break.

**`blank-page-recall` holds.** The card *is* the manipulation that was run.
Free recall beats recognition, which is precisely why the card says blank
page rather than quiz app. It beats every control condition in a later
meta-analysis, and the canonical review of ten study techniques rates
practice testing high-utility, one of only two to earn that. The honest
boundary is that the large transfer meta-analysis reports a moderate effect
for transfer rather than the larger one for straight retention.

**`spaced-review` holds, with a gap in the copy.** The A rests on 839
assessments across 317 experiments. But the card says to space without
saying how far, and the literature has an answer worth having: the best gap
scales with how long you need to remember something, roughly a fifth to two
fifths of the way out for a week's horizon and a much smaller fraction for
a year's. Either add that to the card or pair it with the new
`let-the-gap-stretch`.

## 4. The biggest change goes down

**`skill-one-external-cue` from B to D.** Telling yourself to focus on what
you want the ball to do, rather than on your body, has seven meta-studies
reporting it works. A 2024 robust Bayesian reanalysis of the field's own
dataset found moderate-to-strong publication bias in every analysis,
bias-corrected effects between roughly zero and 0.15, and Bayes factors
favouring the null on all five outcomes.

The card's claim that it is "replicated across hundreds of small
experiments, which makes it the most usable finding here" is now false as
written. The replacement sentence is more interesting than the original:
the raw literature is large and consistently positive, a reanalysis found
the positivity is publication bias, and what remains is real but
unexplained variation between people, tasks and cues.

**The attribution stays**, which is worth noting because the instinct is to
strip it. Wulf and Lewthwaite are on the author list of the paper the card
rests on, so the credit is valid under the author-list rule, and they are
genuinely who popularised the practice. Grading a practice down is not a
reason to un-credit the people who taught it.

## 5. Time back

Six items, at the low end of one in five, which suits a pillar whose good
news is the point. Two extend the existing antipattern list rather than
becoming cards.

- **Buying a planner to fix procrastination.** Two meta-analyses find the
  cognitive-behavioural approach outperforms the alternatives, and no
  scheduling approach came out on top. Stated more carefully than the
  podcast that raised it: neither paper says time-management training is
  *least* effective. The lever is the first two minutes and how you feel
  about them, not the calendar.
- **Growth-mindset self-talk as a performance lever.** 63 studies, nearly
  98,000 people, an overall effect of 0.05 that is non-significant after
  bias correction, 0.02 in the highest-quality subset, and larger effects
  from authors with a financial interest.
- **Self-controlled practice.** A naïve effect of 0.44 collapses to 0.02
  once unpublished experiments are included, with publication status
  explaining nearly half the heterogeneity.
- **External focus**, above, proposed for the contested list in the
  retraction register.

## 6. Two citation traps, and they have the same shape

Both are worth recording because the pattern is now recurring.

**The growth-mindset identifier.** Gate 1 cited a DOI that resolves to a
different paper, by different authors, in the *same double issue* of the
same journal, reaching a friendlier conclusion. Anyone checking the
author-year would have seen a match.

**The procrastination claim.** A podcast attributes to two meta-analyses a
ranking that appears in neither.

Both are the shape already in the register: the burnout paper retracted in
2020 sits one year and one volume from a clean paper by the same first
author in the same journal. **Check the DOI, never the author-year.**

## 7. What the Skill coach can now say on a Tuesday

- "You know that one solidly now. Push it out to next week and keep the
  shaky ones close. The gap is supposed to grow."
- "Before you open it, write three questions and guess the answers. You are
  meant to get them wrong. That is the bit that works."
- "Pick one cue you actually meet every day. A routine or a clock time,
  whichever you'll notice — a trial compared them and found no difference."
- "Missing one day doesn't set you back. That's measured, not me being
  nice."
- "Put the hard practice on a night you'll sleep properly. A good chunk of
  it happens while you're asleep."
- "You can stop buying planners. The thing that shifts procrastination
  addresses how you feel about starting, not when you pencilled it in."
- "Finish on one you got right. That's a craftsman's habit rather than a
  finding, and it's still a better place to stop."

## 8. Product notes

- **The habit card hands the anchor choice to the person**, because a
  randomised trial found routine-based and time-based cues equally
  effective. That is a verified null and it resolves a design question the
  library had been answering by intuition.
- **`neverNag` on the habit card has an empirical justification**, not just
  a kind one: missing a single opportunity did not measurably affect habit
  formation. Worth saying in the copy, because the person believes the
  opposite.
- **`sleep-is-the-second-half` may be better as a planner rule than a
  card.** It is a scheduling constraint, not a session. Gate 3 should
  decide.
- **Run `retraction-sweep.js` before every round ships.** It exists because
  this pillar found what it found.
