import { useAppStore } from '@/state/store';

/**
 * The three people already running build 10 will update into this build with
 * a persisted store written by the old one. That state has no
 * `workoutLogs`, no `foodPreferences`, no `notifications`, no
 * `dismissedCheckins` — and every screen added tonight reads one of them.
 *
 * Zustand's default merge spreads the current state first and the persisted
 * state over it, so absent keys keep their defaults. This pins that
 * behaviour, because the failure mode is not a wrong number: it is
 * `undefined.map is not a function` on launch, for a real user, with no way
 * back except deleting the app.
 */
describe('updating from an older build', () => {
  const NEW_COLLECTIONS = [
    'workoutLogs',
    'metrics',
    'behaviourEvents',
    'behaviourIntentions',
    'goals',
    'routines',
    'suggestions',
    'reflections',
    'planEvents',
  ] as const;

  const NEW_RECORDS = ['plans', 'paths', 'questionLog', 'dismissedCheckins'] as const;

  beforeEach(() => {
    useAppStore.getState().resetAll();
  });

  it('every collection a screen iterates is an array from the very first render', () => {
    const state = useAppStore.getState();
    for (const key of NEW_COLLECTIONS) {
      expect(Array.isArray(state[key])).toBe(true);
    }
  });

  it('every record a screen indexes is an object, never undefined', () => {
    const state = useAppStore.getState();
    for (const key of NEW_RECORDS) {
      expect(state[key]).toBeDefined();
      expect(typeof state[key]).toBe('object');
    }
  });

  it('food preferences arrive complete, so filtering cannot throw', () => {
    const prefs = useAppStore.getState().foodPreferences;
    for (const key of ['patterns', 'allergies', 'intolerances', 'dislikes', 'favourites'] as const) {
      expect(Array.isArray(prefs[key])).toBe(true);
    }
    // Unasked, not "nothing to declare" — the distinction the meals gate needs.
    expect(useAppStore.getState().foodPreferencesAsked).toBe(false);
  });

  it('notifications default to off, so an update never starts sending', () => {
    const n = useAppStore.getState().notifications;
    expect(n.enabled).toBe(false);
    expect(n.dailyCap).toBeGreaterThan(0);
  });

  /**
   * The actual merge, simulated: an old persisted blob with none of
   * tonight's keys, laid over the current defaults the way the persist
   * middleware does it.
   */
  it('an old persisted blob merges without losing the new defaults', () => {
    const current = useAppStore.getState();
    const oldPersisted = {
      onboarded: true,
      profile: null,
      goals: [],
      routines: [],
      plans: {},
      planEvents: [],
      behaviourIntentions: [],
      behaviourEvents: [],
      reflections: [],
      suggestions: [],
      metrics: [],
    };
    const merged = { ...current, ...oldPersisted } as typeof current;

    expect(Array.isArray(merged.workoutLogs)).toBe(true);
    expect(merged.notifications.enabled).toBe(false);
    expect(merged.dismissedCheckins).toEqual({});
    expect(Array.isArray(merged.foodPreferences.allergies)).toBe(true);
    expect(merged.onboarded).toBe(true);
  });
});
