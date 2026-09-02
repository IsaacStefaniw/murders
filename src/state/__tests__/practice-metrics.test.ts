/**
 * Completing a practice has to leave a trace.
 *
 * The journey simulation completed 15,488 items across 250 people and found
 * that most scheduled practices recorded nothing: a wind-down done 777
 * times, protein at breakfast 591, the urge reset 529 — none of it visible
 * anywhere. Sauna was the case that got reported from a phone; it was never
 * the only one.
 */

import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import { useAppStore } from '@/state/store';
import { todayKey } from '@/lib/dates';
import type { DailyPlan, PlanItem } from '@/types/domain';

const planWith = (date: string, item: PlanItem): DailyPlan => ({ date, items: [item] });

const complete = (item: PlanItem) => {
  const date = item.date;
  useAppStore.setState({
    plans: { ...useAppStore.getState().plans, [date]: planWith(date, item) },
  });
  useAppStore.getState().setItemStatus(date, item.id, 'completed');
  return useAppStore.getState().metrics;
};

const itemFor = (title: string, routineId?: string, start = '18:00', end = '18:30'): PlanItem => ({
  id: 'pi1',
  date: todayKey(),
  routineId,
  title,
  area: 'health',
  start,
  end,
  tier: 'should',
  status: 'planned',
  fixed: false,
});

beforeEach(() => {
  useAppStore.getState().resetAll();
});

describe('a completed practice records something', () => {
  it('counts sauna in minutes', () => {
    const metrics = complete(itemFor('Sauna sessions', undefined, '13:00', '13:30'));
    const sauna = metrics.find((m) => m.key === 'recovery.saunaMinutes');
    expect(sauna?.value).toBe(30);
  });

  it('counts cold as exposures, not seconds', () => {
    // Two minutes and four minutes are the same practice, and charting the
    // seconds would invite people to race them.
    const metrics = complete(itemFor('Cold-shower finish', undefined, '07:00', '07:03'));
    expect(metrics.find((m) => m.key === 'recovery.coldExposures')?.value).toBe(1);
    expect(metrics.find((m) => m.key === 'recovery.saunaMinutes')).toBeUndefined();
  });

  it('counts every protocol-backed practice, not a hand-picked few', () => {
    const protocol = protocolById('morning-light');
    expect(protocol).toBeDefined();
    const routine = toRoutine(protocol!, null, 'g1');
    useAppStore.setState({ routines: [routine] });
    const metrics = complete(itemFor(routine.title, routine.id, '07:00', '07:10'));
    expect(metrics.some((m) => m.key === 'practice.morning-light')).toBe(true);
  });

  it('records nothing for a block that is only time', () => {
    // "Get stronger" and "Family dinner" are intent and time. Inventing a
    // number for them would be worse than counting nothing.
    const metrics = complete(itemFor('Get stronger'));
    expect(metrics).toHaveLength(0);
  });

  it('does not record a practice that was skipped', () => {
    const item = itemFor('Sauna sessions', undefined, '13:00', '13:30');
    const date = item.date;
    useAppStore.setState({
      plans: { ...useAppStore.getState().plans, [date]: planWith(date, item) },
    });
    useAppStore.getState().setItemStatus(date, item.id, 'skipped');
    expect(useAppStore.getState().metrics).toHaveLength(0);
  });

  it('measures a practice that ends at midnight', () => {
    const metrics = complete(itemFor('Sauna sessions', undefined, '23:40', '00:00'));
    expect(metrics.find((m) => m.key === 'recovery.saunaMinutes')?.value).toBe(20);
  });
});
