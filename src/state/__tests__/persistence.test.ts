/**
 * What an older install finds when it opens this build.
 *
 * Every earlier version of the persisted state is reconstructed here as
 * that build wrote it, written to storage under the real key, and pulled
 * back through the real persist middleware — migration, merge and the
 * repairs in `onRehydrateStorage` included. The shapes come from the git
 * history of `src/state/store.ts`: the MVP wrote nine keys; the build
 * before the interview was split wrote twenty-four and no answers; the
 * first versioned build wrote thirty and no swaps.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { PERSIST_VERSION, migratePersisted } from '@/state/hygiene';
import { useAppStore } from '@/state/store';
import { buildLifeOperatingPlan, answersFromProfile, profilePatchFor } from '@/features/onboarding/buildPlan';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import { getClockOffsetMs, setClockOffsetMs } from '@/lib/dates';
import type { LifeProfile, Routine } from '@/types/domain';

const KEY = 'intent-os-store';

const MVP_KEYS = [
  'onboarded', 'profile', 'goals', 'routines', 'plans',
  'behaviourIntentions', 'behaviourEvents', 'reflections', 'suggestions',
] as const;

const PRE_SPLIT_KEYS = [
  ...MVP_KEYS, 'planEvents', 'mealPlan', 'paths', 'metrics', 'workoutLogs',
  'foodPreferences', 'foodPreferencesAsked', 'notifications', 'healthConnectedAt',
  'healthLastSyncAt', 'questionLog', 'dismissedCheckins', 'trainingProgramme',
  'pathLevelStepBack', 'workBlock', 'clockOffsetMs',
] as const;

const FIRST_VERSIONED_KEYS = [
  ...PRE_SPLIT_KEYS, 'entitlement', 'interviewAnswers', 'lastOpenedAt', 'previousOpenAt',
  'pathIntensityPush', 'voicePreference',
] as const;

/** A realistic onboarded state, from the real interview builder. */
function onboarded(sexAtBirth?: 'male' | 'female') {
  useAppStore.getState().resetAll();
  const built = buildLifeOperatingPlan({
    name: 'Sam',
    priorities: ['health', 'work'],
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    energy: 'morning',
    trainingDays: '3',
    capacity: 'steady',
    ...(sexAtBirth ? { sexAtBirth } : {}),
  });
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
  return useAppStore.getState();
}

/** The persisted slice, exactly as the middleware writes it. */
function partialized(): Record<string, unknown> {
  const { partialize } = useAppStore.persist.getOptions();
  return partialize!(useAppStore.getState()) as Record<string, unknown>;
}

/** A blob restricted to the keys an earlier build knew about. */
function shapedAs(keys: readonly string[], extra: Record<string, unknown> = {}) {
  const full = partialized();
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in full) out[k] = full[k];
  return { ...out, ...extra };
}

async function storeAndHydrate(state: Record<string, unknown>, version: number | undefined) {
  // Reset first: every store write, the reset included, is persisted, so
  // writing the fixture before it would just be overwritten.
  useAppStore.getState().resetAll();
  await Promise.resolve();
  await AsyncStorage.setItem(KEY, JSON.stringify(version === undefined ? { state } : { state, version }));
  await useAppStore.persist.rehydrate();
  return useAppStore.getState();
}

beforeEach(async () => {
  useAppStore.getState().resetAll();
  await AsyncStorage.clear();
});

describe('the persisted version', () => {
  it('is one, and the migration is the one the store runs', () => {
    expect(PERSIST_VERSION).toBe(1);
    const options = useAppStore.persist.getOptions();
    expect(options.version).toBe(PERSIST_VERSION);
    expect(options.migrate).toBe(migratePersisted);
    expect(options.name).toBe(KEY);
  });
});

describe('a state from the MVP (version 0, nine keys)', () => {
  it('hydrates without losing what it had, and every newer key takes its default', async () => {
    const before = onboarded();
    const blob = shapedAs(MVP_KEYS);
    expect(Object.keys(blob).sort()).toEqual([...MVP_KEYS].sort());

    const after = await storeAndHydrate(blob, 0);

    expect(after.onboarded).toBe(true);
    expect(after.profile).toEqual(before.profile);
    expect(after.goals).toEqual(before.goals);
    expect(after.routines.map((r) => r.id)).toEqual(before.routines.map((r) => r.id));
    expect(after.plans).toEqual(before.plans);
    // Everything added since, at its default rather than undefined.
    expect(after.entitlement).toEqual({ plus: false, source: 'none' });
    expect(after.metrics).toEqual([]);
    expect(after.workoutLogs).toEqual([]);
    expect(after.sessionSwaps).toEqual({});
    expect(after.exerciseSwaps).toEqual({});
    expect(after.dismissedCheckins).toEqual({});
    expect(after.paths).toEqual({});
    expect(after.notifications.enabled).toBe(false);
    expect(after.plusNudgeDismissedAt).toBeNull();
    expect(after.hydrated).toBe(true);
  });
});

