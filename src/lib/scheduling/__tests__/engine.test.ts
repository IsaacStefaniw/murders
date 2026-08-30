import {
  buildDailyPlan,
  computeFreeWindows,
  placeRoutines,
  shortenWorkout,
  type DayContext,
} from '@/lib/scheduling/engine';
import { toMinutes } from '@/lib/dates';
import type { Routine } from '@/types/domain';

function routine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: overrides.id ?? 'r1',
    title: 'Strength workout',
    area: 'health',
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 45,
    preferredStart: '12:15',
    preferredEnd: '14:00',
    energy: 'midday',
    flexible: true,
    protected: false,
    tier: 'should',
    active: true,
    ...overrides,
  };
}

describe('computeFreeWindows', () => {
  it('returns the whole waking day when there are no commitments', () => {
    const windows = computeFreeWindows([], '06:30', '22:30', 0);
    expect(windows).toEqual([{ start: toMinutes('06:30'), end: toMinutes('22:30') }]);
  });

  it('carves out fixed commitments with buffer on both sides', () => {
    const windows = computeFreeWindows(
      [{ title: 'Meeting', start: '09:00', end: '10:00' }],
      '07:00',
      '22:00',
      15,
    );
    expect(windows).toHaveLength(2);
    expect(windows[0]).toEqual({ start: toMinutes('07:00'), end: toMinutes('08:45') });
    expect(windows[1]).toEqual({ start: toMinutes('10:15'), end: toMinutes('22:00') });
  });

  it('merges overlapping commitments and drops sliver windows', () => {
    const windows = computeFreeWindows(
      [
        { title: 'A', start: '09:00', end: '10:00' },
        { title: 'B', start: '09:30', end: '11:00' },
        { title: 'C', start: '11:05', end: '12:00' },
      ],
      '08:00',
      '20:00',
      0,
    );
    // Gap between B and C is only 5 minutes — not a usable window.
    expect(windows).toEqual([
      { start: toMinutes('08:00'), end: toMinutes('09:00') },
      { start: toMinutes('12:00'), end: toMinutes('20:00') },
    ]);
  });

  it('handles a sleep time after midnight', () => {
    const windows = computeFreeWindows([], '22:00', '01:00', 0);
    expect(windows[0].end - windows[0].start).toBe(180);
  });
});

describe('placeRoutines', () => {
  it('places a routine inside its preferred window', () => {
    const windows = computeFreeWindows([], '06:00', '22:00', 0);
    const { placements } = placeRoutines(windows, [routine()], 0);
    expect(placements).toHaveLength(1);
    expect(placements[0].start).toBe(toMinutes('12:15'));
  });

  it('falls back to the nearest window when the preferred slot is taken and routine is flexible', () => {
    const windows = computeFreeWindows(
      [{ title: 'Lunch meeting', start: '12:00', end: '14:30' }],
      '06:00',
      '22:00',
      0,
    );
    const { placements, unplaced } = placeRoutines(windows, [routine()], 0);
    expect(unplaced).toHaveLength(0);
    // Nearest usable start to the 12:15 preference is just before the meeting.
    expect(placements[0].start).toBe(toMinutes('11:15'));
    expect(placements[0].end).toBeLessThanOrEqual(toMinutes('12:00'));
  });

  it('drops an inflexible routine that cannot start in its preferred window', () => {
    const windows = computeFreeWindows(
      [{ title: 'All-day offsite', start: '08:00', end: '18:00' }],
      '06:00',
      '22:00',
      0,
    );
    const { placements, unplaced } = placeRoutines(
      windows,
      [routine({ flexible: false })],
      0,
    );
    expect(placements).toHaveLength(0);
    expect(unplaced.map((r) => r.id)).toEqual(['r1']);
  });

  it('never overlaps placements and respects the buffer between them', () => {
    const windows = computeFreeWindows([], '06:00', '22:00', 15);
    const routines = [
      routine({ id: 'a', preferredStart: '12:00', preferredEnd: '13:00' }),
      routine({ id: 'b', preferredStart: '12:00', preferredEnd: '18:00' }),
    ];
    const { placements } = placeRoutines(windows, routines, 15);
    expect(placements).toHaveLength(2);
    const [first, second] = placements;
    expect(second.start - first.end).toBeGreaterThanOrEqual(15);
  });

  it('places protected routines before lower priority ones when space is scarce', () => {
    // Only one evening window big enough for one activity.
    const windows = [{ start: toMinutes('18:00'), end: toMinutes('19:00') }];
    const dinner = routine({
      id: 'dinner',
      title: 'Family dinner',
      area: 'family',
      protected: true,
      tier: 'must',
      preferredStart: '18:00',
      preferredEnd: '18:30',
      durationMin: 45,
    });
    const scroll = routine({
      id: 'gym',
      preferredStart: '18:00',
      preferredEnd: '18:30',
      durationMin: 45,
    });
    const { placements, unplaced } = placeRoutines(windows, [scroll, dinner], 0);
    expect(placements.map((p) => p.routine.id)).toEqual(['dinner']);
    expect(unplaced.map((r) => r.id)).toEqual(['gym']);
  });
});

