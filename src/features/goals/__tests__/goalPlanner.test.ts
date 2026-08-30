import { buildGoalPlan, parseGoal } from '@/features/goals/goalPlanner';

describe('parseGoal', () => {
  it('reads a business goal with target from one sentence', () => {
    const parsed = parseGoal('I want to grow the business to $2m revenue');
    expect(parsed.domain).toBe('business');
    expect(parsed.target).toBe('$2m');
    expect(parsed.title).toBe('Grow the business to $2m revenue');
  });

  it('classifies fitness, finance, travel, relationship and behaviour goals', () => {
    expect(parseGoal('Run a 10k').domain).toBe('fitness');
    expect(parseGoal('Save $20k for the house deposit').domain).toBe('finance');
    expect(parseGoal('Book a family trip to Japan').domain).toBe('family'); // family beats travel when kids named
    expect(parseGoal('A weekend away with my wife').domain).toBe('relationship');
    expect(parseGoal('Drink less on weeknights').domain).toBe('behaviour');
    // Cohort sim caught this falling through to 'personal' (no milestones,
    // no workout modality) — weight phrasing must reach the gym coach.
    expect(parseGoal('Lose 10 kg and keep it off').domain).toBe('fitness');
  });

  it('extracts timeframes when stated', () => {
    expect(parseGoal('Save $20k by December').timeframe?.toLowerCase()).toContain('by december');
  });

  it('defaults to personal when nothing matches', () => {
    expect(parseGoal('Learn to paint').domain).toBe('personal');
  });
});

describe('buildGoalPlan', () => {
  it('business goals get milestones and a during-work growth block', () => {
    const { goal, routines } = buildGoalPlan(parseGoal('Grow the business to $2m revenue'), null, 'Freedom for the family');
    expect(goal.milestones!.length).toBeGreaterThanOrEqual(3);
    expect(goal.why).toBe('Freedom for the family');
    expect(routines[0].duringWork).toBe(true);
    expect(routines[0].durationMin).toBe(90);
  });

  it('relationship goals become a ritual, not a task', () => {
    const { routines } = buildGoalPlan(parseGoal('More date nights with my partner'), null);
    expect(routines[0].title).toBe('Date night');
    expect(routines[0].days).toEqual([5]);
  });

  it('travel goals become a planning project with booking milestones', () => {
    const { goal, routines } = buildGoalPlan(parseGoal('Plan a trip to Italy'), null);
    expect(goal.milestones!.map((m) => m.title)).toContain('Book it');
    expect(routines[0].title).toContain('Plan:');
  });

  it('behaviour goals produce no calendar block — they run through intentions', () => {
    const { routines, goal } = buildGoalPlan(parseGoal('Stop vaping'), null);
    expect(routines).toHaveLength(0);
    expect(goal.milestones!.map((m) => m.title)).toContain('Name the usual trigger');
  });
});

describe('evidence-based intake tailoring', () => {
  it('a fresh starter gets two short sessions and no Zone 2 yet', () => {
    const plan = buildGoalPlan(parseGoal('Get back to the gym'), null, undefined, {
      experience: 'new',
    });
    const main = plan.routines.find((r) => r.sessionType === 'workout')!;
    expect(main.days).toEqual([1, 4]);
    expect(main.durationMin).toBe(30);
    expect(plan.routines.some((r) => r.protocolId === 'zone2')).toBe(false);
    expect(plan.goal.milestones![0].title).toContain('any two');
  });

  it('a consistent trainer keeps full volume plus the aerobic base', () => {
    const plan = buildGoalPlan(parseGoal('Build muscle'), null, undefined, {
      experience: 'consistent',
    });
    expect(plan.routines.find((r) => r.sessionType === 'workout')!.days).toHaveLength(3);
    expect(plan.routines.some((r) => r.protocolId === 'zone2')).toBe(true);
  });

  it('a sleep-anchored health goal plans light and wind-down, not workouts', () => {
    const plan = buildGoalPlan(parseGoal('More energy and better health'), null, undefined, {
      anchor: 'sleep',
    });
    const ids = plan.routines.map((r) => r.protocolId);
    expect(ids).toEqual(expect.arrayContaining(['morning-light', 'wind-down']));
    expect(plan.routines.some((r) => r.sessionType === 'workout')).toBe(false);
  });

  it('a debt-mode finance goal gets debt milestones', () => {
    const plan = buildGoalPlan(parseGoal('Save my way out of debt'), null, undefined, {
      mode: 'debt',
    });
    expect(plan.goal.milestones!.map((m) => m.title)).toContain('List every debt with its rate');
  });

  it('a focus-bottleneck business goal carves out deep work', () => {
    const plan = buildGoalPlan(parseGoal('Grow the business'), null, undefined, {
      bottleneck: 'focus',
    });
    expect(plan.routines.some((r) => r.protocolId === 'deep-work')).toBe(true);
  });
});