describe('a state from before the interview was split (version 0, no answers)', () => {
  it('reconstructs the interview answers from the profile', async () => {
    const before = onboarded();
    const blob = shapedAs(PRE_SPLIT_KEYS);
    expect('interviewAnswers' in blob).toBe(false);

    const after = await storeAndHydrate(blob, 0);

    expect(after.interviewAnswers).toEqual(answersFromProfile(before.profile!));
    // The spine is there, so the deferred questions know it was answered.
    expect(after.interviewAnswers.name).toBe('Sam');
    expect(after.interviewAnswers.workHours).toBe('09:00-17:30');
    expect(after.interviewAnswers.sleep).toBe('06:30-22:30');
    expect(after.interviewAnswers.trainingDays).toBe('3');
  });

  it('leaves stored answers alone when there are some', async () => {
    onboarded();
    const blob = shapedAs(FIRST_VERSIONED_KEYS, { interviewAnswers: { name: 'Sam', vision: 'Calmer' } });
    const after = await storeAndHydrate(blob, 1);
    expect(after.interviewAnswers).toEqual({ name: 'Sam', vision: 'Calmer' });
  });
});

describe('a state from the first versioned build (version 1, no swaps)', () => {
  it('hydrates with the swap maps and the Plus card timestamp at their defaults', async () => {
    const before = onboarded();
    const blob = shapedAs(FIRST_VERSIONED_KEYS);
    for (const absent of ['sessionSwaps', 'exerciseSwaps', 'plusNudgeDismissedAt']) {
      expect(absent in blob).toBe(false);
    }
    const after = await storeAndHydrate(blob, 1);
    expect(after.sessionSwaps).toEqual({});
    expect(after.exerciseSwaps).toEqual({});
    expect(after.plusNudgeDismissedAt).toBeNull();
    expect(after.profile).toEqual(before.profile);
    expect(after.routines).toEqual(before.routines);
  });
});

describe('a version-0 blob whose lists were mangled', () => {
  it('is repaired rather than crashed on, and the good parts are kept', async () => {
    const before = onboarded();
    const blob = shapedAs(MVP_KEYS, { goals: 'oops', plans: [], metrics: { not: 'a list' } });
    const after = await storeAndHydrate(blob, 0);
    expect(after.goals).toEqual([]);
    expect(after.plans).toEqual({});
    expect(after.metrics).toEqual([]);
    expect(after.profile).toEqual(before.profile);
    expect(after.routines.length).toBe(before.routines.length);
  });

  it('a migrated blob is written back at the current version', async () => {
    onboarded();
    await storeAndHydrate(shapedAs(MVP_KEYS), 0);
    const raw = JSON.parse((await AsyncStorage.getItem(KEY))!);
    expect(raw.version).toBe(PERSIST_VERSION);
  });
});

describe('answers reconstructed from a profile', () => {
  /**
   * The round trip that makes the reconstruction safe: feeding every
   * reconstructed answer back through the profile patcher must change
   * nothing. If it did, a person who never re-answered anything would find
   * their profile edited by the act of opening the app.
   */
  it('change nothing when re-applied through profilePatchFor', () => {
    const built = buildLifeOperatingPlan({
      name: 'Sam',
      priorities: ['health', 'family'],
      vision: 'Present at home',
      household: ['partner', 'kids'],
      kidsCount: '2',
      partnerName: 'Alex',
      capacity: 'steady',
      age: '41',
      workStyle: 'manager',
      workDays: ['1', '2', '3', '4', '5'],
      workHours: '08:30-17:00',
      sleep: '06:00-22:00',
      sleepQuality: 'broken',
      pressure: 'full',
      energy: 'morning',
      trainingDays: '4',
      trainingSetup: 'gym',
      existingHabits: ['workout'],
      weight: '84',
      moreOf: ['reading'],
      lessOf: ['doomscrolling'],
      sexAtBirth: 'male',
    } as never);
    const profile = built.profile;
    const answers = answersFromProfile(profile);

    let patched: LifeProfile = profile;
    for (const [stepId, value] of Object.entries(answers)) {
      const patch = profilePatchFor(stepId, value as string | string[], patched);
      if (patch) patched = { ...patched, ...patch };
    }
    // Person ids are minted fresh only for people who did not exist; the
    // partner and kids already did, so nothing about them may move either.
    expect(patched).toEqual(profile);
  });

  it('never claims a training setup it cannot prove', () => {
    const built = buildLifeOperatingPlan({
      name: 'Sam', priorities: ['health'], workDays: ['1'], workHours: '09:00-17:00',
      sleep: '06:30-22:30', energy: 'morning', trainingDays: '2', capacity: 'steady',
      trainingSetup: 'walking',
    } as never);
    expect(built.profile.trainingPreference).toBe('outdoors');
    expect('trainingSetup' in answersFromProfile(built.profile)).toBe(false);
  });
});

