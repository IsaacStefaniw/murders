/**
 * Builds the scheduling context for a given day from the user's profile and
 * routines, then runs the deterministic engine.
 *
 * Calendar integration is a future module; until then, work hours from the
 * profile become fixed commitments (split around a free lunch window so
 * midday routines have somewhere to live). The CalendarProvider abstraction
 * in lib/calendar will replace `workBlocks` as the source of fixed events.
 */

import { buildDailyPlan } from '@/lib/scheduling/engine';
import type { FixedCommitment } from '@/lib/scheduling/engine';
import { toMinutes, toHHMM, weekdayOf } from '@/lib/dates';
import type { DailyPlan, LifeProfile, Routine } from '@/types/domain';

const LUNCH_START = 12 * 60;
const LUNCH_END = 13 * 60 + 30;

export function workBlocks(profile: LifeProfile, date: string): FixedCommitment[] {
  const weekday = weekdayOf(date);
  if (!profile.workDays.includes(weekday)) return [];

  const start = toMinutes(profile.workStart);
  const end = toMinutes(profile.workEnd);
  if (end <= start) return [];

  // Carve a lunch window out of the work day when the hours span midday.
  if (start < LUNCH_START && end > LUNCH_END) {
    return [
      { title: 'Work', start: toHHMM(start), end: toHHMM(LUNCH_START), area: 'work' },
      { title: 'Work', start: toHHMM(LUNCH_END), end: toHHMM(end), area: 'work' },
    ];
  }
  return [{ title: 'Work', start: profile.workStart, end: profile.workEnd, area: 'work' }];
}

export function generateDailyPlan(
  profile: LifeProfile,
  routines: Routine[],
  date: string,
): DailyPlan & { unplaced: Routine[] } {
  return buildDailyPlan({
    date,
    wakeTime: profile.wakeTime,
    sleepTime: profile.sleepTime,
    fixed: workBlocks(profile, date),
    routines,
  });
}
