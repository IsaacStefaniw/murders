"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import "./intent-motion-assets.css";

export type WalkStep = { file: string; tab: string; title: string; body: string; alt: string };

/**
 * Click through the app and watch a week get built.
 *
 * Isaac asked for the tabs to be clickable — to be able to move through the
 * screens and see it assemble, rather than look at one still. That is a better
 * instinct than the animations this replaced: nothing moves on its own, the
 * reader chooses the pace, and every frame is a photograph of the real app
 * rather than a drawing of it.
 *
 * Keyboard and screen-reader behaviour is the standard tab pattern: arrow keys
 * move between tabs, each panel is labelled by its tab, and the inactive
 * panels are hidden rather than merely transparent.
 */
export function ScreenWalkthrough({ steps }: { steps: WalkStep[] }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Move focus to the tab the arrow keys landed on, without a setState inside
  // an effect — the focus call is the side effect, and `active` is the state
  // that drives it.
  const keyboardMove = useRef(false);
  useEffect(() => {
    if (!keyboardMove.current) return;
    keyboardMove.current = false;
    tabRefs.current[active]?.focus();
  }, [active]);

  const move = (delta: number, fromKeyboard = false) => {
    keyboardMove.current = fromKeyboard;
    setActive((current) => (current + delta + steps.length) % steps.length);
  };

  const step = steps[active];

  return (
    <div className="walk">
      <div className="walk-tabs" role="tablist" aria-label="Screens in the app">
        {steps.map((s, i) => (
          <button
            aria-controls={`walk-panel-${i}`}
            aria-selected={i === active}
            className={i === active ? "is-active" : ""}
            id={`walk-tab-${i}`}
            key={s.file}
            onClick={() => setActive(i)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") { event.preventDefault(); move(1, true); }
              if (event.key === "ArrowLeft") { event.preventDefault(); move(-1, true); }
            }}
            ref={(node) => { tabRefs.current[i] = node; }}
            role="tab"
            tabIndex={i === active ? 0 : -1}
            type="button"
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {s.tab}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`walk-tab-${active}`}
        className="walk-panel"
        id={`walk-panel-${active}`}
        role="tabpanel"
      >
        <figure className="walk-shot">
          <img alt={step.alt} height={1800} src={`/images/app/${step.file}.jpg`} width={840} />
        </figure>
        <div className="walk-copy">
          <p className="walk-step">Step {active + 1} of {steps.length}</p>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
          <div className="walk-nav">
            <button onClick={() => move(-1)} type="button">
              <ArrowLeft aria-hidden />Back
            </button>
            <button className="is-next" onClick={() => move(1)} type="button">
              Next<ArrowRight aria-hidden />
            </button>
          </div>
          <p className="walk-note">Photographs of the app, not mock-ups.</p>
        </div>
      </div>
    </div>
  );
}
