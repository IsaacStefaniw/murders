import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";

/**
 * /privacy says, in plain words, that the site has no accounts and no database.
 *
 * That is true today: wrangler binds only ASSETS and IMAGES, and no runtime
 * code touches storage. The risk is not that the claim is wrong — it is that
 * the claim goes on being made after someone wires a database, because nothing
 * connects the two. A privacy page that lags the code is worse than none,
 * because people acted on it.
 *
 * So this fails the build the moment storage appears, and the failure names
 * the page that has to change with it.
 */

test("the deployed config binds no database", async () => {
  const wrangler = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  for (const binding of ["d1_databases", "kv_namespaces", "r2_buckets", "durable_objects", "hyperdrive"]) {
    assert.ok(
      !new RegExp(`"${binding}"`).test(wrangler),
      `wrangler.jsonc binds ${binding} — /privacy claims no database and must be rewritten in this commit`,
    );
  }
});

test("no runtime code reaches for storage", async () => {
  const roots = ["../worker/", "../app/"];
  const offenders = [];

  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
      if (entry.isDirectory()) { await walk(full); continue; }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const raw = await readFile(full, "utf8");
      // Comments are stripped first. The worker explains in prose why there is
      // no DB binding, and a test that cannot tell an explanation from a
      // reintroduction fails on the very comment warning against it.
      const source = raw
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      // The schema in db/ is scaffolding drizzle-kit reads at author time. It
      // only matters if something the Worker serves actually imports it.
      if (/from ["'][^"']*\bdb\/|D1Database|env\.DB\b/.test(source)) {
        offenders.push(decodeURIComponent(full.pathname.split("/web/")[1] ?? full.pathname));
      }
    }
  }
  for (const root of roots) await walk(new URL(root, import.meta.url));

  assert.deepEqual(
    offenders,
    [],
    `these reach for storage while /privacy claims none: ${offenders.join(", ")}`,
  );
});

test("the privacy page still makes the claim these tests protect", async () => {
  // If the wording is ever softened, these tests are guarding nothing and
  // should be reconsidered rather than left passing for the wrong reason.
  const privacy = await readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8");
  assert.match(privacy, /no accounts and no database/i);
});
