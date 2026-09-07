import type { Metadata } from "next";
import Link from "next/link";

import { EvidenceTopic } from "@/components/EvidenceTopic";

/**
 * "cold plunge benefits" — 480 Australian searches a month, up 50%, with
 * "cold plunge australia" in the rising list (docs/SEO_RESEARCH.md 3.1).
 * The question form has almost nothing behind it: "does cold plunge work" is
 * 10 a month and falling, and the Australian SERP for it is Mayo, Harvard and
 * Cleveland Clinic over a Reddit r/science thread. The benefits term is the
 * one worth writing for.
 *
 * The library practice is the cold-shower finish, rated C, and the honest
 * page is about the gap between what cold reliably does (alertness and mood,
 * for hours) and what it is sold as doing (recovery, fat loss, immunity).
 * There is one further thing to say that no hospital page will: cold is the
 * only practice in the library that doubles as rehearsal for tolerating an
 * urge, which is where IntentNorth actually uses it.
 */

export const metadata: Metadata = {
  title: "Cold plunge benefits: what holds up, and what is oversold",
  description:
    "IntentNorth rates a deliberate cold finish C — mixed. The alertness and mood effect is real and lasts hours. The recovery and fat-loss claims are weaker, and cold after lifting can work against you.",
  alternates: { canonical: "/cold-plunge-benefits" },
};

export default function ColdPlungeBenefitsPage() {
  return (
    <EvidenceTopic
      id="cold-finish"
      kicker="RATED PRACTICE"
      heading={<>Cold plunge benefits,<br />sorted from the hype</>}
      updated="September 2026"
      verdict={
        <>
          The alertness and mood lift is real, arrives within a minute and lasts
          for hours. Most of the rest of what cold gets sold on is thinner than
          that, and one popular use of it works against you.
        </>
      }
      related={[
        { href: "/sauna-benefits", label: "Sauna benefits, graded" },
        { href: "/evidence", label: "All 204 practices and their grades" },
      ]}
    >
      <p className="lede">
        You do not need a plunge tub. The version in our library is thirty to sixty
        seconds of cold at the end of an ordinary shower, which is the version most of
        the interesting evidence is about and the only version most people will still be
        doing in a month.
      </p>

      <h2>What holds up</h2>
      <p>
        Brief deliberate cold reliably spikes alertness and mood chemistry, and the
        effect outlasts the exposure by hours. This is the part people notice on day
        one, and it is the reason the practice is in the library at all.
      </p>

      <h2>What is oversold</h2>
      <p>
        Fat loss, immunity and general recovery are the claims that carry the marketing
        and the weakest support. And there is one specific case where cold is not
        neutral but counterproductive: regularly icing straight after resistance
        training blunts part of the adaptation you trained for. If you lift and you
        plunge, put distance between them.
      </p>
      <p>
        That mix &mdash; one effect that is easy to feel and consistent, several that are
        not &mdash; is what a C means. Reasonable evidence, smaller studies, results that
        conflict.
      </p>

      <h2>The use nobody else lists</h2>
      <p>
        The first uncomfortable minute is the point. Staying in something unpleasant that
        you have chosen, on purpose, without bailing, is rehearsal &mdash; and it is the
        same skill as sitting through a craving at 9pm without acting on it. IntentNorth
        uses the cold finish that way, alongside the urge tools, rather than as a
        recovery ritual. It is the only practice in the library that appears in both
        places.
      </p>

      <h2>How to do it without turning it into a project</h2>
      <p>
        Finish the shower you were having anyway with thirty to sixty seconds of cold.
        Uncomfortable, never painful. Work up rather than starting at the coldest tap.
        The tub, the timer and the breathing protocol are optional; the consistency is
        not.
      </p>
      <p>
        In the app it sits in the morning, on the days your week has room for it, with
        its C on it. <Link href="/evidence">The whole library</Link> works the same way
        &mdash; 122 of the 204 practices are rated C or weaker, and each says which.
      </p>
    </EvidenceTopic>
  );
}
