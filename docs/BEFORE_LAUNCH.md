# Before launch

The single working document. Replaces `LAUNCH_BRIEF.md`, `SIX_MONTHS.md`,
`THE_OPERATOR.md` and `THE_PANEL.md`, and folds in the three coach
reviews. If something is worth keeping it is here; if it was worth writing
and not keeping, it is gone.

**Status:** pre-launch. No users yet, by design — nothing below is a
retention metric, it is all "does this work before anyone sees it".

**The user:** ambitious, busy professional. Time-poor, loves optimising,
already has a brutal calendar, gives the app about four seconds at a time.

---

## 1. The pattern underneath most of it

**This codebase converts problems into prose.** It meets a limitation,
writes an excellent comment about it, commits the comment, and leaves the
limitation. Seven verified instances; the sharpest two:

- `essential8.ts` said BMI "says nothing about one person's build, and a
  heavily muscled person will score below where their health sits" — and
  then scored Isaac, at 11% body fat, at 70 and offered it as a weak
  component.
- `howTo.ts` holds 22 how-tos written because the library "leaves you at
  the hardest moment: the first attempt". It reaches the library screen
  and not the moment.

2,474 tests pass because **they test the reasoning, not the reach.** A test
asserting `asksFor()` returns the right questions passes forever while no
screen calls it.

**Guard shipped:** `src/__tests__/reach.test.ts` walks the import graph
from `src/app` and fails on anything no screen reaches. Four known strays
are an explicit baseline enforced both ways — a new one fails immediately,
and fixing one without deleting its line fails too.

---

## 2. Fixed this week

| | |
|---|---|
| **Body-mass misread** | Body fat read from HealthKit and enterable. `bmiMisread()` flags BMI on two published routes; a flagged component keeps its score but stops being a finding — out of the composite, never the biggest gap, counted as unread by `pace.ts` so the interval widens. |
| **The day-one "Low"** | Progress told a brand-new user their cardiovascular health was Low, from one component, under the AHA's name. Band withheld below four readable components. |
| **Sauna doubling** | `logCompletedActivity` always appended. Tapping "Sauna" with one scheduled gave two blocks and left the routine reading as never done. Now completes the existing item. Fixed at the store so `logCardio` gets it too. |
| **Family Saturday tripling** | Same root cause: `routineKey` returns null for an untagged routine, and null means "never collides". Three Saturday-morning family blocks could ship. Tagged, and the tailored block now replaces the generic one. |
| **Weekly drinking/vaping** | Was impossible — one occasion at a time behind two pickers. Now one number, once a week, against the guideline only. Maps onto the published bands, so it replaces the stale onboarding guess in `pace.ts`. |
| **"Day complete" while unanswered** | Said "Day complete — 0 of 1 done" above a section asking about that very item. |
| **"Earlier — did it happen?" at 7am** | A 6:40 habit was a matter of record by 6:51, with a Start button under it. Now a one-hour grace: **Still open**, then the ledger. |
| **Priorities that built nothing** | Rank Family #1, get a week with no family in it, because `household` was deferred to a coach you may never open. `core` is now a predicate: a stated priority pulls its own question into the spine. |
| **The day-one paywall** | "YOUR COACHES BUILT 1 SESSION FOR TODAY" over a locked card. One coach now runs free forever, chosen by top priority. |

---

## 3. Ten lives, six months

`sim/__tests__/scenarios.test.ts`. Ten personas through the real engine
for 26 weeks. **Zero errors, zero overlaps, zero contract violations.**

The cohort had been five personas who are all one person — working adult,
partnered, nine-to-five, under forty-five, and **not one answers
`weekShape`**, a core question with six values. Five added at weight 0:
night-shift nurse, 75-year-old, student, recovery-first, marathoner.

`runUser` was dropping `pathStarts`, so every cohort number ever produced
measured the product with **three of seven coaches switched off.** With the
ablation now possible:

**The coaches add a median +32% in things completed per week** (+6% to
+184%). Two results decide the strategy:

