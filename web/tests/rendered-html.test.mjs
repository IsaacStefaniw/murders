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

test("reps in reserve never returns, from anywhere", async () => {
  // This claim was removed from page.tsx and shipped anyway, because it also
  // lived in components/intent-motion/MotionProofs.tsx — the fix was applied
  // where the reviewer had been looking rather than everywhere the claim was.
  //
  // Reps in reserve is not an input to suggestNext and appears nowhere in the
  // app: grep the codebase and it returns nothing. The real rule is double
  // progression — every working set at the top of the range, reps held.
  //
  // Asserting against the rendered HTML rather than a file catches it wherever
  // it is written next.
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-rir`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("https://intentnorth.app/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const html = await response.text();

  assert.doesNotMatch(html, /reps in reserve/i, "the app has no concept of reps in reserve");
  assert.doesNotMatch(html, /\bRIR\b/, "same claim, abbreviated");

  // autoregulate() in features/training/programme.ts has two distinct paths and
  // the hero used to mix them. On the recovery path nothing drops a set: every
  // non-accessory exercise is kept and the accessory list is sliced to one.
  // Dropping a set belongs to fitToTime, the time-pressure path, and even there
  // whole accessories are removed before any set is trimmed. Attaching the
  // wrong mechanism to a recovery reason is the same class of error as the
  // volume percentage and the reps in reserve: a sentence about the app that
  // the app does not do.
  assert.doesNotMatch(
    html,
    /drops a set from the last accessory/i,
    "the recovery path removes accessories; it does not trim a set",
  );

  // The hero plays the causality rather than asserting it. Both halves of the
  // swap must be present, or the animation has silently become a static card
  // again — which is what Isaac found, twice.
  assert.match(html, /main work, then the accessory list/, "the hero lost its before state");
  assert.match(html, /main work stays, accessories rest today/, "the hero lost its after state");
  assert.match(html, /against your own baseline/, "the hero lost the signal that causes the change");
});
