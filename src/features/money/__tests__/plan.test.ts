import { observe, type MetricObservation } from '@/features/model/metrics';
import {
  assessMoney,
  monthlyCapacityFrom,
  moneySteps,
  savingsPlan,
  stepDetail,
} from '@/features/money/plan';

const rate = (value: number, daysAgo: number): MetricObservation => ({
  ...observe('finance.savingsRate', value),
  at: new Date(Date.now() - daysAgo * 86400e3).toISOString(),
});

const weekIn = (value: number, daysAgo: number): MetricObservation => ({
  ...observe('finance.weeklyIn', value),
  at: new Date(Date.now() - daysAgo * 86400e3).toISOString(),
});

describe('the steps, in order', () => {
  it('all manual, no buffer: the transfer first, then the month, nothing ticked', () => {
    const steps = moneySteps({ mode: 'saving', automation: 'no', buffer: 'none' });
    expect(steps[0]).toMatchObject({ id: 'automate', title: 'One transfer automated on payday', done: false });
    expect(steps[1]).toMatchObject({ id: 'buffer-1', done: false });
    expect(steps.every((s) => !s.done)).toBe(true);
  });

  it('ticks only what the person said: transfers running, a month banked', () => {
    const steps = moneySteps({ mode: 'saving', automation: 'yes', buffer: 'some' });
    expect(steps.find((s) => s.id === 'automate')).toMatchObject({ done: true });
    expect(steps.find((s) => s.id === 'buffer-1')).toMatchObject({ done: true });
    expect(steps.find((s) => s.id === 'target')).toMatchObject({ done: false });
  });

  it('a saver never sees a debt step, ticked or otherwise', () => {
    const steps = moneySteps({ mode: 'saving', automation: 'no' });
    expect(steps.some((s) => s.id.startsWith('debt'))).toBe(false);
    const debt = moneySteps({ mode: 'debt', automation: 'no' });
    expect(debt.map((s) => s.title)).toContain('List every debt with its rate');
    expect(debt.every((s) => !s.done)).toBe(true);
  });

  it('every leak chosen becomes a step, in the order chosen', () => {
    const steps = moneySteps({ mode: 'clarity', automation: 'partial', leak: 'social,recurring' });
    const leaks = steps.filter((s) => s.id.startsWith('leak-')).map((s) => s.id);
    expect(leaks).toEqual(['leak-social', 'leak-recurring']);
  });

  it('the interview modes a student or a retiree can answer with still build steps', () => {
    expect(moneySteps({ mode: 'getting_on_top', automation: 'no' }).length).toBeGreaterThan(2);
    expect(moneySteps({ mode: 'lasting', automation: 'yes' }).map((s) => s.title)).toContain(
      'A drawdown plan written down',
    );
  });

  it('every step has a sentence under it, and the sentences never advise a product', () => {
    const all = [
      ...moneySteps({ mode: 'debt', automation: 'no', buffer: 'none', leak: 'recurring,impulse,everyday,bills,social,unknown', raise: 'absorbed' }),
      ...moneySteps({ mode: 'saving', automation: 'yes', buffer: 'solid', raise: 'saved' }),
      ...moneySteps({ mode: 'clarity', automation: 'partial', raise: 'some' }),
      ...moneySteps({ mode: 'unsure', raise: 'notyet' }),
      ...moneySteps({ mode: 'lasting' }),
    ];
    for (const s of all) {
      expect(stepDetail(s.title)).toBeTruthy();
      const text = s.detail.toLowerCase();
      for (const banned of ['etf', 'index fund', 's&p', 'bitcoin', 'crypto', '% return', 'guaranteed']) {
        expect(text).not.toContain(banned);
      }
    }
    // The rung titles from the pathway ladder have sentences too.
    for (const title of ['A savings rate you know', 'Three months of expenses, banked', 'Investing set up to run by itself', 'The transfer raised a notch']) {
      expect(stepDetail(title)).toBeTruthy();
    }
    expect(stepDetail('Investing set up to run by itself')).toContain('never financial advice');
  });
});

