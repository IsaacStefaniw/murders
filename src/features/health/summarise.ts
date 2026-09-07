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
import { dateKeyOfIso, toDateKey } from '@/lib/dates';

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
  // "Today" is the local day. Compared as UTC dates, a seven o'clock hand
  // entry in Sydney and an eleven o'clock sync fell on different days, and
  // the sync wrote a second reading over the person's own.
  const today = dateKeyOfIso(todayIso);
  const out: MetricObservation[] = [];
  for (const { key, field, onChangeOnly } of SNAPSHOT_KEYS) {
    const raw = snapshot[field];
    if (raw == null || !Number.isFinite(raw) || raw <= 0) continue;
    const value = Math.round(raw * 10) / 10;
    if (existing.some((o) => o.key === key && dateKeyOfIso(o.at) === today)) continue;
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

/** One reading as Health holds it: an instant, and a number. */
export interface DatedValue {
  /** ISO timestamp of the sample. */
  at: string;
  value: number;
}

/**
 * What a read-back of Apple Health returns: every sample in the window
 * rather than the latest one.
 */
export interface HealthHistory {
  sleep?: SleepSegment[];
  restingHr?: DatedValue[];
  weightKg?: DatedValue[];
  hrvMs?: DatedValue[];
}

/**
 * The signals a read-back is for.
 *
 * Only the four a BASELINE is built from. VO2max, height and waist are
 * slow-moving numbers where one current reading says everything sixty of
 * them would, and the snapshot path already keeps those current.
 */
const HISTORY_KEYS: { key: string; field: 'restingHr' | 'weightKg' | 'hrvMs' }[] = [
  { key: 'body.restingHr', field: 'restingHr' },
  { key: 'body.weight', field: 'weightKg' },
  { key: 'body.hrv', field: 'hrvMs' },
];

/** The local day an instant fell on, or null when it is not an instant at all. */
function dayOf(iso: string): string | null {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? dateKeyOfIso(iso) : null;
}

/**
 * A night belongs to the morning it ends on, and the day for sleep turns
 * over at six in the evening rather than at midnight.
 *
 * Health files a night as several stage records — core, deep, REM — and a
 * night that crosses midnight has some of them ending on one date and the
 * rest on the next. Cut at midnight, one night became two, and the earlier
 * half was filed as a two-hour night on the day before. Six in the evening
 * is late enough that no ordinary night starts after it and early enough
 * that an afternoon nap is still that afternoon's.
 */
const NIGHT_TURNS_OVER_H = 6;

function nightOf(endIso: string): string | null {
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(end)) return null;
  return toDateKey(new Date(end + NIGHT_TURNS_OVER_H * 3600e3));
}

/**
 * Noon, local, on a day already written as a local date key.
 *
 * The same stamp a saved session gets, and for the same reason: a reading
 * belongs to the day the person lived, and any hour near the middle of it
 * still reads as that day. Midnight would not — an hour either side of it
 * lands on the neighbouring date.
 */
function localNoonOf(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

/**
 * Turn a read-back of Health history into observations to append: one per
 * key per LOCAL day, stamped at that day's own noon.
 *
 * These are `snapshotObservations`' rules applied to sixty days instead of
 * one. A day that already carries a reading for that key — the person's
 * own, or one an earlier read-back wrote — is left exactly as it is, which
 * is what makes running this twice write nothing the second time. Nothing
 * is invented: a day Health has no sample for gets no observation, and a
 * gap in the history stays a gap.
 *
 * Today is left to the snapshot path. It is the one day whose reading is
 * still arriving, the snapshot reads it more carefully, and the baseline
 * excludes today in any case — so writing it here would only give the two
 * paths something to disagree about.
 */
export function historyObservations(
  history: HealthHistory,
  existing: MetricObservation[],
  nowIso = new Date().toISOString(),
): MetricObservation[] {
  const today = dateKeyOfIso(nowIso);
  const taken = new Set(existing.map((o) => `${o.key}|${dateKeyOfIso(o.at)}`));
  const out: MetricObservation[] = [];

  const add = (key: string, day: string, raw: number) => {
    if (!Number.isFinite(raw) || raw <= 0) return;
    if (day >= today) return;
    const stamp = `${key}|${day}`;
    if (taken.has(stamp)) return;
    taken.add(stamp);
    out.push({ ...observe(key, Math.round(raw * 10) / 10, 'healthkit'), at: localNoonOf(day) });
  };

  for (const { key, field } of HISTORY_KEYS) {
    // The last sample of each local day, which is the one the snapshot path
    // records for today. Averaging the day instead would file a number
    // under "your readings" that no reading of theirs ever was.
    const byDay = new Map<string, DatedValue>();
    for (const sample of history[field] ?? []) {
      const day = Number.isFinite(sample.value) ? dayOf(sample.at) : null;
      if (day == null) continue;
      const held = byDay.get(day);
      if (!held || sample.at > held.at) byDay.set(day, sample);
    }
    for (const [day, sample] of byDay) add(key, day, sample.value);
  }

  // Sleep is grouped into nights by the day it ENDED — the day the nightly
  // path files it under — and each night is then measured by the same
  // function the nightly path uses, rather than a second idea of a night.
  const nights = new Map<string, SleepSegment[]>();
  for (const segment of history.sleep ?? []) {
    if (!segment.asleep) continue;
    const day = nightOf(segment.end);
    if (day == null) continue;
    const held = nights.get(day);
    if (held) held.push(segment);
    else nights.set(day, [segment]);
  }
  for (const [day, segments] of nights) {
    const woke = segments.reduce((last, s) => Math.max(last, new Date(s.end).getTime()), 0);
    const hours = sleepHoursLastNight(segments, new Date(woke));
    if (hours != null) add('sleep.hours', day, hours);
  }

  return out.sort((a, b) => a.at.localeCompare(b.at) || a.key.localeCompare(b.key));
}
