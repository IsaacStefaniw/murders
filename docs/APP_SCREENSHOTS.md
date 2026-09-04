# Where these screenshots came from, and when

Captured by the app session and handed over in `014175c`. They are product
evidence, so the rule is the same one the copy follows: if the app changes what
a screen says, the screenshot is wrong until it is retaken.

## Pulled

**`app-today.jpg` is not on the site.** It shows the look-ahead card reading
"Nothing to look forward to this week. Saturday morning is open — dinner
somewhere new?", which is wrong twice and was fixed in the app after the
capture was taken:

- `ac1b51f` — an evening idea had been placed in a morning gap. Ideas now carry
  the slot they fit, and the weekend-gap suggestion asks for morning ones.
- `7d8446b` — the line opened on an absence and then named the thing it had
  just called absent.

That sentence now exists in the codebase only as a regression test
(`src/features/sim/__tests__/tone.test.ts`), which is the right place for it.
Publishing a screenshot of a fixed bug is worse than publishing no screenshot:
it is evidence, and it was evidence of a defect.

The file is kept in the repository rather than deleted so the next capture can
be compared against it. It is simply not referenced by any page.

## Still published

The other seven are unaffected by those two fixes — none of them shows the
look-ahead card.

## Before adding a screenshot back

Retake it from a build at or after the current `HEAD`, and record here which
commit it came from. A screenshot with no provenance cannot be checked for
staleness, and staleness is invisible: nothing fails, the page just quietly
shows a product that no longer exists.
