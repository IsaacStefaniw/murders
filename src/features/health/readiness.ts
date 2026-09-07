/**
 * Readiness — what last night says about today's session.
 *
 * The single rule this file exists to enforce: HRV and resting heart rate
 * mean nothing between people and everything within one person. Healthy
 * adults sit anywhere from about 20ms to 200ms of SDNN, so one person's
 * excellent is another's alarming, and any app that colours a number red
 * against a population band is telling half its users something false. Every
 * comparison here is against the person's own recent baseline.
 *
 * The baseline is a MEDIAN, not a mean. One terrible night should shift
 * what counts as normal barely at all, and a mean lets it shift a lot —
 * which is how a run of bad days quietly redefines bad as normal and the
 * signal stops firing exactly when it is needed.
 *
 * This is a training input, not a health assessment. A low reading changes
 * how many accessory sets are prescribed. It never says anything about
 * whether someone is unwell, and it must not start to.
 */

import { latest, type MetricObservation } from '@/features/model/metrics';
import { dateKeyOfIso, toDateKey } from '@/lib/dates';

export type ReadinessBand = 'ready' | 'caution' | 'back-off';

export interface Readiness {
  band: ReadinessBand;
  /** Plain sentences, each naming the number and the comparison it used. */
  signals: string[];
  /** The one-line summary for Today. */
  headline: string;
}

/** Days of history the baseline is drawn from. */
const BASELINE_DAYS = 14;
/** Below this many readings there is no baseline worth comparing against. */
const MIN_READINGS = 5;
/** HRV this far below your own median is worth noticing. */
const HRV_CAUTION = 0.85;
/** And this far below is worth changing the session for. */
const HRV_BACK_OFF = 0.7;
/** Resting heart rate this many beats above your own median. */
const RHR_CAUTION_BPM = 5;
const RHR_BACK_OFF_BPM = 10;
/** A night this short changes the session on its own. */
const SHORT_NIGHT_HOURS = 6;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * The person's own normal for a metric, from the days BEFORE today.
 *
 * Excluding today matters: including it would drag the baseline toward the
 * reading being judged, which is how a genuinely unusual morning ends up
 * comparing itself against itself and looking ordinary.
 */
export function baselineFor(
  metrics: MetricObservation[],
  key: string,
  now = new Date(),
): number | null {
  // Local days on both sides. Read in UTC, a reading taken at seven in
  // Sydney belonged to yesterday until eleven — so it was counted into the
  // baseline it was meant to be judged against, and then judged stale.
  const today = toDateKey(now);
  const cutoff = new Date(now.getTime() - BASELINE_DAYS * 86400e3).toISOString();
  const values = metrics
    .filter((o) => o.key === key && o.at >= cutoff && dateKeyOfIso(o.at) !== today)
    .map((o) => o.value);
  return values.length >= MIN_READINGS ? median(values) : null;
}

/** Today's reading, or null when nothing landed today. */
function todayValue(metrics: MetricObservation[], key: string, now: Date): number | null {
  const obs = latest(metrics, key);
  if (!obs) return null;
  return dateKeyOfIso(obs.at) === toDateKey(now) ? obs.value : null;
}

/**
 * Read the morning. Returns null when there is nothing to say — which is
 * the common case for weeks, and is better than manufacturing a green
 * light out of no data.
 */
export function readinessFrom(metrics: MetricObservation[], now = new Date()): Readiness | null {
  const signals: string[] = [];
  let backOff = false;

  const hrv = todayValue(metrics, 'body.hrv', now);
  const hrvBase = baselineFor(metrics, 'body.hrv', now);
  if (hrv != null && hrvBase != null && hrvBase > 0) {
    const ratio = hrv / hrvBase;
    if (ratio <= HRV_BACK_OFF) {
      backOff = true;
      signals.push(
        `Your heart-rate variability (HRV) is ${Math.round((1 - ratio) * 100)}% below your own two-week normal (${Math.round(hrv)} against ${Math.round(hrvBase)} ms). That usually means the nervous system is still catching up.`,
      );
    } else if (ratio <= HRV_CAUTION) {
      signals.push(
        `Your heart-rate variability (HRV) is a little under your own normal — ${Math.round(hrv)} ms against ${Math.round(hrvBase)}.`,
      );
    }
  }

  const rhr = todayValue(metrics, 'body.restingHr', now);
  const rhrBase = baselineFor(metrics, 'body.restingHr', now);
  if (rhr != null && rhrBase != null) {
    const over = rhr - rhrBase;
    if (over >= RHR_BACK_OFF_BPM) {
      backOff = true;
      signals.push(
        `Resting heart rate is ${Math.round(over)} bpm above your own normal (${Math.round(rhr)} against ${Math.round(rhrBase)}).`,
      );
    } else if (over >= RHR_CAUTION_BPM) {
      signals.push(`Resting heart rate is up ${Math.round(over)} bpm on your usual.`);
    }
  }

  const sleep = todayValue(metrics, 'sleep.hours', now);
  if (sleep != null && sleep < SHORT_NIGHT_HOURS) {
    signals.push(`${sleep} hours of sleep — under the six that changes what a session should be.`);
  }

  if (signals.length === 0) return null;

  const band: ReadinessBand = backOff || signals.length >= 2 ? 'back-off' : 'caution';
  return {
    band,
    signals,
    headline:
      band === 'back-off'
        ? 'Keep the main work, drop the extras today.'
        : 'Worth going in a little conservative today.',
  };
}

