/**
 * "The Weekly Review for Work 'Growth Block' is on a Monday and the first
 * question is 'What moved this week' — do you mean last week?"
 *
 * It did. And the question under it, "the one lever for next week", meant
 * the week the person was standing in.
 */

import { reviewAsText, reviewPeriod, reviewQuestions } from '@/features/review/period';

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

/**
 * "Given it's at work, is it possible to email the questions through?"
 *
 * The outbound half needs no backend — the share sheet has Mail in it.
 * What it must not do is send a review that names the wrong week, which is
 * the defect this module exists to fix.
 */
describe('the review as something you can send yourself', () => {
  const milestones = [
    { title: 'Two blocks held in one week', done: false },
    { title: 'One recurring task handed over', done: true },
  ];

  it('names the same week the screen does', () => {
    const monday = reviewPeriod(MON);
    const text = reviewAsText('A week that produces', monday, milestones);
    expect(text).toContain('What moved last week?');
    expect(text).toContain('The one lever for this week');
    expect(text).not.toContain('What moved this week?');
  });

  it('carries the dates, so the reader is not guessing', () => {
    const text = reviewAsText('A week that produces', reviewPeriod(MON), []);
    expect(text).toContain('2026-08-31');
    expect(text).toContain('2026-09-06');
  });

  it('separates what is still open from what is done', () => {
    const text = reviewAsText('A week that produces', reviewPeriod(WED), milestones);
    const open = text.indexOf('Still open:');
    const done = text.indexOf('Done:');
    expect(open).toBeGreaterThan(-1);
    expect(done).toBeGreaterThan(open);
    expect(text).toContain('Two blocks held in one week');
  });

  it('leaves room to answer under each question', () => {
    const text = reviewAsText('A week that produces', reviewPeriod(WED), []);
    expect(text).toMatch(/What moved this week\?\n\n\n/);
  });

  it('says nothing about milestones when there are none', () => {
    const text = reviewAsText('A week that produces', reviewPeriod(WED), []);
    expect(text).not.toContain('Still open:');
    expect(text).not.toContain('Done:');
  });
});
