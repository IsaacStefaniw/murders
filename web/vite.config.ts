import vinext from "vinext";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

// Cloudflare bindings for local dev. Previously read from the hosting
// platform's generated .openai/hosting.json; now declared here so the site
// builds anywhere. Set a binding name to enable it.
const d1: string | null = null;
const r2: string | null = null;

// The newest compatibility date the locally installed workerd understands.
// Raise it when wrangler is upgraded; if dev starts refusing to boot with a
// "newest date supported by this server binary" error, this is the knob.
const LOCAL_RUNTIME_COMPATIBILITY_DATE = "2026-05-22";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

// No compatibility_flags here. The Cloudflare plugin merges this with
// wrangler.jsonc rather than replacing it, and workerd refuses to start when a
// flag is listed twice — so declaring nodejs_compat in both places broke
// `npm run dev` outright, while the deploy (which reads wrangler.jsonc alone)
// stayed fine. wrangler.jsonc is the one source of truth for the flags.
const localBindingConfig = {
  main: "./worker/index.ts",
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async ({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          ...localBindingConfig,
          // Dev only, and deliberately not applied to a build: this config is
          // merged into the wrangler.json that ships, so overriding the date
          // here at build time would quietly deploy an older runtime than
          // wrangler.jsonc asks for. The pinned wrangler's workerd predates
          // that date and refuses to boot, which is a local problem only.
          ...(command === "serve"
            ? { compatibility_date: LOCAL_RUNTIME_COMPATIBILITY_DATE }
            : {}),
        },
      }),
    ],
  };
});
