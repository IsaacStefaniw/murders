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


---

# Round 2 — 17 September 2026

Four streams: design-and-interface, coaches-and-programmes,
protocol-explanations, subtraction. Twenty-four findings were produced;
three survived and twenty-one died.

The bar was raised this round. Round 1 ran three lenses and survived on
two of three. Round 2 ran **two** — a **code lens** (are the file facts
true at this commit, checked against the working tree and, where it
mattered, by running the real modules) and a **house lens** (does the fix
make the app naggier, score somebody, overclaim evidence, add first-run
weight, or add where the app should subtract) — and a finding had to
survive **both**. No consequence lens and no majority: one refutation
killed a finding outright. That is why the death rate is seven in eight
rather than one in two, and it is the right trade — every one of the three
survivors is a defect a person meets with their hands, and the
corrections attached to them are again where the real fix is. All three
had their scope cut by their own verifiers.

Three patterns worth naming before the list.

**The reviewers kept finding settled arguments and reporting them as
bugs.** `WeeklyReviewPanel`, the constraints block on plan-review,
`BloodPanel`'s data-entry doors, `YourAnswers`' reassigned purpose in
`docs/REDESIGN.md:379`, the plan-review approval ordering already logged
done at `docs/DEVELOPMENT_PUSH.md:43` — in each case a docstring recorded
a past trade-off and the stream read the trade-off as the defect. This
codebase documents itself well enough that a reviewer who reads only the
code will keep rediscovering decisions that were already argued and won.

**Two proposed fixes would have destroyed user data.** The Breakout
proposal would have wired `save` on `check-in/evening.tsx:94` to
`onClose`, throwing away the day. The constraints fix, taken literally,
would have let a Skip silently clear somebody's injury, and would have
orphaned every exercise swap and drop through a fresh programme id. Both
were caught by a verifier, not a stream.

**Not one finding, confirmed or refuted, names a file under
`src/lib/scheduling/`, `src/features/notifications/` or
`src/features/roster/`.** The adaptation engine, the delivery layer and
the week-shape layer went unread by all four streams — which is exactly
where the standing tally at the end of round 1 says the most valuable work
is. The first critic went there instead and came back with four findings
better than most of the board.

---

## The board

Three entries, ranked across all four streams by *would this change a
life* multiplied by *how cheap*. Each carries its verifiers' corrections
folded into the fix, because in every case the verifiers cut the scope.

### 1. Let somebody say they got hurt

**Stream:** coaches-and-programmes · **Effort:** hours

**Claim.** `constraints` is the only health or injury input that decides
whether the training coach prescribes a loaded lift, and it can be given
exactly once, during setup. It is a `multi` step, so `YourAnswers` — "the
missing half of the interview" — filters it out; it has no `deferTo`, so
`DeferredQuestions` never offers it; and `profilePatchFor` has no
`constraints` case, so even a re-answer would not reach the profile. The
interview's own reveal says the opposite.

**Evidence.** `src/features/onboarding/script.ts:558-561` — `id:
'constraints'`, `core: true`, `kind: 'multi'`; `script.ts:578` promises
"Good. You can add something here any time — the plan will adjust from
that day." Against that:
`src/features/onboarding/YourAnswers.tsx:52-55` filters
`INTERVIEW_STEPS` to `kind === 'single'` with the comment "multi-select
belong to their own screens" — and no such screen exists.
`src/features/onboarding/buildPlan.ts:785-850`, `profilePatchFor`,
switches on fifteen step ids and falls through to `default: return null`
at `:848`. `grep -rn 'Sore joints' src/app` returns nothing. The only
route is `src/app/settings.tsx:484` — delete everything and start over.
`answersFromProfile` (`buildPlan.ts:896-926`) has no `constraints` line
either, so the round trip is broken in both directions.

**What it costs today.** A man in week six tears something in his
shoulder. He opens the app to say so, and there is nowhere to say it.
Every Tuesday for the rest of the block the training coach opens his
session with an overhead press at a load computed from his own e1RM,
because `intensityCeiling` still returns 0.9, `rulesOutComplexLifts` still
returns false, and `rulesOutHardIntervals` still lets the conditioning day
run near-maximal. The one thing he can do is drop the movement per session,
which lapses the moment the block rebuilds. Contrast the equipment case,
which works fine: `trainingSetup` is a `single` step, so `YourAnswers`
shows it and the block rebuilds. The app can hear "I moved to a home gym"
and cannot hear "my back has gone". Injury is the most common reason
people stop training, and it is the one input this coach refuses.
`applyConstraints` (`src/features/training/constraints.ts:161`) is the
single thing standing between a person with a bad knee and a barbell back
squat, and it reads a field that can never be updated.

**Fix.** The load-bearing half is one `case` in one switch. In
`buildPlan.ts`, before the `default` at `:848`:
`case 'constraints': return { constraints: many.length > 0 ? (many as
PhysicalConstraint[]) : undefined };` — the `undefined` branch matters,
because "the back is better now" has to be sayable too. Add the matching
line to `answersFromProfile` so an existing user's constraints do not read
as unanswered. Then three guards the verifiers added, all of which are
load-bearing:

- **Do not let a Skip erase an injury.** `DeferredQuestions.tsx:107-111`
  submits `undefined` on Skip and never seeds `multi` state from the
  current answer. Reuse that shape as-is and a man with "joints" on file
  who opens the card and taps Skip has his constraint silently cleared.
  Seed the chips from the existing answer, and do not call
  `profilePatchFor` for `constraints` when `value === undefined` arrives
  from a skip. "The back is better now" must be sayable; "ask me later"
  must not be mistaken for it.
- **Guard the rebuild on an actual change, and hold it.**
  `store.ts:1030` rebuilds on `trainingSetup` unconditionally.
  `buildProgramme` mints a new `id` and `createdAt`, `weekOf` counts from
  `createdAt`, and `exerciseSwaps`/`droppedExercises` are programme-id
  scoped — so any rebuild drops the person to week 1 and orphans every
  swap and drop they made, on a screen whose own button hint reads "Your
  logged sessions stay". At minimum, rebuild only when the set actually
  differs from `profile.constraints`, and say so rather than doing it
  silently. Better: ship the patch and the surface now and hold the
  rebuild trigger until the programme-id memory is fixed, or the honest
  fix becomes a quiet data-loss path opened by an injury report.
