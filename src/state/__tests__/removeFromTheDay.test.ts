/**
 * Taking something off your own day.
 *
 * Isaac, looking at an expanded row: "How do you delete something from
 * your day or week or plan?"
 *
 * The answer was harder to find than it should have been, and for one kind
 * of block there was no answer at all. Every stop verb in the app worked
 * on the thing BEHIND a block — turn the routine off, drop the goal, stop
 * the programme. A block added by hand through QuickAdd has nothing
 * behind it: no `routineId`, so "Stop scheduling this" never appeared, and
 * no goal to drop. Skip marked it skipped and left it on the day, greyed
 * out, for ever.
 *
 * So the one kind of block that was purely somebody's own — including the
 * one they created by mis-tapping — was the only one they could not take
 * back off.
 */

import { useAppStore } from '@/state/store';
import type { LifeProfile, Routine } from '@/types/domain';

const DATE = '2026-09-17';

const profile = {
  firstName: 'Isaac',
  priorities: ['health'],
  capacity: 'steady',
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'mixed',
  people: [],
  moreOf: [],
  lessOf: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as unknown as LifeProfile;

beforeEach(() => {
  useAppStore.getState().resetAll();
  useAppStore.setState({ profile, onboarded: true });
});

const addOneOff = (title = 'Call the plumber') => {
  useAppStore.getState().addPlanItem(DATE, {
    title,
    area: 'admin',
    start: '10:00',
    durationMin: 30,
  });
  return useAppStore.getState().plans[DATE].items.find((i) => i.title === title)!;
};

describe('something you put there yourself', () => {
  it('comes off the day completely, not greyed out on it', () => {
    const item = addOneOff();
    useAppStore.getState().removePlanItem(DATE, item.id);
    const titles = useAppStore.getState().plans[DATE].items.map((i) => i.title);
    expect(titles).not.toContain('Call the plumber');
  });

  it('leaves the rest of the day alone', () => {
    const keep = addOneOff('Call the plumber');
    const go = addOneOff('Wrong tap');
    useAppStore.getState().removePlanItem(DATE, go.id);
    const ids = useAppStore.getState().plans[DATE].items.map((i) => i.id);
    expect(ids).toContain(keep.id);
    expect(ids).not.toContain(go.id);
  });

  it('is a no-op on an id that is not there', () => {
    const item = addOneOff();
    const before = useAppStore.getState().plans[DATE].items.length;
    useAppStore.getState().removePlanItem(DATE, 'not-a-real-id');
    expect(useAppStore.getState().plans[DATE].items).toHaveLength(before);
    expect(useAppStore.getState().plans[DATE].items.map((i) => i.id)).toContain(item.id);
  });
});

/**
 * The line that keeps the two verbs apart.
 *
 * Deleting a routine's block would take it off today and the routine would
 * put it back tomorrow — the worst of both, and exactly the confusion
 * "Stop scheduling this" exists to avoid. So a block with something behind
 * it refuses to be deleted, and the sheet offers the honest verb instead.
 */
describe('something a routine put there', () => {
  const routine: Routine = {
    id: 'r-1',
    title: 'Strength',
    area: 'health',
    days: [1, 2, 3, 4, 5, 6, 0],
    durationMin: 45,
    preferredStart: '07:00',
    preferredEnd: '07:45',
    energy: 'morning',
    flexible: true,
    protected: false,
    tier: 'should',
    active: true,
  };

  it('refuses to be deleted, because it would be back tomorrow', () => {
    useAppStore.setState({ routines: [routine] });
    useAppStore.getState().ensurePlan(DATE);
    const generated = useAppStore.getState().plans[DATE].items.find((i) => i.routineId === 'r-1');
    expect(generated).toBeDefined();

    useAppStore.getState().removePlanItem(DATE, generated!.id);
    expect(
      useAppStore.getState().plans[DATE].items.map((i) => i.id),
    ).toContain(generated!.id);
  });

  it('is turned off instead, which is what the sheet offers', () => {
    useAppStore.setState({ routines: [routine] });
    useAppStore.getState().updateRoutine('r-1', { active: false });
    expect(useAppStore.getState().routines.find((r) => r.id === 'r-1')?.active).toBe(false);
  });
});

/**
 * A fixed commitment is the person's own diary, not the app's. It is not
 * the app's to delete either.
 */
describe('a fixed commitment', () => {
  it('is left alone', () => {
    useAppStore.getState().ensurePlan(DATE);
    const plan = useAppStore.getState().plans[DATE];
    const fixed = plan.items.find((i) => i.fixed);
    if (!fixed) return; // no fixed block in this day's shape
    useAppStore.getState().removePlanItem(DATE, fixed.id);
    expect(useAppStore.getState().plans[DATE].items.map((i) => i.id)).toContain(fixed.id);
  });
});
