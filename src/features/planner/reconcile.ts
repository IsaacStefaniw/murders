/**
 * What a rebuilt day keeps from the day it replaces.
 *
 * A plan is rebuilt for the whole visible week whenever a routine is
 * edited, a goal added, a practice toggled in the library or a suggestion
 * accepted, and the rebuild has to start from the routines — that is the
 * point. But a day already lived in is a record, not a draft. Rebuilding
 * it wholesale undid the workout ticked off at seven, forgot the wind-down
 * that was skipped, snapped a moved block back to where the engine had it
 * and dropped the coffee the person had added. Toggling a practice in the
 * library at nine in the evening erased the whole day's ledger.
 *
 * The rule: what the person did or decided survives; what the engine
 * arranged is re-arranged. Kept from the previous day, in this order:
 *
 *   - anything completed or skipped — a record, kept whatever happened to
 *     its routine since;
 *   - anything the person moved or shortened, and anything they added or
 *     logged (no routine behind it) — a decision, kept while its routine
 *     still runs today; a moved item whose routine has since been switched
 *     off is not resurrected.
 *
 * A fresh item for a routine the kept items already cover is dropped, so
 * a completed workout is not joined by a planned twin. Everything kept is
 * then placed with the same bump the person's own moves use, so a kept
 * block that now sits where the engine put something else pushes that
 * something aside rather than lying on top of it.
 */

import { moveWithBump } from '@/features/planner/moveWithBump';
import type { DailyPlan, PlanItem } from '@/types/domain';

/** A record of something that happened, or did not. */
const isRecord = (item: PlanItem): boolean =>
  item.status === 'completed' || item.status === 'skipped';

/** A change the person made to a planned item, or an item they put there themselves. */
const isDecision = (item: PlanItem): boolean =>
  item.status === 'planned' &&
  (item.movedFrom != null || item.shortenedFromMin != null || item.routineId == null);

export function reconcilePlan(
  fresh: PlanItem[],
  previous: PlanItem[] | undefined,
  runningRoutineIds: ReadonlySet<string>,
  ctx: { wakeTime: string; sleepTime: string },
): PlanItem[] {
  if (!previous || previous.length === 0) return fresh;

  const kept = previous.filter(
    (item) =>
      !item.fixed &&
      (isRecord(item) ||
        (isDecision(item) && (item.routineId == null || runningRoutineIds.has(item.routineId)))),
  );
  if (kept.length === 0) return fresh;

  const coveredRoutines = new Set(kept.map((k) => k.routineId).filter((id): id is string => id != null));
  let items = fresh.filter((item) => item.routineId == null || !coveredRoutines.has(item.routineId));

  // Records first, so a completed block is an anchor before any moved
  // block is placed around it; then decisions in the order of the day.
  const ordered = [...kept].sort((a, b) => {
    const recordFirst = Number(isRecord(b)) - Number(isRecord(a));
    return recordFirst !== 0 ? recordFirst : a.start.localeCompare(b.start);
  });

  for (const item of ordered) {
    if (item.status === 'skipped') {
      // Takes up no room; nothing needs to move around it.
      items = [...items, item];
      continue;
    }
    const plan: DailyPlan = { date: item.date, items: [...items, item] };
    const outcome = moveWithBump(plan, item.id, item.start, ctx);
    if (outcome.overlapsFixed && item.status === 'planned' && item.routineId != null) {
      // The person's chosen time now sits on work or a real event — the
      // day's shape changed underneath the move. The engine's placement
      // for that routine stands instead of a block lying across the day.
      const back = fresh.filter((f) => f.routineId === item.routineId);
      items = [...items, ...back];
      continue;
    }
    // The bump stamps `movedFrom` on the item it placed, even at the same
    // time. A record or an added block is put back exactly as it was.
    items = outcome.items.map((placed) => (placed.id === item.id ? item : placed));
  }

  return [...items].sort((a, b) => a.start.localeCompare(b.start));
}
