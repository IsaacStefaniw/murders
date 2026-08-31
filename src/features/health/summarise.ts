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
}

const SNAPSHOT_KEYS: { key: string; field: keyof HealthSnapshot }[] = [
  { key: 'sleep.hours', field: 'sleepHours' },
  { key: 'body.restingHr', field: 'restingHr' },
  { key: 'body.weight', field: 'weightKg' },
];

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
  for (const { key, field } of SNAPSHOT_KEYS) {
    const value = snapshot[field];
    if (value == null || !Number.isFinite(value) || value <= 0) continue;
    if (existing.some((o) => o.key === key && o.at.slice(0, 10) === today)) continue;
    out.push({ ...observe(key, Math.round(value * 10) / 10, 'healthkit'), at: todayIso });
  }
  return out;
}
