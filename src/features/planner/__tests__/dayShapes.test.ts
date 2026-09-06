/**
 * The shapes of a real week, one per market.
 *
 * Every row here is a person the interview offers a place to: the
 * nine-to-five, the three shifts, the roster, the carer with a school run,
 * the retiree with a volunteering morning, the student with a timetable.
 * The same three things must hold for all of them: the fixed part of the
 * day is on the plan, nothing placed ever overlaps anything, and every
 * routine due that day is either on the plan or named in `unplaced`.
 */

import { buildDailyPlan } from '@/lib/scheduling/engine';
import { generateDailyPlan } from '@/features/planner/generate';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import { durationMinutes, toMinutes, weekdayOf } from '@/lib/dates';
import type { DailyPlan, LifeProfile, PlanItem, Routine, Weekday } from '@/types/domain';

const ALL: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const TUESDAY = '2026-09-01';
const MONDAY = '2026-09-07';
const FRIDAY = '2026-09-04';
const SATURDAY = '2026-09-05';

const base: LifeProfile = {
  firstName: 'Sam',
  priorities: ['family', 'health', 'work'],
  people: [],
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  capacity: 'steady',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  createdAt: '',
  updatedAt: '',
};

/** The everyday practice set, anchored to this person's own day. */
function everyday(profile: LifeProfile): Routine[] {
  const fromLibrary = ['morning-light', 'strength', 'daily-walk', 'wind-down', 'protein-breakfast'].map(
    (id) => ({ ...toRoutine(protocolById(id)!, profile), days: ALL }),
  );
  const dinner: Routine = {
    id: 'dinner',
    title: 'Family dinner',
    area: 'family',
    days: ALL,
    durationMin: 45,
    preferredStart: '18:00',
    preferredEnd: '18:45',
    energy: 'evening',
    flexible: false,
    protected: true,
    tier: 'must',
    active: true,
  };
  return [...fromLibrary, dinner];
}

/** Start and end in minutes, unwrapped past midnight for a day that crosses it. */
function span(item: Pick<PlanItem, 'start' | 'end'>, dayStart: number) {
  const raw = toMinutes(item.start);
  const start = raw < dayStart ? raw + 1440 : raw;
  return { start, end: start + durationMinutes(item.start, item.end) };
}

function expectNoOverlaps(items: PlanItem[], dayStart = 0) {
  const live = items.filter((i) => i.status !== 'skipped');
  const spans = live.map((i) => ({ title: i.title, ...span(i, dayStart) })).sort((a, b) => a.start - b.start);
  for (let i = 1; i < spans.length; i += 1) {
    expect({ prev: spans[i - 1].title, next: spans[i].title, clash: spans[i].start < spans[i - 1].end }).toEqual({
      prev: spans[i - 1].title,
      next: spans[i].title,
      clash: false,
    });
  }
}

function expectPlacedWithinDay(items: PlanItem[], profile: LifeProfile) {
  const wake = toMinutes(profile.wakeTime);
  const sleepRaw = toMinutes(profile.sleepTime);
  const sleep = sleepRaw <= wake ? sleepRaw + 1440 : sleepRaw;
  for (const item of items.filter((i) => !i.fixed)) {
    const s = span(item, wake);
    expect({ title: item.title, start: item.start, inside: s.start >= wake && s.end <= sleep }).toEqual({
      title: item.title,
      start: item.start,
      inside: true,
    });
  }
}

/** Every routine due today is on the plan or named in `unplaced`; never silently gone. */
function expectAccounted(plan: DailyPlan & { unplaced: Routine[] }, routines: Routine[], date: string) {
  const weekday = weekdayOf(date);
  const due = routines.filter((r) => r.active && r.days.includes(weekday));
  const placed = new Set(plan.items.map((i) => i.routineId));
  const reported = new Set(plan.unplaced.map((r) => r.id));
  for (const r of due) {
    expect({ title: r.title, accounted: placed.has(r.id) || reported.has(r.id) }).toEqual({
      title: r.title,
      accounted: true,
    });
  }
}

const blocksOf = (plan: DailyPlan) =>
  plan.items.filter((i) => i.fixed).map((i) => `${i.title} ${i.start}-${i.end}`);

describe('A1 employed, nine to half five', () => {
  const routines = everyday(base);
  const plan = generateDailyPlan(base, routines, TUESDAY);

  it('has the work day on the plan, split around lunch', () => {
    expect(blocksOf(plan)).toEqual(['Work 09:00-12:00', 'Work 13:30-17:30']);
  });

  it('never overlaps and stays inside the waking day', () => {
    expectNoOverlaps(plan.items);
    expectPlacedWithinDay(plan.items, base);
  });

  it('accounts for every routine due today', () => {
    expectAccounted(plan, routines, TUESDAY);
  });
});

