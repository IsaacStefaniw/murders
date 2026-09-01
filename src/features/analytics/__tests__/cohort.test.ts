import { computeCohortMetrics, shareableSummary } from '@/features/analytics/cohort';
import {
  MIN_COHORT_FOR_COMPARISON,
  peerComparison,
  selfComparison,
} from '@/features/analytics/comparison';
import type { DailyPlan, LifeProfile, PlanItem } from '@/types/domain';

const profile = { createdAt: '2026-01-05T08:00:00.000Z' } as LifeProfile;

const item = (title: string, status: PlanItem['status']): PlanItem =>
  ({ id: title + status, title, status, area: 'health', start: '09:00', end: '10:00' }) as PlanItem;

const plansFrom = (spec: Record<string, PlanItem[]>): Record<string, DailyPlan> =>
  Object.fromEntries(
    Object.entries(spec).map(([date, items]) => [date, { date, items } as DailyPlan]),
  );

describe('metrics derived rather than collected', () => {
  it('works retroactively on data that was never logged for this purpose', () => {
    // The whole argument for deriving: an event pipeline shipped today
    // could say nothing about a month already lived. This can.
    const m = computeCohortMetrics(
      profile,
      plansFrom({
        '2026-01-05': [item('Walk', 'completed')],
        '2026-01-09': [item('Walk', 'completed'), item('Read', 'skipped')],
      }),
      '2026-01-12',
    )!;
    expect(m.daysSince).toBe(7);
    expect(m.daysToFirstWin).toBe(0);
    expect(m.completionRate).toBeCloseTo(2 / 3);
    expect(m.retainedWeek1).toBe(true);
  });

  it('does not count the working day as something the app achieved', () => {
    // Work blocks are modelled commitments the app had no hand in. Counting
    // them is how a completion rate comes to describe the metric instead of
    // the product.
    const m = computeCohortMetrics(
      profile,
      plansFrom({ '2026-01-06': [item('Work', 'completed'), item('Walk', 'skipped')] }),
      '2026-01-07',
    )!;
    expect(m.completionRate).toBe(0);
    expect(m.daysToFirstWin).toBeNull();
  });

  it('slices the weeks from the person’s own start date, not the calendar', () => {
    const m = computeCohortMetrics(
      profile,
      plansFrom({ '2026-01-14': [item('Walk', 'completed')] }),
      '2026-01-20',
    )!;
    expect(m.weeks).toHaveLength(3);
    expect(m.weeks[1].from).toBe('2026-01-12');
    expect(m.weeks[1].completed).toBe(1);
    expect(m.weeks[0].completed).toBe(0);
  });

  it('does not break a streak just because a new week started this morning', () => {
    const m = computeCohortMetrics(
      profile,
      plansFrom({
        '2026-01-06': [item('Walk', 'completed')],
        '2026-01-13': [item('Walk', 'completed')],
      }),
      '2026-01-19', // day 14 — a fresh week with nothing in it yet
    )!;
    expect(m.activeWeekStreak).toBe(2);
  });

  it('shares numbers and nothing that identifies anyone', () => {
    const m = computeCohortMetrics(
      profile,
      plansFrom({ '2026-01-06': [item('Therapy', 'completed')] }),
      '2026-01-10',
    );
    const text = shareableSummary(m, 'retired');
    expect(text).toContain('Days using it: 5');
    expect(text).toContain('retired');
    // No titles, no goals, no dates beyond elapsed days.
    expect(text).not.toContain('Therapy');
    expect(text).not.toContain('2026-01');
  });

  it('returns nothing at all before there is a profile', () => {
    expect(computeCohortMetrics(null, {})).toBeNull();
  });
});

describe('comparison that a person can check against the same screen', () => {
  const weeks = (counts: number[]) =>
    counts.map((completed, i) => ({
      index: i + 1,
      from: '2026-01-05',
      to: '2026-01-11',
      activeDays: Math.min(completed, 7),
      completed,
      resolved: completed,
    }));

  it('says nothing conclusive from a sample of one', () => {
    const c = selfComparison(weeks([4, 6]))!;
    expect(c.line).toBe('6 done this week, 4 the week before.');
    expect(c.line).not.toMatch(/better|stronger|worse/i);
  });

  it('names a personal best when it really is one', () => {
    expect(selfComparison(weeks([3, 4, 5, 9]))!.line).toMatch(/more than any week/i);
  });

  it('never scolds a quieter week', () => {
    // The weeks people most need this app are the bad ones, and a telling-off
    // is how you lose them at exactly the wrong moment.
    const line = selfComparison(weeks([8, 9, 8, 2]))!.line!;
    expect(line).toMatch(/Quieter weeks happen/);
    expect(line).not.toMatch(/only|failed|missed|behind|slipped/i);
  });

  it('holds its tongue in a first week with nothing done', () => {
    expect(selfComparison(weeks([0]))!.line).toBeNull();
  });
});

describe('peer comparison is dormant, and cannot be woken by accident', () => {
  it('returns nothing without a cohort — which is the state today', () => {
    expect(peerComparison(5, null)).toBeNull();
  });

  it('refuses a cohort too small for a percentile to mean anything', () => {
    const small = { weeklyCompleted: Array.from({ length: 199 }, (_, i) => i % 12) };
    expect(peerComparison(5, small)).toBeNull();
  });

  it('only speaks once there are genuinely enough real people', () => {
    const real = {
      weeklyCompleted: Array.from({ length: MIN_COHORT_FOR_COMPARISON }, (_, i) => i % 12),
    };
    const p = peerComparison(11, real)!;
    expect(p.cohortSize).toBe(MIN_COHORT_FOR_COMPARISON);
    expect(p.line).toMatch(/more than \d+% of 200 people/);
  });
});
