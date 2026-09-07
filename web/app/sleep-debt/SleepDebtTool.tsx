"use client";

import { useMemo, useState } from "react";

/**
 * The app's own sleep-debt method, run in the browser.
 *
 * Every constant and every step here is copied from
 * src/features/health/sleepDebt.ts rather than approximated, because a tool
 * on the marketing site that computes a different number from the product is
 * worse than no tool. The differences that remain are stated on the page: the
 * app reads fourteen nights from Apple Health automatically and needs
 * twenty-eight to estimate your need, where this asks you to type what you
 * remember.
 *
 * Nothing is sent anywhere. There is no account, no server and no database —
 * this runs entirely in the page, which is also why it can exist at all.
 */
const NEED_MIN_H = 7;
const NEED_MAX_H = 9;
const NEED_FALLBACK_H = 7.5;
const MIN_NIGHTS_FOR_NEED = 7;
const DEBT_SHOW_H = 2;

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}

function hoursLabel(h: number): string {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (whole === 0) return `${mins}m`;
  return mins === 0 ? `${whole}h` : `${whole}h ${mins}m`;
}

/** The upper quarter of recent nights: the long ones the body took when it could. */
function sleepNeed(nights: number[]): { needH: number; from: "nights" | "default" } {
  if (nights.length < MIN_NIGHTS_FOR_NEED) return { needH: NEED_FALLBACK_H, from: "default" };
  const need = Math.min(NEED_MAX_H, Math.max(NEED_MIN_H, percentile(nights, 0.75)));
  return { needH: Math.round(need * 4) / 4, from: "nights" };
}

const DEFAULT_NIGHTS = ["7", "6.5", "7", "5.5", "6", "8", "7.5"];

export function SleepDebtTool() {
  const [nights, setNights] = useState<string[]>(DEFAULT_NIGHTS);

  const result = useMemo(() => {
    const values = nights
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value) && value > 0 && value <= 14);
    if (values.length < 3) return null;

    const { needH, from } = sleepNeed(values);
    // Oldest first; the older half of the window counts half, exactly as the
    // app does — a short night ten days ago matters less than one last night.
    const half = Math.floor(values.length / 2);
    let debt = 0;
    values.forEach((h, i) => {
      const short = Math.max(0, needH - h);
      debt += i < half ? short * 0.5 : short;
    });
    const debtH = Math.round(debt * 4) / 4;
    const averageH = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    const band = debtH < DEBT_SHOW_H ? "even" : debtH < 5 ? "behind" : "well-behind";
    return { needH, from, debtH, averageH, band, count: values.length };
  }, [nights]);

  const setNight = (index: number, value: string) => {
    setNights((current) => current.map((night, i) => (i === index ? value : night)));
  };

  return (
    <div className="sd">
      <div className="sd-inputs">
        <p className="sd-label">Hours asleep, oldest night first. Estimate — nobody remembers exactly.</p>
        <div className="sd-grid">
          {nights.map((value, index) => (
            <label className="sd-night" key={index}>
              <span>{index === nights.length - 1 ? "Last night" : `${nights.length - 1 - index}d ago`}</span>
              <input
                inputMode="decimal"
                max={14}
                min={0}
                onChange={(event) => setNight(index, event.target.value)}
                step={0.5}
                type="number"
                value={value}
              />
            </label>
          ))}
        </div>
        {nights.length < 14 ? (
          <button className="sd-more" onClick={() => setNights((c) => [...DEFAULT_NIGHTS.slice(0, 7), ...c])} type="button">
            Add another week — the app uses fourteen nights
          </button>
        ) : null}
      </div>

      {result ? (
        <div className={`sd-result is-${result.band}`}>
          <p className="sd-figure">
            <strong>{hoursLabel(result.debtH)}</strong>
            <span>behind over {result.count} nights</span>
          </p>
          <dl className="sd-detail">
            <div>
              <dt>Your estimated need</dt>
              <dd>
                {hoursLabel(result.needH)}{" "}
                {result.from === "default"
                  ? "— the adult default, because seven nights are needed before your own can be estimated"
                  : "— the upper quarter of the nights you entered, on the reasoning that the long nights are the ones your body took when it could"}
              </dd>
            </div>
            <div>
              <dt>Your average</dt>
              <dd>{hoursLabel(result.averageH)} a night</dd>
            </div>
            <div>
              <dt>What this means</dt>
              <dd>
                {result.band === "even"
                  ? "Under two hours. Not worth a sentence — this is normal variation, not a deficit."
                  : result.band === "behind"
                    ? "Enough to show up as a harder morning and a shorter fuse. One or two earlier nights closes most of it."
                    : "A large gap. This is the range where people notice it in their mood and their training before they notice it in their sleep."}
              </dd>
            </div>
          </dl>
          <p className="sd-method">
            Older nights count half. A short night ten days ago matters less than
            one last night, so the number moves with what you did recently.
          </p>
        </div>
      ) : (
        <p className="sd-empty">Enter at least three nights.</p>
      )}
    </div>
  );
}
