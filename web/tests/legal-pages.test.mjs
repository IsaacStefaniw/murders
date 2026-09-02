import assert from "node:assert/strict";
import test from "node:test";

/**
 * Apple will not accept an App Store submission without a reachable privacy
 * policy URL and support URL, and rejects late in the process when one 404s.
 * These routes are therefore a release dependency, not content — so they are
 * locked here alongside the claims they make.
 *
 * The privacy assertions are deliberately about accuracy, not presence: the
 * page states that Health data is read-only and stays on the device, and that
 * there is no analytics SDK. If the app ever stops being true to that, this
 * test should be updated in the same commit that changes the app.
 */

async function render(path) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  return { response, html: await response.text() };
}

test("serves the privacy policy Apple requires, and states what is true", async () => {
  const { response, html } = await render("/privacy");
  assert.equal(response.status, 200);
  assert.match(html, /Privacy/);
  // Health data handling — the claims Apple holds HealthKit apps to.
  assert.match(html, /read-only/i);
  assert.match(html, /never writes to Apple Health/i);
  assert.match(html, /never used for advertising/i);
  // The core position. If any of these stop being true, change the app or
  // change this page — never leave the page saying the comfortable thing.
  assert.match(html, /no analytics SDK/i);
  assert.match(html, /there is no sign-in/i);
  // The two disclosed egress paths must stay disclosed.
  assert.match(html, /Expo Application Services/);
  // Never claim a protection the build does not have.
  assert.doesNotMatch(html, /end-to-end encrypt|military-grade|anonymi[sz]ed and stored/i);
});

test("serves the support page with a route out to real help", async () => {
  const { response, html } = await render("/support");
  assert.equal(response.status, 200);
  assert.match(html, /support@intentnorth\.app/);
  // Crisis routing must come before any product answer on this page.
  assert.match(html, /Lifeline/);
  assert.match(html, /13 11 14/);
  // Apple requires that subscription management points at Apple, not us.
  assert.match(html, /reportaproblem\.apple\.com/);
  // The permanent free promise.
  assert.match(html, /free, permanently/i);
});

test("every page carries the privacy and support links", async () => {
  const { html } = await render("/");
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /href="\/support"/);
});

test("the contact addresses are on a domain the product owns", async () => {
  // These pages once published support@ and privacy@ at intentnorth.com, which
  // is held by a parker. That is not a dead link — it is mail addressed to
  // someone else, sent by users describing a habit they are trying to break,
  // and by an App Store reviewer whose reply never arrives. An address is a
  // promise that someone is on the other end of it.
  //
  // Every address on these pages must sit on a domain listed here. Adding a
  // domain to this list is a claim that it is registered to IntentNorth and
  // that its mail is routed somewhere a person reads.
  const OWNED = new Set(["intentnorth.app", "instinctnorth.app"]);

  for (const path of ["/privacy", "/support"]) {
    const { html } = await render(path);
    const addresses = [...html.matchAll(/mailto:[^"'\s>]+@([A-Za-z0-9.-]+)/g)];
    assert.ok(addresses.length > 0, `${path} should offer a way to make contact`);
    for (const [, domain] of addresses) {
      assert.ok(
        OWNED.has(domain.toLowerCase()),
        `${path} publishes an address at ${domain}, which IntentNorth does not own`,
      );
    }
  }
});
