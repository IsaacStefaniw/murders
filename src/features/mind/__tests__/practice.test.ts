import { observe, type MetricObservation } from '@/features/model/metrics';
import { minutesThisWeek, practiceLevel, practiceState } from '@/features/mind/practice';

const mins = (value: number, daysAgo: number): MetricObservation => ({
  ...observe('mind.minutes', value),
  at: new Date(Date.now() - daysAgo * 86400e3).toISOString(),
});

describe('stillness practice progression', () => {
  it('starts everyone at two-minute resets', () => {
    expect(practiceLevel([]).level).toBe(1);
  });

  it('a month of real minutes moves the level up', () => {
    const casual = [mins(10, 20), mins(10, 10), mins(10, 3), mins(15, 1)]; // 45 in 28d
    expect(practiceLevel(casual).level).toBe(2);
    const steady = Array.from({ length: 14 }, (_, i) => mins(10, i * 2)); // 140 in 28d
    expect(practiceLevel(steady).level).toBe(3);
  });

  it('old minutes age out — the level is a mirror of the last four weeks', () => {
    const lapsed = [mins(120, 40), mins(120, 35)];
    expect(practiceLevel(lapsed).level).toBe(1);
  });

  it('the state names the week, the level, and what advances it', () => {
    const s = practiceState([mins(10, 3), mins(10, 1)]);
    expect(s.weekMinutes).toBe(20);
    expect(minutesThisWeek([mins(10, 3), mins(10, 9)])).toBe(10);
    expect(s.level.level).toBe(1);
    expect(s.next!.level).toBe(2);
    expect(s.message).toContain('reaches');
  });
});
