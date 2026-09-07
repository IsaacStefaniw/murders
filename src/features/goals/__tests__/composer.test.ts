import {
  assessGoal,
  composeFromText,
  dayNames,
  describeCheckin,
  describeDoneWhen,
  describeStep,
  dueCheckin,
  formatDay,
  paceLanding,
  parseTargetValue,
  savingsPace,
  streakWeeks,
} from '@/features/goals/composer';
import { observe } from '@/features/model/metrics';
import type { Goal, LifeProfile, PlanActionEvent } from '@/types/domain';

const PROFILE = { weightKg: 86, workDays: [1, 2, 3, 4, 5], wakeTime: '06:30', sleepTime: '22:30' } as unknown as LifeProfile;
const TODAY = '2026-09-07';

const completion = (goalId: string, date: string): PlanActionEvent => ({
  id: `e-${date}-${Math.random()}`,
  at: `${date}T12:00:00.000Z`,
  date,
  itemId: 'i1',
  goalId,
  area: 'health',
  kind: 'completed',
  initiatedBy: 'user',
});

/** N completions per week for `weeks` consecutive weeks ending 2026-03-27 (Fri). */
const weeklyCompletions = (goalId: string, weeks: number, perWeek: number): PlanActionEvent[] => {
  const out: PlanActionEvent[] = [];
  for (let w = 0; w < weeks; w += 1) {
    for (let s = 0; s < perWeek; s += 1) {
      const d = new Date(Date.UTC(2026, 2, 27 - w * 7 - s * 2));
      out.push(completion(goalId, d.toISOString().slice(0, 10)));
    }
  }
  return out;
};

describe('parseTargetValue', () => {
  it('reads money, weight and distance targets', () => {
    expect(parseTargetValue('$2m')).toEqual({ value: 2_000_000, unit: '$' });
    expect(parseTargetValue('$40k')).toEqual({ value: 40_000, unit: '$' });
    expect(parseTargetValue('$100,000')).toEqual({ value: 100_000, unit: '$' });
    expect(parseTargetValue('120kg')).toEqual({ value: 120, unit: 'kg' });
    expect(parseTargetValue('10 km')).toEqual({ value: 10, unit: 'km' });
    expect(parseTargetValue(undefined)).toBeNull();
  });
});

