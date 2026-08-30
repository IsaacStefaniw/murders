/**
 * Progressive Question Engine — depth without questionnaire fatigue.
 *
 * Every possible question declares its domain, importance, information
 * gain, burden and where the answer could come from. INTENT asks ONE
 * next-best question at a time ("I can make your training more accurate
 * if I know your current bench press. Add it?") and never asks for what
 * it already knows — from the profile, from a metric observation, or
 * (later) from a passive source like HealthKit.
 */

import type { LifeProfile } from '@/types/domain';

import { latest, type MetricObservation } from './metrics';

export interface QuestionDef {
  id: string;
  domain: 'training' | 'nutrition' | 'work' | 'mind' | 'sleep' | 'finance';
  /** The one-line ask, phrased as value-for-the-user. */
  prompt: string;
  /** 1–5: how much the pathway's output changes with the answer. */
  importance: number;
  /** 1–5: how much uncertainty the answer removes. */
  informationGain: number;
  /** 1–3: cost to the user (typing a number = 1, judgement = 2, digging = 3). */
  burden: number;
  input: 'number' | 'setEntry';
  unit?: string;
  /** Where the answer lands. */
  metricKey?: string;
  profileKey?: 'age' | 'weightKg';
  /** For setEntry: the lift whose weight×reps becomes an e1RM observation. */
  lift?: string;
}

export const QUESTIONS: QuestionDef[] = [
  {
    id: 'bench-baseline',
    domain: 'training',
    prompt: 'I can make your training loads exact if I know your bench press. Heaviest recent set?',
    importance: 5,
    informationGain: 5,
    burden: 1,
    input: 'setEntry',
    unit: 'kg',
    metricKey: 'strength.bench.e1rm',
    lift: 'Bench press',
  },
  {
    id: 'squat-baseline',
    domain: 'training',
    prompt: 'Squat baseline — heaviest recent set?',
    importance: 5,
    informationGain: 4,
    burden: 1,
    input: 'setEntry',
    unit: 'kg',
    metricKey: 'strength.squat.e1rm',
    lift: 'Squat',
  },
  {
    id: 'deadlift-baseline',
    domain: 'training',
    prompt: 'Deadlift baseline — heaviest recent set?',
    importance: 4,
    informationGain: 4,
    burden: 1,
    input: 'setEntry',
    unit: 'kg',
    metricKey: 'strength.deadlift.e1rm',
    lift: 'Deadlift',
  },
  {
    id: 'ohp-baseline',
    domain: 'training',
    prompt: 'Overhead press — heaviest recent set?',
    importance: 3,
    informationGain: 3,
    burden: 1,
    input: 'setEntry',
    unit: 'kg',
    metricKey: 'strength.ohp.e1rm',
    lift: 'Overhead press',
  },
  {
    id: 'weight',
    domain: 'nutrition',
    prompt: 'Your weight sets the protein target — worth 5 seconds. Weight in kg?',
    importance: 4,
    informationGain: 4,
    burden: 1,
    input: 'number',
    unit: 'kg',
    profileKey: 'weightKg',
    metricKey: 'body.weight',
  },
  {
    id: 'age',
    domain: 'training',
    prompt: 'Age tunes warm-ups and recovery guidance. How old are you?',
    importance: 3,
    informationGain: 3,
    burden: 1,
    input: 'number',
    unit: 'years',
    profileKey: 'age',
  },
];

export interface QuestionContext {
  profile: LifeProfile | null;
  metrics: MetricObservation[];
  /** questionId → ISO of the last time it was asked (answered or skipped). */
  askedAt: Record<string, string>;
  domain?: QuestionDef['domain'];
}

const ASK_COOLDOWN_DAYS = 14;

/** Is the answer already known from any source? Never re-ask known facts. */
export function isAnswered(q: QuestionDef, ctx: QuestionContext): boolean {
  if (q.profileKey && ctx.profile?.[q.profileKey] != null) return true;
  if (q.metricKey && latest(ctx.metrics, q.metricKey)) return true;
  return false;
}

/** The single next-best question, or null when INTENT knows enough. */
export function nextQuestion(ctx: QuestionContext): QuestionDef | null {
  const cooldown = new Date(Date.now() - ASK_COOLDOWN_DAYS * 86400e3).toISOString();
  const candidates = QUESTIONS.filter((q) => {
    if (ctx.domain && q.domain !== ctx.domain) return false;
    if (isAnswered(q, ctx)) return false;
    const asked = ctx.askedAt[q.id];
    if (asked && asked >= cooldown) return false;
    return true;
  });
  if (candidates.length === 0) return null;
  const score = (q: QuestionDef) => (q.importance * q.informationGain) / q.burden;
  return candidates.sort((a, b) => score(b) - score(a))[0];
}
