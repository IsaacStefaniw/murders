/**
 * The scheduling is the product, and it had no reveal moment.
 *
 * Adding a practice changed a button. Everything the engine then did —
 * finding the gap, honouring the anchor, moving what it had to — happened
 * on a tab the person was not looking at. A user who never opens the Week
 * tab could run this app for a fortnight without once seeing it schedule
 * anything, which is the single feature they are paying for.
 */
import { placementFor, placementLine } from '@/features/planner/placement';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

const routine = (over: Partial<Routine> = {}): Routine => ({
  id: 'r1',
  title: 'Morning light',
  area: 'health',
  protocolId: 'morning-light',
  days: [0, 1, 2, 3, 4, 5, 6],
  durationMin: 10,
  preferredStart: '07:25',
  preferredEnd: '08:10',
  energy: 'morning',
  flexible: true,
  timeAnchored: true,
  protected: false,
  tier: 'could',
  active: true,
  ...over,
});

const item = (over: Partial<PlanItem>): PlanItem => ({
  id: Math.random().toString(36).slice(2),
  date: '2026-09-08',
  start: '07:00',
  end: '07:20',
  title: 'Something',
  area: 'health',
  tier: 'should',
  status: 'planned',
  fixed: false,
  ...over,
});

const plan = (date: string, items: PlanItem[]): DailyPlan =>
  ({ date, items, summary: '' }) as DailyPlan;

it('names the hour and what the practice landed between', () => {
  const r = routine();
  const plans = {
    '2026-09-08': plan('2026-09-08', [
      item({ start: '07:00', end: '07:20', title: 'Breakfast' }),
      item({ start: '07:25', end: '07:35', title: 'Morning light', routineId: 'r1' }),
      item({ start: '08:00', end: '09:00', title: 'Training' }),
    ]),
  };
  const p = placementFor('morning-light', [r], plans, '2026-09-08')!;
  expect(p.today).toBe(true);
  expect(p.after).toBe('Breakfast');
  expect(p.before).toBe('Training');
  expect(placementLine(p)).toContain('after Breakfast and before Training');
});

it('looks ahead when the practice does not run today', () => {
  const r = routine({ days: [3] });
  const plans = {
    '2026-09-08': plan('2026-09-08', [item({ title: 'Work', fixed: true })]),
    '2026-09-10': plan('2026-09-10', [
      item({ date: '2026-09-10', start: '07:25', title: 'Morning light', routineId: 'r1' }),
    ]),
  };
  const p = placementFor('morning-light', [r], plans, '2026-09-08')!;
  expect(p.today).toBe(false);
  expect(p.date).toBe('2026-09-10');
  // A weekly practice landing next Wednesday is a true answer, not a
  // failure to place — and the line has to say which day.
  expect(placementLine(p)).not.toContain('undefined');
});

it('says nothing rather than guessing when the week has no room for it', () => {
  const r = routine();
  expect(placementFor('morning-light', [r], {}, '2026-09-08')).toBeNull();
});

it('is silent for a practice that was never added', () => {
  expect(placementFor('morning-light', [], {}, '2026-09-08')).toBeNull();
});

it('explains a wake-anchored hour as moving with the person, not the clock', () => {
  const r = routine();
  const plans = {
    '2026-09-08': plan('2026-09-08', [
      item({ start: '07:25', title: 'Morning light', routineId: 'r1' }),
    ]),
  };
  const p = placementFor('morning-light', [r], plans, '2026-09-08')!;
  expect(p.reason).toMatch(/wake/i);
  // Never a restatement of the time — "it is at 7:25 because it is at
  // 7:25" is the non-answer this exists to avoid.
  expect(p.reason).not.toContain('7:25');
});
