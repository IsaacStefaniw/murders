import { PATH_ORDER, PATHS } from '@/features/paths/definitions';
import type { LifeProfile } from '@/types/domain';

const profile: LifeProfile = {
  firstName: 'Isaac',
  priorities: ['health', 'work', 'family'],
  people: [],
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  capacity: 'steady',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  age: 47,
  weightKg: 90,
  createdAt: '',
  updatedAt: '',
};

describe('path definitions', () => {
  it('every path has a promise, questions, and builds a real goal with routines', () => {
    for (const id of PATH_ORDER) {
      const def = PATHS[id];
      expect(def.promise.length).toBeGreaterThan(40);
      expect(def.questions.length).toBeGreaterThan(0);
      const answers = Object.fromEntries(def.questions.map((q) => [q.key, q.options[0].value]));
      const plan = def.build(answers, profile);
      expect(plan.goal.id).toBeTruthy();
      expect(plan.routines.length).toBeGreaterThan(0);
      expect(def.insights(answers, profile).length).toBeGreaterThan(0);
    }
  });

  it('answers change the built plan — the minimise-input contract', () => {
    const fresh = PATHS.training.build({ experience: 'new', limiter: 'time' }, profile);
    const seasoned = PATHS.training.build({ experience: 'consistent', limiter: 'boredom' }, profile);
    expect(fresh.routines.find((r) => r.sessionType === 'workout')!.durationMin).toBe(30);
    expect(seasoned.routines.some((r) => r.protocolId === 'zone2')).toBe(true);
    expect(fresh.routines.some((r) => r.protocolId === 'zone2')).toBe(false);
  });

  it('nutrition computes a personal protein target from weight', () => {
    const lines = PATHS.nutrition.insights({ aim: 'muscle', cooking: 'normal' }, profile).join(' ');
    expect(lines).toContain(`${Math.round(90 * 1.8)}`);
    expect(lines).toContain(`${Math.round(90 * 2.2)}`);
    // Without weight it asks for it instead of inventing a number.
    const noWeight = PATHS.nutrition.insights({ aim: 'energy' }, { ...profile, weightKg: undefined });
    expect(noWeight.join(' ')).toContain('Add your weight');
  });

  it('a weight-loss aim adds the eating-window practice', () => {
    const plan = PATHS.nutrition.build({ aim: 'weight', cooking: 'quick' }, profile);
    expect(plan.routines.some((r) => r.protocolId === 'kitchen-closed')).toBe(true);
    const energy = PATHS.nutrition.build({ aim: 'energy', cooking: 'quick' }, profile);
    expect(energy.routines.some((r) => r.protocolId === 'kitchen-closed')).toBe(false);
  });

  it('training warns on age-appropriate loading when age is known', () => {
    const lines = PATHS.training.insights({ experience: 'returning' }, profile).join(' ');
    expect(lines).toContain('47');
  });

  it('makers get protected deep work even without naming focus as the bottleneck', () => {
    const plan = PATHS.work.build({ bottleneck: 'sales', style: 'maker' }, profile);
    expect(plan.routines.some((r) => r.protocolId === 'deep-work')).toBe(true);
    const manager = PATHS.work.build({ bottleneck: 'sales', style: 'manager' }, profile);
    expect(manager.routines.some((r) => r.protocolId === 'deep-work')).toBe(false);
  });

  it('debt mode reshapes the money milestones', () => {
    const plan = PATHS.money.build({ mode: 'debt', automation: 'no' }, profile);
    expect(plan.goal.milestones!.map((m) => m.title)).toContain('List every debt with its rate');
  });
});
