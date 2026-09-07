import type { Metadata } from "next";
import Link from "next/link";

import { EvidenceTopic } from "@/components/EvidenceTopic";

/**
 * "what is zone 2" — 390 Australian searches a month, with "zone 2 cardio
 * benefits" another 20 and up 100%, and the topic word the strongest riser in
 * the Australian Trends sample (23 → 80 over five years, section 2.3 of
 * docs/SEO_RESEARCH.md).
 *
 * It is also the term the round-three reviewers flagged hardest: "Zone 2" was
 * the single most-flagged piece of jargon on the site, ahead of the grade
 * sentence. So this page has an unusual job — it is simultaneously the SEO
 * page for the term and the plain-English definition the rest of the site
 * needs to be able to point at. It defines the phrase in the first sentence
 * and then mostly stops using it.
 *
 * "is zone 2 worth it" is the one query in the whole research set where
 * Google rendered a full AI Overview rather than failing to. Reddit ranked
 * first. Neither slot is winnable with a page; the definitional query is.
 */

export const metadata: Metadata = {
  title: "What is zone 2? The plain-English version, and whether it is worth it",
  description:
    "Zone 2 is cardio easy enough to hold a conversation through. IntentNorth rates it B — good evidence. What it does, how to find the pace without a heart-rate strap, and how much you need.",
  alternates: { canonical: "/what-is-zone-2" },
};

export default function WhatIsZoneTwoPage() {
  return (
    <EvidenceTopic
      id="zone2"
      kicker="RATED PRACTICE"
      heading={<>What is zone 2?</>}
      updated="September 2026"
      verdict={
        <>
          Cardio easy enough that you could hold a conversation through it. That
          is the whole definition. The evidence behind doing a reasonable amount
          of it is good &mdash; better than for most of the hard training it gets
          compared against.
        </>
      }
      related={[
        { href: "/sauna-benefits", label: "Sauna benefits, graded" },
        { href: "/evidence", label: "All 204 practices and their grades" },
      ]}
    >
      <p className="lede">
        &ldquo;Zone 2&rdquo; is a coaching term for a pace, and it has acquired a
        mystique it does not need. Our own users told us it was the most confusing phrase
        on this site, so here it is without the jargon.
      </p>

      <h2>The definition</h2>
      <p>
        It is the effort at which you can still talk in full sentences and would rather
        not sing. A brisk walk, an easy ride, an easy jog. If you can only gasp out
        words, you have gone too hard &mdash; and going too hard is the single most
        common way people do this wrong, because it feels more like training.
      </p>

      <h2>You do not need a strap to find it</h2>
      <p>
        The heart-rate zone charts are a proxy for the talk test, not the other way
        round. The zone boundaries in them are derived from formulas that are wrong for
        a large minority of people, and the talk test costs nothing and works on the day
        rather than on your age. If you own a strap, use it to confirm what talking
        already told you.
      </p>

      <h2>Why it is worth the time</h2>
      <p>
        Easy aerobic volume builds the mitochondrial base tied to metabolic health and
        endurance. It is the biggest return per unmiserable minute most people have
        available: the effort is low enough to be repeatable, which is the property that
        actually determines whether training happens.
      </p>
      <p>
        We rate it B &mdash; good human studies, with room left to argue about exactly
        how much and exactly how easy. The strong claims you will see about specific
        zone boundaries and specific durations are ahead of that evidence.
      </p>

      <h2>How it fits with hard intervals</h2>
      <p>
        They are not rivals. IntentNorth also carries a weekly hard-interval session
        &mdash; roughly four rounds of four minutes hard, four easy &mdash; rated B for
        lifting peak aerobic fitness, which tracks long-term health more strongly than
        almost any other fitness measure. The usual mistake is doing every session at
        the effort in between: too hard to be repeatable, too easy to be a stimulus.
      </p>

      <h2>How much</h2>
      <p>
        The version in the app is around forty minutes at conversational pace, scheduled
        into your week at a time you are actually free, alongside one interval session.
        It reduces both when your week goes sideways rather than cancelling them.{" "}
        <Link href="/evidence">Both practices are published in full</Link>, with their
        grades and what they will not do.
      </p>
    </EvidenceTopic>
  );
}
