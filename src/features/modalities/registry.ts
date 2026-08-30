/**
 * Modality registry — the modality contract from docs/COMPETITIVE_BRIEF.md.
 *
 * A modality is a packaged coaching capability declaring: what it runs
 * (session launcher), what evidence a completion carries, and its safety
 * envelope. Plan items link to modalities explicitly via `sessionType`,
 * stamped at generation time — never inferred from titles. (A legacy
 * title-based fallback remains only for items persisted before
 * sessionType existed; it is not how new capabilities are added.)
 */

import type { Goal, PlanItem, SessionType } from '@/types/domain';

export interface ModalityDeclaration {
  id: SessionType;
  name: string;
  /** Route of the runnable session screen. */
  route: string;
  /** Note stamped onto completion evidence produced by this modality. */
  evidenceNote: string;
  /** Hard limits — what this modality must never claim or advise. */
  safetyEnvelope: string;
}

export const MODALITIES: Record<SessionType, ModalityDeclaration> = {
  breathe: {
    id: 'breathe',
    name: 'Breathwork',
    route: '/session/breathe',
    evidenceNote: 'breath session',
    safetyEnvelope: 'Non-clinical steadying tool; never framed as treatment.',
  },
  meditate: {
    id: 'meditate',
    name: 'Meditation',
    route: '/session/meditate',
    evidenceNote: 'meditation session',
    safetyEnvelope: 'Non-clinical; no therapeutic claims.',
  },
  workout: {
    id: 'workout',
    name: 'Gym coach',
    route: '/session/workout',
    evidenceNote: 'workout session',
    safetyEnvelope: 'No injury or medical advice; conservative loading guidance only.',
  },
  business_review: {
    id: 'business_review',
    name: 'Business coach',
    route: '/session/review',
    evidenceNote: 'weekly review',
    safetyEnvelope: 'Coaching questions and structure; never fiduciary or legal advice.',
  },
};

export interface SessionLaunch {
  route: string;
  params: Record<string, string>;
}

/** Legacy inference for items persisted before sessionType existed. */
function legacySessionType(item: PlanItem): SessionType | null {
  const title = item.title.toLowerCase();
  if (title.includes('wind down')) return 'breathe';
  if (title.includes('meditat')) return 'meditate';
  if (
    item.area === 'health' &&
    (title.includes('workout') || title.includes('train') || title.includes('strength'))
  ) {
    return 'workout';
  }
  return null;
}

/** The runnable session for a plan item, resolved through the registry. */
export function sessionForItem(item: PlanItem, goals: Goal[] = []): SessionLaunch | null {
  let type: SessionType | null = item.sessionType ?? legacySessionType(item);

  // Legacy business blocks: goal-domain lookup for items stamped before
  // sessionType existed.
  if (!type && item.goalId) {
    const goal = goals.find((g) => g.id === item.goalId);
    if (goal && (goal.domain === 'business' || goal.domain === 'career')) type = 'business_review';
  }
  if (!type) return null;

  const modality = MODALITIES[type];
  if (type === 'business_review') {
    const goalId = item.goalId;
    if (!goalId) return null;
    return { route: `${modality.route}/${goalId}`, params: {} };
  }
  return { route: modality.route, params: { itemId: item.id, date: item.date } };
}
