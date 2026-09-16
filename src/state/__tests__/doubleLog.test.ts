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

    // Only where the planner has not already placed it. Sauna runs on some
    // weekdays and not others, so adding one unconditionally made this test
    // pass or fail depending on which day of the week it ran — it went red
    // on a Wednesday having been green on the Tuesday, with nothing
    // changed. Either way the day ends up holding exactly one.
    const already = useAppStore.getState().plans[date].items.some((i) => i.title === title);
    if (!already) {
      useAppStore.getState().addPlanItem(date, {
        title,
        area: 'health',
        start: '18:00',
        durationMin: protocol?.durationMin ?? 20,
      });
    }

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

  /**
   * The case the original test never reached, and the actual shape of the
   * bug Isaac reported.
   *
   * QuickLog — the chip row on Today — sends no routine id. The sauna the
   * planner places has one. The absorb guard used to decline whenever
   * exactly one side carried an id, so it refused to match in exactly the
   * situation it was written for. The old test hid it by adding its own
   * routine-less sauna and absorbing that, and only went red when the
   * calendar rolled onto a weekday the planner schedules a sauna on.
   */
  it('absorbs the planner’s own item when the chip row sends no routine id', () => {
    onboard();
    const date = todayKey();
    useAppStore.getState().ensurePlan(date);

    const sauna = useAppStore.getState().routines.find((r) => r.protocolId === 'sauna')!;
    const title = protocolById('sauna')?.title ?? 'Sauna';
    // Placed the way the planner does: routine-backed, on the day.
    useAppStore.setState((s) => ({
      plans: {
        ...s.plans,
        [date]: {
          ...s.plans[date],
          items: [
            ...s.plans[date].items.filter((i) => i.title !== title),
            {
              id: 'pi-planned-sauna',
              date,
              start: '18:45',
              end: '19:15',
              title,
              area: 'health' as const,
              tier: 'could' as const,
              status: 'planned' as const,
              fixed: false,
              routineId: sauna.id,
            },
          ],
        },
      },
    }));

    // What QuickLog sends: no routine id at all.
    useAppStore.getState().logCompletedActivity({ title, area: 'health', durationMin: 20 });

    const after = useAppStore.getState().plans[date].items.filter((i) => i.title === title);
    expect(after).toHaveLength(1);
    expect(after[0].status).toBe('completed');
    // And it is still the routine's item, so adherence and the adaptation
    // engine see the routine as done rather than as missed-plus-a-stranger.
    expect(after[0].routineId).toBe(sauna.id);
  });

  /**
   * Two routines can share a title. Completing the wrong one is worse than
   * adding a duplicate, so an exact id on both sides still wins outright.
   */
  it('never completes a different routine that happens to share a title', () => {
    onboard();
    const date = todayKey();
    useAppStore.getState().ensurePlan(date);
    useAppStore.setState((s) => ({
      plans: {
        ...s.plans,
        [date]: {
          ...s.plans[date],
          items: [
            {
              id: 'pi-theirs',
              date,
              start: '07:00',
              end: '07:30',
              title: 'Stretch',
              area: 'health' as const,
              tier: 'could' as const,
              status: 'planned' as const,
              fixed: false,
              routineId: 'r-morning-stretch',
            },
          ],
        },
      },
    }));

    useAppStore.getState().logCompletedActivity({
      title: 'Stretch',
      area: 'health',
      durationMin: 15,
      routineId: 'r-evening-stretch',
    });

    const items = useAppStore.getState().plans[date].items.filter((i) => i.title === 'Stretch');
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.routineId === 'r-morning-stretch')!.status).toBe('planned');
    expect(items.find((i) => i.routineId === 'r-evening-stretch')!.status).toBe('completed');
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
