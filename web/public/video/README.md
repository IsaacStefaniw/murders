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

**Format caveat.** WebM, **VP8** — verified from the container headers
(`V_VP8`, muxed by libavformat 61). An earlier version of this file said
VP9; that was inferred rather than checked, and it was wrong. Nothing about
the recommendation changes, but the reasoning underneath it does, so it is
corrected here rather than quietly.

There is no MP4/H.264 fallback, and none could be produced in the app
container — it has no ffmpeg. Safari gained WebM playback in 14.1, but
coverage on older iOS and inside in-app browsers is unreliable, and those
viewers see nothing rather than degrading. Ship an H.264 MP4 alongside, in
a `<video>` with both sources and a poster frame. Do not put WebM alone on
a marketing page without deciding to.

**Generation loss.** These files are not a first-generation export. Any
further step that re-encodes them — burning in a disclaimer over the
finished video, for instance — costs another generation on top. The master
is the HTML the film is rendered from (`film5.py` / `film6.py` generate
`film5.html` / `film6.html`, and the app screenshots they embed are all
still held in the app session's scratchpad). Anything that needs to appear
in the frame — a disclaimer, a changed end card, a different CTA — belongs
in that source and should be re-rendered once, not composited onto the
encode. Ask the app session for a re-export rather than editing these.

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

## Where video should live

Not here, past these two. The repository now carries ~7 MB of binaries and
git keeps every version of them forever — a re-cut does not replace the old
blob, it adds to it, and the clone gets slower for everyone permanently.

These two stay for now because the website session needs them and already
has them. Anything further — more cuts, other aspect ratios, a re-export —
belongs in R2 or Cloudflare Stream, with the site referencing a URL. Stream
also solves the format problem for free: it transcodes to the right codec
per viewer, which removes the MP4 fallback work above entirely.

Moving these two out afterwards is a separate decision, and removing them
from git history is more destructive than it looks — it rewrites every
commit after them and breaks any checkout already pulled. Worth doing
deliberately, once, not as a side effect.
