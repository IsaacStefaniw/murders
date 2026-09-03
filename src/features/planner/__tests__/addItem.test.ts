/**
 * "Can you add things in easily?"
 *
 * There was no way to add an ordinary block at all — every route to one
 * went through a routine, a goal or a pathway. When the door was opened,
 * the simulation immediately found what was behind it: addPlanItem just
 * appended, so a new block landed on top of whatever was already there.
 * Fifty-two overlaps across eighty people, none of which any screen would
 * have drawn as a conflict.
 *
 * Adding is a move that starts from nowhere, and obeys the same rule: the
 * chosen time is granted and the flexible day re-laid around it.
 */

import { grantedEntitlement } from '@/features/plus/entitlement';
import { useAppStore } from '@/state/store';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { todayKey, toMinutes } from '@/lib/dates';
import type { PlanItem } from '@/types/domain';

const overlaps = (a: PlanItem, b: PlanItem) =>
  toMinutes(a.start) < toMinutes(b.end) && toMinutes(a.end) > toMinutes(b.start);

const setup = () => {
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
  const date = todayKey();
  useAppStore.getState().ensurePlan(date);
  return date;
};

describe('adding something to a day', () => {
  it('puts it on the day', () => {
    const date = setup();
    useAppStore.getState().addPlanItem(date, {
      title: 'Coffee with Dan',
      area: 'enjoyment',
      start: '10:00',
      durationMin: 30,
    });
    const items = useAppStore.getState().plans[date]!.items;
    const added = items.find((i) => i.title === 'Coffee with Dan');
    expect(added).toBeDefined();
    expect(added!.start).toBe('10:00');
    expect(added!.end).toBe('10:30');
  });

  it('never leaves the new block sitting on top of a flexible one', () => {
    const date = setup();
    const before = useAppStore.getState().plans[date]!.items.filter((i) => !i.fixed);
    const victim = before[0];
    expect(victim).toBeDefined();

    useAppStore.getState().addPlanItem(date, {
      title: 'Coffee with Dan',
      area: 'enjoyment',
      start: victim.start,
      durationMin: 30,
    });

    const items = useAppStore.getState().plans[date]!.items;
    const added = items.find((i) => i.title === 'Coffee with Dan')!;
    const flexible = items.filter((i) => !i.fixed && i.id !== added.id);
    for (const other of flexible) {
      expect({ title: other.title, clash: overlaps(added, other) }).toEqual({
        title: other.title,
        clash: false,
      });
    }
  });

  it('reports what it displaced rather than moving things quietly', () => {
    const date = setup();
    const victim = useAppStore.getState().plans[date]!.items.find((i) => !i.fixed)!;
    const displaced = useAppStore.getState().addPlanItem(date, {
      title: 'Coffee with Dan',
      area: 'enjoyment',
      start: victim.start,
      durationMin: 30,
    });
    expect(displaced.map((d) => d.id)).toContain(victim.id);
  });

  it('keeps everything that was already on the day', () => {
    const date = setup();
    const beforeIds = useAppStore.getState().plans[date]!.items.map((i) => i.id).sort();
    useAppStore.getState().addPlanItem(date, {
      title: 'Coffee with Dan',
      area: 'enjoyment',
      start: '10:00',
      durationMin: 30,
    });
    const afterIds = useAppStore.getState().plans[date]!.items.map((i) => i.id);
    for (const id of beforeIds) expect(afterIds).toContain(id);
  });
});
