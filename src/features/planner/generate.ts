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
import type { EnergyPlacement, FixedCommitment, MovedPlacement } from '@/lib/scheduling/engine';
import { energyShape } from '@/features/health/sleepDebt';
import { withProtocolBounds } from '@/features/knowledge/protocols';
import { durationMinutes, toHHMM, toMinutes, weekdayOf } from '@/lib/dates';
import type { DailyPlan, Goal, LifeProfile, PlanItem, Routine, Weekday } from '@/types/domain';

const LUNCH_START = 12 * 60;
const LUNCH_END = 13 * 60 + 30;
/** Shorter than this, a piece of the work day is a sliver, not a block. */
const MIN_WORK_FRAGMENT_MIN = 30;
const DAY_MIN = 24 * 60;

/** A block in minutes past midnight, before it becomes a commitment. */
type MinuteBlock = Omit<FixedCommitment, 'start' | 'end'> & { start: number; end: number };

const toCommitment = (b: MinuteBlock): FixedCommitment => ({
  ...b,
  start: toHHMM(b.start),
  end: toHHMM(b.end),
});

export interface CarvedWorkDay {
  blocks: FixedCommitment[];
  /**
   * During-work routines due today that no block could hold: longer than
   * the hours, or pushed past their end by an earlier carve-out. They are
   * reported so the day can say so; until they were, a block that did not
   * fit simply vanished, and nothing on any screen said it had.
   */
  uncarved: Routine[];
}

export function workBlocks(
  profile: LifeProfile,
  date: string,
  routines: Routine[] = [],
): FixedCommitment[] {
  return carveWorkDay(profile, date, routines).blocks;
}

export function carveWorkDay(
  profile: LifeProfile,
  date: string,
  routines: Routine[] = [],
): CarvedWorkDay {
  const weekday = weekdayOf(date);
  const workStart = toMinutes(profile.workStart);
  const workEnd = toMinutes(profile.workEnd);
  if (workEnd === workStart) return { blocks: [], uncarved: [] };

  if (workEnd > workStart) {
    if (!profile.workDays.includes(weekday)) return { blocks: [], uncarved: [] };
    const span = carveSpan(workStart, workEnd, weekday, routines);
    return { blocks: span.blocks.map(toCommitment), uncarved: span.uncarved };
  }

  // Hours that cross midnight. A night shift is one span, from its start
  // this evening to its end tomorrow morning, and each date shows the
  // pieces that fall on it: the evening of the shift that starts tonight,
  // and the morning of the one that started last night. Until this, an
  // end before the start meant no work at all, and a night worker's whole
  // shift was planned over as free time.
  const blocks: MinuteBlock[] = [];
  const uncarved: Routine[] = [];
  if (profile.workDays.includes(weekday)) {
    const span = carveSpan(workStart, workEnd + DAY_MIN, weekday, routines);
    for (const b of span.blocks) {
      if (b.start >= DAY_MIN) continue;
      // Plain work stops at midnight; a carved routine stays whole on the
      // day it starts.
      blocks.push(b.routineId ? b : { ...b, end: Math.min(b.end, DAY_MIN) });
    }
    uncarved.push(...span.uncarved);
  }
  const yesterday = ((weekday + 6) % 7) as Weekday;
  if (profile.workDays.includes(yesterday)) {
    const span = carveSpan(workStart, workEnd + DAY_MIN, yesterday, routines);
    for (const b of span.blocks) {
      if (b.end <= DAY_MIN) continue;
      // A carved routine that began before midnight is already whole on
      // yesterday; only what starts after midnight belongs to today.
      if (b.routineId && b.start < DAY_MIN) continue;
      blocks.push({ ...b, start: Math.max(b.start, DAY_MIN) - DAY_MIN, end: b.end - DAY_MIN });
    }
  }
  blocks.sort((a, b) => a.start - b.start);
  return { blocks: blocks.map(toCommitment), uncarved };
}

/**
 * Split one span of work hours around lunch and around the routines that
 * happen during it. Minutes may run past 1440 for a span that crosses
 * midnight; the caller decides which date each piece belongs to.
 */
