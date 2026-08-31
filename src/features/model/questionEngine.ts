/**
 * Progressive Question Engine — depth without questionnaire fatigue.
 *
 * Every possible question declares its domain, importance, information
 * gain, burden and where the answer could come from. INTENT asks ONE
 * next-best question at a time ("I can make your training more accurate
 * if I know your current bench press. Add it?") and never asks for what
 * it already knows — from the profile, from a metric observation, from a
 * path intake, or (later) from a passive source like HealthKit.
 *
 * Answering more is always the user's CHOICE: every path hub surfaces
 * the single next-best question for its domain, and each answer visibly
 * sharpens the plan. Skipping costs nothing and cools the question down.
 */

import type { LifeProfile } from '@/types/domain';

import { latest, type MetricObservation } from './metrics';

export type QuestionDomain =
  | 'training'
  | 'nutrition'
  | 'work'
  | 'mind'
  | 'sleep'
  | 'finance'
  | 'relationship'
  | 'family';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDef {
  id: string;
  domain: QuestionDomain;
  /** The one-line ask, phrased as value-for-the-user. */
  prompt: string;
  /** 1–5: how much the pathway's output changes with the answer. */
  importance: number;
  /** 1–5: how much uncertainty the answer removes. */
  informationGain: number;
  /** 1–3: cost to the user (a tap = 1, typing a number = 1, judgement = 2, digging = 3). */
  burden: number;
  input: 'number' | 'setEntry' | 'choice';
  unit?: string;
  options?: QuestionOption[];
  /** Where the answer lands. */
  metricKey?: string;
  profileKey?: 'age' | 'weightKg';
  /** For choice questions: merged into this path's intake answers. */
  pathId?:
    | 'training'
    | 'nutrition'
    | 'money'
    | 'work'
    | 'recovery'
    | 'relationship'
    | 'family';
  answerKey?: string;
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
    id: 'focus-lift',
    domain: 'training',
    prompt: 'One lift you most want to move? The block builds its heavy work around it.',
    importance: 4,
    informationGain: 3,
    burden: 1,
    input: 'choice',
    pathId: 'training',
    answerKey: 'focusLift',
    options: [
      { value: 'bench', label: 'Bench press' },
      { value: 'squat', label: 'Squat' },
      { value: 'deadlift', label: 'Deadlift' },
      { value: 'none', label: 'No favourite' },
    ],
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
    id: 'food-trouble',
    domain: 'nutrition',
    prompt: 'Where does food usually go wrong? The answer decides which lever comes first.',
    importance: 4,
    informationGain: 4,
    burden: 1,
    input: 'choice',
    pathId: 'nutrition',
    answerKey: 'trouble',
    options: [
      { value: 'evenings', label: 'Evenings at home' },
      { value: 'snacking', label: 'Grazing all day' },
      { value: 'drinks', label: 'Drinks carry it' },
      { value: 'skipping', label: 'Skipping meals' },
      { value: 'nowhere', label: 'It’s mostly fine' },
    ],
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
  {
    id: 'money-buffer',
    domain: 'finance',
    prompt: 'If income stopped, how long could the household run? It sets the first milestone.',
    importance: 5,
    informationGain: 4,
    burden: 2,
    input: 'choice',
    pathId: 'money',
    answerKey: 'buffer',
    options: [
      { value: 'none', label: 'Under a month' },
      { value: 'some', label: '1–3 months' },
      { value: 'solid', label: '3+ months' },
    ],
  },
  {
    id: 'meeting-load',
    domain: 'work',
    prompt: 'How much of your week is meetings? It decides where the deep work can honestly go.',
    importance: 4,
    informationGain: 3,
    burden: 1,
    input: 'choice',
    pathId: 'work',
    answerKey: 'meetingLoad',
    options: [
      { value: 'light', label: 'Under a quarter' },
      { value: 'half', label: 'Around half' },
      { value: 'heavy', label: 'Most of it' },
    ],
  },
  // ── Money: the number the whole path is judged on ────────────────────
  // assessMoney reads finance.savingsRate, but nothing ever asked for it —
  // the path sat in 'need-data' until the user volunteered a figure.
  {
    id: 'money-savings-rate',
    domain: 'finance',
    prompt: 'One number runs this whole path: what share of last month’s income did you keep?',
    importance: 5,
    informationGain: 5,
    burden: 2,
    input: 'number',
    unit: '%',
    metricKey: 'finance.savingsRate',
  },
  {
    id: 'money-payday',
    domain: 'finance',
    prompt: 'When does money actually land? The automatic transfer should sit right behind it.',
    importance: 4,
    informationGain: 3,
    burden: 1,
    input: 'choice',
    pathId: 'money',
    answerKey: 'payday',
    options: [
      { value: 'month-end', label: 'End of the month' },
      { value: 'month-mid', label: 'Mid-month' },
      { value: 'fortnightly', label: 'Every two weeks' },
      { value: 'irregular', label: 'Irregular — it varies' },
    ],
  },

  // ── Work: who you lead decides which practices even apply ────────────
  {
    id: 'direct-reports',
    domain: 'work',
    prompt: 'How many people report to you? It decides whether the block includes one-on-ones at all.',
    importance: 4,
    informationGain: 3,
    burden: 1,
    input: 'choice',
    pathId: 'work',
    answerKey: 'directs',
    options: [
      { value: 'none', label: 'Nobody yet' },
      { value: 'few', label: '1–3' },
      { value: 'several', label: '4–8' },
      { value: 'many', label: '9 or more' },
    ],
  },
  {
    id: 'decision-volume',
    domain: 'work',
    prompt: 'How often do you make a call you’d hate to get wrong? It sets the decision journal’s cadence.',
    importance: 3,
    informationGain: 3,
    burden: 1,
    input: 'choice',
    pathId: 'work',
    answerKey: 'decisionLoad',
    options: [
      { value: 'rare', label: 'A few times a year' },
      { value: 'weekly', label: 'Most weeks' },
      { value: 'daily', label: 'Most days' },
    ],
  },

  // ── Relationship and family: dormant until those paths exist ─────────
  {
    id: 'partner-window',
    domain: 'relationship',
    prompt: 'Tell me when you two are actually alone and I’ll stop scheduling into the kids’ bedtime.',
    importance: 5,
    informationGain: 4,
    burden: 1,
    input: 'choice',
    pathId: 'relationship',
    answerKey: 'window',
    options: [
      { value: 'after_bed', label: 'After the kids are down' },
      { value: 'early', label: 'Early mornings' },
      { value: 'weekend', label: 'Weekends only' },
      { value: 'none', label: 'Almost never' },
    ],
  },
  {
    id: 'reunion-state',
    domain: 'relationship',
    prompt: 'When you walk back in the door, what’s usually true? It decides whether you need ten minutes alone first.',
    importance: 3,
    informationGain: 3,
    burden: 2,
    input: 'choice',
    pathId: 'relationship',
    answerKey: 'reunionState',
    options: [
      { value: 'wired', label: 'Still wired from work' },
      { value: 'flat', label: 'Completely out of gas' },
      { value: 'fine', label: 'Mostly fine' },
    ],
  },
  {
    id: 'family-anchor-day',
    domain: 'family',
    prompt: 'Which day can genuinely hold the family thing? I’ll defend it and plan around it.',
    importance: 5,
    informationGain: 4,
    burden: 1,
    input: 'choice',
    pathId: 'family',
    answerKey: 'anchorDay',
    options: [
      { value: 'sat', label: 'Saturday' },
      { value: 'sun', label: 'Sunday' },
      { value: 'fri', label: 'Friday evening' },
      { value: 'varies', label: 'It changes week to week' },
    ],
  },
  {
    id: 'family-trip-horizon',
    domain: 'family',
    prompt: 'How far out is the next trip? Looking forward to it is half of what it’s worth.',
    importance: 4,
    informationGain: 4,
    burden: 1,
    input: 'choice',
    pathId: 'family',
    answerKey: 'tripHorizon',
    options: [
      { value: 'weeks', label: 'Within a month or two' },
      { value: 'months', label: 'Later this year' },
      { value: 'vague', label: 'Only an idea so far' },
      { value: 'none', label: 'Nothing planned' },
    ],
  },
  {
    id: 'urge-wave',
    domain: 'mind',
    prompt: 'When the urge comes, how long does it usually last? Knowing the wave beats fighting it.',
    importance: 3,
    informationGain: 3,
    burden: 2,
    input: 'choice',
    pathId: 'recovery',
    answerKey: 'wave',
    options: [
      { value: 'minutes', label: 'A few minutes' },
      { value: 'longer', label: '10–20 minutes' },
      { value: 'evening', label: 'The whole evening' },
    ],
  },
];

