import { weekdayOf } from '@/lib/dates';
import type { LifeProfile, Weekday } from '@/types/domain';

/**
 * One day of a rotation, in the person's own words.
 *
 * `label` is theirs — "Nights", "Late", "Off", "Uni" — because a roster is
 * a thing people already have names for, and asking them to translate it
 * into the app's vocabulary is the first place this feature could fail.
 */
export interface RosterShift {
  label: string;
  /** Absent on a day off. `end` before `start` means it runs past midnight. */
  start?: string;
  end?: string;
  /** When this person wakes and sleeps on a day shaped like this one. */
  wakeTime?: string;
  sleepTime?: string;
}

export interface Roster {
  /** The rotation, one entry per day. Any length — 4 on 4 off is eight. */
  cycle: RosterShift[];
  /** The date `cycle[0]` falls on. Everything else counts from here. */
  startDate: string;
}

const DAY_MS = 86400e3;

/** Whole days from `startDate` to `date`, negative before it. */
function offset(startDate: string, date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS);
}

/**
 * Which shift falls on a date. Wraps in both directions, so a roster
 * entered today still describes last week correctly.
 */
export function shiftOn(roster: Roster | undefined, date: string): RosterShift | null {
  if (!roster || roster.cycle.length === 0) return null;
  const n = offset(roster.startDate, date);
  if (!Number.isFinite(n)) return null;
  const i = ((n % roster.cycle.length) + roster.cycle.length) % roster.cycle.length;
  return roster.cycle[i] ?? null;
}

const isWorking = (s: RosterShift | null): s is RosterShift & { start: string; end: string } =>
  !!s?.start && !!s?.end;

const dayBefore = (date: string) =>
  new Date(Date.parse(`${date}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);

/**
 * The profile as it applies to one particular date.
 *
 * The largest week-shape gap in the app was not that the scheduler could
 * not handle a night shift — it handles hours crossing midnight fine. It
 * was that a profile holds ONE set of work hours and ONE wake time, so a
 * nurse on four-on-four-off had no way to say what her week was, and would
 * have had to rebuild it by hand every week until she stopped.
 *
 * A roster is a rotation of any length with a start date, and this turns it
 * back into the shape everything downstream already understands. Nothing
 * else in the planner changes: wake-anchored practices move with her wake
 * time because they always did, and now her wake time is the one for that
 * kind of day.
 *
 * The known limit, stated rather than hidden: work hours come from today's
 * shift. Where today has no shift and yesterday ran past midnight, this
 * carries yesterday's hours so the morning after a night is not planned as
 * a free morning. A day shift that directly follows a night shift keeps
 * today's hours and loses the overnight tail — a roster nobody should be
 * working, and the honest failure is the small one.
 */
export function profileForDate(profile: LifeProfile, date: string): LifeProfile {
  const roster = profile.roster;
  const today = shiftOn(roster, date);
  if (!today) return profile;

  const yesterday = shiftOn(roster, dayBefore(date));
  const overnightYesterday = isWorking(yesterday) && yesterday.end < yesterday.start;

  const workDays: Weekday[] = [];
  if (isWorking(today)) workDays.push(weekdayOf(date));
  if (overnightYesterday) workDays.push(weekdayOf(dayBefore(date)));

  const hours = isWorking(today) ? today : overnightYesterday ? yesterday : null;

  return {
    ...profile,
    workDays,
    workStart: hours?.start ?? profile.workStart,
    workEnd: hours?.end ?? profile.workEnd,
    wakeTime: today.wakeTime ?? profile.wakeTime,
    sleepTime: today.sleepTime ?? profile.sleepTime,
  };
}

/** The rotation in one line, for the screen that owns it. */
export function describeCycle(roster: Roster | undefined): string {
  if (!roster || roster.cycle.length === 0) return 'No rotation set';
  const labels = roster.cycle.map((s) => s.label || (s.start ? 'On' : 'Off'));
  const days = roster.cycle.length;
  return `${days}-day rotation · ${labels.join(' · ')}`;
}

/**
 * A rotation built from a run of working days and a run of days off.
 *
 * The shape most rosters actually take, and the one worth being able to
 * enter in two taps rather than eight.
 */
export function rotationOf(
  on: number,
  off: number,
  shift: Omit<RosterShift, 'label'> & { label?: string },
  startDate: string,
): Roster {
  const working: RosterShift = { label: shift.label ?? 'On', ...shift };
  const rest: RosterShift = { label: 'Off', wakeTime: shift.wakeTime, sleepTime: shift.sleepTime };
  return {
    startDate,
    cycle: [
      ...Array.from({ length: Math.max(0, on) }, () => working),
      ...Array.from({ length: Math.max(0, off) }, () => rest),
    ],
  };
}
