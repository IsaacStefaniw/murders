/**
 * Preview Lab: seed two weeks of realistic history so the learning loop is
 * visible in minutes instead of days. The seeded pattern deliberately
 * exercises every detector:
 *
 *  - workouts repeatedly user-moved to the evening and completed there
 *    → moved-then-completed suggestion ("make evenings the default?")
 *  - the wind-down routine repeatedly skipped → weekly review proposes
 *    resting it; don't-miss-twice offers to protect the next one
 *  - family dinner mostly completed → completion stats look human
 *  - behaviour events clustered on one trigger → "usually: after a meal"
 *
 * Entirely fictional outcomes; overwrites only past days.
 */

import { generateDailyPlan } from '@/features/planner/generate';
import { addDays, durationMinutes, newId, toHHMM, toMinutes, todayKey } from '@/lib/dates';
import type {
  BehaviourEvent,
  BehaviourIntention,
  DailyPlan,
  LifeProfile,
  PlanActionEvent,
  Reflection,
  Routine,
} from '@/types/domain';

export interface SeededHistory {
  plans: Record<string, DailyPlan>;
  planEvents: PlanActionEvent[];
  behaviourEvents: BehaviourEvent[];
  reflections: Reflection[];
}

const EVENING_START = '17:45';

export function buildSeededHistory(
  profile: LifeProfile,
  routines: Routine[],
  behaviourIntentions: BehaviourIntention[],
): SeededHistory {
  const today = todayKey();
  const plans: Record<string, DailyPlan> = {};
  const planEvents: PlanActionEvent[] = [];
  const behaviourEvents: BehaviourEvent[] = [];
  const reflections: Reflection[] = [];

  let workoutMoves = 0;
  for (let back = 14; back >= 1; back--) {
    const date = addDays(today, -back);
    const { unplaced: _u, ...plan } = generateDailyPlan(profile, routines, date);

    plan.items = plan.items.map((item) => {
      if (item.fixed) return item;
      const at = new Date(`${date}T20:00:00`).toISOString();

      // Workouts: the user keeps moving them to the evening — and they happen there.
      if (item.sessionType === 'workout' && back <= 10) {
        workoutMoves += 1;
        const duration = durationMinutes(item.start, item.end);
        planEvents.push({
          id: newId('pe'),
          at,
          date,
          itemId: item.id,
          routineId: item.routineId,
          goalId: item.goalId,
          area: item.area,
          kind: 'rescheduled',
          originalStart: item.start,
          newStart: EVENING_START,
          initiatedBy: 'user',
        });
        return {
          ...item,
          movedFrom: item.start,
          start: EVENING_START,
          end: toHHMM(toMinutes(EVENING_START) + duration),
          status: back % 5 === 0 ? ('skipped' as const) : ('completed' as const),
        };
      }
      if (item.sessionType === 'workout') {
        return { ...item, status: 'skipped' as const }; // pre-discovery: mornings didn't stick
      }
      // Wind-down keeps not happening.
      if (item.title.toLowerCase().includes('wind down')) {
        return { ...item, status: 'skipped' as const };
      }
      // Everything else mostly happens.
      return { ...item, status: back % 4 === 0 ? ('skipped' as const) : ('completed' as const) };
    });

    plan.approvedAt = new Date(`${date}T07:10:00`).toISOString();
    plans[date] = plan;

    if (back % 2 === 0) {
      reflections.push({
        id: newId('ref'),
        date,
        kind: 'evening',
        mood: (back % 5 === 0 ? 2 : 4) as 2 | 4,
        wentWell: back % 4 === 0 ? 'Evening training actually happened' : undefined,
        createdAt: new Date(`${date}T21:30:00`).toISOString(),
      });
    }
  }

  // Behaviour events clustered on one trigger.
  const intention = behaviourIntentions.find((b) => b.active);
  if (intention) {
    const triggers = ['After a meal', 'After a meal', 'After a meal', 'Stress', undefined];
    triggers.forEach((trigger, i) => {
      behaviourEvents.push({
        id: newId('be'),
        intentionId: intention.id,
        occurredAt: new Date(`${addDays(today, -(i * 2 + 1))}T19:40:00`).toISOString(),
        trigger,
      });
    });
  }

  void workoutMoves;
  return { plans, planEvents, behaviourEvents, reflections };
}
