/**
 * Underserved-goal detector — the proactive half of goal direction.
 *
 * `detectGoalStalled` is the backstop (21 quiet days). This fires earlier,
 * on the cause instead of the symptom: an active goal with work left whose
 * calendar footprint has collapsed — its routines were all rested, or its
 * recent linked blocks all slipped. The suggestion puts one concrete block
 * back on the plan, aimed at the goal's next step, so the week starts
 * moving in the goal's direction again before it ever counts as stalled.
 */

import { addDays, newId } from '@/lib/dates';
import type { Goal, PlanItem, Routine, Suggestion } from '@/types/domain';

/** Give a fresh goal's routines a week to prove themselves first. */
const MIN_GOAL_AGE_DAYS = 7;
/** Resolved linked items needed before "all slipped" means anything. */
const MIN_OBSERVATIONS = 2;

export function detectGoalUnderserved(
  today: string,
  goals: Goal[],
  routines: Routine[],
  history: PlanItem[],
): Suggestion[] {
  const out: Suggestion[] = [];
  const youngest = addDays(today, -MIN_GOAL_AGE_DAYS);

  for (const goal of goals) {
    if (goal.status !== 'active' || !goal.milestones?.length) continue;
    // Behaviour goals run through intentions, not calendar blocks.
    if (goal.domain === 'behaviour') continue;
    const next = goal.milestones.find((m) => !m.done);
    if (!next) continue;
    if (goal.createdAt.slice(0, 10) > youngest) continue;

    const linked = routines.filter((r) => r.goalId === goal.id);
    const hasActiveRoutine = linked.some((r) => r.active);
    const resolved = history.filter(
      (i) => i.goalId === goal.id && (i.status === 'completed' || i.status === 'skipped'),
    );
    const anyCompleted = resolved.some((i) => i.status === 'completed');

    const noFootprint = !hasActiveRoutine;
    const allSlipping = resolved.length >= MIN_OBSERVATIONS && !anyCompleted;
    if (!noFootprint && !allSlipping) continue;

    out.push({
      id: newId('sug'),
      kind: 'plan_adjustment',
      message: noFootprint
        ? `Nothing on the calendar is moving “${goal.title}” any more. Next step: ${next.title}. Thirty minutes this week would keep it alive.`
        : `The blocks for “${goal.title}” keep slipping. Next step is just ${next.title} — thirty minutes, tomorrow evening?`,
      reason: goal.why
        ? `You said why this matters: “${goal.why}”. A goal only moves at the speed of its calendar.`
        : 'A goal only moves at the speed of its calendar.',
      payload: {
        goalId: goal.id,
        milestoneId: next.id,
        date: addDays(today, 1),
        start: '19:30',
        durationMin: 30,
        title: `Move it forward: ${next.title}`,
        area: goal.area,
      },
      confidence: 0.75,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }
  return out;
}
