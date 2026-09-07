import type { Metadata } from "next";
import Link from "next/link";

import { EvidenceTopic } from "@/components/EvidenceTopic";

/**
 * "magnesium for sleep" — 8,100 Australian searches a month, the largest
 * single term in docs/SEO_RESEARCH.md section 3.1, with "does magnesium help
 * you sleep" another 590 and rising "magnesium glycinate" variants behind it.
 *
 * The Australian page one on 7 Sep 2026 was Mayo Clinic Press, Sleep
 * Foundation, a Reddit thread, then NIH PMC, Cleveland Clinic and Swisse.
 * Two of those sell magnesium. We cannot out-authority a hospital, and we
 * should not try; what none of them do is publish a grade.
 *
 * IntentNorth grades magnesium D — thin — and that is the page. It is the
 * only version worth writing: a supplement page that ranks by telling
 * somebody the thing they are about to buy probably will not work. If that
 * costs a sale, the alternative costs the reason anyone should believe the
 * other 203 grades.
 *
 * The claims here come from the library entry (magnesium-honest) and its
 * cited review, and from the two practices the entry names as better
 * evidenced. Nothing is added that the app does not already say.
 */

export const metadata: Metadata = {
  title: "Magnesium for sleep: what the trials actually show",
  description:
    "IntentNorth rates magnesium for sleep D — thin evidence. Systematic reviews rate it low to very low certainty. What that means, what the trials found, and the two things with far better evidence behind them.",
  alternates: { canonical: "/magnesium-for-sleep" },
};

export default function MagnesiumForSleepPage() {
  return (
    <EvidenceTopic
      id="magnesium-honest"
      kicker="RATED PRACTICE"
      heading={<>Does magnesium<br />help you sleep?</>}
      updated="September 2026"
      verdict={
        <>
          Probably a little, at most, and possibly not at all. Magnesium is one of the
          most-bought sleep supplements in Australia and one of the least-supported
          things in our library. We grade it the way the reviews read, not the way it
          sells.
        </>
      }
      related={[
        { href: "/sleep-debt", label: "Work out your sleep debt — the free calculator" },
        { href: "/evidence", label: "All 204 practices and their grades" },
      ]}
    >
      <p className="lede">
        If you are about to buy magnesium for sleep, the useful thing to know is not
        which form to get. It is how strong the evidence is that any of them will do
        much — and that is where almost every page on this subject goes quiet.
      </p>

      <h2>What the trials found</h2>
      <p>
        Systematic reviews of magnesium for sleep rate the evidence low to very low
        certainty. A handful of small studies found people fell asleep somewhat sooner.
        Total sleep time was no different. That is the whole finding, and the honest
        summary of it is &ldquo;small effect at most&rdquo; rather than either
        &ldquo;proven sleep aid&rdquo; or &ldquo;useless&rdquo;.
      </p>
      <p>
        Low certainty is a specific claim, not a hedge. It means the studies were small
        enough, or built loosely enough, that a future trial could easily land somewhere
        else. Anyone telling you magnesium is established for sleep is describing a
        literature that does not exist yet.
      </p>

      <h2>Food first, and why that is not a dodge</h2>
      <p>
        Nuts, seeds, beans, leafy greens and whole grains carry magnesium, and eating
        them is the version with no label to read, no interaction to check and no
        purchase to make. It is also the version most of the supporting argument for
        supplementation quietly rests on — low intake being the reason to top up.
      </p>

      <h2>Two things with far better evidence</h2>
      <p>
        If the goal is falling asleep more easily, our library rates both of these
        higher than magnesium, and both are free:
      </p>
      <ul>
        <li>
          <strong>A wind-down, rated B.</strong> Screens away and slow breathing before
          bed. Long, slow exhales shift the nervous system toward rest, and a consistent
          pre-sleep routine is one of the most reliable sleep-quality improvements there
          is.
        </li>
        <li>
          <strong>A caffeine cutoff, rated A.</strong> A meta-analysis of twenty-four
          studies found a coffee within about nine hours of bedtime cut the night by
          roughly three quarters of an hour. A pre-workout product needs thirteen. This
          is the single biggest sleep lever most people have not pulled.
        </li>
      </ul>
      <p>
        Both are in IntentNorth, scheduled at real times in your week rather than left
        as advice. So is magnesium — with its D on it.
      </p>

      <h2>If you try it anyway</h2>
      <p>
        That is a reasonable thing to do with a D. Thin evidence means untested, not
        disproven, and a cheap, low-risk thing with a small possible upside is a fair
        experiment. Give it a fortnight, keep everything else the same, and judge it on
        your own nights rather than on the packet.
      </p>

      <h2>What we will not tell you</h2>
      <p>
        An amount, or a form. Neither is ours to give: the trials are too thin to justify
        a number and any figure printed here would outrank a label and a pharmacist for
        somebody who read it, which is exactly backwards. <Link href="/evidence">Every
        supplement entry in the library</Link> works the same way — what the public
        evidence shows, graded, and no dose.
      </p>
    </EvidenceTopic>
  );
}
