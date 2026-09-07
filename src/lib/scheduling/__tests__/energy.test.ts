/**
 * The energy shape, in the placement rather than on a card.
 *
 * `energyShape` has been computing peak, dip and second wind from the wake
 * time and the chronotype answer since the readiness card existed, and the
 * card was the only place it went. Rise sells that curve, and nothing else,
 * for A$14.99 a month.
 *
 * These tests pin what it is allowed to do here. It chooses where among
 * legal hours; it never chooses WHETHER. Tier, goal and the person's stated
 * life-area order still decide what is on the day, and if using the shape
 * would cost the day a single routine it is not used at all.
 */

import { generateDailyPlan } from '@/features/planner/generate';
import { buildDailyPlan } from '@/lib/scheduling/engine';
import { energyLine, demandOf } from '@/lib/scheduling/energy';
import { energyShape } from '@/features/health/sleepDebt';
import { toMinutes } from '@/lib/dates';
import type { LifeProfile, Routine, Weekday } from '@/types/domain';

const ALL: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const SATURDAY = '2026-09-05';

const profile = (over: Partial<LifeProfile> = {}): LifeProfile => ({
  firstName: 'Sam',
  priorities: ['health', 'family', 'work'],
  people: [],
  workDays: [],
  workStart: '09:00',
  workEnd: '09:00',
  wakeTime: '06:00',
  sleepTime: '22:00',
  energyProfile: 'morning',
  capacity: 'steady',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  createdAt: '',
  updatedAt: '',
  ...over,
});

const routine = (over: Partial<Routine> & { id: string }): Routine => ({
  title: over.id,
  area: 'health',
  days: ALL,
  durationMin: 45,
  preferredStart: '12:00',
  preferredEnd: '13:00',
  energy: 'any',
  flexible: true,
  timeAnchored: false,
  protected: false,
  tier: 'should',
  active: true,
  ...over,
});

const at = (plan: { items: { routineId?: string; start: string }[] }, id: string) =>
  plan.items.find((i) => i.routineId === id)?.start;

describe('E1 what a routine asks of you', () => {
  it('reads a hard session as work for the peak', () => {
    expect(demandOf(routine({ id: 'a', sessionType: 'workout' }))).toBe('deep');
  });

  it('reads the walk and the money admin as things for the dip', () => {
    expect(demandOf(routine({ id: 'b', protocolId: 'daily-walk' }))).toBe('light');
    expect(demandOf(routine({ id: 'c', area: 'admin' }))).toBe('light');
  });

  it('has no opinion about a family dinner or a breath reset', () => {
    expect(demandOf(routine({ id: 'd', area: 'family' }))).toBe('steady');
    expect(demandOf(routine({ id: 'e', sessionType: 'breathe' }))).toBe('steady');
  });
});

describe('E2 the sharp hours get the session that needs them', () => {
  const p = profile();
  const shape = energyShape(p.wakeTime, p.energyProfile);
  const session = routine({
    id: 'strength',
    title: 'Strength',
    sessionType: 'workout',
    durationMin: 60,
    preferredStart: '10:30',
    preferredEnd: '11:30',
  });

  it('puts it in the peak instead of the first hour that fits', () => {
    expect(shape.peak).toEqual({ start: '08:00', end: '10:00' });
    const plan = generateDailyPlan(p, [session], SATURDAY);
    expect(at(plan, 'strength')).toBe('08:00');
  });

  it('says so in plain words, once', () => {
    const plan = generateDailyPlan(p, [session], SATURDAY);
    expect(energyLine(plan.energy)).toBe(
      'Your sharp hours are 8am to 10am, so Strength sits there.',
    );
  });

  it('claims nothing when the session was going to be in the peak anyway', () => {
    const already = { ...session, preferredStart: '08:00', preferredEnd: '09:00' };
    const plan = generateDailyPlan(p, [already], SATURDAY);
    expect(at(plan, 'strength')).toBe('08:00');
    expect(plan.energy).toEqual([]);
    expect(energyLine(plan.energy)).toBeNull();
  });

  it('follows the person, not the clock: an evening type gets a later peak', () => {
    const owl = profile({ energyProfile: 'evening' });
    expect(energyShape(owl.wakeTime, owl.energyProfile).peak).toEqual({ start: '11:00', end: '13:00' });
    const plan = generateDailyPlan(owl, [session], SATURDAY);
    expect(at(plan, 'strength')).toBe('11:00');
  });
});

describe('E3 the flat stretch gets the walk', () => {
  const p = profile();
  const walk = routine({
    id: 'walk',
    title: 'The daily walk',
    protocolId: 'daily-walk',
    durationMin: 35,
    preferredStart: '17:45',
    preferredEnd: '19:15',
  });

  it('brings it back towards the dip rather than leaving it at its usual hour', () => {
    expect(energyShape(p.wakeTime, p.energyProfile).dip).toEqual({ start: '13:00', end: '15:00' });
    const plan = generateDailyPlan(p, [walk], SATURDAY);
    const start = toMinutes(at(plan, 'walk')!);
    expect(start).toBeLessThan(toMinutes('17:45'));
    expect(start).toBeGreaterThanOrEqual(toMinutes('13:00'));
  });

  it('names the flat stretch, not a failure', () => {
    const plan = generateDailyPlan(p, [walk], SATURDAY);
    expect(energyLine(plan.energy)).toMatch(/^Your flat stretch is 1pm to 3pm, so The daily walk sits there/);
  });
});

