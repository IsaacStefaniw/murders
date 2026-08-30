/**
 * Synthetic cohort personas.
 *
 * Each simulated user has a *stated* profile (what they tell the Life
 * Interview) and a *hidden* ground truth (when they actually complete
 * things, how they respond to suggestions). INTENT never sees the ground
 * truth — the whole point is measuring whether the system converges on it
 * from behaviour alone.
 */

import { buildLifeOperatingPlan, type LifeOperatingPlan } from '@/features/onboarding/buildPlan';
import type { InterviewAnswers } from '@/features/onboarding/script';
import type { LifeArea } from '@/types/domain';

export type Slot = 'morning' | 'midday' | 'evening';

export interface GroundTruth {
  /** Completion probability per area per slot — the user's real life. */
  affinity: Partial<Record<LifeArea, Record<Slot, number>>>;
  /** Fallback affinity for areas not listed. */
  baseAffinity: Record<Slot, number>;
  /** Global adherence multiplier (capacity, chaos). */
  adherence: number;
  /** When a slot mismatch bites, probability the user moves vs. just skips. */
  moveTendency: number;
  /** Probability of accepting an INTENT suggestion. */
  acceptProb: number;
  /** Probability of applying the weekly review's changes. */
  applyReviewProb: number;
  /** Behaviour events per day (urges logged). */
  behaviourEventRate: number;
}

export interface PersonaSpec {
  key: string;
  weight: number;
  answers: (rng: () => number) => InterviewAnswers;
  truth: (rng: () => number) => GroundTruth;
}

const even: Record<Slot, number> = { morning: 0.55, midday: 0.55, evening: 0.55 };

