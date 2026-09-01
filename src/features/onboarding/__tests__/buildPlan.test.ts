import {
  answersFromProfile,
  buildLifeOperatingPlan,
  PATH_ANSWER_FOR,
  profilePatchFor,
} from '@/features/onboarding/buildPlan';
import {
  activeSteps,
  deferredSteps,
  INTERVIEW_STEPS,
  type InterviewAnswers,
} from '@/features/onboarding/script';

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

describe('the interview spine', () => {
  const answered: InterviewAnswers = {
    name: 'Sam',
    priorities: ['family', 'health'],
    capacity: 'steady',
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    energy: 'morning',
    trainingDays: '3',
    ambition: 'Run a half marathon',
  };

  /**
   * The whole trade. Twenty-eight questions before anyone had seen the app
   * work was too long to survive and no more convincing for the length.
   */
  it('is short enough to finish before anyone has seen the app work', () => {
    expect(activeSteps({}).length).toBeLessThanOrEqual(10);
  });

  /**
   * The test for whether a question belongs in the spine: can the
   * scheduler build a correct first week without it? These are the ones it
   * cannot, and this is what stops the spine creeping back to twenty-eight.
   */
  it('contains exactly what the scheduler cannot work without', () => {
    expect(activeSteps({}).map((s) => s.id)).toEqual([
      'name',
      'priorities',
      'capacity',
      'workDays',
      'workHours',
      'sleep',
      'energy',
      'trainingDays',
      'existingHabits',
      'ambition',
    ]);
  });

  it('still produces a real plan, not a stub, from the spine alone', () => {
    const plan = buildLifeOperatingPlan(answered);
    expect(plan.profile.firstName).toBe('Sam');
    expect(plan.profile.workDays).toEqual([1, 2, 3, 4, 5]);
    expect(plan.profile.wakeTime).toBe('06:30');
    expect(plan.profile.trainingDaysPerWeek).toBe(3);
    expect(plan.routines.length).toBeGreaterThan(0);
    expect(plan.goals.length).toBeGreaterThan(0);
  });

  /**
   * Length is not the problem — unrewarded length is. Every spine question
   * says what it just changed, which is what makes the interview read as
   * the plan being built rather than as a form being filled.
   */
  it('tells you what changed after every answer that has an answer to show', () => {
    const withoutReveal = activeSteps({})
      .filter((s) => s.id !== 'name')
      .filter((s) => s.reveal?.(answered) == null);
    expect(withoutReveal.map((s) => s.id)).toEqual([]);
  });

  it('names your own numbers back to you rather than a generic confirmation', () => {
    const sleep = activeSteps({}).find((s) => s.id === 'sleep')!;
    expect(sleep.reveal!(answered)).toContain('22:30');
  });
});

describe('the deferred questions', () => {
  it('every one of them has somewhere to go', () => {
    const orphans = INTERVIEW_STEPS.filter((s) => !s.core && !s.deferTo);
    expect(orphans.map((s) => s.id)).toEqual([]);
  });

  it('are asked by the pathway that actually consumes them', () => {
    const training = deferredSteps({}, 'training').map((s) => s.id);
    expect(training).toContain('trainingExperience');
    expect(training).toContain('trainingSetup');
    expect(deferredSteps({}, 'nutrition').map((s) => s.id)).toContain('foodAim');
    expect(deferredSteps({}, 'money').map((s) => s.id)).toContain('money');
  });

  it('stop being asked once answered', () => {
    const before = deferredSteps({}, 'training').length;
    const after = deferredSteps({ trainingExperience: 'consistent' }, 'training').length;
    expect(after).toBe(before - 1);
  });

  it('respect the same skip rules the interview did', () => {
    // Walking is training; asking a walker about barbell experience is not
    // depth, it is a question that should never have been shown.
    expect(deferredSteps({ trainingSetup: 'walking' }, 'training').map((s) => s.id)).not.toContain(
      'trainingExperience',
    );
  });

  it('leave nothing unreachable — every step is either core or deferred', () => {
    const reachable = new Set([
      ...activeSteps({}, 'all').filter((s) => s.core).map((s) => s.id),
      ...(['training', 'nutrition', 'money', 'work', 'recovery', 'relationship', 'family', 'coaches'] as const)
        .flatMap((t) => deferredSteps({}, t).map((s) => s.id)),
    ]);
    const unreachable = INTERVIEW_STEPS.filter((s) => !reachable.has(s.id) && !s.skipIf?.({}));
    expect(unreachable.map((s) => s.id)).toEqual([]);
  });
});

