import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

/**
 * Words a stranger cannot read.
 *
 * Isaac showed the site to people. None of them could say what it was. The
 * questions back were "what's Upper A?", "what's optimised one slice?" and
 * "what's a coach?" — and every one of those is a word we chose.
 *
 * The product-truth guardrails stop us saying things that are false. Nothing
 * stopped us saying true things nobody understands, which is how a page can be
 * accurate, well built, and useless. This is that check.
 *
 * Two things changed on 11 September 2026.
 *
 * First, the list moved to `shared/vocabulary.json`, which the app's
 * `jargon.test.ts` reads too. The two lists had drifted to share exactly one
 * term: "deload", "rung", "accessories" and "training block" were banned here
 * as unreadable and shipping in app copy at the same time.
 *
 * Second, this checked only "/". The site has six routes, and the SEO pages
 * are the ones a stranger arrives on from a search — precisely the reader this
 * rule exists to protect. It now checks all of them.
 */
const VOCAB = JSON.parse(
  readFileSync(new URL("../../shared/vocabulary.json", import.meta.url), "utf8"),
);

/**
 * Every route the site serves. A page absent from here is a page nobody checks.
 *
 * `exempt` is per route and per term, and must carry a reason. It is not a way
 * to make a failure go away: it is for text this page does not own.
 */
const ROUTES = [
  { path: "/" },
  {
    path: "/evidence",
    exempt: ["rung", "Zone 2", "VO₂"],
    why:
      "This page renders app/evidence/library.json, which `npm run evidence` " +
      "regenerates from src/features/knowledge/protocols.*.ts. Those are the " +
      "catalogued practices' own words, owned by the research pipeline in " +
      "docs/research/, not copy this page can edit — an edit here is " +
      "overwritten by the next build. Fixing them is a research round. " +
      "Recorded in docs/STATE.md so it is not lost.",
  },
  { path: "/privacy" },
  { path: "/sleep-debt" },
  { path: "/support" },
  { path: "/whoop-alternative" },
];

async function renderedHtml(route) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }),
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

/** Headings, buttons and the document title — where a "prominent" term is banned. */
function prominentText(html) {
  const parts = [];
  const grab = /<(h1|h2|h3|button|title)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = grab.exec(html))) parts.push(m[2]);
  return visibleText(parts.join(" "));
}

/** Escape a term for use in a regex; the list contains "VO₂" and "Upper A". */
const rx = (term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");

for (const { path: route, exempt = [] } of ROUTES) {
  test(`${route} uses no word a stranger would have to look up`, async () => {
    const html = await renderedHtml(route);
    const all = visibleText(html);
    const prominent = prominentText(html);

    const found = VOCAB.banned
      .filter(({ web }) => web !== "allowed")
      .filter(({ term }) => !exempt.includes(term))
      .filter(({ term, web }) => rx(term).test(web === "prominent" ? prominent : all))
      .map(({ term, why, web }) => `"${term}" (${web}) — ${why}`);

    assert.deepEqual(found, [], `jargon a first-time reader cannot parse on ${route}:\n  ${found.join("\n  ")}`);
  });
}

test("every exemption is written down and justified", () => {
  for (const route of ROUTES) {
    if (!route.exempt?.length) continue;
    assert.ok(route.why && route.why.length > 60, `${route.path} exempts terms without saying why`);
  }
});

test("terms the product needs are taught before they are used", async () => {
  const text = visibleText(await renderedHtml("/"));

  for (const { term, taughtBy } of VOCAB.allowedOnceDefined) {
    if (!rx(term).test(text)) continue;
    assert.match(text, new RegExp(taughtBy, "i"), `the page uses "${term}" without ever saying what one is`);
  }
});

/** The list is only a guardrail while both surfaces actually read it. */
test("the shared vocabulary is intact", () => {
  assert.ok(VOCAB.banned.length > 20, "the banned list lost entries");
  for (const entry of VOCAB.banned) {
    assert.ok(entry.term && entry.why, `entry missing term or why: ${JSON.stringify(entry)}`);
    for (const surface of ["web", "app"]) {
      assert.ok(
        ["everywhere", "prominent", "allowed"].includes(entry[surface]),
        `${entry.term} has no valid ${surface} tier`,
      );
    }
  }
});
