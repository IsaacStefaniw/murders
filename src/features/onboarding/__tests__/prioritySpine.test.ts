import { activeSteps, deferredSteps, isCore, INTERVIEW_STEPS } from '@/features/onboarding/script';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';

/**
 * Ranking family first has to produce something family-shaped.
 *
 * Walking the real app: pick Family · Health · Work, watch the interview
 * answer "Noted. When two things want the same hour, family wins", and get
 * a first week containing a wind-down and one training block. Nothing for
 * family. Nothing for work.
 *
 * Every family and couple routine in buildPlan is gated on `household`,
 * and `household` was `deferTo: 'family'` — a coach the person may never
 * open. So the app's most prominent promise was broken ninety seconds
 * after it was made, by a question it chose not to ask.
 */

const BASE = {
  name: 'Sam',
  weekShape: 'employed',
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'morning',
  trainingDays: '3',
  capacity: 'steady',
};

describe('a stated priority pulls its question into the spine', () => {
  it('asks about the household when family is one of the priorities', () => {
    const answers = { ...BASE, priorities: ['family', 'health', 'work'] };
    const ids = activeSteps(answers).map((s) => s.id);
    expect(ids).toContain('household');
  });

  it('asks it for a relationship priority too', () => {
    const ids = activeSteps({ ...BASE, priorities: ['relationship'] }).map((s) => s.id);
    expect(ids).toContain('household');
  });

  it('leaves everybody else’s spine exactly as it was', () => {
    // The whole point of the spine is that it does not creep. Somebody who
    // did not say family matters is asked no more than before.
    const answers = { ...BASE, priorities: ['health', 'work', 'growth'] };
    expect(activeSteps(answers).map((s) => s.id)).not.toContain('household');
    // And it is still offered later, in the coach that consumes it.
    expect(deferredSteps(answers, 'family').map((s) => s.id)).toContain('household');
  });

  it('never offers the same question twice', () => {
    const answers = { ...BASE, priorities: ['family'] };
    const step = INTERVIEW_STEPS.find((s) => s.id === 'household')!;
    expect(isCore(step, answers)).toBe(true);
    expect(deferredSteps(answers, 'family').map((s) => s.id)).not.toContain('household');
  });
});

describe('the plan that comes out of it', () => {
  it('builds something family-shaped when family is first and answered', () => {
    const plan = buildLifeOperatingPlan({
      ...BASE,
      priorities: ['family', 'health', 'work'],
      household: ['partner', 'kids'],
    } as never);
    const family = plan.routines.filter((r) => r.area === 'family' || r.area === 'relationship');
    expect(family.length).toBeGreaterThan(0);
  });

  it('is the regression: family first, household unanswered, empty week', () => {
    // This is what shipped. Kept as a test so the shape of the failure is
    // recorded rather than remembered — if `household` ever slips back out
    // of the spine, the interview will start promising this again.
    const plan = buildLifeOperatingPlan({
      ...BASE,
      priorities: ['family', 'health', 'work'],
    } as never);
    const family = plan.routines.filter((r) => r.area === 'family' || r.area === 'relationship');
    expect(family).toHaveLength(0);

    // And the spine now prevents reaching that state from the real flow.
    expect(activeSteps({ ...BASE, priorities: ['family'] }).map((s) => s.id)).toContain('household');
  });
});
