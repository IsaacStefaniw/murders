/**
 * The number worth maximising is not scheduled practices.
 *
 * It is how many worthwhile changes survive contact with a real week, and
 * that number is small. The library holds 317 practices, every one of
 * them worth doing, which is exactly why an app that offers them freely
 * produces a beautiful week nobody lives.
 *
 * The rule this file pins: the gate is on what the app OFFERS, never on
 * what a person chooses. Software telling somebody they may not change
 * their own life is the thing this product exists not to do.
 */
import { commitmentBudget, mayOffer, startingSet } from '@/features/budget/commitment';
import type { MetricObservation } from '@/features/model/metrics';
import type { DailyPlan, LifeProfile, PlanItem, Routine } from '@/types/domain';

const TODAY = '2026-09-08';
const NOW = new Date('2026-09-08T09:00:00.000Z');

const routine = (over: Partial<Routine> = {}): Routine => ({
  id: 'r-anchor',
  title: 'Morning light',
  area: 'health',
  days: [0, 1, 2, 3, 4, 5, 6],
  durationMin: 10,
  preferredStart: '07:00',
  preferredEnd: '07:45',
  energy: 'morning',
  flexible: true,
  protected: false,
  tier: 'should',
  active: true,
  ...over,
});

const item = (over: Partial<PlanItem> = {}): PlanItem => ({
  id: Math.random().toString(36).slice(2),
  date: TODAY,
  start: '07:00',
  end: '07:10',
  title: 'Morning light',
  area: 'health',
  tier: 'should',
  status: 'planned',
  fixed: false,
  ...over,
});

const day = (date: string, items: PlanItem[]): DailyPlan =>
  ({ date, items, summary: '' }) as DailyPlan;

