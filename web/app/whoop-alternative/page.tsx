import type { Metadata } from "next";
import Link from "next/link";

/**
 * The cheapest search win the SEO research found.
 *
 * "whoop alternative" is 590 Australian searches a month and "is whoop worth
 * it" another 480 — the only commercial keywords in this category with real
 * Australian volume and a soft page one. The organic winners on 7 Sep 2026
 * were a one-page affiliate site and two small app blogs, under two Reddit
 * threads whose sentiment is subscription fatigue.
 *
 * The page only works if it is genuinely useful to someone deciding, which
 * means saying plainly what Whoop does better and naming a cheaper rival that
 * beats us on the narrow question. A comparison page that concludes "buy ours"
 * regardless is the thing those Reddit threads are complaining about.
 *
 * Every fact here is from docs/COMPETITIVE_REVIEW_3.md, which sourced them
 * from the Australian App Store listings on 7 Sep 2026. Where the source was
 * uncertain — Whoop's vendor pages return 403 to a fetch — the page says so
 * rather than picking the number that flatters us.
 */

export const metadata: Metadata = {
  title: "Whoop alternatives without a band — an honest comparison",
  description:
    "What you get and what you lose if you drop the Whoop band and use your Apple Watch instead. Prices, privacy labels and the one thing no app can replace.",
  alternates: { canonical: "/whoop-alternative" },
};

const table = [
  {
    what: "What it needs",
    whoop: "The WHOOP band. The App Store listing says the app “requires a WHOOP wearable”.",
    us: "An iPhone. It reads what Apple Health already has, including an Apple Watch if you wear one.",
  },
  {
    what: "What it costs",
    whoop: "A membership, per year. Vendor pages would not load for us; the figures we could source were about A$299, A$399–419 and A$599 a year depending on tier.",
    us: "A$89.99 a year, or A$14.99 a month, or A$249 once. No hardware.",
  },
  {
    what: "Without paying",
    whoop: "No app. One free month is offered with the band.",
    us: "The interview, your first insight, the day’s shape, and every urge and reset tool — permanently.",
  },
  {
    what: "Where your data goes",
    whoop: "Its App Store label lists health, location, contact, content, identifiers, usage, sensitive info and diagnostics as linked to you, across advertising and analytics.",
    us: "No account. Device ID only, not linked to you. Health data is read on the phone and stays there.",
  },
  {
    what: "What it does with the reading",
    whoop: "A recovery score and a live strain target through the day.",
    us: "Changes your actual session and the rest of the week, and writes the reason on it.",
  },
];

export default function WhoopAlternativePage() {
  return (
    <main className="legal">
      <div className="legal-head">
        <Link href="/" aria-label="IntentNorth home">← IntentNorth</Link>
        <h1>Whoop without the band</h1>
        <p className="legal-date">An honest comparison · September 2026</p>
      </div>

      <p className="lede">
        People leave Whoop for one of two reasons: the yearly membership, or not
        wanting a second thing on their wrist. This page is about what actually
        changes if you stop — including the part where Whoop is better, and a
        cheaper app than ours that may suit you more.
      </p>

      <h2>What Whoop does that an app cannot</h2>
      <p>
        The band senses continuously. It is on you all day and all night, so it
        can build a strain figure that moves through the day and a recovery
        score from a full night of its own measurements. If that continuous
        picture is the thing you value, no phone app replaces it, and you should
        keep the band. We would rather say that here than have you find out
        after paying us.
      </p>

      {/*
        The thing a Whoop owner most needs to know before switching, and the
        thing every comparison page in this category gets wrong. Verified in
        docs/WEARABLE_POSITIONING.md section 1: Whoop syncs sleep, resting
        heart rate, SpO2, respiratory rate and workouts to Apple Health, but
        not HRV, because it computes RMSSD and Health stores SDNN.
      */}
      <h2>One thing to know if you keep the band</h2>
      <p>
        Whoop writes your sleep and resting heart rate to Apple Health, so we can read
        those. It does not write heart-rate variability, because Whoop computes that as
        RMSSD and Apple Health stores SDNN — two different statistics. Any app claiming
        to work with your Whoop variability figure is describing something that does not
        happen. Sleep and resting heart rate are what our short-night rule and our
        heart-rate comparison actually run on, so it matters less than it sounds, but
        you should hear it from us rather than find out.
      </p>

      <h2>What you get back</h2>
      <p>
        An Apple Watch already measures heart rate, heart-rate variability and
        sleep, and writes them into Apple Health. That is enough to know whether
        this morning is below your own normal. It is not enough for a live
        strain target.
      </p>

      <h2>Side by side</h2>
      <div className="compare-table">
        <table>
          <thead>
            <tr><th scope="col">&nbsp;</th><th scope="col">Whoop</th><th scope="col">IntentNorth</th></tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr key={row.what}>
                <th scope="row">{row.what}</th>
                <td>{row.whoop}</td>
                <td>{row.us}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="compare-note">
        Whoop’s prices are the least certain thing on this page. Its own pages
        would not load for us, so those figures come from search snippets and a
        third-party report that disagree with each other. Check them at
        whoop.com before deciding anything.
      </p>

      <h2>If you only want the number, we are not the cheapest</h2>
      <p>
        <strong>Athlytic</strong> reads your Apple Watch and gives you a recovery
        score and an exertion target for A$45.99 a year — half our price — and
        its App Store privacy label reads “Data Not Collected”, which is the
        strongest label in this category and stronger than ours. If a daily
        readiness number is all you are replacing, that is the honest
        recommendation and we are not it.
      </p>

      <h2>Where we are different</h2>
      <p>
        A readiness score tells you today is a bad day. It does not change what
        you were going to do about it. IntentNorth takes the same reading and
        rewrites the session — the hard lifts stay, the smaller exercises come
        out, the session shortens rather than gets cancelled — and then places
        it in a week that also contains your meals, your focused work, the
        practices you have added and the people you live with. That is the
        difference, and it is the only reason to pick us over a cheaper score.
      </p>

      <h2>The honest summary</h2>
      <ul className="compare-list">
        <li><strong>Keep Whoop</strong> if continuous, all-day sensing is what you are paying for.</li>
        <li><strong>Buy Athlytic</strong> if you want a daily readiness number off your Apple Watch, cheaply, and nothing else.</li>
        <li><strong>Try us</strong> if the number was never the problem — if what you actually wanted was for something to change the plan when the number is bad.</li>
      </ul>

      <p className="compare-cta">
        <Link className="text-link" href="/">See how IntentNorth plans a week →</Link>
        <br />
        <Link className="text-link" href="/works-with-what-you-wear">What we read from Apple Health, and which devices send it →</Link>
      </p>

      <p className="legal-fineprint">
        Facts about other apps come from their Australian App Store listings and
        published pages as at 7 September 2026, recorded in our competitive
        review. Prices and privacy labels change; check them yourself before
        buying. Nothing here is a recommendation about your health.
      </p>
    </main>
  );
}
