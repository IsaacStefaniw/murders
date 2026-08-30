import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import type { InterviewAnswers } from '@/features/onboarding/script';

const answers: InterviewAnswers = {
  name: 'Isaac',
  priorities: ['family', 'health', 'work'],
  household: ['partner', 'kids'],
  partnerName: 'Anna',
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'midday',
  trainingDays: '4',
  trainingSetup: 'gym',
  moreOf: ['Date nights', 'Seeing friends'],
  lessOf: ['alcohol', 'doomscrolling'],
  ambition: 'Grow the business',
};

describe('buildLifeOperatingPlan', () => {
  const plan = buildLifeOperatingPlan(answers);

  it('extracts a structured profile from the interview', () => {
    expect(plan.profile.firstName).toBe('Isaac');
    expect(plan.profile.priorities).toEqual(['family', 'health', 'work']);
    expect(plan.profile.workStart).toBe('09:00');
    expect(plan.profile.sleepTime).toBe('22:30');
    expect(plan.profile.trainingDaysPerWeek).toBe(4);
    expect(plan.profile.people.map((p) => p.relation)).toEqual(['partner', 'child']);
  });

  it('creates a training routine in the energy-matched window on 4 spread days', () => {
    const training = plan.routines.find((r) => r.title === 'Strength workout')!;
    expect(training.days).toHaveLength(4);
    expect(training.preferredStart).toBe('12:05'); // midday energy
    expect(training.goalId).toBeDefined();
  });

  it('protects family dinner every day', () => {
    const dinner = plan.routines.find((r) => r.title === 'Family dinner')!;
    expect(dinner.protected).toBe(true);
    expect(dinner.tier).toBe('must');
    expect(dinner.days).toHaveLength(7);
  });

  it('creates a named date night goal with a weekly routine', () => {
    const dateGoal = plan.goals.find((g) => g.area === 'relationship')!;
    expect(dateGoal.title).toContain('Anna');
    const dateRoutine = plan.routines.find((r) => r.goalId === dateGoal.id)!;
    expect(dateRoutine.days).toEqual([5]);
  });

  it('turns lessOf selections into supportive behaviour intentions', () => {
    expect(plan.behaviourIntentions.map((b) => b.behaviour)).toEqual([
      'alcohol',
      'doomscrolling',
    ]);
    expect(plan.behaviourIntentions[0].intentionText).not.toMatch(/quit|stop|never/i);
  });

  it('turns the free-text ambition into a goal', () => {
    expect(plan.goals.some((g) => g.title === 'Grow the business')).toBe(true);
  });

  it('falls back to sensible defaults on an empty interview', () => {
    const fallback = buildLifeOperatingPlan({});
    expect(fallback.profile.workDays).toEqual([1, 2, 3, 4, 5]);
    expect(fallback.profile.priorities.length).toBeGreaterThan(0);
    expect(fallback.routines.length).toBeGreaterThan(0);
  });
});
