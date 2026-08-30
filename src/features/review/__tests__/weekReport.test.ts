import { buildWeekReport } from '@/features/review/weekReport';
import type { DailyPlan, Goal, PlanItem } from '@/types/domain';

const item = (over: Partial<PlanItem>): PlanItem => ({
  id: Math.random().toString(),
  date: '2026-03-02',
  start: '12:00',
  end: '12:45',
  title: 'Strength workout',
  area: 'health',
  tier: 'should',
  status: 'completed',
  fixed: false,
  ...over,
});

describe('buildWeekReport', () => {
  const plans: Record<string, DailyPlan> = {
    '2026-03-02': {
      date: '2026-03-02',
      items: [
        item({}),
        item({ title: 'Family dinner', area: 'family' }),
        item({ title: 'Work', area: 'work', fixed: true }),
        item({ title: 'Read', area: 'growth', status: 'skipped' }),
      ],
    },
    '2026-03-01': {
      date: '2026-03-01',
      items: [item({ date: '2026-03-01' })],
    },
    '2026-02-01': {
      date: '2026-02-01',
      items: [item({ date: '2026-02-01', title: 'Ancient thing' })],
    },
  };
  const goals: Goal[] = [
    {
      id: 'g',
      title: 'Grow the business',
      area: 'work',
      status: 'active',
      createdAt: '',
      routineIds: [],
      milestones: [
        { id: 'm1', title: 'Define the gap', done: true, doneAt: '2026-03-01T20:00:00.000Z' },
        { id: 'm2', title: 'Old win', done: true, doneAt: '2026-01-05T20:00:00.000Z' },
      ],
    },
  ];

  const report = buildWeekReport('2026-03-02', plans, goals);

  it('counts the rolling week honestly — Work filtered, old weeks excluded', () => {
    expect(report.done).toBe(3);
    expect(report.planned).toBe(4); // 3 done + 1 skipped, 'Work' never counted
    expect(report.topWins[0]).toEqual({ title: 'Strength workout', count: 2 });
  });

  it('surfaces only this week’s milestone movement', () => {
    expect(report.milestonesMoved).toEqual([
      { goalTitle: 'Grow the business', milestone: 'Define the gap' },
    ]);
  });

  it('finds the best day and orders areas by contribution', () => {
    expect(report.bestDay).toEqual({ date: '2026-03-02', done: 2 });
    expect(report.byArea[0].area).toBe('health');
  });

  it('stays calm on an empty week', () => {
    const empty = buildWeekReport('2026-03-02', {}, []);
    expect(empty.done).toBe(0);
    expect(empty.bestDay).toBeNull();
    expect(empty.topWins).toHaveLength(0);
  });
});
