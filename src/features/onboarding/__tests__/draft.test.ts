/**
 * Not losing fifty answers to a phone call.
 *
 * The interview store was `create()` with no persistence and the step
 * index lived in a `useState` inside the screen. Setup is around fifty
 * screens, so a low-memory kill, a tapped notification, or putting the
 * phone down and coming back tomorrow put a person at question one with
 * everything gone.
 *
 * It is the worst moment in the product to lose somebody, because it is
 * the only one where they have given a great deal and received nothing
 * yet. Nobody answers fifty questions twice.
 */

import {
  DRAFT_TTL_DAYS,
  draftExpired,
  useOnboardingStore,
} from '@/features/onboarding/state';

const daysAgo = (n: number) => new Date(Date.now() - n * 86400e3).toISOString();

beforeEach(() => useOnboardingStore.getState().reset());

describe('the draft', () => {
  it('keeps where they had got to, not only what they said', () => {
    useOnboardingStore.getState().setAnswer('name', 'Isaac');
    useOnboardingStore.getState().setStepIndex(17);
    const s = useOnboardingStore.getState();
    expect(s.answers.name).toBe('Isaac');
    // Restoring the answers and dropping somebody back at question one is
    // the same loss with extra steps.
    expect(s.stepIndex).toBe(17);
  });

  it('stamps every write, so staleness can be judged', () => {
    useOnboardingStore.getState().setAnswer('name', 'Isaac');
    expect(useOnboardingStore.getState().savedAt).toBeTruthy();
  });

  it('is cleared outright when setup finishes', () => {
    useOnboardingStore.getState().setAnswer('name', 'Isaac');
    useOnboardingStore.getState().setStepIndex(9);
    useOnboardingStore.getState().reset();
    const s = useOnboardingStore.getState();
    expect(s.answers).toEqual({});
    expect(s.stepIndex).toBe(0);
    expect(s.savedAt).toBeUndefined();
  });
});

/**
 * The answers include drinkingBand, smokingStatus, mind, weight and
 * sexAtBirth. A setup abandoned two months ago and never returned to
 * should not leave that on the device indefinitely — it was given for a
 * plan that was never built.
 */
describe('a draft nobody came back to', () => {
  it('is dropped once it is older than the app has any right to keep it', () => {
    expect(draftExpired(daysAgo(DRAFT_TTL_DAYS + 1), new Date())).toBe(true);
  });

  it('survives a fortnight away, which is an ordinary gap', () => {
    expect(draftExpired(daysAgo(14), new Date())).toBe(false);
  });

  it('treats a draft with no stamp as current rather than as ancient', () => {
    // A draft written before this field existed is not evidence of age,
    // and deleting somebody's answers on a guess is the worse error.
    expect(draftExpired(undefined, new Date())).toBe(false);
  });
});
