/**
 * The ramp to a heavy triple — Isaac's block, against his own numbers.
 *
 * ── Why this file exists, and what it says about the other two ─────────
 *
 * `features/training/progression.ts` had **no tests at all**. The two
 * files named after it, `progression.test.ts` and
 * `progression.more.test.ts`, both test `features/training/log.ts` — they
 * were named for the behaviour rather than the module, and the module they
 * sound like was never covered. So a file written specifically to fix a
 * bad prescription shipped with nothing checking the prescription.
 *
 * The first case below is the one that matters: the ramp has to reproduce
 * the session he actually did, to the kilo, or the shares are wrong.
 */

import {
  BLOCK,
  prescribe,
  rampFor,
  rampLine,
  reserveLine,
  reserveOf,
  setsIn,
  topSetOf,
} from '@/features/training/progression';
import type { LoggedSet, WorkoutLog } from '@/types/domain';

/** A logged session: [weight, reps, rpe?] per set, in the order they were done. */
const log = (
  id: string,
  date: string,
  exercise: string,
  sets: [number | undefined, number, number?][],
): WorkoutLog => ({
  id,
  date,
  title: 'Upper A',
  sets: sets.map(([weightKg, reps, rpe], i) => ({
    id: `${id}-${i}`,
    exercise,
    index: i + 1,
    reps,
    weightKg,
    rpe,
    at: `${date}T12:30:00.000Z`,
  })) as LoggedSet[],
  createdAt: `${date}T12:30:00.000Z`,
  updatedAt: `${date}T13:00:00.000Z`,
});

/** His 10 Nov bench session, with two reps left on the triple. */
const HIS_SESSION: [number | undefined, number, number?][] = [
  [100, 8, 7],
  [110, 5, 8],
  [115, 5, 8],
  [120, 3, 8],
];

describe('the ramp is his session, not a template', () => {
  it('reproduces 100/110/115/120 from a 120 kg top set', () => {
    expect(rampLine(rampFor('Bench press', 120, BLOCK[0]))).toBe('100 / 110 / 115 / 120 kg');
  });

  it('keeps every rung on the lift’s own plate step', () => {
    // The squat moves in 5s, so its ramp lands on 5s rather than on the
    // 1.25 kg plates the shares would otherwise ask for.
    expect(rampLine(rampFor('Squat', 100, BLOCK[0]))).toBe('85 / 90 / 95 / 100 kg');
    expect(rampLine(rampFor('Overhead press', 72.5, BLOCK[0]))).toBe('60 / 67.5 / 70 / 72.5 kg');
  });

  it('never rounds a lead-in set above the top set', () => {
    // 0.96 of a light bar rounds up; the clamp is the only thing stopping
    // the third set outweighing the fourth.
    for (const topKg of [20, 22.5, 25, 30, 40, 55, 62.5, 100, 127.5, 180]) {
      const ramp = rampFor('Bench press', topKg, BLOCK[0]);
      expect(Math.max(...ramp.map((s) => s.loadKg))).toBe(topKg);
      expect(ramp[ramp.length - 1].loadKg).toBe(topKg);
    }
  });

  it('ascends, or it is not a ramp', () => {
    const loads = rampFor('Deadlift', 140, BLOCK[0]).map((s) => s.loadKg);
    for (let i = 1; i < loads.length; i += 1) expect(loads[i]).toBeGreaterThanOrEqual(loads[i - 1]);
  });

  it('marks exactly one top set, and it is the last', () => {
    const ramp = rampFor('Bench press', 120, BLOCK[0]);
    expect(ramp.filter((s) => s.top)).toHaveLength(1);
    expect(ramp[ramp.length - 1].top).toBe(true);
  });
});

describe('the block', () => {
  it('runs three identical hard weeks, because that is what he does', () => {
    expect(BLOCK[0].ramp).toBe(BLOCK[1].ramp);
    expect(BLOCK[1].ramp).toBe(BLOCK[2].ramp);
    expect(BLOCK.slice(0, 3).map((w) => setsIn(w))).toEqual([4, 4, 4]);
  });

  it('deloads by dropping the top two sets, not by dropping the weight', () => {
    const hard = rampFor('Bench press', 120, BLOCK[0]);
    const easy = rampFor('Bench press', 120, BLOCK[3]);
    expect(setsIn(BLOCK[3])).toBe(2);
    expect(easy.map((s) => s.loadKg)).toEqual(hard.slice(0, 2).map((s) => s.loadKg));
  });

  it('asks for a triple at the top of every hard week', () => {
    for (const week of BLOCK.slice(0, 3)) expect(topSetOf(week).reps).toBe(3);
  });

  it('says the deload is meant to feel easy, and says so in words', () => {
    expect(reserveLine(BLOCK[3])).toMatch(/four or five/);
    expect(reserveLine(BLOCK[0])).toMatch(/1–2 reps left on the top set/);
  });
});

