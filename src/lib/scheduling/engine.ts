/**
 * Deterministic scheduling engine.
 *
 * The engine — not an LLM — decides where activities can legally go. It
 * computes free windows around fixed commitments, then places flexible
 * routines into those windows honouring preferred times, priority tiers,
 * buffers, and a hard rule that a day is never fully packed. AI layers on
 * top of this can prioritise, explain, and suggest trade-offs among valid
 * placements, but can never invent an invalid schedule.
 */

import { dateKeyToDate, toHHMM, toMinutes, newId, weekdayOf } from '@/lib/dates';
import type { DailyPlan, PlanItem, PlanTier, Routine } from '@/types/domain';

export interface FixedCommitment {
  title: string;
  start: string;
  end: string;
  area?: PlanItem['area'];
  sessionType?: PlanItem['sessionType'];
  /** Carried when the commitment is a carved-out routine (a growth block):
   * without these the plan item can't launch its session or feed learning. */
  routineId?: string;
  goalId?: string;
}

export interface DayContext {
  date: string; // "YYYY-MM-DD"
  wakeTime: string;
  sleepTime: string;
  fixed: FixedCommitment[];
  routines: Routine[];
  /** Minutes of breathing room enforced between scheduled items. */
  bufferMin?: number;
  /**
   * Fraction of free time that must remain unscheduled (0..1).
   * Days need slack; the engine refuses to fill every minute.
   */
  reservedFreeFraction?: number;
}

export interface Window {
  start: number; // minutes from midnight
  end: number;
}

const DEFAULT_BUFFER_MIN = 15;
const DEFAULT_RESERVED_FRACTION = 0.25;
/** Don't schedule flexible items into slivers shorter than this. */
const MIN_USEFUL_WINDOW = 20;

const TIER_ORDER: Record<PlanTier, number> = { must: 0, should: 1, could: 2 };

/** Free windows between wake and sleep, minus fixed commitments and buffers. */
export function computeFreeWindows(
  fixed: FixedCommitment[],
  wakeTime: string,
  sleepTime: string,
  bufferMin: number = DEFAULT_BUFFER_MIN,
): Window[] {
  const dayStart = toMinutes(wakeTime);
  let dayEnd = toMinutes(sleepTime);
  if (dayEnd <= dayStart) dayEnd += 1440; // sleep after midnight

  const busy = fixed
    .map((f) => {
      let start = toMinutes(f.start);
      let end = toMinutes(f.end);
      if (end < start) end += 1440;
      // Pad commitments with buffer so items don't butt up against them.
      return { start: start - bufferMin, end: end + bufferMin };
    })
    .sort((a, b) => a.start - b.start);

  const windows: Window[] = [];
  let cursor = dayStart;
  for (const b of busy) {
    if (b.start > cursor) {
      windows.push({ start: cursor, end: Math.min(b.start, dayEnd) });
    }
    cursor = Math.max(cursor, b.end);
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd) windows.push({ start: cursor, end: dayEnd });

  return windows.filter((w) => w.end - w.start >= MIN_USEFUL_WINDOW);
}

interface Placement {
  routine: Routine;
  start: number;
  end: number;
}

/**
 * Place routines into free windows.
 *
 * Order: protected first (they anchor the day), then by tier, then by how
 * narrow their preferred window is (constrained items claim space first).
 * A routine that cannot fit is simply omitted — the plan reports it in
 * `unplaced` so the UI or AI layer can suggest trade-offs.
 */
export function placeRoutines(
  windows: Window[],
  routines: Routine[],
  bufferMin: number = DEFAULT_BUFFER_MIN,
): { placements: Placement[]; unplaced: Routine[] } {
  const free = windows.map((w) => ({ ...w }));
  const placements: Placement[] = [];
  const unplaced: Routine[] = [];

  const ordered = [...routines].sort((a, b) => {
    if (a.protected !== b.protected) return a.protected ? -1 : 1;
    const tier = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tier !== 0) return tier;
    const slackA = toMinutes(a.preferredEnd) - toMinutes(a.preferredStart);
    const slackB = toMinutes(b.preferredEnd) - toMinutes(b.preferredStart);
    return slackA - slackB;
  });

  for (const routine of ordered) {
    const spot = findSpot(free, routine);
    if (!spot) {
      unplaced.push(routine);
      continue;
    }
    placements.push({ routine, start: spot, end: spot + routine.durationMin });
    carveOut(free, spot - bufferMin, spot + routine.durationMin + bufferMin);
  }

  placements.sort((a, b) => a.start - b.start);
  return { placements, unplaced };
}

/** Earliest valid start within the preferred window; fall back to any window if flexible. */
function findSpot(free: Window[], routine: Routine): number | null {
  const prefStart = toMinutes(routine.preferredStart);
  const prefEnd = toMinutes(routine.preferredEnd);
  const dur = routine.durationMin;

  // Pass 1: start inside the preferred window.
  for (const w of free) {
    const start = Math.max(w.start, prefStart);
    if (start <= prefEnd && start + dur <= w.end) return start;
  }
  if (!routine.flexible) return null;

  // Pass 2: closest window to the preferred start that fits.
  let best: { start: number; distance: number } | null = null;
  for (const w of free) {
    if (w.end - w.start < dur) continue;
    const start = Math.min(Math.max(w.start, prefStart), w.end - dur);
    const distance = Math.abs(start - prefStart);
    if (!best || distance < best.distance) best = { start, distance };
  }
  return best?.start ?? null;
}

