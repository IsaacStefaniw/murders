/**
 * The interview, answered every way it can be.
 *
 * `buildPlan.test.ts` walks one household through the questions and pins
 * what each answer does. This walks every answer for every question, one
 * dimension at a time from a few baselines, and then a seeded sample of
 * full combinations, and asks the questions a person cannot see the answer
 * to: did it throw, did a practice arrive twice, does every routine name a
 * practice the library actually has, and did the right coaches start.
 */

import { CONSTRAINT_EFFECTS, CONSTRAINT_LABELS, describeConstraints } from '@/features/onboarding/constraints';
import { buildLifeOperatingPlan, HABIT_PROTOCOL } from '@/features/onboarding/buildPlan';
import { INTERVIEW_STEPS, type InterviewAnswers } from '@/features/onboarding/script';
import { moneyOptions, WEEK_SHAPES } from '@/features/onboarding/markets';
import { applicableRoutines, protocolById } from '@/features/knowledge/protocols';
import type { PhysicalConstraint, Routine } from '@/types/domain';

const options = (id: string, answers: InterviewAnswers = {}): string[] => {
  const step = INTERVIEW_STEPS.find((s) => s.id === id)!;
  const opts = typeof step.options === 'function' ? step.options(answers) : step.options;
  return (opts ?? []).map((o) => o.value);
};

const CAPACITY = options('capacity');
const HOUSEHOLDS: string[][] = [
  [],
  ['solo'],
  ['partner'],
  ['kids'],
  ['partner', 'kids'],
  ['grandkids'],
  ['parent'],
  ['housemates'],
  ['family_home'],
  ['partner', 'kids', 'parent', 'grandkids'],
];
const CONSTRAINTS = options('constraints') as PhysicalConstraint[];
const HABITS = options('existingHabits');
const MIND = options('mind');
const FOOD_AIMS = options('foodAim');
const FOOD_TROUBLE = options('foodTrouble');
const LESS_OF = options('lessOf');
const WORK_HOURS = ['06:00-14:00', '07:00-19:00', '14:00-22:00', '19:00-07:00', '09:00-17:30', '10:00-18:00'];
const SLEEP = options('sleep');
const TRAINING = ['0', '1', '2', '3', '4', '5', '6'];

const baseline: InterviewAnswers = {
  name: 'Sam',
  weekShape: 'employed',
  priorities: ['health', 'family', 'work'],
  capacity: 'steady',
  household: ['partner', 'kids'],
  kidsCount: '2',
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'morning',
  trainingDays: '3',
  ambition: 'Get strong again',
};

