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

> ✅ **The 17:15 defence is built**, on both channels.
> `features/coaches/interrupt.ts` asks it in-app inside the family window;
> `features/coaches/reach.ts` sends it as a local notification 45 minutes
> out, from Bo, through the existing cap and quiet hours. Answering "20
> minutes later" moves the block and writes the sentence — *"Running about
> 20 minutes late — see you at 6:20pm."* — which the OS share sheet sends,
> so nothing about the evening reaches a server.
>
> Two defects only a browser found. Recording an interruption changed the
> log the computation read, which produced the next interruption, which
> the effect presented — so a day with three things to say walked through
> all three, marked each seen, and showed only the last. The 17:15 was
> being spent to deliver a protocol suggestion. And answering re-rendered
> the question against the block it had just moved, so a message reading
> "see you at 6:20" sat under "shall I move it to 6:40?".
>
> **Still to do here:** name the children (the data model stores one
> Person called "The kids" and a count), rotate the one-on-ones, and the
> Sunday ledger.

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

> ✅ **All three wiring fixes are in, and the third turned out to be
> forty-five protocols rather than one.**
>
> `direct-reports` is deleted. It wrote its answer to `directs` while the
> work path reads `answers.team` — where the same question already lives
> as an option — so the app asked twice and read the other copy. A
> question that changes nothing is worse than a missing one: it spends the
> only thing the intake has.
>
> The **decision journal** is built. Grade B, Tetlock and Duke, the
> strongest thing in the work library, and `build()` had never added it.
> Cadence comes from `decisionLoad`, which the question engine asked and
> nothing read: most days gets Wednesday and Friday, most weeks gets
> Friday, a few times a year gets nothing rather than a standing slot it
> will delete.
>
> **The 09:15 was not one protocol.** Counting every practice that happens
> DURING work found 45, of which 38 were pinned to a clock time — and
> every one of those times is a nine-to-five assumption. `shutdown-ritual`
> had already been fixed once, for exactly this, and the pattern was never
> generalised. A new `workStart` anchor kind now carries all of them,
> five that genuinely close a day or a week anchor to work end instead,
> and the exemption is `timeAnchored`, which already means "the hour is
> part of what this IS" — a nap at three in the morning on a night shift
> is about the body clock, and avoiding the heat of the day is about the
> heat of the day.
>
> Fixing one of forty-five would have been the work coach looking tidy
> while the library kept handing shift workers a thinking block in the
> middle of their sleep.

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

> ✅ **Built.** `features/money/year.ts`, four new intake questions
> (`homeLoan`, `superAccounts`, `helpDebt`, `incomeShape`), and the year
> lands on the goal as dated milestones so it is part of the built
> programme rather than a second list beside it.
>
> The reason the content was orphaned turns out to be structural: almost
> none of it is weekly. A super review is a July job, HELP is indexed on
> the first of June, a refund is decided in May before it is spent in
> August — and a routine with `days: Weekday[]` cannot express any of
> that. The only shelf the coach had was the wrong shape.
>
> Everything is pinned to the Australian tax year, nothing connects to a
> bank, and every entry names the person's own answer back rather than
> reading as a generic chore list. A renter on a salary with no HELP gets
> a short year; the app does not pad it out.
>
> ✅ **The uncited 15% is gone.** `assessMoney` called anything at or above
> fifteen per cent "a strong rate" — a threshold with no citation, applied
> to one month, by software saying on the same screen that the trend over
> a quarter does the motivating rather than any one month. There is also
> no defensible number to put there: the right rate depends on age,
> income, debt, dependants and what the money is for, which belongs to the
> person or a licensed adviser and never to a constant in a file. The
> trend keeps its verdict; a single month is reported and not graded.
>
> **The regulatory line is untouched and still flagged.** Every money-year
> entry is a prompt to check, decide or ask — never what to hold, how much
> to contribute or which product to use, and there is a test that keeps it
> that way. The existing `insights` line about investing "the boring way"
> is the risk named in this file and it still needs a lawyer.

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
- ✅ **The type scale is rebuilt.** It ran 34/26/18/16/15/14/12, where the
  bottom four steps were ratios of 1.125, 1.07 and 1.07 — seven names for
  about four sizes. It is now 36/28/21/17/14 plus a 12pt uppercase
  eyebrow, every step at least a fifth apart, with a test that holds the
  gaps. **`secondary` became body size in the quieter colour**, which is
  what it always was: the colour had already made the distinction and one
  point of size was a second signal for it. The 14pt reading floor from
  `docs/MARKETS.md` is what shapes the whole thing — with a floor there
  and a ceiling near 36, six even steps would need a ratio of 1.17, which
  is the same invisible difference in a new suit. Five sizes, not seven.
- ✅ **Tabular numerals**, on a `numeric` prop, used by the two review
  grids and every column of times.
- ✅ **`Fonts` is used.** It sat in `theme.ts` unreferenced since it was
  written, so the web preview rendered in whatever the browser chose.
- **`display` (34pt) is rendered inside cards** — the largest type on
  Today was the empty state.

---

## 9. Order

