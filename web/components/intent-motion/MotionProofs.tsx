"use client";

import { useEffect, useRef, useState } from "react";
import "./intent-motion-assets.css";

type MotionStageOptions = {
  stages: number;
  interval?: number;
};

function useMotionStages({ stages, interval = 1050 }: MotionStageOptions) {
  const ref = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      const timeout = window.setTimeout(() => setStage(stages - 1), 0);
      return () => window.clearTimeout(timeout);
    }
    if (!inView || stage >= stages - 1) return;

    // The proof plays once and holds on the conclusion. This keeps the
    // causal sequence clear without creating an endlessly moving surface.
    const timeout = window.setTimeout(
      () => setStage((current) => Math.min(current + 1, stages - 1)),
      interval,
    );
    return () => window.clearTimeout(timeout);
  }, [inView, interval, stage, stages]);

  return { ref, stage };
}

function StageRail({ labels, stage }: { labels: string[]; stage: number }) {
  return (
    <ol className="iosm-stage-rail" aria-hidden="true">
      {labels.map((label, index) => (
        <li
          className={stage === index ? "is-active" : stage > index ? "is-complete" : ""}
          key={label}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{label}</strong>
        </li>
      ))}
    </ol>
  );
}

function Arrow() {
  return (
    <svg className="iosm-arrow" viewBox="0 0 40 16" aria-hidden="true">
      <path d="M1 8h34M29 2l6 6-6 6" />
    </svg>
  );
}

export function LearningLoopMotion() {
  const { ref, stage } = useMotionStages({ stages: 6, interval: 900 });

  return (
    <figure
      className="iosm-frame iosm-frame--light iosm-learning"
      data-stage={stage}
      ref={ref}
      aria-describedby="iosm-learning-description"
    >
      <header className="iosm-header">
        <p>THE LEARNING LOOP</p>
        <h2>Results change the next program.</h2>
      </header>

      <StageRail
        labels={["Profile", "Plan", "Act", "Measure", "Learn", "Improve"]}
        stage={stage}
      />

      <div className="iosm-learning-story" aria-hidden="true">
        <article className={stage >= 1 ? "iosm-proof-card is-visible" : "iosm-proof-card"}>
          <span>PROGRAM 01</span>
          <strong>Bench 4 × 5</strong>
          <p>100kg target</p>
        </article>
        <Arrow />
        <article className={stage >= 3 ? "iosm-proof-card iosm-proof-card--measure is-visible" : "iosm-proof-card iosm-proof-card--measure"}>
          <span>WHAT HAPPENED</span>
          <strong>5, 5, 5, 5</strong>
          <p>every set at the top</p>
        </article>
        <Arrow />
        <article className={stage >= 5 ? "iosm-proof-card iosm-proof-card--result is-visible" : "iosm-proof-card iosm-proof-card--result"}>
          <span>PROGRAM 02</span>
          <strong>102.5kg</strong>
          <p><b>+2.5kg</b> next load</p>
        </article>
      </div>

      <div className={stage >= 5 ? "iosm-reason is-visible" : "iosm-reason"} aria-hidden="true">
        <span>WHY</span>
        <p>5 on every set at 100 kg. Up 2.5.</p>
        <small>The same loop runs on every practice you add, not only the lifts — a protocol becomes a routine, and the routine answers to your results.</small>
      </div>

      <figcaption id="iosm-learning-description" className="iosm-sr-only">
        A six-stage system diagram shows a 100 kilogram bench program, four sets completed at the top of the rep range, then a next program load of 102.5 kilograms with the reason the app gives. The same loop runs on any practice added from the library.
      </figcaption>
    </figure>
  );
}