function carveSpan(
  workStart: number,
  workEnd: number,
  weekday: Weekday,
  routines: Routine[],
): { blocks: MinuteBlock[]; uncarved: Routine[] } {
  // Carve-outs from the work day: lunch (left free) and during-work routines
  // (emitted as their own named fixed commitments).
  const carves: { start: number; end: number; routine?: Routine }[] = [];
  const uncarved: Routine[] = [];
  if (workStart < LUNCH_START && workEnd > LUNCH_END) {
    carves.push({ start: LUNCH_START, end: LUNCH_END });
  }
  for (const r of routines) {
    if (!r.duringWork || !r.active || !r.days.includes(weekday)) continue;
    const duration = r.durationMin;
    if (duration > workEnd - workStart) {
      uncarved.push(r);
      continue;
    }
    // A preferred time earlier than the start of a shift that crosses
    // midnight means the small hours of it, not the morning before.
    const preferred = toMinutes(r.preferredStart);
    const wanted = preferred < workStart && workEnd > DAY_MIN ? preferred + DAY_MIN : preferred;
    // Clamped into the day rather than dropped: a block that prefers 17:00
    // in a day that ends at 17:00 still belongs to that day. A ritual that
    // closes the day sits against its end, whatever the hours are.
    const start = r.anchorToWorkEnd
      ? workEnd - duration
      : Math.min(Math.max(workStart, wanted), workEnd - duration);
    carves.push({ start, end: start + duration, routine: r });
  }
  carves.sort((a, b) => a.start - b.start);

  const blocks: MinuteBlock[] = [];
  let cursor = workStart;
  for (const carve of carves) {
    // Two carve-outs can prefer the same start (deep work + a growth
    // block); the later one shifts to follow the earlier, never overlaps.
    const duration = carve.end - carve.start;
    let start = Math.max(carve.start, cursor);
    // A fragment of the work day shorter than half an hour is not a block
    // anyone can use, and on the screen "Work 9:00–9:15" read as missing
    // data. The carve-out starts at the cursor instead.
    if (start > cursor && start - cursor < MIN_WORK_FRAGMENT_MIN) start = cursor;
    const end = start + duration;
    if (end > workEnd) {
      if (carve.routine) uncarved.push(carve.routine);
      continue;
    }
    if (start > cursor) {
      blocks.push({ title: 'Work', start: cursor, end: start, area: 'work' });
    }
    if (carve.routine) {
      const r = carve.routine;
      blocks.push({
        title: r.title,
        start,
        end,
        area: r.area,
        sessionType: r.sessionType,
        routineId: r.id,
        goalId: r.goalId,
      });
    }
    cursor = end;
  }
  if (cursor < workEnd) {
    const last = blocks[blocks.length - 1];
    const tail = workEnd - cursor;
    // The same rule at the end of the day: a short tail folds into the
    // plain work block it follows, when there is one right behind it.
    if (tail < MIN_WORK_FRAGMENT_MIN && last && !last.routineId && last.title === 'Work' && last.end === cursor) {
      last.end = workEnd;
    } else {
      blocks.push({ title: 'Work', start: cursor, end: workEnd, area: 'work' });
    }
  }
  return { blocks, uncarved };
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

/**
 * Re-size routines to what they actually take this person.
 *
 * A routine's `durationMin` is what somebody typed when it was created —
 * the practice's own figure, or the interview's answer. Once the person
 * has finished the same thing enough times for a median to mean anything
 * (`learnedDuration` in `src/lib/scheduling/adaptation.ts`), that median
 * is the better number, and the day should hold it: a 30-minute slot for
 * something that reliably takes 45 makes the plan wrong before the day
 * has started.
 *
 * A routine absent from the map, or carrying a length that was never
 * measured, is returned untouched — identity included, so a day with
 * nothing learned is byte-for-byte the day it was before.
 */
export function applyLearnedDurations(
  routines: Routine[],
  learnedDurationMin: Record<string, number>,
): Routine[] {
  return routines.map((r) => {
    const learned = learnedDurationMin[r.id];
    if (typeof learned !== 'number' || !Number.isFinite(learned) || learned < 1) return r;
    return learned === r.durationMin ? r : { ...r, durationMin: Math.round(learned) };
  });
}

export function generateDailyPlan(
  profile: LifeProfile,
  routines: Routine[],
  date: string,
  calendarEvents: FixedCommitment[] = [],
  goals: Goal[] = [],
  /**
   * Routine id → the minutes that routine actually takes, where enough
   * sessions have been measured to know. Empty is the old behaviour
   * exactly; the store fills it from the person's own finished blocks.
   */
  learnedDurationMin: Record<string, number> = {},
): DailyPlan & { unplaced: Routine[]; moved: MovedPlacement[]; energy: EnergyPlacement[] } {
  // Sized before anything is placed, so the carve-out of the work day and
  // the free-time placement both hold the same, real length.
  const sized = applyLearnedDurations(routines, learnedDurationMin);
  // Real calendar events are truth; modelled work hours are the fallback
  // for work days the calendar knows nothing about.
  const carved: CarvedWorkDay =
    calendarEvents.length > 0
      ? { blocks: calendarEvents, uncarved: [] }
      : carveWorkDay(profile, date, sized);
  // Capacity governs slack: minimal keeps a third of free time untouched.
  const reservedFreeFraction =
    profile.capacity === 'minimal' ? 0.35 : profile.capacity === 'push' ? 0.2 : 0.25;
  const plan = buildDailyPlan({
    date,
    wakeTime: profile.wakeTime,
    sleepTime: profile.sleepTime,
    fixed: carved.blocks,
    reservedFreeFraction,
    // The answer to "which parts of life matter most" finally reaches the
    // code that decides which of two things gets the hour.
    priorities: profile.priorities,
    // The energy shape has been computed for the readiness card since it
    // existed and has never reached the code that decides what happens at
    // nine in the morning. It is a tie-break only: see scheduling/energy.ts.
    energy: energyShape(profile.wakeTime, profile.energyProfile),
    goalFocus: goalFocusMap(goals),
    // during-work routines are already in the fixed list — don't place twice.
    // Bounds are stamped here rather than trusted from each producer.
    routines: withProtocolBounds(sized.filter((r) => !r.duringWork)),
  });
  // A during-work block the hours could not hold is as unplaced as
  // anything the engine turned away, and is reported the same way.
  return { ...plan, unplaced: [...plan.unplaced, ...carved.uncarved] };
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
  /**
   * Minutes past midnight before which a start is no longer offerable —
   * the current time, when the plan is today's. Omitted for any other
   * day, where every time is still ahead.
   *
   * Without it the sample was drawn from wake time and capped, so by
   * evening every slot it returned was already behind the clock: the
   * caller either offered a time that had gone or, once those were
   * filtered, offered nothing at all on a wide-open evening.
   */
  notBefore?: number,
): string[] {
  const duration = durationMinutes(item.start, item.end);
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
    const first = Math.ceil(Math.max(w.start, notBefore ?? 0) / STEP_MIN) * STEP_MIN;
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
