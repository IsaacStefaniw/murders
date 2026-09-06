/**
 * The edges of the readiness read: what it says when it cannot say
 * anything, exactly where its thresholds sit, how far back a synced
 * reading is trusted, and that a hand-typed number reaches the same place
 * a synced one does.
 */

import { BODY_ENTRIES } from '@/features/health/bodyEntries';
import { conditioningFrom } from '@/features/health/conditioning';
import { WINDOW_HOURS } from '@/features/health/healthkit';
import { readinessCoverage, readinessFrom } from '@/features/health/readiness';
import { snapshotObservations } from '@/features/health/summarise';
import { METRICS, type MetricObservation } from '@/features/model/metrics';

// The native binding is replaced so the sync windows can be read without a phone.
jest.mock('@kingstinct/react-native-healthkit', () => ({
  CategoryValueSleepAnalysis: { asleepUnspecified: 1, asleepCore: 3, asleepDeep: 4, asleepREM: 5 },
  isHealthDataAvailableAsync: jest.fn(async () => false),
  queryCategorySamples: jest.fn(async () => []),
  queryQuantitySamples: jest.fn(async () => []),
  requestAuthorization: jest.fn(async () => false),
}));

const local = (y: number, m: number, d: number, h: number) => new Date(y, m - 1, d, h, 0, 0, 0);
const NOW = local(2026, 9, 8, 11);

const reading = (key: string, value: number, at: Date, source: MetricObservation['source'] = 'healthkit'): MetricObservation => ({
  id: `${key}-${at.getTime()}-${value}`,
  key,
  value,
  at: at.toISOString(),
  source,
});
const mornings = (key: string, value: number, n = 10) =>
  Array.from({ length: n }, (_, i) => reading(key, value, local(2026, 9, 7 - i, 7)));
const withToday = (key: string, normal: number, today: number) => [...mornings(key, normal), reading(key, today, local(2026, 9, 8, 7))];

describe('what is missing is named', () => {
  it('both, in words, on an empty stream', () => {
    const c = readinessCoverage([], NOW);
    expect(c.ready).toBe(false);
    expect(c.missing).toEqual(['heart-rate variability', 'resting heart rate']);
  });

  it('one baseline is enough to read from, and the other is still named', () => {
    const c = readinessCoverage(mornings('body.hrv', 45), NOW);
    expect(c.ready).toBe(true);
    expect(c.missing).toEqual(['resting heart rate']);
  });

  it('four readings are not a baseline', () => {
    expect(readinessCoverage(mornings('body.restingHr', 52, 4), NOW).missing).toContain('resting heart rate');
    expect(readinessCoverage(mornings('body.restingHr', 52, 5), NOW).missing).not.toContain('resting heart rate');
  });
});

describe('the thresholds, to the number', () => {
  it('HRV: 86% of normal is nothing, 85% is caution, 70% is back-off', () => {
    expect(readinessFrom(withToday('body.hrv', 100, 86), NOW)).toBeNull();
    expect(readinessFrom(withToday('body.hrv', 100, 85), NOW)?.band).toBe('caution');
    expect(readinessFrom(withToday('body.hrv', 100, 71), NOW)?.band).toBe('caution');
    expect(readinessFrom(withToday('body.hrv', 100, 70), NOW)?.band).toBe('back-off');
  });

  it('resting heart rate: +4 is nothing, +5 is caution, +10 is back-off', () => {
    expect(readinessFrom(withToday('body.restingHr', 52, 56), NOW)).toBeNull();
    expect(readinessFrom(withToday('body.restingHr', 52, 57), NOW)?.band).toBe('caution');
    expect(readinessFrom(withToday('body.restingHr', 52, 61), NOW)?.band).toBe('caution');
    expect(readinessFrom(withToday('body.restingHr', 52, 62), NOW)?.band).toBe('back-off');
  });

  it('a better-than-usual morning says nothing rather than a green light', () => {
    expect(readinessFrom(withToday('body.hrv', 50, 70), NOW)).toBeNull();
    expect(readinessFrom(withToday('body.restingHr', 52, 45), NOW)).toBeNull();
  });

  it('sleep: six hours is fine, under six is a caution on its own', () => {
    expect(readinessFrom([reading('sleep.hours', 6, local(2026, 9, 8, 7))], NOW)).toBeNull();
    expect(readinessFrom([reading('sleep.hours', 5.9, local(2026, 9, 8, 7))], NOW)?.band).toBe('caution');
  });

  it('a baseline of zero is never divided by', () => {
    expect(readinessFrom(withToday('body.hrv', 0, 0), NOW)).toBeNull();
  });

  it('every signal names the numbers it used, and never a population band', () => {
    const r = readinessFrom([...withToday('body.hrv', 50, 30), ...withToday('body.restingHr', 52, 63)], NOW)!;
    expect(r.signals).toHaveLength(2);
    expect(r.signals[0]).toMatch(/30 against 50/);
    expect(r.signals[1]).toMatch(/63 against 52/);
    expect(r.signals.join(' ')).toMatch(/your own/);
    expect(r.signals.join(' ')).not.toMatch(/\b(average|unwell|ill|sick)\b|normal range|for your age/i);
  });
});