describe('the worked example: Save $100,000 by June 2028, from $12,000 today', () => {
  const draft = () =>
    composeFromText(
      'Save $100,000 by June 2028',
      PROFILE,
      undefined,
      { mode: 'saving', automation: 'no', saved: '12000', expenses: '4500' },
      { today: TODAY },
    );

  it('parses to the money domain with the target and the date', () => {
    const { goal } = draft();
    expect(goal.domain).toBe('finance');
    expect(goal.targetDate).toBe('2028-06-30');
  });

  it('computes the monthly amount from the gap and the months', () => {
    // 662 days is 21.75 months; $88,000 over that is $4,046 a month.
    expect(savingsPace(12000, 100000, TODAY, '2028-06-30')).toEqual({ perMonth: 4046, months: 21.7 });
    const { goal } = draft();
    expect(goal.pace).toEqual({ perMonth: 4046, unit: '$', startValue: 12000, startDate: TODAY, targetValue: 100000 });
  });

  it('drafts the steps: transfer, first $1k more, a month of expenses, quarters, done — each dated', () => {
    const { goal } = draft();
    // Dated at $4,046 a month from $12,000: each amount lands where the
    // straight line from today to 30 June 2028 crosses it.
    expect(goal.milestones!.map((m) => [m.title, m.dueDate])).toEqual([
      ['The transfer set up on payday', '2026-09-14'],
      ['First $1,000 more: $13,000 set aside', '2026-09-15'],
      ['A quarter of the way: $25,000 set aside', '2026-12-14'],
      ['Halfway: $50,000 set aside', '2027-06-20'],
      ['Three quarters: $75,000 set aside', '2027-12-25'],
      ['Done: $100,000 set aside', '2028-06-30'],
    ]);
  });

  it('drops the expenses step when it is already banked, and keeps it when it is not', () => {
    const { goal } = draft();
    // $4,500 of expenses is under the $12,000 already set aside: nothing to reach.
    expect(goal.milestones!.some((m) => m.title.startsWith('A month of expenses'))).toBe(false);

    const later = composeFromText('Save $100,000 by June 2028', PROFILE, undefined, { saved: '12000', expenses: '15000' }, { today: TODAY });
    const expenses = later.goal.milestones!.find((m) => m.title.startsWith('A month of expenses'))!;
    expect(expenses.title).toBe('A month of expenses banked: $15,000 set aside');
    expect(expenses.doneWhen).toMatchObject({ kind: 'metric', op: 'gte', value: 15000 });
    expect(expenses.dueDate).toBe('2026-09-30');
  });

  it('ties every amount to the payday transfer and the weekly check-in, with one intention line', () => {
    const { goal, routines } = draft();
    const amounts = goal.milestones!.filter((m) => m.doneWhen?.kind === 'metric');
    for (const m of amounts) {
      expect(m.how).toBe('$4,046 a month moved on payday, before anything else · Money check-in on Sundays');
      expect(m.intention).toBe('When pay lands, I will move the $4,046 before anything else is spent.');
    }
    expect(routines.some((r) => r.protocolId === 'money-checkin')).toBe(true);
    const ask = goal.checkins!.find((c) => c.source === 'ask')!;
    expect(ask.cadenceDays).toBe(7);
    expect(ask.prompt).toBe('How much is set aside toward “Save $100,000 by June 2028” right now?');
  });

  it('says where the plan lands from day one, then where the real rate lands', () => {
    const { goal } = draft();
    const key = `goal.${goal.id}.saved`;
    expect(paceLanding(goal, [], TODAY)!.headline).toBe('At $4,046 a month from $12,000 you land on 30 Jun 2028.');

    // Three months in and $10,000 further along: $3,333 a month lands late.
    const reading = { ...observe(key, 22000), at: '2026-12-07T09:00:00.000Z' };
    const slow = paceLanding(goal, [reading], '2026-12-07')!;
    expect(slow.verdict).toBe('behind');
    expect(slow.headline).toBe('At $3,345 a month you land on 16 Nov 2028 — You said 30 Jun 2028; that needs $4,046 a month from here.');

    // $15,000 further along in the same time: ahead.
    const fast = paceLanding(goal, [{ ...reading, value: 27000 }], '2026-12-07')!;
    expect(fast.verdict).toBe('ahead');
    expect(fast.headline).toBe('At $5,017 a month you land on 23 Feb 2028 — about 18 weeks ahead of 30 Jun 2028.');
  });

  it('without a date the amounts stay undated and the landing line is not invented', () => {
    const { goal } = composeFromText('Save $100,000', PROFILE, undefined, { saved: '12000' }, { today: TODAY });
    expect(goal.targetDate).toBeUndefined();
    expect(goal.pace).toBeUndefined();
    expect(goal.milestones!.filter((m) => m.doneWhen?.kind === 'metric').every((m) => !m.dueDate)).toBe(true);
    expect(paceLanding(goal, [], TODAY)).toBeNull();
  });
});

