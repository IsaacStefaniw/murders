/** Small date/time helpers. All plan times are minutes-from-midnight internally. */

import type { Weekday } from '@/types/domain';

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

/** Local date as "YYYY-MM-DD". */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
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
  const n = new Date();
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
