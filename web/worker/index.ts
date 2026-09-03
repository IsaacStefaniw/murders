/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  // No DB. There was a `DB: D1Database` here, bound to nothing and used by
  // nothing — but /privacy states in plain words that the site has no accounts
  // and no database, so a binding sitting ready in the type is an invitation to
  // make that page false without anyone noticing they had. Wiring storage means
  // changing the privacy page in the same commit; tests/no-database.test.mjs
  // makes that unavoidable rather than merely intended.
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

// The product answers to one address. instinctnorth.app is held because the
// name is close enough to be mistyped, said aloud wrongly, or squatted — but
// it is an alias, not a second site. Two hosts serving the same HTML split the
// link equity and leave search engines to guess which one is the product.
//
// Changing which name is canonical is this one constant. Note that a 301 is
// cached hard by browsers, so a host promoted out of this set will keep
// redirecting for anyone who visited it first.
const CANONICAL_HOST = "intentnorth.app";
const ALIAS_HOSTS = new Set([
  "www.intentnorth.app",
  "instinctnorth.app",
  "www.instinctnorth.app",
]);

/**
 * Send an alias host to the canonical one, keeping the path and query so a
 * shared deep link survives the hop. Returns null for every other host, so
 * localhost dev and the workers.dev preview URL still serve the site directly.
 */
function canonicalRedirect(url: URL): Response | null {
  if (!ALIAS_HOSTS.has(url.hostname.toLowerCase())) return null;

  const canonical = new URL(url);
  canonical.protocol = "https:";
  canonical.hostname = CANONICAL_HOST;
  canonical.port = "";
  return Response.redirect(canonical.href, 301);
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const redirect = canonicalRedirect(url);
    if (redirect) return redirect;

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
