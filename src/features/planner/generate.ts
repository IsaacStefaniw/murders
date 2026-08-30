/**
 * Builds the scheduling context for a given day from the user's profile and
 * routines, then runs the deterministic engine.
 *
 * Calendar integration is a future module; until then, work hours from the
 * profile become fixed commitments, split around a free lunch window and
 * around during-work routines (deep-work blocks), which appear as named
 * fixed items of their own. The CalendarProvider abstraction will replace
 * `workBlocks` as the source of fixed events.
 */

import { buildDailyPlan, computeFreeWindows } from '@/lib/scheduling/engine';
import type { FixedCommitment } from '@/lib/scheduling/engine';
import { toMinutes, toHHMM, weekdayOf } from '@/lib/dates';
import type { DailyPlan, LifeProfile, PlanItem, Routine } from '@/types/domain';

const LUNCH_START = 12 * 60;
const LUNCH_END = 13 * 60 + 30;

export function workBlocks(
  profile: LifeProfile,
  date: string,
  routines: Routine[] = [],
): FixedCommitment[] {
  const weekday = weekdayOf(date);
  if (!profile.workDays.includes(weekday)) return [];

  const workStart = toMinutes(profile.workStart);
  const workEnd = toMinutes(profile.workEnd);
  if (workEnd <= workStart) return [];

  // Carve-outs from the work day: lunch (left free) and during-work routines
  // (emitted as their own named fixed commitments).
  const carves: { start: number; end: number; commitment?: FixedCommitment }[] = [];
  if (workStart < LUNCH_START && workEnd > LUNCH_END) {
    carves.push({ start: LUNCH_START, end: LUNCH_END });
  }
  for (const r of routines) {
    if (!r.duringWork || !r.active || !r.days.includes(weekday)) continue;
    const start = Math.max(workStart, toMinutes(r.preferredStart));
    const end = start + r.durationMin;
    if (end > workEnd) continue;
    carves.push({
      start,
      end,
      commitment: {
        title: r.title,
        start: toHHMM(start),
        end: toHHMM(end),
        area: r.area,
        sessionType: r.sessionType,
        routineId: r.id,
        goalId: r.goalId,
      },
    });
  }
  carves.sort((a, b) => a.start - b.start);

  const blocks: FixedCommitment[] = [];
  let cursor = workStart;
  for (const carve of carves) {
    // Two carve-outs can prefer the same start (deep work + a growth
    // block); the later one shifts to follow the earlier, never overlaps.
    const duration = carve.end - carve.start;
    const start = Math.max(carve.start, cursor);
    const end = start + duration;
    if (end > workEnd) continue;
    if (start > cursor) {
      blocks.push({ title: 'Work', start: toHHMM(cursor), end: toHHMM(start), area: 'work' });
    }
    if (carve.commitment) {
      blocks.push({ ...carve.commitment, start: toHHMM(start), end: toHHMM(end) });
    }
    cursor = end;
  }
  if (cursor < workEnd) {
    blocks.push({ title: 'Work', start: toHHMM(cursor), end: toHHMM(workEnd), area: 'work' });
  }
  return blocks;
}

export function generateDailyPlan(
  profile: LifeProfile,
  routines: Routine[],
  date: string,
  calendarEvents: FixedCommitment[] = [],
): DailyPlan & { unplaced: Routine[] } {
  // Real calendar events are truth; modelled work hours are the fallback
  // for work days the calendar knows nothing about.
  const fixed =
    calendarEvents.length > 0 ? calendarEvents : workBlocks(profile, date, routines);
  // Capacity governs slack: minimal keeps a third of free time untouched.
  const reservedFreeFraction =
    profile.capacity === 'minimal' ? 0.35 : profile.capacity === 'push' ? 0.2 : 0.25;
  return buildDailyPlan({
    date,
    wakeTime: profile.wakeTime,
    sleepTime: profile.sleepTime,
    fixed,
    reservedFreeFraction,
    // during-work routines are already in the fixed list — don't place twice.
    routines: routines.filter((r) => !r.duringWork),
  });
}

/**
 * Valid alternative start times for moving a plan item, computed from the
 * day's actual gaps (every other item counts as busy). Deterministic — the
 * user can never move an item somewhere invalid.
 */
export function availableStartsFor(
  item: PlanItem,
  plan: DailyPlan,
  profile: LifeProfile,
  maxOptions = 6,
): string[] {
  const duration = toMinutes(item.end) - toMinutes(item.start);
  const busy: FixedCommitment[] = plan.items
    .filter((i) => i.id !== item.id && i.status !== 'skipped')
    .map((i) => ({ title: i.title, start: i.start, end: i.end }));
  const windows = computeFreeWindows(busy, profile.wakeTime, profile.sleepTime, 10);

  const options: string[] = [];
  for (const w of windows) {
    for (let start = w.start; start + duration <= w.end; start += 60) {
      const hhmm = toHHMM(start);
      if (hhmm !== item.start) options.push(hhmm);
      if (options.length >= maxOptions) return options;
    }
  }
  return options;
}
