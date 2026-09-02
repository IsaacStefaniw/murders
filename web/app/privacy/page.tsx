import type { Metadata } from "next";
import Link from "next/link";

/**
 * The privacy policy.
 *
 * Written against what the code actually does, verified rather than
 * described: there is no `fetch` in the app source, the Supabase client is
 * unconfigured in every build profile, the analytics are derived on-device
 * from data already stored, and the notification entitlement for remote
 * push is stripped at build time by `plugins/withoutPushEntitlement`.
 *
 * If any of that changes, this page changes in the same commit. A privacy
 * policy that lags the code is worse than none, because people acted on it.
 */

export const metadata: Metadata = {
  title: "Privacy — IntentNorth",
  description:
    "What IntentNorth stores, what it does not collect, and where Apple Health data goes. No accounts, no analytics, no servers holding your plan.",
};

const UPDATED = "2 September 2026";

export default function PrivacyPage() {
  return (
    <main className="legal">
      <div className="legal-head">
        <Link href="/" aria-label="IntentNorth home">← IntentNorth</Link>
        <h1>Privacy</h1>
        <p className="legal-date">Last updated {UPDATED}</p>
      </div>

      <p className="lede">
        IntentNorth does not have an account system, a server that stores your plan,
        or any analytics product. Almost everything below is a description of
        things we do not do.
      </p>

      <div className="callout">
        <p>
          <strong>The short version.</strong> Your answers, plans, logs and health
          readings stay in storage on your own phone. We do not receive them, and
          there is no background upload to switch off, because there is none.
        </p>
      </div>

      <h2>What the app stores, and where</h2>
      <p>
        Everything you enter — the interview answers, your goals, the daily plan,
        logged sets, journal entries and check-ins — is written to storage on your
        device and nowhere else. Deleting the app deletes it. We cannot recover it
        for you, because we never had a copy.
      </p>

      <h2>Apple Health</h2>
      <p>
        If you grant permission, IntentNorth reads sleep, resting heart rate, heart-rate
        variability, cardio fitness, weight, height and waist measurement from Apple
        Health, so that training and recovery guidance can respond to how you actually
        recovered.
      </p>
      <ul>
        <li>Access is <strong>read-only</strong>. IntentNorth never writes to Apple Health.</li>
        <li>Health data stays on your device. It is not transmitted to us or to anyone else.</li>
        <li>It is never used for advertising or marketing, and never sold or shared.</li>
        <li>You can refuse or withdraw permission at any time in the iOS Health app. The rest of IntentNorth keeps working.</li>
      </ul>

      <h2>What we do not collect</h2>
      <ul>
        <li>No account, email address, phone number or password — there is no sign-in.</li>
        <li>No analytics or event tracking. There is no analytics SDK in the app.</li>
        <li>No advertising identifiers, no ad networks, no cross-app tracking.</li>
        <li>No location data.</li>
        <li>No contacts, photos, microphone or camera access.</li>
      </ul>

      <h2>Your own numbers</h2>
      <p>
        The app can show you how you are going — how long until your first completed
        item, your completion rate, which weeks were active. Those figures are
        calculated on your phone from the plans already stored there. They are not
        events sent anywhere; they are arithmetic over data you can already see.
      </p>
      <p>
        If you choose to send those figures to us, that is a deliberate act you take:
        the app shows you the exact text first, it contains no name, goals or dates,
        and nothing is sent unless you send it.
      </p>

      <h2>Notifications</h2>
      <p>
        Reminders are scheduled locally by the app, at times computed on your device.
        IntentNorth has no remote push capability — the entitlement is removed from the
        build — so no server can send you a notification, and no push token exists.
      </p>

      <h2>The two things that do leave your phone</h2>
      <h3>App updates</h3>
      <p>
        When the app launches it asks Expo Application Services whether a newer
        version of the app&rsquo;s code is available. That request tells Expo which
        app version and device platform is asking. It carries none of your plan,
        health or personal data. Expo&rsquo;s handling is covered by{" "}
        <a href="https://expo.dev/privacy" rel="noopener noreferrer">Expo&rsquo;s privacy policy</a>.
      </p>
      <h3>The App Store</h3>
      <p>
        Downloads, purchases and crash reports are handled by Apple under Apple&rsquo;s
        own terms. We see only the aggregate figures Apple shows every developer, and
        those identify nobody.
      </p>

      <h2>This website</h2>
      <p>
        The site has no accounts and no database. If you use the profile builder, your
        answers are kept in your own browser&rsquo;s local storage so you can come back
        to them; they are not sent to us. Clearing your browser data clears them.
      </p>
      <p>
        Like any website, ours is served by a hosting provider that processes standard
        request information — IP address, browser type, page requested — in order to
        deliver the page and defend against abuse. We do not run advertising or
        analytics scripts on it.
      </p>

      <h2>Children</h2>
      <p>
        IntentNorth is not directed at children and is not intended for anyone under 16.
      </p>

      <h2>Your rights</h2>
      <p>
        Australian Privacy Principles give you rights to access and correct personal
        information an organisation holds about you. In our case the honest answer is
        that we hold none: your data is on your device, under your control, and you can
        read, change or delete all of it there. If you believe we hold something about
        you, ask and we will tell you.
      </p>

      <h2>Changes</h2>
      <p>
        If IntentNorth ever starts collecting something — an account for subscription
        billing is the likeliest reason — this page will say so before that version
        ships, and the app will ask you first.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy: <a href="mailto:privacy@intentnorth.com">privacy@intentnorth.com</a>.
      </p>

      <div className="legal-foot">
        <p>
          IntentNorth provides education and structured planning. It is not medical,
          psychological or financial advice, and it does not diagnose or treat any
          condition. <Link href="/support">Support</Link>
        </p>
      </div>
    </main>
  );
}