export const PERSONAS: PersonaSpec[] = [
  {
    // Stated morning person; actually an evening completer. The adaptation
    // engine's core test case.
    key: 'busy_parent_exec',
    weight: 0.3,
    answers: (rng) => ({
      name: 'Sam',
      priorities: ['family', 'health', 'work'],
      household: ['partner', 'kids'],
      partnerName: 'Alex',
      workDays: ['1', '2', '3', '4', '5'],
      workHours: '09:00-17:30',
      sleep: '06:30-22:30',
      capacity: 'steady',
      energy: rng() < 0.6 ? 'morning' : 'midday',
      trainingDays: rng() < 0.5 ? '4' : '3',
      trainingSetup: 'gym',
      mind: rng() < 0.4 ? ['breathing'] : [],
      moreOf: ['Date nights', 'Seeing friends', 'Time with the kids', 'Deep work'],
      lessOf: ['alcohol', 'doomscrolling'],
      ambition: 'Grow the business',
    }),
    truth: (rng) => ({
      affinity: {
        health: { morning: 0.2 + rng() * 0.1, midday: 0.45, evening: 0.75 },
        family: { morning: 0.7, midday: 0.5, evening: 0.85 },
        relationship: { morning: 0.3, midday: 0.3, evening: 0.75 },
      },
      baseAffinity: even,
      adherence: 0.85 + rng() * 0.1,
      moveTendency: 0.5,
      acceptProb: 0.7,
      applyReviewProb: 0.6,
      behaviourEventRate: 0.35,
    }),
  },
  {
    key: 'young_professional',
    weight: 0.2,
    answers: (rng) => ({
      name: 'Jordan',
      priorities: ['health', 'work', 'enjoyment'],
      household: ['solo'],
      workDays: ['1', '2', '3', '4', '5'],
      workHours: '09:00-18:30',
      sleep: '07:30-23:15',
      capacity: 'steady',
      energy: 'evening',
      trainingDays: '3',
      trainingSetup: rng() < 0.5 ? 'gym' : 'home',
      mind: rng() < 0.5 ? ['meditation'] : [],
      moreOf: ['Seeing friends', 'Deep work'],
      lessOf: ['doomscrolling', 'late_nights'],
      ambition: rng() < 0.5 ? 'Get a promotion this year' : 'Save $20k for a deposit',
    }),
    truth: () => ({
      affinity: { health: { morning: 0.15, midday: 0.35, evening: 0.7 } },
      baseAffinity: { morning: 0.35, midday: 0.5, evening: 0.65 },
      adherence: 0.75,
      moveTendency: 0.35,
      acceptProb: 0.55,
      applyReviewProb: 0.45,
      behaviourEventRate: 0.5,
    }),
  },
  {
    // Overcommits: says 5x training, real capacity is low. Tests whether the
    // weekly review prunes to something survivable instead of shaming.
    key: 'health_rebuilder',
    weight: 0.2,
    answers: () => ({
      name: 'Casey',
      priorities: ['health', 'growth', 'family'],
      household: ['partner'],
      partnerName: 'Sam',
      workDays: ['1', '2', '3', '4', '5'],
      workHours: '08:00-16:00',
      sleep: '06:30-22:30',
      capacity: 'minimal',
      energy: 'morning',
      trainingDays: '5',
      trainingSetup: 'home',
      mind: ['breathing', 'meditation'],
      moreOf: ['Reading', 'Time outdoors'],
      lessOf: ['junk_food', 'alcohol', 'doomscrolling'],
      ambition: 'Lose 10 kg and keep it off',
    }),
    truth: (rng) => ({
      affinity: { health: { morning: 0.4, midday: 0.5, evening: 0.35 } },
      baseAffinity: { morning: 0.45, midday: 0.45, evening: 0.35 },
      adherence: 0.55 + rng() * 0.15,
      moveTendency: 0.2,
      acceptProb: 0.6,
      applyReviewProb: 0.7,
      behaviourEventRate: 0.8,
    }),
  },
  {
    // Low capacity, family-first; the system must not overload them.
    key: 'new_parent',
    weight: 0.15,
    answers: () => ({
      name: 'Riley',
      priorities: ['family', 'relationship', 'health'],
      household: ['partner', 'kids'],
      partnerName: 'Drew',
      workDays: ['1', '2', '3', '4'],
      workHours: '09:00-17:30',
      sleep: '06:30-22:30',
      capacity: 'minimal',
      energy: 'midday',
      trainingDays: '2',
      trainingSetup: 'home',
      mind: ['breathing'],
      moreOf: ['Time with the kids', 'Date nights'],
      lessOf: ['doomscrolling'],
      ambition: '',
    }),
    truth: () => ({
      affinity: {
        family: { morning: 0.8, midday: 0.6, evening: 0.75 },
        health: { morning: 0.3, midday: 0.55, evening: 0.25 },
      },
      baseAffinity: { morning: 0.5, midday: 0.55, evening: 0.4 },
      adherence: 0.65,
      moveTendency: 0.4,
      acceptProb: 0.75,
      applyReviewProb: 0.65,
      behaviourEventRate: 0.4,
    }),
  },
  {
    key: 'entrepreneur',
    weight: 0.15,
    answers: (rng) => ({
      name: 'Morgan',
      priorities: ['work', 'health', 'relationship'],
      household: rng() < 0.6 ? ['partner'] : ['solo'],
      partnerName: 'Jamie',
      workDays: ['1', '2', '3', '4', '5', '6'],
      workHours: '08:00-16:00',
      sleep: '05:30-21:45',
      capacity: 'push',
      energy: 'morning',
      trainingDays: '4',
      trainingSetup: 'gym',
      mind: [],
      moreOf: ['Deep work', 'Time outdoors'],
      lessOf: ['late_nights', 'social_media'],
      ambition: 'Grow the business to $2m revenue',
    }),
    truth: () => ({
      affinity: {
        health: { morning: 0.7, midday: 0.55, evening: 0.3 },
        work: { morning: 0.85, midday: 0.6, evening: 0.4 },
      },
      baseAffinity: { morning: 0.65, midday: 0.55, evening: 0.4 },
      adherence: 0.9,
      moveTendency: 0.45,
      acceptProb: 0.5,
      applyReviewProb: 0.5,
      behaviourEventRate: 0.25,
    }),
  },
];

export interface SimUser {
  id: number;
  persona: string;
  plan: LifeOperatingPlan;
  truth: GroundTruth;
  rng: () => number;
}

/** Deterministic PRNG (mulberry32) so runs are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeUser(id: number): SimUser {
  const rng = mulberry32(1_000_003 * (id + 1));
  const pick = rng();
  let acc = 0;
  let spec = PERSONAS[PERSONAS.length - 1];
  for (const p of PERSONAS) {
    acc += p.weight;
    if (pick < acc) {
      spec = p;
      break;
    }
  }
  return {
    id,
    persona: spec.key,
    plan: buildLifeOperatingPlan(spec.answers(rng)),
    truth: spec.truth(rng),
    rng,
  };
}
