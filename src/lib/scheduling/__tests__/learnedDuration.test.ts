/**
 * How long a routine actually takes, learned from the person's own record.
 *
 * The rule the whole feature rests on: a number is only ever shown, or
 * scheduled, when it was measured at least three times. Two sessions are
 * an anecdote; the median of three or more is the honest answer to "how
 * long does this take me". Nothing here estimates anything.
 */

import {
  LEARNED_MIN_OBSERVATIONS,
  LEARNED_WINDOW,
  learnedDuration,
  learnedDurationMinutes,
  learnedDurations,
} from '@/lib/scheduling/adaptation';
import type { PlanItem } from '@/types/domain';

function item(overrides: Partial<PlanItem>): PlanItem {
  return {
    id: 'i',
    date: '2026-09-01',
    start: '06:00',
    end: '06:45',
    title: 'Strength workout',
    area: 'health',
    tier: 'should',
    status: 'completed',
    routineId: 'gym',
    fixed: false,
    ...overrides,
  };
}

/** A run of completed sessions for one routine, each with its measured length. */
const run = (routineId: string, minutes: number[]): PlanItem[] =>
  minutes.map((actualMin, n) =>
    item({ id: `${routineId}-${n}`, routineId, date: `2026-09-${String(n + 1).padStart(2, '0')}`, actualMin }),
  );

describe('learnedDuration', () => {
  it('says nothing at all from fewer than three measured sessions', () => {
    expect(learnedDuration('gym', run('gym', [42, 44]))).toBeNull();
    expect(learnedDuration('gym', run('gym', [42]))).toBeNull();
    expect(learnedDuration('gym', [])).toBeNull();
    expect(LEARNED_MIN_OBSERVATIONS).toBe(3);
  });

  it('returns the median and the count once three exist', () => {
    expect(learnedDuration('gym', run('gym', [38, 42, 61]))).toEqual({ minutes: 42, count: 3 });
  });

  it('takes the median, not the mean — one four-hour afternoon cannot move it', () => {
    // The mean of these is 63; the median is the length that keeps being true.
    expect(learnedDuration('gym', run('gym', [40, 42, 44, 46, 143]))?.minutes).toBe(44);
  });

  it('averages the middle pair on an even count, to the whole minute', () => {
    expect(learnedDuration('gym', run('gym', [40, 41, 44, 45]))?.minutes).toBe(43);
  });

  it('ignores items with no measured length — an older plan has none', () => {
    const history = [
      ...run('gym', [40, 42, 44]),
      item({ id: 'old-1', routineId: 'gym', actualMin: undefined }),
      item({ id: 'old-2', routineId: 'gym', actualMin: undefined }),
    ];
    expect(learnedDuration('gym', history)).toEqual({ minutes: 42, count: 3 });
  });

  it('ignores anything that was not completed', () => {
    const history = [
      ...run('gym', [40, 42, 44]),
      item({ id: 'skip', routineId: 'gym', status: 'skipped', actualMin: 5 }),
      item({ id: 'plan', routineId: 'gym', status: 'planned', actualMin: 5 }),
    ];
    expect(learnedDuration('gym', history)).toEqual({ minutes: 42, count: 3 });
  });

  it('keeps each routine to its own history', () => {
    const history = [...run('gym', [40, 42, 44]), ...run('walk', [10, 11, 12])];
    expect(learnedDuration('gym', history)?.minutes).toBe(42);
    expect(learnedDuration('walk', history)?.minutes).toBe(11);
    expect(learnedDuration('sauna', history)).toBeNull();
  });

  it('learns from the last N, so a routine that changed is not held to last winter', () => {
    // Twelve sessions: four long ones months ago, then eight short ones.
    const history = run('gym', [90, 90, 90, 90, 20, 20, 20, 20, 20, 20, 20, 20]);
    expect(LEARNED_WINDOW).toBe(10);
    expect(learnedDuration('gym', history)).toEqual({ minutes: 20, count: 10 });
  });

  it('reads history in date order however the items arrive', () => {
    const history = [...run('gym', [90, 90, 20, 20, 20])].reverse();
    expect(learnedDuration('gym', history, 3)?.minutes).toBe(20);
  });

  it('never returns a number that was not measured — zero and nonsense are dropped', () => {
    const history = [
      ...run('gym', [40, 42, 44]),
      item({ id: 'z', routineId: 'gym', actualMin: 0 }),
      item({ id: 'n', routineId: 'gym', actualMin: Number.NaN }),
      item({ id: 'x', routineId: 'gym', actualMin: -5 }),
    ];
    expect(learnedDuration('gym', history)).toEqual({ minutes: 42, count: 3 });
  });

  it('is pure — it does not touch the history it is given', () => {
    const history = run('gym', [40, 42, 44]);
    const snapshot = JSON.parse(JSON.stringify(history));
    learnedDuration('gym', history);
    expect(history).toEqual(snapshot);
  });
});

describe('learnedDurations, over every routine at once', () => {
  it('includes only the routines with enough history', () => {
    const history = [...run('gym', [40, 42, 44]), ...run('walk', [10, 11])];
    expect(learnedDurations(history)).toEqual({ gym: { minutes: 42, count: 3 } });
  });

  it('flattens to the minutes the planner schedules', () => {
    const history = [...run('gym', [40, 42, 44]), ...run('walk', [10, 11])];
    expect(learnedDurationMinutes(history)).toEqual({ gym: 42 });
  });

  it('is empty for a person with no measured history', () => {
    expect(learnedDurations([])).toEqual({});
    expect(learnedDurationMinutes([])).toEqual({});
  });
});
