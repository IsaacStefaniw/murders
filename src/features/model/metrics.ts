/**
 * Universal measurement framework — the Personal Performance Model's
 * memory (docs/PERFORMANCE_MODEL.md).
 *
 * Every pathway records what matters through the same four ideas:
 * MetricDefinition (what a number means), MetricObservation (one honest
 * reading), PersonalBest (the standing record), Trend (direction over a
 * window). Nothing is measured just because a phone can measure it —
 * each definition declares which goal it serves via its domain.
 */

import { newId } from '@/lib/dates';

export type MetricDirection = 'higher' | 'lower' | 'steady';

export interface MetricDefinition {
  key: string; // 'strength.bench.e1rm'
  label: string; // 'Bench press (est. 1RM)'
  unit: string; // 'kg', 'min', 'bpm', '%'
  domain: 'training' | 'nutrition' | 'work' | 'mind' | 'sleep' | 'finance' | 'behaviour';
  direction: MetricDirection;
  decimals?: number;
}

export interface MetricObservation {
  id: string;
  key: string;
  value: number;
  /** ISO timestamp of the observation. */
  at: string;
  source: 'user' | 'derived' | 'healthkit' | 'integration';
  note?: string;
}

export const METRICS: MetricDefinition[] = [
  { key: 'strength.bench.e1rm', label: 'Bench press', unit: 'kg', domain: 'training', direction: 'higher', decimals: 1 },
  { key: 'strength.squat.e1rm', label: 'Squat', unit: 'kg', domain: 'training', direction: 'higher', decimals: 1 },
  { key: 'strength.deadlift.e1rm', label: 'Deadlift', unit: 'kg', domain: 'training', direction: 'higher', decimals: 1 },
  { key: 'strength.ohp.e1rm', label: 'Overhead press', unit: 'kg', domain: 'training', direction: 'higher', decimals: 1 },
  { key: 'strength.pullups.reps', label: 'Pull-ups', unit: 'reps', domain: 'training', direction: 'higher' },
  { key: 'body.weight', label: 'Body weight', unit: 'kg', domain: 'nutrition', direction: 'steady', decimals: 1 },
  { key: 'body.restingHr', label: 'Resting heart rate', unit: 'bpm', domain: 'sleep', direction: 'lower' },
  /**
   * Heart-rate variability, as SDNN in milliseconds.
   *
   * Direction is 'higher' for the individual and meaningless between
   * individuals — healthy adults span roughly 20ms to 200ms, so one
   * person's excellent is another's alarming. Everything downstream reads
   * this against the person's own rolling baseline and never against a
   * population number. It is a recovery signal, not a diagnosis.
   */
  { key: 'body.hrv', label: 'Heart-rate variability', unit: 'ms', domain: 'sleep', direction: 'higher' },
  /**
   * Cardiorespiratory fitness. Apple estimates this from outdoor walks and
   * runs, so it moves slowly and is approximate — treated as a trend, never
   * as a test result.
   */
  { key: 'body.vo2max', label: 'Cardio fitness (VO₂max)', unit: 'ml/kg/min', domain: 'training', direction: 'higher' },
  /**
   * Height, so waist-to-height and BMI can be computed rather than asked
   * for. Recorded once and effectively constant; 'steady' keeps a
   * re-measurement from reading as a trend.
   */
  { key: 'body.height', label: 'Height', unit: 'cm', domain: 'nutrition', direction: 'steady' },
  /**
   * Waist circumference. Kept alongside weight because it separates the
   * two things weight alone conflates, and waist-to-height is a better
   * simple marker than BMI for anyone carrying real muscle.
   */
  { key: 'body.waist', label: 'Waist', unit: 'cm', domain: 'nutrition', direction: 'lower', decimals: 1 },
  { key: 'sleep.hours', label: 'Sleep', unit: 'h', domain: 'sleep', direction: 'higher' },
  { key: 'work.deepHours', label: 'Deep-work hours', unit: 'h/wk', domain: 'work', direction: 'higher' },
  { key: 'mind.minutes', label: 'Stillness minutes', unit: 'min/wk', domain: 'mind', direction: 'higher' },
  { key: 'finance.savingsRate', label: 'Savings rate', unit: '%', domain: 'finance', direction: 'higher' },
];

export const metricDef = (key: string): MetricDefinition | undefined =>
  METRICS.find((m) => m.key === key);

/** Epley estimated one-rep max from a working set. Reps 1 returns weight. */
export function estimate1Rm(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 2) / 2;
}

export function observe(
  key: string,
  value: number,
  source: MetricObservation['source'] = 'user',
  note?: string,
): MetricObservation {
  return { id: newId('mo'), key, value, at: new Date().toISOString(), source, note };
}

const forKey = (obs: MetricObservation[], key: string) =>
  obs.filter((o) => o.key === key).sort((a, b) => a.at.localeCompare(b.at));

export function latest(obs: MetricObservation[], key: string): MetricObservation | null {
  const own = forKey(obs, key);
  return own[own.length - 1] ?? null;
}

/** The standing personal best, honouring the metric's direction. */
export function personalBest(obs: MetricObservation[], key: string): MetricObservation | null {
  const def = metricDef(key);
  const own = forKey(obs, key);
  if (own.length === 0) return null;
  if (def?.direction === 'lower') return own.reduce((a, b) => (b.value < a.value ? b : a));
  return own.reduce((a, b) => (b.value >= a.value ? b : a));
}

export interface Trend {
  from: number;
  to: number;
  delta: number;
  /** 'up' | 'down' | 'flat' relative to a half-unit of noise. */
  direction: 'up' | 'down' | 'flat';
}

/**
 * First-vs-latest over a rolling window — deliberately simple and legible.
 *
 * `now` is injectable so callers can be tested against a fixed history
 * rather than against whatever day the suite happens to run on.
 */
export function trend(
  obs: MetricObservation[],
  key: string,
  windowDays = 28,
  now: Date = new Date(),
): Trend | null {
  const cutoff = new Date(now.getTime() - windowDays * 86400e3).toISOString();
  const own = forKey(obs, key).filter((o) => o.at >= cutoff);
  if (own.length < 2) return null;
  const from = own[0].value;
  const to = own[own.length - 1].value;
  const delta = Math.round((to - from) * 10) / 10;
  return { from, to, delta, direction: Math.abs(delta) < 0.5 ? 'flat' : delta > 0 ? 'up' : 'down' };
}

/** New PB within the window — the weekly report's records line. */
export function recentRecords(
  obs: MetricObservation[],
  windowDays = 7,
  now: Date = new Date(),
): { def: MetricDefinition; value: number }[] {
  const cutoff = new Date(now.getTime() - windowDays * 86400e3).toISOString();
  const out: { def: MetricDefinition; value: number }[] = [];
  for (const def of METRICS) {
    const best = personalBest(obs, def.key);
    if (best && best.at >= cutoff && forKey(obs, def.key).length > 1) {
      out.push({ def, value: best.value });
    }
  }
  return out;
}
