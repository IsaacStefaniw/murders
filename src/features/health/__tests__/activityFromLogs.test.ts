/**
 * A week of training that was never ticked is not a week of nothing.
 *
 * Isaac, 11 Nov 2026: "My app is showing 0 minutes of physical
 * activity." He trains four times a week and has for twenty years.
 *
 * The zero was behaving exactly as designed. `activityMinutes` read
 * `plans` — what was PLANNED and then ticked — and `cardioLogs`. It did
 * not read `workoutLogs`, which is what actually HAPPENED, set by set,
 * each one timestamped. A session logged in /session/workout and left
 * without pressing finish lived entirely in the second and counted as
 * nothing in the first, while sessionTiming.ts computed real rest
 * intervals from those very timestamps.
 */

import { activityMinutes, workoutMinutes } from '@/features/health/essential8';
import type { DailyPlan, Routine, WorkoutLog } from '@/types/domain';

const TODAY = '2026-11-11';

const log = (date: string, over: Partial<WorkoutLog> = {}): WorkoutLog => ({
  id: `w-${date}`,
  date,
  title: 'Chest, shoulders & back A',
  sets: [0, 2, 4, 6].map((i) => ({
    id: `s${i}`,
    exercise: 'Bench press',
    index: i + 1,
    reps: 5,
    weightKg: 110,
    at: new Date(Date.parse(`${date}T02:20:00.000Z`) + i * 120000).toISOString(),
  })),
  createdAt: `${date}T02:20:00.000Z`,
  updatedAt: `${date}T02:50:00.000Z`,
  ...over,
});

/** A plan with items but nothing completed — his actual situation. */
const planWithNothingDone = (date: string): Record<string, DailyPlan> => ({
  [date]: {
    date,
    items: [
      {
        id: 'i1',
        title: 'Protein at breakfast',
        area: 'health',
        start: '06:35',
        end: '06:45',
        tier: 'should',
        status: 'planned',
      },
    ],
  } as DailyPlan,
});

const routines: Routine[] = [];

describe('his bug', () => {
  it('counted a logged session as zero before, and does not now', () => {
    const plans = planWithNothingDone(TODAY);
    // Nothing ticked. Four sessions logged across the week.
    const logs = ['2026-11-05', '2026-11-07', '2026-11-09', TODAY].map((d) =>
      log(d, { durationMin: 32 }),
    );
    expect(activityMinutes(plans, routines, TODAY, [], [])).toBe(0);
    expect(activityMinutes(plans, routines, TODAY, [], logs)).toBe(128);
  });

  it('still reads null when the app was watching nothing at all', () => {
    // The distinction the function already defended: a week with no plan
    // and no logs is not a measured zero, it is no measurement.
    expect(activityMinutes({}, routines, TODAY, [], [])).toBeNull();
  });

  it('counts a logged session even with no plan behind it', () => {
    expect(activityMinutes({}, routines, TODAY, [], [log(TODAY, { durationMin: 45 })])).toBe(45);
  });
});

describe('not counted twice', () => {
  it('skips the log on a day whose workout item was already ticked', () => {
    const plans: Record<string, DailyPlan> = {
      [TODAY]: {
        date: TODAY,
        items: [
          {
            id: 'i1',
            title: 'Train',
            area: 'health',
            start: '12:15',
            end: '12:55',
            tier: 'should',
            status: 'completed',
            sessionType: 'workout',
          },
        ],
      } as DailyPlan,
    };
    // 40 minutes from the ticked block, and the log for the same day is
    // not added on top of it.
    expect(activityMinutes(plans, routines, TODAY, [], [])).toBe(40);
    expect(activityMinutes(plans, routines, TODAY, [], [log(TODAY, { durationMin: 32 })])).toBe(40);
  });

  it('still counts a log on a day whose completed item was NOT a workout', () => {
    const plans: Record<string, DailyPlan> = {
      [TODAY]: {
        date: TODAY,
        items: [
          {
            id: 'i1',
            title: 'The daily walk',
            area: 'health',
            start: '19:00',
            end: '19:35',
            tier: 'should',
            status: 'completed',
            sessionType: 'workout',
          },
        ],
      } as DailyPlan,
    };
    // A walk logged as a workout session blocks the lift on that day —
    // the conservative direction, and the one that cannot inflate.
    expect(activityMinutes(plans, routines, TODAY, [], [log(TODAY, { durationMin: 32 })])).toBe(35);
  });

  it('ignores sessions outside the seven-day window, and stays unwatched', () => {
    // Null rather than zero, and that is the stronger answer: an old
    // session is not evidence about THIS week, so the week was not
    // measured rather than measured as empty. I asserted 0 here first
    // and the code was right.
    expect(activityMinutes({}, routines, TODAY, [], [log('2026-10-01', { durationMin: 60 })])).toBeNull();
    // But a session inside the window does make the week watched.
    expect(
      activityMinutes({}, routines, TODAY, [], [
        log('2026-10-01', { durationMin: 60 }),
        log('2026-11-09', { durationMin: 30 }),
      ]),
    ).toBe(30);
  });
});

describe('how long a session counts for', () => {
  it('uses the measured duration where the session was finished', () => {
    expect(workoutMinutes(log(TODAY, { durationMin: 32 }))).toBe(32);
  });

  it('falls back to the span between first and last set, which understates', () => {
    // Four sets four minutes apart is a twelve-minute span — it misses
    // the warm-up and the final rest, and understating is the right
    // direction for a figure nobody confirmed.
    expect(workoutMinutes(log(TODAY))).toBe(12);
  });

  it('caps at three hours, so a screen left open is not an afternoon', () => {
    expect(workoutMinutes(log(TODAY, { durationMin: 600 }))).toBe(180);
  });

  it('returns zero rather than NaN for a session with one set or none', () => {
    expect(workoutMinutes(log(TODAY, { sets: [] }))).toBe(0);
    expect(workoutMinutes(log(TODAY, { sets: [log(TODAY).sets[0]] }))).toBe(0);
  });
});
