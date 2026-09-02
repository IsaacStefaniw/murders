/**
 * Whether the product works, computed rather than collected.
 *
 * ── The problem, and why the obvious solution was wrong ─────────────────
 *
 * Nobody could tell whether IntentNorth works. Not the person using it, not the
 * person building it. There was no activation funnel, no retention curve,
 * no completion trend — which means no way to improve deliberately and no
 * evidence to show anyone.
 *
 * The obvious fix is an analytics SDK: log events, ship them to a server,
 * read dashboards. That would trade away the one architectural position
 * this app actually holds — everything on the device, nothing shared —
 * for numbers a spreadsheet could produce. It would also be slower, add a
 * dependency, need consent screens, and start collecting the day it ships
 * rather than telling us anything about the weeks already lived.
 *
 * ── What this does instead ──────────────────────────────────────────────
 *
 * Every number below is DERIVED from data the app already stores for its
 * own reasons: the profile's creation date, and the plans with their item
 * statuses. No events, no logging, no network, no new storage, no consent
 * required because nothing leaves the phone. It also works retroactively —
 * install it today and it can describe a user's first month accurately,
 * which no event pipeline started today could ever do.
 *
 * The user sees their own numbers. Sharing them is a deliberate act they
 * take, once, by choosing to; there is no background transmission to
 * switch off because there is none to begin with.
 */

import { addDays, todayKey } from '@/lib/dates';
import type { DailyPlan, LifeProfile } from '@/types/domain';

/** A single week of a person's life with the app. */
export interface WeekSlice {
  /** 1 = the first seven days after the profile was created. */
  index: number;
  from: string;
  to: string;
  /** Days in this week where at least one thing was completed. */
  activeDays: number;
  completed: number;
  /** Items that were resolved either way — the denominator for a rate. */
  resolved: number;
}

export interface CohortMetrics {
  /** ISO date the profile was created — day zero. */
  since: string;
  daysSince: number;
  /** Did they get past onboarding to a real plan? */
  activated: boolean;
  /**
   * Days from first plan to first completed item. The single best early
   * predictor in this category: value delayed is value never delivered.
   * Null when nothing has ever been completed.
   */
  daysToFirstWin: number | null;
  weeks: WeekSlice[];
  /**
   * Retained at week N = completed at least one thing during that week.
   * Deliberately generous: opening the app is not retention, and a week
   * with one real completion is a week the product did something.
   */
  retainedWeek1: boolean;
  retainedWeek4: boolean;
  /** Completion rate across everything resolved, 0..1. Null before any. */
  completionRate: number | null;
  /** Consecutive weeks, most recent first, with at least one completion. */
  activeWeekStreak: number;
}

const MS_PER_DAY = 86_400_000;