describe('buildDailyPlan', () => {
  const baseCtx: DayContext = {
    date: '2026-09-01', // a Tuesday
    wakeTime: '06:00',
    sleepTime: '22:15',
    fixed: [
      { title: 'Leadership meeting', start: '09:00', end: '10:00' },
      { title: 'Critical work task', start: '11:30', end: '12:00' },
    ],
    routines: [
      routine({ id: 'gym', tier: 'should' }),
      routine({
        id: 'dinner',
        title: 'Family dinner',
        area: 'family',
        protected: true,
        tier: 'must',
        preferredStart: '18:00',
        preferredEnd: '18:30',
        flexible: false,
      }),
    ],
  };

  it('produces a chronologically sorted plan containing fixed and flexible items', () => {
    const plan = buildDailyPlan(baseCtx);
    const titles = plan.items.map((i) => i.title);
    expect(titles).toEqual([
      'Leadership meeting',
      'Critical work task',
      'Strength workout',
      'Family dinner',
    ]);
    for (let i = 1; i < plan.items.length; i++) {
      expect(toMinutes(plan.items[i].start)).toBeGreaterThanOrEqual(
        toMinutes(plan.items[i - 1].end),
      );
    }
  });

  it('marks fixed commitments as must-tier and immovable', () => {
    const plan = buildDailyPlan(baseCtx);
    const meeting = plan.items.find((i) => i.title === 'Leadership meeting')!;
    expect(meeting.tier).toBe('must');
    expect(meeting.fixed).toBe(true);
  });

  it('skips routines not scheduled for that weekday', () => {
    const plan = buildDailyPlan({
      ...baseCtx,
      routines: [routine({ id: 'sat-only', days: [6] })],
    });
    expect(plan.items.every((i) => i.routineId !== 'sat-only')).toBe(true);
  });

  it('leaves reserved free time rather than packing the day', () => {
    // Ten one-hour "could" routines into a ~16h day with 25% reserved: some must be dropped.
    const many = Array.from({ length: 10 }, (_, i) =>
      routine({
        id: `r${i}`,
        tier: 'could',
        durationMin: 90,
        preferredStart: '06:30',
        preferredEnd: '21:00',
      }),
    );
    const plan = buildDailyPlan({ ...baseCtx, routines: many });
    expect(plan.unplaced.length).toBeGreaterThan(0);
  });

  it('always keeps protected routines even when the day is over budget', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      routine({ id: `r${i}`, tier: 'should', durationMin: 90, preferredStart: '06:30', preferredEnd: '21:00' }),
    );
    const plan = buildDailyPlan({
      ...baseCtx,
      routines: [...many, baseCtx.routines[1]],
    });
    expect(plan.items.some((i) => i.title === 'Family dinner')).toBe(true);
  });
});

describe('fresh-start framing', () => {
  it('frames Mondays as a fresh week', () => {
    const plan = buildDailyPlan({ ...baseCtxFor('2026-09-07'), routines: [] }); // a Monday
    expect(plan.summary).toMatch(/^Fresh week\./);
  });

  it('frames the first of the month as a new month', () => {
    const plan = buildDailyPlan({ ...baseCtxFor('2026-10-01'), routines: [] });
    expect(plan.summary).toMatch(/^A new month\./);
  });

  it('leaves ordinary days unframed', () => {
    const plan = buildDailyPlan({ ...baseCtxFor('2026-09-09'), routines: [] }); // a Wednesday
    expect(plan.summary).not.toMatch(/Fresh week|new month/);
  });

  function baseCtxFor(date: string): DayContext {
    return { date, wakeTime: '06:00', sleepTime: '22:15', fixed: [], routines: [] };
  }
});

describe('shortenWorkout', () => {
  it('keeps the full session when time allows', () => {
    expect(shortenWorkout(60, 90)).toEqual({ durationMin: 60, note: 'Full session.' });
  });

  it('condenses the session to the available time', () => {
    const result = shortenWorkout(60, 26);
    expect(result?.durationMin).toBe(25);
  });

  it('returns null when there is no meaningful time left', () => {
    expect(shortenWorkout(60, 10)).toBeNull();
  });
});