describe('how far back a synced reading is trusted', () => {
  it('is a window per signal, as the file says', () => {
    expect(WINDOW_HOURS.sleep).toBe(18);
    expect(WINDOW_HOURS.hrv).toBe(48);
    expect(WINDOW_HOURS.restingHr).toBe(48);
    expect(WINDOW_HOURS.weight).toBe(48);
    expect(WINDOW_HOURS.vo2max).toBe(24 * 90);
    expect(WINDOW_HOURS.waist).toBe(24 * 90);
    expect(WINDOW_HOURS.height).toBe(24 * 365 * 5);
  });

  it('and a reading outside the day is never today’s, whatever the window let through', () => {
    // A 48-hour HRV window can return yesterday's sample; readiness still
    // asks whether it is TODAY's before it changes a session.
    const stale = [...mornings('body.hrv', 50), reading('body.hrv', 20, local(2026, 9, 7, 7))];
    expect(readinessFrom(stale, NOW)).toBeNull();
  });
});

describe('a synced snapshot', () => {
  it('records a slow-moving number only when it changed', () => {
    const previous = [reading('body.vo2max', 42, local(2026, 8, 20, 9)), reading('body.height', 180, local(2026, 1, 1, 9))];
    const same = snapshotObservations({ vo2max: 42, heightCm: 180 }, previous, NOW.toISOString());
    expect(same).toEqual([]);
    const moved = snapshotObservations({ vo2max: 43.1, heightCm: 180 }, previous, NOW.toISOString());
    expect(moved.map((o) => [o.key, o.value])).toEqual([['body.vo2max', 43.1]]);
  });

  it('rounds to a tenth and stamps the sync time', () => {
    const [o] = snapshotObservations({ restingHr: 54.26 }, [], NOW.toISOString());
    expect(o.value).toBe(54.3);
    expect(o.at).toBe(NOW.toISOString());
    expect(o.source).toBe('healthkit');
  });
});

describe('cardio fitness never classifies a person', () => {
  const branches = [
    conditioningFrom([reading('body.vo2max', 38, local(2026, 6, 20, 9)), reading('body.vo2max', 43, local(2026, 9, 7, 9))], NOW),
    conditioningFrom([reading('body.vo2max', 45, local(2026, 6, 20, 9)), reading('body.vo2max', 40, local(2026, 9, 7, 9))], NOW),
    conditioningFrom([reading('body.vo2max', 42, local(2026, 6, 20, 9)), reading('body.vo2max', 42.2, local(2026, 9, 7, 9))], NOW),
    conditioningFrom([reading('body.vo2max', 22, local(2026, 9, 7, 9))], NOW),
    conditioningFrom([reading('body.vo2max', 65, local(2026, 9, 7, 9))], NOW),
  ];

  it('in every branch, for a low number and a high one alike', () => {
    for (const b of branches) {
      expect(b).not.toBeNull();
      const text = JSON.stringify(b);
      expect(text).not.toMatch(/poor|fair|good|excellent|superior|below average|above average|for your age|for a (man|woman)|percentile/i);
    }
  });

  it('a change smaller than the estimate’s wobble is read as flat', () => {
    const wobble = conditioningFrom([reading('body.vo2max', 42, local(2026, 6, 20, 9)), reading('body.vo2max', 42.9, local(2026, 9, 7, 9))], NOW)!;
    expect(wobble.reading).toContain('sitting at 42.9');
  });

  it('a change older than ninety days is not a trend', () => {
    const old = conditioningFrom([reading('body.vo2max', 30, local(2026, 3, 1, 9)), reading('body.vo2max', 43, local(2026, 9, 7, 9))], NOW)!;
    expect(old.reading).toContain('sitting at 43');
  });
});

describe('numbers typed by hand', () => {
  it('write to keys the metric definitions know, so they drive the same reads as a sync', () => {
    const known = new Set(METRICS.map((m) => m.key));
    for (const entry of BODY_ENTRIES) {
      expect(known.has(entry.key)).toBe(true);
      expect(entry.min).toBeLessThan(entry.max);
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.hint.length).toBeGreaterThan(0);
    }
    expect(BODY_ENTRIES.map((e) => e.key)).toEqual(
      expect.arrayContaining(['body.hrv', 'body.restingHr', 'body.weight', 'body.vo2max']),
    );
  });

  it('a hand-entered HRV reads exactly like a synced one', () => {
    const synced = withToday('body.hrv', 50, 30);
    const typed = synced.map((o) => ({ ...o, source: 'user' as const, note: 'entered by hand' }));
    expect(readinessFrom(typed, NOW)).toEqual(readinessFrom(synced, NOW));
  });
});
