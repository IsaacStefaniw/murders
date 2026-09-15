import {
  MARK_STATUS,
  dayResult,
  dayRows,
  rowLength,
  tomorrowFirst,
} from '@/features/review/dayReview';
import type { DailyPlan, PlanItem } from '@/types/domain';

/**
 * The end of the day, as the day.
 *
 * Replaces a five-point mood scale and two free-text boxes with the day's
 * own items marked ✓ / ✗ / +. Faster, it produces what the adaptation
 * engine actually needs, and it gives closure rather than homework.
 */

const TODAY = '2026-09-15';

function item(over: Partial<PlanItem> = {}): PlanItem {
  return {
    id: over.id ?? `pi-${Math.random()}`,
    date: TODAY,
    start: '07:00',
    end: '07:45',
    title: 'Strength',
    area: 'health',
    tier: 'should',
    status: 'planned',
    fixed: false,
    ...over,
  } as PlanItem;
}

const plan = (date: string, items: PlanItem[]): DailyPlan =>
  ({ date, items, approvedAt: undefined }) as DailyPlan;

describe('the rows to mark', () => {
  it('is the day in the order it happened', () => {
    const p = plan(TODAY, [
      item({ id: 'b', start: '18:00', end: '18:45', title: 'Dinner together' }),
      item({ id: 'a', start: '06:15', end: '07:00', title: 'Strength' }),
    ]);
    expect(dayRows(p).map((r) => r.item.id)).toEqual(['a', 'b']);
  });

  it('leaves the person’s own diary alone', () => {
    // Asking "did your dentist appointment happen?" is the app pretending
    // to have scheduled someone's life.
    const p = plan(TODAY, [
      item({ id: 'fixed', fixed: true, title: 'Dentist' }),
      item({ id: 'work', title: 'Work' }),
      item({ id: 'mine', title: 'Strength' }),
    ]);
    expect(dayRows(p).map((r) => r.item.id)).toEqual(['mine']);
  });

  it('shows what was already answered', () => {
    const p = plan(TODAY, [
      item({ id: 'a', status: 'completed' }),
      item({ id: 'b', start: '08:00', end: '08:30', status: 'skipped' }),
      item({ id: 'c', start: '09:00', end: '09:30' }),
    ]);
    expect(dayRows(p).map((r) => r.mark)).toEqual(['did', 'didnt', null]);
  });

  it('is empty rather than throwing on a day that does not exist', () => {
    expect(dayRows(undefined)).toEqual([]);
  });
});

describe('what a mark writes', () => {
  it('records "did something else" as the planned thing not happening', () => {
    // The row is honest: the planned thing did not happen. What DID happen
    // is logged separately, beside it.
    expect(MARK_STATUS.did).toBe('completed');
    expect(MARK_STATUS.didnt).toBe('skipped');
    expect(MARK_STATUS.instead).toBe('skipped');
  });
});

describe('the result line', () => {
  it('reports the week, not the day', () => {
    // One day is noise. Somebody who did one of three today is not having
    // the conversation that number implies.
    const plans: Record<string, DailyPlan> = {
      '2026-09-14': plan('2026-09-14', [
        item({ id: 'x', date: '2026-09-14', status: 'completed' }),
        item({ id: 'y', date: '2026-09-14', start: '08:00', end: '08:30' }),
      ]),
      [TODAY]: plan(TODAY, [item({ id: 'z', status: 'completed' })]),
    };
    const r = dayResult(plans, TODAY);
    expect(r.line).toBe('2 of 3 this week.');
    expect(r.done).toBe(1);
    expect(r.total).toBe(1);
  });

  it('never grades: no percentage, no streak', () => {
    const plans = { [TODAY]: plan(TODAY, [item({ status: 'completed' })]) };
    const line = dayResult(plans, TODAY).line;
    expect(line).not.toMatch(/%|streak|in a row|perfect|well done/i);
  });

  it('says so plainly when there is nothing to report', () => {
    expect(dayResult({}, TODAY).line).toBe('Nothing planned this week yet.');
  });

  it('carries seven days of trend, oldest first', () => {
    const plans = { [TODAY]: plan(TODAY, [item({ status: 'completed' })]) };
    const r = dayResult(plans, TODAY);
    expect(r.trend).toHaveLength(7);
    expect(r.trend[6]).toBe(1);
    expect(r.trend[0]).toBe(0);
  });
});

describe('tomorrow', () => {
  it('hands back the first thing, so the review sets up the next day', () => {
    const plans = {
      [TODAY]: plan(TODAY, [item()]),
      '2026-09-16': plan('2026-09-16', [
        item({ id: 'late', date: '2026-09-16', start: '18:00', end: '18:30', title: 'Dinner' }),
        item({ id: 'first', date: '2026-09-16', start: '06:15', end: '07:00', title: 'Strength' }),
      ]),
    };
    expect(tomorrowFirst(plans, TODAY)?.id).toBe('first');
  });

  it('is null when tomorrow is empty', () => {
    expect(tomorrowFirst({ [TODAY]: plan(TODAY, [item()]) }, TODAY)).toBeNull();
  });
});

describe('row length', () => {
  it('is silent on anything short enough not to matter', () => {
    expect(rowLength(item({ start: '07:00', end: '07:20' }))).toBeNull();
    expect(rowLength(item({ start: '07:00', end: '07:45' }))).toBe('45m');
    expect(rowLength(item({ start: '07:00', end: '08:00' }))).toBe('1h');
    expect(rowLength(item({ start: '07:00', end: '08:30' }))).toBe('1h 30m');
  });
});
