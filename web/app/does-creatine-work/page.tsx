import type { Metadata } from "next";
import Link from "next/link";

import { EvidenceTopic } from "@/components/EvidenceTopic";

/**
 * "does creatine work" 260 a month and "is creatine worth it" 170, with the
 * topic word itself booming in Australian Trends — 16 to 81 over five years,
 * the steepest rise of anything in docs/SEO_RESEARCH.md section 2.3.
 *
 * This is the counterweight to the magnesium page, and the pair is the
 * argument for the whole grading system: the same library that rates a
 * best-selling sleep supplement D rates creatine A. A grader that only ever
 * downgrades is as useless as one that only ever approves.
 *
 * Everything here is from the library entry, which cites the International
 * Society of Sports Nutrition position stand (Kreider et al., 2017). The
 * "three to five grams" figure is in the entry because the position stand
 * states it — the sourcing policy in the app's supplements file allows an
 * amount only where a named public source gives one, described as theirs.
 */

export const metadata: Metadata = {
  title: "Does creatine work? Rated A — the strongest evidence in our library",
  description:
    "IntentNorth rates creatine monohydrate A — strong. Hundreds of trials and an ISSN position stand find more strength and lean mass alongside resistance training. What it does not do, and who should not take it.",
  alternates: { canonical: "/does-creatine-work" },
};

export default function DoesCreatineWorkPage() {
  return (
    <EvidenceTopic
      id="creatine-monohydrate"
      kicker="RATED PRACTICE"
      heading={<>Does creatine work?</>}
      updated="September 2026"
      verdict={
        <>
          Yes, if you lift &mdash; and only if you lift. It is the most-tested
          supplement in sports nutrition and one of fifteen practices in our
          library rated A. Without resistance training there is little to show
          for it.
        </>
      }
      related={[
        { href: "/magnesium-for-sleep", label: "Magnesium for sleep — rated D, and why" },
        { href: "/evidence", label: "All 204 practices and their grades" },
      ]}
    >
      <p className="lede">
        Most supplement questions have a disappointing answer. This one does not, which
        is worth saying plainly on a site that spends most of its time downgrading
        things.
      </p>

      <h2>What the evidence actually is</h2>
      <p>
        Hundreds of trials, and a position stand from the International Society of
        Sports Nutrition (Kreider et al., 2017). The finding: a little more strength and
        lean mass from resistance training once muscle creatine stores are full, and no
        harm to kidney function in healthy adults across years of use. That combination
        &mdash; a real effect, repeatedly replicated, with long-run safety data &mdash;
        is what an A means in our library. Fifteen of 204 practices have one.
      </p>

      <h2>What it will not do</h2>
      <ul>
        <li>
          <strong>Work without training.</strong> The effect is on what resistance
          training produces, not on the body at rest. If you are not lifting, this is a
          purchase with nothing attached to it.
        </li>
        <li>
          <strong>Work faster in an expensive form.</strong> Plain monohydrate is the
          form the evidence used. The variants that cost more have not beaten it.
        </li>
        <li>
          <strong>Reward a loading week.</strong> The position stand describes three to
          five grams a day filling the stores over three to four weeks. A larger loading
          phase gets there faster; it does not get you further.
        </li>
      </ul>

      <h2>The water-weight thing</h2>
      <p>
        A kilo or so in the first weeks is normal, it is water, and it is not fat. It is
        also the single most common reason people stop in the first month, which is why
        it is on the practice card in the app rather than in a footnote.
      </p>

      <h2>Why an A here and a D on magnesium</h2>
      <p>
        Because that is what the two literatures look like. A library where everything
        scored well would be telling you nothing, and one where nothing did would be
        posturing. <Link href="/magnesium-for-sleep">Magnesium for sleep</Link> is rated
        D on the same scale by the same method: systematic reviews rate its evidence low
        to very low. The grades are only useful if they move.{" "}
        <Link href="/evidence">All 204 are published</Link>, including the 122 rated C
        or weaker.
      </p>
    </EvidenceTopic>
  );
}
