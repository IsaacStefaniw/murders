import type { Metadata } from "next";

import { Analytics } from "./analytics";
import "./globals.css";

/**
 * Structured data, which the site had none of.
 *
 * Deliberately incomplete in one respect: there is no aggregateRating and no
 * review, because we have no ratings and no reviews. Those two properties are
 * what earn stars in a search result and they are the most commonly faked
 * fields on the web. The same rule applies here as everywhere else on this
 * site — if we cannot prove it, it does not ship.
 *
 * The prices are the three real products in purchases.ts, in AUD, which is the
 * currency the App Store charges an Australian account.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "IntentNorth",
  applicationCategory: "HealthApplication",
  operatingSystem: "iOS",
  url: "https://intentnorth.app",
  description:
    "An iPhone app that plans your week across training, food, sleep, habits, focused work, money and family, and rebuilds it when your week changes. Every practice carries a plain rating for the strength of the evidence behind it.",
  offers: [
    { "@type": "Offer", price: "89.99", priceCurrency: "AUD", name: "Yearly" },
    { "@type": "Offer", price: "14.99", priceCurrency: "AUD", name: "Monthly" },
    { "@type": "Offer", price: "249.00", priceCurrency: "AUD", name: "Lifetime" },
  ],
  featureList: [
    "Writes and maintains a weekly plan across seven areas",
    "Rates the evidence behind every practice from A to E",
    "Adapts the plan to sleep, recovery and available time",
    "Urge and hardest-moment support, free permanently",
    "No account and no server — data stays on the phone",
  ],
};

export const metadata: Metadata = {
  // The title tag is the one line that appears in a search result, and it was
  // still "Your results change what happens next" — the abstract sentence our
  // own plain-language rule forbids, carrying no word anyone would search.
  title: "IntentNorth — one weekly plan for training, food, sleep and habits",
  description:
    "An iPhone app that turns 204 rated practices into a weekly plan for your training, food, sleep, habits, work, money and family — and changes the plan when your week changes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  // The site's own address, now that one exists. Open Graph and Twitter
  // cards resolve their relative image URLs against this, so a stale value
  // means every shared link previews a broken image.
  metadataBase: new URL("https://intentnorth.app"),
  // Missing until now. Five hostnames 301 to this one (worker/index.ts), but a
  // canonical says so to anything that reaches a copy another way.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "IntentNorth",
    title: "IntentNorth — your whole life, one plan that works",
    description:
      "Seven parts of your life, one plan. It writes the week, changes it when yours changes, and tells you why.",
    url: "/",
    images: [
      {
        url: "/images/intent-os-hero-family-transition-v2.webp",
        width: 1536,
        height: 1024,
        alt: "A professional closing a laptop and returning attention to family life",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentNorth — your whole life, one plan that works",
    description:
      "Seven parts of your life, one plan. It tells you why every change was made.",
    images: ["/images/intent-os-hero-family-transition-v2.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
