/**
 * A session swap moves the rest of the week on.
 *
 * Before this, a swap changed one date and nothing else: pressing on
 * Monday instead of squatting brought the programme's Wednesday, which was
 * pressing again. Now the order runs on from the swapped session, the days
 * before it keep what they were, and a swap never reaches into another
 * week.
 */

import { programmedSessionIndex, sessionIndexFor } from '@/features/training/swap';

// 2026-09-06 is a Sunday; the programme's cycle runs Sunday to Saturday.
const SUN = '2026-09-06';
const MON = '2026-09-07';
const TUE = '2026-09-08';
const WED = '2026-09-09';
const THU = '2026-09-10';
const FRI = '2026-09-11';
const SAT = '2026-09-12';
const NEXT_MON = '2026-09-14';
const NEXT_WED = '2026-09-16';
const LAST_FRI = '2026-09-04';

describe('the programme’s own pick', () => {
  it('runs the sessions in order across the week', () => {
    // Four sessions: Upper A, Lower A, Upper B, Lower B on a Mon/Wed/Fri/Sat week.
    expect([MON, WED, FRI, SAT].map((d) => programmedSessionIndex(d, 4))).toEqual([0, 1, 2, 3]);
    // Three sessions on Mon/Wed/Fri.
    expect([MON, WED, FRI].map((d) => programmedSessionIndex(d, 3))).toEqual([0, 1, 2]);
  });

  it('is zero with no sessions rather than dividing by nothing', () => {
    expect(programmedSessionIndex(MON, 0)).toBe(0);
    expect(sessionIndexFor(MON, 0, {}).index).toBe(0);
  });
});

describe('sessionIndexFor', () => {
  it('is the programme’s pick when nothing was swapped', () => {
    expect(sessionIndexFor(WED, 4, {})).toEqual({ index: 1, programmed: 1 });
  });

  it('runs the day’s own swap, and says what the programme would have picked', () => {
    expect(sessionIndexFor(MON, 4, { [MON]: 1 })).toEqual({ index: 1, programmed: 0 });
  });

  it('moves the rest of the week on from the swap, so the next day is not the one just done', () => {
    // Lower A on Monday instead of Upper A. Wednesday is Upper B, not
    // Lower A again; Friday Lower B; Saturday wraps to Upper A.
    const swaps = { [MON]: 1 };
    expect(sessionIndexFor(WED, 4, swaps)).toEqual({ index: 2, programmed: 1, rotatedFrom: MON });
    expect(sessionIndexFor(FRI, 4, swaps)).toEqual({ index: 3, programmed: 2, rotatedFrom: MON });
    expect(sessionIndexFor(SAT, 4, swaps)).toEqual({ index: 0, programmed: 3, rotatedFrom: MON });
  });

  it('keeps the pattern order from the swapped session forward', () => {
    // Full body C on Monday (of A, B, C): Wednesday A, Friday B.
    const swaps = { [MON]: 2 };
    expect(sessionIndexFor(WED, 3, swaps).index).toBe(0);
    expect(sessionIndexFor(FRI, 3, swaps).index).toBe(1);
  });

  it('leaves the days before the swap as they were', () => {
    const swaps = { [WED]: 3 };
    expect(sessionIndexFor(MON, 4, swaps)).toEqual({ index: 0, programmed: 0 });
    expect(sessionIndexFor(TUE, 4, swaps)).toEqual({ index: 1, programmed: 1 });
  });

  it('never carries a swap into another week, in either direction', () => {
    expect(sessionIndexFor(NEXT_MON, 4, { [MON]: 3 })).toEqual({ index: 0, programmed: 0 });
    expect(sessionIndexFor(NEXT_WED, 4, { [SAT]: 0 })).toEqual({ index: 1, programmed: 1 });
    expect(sessionIndexFor(MON, 4, { [LAST_FRI]: 3 })).toEqual({ index: 0, programmed: 0 });
    // Sunday opens the cycle: a Sunday swap reaches Monday, a Saturday swap does not reach Sunday.
    expect(sessionIndexFor(MON, 4, { [SUN]: 2 }).rotatedFrom).toBe(SUN);
    expect(sessionIndexFor(SUN, 4, { [LAST_FRI]: 2 }).rotatedFrom).toBeUndefined();
  });

  it('restarts the order from a later swap in the same week', () => {
    const swaps = { [MON]: 1, [WED]: 0 };
    // Wednesday's own swap wins on Wednesday, and Friday follows Wednesday, not Monday.
    expect(sessionIndexFor(WED, 4, swaps)).toEqual({ index: 0, programmed: 1 });
    expect(sessionIndexFor(FRI, 4, swaps)).toEqual({ index: 1, programmed: 2, rotatedFrom: WED });
  });

  it('still moves on when the next day shares the programme’s pick with the swapped one', () => {
    // Three sessions over a Mon/Tue/Thu week: Monday and Tuesday both map
    // to the first session. Lower on Monday must not give Lower on Tuesday.
    const swaps = { [MON]: 1 };
    expect(programmedSessionIndex(TUE, 3)).toBe(programmedSessionIndex(MON, 3));
    expect(sessionIndexFor(TUE, 3, swaps).index).toBe(2);
    // Thursday is one step on from Monday in the programme's order, the
    // same step Tuesday took: the programme itself repeats a session on a
    // week with more training days than sessions, and the rotation does
    // not pretend otherwise.
    expect(sessionIndexFor(THU, 3, swaps).index).toBe(2);
    expect(sessionIndexFor(FRI, 3, swaps).index).toBe(0);
  });

  it('puts the day back to the order when its own swap is cleared', () => {
    const { [WED]: _cleared, ...rest } = { [MON]: 1, [WED]: 0 };
    expect(sessionIndexFor(WED, 4, rest)).toEqual({ index: 2, programmed: 1, rotatedFrom: MON });
  });

  it('never points past the last session, even from a stale swap saved against a bigger block', () => {
    expect(sessionIndexFor(MON, 2, { [MON]: 4 }).index).toBe(1);
    expect(sessionIndexFor(WED, 2, { [MON]: 4 }).index).toBe(0);
  });
});