- **+184%** — the marathoner. One hard number, one date. Nothing feels
  like admin.
- **+6%** — the entrepreneur, *closest to the target user*, because he was
  already doing everything. The app is a mirror to him.
- **0%** — the night-shift nurse. 3.7 completions a week with coaches off,
  3.7 with all seven on. 59 unplaced items. Her `weekShape: 'shift'`
  answer changes nothing, and **none of the five sleep options describes a
  night shift.**
- **27%** — health_rebuilder, after six months. Handed 17.7 a week,
  finishes 4.7.

---

## 4. Plan volume: four attempts, one revert

The capacity dial is the answer to a bad quarter. Making it real failed
three times and the results are in `features/planner/load.ts`:

1. `reservedFreeFraction` (the only lever capacity had): **19 items at
   minimal, 19 at steady, 19 at push.** It only bites on an over-full day.
2. Drop every `could` routine: 19→11, and she got **worse** — 4.7 done
   became 2.5, rate 27%→20%. Tier is how defensible a practice is, not a
   prediction of what someone will do.
3. Cap days per routine: week got **bigger** (17.7→22.2). A cap the
   scheduler routes around is not a cap.
4. Cap items per day: worked for her (27%→31%) but took the nurse 35%→15%
   and broke the completion floor. **Reverted.**

**Shipped:** the pruner now counts untouched items. It only ever saw
`completed || skipped`, and the person drowning never taps skip.

**The real fix, not yet done:** volume is set by how many days each routine
runs, decided once at signup. Making the gear real means changing what the
weekly review may do — shed on observed non-completion rather than shrink
durations.

---

## 5. Where the reviewers disagreed

Seven independent briefs, same 26 screenshots, no shared answers.

**Restructure vs ship.** `THE_OPERATOR`'s four-tab proposal (Now · Week ·
Log · Signal) was **rejected by both the CEO and the PM**: *"the right
diagnosis and the wrong order — it rebuilds navigation for users you do
not have."* Both keep exactly one item: Now reduced to one job. That
dissent is better argued than the original.

**Markers.** CEO: the only defensible asset, and it is compiled out of
every production build — *"you are charging for the scheduling, which is
the commodity, and giving away the measurement, which is the moat."* PM:
liability now, asset at month 12 — on day one it reads 6 of 10, needs an
age captured as a decade bucket, and the *rate* needs a series nobody has.

**Seven coaches.** PM: cut to three. Research: breadth is the unoccupied
position — *"everyone else sells you a number; nobody schedules the
response into Tuesday."*

---

## 6. The three weak coaches — keep, but change

### Family
Produces a device-free dinner (the best item — it re-labels time already
spent and is charged at zero), a date night, and **three Saturday
outings** (fixed). `one-on-one-child` is the right practice on the wrong
data model: the app stores one Person called "The kids" and a count, so it
cannot name a child or rotate. And the coach's loudest promise — *"time
genuinely protected against work"* — has no mechanism: `Routine.protected`
is read in exactly one place, to exclude it from trimming.

**The job is not more family time.** It is: stop the 17:50 collision when
work runs over; make invisible load movable; convert guilt into evidence.

**Build:** a 17:15 notification — *"Dinner in 45. Making it, or shall I
say 20 late?"* Two taps, pre-written text via `shareText`. That is the
coach's actual product. Plus: name the children, rotate the one-on-ones,
and a Sunday ledger with counts and no score.

**Never:** streaks or percentages on family, comparison between children,
any causal claim about child outcomes, or treating a cancelled family item
as failure.

