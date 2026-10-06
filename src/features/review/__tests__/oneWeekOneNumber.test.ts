/**
 * Three numbers about one week, on one card.
 *
 * Found by the first user-test run that actually completed: a night-shift
 * account, 36 actions of patience, asked only whether anything could
 * realistically happen before a 18:30 shift. It reported the Week card
 * carrying "1 of 13 done", then "3 done" three lines below, above a
 * breakdown that summed to 1.
 *
 * None of the three was computed the same way:
 *
 *   `buildWeekShape`  the planning week's own dates, skipping `fixed`
 *                     items and anything it cannot place in a pillar
 *   `weekMomentum`    a rolling seven days back from today, keeping
 *                     anything not titled "Work"
 *
 * Neither is wrong on its own. Printed three lines apart with nothing to
 * tell them apart, both are — and it matters more than an arithmetic slip
 * usually would, because this product's whole claim is that it does not
 * score anybody, it only says what happened. An app that cannot agree with
 * itself about how many things somebody did this week has nothing left to
 * stand on.
 */

import { buildWeekShape } from '@/features/review/weekShape';
import { weekMomentum } from '@/features/today/coach';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

const TODAY = '2026-10-06';
const WEEK = [
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
  '2026-10-08',
  '2026-10-09',
  '2026-10-10',
  '2026-10-11',
];

const item = (over: Partial<PlanItem>): PlanItem =>
  ({
    id: `i-${Math.random()}`,
    date: TODAY,
    start: '08:00',
    end: '08:30',
    title: 'Something',
    area: 'health',
    tier: 'should',
    status: 'planned',
    fixed: false,
    ...over,
  }) as PlanItem;

const routine: Routine = {
  id: 'r-1',
  title: 'Strength',
  area: 'health',
  protocolId: 'strength',
  days: [1, 3, 5],
  durationMin: 45,
  preferredStart: '07:00',
  preferredEnd: '07:45',
  energy: 'morning',
  flexible: true,
  protected: false,
  tier: 'should',
  active: true,
};

const plansOf = (items: PlanItem[]): Record<string, DailyPlan> => {
  const out: Record<string, DailyPlan> = {};
  for (const i of items) {
    out[i.date] = out[i.date] ?? ({ date: i.date, items: [] } as DailyPlan);
    out[i.date].items.push(i);
  }
  return out;
};

describe('the number the week card prints', () => {
  /**
   * The exact shape that produced the contradiction: a completed fixed
   * commitment, which `weekMomentum` counts and `buildWeekShape` does not.
   */
  it('agrees with the breakdown printed under it', () => {
    const plans = plansOf([
      item({ title: 'Strength', routineId: 'r-1', status: 'completed' }),
      item({ title: 'School run', status: 'completed', fixed: true }),
      item({ title: 'Dentist', status: 'completed', fixed: true, date: '2026-10-05' }),
    ]);
    const shape = buildWeekShape(WEEK, plans, [routine], TODAY);
    const breakdown = shape.pillars.reduce((n, p) => n + p.done, 0);
    expect(shape.done).toBe(breakdown);
  });

  /**
   * The divergence itself, pinned so nobody "fixes" the card by reaching
   * for the other number again. These two are allowed to differ — they
   * answer different questions — they are just not allowed to sit three
   * lines apart unlabelled.
   */
  it('is not the rolling-seven-day count, which answers a different question', () => {
    const plans = plansOf([
      item({ title: 'Strength', routineId: 'r-1', status: 'completed' }),
      item({ title: 'School run', status: 'completed', fixed: true }),
    ]);
    const shape = buildWeekShape(WEEK, plans, [routine], TODAY);
    const momentum = weekMomentum(TODAY, plans, []);
    // Momentum counts the fixed school run; the shape does not.
    expect(momentum.done).toBeGreaterThan(shape.done);
  });

  it('counts nothing when nothing happened', () => {
    const plans = plansOf([item({ title: 'Strength', routineId: 'r-1' })]);
    const shape = buildWeekShape(WEEK, plans, [routine], TODAY);
    expect(shape.done).toBe(0);
    expect(shape.pillars.reduce((n, p) => n + p.done, 0)).toBe(0);
  });
});
