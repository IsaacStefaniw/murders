# The masters

These generate the HTML the films are rendered from. Anything that needs to
appear in the frame — a disclaimer, a changed end card, a different CTA —
is changed HERE and re-rendered once.

Compositing it onto a finished encode instead costs a generation of quality
for something that could have been free, and the committed films are
already not first-generation.

Running one writes `film5.html` / `film6.html`, which is then recorded by a
headless browser at the size the CSS declares (1280x720 landscape,
720x1280 vertical). Each script base64-inlines app screenshots from
`shots/`, `shots2/` and `shots4/`; those live in the app session's
scratchpad and are NOT in the repo, so ask that session for a re-export
rather than assuming these run standalone.

Kept next to the output on purpose: a master that lives only in a
scratchpad is a master that is one container restart from gone.
