/**
 * What the engine does when a day cannot hold everything.
 *
 * Tiers decide who keeps the hour; capacity decides how much of the day is
 * left alone; a bedtime bound decides how late a thing may run. Each of
 * those has a visible half — the routine that lost is named in `unplaced`
 * — and this file pins that the visible half is always there.
 */

import { buildDailyPlan } from '@/lib/scheduling/engine';
import { generateDailyPlan } from '@/features/planner/generate';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import { durationMinutes, toMinutes } from '@/lib/dates';
import type { LifeProfile, Routine, Weekday } from '@/types/domain';

const ALL: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const TUESDAY = '2026-09-01';

const profile: LifeProfile = {
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

const routine = (over: Partial<Routine> & { id: string }): Routine => ({
  title: over.id,
  area: 'health',
  days: ALL,
  durationMin: 45,
  preferredStart: '12:15',
  preferredEnd: '13:00',
  energy: 'any',
  flexible: true,
  timeAnchored: true,
  protected: false,
  tier: 'should',
  active: true,
  ...over,
});

describe('C1 a could-tier practice displaced by a must-tier one', () => {
  it('loses the lunch window to the must and is named in unplaced', () => {
    // The example Monday: strength at lunch takes the only free window in
    // the work day, so the protein anchor has nowhere inside its drift.
    const strength = routine({ id: 'strength', title: 'Strength', tier: 'must', durationMin: 60, preferredStart: '12:15', preferredEnd: '12:30' });
    const protein = routine({ id: 'protein', title: 'A protein anchor at every meal', tier: 'could', durationMin: 10, preferredStart: '12:30', preferredEnd: '14:30' });
    const plan = generateDailyPlan(profile, [protein, strength], TUESDAY);
    expect(plan.items.find((i) => i.routineId === 'strength')).toMatchObject({ start: '12:15' });
    expect(plan.items.some((i) => i.routineId === 'protein')).toBe(false);
    // Current behaviour, documented: the could-tier practice is dropped
    // and reported. It is not moved to another meal (brief item 3).
    expect(plan.unplaced.map((r) => r.id)).toEqual(['protein']);
  });

  it('is also named when the day’s slack budget is what dropped it', () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      routine({ id: `could${i}`, tier: 'could', durationMin: 60, preferredStart: '18:00', preferredEnd: '21:00', timeAnchored: false }),
    );
    const must = routine({ id: 'must', tier: 'must', durationMin: 60, preferredStart: '18:00', preferredEnd: '18:30' });
    const plan = buildDailyPlan({
      date: TUESDAY,
      wakeTime: '17:00',
      sleepTime: '22:00',
      fixed: [],
      routines: [...many, must],
      reservedFreeFraction: 0.25,
    });
    expect(plan.items.some((i) => i.routineId === 'must')).toBe(true);
    const placed = plan.items.filter((i) => i.routineId?.startsWith('could')).length;
    const reported = plan.unplaced.filter((r) => r.id.startsWith('could')).length;
    expect(placed + reported).toBe(6);
    expect(reported).toBeGreaterThan(0);
  });
});

describe('C2 the free-time reserve follows capacity', () => {
  // Twelve 75-minute practices into a sixteen-hour day: more than the day
  // can hold at any capacity, so the reserve is what decides the count.
  const many = Array.from({ length: 12 }, (_, i) =>
    routine({ id: `r${i}`, tier: 'could', durationMin: 75, preferredStart: '06:30', preferredEnd: '21:00', timeAnchored: false }),
  );
  const placedFor = (capacity: LifeProfile['capacity']) =>
    generateDailyPlan({ ...profile, workDays: [], capacity }, many, TUESDAY).items.filter((i) => !i.fixed).length;

  it('keeps more of the day free at minimal capacity than at push', () => {
    const minimal = placedFor('minimal');
    const steady = placedFor('steady');
    const push = placedFor('push');
    expect(minimal).toBeLessThan(steady);
    expect(steady).toBeLessThan(push);
  });

  it('never fills the whole waking day even at push', () => {
    const plan = generateDailyPlan({ ...profile, workDays: [], capacity: 'push' }, many, TUESDAY);
    const busy = plan.items.reduce((sum, i) => sum + durationMinutes(i.start, i.end), 0);
    const waking = toMinutes(profile.sleepTime) - toMinutes(profile.wakeTime);
    expect(busy).toBeLessThanOrEqual(waking * 0.8);
  });
});

