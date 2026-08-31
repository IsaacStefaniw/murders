import {
  assessGoal,
  composeFromText,
  describeCheckin,
  describeDoneWhen,
  dueCheckin,
  parseTargetValue,
  streakWeeks,
} from '@/features/goals/composer';
import { observe } from '@/features/model/metrics';
import type { Goal, LifeProfile, PlanActionEvent } from '@/types/domain';

const PROFILE = { weightKg: 86, workDays: [1, 2, 3, 4, 5] } as unknown as LifeProfile;

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
    expect(parseTargetValue('120kg')).toEqual({ value: 120, unit: 'kg' });
    expect(parseTargetValue('10 km')).toEqual({ value: 10, unit: 'km' });
    expect(parseTargetValue(undefined)).toBeNull();
  });
});

describe('composeGoalDraft — every ladder is measurable and legible', () => {
  it('a savings goal gets a fractional metric ladder and a weekly ask check-in', () => {
    const { goal } = composeFromText('Save $40k for the house deposit', PROFILE);
    expect(goal.milestones).toHaveLength(4);
    expect(goal.milestones![0].doneWhen).toMatchObject({ kind: 'metric', op: 'gte', value: 4000 });
    expect(goal.milestones![3].doneWhen).toMatchObject({ kind: 'metric', op: 'gte', value: 40000 });
    const ask = goal.checkins!.find((c) => c.source === 'ask')!;
    expect(ask.cadenceDays).toBe(7);
    expect(ask.metricKey).toBe(`goal.${goal.id}.saved`);
    expect(ask.prompt).toContain('set aside');
  });

  it('a strength target rides the e1RM metric the workouts already produce', () => {
    const { goal } = composeFromText('Bench 120kg', PROFILE);
    const last = goal.milestones![goal.milestones!.length - 1];
    expect(last.doneWhen).toMatchObject({
      kind: 'metric',
      metricKey: 'strength.bench.e1rm',
      op: 'gte',
      value: 120,
    });
    // Consistency comes before the number.
    expect(goal.milestones![0].doneWhen?.kind).toBe('streak');
    expect(goal.checkins![0].source).toBe('plan');
  });

  it('an endurance event builds streak rungs and leaves the day itself to the user', () => {
    const { goal } = composeFromText('Run a marathon', PROFILE);
    const kinds = goal.milestones!.map((m) => m.doneWhen?.kind);
    expect(kinds).toEqual(['streak', 'streak', 'confirm', 'confirm']);
  });

  it('a weight target arrives read-only from Apple Health', () => {
    const { goal } = composeFromText('Get to 80kg', PROFILE);
    const target = goal.milestones!.find((m) => m.doneWhen?.kind === 'metric')!;
    expect(target.doneWhen).toMatchObject({ metricKey: 'body.weight', op: 'lte', value: 80 });
    expect(goal.checkins![0].source).toBe('health');
  });

  it('a creative goal is measured in sessions of real work plus an honest finish', () => {
    const { goal } = composeFromText('Write a book', PROFILE);
    const kinds = goal.milestones!.map((m) => m.doneWhen?.kind);
    expect(kinds).toEqual(['count', 'count', 'confirm']);
  });

  it('a business revenue goal asks monthly, not weekly', () => {
    const { goal } = composeFromText('Grow the business to $2m revenue', PROFILE);
    const ask = goal.checkins!.find((c) => c.source === 'ask')!;
    expect(ask.cadenceDays).toBe(30);
    expect(goal.milestones!.some((m) => m.doneWhen?.kind === 'metric')).toBe(true);
  });

  it('every rung carries a condition and a human description', () => {
    for (const text of [
      'Save $40k for the house deposit',
      'Bench 120kg',
      'Run a marathon',
      'Write a book',
      'Book a trip to Japan',
      'Drink less on weeknights',
    ]) {
      const { goal } = composeFromText(text, PROFILE);
      for (const m of goal.milestones ?? []) {
        expect(m.doneWhen).toBeDefined();
        expect(describeDoneWhen(m.doneWhen).length).toBeGreaterThan(0);
      }
      for (const c of goal.checkins ?? []) {
        expect(describeCheckin(c).length).toBeGreaterThan(0);
      }
    }
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

describe('assessGoal — evidence checks rungs off and states why', () => {
  const savings = () => composeFromText('Save $40k for the house deposit', PROFILE).goal;

  it('needs data before the first reading, then auto-completes satisfied rungs', () => {
    const goal = savings();
    const empty = assessGoal(goal, { metrics: [], planEvents: [] });
    expect(empty.state).toBe('need-data');
    expect(empty.autoDone).toHaveLength(0);

    const withReading = assessGoal(goal, {
      metrics: [observe(`goal.${goal.id}.saved`, 12000)],
      planEvents: [],
    });
    // 12k satisfies the 4k and 10k rungs; 20k (halfway) is next.
    expect(withReading.autoDone).toHaveLength(2);
    expect(withReading.state).toBe('on-track');
    expect(withReading.reason).toContain('$');
  });

  it('declares the goal done when every rung is satisfied or confirmed', () => {
    const goal = savings();
    const done = assessGoal(goal, {
      metrics: [observe(`goal.${goal.id}.saved`, 40000)],
      planEvents: [],
    });
    expect(done.autoDone).toHaveLength(4);
    expect(done.state).toBe('done');
  });

  it('streak rungs complete from the plan-event stream alone', () => {
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
