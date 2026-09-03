/**
 * Moving something on purpose, and letting it win.
 *
 * Until now a move could only land on time the engine had already decided
 * was empty. That is backwards. When someone picks a time they are making
 * a statement about priority — this, here, now — and an assistant that
 * answers "there's something else there" has mistaken its own arrangement
 * for a fact about the person's life.
 *
 * So the chosen time is granted, and everything flexible is re-laid around
 * it. Two rules keep that from becoming vandalism:
 *
 * WHAT IntentNorth ARRANGED, IntentNorth MAY REARRANGE. What reality imposes, it may
 * not. Fixed commitments — work, real calendar events — are never bumped,
 * and neither is anything already done: a completed item is a record of
 * what happened and moving it would be a lie.
 *
 * NOTHING MOVES SILENTLY. Every displacement is returned so the person can
 * be told. A plan that quietly rearranges itself behind you is worse than
 * one that refuses, because you stop being able to trust yesterday.
 */

import { computeFreeWindows, type FixedCommitment } from '@/lib/scheduling/engine';
import { durationMinutes, toHHMM, toMinutes } from '@/lib/dates';
import type { DailyPlan, PlanItem, PlanTier } from '@/types/domain';

const TIER_ORDER: Record<PlanTier, number> = { must: 0, should: 1, could: 2 };

export interface Displacement {
  id: string;
  title: string;
  from: string;
  /** Null when the day had no room left for it. */
  to: string | null;
}

export interface MoveOutcome {
  items: PlanItem[];
  /** What else had to move, and where it went. Empty on a clean move. */
  displaced: Displacement[];
  /** The chosen time lands on something immovable — work, or a real event. */
  overlapsFixed: boolean;
}

/** An item the engine may not touch: reality, or history. */
export const isImmovable = (item: PlanItem): boolean =>
  item.fixed || item.status === 'completed';

const durationOf = (item: PlanItem): number => durationMinutes(item.start, item.end);

const busyFrom = (items: PlanItem[]): FixedCommitment[] =>
  items.map((i) => ({ title: i.title, start: i.start, end: i.end }));

/**
 * The free position closest to where this item already was.
 *
 * Closest, rather than earliest, because a bumped item should land as near
 * to its own time as the day allows — a 6pm walk pushed to 6:30 is a
 * nudge, the same walk pushed to 7am is a different activity.
 */
function nearestSlot(
  placed: PlanItem[],
  originalStart: number,
  durationMin: number,
  wakeTime: string,
  sleepTime: string,
  bufferMin: number,
): number | null {
  const windows = computeFreeWindows(busyFrom(placed), wakeTime, sleepTime, bufferMin);
  let best: { start: number; distance: number } | null = null;
  for (const w of windows) {
    if (w.end - w.start < durationMin) continue;
    const start = Math.min(Math.max(w.start, originalStart), w.end - durationMin);
    const distance = Math.abs(start - originalStart);
    if (!best || distance < best.distance) best = { start, distance };
  }
  return best?.start ?? null;
}

/**
 * Put `itemId` at `newStart` and re-lay the flexible day around it.
 *
 * Items are re-placed most-important-first so that when space runs short
 * it is the optional things that lose it. An item whose own slot is still
 * free simply keeps it, so a move only disturbs what it actually collides
 * with.
 */