function carveOut(free: Window[], from: number, to: number): void {
  for (let i = free.length - 1; i >= 0; i--) {
    const w = free[i];
    if (to <= w.start || from >= w.end) continue;
    const pieces: Window[] = [];
    if (from - w.start >= MIN_USEFUL_WINDOW) pieces.push({ start: w.start, end: from });
    if (w.end - to >= MIN_USEFUL_WINDOW) pieces.push({ start: to, end: w.end });
    free.splice(i, 1, ...pieces);
  }
}

/**
 * Build a full daily plan: fixed commitments as MUST items plus placed
 * routines, respecting the reserved-free-time rule. When placements would
 * consume too much of the day, lowest-tier items are dropped first.
 */
export function buildDailyPlan(ctx: DayContext): DailyPlan & { unplaced: Routine[] } {
  const buffer = ctx.bufferMin ?? DEFAULT_BUFFER_MIN;
  const reserved = ctx.reservedFreeFraction ?? DEFAULT_RESERVED_FRACTION;
  const weekday = weekdayOf(ctx.date);

  const todaysRoutines = ctx.routines.filter((r) => r.active && r.days.includes(weekday));
  const windows = computeFreeWindows(ctx.fixed, ctx.wakeTime, ctx.sleepTime, buffer);
  const totalFree = windows.reduce((sum, w) => sum + (w.end - w.start), 0);
  const schedulable = Math.floor(totalFree * (1 - reserved));

  const { placements, unplaced } = placeRoutines(windows, todaysRoutines, buffer);

  // Enforce slack: drop lowest-tier, non-protected placements until within budget.
  const kept: Placement[] = [];
  let used = 0;
  const byImportance = [...placements].sort((a, b) => {
    if (a.routine.protected !== b.routine.protected) return a.routine.protected ? -1 : 1;
    return TIER_ORDER[a.routine.tier] - TIER_ORDER[b.routine.tier];
  });
  for (const p of byImportance) {
    const dur = p.end - p.start;
    if (p.routine.protected || used + dur <= schedulable) {
      kept.push(p);
      used += dur;
    } else {
      unplaced.push(p.routine);
    }
  }
  kept.sort((a, b) => a.start - b.start);

  const items: PlanItem[] = [
    ...ctx.fixed.map(
      (f): PlanItem => ({
        id: newId('pi'),
        date: ctx.date,
        start: f.start,
        end: f.end,
        title: f.title,
        area: f.area ?? 'work',
        tier: 'must',
        status: 'planned',
        fixed: true,
        sessionType: f.sessionType,
        routineId: f.routineId,
        goalId: f.goalId,
      }),
    ),
    ...kept.map(
      (p): PlanItem => ({
        id: newId('pi'),
        date: ctx.date,
        start: toHHMM(p.start),
        end: toHHMM(p.end),
        title: p.routine.title,
        area: p.routine.area,
        tier: p.routine.tier,
        status: 'planned',
        routineId: p.routine.id,
        goalId: p.routine.goalId,
        fixed: false,
        sessionType: p.routine.sessionType,
      }),
    ),
  ].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  return {
    date: ctx.date,
    items,
    summary: summarise(items, totalFree, ctx.date),
    unplaced,
  };
}

function summarise(items: PlanItem[], totalFreeMin: number, date?: string): string {
  const base = summariseLoad(items, totalFreeMin);
  // Fresh-start effect (Milkman & Dai): temporal landmarks — Mondays, month
  // starts — are when people are most ready to act on aspirations. Frame them.
  if (date) {
    const day = dateKeyToDate(date);
    if (day.getDate() === 1) return `A new month. ${base}`;
    if (day.getDay() === 1) return `Fresh week. ${base}`;
  }
  return base;
}

function summariseLoad(items: PlanItem[], totalFreeMin: number): string {
  const musts = items.filter((i) => i.tier === 'must');
  const morningLoad = items.filter((i) => toMinutes(i.start) < 12 * 60).length;
  const afternoonLoad = items.filter((i) => toMinutes(i.start) >= 12 * 60).length;

  if (items.length === 0) return 'An open day. Choose what matters.';
  if (totalFreeMin < 120) return 'A full day. Keep expectations realistic.';
  if (morningLoad >= 3 && afternoonLoad <= 1) return 'Busy morning. Protect your afternoon.';
  if (afternoonLoad >= 3 && morningLoad <= 1) return 'Light morning, full afternoon. Start slow on purpose.';
  if (musts.length >= 4) return 'A committed day. Focus on the musts.';
  return 'A balanced day. Room to breathe.';
}

/**
 * Shorten a workout to fit available time rather than abandoning it.
 * Returns null when there isn't enough time for a meaningful session.
 */
export function shortenWorkout(
  plannedMin: number,
  availableMin: number,
): { durationMin: number; note: string } | null {
  if (availableMin >= plannedMin) return { durationMin: plannedMin, note: 'Full session.' };
  if (availableMin < 15) return null;
  const duration = Math.min(plannedMin, Math.floor(availableMin / 5) * 5);
  return {
    durationMin: duration,
    note: `Condensed ${duration}-minute session: main lifts only, shorter rests.`,
  };
}
