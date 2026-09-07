import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";

/**
 * The line between marketing measurement and the questionnaire's answers.
 *
 * Isaac's decision on 7 Sep 2026 was that the privacy promise covers the app
 * and the health data in it, not whether a marketing website may count visits
 * and retarget. That is a fair line and this test does not argue with it. What
 * it enforces is the other half, which is not a preference:
 *
 *   Step 02 of the profile builder asks what someone wants to reduce, and one
 *   option is "An urge I want support with". That makes the answer set health
 *   information under s6 of the Privacy Act 1988 — sensitive information,
 *   which APP 3.3 requires consent to collect. Meta's Business Tools Terms
 *   separately prohibit sending health data to the pixel at all; doing it is
 *   the conduct behind the US hospital-pixel litigation.
 *
 * So: events may carry a name and never a payload. An ad platform optimises on
 * the event rather than its contents, so nothing is lost by this — but the
 * failure mode is one hurried line six months from now, which is exactly the
 * kind of thing that needs a test rather than a comment.
 */

const ALLOWED_EVENTS = ["profile_start", "profile_complete", "app_store_click"];

async function source(file) {
  return readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

test("track() cannot carry a payload", async () => {
  const analytics = await source("app/analytics.tsx");

  // One parameter, and it is the event name. A second parameter is the change
  // that would make sending the answers possible, so the signature is the
  // thing under test rather than any particular call site.
  assert.match(
    analytics,
    /export function track\(event: TrackedEvent\): void/,
    "track() gained a parameter — it must take the event name and nothing else",
  );

  // The union is the whole vocabulary. A bare `string` would let a call site
  // stringify anything, including an answer, into an event name.
  assert.match(analytics, /export type TrackedEvent =/, "the event list stopped being a closed union");
  for (const event of ALLOWED_EVENTS) {
    assert.ok(analytics.includes(`"${event}"`), `${event} is no longer in the event union`);
  }
});

test("no call site passes anything to track()", async () => {
  const offenders = [];

  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
      if (entry.isDirectory()) { await walk(full); continue; }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      // analytics.tsx declares track(); its signature is test 1's job, and
      // matching the declaration here would fail on the definition itself.
      if (entry.name === "analytics.tsx") continue;
      // Comments come out first. The reasoning for this boundary is written
      // beside the call sites, and a check that cannot tell an explanation
      // from a violation fails on the very comment explaining the rule.
      const raw = (await readFile(full, "utf8"))
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      for (const [call, arg] of raw.matchAll(/\btrack\(([^)]*)\)/g)) {
        const argument = arg.trim();
        // A bare quoted event from the allowed list is the only legal call.
        const legal = ALLOWED_EVENTS.some((e) => argument === `"${e}"` || argument === `'${e}'`);
        if (!legal) offenders.push(`${entry.name}: ${call}`);
      }
    }
  }
  await walk(new URL("../app/", import.meta.url));
  await walk(new URL("../components/", import.meta.url));

  assert.deepEqual(
    offenders,
    [],
    "a track() call passes something other than one of the allowed event names",
  );
});

test("the questionnaire's answers never reach a third party", async () => {
  const page = await source("app/page.tsx");

  // The state that holds the answers. None of these names may appear inside a
  // gtag, fbq or rdt call, or in a fetch body.
  const answers = ["selectedGoals", "selectedFrictions", "selectedConstraints", "commitment", "sleep", "workload"];

  for (const sink of [/\bgtag\([^)]*\)/g, /\bfbq\([^)]*\)/g, /\brdt\([^)]*\)/g, /\bfetch\([\s\S]{0,400}?\)/g]) {
    for (const [call] of page.matchAll(sink)) {
      for (const answer of answers) {
        assert.ok(
          !call.includes(answer),
          `${answer} appears inside "${call.slice(0, 80)}" — the answers must not leave the browser`,
        );
      }
    }
  }

  // And the promise the home page still makes, which the design above keeps
  // true: the answers go to localStorage and nowhere else.
  assert.match(page, /nothing you type leaves this browser/, "the promise was removed rather than kept true");
  assert.match(page, /window\.localStorage\.setItem\("intent-os-profile-preview"/, "the preview stopped being local-only");
});

test("privacy discloses exactly the trackers that are configured", async () => {
  // The failure this catches is the ordinary one: somebody pastes a pixel ID
  // and forgets the page that promises there is no pixel. Under APP 1 the
  // policy has to describe what actually happens, and a privacy page that lags
  // the code is worse than none because people acted on it.
  const analytics = await source("app/analytics.tsx");
  const privacy = await source("app/privacy/page.tsx");

  const configured = {
    "Google Analytics": /ga4: "(?!")/.test(analytics) || /ga4: "[^"]+"/.test(analytics),
    Meta: /metaPixel: "[^"]+"/.test(analytics),
    Reddit: /redditPixel: "[^"]+"/.test(analytics),
  };

  // The page names all three regardless, because the component ships with all
  // three wired and only the IDs are missing — describing them before they are
  // switched on is honest, describing them after is required.
  for (const name of Object.keys(configured)) {
    assert.ok(
      privacy.includes(name),
      `${name} is wired in app/analytics.tsx and /privacy does not mention it`,
    );
  }

  assert.match(privacy, /stay in your own browser/i, "/privacy must still say the answers stay on the device");
  assert.doesNotMatch(
    privacy,
    /We do not run advertising or analytics scripts on it/,
    "/privacy still claims the website runs no advertising scripts, which is no longer true",
  );
});

test("the app's own no-tracking claims are untouched", async () => {
  // The website changed. The app did not, and these are the sentences that
  // must not be softened along with it — the App Store privacy label and the
  // /whoop-alternative comparison both rest on them.
  const privacy = await source("app/privacy/page.tsx");
  assert.match(privacy, /There is no analytics SDK in the app/, "the app's no-SDK claim was weakened");
  assert.match(privacy, /No advertising identifiers, no ad networks, no cross-app tracking/, "the app's no-ad-network claim was weakened");
  assert.match(privacy, /never used for advertising or marketing/, "the Health-data claim was weakened");
});
