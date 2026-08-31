import { observe } from '@/features/model/metrics';
import {
  sleepHoursLastNight,
  snapshotObservations,
  type SleepSegment,
} from '@/features/health/summarise';

const now = new Date('2026-08-31T07:00:00Z');
const seg = (startH: number, endH: number, asleep = true): SleepSegment => ({
  start: new Date(now.getTime() - startH * 3600e3).toISOString(),
  end: new Date(now.getTime() - endH * 3600e3).toISOString(),
  asleep,
});

describe('sleepHoursLastNight', () => {
  it('sums asleep segments and ignores in-bed/awake time', () => {
    const segments = [
      seg(8.5, 8, false), // in bed, not asleep
      seg(8, 4),
      seg(4, 3.5, false), // awake mid-night
      seg(3.5, 1),
    ];
    expect(sleepHoursLastNight(segments, now)).toBe(6.5);
  });

  it('merges overlapping stage records so REM/core/deep never double count', () => {
    const segments = [seg(8, 2), seg(7, 5), seg(6, 3)];
    expect(sleepHoursLastNight(segments, now)).toBe(6);
  });

  it('ignores sleep outside the 18-hour window and handles no data', () => {
    expect(sleepHoursLastNight([seg(30, 22)], now)).toBeNull();
    expect(sleepHoursLastNight([], now)).toBeNull();
  });
});

describe('snapshotObservations', () => {
  const todayIso = now.toISOString();

  it('maps the snapshot onto the metric stream with healthkit source', () => {
    const obs = snapshotObservations({ sleepHours: 6.5, restingHr: 54, weightKg: 88.2 }, [], todayIso);
    expect(obs.map((o) => o.key)).toEqual(['sleep.hours', 'body.restingHr', 'body.weight']);
    expect(obs.every((o) => o.source === 'healthkit')).toBe(true);
  });

  it("never overwrites today's existing observation — the user's entry wins, re-sync is idempotent", () => {
    const mine = { ...observe('sleep.hours', 7), at: todayIso };
    const obs = snapshotObservations({ sleepHours: 6.5, restingHr: 54 }, [mine], todayIso);
    expect(obs.map((o) => o.key)).toEqual(['body.restingHr']);
    // Yesterday's observation does not block today's.
    const yesterday = { ...observe('body.restingHr', 55), at: '2026-08-30T07:00:00.000Z' };
    expect(snapshotObservations({ restingHr: 54 }, [yesterday], todayIso)).toHaveLength(1);
  });

  it('drops null, zero and junk values', () => {
    expect(snapshotObservations({ sleepHours: null, restingHr: 0, weightKg: NaN }, [], todayIso)).toHaveLength(0);
  });
});