describe('A2 early shift, five till one, up at half four', () => {
  const profile: LifeProfile = { ...base, workStart: '05:00', workEnd: '13:00', wakeTime: '04:30', sleepTime: '20:30' };
  const routines = everyday(profile);
  const plan = generateDailyPlan(profile, routines, TUESDAY);

  it('is one block with no lunch carved out of it', () => {
    expect(blocksOf(plan)).toEqual(['Work 05:00-13:00']);
  });

  it('never overlaps, stays inside the day, and reports what the shift squeezed out', () => {
    expectNoOverlaps(plan.items);
    expectPlacedWithinDay(plan.items, profile);
    expectAccounted(plan, routines, TUESDAY);
  });
});

describe('A3 late shift, two till ten, night-owl sleep', () => {
  const profile: LifeProfile = { ...base, workStart: '14:00', workEnd: '22:00', wakeTime: '08:30', sleepTime: '00:30' };
  const routines = everyday(profile);
  const plan = generateDailyPlan(profile, routines, TUESDAY);

  it('is one block, no lunch carve, since the shift starts after lunch', () => {
    expect(blocksOf(plan)).toEqual(['Work 14:00-22:00']);
  });

  it('reports the protected dinner rather than placing it over the shift', () => {
    // A must-tier, inflexible dinner at 18:00 cannot happen during a
    // 14:00–22:00 shift. The honest answer is "did not fit", not a dinner
    // drawn on top of work. (A roster per day is known open, brief item 2.)
    expect(plan.items.some((i) => i.title === 'Family dinner')).toBe(false);
    expect(plan.unplaced.map((r) => r.title)).toContain('Family dinner');
    expectNoOverlaps(plan.items);
    expectPlacedWithinDay(plan.items, profile);
    expectAccounted(plan, routines, TUESDAY);
  });
});

describe('A4 night shift, the hours cross midnight', () => {
  // Monday to Thursday nights, 22:00 to 06:00. The wake and sleep times are
  // the day-off pattern the interview asks for.
  const profile: LifeProfile = { ...base, workDays: [1, 2, 3, 4], workStart: '22:00', workEnd: '06:00' };
  const routines = everyday(profile);

  it('puts the evening of the shift on the night it starts', () => {
    const plan = generateDailyPlan(profile, routines, MONDAY);
    expect(blocksOf(plan)).toEqual(['Work 22:00-00:00']);
  });

  it('puts the morning of the shift on the day it ends, and the next evening after it', () => {
    const plan = generateDailyPlan(profile, routines, TUESDAY);
    expect(blocksOf(plan)).toEqual(['Work 00:00-06:00', 'Work 22:00-00:00']);
  });

  it('ends the week with the morning piece alone, and gives the weekend nothing', () => {
    expect(blocksOf(generateDailyPlan(profile, routines, FRIDAY))).toEqual(['Work 00:00-06:00']);
    expect(blocksOf(generateDailyPlan(profile, routines, SATURDAY))).toEqual([]);
  });

  it('places nothing over the shift and accounts for every routine', () => {
    for (const date of [MONDAY, TUESDAY, FRIDAY]) {
      const plan = generateDailyPlan(profile, routines, date);
      expectNoOverlaps(plan.items);
      expectAccounted(plan, routines, date);
    }
  });

  it('works for the interview’s own night option, 19:00 to 07:00', () => {
    const built = buildLifeOperatingPlan({
      name: 'Nia',
      priorities: ['health', 'family'],
      weekShape: 'shift',
      workDays: ['1', '2', '3', '4'],
      workHours: '19:00-07:00',
      sleep: '06:30-22:30',
      energy: 'evening',
      trainingDays: '3',
      capacity: 'steady',
    });
    const plan = generateDailyPlan(built.profile, built.routines, TUESDAY);
    expect(blocksOf(plan)).toEqual(['Work 00:00-07:00', 'Work 19:00-00:00']);
    expectNoOverlaps(plan.items);
  });
});

describe('A5 four on, four off', () => {
  // The profile can only say which weekdays; a rolling roster is known
  // open (brief item 2). What it can say must at least be right.
  const profile: LifeProfile = { ...base, workDays: [1, 2, 3, 4], workStart: '07:00', workEnd: '19:00' };
  const routines = everyday(profile);

  it('carves the on-days and leaves the off-days open', () => {
    expect(blocksOf(generateDailyPlan(profile, routines, MONDAY))).toEqual(['Work 07:00-12:00', 'Work 13:30-19:00']);
    expect(blocksOf(generateDailyPlan(profile, routines, FRIDAY))).toEqual([]);
  });

  it('holds the invariants on both kinds of day', () => {
    for (const date of [MONDAY, FRIDAY]) {
      const plan = generateDailyPlan(profile, routines, date);
      expectNoOverlaps(plan.items);
      expectPlacedWithinDay(plan.items, profile);
      expectAccounted(plan, routines, date);
    }
  });
});