### Work
Produces a **grade-D** `deep-work` block at a fixed 09:15 with an invented
rationale (*"one protected morning block routinely outproduces a scattered
afternoon"* — no such study) attributed to Tim Ferriss; a target from
hand-picked constants (`BASE_HOURS` maker 12 / mixed 9 / manager 5) with
no citation; and a four-week theme arc. `energy.ts` explicitly excludes
`deep-work` from placement, so the chronotype model never touches the one
block it should. **The block is a picture of a block.**

`directs` duplicates `team` — the app asks the same question twice and
reads the other copy. The decision journal *does* exist, grade B,
Tetlock/Duke — and `build()` never adds it.

**What an app knows that Newport's reader cannot:** his own compliance by
cause (*"meetings ate it 9 weeks running — stop defending Tuesday"*), and
cross-domain n-of-1 correlation — focus quality against his own sleep and
alcohol. That is the app's only true monopoly and it needs no calendar.

**The rule:** without calendar access the coach never asserts a time it did
not get from the user.

### Money
`moneySteps` and `savingsPlan` are real and load-bearing. The headline —
*"Share of income kept last month"* — is **hand-typed**, shows "—"
indefinitely, and `assessMoney` then grades that guess against an uncited
15% threshold. Cut it.

**The finding that matters most:** ~40 finance protocols exist (offset
linkage, super settings, HELP timing, refund pre-commitment) and
`goalDomains` **is read by nothing outside a test.** The best money content
is written, cited, and orphaned — and intake never asks about a mortgage,
offset, super or HELP, so it could not be targeted anyway.

**Build:** "Your money year" — a dated decision list needing no bank feed.
Four intake taps switch it on. Week 1's job for a mortgage holder is
checking the offset is actually linked: two minutes, plausibly four
figures.

**Regulatory, flagged and needing a lawyer, not me:** in Australia
*general* advice is also licensed; "education, never financial advice" is
not a safe harbour. The line *"the boring way works: low cost, spread
wide, every month, untouched"*, delivered inside a list built from the
person's own answers, is the sharpest risk in the file.

---

## 7. Sharing: there is none

Verified: **one** share surface exists — `PaceCard` → `paceShareText` —
and it sits inside the markers flag, which is **off in every production
build.** So the shipping app cannot share anything.

`shareWeekText` and `buildTogetherWeek` in `features/household/week.ts`
are written, tested, and imported by nobody — and superseded by
`householdWeek.ts`, which is better (it adds *who*: yours alone / the two
of you / everyone). They should be deleted, not wired.

Three things worth building, none of which breaks the no-account promise:

1. **The Sunday household send.** One tap, `shareText`, the week into
   whatever thread they already use, ending in "Anything to move?" The
   partner needs no account.
2. **An on-device image card** — the week, or the markers, rendered and
   shared by the person themselves. Virality with nothing leaving the
   phone.
3. **Encrypted export/import.** "No account" is the sellable half; "no
   backup" is the half that writes a one-star review when a phone dies.

---

## 8. Verified design defects

- **Tab bar targets are ~29pt** (`paddingVertical: Spacing.xs` = 4, plus a
  21pt line) against Apple's 44pt minimum — on the most-touched control in
  the app. `chip.tsx` has a comment defending 44pt; the tab bar ignores it.
- **No usable type scale.** 34/26/18/16/15/14/12 — the bottom four steps
  are ratios of 1.125, 1.07, 1.07. `secondary` vs `body` exists in code
  and not in the eye.
- **No tabular numerals anywhere**, so times do not align in their column.
- **`Fonts` is defined in `theme.ts` and never used.**
- **`display` (34pt) is rendered inside cards** — the largest type on
  Today was the empty state.

---

## 9. Order

**Now** — Now reduced to one job (the one restructure item everyone kept);
number-and-date question; tab bar 44pt + icons; type scale.

**Then** — the three coach rebuilds above, cheapest-first: family's 17:15
defence, work's wiring fixes (`decisionLoad` → decision journal, delete
`direct-reports`, stop asserting 09:15), money's `goalDomains` routing.

**Then** — the weekly review shedding on observed non-completion (§4);
sharing (§7); the blood panel.

**Standing** — the reach test is green; keep it that way. Capture
screenshots at more than one time of day: a 21:07 run hid the 7am bug
Isaac found in one glance on his own phone.