describe('C3 a bedtime bound', () => {
  const bounded = routine({ id: 'zone2', title: 'Zone 2', durationMin: 40, preferredStart: '20:30', preferredEnd: '21:30', finishBeforeSleepMin: 60 });

  it('moves the session earlier rather than into the bound', () => {
    const plan = buildDailyPlan({ date: TUESDAY, wakeTime: '06:30', sleepTime: '22:30', fixed: [], routines: [bounded] });
    const item = plan.items.find((i) => i.routineId === 'zone2')!;
    expect(item).toBeDefined();
    expect(toMinutes(item.end)).toBeLessThanOrEqual(toMinutes('21:30'));
  });

  it('reports the session when nothing earlier is free either', () => {
    const plan = buildDailyPlan({
      date: TUESDAY,
      wakeTime: '06:30',
      sleepTime: '22:30',
      fixed: [{ title: 'Work', start: '06:45', end: '21:20' }],
      routines: [bounded],
      reservedFreeFraction: 0,
    });
    expect(plan.items.some((i) => i.routineId === 'zone2')).toBe(false);
    expect(plan.unplaced.map((r) => r.id)).toEqual(['zone2']);
  });
});

describe('C4 the bedtime guard', () => {
  const library = ['morning-light', 'strength', 'daily-walk', 'wind-down', 'zone2', 'protein-breakfast', 'caffeine-cutoff'];
  const days = [
    { wakeTime: '05:00', sleepTime: '21:00' },
    { wakeTime: '06:30', sleepTime: '22:30' },
    { wakeTime: '07:30', sleepTime: '23:15' },
    { wakeTime: '08:30', sleepTime: '00:15' },
  ];

  it('never places anything ending after bedtime or starting before wake', () => {
    for (const day of days) {
      const p = { ...profile, ...day };
      const routines = library.map((id) => ({ ...toRoutine(protocolById(id)!, p), days: ALL }));
      const plan = generateDailyPlan(p, routines, TUESDAY);
      const wake = toMinutes(day.wakeTime);
      const sleepRaw = toMinutes(day.sleepTime);
      const sleep = sleepRaw <= wake ? sleepRaw + 1440 : sleepRaw;
      for (const item of plan.items.filter((i) => !i.fixed)) {
        const startRaw = toMinutes(item.start);
        const start = startRaw < wake ? startRaw + 1440 : startRaw;
        const end = start + durationMinutes(item.start, item.end);
        expect({ day: day.wakeTime, title: item.title, start: item.start, inside: start >= wake && end <= sleep }).toEqual({
          day: day.wakeTime,
          title: item.title,
          start: item.start,
          inside: true,
        });
      }
    }
  });
});

describe('C5 morning light follows the person’s wake time', () => {
  it.each([
    ['05:00', '05:20'],
    ['06:30', '06:50'],
    ['08:30', '08:50'],
  ])('up at %s means light at %s, and it lands there on an open day', (wakeTime, expected) => {
    const sleepTime = wakeTime === '08:30' ? '00:15' : '22:30';
    const p = { ...profile, wakeTime, sleepTime, workDays: [] as Weekday[] };
    const light = { ...toRoutine(protocolById('morning-light')!, p), days: ALL };
    expect(light.preferredStart).toBe(expected);
    const plan = generateDailyPlan(p, [light], TUESDAY);
    expect(plan.items.find((i) => i.routineId === light.id)).toMatchObject({ start: expected });
  });

  it('gives way to an early shift and says so, rather than landing mid-shift', () => {
    const p = { ...profile, wakeTime: '04:30', sleepTime: '20:30', workStart: '05:00', workEnd: '13:00' };
    const light = { ...toRoutine(protocolById('morning-light')!, p), days: ALL };
    const plan = generateDailyPlan(p, [light], TUESDAY);
    const item = plan.items.find((i) => i.routineId === light.id);
    if (item) {
      expect(toMinutes(item.end)).toBeLessThanOrEqual(toMinutes('05:00'));
    } else {
      expect(plan.unplaced.map((r) => r.id)).toContain(light.id);
    }
  });
});

describe('C6 a wind-down for a bedtime after midnight', () => {
  it('lands before bed, on the same date, ending at midnight', () => {
    const p = { ...profile, wakeTime: '08:30', sleepTime: '00:15', workDays: [] as Weekday[] };
    const wind = { ...toRoutine(protocolById('wind-down')!, p), days: ALL };
    expect(wind.preferredStart).toBe('23:40');
    const plan = generateDailyPlan(p, [wind], TUESDAY);
    const item = plan.items.find((i) => i.routineId === wind.id)!;
    expect(item).toMatchObject({ start: '23:40', end: '00:00' });
    expect(durationMinutes(item.start, item.end)).toBe(20);
  });
});
