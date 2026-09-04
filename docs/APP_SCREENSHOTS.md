# Where these screenshots came from, and when

They are product evidence, so the rule is the same one the copy follows: if
the app changes what a screen says, the screenshot is wrong until it is
retaken. Every file under `web/public/images/app/` is listed here with the
commit it was captured from. A capture with no provenance cannot be checked
for staleness, and staleness is invisible: nothing fails, the page just
quietly shows a product that no longer exists.

## Current set — captured 2026-09-04 from `7b7f690`

All eight retaken together from a fresh `expo export --platform web` of that
commit, rendered by headless Chromium at 420×900 CSS pixels, 3× scale,
`Australia/Sydney`, then downsampled to 840×1800 JPEG. State was seeded into
`localStorage` before first paint (the same seed as the App Store
screenshots: onboarded, Plus on, sex at birth recorded, twelve logged
workouts across six weeks, the recovery path not yet started for the
habits screen). Every sentence in them is the app's own output.

| File | Route and state | Shows |
|---|---|---|
| `app-today.jpg` | `/today` | The morning readout with the sleep-debt line, the pattern suggestion, the Now card |
| `app-coaches.jpg` | `/life` | The profile question and the paths list |
| `app-training.jpg` | `/path/training`, scrolled to "This block" | The four-session block and Start today's session |
| `app-workout.jpg` | Start today's workout from the training hub | The session with the sleep row unanswered |
| `app-workout-autoreg.jpg` | Same, after tapping "Under 6h" | "Short night — main work stays, accessories rest today." |
| `app-level-card.jpg` | `/path/training`, scrolled to "Where you are" | Level, sessions and weeks toward the next, population tables, strongest lifts |
| `app-library.jpg` | `/library` | Morning light with its evidence grade and safety line |
| `app-recovery.jpg` | `/path/recovery`, path not started | The habit picker |

One honesty note for the website session. `app-today.jpg` shows the
sleep-debt paragraph ("Sleep debt 3h 45m over the last 13 nights…"), which
is in the code at `7b7f690` and is part of the over-the-air update held
back until Apple approves 1.0. The App Store build in review (16) does not
show it yet; the update ships the day the approval lands. If the site goes
live before that, the caption should not promise sleep debt as shipped, or
the Today screen should wait for the update.

## Held back right now

`app-today.jpg` is captured, accurate to `7b7f690`, and **not on the site** —
acting on the honesty note above rather than despite it.

The sleep-debt paragraph it shows ships over the air only once Apple approves
1.0. Build 16, the one currently in review, does not contain it. A reviewer
comparing the marketing site against the binary in front of them is exactly the
audience that would notice, in exactly the window where it matters, and the
cost of waiting is one screenshot out of eight for a few days.

The alternative the note offers — caption it as not-yet-shipped — was not taken
because the section's whole framing is "every sentence in these is the shipped
application's own output". One asterisked exception weakens that claim for the
other seven.

**Restore it the day the update ships.** Add `app-today` back to `appScreens`
in `web/app/page.tsx` and delete the assertion in
`web/tests/library-claims.test.mjs` that blocks it.

## Fixed: the garbled pattern sentence

"You've moved 6 of your last 6 **training that sticks** sessions to the
evening" is gone. `src/lib/scheduling/adaptation.ts` now keeps the routine's
title as the app names it: "You've moved Training that sticks to the evening
6 of the last 6 times — and completed 4 of them." The current `app-today.jpg`
was recaptured after the fix, from the same seed.

## The example day — captured 2026-09-04, the commit that adds it

`app-example-day.jpg` is the `/example-day` screen, reachable from the
welcome screen before a single question is asked. No seed: the screen
builds its own person (Sam: set hours, three training days, a partner and
two kids, broken sleep, health first) through the interview builder, starts
every coach through the same pathway builders a real profile uses, merges
them the way the store does, and runs the next Monday through the
scheduler. Every line on it is the planner's output for that person; change
the answers in `src/app/example-day.tsx` and the day changes.