function daysBetween(fromKey: string, toKey: string): number {
  const a = Date.parse(`${fromKey}T00:00:00.000Z`);
  const b = Date.parse(`${toKey}T00:00:00.000Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / MS_PER_DAY);
}

/** The 'YYYY-MM-DD' part of an ISO timestamp, or null if unparseable. */
function dayKeyOf(iso: string | undefined): string | null {
  if (!iso) return null;
  const key = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

/**
 * Work items are excluded throughout.
 *
 * They are modelled commitments, not things the app asked anyone to do,
 * and nobody "completes" their working day in this app. Counting them
 * would inflate every rate here with something the product had no hand in
 * — the exact way engagement metrics come to describe the metric rather
 * than the product.
 */
function meaningful(title: string): boolean {
  return title !== 'Work';
}

export function computeCohortMetrics(
  profile: LifeProfile | null,
  plans: Record<string, DailyPlan>,
  today: string = todayKey(),
): CohortMetrics | null {
  if (!profile) return null;
  const since = dayKeyOf(profile.createdAt);
  if (!since) return null;

  const daysSince = Math.max(0, daysBetween(since, today));

  let firstWinDay: string | null = null;
  let completedAll = 0;
  let resolvedAll = 0;

  const perDay = new Map<string, { completed: number; resolved: number }>();

  for (const plan of Object.values(plans)) {
    if (plan.date < since || plan.date > today) continue;
    for (const item of plan.items) {
      if (!meaningful(item.title)) continue;
      const isDone = item.status === 'completed';
      const isResolved = isDone || item.status === 'skipped';
      if (!isResolved) continue;

      const bucket = perDay.get(plan.date) ?? { completed: 0, resolved: 0 };
      bucket.resolved += 1;
      resolvedAll += 1;
      if (isDone) {
        bucket.completed += 1;
        completedAll += 1;
        if (firstWinDay === null || plan.date < firstWinDay) firstWinDay = plan.date;
      }
      perDay.set(plan.date, bucket);
    }
  }

  // A plan on or before today means onboarding produced something real.
  const activated = Object.values(plans).some((p) => p.date >= since && p.items.length > 0);

  const weekCount = Math.floor(daysSince / 7) + 1;
  const weeks: WeekSlice[] = [];
  for (let i = 0; i < weekCount; i += 1) {
    const from = addDays(since, i * 7);
    const to = addDays(since, i * 7 + 6);
    let activeDays = 0;
    let completed = 0;
    let resolved = 0;
    for (const [date, bucket] of perDay) {
      if (date < from || date > to) continue;
      resolved += bucket.resolved;
      completed += bucket.completed;
      if (bucket.completed > 0) activeDays += 1;
    }
    weeks.push({ index: i + 1, from, to, activeDays, completed, resolved });
  }

  // Streak counts back from the most recent COMPLETE week. The week in
  // progress is not yet a week, and letting it count would show a streak
  // breaking every Monday morning before anyone had done anything.
  const complete = weeks.filter((w) => w.to <= today && daysBetween(w.to, today) >= 0);
  const finished = complete.filter((w) => daysBetween(w.to, today) > 0);
  let activeWeekStreak = 0;
  for (let i = finished.length - 1; i >= 0; i -= 1) {
    if (finished[i].completed > 0) activeWeekStreak += 1;
    else break;
  }

  return {
    since,
    daysSince,
    activated,
    daysToFirstWin: firstWinDay ? daysBetween(since, firstWinDay) : null,
    weeks,
    retainedWeek1: (weeks[0]?.completed ?? 0) > 0,
    retainedWeek4: (weeks[3]?.completed ?? 0) > 0,
    completionRate: resolvedAll > 0 ? completedAll / resolvedAll : null,
    activeWeekStreak,
  };
}

/**
 * The numbers as one short block of text the user can copy and send.
 *
 * This is the whole data pipeline. There is no server, no SDK and no
 * background upload — if someone wants to tell us how it is going, they
 * press a button and send a message, the same way they would tell a
 * friend. It is slower than telemetry and it is the only version of this
 * that does not contradict what the app promises on the privacy screen.
 *
 * Nothing identifying is included: no name, no goals, no titles, no dates
 * beyond how many days have passed.
 */
export function shareableSummary(m: CohortMetrics | null, weekShape?: string): string {
  if (!m) return 'No plan yet.';
  const pct = m.completionRate === null ? '—' : `${Math.round(m.completionRate * 100)}%`;
  const lines = [
    `Days using it: ${m.daysSince}`,
    `Week shape: ${weekShape ?? 'unspecified'}`,
    `First win after: ${m.daysToFirstWin === null ? 'not yet' : `${m.daysToFirstWin} day${m.daysToFirstWin === 1 ? '' : 's'}`}`,
    `Completion rate: ${pct}`,
    `Active weeks in a row: ${m.activeWeekStreak}`,
    `Week 1 active: ${m.retainedWeek1 ? 'yes' : 'no'}`,
    m.weeks.length >= 4 ? `Week 4 active: ${m.retainedWeek4 ? 'yes' : 'no'}` : null,
    `Weekly active days: ${m.weeks.map((w) => w.activeDays).join(', ')}`,
  ].filter((l): l is string => l !== null);
  return lines.join('\n');
}
