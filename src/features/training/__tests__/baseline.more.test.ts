/**
 * The weighted baseline against the cases baseline.test.ts does not cover:
 * a set corrected after the fact, a session deleted, a retest older than
 * the window, two lifts on one day, a bodyweight set, a high-rep set, the
 * decay floor and the rounding. The corrected and deleted cases go through
 * the store, because that is where the old number is replaced.
 */

import { observe, type MetricObservation } from '@/features/model/metrics';
import { strengthBaseline } from '@/features/training/baseline';
import { newLog, observationsFrom } from '@/features/training/log';
import { baselinesFrom } from '@/features/training/programme';
import { useAppStore } from '@/state/store';
import type { LoggedSet, WorkoutLog } from '@/types/domain';

const BENCH = 'strength.bench.e1rm';
const SQUAT = 'strength.squat.e1rm';
const NOW = new Date('2026-09-05T12:00:00');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400e3).toISOString();
const session = (key: string, value: number, days: number, id = `w${days}`): MetricObservation => ({
  ...observe(key, value, 'user', `workout:${id}`),
  at: daysAgo(days),
});
const retest = (value: number, days: number): MetricObservation => ({
  ...observe(BENCH, value, 'user', `${value} kg × 1`),
  at: daysAgo(days),
});

const set = (exercise: string, index: number, reps: number, weightKg?: number): LoggedSet => ({
  id: `${exercise}-${index}`,
  exercise,
  index,
  reps,
  weightKg,
  at: '2026-09-01T09:00:00.000Z',
});
const log = (id: string, date: string, sets: LoggedSet[]): WorkoutLog => ({
  ...newLog(date, 'Upper A'),
  id,
  sets,
});

describe('through the store', () => {
  beforeEach(() => {
    useAppStore.getState().resetAll();
  });

  it('a corrected set replaces the number rather than sitting beside it', () => {
    const store = useAppStore.getState();
    store.saveWorkoutLog(log('wl1', '2026-09-01', [set('Bench press', 1, 5, 100)]));
    expect(baselinesFrom(useAppStore.getState().metrics, NOW).bench).toBeCloseTo(116.5 * (1 - 0.0125 * 4 / 7), 0);

    // It was 90, not 100. The lower number is the truth and it wins.
    useAppStore.getState().updateLoggedSet('wl1', 'Bench press-1', { weightKg: 90 });
    const metrics = useAppStore.getState().metrics.filter((m) => m.key === BENCH);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(105);
    expect(strengthBaseline(useAppStore.getState().metrics, BENCH, NOW)!.peak).toBe(105);
  });

  it('a deleted session takes its number with it', () => {
    const store = useAppStore.getState();
    store.saveWorkoutLog(log('wl1', '2026-08-25', [set('Bench press', 1, 5, 100)]));
    store.saveWorkoutLog(log('wl2', '2026-09-01', [set('Bench press', 1, 3, 110)]));
    expect(strengthBaseline(useAppStore.getState().metrics, BENCH, NOW)!.peak).toBe(121);

    useAppStore.getState().removeWorkoutLog('wl2');
    expect(strengthBaseline(useAppStore.getState().metrics, BENCH, NOW)!.peak).toBe(116.5);

    useAppStore.getState().removeWorkoutLog('wl1');
    expect(strengthBaseline(useAppStore.getState().metrics, BENCH, NOW)).toBeNull();
    expect(baselinesFrom(useAppStore.getState().metrics, NOW)).toEqual({});
  });

  it('deleting the only loaded set leaves no estimate behind', () => {
    const store = useAppStore.getState();
    store.saveWorkoutLog(log('wl1', '2026-09-01', [set('Bench press', 1, 5, 100), set('Bench press', 2, 15)]));
    expect(useAppStore.getState().metrics.filter((m) => m.key === BENCH)).toHaveLength(1);
    useAppStore.getState().removeLoggedSet('wl1', 'Bench press-1');
    expect(useAppStore.getState().metrics.filter((m) => m.key === BENCH)).toHaveLength(0);
  });
});

