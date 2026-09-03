# Films, and the numbers that may sit beside them

Handover from the app session to the website session. Everything here is
the current cut and the current figures; anything not listed is not
approved to appear on the site.

## The two films

| File | Aspect | Resolution | Length | Size |
|---|---|---|---|---|
| `intentnorth-coaching-45s.webm` | 16:9 | 1280×720 | 48.00s | 5.2 MB |
| `intentnorth-coaching-45s.mp4` | 16:9 | 1280×720 | 48.00s | 3.1 MB |
| `intentnorth-coaching-16s-vertical.webm` | 9:16 | 720×1280 | 17.44s | 1.7 MB |
| `intentnorth-coaching-16s-vertical.mp4` | 9:16 | 720×1280 | 17.44s | 1.2 MB |

Plus `-poster.jpg` beside each pair. Neither film has an audio track, so both
can autoplay muted without a user gesture.

Durations are measured, not estimated — the 45s cut is 48.00s and the vertical
is 17.44s. The filenames round; the `<video>` markup should not.

Both end on the card `intentnorth.app`. Do not ship either with a
destination that 404s — an end card is a promise.

The 45s cut leads on the coaching spine: the science, the guidance, the
seven coaches. Scheduling is deliberately demoted to the closing seconds,
because arbitration is the last layer rather than the value. The 16s
vertical carries one claim only — a real session, decided, that moves when
your own numbers move — because a feed gives you one idea and about three
seconds.

**Format — resolved, and one correction.** The handover said VP9; the files
are actually **VP8** (`ffprobe`: `Video: vp8`). That matters, because VP8 is
markedly less efficient — re-encoding to H.264 at CRF 23 produced a *smaller*
file than the VP8 original in both cases (5.2 MB → 3.1 MB, 1.7 MB → 1.2 MB)
at equivalent quality. The WebM encodes are simply inefficient.

The H.264 fallbacks now exist, made in the website session with an ffmpeg
binary pulled from the `imageio-ffmpeg` PyPI wheel: High profile, `yuv420p`,
`+faststart` (moov atom verified ahead of mdat, so playback starts before the
file finishes arriving). Serve both sources, MP4 first — it is the smaller
file here as well as the more compatible one.

These are transcodes of a VP8 encode, so they carry a generation of loss. If
the source project is still to hand, re-exporting H.264 directly from the
master would be better than either file here.

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

## What the website session changed

**The 45s film now carries the attribution disclaimer in-frame.** It showed six
surnames as large chips on its own overlay while the only no-endorsement line
sat as small grey text inside the phone mock — the protection existed, but not
on the surface a viewer reads. Isaac's call was that it needed to be visible
beside the names.

The line — `Attribution credits public work and implies no endorsement of
IntentNorth.`, taken verbatim from `src/app/library.tsx` so the app, the film
and the site all say the same sentence — is composited under the chip rows from
17.6s to 21.1s, fading with the segment. The window was measured off the
footage by sampling brightness in the chip region, not guessed: chips fade in
at 17.3s, are solid 17.8–21.0s, and are gone by 21.2s.

`drawtext` is not compiled into the imageio-ffmpeg build, so the caption is a
PIL-rendered RGBA still composited with `overlay`. It is set at 19px to match
the film's own body text, in the film's own muted green (#a8baaf sampled from
the frame), so it reads as part of the design rather than as a legal sticker.

**Both sources were re-encoded** so the WebM and the MP4 carry the same
disclaimer — shipping the caption in only one would show the names bare to
whichever browsers picked the other. The WebM is now VP9 rather than VP8 and
came out at 2.0 MB against the MP4's 3.2 MB, so the page lists WebM first and
keeps MP4 as the compatibility fallback.

The vertical cut shows no named figures and is unchanged.

Both are transcodes of a VP8 original and carry that generation of loss. A
re-export from the master, with the disclaimer done in the source project,
would beat what is here.
