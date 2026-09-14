/**
 * Synthetic cohort personas.
 *
 * Each simulated user has a *stated* profile (what they tell the Life
 * Interview) and a *hidden* ground truth (when they actually complete
 * things, how they respond to suggestions). IntentNorth never sees the ground
 * truth — the whole point is measuring whether the system converges on it
 * from behaviour alone.
 */

import { buildLifeOperatingPlan, type LifeOperatingPlan } from '@/features/onboarding/buildPlan';
import type { InterviewAnswers } from '@/features/onboarding/script';
import type { ExistingHabitKey, LifeArea } from '@/types/domain';

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
  /** Probability of accepting an IntentNorth suggestion. */
  acceptProb: number;
  /** Probability of applying the weekly review's changes. */
  applyReviewProb: number;
  /** Behaviour events per day (urges logged). */
  behaviourEventRate: number;
  /** Habits the human ACTUALLY has — they persist whether or not the
   * product captured them at onboarding. */
  trueHabits?: ExistingHabitKey[];
  /** Adherence multiplier on activity matching a true habit (~1.15–1.25):
   * established behaviour completes more reliably than fresh prescriptions.
   * A modelling assumption, documented in docs/SIMULATION.md. */
  establishedBoost?: number;
}

export interface PersonaSpec {
  key: string;
  weight: number;
  answers: (rng: () => number) => InterviewAnswers;
  truth: (rng: () => number) => GroundTruth;
  /** Probability per habit that this persona genuinely has it. */
  habitOdds?: Partial<Record<ExistingHabitKey, number>>;
}

const even: Record<Slot, number> = { morning: 0.55, midday: 0.55, evening: 0.55 };

