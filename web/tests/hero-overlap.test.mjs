import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * A negative margin outlived the thing it was overlapping.
 *
 * `.today-card` is pulled up 56px below 1120px so it sits over the bottom of
 * the hero photograph. Below 620px the photograph is hidden — and nothing reset
 * the pull, so on every phone the card climbed 56px over the trust row instead.
 * The card is 97.5% opaque, so the buried line did not vanish cleanly; it
 * ghosted through, which is how Isaac spotted it on a real handset.
 *
 * What it buried was "Hardest-moment support stays free" — the third trust
 * item, wrapped onto its own line at that width. That is the CLAUDE.md
 * boundary-6 principle, invisible on the devices most visitors use.
 *
 * The two rules are coupled and sit 320 lines apart in the stylesheet. This
 * asserts the coupling directly: wherever the hero image is hidden, the card
 * that was positioned against it must stop being positioned against it.
 */

function blockAt(css, query) {
  const start = css.indexOf(query);
  if (start === -1) return null;
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return null;
}

test("the today card stops overlapping once the hero photo is hidden", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  const pull = blockAt(css, "@media (max-width: 1120px)");
  assert.ok(pull, "the 1120px breakpoint moved; this test needs rewriting, not deleting");
  assert.match(
    pull,
    /\.today-card\s*\{[^}]*margin-top:\s*-\d/,
    "the overlap pull is gone from the tablet breakpoint — if that was deliberate, this guard is obsolete",
  );

  const phone = blockAt(css, "@media (max-width: 620px)");
  assert.ok(phone, "the 620px breakpoint moved; this test needs rewriting, not deleting");

  const hidesPhoto = /\.hero-image-wrap\s*\{[^}]*display:\s*none/.test(phone);
  if (!hidesPhoto) return; // The photo is shown here now, so the pull is meaningful again.

  assert.match(
    phone,
    /\.today-card\s*\{[^}]*margin-top:\s*0/,
    "the hero photo is hidden on phones but the card still pulls up over the trust row, "
      + "burying \"Hardest-moment support stays free\" under a near-opaque card",
  );
});
