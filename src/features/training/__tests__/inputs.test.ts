/**
 * sessionsPerWeekFloor, through the function that actually builds the
 * block's inputs: nobody already training five days is handed three.
 */

import { buildProgramme } from '@/features/training/programme';
import { deriveTrainingInputs } from '@/state/store';
import type { LifeProfile } from '@/types/domain';

const profile = (trainingDaysPerWeek: number, trainingDurationMin = 60): LifeProfile =>
  ({
    trainingDaysPerWeek,
    trainingDurationMin,
    trainingPreference: 'gym',
    age: 38,
    constraints: ['joints'],
  }) as LifeProfile;

describe('the frequency answer sets a floor on days', () => {
  it('lifts a three-day profile to five for someone already training five days', () => {
    expect(deriveTrainingInputs(profile(3), { frequency: '5+' }, []).daysAvailable).toBe(5);
    expect(buildProgramme(deriveTrainingInputs(profile(3), { frequency: '5+' }, [])).weeks[0].sessions).toHaveLength(5);
  });

  it('lifts a two-day profile to three for someone training three or four', () => {
    expect(deriveTrainingInputs(profile(2), { frequency: '3-4' }, []).daysAvailable).toBe(3);
  });

  it('never lowers a profile that already sits above the floor', () => {
    expect(deriveTrainingInputs(profile(5), { frequency: '3-4' }, []).daysAvailable).toBe(5);
    expect(deriveTrainingInputs(profile(4), { frequency: '1-2' }, []).daysAvailable).toBe(4);
  });

  it('leaves the profile alone when the question was not answered', () => {
    expect(deriveTrainingInputs(profile(3), undefined, []).daysAvailable).toBe(3);
    expect(deriveTrainingInputs(profile(3), {}, []).daysAvailable).toBe(3);
  });

  it('still clamps to the block\'s own range downstream', () => {
    const one = deriveTrainingInputs(profile(1), { frequency: '1-2' }, []);
    expect(one.daysAvailable).toBe(1);
    expect(buildProgramme(one).weeks[0].sessions).toHaveLength(2);
    const seven = deriveTrainingInputs(profile(7), { frequency: '5+' }, []);
    expect(buildProgramme(seven).weeks[0].sessions).toHaveLength(5);
  });
});

describe('what else the inputs carry', () => {
  it('carries the constraints answered in onboarding into the block', () => {
    expect(deriveTrainingInputs(profile(3), {}, []).constraints).toEqual(['joints']);
  });

  it('sizes the session from the profile', () => {
    expect(deriveTrainingInputs(profile(3, 30), {}, []).sessionMin).toBe(30);
    expect(deriveTrainingInputs(profile(3, 45), {}, []).sessionMin).toBe(60);
  });

  it('maps outdoors to bodyweight and mixed to a gym', () => {
    expect(deriveTrainingInputs({ ...profile(3), trainingPreference: 'outdoors' }, {}, []).equipment).toBe('bodyweight');
    expect(deriveTrainingInputs({ ...profile(3), trainingPreference: 'mixed' }, {}, []).equipment).toBe('gym');
  });
});