describe('A6 a carer with a school run', () => {
  const profile: LifeProfile = { ...base, workDays: [1, 2, 3, 4, 5], workStart: '09:30', workEnd: '14:30', weekShape: 'caring' };
  const routines = everyday(profile);
  const fixed = [
    { title: 'School run', start: '08:20', end: '09:05', area: 'family' as const },
    { title: 'Caring', start: '09:30', end: '14:30', area: 'family' as const },
    { title: 'School run', start: '15:00', end: '15:40', area: 'family' as const },
  ];
  const plan = buildDailyPlan({
    date: TUESDAY,
    wakeTime: profile.wakeTime,
    sleepTime: profile.sleepTime,
    fixed,
    routines,
    priorities: profile.priorities,
  });

  it('keeps the runs and the caring hours as they are', () => {
    expect(blocksOf(plan)).toEqual(['School run 08:20-09:05', 'Caring 09:30-14:30', 'School run 15:00-15:40']);
  });

  it('fits the morning light in before the run and nothing on top of anything', () => {
    const light = plan.items.find((i) => i.title === 'Morning light');
    expect(light).toBeDefined();
    expect(toMinutes(light!.end)).toBeLessThanOrEqual(toMinutes('08:20'));
    expectNoOverlaps(plan.items);
    expectPlacedWithinDay(plan.items, profile);
  });
});

describe('A7 a retiree whose week has anchors, not a job', () => {
  const built = buildLifeOperatingPlan({
    name: 'Margaret',
    priorities: ['family', 'health', 'growth'],
    weekShape: 'retired',
    weekAnchors: ['volunteering', 'family'],
    sleep: '05:00-21:00',
    energy: 'morning',
    trainingDays: '3',
  });

  it('has no work blocks anywhere in the week', () => {
    for (let d = 0; d < 7; d += 1) {
      const date = `2026-09-0${1 + d}`;
      expect(blocksOf(generateDailyPlan(built.profile, built.routines, date))).toEqual([]);
    }
  });

  it('places the volunteering morning on Tuesday and the family day on Thursday, flexible', () => {
    const tuesday = generateDailyPlan(built.profile, built.routines, TUESDAY);
    const vol = tuesday.items.find((i) => i.title === 'Volunteering');
    expect(vol).toMatchObject({ start: '09:30', fixed: false });
    const thursday = generateDailyPlan(built.profile, built.routines, '2026-09-03');
    expect(thursday.items.find((i) => i.title === 'Time with family')).toMatchObject({ start: '10:00' });
  });

  it('never schedules after nine at night and never overlaps', () => {
    for (const date of [TUESDAY, '2026-09-03', SATURDAY]) {
      const plan = generateDailyPlan(built.profile, built.routines, date);
      expectNoOverlaps(plan.items);
      expectPlacedWithinDay(plan.items, built.profile);
      expectAccounted(plan, built.routines, date);
    }
  });
});

describe('A8 a student with a timetable', () => {
  const profile: LifeProfile = { ...base, workStart: '10:00', workEnd: '15:00', weekShape: 'study', wakeTime: '07:30', sleepTime: '23:15' };
  const routines = everyday(profile);
  const plan = generateDailyPlan(profile, routines, TUESDAY);

  it('splits the timetable around lunch', () => {
    expect(blocksOf(plan)).toEqual(['Work 10:00-12:00', 'Work 13:30-15:00']);
  });

  it('holds the invariants', () => {
    expectNoOverlaps(plan.items);
    expectPlacedWithinDay(plan.items, profile);
    expectAccounted(plan, routines, TUESDAY);
  });
});

describe('A9 a wake time after the sleep time', () => {
  // Up at ten at night, asleep at six in the morning: the waking day runs
  // 22:00 to 06:00. The engine unwraps it; nothing may overlap once the
  // same unwrapping is applied to what it produced.
  const profile: LifeProfile = { ...base, workDays: [], wakeTime: '22:00', sleepTime: '06:00' };
  const routines = everyday(profile);

  it('builds without throwing and keeps everything inside the waking span', () => {
    const plan = generateDailyPlan(profile, routines, TUESDAY);
    expect(plan.items.length).toBeGreaterThan(0);
    expectNoOverlaps(plan.items, toMinutes('22:00'));
    expectPlacedWithinDay(plan.items, profile);
    expectAccounted(plan, routines, TUESDAY);
  });
});

describe('A10 hours that end when they start', () => {
  const profile: LifeProfile = { ...base, workStart: '09:00', workEnd: '09:00' };

  it('means no work at all, and the day still builds', () => {
    const plan = generateDailyPlan(profile, everyday(profile), TUESDAY);
    expect(blocksOf(plan)).toEqual([]);
    expectNoOverlaps(plan.items);
  });
});
