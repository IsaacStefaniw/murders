import type { MetadataRoute } from "next";

/** Three pages today. The evidence pages, when they exist, are added here. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: "https://intentnorth.app/", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: "https://intentnorth.app/privacy", lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: "https://intentnorth.app/support", lastModified, changeFrequency: "monthly", priority: 0.3 },
    // "whoop alternative" is 590 AU searches a month with a soft page one —
    // the only commercial keyword in this category with both. See
    // docs/SEO_RESEARCH.md section 8.
    { url: "https://intentnorth.app/whoop-alternative", lastModified, changeFrequency: "monthly", priority: 0.7 },
  ];
}