describe('composeGoalDraft — every ladder is measurable, dated and says how', () => {
  it('a lift by a date: consistency first, then the halfway load and the number, dated at the pace', () => {
    const { goal } = composeFromText('Bench 120kg by March 2027', PROFILE, undefined, {}, {
      today: TODAY,
      metrics: [observe('strength.bench.e1rm', 100)],
    });
    expect(goal.targetDate).toBe('2027-03-31');
    expect(goal.milestones!.map((m) => [m.title, m.dueDate])).toEqual([
      ['First week of sessions in', '2026-09-14'],
      ['Four consistent weeks', '2026-10-05'],
      ['Bench press at 110 kg (estimated 1RM)', '2026-12-19'],
      ['Bench press at 120 kg (estimated 1RM)', '2027-03-31'],
    ]);
    expect(goal.pace).toMatchObject({ perMonth: 3, unit: 'kg', startValue: 100, targetValue: 120 });
    expect(goal.milestones![2].how).toMatch(/^Bench 120kg by March 2027 on Mon, Wed and Fri, 45 min — the load rises a little each week$/);
    expect(goal.milestones![2].intention).toContain('When the session is on today’s plan');
    expect(goal.checkins![0].source).toBe('plan');
  });

  it('a half marathon by a date counts the base back from the day', () => {
    const { goal } = composeFromText('Run a half marathon in May 2027', PROFILE, undefined, {}, { today: TODAY });
    expect(goal.targetDate).toBe('2027-05-31');
    expect(goal.milestones!.map((m) => [m.title, m.dueDate, m.doneWhen?.kind])).toEqual([
      ['Four consistent training weeks', '2026-10-05', 'streak'],
      ['Eight weeks in — the base is real', '2026-11-02', 'streak'],
      ['Longest session done and recovered from', '2027-05-17', 'confirm'],
      ['Event completed', '2027-05-31', 'confirm'],
    ]);
    expect(goal.milestones![0].intention).toContain('shoes on and run ten minutes');
  });

  it('a near event drops the base steps it has no room for', () => {
    const { goal } = composeFromText('Run a 10k in 3 weeks', PROFILE, undefined, {}, { today: TODAY });
    expect(goal.milestones!.map((m) => m.title)).toEqual(['Longest session done and recovered from', 'Event completed']);
  });

  it('a weight trend by a date: readings from Health, thirds dated at the pace, and a caution on a fast date', () => {
    const { goal } = composeFromText('Get to 80kg by June 2027', PROFILE, undefined, {}, { today: TODAY });
    expect(goal.milestones!.map((m) => [m.title, m.dueDate])).toEqual([
      ['Three weeks of weigh-ins — the trend is visible', '2026-09-28'],
      ['Body weight at or under 84 kg', '2026-12-15'],
      ['Body weight at or under 82 kg', '2027-03-23'],
      ['Body weight at or under 80 kg', '2027-06-30'],
    ]);
    expect(goal.pace).toMatchObject({ perMonth: 0.6, unit: 'kg', startValue: 86, targetValue: 80 });
    expect(goal.pace!.note).toBeUndefined();
    expect(goal.checkins![0]).toMatchObject({ source: 'health', cadenceDays: 3 });

    const rushed = composeFromText('Get to 80kg in 4 weeks', PROFILE, undefined, {}, { today: TODAY });
    expect(rushed.goal.pace!.note).toMatch(/kg a week.*GP or dietitian/);
  });

  it('a habit with a day count: dated steps the person confirms, the urge tool as the how', () => {
    const { goal, routines } = composeFromText('30 days without vaping', PROFILE, undefined, {}, { today: TODAY });
    expect(goal.domain).toBe('behaviour');
    expect(routines).toHaveLength(0);
    expect(goal.milestones!.map((m) => [m.title, m.dueDate])).toEqual([
      ['Name the usual trigger', '2026-09-09'],
      ['Choose the counter-move', '2026-09-09'],
      ['3 days clear', '2026-09-10'],
      ['7 days clear', '2026-09-14'],
      ['14 days clear', '2026-09-21'],
      ['30 days clear', '2026-10-07'],
    ]);
    // No routine carries this goal, so nothing here pretends to tick itself.
    expect(goal.milestones!.every((m) => m.doneWhen?.kind === 'confirm')).toBe(true);
    expect(goal.milestones![3].how).toContain('urge tool');
    expect(goal.milestones![3].intention).toBe('When the urge comes, I will do the two-minute breath reset before I decide anything.');
  });

  it('a relationship goal with no number gets an honest process ladder', () => {
    const { goal, routines } = composeFromText('A proper date night every week', PROFILE, undefined, {}, { today: TODAY });
    expect(goal.pace).toBeUndefined();
    expect(goal.milestones!.map((m) => [m.title, m.dueDate, m.doneWhen?.kind])).toEqual([
      ['Two weeks running', '2026-09-21', 'streak'],
      ['Six weeks running — it is starting to be normal', '2026-10-19', 'streak'],
      ['A full season of it', '2026-11-30', 'streak'],
      ['One conversation you had been putting off', '2026-10-05', 'confirm'],
    ]);
    expect(routines[0].title).toBe('Date night');
    expect(goal.milestones![0].how).toBe('Date night on Fridays — in the diary before the week starts');
    expect(goal.milestones![0].intention).toBe('When something else lands on that time, I will move the something else.');
    expect(goal.checkins![0].source).toBe('plan');
  });

  it('a creative goal is measured in sessions of real work plus an honest finish', () => {
    const { goal } = composeFromText('Write a book', PROFILE, undefined, {}, { today: TODAY });
    const kinds = goal.milestones!.map((m) => m.doneWhen?.kind);
    expect(kinds).toEqual(['count', 'count', 'confirm']);
    // Two sessions a week: five sessions is three weeks, twenty is ten.
    expect(goal.milestones!.map((m) => m.dueDate)).toEqual(['2026-09-28', '2026-11-16', undefined]);
  });

  it('a business revenue goal asks monthly, not weekly', () => {
    const { goal } = composeFromText('Grow the business to $2m revenue', PROFILE);
    const ask = goal.checkins!.find((c) => c.source === 'ask')!;
    expect(ask.cadenceDays).toBe(30);
    expect(goal.milestones!.some((m) => m.doneWhen?.kind === 'metric')).toBe(true);
  });

  it('a debt with a number is counted as paid off, never invested', () => {
    const { goal } = composeFromText('Pay off $20k of credit card debt', PROFILE, undefined, {}, { today: TODAY });
    expect(goal.milestones![0].title).toBe('Every debt listed with its rate');
    expect(goal.milestones![4].title).toBe('Done: $20,000 paid off');
    expect(goal.checkins![0].prompt).toContain('paid off');
  });

  it('planner milestones become confirm steps with a date, a how and an intention', () => {
    const { goal } = composeFromText('Sleep better', PROFILE, undefined, { anchor: 'sleep' }, { today: TODAY, targetDate: '2026-11-02' });
    for (const m of goal.milestones!) {
      expect(m.doneWhen).toEqual({ kind: 'confirm' });
      expect(m.dueDate).toBeDefined();
      expect(m.how).toBeDefined();
      expect(m.intention).toContain('phone on charge in another room');
    }
    expect(goal.milestones!.map((m) => m.dueDate)).toEqual(['2026-10-05', '2026-11-02']);
  });

  it('every step carries a condition, a human description and a how or an intention', () => {
    for (const text of [
      'Save $40k for the house deposit',
      'Bench 120kg',
      'Run a marathon',
      'Write a book',
      'Book a trip to Japan',
      'Drink less on weeknights',
      'Get promoted',
      'Spend more time with the kids',
    ]) {
      const { goal } = composeFromText(text, PROFILE);
      for (const m of goal.milestones ?? []) {
        expect(m.doneWhen).toBeDefined();
        expect(describeDoneWhen(m.doneWhen).length).toBeGreaterThan(0);
        expect(describeStep(m).length).toBeGreaterThan(0);
        expect((m.how ?? '').length + (m.intention ?? '').length).toBeGreaterThan(0);
        expect(m.intention ?? 'When').toMatch(/^When /);
      }
      for (const c of goal.checkins ?? []) {
        expect(describeCheckin(c).length).toBeGreaterThan(0);
      }
    }
  });

  it('labels read plainly', () => {
    expect(formatDay('2028-06-30')).toBe('30 Jun 2028');
    expect(dayNames([1, 3, 5])).toBe('Mon, Wed and Fri');
    expect(dayNames([0])).toBe('Sundays');
    expect(dayNames([0, 1, 2, 3, 4, 5, 6])).toBe('every day');
    expect(describeStep({ id: 'x', title: 't', done: false, doneWhen: { kind: 'metric', metricKey: 'k', op: 'gte', value: 25000, unit: '$' }, dueDate: '2026-12-14' })).toBe('by 14 Dec 2026 · done when reaches $25,000');
  });
});

