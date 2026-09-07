import type { Metadata } from "next";
import Link from "next/link";

/**
 * The wearable door.
 *
 * Written to docs/WEARABLE_BRIEF.md and docs/WEARABLE_POSITIONING.md, both
 * researched in a separate session on 7 Sep 2026. The insight those two
 * documents land on: every recovery product in the category ends at a number.
 * Whoop gives a recovery score, Rise a sleep debt, Athlytic an exertion
 * target, Gentler Streak a nudge, Bevel a dashboard. None of them changes what
 * the day asks of you. The gap is not "we work with your band" — the band
 * works fine — it is that nothing you own does anything after the number.
 *
 * This is a door into the same house as the home page, not a second brand.
 * The hero must keep working for the person with no device, who is the larger
 * market, so the wearable story lives here and in one section below the fold.
 *
 * Every claim on this page was checked against the code rather than the brief:
 *
 *   READ_TYPES in src/features/health/healthkit.ts — the seven signals, and
 *     the read-only comment at the top of that file.
 *   BASELINE_DAYS = 14, MIN_READINGS = 5, median not mean, and the header
 *     comment about population bands — src/features/health/readiness.ts.
 *   autoRegulate in src/features/training/programme.ts — a night under six
 *     hours slices accessories to one, keeps the main work, and writes
 *     "Short night — main work stays, accessories rest today." as the reason.
 *
 * Four things the research says must never appear here, all of them tempting:
 *
 *   1. "Buy the device and cancel the subscription." False for Whoop, whose
 *      own cancellation page says a cancelled membership cannot "collect,
 *      upload, or analyze" any data — so nothing reaches Apple Health at all.
 *      Self-defeating for Oura, whose Health integration is listed as needing
 *      an active membership on Gen3 and Ring 4. App Review 2.3.1 treats
 *      misleading marketing as grounds for removal.
 *   2. "Works with your Oura or Whoop HRV." Both compute RMSSD; Apple Health
 *      stores SDNN. Neither writes HRV to Health at all. Leading on HRV would
 *      quietly exclude the two brands most likely to read this page, which is
 *      why the page leads on sleep and resting heart rate instead.
 *   3. "Works with any wearable." Suunto sends neither sleep nor resting
 *      heart rate. Only the three verified families are named.
 *   4. "The only app that reads your band and changes the plan." Training
 *      Today reads Apple Health, computes readiness and prescribes a session.
 *      It is running-only, so the defensible claim is about the whole week.
 *
 * Also held back deliberately: the day-one claim. The app currently reads the
 * most recent Apple Health reading, so someone with two years of ring history
 * still waits fourteen days for a baseline. The sixty-day backfill is being
 * built. Nothing here may say otherwise until it ships.
 */

export const metadata: Metadata = {
  title: "Works with the wearable you already own — no new device, no second subscription",
  description:
    "Your watch or ring writes to Apple Health. IntentNorth reads it and changes what today asks of you — the session, the evening, the order things happen in. No hardware to buy, no account, no second subscription.",
  alternates: { canonical: "/works-with-what-you-wear" },
};

/**
 * The seven signals are READ_TYPES in src/features/health/healthkit.ts, in
 * that order. Nothing else is read, and nothing is ever written back.
 */
const reads = [
  { signal: "How long you slept", note: "The one that changes the most. Under six hours and today's session keeps the hard lifts and drops the smaller exercises." },
  { signal: "Resting heart rate", note: "Compared against your own median from the last fourteen days. Five beats over is worth noticing; ten changes the session." },
  { signal: "Heart-rate variability", note: "Used the same way, when your device writes it to Apple Health. Many do not — see below." },
  { signal: "Cardio fitness (VO₂ max)", note: "Apple Watch and Withings supply this. Garmin deliberately withholds it. You can type it in." },
  { signal: "Body weight", note: "Read as a three-week trend, never as this morning's number." },
  { signal: "Height", note: "A profile field, typed once." },
  { signal: "Waist", note: "A tape measure and a text field. No wearable in the category writes this." },
];

