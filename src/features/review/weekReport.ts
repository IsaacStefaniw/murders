/**
 * The weekly wins report — evidence that the system is working, in the
 * user's own numbers. Deterministic, built from what actually happened;
 * no grades, no streaks, no shame. Rolling seven days including today.
 */

import { learnedDurations } from '@/lib/scheduling/adaptation';
import { addDays } from '@/lib/dates';
import type { DailyPlan, Goal, LifeArea } from '@/types/domain';

export interface WeekReport {
  from: string;
  to: string;
  done: number;
  planned: number;
  /** Milestones completed this week, with their goals. */
  milestonesMoved: { goalTitle: string; milestone: string }[];
  byArea: { area: LifeArea; done: number }[];
  bestDay: { date: string; done: number } | null;
  /** Most-completed titles — the practices that actually carried the week. */
  topWins: { title: string; count: number }[];
  /**
   * How long a thing actually takes this person, once three real sessions
   * have been measured. The median, not this week's number, which is why
   * it is worth saying at all.
   */
  learnedTimings: { title: string; minutes: number; count: number }[];
}

export function buildWeekReport(
  today: string,
  plans: Record<string, DailyPlan>,
  goals: Goal[],
): WeekReport {
  const from = addDays(today, -6);
  const fromIso = `${from}T00:00:00.000Z`;

  let done = 0;
  let planned = 0;
  const areaCounts = new Map<LifeArea, number>();
  const titleCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();

  for (const plan of Object.values(plans)) {
    if (plan.date < from || plan.date > today) continue;
    for (const item of plan.items) {
      if (item.title === 'Work') continue;
      if (item.status === 'completed' || item.status === 'skipped') planned += 1;
      if (item.status !== 'completed') continue;
      done += 1;
      areaCounts.set(item.area, (areaCounts.get(item.area) ?? 0) + 1);
      titleCounts.set(item.title, (titleCounts.get(item.title) ?? 0) + 1);
      dayCounts.set(plan.date, (dayCounts.get(plan.date) ?? 0) + 1);
    }
  }

  const milestonesMoved = goals.flatMap((g) =>
    (g.milestones ?? [])
      .filter((m) => m.done && (m.doneAt ?? '') >= fromIso)
      .map((m) => ({ goalTitle: g.title, milestone: m.title })),
  );

  const bestDayEntry = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    from,
    to: today,
    done,
    planned,
    milestonesMoved,
    byArea: [...areaCounts.entries()]
      .map(([area, count]) => ({ area, done: count }))
      .sort((a, b) => b.done - a.done),
    bestDay: bestDayEntry ? { date: bestDayEntry[0], done: bestDayEntry[1] } : null,
    topWins: [...titleCounts.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    // Learned from every day the app still holds, not just this week: a
    // median of three sessions is the point at which it is worth saying.
    learnedTimings: learnedTimingsFrom(plans),
  };
}

/**
 * The two things whose real length the app has learned, most-measured
 * first. Titles come from the items themselves, so a routine renamed
 * since is named as it is now.
 */
function learnedTimingsFrom(
  plans: Record<string, DailyPlan>,
): { title: string; minutes: number; count: number }[] {
  const all = Object.values(plans).flatMap((p) => p.items);
  const titleOf = new Map<string, string>();
  for (const item of all) if (item.routineId) titleOf.set(item.routineId, item.title);
  return Object.entries(learnedDurations(all))
    .map(([routineId, learned]) => ({
      title: titleOf.get(routineId) ?? '',
      minutes: learned.minutes,
      count: learned.count,
    }))
    .filter((t) => t.title !== '')
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
}
