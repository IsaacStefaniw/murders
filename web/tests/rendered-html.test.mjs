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
  // CLAUDE.md's core proposition, said in words a stranger can read. The
  // abstract form — "your results should change what happens next" — was in
  // the lede and was part of why nobody could say what this was.
  assert.match(html, /changes the plan when your week changes/i);
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
  // The hero's animated card is gone. Isaac showed the site to people, none of
  // whom could say what it was, and the card was the worst of it: "Upper A",
  // "accessories" and "HRV against your own baseline" in the first thing a
  // stranger reads. It is a photograph of a real week now, and the claim it
  // used to act out is asserted here in the words the page actually uses.
  assert.match(html, /app-protocol-3-week-after\.jpg/, "the hero lost its real screen");
  assert.match(html, /turned into a plan you can follow/, "the hero lost the plain statement of what this is");
  assert.match(html, /changes the plan when your week changes/i, "the hero lost the differentiator");
  // Three steps, in order, replacing three abstractions nobody could parse.
  assert.match(html, /Tell it what you want/, "step one");
  assert.match(html, /It writes your week/, "step two");
  assert.match(html, /It changes when you do/, "step three");

  // The three animations are gone. Isaac's user test was unambiguous: they
  // explained mechanisms to people who had not yet been told what the product
  // was. What they claimed is now claimed in words and real screens, and this
  // guards the claims rather than the diagrams that used to carry them.

  // a) The practices are rated, and the weak ratings are published. The counts
  // are checked against src/features/knowledge/protocols.ts.
  for (const figure of ["13", "60", "63", "33", "8"]) {
    assert.match(html, new RegExp(`>${figure}<`), `rating count ${figure} is missing`);
  }
  assert.match(html, /A protocol is a practice/, "the page must say what a protocol is before leaning on the word");
  // The captures the app session took: the same seeded week before and after
  // toggleProtocol('morning-light'), 15 items becoming 16. Provenance is in
  // docs/APP_SCREENSHOTS.md.
  assert.match(html, /app-protocol-1-library\.jpg/, "the library capture");
  assert.match(html, /Never look at the sun directly/, "the safety note must be shown, not described");

  // b) The plan is written for you and changes itself. Said plainly now.
  assert.match(html, /two to build, one harder, one easier/, "the four weeks, in words a reader knows");
  assert.match(html, /instead of being cancelled|instead of cancelling it/, "what happens on a bad week");

  // The three claims in the first viewport. CLAUDE.md's definition of done
  // asks that the category difference be understandable there, and the band
  // that used to be the only place it appeared sits 1,325px down on a phone.
  // These are the same three numbers the sequences below prove.
  assert.match(html, /177<\/dt>|>177</, "the library figure left the hero");
  assert.match(html, /each rated A to E/, "the first pillar");
  assert.match(html, /plans to write yourself/, "the second pillar");
  assert.match(html, /parts of your life, one plan/, "the third pillar");
  // The costly signal is the whole reason the first pillar works.
  assert.match(html, /104 of them|104 of the 177/, "the honesty that makes the ratings credible");
  // A reader has to be told what a rating means, not shown a letter.
  for (const word of ["Strong", "Good", "Mixed", "Thin", "Practice"]) {
    assert.match(html, new RegExp(`>${word}<`), `the rating scale lost "${word}"`);
  }
});
