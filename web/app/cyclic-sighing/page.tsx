import type { Metadata } from "next";
import Link from "next/link";

import { EvidenceTopic } from "@/components/EvidenceTopic";

/**
 * "cyclic sighing" — 140 Australian searches a month, up 55%, and the only
 * term in section 3.1 where the phrase itself comes from a specific
 * randomised trial rather than from folklore. Nobody owns the SERP: the
 * research found no known ranker, and it is a term with no commercial
 * incumbent because there is nothing to sell.
 *
 * The library entry is unusually specific about the trial's design and its
 * comparator, which is exactly the material a page needs. This one gets to be
 * short: the practice takes five minutes to describe and the evidence is one
 * good study rather than a literature to summarise.
 */

export const metadata: Metadata = {
  title: "Cyclic sighing: the five-minute breathing pattern, and the trial behind it",
  description:
    "Two inhales through the nose, then a long slow exhale, for five minutes. IntentNorth rates it B. In a randomised trial it beat five minutes of mindfulness meditation on day-to-day mood.",
  alternates: { canonical: "/cyclic-sighing" },
};

export default function CyclicSighingPage() {
  return (
    <EvidenceTopic
      id="cyclic-sighing"
      kicker="RATED PRACTICE"
      heading={<>Cyclic sighing</>}
      updated="September 2026"
      verdict={
        <>
          Five minutes a day of double inhale through the nose, then a long, slow
          exhale. In a randomised trial it came out ahead of five minutes of
          mindfulness meditation on day-to-day mood.
        </>
      }
      related={[
        { href: "/magnesium-for-sleep", label: "Magnesium for sleep — rated D, and why" },
        { href: "/evidence", label: "All 204 practices and their grades" },
      ]}
    >
      <p className="lede">
        Most breathing techniques are handed down rather than tested. This one was tested
        against a credible comparator, which is why it is in the library and most are
        not.
      </p>

      <h2>How to do it</h2>
      <ol>
        <li>Inhale through the nose.</li>
        <li>On top of that breath, take a second, shorter sip of air through the nose.</li>
        <li>Let it out through the mouth, slowly, for longer than both inhales together.</li>
        <li>Repeat for five minutes.</li>
      </ol>
      <p>
        There is no count to hit and no app to open. If the second sip does not happen
        easily, the lungs were already full &mdash; that is the signal to just exhale.
      </p>

      <h2>Which part is doing the work</h2>
      <p>
        The long exhale. The second inhale exists to make a longer exhale possible, not
        because two inhales are themselves the mechanism. This matters practically: if
        you get the double inhale wrong but the exhale is slow and complete, you are
        still doing the exercise.
      </p>

      <h2>The trial</h2>
      <p>
        A randomised trial pitted five daily minutes of breathwork against five daily
        minutes of mindfulness meditation. Cyclic sighing came out ahead on day-to-day
        mood and produced the larger drop in resting breathing rate.
      </p>
      <p>
        We rate it B rather than A because that is one good study, not a settled
        literature &mdash; the comparison is well built and the finding has not yet been
        replicated at the scale an A requires. It is a strong result, honestly labelled.
      </p>

      <h2>What it is not</h2>
      <p>
        A treatment. It is a steadying tool with a good study behind it, and it does not
        substitute for care if anxiety or low mood is affecting your life. In IntentNorth
        it sits alongside the other five-minute tools, free, permanently &mdash; we do
        not charge for anything someone reaches for at their worst.{" "}
        <Link href="/evidence">The full library</Link> shows what else is rated B and
        what is not.
      </p>
    </EvidenceTopic>
  );
}
