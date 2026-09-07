import type { MetadataRoute } from "next";

/**
 * There was no robots.txt at all, which means every crawler was guessing.
 * Nothing here is private — the site has three pages and no user content — so
 * this is permissive on purpose and exists mainly to point at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://intentnorth.app/sitemap.xml",
    host: "https://intentnorth.app",
  };
}
