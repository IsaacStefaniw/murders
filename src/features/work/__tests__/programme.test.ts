import { observe, type MetricObservation } from '@/features/model/metrics';
import {
  assessWork,
  buildExecutiveBlock,
  deepHoursTarget,
  weekOfBlock,
} from '@/features/work/programme';

const hours = (value: number, daysAgo: number): MetricObservation => ({
  ...observe('work.deepHours', value),
  at: new Date(Date.now() - daysAgo * 86400e3).toISOString(),
});

describe('executive block', () => {
  it('a maker and a back-to-back manager get materially different weeks', () => {
    const maker = buildExecutiveBlock({ style: 'maker', meetingLoad: 'light' });
    const manager = buildExecutiveBlock({ style: 'manager', meetingLoad: 'heavy' });
    expect(maker.weeks[0].deepHoursTarget).toBeGreaterThan(manager.weeks[0].deepHoursTarget * 2);
    // Week 2's practice differs by role: one-on-ones vs a defended morning.
    expect(manager.weeks[1].practice.title).toContain('one-on-one');
    expect(maker.weeks[1].practice.title).toContain('meeting-free morning');
    // Same four-week arc for both.
    expect(maker.weeks.map((w) => w.theme)).toEqual([
      'Audit & protect',
      'The one lever',
      'Subtract',
      'Review & reset',
    ]);
  });

  it('the bottleneck answer shapes week 2, and redline pressure trims the target honestly', () => {
    const sales = buildExecutiveBlock({ style: 'mixed', bottleneck: 'sales' });
    expect(sales.weeks[1].focus).toContain('sales');
    const calm = deepHoursTarget({ style: 'maker', meetingLoad: 'half' });
    const hot = deepHoursTarget({ style: 'maker', meetingLoad: 'half', pressure: 'redline' });
    expect(hot).toBeLessThan(calm);
  });

  it('knows which week it is and when the block is over', () => {
    const block = buildExecutiveBlock({ style: 'mixed' });
    expect(weekOfBlock(block)).toBe(1);
    block.startedAt = new Date(Date.now() - 8 * 86400e3).toISOString();
    expect(weekOfBlock(block)).toBe(2);
    block.startedAt = new Date(Date.now() - 29 * 86400e3).toISOString();
    expect(weekOfBlock(block)).toBeNull();
  });
});

describe('assessWork — deep hours vs the honest target', () => {
  const inputs = { style: 'maker' as const, meetingLoad: 'heavy' as const }; // target ≈ 7

  it('asks for data first', () => {
    expect(assessWork(inputs, []).verdict).toBe('need-data');
  });

  it('meets target or climbs → on-track', () => {
    expect(assessWork(inputs, [hours(8, 2)]).verdict).toBe('on-track');
    expect(assessWork(inputs, [hours(3, 20), hours(5, 2)]).verdict).toBe('on-track');
  });

  it('under target and not improving → a calendar fix, not a discipline lecture', () => {
    const a = assessWork(inputs, [hours(5, 20), hours(4, 2)]);
    expect(a.verdict).toBe('protect');
    expect(a.message).toContain('calendar problem');
  });
});
