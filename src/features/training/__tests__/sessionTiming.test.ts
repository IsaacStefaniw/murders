/**
 * Rest, measured from the timestamps that were always there.
 *
 * The session under test is the one Isaac actually did on 10 Nov, built
 * from his own exercises and set counts: bench 4, pulldowns 4, then
 * incline cable alternated with close-grip push-ups for three rounds.
 */

import {
  restLine,
  sessionTiming,
  SUPERSET_MAX_SEC,
  timingOf,
} from '@/features/training/sessionTiming';
import type { LoggedSet, WorkoutLog } from '@/types/domain';

const T0 = Date.parse('2026-11-10T02:20:00.000Z');

/** [exercise, seconds from T0, repsIndex] */
const set = (exercise: string, offsetSec: number, index = 1): LoggedSet => ({
  id: `${exercise}-${offsetSec}`,
  exercise,
  index,
  reps: 5,
  weightKg: 100,
  at: new Date(T0 + offsetSec * 1000).toISOString(),
});

/**
 * His session: four bench sets at two minutes apart, four pulldowns at
 * ninety seconds, then three incline/push-up pairs where the pair is
 * immediate and the rounds are ninety seconds apart.
 */
function hisSession(): LoggedSet[] {
  const out: LoggedSet[] = [];
  let t = 0;
  for (let i = 1; i <= 4; i += 1) {
    out.push(set('Bench press', t, i));
    t += 120;
  }
  for (let i = 1; i <= 4; i += 1) {
    out.push(set('Lat pulldown', t, i));
    t += 90;
  }
  for (let i = 1; i <= 3; i += 1) {
    out.push(set('Incline cable press', t, i));
    t += 20; // straight into the paired movement
    out.push(set('Close-grip push-ups', t, i));
    t += 90;
  }
  return out;
}

describe('rest is measured, not estimated', () => {
  it('separates the superset changes from the rests', () => {
    const t = sessionTiming(hisSession())!;
    // 14 sets -> 13 gaps, three of which are the paired changes.
    expect(t.gaps).toHaveLength(13);
    expect(t.supersetCount).toBe(3);
    expect(t.restCount).toBe(10);
  });

  it('gives the ten rests I had to guess at, as numbers', () => {
    const t = sessionTiming(hisSession())!;
    // 3 bench gaps at 120, the change into pulldowns at 120, 3 pulldown
    // gaps at 90, the change into the superset at 90, 2 round gaps at 90.
    expect(t.avgRestSec).toBe(102);
    expect(t.medianRestSec).toBe(90);
    expect(t.longestRestSec).toBe(120);
    expect(t.shortestRestSec).toBe(90);
  });

  it('spans first set to last set and nothing before it', () => {
    const t = sessionTiming(hisSession())!;
    // The warm-up bike is outside this window on purpose: a warm-up is
    // not rest between sets, which is why the start time was never the
    // number needed.
    expect(t.spanSec).toBe(3 * 120 + 120 + 3 * 90 + 90 + 3 * 20 + 2 * 90);
    expect(t.firstSetAt).toBe(new Date(T0).toISOString());
  });

  it('does not count a superset change as a 20-second rest', () => {
    const t = sessionTiming(hisSession())!;
    expect(t.gaps.filter((g) => g.kind === 'rest').every((g) => g.seconds >= 90)).toBe(true);
    expect(t.gaps.filter((g) => g.kind === 'superset').every((g) => g.seconds === 20)).toBe(true);
  });
});

describe('the two things that would make the mean lie', () => {
  it('reports a median that survives one long interruption', () => {
    const sets = [
      set('Bench press', 0, 1),
      set('Bench press', 120, 2),
      set('Bench press', 240, 3),
      // A queue for the rack. Eight minutes.
      set('Bench press', 240 + 480, 4),
    ];
    const t = sessionTiming(sets)!;
    expect(t.medianRestSec).toBe(120);
    expect(t.avgRestSec).toBe(240);
    // And the copy has to say which one to believe.
    expect(restLine(t)).toMatch(/2:00 typical/);
    expect(restLine(t)).toMatch(/one gap was much longer/);
  });

  it('says one number when the mean and the median agree', () => {
    const t = sessionTiming(hisSession())!;
    expect(restLine(t)).toMatch(/1:30 typical/);
    expect(restLine(t)).not.toMatch(/one gap was much longer/);
    expect(restLine(t)).toMatch(/3 superset changes not counted as rest/);
  });

  it('counts two close sets of the SAME exercise as a short rest, not a superset', () => {
    // A rushed pair of bench sets is a short rest and should drag the
    // average down, because it really happened.
    const t = sessionTiming([set('Bench press', 0, 1), set('Bench press', 20, 2)])!;
    expect(t.restCount).toBe(1);
    expect(t.supersetCount).toBe(0);
    expect(t.avgRestSec).toBe(20);
  });
});

describe('the ordering trap', () => {
  it('orders by timestamp, never by index', () => {
    // `LoggedSet.index` is the position WITHIN an exercise, so index order
    // interleaves the movements and computes gaps between sets that never
    // followed one another. These are handed over in index order.
    const sets = [
      set('Bench press', 0, 1),
      set('Lat pulldown', 300, 1),
      set('Bench press', 120, 2),
      set('Lat pulldown', 420, 2),
    ];
    const t = sessionTiming(sets)!;
    expect(t.gaps.map((g) => g.seconds)).toEqual([120, 180, 120]);
    expect(t.gaps.map((g) => `${g.after}>${g.before}`)).toEqual([
      'Bench press>Bench press',
      'Bench press>Lat pulldown',
      'Lat pulldown>Lat pulldown',
    ]);
  });
});

describe('what it refuses to do', () => {
  it('returns null rather than timing a single set', () => {
    expect(sessionTiming([set('Bench press', 0)])).toBeNull();
    expect(sessionTiming([])).toBeNull();
  });

  it('drops a set whose timestamp will not parse instead of producing NaN', () => {
    const broken = { ...set('Bench press', 0), at: 'not a date' } as LoggedSet;
    expect(sessionTiming([broken, set('Bench press', 120, 2)])).toBeNull();
    const t = sessionTiming([broken, set('Bench press', 120, 2), set('Bench press', 240, 3)])!;
    expect(t.avgRestSec).toBe(120);
  });

  it('never returns a negative gap, whatever order the clock went in', () => {
    const t = sessionTiming([set('Bench press', 0, 1), set('Bench press', 120, 2)])!;
    expect(t.gaps.every((g) => g.seconds >= 0)).toBe(true);
    expect(t.spanSec).toBeGreaterThanOrEqual(0);
  });

  it('reads a whole log through timingOf', () => {
    const log: WorkoutLog = {
      id: 'a',
      date: '2026-11-10',
      title: 'Chest, shoulders & back A',
      sets: hisSession(),
      createdAt: new Date(T0).toISOString(),
      updatedAt: new Date(T0).toISOString(),
    };
    expect(timingOf(log)?.restCount).toBe(10);
  });

  it('holds the superset threshold below the shortest prescribed rest', () => {
    // ACCESSORIES prescribes 60s at its shortest, so anything under 45
    // between two different movements was not somebody resting.
    expect(SUPERSET_MAX_SEC).toBeLessThan(60);
  });
});
