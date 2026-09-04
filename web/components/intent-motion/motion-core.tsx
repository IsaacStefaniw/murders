"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";

export type MotionStageOptions = { stages: number; interval?: number };

/**
 * The staging every proof on this page shares.
 *
 * Three rules, each of them learned the hard way. It rewinds on the way out so
 * a reader who scrolls past and comes back sees the sequence rather than a
 * still. Reduced motion resolves to the final stage by derivation rather than
 * by a setState that would race the timer. And an explicit press outranks the
 * device preference, because reduced-motion is a default and not a
 * prohibition — someone pressing "Play it again" has asked for motion.
 */
export function useMotionStages({ stages, interval = 1050 }: MotionStageOptions) {
  const ref = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [asked, setAsked] = useState(false);

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
        if (!entry.isIntersecting) {
          setStage(0);
          setAsked(false);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const still = reduced && !asked;

  useEffect(() => {
    if (still || !inView || stage >= stages - 1) return;
    const timeout = window.setTimeout(
      () => setStage((current) => Math.min(current + 1, stages - 1)),
      interval,
    );
    return () => window.clearTimeout(timeout);
  }, [inView, interval, still, stage, stages]);

  const replay = useCallback(() => {
    setAsked(true);
    setStage(0);
  }, []);

  return { ref, stage: still ? stages - 1 : stage, replay };
}

/** Lets a reader see it again — and lets a reduced-motion reader see it at all. */
export function ReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="iosm-replay" onClick={onClick} type="button">
      <RefreshCcw aria-hidden />
      <span>Play it again</span>
    </button>
  );
}

export function StageRail({ labels, stage }: { labels: string[]; stage: number }) {
  return (
    <ol className="iosm-stage-rail" aria-hidden="true">
      {labels.map((label, index) => (
        <li className={stage === index ? "is-active" : stage > index ? "is-complete" : ""} key={label}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{label}</strong>
        </li>
      ))}
    </ol>
  );
}
