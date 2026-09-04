"use client";

import { ReplayButton, StageRail, useMotionStages } from "./motion-core";
import "./intent-motion-assets.css";

/* -------------------------------------------------------------------------
 * One sequence per claim. Everything on screen traces to a file in the app:
 *
 *   grades and counts        src/features/knowledge/protocols.ts
 *   the 06:50 placement      toRoutine, verified in protocols.test.ts:118
 *   the four phased weeks    src/features/training/programme.ts
 *   the accessory rule       autoregulate(), same file
 *   level blurbs and gates   src/features/paths/level.ts
 *
 * These are diagrams of product behaviour, drawn from the code that produces
 * it. They are not app screens and do not imitate one.
 * ---------------------------------------------------------------------- */

/** The visible slice of the library. Grades and titles are the real ones. */
const WALL = [
  { g: "A", t: "Strength training" }, { g: "B", t: "Morning light" },
  { g: "C", t: "Cold-shower finish" }, { g: "B", t: "Wind-down breathing" },
  { g: "A", t: "If-then the week’s food" }, { g: "D", t: "Ten-minute mobility" },
  { g: "C", t: "Kitchen closes" }, { g: "E", t: "Fear-setting" },
  { g: "B", t: "Zone 2 cardio" }, { g: "D", t: "Cook once, eat twice" },
  { g: "C", t: "Sauna sessions" }, { g: "E", t: "80/20 audit" },
];

const GRADES = [
  { g: "A", n: 13 }, { g: "B", n: 60 }, { g: "C", n: 63 }, { g: "D", n: 33 }, { g: "E", n: 8 },
];

export function ProtocolGradingMotion() {
  const { ref, stage, replay } = useMotionStages({ stages: 5, interval: 1150 });
  const chosen = 1; // Morning light — grade B, open on the free tier, wake-anchored.

  return (
    <figure
      aria-describedby="iosm-library-description"
      className="iosm-frame iosm-frame--light iosm-library"
      data-stage={stage}
      ref={ref}
    >
      <header className="iosm-header">
        <p>PROVEN PRACTICES, RATED</p>
        <h2>We publish the grade, including the bad ones.</h2>
        <ReplayButton onClick={replay} />
      </header>

      <StageRail labels={["Library", "Graded", "Chosen", "Placed", "Reasoned"]} stage={stage} />

      <div className="iosm-library-body" aria-hidden="true">
        <div className={stage >= 2 ? "iosm-wall is-picked" : "iosm-wall"}>
          {WALL.map((p, i) => (
            <span
              className={`iosm-chip iosm-chip--${p.g.toLowerCase()}${i === chosen && stage >= 2 ? " is-chosen" : ""}`}
              key={p.t}
            >
              <b className={stage >= 1 ? "is-visible" : ""}>{p.g}</b>
              {p.t}
            </span>
          ))}
          <span className="iosm-chip iosm-chip--more">+165 more</span>
        </div>

        <div className={stage >= 1 ? "iosm-grades is-visible" : "iosm-grades"}>
          {GRADES.map((row) => (
            <div key={row.g}>
              <span>{row.g}</span>
              <i style={{ width: `${(row.n / 63) * 100}%` }} />
              <b>{row.n}</b>
            </div>
          ))}
          <p>104 of 177 are C or weaker. That is on the page because it is true.</p>
        </div>
      </div>

      <div className={stage >= 2 ? "iosm-carry is-visible" : "iosm-carry"} aria-hidden="true">
        <article className="iosm-carry-card">
          <span className="iosm-chip iosm-chip--b"><b className="is-visible">B</b>Morning light</span>
          <strong>Ten minutes of outdoor light within an hour of waking.</strong>
          <small>
            Never look at the sun directly; through-window light counts for less but still counts.
          </small>
        </article>
        <div className={stage >= 3 ? "iosm-placed is-visible" : "iosm-placed"}>
          <span>PLACED IN YOUR WEEK</span>
          <strong>06:50, every day</strong>
          <p>Wake 06:30, plus twenty.</p>
        </div>
      </div>

      <div className={stage >= 4 ? "iosm-reason is-visible" : "iosm-reason"} aria-hidden="true">
        <span>WHY</span>
        <p>It is anchored to your wake time, not to a clock.</p>
        <small>
          The grade and the safety line stay attached to the practice for as long as you keep it.
          Nothing in this library arrives without both.
        </small>
      </div>

      <figcaption className="iosm-sr-only" id="iosm-library-description">
        A diagram of the practice library: 177 protocols graded A to E — 13 A, 60 B, 63 C, 33 D and
        8 E — with one, Morning light at grade B, chosen and placed at 06:50, twenty minutes after a
        06:30 wake time, carrying its evidence grade and its safety line.
      </figcaption>
    </figure>
  );
}

/* --------------------------------------------------------------------- */

const WEEKS = [
  { label: "WEEK 01", phase: "BUILD", fill: [1, 0, 1, 0, 1, 0, 0], note: "Three sessions and one practice." },
  { label: "WEEK 04", phase: "PROGRESS", fill: [1, 1, 1, 0, 1, 1, 0], note: "The block phases; practices accumulate." },
  { label: "A HARD WEEK", phase: "BACK OFF", fill: [1, 0, 1, 0, 1, 0, 0], note: "Main work stays. The accessory list drops to one." },
  { label: "WEEK 09", phase: "BUILD", fill: [1, 1, 1, 1, 1, 1, 0], note: "It continues from where you are, not from zero." },
];

