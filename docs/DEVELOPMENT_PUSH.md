# The development push

Written 8 September 2026, combining the outside product review, the research
run's 113 candidates, and the three pieces built this week.

## The diagnosis both readings agree on

Isaac's words were that the coaching feels shallow. The outside review's were
that too much capability arrives before the user has felt one clear win.

Those are the same fault seen from two sides. **The app has wide surface area
and thin decision-making.** It displays seven coaches, paths, protocols,
grades, levels, milestones and insights, and it decides very little on the
person's behalf. A coach's whole value is deciding.

Everything below either makes the app decide more, or shows less.

## Already built, this week

Three pieces, all shipped, all riding the held over-the-air update.

- **Evidence orders the day.** The grade was on all 204 protocols and used
  for nothing; better-evidenced practices now get the hour they want. It sits
  below tier, goal and the person's stated priorities, compares only when
  both sides carry a grade, and is not allowed to cost the day an activity.
- **Ladders.** A pillar is an order, not a list. `rungFor()` returns the
  first rung not yet solid and never one above it. Work is encoded with three
  variants, because half this audience does not set its own hours.
- **The week has a shape.** The Plan tab opens with what the week is *for*
  rather than seven days stacked. Four states, none of which tells anybody
  off.

They compose into the layer the review asked for, which is the next item.

---

## Wave 0 — before release. Small, safe, over the air.

Cheap, high-value, and none of it waits on anything.

| # | Change | Why | Effort |
|---|---|---|---|
| 1 | Put the current action above the learning and insight cards on Today; collapse the analysis under one line | The first screen should answer "what now?" before "what has the system learned?" | Low |
| 2 | Evidence grade above communicator names on library cards | The present order says "trust these names" before "see what the evidence supports" — the exact inversion of the positioning | Low |
| 3 | Replace `15 planned` with actions *for the person*, fixed commitments shown separately | Fifteen reads as fifteen obligations when most are work | Medium |
| 4 | Rename `Done` (navigation) and `Cancel` (in a workout) | Both are controls wearing task-state labels, in a product built around completion | Low |
| 5 | Placement confirmation: "Morning light added at 7:25, after breakfast and before training" with **Undo** and **Why here?** | The scheduling intelligence currently has no reveal moment | Medium |
| 6 | Verify secondary-text contrast against WCAG | Stated accessibility pass; this is verification, not a known failure | Low |
| 7 | Stop asking for last night's sleep when Health has supplied it | Re-asking undercuts the claim that connected data reduces work | Medium |

**Already done:** the published counts (204 / 182 / 212) were wrong everywhere
and are corrected, with a test pinning them.

## Wave 1 — merge the research. The gate for everything after it.

113 candidates, taking the library from 204 to ~317. This is a reviewed merge,
not a paste, and it unblocks the ladders (69 of the 94 rungs are dormant
without it), the time-back surface and the one-thing selector.

Per pillar, in reviewed batches — recovery and money first, since both already
have a `REVIEW.md`:

1. Grades sanity-checked. The rounds volunteered that their Bs could come down
   and none should go up.
2. The conditional-schedule defect class: no card that reads "after a
   competition" may be scheduled every Saturday.
3. The attribution audit's fixes — four untraced credits, four researchers
   credited for work the card does not cite.
4. The three live-library items: the card resting on a retracted paper, the
   six single-attribution cards, and `meditation-10`'s seven-word safety line.

## Wave 2 — the commitment budget. The one that changes the product.

The review's strongest idea, and the top layer over the three pieces already
built.

The app should not maximise scheduled practices. It should maximise **the
number of worthwhile changes that survive contact with a real week.**

After onboarding: one anchor change tied to the outcome that matters most, one
supporting action that makes the anchor easier, and existing habits shown as
*recognised* rather than newly assigned. Everything else is held back.

| State | Trigger | Behaviour |
|---|---|---|
| Start | New user | One anchor, one support |
| Stable | Completing, load manageable | Offer one addition |
| Strained | Frequent moves or skips, short sleep | Keep the anchor; shorten the rest |
| Disrupted | Minimum mode, or a big schedule change | Minimum viable week, nothing new |
| Return | Meaningful absence | No backlog. Ask what changed. Rebuild from one anchor |

This is where evidence grade, adherence, learned durations, the ladder rung
and the week shape stop being five features and become one decision.

**Start with one coach** belongs here, not as a separate change: the budget is
what makes a single starting coach coherent rather than a crippled version.

## Wave 3 — the two structural gaps

**Return after absence.** The app has no answer to "I disappeared for three
weeks", and old plans plus a backlog are actively harmful on return. Clear
missed items, never show debt, ask what changed, rebuild from one anchor.

**A roster surface.** The largest week-shape gap. The scheduler already
handles nights crossing midnight, but there is no way to *enter* a changing
roster — so a nurse would rebuild the week by hand, and the advantage
collapses under maintenance. Duplicate a rotation, paste or import events,
anchor practices to wake and shift rather than the clock.

Calendar import may need native permissions, which would mean **a new build
rather than an over-the-air update.** Everything else in this document is
JavaScript.

## Wave 4 — deepen the moat

The time-back surface in the weekly review ("one thing you can stop this
week", with the citation and the minutes saved), evidence passports with
regrade history, personal response shown *beside* rather than inside the
grade, and time-boxed experiments for lower-confidence practices.

---

## Where I disagree with the review

**The free-tier restructure.** It proposes one complete coach, one goal and a
two-practice cap as the free tier. It also says plainly it could not see the
paywall, the price or the upgrade screens. That is a monetisation decision
Isaac has already made deliberately, and it should not be re-opened on a
review that could not assess it. The *diagnosis* underneath it is worth
keeping: free should demonstrate the core magic — a practice fitted into a
real week and adjusted — rather than a library card.

**"D and E practices require explicit opt-in, a reason for testing and a
review date."** This cuts against a decision Isaac made explicitly. Expectancy
is a real mechanism; a low-grade but harmless practice somebody finds
meaningful has genuine value, and asking them to justify it is the harsh
framing we corrected out of the research contract. Take the commitment budget
and drop this clause. A budget that limits *how many* new things run at once
already does the useful half without lecturing anyone.

**Streaks.** The review says avoid them and it is right, but the reasoning
matters: the objection is not to consistency, it is to one disrupted day
reading as failure. Consistency around a declared anchor is worth showing.

## Decisions only Isaac can make

1. **The App Store description.** It currently understates the library. Metadata
   on a version in review may need the version pulled to edit — worth checking
   before touching, and it can safely wait for the next submission.
2. **Free tier**: leave as decided, or take the review's structure.
3. **Roster import**: worth a new build cycle, or hold for after launch?
4. **Merge batching**: all nine pillars at once, or two at a time with a check
   in between?

## What I would not do

Not because they are wrong, but because they are unknowable without users:
badges, daily readiness scores compressing context into a number, notifications
whose only purpose is re-entry, and a weekly "new protocols" drop — which would
recreate the information pile the product exists to solve.

## Order

Wave 0 now, in parallel with Wave 1. Wave 2 once the merge lands, because the
budget wants the full library to choose from. Wave 3 after that, with the
roster decision made before the next build. Wave 4 when there are real users
to aim it at.