describe('savingsPlan — an amount, a date, and the steps between', () => {
  // The worked example: $100,000 by the end of 2029, $5,000 there now,
  // planned on 7 September 2026 — 39 whole months.
  const base = { target: 100_000, byDate: '2029-12-31', startingBalance: 5_000, today: '2026-09-07' };

  it('says what a month has to be, and the weekly figure', () => {
    const plan = savingsPlan(base);
    expect(plan.monthsToDate).toBe(39);
    expect(plan.monthlyNeeded).toBe(Math.round(95_000 / 39)); // 2,436
    expect(plan.weeklyNeeded).toBe(Math.round((plan.monthlyNeeded * 12) / 52)); // 562
    expect(plan.onTrack).toBeNull();
    expect(plan.sentence).toMatch(/To land on December 2029 you need \$2,436 a month/);
  });

  it('dates every milestone at the pace the date needs when no pace is known', () => {
    const plan = savingsPlan(base);
    const titles = plan.milestones.map((m) => m.title);
    expect(titles).toEqual([
      'The first $1,000',
      'A tenth of the way',
      'A quarter there',
      'Halfway',
      'Three quarters',
      'Done',
    ]);
    // $1,000 is already banked: shown as reached, with no date to wait for.
    expect(plan.milestones[0]).toMatchObject({ amount: 1_000, reached: true, date: null });
    expect(plan.milestones[1]).toMatchObject({ amount: 10_000, reached: false });
    expect(plan.milestones[1].date).toBe('2026-12-07'); // 3 months at $2,436 lands $12,308
    expect(plan.milestones.at(-1)).toMatchObject({ title: 'Done', amount: 100_000 });
    expect(plan.milestones.at(-1)!.date).toBe('2029-12-07');
    for (let i = 2; i < plan.milestones.length; i += 1) {
      expect(plan.milestones[i].date! >= plan.milestones[i - 1].date!).toBe(true);
    }
  });

  it('puts the first thousand and a month of expenses first when they are ahead', () => {
    const plan = savingsPlan({ ...base, startingBalance: 0, monthlyExpenses: 4_500 });
    expect(plan.milestones.slice(0, 3).map((m) => [m.title, m.amount])).toEqual([
      ['The first $1,000', 1000],
      ['A month of expenses banked', 4500],
      ['A tenth of the way', 10000],
    ]);
  });

  it('is honest when the current pace lands late: where you land, and what the date needs', () => {
    const plan = savingsPlan({ ...base, monthlyCapacity: 1_500 });
    expect(plan.onTrack).toBe(false);
    expect(plan.landsOn).toBe('2032-01-07'); // 95,000 / 1,500 = 63.3 → 64 months
    expect(plan.sentence).toBe(
      'At $1,500 a month you land on January 2032. To land on December 2029 you need $2,436 a month.',
    );
  });

  it('says so when the pace lands early', () => {
    const plan = savingsPlan({ ...base, monthlyCapacity: 4_000 });
    expect(plan.onTrack).toBe(true);
    expect(plan.landsOn).toBe('2028-09-07'); // 24 months
    expect(plan.sentence).toMatch(/^At \$4,000 a month you land on September 2028, ahead of December 2029\./);
  });

  it('nothing going in is said plainly, not as a date in the year 2100', () => {
    const plan = savingsPlan({ ...base, monthlyCapacity: 0 });
    expect(plan.landsOn).toBeNull();
    expect(plan.onTrack).toBe(false);
    expect(plan.sentence).toMatch(/^Nothing is going in yet\./);
  });

  it('interest, when given, lowers what a month has to be', () => {
    const flat = savingsPlan(base).monthlyNeeded;
    const withRate = savingsPlan({ ...base, ratePct: 4 }).monthlyNeeded;
    expect(withRate).toBeLessThan(flat);
    expect(withRate).toBeGreaterThan(flat * 0.9);
  });

  it('a target already met is done, and a date in the past is not a division by zero', () => {
    const done = savingsPlan({ ...base, startingBalance: 120_000 });
    expect(done.sentence).toMatch(/Done\.$/);
    expect(done.milestones.every((m) => m.reached)).toBe(true);
    const late = savingsPlan({ ...base, byDate: '2020-01-01' });
    expect(late.monthsToDate).toBe(1);
    expect(Number.isFinite(late.monthlyNeeded)).toBe(true);
  });

  it('a small target still gets sensible steps with no near-duplicates', () => {
    const plan = savingsPlan({ target: 2_000, byDate: '2027-03-01', startingBalance: 0, today: '2026-09-07' });
    const amounts = plan.milestones.map((m) => m.amount);
    expect(amounts).toEqual([200, 500, 1000, 1500, 2000]);
    expect(plan.milestones.at(-1)!.title).toBe('Done');
  });
});

describe('the weekly number', () => {
  it('turns the recent weekly entries into a monthly pace', () => {
    expect(monthlyCapacityFrom([])).toBeUndefined();
    expect(monthlyCapacityFrom([weekIn(300, 2), weekIn(500, 9)])).toBe(Math.round((400 * 52) / 12));
    // Entries older than eight weeks are not the current pace.
    expect(monthlyCapacityFrom([weekIn(1000, 90)])).toBeUndefined();
  });
});

describe('assessMoney — the monthly number, judged by trend', () => {
  it('asks for the number before judging, and calls it optional', () => {
    const a = assessMoney([]);
    expect(a.verdict).toBe('need-data');
    expect(a.message).toMatch(/Optional/);
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
