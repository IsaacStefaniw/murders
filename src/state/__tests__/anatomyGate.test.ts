/**
 * The library stopped listing pelvic floor to a man. His plan kept
 * running it, because the routine had been added before the label
 * existed and nothing between the stored routine and the day's plan ever
 * asked whether it applied. The plan is the gate now.
 */
import { grantedEntitlement } from '@/features/plus/entitlement';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { useAppStore } from '@/state/store';
import { todayKey } from '@/lib/dates';

const PELVIC = 'pelvic-floor-training';

const setup = (sexAtBirth?: 'male' | 'female' | 'preferNotToSay') => {
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
  useAppStore.setState({ entitlement: grantedEntitlement() });
  const protocol = protocolById(PELVIC)!;
  expect(protocol.appliesTo).toBe('femaleAnatomy');
  // Every day, so the weekday of the test never matters.
  const pelvic = { ...toRoutine(protocol, built.profile), days: [0, 1, 2, 3, 4, 5, 6] as const };
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: [...built.routines, pelvic as never],
    behaviourIntentions: built.behaviourIntentions,
  });
  return pelvic.id;
};

const plannedToday = (routineId: string) =>
  useAppStore
    .getState()
    .regeneratePlan(todayKey())
    .items.some((i) => i.routineId === routineId);

describe('anatomy-specific routines and the plan', () => {
  it('is never planned for a man, even when the routine is stored and active', () => {
    const id = setup('male');
    expect(plannedToday(id)).toBe(false);
  });

  it('is never planned while the app has not been told', () => {
    const id = setup(undefined);
    expect(plannedToday(id)).toBe(false);
  });

  it('is planned for a woman', () => {
    const id = setup('female');
    expect(plannedToday(id)).toBe(true);
  });

  it('cannot be added from the library to a body it does not apply to', () => {
    setup('male');
    const before = useAppStore.getState().routines.length;
    useAppStore.getState().toggleProtocol(PELVIC);
    expect(useAppStore.getState().routines.length).toBe(before);
  });
});
