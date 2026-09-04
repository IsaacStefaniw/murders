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

## Also worth fixing before the retake is used

The pattern suggestion reads "You've moved 6 of your last 6 **training that
sticks** sessions to the evening". `src/lib/scheduling/adaptation.ts:194`
interpolates `routine.title.toLowerCase()` where the doc comment at `:152`
shows the intended shape with a generic noun — "6 of your last 8 workouts".
Any multi-word routine title garbles the sentence. It is the app's own output,
so the screenshot is honest; it just reads as broken.

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
