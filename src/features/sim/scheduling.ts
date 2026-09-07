/**
 * Two scheduling scenarios the cohort runs, both about the same thing: what
 * the day does when it cannot give everything the hour it asked for.
 *
 * The cohort simulator already runs every persona through the real
 * `generateDailyPlan` and counts what it could not place. What it never
 * asked was the harder question underneath that count — was the day
 * telling the truth? A routine reported as unplaced is honest only if
 * there was genuinely nowhere legal left for it. This module asks both
 * scenarios of every persona, on every day of a simulated month:
 *
 *   MOVED, NOT DROPPED — nothing is ever reported unplaced while a legal
 *   window for it is still free. "Legal" is checked against an INDEPENDENT
 *   reading of the rules (the windows, the routine's own drift, its
 *   finish-before-sleep line), not by asking the engine again, so the
 *   scenario can disagree with the engine rather than agree by
 *   construction.
 *
 *   THE ENERGY SHAPE IS FREE — the same day is built with and without the
 *   person's peak and dip. The shape may change WHERE things sit; it may
 *   never cost the day a single routine it would otherwise have held.
 */

import { carveWorkDay, generateDailyPlan } from '@/features/planner/generate';
import { makeUser, type SimUser } from '@/features/sim/personas';
import { buildDailyPlan } from '@/lib/scheduling/engine';
import { withProtocolBounds } from '@/features/knowledge/protocols';
import { addDays, toHHMM, toMinutes } from '@/lib/dates';
import type { LifeProfile, PlanItem, Routine } from '@/types/domain';

/** The same three hours the engine calls the limit of "later the same day". */
const MAX_DRIFT_MIN = 180;
const MIN_DRIFT_MIN = 60;

function windowLength(start: number, end: number): number {
  return end >= start ? end - start : end + 1440 - start;
}

/**
 * Every gap between what is on the day, buffers included, with no floor
 * under it: a gap a routine fits in is a gap. Written out here rather than
 * borrowed from the engine so that this scenario is a second opinion.
 */
function gapsBetween(
  items: Pick<PlanItem, 'start' | 'end'>[],
  wakeTime: string,
  sleepTime: string,
  bufferMin: number,
): { start: number; end: number }[] {
  const dayStart = toMinutes(wakeTime);
  const sleepRaw = toMinutes(sleepTime);
  const dayEnd = sleepRaw <= dayStart ? sleepRaw + 1440 : sleepRaw;
  const busy = items
    .map((i) => {
      const start = toMinutes(i.start);
      let end = toMinutes(i.end);
      if (end < start) end += 1440;
      return { start: start - bufferMin, end: end + bufferMin };
    })
    .sort((a, b) => a.start - b.start);

  const gaps: { start: number; end: number }[] = [];
  let cursor = dayStart;
  for (const b of busy) {
    if (b.start > cursor) gaps.push({ start: cursor, end: Math.min(b.start, dayEnd) });
    cursor = Math.max(cursor, b.end);
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd) gaps.push({ start: cursor, end: dayEnd });
  return gaps.filter((g) => g.end > g.start);
}

/**
 * An independent answer to "is there anywhere left this could legally go?".
 *
 * Deliberately not the engine's own search: it re-reads the rules from the
 * routine and the day, so a scenario failure means the two disagree.
 */
export function anyLegalSpot(
  routine: Routine,
  items: Pick<PlanItem, 'start' | 'end'>[],
  wakeTime: string,
  sleepTime: string,
  bufferMin = 15,
): number | null {
  // A deadline is placed rigidly and surfaces as unplaced rather than drift.
  if (!routine.flexible) return null;

  const free = gapsBetween(items, wakeTime, sleepTime, bufferMin);

  const wake = toMinutes(wakeTime);
  const sleepRaw = toMinutes(sleepTime);
  const dayEnd = sleepRaw <= wake ? sleepRaw + 1440 : sleepRaw;
  const prefStart = toMinutes(routine.preferredStart);
  const latestStart = prefStart + windowLength(prefStart, toMinutes(routine.preferredEnd));
  const hardLatest =
    routine.finishBeforeSleepMin !== undefined
      ? dayEnd - routine.finishBeforeSleepMin - routine.durationMin
      : Infinity;
  const drift = routine.timeAnchored
    ? Math.min(MAX_DRIFT_MIN, Math.max(MIN_DRIFT_MIN, latestStart - prefStart))
    : Infinity;
  const earliest = hardLatest === Infinity ? prefStart - drift : prefStart - Math.max(drift, 180);
  const latest = Math.min(latestStart + drift, hardLatest);

  for (const w of free) {
    const lo = Math.max(w.start, earliest);
    const hi = Math.min(w.end - routine.durationMin, latest);
    if (hi >= lo) return lo;
  }
  return null;
}