export const PERSONAS: PersonaSpec[] = [
  {
    // Stated morning person; actually an evening completer. The adaptation
    // engine's core test case.
    key: 'busy_parent_exec',
    habitOdds: { workout: 0.5, walking: 0.3, sauna: 0.15, fasting: 0.2 },
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
    habitOdds: { workout: 0.4, running: 0.3, meditation: 0.25, cold: 0.15 },
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
    habitOdds: { walking: 0.6, fasting: 0.25, journaling: 0.3 },
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
    habitOdds: { walking: 0.5, journaling: 0.2 },
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
    habitOdds: { workout: 0.6, sauna: 0.3, fasting: 0.35, cold: 0.2, meditation: 0.2 },
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

  /* ── Scenario personas ──────────────────────────────────────────────────
   *
   * The five above are the weighted population sample, and between them
   * they describe one kind of life: a working adult, mostly partnered,
   * mostly nine-to-five, all under about forty-five. Every one of them
   * leaves `weekShape` unanswered — which is a CORE signup question with
   * six values, so four of the six shapes the product claims to serve had
   * never been through the engine at all.
   *
   * These five exist to run those. They carry `weight: 0` deliberately:
   * adding them to the weighted sample would change what the cohort
   * numbers mean, and who the product is FOR is a product decision rather
   * than something a simulation should quietly assume. Select them by name
   * with `makeUserOf`.
   *
   * Each one is here because it stresses something the sample cannot:
   *
   *   shift_nurse        a roster, and a night that starts at 19:00
   *   retired_active     the person the markers instrument is most for
   *   student            study hours, no money, and a late chronotype
   *   recovery_first     the recovery pathway, which had no coverage at all
   *   endurance_athlete  the training programme at its top end
   */
  {
    key: 'shift_nurse',
    habitOdds: { walking: 0.4, journaling: 0.2 },
    weight: 0,
    answers: (rng) => ({
      name: 'Priya',
      weekShape: 'shift',
      priorities: ['health', 'family', 'work'],
      household: ['partner', 'kids'],
      partnerName: 'Tom',
      // Four nights on, three off, and never the same four.
      workDays: ['1', '2', '5', '6'],
      workHours: '19:00-07:00',
      // NOTE: none of the five sleep options describes a night shift. This
      // is the closest available and it is still wrong, which is a finding
      // about the question rather than about Priya.
      sleep: '08:30-00:15',
      capacity: 'minimal',
      energy: 'midday',
      trainingDays: '2',
      trainingSetup: 'home',
      age: '35',
      sexAtBirth: 'female',
      selfRatedHealth: 'fair',
      walkingPace: 'brisk',
      trainingExperience: 'returning',
      mind: rng() < 0.5 ? ['breathing'] : [],
      moreOf: ['Time with the kids', 'Cooking real food'],
      lessOf: ['junk_food', 'doomscrolling'],
      ambition: 'Sleep properly on my days off',
    }),
    truth: (rng) => ({
      // Nothing lands reliably in any slot, because the slot itself moves.
      affinity: {
        health: { morning: 0.3, midday: 0.35, evening: 0.2 },
        family: { morning: 0.55, midday: 0.5, evening: 0.3 },
      },
      baseAffinity: { morning: 0.35, midday: 0.4, evening: 0.25 },
      adherence: 0.5 + rng() * 0.1,
      // Moves rather than skips: the thing is wanted, the hour is impossible.
      moveTendency: 0.75,
      acceptProb: 0.6,
      applyReviewProb: 0.5,
      behaviourEventRate: 0.45,
    }),
  },
  {
    key: 'retired_active',
    habitOdds: { walking: 0.8, sauna: 0.2, journaling: 0.3 },
    weight: 0,
    answers: () => ({
      name: 'Bill',
      weekShape: 'retired',
      priorities: ['health', 'family', 'enjoyment'],
      household: ['partner', 'grandkids'],
      partnerName: 'Margaret',
      workDays: [],
      sleep: '05:30-21:45',
      capacity: 'steady',
      energy: 'morning',
      trainingDays: '3',
      trainingSetup: 'walking',
      age: '75',
      sexAtBirth: 'male',
      selfRatedHealth: 'good',
      walkingPace: 'steady',
      trainingExperience: 'returning',
      // The two that change what the training layer is allowed to prescribe.
      constraints: ['joints', 'balance'],
      mind: ['breathing'],
      moreOf: ['Time with the grandchildren', 'Time in the garden', 'Volunteering'],
      lessOf: ['doomscrolling'],
      ambition: 'Still carrying my own shopping at 85',
    }),
    truth: () => ({
      affinity: {
        health: { morning: 0.8, midday: 0.6, evening: 0.25 },
        family: { morning: 0.5, midday: 0.7, evening: 0.5 },
      },
      baseAffinity: { morning: 0.75, midday: 0.6, evening: 0.3 },
      // Retired adherence is high: the day has room in it.
      adherence: 0.88,
      moveTendency: 0.3,
      acceptProb: 0.65,
      applyReviewProb: 0.6,
      behaviourEventRate: 0.1,
    }),
  },
  {
    key: 'student',
    habitOdds: { workout: 0.4, running: 0.2, meditation: 0.15 },
    weight: 0,
    answers: (rng) => ({
      name: 'Noor',
      weekShape: 'study',
      priorities: ['growth', 'health', 'enjoyment'],
      household: ['housemates'],
      workDays: ['1', '2', '3', '4'],
      workHours: '10:00-18:00',
      sleep: '08:30-00:15',
      capacity: 'push',
      energy: 'evening',
      trainingDays: '3',
      trainingSetup: 'gym',
      age: '25',
      sexAtBirth: 'female',
      selfRatedHealth: 'good',
      walkingPace: 'brisk',
      trainingExperience: 'new',
      mind: rng() < 0.4 ? ['meditation'] : [],
      moreOf: ['Focused study', 'Seeing friends'],
      lessOf: ['late_nights', 'social_media', 'junk_food'],
      ambition: 'Finish my thesis without falling apart',
    }),
    truth: () => ({
      // States 'push', lives like it, and the deadline eats everything else.
      affinity: {
        health: { morning: 0.1, midday: 0.3, evening: 0.6 },
        growth: { morning: 0.2, midday: 0.55, evening: 0.8 },
      },
      baseAffinity: { morning: 0.2, midday: 0.45, evening: 0.7 },
      adherence: 0.6,
      moveTendency: 0.55,
      acceptProb: 0.5,
      applyReviewProb: 0.35,
      behaviourEventRate: 0.7,
    }),
  },
  {
    key: 'recovery_first',
    habitOdds: { walking: 0.5, journaling: 0.35 },
    weight: 0,
    answers: () => ({
      name: 'Dan',
      weekShape: 'employed',
      priorities: ['health', 'relationship', 'family'],
      household: ['partner'],
      partnerName: 'Ellie',
      workDays: ['1', '2', '3', '4', '5'],
      workHours: '08:30-17:00',
      sleep: '06:30-22:30',
      capacity: 'minimal',
      energy: 'morning',
      trainingDays: '2',
      trainingSetup: 'walking',
      age: '45',
      sexAtBirth: 'male',
      selfRatedHealth: 'fair',
      walkingPace: 'steady',
      trainingExperience: 'returning',
      // The whole reason this persona exists.
      drinkingBand: 'high',
      smokingStatus: 'vapeOnly',
      lessOf: ['alcohol', 'vaping', 'late_nights'],
      mind: ['breathing'],
      moreOf: ['Time outdoors', 'Cooking real food'],
      ambition: 'Six months without a drink',
    }),
    truth: () => ({
      affinity: {
        health: { morning: 0.5, midday: 0.35, evening: 0.2 },
        relationship: { morning: 0.3, midday: 0.3, evening: 0.6 },
      },
      baseAffinity: { morning: 0.5, midday: 0.4, evening: 0.3 },
      adherence: 0.6,
      moveTendency: 0.3,
      acceptProb: 0.8,
      applyReviewProb: 0.7,
      // The urges are the point: this is the persona the recovery pathway
      // and the behaviour layer were built for, and nothing had ever run
      // them at volume.
      behaviourEventRate: 1.6,
    }),
  },
  {
    key: 'endurance_athlete',
    habitOdds: { running: 0.95, workout: 0.6, cold: 0.3, sauna: 0.3 },
    weight: 0,
    answers: () => ({
      name: 'Kira',
      weekShape: 'selfDirected',
      priorities: ['health', 'work', 'growth'],
      household: ['solo'],
      workDays: ['1', '2', '3', '4', '5'],
      workHours: '09:30-18:30',
      sleep: '05:30-21:45',
      capacity: 'push',
      energy: 'morning',
      trainingDays: '6',
      trainingSetup: 'outdoors',
      age: '35',
      sexAtBirth: 'female',
      selfRatedHealth: 'excellent',
      walkingPace: 'brisk',
      trainingExperience: 'consistent',
      foodAim: 'energy',
      mind: ['breathing'],
      moreOf: ['Time outdoors', 'Deep work'],
      lessOf: ['social_media'],
      ambition: 'Sub-3 marathon in October',
    }),
    truth: () => ({
      affinity: { health: { morning: 0.92, midday: 0.5, evening: 0.4 } },
      baseAffinity: { morning: 0.8, midday: 0.5, evening: 0.45 },
      adherence: 0.93,
      // Will not move a session: the schedule is the training plan.
      moveTendency: 0.15,
      acceptProb: 0.35,
      applyReviewProb: 0.4,
      behaviourEventRate: 0.1,
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

const HABIT_KEYS: ExistingHabitKey[] = [
  'fasting',
  'workout',
  'walking',
  'running',
  'meditation',
  'sauna',
  'cold',
  'journaling',
];

/**
 * One named persona, rather than a weighted draw.
 *
 * `makeUser` samples the population, which is the right instrument for
 * "what happens to our users on average" and the wrong one for "does this
 * work for a night-shift nurse" — a weighted sample of ten will simply not
 * contain one. This builds the persona you asked for, with the same
 * deterministic seeding so a named run is as reproducible as a sampled one.
 */
export function makeUserOf(
  id: number,
  key: string,
  opts: { captureHabits?: boolean } = {},
): SimUser {
  const spec = PERSONAS.find((p) => p.key === key);
  if (!spec) throw new Error(`No persona '${key}'. Known: ${PERSONAS.map((p) => p.key).join(', ')}`);
  const rng = mulberry32(1_000_003 * (id + 1));
  const trueHabits = HABIT_KEYS.filter((h) => rng() < (spec.habitOdds?.[h] ?? 0));
  const answers = spec.answers(rng);
  if (opts.captureHabits !== false && trueHabits.length > 0) {
    answers.existingHabits = trueHabits;
  }
  const truth = spec.truth(rng);
  truth.trueHabits = trueHabits;
  truth.establishedBoost = 1.15 + rng() * 0.1;
  return { id, persona: spec.key, plan: buildLifeOperatingPlan(answers), truth, rng };
}

export function makeUser(id: number, opts: { captureHabits?: boolean } = {}): SimUser {
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
  // The human's REAL habits exist either way; captureHabits controls only
  // whether the interview asked about them (the ablation arm doesn't).
  const trueHabits = HABIT_KEYS.filter((h) => rng() < (spec.habitOdds?.[h] ?? 0));
  const answers = spec.answers(rng);
  if (opts.captureHabits !== false && trueHabits.length > 0) {
    answers.existingHabits = trueHabits;
  }
  const truth = spec.truth(rng);
  truth.trueHabits = trueHabits;
  truth.establishedBoost = 1.15 + rng() * 0.1;
  return {
    id,
    persona: spec.key,
    plan: buildLifeOperatingPlan(answers),
    truth,
    rng,
  };
}