/**
 * Days inside the baseline window that carry a reading for a key. Days,
 * not readings: a watch that files six numbers on Monday has still only
 * told us about Monday.
 */
function daysWithReadings(metrics: MetricObservation[], key: string, now: Date): number {
  const cutoff = new Date(now.getTime() - BASELINE_DAYS * 86400e3).toISOString();
  const days = new Set<string>();
  for (const o of metrics) {
    if (o.key === key && o.at >= cutoff) days.add(dateKeyOfIso(o.at));
  }
  return days.size;
}

/**
 * After this many days of other readings arriving, a signal that has never
 * appeared once is not late — it is a signal this phone does not get.
 *
 * Ten of the fourteen the baseline is drawn from. A watch or ring that
 * records a signal at all records it most nights, so ten nights of sleep
 * and heart rate with not one variability reading among them is not a gap
 * in wearing it.
 */
const ABSENT_AFTER_DAYS = 10;

export interface ReadinessCoverage {
  /** True once at least one baseline is worth comparing against. */
  ready: boolean;
  /** Signals still short of a baseline and worth waiting for, in plain words. */
  missing: string[];
  /** Signals the read is actually working from, in plain words. */
  workingFrom: string[];
  /**
   * A sentence for the screen when a signal is not coming at all, so it is
   * never listed as one more day of waiting. Null when there is no such
   * thing to say.
   */
  note: string | null;
}

/**
 * Whether there is enough history for the readiness read to mean anything,
 * what is still missing, and what it is working from instead.
 *
 * The distinction the list has to keep: a person who has not worn their
 * watch yet is waiting for a reading, and a reading will come. A person
 * whose watch or ring measures variability a different way, and so never
 * writes it to Health at all, is waiting for something that cannot
 * arrive — and telling them it is on its way is a small lie repeated every
 * morning. We cannot see which device someone owns, only that a type has
 * never once appeared beside the ones that have; after ten days that is
 * answer enough, and the honest thing is to name what the read IS using.
 */
export function readinessCoverage(
  metrics: MetricObservation[],
  now = new Date(),
): ReadinessCoverage {
  const missing: string[] = [];
  const workingFrom: string[] = [];

  const hrvBase = baselineFor(metrics, 'body.hrv', now);
  const rhrBase = baselineFor(metrics, 'body.restingHr', now);
  const sleepDays = daysWithReadings(metrics, 'sleep.hours', now);
  const otherDays = Math.min(daysWithReadings(metrics, 'body.restingHr', now), sleepDays);
  const neverAnyHrv = !metrics.some((o) => o.key === 'body.hrv');
  const hrvNotComing = neverAnyHrv && otherDays >= ABSENT_AFTER_DAYS;

  if (hrvBase != null) workingFrom.push('heart-rate variability');
  else if (!hrvNotComing) missing.push('heart-rate variability');

  if (rhrBase != null) workingFrom.push('resting heart rate');
  else missing.push('resting heart rate');

  if (sleepDays > 0) workingFrom.push('sleep');

  return {
    ready: hrvBase != null || rhrBase != null,
    missing,
    workingFrom,
    note: hrvNotComing
      ? `Working from ${listed(workingFrom)}. Heart-rate variability has never come through from Health — some watches and rings measure it a different way and never write it — so it is not one to wait for.`
      : null,
  };
}

/** "a, b and c" — a list a person would read aloud. */
function listed(items: string[]): string {
  if (items.length <= 1) return items[0] ?? 'nothing yet';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
