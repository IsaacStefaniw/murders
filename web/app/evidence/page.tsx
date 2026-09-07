import type { Metadata } from "next";
import Link from "next/link";

import { EvidenceSearch } from "./EvidenceSearch";
import library from "./library.json";

export const metadata: Metadata = {
  title: "Every practice, and how good the evidence behind it is",
  description:
    "All 204 practices in IntentNorth, each rated A to E for the strength of the research behind it, with what it will not do. 122 are rated Mixed or weaker and we say which.",
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

      {/*
        Six of the 204 have a page of their own, because six of the topic
        terms have real Australian search volume behind them (section 3.1 of
        docs/SEO_RESEARCH.md). Linking them from here is the point of the
        cluster: a reader who lands on the magnesium page from Google finds
        the library, and a reader browsing the library finds the long answer.
      */}
      <h2>Written up in full</h2>
      <p>
        Six of these get a page of their own, because they are the questions people
        actually search for. Each one leads with its grade, including the ones that
        are not flattering.
      </p>
      <ul className="ev-topics">
        <li><Link href="/magnesium-for-sleep">Does magnesium help you sleep?</Link> — rated D</li>
        <li><Link href="/does-creatine-work">Does creatine work?</Link> — rated A</li>
        <li><Link href="/what-is-zone-2">What is zone 2?</Link> — rated B</li>
        <li><Link href="/cyclic-sighing">Cyclic sighing</Link> — rated B</li>
        <li><Link href="/sauna-benefits">Sauna benefits</Link> — rated C</li>
        <li><Link href="/cold-plunge-benefits">Cold plunge benefits</Link> — rated C</li>
      </ul>

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