export interface QuestionContext {
  profile: LifeProfile | null;
  metrics: MetricObservation[];
  /** questionId → ISO of the last time it was asked (answered or skipped). */
  askedAt: Record<string, string>;
  /** Path intake answers — a choice question lands here and is never re-asked. */
  pathAnswers?: Partial<Record<string, Record<string, string>>>;
  domain?: QuestionDef['domain'];
}

const ASK_COOLDOWN_DAYS = 14;

/** Is the answer already known from any source? Never re-ask known facts. */
export function isAnswered(q: QuestionDef, ctx: QuestionContext): boolean {
  if (q.profileKey && ctx.profile?.[q.profileKey] != null) return true;
  if (q.metricKey && latest(ctx.metrics, q.metricKey)) return true;
  if (q.pathId && q.answerKey && ctx.pathAnswers?.[q.pathId]?.[q.answerKey] != null) return true;
  return false;
}

/** The single next-best question, or null when INTENT knows enough. */
export function nextQuestion(ctx: QuestionContext): QuestionDef | null {
  const cooldown = new Date(Date.now() - ASK_COOLDOWN_DAYS * 86400e3).toISOString();
  const candidates = QUESTIONS.filter((q) => {
    if (ctx.domain && q.domain !== ctx.domain) return false;
    // A path-targeted question only makes sense once that path exists.
    if (q.pathId && !ctx.pathAnswers?.[q.pathId]) return false;
    if (isAnswered(q, ctx)) return false;
    const asked = ctx.askedAt[q.id];
    if (asked && asked >= cooldown) return false;
    return true;
  });
  if (candidates.length === 0) return null;
  const score = (q: QuestionDef) => (q.importance * q.informationGain) / q.burden;
  return candidates.sort((a, b) => score(b) - score(a))[0];
}
