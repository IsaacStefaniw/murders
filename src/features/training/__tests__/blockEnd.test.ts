/**
 * The cliff on day 29.
 *
 * `weekOf` returns null for two completely different situations — before a
 * block begins and after it ends — and the session screen read null as "no
 * programme". So on day 29 the block stopped being used with no message:
 * `buildWorkout` took over, and the person's own loads, their swaps, their
 * drops and four weeks of progression were simply not there any more.
 *
 * It punished exactly the person the product most wants to keep. Training
 * through four weeks earns the peak week and then, the following Monday, a
 * beginner's workout and no explanation. Somebody who drifted never
 * reaches day 29 at all.
 */

import { blockComplete, weekOf } from '@/features/training/programme';
import type { TrainingProgramme } from '@/features/training/programme';

const programme = (createdAt: string) => ({ createdAt }) as TrainingProgramme;
const START = '2026-03-02T06:00:00.000Z';
const day = (n: number) =>
  new Date(Date.parse(START) + (n - 1) * 86400e3).toISOString();

describe('where a block is in its four weeks', () => {
  it('runs weeks one to four', () => {
    expect(weekOf(programme(START), day(1))).toBe(1);
    expect(weekOf(programme(START), day(8))).toBe(2);
    expect(weekOf(programme(START), day(22))).toBe(4);
    expect(weekOf(programme(START), day(28))).toBe(4);
  });

  it('is not complete while it is still running', () => {
    for (const n of [1, 8, 15, 22, 28]) {
      expect(blockComplete(programme(START), day(n))).toBe(false);
    }
  });

  it('is complete the day after the fourth week ends', () => {
    // The exact day the stock session used to take over in silence.
    expect(weekOf(programme(START), day(29))).toBeNull();
    expect(blockComplete(programme(START), day(29))).toBe(true);
  });

  it('stays complete rather than wrapping around', () => {
    expect(blockComplete(programme(START), day(60))).toBe(true);
    expect(blockComplete(programme(START), day(400))).toBe(true);
  });

  /**
   * The distinction the null was hiding. A block whose start date is in
   * the future has not finished — it has not begun — and the two must not
   * produce the same screen.
   */
  it('tells "not started yet" apart from "finished"', () => {
    const future = programme('2026-06-01T06:00:00.000Z');
    expect(weekOf(future, '2026-03-02T06:00:00.000Z')).toBeNull();
    expect(blockComplete(future, '2026-03-02T06:00:00.000Z')).toBe(false);
  });
});
