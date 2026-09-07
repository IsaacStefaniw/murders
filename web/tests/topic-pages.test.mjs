import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/**
 * The six topic pages, checked against the library they claim to quote.
 *
 * These pages exist to publish a grade — that is the entire reason they can
 * compete with Mayo Clinic and Healthline on terms those sites already own.
 * So the failure that matters is not a broken link. It is a page saying
 * "rated B" for a practice the app rates D, or a supplement page rendering
 * without the safety note that tells a reader with a kidney condition to ask
 * a doctor first.
 *
 * Both are prevented by construction — components/EvidenceTopic.tsx reads
 * grade, label and safety out of app/evidence/library.json — and both are
 * checked here anyway, in the rendered HTML, because "prevented by
 * construction" has been wrong before in this project: the hero guardrail
 * passed for two days while asserting against an Open Graph tag rather than
 * the visible headline.
 */

const PAGES = [
  { route: "/magnesium-for-sleep", id: "magnesium-honest" },
  { route: "/sauna-benefits", id: "sauna" },
  { route: "/cold-plunge-benefits", id: "cold-finish" },
  { route: "/what-is-zone-2", id: "zone2" },
  { route: "/does-creatine-work", id: "creatine-monohydrate" },
  { route: "/cyclic-sighing", id: "cyclic-sighing" },
];

/**
 * The rendered HTML with React's plumbing taken out.
 *
 * React separates adjacent text nodes with `<!-- -->`, so "rates this D" is
 * served as "rates this <!-- -->D<!-- -->", and it escapes the curly
 * apostrophes the safety notes are full of. Matching against the raw HTML
 * therefore fails on text that is on the page and correct — a guardrail that
 * cries wolf gets deleted, so it matches what a reader sees instead.
 */
function plain(html) {
  return html
    .replace(/<!--.*?-->/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—");
}

async function render(route) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-topic`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request(`https://intentnorth.app${route}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200, `${route} did not render`);
  return plain(await response.text());
}

const library = JSON.parse(
  await readFile(new URL("../app/evidence/library.json", import.meta.url), "utf8"),
);

test("every topic page states the grade the app gives that practice", async () => {
  for (const { route, id } of PAGES) {
    const practice = library.practices.find((p) => p.id === id);
    assert.ok(practice, `${route} names a practice "${id}" that is not in the library`);

    const html = await render(route);
    assert.match(
      html,
      new RegExp(`rates this ${practice.grade} `),
      `${route} should state the app's grade (${practice.grade}) for ${id}`,
    );
    assert.ok(
      html.includes(practice.gradeLabel.toLowerCase()),
      `${route} should say what ${practice.grade} means in words, not just the letter`,
    );
  }
});

test("every topic page carries the practice's safety note in full", async () => {
  for (const { route, id } of PAGES) {
    const practice = library.practices.find((p) => p.id === id);
    if (!practice.safety) continue;
    const html = await render(route);

    // The opening of the note is enough to prove it rendered. A fixed-length
    // prefix rather than the first clause, because "Hydrate;" is a whole
    // clause and proves nothing.
    const opening = practice.safety.slice(0, 60);
    assert.ok(
      html.includes(opening),
      `${route} is missing the safety note that starts "${opening}"`,
    );
  }
});

test("the topic pages do not name public educators", async () => {
  // CLAUDE.md rule 9: no named public figure used in a way that implies
  // endorsement. The library credits several of these practices to Huberman,
  // Attia and Rhonda Patrick, and the round-three reviewers asked twice for
  // real studies rather than names — so the pages cite the paper, and the
  // attribution stays on /evidence where it is labelled as credit.
  for (const { route } of PAGES) {
    const html = await render(route);
    for (const name of ["Huberman", "Rhonda Patrick", "Peter Attia", "David Sinclair", "Tim Ferriss", "Layne Norton"]) {
      assert.ok(!html.includes(name), `${route} names ${name} — cite the study instead`);
    }
  }
});

test("every topic page is in the sitemap and canonical to itself", async () => {
  // A page missing from the sitemap is also missing from check-layout, which
  // reads its route list out of that file. Two failures, one cause.
  const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  for (const { route } of PAGES) {
    assert.ok(
      sitemap.includes(`https://intentnorth.app${route}"`),
      `${route} is not in app/sitemap.ts, so nothing renders or crawls it`,
    );
    const html = await render(route);
    assert.match(
      html,
      new RegExp(`rel="canonical" href="https://intentnorth.app${route}"`),
      `${route} should be canonical to itself`,
    );
  }
});

test("the medical disclaimer is on every topic page", async () => {
  // Rule 8: health content is educational, never diagnosis or personal
  // advice. These pages are the ones a stranger reaches from a search for a
  // supplement, which is the context where that line does the most work.
  for (const { route } of PAGES) {
    const html = await render(route);
    assert.match(html, /not medical advice/i, `${route} is missing the educational-content line`);
  }
});