/**
 * The day shapes each persona is run through.
 *
 * The cohort's own answers describe a comfortable day, and a comfortable
 * day never has to choose. These are the four shapes from docs/MARKETS.md
 * that do: the same person on an early shift, on a long day, with an early
 * bedtime, and with the evening already gone. A scheduler is only worth
 * testing where the room runs out.
 */
const DAY_SHAPES: { name: string; of: (p: LifeProfile) => LifeProfile }[] = [
  { name: 'as answered', of: (p) => p },
  {
    name: 'an early shift',
    of: (p) => ({
      ...p,
      wakeTime: shift(p.wakeTime, -90),
      sleepTime: shift(p.sleepTime, -120),
      workStart: shift(p.workStart, -120),
      workEnd: shift(p.workEnd, -120),
    }),
  },
  { name: 'a long day', of: (p) => ({ ...p, workEnd: shift(p.workEnd, 100) }) },
  { name: 'an early night', of: (p) => ({ ...p, sleepTime: shift(p.sleepTime, -120) }) },
];

function shift(hhmm: string, byMin: number): string {
  return toHHMM((toMinutes(hhmm) + byMin + 1440) % 1440);
}

export interface SchedulingScenarioResult {
  days: number;
  /** Routines the day reported as unplaced. */
  unplaced: number;
  /** Of those, how many still had a legal window free. Must be zero. */
  dropped: number;
  /** Placements the energy shape decided, rather than merely coincided with. */
  energyDecided: number;
  /** Routines the shape cost the day. Must be zero. */
  lostToEnergy: number;
  /** One real example of each, for a failure message worth reading. */
  examples: string[];
}

/**
 * Run both scenarios over the cohort. One simulated month per persona, the
 * real profile, the real routines and the real planner.
 */
export function runSchedulingScenarios(
  users = 12,
  days = 28,
  startDate = '2026-01-05',
): SchedulingScenarioResult {
  const out: SchedulingScenarioResult = {
    days: 0,
    unplaced: 0,
    dropped: 0,
    energyDecided: 0,
    lostToEnergy: 0,
    examples: [],
  };
  for (let i = 0; i < users; i++) {
    const user = makeUser(i);
    for (const shape of DAY_SHAPES) {
      runShape(out, user, shape, days, startDate);
    }
  }
  return out;
}

/** One persona, one day shape, one simulated month. */
function runShape(
  out: SchedulingScenarioResult,
  user: SimUser,
  shape: { name: string; of: (p: LifeProfile) => LifeProfile },
  days: number,
  startDate: string,
): void {
  const routines = user.plan.routines;
  const profile = shape.of(user.plan.profile);
  const reserved =
    profile.capacity === 'minimal' ? 0.35 : profile.capacity === 'push' ? 0.2 : 0.25;
  const where = `${user.persona}, ${shape.name}`;

  for (let d = 0; d < days; d++) {
    const date = addDays(startDate, d);
    const plan = generateDailyPlan(profile, routines, date, [], user.plan.goals);
    out.days += 1;
    out.unplaced += plan.unplaced.length;
    out.energyDecided += plan.energy.length;

    // Scenario one: was every reported drop honest?
    for (const r of plan.unplaced) {
      const spot = anyLegalSpot(r, plan.items, profile.wakeTime, profile.sleepTime);
      if (spot === null) continue;
      out.dropped += 1;
      note(out, `${where}, ${date}: "${r.title}" reported unplaced, but ${clock(spot)} was free and legal`);
    }

    // Scenario two: the same day without the shape. Everything else is
    // identical, so anything on one and not the other is the shape's doing.
    const carved = carveWorkDay(profile, date, routines);
    const plain = buildDailyPlan({
      date,
      wakeTime: profile.wakeTime,
      sleepTime: profile.sleepTime,
      fixed: carved.blocks,
      reservedFreeFraction: reserved,
      priorities: profile.priorities,
      routines: withProtocolBounds(routines.filter((r) => !r.duringWork)),
    });
    const seated = new Set(plan.items.map((item) => item.routineId).filter(Boolean));
    for (const item of plain.items) {
      if (!item.routineId || seated.has(item.routineId)) continue;
      out.lostToEnergy += 1;
      note(out, `${where}, ${date}: "${item.title}" was on the day until the energy shape was used`);
    }
  }
}

function note(out: SchedulingScenarioResult, line: string): void {
  if (out.examples.length < 10) out.examples.push(line);
}

function clock(min: number): string {
  const h = Math.floor(min / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
