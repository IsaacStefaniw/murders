/**
 * What a plan keeps when the routines change, and what it must never bring
 * back.
 *
 * A plan is rebuilt for the whole visible week whenever a routine is
 * edited, a goal added, a practice toggled in the library or a suggestion
 * accepted. The rebuild has to start from the routines — that is the point
 * — but a day already lived in is a record, not a draft: what was done,
 * what was skipped, what the person moved, what they added.
 */

import { grantedEntitlement } from '@/features/plus/entitlement';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { useAppStore } from '@/state/store';
import { addDays, todayKey, weekdayOf } from '@/lib/dates';

const onboard = () => {
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
  });
  useAppStore.setState({ entitlement: grantedEntitlement() });
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
  const today = todayKey();
  const date = addDays(today, (8 - weekdayOf(today)) % 7 || 7);
  useAppStore.getState().ensurePlan(date);
  return date;
};

/** A routine edit: the store rebuilds the visible week. */
const editSomeRoutine = (exceptId?: string) => {
  const r = useAppStore.getState().routines.find((x) => x.active && x.id !== exceptId)!;
  useAppStore.getState().updateRoutine(r.id, { durationMin: r.durationMin + 5 });
};

const itemsOn = (date: string) => useAppStore.getState().plans[date]!.items;

/**
 * The four rows below failed: `regeneratePlan` in src/state/store.ts
 * replaced the day's items wholesale, so a completed workout came back
 * as planned, a skip was forgotten, a moved block snapped back and an
 * added one vanished. `reconcilePlan` (src/features/planner/reconcile.ts)
 * is what keeps them now.
 */
describe('E1–E4 a day already lived in survives a rebuild', () => {
  it('keeps a completed item completed', () => {
    const date = onboard();
    const item = itemsOn(date).find((i) => !i.fixed)!;
    useAppStore.getState().setItemStatus(date, item.id, 'completed');
    editSomeRoutine();
    expect(itemsOn(date).find((i) => i.id === item.id)).toMatchObject({ status: 'completed' });
  });

  it('keeps a skipped item skipped', () => {
    const date = onboard();
    const item = itemsOn(date).find((i) => !i.fixed)!;
    useAppStore.getState().setItemStatus(date, item.id, 'skipped');
    editSomeRoutine();
    expect(itemsOn(date).find((i) => i.id === item.id)).toMatchObject({ status: 'skipped' });
  });

  it('keeps a moved item where the person put it', () => {
    const date = onboard();
    const item = itemsOn(date).find((i) => !i.fixed)!;
    useAppStore.getState().moveItem(date, item.id, '20:00');
    editSomeRoutine();
    expect(itemsOn(date).find((i) => i.id === item.id)).toMatchObject({ start: '20:00', movedFrom: item.start });
  });

  it('keeps a block the person added', () => {
    const date = onboard();
    useAppStore.getState().addPlanItem(date, { title: 'Coffee with Dan', area: 'enjoyment', start: '07:00', durationMin: 30 });
    editSomeRoutine();
    expect(itemsOn(date).some((i) => i.title === 'Coffee with Dan')).toBe(true);
  });
});

describe('E5–E6 what a rebuild must never bring back', () => {
  it('a routine switched off stays off across the week', () => {
    const date = onboard();
    const item = itemsOn(date).find((i) => !i.fixed && i.routineId)!;
    useAppStore.getState().updateRoutine(item.routineId!, { active: false });
    editSomeRoutine();
    for (let d = 0; d < 7; d += 1) {
      const plan = useAppStore.getState().plans[addDays(date, d)];
      expect(plan?.items.some((i) => i.routineId === item.routineId) ?? false).toBe(false);
    }
  });

  it('a routine taken off a weekday does not come back on that weekday', () => {
    const date = onboard();
    const item = itemsOn(date).find((i) => !i.fixed && i.routineId)!;
    const routine = useAppStore.getState().routines.find((r) => r.id === item.routineId)!;
    const weekday = weekdayOf(date);
    useAppStore.getState().updateRoutine(routine.id, { days: routine.days.filter((d) => d !== weekday) });
    expect(itemsOn(date).some((i) => i.routineId === routine.id)).toBe(false);
    editSomeRoutine(routine.id);
    expect(itemsOn(date).some((i) => i.routineId === routine.id)).toBe(false);
  });
});
