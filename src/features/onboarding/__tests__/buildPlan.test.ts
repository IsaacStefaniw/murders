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

  it('routes the free-text ambition through the domain-aware goal planner', () => {
    const business = plan.goals.find((g) => g.title === 'Grow the business')!;
    expect(business.domain).toBe('business');
    expect(business.milestones!.length).toBeGreaterThanOrEqual(3);
    const block = plan.routines.find((r) => r.goalId === business.id)!;
    expect(block.duringWork).toBe(true);
    expect(block.title).toContain('Growth block');
  });

  it('the headspace step creates a meditation routine and a nightly breathing wind-down', () => {
    const withMind = buildLifeOperatingPlan({ ...answers, mind: ['meditation', 'breathing'] });
    const sit = withMind.routines.find((r) => r.sessionType === 'meditate')!;
    expect(sit.title).toBe('Sit for ten');
    const windDown = withMind.routines.find((r) => r.sessionType === 'breathe')!;
    expect(windDown.days).toHaveLength(7);
  });

  it('creates a weekend family adventure block for households with kids', () => {
    const adventure = plan.routines.find((r) => r.title === 'Family adventure')!;
    expect(adventure.days).toEqual([6]);
    expect(adventure.area).toBe('family');
  });

  it('gives the friends goal a concrete low-friction routine', () => {
    const friendsGoal = plan.goals.find((g) => g.title === 'Stay close to friends')!;
    expect(friendsGoal.routineIds).toHaveLength(1);
    const reachOut = plan.routines.find((r) => r.goalId === friendsGoal.id)!;
    expect(reachOut.title).toBe('Message a friend, make a plan');
  });

  it('creates during-work deep-work blocks when deep work is asked for', () => {
    const withDeepWork = buildLifeOperatingPlan({ ...answers, moreOf: ['Deep work'] });
    const block = withDeepWork.routines.find((r) => r.title === 'Deep work block')!;
    expect(block.duringWork).toBe(true);
    expect(block.days).toEqual([1, 2]);
  });

  it('creates an evening reading routine in place of the scroll window', () => {
    const withReading = buildLifeOperatingPlan({ ...answers, moreOf: ['Reading'] });
    const read = withReading.routines.find((r) => r.title === 'Read')!;
    expect(read.preferredStart).toBe('21:25'); // 65 min before the 22:30 sleep target
  });

  it('minimal capacity plans smaller: capped training, shorter sessions, trimmed extras', () => {
    const tired = buildLifeOperatingPlan({
      ...answers,
      capacity: 'minimal',
      trainingDays: '5',
      mind: ['meditation'],
      moreOf: ['Reading', 'Time with the kids'],
    });
    expect(tired.profile.capacity).toBe('minimal');
    expect(tired.profile.trainingDaysPerWeek).toBe(3); // capped from 5
    expect(tired.profile.trainingDurationMin).toBe(30);
    for (const r of tired.routines.filter((x) => x.tier === 'could')) {
      expect(r.days.length).toBeLessThanOrEqual(2);
    }
  });

  it('sauna, cooking, adventure and money selections generate their modality footholds', () => {
    const wide = buildLifeOperatingPlan({
      ...answers,
      mind: ['sauna'],
      moreOf: ['Adventure & travel', 'Cooking real food'],
      money: 'checkin',
    });
    expect(wide.routines.some((r) => r.title === 'Sauna & recover')).toBe(true);
    expect(wide.routines.some((r) => r.title === 'Sunday meal sketch')).toBe(true);
    // Money now arrives as an auto-started path, not a lone block.
    expect(wide.pathStarts.find((p) => p.id === 'money')?.answers.mode).toBe('clarity');
    const trip = wide.goals.find((g) => g.domain === 'experience')!;
    expect(trip.milestones!.map((m) => m.title)).toContain('Book it');
  });

  it("'saving for something big' auto-starts the money path in saving mode", () => {
    const saver = buildLifeOperatingPlan({
      ...answers,
      money: 'saving',
      moneyAutomation: 'no',
    });
    const start = saver.pathStarts.find((p) => p.id === 'money')!;
    expect(start.answers).toEqual({ mode: 'saving', automation: 'no' });
  });

  it('interview v4 answers flow to the profile and start the right paths', () => {
    const v4 = buildLifeOperatingPlan({
      ...answers,
      vision: 'Fit at 50, business runs without me',
      age: '45',
      weight: '92',
      kidsCount: '2',
      workStyle: 'maker',
      foodAim: 'weight',
      lessOf: ['alcohol', 'doomscrolling'],
    });
    expect(v4.profile.age).toBe(45);
    expect(v4.profile.weightKg).toBe(92);
    expect(v4.profile.kidsCount).toBe(2);
    expect(v4.profile.workStyle).toBe('maker');
    expect(v4.profile.lifeVision).toContain('Fit at 50');
    const ids = v4.pathStarts.map((p) => p.id);
    expect(ids).toContain('nutrition');
    expect(ids).toContain('recovery');
    const recovery = v4.pathStarts.find((p) => p.id === 'recovery')!;
    expect(recovery.answers.behaviour).toBe('alcohol');
    // Nutrition path owns the meal sketch — no duplicate local one.
    expect(v4.routines.filter((r) => r.protocolId === 'meal-sketch')).toHaveLength(0);
  });

  it('walking as training builds a walking program, not a gym one', () => {
    const walker = buildLifeOperatingPlan({
      ...answers,
      trainingSetup: 'walking',
      trainingDays: '4',
    });
    expect(walker.routines.some((r) => r.sessionType === 'workout')).toBe(false);
    const walk = walker.routines.find((r) => r.protocolId === 'daily-walk')!;
    expect(walk.days.length).toBeGreaterThanOrEqual(4);
    expect(walker.goals.some((g) => g.title.startsWith('Walk'))).toBe(true);
    expect(walker.profile.trainingPreference).toBe('outdoors');
  });

  it('creative time gets a defended block', () => {
    const creative = buildLifeOperatingPlan({ ...answers, moreOf: ['Creative time'] });
    expect(creative.routines.some((r) => r.protocolId === 'creative-block')).toBe(true);
  });

  it('broken sleep promotes the wind-down to protected and adds morning light', () => {
    const tired = buildLifeOperatingPlan({ ...answers, lessOf: [], sleepQuality: 'broken' });
    const windDown = tired.routines.find((r) => r.protocolId === 'wind-down')!;
    expect(windDown.protected).toBe(true);
    expect(windDown.tier).toBe('must');
    expect(tired.routines.some((r) => r.protocolId === 'morning-light')).toBe(true);
    // Solid sleepers keep the light-touch version.
    const rested = buildLifeOperatingPlan({ ...answers, lessOf: [], sleepQuality: 'good' });
    expect(rested.routines.find((r) => r.protocolId === 'wind-down')!.tier).toBe('could');
    expect(rested.routines.some((r) => r.protocolId === 'morning-light')).toBe(false);
  });

  it('redline pressure schedules a midday NSDR reset', () => {
    const hot = buildLifeOperatingPlan({ ...answers, pressure: 'redline' });
    expect(hot.routines.some((r) => r.protocolId === 'nsdr')).toBe(true);
    expect(hot.profile.pressure).toBe('redline');
    const calm = buildLifeOperatingPlan({ ...answers, pressure: 'calm' });
    expect(calm.routines.some((r) => r.protocolId === 'nsdr')).toBe(false);
  });

  it('the food-trouble answer rides into the nutrition path intake', () => {
    const v5 = buildLifeOperatingPlan({ ...answers, foodAim: 'weight', foodTrouble: 'evenings' });
    const nutrition = v5.pathStarts.find((p) => p.id === 'nutrition')!;
    expect(nutrition.answers.trouble).toBe('evenings');
  });

  it('existing habits become established anchors, never fresh prescriptions', () => {
    const habitual = buildLifeOperatingPlan({
      ...answers,
      existingHabits: ['walking', 'sauna', 'journaling', 'fasting'],
      foodAim: 'weight',
    });
    expect(habitual.profile.existingHabits).toEqual(['walking', 'sauna', 'journaling', 'fasting']);
    for (const pid of ['daily-walk', 'sauna', 'evening-journal', 'fasting-window']) {
      const r = habitual.routines.find((x) => x.protocolId === pid)!;
      expect(r).toBeDefined();
      expect(r.established).toBe(true);
    }
    // A faster's first nutrition lever is live from day one.
    const nutrition = habitual.pathStarts.find((p) => p.id === 'nutrition')!;
    expect(nutrition.answers.leverLevel).toBe('1');
  });

  it('a habit and the mind toolkit never duplicate a protocol — it just becomes established', () => {
    const both = buildLifeOperatingPlan({
      ...answers,
      mind: ['meditation', 'sauna'],
      existingHabits: ['meditation', 'sauna'],
    });
    expect(both.routines.filter((r) => r.protocolId === 'meditation-10')).toHaveLength(1);
    expect(both.routines.filter((r) => r.protocolId === 'sauna')).toHaveLength(1);
    expect(both.routines.find((r) => r.protocolId === 'meditation-10')!.established).toBe(true);
  });

  it('an existing gym habit marks the training routine established and implies consistent experience', () => {
    const lifter = buildLifeOperatingPlan({
      ...answers,
      existingHabits: ['workout'],
      ambition: 'Get back to the gym',
      trainingExperience: undefined,
    });
    const training = lifter.routines.find((r) => r.sessionType === 'workout')!;
    expect(training.established).toBe(true);
  });

  it('falls back to sensible defaults on an empty interview', () => {
    const fallback = buildLifeOperatingPlan({});
    expect(fallback.profile.workDays).toEqual([1, 2, 3, 4, 5]);
    expect(fallback.profile.priorities.length).toBeGreaterThan(0);
    expect(fallback.routines.length).toBeGreaterThan(0);
  });
});
