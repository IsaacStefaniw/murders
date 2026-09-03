/**
 * "Is there a way to construct a training plan to goals?"
 *
 * There is, and it went through a title regex that had a hole in it:
 * overhead press was missing from both the answered branch and the title
 * branch, so a goal about it produced a strength programme with no lift to
 * focus on.
 */

import { deriveTrainingInputs } from '@/state/store';
import type { Goal, LifeProfile } from '@/types/domain';

const profile = {
  trainingDaysPerWeek: 4,
  trainingDurationMin: 60,
  trainingPreference: 'gym',
  age: 38,
} as LifeProfile;

const goal = (title: string): Goal[] => [
  { id: 'g', title, area: 'health', domain: 'fitness', status: 'active', createdAt: '', routineIds: [] },
];

const focusFor = (title: string) =>
  deriveTrainingInputs(profile, undefined, goal(title), 'developing').focusLift;

describe('a goal decides what the programme is about', () => {
  it('picks up each main lift from the goal title', () => {
    expect(focusFor('Bench 120kg by June')).toBe('bench');
    expect(focusFor('Squat 180kg')).toBe('squat');
    expect(focusFor('Deadlift 220kg this year')).toBe('deadlift');
  });

  it('picks up overhead press, by any of the names people use', () => {
    expect(focusFor('Overhead press 60kg')).toBe('ohp');
    expect(focusFor('Get a bodyweight strict press')).toBe('ohp');
    expect(focusFor('Shoulder press 50kg')).toBe('ohp');
    expect(focusFor('OHP 60')).toBe('ohp');
  });

  it('still reads the goal as a strength goal, not just a lift', () => {
    expect(deriveTrainingInputs(profile, undefined, goal('Overhead press 60kg'), 'developing').goal)
      .toBe('strength');
  });

  it('lets an explicit answer override the title', () => {
    const inputs = deriveTrainingInputs(
      profile,
      { focusLift: 'ohp' },
      goal('Bench 120kg'),
      'developing',
    );
    expect(inputs.focusLift).toBe('ohp');
  });

  it('takes "none" as a real answer rather than falling back to the title', () => {
    const inputs = deriveTrainingInputs(
      profile,
      { focusLift: 'none' },
      goal('Bench 120kg'),
      'developing',
    );
    expect(inputs.focusLift).toBeUndefined();
  });

  it('leaves a goal that names no lift without one', () => {
    expect(focusFor('Lose 8kg')).toBeUndefined();
  });
});
