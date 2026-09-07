"use client";

import Script from "next/script";
import { useEffect } from "react";

/**
 * Marketing measurement for the website, and nothing else.
 *
 * Isaac's decision, 7 Sep 2026: the privacy promise is about the app and the
 * health data in it, not about whether a marketing website can count visits
 * and build a retargeting audience. That distinction is real and it is the one
 * every privacy-forward company draws — Proton and DuckDuckGo both buy ads.
 * Without this the site cannot measure a dollar of paid spend, cannot retarget
 * the person who read /whoop-alternative and left, and cannot build a
 * lookalike audience before the January search spike.
 *
 * The one line that does not move
 * ------------------------------
 * The questionnaire's answers never leave the browser, and no event carries
 * them. This is not a positioning preference:
 *
 *   Step 02 of the profile builder asks what someone wants to reduce, and one
 *   option is "An urge I want support with". Under the Privacy Act 1988 that
 *   makes the answer set health information — sensitive information under
 *   s6 — which APP 3.3 says needs consent to collect, not merely disclosure.
 *   Meta's Business Tools Terms separately prohibit sending health data to the
 *   pixel at all, which is the conduct behind the US hospital-pixel suits.
 *
 * So the design is: events carry a name and nothing else. An ad platform
 * optimises on the event, not on its payload, so a bare `profile_complete`
 * buys exactly the same targeting as one stuffed with answers, and buys it
 * without holding anyone's drinking in a Meta audience. That is why `track()`
 * below takes no payload argument at all — the safety is structural rather
 * than a rule someone has to remember.
 *
 * tests/analytics-boundary.test.mjs enforces both halves: the fixed event
 * list, and that /privacy discloses whatever is actually configured here.
 */

/**
 * Public IDs, committed on purpose.
 *
 * A GA4 measurement ID and a Meta pixel ID are visible in the page source of
 * every site that uses them — they identify a property, they do not authorise
 * anything, and treating them as secrets would mean an env var that silently
 * turns measurement off in a build nobody checked. Empty means the tag does
 * not load at all.
 *
 * Isaac: paste the IDs here. Nothing else needs to change, and /privacy
 * already describes all three.
 *
 * The GA4 property has a **web stream and no iOS stream**, on purpose. GA4 for
 * iOS is Firebase: collecting app data means embedding the Firebase Analytics
 * SDK in the binary, which would falsify "there is no analytics SDK in the
 * app" on /privacy, change the App Store privacy label away from "Device ID,
 * not linked to you", and undo the row /whoop-alternative wins on. Do not add
 * an iOS stream to this property without changing all three of those first.
 */
export const ANALYTICS = {
  /** GA4, from Admin → Data streams. Web stream only — see below. */
  ga4: "G-DZL9DH7HH9",
  /** Meta pixel, from Events Manager. A long number. */
  metaPixel: "",
  /** Reddit Ads pixel, from Events Manager. Looks like a2_xxxxxxxx. */
  redditPixel: "",
} as const;

export const CONFIGURED = Object.values(ANALYTICS).some(Boolean);

/**
 * Every event this site is allowed to send, and the whole vocabulary.
 *
 * A union type rather than a string, so a call site cannot invent an event —
 * and none of them takes data, so a call site cannot attach any either.
 */
export type TrackedEvent =
  /** Someone opened the profile builder. */
  | "profile_start"
  /** Someone reached the reveal at the end of it. No answers, only that they finished. */
  | "profile_complete"
  /** Someone clicked through to the App Store. */
  | "app_store_click";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    rdt?: (...args: unknown[]) => void;
  }
}

/**
 * Send one event name to whichever tags are loaded.
 *
 * Deliberately has no second parameter. Adding one is the change that would
 * let somebody pass the questionnaire state in a hurry, so the function simply
 * cannot accept it.
 */
export function track(event: TrackedEvent): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event);
    // Meta's standard events are a fixed vocabulary; ours map onto Lead and
    // ViewContent so the platform can optimise for them.
    const meta = { profile_start: "ViewContent", profile_complete: "Lead", app_store_click: "Lead" }[event];
    window.fbq?.("track", meta);
    window.rdt?.("track", event === "profile_complete" ? "Lead" : "ViewContent");
  } catch {
    // A blocked tag, an ad blocker, a browser with third-party script
    // restrictions. None of that is the visitor's problem and none of it may
    // break the page they came for.
  }
}

export function Analytics() {
  // Nothing is loaded until an ID exists, so a fresh clone of this repo ships
  // no third-party script at all.
  useEffect(() => {
    if (!ANALYTICS.ga4) return;
    window.gtag?.("event", "page_view");
  }, []);

  if (!CONFIGURED) return null;

  return (
    <>
      {ANALYTICS.ga4 ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.ga4}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
window.gtag=gtag;gtag('js',new Date());gtag('config','${ANALYTICS.ga4}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}

      {ANALYTICS.metaPixel ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${ANALYTICS.metaPixel}');fbq('track','PageView');`}
        </Script>
      ) : null}

      {ANALYTICS.redditPixel ? (
        <Script id="reddit-pixel" strategy="afterInteractive">
          {`!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments)
:p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement('script');t.src=
'https://www.redditstatic.com/ads/pixel.js';t.async=!0;var s=d.getElementsByTagName('script')[0];
s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','${ANALYTICS.redditPixel}');
rdt('track','PageVisit');`}
        </Script>
      ) : null}
    </>
  );
}