What it shows, top to bottom: protein at breakfast, morning light, a
ninety-minute growth block and an hour of deep work carved out of the work
hours, the remaining work as a block with its length, lunch kept free with
the session inside it, the afternoon block, the shutdown ritual closing the
work day, the family dinner with tonight's dish decided, the walk, one
thing named for the relationship, the two-minute reset, the wind-down.

Same capture settings as the set above (420×900, 3×, downsampled to
840×1800). The scratchpad also holds the full length of the screen at 2×
(`app-example-day-full.png`, 840×3440), which is the one that proves the
whole day; the 840×1800 fold ends at the afternoon work block.

Four engine fixes came out of looking at this screen, and they change the
real Today for anyone with the same coaches running: no slivers of "Work"
shorter than half an hour, one family dinner rather than the interview's
and the family pathway's, one breath reset rather than the build's and the
rung's, and the shutdown ritual anchored to the end of the work hours
instead of being pushed past dinner. `src/features/paths/__tests__/oneOfEach.test.ts`
holds all four.

## The protocol sequence — captured 2026-09-04 for `docs/APP_CAPTURE_REQUEST.md`

Three of the four frames asked for, from one seeded state, one week, one
protocol (`morning-light`, free tier, wake-anchored). Same capture settings
as the set above (fresh web export of the capture commit, 420×900 at 3×,
`Australia/Sydney`, 840×1800 JPEG).

The seed is the film seed (the App Store seed with all seven coaches
started) with two documented changes so the sequence is reachable: the
clock set to **Monday 7 September, 6:15am Sydney** via `clockOffsetMs`, so
the Week tab's expanded day is Monday; and the person's priority order set
to **family, health, work**, which is the order under which a family
commitment can take a health practice's hour. The plans for the coming
seven days were regenerated under that order before frame 2.

| File | Route and state | Shows |
|---|---|---|
| `app-protocol-1-library.jpg` | `/library`, scrolled to Sleep & energy | Morning light with Evidence B, its safety line, and **Add to my plan** unpressed |
| `app-protocol-2-week-before.jpg` | `/plan`, Monday expanded, before the add | 15 planned; 7am Protein at breakfast, 8:15am Training that sticks; no Morning light |
| `app-protocol-3-week-after.jpg` | `/plan`, same Monday, after `toggleProtocol('morning-light')` | 16 planned; **7:25am Morning light** placed by the scheduler between the two |

**Frame 4 was not captured, on purpose.** Every honest route tried produced
the wrong sentence:

- A family block on Monday morning (a 45-minute school run at 6:50, 7:15,
  7:20 or 7:30) does displace Morning light — but the scheduler *drops* it
  rather than moving it, even when 20–45 free minutes remain inside its
  6:50–7:35 window. It lands in the day's displaced list with no new time,
  and the header reads "3 things moved to make room for family — Protein at
  breakfast is now at 7:10pm", which names a different practice.
- Under the App Store seed's own order (health, family, work) nothing
  outranks a health practice, so no move is ever attributed; the app says
  nothing, by design.
- A wake-time change moves the practice, but the app gives no reason on
  screen for it.

So the frame the page wants — the same protocol at a different time with
the app's reason beside it — does not exist in the product today. The first
finding is a real scheduler weakness worth its own fix (a ten-minute
could-tier practice should be squeezed into a free gap in its window before
it is cut), and it is logged in the competitive review's debt list rather
than papered over with a caption.

## History

`app-today.jpg` was pulled from the strip on 2026-09-04 because its capture
predated two app fixes (`ac1b51f`, `7d8446b`) and showed the look-ahead
card reading "Nothing to look forward to this week. Saturday morning is
open — dinner somewhere new?". The retake above replaces it; the guard in
`web/tests/library-claims.test.mjs` that blocked the stale file was
removed with the retake.

## Before changing a screenshot

Retake it from a build at or after the current `HEAD`, and record here which
commit it came from.
