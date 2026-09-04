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
  // The diagram disclaimer this used to assert is gone, deliberately. It told a
  // reader that a visibly abstract diagram was not an app screenshot — a doubt
  // nobody had until it was raised — and spent the rest of its words on
  // "cross-domain arbitration", which is not the product's positioning and is
  // not language a visitor can parse. The disclosures that carry weight are
  // still asserted: no implied endorsement in film.test.mjs, and the education
  // boundary below.
  assert.match(
    html,
    /Education, never diagnosis or personal advice/i,
    "the health boundary is a legal requirement, not a stylistic choice",
  );
  // The film's screens are real, and saying so is a claim of strength rather
  // than a hedge — which is why that one stayed when the diagram's went.
  assert.match(html, /the shipped application&#x27;s own output|shipped application.s own output/i);
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

  // The three positioning sequences, one per claim Isaac set. Each is a
  // diagram of behaviour the app actually has, so each number below is checked
  // against the file that produces it rather than against the page that shows
  // it. If a sequence is ever replaced by prose again, this fails.

  // a) Proven protocols, synthesised and rated — protocols.ts.
  // The distribution is the asset: publishing that most of the library is
  // mid-grade is only worth doing if the grading is real.
  for (const figure of ["13", "60", "63", "33", "8"]) {
    assert.match(html, new RegExp(`>${figure}<`), `grade count ${figure} is missing`);
  }
  assert.match(html, /104 of 177 are C or weaker/, "the honest half of the library claim is gone");
  // toRoutine anchors morning-light to wake + 20; protocols.test.ts:118 pins 06:50.
  assert.match(html, /06:50/, "the placement the library sequence proves");
  assert.match(html, /Never look at the sun directly/, "the safety line must travel with the practice");

  // b) A program that lives with you — programme.ts.
  assert.match(html, /build, build, progress, deload/, "the four phased weeks");
  assert.match(html, /It shrinks when your week does/, "the beat no competitor shows");

  // c) Seven coaches, one profile — level.ts. These are LEVEL_THRESHOLDS
  // verbatim: training established is 36 sessions across 16 weeks, nutrition
  // developing is 10 across 4.
  assert.match(html, /36 sessions across 16 weeks/, "the training gate");
  assert.match(html, /10 sessions across 4 weeks/, "the nutrition gate");
  assert.match(html, /a top rung that cannot be selected/, "the ladder claim");
});
