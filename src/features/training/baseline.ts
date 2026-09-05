import type { MetricObservation } from "@/features/model/metrics";

/**
 * What a lift is worth right now, from everything logged — not from the
 * last thing logged.
 *
 * Every saved session writes one estimated max per main lift, and until
 * this existed every reader took the newest one. So a session cut short
 * after the warm-ups, or an off day at 85%, became the number the next
 * block was loaded from, and a person who had benched 100 the week before
 * was handed 80 because Tuesday was bad.
 *
 * The rule now: the baseline is the best estimate of the last twelve
 * weeks, discounted a little for every week since it was set, so an off
 * day never lowers it and a number nobody has matched for two months
 * drifts down slowly rather than dropping in one step. A deliberate
 * retest — a max entered on the hub rather than derived from a session —
 * is different: the person tested on purpose, so it resets the window and
 * a lower retest is believed.
 */
export interface BaselineRead {
  /** The kg the programme should load from. */
  value: number;
  /** The best estimate the value was derived from, before any discount. */
  peak: number;
  /** When that best estimate was logged. */
  peakAt: string;
  /** How many estimates were in the window. One means a single data point. */
  observations: number;
  /** True when the window starts at a deliberate retest. */
  fromRetest: boolean;
}

const WINDOW_DAYS = 84;
const DISCOUNT_PER_WEEK = 0.0125;
const DISCOUNT_FLOOR = 0.85;

/** Session-derived estimates carry a `workout:<id>` note; anything else was entered on purpose. */
export function isRetest(o: MetricObservation): boolean {
  return !(o.note ?? "").startsWith("workout:");
}

export function strengthBaseline(
  metrics: MetricObservation[],
  key: string,
  now: Date = new Date(),
): BaselineRead | null {
  const own = metrics
    .filter((o) => o.key === key)
    .sort((a, b) => a.at.localeCompare(b.at));
  if (own.length === 0) return null;

  let lastRetest = -1;
  for (let i = own.length - 1; i >= 0; i -= 1) {
    if (isRetest(own[i])) {
      lastRetest = i;
      break;
    }
  }
  const considered = lastRetest >= 0 ? own.slice(lastRetest) : own;

  const ageDays = (o: MetricObservation) =>
    Math.max(0, (now.getTime() - new Date(o.at).getTime()) / 86400e3);
  const recent = considered.filter((o) => ageDays(o) <= WINDOW_DAYS);
  // Nothing in the window: the last thing known, discounted to the floor,
  // is still a better start than pretending there is no history.
  const pool = recent.length > 0 ? recent : [considered[considered.length - 1]];

  let best: { value: number; from: MetricObservation } | null = null;
  for (const o of pool) {
    const weeks = ageDays(o) / 7;
    const value =
      o.value * Math.max(DISCOUNT_FLOOR, 1 - DISCOUNT_PER_WEEK * weeks);
    if (!best || value > best.value) best = { value, from: o };
  }
  if (!best) return null;
  return {
    value: Math.round(best.value * 10) / 10,
    peak: best.from.value,
    peakAt: best.from.at,
    observations: pool.length,
    fromRetest: lastRetest >= 0 && pool.includes(own[lastRetest]),
  };
}
