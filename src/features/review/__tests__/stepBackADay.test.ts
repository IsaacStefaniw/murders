/**
 * Looking at Tuesday.
 *
 * Isaac, on his own week: *"I can't remember what was or wasn't included
 * but I need to check."* Today was today-only. Every edge of the rule that
 * fixes it is a way to show somebody a day that does not exist, so the
 * tests are the edges.
 */

import { dayAlsoHeld, reviewableDay } from '@/features/review/dayReview';
import { addDays } from '@/lib/dates';
import type { BehaviourEvent, BehaviourIntention, DailyPlan } from '@/types/domain';

const TODAY = '2026-10-07';

/** Plans on every day from `back` days ago up to today. */
const plansBack = (back: number): Record<string, DailyPlan> => {
  const out: Record<string, DailyPlan> = {};
  for (let b = back; b >= 0; b -= 1) {
    const date = addDays(TODAY, -b);
    out[date] = { date, items: [] } as DailyPlan;
  }
  return out;
};

const call = (requested: string | undefined | null, back = 30) =>
  reviewableDay({ requested, today: TODAY, plans: plansBack(back) });

describe('which day the review shows', () => {
  it('shows today when nothing was asked for', () => {
    expect(call(undefined)).toEqual({
      date: TODAY,
      earliest: addDays(TODAY, -30),
      canGoBack: true,
      isToday: true,
    });
    expect(call(null).date).toBe(TODAY);
  });

  it('shows the day that was asked for', () => {
    const tuesday = '2026-09-29';
    const r = call(tuesday);
    expect(r.date).toBe(tuesday);
    expect(r.isToday).toBe(false);
    expect(r.canGoBack).toBe(true);
  });
});

describe('the three clamps', () => {
  it('never goes past today', () => {
    // Tomorrow is a plan, not a review. A forward arrow into an unlived
    // day would invite marking things done before they happen.
    expect(call(addDays(TODAY, 1)).date).toBe(TODAY);
    expect(call('2099-01-01').date).toBe(TODAY);
    expect(call(addDays(TODAY, 1)).isToday).toBe(true);
  });

  it('never goes before the record', () => {
    // The store keeps 120 days and then drops them. Walking past the first
    // one is a run of identical empty screens with no way to tell "nothing
    // happened" from "the app has forgotten".
    const earliest = addDays(TODAY, -30);
    expect(call(addDays(TODAY, -31)).date).toBe(earliest);
    expect(call('2020-01-01').date).toBe(earliest);
  });

  it('stops the back arrow at the earliest day', () => {
    const earliest = addDays(TODAY, -30);
    expect(call(earliest).canGoBack).toBe(false);
    expect(call(addDays(earliest, 1)).canGoBack).toBe(true);
  });

  it('falls back to today on anything that is not a date', () => {
    // A route parameter is a string from outside the app.
    for (const junk of ['', 'yesterday', '2026-13-45x', '07/10/2026', '2026-10', 'NaN']) {
      expect(call(junk).date).toBe(TODAY);
    }
  });
});

describe('an account with no history at all', () => {
  it('pins everything to today rather than inventing a range', () => {
    const r = reviewableDay({ requested: '2026-09-01', today: TODAY, plans: {} });
    expect(r).toEqual({
      date: TODAY,
      earliest: TODAY,
      canGoBack: false,
      isToday: true,
    });
  });

  it('ignores plans that only exist in the future', () => {
    // A fresh account whose week has been built forward has plans, and
    // none of them is a day to review.
    const ahead: Record<string, DailyPlan> = {};
    for (let i = 1; i <= 6; i += 1) {
      const date = addDays(TODAY, i);
      ahead[date] = { date, items: [] } as DailyPlan;
    }
    const r = reviewableDay({ requested: undefined, today: TODAY, plans: ahead });
    expect(r.earliest).toBe(TODAY);
    expect(r.canGoBack).toBe(false);
  });
});

describe('stepping', () => {
  it('walks back one day at a time and arrives at the earliest', () => {
    let date = TODAY;
    const earliest = addDays(TODAY, -30);
    for (let i = 0; i < 40; i += 1) {
      const r = call(date);
      if (!r.canGoBack) break;
      date = addDays(r.date, -1);
    }
    expect(call(date).date).toBe(earliest);
    expect(call(date).canGoBack).toBe(false);
  });

  it('walks forward and lands exactly on today, never past it', () => {
    let date = addDays(TODAY, -3);
    for (let i = 0; i < 10; i += 1) {
      const r = call(date);
      if (r.isToday) break;
      date = addDays(r.date, 1);
    }
    expect(call(date).date).toBe(TODAY);
    expect(call(date).isToday).toBe(true);
  });
});

/* ── The word the browser caught ──────────────────────────────────────── */

describe('what the day also held, on a day that is not today', () => {
  const intentions = [
    {
      id: 'bi-1',
      behaviour: 'alcohol',
      intentionText: 'Fewer drinks',
      active: true,
      createdAt: `${addDays(TODAY, -60)}T08:00:00.000Z`,
    },
  ] as BehaviourIntention[];

  const events = (date: string): BehaviourEvent[] => [
    { id: 'ev-1', intentionId: 'bi-1', occurredAt: `${date}T21:00:00` } as BehaviourEvent,
  ];

  it('still says "today" on today', () => {
    expect(dayAlsoHeld(events(TODAY), intentions, TODAY)).toBe('Also logged today: one alcohol.');
    expect(dayAlsoHeld(events(TODAY), intentions, TODAY, true)).toBe(
      'Also logged today: one alcohol.',
    );
  });

  /**
   * The line read "Also logged today: one alcohol." under a heading
   * saying TUESDAY, OCTOBER 6 — false about the day it was on, on the one
   * screen whose entire job is not lying about a day. Only a browser
   * found it; the unit tests were all about today.
   */
  it('drops the word on a day that has passed', () => {
    const tuesday = addDays(TODAY, -1);
    expect(dayAlsoHeld(events(tuesday), intentions, tuesday, false)).toBe(
      'Also logged: one alcohol.',
    );
  });

  it('says nothing about a day that held nothing, either way', () => {
    expect(dayAlsoHeld([], intentions, TODAY, true)).toBeNull();
    expect(dayAlsoHeld([], intentions, TODAY, false)).toBeNull();
  });
});
