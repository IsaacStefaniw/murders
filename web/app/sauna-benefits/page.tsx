import type { Metadata } from "next";
import Link from "next/link";

import { EvidenceTopic } from "@/components/EvidenceTopic";

/**
 * "sauna benefits" — 3,600 Australian searches a month, up 23% year on year
 * (docs/SEO_RESEARCH.md section 3.1). The second-largest topic term we have a
 * graded practice for.
 *
 * The library rates sauna C, and the reason is the interesting part: the
 * headline finding is a Finnish cohort, which is an association in a
 * population, not a trial. Almost every page on this term reports the cohort
 * as though it settled the question. Saying what kind of study it was, and
 * what that kind of study can and cannot establish, is the whole
 * differentiator — and it is also the honest reason for a C rather than a B.
 */

export const metadata: Metadata = {
  title: "Sauna benefits: what the evidence supports, and what it does not",
  description:
    "IntentNorth rates regular sauna use C — mixed. The cardiovascular findings come from long-running Finnish cohort studies, which show association rather than cause. What that means for you, and how often is enough.",
  alternates: { canonical: "/sauna-benefits" },
};

export default function SaunaBenefitsPage() {
  return (
    <EvidenceTopic
      id="sauna"
      kicker="RATED PRACTICE"
      heading={<>Sauna benefits,<br />graded honestly</>}
      updated="September 2026"
      verdict={
        <>
          Good evidence that it helps you relax and sleep. Weaker evidence for the
          heart claims it is usually sold on — those come from watching a
          population, not from testing it.
        </>
      }
      related={[
        { href: "/cold-plunge-benefits", label: "Cold plunge benefits, graded" },
        { href: "/evidence", label: "All 204 practices and their grades" },
      ]}
    >
      <p className="lede">
        Two claims get made about saunas, and they are not equally well supported.
        Separating them is most of what a page like this is for.
      </p>

      <h2>The claim that holds up better</h2>
      <p>
        Sauna use reliably helps relaxation and sleep. This is the modest end of the
        literature and the end most people actually feel. If that is why you use one,
        the evidence is on your side and the rest of this page is optional.
      </p>

      <h2>The claim that needs a caveat</h2>
      <p>
        The cardiovascular headlines &mdash; lower risk of heart events and death with
        frequent use &mdash; come from long-running Finnish cohort studies. A cohort
        study follows a large group over years and records what happens. It is a
        genuinely valuable design and it cannot separate the sauna from the people who
        use one four times a week: in Finland that group is, on average, healthier,
        more active and better off than the group that does not.
      </p>
      <p>
        That is why the practice is rated C rather than B. Not because the finding is
        weak &mdash; it is large, consistent and repeatedly replicated &mdash; but
        because association is not the same claim as cause, and grading it as though it
        were would make every other letter in our library mean less.
      </p>

      <h2>How much, in practice</h2>
      <p>
        The version in IntentNorth is two to four sessions a week, roughly fifteen to
        twenty minutes, at a heat you tolerate comfortably. The frequency comes from
        where the cohort findings were strongest; the duration and the heat are the
        boring part, and going hotter or longer is not the lever.
      </p>

      <h2>Where it sits against other things</h2>
      <p>
        A C is a real recommendation with a real caveat, and it is worth knowing what
        outranks it. In our library, a caffeine cutoff and creatine for people who lift
        are rated A; a wind-down before bed and easy aerobic work are rated B. If you
        are choosing where to spend a limited amount of effort, those come first.
        Sauna is a good thing that is well short of a settled one. <Link href="/evidence">The
        full library</Link> shows every grade side by side.
      </p>
    </EvidenceTopic>
  );
}
