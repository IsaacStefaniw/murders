# Films, and the numbers that may sit beside them

> **Superseded 2026-09-04.** The films described here are the coaching-spine
> cut. The current hero and vertical are `intentnorth-intent-45s` and
> `intentnorth-intent-18s-vertical`, built to `docs/FILM_BRIEF.md` from the
> masters in `docs/film/`, and sit beside the old pair under
> `web/public/video/` (720p on the site, 1080p in Drive). The old pair stays
> until the website session switches the page over, so nothing 404s in
> between. The numbers below still hold and were re-counted for the brief.


Handover from the app session to the website session. Everything here is
the current cut and the current figures; anything not listed is not
approved to appear on the site.

## The two films

| File | Aspect | Resolution | Length | Size |
|---|---|---|---|---|
| `intentnorth-coaching-45s.webm` | 16:9 | 1280×720 | 48.00s | 2.0 MB (VP9) |
| `intentnorth-coaching-45s.mp4` | 16:9 | 1280×720 | 48.00s | 3.25 MB (H.264) |
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
file finishes arriving).

**Serve WebM first, MP4 as the fallback.** The 45s film was later re-encoded to
VP9 to carry the attribution caption, which brought it to 2.0 MB against the
MP4's 3.25 MB — so the size argument now points the other way from where this
file first put it. A browser takes the first source it can decode, so WebM
leads and the MP4 catches Safari before 14.1 and the in-app browsers.

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
- **145** of the 177 carry an explicit safety line. (The handover said 142.
  Re-counted line-by-line off the PROTOCOLS array: it is 145, and
  `tests/library-claims.test.mjs` now fails the build if the page and the data
  ever disagree again.)
- **188** distinct named researchers and practitioners cited.
- **7** pathways × **4** levels = **28** programme rungs.
- **72** test suites. Confirmed.

Three handover figures could **not** be reproduced from the code and are
therefore not used on the site:

- *36 intake questions* — walking the seven pathways' `questions` arrays plus
  the shared `DOMAIN_QUESTIONS` banks gives **15**. The 36 may count the goal
  wizard or the onboarding script; whatever it counts, it is not "intake
  questions across the pathways", so it is not publishable as that.
- *806 automated tests* — a static count of `it()`/`test()` calls gives **743**
  across the 72 suites. 806 is plausible once parameterised tests expand at
  runtime, but the root dependencies are not installed here and it was not
  verified. Publish the suite count, not the assertion count.
- *7,000 profiles / 150 people / 9,273 actions* — these are outputs of
  simulation runs, not constants in the source. Nothing in the tree confirms
  them, so nothing on the site claims them.

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

## Where this file lives, and why it moved

It used to sit in `web/public/video/`, which is the site's static asset root —
so it was being served at `https://intentnorth.app/video/README.md`. A document
listing the claims we decided were misleading, citing our own s18 exposure, and
recording that PRODUCT.md once sold an "AI-powered" product the build could not
deliver, was published on the marketing site. Nothing in `web/public/` is
private; treat that directory as the public internet, because it is.

`web/tests/public-assets.test.mjs` now fails the build if a Markdown file
appears under `web/public/` again.

## Disclaimer text — for the film re-cut

The 45s film shows six named educators as chips on its own overlay. Under
`CLAUDE.md` rule 9 that needs a visible no-endorsement line beside them, at a
size a viewer actually reads — not only the small grey line inside the phone
mock.

The website session composited this in as an interim fix. **If the film is
re-cut, the caption must be rebuilt in the source project**, because a re-cut
replaces the footage the caption was burned into.

### The line, verbatim

```
Attribution credits public work and implies no endorsement of IntentNorth.
```

Use exactly that wording. It is copied from `src/app/library.tsx`, so the app,
the film and the website all make the same statement in the same words. Do not
reword it per surface — a disclaimer that varies looks drafted rather than
meant.

The app pairs it with a first sentence that the film's own narration already
covers, so the film needs only the attribution half:

```
Educational structure, not medical advice. Attribution credits public work and
implies no endorsement of IntentNorth.
```

### Placement, as currently composited

Measured off the footage rather than estimated — the chip region's brightness
was sampled across the segment to find the real boundaries.

| Property | Value |
|---|---|
| Frame | 1280×720 |
| Chips fade in | 17.3s |
| Chips fully visible | 17.8s – 21.0s |
| Chips gone | 21.2s |
| Caption visible | 17.6s – 21.1s, fading in at 17.8s and out from 20.6s (0.4s each) |
| Position | x = 86px (aligned to the headline and the chip row), y = 536px (below the second chip row) |
| Size | 19px — the same size as the film's own body text, deliberately not smaller |
| Colour | `#a8baaf`, sampled from the film's existing muted green-grey |

The size is the point. A disclaimer set smaller than the claim it qualifies is
a disclaimer designed not to be read, and that is the thing rule 9 exists to
prevent.

### If the names are cut instead

Also fine, and simpler. The attribution belongs in the app's library screen,
where a reader has arrived deliberately and can see each practice's source,
evidence grade and limits. On a marketing film the names do more work for
credibility than they are worth in exposure. Dropping the chips removes the
requirement entirely.
