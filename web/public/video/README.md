# Films, and the numbers that may sit beside them

Handover from the app session to the website session. Everything here is
the current cut and the current figures; anything not listed is not
approved to appear on the site.

## The two films

| File | Aspect | Resolution | Length | Size |
|---|---|---|---|---|
| `intentnorth-coaching-45s.webm` | 16:9 | 1280×720 | ~45s | 5.2 MB |
| `intentnorth-coaching-16s-vertical.webm` | 9:16 | 720×1280 | ~16s | 1.7 MB |

Both end on the card `intentnorth.app`. Do not ship either with a
destination that 404s — an end card is a promise.

The 45s cut leads on the coaching spine: the science, the guidance, the
seven coaches. Scheduling is deliberately demoted to the closing seconds,
because arbitration is the last layer rather than the value. The 16s
vertical carries one claim only — a real session, decided, that moves when
your own numbers move — because a feed gives you one idea and about three
seconds.

**Format caveat.** WebM (VP9) only. This container has no ffmpeg, so no
MP4/H.264 fallback could be produced here. Safari has supported VP9 WebM
since 14.1, but older Safari and some in-app browsers will show nothing
rather than degrade. Either transcode before launch or use `<video>` with
a poster frame and both sources. Do not ship WebM alone to a marketing
page without checking that decision deliberately.

## Numbers that are true

Counted from the shipped code on the date of this handover, not estimated.
Re-count before reuse; they move every week.

- **177** protocols in the library, every one carrying an evidence grade
  and an attribution.
- Evidence grades: **13 A**, **60 B**, **63 C**, **33 D**, **8 E**. If a
  headline number is used, it must not imply all 177 are strongly
  evidenced — 73 of 177 are A or B.
- **142** of the 177 carry an explicit safety line.
- **188** distinct named researchers and practitioners cited.
- **7** pathways × **4** levels = **28** programme rungs.
- **36** intake questions across the pathways.
- **806** automated tests across 72 suites.
- Simulation: **7,000** profiles through the pathway audit; **150** people
  through **9,273** actions in the journey harness.

## Numbers that are NOT true, and must not appear

"10,000 journal articles" and "100,000 hours of podcast" were illustrative
examples in conversation, never findings. Nothing has counted them and
nothing supports them. Publishing either would be misleading conduct under
s18 of the Australian Consumer Law, which has no intent requirement.

The same discipline applies to everything on the site: no fabricated
testimonials, results, pricing, App Store availability or privacy claims.
The claims register and `src/features/__tests__/claims.test.ts` exist
because copy drifted ahead of the code once already — PRODUCT.md sold an
"AI-powered" product while the build ran zero inference. The app still
performs no inference; `getAiProvider()` returns null without a configured
backend, and no shipped build has ever had one. The site must not say
otherwise.

Use "program", "plan" or "protocol". Never "prescription".
