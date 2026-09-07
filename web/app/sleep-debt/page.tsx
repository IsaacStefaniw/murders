import type { Metadata } from "next";
import Link from "next/link";

import { SleepDebtTool } from "./SleepDebtTool";

/**
 * "sleep debt" is 1,600 Australian searches a month and rising 46% — low
 * competition, and Rise, whose product term it is, does not rank for the
 * calculator queries (docs/SEO_RESEARCH.md §8). The research also found that
 * single-purpose calculators are the one page shape that reliably ranks in
 * this space, one tool per head keyword, for years.
 *
 * This is a real one: it runs the app's own method, in the browser, with
 * nothing sent anywhere.
 */

export const metadata: Metadata = {
  title: "Sleep debt calculator — what you are actually behind",
  description:
    "Work out your sleep debt from your own recent nights, using the method IntentNorth uses: your need estimated from your long nights, older nights weighted half. Nothing is sent anywhere.",
  alternates: { canonical: "/sleep-debt" },
};

export default function SleepDebtPage() {
  return (
    <main className="legal">
      <div className="legal-head">
        <Link href="/" aria-label="IntentNorth home">← IntentNorth</Link>
        <h1>Sleep debt calculator</h1>
        <p className="legal-date">Runs in your browser · nothing is sent anywhere</p>
      </div>

      <p className="lede">
        Sleep debt is the total of what you were short, night after night,
        against what you personally need. Most calculators assume you need eight
        hours. This one estimates your need from your own nights, which is what
        the app does.
      </p>

      <SleepDebtTool />

      <h2>How the number is worked out</h2>
      <p>
        Three steps, and they are the same three the app runs.
      </p>
      <ol className="sd-steps">
        <li>
          <strong>Your need comes from your long nights.</strong> Not eight
          hours, and not a survey average — the upper quarter of your recent
          nights, on the reasoning that the long ones are what your body took
          when nothing stopped it. It is held between seven and nine hours,
          because the evidence does not support a confident number outside that
          for adults.
        </li>
        <li>
          <strong>Each night short is added up.</strong> Sleeping longer than
          your need does not bank credit — you cannot get ahead, which is why
          the total only goes one way.
        </li>
        <li>
          <strong>Older nights count half.</strong> A short night ten days ago
          is not costing you what last night is.
        </li>
      </ol>

      <h2>What it is not</h2>
      <p>
        It is not a diagnosis and it is not a score. Under about two hours, the
        app does not mention it at all, because that is ordinary variation
        rather than a deficit worth acting on. If you are sleeping badly most
        nights, or you sleep long hours and still wake tired, that is a
        conversation with a doctor rather than an arithmetic problem — sleep
        apnoea and thyroid problems both look like sleep debt from the outside
        and neither is fixed by an earlier bedtime.
      </p>

      <h2>What the app does with it</h2>
      <p>
        The number on its own changes nothing, which is the honest limit of any
        calculator including this one. In IntentNorth the figure is read from
        Apple Health across fourteen nights without you typing anything, and
        then it does something: a short night shortens today&rsquo;s session
        rather than cancelling it, the hard part is kept, and the reason is
        written on the change. It also moves the bedtime it suggests, never
        earlier than 8pm, because advice you would not follow is not advice.
      </p>

      <p className="compare-cta">
        <Link className="text-link" href="/">See how IntentNorth plans a week →</Link>
      </p>

      <p className="legal-fineprint">
        Educational only, never medical advice. This page stores nothing and
        sends nothing — there is no account, no database and no server behind
        it, so the numbers you type exist only in this tab. In Australia,
        Healthdirect is 1800 022 222 at any hour.
      </p>
    </main>
  );
}
