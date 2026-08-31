/**
 * Weekly review — deterministic stats computed from what actually happened,
 * with the narrative layered on top (AI when available, template otherwise).
 * No arbitrary scores.
 */

import { behaviourInfo } from '@/features/behaviours/catalog';
import { addDays } from '@/lib/dates';
import type {
  BehaviourEvent,
  BehaviourIntention,
  DailyPlan,
  LifeArea,
  Reflection,
  WeeklyReview,
} from '@/types/domain';

export function computeWeeklyStats(input: {
  weekStart: string;
  plans: Record<string, DailyPlan>;
  behaviourIntentions: BehaviourIntention[];
  behaviourEvents: BehaviourEvent[];
  reflections: Reflection[];
}): { stats: WeeklyReview['stats']; highlights: string[] } {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(input.weekStart, i));
  const weekEnd = weekDates[6];
  const items = weekDates.flatMap((d) => input.plans[d]?.items ?? []).filter((i) => !i.fixed);

  const resolved = items.filter((i) => i.status === 'completed' || i.status === 'skipped');
  const completed = resolved.filter((i) => i.status === 'completed');

  const completionByArea: WeeklyReview['stats']['completionByArea'] = {};
  for (const item of resolved) {
    const entry = completionByArea[item.area] ?? { completed: 0, planned: 0 };
    entry.planned += 1;
    if (item.status === 'completed') entry.completed += 1;
    completionByArea[item.area] = entry;
  }

  const behaviourEventCounts: WeeklyReview['stats']['behaviourEventCounts'] = {};
  for (const event of input.behaviourEvents) {
    const day = event.occurredAt.slice(0, 10);
    if (day < input.weekStart || day > weekEnd) continue;
    const intention = input.behaviourIntentions.find((b) => b.id === event.intentionId);
    if (!intention) continue;
    // Behaviours marked neverScore are counted nowhere — not here, and so
    // not in the weekly narrative prompt these stats feed. A tally of
    // sweets eaten handed to a language model is a shaming sentence waiting
    // to be generated, and the people most likely to log one are the people
    // it hurts most. Their signal lives in the pattern engine as timing,
    // which is the part that actually helps.
    if (behaviourInfo(intention.behaviour).neverScore) continue;
    behaviourEventCounts[intention.behaviour] =
      (behaviourEventCounts[intention.behaviour] ?? 0) + 1;
  }

  const checkInsCompleted = input.reflections.filter(
    (r) => r.date >= input.weekStart && r.date <= weekEnd,
  ).length;

  const stats: WeeklyReview['stats'] = {
    completionRate: resolved.length === 0 ? 0 : completed.length / resolved.length,
    completionByArea,
    behaviourEventCounts,
    checkInsCompleted,
  };

  const highlights: string[] = [];
  const bestArea = (Object.entries(completionByArea) as [LifeArea, { completed: number; planned: number }][])
    .filter(([, v]) => v.planned >= 2)
    .sort((a, b) => b[1].completed / b[1].planned - a[1].completed / a[1].planned)[0];
  if (bestArea && bestArea[1].completed / bestArea[1].planned >= 0.75) {
    highlights.push(`${bestArea[0]} activities were the most consistent this week`);
  }
  const health = completionByArea.health;
  if (health && health.planned > 0) {
    highlights.push(`${health.completed} of ${health.planned} planned workouts happened`);
  }
  return { stats, highlights };
}
