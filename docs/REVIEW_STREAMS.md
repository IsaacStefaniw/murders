# Review streams

The standing board. `docs/OPERATING_MODEL.md` describes the machine; this is
what the machine produces. It is appended to, never rewritten: each round
adds its own section and the old rounds stay, so that a finding raised
twice is visibly a finding raised twice, and a thing that died stays dead.

**The method.** Specialist streams read the codebase in parallel, each
with one question and no brief to be fair to the others. Every finding a
stream produced was then attacked by three independent verifiers working
from the code itself — a **code lens** (are the file facts true at this
commit), a **consequence lens** (does a real person's week change, or only
a screen), and a **house-rules lens** (does the fix make the app naggier,
score somebody, overclaim evidence, or add first-run weight). A finding
survives on two of three. Survivors keep their verifiers' corrections
attached, because the corrections are usually where the actual fix is: in
this round the verifiers cut the scope of nine of the fifteen survivors
and cut the price of four of them to near zero.

**How to read the board.** It is ranked across all streams by *would this
change a life* multiplied by *how cheap is it*, best first. It is not
grouped by stream and it is not grouped by severity — a cheap honesty fix
outranks an expensive one that matters more, because the point of the
ranking is what to pick up on Monday. The stream is a tag, not a section.

---

# Round 1 — 17 September 2026

Seven streams: behaviour-change, first-week, clinical-safety,
capture-honesty, lapse-loop, intervention-surface, competitive-delta.
Fifteen findings survived verification; sixteen died.

Two patterns worth naming before the list.

**Five of the fifteen are `BEFORE_LAUNCH.md` §1 again** — a field is
captured, stored, typed, tested, and read by nothing. `gotInTheWay`, the
week ritual's `blocked`, the month ritual's `known`, `BehaviourEvent.size`,
and `Goal.why` for every goal the app builds itself. The guard shipped in
§1 (`src/__tests__/reach.test.ts`) walks the import graph from `src/app`
and catches unreachable *modules*. It does not catch a reachable module
writing a field nothing reads. That is the next guard.

**The whole lapse-loop stream died on a stale read.** Five findings, all
refuted, all because the reviewers read `git show HEAD:` rather than the
working tree, and so missed `src/app/moment/[eventId].tsx` and
`src/features/moments/aftermath.ts` — untracked at the time, and the
answer to most of what that stream raised. Round 2 reads the tree.

---

## The board

### 1. Review the week that finished, not the one in progress

**Stream:** capture-honesty · **Effort:** hours

**Claim.** `WeeklyReviewPanel` analyses the week the person is standing
in, while the module it feeds treats any item still `planned` as a thing
that did not happen — so every unlived day of the current week counts as a
miss, and the panel then offers to deactivate or shrink the routine
responsible.

**Evidence.** `src/features/review/WeeklyReviewPanel.tsx:46` takes
`weekStartOf(todayKey())`; `src/features/review/weeklyChanges.ts:71-96`
states and relies on "the week being reviewed is over"; future days exist
because `src/app/(tabs)/today.tsx:132` pre-generates seven days forward;
applying is destructive at `src/state/store.ts:2428-2453`. The sibling
implementation already has the guard —
`src/features/review/weekReview.ts:155` `if (date > today) return 'ahead'`.

**What it costs today.** A person taps "Review my week" on a Monday
having done one of twenty-three blocks. The app says "Strength kept not
happening", offers "Shrink strength to 25 minutes", and they tap Apply
because it sounds like the app understands them. It has shortened a
practice on the evidence of Wednesday through Sunday. Repeat it weekly and
a committed person is talked down to a smaller life by arithmetic on the
future. It is the only finding on this board where the app's own action
removes something.

**Fix.** The minimal version is the right one. Give `buildWeeklyChanges` a
`today` argument and drop items dated on or after it before building
`resolved` (`weeklyChanges.ts:73`), mirroring `weekReview.ts:155`. Pass
`todayKey()` from the panel and `date` from `src/features/sim/engine.ts:446`
— the sim's window is already entirely past, so that call is a no-op there
and the `BEFORE_LAUNCH` §4 calibration is untouched. Use `>= today`, not
`> today`: a 9am review would otherwise shorten a practice on tonight's
untouched block. Do **not** also re-base the panel on `reviewPeriod`'s
`{from, to}` unless `computeWeeklyStats` and the "This week" heading move
in the same change, or the panel will narrate one seven days and count
another. `computeWeeklyStats` itself is not miscounting — it already
excludes `planned` — so the percentage line is finding 9's problem, not
this one's. Test: a Monday review with six untouched future days produces
zero changes.

---

### 2. Make sure something actually runs on day one

**Stream:** first-week · **Effort:** hours

**Claim.** `startingSet()` picks the anchor and support by tier and
duration with no knowledge of which coach runs free; plan-review switches
everything else off; `runningRoutines()` then keeps only routines in
`freeCoachArea(priorities)`. For several common priority orders the
intersection is empty and nothing runs at all.

**Evidence.** `src/features/budget/commitment.ts:231-239` (no entitlement
input); `src/app/plan-review.tsx:60,76` (`active: false`);
`src/state/store.ts:1039` and `src/features/plus/entitlement.ts:245`.
Verified by running the real modules end to end: for priorities
`['work','health','family']` with no ambition, RUNS FREE on Monday is `[]`
and `LockedSessions` shows the two held routines. `docs/BEFORE_LAUNCH.md:53`
records this as fixed — "One coach now runs free forever, chosen by top
priority" — and for the stated core user it is not.

**What it costs today.** The person ranks Work first, answers
thirty-five questions, taps Approve, and Today says "An open day." above
"2 more sessions from your other coaches" and a "Run every coach with
Plus" button. The app asked for ten minutes of their life, showed them
nothing it would do with it, and then a price. Verification widened this:
it is not only day one. Where the free area has no routine at all, nothing
runs free for as long as the person stays free, because `runningRoutines`
filters by area and the plan-review switches cannot change that. Confirmed
empty for work-first without an ambition, relationship-first always,
admin-first always. `established === true` routines are held by
`startingSet` too, so the printed "the habits you already have are free"
promise fails the same way and silently.

**Fix.** Two halves, and the load-bearing one is the first. (a)
`freeCoachArea` must fall through to the first ranked area that actually
has a routine — but not as an optional second argument, because there are
four call sites and any that omits it returns a different area, so the
Coaches tab would advertise one free coach while Today ran another. Derive
the area once from `profile.priorities` plus the built routines in the
store and have every screen read that single value. (b) `startingSet`
takes the free area and guarantees the **support** slot is a routine that
satisfies `isAlwaysFreeRoutine`; the support is already defined as small
and near-daily, so a free-area short daily routine fits its own rule and
the anchor stays the most important thing the person said. The comment to
write is "the thing you start should touch the area you ranked first",
never "the thing you start should be the billable one". Stop holding
`established` routines at all. `commitment.test.ts:183-202` passes no free
area and must keep today's behaviour. Test: walk
`buildLifeOperatingPlan → startingSet → runningRoutines` for all seven
priority orders, with and without an ambition, and assert at least one
routine runs free on each of the first seven days — the existing
integration harness never calls `startingSet`, which is why nothing caught
this.

