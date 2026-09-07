/**
 * suggestNext and lastPerformance: reps falling away, held, increased, and
 * the step size for each main lift.
 */

import { lastPerformance, suggestNext } from '@/features/training/log';
import type { WorkoutLog } from '@/types/domain';

const log = (id: string, date: string, exercise: string, sets: [number, number][]): WorkoutLog => ({
  id,
  date,
  title: 'Session',
  sets: sets.map(([weightKg, reps], i) => ({
    id: `${id}-${i}`,
    exercise,
    index: i + 1,
    reps,
    weightKg,
    at: `${date}T17:00:00.000Z`,
  })),
  createdAt: `${date}T17:00:00.000Z`,
  updatedAt: `${date}T17:30:00.000Z`,
});

describe('the three shapes a session can take', () => {
  it('falling away: the load repeats and the reason says so', () => {
    const next = suggestNext([log('a', '2026-09-01', 'Bench press', [[80, 8], [80, 7], [80, 5]])], 'Bench press', 8, 3)!;
    expect(next.increased).toBe(false);
    expect(next.weightKg).toBe(80);
    expect(next.reason).toMatch(/8\/7\/5/);
  });

  it('held below the top of the range: the load repeats and the target is named', () => {
    const next = suggestNext([log('a', '2026-09-01', 'Bench press', [[80, 8], [80, 8], [80, 8]])], 'Bench press', 10, 3)!;
    expect(next.increased).toBe(false);
    expect(next.weightKg).toBe(80);
    expect(next.reason).toMatch(/10 across every set/);
  });

  it('top of the range on every set: the load goes up', () => {
    const next = suggestNext([log('a', '2026-09-01', 'Bench press', [[80, 10], [80, 10], [80, 10]])], 'Bench press', 10, 3)!;
    expect(next.increased).toBe(true);
    expect(next.weightKg).toBe(82.5);
  });

  it('fewer working sets than prescribed holds, even at the top of the range', () => {
    const next = suggestNext([log('a', '2026-09-01', 'Bench press', [[80, 10], [80, 10]])], 'Bench press', 10, 3)!;
    expect(next.increased).toBe(false);
  });

  it('a heavy single followed by lighter back-off sets holds at the single', () => {
    const next = suggestNext([log('a', '2026-09-01', 'Squat', [[140, 1], [110, 5], [110, 5]])], 'Squat', 5, 3)!;
    expect(next.weightKg).toBe(140);
    expect(next.increased).toBe(false);
  });
});

describe('the step size', () => {
  const held = (exercise: string, load: number) => [log('a', '2026-09-01', exercise, [[load, 5], [load, 5], [load, 5]])];

  it('is 5 for the squat and the deadlift', () => {
    expect(suggestNext(held('Squat', 120), 'Squat', 5, 3)!.weightKg).toBe(125);
    expect(suggestNext(held('Deadlift', 160), 'Deadlift', 5, 3)!.weightKg).toBe(165);
  });

  it('is 2.5 for the bench, the overhead press and anything that is not a main lift', () => {
    expect(suggestNext(held('Bench press', 80), 'Bench press', 5, 3)!.weightKg).toBe(82.5);
    expect(suggestNext(held('Overhead press', 50), 'Overhead press', 5, 3)!.weightKg).toBe(52.5);
    expect(suggestNext(held('Goblet squats', 24), 'Goblet squats', 5, 3)!.weightKg).toBe(26.5);
    expect(suggestNext(held('Romanian deadlift', 100), 'Romanian deadlift', 5, 3)!.weightKg).toBe(102.5);
  });

  it('says what it did in words a person can check', () => {
    const next = suggestNext(held('Squat', 120), 'Squat', 5, 3)!;
    expect(next.reason).toBe('5 on every set at 120 kg. Up 5.');
  });
});

describe('lastPerformance', () => {
  it('reports the heaviest set of the most recent session, with every set in order', () => {
    const logs = [
      log('a', '2026-08-25', 'Squat', [[100, 5], [100, 5]]),
      log('b', '2026-09-01', 'Squat', [[90, 8], [110, 3], [100, 5]]),
    ];
    const last = lastPerformance(logs, 'Squat')!;
    expect(last.date).toBe('2026-09-01');
    expect(last.set.weightKg).toBe(110);
    expect(last.sets.map((s) => s.weightKg)).toEqual([90, 110, 100]);
  });

  it('ignores a session with no sets of that exercise rather than stopping there', () => {
    const logs = [
      log('a', '2026-08-25', 'Squat', [[100, 5]]),
      log('b', '2026-09-01', 'Bench press', [[80, 5]]),
    ];
    expect(lastPerformance(logs, 'Squat')!.date).toBe('2026-08-25');
  });

  it('does not treat unloaded work as heavier than loaded work', () => {
    const logs = [log('a', '2026-09-01', 'Squat', [[undefined as unknown as number, 15], [60, 8]])];
    expect(lastPerformance(logs, 'Squat')!.set.weightKg).toBe(60);
  });
});
