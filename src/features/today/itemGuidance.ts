/**
 * What "doing this" actually means, for a block that does not open a
 * session screen.
 *
 * The question behind this file is whether every calendar item should link
 * to something to do. The answer is no — a workout opens a workout screen
 * and should, but "Dinner with Anna" opening a screen would be absurd, and
 * an app that insists on mediating that is one people close.
 *
 * But the failure mode is real. A block with no session and no context is
 * a bare title at 7pm with nothing behind it, and a bare title is the
 * thing people tap Skip on. So the rule is not "everything opens a
 * session". It is: NOTHING IS A BARE TITLE.
 *
 * Three levels, in the order they earn their place:
 *
 *   run   — a modality screen exists. Handled by the registry, not here.
 *   how   — the protocol behind the block: what to do, why it works, and
 *           the caution if it has one. Already written, never shown.
 *   why   — the goal this serves and the milestone it is moving.
 *
 * A block with none of the three is a genuine dead end, and the test
 * beside this file asserts that the generator never produces one.
 */

import { protocolById } from '@/features/knowledge/protocols';
import type { EvidenceLevel } from '@/features/knowledge/protocols';
import type { Goal, PlanItem, Routine } from '@/types/domain';

export interface ItemHow {
  summary: string;
  why: string;
  evidenceLevel: EvidenceLevel;
  attribution: string[];
  safety?: string;
}

export interface ItemGuidance {
  /** The practice behind the block, when it came from the library. */
  how: ItemHow | null;
  /** The goal it serves, and the rung it is moving. */
  why: { goalTitle: string; milestone?: string } | null;
  /** True when there is nothing at all to say — the thing this prevents. */
  bare: boolean;
}

export function guidanceFor(
  item: PlanItem,
  routines: Routine[],
  goals: Goal[],
): ItemGuidance {
  const routine = item.routineId ? routines.find((r) => r.id === item.routineId) : undefined;
  const protocol = routine?.protocolId ? protocolById(routine.protocolId) : undefined;

  const how: ItemHow | null = protocol
    ? {
        summary: protocol.summary,
        why: protocol.why,
        evidenceLevel: protocol.evidenceLevel,
        attribution: protocol.attribution,
        safety: protocol.safety,
      }
    : null;

  const goal = item.goalId ? goals.find((g) => g.id === item.goalId) : undefined;
  const nextMilestone = goal?.milestones?.find((m) => !m.done);
  const why = goal
    ? { goalTitle: goal.title, milestone: nextMilestone?.title }
    : null;

  return { how, why, bare: !how && !why && !item.sessionType && !item.fixed };
}

/**
 * Blocks with nothing behind them.
 *
 * A fixed calendar event is exempt: it is something the person put in
 * their own diary, and INTENT explaining their dinner back to them would
 * be the more embarrassing failure.
 */
export function bareItems(
  items: PlanItem[],
  routines: Routine[],
  goals: Goal[],
): PlanItem[] {
  return items.filter((item) => guidanceFor(item, routines, goals).bare);
}