export function SharedProfileMotion() {
  const { ref, stage } = useMotionStages({ stages: 4, interval: 1150 });

  return (
    <figure
      className="iosm-frame iosm-frame--paper iosm-profile"
      data-stage={stage}
      ref={ref}
      aria-describedby="iosm-profile-description"
    >
      <header className="iosm-header">
        <p>ONE CONTINUOUS PROFILE</p>
        <h2>Answer once. Continue with context.</h2>
      </header>

      <div className="iosm-profile-story" aria-hidden="true">
        <article className="iosm-surface">
          <div className="iosm-surface-head"><span>OPERATING PROFILE</span><b>01</b></div>
          <label>Typical sleep</label>
          <div className={stage >= 1 ? "iosm-answer is-filled" : "iosm-answer"}>
            <strong>{stage >= 1 ? "6.5" : ""}</strong><span>hours</span><i />
          </div>
          <small>Known context available where relevant</small>
        </article>

        <div className={stage >= 2 ? "iosm-profile-transfer is-active" : "iosm-profile-transfer"}>
          <span>6.5h</span>
          <div><i /></div>
          <b>PROFILE</b>
        </div>

        <article className={stage >= 3 ? "iosm-surface iosm-surface--app is-known" : "iosm-surface iosm-surface--app"}>
          <div className="iosm-surface-head"><span>NEW PATHWAY</span><b>02</b></div>
          <label>Typical sleep</label>
          <div className="iosm-known-answer">
            <strong>{stage >= 3 ? "6.5 hours" : "Checking known context…"}</strong>
            <span>{stage >= 3 ? "KNOWN" : ""}</span>
          </div>
          <div className="iosm-next-question">
            <small>NEXT USEFUL QUESTION</small>
            <p>How many days can you train?</p>
          </div>
        </article>
      </div>

      <div className={stage >= 3 ? "iosm-continuity is-visible" : "iosm-continuity"} aria-hidden="true">
        <span>✓</span><p>The next pathway continues from known context. No repeated interview.</p>
      </div>

      <figcaption id="iosm-profile-description" className="iosm-sr-only">
        A system diagram shows a sleep answer held in one operating profile and already known when a new specialist pathway continues with the next useful question.
      </figcaption>
    </figure>
  );
}

function WeekCard({
  label,
  stage,
  activeAt,
  final,
}: {
  label: string;
  stage: number;
  activeAt: number;
  final?: boolean;
}) {
  const visible = stage >= activeAt;
  return (
    <article className={`${final ? "iosm-week iosm-week--final" : "iosm-week"} ${visible ? "is-visible" : ""}`}>
      <div className="iosm-week-head"><span>{label}</span><b>{final ? "ADAPTED" : "OBSERVED"}</b></div>
      <div className="iosm-days">
        <div><span>M</span><i className="is-session" /></div>
        <div className={final ? "is-protected" : "is-missed"}><span>T</span><i /></div>
        <div><span>W</span><i /></div>
        <div><span>T</span><i className="is-session" /></div>
        <div><span>F</span><i /></div>
        <div><span>S</span><i className="is-session" /></div>
        <div><span>S</span><i /></div>
      </div>
      <p>{final ? "Tuesday stays clear in the next block." : "Tuesday session missed."}</p>
    </article>
  );
}

export function MissedTuesdayMotion() {
  const { ref, stage } = useMotionStages({ stages: 4, interval: 1300 });

  return (
    <figure
      className="iosm-frame iosm-frame--dark iosm-pattern"
      data-stage={stage}
      ref={ref}
      aria-describedby="iosm-pattern-description"
    >
      <header className="iosm-header">
        <p>PATTERN LEARNING</p>
        <h2>The program stops fighting real life.</h2>
      </header>

      <div className="iosm-week-story" aria-hidden="true">
        <WeekCard label="WEEK 01" stage={stage} activeAt={0} />
        <Arrow />
        <WeekCard label="WEEK 02" stage={stage} activeAt={1} />
        <Arrow />
        <WeekCard label="NEXT BLOCK" stage={stage} activeAt={3} final />
      </div>

      <div className={stage >= 2 ? "iosm-pattern-found is-visible" : "iosm-pattern-found"} aria-hidden="true">
        <span>PATTERN FOUND</span>
        <p>Two consecutive Tuesday misses</p>
      </div>

      <div className={stage >= 3 ? "iosm-reason iosm-reason--dark is-visible" : "iosm-reason iosm-reason--dark"} aria-hidden="true">
        <span>WHY</span>
        <p>Your next block keeps Tuesday clear because the same session was missed twice.</p>
      </div>

      <figcaption id="iosm-pattern-description" className="iosm-sr-only">
        A behavioural system diagram shows Tuesday sessions missed in two consecutive weeks. The next program block keeps Tuesday clear and states the reason.
      </figcaption>
    </figure>
  );
}

