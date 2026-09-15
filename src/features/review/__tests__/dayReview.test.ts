import {
  MARK_STATUS,
  dayResult,
  dayRows,
  dayTold,
  rowLength,
  tomorrowFirst,
  unresolvedRows,
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

/**
 * The gap, not the whole day.
 *
 * Today marks items as they happen, so an evening screen that asks about
 * every item is re-asking questions it has the answers to — which is what
 * made it read as a form however it was laid out.
 */
describe('what is actually still open', () => {
  it('asks only about what has no answer yet', () => {
    const p = plan(TODAY, [
      item({ id: 'a', start: '06:15', status: 'completed' }),
      item({ id: 'b', start: '12:00', status: 'skipped' }),
      item({ id: 'c', start: '18:00' }),
    ]);
    expect(unresolvedRows(p).map((r) => r.item.id)).toEqual(['c']);
  });

  it('has nothing to ask on a day that was kept up with', () => {
    const p = plan(TODAY, [
      item({ id: 'a', status: 'completed' }),
      item({ id: 'b', start: '18:00', status: 'completed' }),
    ]);
    expect(unresolvedRows(p)).toEqual([]);
  });
});

describe('the day, told back', () => {
  it('names what happened rather than counting it', () => {
    const p = plan(TODAY, [
      item({ id: 'a', title: 'Strength', status: 'completed' }),
      item({ id: 'b', start: '18:00', title: 'Dinner together', status: 'skipped' }),
    ]);
    const told = dayTold(dayRows(p));
    expect(told.headline).toBe('Strength happened.');
    expect(told.note).toBe("Dinner together didn't.");
    // Closure, not a grade: no score, no rate, no fraction of the day.
    expect(told.headline).not.toMatch(/%|\d+ of \d+/);
  });

  /**
   * The browser found the closure line running to five lines of 28pt,
   * because it was reading protocol titles out verbatim: "Dinner together
   * and The urge answer: two-minute reset happened."
   */
  it('says the part of a title a person would say out loud', () => {
    const p = plan(TODAY, [
      item({ id: 'a', title: 'The urge answer: two-minute reset', status: 'completed' }),
      item({ id: 'b', start: '18:00', title: 'Dinner together', status: 'skipped' }),
    ]);
    expect(dayTold(dayRows(p)).headline).toBe('The urge answer happened.');
  });

  it('keeps a short title whole', () => {
    const p = plan(TODAY, [
      item({ id: 'a', title: 'Wind down, screens away', status: 'completed' }),
      item({ id: 'b', start: '18:00', title: 'Dinner together', status: 'skipped' }),
    ]);
    expect(dayTold(dayRows(p)).headline).toBe('Wind down, screens away happened.');
  });

  it('names at most two things before it starts counting', () => {
    const p = plan(TODAY, [
      item({ id: 'a', title: 'Strength', status: 'completed' }),
      item({ id: 'b', start: '12:00', title: 'Post-meal walk', status: 'completed' }),
      item({ id: 'c', start: '18:00', title: 'Dinner together', status: 'completed' }),
      item({ id: 'd', start: '20:00', title: 'Wind down', status: 'skipped' }),
    ]);
    expect(dayTold(dayRows(p)).headline).toBe('Strength and 2 more happened.');
  });

  it('is one short sentence when the day went to plan', () => {
    const p = plan(TODAY, [
      item({ id: 'a', status: 'completed' }),
      item({ id: 'b', start: '18:00', status: 'completed' }),
    ]);
    expect(dayTold(dayRows(p))).toEqual({ headline: 'All of it happened.', note: '' });
  });

  it('asks rather than judging a day it has not been told about', () => {
    // Nothing ticked and nothing answered is not a bad day, it is an
    // unreported one — and the screen is about to go and collect it.
    const p = plan(TODAY, [item({ id: 'a' }), item({ id: 'b', start: '18:00' })]);
    expect(dayTold(dayRows(p))).toEqual({ headline: 'How did today go?', note: '' });
  });

  it('puts what is still unanswered in the note, not the headline', () => {
    const p = plan(TODAY, [
      item({ id: 'a', status: 'completed' }),
      item({ id: 'b', start: '12:00' }),
      item({ id: 'c', start: '18:00' }),
    ]);
    const told = dayTold(dayRows(p));
    expect(told.headline).not.toContain('unanswered');
    expect(told.note).toBe('2 still unanswered.');
  });

  it('stops short of a verdict on an empty day', () => {
    expect(dayTold(dayRows(plan(TODAY, [])))).toEqual({ headline: 'Nothing was on today.', note: '' });
  });

  it('never blames a day that had nothing kept', () => {
    const p = plan(TODAY, [item({ id: 'a', status: 'skipped' })]);
    const told = dayTold(dayRows(p));
    expect(told.headline).toBe('None of it happened today.');
    expect(`${told.headline} ${told.note}`).not.toMatch(/fail|poor|bad|should/i);
  });
});
