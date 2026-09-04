/**
 * Sleep debt and the shape of the day's energy, from what the app already
 * reads: nightly hours asleep from Apple Health (or typed in), the wake
 * time, and the energy profile from the interview.
 *
 * Everything here is an estimate against the person's own nights, said in
 * hours and minutes, never a score. Nothing here diagnoses.
 */
import type { MetricObservation } from '@/features/model/metrics';
import { toHHMM, toMinutes } from '@/lib/dates';
import type { EnergyProfile } from '@/types/domain';

export const DEBT_WINDOW_NIGHTS = 14;
export const NEED_WINDOW_NIGHTS = 28;
const NEED_MIN_H = 7;
const NEED_MAX_H = 9;
const NEED_FALLBACK_H = 7.5;
const MIN_NIGHTS_FOR_NEED = 7;
const MIN_NIGHTS_FOR_DEBT = 5;
/** Below this the debt is not worth a sentence. */
export const DEBT_SHOW_H = 2;

export interface SleepDebt {
  /** Estimated nightly need, hours. */
  needH: number;
  /** Whether the need came from the person's nights or the default. */
  needFrom: 'nights' | 'default';
  /** Hours short over the window, older nights weighted half. */
  debtH: number;
  nights: number;
  /** Average of the nights in the window, hours. */
  averageH: number;
  band: 'even' | 'behind' | 'well-behind';
}

function nightsOf(metrics: MetricObservation[], now: Date, windowNights: number): number[] {
  const cutoff = new Date(now.getTime() - windowNights * 86400e3).toISOString();
  // One reading per night: the last written for that date wins.
  const byDate = new Map<string, number>();
  for (const o of metrics) {
    if (o.key !== 'sleep.hours' || o.at < cutoff) continue;
    byDate.set(o.at.slice(0, 10), o.value);
  }
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, v]) => v);
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[idx];
}

/**
 * The person's own need: the upper quarter of their recent nights, on the
 * reasoning that the long nights are the ones the body took when it could.
 * Clamped to the adult range; the default until there are enough nights.
 */
export function sleepNeed(metrics: MetricObservation[], now = new Date()): { needH: number; from: 'nights' | 'default' } {
  const nights = nightsOf(metrics, now, NEED_WINDOW_NIGHTS);
  if (nights.length < MIN_NIGHTS_FOR_NEED) return { needH: NEED_FALLBACK_H, from: 'default' };
  const need = Math.min(NEED_MAX_H, Math.max(NEED_MIN_H, percentile(nights, 0.75)));
  return { needH: Math.round(need * 4) / 4, from: 'nights' };
}

export function sleepDebt(metrics: MetricObservation[], now = new Date()): SleepDebt | null {
  const nights = nightsOf(metrics, now, DEBT_WINDOW_NIGHTS);
  if (nights.length < MIN_NIGHTS_FOR_DEBT) return null;
  const { needH, from } = sleepNeed(metrics, now);
  // Oldest first; the older half of the window counts half.
  const half = Math.floor(nights.length / 2);
  let debt = 0;
  nights.forEach((h, i) => {
    const short = Math.max(0, needH - h);
    debt += i < half ? short * 0.5 : short;
  });
  const averageH = nights.reduce((a, b) => a + b, 0) / nights.length;
  const debtH = Math.round(debt * 4) / 4;
  return {
    needH,
    needFrom: from,
    debtH,
    nights: nights.length,
    averageH: Math.round(averageH * 10) / 10,
    band: debtH < DEBT_SHOW_H ? 'even' : debtH < 5 ? 'behind' : 'well-behind',
  };
}

export function hoursLabel(h: number): string {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (whole === 0) return `${mins}m`;
  return mins === 0 ? `${whole}h` : `${whole}h ${mins}m`;
}

/**
 * The bedtime that gives the estimated need before the alarm, and what
 * that recovers tonight against the debt. Never earlier than 20:00, so the
 * advice stays something a person would actually do.
 */
export function bedtimeToRecover(wakeTime: string, needH: number, usualBedtime: string): { bedtime: string; recoversH: number } | null {
  const wake = toMinutes(wakeTime);
  const usual = toMinutes(usualBedtime);
  const usualHours = ((wake - usual + 1440) % 1440) / 60;
  const target = Math.max(20 * 60, (wake - Math.round(needH * 60) + 1440) % 1440);
  const targetHours = ((wake - target + 1440) % 1440) / 60;
  const recovers = Math.round((targetHours - usualHours) * 4) / 4;
  if (recovers <= 0) return null;
  return { bedtime: toHHMM(target), recoversH: recovers };
}

export interface EnergyWindow {
  start: string;
  end: string;
}

export interface EnergyShape {
  peak: EnergyWindow;
  dip: EnergyWindow;
  second: EnergyWindow;
}

/**
 * Where the day's energy sits, from the wake time and the person's own
 * chronotype answer. Morning people peak two to four hours after waking,
 * dip seven to nine hours after, and get a second wind after that; the
 * evening type is the same shape shifted later. Deep work belongs in the
 * peak, the walk in the dip, and nothing hard after the second window.
 */
export function energyShape(wakeTime: string, profile: EnergyProfile): EnergyShape {
  const wake = toMinutes(wakeTime);
  const shift = profile === 'evening' ? 180 : profile === 'midday' ? 90 : 0;
  const w = (offsetMin: number) => toHHMM((wake + shift + offsetMin) % 1440);
  return {
    peak: { start: w(120), end: w(240) },
    dip: { start: w(420), end: w(540) },
    second: { start: w(600), end: w(720) },
  };
}
