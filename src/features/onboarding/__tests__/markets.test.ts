import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { ambitionPlaceholder, moneyOptions, worksSomewhere } from '@/features/onboarding/markets';
import { activeSteps, optionsFor, INTERVIEW_STEPS } from '@/features/onboarding/script';

const spine = {
  name: 'Margaret',
  priorities: ['family', 'health', 'growth'],
  sleep: '05:00-21:00',
  energy: 'morning',
  trainingDays: '3',
};

describe('the retired market', () => {
  const plan = buildLifeOperatingPlan({
    ...spine,
    weekShape: 'retired',
    weekAnchors: ['volunteering', 'family'],
  });

  it('does not invent a job that does not exist', () => {
    // The defect this whole round started from: an empty workDays array was
    // read as missing data and backfilled with Monday to Friday, so a
    // retiree's first plan was built around a 9-to-5 they do not have.
    expect(plan.profile.workDays).toEqual([]);
  });

  it('builds the week out of what they already have in it', () => {
    const titles = plan.routines.map((r) => r.title);
    expect(titles).toContain('Volunteering');
    expect(titles).toContain('Time with family');
  });

  it('leaves their own commitments unpoliced', () => {
    // Knowing about the bowls club is the point. Reminding them to attend
    // it is not.
    const volunteering = plan.routines.find((r) => r.title === 'Volunteering')!;
    expect(volunteering.protected).toBe(false);
    expect(volunteering.flexible).toBe(true);
  });
});

describe('a week that still has work in it', () => {
  it('keeps the Monday-to-Friday default when someone works but skipped the days', () => {
    const plan = buildLifeOperatingPlan({ ...spine, weekShape: 'employed' });
    expect(plan.profile.workDays).toEqual([1, 2, 3, 4, 5]);
  });

  it('treats caring hours as committed time, not spare time', () => {
    const plan = buildLifeOperatingPlan({
      ...spine,
      weekShape: 'caring',
      workDays: ['1', '3', '5'],
    });
    expect(plan.profile.workDays).toEqual([1, 3, 5]);
    expect(worksSomewhere('caring')).toBe(true);
  });
});

describe('choosing not to train', () => {
  it('means zero, not three', () => {
    // Number('0') || 3 quietly handed back three sessions a week.
    const plan = buildLifeOperatingPlan({ ...spine, trainingDays: '0' });
    expect(plan.profile.trainingDaysPerWeek).toBe(0);
  });

  it('produces no training goal and no training routine', () => {
    const plan = buildLifeOperatingPlan({ ...spine, trainingDays: '0' });
    expect(plan.goals.some((g) => /train|walk/i.test(g.title))).toBe(false);
    expect(plan.routines.some((r) => r.title === 'Strength workout')).toBe(false);
  });

  it('is actually offered as an answer', () => {
    const step = INTERVIEW_STEPS.find((s) => s.id === 'trainingDays')!;
    expect(optionsFor(step, {}).map((o) => o.value)).toContain('0');
  });

  it('still builds the rest of the plan', () => {
    const plan = buildLifeOperatingPlan({ ...spine, trainingDays: '0' });
    expect(plan.routines.length).toBeGreaterThan(0);
  });
});

describe('questions that fit the person answering them', () => {
  it('offers a retiree money answers that exist for them', () => {
    expect(moneyOptions('retired').map((o) => o.value)).toContain('lasting');
    expect(moneyOptions('study').map((o) => o.value)).toContain('getting_on_top');
  });

  it('never shows one market another market examples', () => {
    // The old placeholder offered "Grow the business to $2m" to everybody.
    expect(ambitionPlaceholder('retired')).not.toMatch(/business/i);
    expect(ambitionPlaceholder('study')).not.toMatch(/\$2m/);
  });

  it('asks a shift worker about shifts, not about nine to five', () => {
    const step = INTERVIEW_STEPS.find((s) => s.id === 'workHours')!;
    const labels = optionsFor(step, { weekShape: 'shift' }).map((o) => o.label);
    expect(labels.some((l) => /night/i.test(l))).toBe(true);
  });

  it('offers an early enough day for someone who is up at five', () => {
    const step = INTERVIEW_STEPS.find((s) => s.id === 'sleep')!;
    expect(optionsFor(step, {}).map((o) => o.value)).toContain('05:00-21:00');
  });

  it('reaches every market without a question that cannot be answered', () => {
    for (const shape of ['employed', 'selfDirected', 'shift', 'study', 'caring', 'retired']) {
      const steps = activeSteps({ weekShape: shape });
      for (const step of steps) {
        if (step.kind === 'text') continue;
        // A chip question with nothing to tap is a dead end.
        expect(optionsFor(step, { weekShape: shape }).length).toBeGreaterThan(0);
      }
    }
  });
});