---

### 3. Hold the interview answers on disk

**Stream:** first-week · **Effort:** hours

**Claim.** The onboarding store is plain zustand with no `persist`, and
the interview's position is component state, so every answer is lost if
the app is killed or reloaded mid-setup; `index.tsx` then routes back to
`/welcome` and setup restarts at question one.

**Evidence.** `src/features/onboarding/state.ts:5-16` ("Transient
interview state"), against `src/state/store.ts:917` and `:2521` which do
persist; `src/app/interview.tsx:48` `useState(0)`; `src/app/index.tsx:20`.
Measured with `setupSteps()`: 35 steps for an employed, partnered user, 18
of them carrying a reveal that needs a second tap, 7 typed answers.

**What it costs today.** Somebody starts setup on the train, or decides
to finish it tonight, and the app is terminated in between. They reopen it
to the welcome screen and are asked their name again. Nobody answers
thirty-five questions twice. That person is gone before the product has
said a single thing to them, and nothing in the app knows it happened.

**Fix.** Wrap `useOnboardingStore` in `persist` with AsyncStorage under
its own key (`intentnorth.onboarding`, outside the backup/restore path),
storing `answers` and `stepIndex`; seed `useState` from it and write it in
`goTo`. Clear it explicitly with `persist.clearStorage()` on the
`resetOnboarding()` call in `plan-review.tsx:81`, and drop a draft older
than about thirty days on read — the draft holds `drinkingBand`,
`smokingStatus`, `mind`, `weight` and `sexAtBirth`, and a setup that is
never finished should not leave that on disk forever. Do **not** redirect
`index.tsx` to `/interview`: welcome is the only route to "Restore a
backup" and "See an example day first", and auto-forwarding traps a
returning user inside a half-finished interview whose `back()` at step 0
calls `router.back()` on a fresh stack. Instead let the draft change the
offer — primary button reads "Pick up where you left off", a quiet ghost
"Start fresh" clears it — and open the interview on a plain line,
"Picking up where you left off, {name}.", with no elapsed-time guilt.

---

### 4. Stop scoring a BMI of 16 at a hundred out of a hundred

**Stream:** clinical-safety · **Effort:** hours

**Claim.** `bmiScore` returns 100 for every BMI below 25, and
`bmiMisread` — the function written to catch BMI measuring the wrong thing
for a person — returns null immediately below 25. Every guard in the
health instrument runs one way: it protects the muscular person scored as
overweight and has nothing for the underweight person scored as flawless.

**Evidence.** `src/features/health/essential8.ts:158-164` and `:246`; the
component at `:599-611` renders `detail: bmi.toFixed(1)` with a `why` that
discusses only the opposite error. It ships unflagged —
`src/app/(tabs)/data.tsx:152-163` renders `<WellbeingCard />` outside the
`MARKERS_ENABLED` gate. The asymmetry is in the copy too
(`src/features/health/conditioning.ts:104-105`) and in ADR-016.

**What it costs today.** The person from finding 5, eight months in at
BMI 16, opens Progress and reads "Body mass index · 15.9" scored 100 out
of 100, inside a composite the card says predicts mortality, under an
explanation reassuring her the number tends to be unkind to people like
her. Worse than the 100 itself: it is averaged into the composite, and
because `biggestGap` selects the minimum-scoring component, the card
structurally can never nominate body mass as the place with room. The app's
most authoritative screen tells her the thing hurting her is the healthiest
thing about her.

**Fix.** Do **not** make `bmiScore` return null — its signature is
`(bmi: number): number` and `src/features/health/pace.ts:407` pushes it
into a `number[]` that is then averaged, so a null becomes a silent zero;
and the AHA table genuinely does award 100 below 25, so re-scoring it is
the invented composite this module exists to refuse. Put the whole change
in `bmiMisread`: add a low branch before the existing early return, firing
on `bmi < 18.5` alone. Everything downstream is already wired — the
component renders "Not counted", `weekHealth` drops it from `counted`,
`composite` and `biggestGap`, `paceInputs.ts:87` sets `bmiMisread: true`
so `pace.ts:407` excludes it and the interval widens, and `pace.ts:621`
already appends "body mass left out, see the wellbeing card". Write the
line about the instrument, not the person, and do not claim "the published
table does not score it", which is false about the source: something in
the shape of "below the range the published thresholds were built to read,
so it is left out rather than counted as full marks", plus the GP pointer
the card already uses elsewhere. Note in the doc block that at the low end
BMI is not misreading the person the way it misreads a lifter — the
measurement is fine, the table has no floor — because that block is
currently written entirely about muscle mass. Suppress the `blocked` string
when the low branch fires; "add a body fat percentage or a waist
measurement" is the wrong prompt for this person. Leave
`essential8.test.ts:109-115` untouched. Accept that the composite falls.

---

### 5. Put a floor under the nutrition ladder, and stop the app being the one that escalates

**Stream:** clinical-safety · **Effort:** days

**Claim.** `assessNutrition` has a rate ceiling on weight loss but no
absolute floor, and its only response to a flat or rising trend on
`aim: 'weight'` is to offer the next restriction lever — at any body
weight, on a screen carrying none of the eating-disorder copy the library
wrote for this pillar, with a weigh-in instruction two to three times what
the library's own safety line permits.

**Evidence.** `src/features/nutrition/plan.ts:309-313` (the flat-trend
branch: `verdict: 'tighten'`, `advanceLever: true`); the only guard,
`MAX_LOSS_PER_WEEK_PCT`, is reachable only inside the downward branch at
`:290`, and nothing anywhere reads absolute weight or BMI.
`NutritionHub.tsx:149-155` renders the escalation as a button;
`NutritionHub.tsx:137` and `plan.ts:279` both say "two or three a week"
against `protocols.ts:2711` ("Once a week is the whole protocol... If you
have ever had an eating disorder, do not run this at all") and
`protocols.ts:2694` ("If choosing a lever turns into rules that keep
multiplying, stop and talk to your GP or a dietitian"). `protocols.ts:2674`
lists a daily weigh-in under "Deliberately NOT shipped". The nutrition
path's insights carry no safety line where the recovery path's carries one
per behaviour.

**What it costs today.** A woman picks "Lose some weight", weighs in three
times a week as instructed, loses steadily, and at some point the trend
flattens — which is what a body does. The app's answer, every three weeks,
is one more food rule. It never asks what she weighs now, never says the
word dietitian, and never offers a stopping point. Her library holds a card
saying that rules which keep multiplying are the warning sign, and nothing
on the screen she is standing on links to it. Verification narrows two
things and both should be carried: the ladder is six rungs, not infinite
(after which the message still says "time to switch on the next lever"
above a button that does nothing), and the lever is offered, not applied.
Neither changes the direction. A third fact makes it worse: `trend()` is a
first-versus-last comparison with a 0.5 kg flat band, so one heavy last
reading pushes a person who is genuinely losing into the tighten branch, on
a screen whose own copy says a heavy day is water, not truth. And the
tighten branch is the fall-through for an upward trend, so somebody who
gained is told "three weeks of readings and the trend hasn't moved".

**Fix.** In order of value per line changed. (a) Terminate the ladder:
when `leverLevel` reaches the end of `LADDER[aim]`, `advanceLever` is
false and the message hands off to `maintenance-mode`, whose copy is
already written and graded; delete the `?? 'next lever'` fallback rather
than keeping a title for a state that should not render. (b) Change who
escalates: on a flat or rising trend keep the honest message, drop
`advanceLever` to false, and move the next rung into the ladder list as
the person's own choice ("switch this on when you're ready"). That removes
the mechanism, needs no new data, and is the only version that works for
this persona, who has no height on file. (c) Use BMI and cumulative loss
only as silent suppressors where the data happens to exist — reuse
`bmiFrom()` in `summarise.ts:129`, suppress below 18.5, never display the
number or the threshold, because `one-lever-only.safety` says the app
"never sets a calorie figure, a weight to reach, or a rate to lose at" and
a visible floor is a weight to reach. (d) Fix both cadence strings to once
a week. (e) Render `protocolById('one-lever-only').safety` as one caption
under the ladder in the library's own "Where it stops · ⚠︎ …" form — once,
under the ladder, not per lever card — and give the six nutrition levers'
own protocol entries a `safety` field so the Today card carries it where
she is actually standing. (f) Add the "Food is a hard subject for me"
intake option, but say in one line what changed rather than silently
rerouting. Copy must not evaluate her body: no "the trend has come a long
way". `plan.test.ts:130-134` and `:159-160` assert the current behaviour
and are updated with it, not worked around.

---

### 6. Say what setup actually costs, on the screen that asks for it

**Stream:** first-week · **Effort:** hours

**Claim.** The first screen anyone sees promises "Twelve quick questions,
about two minutes." Setup is 35 steps with 18 extra reveal taps. The
promise is broken at question 13.

**Evidence.** `src/app/welcome.tsx:28`; the reversal is documented at
`src/features/onboarding/sections.ts:31-36` ("A thirty-question setup where
each answer changes the plan on screen beats a twelve-question one");
`src/app/interview.tsx:24`. The same stale promise is on the other entry
point, `src/app/example-day.tsx:218` ("Twelve quick questions build
yours."), directly above the "Build mine" button. `docs/DECISIONS.md:193`
ADR-015 still reads "Ten opening questions".

**What it costs today.** A busy professional budgets the two minutes they
were quoted. At minute four they are somewhere in "Health and food", and
the app has already been caught being wrong about the one thing it told
them. It is the honesty rule the library lives by, applied to the app's
own first sentence, on the longest drop-out surface in the product.

**Fix.** Rewrite both lines, and do not replace one unmeasured stopwatch
claim with another — being caught twice about the same sentence is worse
than once. Prefer what the code guarantees: "Eight sections, and you can
skip any of them. Every answer changes the plan while you watch." If a
duration is wanted, hedge it ("ten minutes or so if you answer
everything"). `PlusNudge.tsx:16` is a historical code comment, not user
copy — correct it as housekeeping, not as part of this. Add the section
counter as a visible text label beside the dots, reusing the string
already built for the progressbar `accessibilityLabel` at
`interview.tsx:142`; do not add a question counter, which `sections.ts:44`
argues against on the record, and no percentage or bar fill. Add a
superseding ADR rather than editing ADR-015, recording the measured cause
so the next round does not re-propose shortening. "Start, finish later"
belongs to finding 3, not here — until answers persist, the affordance
would lie.

---

### 7. Offer notifications once, at a moment that has earned it

**Stream:** first-week · **Effort:** hours

**Claim.** `DEFAULT_NOTIFICATION_SETTINGS.enabled` is false and
`requestNotificationPermission()` has exactly one caller — the Settings
screen's per-category toggles. Nothing in onboarding, plan-review, Today or
the check-ins ever offers it, so for every new user week one is silent and
the whole of `features/coaches/reach.ts` never fires.

**Evidence.** `src/features/notifications/schedule.ts:77-84`;
`src/app/settings.tsx:223` inside `toggleNotification` (the grep returns
settings.tsx and `lib/notifications.ts` and nothing else);
`src/features/notifications/useNotificationSync.tsx:40` returns an empty
planned list and cancels everything when `enabled` is false, so the
permission guard further down is a second wall behind the first.
`docs/BEFORE_LAUNCH.md:148-155` records the 17:15 notification as built.

**What it costs today.** Day two the person is in back-to-backs. The app
has a 45-minute warning ready that would save the family dinner and says
nothing, that day or any day that week. The gym rest-timer lock-screen
alert is silent for the same reason, and `workout.tsx:282` deliberately
says nothing about notifications on the assumption that a prompt exists
somewhere else. It does not. The ADR "notifications off by default" was a
decision about volume, not about never asking. Settings is two taps and a
scroll from the Life tab, and nothing anywhere points at it.

**Fix.** One offer, through Today's arbiter rather than beside it. Add
`'notifyOffer'` to `AttentionId` and `ATTENTION_ORDER` at or below
`'plus'` — this is the app asking for something and must never talk over
`welcomeBack`, `setupDay` or `readiness` — so the existing "at most one,
ever" rule holds. Gate availability on `defendedItems(plan).length > 0` and
name that item's own title and computed time in the copy; hardcoding
"Family dinner" promises a notification that will never arrive for anyone
whose evenings are not shaped that way. Persist the asked flag the way
`plusNudgeDismissedAt` already is, and treat Yes and No as equally spent.
Yes writes `{coach: true, enabled: true}` and nothing else — turning on
interventions, sessions or wind-down as a side effect is the volume
increase the ADR forbids. Note the existing oddity while in there:
`enabled` is derived as an OR over four category booleans that default
true, so any single chip currently switches on more than it says.

---

### 8. Offer the coach's voice where the coach is needed, not in Settings

**Stream:** competitive-delta · **Effort:** days

**Claim.** The same defect as finding 7, seen from the habit side: nothing
in the app ever manufactures the moment of opting in, so the best
just-in-time trigger anyone has built in this category never fires.

**Evidence.** As finding 7, plus `src/features/coaches/interrupt.ts:304` —
`familyInterrupt` only fires for a block 10 to 90 minutes away and
`nextInterrupt` is computed when Today mounts, so the in-app half needs the
person to open the app inside that window by chance.

**What it costs today.** A man logs four drinks. `hotWindow` finds
21:00–00:00, `interventionTime` computes 20:15, `dueInterventions` filters
it to his Thursdays and Fridays — and at 20:15 on Thursday his phone is
silent. `docs/DECISIONS.md:145` says "Permission is requested at the moment
someone opts in"; the code implements only the second half of that
sentence, so the moment never comes.

**Fix.** Build finding 7's single arbiter card and let it carry this case
too: available when `coachNotifications` returns a message **or** a
behaviour pattern has reached `readiness: 'ready'`, and
`!notifications.enabled`. Do not add a modal to `toggleBehaviour` — it sits
directly below the notification chips and already fires a safety alert, so
a second modal stacks on a safety warning to tell somebody about a control
they are looking at. The unserved moments are the two outside Settings
(`store.ts:978`, the interview's `lessOf`, and `store.ts:1994`, a recovery
path), and they are served by the Today card on a later day, never on the
intake screen. Reuse the sentence already in `settings.tsx:444` — "It stays
quiet until there is a pattern to work from" — so the offer cannot promise
a message that `MIN_EVENTS_FOR_PATTERN = 4` may never permit. **Drop** the
`DEFENDED` split from this finding: `coachNotifications` takes
`defendedItems(plan)[0]` and is capped at one per day, so adding training or
work means a 07:00 session wins the day's single coach push and the 17:15
family defence goes silent for anyone who trains in the morning. That is a
separate piece of work that has to rework the selection first.

---

### 9. Say the count and the silence, not a percentage

**Stream:** capture-honesty · **Effort:** hours

**Claim.** `WeeklyReviewPanel` renders a completion percentage one tap
after its own promise of "No scores", prints 0% for a week with no data at
all, and uses a denominator that contradicts the sentence rendered six
lines below it from the same card.

**Evidence.** `WeeklyReviewPanel.tsx:142` against `:100-102`;
`src/features/review/computeWeekly.ts:60` (`resolved.length === 0 ? 0`);
the two denominators disagree because `computeWeekly.ts:28` counts only
`completed || skipped` while `weeklyChanges.ts:74-76` counts `planned` too,
so the card can read "100% of planned activities happened" above "2 of 23
flexible activities happened". `docs/DECISIONS.md:124`: "Nothing in the
Data tab scores the person: no adherence percentage, no grade." The same
tab breaks that rule twice more at `src/app/(tabs)/data.tsx:386-392`
("Plans you kept — 84%", and a streak).

**What it costs today.** The harm runs the opposite way from the obvious
reading, and this is the part to act on: because untouched `planned` items
are excluded, a hard week where the person stopped tapping produces a
*high* percentage, up to 100%. So the number flatters, and then
`src/lib/ai/agents.ts:113-119` branches its recommendation on it. Two
numbers on one card that contradict each other is worse than either alone
— the one thing this product sells is that its record of your life is
true, and here it visibly is not.

**Fix.** The behaviour-changing half first: make `computeWeekly` use the
same definition of "did not happen" as `weeklyChanges`, one module owning
it and both reading it, so the narrative input and the "I noticed" line
cannot disagree — and scope both to `reviewPeriod`'s window so neither
grades the future (see finding 1). Return `{ completed, resolved,
unanswered }` and have `agents.ts` branch on a rate with silence in the
denominator, or refuse to recommend when `unanswered` dominates. Only then
the presentation: replace `:142` with counts and the unknown stated
separately — "4 of 9 answered things happened · 12 you didn't say either
way · 3 check-ins" — remembering that deleting that one line does not
remove the percentage from the screen, because `agents.ts:113` renders it
again inside the narrative body and `:108` feeds it to the model. For
no-data, follow the existing precedent at `report.tsx:111` and render "—".
In `dayReview.ts:205-218`, name the silence beside the total rather than
dropping untouched rows out of the denominator: the person drowning in a
plan never taps skip, and hiding those rows hides the signal the rescue
mechanism needs. Fix `data.tsx:386-392` in the same change or defer it
explicitly; the shareable summary at `cohort.ts:198` is a message to the
developers, not a verdict, and keeps its number.

---

### 10. Give a generated goal a why, from what the person already said

**Stream:** behaviour-change · **Effort:** hours

**Claim.** `buildGoalPlan` takes a `why` and writes it onto the goal, but
every call site outside the manual goal wizard passes `undefined` — all
seven coaches and both onboarding paths, including the free-text ambition
the person typed themselves.

**Evidence.** `src/features/goals/goalPlanner.ts:167-172` and `:468`; the
seven `undefined` call sites in `src/features/paths/definitions.ts` (217,
355, 514, 627, 951, 978, 1072) plus `src/features/onboarding/buildPlan.ts:630`
(no argument) and `:662` (explicit `undefined`); only
`src/features/goals/composer.ts:185` passes a real value. Three consumers,
not two: `stalled.ts:61-63`, `underserved.ts:55`, and
`src/app/session/review/[goalId].tsx:89-91`, which prints "Because:
{goal.why}" and silently renders nothing for every generated goal. The
app states the finding in its own placeholder at `src/app/goals/new.tsx:192`:
"Optional — but the goals with a why are the ones that happen."

**What it costs today.** Three weeks in, when the training goal has not
moved, `detectGoalStalled` says "Progress needs a foothold on the calendar,
not more willpower" — the same sentence for everybody — when it could have
said something in the person's own words. This is the smallest entry on the
board by surface (one caption line on two suggestion kinds plus a review
header) and it is here because the correct fix costs almost nothing.

**Fix.** Use what is already captured. `profile.lifeVision` exists, is
already shown back in the person's own quotation marks on the Coaches tab,
and is free. Fall back from `goal.why` to it in `stalled.ts` and
`underserved.ts` with attribution that stays honest about what was
actually said — "What you said you wanted: …", never "You said why this
matters: …", which belongs only to a per-goal why. Leave all seven
`definitions.ts` call sites passing `undefined`: every path intake answer
is a multiple-choice enum, so quoting one back would render `You said why
this matters: "leaner"` — a fabricated quotation in the person's voice,
worse than the generic line. Add no questions: not to the seven intakes,
not to `plan-review`, which is the one payoff moment after eight sections.
If a per-goal why is wanted later, the house pattern for it is
`DeferredQuestions` — one question, inside the coach that consumes it,
weeks in, rendering nothing once answered (note it needs a per-goal key;
`deferredSteps` is keyed to interview step ids today). The goal-detail Why
field already writes `goal.why` for any goal including path-built ones, so
the capability is not absent — only the prompt is.

---

### 11. Give the message stand-in somewhere to go

**Stream:** behaviour-change · **Effort:** days

**Claim.** `StandIn.route` is set only on `breathe` entries, so the "Urge
now" button renders a sentence and stops for every other stand-in. For the
`message` stand-in specifically, that sentence tells the person to text
someone on a screen with no way to text anyone — while the intake
explicitly offers "Messaging someone who knows" as the chosen replacement.

**Evidence.** `src/features/behaviours/tonight.ts:76-110` (`route` on 78,
93, 98, 103, 106 only; `message` with no route at `:88` and `:101`);
`TonightCard.tsx:105-108`; `src/features/knowledge/questionBank.ts:91`.
The same dead end is in `src/features/moments/aftermath.ts` `rightNow` and
`src/app/moment/[eventId].tsx`.

**What it costs today.** Scoped correctly, this is one stand-in, not five.
For `tidy`, `read`, `water` and `walk` the sentence *is* the intervention —
that is the shipped `urge-stand-in` practice, and
`tonight.test.ts:109-119` deliberately pins "only a breath has a route".
`message` is the only replacement that names an action the phone could
start and does not. It is the default for the `social` and `lowmood`
triggers, which are the two most common for this user, and it is the
explicit choice of anyone who picked it at intake. Routing also keys off
the chosen replacement, not the trigger, so anyone who picked the breath
reset is fine on all seven triggers; the gap is the message path.

**Fix.** Add optional `share?: (info: BehaviourInfo) => string` to
`StandIn` and set it on the two `message` entries plus the `message` branch
of the `standInFor` fallback. `urgeNow` shows the stand-in card as now, and
where `share` exists the card gains one secondary button — "Open your
messages" — calling `shareText`, exactly as `src/app/coach/interrupt.tsx:156`
already does. Two constraints on the default text: it must not out somebody
who has told nobody, so "You around for ten minutes?" rather than an
app-written confession about drinking, and the share sheet must place it
where the person edits before sending, never pre-addressed. Read the name
from `profile.people` (`src/types/domain.ts:62-66`, already resolved in
`household.tsx`) rather than adding a question; do **not** add one to
`RECOVERY_QUESTIONS`, which would make a deliberately short intake heavier
and ask, at setup, a question a large share of this audience answers
"nobody" to. Update `tonight.test.ts:109-119` so the invariant becomes "a
stand-in has an in-app action only where the app can perform it — a breath
has a route, a message has a share, everything else has neither", which
keeps the rule the test was protecting. Drop the second if-then field and
the tappable environment item from scope, and keep the BCT citations out of
user-facing copy: the library grades this area C and that grading should not
quietly rise because a button was added.

---

### 12. Let a logged behaviour event be removed or corrected

**Stream:** capture-honesty · **Effort:** days

**Claim.** The store exposes two appends and a trigger patch and no
delete or amend, anywhere in the app. A drink logged on the wrong day,
against the wrong intention, or twice by an impatient tap is permanent,
while every other record in the app can be undone.

**Evidence.** `src/state/store.ts:641/649/656` declare the whole surface;
implementations at `:2241`, `:2268`, `:2279`; no removal by id exists in
`src`. Everything else is correctable: `item-actions.tsx:123` "Undo",
`store.ts:1693` "a correction replaces rather than appends",
`WeeklyCountCard.tsx:67` "Change it". The only escape hatch is
`settings.tsx:484`, delete everything and start over.

**What it costs today.** Somebody sits down on Sunday to be honest about a
rough week, mis-taps, and records Saturday's drink onto Sunday. From then
on the app's picture of them is wrong in the direction of worse, they know
it is wrong, and they cannot fix it. Those events drive the intervention
time the pattern engine offers. An honest person punished for being honest
quickly stops logging, and a log nobody keeps is an adaptive engine reading
noise. Verification narrows the downstream: the markers drinking input
comes from `weeklyCounts`, which is already correctable; the uncorrectable
consequences are the pattern window, the scheduled intervention, and
`nicotineFromLogs`, where one tap sets smoking status for thirty days.

**Fix.** Add `removeBehaviourEvent(eventId)` and
`setBehaviourEventOccurredAt(eventId, occurredAt)` beside
`setBehaviourEventTrigger` — one-liners, matching `removeMetric` and
`removeWorkoutLog`. Surface them where the mistake is made, not as a
standing list: a quiet "Actually, remove that" on the final step of
`src/app/moment/[eventId].tsx`, which already holds the event id and is the
screen the person is looking at seconds after a mis-tap, and for older ones
a "Something logged wrong?" line at the foot of `BehaviourLog` revealing
this intention's last few events with "Wrong time" and "Remove this one".
Do **not** put a browsable inventory of this week's occasions behind the
count on the Life tab: a permanently visible list of slips is the nearest
thing to the daily running tally `weekly.ts` refuses, and to the
prosecution case `moment/[eventId].tsx` deliberately keeps below the
steadying line. Copy stays flat — "Remove this one", not "Delete mistake".
Do **not** leave the time chip unselected in `BehaviourLog`: that adds a
required tap to the action the app most wants frictionless and is the
closest this form would come to refusing somebody who is being honest; the
existing "Recording: Just now." line already states what is about to be
written, and a cheap correction afterwards is the right trade. Removing an
event should not cascade — leave the if-then plan it produced; it is still
a good plan. While in there: `WellbeingCard.tsx:181` should offer the
nicotine chips even when the score was derived from logs, so somebody whose
markers read "smokes now" off one tap can say what is true.

---

### 13. Make "Log another from this week" work the third time

**Stream:** capture-honesty · **Effort:** hours

**Claim.** The affordance reopens the log sheet by pushing the same deep
link every time, but the Life tab only reacts when the param value
changes, so the second and every later tap does nothing.

**Evidence.** `src/app/moment/[eventId].tsx:242-248` pushes
`/(tabs)/life?log=<same intention id>`; `src/app/(tabs)/life.tsx:92-95`
guards on `logParam !== seenParam` and nothing clears it; the tab never
unmounts because the moment screen is a modal over it
(`src/app/_layout.tsx:104`), so the push downgrades to a navigate on the
focused tab and the sheet stays closed.

**What it costs today.** Less than the finding originally claimed, and it
is on the board because the fix is one line rather than because the harm is
large. This is the code written for Isaac's own complaint — "I have drank a
few times this week and could only log yesterday" (`life.tsx:80-85`). A
person recording Wednesday, Friday and Saturday gets two through and then
taps a button that appears to do nothing. They are not blocked: the modal
dismisses onto the Life tab where the intention card's "It happened" button
opens the same sheet in one tap. But a silently dead button teaches a person
the app is broken rather than limited.

**Fix.** Appending `&n=${Date.now()}` alone does **not** work — the guard
compares `logParam`, which is unchanged. Either key the guard on the nonce,
or stop round-tripping through the URL: set a `pendingLogIntentionId` on
the on-device store and have `life.tsx` consume and clear it (clearing via
`router.setParams` naively re-fires the guard with `undefined` and closes
the sheet instantly, so the store route is safer). Better still, keep the
repeat inside `BehaviourLog` — a "Logged — add another" state that resets
the day and time chips — so somebody recording three past nights never
walks the aftermath four times. Do **not** move "Log another" onto the
`steady` step: that step is deliberately the steadying sentence, designed
so leaving early is a partial success, and a data-collection call to action
there turns a de-escalation beat into a prompt. Test that two consecutive
identical navigations both open the sheet.

---

### 14. Stop promising that naming the hard day does something

**Stream:** competitive-delta · **Effort:** hours for the honest half,
days for the rest

**Claim.** The week ritual asks "Which day is most at risk?" and the month
ritual says "Naming it now is how the plan survives it". Both answers are
stored in `RitualEntry.answers` and read by exactly one function,
`statedPurpose`, which returns `answers.for` and discards everything else.

**Evidence.** `src/features/cadence/rituals.ts:110` (`risk`), `:89`
(`known`), `:245` (`statedPurpose`); `ritualHistory` at `:248`, commented
"the record a review can read", has no caller outside its own test. There
is also nowhere to put the answer if something read it: `addPlanItem`
(`src/state/store.ts:1369-1382`) hard-codes `fixed: false` and
`tier: 'should'` and its input type has no `fixed` field at all, and the
only producer of fixed items is the work-hours block.

**What it costs today.** A woman types "Thursday — offsite in Geelong,
back 8pm", presses done, and Thursday arrives with a 6:30am strength
session, a protein anchor at lunch and date night at 7:30 still on it. The
app asked the one question that would have saved the week and then planned
as though she had said nothing, which is worse than never asking.

**Fix.** The overclaim is the part to fix now, and it is one line: the
month `known` hint and the week `risk` prompt must stop promising a
planning effect the code does not deliver. Then read the answer where the
app already reads `for` — say the named day back on that day ("You said
this was the one"), zero engine change, and the question stops being a
question into a void. Only then let it reach the plan, and as an offer with
a button rather than an effect, routed through the existing capacity gear
applied for a single day. Do **not** build the proposed `lightDays`
placement rule: `src/features/planner/load.ts:67-107` records three
attempts to make a capacity gear bite on exactly this persona, and dropping
`could` routines moved her from 4.7 things done a week to 2.5. Across
non-test source the tiers are roughly 257 `could`, 110 `should`, 8 `must`,
so "must and protected keep their slots" empties the day for a new user —
the app, told Thursday is hard, would delete the Thursday session that was
the point of the week. It would also cut the existing coping path: items
left `planned` on a blown day are offered back by the morning check-in and
carried with one tap. And do not make QuickAdd write `fixed: true` without
also fixing `reconcile.ts:50-55`, which keeps previous-day items only where
`!item.fixed`, so a fixed QuickAdd block is silently dropped the next time
anything rebuilds the day. Raising the duration chips alone is safe today.

---

### 15. Read the barrier back, or stop asking for it

**Stream:** behaviour-change · **Effort:** hours

**Claim.** The evening reflection asks "What got in the way?", saves the
answer, and no screen or engine ever reads it. Its only consumer is
`analyseReflection`, which needs a provider that is null in any on-device
build, returns a fallback that drops the text, and whose result the caller
discards anyway.

**Evidence.** `src/app/check-in/evening.tsx:35/43/75/94` capture;
`:49-51` `analyseReflection(...).catch(() => {})` with the return value
discarded in every build, configured or not; `src/lib/ai/agents.ts:87-94`
returns `themes: []`; `src/lib/ai/provider.ts:42-45`. Grepping `src`,
`gotInTheWay` appears at `src/types/domain.ts:592`, the capture screen, and
one prompt string.

**What it costs today.** Less than it looks, and the finding is on the
board at reduced severity for a reason worth recording: `/check-in/evening`
is registered at `_layout.tsx:94` and nothing navigates to it. Today pushes
`/review/day`, and `src/features/review/dayReview.ts:1-37` says outright
that it replaced the evening check-in. So the "every night for a fortnight"
story does not occur, and putting a chip row on that screen would be UI on
an unreachable route. The live equivalent is the weekly ritual's `blocked`
answer, which is asked, stored and equally unread. What is genuinely true
is the pattern: the app asks a question about barriers at the weekly
cadence and never mentions the answer again.

**Fix.** Add a reader, not a capture. In the week review, beside the
existing slot proposal, quote the person's own words back with no
interpretation — "On the two Tuesdays this died you wrote:" and then the
dated sentences. Show, do not conclude: the person makes the causal link,
the app only puts the sentence next to the cross, which is the standard
`weekReview.ts:303-309` already sets. Call the already-written
`ritualHistory('week-review', …)` and show last week's answer to "What got
in the way — once, or every time?" when this week's is asked; that is a
one-line change and delivers most of the value. Do **not** add a nightly
chip row: it is nightly friction for a signal acted on weekly, and a coded
barrier gets tallied where free text does not — "didn't feel like it × 4"
is a score of character in a house that refuses scores. If a coded barrier
is wanted later, reuse the existing `limiter` vocabulary from
`questionBank.ts:163-175` rather than inventing a second one, keep it
optional, and never ship a character attribution. Any if-then must come
through the existing own-words path (`ownWords: true`), authored by the
person — never a one-tap accept whose `if` the app inferred, and never
joining a day-level barrier to a routine-level dead slot, which asserts a
cause the app cannot know (the original proposal's own worked example
offered "when the 6pm call runs over" against a 6am session that died).

---

## What died, and why

Sixteen findings were refuted. One line each; the pattern in the first
group matters more than any of them individually.

**The lapse-loop stream (five findings) died on a stale read.** Every one
of them described `git show HEAD:src/features/behaviours/BehaviourLog.tsx`
rather than the working tree, and so missed `src/app/moment/[eventId].tsx`
and `src/features/moments/aftermath.ts` — untracked at review time, and the
implemented answer to nearly everything the stream asked for.

- **Make the "Logged" card the lapse screen** — the card it describes no
  longer exists; `submit()` routes every log to a four-step breakout that
  leads with the abstinence-violation counter, exactly as proposed.
- **Give the late-logged slip the same plan as tonight's** — the aftermath
  screen is date-agnostic and persists an if-then for a slip logged days
  later; only the "Do it now" button is withheld, deliberately, because a
  stand-in handed to somebody at midnight is the app failing to notice what
  time it is.
- **Let a lapse trigger the full-screen coach** — it already does, through
  a different and earlier channel; `coachInterrupts` is the app's-own-
  timetable channel and `breakout.tsx:47-54` says in as many words that the
  frame is never earned by the app noticing something on its own schedule.
- **Answer the morning after the slip** — the morning is answered, by the
  aftermath screen and by `tonight.ts` `nextHour`/`afterLapse`; the proposed
  lapse-triggered push would fire off a single event, taxing the one act the
  app most needs.
- **Ask what triggered it, or stop asking** — the trigger *is* captured and
  *does* pick the plan, at `moment/[eventId].tsx:151`. The one true residue
  is that `BehaviourEvent.size` is written and read by nothing.

The rest:

- **Let a new practice anchor on an existing one** — `established` is not
  decorative: `entitlement.ts:149` uses it to decide whether a routine is
  placed at all for a free user. And the app never learns *when* the
  existing habit happens, so an "after your morning walk" line would assert
  a time the person never gave it. The repo's own research gate holds the
  RCT (Keller 2021) finding no difference between routine-based and
  time-based cues.
- **Mark what somebody already does as theirs** — the flag is set in
  production at `buildPlan.ts:687-697`, in a pass deliberately placed after
  all routines are assembled, and the proposed regression test already
  exists twice.
- **Give the second named behaviour its own plan** — `TonightCard` mounts
  once and prefers the coached intention, so the described half-strength
  second card does not render; the second behaviour already gets its own
  pattern engine, window, interventions and plan. One coached behaviour is a
  stated choice ("which habit are we working on *first*").
- **Nothing reads the mood, and no screen names a service** — the screen
  that asks for the mood is unreachable; the day review replaced it and
  dropped mood on purpose. The proposed low-mood detector would read a field
  no real install ever writes. The missing always-available support route is
  real and should be raised on its own terms, not behind a threshold card.
- **Nothing warns about unsupervised cessation** — the warning fires as a
  blocking modal at adoption, renders on the Life card, renders after every
  logged event, and renders on the same screen as the programme. `STOP_STAGES`
  is not a cessation arc; stage one is "not stop".
- **Sleep timing can only ever be answered for today** — the mechanism is
  real but the blocked string is never rendered, nothing downstream consumes
  the regularity index, and backfilling bed times from memory would feed
  recalled numbers into a mortality hazard, flattering it.
- **Give the intervention push somewhere to land** — the intervention card
  renders above the plan items, already leads with the person's own if-then
  and routes to their own action, and the if-then is already in the push
  body. The proposed breakout would duplicate `TonightCard` directly above it.
- **Escalate the safety line instead of ending on it** — a support line that
  appears at a threshold count *is* the app saying you have a problem,
  delivered by placement; `aftermath.test.ts` pins the opposite, and the
  count is of logging occasions, so it would escalate the diligent logger.
- **Move coach/interrupt onto Breakout** — the exit is not below the fold on
  the interrupts a coach actually fires, the route is already a modal, and
  the proposed mapping would demote the only answer that does anything to a
  ghost link.
- **Stop the suggestion interrupt taking the whole screen** — the `suggestion`
  slot in the arbiter is the plan-adaptation suggestion, a different domain
  object; routing a protocol offer through `SuggestionCard` would drop the
  evidence grade and the safety caveat that a test pins. The one real
  residue is that there is no time-of-day gate.
- **Answer "did anything change" from the numbers already on the phone** —
  trials are gated on evidence grade, not domain, so most are relational,
  work or money practices; a sleep delta printed beside "Weekly delegation
  pass" is worse than silence, and a two-week mean difference is about one
  standard error, biased toward Keep by regression to the mean.

---

## The three things to do first

Not the top three of the list. Three pieces of work, each bundling entries
that share a cause or a screen, chosen because doing them separately costs
more than doing them together.

**One. The future-days guard, on its own, this week.** Finding 1 alone.
It is the only item on the board where the app's own action takes something
away from somebody, it is one argument and one comparison, and it is
currently reachable every Monday. Everything else on this board is the app
failing to do something; this is the app doing the wrong thing. Ship it by
itself so it is not held up by anything, and take the `>= today` boundary
rather than `> today` — a function that can deactivate a routine should not
be judging a block whose start time has not passed.

**Two. The first week as one piece of work: findings 3, 6, 2 and 7, in
that order.** They are four entries because four streams found them, but a
person meets them as one continuous experience, and fixing any one alone
leaves the sequence broken. Today somebody is told setup takes two minutes
(6), loses every answer if the app is killed at question 22 (3), finishes
thirty-five questions to an empty day with a price on it (2), and gets a
silent week because nothing ever offers the one mechanism that reaches them
when they are not holding the phone (7). Fix 6 without 3 and the honest
"start, finish later" affordance has nothing behind it. Fix 3 without 2 and
you have carefully preserved somebody's answers so they can reach an empty
Monday. The order above is the order the person meets them in reverse cost:
persistence is the load-bearing one, the copy is free, the free-coach
intersection is the one with a real test to write. Total effort is hours per
item and the payoff is the only part of the product every single user sees.

**Three. The clinical-safety pair, 4 and 5, as a single change.** They are
two halves of one behaviour: the coach escalates and the instrument
applauds. A person losing too much weight is offered another food rule
every three weeks by the nutrition hub and scored 100 out of 100 by the
wellbeing card, and neither screen mentions a dietitian. Doing 4 alone is
cheap and leaves the escalation running; doing 5 alone leaves the Progress
tab contradicting it. Take the cheap half exactly as scoped — a low branch
in `bmiMisread` and nothing else, no signature change — and take from 5 the
two parts that change behaviour rather than display: the person, not the
app, chooses the next lever, and both weigh-in cadence strings say once a
week. The ladder cap and the safety caption can follow. This is the one
bundle on the board where the cost of being wrong is not churn.

**Not in the first three, and why.** Findings 9 and 12 are the honesty
stream's real content and they are deliberately held: 9 needs the window
decision from finding 1 to land first or the two changes will fight over
`computeWeeklyStats`, and 12 is a days-sized change whose scoping argument
(correction at the point of the mistake, never a browsable list of slips) is
worth more thought than a first week allows. Finding 8 is finding 7's
second call site and rides along for free once the arbiter card exists.
Findings 10, 14 and 15 are each an hour of honest copy plus a reader, and
they are the natural filler for a week where something else is blocked.


---

# Round 1, acted on — 17 September 2026

What was attempted off this board the same day it was written, and what
the cohort said about it. Recorded because two of the three attempts
failed, and both failures are more useful than the findings were.

## Shipped

**The `neverNag` exemption.** Not on the board — it came from the
completeness critic, which found that the one flag in the codebase written
for somebody in grief was honoured by the suggestion pipeline and the
notifier and ignored by the only two paths that remove something.
`droppableRoutines` filtered on `active && !protected && tier !== 'must'`
and never read `protocolId` at all, so `transition-anchor` — "One thing
that still happens", carrying a comment three lines above saying it is the
one thing meant to survive minimal-capacity trimming — would be shrunk to
the ten-minute floor in week one and offered for rest in week two, for the
person it was written for.

Re-run across all ten personas with the filter on and off: identical
completion, identical coach benefit. It costs nothing. Fixed, with a test
that holds it for every `neverNag` practice in the library rather than
for the one that was found.

## Attempted and withdrawn — finding 1, the unlived days

The finding is correct. The fix as written is not, and the reason is worth
more than the finding.

Finding 1 says the sim call "is already entirely past, so that call is a
no-op there and the `BEFORE_LAUNCH` §4 calibration is untouched." That is
false. `src/features/sim/engine.ts` reviews `addDays(date, -6)` through
`date` **inclusive**, so today's items are in the window there too, and
dropping them changes the cohort materially. Measured, ten personas, six
months each, late-stage completion over the last four weeks:

| persona | before | dropping unlived days |
| --- | --- | --- |
| shift_nurse | 0.346 | **0.245** |
| entrepreneur | 0.750 | 0.646 |
| student | 0.318 | 0.273 |

0.245 is under the 0.25 floor that must never be lowered, and the coach
benefit went negative for the shift nurse and the entrepreneur — with the
pathway coaches on they did *less* than with them off, because the plan
stopped being pruned to something survivable.

So: **the pruning engine's calibration depends on counting days that have
not happened.** An item still `planned` on today is treated as a miss, and
roughly a seventh of every skip rate is a day that has not had its chance.
The 0.6 gate was tuned against that inflation. Take the inflation away and
the only mechanism in the app that rescues somebody drowning in their own
plan stops reaching the people who need it most.

Four corrections were tried against it and every one moved the damage to a
different persona rather than removing it:

- **Threshold 0.6 → 0.5.** Shift nurse unchanged at 0.245; new_parent's
  coach benefit went negative instead.
- **Fourteen lived days instead of seven.** Everyone clears the floor
  (lowest 0.25), but the shift nurse's coach benefit stays at −0.27.
- **Per-item rather than per-day** — an item counts once its end time has
  passed, so a 9am review does not count tonight's block while the
  simulation, which reviews at end of day, counts everything. Correct, and
  it changes nothing in the cohort, which is how it should behave.
- **Wake-anchored slots** (below) recovered the shift nurse to 0.267 but
  cost the student, and sleep-anchored slots recovered the student and
  cost her back.

Withdrawn rather than shipped half-tuned. The honest statement of the
problem is not "the window is wrong" but **"the rescue mechanism is
calibrated on dishonest evidence and cannot be corrected without being
redesigned"** — which is a larger and more valuable piece of work than
finding 1 describes, and should be picked up as one.

## Attempted and withdrawn — the day cut for a nine-to-five

Also from the critic, and the diagnosis is confirmed. `slotOf` in
`src/lib/scheduling/adaptation.ts` cut the day at 11:00 and 16:00 with no
reference to the person, in the one module that rewrites a routine's
default hour. Priya, the app's own shift nurse, works 19:00–07:00: her
three-in-the-morning completions were counted as *morning* wins, after
which the engine concluded she completes mornings more consistently and
offered to move her routine to 06:00, while she is driving home. The fixed
morning target of 06:00–09:00 was also an hour before an ordinary
seven-o'clock riser is awake.

Two replacements were built and measured. Anchoring all three slots to
wake time recovered the shift nurse to 0.267 and pushed the student to
0.205, under the floor. Anchoring morning to wake and evening to bedtime —
which is how every protocol in the library already declares its own anchor
— recovered the student and pushed the shift nurse to 0.214.

Neither is wrong, and that is the point: **three slots cannot describe a
night shift**, and Priya's own persona records that none of the five sleep
options in setup describes one either, so the input being anchored to is
known-bad. Withdrawn. The real fix is a fourth slot and a sleep question
that a rotating roster can answer, and it should be designed rather than
tuned against a cohort of five nine-to-five adults.

## What this round changed about the machine

Two rules for round 2, both learned the hard way:

1. **A finding that proposes changing the adaptation engine must be
   measured against the ten personas before it is written, not after.**
   Finding 1's confident "no-op" cost an afternoon.
2. **Stop at the second knob.** Three attempts at recalibration each moved
   the damage rather than removing it. That pattern is the signal that the
   thing being tuned needs redesigning, and continuing past it is how a
   cohort gets over-fitted to whichever persona was measured last.


---

# Round 1, second pass — 17 September 2026

## Shipped

**The suggestion memory.** Three defects in one line, compounding:
every accepted and dismissed record was deleted the moment any new
suggestion appeared; the duplicate guard read only the open ones so a
dismissed card came straight back on the next Today mount; and the three
cooldowns that keep the app quiet count answered nudges from that same
list, so the caps were being erased by the mechanism that makes it speak.
Answers are kept for 60 days, muted by key for 14, and `resolvedAt` is new
because the cooldown has to run from when it was answered.

**Two coaches that could not speak.** `coachForArea` resolves the
training/nutrition/recovery collision by excluding two of them, so of
seven coaches nutrition could never say anything at all and every food
practice was offered in the training coach's voice. `coachForProtocol`
routes on the practice's pillar instead: Mara has 36, Sol 21, where both
had none.

**`HISTORY_DAYS` 14 → 21.** The app read fourteen days of history; the
cohort that calibrated every threshold in `adaptation.ts` ran on
twenty-one. Six months of simulated weeks validated the detectors against
a third more evidence than the shipped app ever gave them.

**A detector that proposes making something bigger.** `detectShrinkToFit`
takes a third off each time it fires, there is a floor and no ceiling, and
nothing in `src` had ever offered to put any of it back — while shrink's
own reason line promised "you can grow it back any time". Twice on a bad
month and a 45-minute session is 20 and stays there through every good
week after. `detectRegrow` offers one step back once the smaller version
has been kept six times at 80%, never past the size it was built at.
Slower to fire than a shrink on purpose: shrinking is a rescue and being
slow to rescue is the costlier mistake; growing is an ask, and an ask made
too early is the app not believing the person's week.

**Protecting something already protected is no longer offered.**

## Attempted and withdrawn — the protect-time trap

The finding is real and it is nasty. "Strength slipped twice in a row.
Protect the next one?" sets `tier: 'must'`. `detectMissedTwice` skips
`must` and `droppableRoutines` excludes it, so the app goes permanently
blind to the routine it has just been asked to look after, and there is no
path back down anywhere in the product. One tap re-classifies a routine
for good, and nobody agreed to that by tapping Protect.

The obvious fix is `protected: true` — the field that means exactly
"hold this time", which the scheduler already honours and which
`droppableRoutines` already respects. Measured across the ten personas it
costs: the shift nurse's coach benefit goes from 0.00 to −0.04 and the new
parent's from 1.92 to 0.77. The reason is in `lib/scheduling/engine.ts:700`
— a protected routine is placed **even when the day is already full**,
which for somebody at minimal capacity is more plan they will not
complete. `must` has no such escape hatch.

So the two flags are not interchangeable and the swap is not free.
Withdrawn. What protect-time should be is a time-boxed hold on the next
session, which is what its own copy says, rather than a permanent tier
change — and that is a design job.

## Standing tally of things found, fixed, and deliberately not fixed

| Found | State |
| --- | --- |
| `neverNag` ignored by the only paths that remove something | Fixed |
| Dismissing a suggestion did nothing | Fixed |
| Nutrition and recovery coaches structurally mute | Fixed |
| App read 14 days of history, cohort calibrated on 21 | Fixed |
| The app could only ever propose shrinking | Fixed |
| Unlived days counted as misses | **Withdrawn** — the rescue is calibrated on the miscount; redesign |
| The day cut at 11:00 for everybody | **Withdrawn** — three slots cannot describe a night shift; redesign |
| Protect-time blinds the engine permanently | **Withdrawn** — the safe-looking swap costs the personas who need it most; redesign |
| Money and work coaches have no trigger of their own | Not started — new capability, not a fix |

The three withdrawals share a shape, and it is the finding under the
findings: **every destructive or protective power in this app is
miscalibrated, and each one is load-bearing for the person it serves
worst.** They cannot be corrected one knob at a time. That is one piece of
design work, and it is the most valuable thing on this board.
