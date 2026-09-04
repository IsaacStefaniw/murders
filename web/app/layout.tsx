import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntentNorth — Your results change what happens next.",
  description:
    "An iPhone app that turns 177 rated practices into a weekly plan for your training, food, sleep, habits, work, money and family — and changes the plan when your week changes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  // The site's own address, now that one exists. Open Graph and Twitter
  // cards resolve their relative image URLs against this, so a stale value
  // means every shared link previews a broken image.
  metadataBase: new URL("https://intentnorth.app"),
  openGraph: {
    type: "website",
    siteName: "IntentNorth",
    title: "IntentNorth — The health advice you have read, turned into a plan you can follow.",
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
    title: "IntentNorth — The health advice you have read, turned into a plan you can follow.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
