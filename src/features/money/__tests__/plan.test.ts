import { observe, type MetricObservation } from '@/features/model/metrics';
import { assessMoney, buildMoneyLadder } from '@/features/money/plan';

const rate = (value: number, daysAgo: number): MetricObservation => ({
  ...observe('finance.savingsRate', value),
  at: new Date(Date.now() - daysAgo * 86400e3).toISOString(),
});

describe('the money ladder', () => {
  it('all manual, no buffer → automation is the spotlight, everything else waits', () => {
    const ladder = buildMoneyLadder({ mode: 'saving', automation: 'no', buffer: 'none' });
    expect(ladder[0]).toMatchObject({ id: 'automate', state: 'now' });
    expect(ladder.filter((s) => s.state === 'now')).toHaveLength(1);
    expect(ladder.find((s) => s.id === 'invest')!.state).toBe('later');
  });

  it('answers mark steps done and move the spotlight forward', () => {
    const ladder = buildMoneyLadder({ mode: 'saving', automation: 'yes', buffer: 'some' });
    expect(ladder.find((s) => s.id === 'automate')!.state).toBe('done');
    expect(ladder.find((s) => s.id === 'buffer-1')!.state).toBe('done');
    // No expensive debt (mode saving) → next honest step is the 3-month buffer.
    expect(ladder.find((s) => s.id === 'buffer-3')!.state).toBe('now');
  });

  it('debt mode puts killing expensive debt under the spotlight once automation runs', () => {
    const ladder = buildMoneyLadder({ mode: 'debt', automation: 'yes', buffer: 'some' });
    expect(ladder.find((s) => s.id === 'kill-debt')!.state).toBe('now');
  });

  it('solid buffer + automation → investing is the frontier', () => {
    const ladder = buildMoneyLadder({ mode: 'saving', automation: 'yes', buffer: 'solid' });
    expect(ladder.find((s) => s.id === 'invest')!.state).toBe('now');
  });
});

describe('assessMoney — one number, judged by trend', () => {
  it('asks for the number before judging', () => {
    expect(assessMoney([]).verdict).toBe('need-data');
  });

  it('a climbing rate or a strong rate → on-track', () => {
    expect(assessMoney([rate(8, 60), rate(12, 2)]).verdict).toBe('on-track');
    expect(assessMoney([rate(18, 2)]).verdict).toBe('on-track');
  });

  it('a low flat rate gets a nudge, not a lecture', () => {
    const a = assessMoney([rate(6, 60), rate(6, 2)]);
    expect(a.verdict).toBe('nudge');
    expect(a.message).toContain('never financial advice');
  });
});