**Now** — ✅ Now reduced to one job (the one restructure item everyone
kept); ✅ number-and-date question; ✅ tab bar 44pt + icons; ✅ type scale.

> **Today, done.** `features/today/attention.ts` arbitrates the eleven
> blocks that could render at once. At most one, ever, ranked
> time-critical before routine and "the app doing its job" before "the app
> asking for something" — which puts the Plus nudge mid-table rather than
> at the top of the screen, where it used to talk over somebody coming
> back after a fortnight away. Whatever loses says so once, in a caption,
> rather than being swallowed.
>
> Three things left Today entirely. The week's momentum line went to the
> Week tab, where a person looking for it would think to look. The
> "Earlier today" ledger went to the end-of-day review, which does the
> whole day in three taps rather than repeating the rows one at a time.
> The 56-chip habit wall became what the review's `+` column opens.
>
> A structural test now fails the build if an arbitrated block is added
> back ungated, which is exactly how the screen got to eleven.

✅ **The two reviews, redesigned off the sketch.** Isaac: *"Don't rely on
my sketch, put a design lens that was conceptual only."* Both screens had
been built by rendering a layout, and both had a concept problem no
amount of layout could fix.

End of Day was re-asking questions it had the answers to — Today marks
items as they happen — so it now leads with the day told back in its own
titles, asks only about `unresolvedRows` (usually one thing, often
nothing), and ends on tomorrow. On a day kept up with it is two sentences
and a button.

End of Week was making the person do analysis the app had already done:
`deadSlots` knows "6am Tuesday died twice" before a cell renders, and
that sentence was below the grid, the legend and the count. It now leads
with the finding, puts the decision under it, and drops the grid to
*"where that came from"* with the cells the finding was read off ringed.
The full reasoning for both is in `REDESIGN.md` §5.

✅ **Evidence is a barometer — some practices carry no grade.** Isaac:
*"There are things that are not plausible to study but constitute a well
balanced life... date nights, creating family holidays, activities with
family, activities with friends. This is about balance. Not measurable
science."* A protocol now declares its `basis`; a `balance` one publishes
no letter, because a weekly hour with your partner is not an unproven
treatment. It also unblocked the thin coaches: suggestions were gated at
grade C, so the family coach had eight eligible practices to health's
hundred and thirty, and my earlier diagnosis — "those shelves need more
graded practices" — was wrong. They needed the right kind of reason. Two
rungs Isaac named and the library lacked were added: the fortnightly
evening that is the two of you, and the half hour that makes the next
family trip exist. Full reasoning in `DECISIONS.md` ADR-018.

**Then** — ✅ the three coach rebuilds above, cheapest-first: family's
17:15 defence, work's wiring fixes (`decisionLoad` → decision journal,
delete `direct-reports`, stop asserting 09:15), money's `goalDomains`
routing.

---

## 10. The four stranded modules — all four resolved

The reachability test's own list is empty, and what each one needed turned
out to be different, which is why a blanket "wire it up" would have
produced four bad answers.

**`dailyAsk.ts` — wired**, and the thing underneath was worse than an
unwired module. `recordSleepNight` was in the store and nothing called
that either, so there was no way for anybody without a watch to enter a
bed time — and sleep REGULARITY, the strongest sleep predictor in the
instrument (Windred and colleagues beat duration with it across 60,977
people), could never populate. `DailyAsk` now takes the two clock times as
two taps, on half-hour chips centred on the person's own stated window,
because a numeric field at seven in the morning is four taps and a
mistyped colon. It sits in the attention arbiter above the goal check-in:
a bed time not given this morning is gone, where a check-in answered
tomorrow means the same thing.

**`stress.ts` — wired** to the markers card, behind "Why stress and sleep
quality are not in this", which is where somebody asking the question is
standing. It was always a decision document; it needed a reader, not a
caller. The reasoning it carries is worth reading: the one strong finding
about stress — that high stress *plus believing stress is harming you*
carries the risk, and high stress without that belief carries none — is
deliberately not used, because the sentence it produces is "your belief
that stress is hurting you is the part that is hurting you", and there is
no framing that makes that safe to say to somebody under real pressure.

**Calendar — given the surface it should have had.** Settings now says
plainly that this build cannot see a diary, and what that costs: a meeting
at noon will not move your session. The EventKit implementation is a
native milestone and a native dependency whose OTA-fingerprint cost is
Isaac's call; until then the seam is honest rather than silent.

**`location.ts` — deleted**, per ADR-017. It was an interface with a Null
implementation, no native implementation and no consumer, and the reach
test's own note read "Undecided for 1.0. If it is out, delete it." The
privacy stance it encoded is recorded in the decision log, which is where
a design with no implementation belongs. `expo-location` is a native
dependency and background location is among the heaviest permissions in
App Review — a poor trade to power a confirmation prompt the design
correctly insisted must never complete anything by itself.

**Then** — the weekly review shedding on observed non-completion (§4);
sharing (§7); the blood panel.

**Standing** — the reach test is green; keep it that way. Capture
screenshots at more than one time of day: a 21:07 run hid the 7am bug
Isaac found in one glance on his own phone.
