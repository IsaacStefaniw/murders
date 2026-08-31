import {
  bestE1rm,
  e1rmOf,
  lastPerformance,
  liftFor,
  makeSet,
  newLog,
  observationsFrom,
  recentLogs,
  suggestNext,
  volumeOf,
  weeklyVolume,
} from '@/features/training/log';
import type { LoggedSet, WorkoutLog } from '@/types/domain';

const set = (
  exercise: string,
  index: number,
  reps: number,
  weightKg?: number,
): LoggedSet => ({ ...makeSet(exercise, index, reps, weightKg), id: `${exercise}-${index}-${reps}` });

const log = (date: string, sets: LoggedSet[], title = 'Session'): WorkoutLog => ({
  ...newLog(date, title),
  id: `wl-${date}`,
  date,
  sets,
});

describe('liftFor', () => {
  it('recognises the main barbell lifts', () => {
    expect(liftFor('Bench press')).toBe('bench');
    expect(liftFor('Squat')).toBe('squat');
    expect(liftFor('Deadlift')).toBe('deadlift');
    expect(liftFor('Overhead press')).toBe('ohp');
  });

  /**
   * The reason this matcher is strict. A false negative costs one metric
   * reading. A false positive rewrites the baseline that every future
   * prescription is computed from, and the person never learns why their
   * loads went strange.
   */
  it('refuses the variations that share a word but are not the lift', () => {
    for (const name of [
      'Romanian deadlift',
      'Split squats',
      'Goblet squats',
      'Air squats',
      'Front squat',
      'Bulgarian split squat',
      'Dumbbell bench press',
      'Incline bench press',
      'Pike push-ups',
      'Push-ups (loaded)',
    ]) {
      expect(liftFor(name)).toBeNull();
    }
  });

  it('claims nothing for accessories and cardio', () => {
    for (const name of ['Lat pulldown', 'Curls / band pulls', 'Core: plank', 'Hill strides']) {
      expect(liftFor(name)).toBeNull();
    }
  });
});

describe('e1rmOf', () => {
  it('estimates from a loaded set', () => {
    expect(e1rmOf(set('Bench press', 1, 5, 100))).toBe(116.5);
  });

  it('returns a single rep at its own weight', () => {
    expect(e1rmOf(set('Bench press', 1, 1, 120))).toBe(120);
  });

  /**
   * Past about twelve reps Epley drifts badly. A 20-rep set is an endurance
   * fact; treating it as a strength estimate would inflate the baseline the
   * next block is built from.
   */
  it('makes no strength claim from a high-rep set', () => {
    expect(e1rmOf(set('Squat', 1, 20, 60))).toBeNull();
  });

  it('makes no claim for bodyweight work', () => {
    expect(e1rmOf(set('Push-ups', 1, 15))).toBeNull();
  });
});

describe('lastPerformance', () => {
  const logs = [
    log('2026-03-02', [set('Bench press', 1, 5, 90), set('Bench press', 2, 5, 90)]),
    log('2026-03-09', [set('Bench press', 1, 5, 95), set('Bench press', 2, 4, 95)]),
    log('2026-03-16', [set('Squat', 1, 5, 120)]),
  ];

  /**
   * "Last time" means the last session, not the best session. A personal
   * best from months ago is not a starting point for today.
   */
  it('reads the most recent session containing the exercise', () => {
    const last = lastPerformance(logs, 'Bench press')!;
    expect(last.date).toBe('2026-03-09');
    expect(last.set.weightKg).toBe(95);
    expect(last.sets.map((s) => s.reps)).toEqual([5, 4]);
  });

  it('can exclude the session being edited, so it does not cite itself', () => {
    const last = lastPerformance(logs, 'Bench press', 'wl-2026-03-09')!;
    expect(last.date).toBe('2026-03-02');
  });

  it('has nothing to say about an exercise never performed', () => {
    expect(lastPerformance(logs, 'Deadlift')).toBeNull();
  });
});