describe('a retest older than the window', () => {
  it('is discounted to the floor when nothing has been logged since', () => {
    const read = strengthBaseline([session(BENCH, 120, 200), retest(100, 120)], BENCH, NOW)!;
    expect(read.value).toBe(85);
    expect(read.peak).toBe(100);
    expect(read.fromRetest).toBe(true);
    expect(read.observations).toBe(1);
  });

  it('gives way to the sessions logged after it, and the older peak before it stays gone', () => {
    const read = strengthBaseline(
      [session(BENCH, 120, 200), retest(100, 120), session(BENCH, 95, 30), session(BENCH, 98, 7)],
      BENCH,
      NOW,
    )!;
    expect(read.peak).toBe(98);
    expect(read.value).toBeCloseTo(98 * (1 - 0.0125), 1);
    expect(read.fromRetest).toBe(false);
    expect(read.observations).toBe(2);
  });
});

describe('two lifts on one day', () => {
  it('stay separate', () => {
    const metrics = [session(BENCH, 100, 0, 'w1'), session(SQUAT, 140, 0, 'w1')];
    expect(baselinesFrom(metrics, NOW)).toEqual({ bench: 100, squat: 140 });
    expect(strengthBaseline(metrics, BENCH, NOW)!.observations).toBe(1);
  });

  it('come out of one session as one reading per lift', () => {
    const obs = observationsFrom(
      log('wl1', '2026-09-01', [set('Bench press', 1, 5, 100), set('Squat', 1, 5, 140), set('Squat', 2, 5, 145)]),
    );
    expect(obs.map((o) => o.key).sort()).toEqual([BENCH, SQUAT]);
    expect(obs.find((o) => o.key === SQUAT)!.value).toBe(169);
  });
});

describe('sets that make no strength claim', () => {
  it('a bodyweight set under a main lift name estimates nothing', () => {
    expect(observationsFrom(log('wl1', '2026-09-01', [set('Squat', 1, 20)]))).toEqual([]);
  });

  it('a set over twelve reps estimates nothing, even when loaded', () => {
    expect(observationsFrom(log('wl1', '2026-09-01', [set('Squat', 1, 13, 60)]))).toEqual([]);
    expect(observationsFrom(log('wl1', '2026-09-01', [set('Squat', 1, 12, 60)]))).toHaveLength(1);
  });

  it('a session of only such sets leaves the baseline where it was', () => {
    const before = [session(BENCH, 100, 7)];
    const after = [...before, ...observationsFrom(log('wl2', '2026-09-05', [set('Bench press', 1, 15, 50)])).map((o) => ({
      ...observe(o.key, o.value, 'user', 'workout:wl2'),
      at: daysAgo(0),
    }))];
    expect(strengthBaseline(after, BENCH, NOW)!.value).toBe(strengthBaseline(before, BENCH, NOW)!.value);
  });
});

describe('the decay', () => {
  it('reaches the floor at exactly twelve weeks and stops there', () => {
    expect(strengthBaseline([session(BENCH, 100, 84)], BENCH, NOW)!.value).toBe(85);
    expect(strengthBaseline([session(BENCH, 100, 83)], BENCH, NOW)!.value).toBeGreaterThan(85);
    expect(strengthBaseline([session(BENCH, 100, 400)], BENCH, NOW)!.value).toBe(85);
  });

  it('is applied to the observation, not to the whole window', () => {
    // An 84-day-old 100 (floor: 85) loses to a fresh 90.
    const read = strengthBaseline([session(BENCH, 100, 84), session(BENCH, 90, 0)], BENCH, NOW)!;
    expect(read.value).toBe(90);
    expect(read.observations).toBe(2);
  });

  it('never sends a reading above what was lifted', () => {
    for (const days of [0, 1, 7, 30, 84, 200]) {
      expect(strengthBaseline([session(BENCH, 100, days)], BENCH, NOW)!.value).toBeLessThanOrEqual(100);
    }
  });
});

describe('rounding', () => {
  it('rounds the discounted value to a tenth of a kilogram', () => {
    const read = strengthBaseline([session(BENCH, 107.3, 7)], BENCH, NOW)!;
    expect(read.value).toBe(106);
    expect(read.peak).toBe(107.3);
    for (const days of [3, 11, 19, 47]) {
      const v = strengthBaseline([session(BENCH, 107.3, days)], BENCH, NOW)!.value;
      expect(Math.round(v * 10) / 10).toBe(v);
    }
  });

  it('a fresh reading is returned exactly', () => {
    expect(strengthBaseline([session(BENCH, 107.3, 0)], BENCH, NOW)!.value).toBe(107.3);
  });
});