describe('E4 the bounds the shape may not cross', () => {
  const p = profile();

  it('leaves a practice whose hour is part of what it is', () => {
    // A post-meal walk is after a meal or it is not a post-meal walk.
    const postMeal = routine({
      id: 'postmeal',
      title: 'Post-meal walk',
      protocolId: 'post-meal-walk',
      durationMin: 15,
      preferredStart: '18:50',
      preferredEnd: '19:30',
      timeAnchored: true,
    });
    const plan = generateDailyPlan(p, [postMeal], SATURDAY);
    expect(at(plan, 'postmeal')).toBe('18:50');
    expect(plan.energy).toEqual([]);
  });

  it('leaves a deadline where it is', () => {
    const cutoff = routine({
      id: 'cutoff',
      title: 'Caffeine cutoff',
      area: 'admin',
      durationMin: 5,
      preferredStart: '12:00',
      preferredEnd: '12:30',
      flexible: false,
    });
    const plan = generateDailyPlan(p, [cutoff], SATURDAY);
    expect(at(plan, 'cutoff')).toBe('12:00');
    expect(plan.energy).toEqual([]);
  });

  it('never pulls a bounded session past its finish-before-sleep line', () => {
    // An evening person whose peak is late, and a session that must be done
    // an hour before bed. The peak wins nothing it is not allowed to win.
    const owl = profile({ energyProfile: 'evening', wakeTime: '10:00', sleepTime: '23:00' });
    const bounded = routine({
      id: 'cardio',
      title: 'Easy cardio, talking pace',
      sessionType: 'workout',
      durationMin: 40,
      preferredStart: '17:00',
      preferredEnd: '18:30',
      finishBeforeSleepMin: 60,
    });
    const plan = generateDailyPlan(owl, [bounded], SATURDAY);
    const start = toMinutes(at(plan, 'cardio')!);
    expect(start + 40).toBeLessThanOrEqual(toMinutes('22:00'));
  });

  it('never places across a fixed block', () => {
    const working = profile({ workDays: ALL, workStart: '07:30', workEnd: '16:00' });
    const session = routine({ id: 'gym', sessionType: 'workout', durationMin: 60, preferredStart: '17:00', preferredEnd: '18:30' });
    const plan = generateDailyPlan(working, [session], '2026-09-07');
    const start = toMinutes(at(plan, 'gym')!);
    expect(start === toMinutes('06:00') || start >= toMinutes('16:15')).toBe(true);
  });
});

describe('E5 a tie-break, never a displacement', () => {
  // The same days built with and without the shape. Anything the ordinary
  // engine could seat must still be seated: the curve is not entitled to
  // cost the person a single thing they asked for.
  const routines: Routine[] = [
    routine({ id: 'gym', title: 'Strength', sessionType: 'workout', tier: 'must', durationMin: 60, preferredStart: '17:30', preferredEnd: '19:00' }),
    routine({ id: 'walk', title: 'The daily walk', protocolId: 'daily-walk', durationMin: 35, preferredStart: '17:45', preferredEnd: '19:15' }),
    routine({ id: 'money', title: 'Money check-in', area: 'admin', durationMin: 20, preferredStart: '19:30', preferredEnd: '20:30' }),
    routine({ id: 'dinner', title: 'Family dinner', area: 'family', tier: 'must', protected: true, durationMin: 45, preferredStart: '18:00', preferredEnd: '18:30', timeAnchored: true }),
    routine({ id: 'wind', title: 'Wind down, screens away', tier: 'must', durationMin: 20, preferredStart: '21:20', preferredEnd: '21:50', timeAnchored: true }),
  ];
  const shapes: { wakeTime: string; sleepTime: string; energyProfile: LifeProfile['energyProfile'] }[] = [
    { wakeTime: '05:00', sleepTime: '21:00', energyProfile: 'morning' },
    { wakeTime: '06:00', sleepTime: '22:00', energyProfile: 'morning' },
    { wakeTime: '06:30', sleepTime: '22:30', energyProfile: 'midday' },
    { wakeTime: '07:30', sleepTime: '23:15', energyProfile: 'evening' },
    { wakeTime: '08:30', sleepTime: '00:15', energyProfile: 'evening' },
  ];

  it.each(shapes)('keeps every placement it had, up at $wakeTime as an $energyProfile type', (shape) => {
    const p = profile({ ...shape, workDays: [1, 2, 3, 4, 5], workStart: '09:00', workEnd: '17:00' });
    for (const date of ['2026-09-05', '2026-09-07']) {
      const withShape = generateDailyPlan(p, routines, date);
      const withoutShape = buildDailyPlan({
        date,
        wakeTime: p.wakeTime,
        sleepTime: p.sleepTime,
        fixed: [],
        routines,
        priorities: p.priorities,
      });
      const seated = new Set(withShape.items.map((i) => i.routineId));
      for (const item of withoutShape.items) {
        expect({ date, id: item.routineId, seated: seated.has(item.routineId) }).toEqual({
          date,
          id: item.routineId,
          seated: true,
        });
      }
    }
  });
});