export function PlanGrowsMotion() {
  const { ref, stage, replay } = useMotionStages({ stages: 4, interval: 1500 });

  return (
    <figure
      aria-describedby="iosm-grows-description"
      className="iosm-frame iosm-frame--dark iosm-grows"
      data-stage={stage}
      ref={ref}
    >
      <header className="iosm-header">
        <p>A PROGRAM THAT LIVES WITH YOU</p>
        <h2>It grows as you do.<br />It shrinks when your week does.</h2>
        <ReplayButton onClick={replay} />
      </header>

      <div className="iosm-grow-track" aria-hidden="true">
        {WEEKS.map((week, index) => (
          <article
            className={`iosm-grow-week${stage >= index ? " is-visible" : ""}${week.phase === "BACK OFF" ? " is-backoff" : ""}`}
            key={week.label}
          >
            <div className="iosm-grow-head">
              <span>{week.label}</span>
              <b>{week.phase}</b>
            </div>
            <div className="iosm-grow-days">
              {week.fill.map((on, day) => (
                <i className={on ? "is-on" : ""} key={`${week.label}-${day}`} />
              ))}
            </div>
            <p>{week.note}</p>
          </article>
        ))}
      </div>

      <div className={stage >= 3 ? "iosm-reason iosm-reason--dark is-visible" : "iosm-reason iosm-reason--dark"} aria-hidden="true">
        <span>WHY</span>
        <p>Four phased weeks — build, build, progress, deload — for every goal you choose.</p>
        <small>
          You never build a program again. When recovery drops, every main lift stays and the
          accessories come out; the session someone actually skips is the one that got cancelled
          for them.
        </small>
      </div>

      <figcaption className="iosm-sr-only" id="iosm-grows-description">
        A diagram of a training block over nine weeks. It fills as sessions are logged, shrinks in a
        hard week — keeping the main work and cutting accessories to one — and then continues from
        where it was rather than restarting.
      </figcaption>
    </figure>
  );
}

/* --------------------------------------------------------------------- */

const COACHES = [
  { id: "training", name: "Training" },
  { id: "nutrition", name: "Nutrition" },
  { id: "recovery", name: "Habits & urges" },
  { id: "work", name: "Work & leadership" },
  { id: "money", name: "Money" },
  { id: "relationship", name: "Relationship" },
  { id: "family", name: "Family & adventure" },
];

/** Both cards quote LEVEL_BLURB and LEVEL_THRESHOLDS verbatim. */
const OPENED = [
  {
    name: "Training",
    level: "DEVELOPING",
    blurb: "Barbell work comes in, sets go up, loads stop being cautious. Enough volume to drive progress, not enough to bury a week.",
    gate: "36 sessions across 16 weeks earns the next rung.",
    known: null,
  },
  {
    name: "Nutrition",
    level: "FOUNDATION",
    blurb: "One change at a time — protein at breakfast before anything else moves.",
    gate: "10 sessions across 4 weeks earns the next rung.",
    known: "Sleep 6.5h — already known",
  },
];

export function SevenCoachesMotion() {
  const { ref, stage, replay } = useMotionStages({ stages: 4, interval: 1600 });
  // Both cards are always in the DOM, crossfading in one grid cell. Rendering
  // only the open one kept the copy out of the served HTML entirely, so a
  // reader without JavaScript — and any crawler — got an empty box. It also
  // holds the card's height steady between the two.
  const openIndex = stage === 1 ? 0 : stage >= 2 ? 1 : -1;

  return (
    <figure
      aria-describedby="iosm-seven-description"
      className="iosm-frame iosm-frame--paper iosm-seven"
      data-stage={stage}
      ref={ref}
    >
      <header className="iosm-header">
        <p>SEVEN COACHES, ONE PROFILE</p>
        <h2>Each one has four levels. You earn them from your own log.</h2>
        <ReplayButton onClick={replay} />
      </header>

      <div className="iosm-seven-ring" aria-hidden="true">
        {COACHES.map((coach) => {
          const active =
            (stage === 1 && coach.id === "training") || (stage >= 2 && coach.id === "nutrition");
          return (
            <span
              className={`iosm-coach${active ? " is-open" : ""}${stage >= 3 ? " is-all" : ""}`}
              key={coach.id}
            >
              {coach.name}
            </span>
          );
        })}
      </div>

      <div className="iosm-coach-stack" aria-hidden="true">
        {OPENED.map((coach, index) => (
          <article
            className={`iosm-coach-card${index === openIndex ? " is-visible" : ""}`}
            key={coach.name}
          >
            <div className="iosm-coach-head">
              <span>{coach.name}</span>
              <b>{coach.level}</b>
            </div>
            <strong>{coach.blurb}</strong>
            <div className="iosm-coach-foot">
              <p>{coach.gate}</p>
              {coach.known ? <em>{coach.known}</em> : null}
            </div>
          </article>
        ))}
      </div>

      <div className={stage >= 3 ? "iosm-reason is-visible" : "iosm-reason"} aria-hidden="true">
        <span>WHY</span>
        <p>The second coach never re-asks what the first one already knows.</p>
        <small>
          Seven pathways, four levels each, and a top rung that cannot be selected — only reached.
          One profile underneath all of them.
        </small>
      </div>

      <figcaption className="iosm-sr-only" id="iosm-seven-description">
        A diagram of seven specialist pathways sharing one profile. Training opens at the developing
        level, needing 36 sessions across 16 weeks for the next rung; nutrition then opens at
        foundation and already knows the sleep answer given to the first.
      </figcaption>
    </figure>
  );
}