const dayBefore = (n: number) => {
  const d = new Date(`${TODAY}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

/** A fortnight of history, every item ending in the given status. */
function history(status: PlanItem['status'], over: Partial<PlanItem> = {}) {
  const plans: Record<string, DailyPlan> = {};
  for (let i = 1; i <= 14; i++) {
    const date = dayBefore(i);
    plans[date] = day(date, [item({ date, status, routineId: 'r-anchor', ...over })]);
  }
  return plans;
}

const base = {
  routines: [routine()],
  plans: {} as Record<string, DailyPlan | undefined>,
  metrics: [] as MetricObservation[],
  profile: null as LifeProfile | null,
  lastOpenedAt: null as string | null,
  today: TODAY,
  now: NOW,
};

it('starts everybody on one anchor and one thing that makes it easier', () => {
  const b = commitmentBudget(base);
  expect(b.state).toBe('start');
  expect(b.newThingsAllowed).toBe(1);
  // Never a number of practices, never a percentage: this is the line a
  // person reads on day one and it has to sound like a plan, not a score.
  expect(b.line).not.toMatch(/\d+%|score/i);
});

it('offers one more thing once a fortnight has gone in as planned', () => {
  const b = commitmentBudget({ ...base, plans: history('completed') });
  expect(b.state).toBe('stable');
  expect(mayOffer(b)).toBe(true);
  expect(b.anchorRoutineId).toBe('r-anchor');
});

it('offers nothing new when the fortnight was mostly moved or missed', () => {
  const b = commitmentBudget({ ...base, plans: history('skipped') });
  expect(b.state).toBe('strained');
  expect(mayOffer(b)).toBe(false);
  // The failure this guards is the app reading a hard fortnight as a
  // failure of the person. It is information about the week.
  expect(b.because).not.toMatch(/you (failed|did not|should)/i);
  expect(b.line).not.toMatch(/behind|missed|failed/i);
});

it('reads three short nights in a week as a strained week', () => {
  const metrics: MetricObservation[] = [1, 2, 3].map((i) => ({
    id: `m${i}`,
    key: 'sleep.hours',
    value: 5,
    at: `${dayBefore(i)}T08:00:00.000Z`,
    source: 'healthkit',
  }));
  const b = commitmentBudget({ ...base, plans: history('completed'), metrics });
  expect(b.state).toBe('strained');
  expect(b.newThingsAllowed).toBe(0);
});

it('adds nothing at all in a minimum week, and says the person set that', () => {
  const profile = { capacity: 'minimal' } as LifeProfile;
  const b = commitmentBudget({ ...base, plans: history('completed'), profile });
  expect(b.state).toBe('disrupted');
  expect(b.newThingsAllowed).toBe(0);
  expect(b.because).toMatch(/you told the app/i);
});

it('comes back from an absence with one thing and no backlog', () => {
  const b = commitmentBudget({
    ...base,
    plans: history('completed'),
    lastOpenedAt: '2026-08-29T09:00:00.000Z',
  });
  expect(b.state).toBe('return');
  expect(b.newThingsAllowed).toBe(0);
  // Never a count of what was missed. The person already knows.
  expect(`${b.line} ${b.because}`).not.toMatch(/missed|behind|catch up|streak/i);
});

it('anchors on what the person has actually been keeping, not on the best grade', () => {
  const kept = routine({ id: 'r-kept', title: 'Evening walk', tier: 'could' });
  const graded = routine({ id: 'r-graded', title: 'Strength training', tier: 'must' });
  const plans: Record<string, DailyPlan> = {};
  for (let i = 1; i <= 14; i++) {
    const date = dayBefore(i);
    plans[date] = day(date, [
      item({ date, status: 'completed', routineId: 'r-kept' }),
      item({ date, status: 'skipped', routineId: 'r-graded' }),
    ]);
  }
  const b = commitmentBudget({ ...base, routines: [graded, kept], plans });
  // An anchor somebody is already keeping is an anchor. The best-evidenced
  // practice they never do is not one, however good the evidence is.
  expect(b.anchorRoutineId).toBe('r-kept');
});

it('falls back to the most important routine when nothing has been kept yet', () => {
  const could = routine({ id: 'r-could', tier: 'could' });
  const must = routine({ id: 'r-must', tier: 'must' });
  const b = commitmentBudget({ ...base, routines: [could, must] });
  expect(b.anchorRoutineId).toBe('r-must');
});

it('never proposes more than one new thing in any state', () => {
  const states = [
    base,
    { ...base, plans: history('completed') },
    { ...base, plans: history('skipped') },
    { ...base, profile: { capacity: 'minimal' } as LifeProfile },
    { ...base, lastOpenedAt: '2026-08-20T09:00:00.000Z' },
  ];
  for (const input of states) {
    expect(commitmentBudget(input).newThingsAllowed).toBeLessThanOrEqual(1);
  }
});

describe('what actually starts on day one', () => {
  it('starts an anchor and one short daily thing, and holds the rest', () => {
    const routines = [
      routine({ id: 'strength', title: 'Strength training', tier: 'must', durationMin: 60, days: [1, 3, 5] }),
      routine({ id: 'light', title: 'Morning light', tier: 'could', durationMin: 10 }),
      routine({ id: 'zone2', title: 'Easy cardio', tier: 'should', durationMin: 45, days: [2, 6] }),
      routine({ id: 'journal', title: 'Five-minute journal', tier: 'could', durationMin: 5, days: [0, 1, 2, 3, 4] }),
      routine({ id: 'meals', title: 'Cook once', tier: 'should', durationMin: 90, days: [0] }),
    ];
    const s = startingSet(routines);
    expect(s.anchorId).toBe('strength');
    // The support is small and near-daily. A second big block would be a
    // second anchor, and two anchors is the failure this exists to avoid.
    expect(s.supportId).toBe('journal');
    expect(s.heldIds.sort()).toEqual(['light', 'meals', 'zone2']);
  });

  it('holds nothing when the plan is already small', () => {
    const s = startingSet([routine({ id: 'a' }), routine({ id: 'b', durationMin: 5 })]);
    expect(s.heldIds).toEqual([]);
  });

  it('copes with a plan of one', () => {
    const s = startingSet([routine({ id: 'only' })]);
    expect(s).toEqual({ anchorId: 'only', supportId: null, heldIds: [] });
  });

  it('ignores routines that are already switched off', () => {
    const s = startingSet([routine({ id: 'on' }), routine({ id: 'off', active: false })]);
    expect(s.heldIds).toEqual([]);
    expect(s.anchorId).toBe('on');
  });
});