/** Deterministic PRNG, so a failing sample can be replayed by index. */
function mulberry32(a: number) {
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(rng: () => number, xs: T[]): T => xs[Math.floor(rng() * xs.length)];
const some = <T,>(rng: () => number, xs: T[]): T[] => xs.filter(() => rng() < 0.35);

function randomAnswers(seed: number): InterviewAnswers {
  const rng = mulberry32(seed);
  const weekShape = pick(rng, WEEK_SHAPES);
  const money = pick(rng, moneyOptions(weekShape).map((o) => o.value));
  return {
    name: 'Sam',
    weekShape,
    priorities: some(rng, ['family', 'relationship', 'health', 'work', 'growth', 'enjoyment', 'admin']),
    capacity: pick(rng, CAPACITY),
    household: pick(rng, HOUSEHOLDS),
    kidsCount: pick(rng, ['', '1', '2', '3', '4']),
    partnerName: rng() < 0.5 ? 'Alex' : '',
    age: pick(rng, options('age')),
    workStyle: pick(rng, options('workStyle')),
    workDays: some(rng, ['1', '2', '3', '4', '5', '6', '0']),
    workHours: pick(rng, WORK_HOURS),
    weekAnchors: some(rng, options('weekAnchors')),
    sleep: pick(rng, SLEEP),
    sleepQuality: pick(rng, options('sleepQuality')),
    pressure: pick(rng, options('pressure')),
    energy: pick(rng, options('energy')),
    trainingDays: pick(rng, TRAINING),
    constraints: some(rng, CONSTRAINTS),
    sexAtBirth: pick(rng, ['', 'female', 'male', 'preferNotToSay']),
    trainingSetup: pick(rng, options('trainingSetup')),
    trainingExperience: pick(rng, options('trainingExperience')),
    existingHabits: some(rng, HABITS),
    weight: pick(rng, ['', '62', '90']),
    foodAim: pick(rng, FOOD_AIMS),
    foodTrouble: pick(rng, FOOD_TROUBLE),
    mind: some(rng, MIND),
    moreOf: some(rng, ['Deep work', 'Reading', 'Creative time', 'Time with the kids', 'Seeing friends', 'Date nights', 'Cooking real food', 'Adventure & travel']),
    lessOf: some(rng, LESS_OF),
    money,
    moneyAutomation: pick(rng, ['', 'yes', 'partial', 'no']),
    ambition: pick(rng, ['', 'Get strong again', 'Grow the business to $2m revenue', 'Run a half marathon', 'Stop vaping', 'Save $20k by December']),
  };
}

/** Everything that must be true of any plan the interview produces. */
function check(answers: InterviewAnswers): string[] {
  const problems: string[] = [];
  let plan: ReturnType<typeof buildLifeOperatingPlan>;
  try {
    plan = buildLifeOperatingPlan(answers);
  } catch (e) {
    return [`threw: ${String(e)}`];
  }
  const { routines, goals, profile, pathStarts } = plan;

  // One practice per protocol, one id per routine, one id per goal.
  const protocols = routines.map((r) => r.protocolId).filter(Boolean);
  if (new Set(protocols).size !== protocols.length) problems.push(`duplicate protocol: ${protocols.sort().join(',')}`);
  if (new Set(routines.map((r) => r.id)).size !== routines.length) problems.push('duplicate routine id');
  if (new Set(goals.map((g) => g.id)).size !== goals.length) problems.push('duplicate goal id');

  // No routine claims a practice the library does not have.
  for (const r of routines) {
    if (r.protocolId && !protocolById(r.protocolId)) problems.push(`orphan protocol ${r.protocolId} on "${r.title}"`);
  }

  // Goals and routines point at each other honestly.
  const routineIds = new Set(routines.map((r) => r.id));
  const goalIds = new Set(goals.map((g) => g.id));
  for (const g of goals) for (const id of g.routineIds) if (!routineIds.has(id)) problems.push(`goal "${g.title}" names a missing routine`);
  for (const r of routines) if (r.goalId && !goalIds.has(r.goalId)) problems.push(`routine "${r.title}" names a missing goal`);

  // Nothing in an interview plan is anatomy-specific, so it applies to
  // every body, told or untold.
  for (const sex of [undefined, 'male', 'female', 'preferNotToSay'] as const) {
    if (applicableRoutines(routines, sex).length !== routines.length) problems.push(`a routine does not apply to sex=${sex}`);
  }

  // The family dinner is the device-free meal, protected, every night.
  const household = Array.isArray(answers.household) ? answers.household : [];
  const dinner = routines.filter((r) => r.protocolId === 'device-free-meal');
  const expectsDinner = household.includes('partner') || household.includes('kids');
  if (dinner.length !== (expectsDinner ? 1 : 0)) problems.push(`expected ${expectsDinner ? 1 : 0} dinners, got ${dinner.length}`);
  if (dinner[0] && !(dinner[0].protected && dinner[0].tier === 'must' && dinner[0].days.length === 7)) problems.push('dinner is not protected nightly');

  // Zero training means zero.
  const training = Number(answers.trainingDays);
  // A fitness ambition ("Run a half marathon") carries its own sessions,
  // and an existing running habit is an anchor rather than an ask; what
  // must not appear is the interview's own training goal and workout.
  if (answers.trainingDays === '0') {
    if (goals.some((g) => /^(Train|Walk) \d+× a week$/.test(g.title))) problems.push('a training goal for someone who said none');
    if (routines.some((r) => r.title === 'Strength workout')) problems.push('training scheduled for someone who said none');
  }
  if (Number.isFinite(training) && training > 0 && answers.capacity === 'minimal' && profile.trainingDaysPerWeek > 3) problems.push('minimal week over three sessions');

  // Optional practices on a minimal week run at most twice.
  if (answers.capacity === 'minimal') {
    for (const r of routines) if (r.tier === 'could' && r.days.length > 2) problems.push(`could-tier "${r.title}" on ${r.days.length} days at minimal`);
  }

  // The coaches the answers justify, and only those.
  const foodAim = typeof answers.foodAim === 'string' ? answers.foodAim : '';
  const nutrition = pathStarts.find((p) => p.id === 'nutrition');
  if (Boolean(foodAim && foodAim !== 'none') !== Boolean(nutrition)) problems.push('nutrition start mismatch');
  if (nutrition) {
    if (nutrition.answers.aim !== foodAim) problems.push('nutrition aim not carried');
    const trouble = typeof answers.foodTrouble === 'string' ? answers.foodTrouble : '';
    if ((nutrition.answers.trouble ?? '') !== trouble) problems.push('food trouble not carried');
    if (routines.some((r) => r.protocolId === 'meal-sketch')) problems.push('interview meal sketch beside the nutrition coach');
    const habits = Array.isArray(answers.existingHabits) ? answers.existingHabits : [];
    if ((nutrition.answers.leverLevel === '1') !== habits.includes('fasting')) problems.push('fasting lever not carried');
  }
  const money = typeof answers.money === 'string' ? answers.money : '';
  const moneyStart = pathStarts.find((p) => p.id === 'money');
  if (Boolean(money && money !== 'none') !== Boolean(moneyStart)) problems.push('money start mismatch');
  if (moneyStart) {
    if (moneyStart.answers.mode !== (money === 'checkin' ? 'clarity' : money)) problems.push('money mode mismatch');
    const automation = typeof answers.moneyAutomation === 'string' && answers.moneyAutomation ? answers.moneyAutomation : 'partial';
    if (moneyStart.answers.automation !== automation) problems.push('money automation mismatch');
  }
  const lessOf = Array.isArray(answers.lessOf) ? answers.lessOf : [];
  const recovery = pathStarts.find((p) => p.id === 'recovery');
  if ((lessOf.length > 0) !== Boolean(recovery)) problems.push('recovery start mismatch');
  if (recovery) {
    if (recovery.answers.behaviour !== lessOf[0]) problems.push('recovery behaviour is not the first less-of');
    const mind = Array.isArray(answers.mind) ? answers.mind : [];
    if (recovery.answers.replacement !== (mind.includes('breathing') ? 'breathe' : 'unsure')) problems.push('recovery replacement mismatch');
  }
  if (plan.behaviourIntentions.map((b) => b.behaviour).join() !== lessOf.join()) problems.push('intentions do not mirror less-of');

  // Every existing habit is an established anchor, never a fresh ask.
  const habits = Array.isArray(answers.existingHabits) ? answers.existingHabits : [];
  for (const h of habits) {
    const pid = HABIT_PROTOCOL[h as keyof typeof HABIT_PROTOCOL];
    if (!pid) continue;
    const r = routines.find((x) => x.protocolId === pid || (h === 'workout' && x.sessionType === 'workout'));
    if (r && !r.established) problems.push(`habit ${h} scheduled as new`);
  }

  return problems;
}

const label = (a: InterviewAnswers) => JSON.stringify(a);

describe('one dimension at a time, from three baselines', () => {
  const baselines: InterviewAnswers[] = [
    baseline,
    { ...baseline, weekShape: 'retired', workDays: [], workHours: '', household: ['partner'], capacity: 'minimal', weekAnchors: ['group', 'family'] },
    { ...baseline, weekShape: 'shift', workDays: ['1', '3', '4', '6'], workHours: '19:00-07:00', household: [], capacity: 'push', sleep: '08:30-00:15' },
  ];

  const dimensions: [string, (b: InterviewAnswers) => InterviewAnswers[]][] = [
    ['weekShape', (b) => WEEK_SHAPES.map((weekShape) => ({ ...b, weekShape }))],
    ['capacity', (b) => CAPACITY.map((capacity) => ({ ...b, capacity }))],
    ['household', (b) => HOUSEHOLDS.map((household) => ({ ...b, household }))],
    ['constraints', (b) => [...CONSTRAINTS.map((c) => ({ ...b, constraints: [c] })), { ...b, constraints: CONSTRAINTS }]],
    ['existingHabits', (b) => [...HABITS.map((h) => ({ ...b, existingHabits: [h] })), { ...b, existingHabits: HABITS }]],
    ['mind', (b) => [...MIND.map((m) => ({ ...b, mind: [m] })), { ...b, mind: MIND }, { ...b, mind: [] }]],
    ['foodAim', (b) => FOOD_AIMS.flatMap((foodAim) => FOOD_TROUBLE.map((foodTrouble) => ({ ...b, foodAim, foodTrouble })))],
    ['money', (b) => ['checkin', 'saving', 'debt', 'lasting', 'getting_on_top', 'none'].flatMap((money) => ['', 'yes', 'partial', 'no'].map((moneyAutomation) => ({ ...b, money, moneyAutomation })))],
    ['lessOf', (b) => [...LESS_OF.map((l) => ({ ...b, lessOf: [l] })), { ...b, lessOf: LESS_OF }, { ...b, lessOf: LESS_OF, mind: ['breathing'] }]],
    ['workHours', (b) => WORK_HOURS.map((workHours) => ({ ...b, workHours }))],
    ['sleep', (b) => SLEEP.map((sleep) => ({ ...b, sleep }))],
    ['trainingDays', (b) => TRAINING.flatMap((trainingDays) => options('trainingSetup').map((trainingSetup) => ({ ...b, trainingDays, trainingSetup })))],
  ];

  it.each(dimensions)('%s: every answer builds a sound plan', (_name, variants) => {
    const failures: string[] = [];
    for (const b of baselines) {
      for (const answers of variants(b)) {
        for (const p of check(answers)) failures.push(`${label(answers)}: ${p}`);
      }
    }
    expect(failures.slice(0, 8)).toEqual([]);
  });
});

describe('a seeded sample of whole interviews', () => {
  it('two thousand people, no throw, no duplicate, no orphan, the right coaches', () => {
    const failures: string[] = [];
    for (let seed = 1; seed <= 2000; seed += 1) {
      const answers = randomAnswers(seed);
      for (const p of check(answers)) failures.push(`seed ${seed} ${label(answers)}: ${p}`);
    }
    expect(failures.slice(0, 8)).toEqual([]);
  });
});

describe('the constraints the plan says back', () => {
  it('has a label and an effect for every constraint the interview offers', () => {
    for (const c of CONSTRAINTS) {
      expect(CONSTRAINT_LABELS[c].length).toBeGreaterThan(5);
      expect(CONSTRAINT_EFFECTS[c].length).toBeGreaterThan(30);
      // Education, never advice: no verdicts on the person's condition.
      expect(CONSTRAINT_EFFECTS[c]).not.toMatch(/prescri|diagnos|you should|you must/i);
    }
    const all = describeConstraints(CONSTRAINTS);
    expect(all).toHaveLength(CONSTRAINTS.length);
    expect(describeConstraints(undefined)).toEqual([]);
    expect(describeConstraints([])).toEqual([]);
  });

  it('every constraint the type allows has copy, so a late answer is never blank', () => {
    const typed = Object.keys(CONSTRAINT_LABELS) as PhysicalConstraint[];
    expect(new Set(typed)).toEqual(new Set(CONSTRAINTS));
  });
});

describe('shapes of a working week', () => {
  it('hours across midnight build without a broken profile', () => {
    const night = buildLifeOperatingPlan({ ...baseline, weekShape: 'shift', workHours: '19:00-07:00', sleep: '08:30-00:15' });
    expect(night.profile.workStart).toBe('19:00');
    expect(night.profile.workEnd).toBe('07:00');
    expect(night.profile.wakeTime).toBe('08:30');
    expect(night.profile.sleepTime).toBe('00:15');
    expect(night.routines.length).toBeGreaterThan(0);
  });

  it('a retiree gets anchors and no invented job', () => {
    const jo = buildLifeOperatingPlan({ ...baseline, weekShape: 'retired', workDays: [], weekAnchors: ['group', 'faith', 'care'] });
    expect(jo.profile.workDays).toEqual([]);
    expect(jo.routines.map((r) => r.title)).toEqual(expect.arrayContaining(['Class or club', 'Church or community', 'Caring']));
  });

  it('a carer with a school run keeps a working week only if told so', () => {
    const carer = buildLifeOperatingPlan({ ...baseline, weekShape: 'caring', workDays: [] });
    // Caring at home is a shape with work in it (the school run is the work).
    expect(carer.profile.workDays.length).toBeGreaterThan(0);
  });
});

/** A routine reaches the plan only if a body it applies to owns it. */
describe('nothing in the interview is for one anatomy', () => {
  it('every routine the interview can produce applies to everyone', () => {
    const produced = new Set<string>();
    for (let seed = 1; seed <= 300; seed += 1) {
      for (const r of buildLifeOperatingPlan(randomAnswers(seed)).routines as Routine[]) {
        if (r.protocolId) produced.add(r.protocolId);
      }
    }
    for (const id of produced) expect({ id, appliesTo: protocolById(id)?.appliesTo }).toEqual({ id, appliesTo: undefined });
  });
});
