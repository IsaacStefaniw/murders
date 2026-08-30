/**
 * Weekly review → applied change. Insight without action is a diary;
 * INTENT offers to make the change, and one tap applies it to next week.
 * Deterministic, derived from what actually happened.
 */

import { detectSlotMismatch } from '@/lib/scheduling/adaptation';
import { addDays } from '@/lib/dates';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

export interface WeeklyChange {
  id: string;
  description: string;
  kind: 'deactivate_routine' | 'move_routine';
  routineId: string;
  payload?: { preferredStart: string; preferredEnd: string };
}

export interface WeeklyReviewProposal {
  noticed: string[];
  changes: WeeklyChange[];
}

export function buildWeeklyChanges(input: {
  weekStart: string;
  plans: Record<string, DailyPlan>;
  routines: Routine[];
}): WeeklyReviewProposal {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(input.weekStart, i));
  const items: PlanItem[] = weekDates
    .flatMap((d) => input.plans[d]?.items ?? [])
    .filter((i) => !i.fixed);
  const resolved = items.filter((i) => i.status === 'completed' || i.status === 'skipped');
  const completed = resolved.filter((i) => i.status === 'completed');

  const noticed: string[] = [];
  const changes: WeeklyChange[] = [];

  if (resolved.length > 0) {
    noticed.push(`${completed.length} of ${resolved.length} flexible activities happened.`);
  }

  // Routines that repeatedly didn't happen: offer to drop the least
  // essential one rather than let the whole plan feel like failure.
  const droppable = input.routines
    .filter((r) => r.active && !r.protected && r.tier !== 'must')
    .map((r) => {
      const own = resolved.filter((i) => i.routineId === r.id);
      const skips = own.filter((i) => i.status === 'skipped').length;
      return { routine: r, obs: own.length, skipRate: own.length ? skips / own.length : 0 };
    })
    .filter((x) => x.obs >= 2 && x.skipRate >= 0.6)
    .sort((a, b) => b.skipRate - a.skipRate);

  if (droppable.length > 0) {
    const worst = droppable[0].routine;
    noticed.push(`${worst.title} kept not happening.`);
    changes.push({
      id: `drop-${worst.id}`,
      kind: 'deactivate_routine',
      routineId: worst.id,
      description: `Rest ${worst.title.toLowerCase()} for now — fewer plans, kept, beat more plans, missed.`,
    });
  }

  // Slot mismatches become move changes (second droppable candidate is
  // spared if a better time might fix it).
  for (const s of detectSlotMismatch(resolved, input.routines).slice(0, 2)) {
    const payload = s.payload as {
      routineId: string;
      preferredStart: string;
      preferredEnd: string;
    };
    if (changes.some((c) => c.routineId === payload.routineId)) continue;
    const routine = input.routines.find((r) => r.id === payload.routineId);
    if (!routine) continue;
    changes.push({
      id: `move-${routine.id}`,
      kind: 'move_routine',
      routineId: routine.id,
      payload: { preferredStart: payload.preferredStart, preferredEnd: payload.preferredEnd },
      description: `Move ${routine.title.toLowerCase()} to where your completions actually are.`,
    });
  }

  return { noticed, changes: changes.slice(0, 3) };
}
