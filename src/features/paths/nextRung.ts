/**
 * Turning a written ladder into the one thing a coach offers next.
 *
 * The ladders existed and nothing read them. `ladders.work.ts` was imported
 * by its own test and by no screen, and the five in `ladders.research.ts`
 * had not been coded at all — so every hub showed the same flat list of
 * practices whatever the person had already made stick, which is exactly
 * the failure the ladders were written to fix.
 *
 * Three decisions live here:
 *
 *   which ladder   A pillar can have several, and they are different
 *                  ladders rather than difficulty settings. Someone who
 *                  does not train is not on a lower rung of the training
 *                  ladder.
 *   what is solid  Answered from what actually happened, not from what is
 *                  on the plan. A routine scheduled and never done is not
 *                  a rung somebody has climbed.
 *   what to say    The rung's own coach line where it has one, and the
 *                  ladder's stuck line where the person has not moved.
 */

import { rungFor, type Ladder, type Rung } from '@/features/paths/ladder';
import {
  COUPLE_LADDER,
  FAMILY_LADDER,
  FRIENDSHIP_LADDER,
  HABIT_LADDER,
  MIND_LADDER,
  NUTRITION_LADDER,
  RESEARCH_LADDERS,
  TRAINING_LADDER,
  TRAINING_OVER_65_LADDER,
  TRAINING_START_LADDER,
} from '@/features/paths/ladders.research';
import { WORK_LADDERS } from '@/features/paths/ladders.work';
import type { PathId } from '@/features/paths/definitions';
import { addDays, todayKey } from '@/lib/dates';
import type { DailyPlan, LifeProfile, Routine } from '@/types/domain';

/** Every ladder the app knows about, research and work alike. */
export const ALL_LADDERS: Ladder[] = [...RESEARCH_LADDERS, ...WORK_LADDERS];

/**
 * How long a practice has to have been happening to count as solid, and how
 * often.
 *
 * Three weeks and three occurrences. Short enough that somebody who has
 * genuinely taken a rung is not held there for a month, long enough that
 * one good week does not promote them past the thing that would have
 * helped. The habit research in the library puts formation at two to four
 * months, so this is deliberately not a claim that the habit is formed —
 * only that the rung is holding well enough to build on.
 */
export const SOLID_WINDOW_DAYS = 21;
export const SOLID_OCCURRENCES = 3;

/**
 * Which ladder this person is on for a pathway.
 *
 * Ordered, most relevant first. An empty list is an honest answer: money
 * has no researched ladder, and inventing an order for it would be worse
 * than saying the coach does not have one.
 */
export function laddersFor(
  path: PathId,
  answers: Record<string, string>,
  profile: LifeProfile | null,
): Ladder[] {
  switch (path) {
    case 'training': {
      // Age first: an over-65 ladder that loses to "trains three times a
      // week" would hand a seventy-year-old the tendon rung and skip the
      // best-evidenced thing in the pillar.
      const age = profile?.age ?? 0;
      if (age >= 65) return [TRAINING_OVER_65_LADDER, TRAINING_LADDER];
      // '0' is the questionBank's value for "None right now" — the answer
      // that means this person is not on the training ladder at all yet.
      if (answers.frequency === '0') return [TRAINING_START_LADDER, TRAINING_LADDER];
      return [TRAINING_LADDER];
    }
    case 'nutrition':
      return [NUTRITION_LADDER];
    case 'work':
      // WORK_LADDERS is [desk, shift, transition]. The shift ladder is for
      // people who do not set their own hours, and the closest thing the
      // intake asks is what the day demands: hands-on, on your feet. The
      // desk ladder's first rung — the day has an end — is not available to
      // them at all, so handing it over would be handing over nothing.
      return answers.style === 'physical'
        ? [WORK_LADDERS[1], WORK_LADDERS[0]]
        : WORK_LADDERS;
    case 'recovery':
      // Habits and urges. The habit ladder is the mechanics of stopping and
      // starting; the mind ladder is here because this pathway renders
      // MindHub, and low mood underneath a habit is the common case.
      return [HABIT_LADDER, MIND_LADDER];
    case 'relationship':
      return answers.with === 'solo' ? [FRIENDSHIP_LADDER] : [COUPLE_LADDER, FRIENDSHIP_LADDER];
    case 'family':
      return [FAMILY_LADDER];
    case 'money':
      // No research round wrote one. Saying so beats inventing an order.
      return [];
    default:
      return [];
  }
}

/** Ladders for a pillar, for the hubs that are not one of the seven paths. */
export const laddersForPillar = (pillar: Ladder['pillar']): Ladder[] =>
  ALL_LADDERS.filter((l) => l.pillar === pillar);

/**
 * Is this practice actually part of their weeks?
 *
 * Counts completions, not intentions. Both routes into the plan count: a
 * scheduled routine ticked off, and something logged after the fact, which
 * since the retrospective logging change is how a good deal of real life
 * reaches the app.
 */
export function solidityFrom(
  routines: Routine[],
  plans: Record<string, DailyPlan>,
  today = todayKey(),
): (protocolId: string) => boolean {
  const routineToProtocol = new Map<string, string>();
  for (const r of routines) if (r.protocolId) routineToProtocol.set(r.id, r.protocolId);

  const counts = new Map<string, number>();
  const from = addDays(today, -SOLID_WINDOW_DAYS);
  for (const [date, plan] of Object.entries(plans)) {
    if (date < from || date > today) continue;
    for (const item of plan.items) {
      if (item.status !== 'completed' || !item.routineId) continue;
      const protocolId = routineToProtocol.get(item.routineId);
      if (!protocolId) continue;
      counts.set(protocolId, (counts.get(protocolId) ?? 0) + 1);
    }
  }
  return (protocolId: string) => (counts.get(protocolId) ?? 0) >= SOLID_OCCURRENCES;
}

export interface NextRung {
  ladder: Ladder;
  /** Null when every offerable rung is solid — a result, and it is said. */
  rung: Rung | null;
  /** What the coach says right now. */
  line: string;
  /** The question asked before any rung, where the ladder has one. */
  gate: Ladder['gate'];
}

/**
 * The one rung to offer, and the sentence to say about it.
 *
 * Reaching the top is not silence. "There is nothing above this" is a
 * result and the person earned hearing it.
 */
export function nextRung(ladder: Ladder, solid: (protocolId: string) => boolean): NextRung {
  const rung = rungFor(ladder, solid);
  if (!rung) {
    return {
      ladder,
      rung: null,
      line: `You are at the top of what this ladder has. Everything on ${ladder.variant.toLowerCase()} is holding.`,
      gate: ladder.gate,
    };
  }
  return {
    ladder,
    rung,
    line: rung.coachLine ?? rung.why ?? rung.title,
    gate: ladder.gate,
  };
}

/** The next rung for a pathway, or null where the pathway has no ladder. */
export function nextRungForPath(
  path: PathId,
  answers: Record<string, string>,
  profile: LifeProfile | null,
  routines: Routine[],
  plans: Record<string, DailyPlan>,
  today = todayKey(),
): NextRung | null {
  const [ladder] = laddersFor(path, answers, profile);
  if (!ladder) return null;
  return nextRung(ladder, solidityFrom(routines, plans, today));
}
