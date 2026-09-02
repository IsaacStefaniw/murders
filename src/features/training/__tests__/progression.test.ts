/**
 * Progressive overload, against the real numbers from the field.
 *
 * Every case here is taken from a screenshot of the shipped app giving bad
 * advice. The existing suite passed throughout, because it tested the
 * function's own arithmetic and never the two things that were actually
 * wrong: which rep number the caller passed in, and which session the
 * function called "last time".
 */

import { defaultRepsFrom, suggestNext, topRepsFrom } from '@/features/training/log';
import type { WorkoutLog } from '@/types/domain';

const log = (id: string, date: string, sets: [number, number][]): WorkoutLog => ({
  id,
  date,
  title: 'Lower A',
  sets: sets.map(([weightKg, reps], i) => ({
    id: `${id}-${i}`,
    exercise: 'Squat',
    index: i + 1,
    reps,
    weightKg,
    at: `${date}T17:00:00.000Z`,
  })),
  durationMin: 30,
  createdAt: `${date}T17:00:00.000Z`,
  updatedAt: `${date}T17:30:00.000Z`,
});

describe('which rep number earns more load', () => {
  it('reads the top of the range, not the bottom', () => {
    // The whole defect in one assertion: the caller was passing 6.
    expect(defaultRepsFrom('6–10')).toBe(6);
    expect(topRepsFrom('6–10')).toBe(10);
    expect(topRepsFrom('8–12')).toBe(12);
    expect(topRepsFrom('45 sec')).toBe(45);
    expect(topRepsFrom('5')).toBe(5);
  });

  it('does not add load for clearing the bottom of the range', () => {
    // Field case: 80 kg for 7, 7, 6 against a 6–10 prescription. The app
    // said "You hit every rep at 80 kg. Up 5." It should say hold.
    const logs = [log('a', '2026-09-01', [[60, 10], [80, 7], [80, 7], [80, 6]])];
    const next = suggestNext(logs, 'Squat', topRepsFrom('6–10')!, 3);
    expect(next?.increased).toBe(false);
    expect(next?.weightKg).toBe(80);
  });

  it('adds load once the top of the range is held on every working set', () => {
    const logs = [log('a', '2026-09-01', [[80, 10], [80, 10], [80, 10]])];
    const next = suggestNext(logs, 'Squat', topRepsFrom('6–10')!, 3);
    expect(next?.increased).toBe(true);
    expect(next?.weightKg).toBe(85); // squat and deadlift take the 5 kg step
  });
});

describe('reps that fall away', () => {
  it('holds the load even when every set technically cleared the number', () => {
    // 10, 9, 7 all clear a target of 7, but the body is already at its
    // limit. A coach watching that does not reach for a heavier bar.
    const logs = [log('a', '2026-09-01', [[80, 10], [80, 9], [80, 7]])];
    const next = suggestNext(logs, 'Squat', 7, 3);
    expect(next?.increased).toBe(false);
    expect(next?.reason).toMatch(/fell away/i);
  });

  it('tolerates a single rep of drop-off, which is normal fatigue', () => {
    const logs = [log('a', '2026-09-01', [[80, 10], [80, 10], [80, 9]])];
    const next = suggestNext(logs, 'Squat', 9, 3);
    expect(next?.increased).toBe(true);
  });
});

describe('what "last time" means', () => {
  it('never means the session being logged right now', () => {
    // Field case: the screen read "Same 60 kg — last time was 7/7/7 reps"
    // with 7/7/7 sitting directly above it, because the in-progress session
    // was its own reference.
    const previous = log('prev', '2026-08-25', [[60, 10], [60, 10], [60, 10]]);
    const inProgress = log('now', '2026-09-01', [[60, 7], [60, 7], [60, 7]]);
    const logs = [previous, inProgress];

    const leaky = suggestNext(logs, 'Squat', 10, 3);
    expect(leaky?.reason).toMatch(/7\/7\/7/);

    const correct = suggestNext(logs, 'Squat', 10, 3, 'now');
    expect(correct?.reason).not.toMatch(/7\/7\/7/);
    // The real last session held 10s across the board, so it earns the jump.
    expect(correct?.increased).toBe(true);
  });

  it('returns nothing when the only session is the one in progress', () => {
    const logs = [log('now', '2026-09-01', [[60, 7]])];
    expect(suggestNext(logs, 'Squat', 10, 3, 'now')).toBeNull();
  });
});