describe('answering a deferred question late', () => {
  const base = buildLifeOperatingPlan({
    name: 'Sam',
    priorities: ['health'],
    capacity: 'steady',
    sleep: '06:30-22:30',
    trainingDays: '3',
  }).profile;

  it('lands on the profile field the interview would have filled', () => {
    expect(profilePatchFor('age', '45', base)).toEqual({ age: 45 });
    expect(profilePatchFor('pressure', 'redline', base)).toEqual({ pressure: 'redline' });
    expect(profilePatchFor('moreOf', ['Reading'], base)).toEqual({ moreOf: ['Reading'] });
  });

  /**
   * Answering "who is in the household" twice should not leave two
   * partners in it. The list is rebuilt rather than appended to.
   */
  it('does not duplicate the household when answered twice', () => {
    const once = profilePatchFor('household', ['partner', 'kids'], base)!;
    const twice = profilePatchFor('household', ['partner', 'kids'], {
      ...base,
      ...once,
    } as typeof base)!;
    expect(twice.people).toHaveLength(2);
  });

  it('keeps the partner’s name when the household answer is revisited', () => {
    const named = profilePatchFor('partnerName', 'Anna', {
      ...base,
      people: [{ id: 'p1', name: 'Partner', relation: 'partner' }],
    } as typeof base)!;
    const after = profilePatchFor('household', ['partner'], {
      ...base,
      ...named,
    } as typeof base)!;
    expect(after.people?.[0].name).toBe('Anna');
  });

  it('treats naming a partner as saying there is one', () => {
    const patch = profilePatchFor('partnerName', 'Anna', base)!;
    expect(patch.people).toEqual([expect.objectContaining({ name: 'Anna', relation: 'partner' })]);
  });

  it('returns nothing for the answers that belong to a pathway instead', () => {
    expect(profilePatchFor('foodAim', 'weight', base)).toBeNull();
    expect(profilePatchFor('trainingExperience', 'consistent', base)).toBeNull();
    expect(PATH_ANSWER_FOR.trainingExperience).toEqual({ path: 'training', key: 'experience' });
  });

  it('sends walking to the outdoors preference rather than dropping it', () => {
    expect(profilePatchFor('trainingSetup', 'walking', base)).toEqual({
      trainingPreference: 'outdoors',
    });
  });
});

/**
 * The migration for everyone who onboarded before the interview was split.
 * Their answers were never stored — the profile was the only record — so
 * without this they open the app and get asked eighteen questions they
 * already sat through, which is a worse first impression than the long
 * interview ever was.
 */
describe('rebuilding answers from an existing profile', () => {
  // Someone who answered the whole original twenty-eight — the case this
  // migration exists for.
  const full = buildLifeOperatingPlan({
    ...answers,
    workStyle: 'maker',
    sleepQuality: 'broken',
    pressure: 'redline',
    age: '45',
    weight: '90',
    vision: 'Present at home, sharp at work',
    existingHabits: ['walking'],
    moreOf: ['Reading'],
    lessOf: ['alcohol'],
  }).profile;

  it('recovers everything the profile can actually prove', () => {
    const recovered = answersFromProfile(full);
    expect(recovered.name).toBe('Isaac');
    expect(recovered.workHours).toBe(`${full.workStart}-${full.workEnd}`);
    expect(recovered.sleep).toBe(`${full.wakeTime}-${full.sleepTime}`);
    expect(recovered.household).toContain('partner');
    expect(recovered.partnerName).toBe('Anna');
  });

  it('leaves nothing outstanding for someone who answered everything', () => {
    const recovered = answersFromProfile(full);
    const stillAsked = (
      ['training', 'nutrition', 'money', 'work', 'recovery', 'relationship', 'family', 'coaches'] as const
    ).flatMap((t) => deferredSteps(recovered, t).map((s) => s.id));
    // Only the questions this profile genuinely cannot answer.
    expect(stillAsked).not.toContain('workStyle');
    expect(stillAsked).not.toContain('pressure');
    expect(stillAsked).not.toContain('household');
  });

  /**
   * 'outdoors' is where both 'outdoors' and 'walking' land, so it cannot be
   * reversed — and guessing wrong hands a walker a barbell programme.
   * Asking once is the correct outcome, not a compromise.
   */
  it('refuses to guess a setup it cannot recover, and asks instead', () => {
    const walker = { ...full, trainingPreference: 'outdoors' as const };
    const recovered = answersFromProfile(walker);
    expect(recovered.trainingSetup).toBeUndefined();
    expect(deferredSteps(recovered, 'training').map((s) => s.id)).toContain('trainingSetup');
  });

  it('does not mistake the placeholder partner name for a real one', () => {
    const unnamed = {
      ...full,
      people: [{ id: 'p1', name: 'Partner', relation: 'partner' as const }],
    };
    expect(answersFromProfile(unnamed).partnerName).toBeUndefined();
  });
});
