import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntentNorth — Your results change what happens next.",
  description:
    "One operating profile, specialist programs and a learning loop that builds helpful behaviours, reduces harmful patterns and changes the next action from your results.",
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
    title: "IntentNorth — Seven coaches. One life, built with intent.",
    description:
      "Seven specialists—training, food, habits, work, money, relationship and family—working from one operating profile. Every change carries its reason.",
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
    title: "IntentNorth — Seven coaches. One life, built with intent.",
    description:
      "Seven specialists working from one operating profile. Every change carries its reason.",
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
