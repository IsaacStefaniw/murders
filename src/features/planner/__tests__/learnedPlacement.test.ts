/**
 * Placement uses what the sessions actually took.
 *
 * A routine declares a length when it is created — 30 minutes, because
 * that is what the practice says. If the person's own last several
 * sessions took 45, the day should hold 45 minutes for it, or the block
 * runs over every time and the plan is wrong before the day starts.
 *
 * The seam is the last argument to `generateDailyPlan`: a map of routine
 * id to the learned minutes. An empty map is the old behaviour exactly,
 * so every day the person has no history for is planned as before.
 */

import { applyLearnedDurations, generateDailyPlan, workBlocks } from '@/features/planner/generate';
import { durationMinutes } from '@/lib/dates';
import type { LifeProfile, Routine, Weekday } from '@/types/domain';

const ALL: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const TUESDAY = '2026-09-01';

const profile: LifeProfile = {
  firstName: 'Sam',
  priorities: ['health', 'work'],
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

const gym: Routine = {
  id: 'gym',
  title: 'Strength workout',
  area: 'health',
  days: ALL,
  durationMin: 30,
  preferredStart: '07:00',
  preferredEnd: '08:00',
  energy: 'morning',
  flexible: true,
  protected: false,
  tier: 'should',
  active: true,
};

const shutdown: Routine = {
  ...gym,
  id: 'shutdown',
  title: 'Close the work day',
  area: 'work',
  durationMin: 15,
  preferredStart: '17:00',
  preferredEnd: '17:30',
  duringWork: true,
  anchorToWorkEnd: true,
  energy: 'midday',
};

const lengthOf = (items: { start: string; end: string; routineId?: string }[], routineId: string) => {
  const found = items.find((i) => i.routineId === routineId);
  return found ? durationMinutes(found.start, found.end) : null;
};

describe('applyLearnedDurations', () => {
  it('replaces the declared length with the learned one', () => {
    expect(applyLearnedDurations([gym], { gym: 45 })[0].durationMin).toBe(45);
  });

  it('leaves a routine with no learned length exactly as it was', () => {
    const [only] = applyLearnedDurations([gym], {});
    expect(only).toBe(gym);
  });

  it('never takes a length that was not measured', () => {
    expect(applyLearnedDurations([gym], { gym: 0 })[0].durationMin).toBe(30);
    expect(applyLearnedDurations([gym], { gym: Number.NaN })[0].durationMin).toBe(30);
    expect(applyLearnedDurations([gym], { gym: -10 })[0].durationMin).toBe(30);
  });
});

describe('generateDailyPlan with learned durations', () => {
  it('plans the length the sessions actually take, not the declared one', () => {
    const before = generateDailyPlan(profile, [gym], TUESDAY);
    expect(lengthOf(before.items, 'gym')).toBe(30);

    const after = generateDailyPlan(profile, [gym], TUESDAY, [], [], { gym: 45 });
    expect(lengthOf(after.items, 'gym')).toBe(45);
  });

  it('shortens the block when the sessions are consistently shorter', () => {
    const after = generateDailyPlan(profile, [gym], TUESDAY, [], [], { gym: 20 });
    expect(lengthOf(after.items, 'gym')).toBe(20);
  });

  it('plans exactly as before when nothing has been learned yet', () => {
    // Item ids are minted per call, so the day is compared by its shape.
    const shape = (p: { items: { id: string }[] }) =>
      p.items.map(({ id: _id, ...rest }) => rest);
    const before = generateDailyPlan(profile, [gym], TUESDAY);
    const after = generateDailyPlan(profile, [gym], TUESDAY, [], [], {});
    expect(shape(after)).toEqual(shape(before));
  });

  it('sizes a block carved out of the work day too', () => {
    const carved = generateDailyPlan(profile, [shutdown], TUESDAY, [], [], { shutdown: 25 });
    expect(lengthOf(carved.items, 'shutdown')).toBe(25);
    // And the work hours around it still add up: nothing is lost or doubled.
    const blocks = workBlocks(profile, TUESDAY, applyLearnedDurations([shutdown], { shutdown: 25 }));
    expect(blocks.some((b) => b.routineId === 'shutdown')).toBe(true);
  });

  it('does not mutate the routines it was given', () => {
    generateDailyPlan(profile, [gym], TUESDAY, [], [], { gym: 45 });
    expect(gym.durationMin).toBe(30);
  });
});
