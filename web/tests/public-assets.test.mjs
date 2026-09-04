import assert from "node:assert/strict";
import test from "node:test";
import { readdir } from "node:fs/promises";

/**
 * `web/public/` is the public internet.
 *
 * A handover document written between two Claude sessions was placed in
 * `public/video/` alongside the films and shipped with them. It was live at
 * /video/README.md: a file listing the claims we had decided were misleading,
 * naming our own s18 exposure, and recording that PRODUCT.md once sold an
 * "AI-powered" product the build could not deliver. Nobody chose to publish
 * that; it rode along with the assets because it happened to sit next to them.
 *
 * Notes belong in docs/. This fails the build if that happens again.
 */

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(decodeURIComponent(full.href.slice(base.href.length)));
  }
  return out;
}

test("no notes, docs or scratch files are served as public assets", async () => {
  const files = await walk(new URL("../public/", import.meta.url));

  // An allowlist, not a denylist. The first version of this test listed the
  // extensions it knew were documents, and the app session immediately put the
  // films' Python sources in public/video/source/ — which it happily passed.
  // Naming what may ship is the only version that catches what nobody thought of.
  const SERVEABLE = /\.(webp|png|jpe?g|gif|avif|svg|ico|mp4|webm|m4v|woff2?|ttf|otf|pdf)$/i;

  const leaked = files.filter((f) => !SERVEABLE.test(f));
  assert.deepEqual(
    leaked,
    [],
    `public/ is the open internet and these are not media — move them to docs/, `
      + `or add the extension to SERVEABLE if it is genuinely meant to ship: ${leaked.join(", ")}`,
  );

  // Guard the shape too: a stray dotfile in public/ is served just as happily.
  const dotfiles = files.filter((f) => f.split("/").some((part) => part.startsWith(".")));
  assert.deepEqual(dotfiles, [], `dotfiles under public/ are served: ${dotfiles.join(", ")}`);
});
