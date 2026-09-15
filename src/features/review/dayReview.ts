/**
 * The end of the day, as the day rather than as a feeling.
 *
 * ── What this replaces ──────────────────────────────────────────────────
 *
 * The evening check-in asks for a five-point mood and two paragraphs of
 * free text. It is a journalling prompt wearing a review's name, and it is
 * wrong on every axis that matters here:
 *
 *   - It is slow. Two text fields at 9pm is homework.
 *   - It produces nothing the engine can use. The adaptation layer needs
 *     to know WHICH things happened and which did not; a mood of 3 tells
 *     it nothing about Tuesday at 6:15.
 *   - It gives no closure. You finish it having described the day rather
 *     than having finished it.
 *
 * Isaac's sketch is three columns against the day's own items — did it,
 * didn't, did something else — and then one line of result and tomorrow's
 * first thing. Whole day in three taps, and every tap is a fact the
 * scheduler can act on.
 *
 * ── THE THIRD COLUMN IS THE IMPORTANT ONE ───────────────────────────────
 *
 * "+" means "I did something else". It is the most-used control in any
 * honest review, because real days substitute rather than comply — and it
 * is currently a 56-chip wall on Today that nobody will scroll to.
 * Capturing it here means the app learns what someone ACTUALLY does, which
 * is the only thing the adaptation engine was ever able to use.
 *
 * ── WHAT IT REFUSES ─────────────────────────────────────────────────────
 *
 * No score, no percentage, no streak. The result line is a count and a
 * direction: "four of five this week" is a fact; "80%" is a grade. A
 * missed Tuesday is a missed Tuesday, not a reset to zero — the app has
 * said that on its Progress screen for some time and this is the screen
 * where it would be easiest to break the promise.
 */

import type { DailyPlan, PlanItem, PlanItemStatus } from '@/types/domain';
import { addDays, durationMinutes, toMinutes } from '@/lib/dates';

/** What a person can say about one row. */
export type DayMark = 'did' | 'didnt' | 'instead';

/** The status a mark writes. 'instead' keeps the row honest: the planned
 *  thing did not happen, and something else is logged beside it. */
export const MARK_STATUS: Record<DayMark, PlanItemStatus> = {
  did: 'completed',
  didnt: 'skipped',
  instead: 'skipped',
};

export interface DayRow {
  item: PlanItem;
  /** Null where the person has not answered yet. */
  mark: DayMark | null;
}

/**
 * What a review is allowed to ask about.
 *
 * Generic work blocks are calendar noise, the same rule Today applies, and
 * fixed calendar events are the person's own diary rather than something
 * the app asked of them — "did your dentist appointment happen?" is the
 * app pretending to have scheduled someone's life. Exported so the week
 * grid reviews exactly the same set: two review screens disagreeing about
 * what counts is two different apps.
 */
export const isReviewable = (i: PlanItem) => i.title !== 'Work' && !i.fixed;

/**
 * The rows to review, in the order they happened. See `isReviewable`.
 */
export function dayRows(plan: DailyPlan | undefined): DayRow[] {
  return (plan?.items ?? [])
    .filter(isReviewable)
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .map((item) => ({
      item,
      mark:
        item.status === 'completed'
          ? ('did' as const)
          : item.status === 'skipped'
            ? ('didnt' as const)
            : null,
    }));
}

export interface DayResult {
  /** This day. */
  done: number;
  total: number;
  /** The seven days ending today — the context that stops one day being a verdict. */
  weekDone: number;
  weekTotal: number;
  /** Completions per day across the week, oldest first, for the sparkline. */
  trend: number[];
  line: string;
}

/**
 * The one line under the grid.
 *
 * Deliberately the WEEK rather than the day. A single day is noise, and a
 * person who did one of three today is not having the conversation the
 * number implies — where a week of four out of five says something real.
 */
export function dayResult(
  plans: Record<string, DailyPlan>,
  today: string,
): DayResult {
  const trend: number[] = [];
  let weekDone = 0;
  let weekTotal = 0;
  for (let i = 6; i >= 0; i--) {
    const rows = dayRows(plans[addDays(today, -i)]);
    const done = rows.filter((r) => r.item.status === 'completed').length;
    trend.push(done);
    weekDone += done;
    weekTotal += rows.length;
  }
  const rows = dayRows(plans[today]);
  const done = rows.filter((r) => r.item.status === 'completed').length;

  const line =
    weekTotal === 0
      ? 'Nothing planned this week yet.'
      : `${weekDone} of ${weekTotal} this week.`;

  return { done, total: rows.length, weekDone, weekTotal, trend, line };
}

/**
 * Tomorrow's first thing, so the review ends by setting up the next day.
 *
 * This is what makes the screen worth opening rather than worth
 * dismissing: it finishes one day and hands you the next, with the one
 * control that matters on it.
 */
export function tomorrowFirst(
  plans: Record<string, DailyPlan>,
  today: string,
): PlanItem | null {
  const rows = dayRows(plans[addDays(today, 1)]);
  return rows[0]?.item ?? null;
}

/** How long the row took, for the ones that have a length worth saying. */
export function rowLength(item: PlanItem): string | null {
  const mins = durationMinutes(item.start, item.end);
  if (mins < 30) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