- **Put it where the app already does this.** Not a permanent "Anything
  the plan should work around?" line at the foot of the training hub —
  that asks a healthy person about injury every visit and adds a standing
  surface to a 471-line screen that already carries five asks.
  `TrainingHub.tsx:80-105` already has the pattern: "Change what I'm
  training for" opens the intake inline, rebuilds, and prints one sentence
  from `describeChange(before, after)`. Add "Change what I am working
  around" as a second entry behind the same affordance, reuse
  `describeChange` for the confirmation, and show `constraintNote()`
  beneath it so the professional line travels with the change.

**Do not** widen `YourAnswers` to `multi` as part of this. It is the
reviewer being thorough and it is the worst trade in the set: it admits
nine more steps to a screen that sorts unanswered-first under "N questions
have not been put to you yet… the app assumes the most cautious answer"
and per-row "Not answered — the app is guessing", when setup now asks
everything and those are skips, not gaps. `sections.ts:279` says a skip is
a decision, not a debt. The training-hub line delivers the whole
user-visible benefit. And do not have the session screen infer a
constraint from a dropped movement or a bad set — that is the app deciding
somebody is injured from data, which it has disclaimed.

---

### 2. Stop booking a yearly appointment every week

**Stream:** protocol-explanations · **Effort:** hours for the honest half,
weeks for the cadence primitive

**Claim.** `Protocol.days: Weekday[]` is the library's only cadence unit
and `toRoutine` copies it verbatim, so a practice whose `summary` says
monthly, quarterly, fortnightly or yearly is placed on the calendar 4×,
13× or 52× more often than its own instruction says. Forty-six of the 323
protocols have such a summary. `src/features/cadence/rituals.ts:22-26`
states this exact limitation as a rule — "a routine cannot recur less
often than weekly, so a monthly review scheduled weekly would be that
review twelve times over" — and solves it only for the four rituals.

