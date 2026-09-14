import {
  ALCOHOL_WEEKLY_GUIDELINE,
  COUNTABLE,
  bandFromDrinks,
  countFor,
  drinksLine,
  lastWeekStart,
  latestCount,
  lineFor,
  makeCount,
  vapingLine,
  weekStartOf,
} from '@/features/behaviours/weekly';
import { DRINKING_LABEL } from '@/features/health/negativeHabits';

describe('the week a count belongs to', () => {
  it('snaps to the Monday on or before a date', () => {
    // 2026-09-14 is a Monday.
    expect(weekStartOf('2026-09-14')).toBe('2026-09-14');
    expect(weekStartOf('2026-09-15')).toBe('2026-09-14');
    expect(weekStartOf('2026-09-20')).toBe('2026-09-14'); // Sunday
    expect(weekStartOf('2026-09-21')).toBe('2026-09-21'); // next Monday
  });

  it('asks about the week that has finished, not the one you are in', () => {
    // A running count of the current week is the daily tally this refuses,
    // and it is also a worse measurement, because the week is not over.
    expect(lastWeekStart('2026-09-16')).toBe('2026-09-07');
  });
});

describe('drinks onto the published bands', () => {
  it('uses the same cut points the interview offers', () => {
    // negativeHabits bands are already denominated in standard drinks a
    // week, so a measured week maps straight on with no conversion.
    expect(bandFromDrinks(0)).toBe('none');
    expect(bandFromDrinks(1)).toBe('lowRisk');
    expect(bandFromDrinks(10)).toBe('lowRisk');
    expect(bandFromDrinks(11)).toBe('moderate');
    expect(bandFromDrinks(20)).toBe('moderate');
    expect(bandFromDrinks(21)).toBe('high');
    expect(bandFromDrinks(35)).toBe('high');
    expect(bandFromDrinks(36)).toBe('veryHigh');
  });

  it('lines up with the labels the interview already shows', () => {
    expect(DRINKING_LABEL[bandFromDrinks(10)]).toBe('Up to 10 a week');
    expect(DRINKING_LABEL[bandFromDrinks(15)]).toBe('11 to 20 a week');
  });
});

describe('what the number says', () => {
  it('reports against the guideline and nothing else', () => {
    expect(ALCOHOL_WEEKLY_GUIDELINE).toBe(10);
    expect(drinksLine(14)).toBe(
      '14 standard drinks last week — 4 above the Australian guideline of 10 a week.',
    );
    expect(drinksLine(6)).toBe(
      '6 standard drinks last week — 4 under the Australian guideline of 10 a week.',
    );
    expect(drinksLine(1)).toContain('1 standard drink last week');
    expect(drinksLine(0)).toBe('No drinks recorded for last week.');
  });

  it('never praises, shames, or counts days', () => {
    for (const n of [0, 1, 5, 10, 12, 40]) {
      const line = drinksLine(n);
      expect(line).not.toMatch(/well done|great|good week|bad|too much|streak|clear day|days clean/i);
    }
  });

  it('says plainly that a vaping count moves no published score', () => {
    // Life's Essential 8 scores nicotine by status, not by count. A number
    // that implied otherwise would be the app inventing precision.
    expect(vapingLine(9)).toMatch(/scores whether you use an inhaled nicotine product, not how often/i);
    expect(vapingLine(0)).toBe('No vaping recorded for last week.');
  });

  it('only offers a count where one means something', () => {
    expect(Object.keys(COUNTABLE).sort()).toEqual(['alcohol', 'smoking', 'vaping']);
    // Doomscrolling has no published weekly threshold, so no number is asked.
    expect(COUNTABLE.doomscrolling).toBeUndefined();
  });
});

describe('storing one figure a week', () => {
  it('reads back the figure for a given week, and the most recent one', () => {
    const counts = [
      makeCount('alcohol', '2026-08-31', 18),
      makeCount('alcohol', '2026-09-07', 6),
      makeCount('vaping', '2026-09-07', 3),
    ];
    expect(countFor(counts, 'alcohol', '2026-08-31')?.count).toBe(18);
    expect(latestCount(counts, 'alcohol')?.count).toBe(6);
    expect(latestCount(counts, 'vaping')?.count).toBe(3);
    expect(latestCount(counts, 'gambling')).toBeNull();
  });

  it('rounds and floors, because a negative week is not a week', () => {
    expect(makeCount('alcohol', '2026-09-07', -3).count).toBe(0);
    expect(makeCount('alcohol', '2026-09-07', 4.6).count).toBe(5);
  });

  it('routes each behaviour to its own sentence', () => {
    expect(lineFor('alcohol', 12)).toMatch(/guideline/);
    expect(lineFor('vaping', 12)).toMatch(/not how often/);
    expect(lineFor('smoking', 12)).toBe('12 cigarettes last week.');
  });
});
