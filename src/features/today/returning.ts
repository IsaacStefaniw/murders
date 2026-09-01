/**
 * Coming back after a while away.
 *
 * The days a habit app most needs to get right are the ones after you
 * stopped using it. What almost every app does on that morning is show the
 * same screen it showed on day one, still carrying a plan built for a week
 * that has since happened without you — or worse, a broken streak and a
 * count of everything missed. Both say the same thing: you failed at this.
 * That is the moment people delete.
 *
 * So the rules here are narrow and deliberate.
 *
 * NOTHING IS COUNTED THAT WAS MISSED. Not the number of skipped sessions,
 * not the percentage, not the streak. The information is real but it is
 * not useful, and the person already knows.
 *
 * WHAT SURVIVED IS NAMED. Levels, logged sessions and weeks do not decay,
 * because they record work that genuinely happened — and being told your
 * eleven sessions are still eleven sessions is the opposite of a broken
 * streak.
 *
 * THE PLAN IS STALE AND SAYS SO. A week built a fortnight ago is fiction,
 * and showing it as though it were live is how the app loses the argument
 * about whether it understands your actual life.
 */

import type { DailyPlan } from '@/types/domain';

export interface ReturnSummary {
  daysAway: number;
  /** The one line at the top. Never a reprimand, never a total. */
  headline: string;
  /** What is still true, and what to do about today. */
  lines: string[];
  /** True when the stored week predates the absence and should be rebuilt. */
  planIsStale: boolean;
}

/** Under this, coming back is just using the app. */
const AWAY_DAYS = 3;
/** Beyond this the plan is not merely old, it is about a different life. */
const STALE_DAYS = 5;

const dayWord = (n: number) => (n === 1 ? 'day' : 'days');

export function returnSummary(input: {
  /** ISO timestamp of the last time the app was opened, if ever. */
  lastOpenedAt: string | null;
  /** Sessions logged in this pathway or any — whatever the caller counts. */
  sessionsLogged: number;
  /** Distinct weeks with logged work. */
  weeksLogged: number;
  /** Today's plan, for what is actually waiting. */
  today: DailyPlan | undefined;
  now?: Date;
}): ReturnSummary | null {
  const { lastOpenedAt, sessionsLogged, weeksLogged, today, now = new Date() } = input;
  if (!lastOpenedAt) return null;

  const daysAway = Math.floor((now.getTime() - Date.parse(lastOpenedAt)) / 86400e3);
  if (!Number.isFinite(daysAway) || daysAway < AWAY_DAYS) return null;

  const lines: string[] = [];

  // What survived. Named first, because it is the true thing that most
  // contradicts what someone expects to see here.
  if (sessionsLogged > 0) {
    lines.push(
      `Your ${sessionsLogged} logged ${sessionsLogged === 1 ? 'session' : 'sessions'} across ${weeksLogged} ${weeksLogged === 1 ? 'week' : 'weeks'} are still there. None of it expires, and nothing reset.`,
    );
  }

  const planIsStale = daysAway >= STALE_DAYS;
  if (planIsStale) {
    lines.push('The week on file was built before you went quiet, so it is out of date. Rebuilding it takes a second and starts from today.');
  }

  const remaining = (today?.items ?? []).filter((i) => i.status === 'planned');
  if (remaining.length > 0) {
    const first = remaining[0];
    lines.push(`Today has ${remaining.length} ${remaining.length === 1 ? 'thing' : 'things'} on it. The next is ${first.title} at ${first.start}.`);
  } else {
    lines.push('Nothing is scheduled for today yet. One thing is a fine place to start.');
  }

  return {
    daysAway,
    headline: `${daysAway} ${dayWord(daysAway)} away. Nothing to catch up on.`,
    lines,
    planIsStale,
  };
}
