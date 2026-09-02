/**
 * The morning readout — Whoop's daily check, without a wearable.
 *
 * Two pieces, both deterministic: a momentum line (what this week has
 * actually produced) and one rotating coach note — the evidence story
 * behind something on today's plan, drawn from the knowledge base. One
 * number that's yours, one idea worth reading: the reason to open the
 * app every morning.
 */

import { protocolById, type Protocol } from '@/features/knowledge/protocols';
import { addDays, toMinutes } from '@/lib/dates';
import type { DailyPlan, Goal, PlanItem, Routine } from '@/types/domain';

export interface Momentum {
  done: number;
  milestonesMoved: number;
}

/** Rolling 7 days including today. */
export function weekMomentum(
  today: string,
  plans: Record<string, DailyPlan>,
  goals: Goal[],
): Momentum {
  const from = addDays(today, -6);
  let done = 0;
  for (const plan of Object.values(plans)) {
    if (plan.date < from || plan.date > today) continue;
    done += plan.items.filter((i) => i.status === 'completed' && i.title !== 'Work').length;
  }
  const fromIso = `${from}T00:00:00.000Z`;
  let milestonesMoved = 0;
  for (const g of goals) {
    milestonesMoved += (g.milestones ?? []).filter((m) => m.done && (m.doneAt ?? '') >= fromIso)
      .length;
  }
  return { done, milestonesMoved };
}

export interface CoachNote {
  protocolTitle: string;
  why: string;
  attribution: string;
  /** The item this is about, and when it is — the note's anchor. */
  itemTitle: string;
  startsAt: string;
  /** True when that block has not happened yet. */
  upcoming: boolean;
}

/**
 * One note per day, rotating across the protocols behind today's items so
 * a fortnight of mornings never repeats back-to-back.
 */
export function coachNote(
  date: string,
  items: PlanItem[],
  routines: Routine[],
  nowMin = 0,
): CoachNote | null {
  const routineById = new Map(routines.map((r) => [r.id, r]));
  const backed: { protocol: Protocol; item: PlanItem }[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const protocolId = item.routineId ? routineById.get(item.routineId)?.protocolId : undefined;
    if (!protocolId || seen.has(protocolId)) continue;
    const protocol = protocolById(protocolId);
    if (!protocol) continue;
    seen.add(protocolId);
    backed.push({ protocol, item });
  }
  if (backed.length === 0) return null;

  // Prefer something still ahead of them. The note read as a non-sequitur
  // partly because it could be explaining a practice that finished nine
  // hours ago, sitting under tonight's wind-down with nothing connecting
  // the two. A note about the next thing is a note about the day.
  const ahead = backed.filter(({ item }) => toMinutes(item.start) >= nowMin);
  const pool = ahead.length > 0 ? ahead : backed;
  const seed = Array.from(date).reduce((a, c) => a + c.charCodeAt(0), 0);
  const { protocol, item } = pool[seed % pool.length];
  return {
    protocolTitle: protocol.title,
    why: protocol.why,
    attribution: protocol.attribution.join(' · '),
    itemTitle: item.title,
    startsAt: item.start,
    upcoming: toMinutes(item.start) >= nowMin,
  };
}
