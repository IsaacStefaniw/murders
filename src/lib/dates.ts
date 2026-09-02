/** Small date/time helpers. All plan times are minutes-from-midnight internally. */

import type { Weekday } from '@/types/domain';

/**
 * Simulated clock offset — the Preview Lab's time machine. All date/time
 * reads that drive the product (todayKey, nowMinutes) flow through
 * nowDate(), so advancing the clock lets a week of the learning loop run
 * in minutes. Zero in normal use.
 */
let clockOffsetMs = 0;

export function setClockOffsetMs(ms: number): void {
  clockOffsetMs = ms;
}

export function getClockOffsetMs(): number {
  return clockOffsetMs;
}

export function nowDate(): Date {
  return new Date(Date.now() + clockOffsetMs);
}

/** "13:45" → 825. Accepts "H:MM" and "HH:MM". */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    throw new Error(`Invalid time string: ${hhmm}`);
  }
  return h * 60 + m;
}

/** 825 → "13:45". Values ≥ 24h wrap. */
export function toHHMM(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Minutes between two clock times, across midnight if it has to be.
 *
 * `toMinutes(end) - toMinutes(start)` is correct until an item crosses
 * midnight, and then it is catastrophically wrong: a wind-down at
 * 23:40–00:00 comes back as MINUS 1420 minutes. Ten places computed it
 * that way, and a negative duration does not throw — it quietly poisons
 * whatever it touches. A move recomputed the end as start plus a negative
 * number and produced an item ending before it began; `shortenItem`
 * compared the requested length against a negative original, decided it
 * was longer, and returned without shortening anything; the workout screen
 * fitted a session into negative available minutes.
 *
 * A block spanning more than half a day is far likelier to be a data error
 * than a real intention, so the wrap only applies below that threshold.
 */
export function durationMinutes(start: string, end: string): number {
  const raw = toMinutes(end) - toMinutes(start);
  if (raw >= 0) return raw;
  const wrapped = raw + 1440;
  return wrapped <= 720 ? wrapped : 0;
}

/** Local date as "YYYY-MM-DD". */
/**
 * Where a clock time falls within a waking day that may run past midnight.
 *
 * A day is not 00:00–23:59. Someone who wakes at 06:30 and sleeps at 00:30
 * has a 00:00 block that is the END of their day, but raw minutes call it
 * the earliest moment of it — which is how a block moved to midnight
 * landed under "Earlier — did it happen?" three minutes after it was
 * scheduled. Same root as the duration bug: clock arithmetic that assumes
 * the day and the date change at the same instant.
 */
export function dayMinutes(hhmm: string, wakeTime: string): number {
  const m = toMinutes(hhmm);
  const wake = toMinutes(wakeTime);
  return m >= wake ? m - wake : m + 1440 - wake;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(nowDate());
}

export function dateKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function weekdayOf(dateKey: string): Weekday {
  return dateKeyToDate(dateKey).getDay() as Weekday;
}

export function addDays(dateKey: string, days: number): string {
  const d = dateKeyToDate(dateKey);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Monday of the week containing dateKey. */
export function weekStartOf(dateKey: string): string {
  const d = dateKeyToDate(dateKey);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(dateKey, diff);
}

export function formatDateLong(dateKey: string): string {
  return dateKeyToDate(dateKey).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** "13:45" → "1:45pm" for display. */
export function formatTime(hhmm: string): string {
  const mins = toMinutes(hhmm);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

export function nowMinutes(): number {
  const n = nowDate();
  return n.getHours() * 60 + n.getMinutes();
}

let idCounter = 0;

/** Collision-resistant id without a uuid dependency. */
export function newId(prefix = 'id'): string {
  idCounter = (idCounter + 1) % 10_000;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
