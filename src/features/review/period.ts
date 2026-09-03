/**
 * Which week a review is actually about.
 *
 * The work pathway's growth block lands on a Monday and opened with "What
 * moved this week?" — on a Monday, nothing has. The question meant last
 * week and said this week, and the one under it ("the one lever for next
 * week") meant the week you are standing in. Both sent the person looking
 * for the wrong seven days.
 *
 * Rather than patch the two strings, the period is derived from the day
 * the review runs and the copy is named from it. A review early in the
 * week looks back at the week just finished and forward at the one it is
 * in; a review later in the week looks back at the days so far and forward
 * at the week to come.
 */

import { addDays, weekStartOf, weekdayOf } from '@/lib/dates';

export interface ReviewPeriod {
  /** The week being looked back on: "last week", "this week so far". */
  lookingBack: string;
  /** The week being planned: "the week ahead", "next week". */
  lookingForward: string;
  /** First day of the period under review. */
  from: string;
  /** Last day of the period under review. */
  to: string;
  /** True when the review sits at the top of a week rather than inside one. */
  atWeekStart: boolean;
}

/**
 * Monday and Tuesday count as the top of the week.
 *
 * Tuesday is included deliberately: a Monday review pushed a day is still
 * a review of the week that finished, and asking someone on Tuesday what
 * moved "this week" would be asking about a day and a half.
 */
const WEEK_START_DAYS = new Set([1, 2]);

export function reviewPeriod(today: string): ReviewPeriod {
  const weekday = weekdayOf(today);
  const thisWeekStart = weekStartOf(today);

  if (WEEK_START_DAYS.has(weekday)) {
    const lastWeekStart = addDays(thisWeekStart, -7);
    return {
      lookingBack: 'last week',
      lookingForward: 'this week',
      from: lastWeekStart,
      to: addDays(lastWeekStart, 6),
      atWeekStart: true,
    };
  }

  return {
    lookingBack: 'this week',
    lookingForward: 'next week',
    from: thisWeekStart,
    to: today,
    atWeekStart: false,
  };
}

/** The two questions, named for the week they are actually asking about. */
export function reviewQuestions(period: ReviewPeriod): {
  moved: string;
  lever: string;
} {
  return {
    moved: `What moved ${period.lookingBack}?`,
    lever: `The one lever for ${period.lookingForward}`,
  };
}
