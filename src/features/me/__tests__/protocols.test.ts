/**
 * The shortlist must join to the library, or a screen loses a row in
 * silence.
 *
 * That failure has happened in this product before and cost it six weeks:
 * the nutrition coach returned nothing because an interview answer was
 * never set, nothing asserted on it, and the zero was read as a product
 * finding rather than a wiring bug. These tests are the cheap version of
 * not doing that again.
 */

import {
  ALL,
  DAILY,
  SPINE,
  addedMinutes,
  byGrade,
  dailyMinutes,
  forGoal,
  GOAL_LABEL,
  resolve,
  today,
  type MyGoal,
} from '@/features/me/protocols';
import { ME } from '@/features/me/profile';
import { SPINE as WEEK_SPINE, MONDAY_OVERRIDE } from '@/features/me/week';
import { toMinutes } from '@/lib/dates';

describe('the shortlist', () => {
  it('every protocol id exists in the library', () => {
    const { missingIds } = resolve();
    expect({ missingIds }).toEqual({ missingIds: [] });
  });

  it('resolves every entry, so nothing is dropped', () => {
    const { items } = resolve();
    expect(items).toHaveLength(ALL.length);
  });

  it('names no id twice', () => {
    const ids = ALL.map((x) => x.protocolId);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect({ duplicates }).toEqual({ duplicates: [] });
  });

  it('only surfaces grade A or B', () => {
    // The whole reason this is a curated list rather than a filter: 193 of
    // 323 protocols are C or D, and a screen that showed them all would
    // bury the ones that are actually evidenced.
    const weak = resolve()
      .items.filter((x) => x.grade !== 'A' && x.grade !== 'B')
      .map((x) => `${x.protocolId} (${x.grade})`);
    expect({ weak }).toEqual({ weak: [] });
  });

  it('serves every goal these two pillars are for', () => {
    // NOT all seven. This module is the mind and leadership pillars;
    // nutrition has its own graded lever ladder and its own week, and two
    // modules deciding the same thing is how `mealPlan` ended up with a
    // writer and no composer. The exclusion is asserted rather than
    // assumed, so that a later edit cannot quietly reach across.
    const goals = Object.keys(GOAL_LABEL) as MyGoal[];
    const mine = goals.filter((g) => g !== 'nutrition');
    const unserved = mine.filter((g) => forGoal(g).length === 0);
    expect({ unserved }).toEqual({ unserved: [] });
    expect(forGoal('nutrition')).toHaveLength(0);
  });

  it('puts grade A before grade B', () => {
    const grades = byGrade(resolve().items).map((x) => x.grade);
    const firstB = grades.indexOf('B');
    const lastA = grades.lastIndexOf('A');
    if (firstB !== -1 && lastA !== -1) expect(lastA).toBeLessThan(firstB);
  });
});

describe('the daily ones', () => {
  it('are in clock order', () => {
    const times = today().map((x) => x.at ?? '');
    expect(times).toEqual([...times].sort());
  });

  it('every daily entry has a time and every periodic one does not', () => {
    expect(DAILY.every((x) => x.at !== null)).toBe(true);
    // A standing if-then is not a thing you do today, and printing it as
    // one turns it into a daily failure.
    expect(SPINE.every((x) => x.at === null)).toBe(true);
  });

  it('asks for a survivable amount of NEW time', () => {
    // Not a floor dressed up as a test: a "surfaced" list that quietly
    // asks for two hours a day is not surfacing, it is a second job. His
    // week already holds four lifts and a game.
    //
    // The total and the added figure are both asserted, because the gap
    // between them is the honest part: most of the total is the blank
    // 20:30-22:00 window getting a job, not time taken from the day.
    expect(dailyMinutes()).toBeLessThanOrEqual(90);
    expect(addedMinutes()).toBeLessThanOrEqual(25);
  });

  it('places nothing inside working hours', () => {
    // The defect that broke this app for him was items scheduled while he
    // was at work. Nothing surfaced may repeat it.
    const start = toMinutes(ME.workStart);
    const end = toMinutes(ME.workEnd);
    const duringWork = today()
      .filter((x) => {
        const m = toMinutes(x.at ?? '00:00');
        // Breaks during the work day are the exception and say so in the
        // protocol itself — a break is only meaningful while working.
        if (x.protocol.duringWork) return false;
        return m >= start && m < end;
      })
      .map((x) => `${x.protocolId} at ${x.at}`);
    expect({ duringWork }).toEqual({ duringWork: [] });
  });

  it('does not collide with an item already in the week', () => {
    // Two things at the same minute is what his routines screen used to
    // print, five times over, and it is why he stopped opening it.
    const taken = new Set([...WEEK_SPINE, ...MONDAY_OVERRIDE].map((i) => i.at));
    const clashes = today()
      // An entry marked `alreadyInWeek` is the protocol BEHIND a week
      // item, not a second thing at the same minute. Anything else at a
      // taken minute is the old bug returning.
      .filter((x) => !x.alreadyInWeek && taken.has(x.at ?? ''))
      .map((x) => `${x.protocolId} at ${x.at}`);
    expect({ clashes }).toEqual({ clashes: [] });
  });
});

describe('what it says about the library', () => {
  it('the spine is if-then planning, and it is grade A', () => {
    // Stated as a test rather than a comment because it is the finding:
    // the best-evidenced technique for his exact problem was already in
    // here and had never been on a screen.
    const spine = resolve(SPINE).items;
    expect(spine.map((x) => x.grade)).toEqual(['A', 'A', 'A']);
    expect(spine.every((x) => x.protocolId.includes('if-then'))).toBe(true);
  });

  it('both quit goals are served by a grade A protocol', () => {
    for (const goal of ['quit-drinking', 'quit-vaping'] as MyGoal[]) {
      const best = forGoal(goal)[0];
      expect({ goal, grade: best?.grade }).toEqual({ goal, grade: 'A' });
    }
  });
});
