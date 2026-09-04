import type { Metadata } from "next";
import Link from "next/link";

/**
 * The support page.
 *
 * Apple requires a reachable support URL for every submitted app. This is
 * that URL, and it is also the page a real person lands on when something
 * is wrong — so it answers the questions the app actually generates rather
 * than pointing at a contact form and hoping.
 */

export const metadata: Metadata = {
  title: "Support — IntentNorth",
  description:
    "Help with IntentNorth: getting your plan back, Apple Health permissions, notifications, deleting your data, and how to reach a human.",
};

export default function SupportPage() {
  return (
    <main className="legal">
      <div className="legal-head">
        <Link href="/" aria-label="IntentNorth home">← IntentNorth</Link>
        <h1>Support</h1>
        <p className="legal-date">Answers to the things that actually go wrong</p>
      </div>

      <p className="lede">
        Email <a href="mailto:support@intentnorth.app">support@intentnorth.app</a> and a
        person will reply. We are a small team in Australia, so allow a couple of
        business days.
      </p>

      <div className="callout">
        <p>
          <strong>If you are in immediate danger or crisis, do not use this page.</strong>{" "}
          In Australia call 000, Lifeline on 13 11 14, or Beyond Blue on 1300 22 4636.
          Outside Australia, contact your local emergency number.
        </p>
      </div>

      <h2>My plan has disappeared</h2>
      <p>
        IntentNorth keeps everything on your phone rather than on a server, which is
        good for privacy and unforgiving about deletion. If you deleted and
        reinstalled the app, or reset the device, the plan is gone and we cannot
        restore it — we never held a copy. Reinstalling on the same device without
        deleting first keeps your data intact.
      </p>

      <h2>The app is not reading my Apple Health data</h2>
      <p>
        Open the iOS <strong>Health</strong> app → your profile picture →{" "}
        <strong>Privacy &amp; Security</strong> → <strong>Apps</strong> →{" "}
        <strong>IntentNorth</strong>, and check that the categories you want are
        switched on. IntentNorth only ever reads; it never writes to Health. If you
        turn everything off, the rest of the app still works — training guidance
        simply stops adjusting to your sleep.
      </p>

      <h2>I am not getting reminders</h2>
      <p>
        Check <strong>Settings → Notifications → IntentNorth</strong> and allow
        notifications. Reminders are scheduled on your device, so they also need the
        app to have been opened at least once since the plan changed. IntentNorth cannot
        send you anything remotely — there is no push server.
      </p>

      <h2>My programme is too hard, or too easy</h2>
      <p>
        Open the pathway — Training, for example — and use the control at the bottom
        of the level card to step the programme down. Nothing is lost by doing that;
        the level is a description of the block being built, not a verdict on you.
      </p>
      <p>
        For strength work, the loads are calculated from what you have logged. If you
        mark sessions done without entering the weight and reps, the app has nothing
        to raise the numbers from, and the block will repeat unchanged. Logging the
        actual sets is what makes it get harder.
      </p>

      <h2>How do I delete everything?</h2>
      <p>
        Delete the app from your phone. That removes all of it, permanently and
        immediately. There is no server-side account to close and nothing left behind
        for us to hold.
      </p>

      <h2>Billing and subscriptions</h2>
      <p>
        Any subscription is handled by Apple, not by us. To view, change or cancel it,
        open <strong>Settings → your name → Subscriptions</strong> on your iPhone.
        Refunds are requested from Apple at{" "}
        <a href="https://reportaproblem.apple.com" rel="noopener noreferrer">reportaproblem.apple.com</a>;
        we cannot issue them on Apple&rsquo;s behalf.
      </p>
      <p>
        Recovery, urge and hardest-moment support is free, permanently, and is never
        placed behind a subscription.
      </p>

      <h2>Reporting a bug</h2>
      <p>
        Email <a href="mailto:support@intentnorth.app">support@intentnorth.app</a> with
        what you were doing, what you expected and what happened instead. Your iOS
        version and whether it happens every time are the two details that help most.
        Please do not send screenshots containing anything you would rather keep
        private — we do not need them to help.
      </p>

      <div className="legal-foot">
        <p>
          IntentNorth provides education and structured planning. It is not medical,
          psychological or financial advice, and it does not diagnose or treat any
          condition. <Link href="/privacy">Privacy</Link>
        </p>
      </div>
    </main>
  );
}
