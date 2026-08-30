/**
 * Modality registry — v1 of the modality contract from docs/COMPETITIVE_BRIEF.md.
 *
 * A modality is a packaged coaching capability: intake, pathway generator,
 * runnable sessions, signals, reinforcement rules, safety envelope. This
 * first version implements the part users feel immediately: mapping plan
 * items to sessions that run inside the app. Pathway generation lives in
 * features/goals/goalPlanner (domains) and features/onboarding/buildPlan;
 * signals flow through the store's planEvents/behaviourEvents.
 */

import type { Goal, PlanItem } from '@/types/domain';

export interface SessionLaunch {
  /** Route of the runnable session screen. */
  route: string;
  params: Record<string, string>;
}

/**
 * The runnable session for a plan item, if one exists. Deterministic and
 * conservative: only items we can genuinely guide get a Start action.
 */
export function sessionForItem(
  item: PlanItem,
  goals: Goal[] = [],
): SessionLaunch | null {
  const title = item.title.toLowerCase();

  if (title.includes('wind down')) {
    return { route: '/session/breathe', params: { itemId: item.id, date: item.date } };
  }
  if (title.includes('meditat')) {
    return { route: '/session/meditate', params: { itemId: item.id, date: item.date } };
  }
  if (item.area === 'health' && (title.includes('workout') || title.includes('train') || title.includes('strength'))) {
    return { route: '/session/workout', params: { itemId: item.id, date: item.date } };
  }
  if (item.goalId) {
    const goal = goals.find((g) => g.id === item.goalId);
    if (goal && (goal.domain === 'business' || goal.domain === 'career')) {
      return { route: `/session/review/${goal.id}`, params: {} };
    }
  }
  return null;
}
