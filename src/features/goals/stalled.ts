/**
 * Goal-stalled detector.
 *
 * The `goal_stalled` suggestion kind existed in the type system from day
 * one, but nothing ever produced it — a goal whose milestones stopped
 * moving was simply invisible. The cohort simulator's goal-progression
 * layer exposed this: milestone-bearing goals routinely went quiet for
 * weeks and IntentNorth never said a word.
 *
 * A goal is stalled when it is active, has an undone milestone, and no
 * milestone has been completed for STALL_DAYS (counting from the goal's
 * creation when nothing has ever been completed). The suggestion proposes
 * a concrete 30-minute block — a foothold on the calendar, not a nag.
 */

import { addDays, newId } from '@/lib/dates';
import type { Goal, Suggestion } from '@/types/domain';

export const STALL_DAYS = 21;

export interface GoalStalledPayload extends Record<string, unknown> {
  goalId: string;
  milestoneId: string;
  date: string;
  start: string;
  durationMin: number;
  title: string;
  area: Goal['area'];
}

export function detectGoalStalled(today: string, goals: Goal[]): Suggestion[] {
  const cutoff = addDays(today, -STALL_DAYS);
  const out: Suggestion[] = [];

  for (const goal of goals) {
    if (goal.status !== 'active' || !goal.milestones?.length) continue;
    const next = goal.milestones.find((m) => !m.done);
    if (!next) continue;

    const lastProgress =
      goal.milestones
        .filter((m) => m.done && m.doneAt)
        .map((m) => m.doneAt!.slice(0, 10))
        .sort()
        .pop() ?? goal.createdAt.slice(0, 10);
    if (lastProgress >= cutoff) continue;

    const payload: GoalStalledPayload = {
      goalId: goal.id,
      milestoneId: next.id,
      date: addDays(today, 1),
      start: '19:30',
      durationMin: 30,
      title: `Move it forward: ${next.title}`,
      area: goal.area,
    };
    out.push({
      id: newId('sug'),
      kind: 'goal_stalled',
      message: `“${goal.title}” hasn't moved in three weeks. The next milestone is “${next.title}” — thirty minutes would restart it.`,
      reason: goal.why
        ? `You said why this matters: “${goal.why}”. Progress needs a foothold on the calendar, not more willpower.`
        : 'Progress needs a foothold on the calendar, not more willpower.',
      payload,
      confidence: 0.7,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }
  return out;
}
