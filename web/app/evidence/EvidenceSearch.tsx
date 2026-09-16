"use client";

import { useMemo, useState } from "react";

import library from "./library.json";

/**
 * Search the whole practice library, in the browser.
 *
 * The research verdict on the evidence idea was "change it, then build it":
 * 177 pages targeting "does X work" would not have ranked, because those
 * queries are tiny in Australia and Google answers them inline. But the
 * lookup is still the product's argument made visible — the site says every
 * practice is rated and, until now, showed one.
 *
 * So this is a conversion asset rather than a traffic asset, and it is built
 * accordingly: no pagination, no gate, no email, everything on one page,
 * filtering as you type. The data is generated from the app's own file by
 * scripts/build-evidence.mjs, so it cannot drift.
 */
type Practice = (typeof library.practices)[number];

const GRADES = ["A", "B", "C", "D", "E"] as const;

/**
 * The filter for the practices that carry no grade.
 *
 * They are not an F and not an E. A fortnightly evening with your partner
 * is not a treatment that failed its trial — it is not a treatment. The
 * library says so rather than inventing a letter, and the filter has to be
 * able to say so too, or the five of them are unreachable on a page whose
 * whole promise is that you can see everything.
 */
const BALANCE = "balance";

export function EvidenceSearch() {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return library.practices.filter((p: Practice) => {
      if (grade === BALANCE && p.grade) return false;
      if (grade && grade !== BALANCE && p.grade !== grade) return false;
      if (!needle) return true;
      return [p.title, p.summary, p.why, p.balance, p.pillar, ...(p.attribution ?? [])]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(needle));
    });
  }, [query, grade]);

  return (
    <div className="ev">
      <div className="ev-controls">
        <label className="ev-search">
          <span className="iosm-sr-only">Search the practice library</span>
          <input
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search — sleep, walking, magnesium, breathing…"
            type="search"
            value={query}
          />
        </label>
        <div className="ev-grades" role="group" aria-label="Filter by evidence rating">
          <button className={grade === null ? "is-on" : ""} onClick={() => setGrade(null)} type="button">
            All {library.total}
          </button>
          {GRADES.map((g) => (
            <button
              className={`ev-g ev-g--${g.toLowerCase()}${grade === g ? " is-on" : ""}`}
              key={g}
              onClick={() => setGrade(grade === g ? null : g)}
              type="button"
            >
              {g} <em>{library.counts[g as keyof typeof library.counts]}</em>
            </button>
          ))}
          <button
            className={`ev-g ev-g--balance${grade === BALANCE ? " is-on" : ""}`}
            onClick={() => setGrade(grade === BALANCE ? null : BALANCE)}
            type="button"
          >
            Ungraded <em>{library.balance}</em>
          </button>
        </div>
      </div>

      {grade === BALANCE ? (
        <p className="ev-meaning">
          <strong>Ungraded.</strong> {library.balance} practices make no claim about research,
          so we publish no letter for them. A booked evening with your partner is not an
          unproven treatment; it is part of a life, and saying anything else about it would
          be the dishonest half of grading.
        </p>
      ) : grade ? (
        <p className="ev-meaning">
          <strong>{grade} — {library.gradeMeaning[grade as keyof typeof library.gradeMeaning].label}.</strong>{" "}
          {library.gradeMeaning[grade as keyof typeof library.gradeMeaning].meaning}
        </p>
      ) : null}

      <p className="ev-count">
        {results.length === library.total
          ? `All ${library.total} practices.`
          : `${results.length} of ${library.total}.`}
      </p>

      <ul className="ev-list">
        {results.map((p: Practice) => {
          const isOpen = open === p.id;
          return (
            <li className={isOpen ? "is-open" : ""} key={p.id}>
              <button aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.id)} type="button">
                <span className={`ev-dot ev-dot--${p.grade ? p.grade.toLowerCase() : "balance"}`}>
                  {p.grade ?? "·"}
                </span>
                <span className="ev-title">
                  <strong>{p.title}</strong>
                  {p.summary ? <small>{p.summary}</small> : null}
                </span>
                <span className="ev-grade-label">{p.grade ? p.gradeLabel : "Ungraded"}</span>
              </button>
              {isOpen ? (
                <div className="ev-body">
                  {p.balance ? <p className="ev-why">{p.balance}</p> : null}
                  {p.why ? <p className="ev-why">{p.why}</p> : null}
                  {p.safety ? (
                    <p className="ev-safety"><strong>Before you try it:</strong> {p.safety}</p>
                  ) : null}
                  <p className="ev-meta">
                    <span>
                      {p.grade
                        ? `Rated ${p.grade} — ${p.gradeLabel?.toLowerCase()}`
                        : library.balanceLabel}
                    </span>
                    {p.durationMin ? <span>{p.durationMin} minutes</span> : null}
                    {p.attribution?.length ? <span>Taught publicly by {p.attribution.join(", ")}</span> : null}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {results.length === 0 ? (
        <p className="ev-none">
          Nothing matches “{query}”. The library covers sleep, training, food,
          mind, habits, work, money, relationships and longevity — it does not
          cover everything, and we would rather show you nothing than something
          adjacent.
        </p>
      ) : null}
    </div>
  );
}