**Evidence.** `src/features/knowledge/protocols.ts:2592-2596` —
`capacity-benchmark`: "Once a year, the same three tests on the same
morning…" with `days: [6], durationMin: 45`. The library card prints
`1× a week · 45 min` directly under that sentence
(`src/app/library.tsx:52-54`). Same shape at `protocols.ts:2643`
(`health-conversation`, "Once a year, book the appointment" → every
Wednesday), `:1358` (`think-day`, "Once a quarter" → 120 min every
Friday), `protocols.research.ts:722` (`bill-smoothing`, "One afternoon,
once" → every Tuesday forever). The library spans seven files, not two,
and `PROTOCOLS` aggregates all of them — a guard test that reads two files
misses `help-debt-timing` in `protocols.money.ts`.

**What it costs today.** For most of the forty-six the block only lands if
a person taps Add, on a card that prints the "Once a quarter" summary two
lines above the button — bad, but self-inflicted and visible. The ones
that matter are the handful the app places itself. The worst is
`state-of-us` (`protocols.ts:976`): `days: [6]`, `durationMin: 45`,
summary "Roughly monthly", `why` reading *"minutes a year, not hours a
week"* — and `src/features/paths/definitions.ts:1005` hands it to the
ordinary relationship pathway, so the default build books a forty-five-
minute state-of-the-relationship conversation every Saturday forever, at
twelve times the dose its own evidence sentence cites. That is the app
overclaiming its own research on the calendar, which is the one rule this
product cannot break. For the not-`neverNag` subset — `capacity-benchmark`,
`health-conversation`, `think-day`, `bill-smoothing`,
`shared-money-agreement`, `subscription-audit` — the person cannot do the
thing, taps Skip, and `detectSlotMismatch` eventually tells them the
yearly health conversation "keeps slipping in the middle of the day" and
offers to move it. The app diagnosing a person's discipline for a mistake
the app made in arithmetic.

**Fix.** Four pieces, in this order, and only the first two are this
week's work.

1. **`DAY_LABEL` at `src/app/library.tsx:52-54`.** Never print "1× a week"
   over a summary that says otherwise. One line, no schema change, removes
   the most visible lie today.
2. **The six the app places itself, by hand**, starting with `state-of-us`
   out of the default relationship ladder or down to a cadence its own
   `why` can defend. This is the part that is an evidence-overclaim rather
   than a tidiness problem.
3. **A `neverNag` guard on the slot-mismatch path.** `detectSlotMismatch`
   has none, and `weeklyChanges.ts:167` does not apply the `neverNagged`
   filter that the drop/shorten branch applies at `:85` — so a practice
   flagged in data as never-to-be-chased can still be told it keeps
   slipping. Two lines, pure subtraction, same neighbourhood.
4. **Then, and not before, the cadence primitive.** Do not invent
   `everyNWeeks` as a fourth unit beside `cadenceDays`, `cadencePerWeek`
   and `MoneyCadence`. Extend `MoneyCadence` (`src/features/money/year.ts`,
   already `'once' | 'quarterly' | 'yearly'`, already rendered honestly by
   `CADENCE_LABEL`) with `'fortnightly' | 'monthly'` and put it on
   `Protocol`; a protocol whose cadence is `'once'` must not become a
   recurring routine at all. `everyNWeeks` cannot express a third of the
   forty-six: "once and never again", event-triggered with no period
   (`pre-mortem`), and setup-then-recur are all in that list. Honour it in
   one exported `occursOn(routine, dateKey)` used at
   `src/lib/scheduling/engine.ts:638`, `generate.ts:123` and
   `src/features/plus/entitlement.ts:187` — the fix as first written named
   only `generate.ts:123`, which is inside `carveSpan` and handles only
   `duringWork` carve-outs, so it would have left the yearly practice on
   the plan every week for everybody. There is no `createdAt` on `Routine`
   to anchor the phase on, so either add `startedOn` in `toRoutine` and
   the ladder/path producers, or derive phase from a hash of `routine.id`
   and keep `occursOn` pure. And make `year.ts` read cadence off the
   protocol rather than keep its own copy, or thirteen money cards will
   say "Four times a year" on MoneyHub and appear on four consecutive
   Tuesdays on Today.

The guard test needs an allowlist, not a bare regex: `/a year|a month|a
quarter/` over `summary` fires on `best-possible-self` ("a year from
now"), `pre-mortem` ("assume a year has passed") and `think-day` ("the
three-year question"), and a test that fails on correct entries gets
deleted within a month. Do not solve any of this by rewording the
summaries to say "weekly" — the summaries are right and the scheduler is
wrong.

---

### 3. Delete the daily habits question

**Stream:** subtraction · **Effort:** hours

**Claim.** `asksFor()` emits the `habits` ask whenever any behaviour
intention is active, with no cadence gate and no answered-state, and the
card it renders has no control on it — it is a sentence pointing at
another tab. `available.dailyAsk` on Today is `asksFor(...).length > 0`,
and `dailyAsk` sits sixth in `ATTENTION_ORDER`, above `checkin`, `plus`,
`budget` and `suggestion`.

**Evidence.** `src/features/health/dailyAsk.ts:127` pushes the ask with no
`lastAnswered` anywhere in `AskInputs`.
`src/features/health/DailyAsk.tsx:136-142` is the whole UI: a
`variant="secondary"` sentence saying "The log is under Coaches", then a
"Not today" button whose dismissal is `useState`, so it returns on the
next mount — tab away and back and the app asks again the same morning.
`src/app/(tabs)/today.tsx:290-298` computes availability from the
unfiltered `asksFor` result. `dailyAsk.ts:21-22` argues the case against
itself: "A question whose answer changes nothing teaches people to dismiss
the app."

**What it costs today.** A card that cannot be answered, every day,
forever, for anyone who named anything in `lessOf` during setup — which is
the opening committing question of §1. Worse than that: because
availability is computed from `asksFor` while dismissal is component-local,
a person who taps "Not today" leaves the arbitrated slot **claimed and
empty**, under a caption reading "3 more things to look at, tomorrow".
That directly contradicts `today.tsx:262-265` — "a slot is never claimed
by something that then renders nothing."

**Fix.** Remove `'habits'` from `AskId` (`dailyAsk.ts:71`), the branch at
`:124-133`, and `activeHabits`/`hasStandingHabit` from `AskInputs`
(`:94-97`); the two call sites lose two arguments each
(`today.tsx:294-295`, `DailyAsk.tsx:75-76` — note `:76` was already
redundant with `:75`). Remove the render branch at `DailyAsk.tsx:136-142`.
Then five more test sites than the finding named:
`dailyAsk.test.ts:70-76`, `:108-112`, the `input()` fixture at `:27-37`
and the `hasStandingHabit: true` literals at `:93,:97,:102,:109`, plus
`dailyAskWiring.test.ts:22-28` and `:38-41`. Tighten
"never asks more than two things at once" rather than leaving it trivially
true. Nothing is lost that the app can do: logging already lives on the
Life tab's intention card and in `moment/[eventId]`.

**Ship it as hygiene, not as the fix to `ATTENTION_ORDER` starvation.**
The claimed benefit — that `checkin`, `plus`, `budget` and `suggestion`
can finally render — is false. `asksFor` emits `sleepTiming` on any day
where `nightsRecorded` lacks today, which for anyone without a
sleep-tracking watch is every day, permanently. `dailyAsk` keeps winning
the slot after the deletion. The two real defects underneath are the
arbiter/component divergence and the fact that `dismissed` is local
`useState`, and neither is touched by this change. Fix those on their own
terms: any ask's dismissal and its availability need one source of truth.

---

## What died, and why

Twenty-one findings were refuted. One line each. The design-and-interface
stream lost all six, and lost them the same way every time.

**design-and-interface — nought of six.**

- **"Order matters" and nothing shows order** — `interview.tsx:167-175`
  renders the step's `reveal` at 28pt accent on a screen holding nothing
  else: "Noted. When two things want the same hour, Health wins." The
  finding called a full-screen confirmation nonexistent. The residue —
  ranks 2 and 3 are never shown and there is no reorder affordance — is
  moderate, and the proposed drag fix was built on `DragToMove`, which
  converts vertical drag into a *time of day* and has no list semantics.
- **The app's own voice has no fixed place on Today** — the observation
  holds, but hoisting the arbitrated block above the Now header puts the
  Plus nudge back as the first card on the screen, which is the exact
  defect `attention.ts:47-53` and Wave 0 item 1 record as fixed.
- **Twenty identical rectangles on plan-review** — the density is real;
  demoting the constraints block to caption walks back
  `onboarding/constraints.ts:7-15`, which exists because reviewers who
  named a bad knee read a plan that never mentioned it and assumed they
  had been ignored; and pinning "This is my plan" costs a quarter of an
  iPhone SE and asks for approval before a single switch has been seen.
- **The Breakout frame has one tenant** — true, and the proposed fix wires
  `save` on `check-in/evening.tsx:94` to `onClose`, throwing the day away;
  it also adds a second, vaguer exit to the two session screens whose
  single control already states what leaving costs.
- **The Progress tab on day one** — "every heavy component renders
  unconditionally" is false; `WorkNumbers.tsx:36-38` early-returns `null`
  twice and was in the finding's own evidence list. The proposed early
  return would remove the only route in the product to enter blood
  pressure, HbA1c, height and weight, on the day nothing has been entered.
- **The scale and the touch floor** — the diagnosis is exact and the fix
  is not implementable: a source-regex `Pressable` rule would fail on
  fourteen legitimately large targets, and folding Button's 16 and Field's
  22 into the named scale breaks the ratio test that pins it.

**coaches-and-programmes — one of five.**

- **Every pathway plan is built at the foundation rung** — the defect is
  real and high severity, but auto-injecting calendar blocks when an
  evidence counter ticks over duplicates and contradicts `NextRungCard`,
  bypasses `fitLadderToBudget` (four climbs accrue 630 minutes against a
  260 ceiling), reads the level before the write lands, and makes the "this
  is too hard" lever silently delete work.
- **The block ends on day 28 with no moment** — the orphaning is real and
  is the live bug, but it fires mid-block through `setHiitChoice` and
  `setPathIntensityPush`, not at day 28; and the proposed interrupt would
  ambush a person on Today with a modal, spend the day's one interruption,
  mis-declare `adds: false` to bypass `mayOffer`, and state a derived e1RM
  as fact.
- **Advanced is unreachable on six coaches** — confirmed exactly, and all
  three proposed branches fail: forcing `blockedBy` to null swaps a false
  sentence for a false promise ("Advanced is unlocked") that `earnedLevel`
  will not honour; deleting the rungs deletes shipped content; inventing a
  proxy is the thing the finding forbids two sentences later. The root
  cause is one word: `level.ts:218` documents `standardsMet` as "pathways
  without one pass `true`", and `completionEvidence:377` passes `false`.
- **No coach teaches at the moment it asks** — `library.tsx:106` already
  ships the proposed pattern; the gap is one component, `NextRungCard`. The
  "session screen the routine opens into" the fix would edit does not
  exist, and an unconditional inline reveal hands the paywalled half of
  the library away free.
- **The practices a ladder says can start any time** — `alongside` is
  genuinely dead, but the fix ships nothing for five of the seven ids
  because `nextRungForPath` reads only the first ladder and `MIND_LADDER`
  is never first; and it puts up to five more Add chips on the card whose
  whole purpose is to offer one thing.

**protocol-explanations — one of five.**

- **The rung card adds a practice from a bare chip** — every particular
  confirmed, including the seven grade overclaims; the fix renders up to
  3,442 characters on a shift worker's first rung, with seven Add buttons
  in a column, on the card whose own copy says "alternatives, not a
  checklist".
- **Every first rung has how-to steps and none above it** — 36 rungs, not
  35, and one of them has steps. The proposed test turns the suite red for
  35 files' worth of unwritten prose, and its worst-first ordering puts
  numbered procedures on a D-graded practice whose own `why` says there is
  no evidence for doing it at home.
- **The bare letter E on the session screen** — the grade half is right
  and should ship (`EVIDENCE_PLAIN.E = 'Unproven'`); the `sourceTail` half
  does not compile (no `protocol` in scope) and lengthens 178 rows to fix
  a line that is quieter, not wrong.
- **Eleven cards are facts, booked as appointments** — nothing books
  them; most of the eleven do name an act; `solitude-counts` is already
  standing on the `basis: 'balance'` shelf the finding says does not
  exist; and excluding it from `toRoutine` parks the friendship ladder on
  an unsolidifiable rung forever.
- **The safety test keys on pillar** — the central exposure claim is
  refuted by a test the finding itself cites:
  `publishedCounts.test.ts:51-52` pins `p.safety` at 284, so no safety
  line can be deleted and no uncautioned practice added. The residue is
  that an existing line can be *reworded* weaker.

**subtraction — one of five.**

- **Delete the Weekly Review panel** — it is board finding 1 re-raised
  with deletion as the remedy; after it, `buildWeeklyChanges` has no
  production caller while `sim/engine.ts:446` keeps running it, so the
  cohort would be measuring a rescue nobody can reach. It also deletes the
  only producer of `shorten_routine`, keeping the harsher power and losing
  the gentler one.
- **Delete `src/lib/ai` and the Supabase client** — the subtraction is
  right and the reasoning is not: `src/lib/telemetry.ts` posts funnel
  events to an env-gated URL from nine live call sites, so removing
  Supabase does not make the on-device promise unconditional, and
  `docs/WEARABLE_POSITIONING.md:431` already forbids writing that it does.
- **Stop asking walking pace and self-rated health** — the diagnosis
  stands (both reveals promise a screen `MARKERS_ENABLED` keeps out of the
  build), but cutting §5's `unlocks` leaves a section with no payout and
  fails a green test, and four more markers promises survive the fix,
  one of them in `birthYear`, which cannot be deleted. The overclaim is in
  the wording, not the questions.
- **Delete `/answers` and `YourAnswers`** — `docs/REDESIGN.md:379-382`
  assigned the screen its current purpose in the same change that
  un-deferred the interview: it "becomes the place to *change* answers".
  Deleting it removes the only post-setup edit path in the product. What
  is stale is the header comment. (The scolding copy and the
  unanswered-first sort are real and are edits.)
- **Delete the evening check-in** — the route is genuinely unreachable,
  and the diagnosis is inverted: the evening check-in is the only writer
  that could ever make `hasEveningReflection` true, so reducing the gate to
  bare `isEvening` hardwires "Close the day" into every evening from 5pm
  forever and deletes the copy that would acknowledge closure.

---

## The three critics

Three critics read the board after the streams closed, each with a
different brief, none with a brief to be fair to it. They are the most
valuable output of this run and they are reproduced at length rather than
summarised, because the summary is always the part that loses the file
paths.

### Critic one — what the four streams did not read

Read the board, then went where the four streams didn't:
`src/lib/scheduling/`, `src/features/notifications/`,
`src/features/roster/`, `src/state/hygiene.ts`, and the profile-edit
graph. Nothing modified.

**1. The roster is promised in setup, never collected in setup, and
honoured by exactly one consumer.** `src/features/onboarding/script.ts:173`
answers "Shifts, or hours that move" with the reveal *"Then the plan
follows your roster rather than a fixed week"* — and setup then asks
`workDays` (a fixed weekday multi, `:348`) and one "usual" shift
(`:390-404`) and never writes `profile.roster`. The roster editor exists
and is good (`src/app/plan/week-shape.tsx`, with real presets: Nights
stores `wakeTime: '15:00', sleepTime: '09:00'`), but it is reachable only
from an unpromoted card at `src/app/(tabs)/plan.tsx:139`. Worse, when it
*is* set, `profileForDate` (`src/features/roster/roster.ts:75`) has one
non-test caller — `src/features/planner/generate.ts:252`. Everything that
judges or delivers that plan reads the flat profile: `quietHoursFor`
(`src/features/notifications/schedule.ts:111-114`), the wind-down push
(`:233-241`), `DragToMove.tsx:45`, `QuickAdd.tsx:79,98`,
`item-actions.tsx:133,182`, `ReadinessCard.tsx:34`. Concretely, on a
night-shift day the nurse's plan is correctly built around 19:00–07:00
while her quiet hours are still computed from her day-shift bedtime, so
the app is free to push at 11:00 while she is asleep and is silenced at
03:00 when she is awake and could act; `plannedAcross` (`schedule.ts:261`)
queues three days this way in one pass. This is the withdrawn "day cut for
a nine-to-five" finding, except the redesign it asked for is already
half-built and stranded behind one import.

**2. The one notification category that speaks when a person says yes to
notifications is the one that skips the `neverNag` guard.**
`DEFAULT_NOTIFICATION_SETTINGS` has `sessions: false` but `coach: true`
(`src/features/notifications/schedule.ts:81,83`), and the `neverNag` check
lives only inside the `settings.sessions` branch at `:218-220`. The coach
branch at `:203-208` calls `coachNotifications`, whose `defendedItems`
(`src/features/coaches/reach.ts:63-66`) filters on `!i.fixed && status ===
'planned' && DEFENDED.has(i.area)` where `DEFENDED = new
Set(['family','relationship'])` — no protocol lookup anywhere. Those are
the two areas where `neverNag` is densest: 27 of the 85 `neverNag`
protocols sit in `family`/`relationship`, including `say-the-loss-out-loud`
("Say it to one person", a bereavement practice) and `carer-ask-for-cover`
("Ask for cover, once a week"). If either is the first defended block of
the day, the app sends a push titled with the coach's name reading *"Say
it to one person in 45 minutes. Making it, or shall I move it?"* — an
accountability question about grief, from the only category that is on.
`src/features/review/weeklyChanges.ts:75-85` gets this right
(`neverNagged`); the push path does not, and `schedule.ts:21` claims in its
own header that it does.

**3. The adaptation engine's only upward detector reads the wrong number,
so it invents a shrink that never happened and is blind to the ones that
did.** `detectRegrow` (`src/lib/scheduling/adaptation.ts:341-356`) takes
`originalFor`, and `src/state/store.ts:2387-2389` supplies
`r.protocolId ? protocolById(r.protocolId)?.durationMin : undefined` — the
library's default length, not the length the routine was built at, which
is stored nowhere. Two failures fall out. (a)
`src/features/onboarding/buildPlan.ts:169` sets `trainingDurationMin:
capacity === 'minimal' ? 30 : 45` and `:261` builds "Strength workout"
with `protocolId: 'strength'` at that length, while the `strength`
protocol is 45 — so for every person who told the app their capacity is
minimal, after six sessions kept at 80% the engine fires *"Strength
workout has been sticking at 30 minutes. Try 40?"* with the reason "It was
shortened when weeks were harder; this is the offer to put some of it
back." Nothing shortened it; they chose it, and the app is narrating a
past they did not have to a person who already said they have the least
room. "Family adventure" (built 90, protocol 180) does the same at 115.
(b) The routines that actually get shrunk cannot come back: `Date night`
(`buildPlan.ts:360`, 120 min) and the anchor set at `:300-320` — `Caring`
at 180 min, `Paid work`, `Appointments` — carry no `protocolId`, so
`originalFor` returns `undefined` and `detectRegrow` skips them while
`detectShrinkToFit` (`:270`) takes a third off each time it fires. That is
precisely the asymmetry `detectRegrow`'s own docstring (`:305-312`) says
it was written to end, still live for every routine the interview builds
itself.

**4. Nothing in the app can be told that a person is gone.**
`profile.people` is written from exactly two interview steps: `household`
(`script.ts:217`, `kind: 'multi'`) and `partnerName` (`:258`, `kind:
'text'`), applied at `buildPlan.ts:823-847`. `YourAnswers.tsx:53` filters
to `kind === 'single'`, so neither is listed; `deferredSteps` only offers
unanswered steps, and setup now asks everything. So after a death, a
separation, or a child moving out, there is no surface anywhere that can
change it — and even if there were, `answerDeferredQuestion` rebuilds only
on `trainingSetup`, so the `Date night` routine, the `Family dinner` daily
anchor and the `partner-*` practices would survive the correction
regardless. Meanwhile `src/features/family/householdWeek.ts:112`,
`src/features/anticipation/lookAhead.ts:75`, `src/app/household.tsx:55`
and every defended-block push keep using the name. This is the *same*
mechanism as the confirmed `constraints` finding and it is the more
expensive instance: widening `YourAnswers` should be justified by
`household`/`partnerName`, not by `constraints`, and the fix needs the
routine rebuild that `constraints` alone does not force. (There is no
rename or delete for routines anywhere — `src/app/plan/routines.tsx` only
offers `active: false`.)

**5. Actively good, and one line of it doesn't deliver:
`src/features/today/returning.ts`.** Its three rules — nothing missed is
ever counted, what survived is named, the stale plan says so — are the
most defensible thing in this codebase and the direct answer to "the
moment people delete"; `WelcomeBack.tsx:55-98` then does something almost
no app does and *asks what changed*, with three answers that each do real
work. Two streams proposed re-ordering or thinning the Today block it
lives in; it should be the last card anyone touches. But the first of its
three answers is wrong: `WelcomeBack.tsx:75` promises "Rebuilds this week
from today" and `:77` calls `regeneratePlan(date)` — one day. The person
was just told at `returning.ts:80` that "the week on file was built before
you went quiet, so it is out of date", taps the button that says it fixes
that, and six of the seven days stay stale, because `today.tsx:133` calls
`ensurePlan`, which returns existing plans untouched. The idiom for the
correct fix is four lines away in the same feature area:
`src/app/plan/week-shape.tsx:84`, `for (let i = 0; i <= 6; i++)
regeneratePlan(addDays(today, i))`.

**Weakest stream, bluntly: design-and-interface.** Nought of six survived,
and the failure mode was consistent rather than unlucky — it asserted
absence without checking the render path. It said the priorities order is
never shown while a 28pt full-screen reveal shows it
(`interview.tsx:167-175`); it said "every heavy component on the Data tab
renders unconditionally" while `WorkNumbers.tsx:36-38` early-returns
`null` twice and was cited in its own evidence list; it built a
drag-reorder fix on `DragToMove`, which converts vertical drag into a
*time of day* and has no list semantics; and its Breakout proposal would
have wired `save` on `check-in/evening.tsx:94` to `onClose`, discarding
the day. It reviewed the app it inferred from JSX rather than the app that
renders. The deeper gap is shared by all four: not one finding this round,
confirmed or refuted, names a file under `src/lib/scheduling/`,
`src/features/notifications/` or `src/features/roster/` — the adaptation
engine, the delivery layer and the week-shape layer went unread, which is
where points 1, 2 and 3 above came from, and which the board itself
(`docs/REVIEW_STREAMS.md:1108-1113`) calls "the most valuable thing on
this board".

### Critic two — what this round adds, and what it inherits

**1. Nothing here lengthens first run — the weight all lands on one
post-setup screen, `src/features/training/TrainingHub.tsx`.** None of the
three confirmed findings adds an interview step: `constraints` is already
asked in setup, the cadence field is data, and the habits deletion is pure
removal. So the round's real risk is not signup weight, it is that the
constraints fix's part (c) parks a new prompt, a chip row and a Save
button at the foot of a hub that already carries the four-week block list,
`HiitPicker`, `LogCardio`, the block-complete/rebuild pair, the "Change
what I'm training for" panel with two chip rows and two buttons, and a
"Log a lift" section — 471 lines and five distinct asks before anything is
added. A quiet line is the right instinct; it should replace the rebuild
copy that sits three lines above it, not stack under it.

**2. Two of the three route through mechanisms this same round documented
as broken, and they inherit the bugs silently.** Constraints fix (b) adds
`constraints` to the `buildTrainingBlock` trigger at
`src/state/store.ts:1018`. `buildTrainingBlock` (`store.ts:1870`) calls
`buildProgramme`, which mints a fresh programme id, while
`swapKey`/`dropKey`/`addedKey` (`src/features/training/swap.ts:170`,
`sessionEdits.ts:45-51`) stay keyed to the old one — the exact orphaning
the refuted "block ends on day 28" finding verified. So "the back is
better now" would silently delete every exercise swap and drop the person
made, on a screen whose own button hint reads "Your logged sessions stay"
(`TrainingHub.tsx:414`). Ship (a) and the surface; hold (b) until the
programme-id memory is fixed, or the honest fix becomes a quiet data-loss
path opened by an injury report.

**3. The habits deletion is right and its stated benefit is false — the
slot does not free.** In `src/app/(tabs)/today.tsx:290-297`,
`available.dailyAsk` is `asksFor(...).length > 0`, while
`src/features/health/DailyAsk.tsx:68-84` keeps its own local `dismissed`
set. So the arbiter awards the slot from the unfiltered list and the
component can then render `null` — claimed, empty, and
`checkin`/`plus`/`budget`/`suggestion` still blocked. Worse, `asksFor`
(`src/features/health/dailyAsk.ts:116`) emits `sleepTiming` whenever last
night is missing, which for anyone without a wearable is every single day.
Removing `'habits'` deletes a card with no control, which is correct, but
the permanent slot capture is the arbiter/component divergence plus the
daily sleep ask, and that survives the deletion untouched. Ship it as
hygiene, not as the fix to `ATTENTION_ORDER` starvation.

**4. Widening `YourAnswers` to `multi` makes a scold longer, and two
refuters already flagged that screen's copy.**
`src/features/onboarding/YourAnswers.tsx:53` filters to `single` (22 of 31
steps); dropping the filter admits 9 more, each rendered as a Card that
sorts unanswered-first (`:57-60`) under the headline "N questions have not
been put to you yet… the app assumes the most cautious answer" (`:69`) and
per-row "Not answered — the app is guessing" (`:87`). Setup now asks
everything, so those are skips, not gaps — and
`src/features/onboarding/sections.ts:279` says a skip is a decision, not a
debt. Adding `priorities`, `lessOf`, `household`, `weekAnchors` and the
rest to a nine-card debt list to reach one of them (`constraints`) is the
worst trade in the set. Drop this clause entirely; the training-hub line
delivers the whole user-visible benefit.

**5. The cadence finding is the only genuine subtraction, and only its two
cheap halves should go first.** `src/features/planner/generate.ts:123`
expands `r.days` verbatim, so 46–52 practices whose `summary` in
`src/features/knowledge/protocols.ts` says monthly or quarterly are placed
4× to 52× too often; fixing it removes blocks from real calendars rather
than adding anything, which is the one thing this round is short of. But
it is the "weeks" item, it touches the single function every routine
passes through, and the same lens that withdrew three findings on the
board's tally (`docs/REVIEW_STREAMS.md:1104-1106`) applies — a scheduler
change is measured against the personas before it is written. Take the
guard test and the `DAY_LABEL` fix at `src/app/library.tsx:52-53` now (a
card that says "once a quarter" while printing "1× a week" is an honesty
bug fixable in an hour), and let `everyNWeeks` wait for a round that is
not also opening a new door into `buildTrainingBlock`.

### Critic three — what is actually worth the week

**1. The constraints one is the only confirmed finding that is genuinely a
"before people use this" item, and it is smaller than the write-up makes
it sound.** I verified the mechanism: `profilePatchFor` in
`src/features/onboarding/buildPlan.ts` ends at a bare `default: return
null` with no `constraints` case, and `constraints` appears nowhere in
`src/app/settings.tsx`, `DeferredQuestions.tsx` or `TrainingHub.tsx` — so
the answer given once in §4 of setup is permanent for the life of the
install. What makes it worth the hours is not the interview's broken
promise, it is `src/features/training/constraints.ts:161` —
`applyConstraints` is the single thing standing between a person with a
bad knee and a barbell back squat, and it reads a field that can never be
updated. A man who tweaks his back in week three has no sentence he can
say to this app. That is the one confirmed finding where the failure mode
is physical rather than aesthetic, and the load-bearing half of the fix is
one `case` in one switch plus one edit affordance. Do part (a) and a line
at the foot of the training hub; skip the `YourAnswers` widening, which is
the reviewer being thorough.

**2. The cadence finding is right about six protocols and tidy about the
other forty.** The scheduler really does copy `days` verbatim
(`src/features/knowledge/protocols.ts:3941`), but the severity depends
entirely on whether anything *places* the practice or a person taps Add —
and for most of the 46 it is Add, on a library card that prints the "Once
a quarter" summary two lines above the button. The ones that matter are
the handful put on the calendar by the app itself. The worst is
`state-of-us` (`protocols.ts:976`): `days: [6]`, `durationMin: 45`,
summary "Roughly monthly", `why` reading *"minutes a year, not hours a
week"* — and `src/features/paths/definitions.ts:1005` hands it to the
ordinary relationship pathway, so the default build books a
forty-five-minute state-of-the-relationship conversation every Saturday
forever, at twelve times the dose its own evidence sentence cites. That is
the app overclaiming its own research on the calendar, which is the one
rule this product cannot break. Fix those six by hand; the `everyNWeeks`
field, the 46 ids and the guard test are a week you do not have.

**3. The habits-ask deletion should happen, but not for the reason given,
and it buys almost none of what it promises.** Deleting the branch is
correct — `src/features/health/DailyAsk.tsx` renders it as a paragraph and
a "Not today" button with no control, which is a card that cannot be
answered. But the claim that it "eats Today's only attention slot forever"
and that the four blocks below can then render is wrong: `asksFor` in
`src/features/health/dailyAsk.ts` pushes `sleepTiming` on any day where
`nightsRecorded` lacks today, which for anyone without a sleep-tracking
watch is every day, permanently. `dailyAsk` keeps winning the slot after
the deletion. Meanwhile the real defect in that file went unreported by
the stream that was reading it: `dismissed` is component-local `useState`,
so "Not today" is forgotten the moment Today unmounts — tab away and back
and the app asks again the same morning. That is the naggy bug, it is in
the file, and nobody saw it. Half an hour, not "hours".

**4. Most of this board is not worth the week, and the refutations are
better than the findings.** Across four streams, three survived and
seventeen died, and the pattern in the deaths is consistent: reviewers
read a docstring recording a past decision and reported the decision as
the bug (`WeeklyReviewPanel`, `plan-review.tsx`'s constraints block,
`BloodPanel.tsx`'s data-entry doors, `YourAnswers`' reassigned purpose in
`docs/REDESIGN.md:379`). Two proposed fixes would have destroyed user data
outright, one would have re-broken a paywall-ordering decision already
logged as done in `docs/DEVELOPMENT_PUSH.md:43`. What you bought with this
round is a strong verification layer and a weak generation layer — the
streams are auditing internal consistency in a codebase whose docstrings
already record every trade-off, so they keep rediscovering settled
arguments. You are not pre-launch at risk from inconsistency. Do not run a
fifth stream of the same shape.

**5. What is missing is the only number that decides whether any of this
gets used: nobody read the funnel.** `src/app/welcome.tsx:28` — the first
sentence in the product — promises "Twelve quick questions, about two
minutes." `src/features/onboarding/sections.ts:155` maps thirty-seven
steps across eight sections, only twelve of which carry a `skipIf`, and
nothing exists until the last one is answered. A person is told two
minutes, gives you ten, and the plan — the entire payoff — is gated behind
all of it. `track()` is already wired at `interview.tsx:58,74` and
`plan-review.tsx:64`, so you have the instrument and no stream asked the
question. Four reviews argued about the typography on the payoff screen;
none asked how many people reach it. Before any of the three confirmed
findings, sit ten people down with a TestFlight build and watch where they
stop — and either make the welcome sentence true or make the first six
questions produce something. Second missing question, same family: nothing
on the board asks why anyone opens this on day three.

---

## What to build first

The three critics do not agree, and the disagreement is the useful part.
Critic three says most of this board is not worth the week and the funnel
is the only number that matters. Critic two says the two fixes that touch
`buildTrainingBlock` and the scheduler inherit bugs this same round
documented. Critic one says the four streams read the wrong third of the
codebase. Reconciled, that is not three opinions — it is one week's work
and one instruction about what not to do.

**One. Ship the two halves all three critics agree on, and nothing more.**
Both are hours, neither touches a rebuild path, and between them they are
the entire user-visible benefit of the two best findings on the board.

- The `constraints` case in `profilePatchFor`, its twin in
  `answersFromProfile`, and one entry behind the existing "Change what I'm
  training for" affordance on the training hub, with `constraintNote()`
  under it. **Hold the `store.ts:1030` rebuild trigger.** All three
  critics arrive at that independently: critic two because the rebuild
  orphans every swap and drop, critic one because the same mechanism is
  what makes the `household`/`partnerName` case expensive, critic three
  because the value is in `applyConstraints` reading a field that can be
  updated at all, and `applyConstraints` runs per session — it does not
  need the block rebuilt to stop prescribing the squat. Without the
  trigger this is a one-`case` change and a reused panel.
- `DAY_LABEL` at `src/app/library.tsx:52-54`, so no card prints "1× a
  week" over a summary that says otherwise, and the six protocols the app
  places itself fixed by hand — `state-of-us` first, because a default
  build booking a forty-five-minute relationship conversation every
  Saturday against a `why` that says "minutes a year, not hours a week" is
  the app contradicting its own evidence on somebody's calendar. Critic
  two and critic three reach the same place from opposite directions: two
  says the cadence primitive is a scheduler change and round 1's rule
  requires it to be measured against the ten personas before it is
  written; three says six by hand is an afternoon and the field is a week
  you do not have. Both are right. The `MoneyCadence` extension, the
  shared `occursOn` helper and the guard test go on the list for a round
  that is not also opening a door into `buildTrainingBlock`.

**Two. Remove three things.** This round found almost nothing to add and
the removals are its real yield.

- **The `habits` daily ask.** `AskId`, the branch at `dailyAsk.ts:124-133`,
  `activeHabits` and `hasStandingHabit` from `AskInputs`, the render branch
  at `DailyAsk.tsx:136-142`, both call sites and seven test sites. A card
  that cannot be answered, shown every day, forever. Ship it as hygiene
  and do not claim it frees the attention slot — `sleepTiming` still wins
  it every day for anyone without a wearable.
- **The `neverNag` hole in the coach push path.** Critic one's second
  finding is the cheapest genuinely dangerous thing anybody found this
  round: `coach: true` is the default-on category, `defendedItems`
  (`reach.ts:63-66`) filters on area with no protocol lookup, and 27 of
  the 85 `neverNag` protocols live in `family`/`relationship`. A push
  asking whether somebody is going to make their bereavement practice is a
  failure mode of a different order to anything on the board proper. The
  filter already exists at `weeklyChanges.ts:75-85`; apply it. While in
  the file, apply it to `detectSlotMismatch` too, which has the same hole.
- **The scolding copy on `YourAnswers`.** Not the screen —
  `docs/REDESIGN.md:379` gave it its job and it is the only post-setup
  edit path in the product. The headline at `:69`, the per-row "Not
  answered — the app is guessing" at `:87`, and the unanswered-first sort
  at `:57-60`, all of which describe a world where the interview deferred
  questions, and none of which survived the un-deferring.
  `sections.ts:279` already says what this screen should say: a skip is a
  decision, not a debt.

**Three. One free line, because it is four lines away from being right.**
`WelcomeBack.tsx:75` promises "Rebuilds this week from today" and calls
`regeneratePlan(date)` for one day. The idiom is at
`src/app/plan/week-shape.tsx:84`. `returning.ts` is the best-argued file
in this codebase and the one card in the product aimed at the moment
people delete the app; it should not be the card that does not do what its
button says.

**What not to do next, and what to do instead.** Do not run a fifth stream
of this shape. Two rounds have now produced a strong verification layer
and a weak generation layer: the streams audit internal consistency in a
codebase whose docstrings already record every trade-off, so they keep
rediscovering settled arguments and proposing fixes that walk them back.
The next round has two targets and neither is a screen.

The first is the third of the codebase nobody read — `src/lib/scheduling/`,
`src/features/notifications/`, `src/features/roster/`. Critic one got four
findings out of an afternoon there, including the one that explains a
withdrawal from round 1: the night-shift redesign the tally calls "the
most valuable thing on this board" is **already half-built**, and stranded
behind a single import — `profileForDate` has one non-test caller while
`quietHoursFor`, the wind-down push, `DragToMove`, `QuickAdd`,
`item-actions` and `ReadinessCard` all read the flat profile. That is a
finished feature nobody can reach, which is a better use of a week than
anything on this board.

The second is not a code review at all. Nobody read the funnel.
`welcome.tsx:28` promises twelve questions and about two minutes;
`sections.ts:155` maps thirty-seven steps across eight sections, twelve of
which can be skipped, and nothing exists until the last one is answered.
`track()` is already wired at `interview.tsx:58,74` and
`plan-review.tsx:64`. Four streams argued about the typography on the
payoff screen and not one asked how many people reach it. Ten people, a
TestFlight build, and a note of where each of them stops will outrank this
entire board — and will decide whether the honest answer is to make the
welcome sentence true or to make the first six questions produce
something.

---

## Acted on — the coach push hole, and the guard that nearly closed the coach

Critic one's second finding was the most dangerous thing either round
produced, and it verified exactly as written. `coach: true` is the only
notification category on by default. `defendedItems` filtered on area with
no protocol lookup. `say-the-loss-out-loud` — written for bereavement,
area `relationship` — was therefore pushable as *"Say it to one person in
45 minutes. Making it, or shall I move it?"* Its own safety line reads
"there is no correct timeline for this."

**The obvious fix was wrong, and the measurement is why.** The finding
proposed the filter `weeklyChanges.ts` uses: skip anything `neverNag`.
Applied to the library:

```
family + relationship protocols: 36
  of those, neverNag:            34
  left defendable:                2  (shared-money-agreement, money-date)
```

The wide guard silences `date-night`, `family-adventure`,
`device-free-meal`, `partner-reunion`, `one-on-one-child` — the entire
shelf the 17:15 defence was built for, and the practices Isaac named
directly in the balance reframe — and leaves the family coach two money
conversations. That is not a fix; it is switching the coach off and
calling it safety.

**What the measurement showed.** `neverNag` had been carrying two claims
in one boolean. Its docstring says "no streak, no adherence score, no
missed-it suggestion, **no nudge**". The first three are about the look
back and are right for all 34. The fourth is about the look ahead and is
wrong for almost all of them: nobody should be *scored* on a missed date
night, and everybody should be *asked* whether they are still making it,
because that question is the product.

So the flag split. `neverNag` keeps the look back, unchanged at every
existing call site. `neverAskAhead` is new, narrow, and reads: this
practice refuses a schedule, so do not ask for a commitment against one.
Five protocols carry it, each because its own copy refuses a timetable —
`say-the-loss-out-loud`, `shrink-the-plan`, `one-small-act`,
`one-person-a-week`, `write-it-three-times`. The test for the flag, in the
type: *is this a commitment the person made, or a door the app left open?
A commitment can be defended. A door is not knocked on.*

Of the five, exactly one (`say-the-loss-out-loud`) sits in an area the
coach push can reach. The dangerous case is closed and the coach keeps 33
of its 34 blocks.

**Why this is recorded rather than just shipped.** It is the fifth time
this round that a correct-looking guard had a large hidden behavioural
cost, and the first one that survived — because it was measured against
the library before it was written rather than after. Four earlier
attempts were withdrawn. The rule added to the machine after those
withdrawals is now paying: *measure the blast radius before writing the
finding, not after the tests fail.*

`reach.test.ts` pins both halves — the practice that must stay silent, and
the width of the shelf that must stay defendable, including an assertion
that `neverAskAhead` has not spread across the library. If that second
test ever fails, somebody has quietly switched the family coach off again.
