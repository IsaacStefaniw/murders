import assert from "node:assert/strict";
import test from "node:test";

/**
 * IntentNorth owns more than one name. intentnorth.app is the product's
 * address; instinctnorth.app is held so the near-miss cannot be taken and so a
 * mistyped or misheard name still lands somewhere real.
 *
 * The alias must never serve the site. Two hosts answering with the same HTML
 * split the link equity and let a search engine choose the canonical for us —
 * and an end card, an App Store listing and a business card all promise one
 * address. These assertions are about that promise, not about routing trivia.
 */

async function fetchHost(url) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${url}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(url, { headers: { accept: "text/html" }, redirect: "manual" }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("the alias domain redirects to the canonical one, permanently", async () => {
  for (const host of [
    "instinctnorth.app",
    "www.instinctnorth.app",
    "www.intentnorth.app",
    "intentnorth.com.au",
    "www.intentnorth.com.au",
  ]) {
    const response = await fetchHost(`https://${host}/`);
    assert.equal(response.status, 301, `${host} should redirect permanently`);
    assert.equal(response.headers.get("location"), "https://intentnorth.app/");
  }
});

test("a redirected deep link keeps its path and query", async () => {
  const response = await fetchHost("https://instinctnorth.app/privacy?ref=appstore");
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://intentnorth.app/privacy?ref=appstore",
  );
});

test("the canonical host serves the site rather than redirecting to itself", async () => {
  const response = await fetchHost("https://intentnorth.app/");
  assert.equal(response.status, 200);
});

test("preview and local hosts are left alone", async () => {
  // The workers.dev URL is how a deploy gets checked before DNS is moved, and
  // localhost is how the site is developed. Redirecting either would make the
  // canonical rule impossible to test against a real deployment.
  for (const url of ["http://localhost/", "https://intent-operating-system.workers.dev/"]) {
    const response = await fetchHost(url);
    assert.equal(response.status, 200, `${url} should be served, not redirected`);
  }
});

test("the Australian domain keeps its path across the hop", async () => {
  // .com.au is the name an Australian visitor is most likely to type, so its
  // deep links matter more than the other aliases' — someone arriving at the
  // privacy page from an App Store listing should land on the privacy page.
  const response = await fetchHost("https://intentnorth.com.au/support?utm_source=appstore");
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://intentnorth.app/support?utm_source=appstore",
  );
});
