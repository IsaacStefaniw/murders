import assert from "node:assert/strict";
import test from "node:test";

/**
 * Words a stranger cannot read.
 *
 * Isaac showed the site to people. None of them could say what it was. The
 * questions back were "what's Upper A?", "what's optimised one slice?" and
 * "what's a coach?" — and every one of those is a word we chose.
 *
 * A count of the rendered page found pathway ten times, block nine, levels
 * eight, specialist eight, accessories nine, deload four, Upper A three. All
 * of it precise. None of it readable by someone who has not already bought in.
 *
 * The product-truth guardrails stop us saying things that are false. Nothing
 * stopped us saying true things nobody understands, which is how a page can be
 * accurate, well built, and useless. This is that check.
 *
 * A term goes on this list when it is domain vocabulary a general reader would
 * have to look up. A term comes off it only when the page teaches it in plain
 * words before using it — see ALLOWED_ONCE_DEFINED.
 */
const BANNED = [
  ["Upper A", "the name of a gym session, not a thing anyone else says"],
  ["deload", "training jargon; say 'an easier week'"],
  ["accessory", "training jargon; say 'the smaller exercises'"],
  ["accessories", "training jargon; say 'the smaller exercises'"],
  ["phased week", "invented compound; say what the weeks do"],
  ["operating profile", "we mean 'your profile'"],
  ["operating system", "we are not one; nobody shops for one"],
  ["rung", "metaphor stacked on a metaphor; say 'level'"],
  ["one slice", "means nothing outside our own heads"],
  ["arbitration", "nobody says this about their week"],
  ["autoregulat", "not a word in general use"],
  ["prescription", "kept from the old guardrail: never claim to prescribe"],
  ["pathway", "our internal word for an area of someone's life"],
  ["specialist depth", "means nothing to a reader"],
  ["training block", "say 'four-week plan'"],
];

/**
 * Terms the product genuinely needs, which the page must teach before it
 * leans on them. Isaac's positioning is built on protocols and ratings, so
 * "protocol" stays — but the page has to say what one is, in plain words,
 * before it counts on the reader knowing.
 */
const ALLOWED_ONCE_DEFINED = [
  ["protocol", /a protocol is|protocols are|practices we call protocols/i],
  ["coach", /each coach is|a coach is|the coaches are/i],
];

/** The rendered page, the same way every other guardrail here gets it. */
async function renderedHtml() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
  );
  return response.text();
}

function visibleText(html) {
  return html
    .replace(/<(script|style|svg)[^>]*>[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#x?[0-9a-f]+;/gi, " ")
    .replace(/\s+/g, " ");
}

test("the page does not use words a stranger would have to look up", async () => {
  const text = visibleText(await renderedHtml());

  const found = BANNED
    .filter(([term]) => new RegExp(`\\b${term}`, "i").test(text))
    .map(([term, why]) => `"${term}" — ${why}`);

  assert.deepEqual(
    found,
    [],
    `jargon a first-time reader cannot parse:\n  ${found.join("\n  ")}`,
  );
});

test("terms the product needs are taught before they are used", async () => {
  const text = visibleText(await renderedHtml());

  for (const [term, definition] of ALLOWED_ONCE_DEFINED) {
    if (!new RegExp(`\\b${term}`, "i").test(text)) continue;
    assert.match(
      text,
      definition,
      `the page uses "${term}" without ever saying what one is`,
    );
  }
});
