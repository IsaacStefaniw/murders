#!/usr/bin/env node
/**
 * Run a command with this project's environment.
 *
 * Everything the toolchain writes — the npm cache, wrangler's logs, miniflare's
 * registry, temp files — is redirected under `.sites-runtime/` so a build never
 * depends on a writable home directory. That was originally a hosted-runtime
 * requirement; it is kept because it also makes builds reproducible.
 *
 * This is a port of the bash original. The bash version required a POSIX shell,
 * which meant `npm run lint` and `npm run build` simply did not run on Windows
 * without Git Bash or WSL in the way. Node is already a hard dependency of this
 * project, so using it here costs nothing and removes the shell from the path.
 *
 * Usage: node scripts/sites-env.mjs -- <command> [args...]
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const runtimeRoot = process.env.SITES_RUNTIME_ROOT ?? path.join(projectRoot, ".sites-runtime");

const dirs = {
  home: path.join(runtimeRoot, "home"),
  npmCache: path.join(runtimeRoot, "npm-cache"),
  xdgConfig: path.join(runtimeRoot, "xdg-config"),
  tmp: path.join(runtimeRoot, "tmp"),
  wranglerLogs: path.join(runtimeRoot, "wrangler", "logs"),
};

/** Apply the project environment to `env` in place, and hand it back. */
export function sitesEnv(env = { ...process.env }) {
  for (const dir of Object.values(dirs)) {
    mkdirSync(dir, { recursive: true });
  }

  env.SITES_ENV_READY = "1";
  env.SITES_PROJECT_ROOT = projectRoot;
  env.HOME = dirs.home;
  env.XDG_CONFIG_HOME = dirs.xdgConfig;
  env.TMPDIR = dirs.tmp;
  env.WRANGLER_WRITE_LOGS = "false";
  env.WRANGLER_LOG_PATH = dirs.wranglerLogs;
  env.MINIFLARE_REGISTRY_PATH = path.join(runtimeRoot, "wrangler", "registry");

  // The runtime may provide a global npm cache. Keep the image's read-only
  // seed separate and make this project's writable cache authoritative.
  delete env.NPM_CONFIG_CACHE;
  delete env.npm_config_cache;
  env.npm_config_cache = dirs.npmCache;
  env.npm_config_audit = "false";
  env.npm_config_fund = "false";
  env.npm_config_update_notifier = "false";

  // The runtime already supplies the standard HTTP(S)_PROXY variables. Remove
  // npm-specific aliases so npm 11 does not reinterpret or warn about them.
  for (const alias of [
    "npm_config_proxy",
    "npm_config_http_proxy",
    "npm_config_https_proxy",
    "NPM_CONFIG_PROXY",
    "NPM_CONFIG_HTTP_PROXY",
    "NPM_CONFIG_HTTPS_PROXY",
  ]) {
    delete env[alias];
  }

  return env;
}

/**
 * Find the JavaScript entry point of a locally installed CLI.
 *
 * Running that file with the current Node binary sidesteps `node_modules/.bin`,
 * whose entries are shell scripts on POSIX and `.cmd` shims on Windows. Neither
 * can be spawned the same way on both, and spawning through a shell to paper
 * over the difference reintroduces quoting bugs. Returns null when the command
 * is not a local package, so a plain executable still works.
 *
 * The manifest is read off disk rather than through require.resolve, because a
 * package with an `exports` map need not expose its own package.json — vinext
 * does not, and resolving it that way silently reported the build tool missing.
 */
export function resolveLocalCli(command) {
  const require = createRequire(path.join(projectRoot, "package.json"));

  for (let dir = projectRoot; ; dir = path.dirname(dir)) {
    const manifestPath = path.join(dir, "node_modules", command, "package.json");
    if (existsSync(manifestPath)) {
      const bin = require(manifestPath).bin;
      const entry = typeof bin === "string" ? bin : bin?.[command];
      return entry ? path.resolve(path.dirname(manifestPath), entry) : null;
    }
    if (dir === path.dirname(dir)) return null;
  }
}

export function runWithSitesEnv(command, args) {
  const env = sitesEnv();
  const localCli = resolveLocalCli(command);

  const child = localCli
    ? spawn(process.execPath, [localCli, ...args], { cwd: projectRoot, env, stdio: "inherit" })
    : spawn(command, args, { cwd: projectRoot, env, stdio: "inherit", shell: process.platform === "win32" });

  child.on("error", (error) => {
    console.error(`sites-env: could not run ${command}: ${error.message}`);
    process.exit(69);
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      // Mirror the shell convention, so a killed command is never read as success.
      process.exit(signal === "SIGTERM" ? 143 : signal === "SIGKILL" ? 137 : 1);
    }
    process.exit(code ?? 1);
  });
  return child;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  const argv = process.argv.slice(2);
  if (argv[0] === "--") argv.shift();
  if (argv.length === 0) {
    console.error("usage: node scripts/sites-env.mjs -- command [args...]");
    process.exit(64);
  }
  runWithSitesEnv(argv[0], argv.slice(1));
}