export default function WorksWithWhatYouWearPage() {
  return (
    <main className="legal wear">
      <div className="legal-head">
        <Link href="/" aria-label="IntentNorth home">← IntentNorth</Link>
        <p className="section-kicker">THE DEVICE YOU ALREADY OWN</p>
        <h1>Your ring already knows.<br />Your Tuesday doesn&rsquo;t.</h1>
      </div>

      <p className="lede">
        Whatever you wear writes to Apple Health. IntentNorth reads it and changes what
        today asks of you: the session, the evening, the order things happen in. Nothing
        else you own does anything after the number.
      </p>

      <ul className="wear-points">
        <li>
          <strong>A short night changes today&rsquo;s session, and the session says why.</strong>{" "}
          Under six hours and the hard lifts stay while the smaller exercises come out. The
          session carries the app&rsquo;s own sentence &mdash; &ldquo;Short night &mdash; main
          work stays, accessories rest today&rdquo; &mdash; so you can disagree with it.
        </li>
        <li>
          <strong>Read against your own normal from the last fourteen days</strong>, never a
          population band you were never in. Healthy adults sit anywhere from about 20ms to
          200ms of heart-rate variability, so an app that colours a number red against a
          population range is telling half its users something false.
        </li>
        <li>
          <strong>No new device, no second subscription, no account.</strong> IntentNorth does
          not sell hardware and does not need any. It adds no health subscription on top of
          whatever your device already charges.
        </li>
      </ul>

      <h2>What we read, and what we don&rsquo;t</h2>
      <p>
        Seven things from Apple Health and nothing else. We never write to Health — the
        adapter is read-only by construction. We do not read your messages, your location,
        or your workouts blow by blow.
      </p>
      <dl className="wear-reads">
        {reads.map((r) => (
          <div key={r.signal}>
            <dt>{r.signal}</dt>
            <dd>{r.note}</dd>
          </div>
        ))}
      </dl>
      <p>
        No wearable at all? Every one of those can be typed in, and sleep hours too. The
        plan works without a device; it just stops adapting to the nights.
      </p>

      <h2>The thing nobody tells you about HRV</h2>
      <p>
        Apple Health stores heart-rate variability as SDNN. Oura and Whoop both compute it
        as RMSSD, a different statistic, and neither writes HRV into Apple Health at all.
        So if you own one of those, we do not see your variability figure — and any app
        telling you it works with your Oura or Whoop HRV is describing something that does
        not happen.
      </p>
      <p>
        It matters less than it sounds. Sleep and resting heart rate are close to universal
        across devices, and those two are what the short-night rule and the
        resting-heart-rate comparison actually run on. Variability makes the reading
        sharper where a device provides it; it is not the thing holding the system up.
      </p>

      <h2>Which devices, specifically</h2>
      <p>We will name the three families that were checked rather than say &ldquo;any wearable&rdquo;, because that is not true:</p>
      <ul>
        <li>
          <strong>Apple Watch.</strong> The only one that reliably fills all four of sleep,
          resting heart rate, variability and cardio fitness. Nothing extra to pay for the sync.
        </li>
        <li>
          <strong>Garmin, through Garmin Connect.</strong> Sleep with stages, resting heart
          rate, weight. Garmin does not pass on its cardio fitness figure. Connect+ is an
          extra tier and is not needed for the sync.
        </li>
        <li>
          <strong>Withings.</strong> The one non-Apple family found that sends cardio fitness
          as well as sleep, heart rate and weight, and the clean case for a connected scale.
        </li>
      </ul>
      <p>
        Rings and bands from Oura, Whoop, Ultrahuman, RingConn, Fitbit, Polar, Coros and
        others write sleep and resting heart rate, which is enough for the parts that
        matter most. Suunto writes neither, so it will not drive anything.
      </p>

      <h2>We do not replace the app your band came with</h2>
      <p>
        It measures; we decide what the day does about it. Keep it, keep whatever it costs,
        and let it keep writing to Health. If you stop wearing the band the plan keeps
        working — it just stops adapting to the nights.
      </p>
      <p>
        And we will not tell you to buy hardware and cancel the membership, which is the
        advice going round. For Whoop it is simply false: the company&rsquo;s own
        cancellation page says that once cancelled you cannot collect, upload or analyse any
        of your data, so nothing reaches Apple Health and the band is a bracelet. For Oura,
        the Apple Health integration on current rings is listed as needing an active
        membership, so cancelling would break the exact connection we depend on.
      </p>

      <h2>This is a training input, not a health assessment</h2>
      <p>
        A low reading changes how many of the smaller exercises a session includes. It never says
        anything about whether you are unwell, and it must not start to. If a number
        worries you, that is a conversation with a doctor and not with an app.
      </p>

      <div className="wear-cta">
        <p>
          <Link href="/">See what a week looks like</Link> — or read{" "}
          <Link href="/whoop-alternative">the honest Whoop comparison</Link>, which names a
          cheaper app than ours if a daily readiness number is all you want.
        </p>
      </div>

      <p className="legal-fineprint">
        Device behaviour recorded 7 September 2026 from vendor support pages and the
        Australian App Store. Vendors change what they sync; check yours if it matters to
        your decision. Education, never diagnosis or personal advice.
      </p>
    </main>
  );
}
