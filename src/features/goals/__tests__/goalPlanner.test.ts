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
