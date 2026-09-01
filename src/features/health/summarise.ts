/**
 * HealthKit → Personal Performance Model, the pure part.
 *
 * Raw samples become the same MetricObservations the engine already
 * reads: sleep.hours drives workout auto-regulation, body.restingHr
 * feeds recovery context, body.weight feeds the nutrition trend. One
 * observation per metric per day — synced data never floods the stream,
 * and a manual entry for the same day is never overwritten.
 */

import { observe, type MetricObservation } from '@/features/model/metrics';

export interface SleepSegment {
  /** ISO timestamps. */
  start: string;
  end: string;
  /** True for actual sleep stages, false for in-bed/awake. */
  asleep: boolean;
}

/**
 * Hours actually asleep in the "last night" window (18h back from now).
 * Overlapping segments are merged so core+REM+deep stages don't double
 * count. Returns null when there's no sleep data in the window.
 */
export function sleepHoursLastNight(segments: SleepSegment[], now = new Date()): number | null {
  const windowStart = now.getTime() - 18 * 3600e3;
  const spans = segments
    .filter((s) => s.asleep)
    .map((s) => ({
      start: Math.max(new Date(s.start).getTime(), windowStart),
      end: Math.min(new Date(s.end).getTime(), now.getTime()),
    }))
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);
  if (spans.length === 0) return null;

  let total = 0;
  let curStart = spans[0].start;
  let curEnd = spans[0].end;
  for (const s of spans.slice(1)) {
    if (s.start <= curEnd) {
      curEnd = Math.max(curEnd, s.end);
    } else {
      total += curEnd - curStart;
      curStart = s.start;
      curEnd = s.end;
    }
  }
  total += curEnd - curStart;
  return Math.round((total / 3600e3) * 10) / 10;
}

export interface HealthSnapshot {
  sleepHours?: number | null;
  restingHr?: number | null;
  weightKg?: number | null;
  /** SDNN in milliseconds — a recovery signal, read against your own baseline. */
  hrvMs?: number | null;
  /** Apple's estimate from outdoor walks and runs. Slow-moving, approximate. */
  vo2max?: number | null;
  heightCm?: number | null;
  waistCm?: number | null;
}

/**
 * `onChangeOnly` marks a reading that does not move day to day.
 *
 * Height is measured once a decade and VO2max is re-estimated every few
 * weeks, so recording them daily would file three hundred identical
 * observations a year into a stream the trend engine reads. A flat line
 * three hundred points long is not more information than one point; it is
 * the same information, harder to chart.
 */
const SNAPSHOT_KEYS: { key: string; field: keyof HealthSnapshot; onChangeOnly?: boolean }[] = [
  { key: 'sleep.hours', field: 'sleepHours' },
  { key: 'body.restingHr', field: 'restingHr' },
  { key: 'body.weight', field: 'weightKg' },
  { key: 'body.hrv', field: 'hrvMs' },
  { key: 'body.vo2max', field: 'vo2max', onChangeOnly: true },
  { key: 'body.height', field: 'heightCm', onChangeOnly: true },
  { key: 'body.waist', field: 'waistCm', onChangeOnly: true },
];

/**
 * Body-mass index, computed rather than read.
 *
 * HealthKit exposes a BMI field, but it is whatever some app last wrote
 * there — often stale, often from a scale that guessed at a height. Two
 * numbers we hold honestly beat one we would have to trust blindly.
 *
 * Returns null rather than a number when either input is missing or
 * implausible. A BMI computed from a height of zero is not a smaller
 * problem than no BMI at all.
 */
export function bmiFrom(weightKg: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (!weightKg || !heightCm) return null;
  if (heightCm < 100 || heightCm > 250 || weightKg < 25 || weightKg > 400) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/**
 * Waist-to-height ratio.
 *
 * Kept beside BMI because it is the better of the two for anyone who
 * lifts: BMI cannot tell muscle from fat and reports a great many strong
 * people as overweight, which is both wrong and the kind of wrong that
 * makes someone stop trusting everything else the app says. The commonly
 * cited threshold is 0.5 — keep your waist under half your height.
 */
export function waistToHeight(waistCm: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (!waistCm || !heightCm) return null;
  if (heightCm < 100 || heightCm > 250 || waistCm < 40 || waistCm > 250) return null;
  return Math.round((waistCm / heightCm) * 100) / 100;
}

/**
 * Turn a snapshot into observations to append — skipping any metric that
 * already has an observation today (from any source: the user's own
 * entry always wins, and re-syncing is idempotent).
 */
export function snapshotObservations(
  snapshot: HealthSnapshot,
  existing: MetricObservation[],
  todayIso = new Date().toISOString(),
): MetricObservation[] {
  const today = todayIso.slice(0, 10);
  const out: MetricObservation[] = [];
  for (const { key, field, onChangeOnly } of SNAPSHOT_KEYS) {
    const raw = snapshot[field];
    if (raw == null || !Number.isFinite(raw) || raw <= 0) continue;
    const value = Math.round(raw * 10) / 10;
    if (existing.some((o) => o.key === key && o.at.slice(0, 10) === today)) continue;
    if (onChangeOnly) {
      const previous = existing
        .filter((o) => o.key === key)
        .sort((a, b) => a.at.localeCompare(b.at))
        .at(-1);
      if (previous && previous.value === value) continue;
    }
    out.push({ ...observe(key, value, 'healthkit'), at: todayIso });
  }
  return out;
}
