import type { MetadataRoute } from "next";

/**
 * Every page, in one list.
 *
 * scripts/check-layout.mjs reads its route list out of this file, so a page
 * added here is rendered and measured at three widths without anyone
 * remembering to register it twice. A page added anywhere else is in neither.
 */
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
    // "sleep debt" is 1,600 AU searches a month, rising 46%, low competition,
    // and Rise — whose product term it is — does not rank for the calculator
    // queries. Single-purpose calculators are the page shape that ranks here.
    { url: "https://intentnorth.app/sleep-debt", lastModified, changeFrequency: "monthly", priority: 0.7 },
    // The whole practice library, searchable. A conversion asset rather than a
    // traffic one — the research was clear that "does X work" queries are tiny
    // in Australia and answered inline — but it is the proof behind the
    // rating claim the rest of the site makes.
    { url: "https://intentnorth.app/evidence", lastModified, changeFrequency: "weekly", priority: 0.8 },

    // The wearable door. docs/WEARABLE_BRIEF.md: the category all ends at a
    // number, and the gap is that nothing you already own does anything after
    // it. Kept off the hero so the site still works for the larger market
    // that owns no device.
    { url: "https://intentnorth.app/works-with-what-you-wear", lastModified, changeFrequency: "monthly", priority: 0.7 },

    // The topic pages. Section 3 of docs/SEO_RESEARCH.md found the question
    // form ("does cold plunge work", 10 a month) has no Australian volume and
    // an unwinnable SERP of hospitals and Reddit; the volume is in the topic
    // noun one step up. These six are the terms where real demand meets a
    // practice we have actually graded — and the grade is the only thing on
    // these pages that Mayo Clinic does not already publish better.
    { url: "https://intentnorth.app/magnesium-for-sleep", lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://intentnorth.app/sauna-benefits", lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://intentnorth.app/cold-plunge-benefits", lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://intentnorth.app/what-is-zone-2", lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://intentnorth.app/does-creatine-work", lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://intentnorth.app/cyclic-sighing", lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
}
