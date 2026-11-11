/**
 * The load could never move, because nothing could answer the question.
 *
 * Isaac's screen, mid-session on 11 Nov 2026: "Last time: 10/6/7/7 (no
 * effort noted, so the load stays)."
 *
 * True, and a dead end. `progression.ts` progresses only when the top
 * set makes its reps AND had something left; `reserveOf` returns null
 * for a set with no `rpe` and the rule treats the condition as unmet,
 * deliberately — "an absent RPE is not a zero, it is silence."
 *
 * `makeSet` has always accepted an rpe. `SetLogger.onAddSet` took reps
 * and a weight, so nothing ever passed one. The rule was unsatisfiable
 * on every lift for every user, and the app printed that fact on screen
 * each session without it being actionable.
 */

import { prescribe } from '@/features/training/progression';
import { makeSet } from '@/features/training/log';
import type { WorkoutLog } from '@/types/domain';

const session = (date: string, sets: [number, number, number?][]): WorkoutLog => ({
  id: `w-${date}`,
  date,
  title: 'Lower A',
  sets: sets.map(([w, reps, rpe], i) => ({
    ...makeSet('Squat', i + 1, reps, w, rpe),
    at: new Date(Date.parse(`${date}T02:20:00.000Z`) + i * 180000).toISOString(),
  })),
  createdAt: `${date}T02:20:00.000Z`,
  updatedAt: `${date}T03:00:00.000Z`,
});

/** His ramp as prescribed: 8/5/5/3 to a top triple. */
const RAMP: [number, number, number?][] = [
  [85, 8],
  [90, 5],
  [95, 5],
  [100, 3],
];

describe('the dead end', () => {
  it('never moves the load when no effort is recorded', () => {
    const p = prescribe('Squat', [session('2026-11-11', RAMP)], 1);
    expect(p.verdict).toBe('hold');
    expect(p.loadKg).toBe(100);
    expect(p.line).toMatch(/no effort noted, so the load stays/);
  });

  it('moves it the moment the top set carries one', () => {
    const withEffort = RAMP.map((s, i) => (i === 3 ? [100, 3, 9] : s)) as typeof RAMP;
    const p = prescribe('Squat', [session('2026-11-11', withEffort)], 1);
    expect(p.verdict).toBe('progress');
    expect(p.loadKg).toBe(105);
  });

  it('still holds when the top set had nothing left', () => {
    // Reps at zero reserve is a set taken to failure, which is a
    // different thing and is not evidence the load is ready.
    const toFailure = RAMP.map((s, i) => (i === 3 ? [100, 3, 10] : s)) as typeof RAMP;
    const p = prescribe('Squat', [session('2026-11-11', toFailure)], 1);
    expect(p.verdict).toBe('hold');
    expect(p.loadKg).toBe(100);
  });
});

describe('what the chips record', () => {
  it('maps reps-left to the rpe the rule reads', () => {
    // The control asks "left in the tank" and stores 10 minus it, so the
    // person never sees a number they would have to calibrate.
    for (const [left, rpe, verdict] of [
      [2, 8, 'progress'],
      [1, 9, 'progress'],
      [0, 10, 'hold'],
    ] as const) {
      const sets = RAMP.map((s, i) => (i === 3 ? [100, 3, rpe] : s)) as typeof RAMP;
      expect(10 - left).toBe(rpe);
      expect(prescribe('Squat', [session('2026-11-11', sets)], 1).verdict).toBe(verdict);
    }
  });

  it('carries the effort onto the set itself, not just into the verdict', () => {
    const s = makeSet('Squat', 4, 3, 100, 9);
    expect(s.rpe).toBe(9);
    expect(makeSet('Squat', 4, 3, 100).rpe).toBeUndefined();
  });
});

describe('the anchor corrects itself', () => {
  it('re-anchors on the heaviest set actually lifted, not on a stale light one', () => {
    // His app had anchored at 80 from an old light session and was
    // prescribing 65/75/75/80 while he squatted 90. Today's heaviest
    // becomes tomorrow's anchor with no intervention.
    const stale = session('2026-11-04', [[60, 10], [70, 6], [80, 7], [80, 7]]);
    const today = session('2026-11-11', [[60, 10], [80, 6], [90, 6], [90, 6, 9]]);
    expect(prescribe('Squat', [stale], 1).loadKg).toBe(80);
    expect(prescribe('Squat', [stale, today], 1).loadKg).toBe(95);
  });
});
