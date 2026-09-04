"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { Check } from "lucide-react";
import "./intent-motion-assets.css";

export type TodayRow = {
  id: string;
  label: string;
  icon: ComponentType<{ "aria-hidden"?: boolean | "true" }>;
  action: string;
  reason: string;
  signal?: boolean;
  /** What the row said before the signal arrived. Only the signal row has one. */
  planned?: string;
};

type Signal = { label: string; detail: string };

/**
 * The hero card, playing the one thing the product does.
 *
 * It was a static list. Isaac's note was blunt and correct: this header is
 * meant to be an animation. The page's whole argument is that a result changes
 * what happens next, and the first viewport was asserting that in prose while
 * showing a finished list — the reader had to take the causality on trust in
 * the one place they have not yet decided to trust anything.
 *
 * So the signal row plays the app's actual sequence: the planned session, the
 * readiness signal arriving, the session changing, and the reason. Everything
 * it says traces to autoregulate() in features/training/programme.ts —
 * readiness 'back-off' keeps every main lift and slices the accessory list to
 * one, and the sentence on the changed row is the note that function emits.
 *
 * The six other rows never move. They are there to show breadth, and a card
 * where everything animates reads as decoration rather than as one causal
 * chain worth following.
 */
function useHeroStages(stages: number, interval: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = (event: { matches: boolean }) => setReduced(event.matches);
    sync(query);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        // Replay when it comes back. The learning-loop diagram plays once and
        // holds, which is right for something a reader scrolls to on purpose.
        // This is the hero: someone who scrolls down and back up has not seen
        // it, and being told there is an animation they never caught is worse
        // than having no animation at all.
        if (!entry.isIntersecting) setStage(0);
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !inView || stage >= stages - 1) return;
    const timeout = window.setTimeout(() => setStage((s) => Math.min(s + 1, stages - 1)), interval);
    return () => window.clearTimeout(timeout);
  }, [inView, interval, reduced, stage, stages]);

  // Derived rather than stored: someone who has asked their device not to move
  // things still needs the changed session and the reason, so this lands on the
  // conclusion instead of hiding it — without a setState that would race the
  // timer above.
  return { ref, stage: reduced ? stages - 1 : stage };
}

export function TodayCardMotion({ rows, signal }: { rows: TodayRow[]; signal: Signal }) {
  const { ref, stage } = useHeroStages(4, 1100);

  return (
    <div className="today-card" data-stage={stage} ref={ref}>
      <div className="engine-head">
        <span>TODAY · DECIDED FOR YOU</span>
        <span className="live-dot">7 SPECIALISTS · 1 PROFILE</span>
      </div>

      <ul className="today-rows">
        {rows.map((row) => {
          const isSignalRow = Boolean(row.signal && row.planned);
          const changed = !isSignalRow || stage >= 2;
          return (
            <li
              className={`today-row${row.signal ? " is-signal" : ""}${isSignalRow ? " is-causal" : ""}`}
              key={row.id}
            >
              <span className="today-domain">
                <row.icon aria-hidden />
                {row.label}
              </span>
              <span className="today-detail">
                {isSignalRow ? (
                  <span className="today-swap">
                    <strong className={changed ? "is-out" : "is-in"}>{row.planned}</strong>
                    <strong className={changed ? "is-in" : "is-out"}>{row.action}</strong>
                  </span>
                ) : (
                  <strong>{row.action}</strong>
                )}

                {isSignalRow ? (
                  <>
                    <span
                      aria-hidden
                      className={stage >= 1 ? "today-signal is-visible" : "today-signal"}
                    >
                      <i />
                      <b>{signal.label}</b>
                      {signal.detail}
                    </span>
                    <small className={stage >= 3 ? "is-visible" : ""}>{row.reason}</small>
                  </>
                ) : (
                  <small>{row.reason}</small>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="engine-proof">
        <Check aria-hidden /> Every line carries the reason it changed
      </div>
    </div>
  );
}