describe('suggestNext', () => {
  it('adds load only when every prescribed rep was hit', () => {
    const logs = [log('2026-03-09', [set('Bench press', 1, 5, 95), set('Bench press', 2, 5, 95)])];
    const next = suggestNext(logs, 'Bench press', 5, 2)!;
    expect(next.weightKg).toBe(97.5);
    expect(next.increased).toBe(true);
  });

  /**
   * The case a naive "add 2.5 kg a week" rule turns into a stall and then
   * an injury: reps fell off partway, so the load repeats.
   */
  it('repeats the load when the reps fell off', () => {
    const logs = [log('2026-03-09', [set('Bench press', 1, 5, 95), set('Bench press', 2, 3, 95)])];
    const next = suggestNext(logs, 'Bench press', 5, 2)!;
    expect(next.weightKg).toBe(95);
    expect(next.increased).toBe(false);
  });

  it('steps lower-body lifts by 5 and upper by 2.5', () => {
    const squats = [log('2026-03-09', [set('Squat', 1, 5, 120), set('Squat', 2, 5, 120)])];
    expect(suggestNext(squats, 'Squat', 5, 2)!.weightKg).toBe(125);
  });

  it('suggests nothing without history to suggest from', () => {
    expect(suggestNext([], 'Bench press', 5, 3)).toBeNull();
  });
});

describe('observationsFrom', () => {
  it('writes one reading per main lift, taking that session best', () => {
    const session = log('2026-03-09', [
      set('Bench press', 1, 5, 90),
      set('Bench press', 2, 5, 95),
      set('Squat', 1, 5, 120),
    ]);
    const obs = observationsFrom(session);
    expect(obs).toHaveLength(2);
    const bench = obs.find((o) => o.key === 'strength.bench.e1rm')!;
    expect(bench.value).toBe(111); // the 95 kg set, not the 90
  });

  /**
   * A session of accessories and variations is a real session that makes no
   * strength claim. The silence is the correct output, not a gap.
   */
  it('produces nothing when no unambiguous main lift was performed', () => {
    const session = log('2026-03-09', [
      set('Goblet squats', 1, 12, 24),
      set('Lat pulldown', 1, 10, 50),
      set('Romanian deadlift', 1, 8, 80),
    ]);
    expect(observationsFrom(session)).toEqual([]);
  });
});

describe('volume', () => {
  it('sums kg by reps and ignores bodyweight work', () => {
    expect(volumeOf([set('Squat', 1, 5, 100), set('Push-ups', 1, 20)])).toBe(500);
  });

  it('buckets into weeks, oldest first', () => {
    const now = new Date('2026-03-16T12:00:00');
    const logs = [
      log('2026-03-16', [set('Squat', 1, 5, 100)]),
      log('2026-03-09', [set('Squat', 1, 5, 80)]),
    ];
    const weeks = weeklyVolume(logs, 2, now);
    expect(weeks).toHaveLength(2);
    expect(weeks[1].volume).toBe(500);
    expect(weeks[1].sessions).toBe(1);
  });
});

describe('bestE1rm', () => {
  it('finds the standing record across all history', () => {
    const logs = [
      log('2026-03-02', [set('Bench press', 1, 5, 90)]),
      log('2026-03-09', [set('Bench press', 1, 3, 105)]),
    ];
    const best = bestE1rm(logs, 'Bench press')!;
    expect(best.date).toBe('2026-03-09');
    expect(best.value).toBe(115.5);
  });
});

describe('date handling', () => {
  /**
   * `log.date` is a LOCAL date key. Slicing an ISO string to build a cutoff
   * compares a UTC date against a local one, which east of Greenwich is a
   * different day for most of the working morning — every week boundary off
   * by one, silently, on exactly the timezone this app is being built in.
   */
  it('buckets by local dates, not UTC ones', () => {
    // 09:00 in a UTC+11 zone is the previous day in UTC.
    const morning = new Date('2026-03-16T09:00:00+11:00');
    const todayLocal = `${morning.getFullYear()}-${String(morning.getMonth() + 1).padStart(2, '0')}-${String(morning.getDate()).padStart(2, '0')}`;
    const logs = [log(todayLocal, [set('Squat', 1, 5, 100)])];

    // Today's session belongs to the newest week and to a 7-day window.
    const weeks = weeklyVolume(logs, 2, morning);
    expect(weeks[weeks.length - 1].sessions).toBe(1);
    expect(recentLogs(logs, 7, morning)).toHaveLength(1);
  });

  it('excludes a session that really is outside the window', () => {
    const now = new Date('2026-03-16T09:00:00');
    expect(recentLogs([log('2026-01-01', [set('Squat', 1, 5, 100)])], 7, now)).toHaveLength(0);
  });
});
