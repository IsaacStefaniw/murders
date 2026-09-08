import type { Metadata } from "next";
import Link from "next/link";

import { EvidenceSearch } from "./EvidenceSearch";
import library from "./library.json";

export const metadata: Metadata = {
  title: "Every practice, and how good the evidence behind it is",
  description:
    "All 317 practices in IntentNorth, each rated A to E for the strength of the research behind it, with what it will not do. 202 are rated Mixed or weaker and we say which.",
  alternates: { canonical: "/evidence" },
};

const weaker = library.counts.C + library.counts.D + library.counts.E;

export default function EvidencePage() {
  return (
    <main className="legal legal--wide">
      <div className="legal-head">
        <Link href="/" aria-label="IntentNorth home">← IntentNorth</Link>
        <h1>Every practice, and what the evidence actually says</h1>
        <p className="legal-date">All {library.total} of them · nothing held back for the paid app</p>
      </div>

      <p className="lede">
        Most health advice cites nothing, or cites everything as though it were
        equally certain. This is the whole library the app plans from, with the
        rating on each one. <strong>{weaker} of the {library.total} are rated
        Mixed or weaker</strong> — you can filter to them and read exactly what
        we are unsure about.
      </p>

      <EvidenceSearch />

      <h2>What the letters mean</h2>
      <dl className="ev-legend">
        {(["A", "B", "C", "D", "E"] as const).map((grade) => (
          <div key={grade}>
            <dt><span className={`ev-dot ev-dot--${grade.toLowerCase()}`}>{grade}</span>{library.gradeMeaning[grade].label}</dt>
            <dd>{library.gradeMeaning[grade].meaning} <em>{library.counts[grade]} practices.</em></dd>
          </div>
        ))}
      </dl>

      <h2>Why we publish the weak ones</h2>
      <p>
        A library where everything is excellent is a library that is not rating
        anything. The grade is only worth reading if it can come out low, so
        the low ones are here, filterable, with the same detail as the rest. If
        a practice is rated E it means we found no trial behind it — it is
        widely used and we are telling you it rests on experience rather than
        proof, which is different from saying it does not work.
      </p>

      <h2>What this is not</h2>
      <p>
        It is not medical advice and it is not a recommendation for you
        personally. A rating describes the strength of the published research,
        not whether a thing suits your body, your history or your medication.
        The safety notes say what a practice will not do and who should skip it;
        {" "}{library.practices.filter((p) => p.safety).length} of the{" "}
        {library.total} carry one. Where something touches alcohol, sleep or
        your head, talk to a doctor rather than a library.
      </p>

      <p className="compare-cta">
        <Link className="text-link" href="/">See how these get planned into a week →</Link>
      </p>

      <p className="legal-fineprint">
        Generated from the application&rsquo;s own practice file, so this page and
        the app cannot disagree. Named educators appear as attribution for
        practices distilled from their public teaching; it implies no
        endorsement of IntentNorth.
      </p>
    </main>
  );
}
