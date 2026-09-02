/**
 * Simulation session layer — synthetic users EXECUTE the modalities, they
 * don't just schedule them.
 *
 * Every completed plan item is resolved through the real registry
 * (`sessionForItem`) and run through the real generators: `buildWorkout`
 * for the gym coach, the breath protocol table, the meditation timer's
 * floor, and milestone progression for the business review and other
 * goal-linked sessions. This is what lets the cohort measure per-modality
 * adherence, catch contract violations (a workout longer than the window,
 * a session below its shortening floor, a stamped sessionType the registry
 * can't resolve), and track goal-milestone velocity per domain.
 */

import { protocolDurationSec, BREATH_PROTOCOLS } from '@/features/modalities/breath/protocols';
import { buildWorkout } from '@/features/modalities/gym/program';
import { MODALITIES, sessionForItem } from '@/features/modalities/registry';
import { durationMinutes } from '@/lib/dates';
import type { Goal, PlanItem, SessionType } from '@/types/domain';

export interface SessionOutcome {
  /** goal_block = no runnable session, but a goal-linked block that can advance milestones. */
  type: SessionType | 'goal_block';
  shortened: boolean;
  /** Real product code produced something invalid. Must stay at zero. */
  contractViolations: number;
  /** A milestone on the linked goal was completed during this session. */
  milestoneAdvanced: boolean;
}

/** How likely a completed session actually moves the linked goal's next milestone. */
const MILESTONE_FOLLOW_THROUGH: Partial<Record<SessionType, number>> = {
  business_review: 0.55,
};
const GOAL_LINKED_FOLLOW_THROUGH = 0.35; // money check-ins, trip planning blocks

export interface SessionContext {
  date: string;
  dayIndex: number;
  trainingSetting: 'gym' | 'home' | 'outdoors' | 'mixed';
  rng: () => number;
}

/**
 * Run the session behind a *completed* plan item, mutating the linked
 * goal's milestones in place when the session produces progress. Returns
 * null for items with no runnable session (dinners, deep work, etc.).
 */
export function runSessionForItem(
  item: PlanItem,
  goals: Goal[],
  ctx: SessionContext,
): SessionOutcome | null {
  const launch = sessionForItem(item, goals);
  const type = item.sessionType ?? (launch?.route.startsWith('/session/review') ? 'business_review' : null);
  const goal = item.goalId ? goals.find((g) => g.id === item.goalId) : undefined;

  let violations = 0;
  let shortened = false;
  let milestoneAdvanced = false;

  if (type) {
    // Contract: a stamped sessionType must resolve to a runnable route.
    if (!launch) violations += 1;

    const durationMin = durationMinutes(item.start, item.end);

    if (type === 'workout') {
      const floor = MODALITIES.workout.shorteningFloorMin ?? 15;
      // A quarter of sessions, life compresses the window — the coach must
      // shrink the work, never abandon it, and never overrun.
      const available =
        ctx.rng() < 0.25
          ? Math.max(floor, Math.round(durationMin * (0.4 + ctx.rng() * 0.4)))
          : durationMin;
      const session = buildWorkout(available, ctx.trainingSetting, ctx.dayIndex);
      if (!session) violations += 1;
      else {
        if (session.estimatedMin > available) violations += 1;
        if (session.exercises.length === 0) violations += 1;
        shortened = Boolean(session.note);
      }
    } else if (type === 'breathe') {
      // Wind-down protocol must exist and stay a genuinely tiny commitment.
      const protocol = BREATH_PROTOCOLS.find((p) => p.key === '478') ?? BREATH_PROTOCOLS[0];
      if (!protocol || protocolDurationSec(protocol) > 150) violations += 1;
    } else if (type === 'meditate') {
      const floor = MODALITIES.meditate.shorteningFloorMin ?? 2;
      if (durationMin < floor) violations += 1;
    }
  }

  // Goal progression: the review session ticks milestones; finance and
  // experience goals advance through their linked check-in/planning blocks.
  if (goal && goal.status === 'active' && goal.milestones?.length) {
    const followThrough =
      (type && MILESTONE_FOLLOW_THROUGH[type]) ??
      (item.goalId ? GOAL_LINKED_FOLLOW_THROUGH : 0);
    const next = goal.milestones.find((m) => !m.done);
    if (next && ctx.rng() < followThrough) {
      next.done = true;
      next.doneAt = `${ctx.date}T20:00:00.000Z`;
      milestoneAdvanced = true;
      if (type === 'business_review') {
        goal.nextFocus = goal.milestones.find((m) => !m.done)?.title;
      }
    }
  }

  if (!type && !goal) return null;
  return {
    type: type ?? 'goal_block',
    shortened,
    contractViolations: violations,
    milestoneAdvanced,
  };
}