describe('streakWeeks', () => {
  it('counts consecutive qualifying weeks from the most recent', () => {
    const dates = weeklyCompletions('g', 4, 2).map((e) => e.date);
    expect(streakWeeks(dates, 2)).toBe(4);
    expect(streakWeeks(dates, 3)).toBe(0);
    expect(streakWeeks([], 1)).toBe(0);
  });

  it('a broken week ends the streak', () => {
    const dates = [
      ...weeklyCompletions('g', 2, 2).map((e) => e.date),
      // Two weeks earlier (gap week between) — must not count.
      '2026-03-02',
      '2026-03-03',
    ];
    expect(streakWeeks(dates, 2)).toBe(2);
  });
});

describe('assessGoal — evidence checks steps off and states why', () => {
  const savings = () => composeFromText('Save $40k for the house deposit', PROFILE).goal;

  it('needs data before the first reading, then auto-completes satisfied steps', () => {
    const goal = savings();
    const empty = assessGoal(goal, { metrics: [], planEvents: [] });
    expect(empty.state).toBe('need-data');
    expect(empty.autoDone).toHaveLength(0);

    const withReading = assessGoal(goal, {
      metrics: [observe(`goal.${goal.id}.saved`, 12000)],
      planEvents: [],
    });
    // 12k satisfies the $1k and $10k steps; $20k (halfway) is next.
    expect(withReading.autoDone).toHaveLength(2);
    expect(withReading.state).toBe('on-track');
    expect(withReading.reason).toBe('At $12,000 — $8,000 from “Halfway: $20,000 set aside”.');
  });

  it('still asks for the first reading when a setup step sits ahead of the number', () => {
    const goal = composeFromText('Save $40k for the house deposit', PROFILE, undefined, { automation: 'no' }).goal;
    expect(goal.milestones![0].doneWhen).toEqual({ kind: 'confirm' });
    const empty = assessGoal(goal, { metrics: [], planEvents: [] });
    expect(empty.state).toBe('need-data');
    expect(empty.next!.title).toBe('The transfer set up on payday');
  });

  it('declares the goal done when every step is satisfied or confirmed', () => {
    const goal = savings();
    const done = assessGoal(goal, {
      metrics: [observe(`goal.${goal.id}.saved`, 40000)],
      planEvents: [],
    });
    expect(done.autoDone).toHaveLength(5);
    expect(done.state).toBe('done');
  });

  it('streak steps complete from the plan-event stream alone', () => {
    const goal = composeFromText('Run a marathon', PROFILE).goal;
    const events = weeklyCompletions(goal.id, 4, 2);
    const a = assessGoal(goal, { metrics: [], planEvents: events, today: '2026-03-27' });
    expect(a.autoDone).toContain(goal.milestones![0].id);
    expect(a.state).toBe('on-track');
  });

  it('goes quiet-stalled when nothing has moved inside the stall window', () => {
    const goal: Goal = {
      ...composeFromText('Write a book', PROFILE).goal,
      createdAt: '2025-12-01T00:00:00.000Z',
    };
    const a = assessGoal(goal, { metrics: [], planEvents: [], today: '2026-03-01' });
    expect(a.state).toBe('stalled');
  });

  it('reads the local day, not the UTC one', () => {
    // Created 21 days ago by the local calendar. Under a UTC slice an
    // evening timestamp east of Greenwich would read as a day older.
    const goal: Goal = {
      ...composeFromText('Write a book', PROFILE).goal,
      createdAt: new Date(2026, 1, 8, 23, 30).toISOString(),
    };
    expect(assessGoal(goal, { metrics: [], planEvents: [], today: '2026-03-01' }).state).toBe('on-track');
    expect(assessGoal(goal, { metrics: [], planEvents: [], today: '2026-03-02' }).state).toBe('stalled');
  });
});

describe('dueCheckin', () => {
  it('asks immediately when there is no reading, then respects the cadence', () => {
    const goal = composeFromText('Save $40k for the house deposit', PROFILE).goal;
    const spec = goal.checkins!.find((c) => c.source === 'ask')!;
    expect(dueCheckin(goal, [])?.id).toBe(spec.id);

    const fresh = observe(spec.metricKey, 5000);
    expect(dueCheckin(goal, [fresh])).toBeNull();

    const stale = { ...fresh, at: new Date(Date.now() - 8 * 86400e3).toISOString() };
    expect(dueCheckin(goal, [stale])?.id).toBe(spec.id);
  });

  it('never asks for plan- or health-sourced check-ins', () => {
    const goal = composeFromText('Run a marathon', PROFILE).goal;
    expect(dueCheckin(goal, [])).toBeNull();
  });
});
