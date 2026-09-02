#!/usr/bin/env node
/**
 * Build the site under a time limit.
 *
 * The bound exists because a wedged vinext build hangs rather than fails, and a
 * hang in CI is a silent twenty-minute bill instead of a red X. The bash
 * original got its bound from GNU `timeout`, which does not exist on Windows or
 * on a stock macOS; this does the same thing with a Node timer, so `npm run
 * build` behaves identically from PowerShell, bash and CI.
 *
 * Overridable through SITES_BUILD_TIMEOUT and SITES_BUILD_KILL_AFTER, which
 * accept the same "3m" / "10s" forms the shell version documented.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveLocalCli, sitesEnv } from "./sites-env.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Parse "90", "30s", "3m" or "1h" into milliseconds. */
function durationMs(value, fallback) {
  if (!value) return fallback;
  const match = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h)?$/.exec(value.trim());
  if (!match) {
    console.error(`build-verified: could not read the duration "${value}".`);
    process.exit(64);
  }
  const scale = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 }[match[2] ?? "s"];
  return Number(match[1]) * scale;
}

const timeout = durationMs(process.env.SITES_BUILD_TIMEOUT, 3 * 60_000);
const killAfter = durationMs(process.env.SITES_BUILD_KILL_AFTER, 10_000);

// Resolved rather than spawned by name: node_modules/.bin holds a shell script
// on POSIX and a .cmd shim on Windows, and neither spawns the same way.
const vinext = resolveLocalCli("vinext");
if (!vinext) {
  console.error("vinext is unavailable. Run npm ci and wait for it to finish before building.");
  process.exit(69);
}

console.log("Running bounded vinext build...");
const child = spawn(process.execPath, [vinext, "build"], {
  cwd: projectRoot,
  env: sitesEnv(),
  stdio: "inherit",
});

let timedOut = false;
let forceStop;
const askToStop = setTimeout(() => {
  timedOut = true;
  console.error(`\nbuild-verified: no build after ${process.env.SITES_BUILD_TIMEOUT ?? "3m"}; stopping it.`);
  // SIGTERM has no meaning on Windows, where kill() terminates outright. That
  // is the same end state, just without the grace period.
  child.kill("SIGTERM");
  forceStop = setTimeout(() => child.kill("SIGKILL"), killAfter);
}, timeout);

child.on("error", (error) => {
  console.error(`build-verified: could not start vinext: ${error.message}`);
  process.exit(69);
});

child.on("exit", (code, signal) => {
  clearTimeout(askToStop);
  clearTimeout(forceStop);
  if (timedOut) process.exit(124); // GNU timeout's exit code, kept for CI parity.
  if (signal) process.exit(signal === "SIGTERM" ? 143 : signal === "SIGKILL" ? 137 : 1);
  process.exit(code ?? 1);
});
