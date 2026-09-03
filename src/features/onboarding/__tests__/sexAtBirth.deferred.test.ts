import { grantedEntitlement } from '@/features/plus/entitlement';
import { profilePatchFor } from '@/features/onboarding/buildPlan';
import { useAppStore } from '@/state/store';
import type { LifeProfile } from '@/types/domain';

/**
 * Sex at birth is asked late — in the training hub, or inline in the
 * library — and both places must land in both records: the profile, which
 * gates anatomy-specific content and picks the strength table, and the
 * interview answers, which decide what is still unasked.
 */
describe('sex at birth, answered late', () => {
  it('profilePatchFor carries it to the profile', () => {
    const current = { people: [] } as unknown as LifeProfile;
    expect(profilePatchFor('sexAtBirth', 'female', current)).toEqual({ sexAtBirth: 'female' });
    expect(profilePatchFor('sexAtBirth', undefined, current)).toEqual({ sexAtBirth: undefined });
  });

  it('answering it once updates the profile and the interview record together', () => {
    useAppStore.setState({ entitlement: grantedEntitlement() });
    useAppStore.getState().completeOnboarding({
      profile: {
        id: 'p1',
        firstName: 'Sam',
        wakeTime: '06:30',
        sleepTime: '22:30',
        workStart: '09:00',
        workEnd: '17:00',
        workDays: [1, 2, 3, 4, 5],
        trainingDaysPerWeek: 3,
        priorities: ['training'],
        people: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as LifeProfile,
      goals: [],
      routines: [],
      behaviourIntentions: [],
      answers: {},
    });
    expect(useAppStore.getState().profile?.sexAtBirth).toBeUndefined();
    useAppStore.getState().answerDeferredQuestion('sexAtBirth', 'male');
    expect(useAppStore.getState().profile?.sexAtBirth).toBe('male');
    expect(useAppStore.getState().interviewAnswers.sexAtBirth).toBe('male');
  });
});