export function moveWithBump(
  plan: DailyPlan,
  itemId: string,
  newStart: string,
  ctx: { wakeTime: string; sleepTime: string; bufferMin?: number },
): MoveOutcome {
  const buffer = ctx.bufferMin ?? 10;
  const target = plan.items.find((i) => i.id === itemId);
  if (!target || target.fixed) {
    return { items: plan.items, displaced: [], overlapsFixed: false };
  }

  const duration = durationOf(target);
  const movedStart = toMinutes(newStart);
  const moved: PlanItem = {
    ...target,
    start: newStart,
    end: toHHMM(movedStart + duration),
    movedFrom: target.movedFrom ?? target.start,
  };

  // Immovable things, plus the chosen placement, are the fixed points the
  // rest of the day has to fit around.
  const anchors = plan.items.filter((i) => i.id !== itemId && isImmovable(i));
  const overlapsFixed = anchors.some(
    (a) => toMinutes(a.start) < movedStart + duration && toMinutes(a.end) > movedStart,
  );

  const placed: PlanItem[] = [...anchors, moved];
  const displaced: Displacement[] = [];

  const toReplace = plan.items
    .filter((i) => i.id !== itemId && !isImmovable(i))
    .sort((a, b) => {
      const tier = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
      return tier !== 0 ? tier : toMinutes(a.start) - toMinutes(b.start);
    });

  for (const item of toReplace) {
    const original = toMinutes(item.start);
    const dur = durationOf(item);
    const slot = nearestSlot(placed, original, dur, ctx.wakeTime, ctx.sleepTime, buffer);
    if (slot === null) {
      // No room left today. Kept where it was rather than deleted — losing
      // something because a different thing moved would be its own bug.
      placed.push(item);
      displaced.push({ id: item.id, title: item.title, from: item.start, to: null });
      continue;
    }
    const start = toHHMM(slot);
    placed.push(
      slot === original
        ? item
        : { ...item, start, end: toHHMM(slot + dur), movedFrom: item.movedFrom ?? item.start },
    );
    if (slot !== original) {
      displaced.push({ id: item.id, title: item.title, from: item.start, to: start });
    }
  }

  return {
    items: placed.sort((a, b) => a.start.localeCompare(b.start)),
    displaced,
    overlapsFixed,
  };
}

export interface TimeCandidate {
  start: string;
  /** How many flexible items this time would displace. Zero means free. */
  bumps: number;
  /** True when it collides with work or a real calendar event. */
  hitsFixed: boolean;
}

/**
 * Every time of day this item could take, and what each would cost.
 *
 * The old picker offered only times the engine had already found empty,
 * which on a working day was often one. Offering the whole day with an
 * honest price on each is what makes the choice the person's rather than
 * the scheduler's.
 */
export function candidateStartsFor(
  plan: DailyPlan,
  itemId: string,
  ctx: { wakeTime: string; sleepTime: string; stepMin?: number; notBefore?: number },
): TimeCandidate[] {
  const step = ctx.stepMin ?? 30;
  const item = plan.items.find((i) => i.id === itemId);
  if (!item) return [];
  const duration = durationOf(item);

  // The waking day, and whether it runs past midnight. This decision has
  // to be made from wake and sleep alone: folding "now" in here made a
  // 23:35 clock look like a bedtime already passed, so the day gained a
  // whole extra 1440 minutes and the picker offered 00:00 and 16:00 —
  // times it presented as later today.
  const dayStart = toMinutes(ctx.wakeTime);
  let dayEnd = toMinutes(ctx.sleepTime);
  if (dayEnd <= dayStart) dayEnd += 1440;
  // ...and then never past midnight, whatever the bedtime.
  //
  // A moved item keeps its DATE. Offering "00:00" to someone who sleeps at
  // half past midnight reads as "later tonight" and lands at the start of
  // the same calendar day — twenty-three hours in the past, where Today
  // files it under "Earlier — did it happen?". The offer has to stop where
  // the date does, and the small cost is that a night owl cannot move
  // something past midnight from this menu.
  dayEnd = Math.min(dayEnd, 1440);

  const others = plan.items.filter((i) => i.id !== itemId);
  const out: TimeCandidate[] = [];
  // Now is a floor on where the offers start, never a redefinition of the
  // day. Past it entirely and there is simply nothing left to offer.
  const from = Math.max(dayStart, ctx.notBefore ?? 0);
  const first = Math.ceil(from / step) * step;

  for (let start = first; start + duration <= dayEnd; start += step) {
    const end = start + duration;
    const clashes = others.filter(
      (o) => toMinutes(o.start) < end && toMinutes(o.end) > start,
    );
    out.push({
      start: toHHMM(start),
      bumps: clashes.filter((o) => !isImmovable(o)).length,
      hitsFixed: clashes.some(isImmovable),
    });
  }
  return out;
}