describe('what moves the weight', () => {
  it('moves it when the triple goes up with a rep left', () => {
    const p = prescribe('Bench press', [log('a', '2026-11-10', 'Bench press', HIS_SESSION)], 1);
    expect(p.verdict).toBe('progress');
    expect(p.loadKg).toBe(122.5);
    expect(rampLine(p.sets)).toBe('102.5 / 112.5 / 117.5 / 122.5 kg');
  });

  it('moves the top set by a step, and does not claim the bottom rung moved too', () => {
    const p = prescribe('Squat', [log('a', '2026-11-10', 'Squat', [[85, 8, 7], [90, 5, 8], [95, 5, 8], [100, 3, 8]])], 1);
    // The rungs are proportional, so 5 kg on a 100 kg top set lifts the
    // 0.83 rung by 0.85 — nothing, on a 5 kg grid. It lags one session.
    expect(p.loadKg).toBe(105);
    expect(p.sets.map((s) => s.loadKg)).toEqual([85, 95, 100, 105]);
    // The copy used to read "up 5 on every set", which was false for this
    // exact session. It may only claim what the numbers do.
    expect(p.line).not.toMatch(/every set/);
    expect(p.line).toMatch(/top set is up 5/);
  });

  it('does not move it on a triple taken to failure', () => {
    // Reps made, nothing left. The reps alone are not evidence the load is
    // ready — that is the half of the rule that is easy to drop.
    const toFailure = HIS_SESSION.map((s, i) => (i === 3 ? [120, 3, 10] : s)) as typeof HIS_SESSION;
    const p = prescribe('Bench press', [log('a', '2026-11-10', 'Bench press', toFailure)], 1);
    expect(p.verdict).toBe('hold');
    expect(p.loadKg).toBe(120);
  });

  it('does not move it on a triple logged with no effort noted', () => {
    const silent = HIS_SESSION.map(([w, r]) => [w, r]) as typeof HIS_SESSION;
    const p = prescribe('Bench press', [log('a', '2026-11-10', 'Bench press', silent)], 1);
    expect(p.verdict).toBe('hold');
    expect(p.line).toMatch(/no effort noted/);
  });

  it('stays when the top set came in under the triple', () => {
    const short = HIS_SESSION.map((s, i) => (i === 3 ? [120, 2, 9] : s)) as typeof HIS_SESSION;
    const p = prescribe('Bench press', [log('a', '2026-11-10', 'Bench press', short)], 1);
    expect(p.verdict).toBe('stay');
    expect(p.loadKg).toBe(120);
  });

  it('backs off after two short sessions at the same load, not after one', () => {
    const short: typeof HIS_SESSION = [[100, 8, 8], [110, 5, 9], [115, 5, 9], [120, 2, 9]];
    const once = prescribe('Bench press', [log('b', '2026-11-10', 'Bench press', short)], 1);
    expect(once.verdict).toBe('stay');

    const twice = prescribe(
      'Bench press',
      [log('a', '2026-11-03', 'Bench press', short), log('b', '2026-11-10', 'Bench press', short)],
      1,
    );
    expect(twice.verdict).toBe('back-off');
    expect(twice.loadKg).toBe(117.5);
  });

  it('reads the heaviest set as the top set, even when a lighter one repeats', () => {
    // The modal rule the old flat block used would call this 110 and then
    // progress from ten kilos below where he actually was.
    const p = prescribe(
      'Bench press',
      [log('a', '2026-11-10', 'Bench press', [[110, 5, 8], [110, 5, 8], [115, 5, 8], [120, 3, 8]])],
      1,
    );
    expect(p.last?.loadKg).toBe(120);
    expect(p.loadKg).toBe(122.5);
  });
});

describe('what it refuses to do', () => {
  it('asks for a calibration rather than inventing a first load', () => {
    const p = prescribe('Bench press', [], 1);
    expect(p.verdict).toBe('calibrate');
    expect(p.loadKg).toBeNull();
    expect(p.sets).toEqual([]);
  });

  it('asks again when the only session carries no weight', () => {
    const p = prescribe('Bench press', [log('a', '2026-11-10', 'Bench press', [[undefined, 8]])], 1);
    expect(p.verdict).toBe('calibrate');
    expect(p.loadKg).toBeNull();
  });

  it('reads an absent RPE as silence, not as a zero', () => {
    expect(reserveOf({ rpe: undefined } as LoggedSet)).toBeNull();
    expect(reserveOf({ rpe: 8 } as LoggedSet)).toBe(2);
    expect(reserveOf({ rpe: 10 } as LoggedSet)).toBe(0);
  });

  it('repeats the deload rather than throwing in a fifth week', () => {
    const p = prescribe('Bench press', [log('a', '2026-11-10', 'Bench press', HIS_SESSION)], 9);
    expect(setsIn(p.target)).toBe(2);
    expect(p.sets).toHaveLength(2);
  });

  it('never prescribes a load below one plate step', () => {
    const p = prescribe('Bench press', [log('a', '2026-11-10', 'Bench press', [[2.5, 1, 9], [2.5, 1, 9]])], 1);
    expect(p.sets.every((s) => s.loadKg >= 2.5)).toBe(true);
  });
});
