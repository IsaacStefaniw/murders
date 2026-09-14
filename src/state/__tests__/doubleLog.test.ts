/**
 * Tapping "Sauna" when a sauna is already on the day.
 *
 * Isaac: "Did you notice the duplicates of things in the app? If a user
 * selects did a sauna it doubles it up?"
 *
 * He is right, and the codebase knew. `LogDidIt` hides any routine already
 * on the plan because offering it "would be an invitation to double-count
 * it", and passes `routineId` so the logged thing and the scheduled thing
 * are the same thing. `QuickLog` — the chip row on Today, the one people
 * actually reach for — does neither.
 *
 * The store's own doc comment on `routineId` spells out the second half:
 * "Without it a logged 'Morning walk' is a different thing from the
 * scheduled one to every consumer downstream — adherence, streak rungs,
 * the adaptation engine — and the routine reads as never done."
 */

import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { protocolById } from '@/features/knowledge/protocols';
import { grantedEntitlement } from '@/features/plus/entitlement';
import { useAppStore } from '@/state/store';
import { todayKey } from '@/lib/dates';

function onboard() {
  useAppStore.getState().resetAll();
  const built = buildLifeOperatingPlan({
    name: 'Sam',
    priorities: ['health'],
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    energy: 'morning',
    trainingDays: '3',
    capacity: 'steady',
    existingHabits: ['sauna'],
  } as never);
  useAppStore.setState({ entitlement: grantedEntitlement() });
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
}

beforeEach(() => useAppStore.getState().resetAll());

describe('logging something that is already on the day', () => {
  it('completes the planned item instead of adding a second one', () => {
    onboard();
    const s = useAppStore.getState();
    const date = todayKey();
    s.ensurePlan(date);

    // Put a sauna on the day the way the planner does, from the routine.
    const sauna = useAppStore.getState().routines.find((r) => r.protocolId === 'sauna');
    expect(sauna).toBeDefined();
    const protocol = protocolById('sauna');
    const title = protocol?.title ?? 'Sauna';

    useAppStore.getState().addPlanItem(date, {
      title,
      area: 'health',
      start: '18:00',
      durationMin: protocol?.durationMin ?? 20,
    });

    const before = useAppStore.getState().plans[date].items.filter((i) => i.title === title);
    expect(before).toHaveLength(1);
    expect(before[0].status).not.toBe('completed');

    // What QuickLog does when you tap the Sauna chip.
    useAppStore.getState().logCompletedActivity({
      title,
      area: 'health',
      durationMin: protocol?.durationMin ?? 20,
      sessionType: protocol?.sessionType,
      note: 'logged after the fact',
    });

    const after = useAppStore.getState().plans[date].items.filter((i) => i.title === title);
    expect({
      count: after.length,
      statuses: after.map((i) => i.status),
    }).toEqual({ count: 1, statuses: ['completed'] });
  });

  it('still adds an item when nothing on the day matches', () => {
    onboard();
    const date = todayKey();
    useAppStore.getState().ensurePlan(date);
    const before = useAppStore.getState().plans[date].items.length;
    useAppStore.getState().logCompletedActivity({
      title: 'Ice bath at a mate’s place',
      area: 'health',
      durationMin: 10,
    });
    const items = useAppStore.getState().plans[date].items;
    expect(items).toHaveLength(before + 1);
    const added = items.find((i) => i.title === 'Ice bath at a mate’s place');
    expect(added?.status).toBe('completed');
  });

  it('does not swallow a second genuine repeat of the same thing', () => {
    // Two walks in one day is two walks. Only a NOT-yet-done item is
    // absorbed; once it is completed, the next log is a new entry.
    onboard();
    const date = todayKey();
    useAppStore.getState().ensurePlan(date);
    const walk = { title: 'The daily walk', area: 'health' as const, durationMin: 30 };
    useAppStore.getState().logCompletedActivity(walk);
    useAppStore.getState().logCompletedActivity(walk);
    const walks = useAppStore.getState().plans[date].items.filter((i) => i.title === walk.title);
    expect(walks).toHaveLength(2);
  });
});
