import { observe, type MetricObservation } from '@/features/model/metrics';
import { focusHours, summariseFocus, weeklyFocus } from '@/features/work/focus';
import { addDays, newId, weekStartOf } from '@/lib/dates';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

const TODAY = '2026-09-09'; // a Wednesday
const MONDAY = weekStartOf(TODAY);

const routine = (protocolId: string | undefined, title = 'Focus'): Routine => ({
  id: newId('r'),
  title,
  area: 'work',
  days: [1, 2, 3, 4, 5],
  durationMin: 60,
  preferredStart: '09:00',
  preferredEnd: '10:00',
  energy: 'morning',
  flexible: false,
  protected: false,
  protocolId,
  tier: 'must',
  active: true,
});

const item = (
  date: string,
  routineId: string,
  status: PlanItem['status'],
  start = '09:00',
  end = '10:00',
): PlanItem => ({
  id: newId('pi'),
  date,
  start,
  end,
  title: 'Deep work block',
  area: 'work',
  tier: 'must',
  status,
  routineId,
  fixed: true,
});

const plansOf = (items: PlanItem[]): Record<string, DailyPlan> => {
  const plans: Record<string, DailyPlan> = {};
  for (const it of items) {
    plans[it.date] ??= { date: it.date, items: [] };
    plans[it.date].items.push(it);
  }
  return plans;
};

const logged = (value: number, date: string): MetricObservation => ({
  ...observe('work.deepHours', value),
  at: `${date}T18:00:00.000Z`,
});

describe('weeklyFocus — the number the plans already hold', () => {
  const deep = routine('deep-work');
  const morning = routine('meeting-free-morning', 'One meeting-free morning');
  const other = routine('shutdown-ritual', 'Closing the working day');

  it('counts focus blocks held and their minutes, week by week, oldest first', () => {
    const lastMonday = addDays(MONDAY, -7);
    const plans = plansOf([
      item(lastMonday, deep.id, 'completed'),
      item(addDays(lastMonday, 1), deep.id, 'skipped'),
      item(addDays(lastMonday, 2), morning.id, 'completed', '09:00', '11:00'),
      item(MONDAY, deep.id, 'completed'),
      item(addDays(MONDAY, 1), deep.id, 'planned'),
      // Not a focus block: never counted.
      item(MONDAY, other.id, 'completed', '17:20', '17:30'),
    ]);
    const weeks = weeklyFocus(plans, [deep, morning, other], [], TODAY, 3);
    expect(weeks.map((w) => w.weekStart)).toEqual([addDays(MONDAY, -14), lastMonday, MONDAY]);
    expect(weeks[0]).toMatchObject({ planned: 0, held: 0, heldMin: 0, loggedHours: null });
    expect(weeks[1]).toMatchObject({ planned: 3, held: 2, heldMin: 180 });
    expect(weeks[2]).toMatchObject({ planned: 2, held: 1, heldMin: 60 });
  });

  it('a typed number for the week wins over the ticked-off blocks', () => {
    const plans = plansOf([item(MONDAY, deep.id, 'completed')]);
    const weeks = weeklyFocus(plans, [deep], [logged(6, addDays(MONDAY, 1))], TODAY, 1);
    expect(weeks[0].loggedHours).toBe(6);
    expect(focusHours(weeks[0])).toBe(6);
    // Without a typed number the held minutes become hours.
    const plain = weeklyFocus(plans, [deep], [], TODAY, 1);
    expect(focusHours(plain[0])).toBe(1);
  });

  it('a number typed in another week does not leak in', () => {
    const weeks = weeklyFocus({}, [deep], [logged(6, addDays(MONDAY, -7))], TODAY, 1);
    expect(weeks[0].loggedHours).toBeNull();
  });
});

describe('summariseFocus — one honest line', () => {
  const week = (weekStart: string, planned: number, held: number, loggedHours: number | null = null) => ({
    weekStart,
    planned,
    held,
    heldMin: held * 60,
    loggedHours,
  });

  it('says nothing is counted yet, with the target, on an empty week', () => {
    const s = summariseFocus([week(MONDAY, 0, 0)], 7);
    expect(s.thisWeek).toBe(0);
    expect(s.line).toMatch(/Nothing counted yet/);
    expect(s.line).toContain('7 h');
  });

  it('says blocks were planned and none held, rather than zero hours', () => {
    const s = summariseFocus([week(MONDAY, 2, 0)], 7);
    expect(s.line).toMatch(/2 focus blocks planned this week, none ticked off yet/);
  });

  it('counts held against planned and the hours against the target', () => {
    const s = summariseFocus([week(addDays(MONDAY, -7), 3, 3), week(MONDAY, 3, 2)], 7);
    expect(s.line).toBe('2 of 3 blocks held, 2 h so far against about 7 h.');
    expect(s.priorMean).toBe(3);
    const at = summariseFocus([week(MONDAY, 3, 3, 8)], 7);
    expect(at.line).toMatch(/at the target/);
  });

  it('the prior mean ignores weeks with nothing planned or logged', () => {
    const s = summariseFocus(
      [week(addDays(MONDAY, -14), 0, 0), week(addDays(MONDAY, -7), 2, 1), week(MONDAY, 2, 2)],
      7,
    );
    expect(s.priorMean).toBe(1);
  });
});
