/**
 * Modality registry — the modality contract from docs/COMPETITIVE_BRIEF.md.
 *
 * A modality is a packaged coaching capability declaring: what it can run
 * (`canHandle` — used only for items persisted before explicit stamping),
 * what completion evidence means for it, which signals feed adaptation,
 * and its safety envelope. Plan items link to modalities explicitly via
 * `sessionType`, stamped at generation time — never inferred from titles
 * in new code.
 */

import type {
  EvidenceSource,
  Goal,
  GoalDomain,
  PlanItem,
  SessionType,
} from '@/types/domain';

export interface EvidencePolicy {
  /**
   * What a completed session's evidence is worth:
   *  - strong: the session itself is proof (a finished timer, a submitted review)
   *  - requires_confirmation: passive signals suggest, the user confirms
   *  - manual: only the user's word exists
   */
  completion: 'strong' | 'requires_confirmation' | 'manual';
  /** Passive sources that may corroborate or auto-detect (native builds). */
  passiveSources: EvidenceSource[];
}

export interface ModalityDefinition {
  id: SessionType;
  name: string;
  /** Goal domains this modality serves. */
  domains: GoalDomain[];
  /** Route of the runnable session screen. */
  route: string;
  /** Note stamped onto completion evidence produced by this modality. */
  evidenceNote: string;
  evidencePolicy: EvidencePolicy;
  /** Signals this modality emits into the adaptation layer. */
  adaptationSignals: string[];
  /** Hard limits — what this modality must never claim or advise. */
  safetyEnvelope: string;
  /** Shortest meaningful session, minutes; shorter offers are refused. */
  shorteningFloorMin?: number;
  /** Legacy inference for items persisted before sessionType existed. */
  canHandle: (item: PlanItem) => boolean;
}

export const MODALITIES: Record<SessionType, ModalityDefinition> = {
  breathe: {
    id: 'breathe',
    name: 'Breathwork',
    domains: ['health', 'behaviour'],
    route: '/session/breathe',
    evidenceNote: 'breath session',
    evidencePolicy: { completion: 'strong', passiveSources: [] },
    adaptationSignals: ['session_completed', 'urge_interrupted'],
    safetyEnvelope: 'Non-clinical steadying tool; never framed as treatment.',
    shorteningFloorMin: 1,
    canHandle: (item) => item.title.toLowerCase().includes('wind down'),
  },
  meditate: {
    id: 'meditate',
    name: 'Meditation',
    domains: ['health'],
    route: '/session/meditate',
    evidenceNote: 'meditation session',
    evidencePolicy: { completion: 'strong', passiveSources: [] },
    adaptationSignals: ['session_completed'],
    safetyEnvelope: 'Non-clinical; no therapeutic claims.',
    shorteningFloorMin: 2,
    canHandle: (item) => item.title.toLowerCase().includes('meditat'),
  },
  workout: {
    id: 'workout',
    name: 'Gym coach',
    domains: ['fitness', 'health'],
    route: '/session/workout',
    evidenceNote: 'workout session',
    // A watch-detected workout will suggest completion; the user confirms.
    evidencePolicy: { completion: 'strong', passiveSources: ['healthkit'] },
    adaptationSignals: ['session_completed', 'sets_completed', 'shortened'],
    safetyEnvelope: 'No injury or medical advice; conservative loading guidance only.',
    shorteningFloorMin: 15,
    canHandle: (item) =>
      item.area === 'health' &&
      ['workout', 'train', 'strength'].some((w) => item.title.toLowerCase().includes(w)),
  },
  business_review: {
    id: 'business_review',
    name: 'Business coach',
    domains: ['business', 'career'],
    route: '/session/review',
    evidenceNote: 'weekly review',
    evidencePolicy: { completion: 'strong', passiveSources: [] },
    adaptationSignals: ['review_submitted', 'milestone_completed', 'next_focus_set'],
    safetyEnvelope: 'Coaching questions and structure; never fiduciary or legal advice.',
    canHandle: () => false, // resolved via goal domain below, never by title
  },
};

export interface SessionLaunch {
  route: string;
  params: Record<string, string>;
}

/** The runnable session for a plan item, resolved through the registry. */
export function sessionForItem(item: PlanItem, goals: Goal[] = []): SessionLaunch | null {
  let type: SessionType | null = item.sessionType ?? null;

  if (!type) {
    // Legacy resolution for items persisted before explicit stamping.
    type = (Object.values(MODALITIES).find((m) => m.canHandle(item))?.id ?? null) as
      | SessionType
      | null;
    if (!type && item.goalId) {
      const goal = goals.find((g) => g.id === item.goalId);
      if (goal && MODALITIES.business_review.domains.includes(goal.domain ?? 'personal')) {
        type = 'business_review';
      }
    }
  }
  if (!type) return null;

  const modality = MODALITIES[type];
  if (type === 'business_review') {
    if (!item.goalId) return null;
    return { route: `${modality.route}/${item.goalId}`, params: {} };
  }
  return { route: modality.route, params: { itemId: item.id, date: item.date } };
}
