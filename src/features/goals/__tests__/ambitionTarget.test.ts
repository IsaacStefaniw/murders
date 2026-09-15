import { activeSteps } from '@/features/onboarding/script';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { parseGoal } from '@/features/goals/goalPlanner';

/**
 * One number and a date.
 *
 * The clearest result in the six-month simulation: the persona with a hard
 * target gained 184% from the coaches and finished at 82% completion; the
 * persona closest to the target user gained 6%, because "grow the business
 * to $2m" became a weekly review block.
 *
 * Two separate defects were behind that. The app already read a date out
 * of the sentence and then dropped it — only the manual goal wizard ever
 * turned a timeframe into a target date. And it never asked for one when
 * the sentence had none.
 */

const BASE = {
  name: 'Sam',
  weekShape: 'employed',
  priorities: ['health', 'work'],
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'morning',
  trainingDays: '3',
  capacity: 'steady',
};

describe('the date the person already wrote', () => {
  it('is read out of the sentence', () => {
    expect(parseGoal('Sub-3 marathon in October').timeframe).toBe('in October');
    expect(parseGoal('Save $20k by June 2028').timeframe).toBe('by June 2028');
  });

  it('reaches the goal as a target date', () => {
    // The regression: this used to parse and then vanish, so nothing
    // downstream could say "at this rate you arrive in March".
    const plan = buildLifeOperatingPlan({ ...BASE, ambition: 'Sub-3 marathon in October' } as never);
    const goal = plan.goals.find((g) => g.title.toLowerCase().includes('marathon'));
    expect(goal).toBeDefined();
    expect(goal!.targetDate).toBeTruthy();
  });

  it('stays undefined when no date was given', () => {
    // A goal without a date is a direction. Inventing one manufactures a
    // failure the person never signed up for.
    const plan = buildLifeOperatingPlan({ ...BASE, ambition: 'Get fitter' } as never);
    const goal = plan.goals.find((g) => g.title === 'Get fitter');
    expect(goal?.targetDate).toBeUndefined();
  });
});

describe('asking only when it cannot already tell', () => {
  it('asks when the ambition carries neither a number nor a date', () => {
    const ids = activeSteps({ ...BASE, ambition: 'Get strong enough to keep up with my kids' }).map(
      (s) => s.id,
    );
    expect(ids).toContain('ambitionTarget');
  });

  it('stays quiet when the sentence already has a date', () => {
    const ids = activeSteps({ ...BASE, ambition: 'Sub-3 marathon in October' }).map((s) => s.id);
    expect(ids).not.toContain('ambitionTarget');
  });

  it('stays quiet when the sentence already has a number', () => {
    const ids = activeSteps({ ...BASE, ambition: 'Deadlift 140 kg' }).map((s) => s.id);
    expect(ids).not.toContain('ambitionTarget');
  });

  it('never asks somebody who named no ambition at all', () => {
    expect(activeSteps(BASE).map((s) => s.id)).not.toContain('ambitionTarget');
  });
});

describe('the answer fills only what was missing', () => {
  it('gives the goal a date without touching its title', () => {
    const plan = buildLifeOperatingPlan({
      ...BASE,
      ambition: 'Get strong enough to keep up with my kids',
      ambitionTarget: '100 kg deadlift by March',
    } as never);
    const goal = plan.goals.find((g) => g.title.startsWith('Get strong enough'));
    expect(goal).toBeDefined();
    // The title is what renders on the calendar block — it must not absorb
    // the target sentence.
    expect(goal!.title).toBe('Get strong enough to keep up with my kids');
    expect(goal!.targetDate).toBeTruthy();
  });

  it('never overrides what the person said in their own sentence', () => {
    const plan = buildLifeOperatingPlan({
      ...BASE,
      ambition: 'Sub-3 marathon in October',
      ambitionTarget: 'something by December',
    } as never);
    const goal = plan.goals.find((g) => g.title.toLowerCase().includes('marathon'))!;
    const october = buildLifeOperatingPlan({
      ...BASE,
      ambition: 'Sub-3 marathon in October',
    } as never).goals.find((g) => g.title.toLowerCase().includes('marathon'))!;
    expect(goal.targetDate).toBe(october.targetDate);
  });
});
