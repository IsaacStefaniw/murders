import assert from "node:assert/strict";
import test from "node:test";
import { readFile, stat } from "node:fs/promises";

/**
 * The film is the one place the site shows the product moving, so it carries
 * the same product-truth weight as the copy around it.
 *
 * Two things are locked here. First, the film must not cost anything on load:
 * it is click-to-play with preload="none", because a 48-second file that
 * autoplays is three megabytes spent on visitors who never asked to watch.
 * Second, both sources must exist — a <video> with only WebM shows nothing at
 * all on Safari before 14.1 and in some in-app browsers, rather than degrading.
 */

async function renderHome() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-film`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("https://intentnorth.app/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  return response.text();
}

test("the film is offered, not forced", async () => {
  const html = await renderHome();
  assert.match(html, /Play the film/i, "the play control should be in the markup");
  // The poster is what loads; the video itself must not be fetched up front.
  assert.match(html, /intentnorth-coaching-45s-poster\.jpg/);
  // The real invariant, stated directly rather than as a lookahead that can
  // pass because there is nothing to match: on first paint there is no <video>
  // element at all, so no browser can begin fetching megabytes uninvited.
  assert.doesNotMatch(html, /<video/i, "no <video> element may exist before the visitor asks");
  assert.doesNotMatch(html, /\.mp4|\.webm/i, "no video source may be referenced on first paint");
});

test("both video sources ship, so no browser gets a blank frame", async () => {
  for (const file of [
    "public/video/intentnorth-coaching-45s.webm",
    "public/video/intentnorth-coaching-45s.mp4",
    "public/video/intentnorth-coaching-45s-poster.jpg",
  ]) {
    const info = await stat(new URL(`../${file}`, import.meta.url));
    assert.ok(info.size > 1000, `${file} should be a real file`);
  }
  // The component names both, so a browser that cannot decode one still plays
  // the other. Checked in the source, because the markup only appears on click.
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /intentnorth-coaching-45s\.webm" type="video\/webm"/);
  assert.match(page, /intentnorth-coaching-45s\.mp4" type="video\/mp4"/);
});

test("the poster is a frame you can actually see", async () => {
  // A poster grabbed during the opening fade was a near-black rectangle: the
  // section rendered as an empty box and nothing suggested a film was there.
  // JPEG carries its dimensions in the SOF marker; a frame this size that is
  // also this small on disk is the signature of a blank grab.
  const poster = await readFile(new URL("../public/video/intentnorth-coaching-45s-poster.jpg", import.meta.url));
  assert.equal(poster[0], 0xff, "poster should be a JPEG");
  assert.equal(poster[1], 0xd8, "poster should be a JPEG");
  assert.ok(
    poster.length > 20_000,
    `poster is ${poster.length} bytes — an almost-black frame compresses to far less than a real one`,
  );
});

test("the attribution disclaimer travels with the names", async () => {
  // The film shows six named educators. The no-endorsement line is burned into
  // the footage beside them, but the page states it too — a viewer who never
  // presses play still sees why those names are there.
  const html = await renderHome();
  assert.match(html, /implies no endorsement/i);
});
