/**
 * Check-ins through the store: asked once, answered once, and "not now"
 * meaning not now — across a relaunch.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { DISMISS_DAYS, nextCheckin } from '@/features/checkins/due';
import { composeFromText } from '@/features/goals/composer';
import { latest } from '@/features/model/metrics';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { useAppStore } from '@/state/store';

function onboardWithSavingsGoal() {
  useAppStore.getState().resetAll();
  const built = buildLifeOperatingPlan({
    name: 'Sam',
    priorities: ['finance', 'health'],
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    energy: 'morning',
    trainingDays: '2',
    capacity: 'steady',
  } as never);
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
  const { goal, routines } = composeFromText('Save $40k for the house deposit', useAppStore.getState().profile);
  useAppStore.getState().addGoal(goal, routines);
  return useAppStore.getState().goals.find((g) => g.id === goal.id)!;
}

const due = () => {
  const { goals, metrics, dismissedCheckins } = useAppStore.getState();
  return nextCheckin(goals, metrics, dismissedCheckins);
};

beforeEach(async () => {
  useAppStore.getState().resetAll();
  await AsyncStorage.clear();
});

describe('one question, once', () => {
  it('is asked while there is no reading, and not again once answered', () => {
    const goal = onboardWithSavingsGoal();
    const first = due();
    expect(first).not.toBeNull();
    expect(first!.goal.id).toBe(goal.id);
    expect(first!.daysSince).toBeNull();
    useAppStore.getState().answerCheckin(first!.spec.id, first!.spec.metricKey, 4000);
    expect(due()).toBeNull();
    expect(latest(useAppStore.getState().metrics, first!.spec.metricKey)).toMatchObject({ value: 4000, note: 'check-in' });
  });

  it('is asked again once the cadence has passed', () => {
    onboardWithSavingsGoal();
    const first = due()!;
    useAppStore.getState().answerCheckin(first.spec.id, first.spec.metricKey, 4000);
    const stale = new Date(Date.now() - (first.spec.cadenceDays + 2) * 86400e3).toISOString();
    useAppStore.setState({ metrics: useAppStore.getState().metrics.map((m) => ({ ...m, at: stale })) });
    const again = due();
    expect(again?.spec.id).toBe(first.spec.id);
    expect(again?.lastValue).toBe(4000);
  });

  it('answering re-runs the evidence pass, so a rung can tick from the answer', () => {
    const goal = onboardWithSavingsGoal();
    const first = due()!;
    expect(goal.milestones!.some((m) => m.done)).toBe(false);
    useAppStore.getState().answerCheckin(first.spec.id, first.spec.metricKey, 40000);
    const live = useAppStore.getState().goals.find((g) => g.id === goal.id)!;
    expect(live.milestones!.some((m) => m.done)).toBe(true);
  });
});

describe('"not now"', () => {
  it('stays quiet for a fortnight, then returns', () => {
    onboardWithSavingsGoal();
    const first = due()!;
    useAppStore.getState().dismissCheckin(first.spec.id);
    expect(due()).toBeNull();
    const dismissed = useAppStore.getState().dismissedCheckins[first.spec.id];
    expect(Date.parse(dismissed)).toBeGreaterThan(0);
    // Fifteen days later the same question is back.
    const later = new Date(Date.parse(dismissed) + (DISMISS_DAYS + 1) * 86400e3);
    const { goals, metrics, dismissedCheckins } = useAppStore.getState();
    expect(nextCheckin(goals, metrics, dismissedCheckins, later)?.spec.id).toBe(first.spec.id);
  });

  it('survives a relaunch', async () => {
    onboardWithSavingsGoal();
    const first = due()!;
    useAppStore.getState().dismissCheckin(first.spec.id);
    await Promise.resolve();
    const raw = await AsyncStorage.getItem('intent-os-store');
    useAppStore.getState().resetAll();
    await Promise.resolve();
    await AsyncStorage.setItem('intent-os-store', raw!);
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().dismissedCheckins[first.spec.id]).toBeDefined();
    expect(due()).toBeNull();
  });

  it('is forgotten the moment the question is answered', () => {
    onboardWithSavingsGoal();
    const first = due()!;
    useAppStore.getState().dismissCheckin(first.spec.id);
    useAppStore.getState().answerCheckin(first.spec.id, first.spec.metricKey, 4000);
    expect(first.spec.id in useAppStore.getState().dismissedCheckins).toBe(false);
  });
});
