/**
 * "The Weekly Review for Work 'Growth Block' is on a Monday and the first
 * question is 'What moved this week' — do you mean last week?"
 *
 * It did. And the question under it, "the one lever for next week", meant
 * the week the person was standing in.
 */

import { reviewPeriod, reviewQuestions } from '@/features/review/period';

// 2026-09-07 is a Monday.
const MON = '2026-09-07';
const TUE = '2026-09-08';
const WED = '2026-09-09';
const FRI = '2026-09-11';
const SUN = '2026-09-13';

describe('a review at the top of the week', () => {
  it('asks about the week that finished, not the day that started', () => {
    const q = reviewQuestions(reviewPeriod(MON));
    expect(q.moved).toBe('What moved last week?');
  });

  it('plans the week it is standing in, not the one after', () => {
    const q = reviewQuestions(reviewPeriod(MON));
    expect(q.lever).toBe('The one lever for this week');
  });

  it('covers the seven days that actually finished', () => {
    const p = reviewPeriod(MON);
    expect(p.from).toBe('2026-08-31');
    expect(p.to).toBe('2026-09-06');
    expect(p.atWeekStart).toBe(true);
  });

  it('treats Tuesday the same, so a review pushed a day still means last week', () => {
    expect(reviewQuestions(reviewPeriod(TUE)).moved).toBe('What moved last week?');
    expect(reviewPeriod(TUE).from).toBe('2026-08-31');
  });
});

describe('a review inside the week', () => {
  it('asks about the days so far and plans the week to come', () => {
    for (const day of [WED, FRI, SUN]) {
      const q = reviewQuestions(reviewPeriod(day));
      expect(q.moved).toBe('What moved this week?');
      expect(q.lever).toBe('The one lever for next week');
    }
  });

  it('ends the period at today rather than at a week that has not happened', () => {
    const p = reviewPeriod(FRI);
    expect(p.to).toBe(FRI);
    expect(p.atWeekStart).toBe(false);
  });
});
