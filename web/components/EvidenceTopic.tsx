import Link from "next/link";

import library from "@/app/evidence/library.json";

/**
 * The shell every topic page shares.
 *
 * These pages exist because of one finding in docs/SEO_RESEARCH.md: the
 * evidence questions people type ("does cold plunge work", 10 a month) have
 * almost no Australian volume, and the head SERP for them belongs to Mayo,
 * Harvard, Cleveland Clinic and Reddit — not winnable for a new domain inside
 * a year. The volume sits one step up, in the topic noun: "magnesium for
 * sleep" 8,100 a month, "sauna benefits" 3,600, "what is zone 2" 390.
 *
 * So the pages are not another "10 benefits of X" article, which is the shape
 * those hospital sites already own. Section 7 of the research checked 21 App
 * Store listings, eight competitor sites and five vendor science pages and
 * found nobody publishing an evidence grade for a practice. That is the only
 * thing we have that Mayo does not, so it is what the page leads with — and
 * it means the page has to be willing to open with a D.
 *
 * The grade, the plain-word label and the safety note are read from
 * app/evidence/library.json, which scripts/build-evidence.mjs regenerates from
 * the app before every build. Retyping them here would put the same health
 * facts in two places, and the safety notes are the half that must never
 * drift: several are the line telling a reader with a kidney condition, a
 * pregnancy or a history of restriction to stop and ask someone.
 *
 * On naming: the library credits public educators, and several of these
 * practices credit Huberman or Attia. Those names do not appear on these
 * pages. CLAUDE.md forbids using a public figure in a way that implies
 * endorsement, and the round-three reviewers asked twice for real studies
 * rather than names — so where a page cites, it cites the paper.
 */

type Practice = (typeof library.practices)[number];

export function practice(id: string): Practice {
  const found = library.practices.find((p) => p.id === id);
  // A typo in an id would otherwise render a page with no grade and no safety
  // note — the two things that make it worth publishing. Fail the build.
  if (!found) throw new Error(`no practice "${id}" in the library — the topic page cannot be built`);
  return found;
}

const MEANING = library.gradeMeaning as Record<string, { label: string; meaning: string }>;
const WEAKER = library.counts.C + library.counts.D + library.counts.E;

export function EvidenceTopic({
  id,
  heading,
  kicker,
  verdict,
  updated,
  related,
  children,
}: {
  /** The practice in the app's library this page is about. */
  id: string;
  /** The H1, written as the thing a reader typed rather than the app's title. */
  heading: React.ReactNode;
  kicker: string;
  /** The answer, in a sentence or two, beside the grade. */
  verdict: React.ReactNode;
  updated: string;
  related: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const p = practice(id);

  return (
    <main className="legal topic">
      <div className="legal-head">
        <Link href="/" aria-label="IntentNorth home">← IntentNorth</Link>
        <p className="section-kicker">{kicker}</p>
        <h1>{heading}</h1>
      </div>

      <div className="topic-verdict">
        <span className={`rating-dot is-${p.grade.toLowerCase()}`} aria-hidden="true">{p.grade}</span>
        <div>
          <strong>IntentNorth rates this {p.grade} &mdash; {p.gradeLabel?.toLowerCase()}.</strong>
          <p className="topic-verdict-meaning">{MEANING[p.grade]?.meaning}</p>
          <p>{verdict}</p>
        </div>
      </div>

      {children}

      {p.safety ? (
        <div className="topic-safety">
          <h2>Before you try it</h2>
          <p>{p.safety}</p>
        </div>
      ) : null}

      {/*
        One product line, restrained on purpose. These pages only work if a
        stranger who arrived from a search finds them genuinely useful; a page
        that turns into a pitch two paragraphs in is the thing the Reddit
        threads in section 8 of the research are complaining about.
      */}
      <p className="topic-product">
        <Link href="/">IntentNorth</Link> is an iPhone app that puts practices like this
        one into your actual week &mdash; at real times, around what you already have on,
        with the grade on each one. It changes the week when your week changes.
      </p>

      <div className="topic-foot">
        <p>
          <strong>How this is graded.</strong> Every practice in IntentNorth carries a letter from
          A to E for the strength of the research behind it, shown on the practice itself rather
          than in a footnote. All {library.total} are published, and {WEAKER} of them are rated C
          or weaker. <Link href="/evidence">Read the whole library</Link>.
        </p>
        <p>
          Educational information, not medical advice. Nothing here is a diagnosis or a personal
          recommendation, and none of it replaces a conversation with your doctor or pharmacist.
        </p>
        <p className="legal-date">Last reviewed {updated}</p>
      </div>

      {related.length ? (
        <nav className="topic-related" aria-label="Related pages">
          <h2>Related</h2>
          <ul>
            {related.map((r) => (
              <li key={r.href}><Link href={r.href}>{r.label}</Link></li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}
