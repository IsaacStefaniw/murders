import { buildWeeklyChanges } from '@/features/review/weeklyChanges';
import type { DailyPlan, Routine } from '@/types/domain';

const reading: Routine = {
  id: 'read',
  title: 'Read',
  area: 'growth',
  days: [1, 2, 3, 4],
  durationMin: 20,
  preferredStart: '21:25',
  preferredEnd: '21:45',
  energy: 'evening',
  flexible: true,
  protected: false,
  tier: 'could',
  active: true,
};

function planFor(date: string, status: 'completed' | 'skipped'): DailyPlan {
  return {
    date,
    items: [
      {
        id: `r-${date}`,
        date,
        start: '21:25',
        end: '21:45',
        title: 'Read',
        area: 'growth',
        tier: 'could',
        status,
        routineId: 'read',
        fixed: false,
      },
    ],
  };
}

describe('buildWeeklyChanges', () => {
  it('offers to rest a routine that kept not happening, with an applyable change', () => {
    const plans = {
      '2026-09-07': planFor('2026-09-07', 'skipped'),
      '2026-09-08': planFor('2026-09-08', 'skipped'),
      '2026-09-09': planFor('2026-09-09', 'skipped'),
    };
    const proposal = buildWeeklyChanges({ weekStart: '2026-09-07', plans, routines: [reading] });
    expect(proposal.noticed.join(' ')).toContain('0 of 3');
    expect(proposal.changes).toHaveLength(1);
    expect(proposal.changes[0]).toMatchObject({ kind: 'deactivate_routine', routineId: 'read' });
    expect(proposal.changes[0].description).not.toMatch(/fail|should have/i);
  });

  it('proposes nothing when the week actually happened', () => {
    const plans = {
      '2026-09-07': planFor('2026-09-07', 'completed'),
      '2026-09-08': planFor('2026-09-08', 'completed'),
    };
    const proposal = buildWeeklyChanges({ weekStart: '2026-09-07', plans, routines: [reading] });
    expect(proposal.changes).toHaveLength(0);
  });

  it('never proposes dropping protected or must routines', () => {
    const dinner: Routine = {
      ...reading,
      id: 'dinner',
      title: 'Family dinner',
      protected: true,
      tier: 'must',
    };
    const plans = {
      '2026-09-07': {
        date: '2026-09-07',
        items: [
          {
            id: 'd1',
            date: '2026-09-07',
            start: '18:00',
            end: '18:45',
            title: 'Family dinner',
            area: 'family' as const,
            tier: 'must' as const,
            status: 'skipped' as const,
            routineId: 'dinner',
            fixed: false,
          },
          {
            id: 'd2',
            date: '2026-09-07',
            start: '19:00',
            end: '19:45',
            title: 'Family dinner',
            area: 'family' as const,
            tier: 'must' as const,
            status: 'skipped' as const,
            routineId: 'dinner',
            fixed: false,
          },
        ],
      },
    };
    const proposal = buildWeeklyChanges({ weekStart: '2026-09-07', plans, routines: [dinner] });
    expect(proposal.changes).toHaveLength(0);
  });
});
