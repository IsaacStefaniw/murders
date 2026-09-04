import assert from "node:assert/strict";
import test from "node:test";

test("renders the approved positioning and primary CTA", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  // Product truth: the approved core line and the single CTA vocabulary.
  assert.match(html, /Your results should change what happens next/);
  assert.match(html, /Build my profile/);
  // Truth guardrail: public copy never uses "prescription".
  assert.doesNotMatch(html, /prescription/i);
  // Engineering proof is transparent without presenting synthetic outcomes
  // or unverified release and privacy claims as customer evidence.
  assert.match(html, /diagram represents product behaviour, not a fabricated app screen/i);
  // The interactive profile builder is a client component, so assert its
  // server-rendered disclosure rather than dialog copy loaded after hydration.
  assert.match(html, /Profile and first insight are free/i);
  assert.match(html, /Complete programs are premium/i);
  assert.match(html, /Reduce what keeps winning/);
  assert.match(html, /We never charge for someone’s hardest moment/);
  assert.doesNotMatch(html, /364,000|96%|closed beta|stays local/i);
  // Sites serves these local assets directly. Routing them through the Next
  // image optimizer breaks the desktop photography in the hosted runtime.
  assert.match(html, /src="\/images\/intent-os-hero-family-transition-v2\.webp"/);
  assert.match(html, /src="\/images\/intent-os-behaviour-change-v2\.webp"/);
  assert.match(html, /src="\/images\/intent-performance-retina\.webp"/);
  assert.doesNotMatch(html, /\/_next\/image\?/);
});

test("the page says which device this runs on, before it asks for five minutes", async () => {
  // The product is iOS-only: HealthKit, StoreKit and the EAS profiles all
  // assume it. An Android visitor who completes the profile builder and only
  // then discovers that has been wasted, and the first thing they learn about
  // the company is that it let that happen.
  //
  // This fails when Android ships, which is the right time to rewrite it.
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-platform`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("https://intentnorth.app/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const html = await response.text();

  assert.match(html, /iPhone only today/, "the CTA must disclose the platform before the time cost");
  assert.match(html, /Which devices\?/, "the FAQ must answer the platform question");
});
