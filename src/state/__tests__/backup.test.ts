/**
 * Backup and restore, end to end through the real storage.
 *
 * The backup is the only copy of the person's data that exists anywhere,
 * so a restore is the one operation that must be exact: what comes back
 * is what went out, byte for byte, and a bad paste changes nothing.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { checkBackup, exportBackup, restoreBackup, STORE_KEY } from '@/state/backup';
import { PERSIST_VERSION } from '@/state/hygiene';
import { useAppStore } from '@/state/store';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { grantedEntitlement } from '@/features/plus/entitlement';
import { makeSet, newLog } from '@/features/training/log';
import { todayKey } from '@/lib/dates';

const persisted = () => {
  const { partialize } = useAppStore.persist.getOptions();
  return JSON.stringify(partialize!(useAppStore.getState()));
};

/** A state with something in every corner a screen reads. */
function fullState() {
  useAppStore.getState().resetAll();
  const built = buildLifeOperatingPlan({
    name: 'Sam',
    priorities: ['health', 'work', 'family'],
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    energy: 'morning',
    trainingDays: '3',
    capacity: 'steady',
    lessOf: ['doomscrolling'],
  } as never);
  useAppStore.setState({ entitlement: grantedEntitlement() });
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
    answers: { name: 'Sam', trainingDays: '3' },
  });
  const s = useAppStore.getState();
  s.startPath('training', { experience: 'consistent', limiter: 'time' });
  const log = newLog(todayKey(), 'Upper A');
  log.sets = [makeSet('Bench press', 1, 8, 80)];
  s.saveWorkoutLog(log);
  s.addMetric('body.weight', 84.2, 'entered by hand');
  s.logBehaviourEvent(s.behaviourIntentions[0].id, 'tired', 'couch');
  s.swapSession(todayKey(), 1);
  s.dismissPlusNudge();
  s.markQuestionAsked('q1');
  s.dismissCheckin('ci-1');
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(async () => {
  useAppStore.getState().resetAll();
  await AsyncStorage.clear();
});

describe('export then restore on a clean store', () => {
  it('reproduces the persisted slice byte for byte', async () => {
    fullState();
    await flush();
    const before = persisted();
    const backup = await exportBackup();
    expect(backup).not.toBeNull();
    expect(JSON.parse(backup!).version).toBe(PERSIST_VERSION);
    expect(JSON.stringify(JSON.parse(backup!).state)).toBe(before);

    useAppStore.getState().resetAll();
    await flush();
    expect(persisted()).not.toBe(before);

    const result = await restoreBackup(backup!);
    expect(result.ok).toBe(true);
    await flush();
    expect(persisted()).toBe(before);
    // And what the phone now holds is the backup itself.
    expect(await AsyncStorage.getItem(STORE_KEY)).toBe(backup);
    expect(useAppStore.getState().hydrated).toBe(true);
    expect(useAppStore.getState().onboarded).toBe(true);
    expect(useAppStore.getState().workoutLogs).toHaveLength(1);
    expect(Object.keys(useAppStore.getState().sessionSwaps)).toHaveLength(1);
  });
});

describe('a backup that cannot be opened', () => {
  const refusedWithoutWiping = async (text: string) => {
    fullState();
    await flush();
    const before = persisted();
    const stored = await AsyncStorage.getItem(STORE_KEY);
    const result = await restoreBackup(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(10);
    expect(persisted()).toBe(before);
    expect(await AsyncStorage.getItem(STORE_KEY)).toBe(stored);
  };

  it('is refused when it is not JSON', () => refusedWithoutWiping('{"state": {"onboarded": tru'));
  it('is refused when it is empty', () => refusedWithoutWiping('   '));
  it('is refused when it is JSON but not a store payload', () => refusedWithoutWiping('{"hello": 1}'));
  it('is refused when the state is not an object', () => refusedWithoutWiping('{"state": 1, "version": 1}'));
  it('is refused when a list is not a list', () =>
    refusedWithoutWiping(JSON.stringify({ state: { onboarded: true, goals: 'oops' }, version: PERSIST_VERSION })));
  it('is refused when the profile is not a profile', () =>
    refusedWithoutWiping(JSON.stringify({ state: { onboarded: true, profile: 'Sam' }, version: PERSIST_VERSION })));
  it('is refused when it comes from a newer app', () =>
    refusedWithoutWiping(JSON.stringify({ state: { onboarded: true }, version: PERSIST_VERSION + 1 })));
});

describe('a backup from an older build', () => {
  it('is migrated on the way in rather than trusted as current', async () => {
    fullState();
    await flush();
    const profile = useAppStore.getState().profile;
    // Version 0, with a mangled list the migration knows how to repair.
    const old = JSON.stringify({ state: { onboarded: true, profile, goals: 'oops', plans: [] }, version: 0 });
    const result = await restoreBackup(old);
    expect(result.ok).toBe(true);
    await flush();
    const s = useAppStore.getState();
    expect(s.onboarded).toBe(true);
    expect(s.profile).toEqual(profile);
    expect(s.goals).toEqual([]);
    expect(s.plans).toEqual({});
    expect(JSON.parse((await AsyncStorage.getItem(STORE_KEY))!).version).toBe(PERSIST_VERSION);
  });

  it('with the version stripped is treated as version 0, so the repairs still run', () => {
    const check = checkBackup(JSON.stringify({ state: { onboarded: true, goals: 'oops' } }));
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.version).toBe(0);
      expect(JSON.parse(check.text).version).toBe(0);
    }
  });

  it('a valid current backup is passed through untouched', () => {
    const text = JSON.stringify({ state: { onboarded: true, goals: [] }, version: PERSIST_VERSION });
    const check = checkBackup(`  ${text}\n`);
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.text).toBe(text);
  });
});
