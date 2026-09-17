/**
 * Taking the rung, through the store.
 *
 * `theRungReachesTheWeek.test.ts` proves the builds differ by level. This
 * proves the level a person actually earned gets to one — which is the
 * half that was missing, because nothing in the app ever wrote
 * `answers.level`.
 */

import { useAppStore } from '@/state/store';
import { addDays, todayKey } from '@/lib/dates';
import type { DailyPlan, PlanItem } from '@/types/domain';

const profile = {
  firstName: 'Isaac',
  priorities: ['health', 'family'],
  capacity: 'moderate',
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  trainingDaysPerWeek: 3,
  trainingPreference: 'mixed',
  people: [],
  moreOf: [],
  lessOf: [],
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  useAppStore.getState().resetAll();
  useAppStore.setState({ profile: profile as never, onboarded: true });
});

/** A year of plans in which this pathway's own work was done every other day. */
function logMonths(goalTitles: string[], weeks: number) {
  const plans: Record<string, DailyPlan> = {};
  const start = new Date('2026-01-05').getTime();
  for (let i = 0; i < weeks * 7; i += 2) {
    const date = new Date(start + i * 86400e3).toISOString().slice(0, 10);
    plans[date] = {
      date,
      items: goalTitles.map(
        (title, n): PlanItem => ({
          id: `${date}-${n}`,
          date,
          start: '07:00',
          end: '07:30',
          title,
          area: 'health',
          tier: 'should',
          status: 'completed',
          fixed: false,
        }),
      ),
    } as DailyPlan;
  }
  useAppStore.setState({ plans: { ...useAppStore.getState().plans, ...plans } });
}

describe('a pathway whose log has outgrown its build', () => {
  it('records the rung it was built at, so the two can be compared', () => {
    useAppStore.getState().startPath('nutrition', { aim: 'energy', cooking: 'normal' });
    // Without this stamp there is nothing to compare an earned rung
    // against, which is how one ladder sat at foundation forever.
    expect(useAppStore.getState().paths.nutrition?.answers.level).toBe('foundation');
  });

  it('does nothing on day one, because nothing has been earned', () => {
    useAppStore.getState().startPath('nutrition', { aim: 'energy', cooking: 'normal' });
    expect(useAppStore.getState().advancePathToEarnedLevel('nutrition')).toBe(false);
  });

  it('adds the rung once the log supports it', () => {
    useAppStore.getState().startPath('nutrition', { aim: 'energy', cooking: 'normal' });
    const entry = useAppStore.getState().paths.nutrition!;
    const mine = useAppStore
      .getState()
      .routines.filter((r) => r.goalId === entry.goalId)
      .map((r) => r.title);
    expect(mine.length).toBeGreaterThan(0);

    logMonths(mine, 40);
    const before = useAppStore.getState().routines.length;
    expect(useAppStore.getState().advancePathToEarnedLevel('nutrition')).toBe(true);

    const after = useAppStore.getState().routines.length;
    expect(after).toBeGreaterThan(before);
    // And the stamp moved, so it does not fire again for the same rung.
    expect(useAppStore.getState().paths.nutrition?.answers.level).not.toBe('foundation');
    expect(useAppStore.getState().advancePathToEarnedLevel('nutrition')).toBe(false);
  });

  it('keeps the goal it was already working towards', () => {
    useAppStore.getState().startPath('nutrition', { aim: 'energy', cooking: 'normal' });
    const goalId = useAppStore.getState().paths.nutrition!.goalId;
    const goalsBefore = useAppStore.getState().goals.length;

    const mine = useAppStore
      .getState()
      .routines.filter((r) => r.goalId === goalId)
      .map((r) => r.title);
    logMonths(mine, 40);
    useAppStore.getState().advancePathToEarnedLevel('nutrition');

    // Same goal, further along — not a second goal beside the first.
    expect(useAppStore.getState().goals.length).toBe(goalsBefore);
    expect(useAppStore.getState().paths.nutrition?.goalId).toBe(goalId);
    // Everything the rung added belongs to it.
    const orphans = useAppStore
      .getState()
      .routines.filter((r) => r.goalId && r.goalId !== goalId && !useAppStore.getState().goals.some((g) => g.id === r.goalId));
    expect(orphans).toEqual([]);
  });

  it('never drops what somebody was already doing', () => {
    useAppStore.getState().startPath('nutrition', { aim: 'energy', cooking: 'normal' });
    const goalId = useAppStore.getState().paths.nutrition!.goalId;
    const before = useAppStore
      .getState()
      .routines.filter((r) => r.goalId === goalId)
      .map((r) => r.title);

    logMonths(before, 40);
    useAppStore.getState().advancePathToEarnedLevel('nutrition');

    const after = new Set(useAppStore.getState().routines.map((r) => r.title));
    // Climbing must not charge somebody for their own consistency.
    for (const title of before) expect(after.has(title)).toBe(true);
  });

  it('says nothing about a pathway that was never started', () => {
    expect(useAppStore.getState().advancePathToEarnedLevel('family')).toBe(false);
  });
});

describe('the week after stepping up', () => {
  it('shows the new practices without waiting for next week', () => {
    useAppStore.getState().startPath('nutrition', { aim: 'energy', cooking: 'normal' });
    const goalId = useAppStore.getState().paths.nutrition!.goalId;
    const mine = useAppStore
      .getState()
      .routines.filter((r) => r.goalId === goalId)
      .map((r) => r.title);
    logMonths(mine, 40);

    useAppStore.getState().advancePathToEarnedLevel('nutrition');

    // Regenerated across the coming week, so the rung is not an
    // announcement about something that starts on Monday.
    const today = todayKey();
    const week = [today, ...Array.from({ length: 6 }, (_, i) => addDays(today, i + 1))];
    const planned = week.some((d) => (useAppStore.getState().plans[d]?.items.length ?? 0) > 0);
    expect(planned).toBe(true);
  });
});
