import { buildWeekReport } from '@/features/review/weekReport';
import type { DailyPlan, PlanItem } from '@/types/domain';

/**
 * The weekly report says how long a thing really takes only once it has
 * been measured enough times to mean anything. Three sessions is the floor
 * the planner uses, and the report holds to the same rule: a number built
 * from one bad afternoon is worse than no number.
 */
const item = (date: string, minutes: number, patch: Partial<PlanItem> = {}): PlanItem => ({
  id: `${date}-i`,
  date,
  start: '07:00',
  end: '07:30',
  title: 'The daily walk',
  area: 'health',
  tier: 'should',
  status: 'completed',
  fixed: false,
  routineId: 'r_walk',
  actualMin: minutes,
  ...patch,
});

const day = (date: string, items: PlanItem[]): DailyPlan => ({ date, items });

describe('how long things really take, in the weekly report', () => {
  it('says nothing until three sessions have been measured', () => {
    const plans = {
      '2026-09-01': day('2026-09-01', [item('2026-09-01', 42)]),
      '2026-09-02': day('2026-09-02', [item('2026-09-02', 44)]),
    };
    expect(buildWeekReport('2026-09-07', plans, []).learnedTimings).toEqual([]);
  });

  it('reports the median once three exist, with the count behind it', () => {
    const plans = {
      '2026-09-01': day('2026-09-01', [item('2026-09-01', 40)]),
      '2026-09-02': day('2026-09-02', [item('2026-09-02', 42)]),
      '2026-09-03': day('2026-09-03', [item('2026-09-03', 50)]),
    };
    const [first] = buildWeekReport('2026-09-07', plans, []).learnedTimings;
    expect(first).toEqual({ title: 'The daily walk', minutes: 42, count: 3 });
  });

  it('names the routine as it is called now, not as it was called then', () => {
    const plans = {
      '2026-09-01': day('2026-09-01', [item('2026-09-01', 40)]),
      '2026-09-02': day('2026-09-02', [item('2026-09-02', 42)]),
      '2026-09-03': day('2026-09-03', [item('2026-09-03', 44, { title: 'The evening walk' })]),
    };
    expect(buildWeekReport('2026-09-07', plans, []).learnedTimings[0].title).toBe('The evening walk');
  });

  it('reaches back past the seven days the rest of the report counts', () => {
    const plans = {
      '2026-08-01': day('2026-08-01', [item('2026-08-01', 40)]),
      '2026-08-02': day('2026-08-02', [item('2026-08-02', 42)]),
      '2026-08-03': day('2026-08-03', [item('2026-08-03', 44)]),
    };
    const report = buildWeekReport('2026-09-07', plans, []);
    expect(report.done).toBe(0);
    expect(report.learnedTimings).toHaveLength(1);
  });
});