describe('routines that do not apply to the body on hydrate', () => {
  const PELVIC = 'pelvic-floor-training';

  const withPelvic = (sex: 'male' | 'female') => {
    const before = onboarded(sex);
    const pelvic: Routine = { ...toRoutine(protocolById(PELVIC)!, before.profile), active: true };
    useAppStore.setState({ routines: [...before.routines, pelvic] });
    return pelvic.id;
  };

  it('are switched off for a man, whatever the stored flag said', async () => {
    const id = withPelvic('male');
    const after = await storeAndHydrate(shapedAs(FIRST_VERSIONED_KEYS), 1);
    const stored = after.routines.find((r) => r.id === id)!;
    expect(stored).toBeDefined();
    expect(stored.active).toBe(false);
    // Other routines are untouched.
    expect(after.routines.filter((r) => r.id !== id).every((r) => r.active)).toBe(true);
  });

  it('are left running for a woman', async () => {
    const id = withPelvic('female');
    const after = await storeAndHydrate(shapedAs(FIRST_VERSIONED_KEYS), 1);
    expect(after.routines.find((r) => r.id === id)!.active).toBe(true);
  });

  it('and the switch-off reaches storage, so it is not redone on every launch', async () => {
    const id = withPelvic('male');
    await storeAndHydrate(shapedAs(FIRST_VERSIONED_KEYS), 1);
    const raw = JSON.parse((await AsyncStorage.getItem(KEY))!);
    expect(raw.state.routines.find((r: Routine) => r.id === id).active).toBe(false);
    expect(Object.keys(raw.state.interviewAnswers).length).toBeGreaterThan(0);
  });
});

describe('what is written', () => {
  it('has no functions and no hydrated flag', () => {
    onboarded();
    const slice = partialized();
    expect('hydrated' in slice).toBe(false);
    expect(Object.values(slice).some((v) => typeof v === 'function')).toBe(false);
    // Every data key of the store is there — nothing a screen reads is dropped.
    for (const key of ['sessionSwaps', 'exerciseSwaps', 'plusNudgeDismissedAt', 'entitlement', 'interviewAnswers']) {
      expect(key in slice).toBe(true);
    }
  });

  it('survives JSON exactly — nothing in the slice is undefined-only or cyclic', () => {
    onboarded();
    const slice = partialized();
    const round = JSON.parse(JSON.stringify(slice));
    expect(round).toEqual(JSON.parse(JSON.stringify(slice)));
    expect(Object.keys(round).sort()).toEqual(Object.keys(slice).filter((k) => slice[k] !== undefined).sort());
  });
});

describe('the preview-lab clock', () => {
  afterEach(() => setClockOffsetMs(0));

  it('is restored from the persisted offset on hydrate', async () => {
    onboarded();
    const blob = shapedAs(FIRST_VERSIONED_KEYS, { clockOffsetMs: 3 * 3600e3 });
    setClockOffsetMs(0);
    await storeAndHydrate(blob, 1);
    expect(getClockOffsetMs()).toBe(3 * 3600e3);
  });

  it('is zeroed by resetAll', async () => {
    onboarded();
    setClockOffsetMs(3600e3);
    useAppStore.setState({ clockOffsetMs: 3600e3 });
    useAppStore.getState().resetAll();
    expect(getClockOffsetMs()).toBe(0);
    expect(useAppStore.getState().clockOffsetMs).toBe(0);
  });
});
