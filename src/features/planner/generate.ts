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
import type { FixedCommitment, MovedPlacement } from '@/lib/scheduling/engine';
import { toMinutes, toHHMM, weekdayOf } from '@/lib/dates';
import type { DailyPlan, Goal, LifeProfile, PlanItem, Routine } from '@/types/domain';

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

/** goalId → the goal's next step: the review-set lever, else the next milestone. */
export function goalFocusMap(goals: Goal[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const g of goals) {
    if (g.status !== 'active') continue;
    const focus = g.nextFocus ?? g.milestones?.find((m) => !m.done)?.title;
    if (focus) map[g.id] = focus;
  }
  return map;
}

export function generateDailyPlan(
  profile: LifeProfile,
  routines: Routine[],
  date: string,
  calendarEvents: FixedCommitment[] = [],
  goals: Goal[] = [],
): DailyPlan & { unplaced: Routine[]; moved: MovedPlacement[] } {
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
    // The answer to "which parts of life matter most" finally reaches the
    // code that decides which of two things gets the hour.
    priorities: profile.priorities,
    goalFocus: goalFocusMap(goals),
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

  // Quarter-hours, not whole hours. On a working day the only real gaps are
  // an hour or two long, and stepping by 60 from a window that opens at
  // 18:25 offered exactly one time in the entire evening.
  const STEP_MIN = 15;

  const perWindow = windows.map((w) => {
    const starts: string[] = [];
    // Start on the quarter-hour so options read as times a person would
    // choose — 18:30, not 18:25.
    const first = Math.ceil(w.start / STEP_MIN) * STEP_MIN;
    for (let start = first; start + duration <= w.end; start += STEP_MIN) {
      const hhmm = toHHMM(start);
      if (hhmm !== item.start) starts.push(hhmm);
    }
    return starts;
  });

  // Take one from each window before taking a second from any. Filling the
  // list in order meant a wide morning gap could use up every slot and hide
  // the fact that the evening was free at all.
  const options: string[] = [];
  for (let i = 0; options.length < maxOptions; i += 1) {
    let added = false;
    for (const starts of perWindow) {
      if (i >= starts.length) continue;
      options.push(starts[i]);
      added = true;
      if (options.length >= maxOptions) break;
    }
    if (!added) break;
  }
  return options.sort((a, b) => toMinutes(a) - toMinutes(b));
}

/**
 * The latest time at or before `endMin` where an activity of this length
 * fits without overlapping anything already on the day.
 *
 * Logging something after the fact used to drop it at "now minus its
 * duration" regardless of what was there. On a packed working day that is
 * how three items ended up stacked on a single lunch break — and once they
 * overlapped, every later calculation read the day as fuller than it was,
 * which is what left nowhere to move anything to.
 *
 * Searching BACKWARDS matters: the thing already happened, so the honest
 * placement is as close to the reported time as reality allows, never
 * later. If nothing fits at all, the reported time is returned unchanged —
 * a real event that overlaps is still better than a tidy fiction.
 */
export function freeEndAtOrBefore(
  items: Pick<PlanItem, 'start' | 'end' | 'status'>[],
  endMin: number,
  durationMin: number,
  earliestStart = 0,
): number {
  const busy = items
    .filter((i) => i.status !== 'skipped')
    .map((i) => ({ start: toMinutes(i.start), end: toMinutes(i.end) }))
    .sort((a, b) => b.start - a.start);

  let end = endMin;
  // Each pass either clears the day or jumps behind the latest blocker, so
  // this cannot run longer than the number of items.
  for (let guard = 0; guard <= busy.length; guard += 1) {
    const start = end - durationMin;
    if (start < earliestStart) return endMin;
    const clash = busy.find((b) => b.start < end && b.end > start);
    if (!clash) return end;
    end = clash.start;
  }
  return endMin;
}
