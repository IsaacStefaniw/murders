/**
 * What the person wants from training, as the intake asks it, and what
 * the hub says when they change it.
 *
 * The two intake questions live in the question bank with every other
 * pathway's. This is the training-side reading of them: which follow-up
 * options fit which answer (the intake shows all of them at once; the
 * hub's "change what I'm training for" shows only the ones that apply),
 * the answers to write back so the question engine does not re-ask the
 * lift, and the one sentence that says what a rebuilt block changed.
 */

import { DOMAIN_QUESTIONS } from '@/features/knowledge/questionBank';

import type { TrainingGoal, TrainingProgramme } from './programme';

export type Want = 'stronger' | 'muscle' | 'leaner' | 'fitter' | 'keep';

const FITNESS = DOMAIN_QUESTIONS.fitness ?? [];
const optionsOf = (key: string) => FITNESS.find((q) => q.key === key)?.options ?? [];

// The intake's "not sure" is an honest way out of the question, not a
// want: a person changing what they train for on the hub has one in mind.
export const WANT_OPTIONS = optionsOf('want').filter((o) => o.value !== 'unsure') as {
  value: Want;
  label: string;
}[];

/** The follow-up values that make sense for each answer, in the order to show them. */
export const FOCUS_FOR_WANT: Record<Want, string[]> = {
  stronger: ['bench', 'squat', 'deadlift', 'ohp'],
  muscle: ['upper', 'lower', 'whole'],
  leaner: ['whole', 'upper', 'lower'],
  fitter: ['5k', '10k', 'sport'],
  // Keeping what you have has no "where first" — the whole point is all of it.
  keep: [],
};

export function focusOptionsFor(want: Want): { value: string; label: string }[] {
  const all = optionsOf('focus');
  return (FOCUS_FOR_WANT[want] ?? [])
    .map((value) => all.find((o) => o.value === value))
    .filter((o): o is { value: string; label: string } => o != null);
}

const LIFTS = ['bench', 'squat', 'deadlift', 'ohp'];

/**
 * The answers the hub writes for a change. `focusLift` is set as well as
 * `focus`: the question engine's own lift question is answered by that
 * key, and without it the person would be asked the lift again a day
 * after choosing it here. 'none' is its word for "no favourite".
 */
export function answersForWant(want: Want, focus?: string): Record<string, string> {
  const chosen = focus && FOCUS_FOR_WANT[want].includes(focus) ? focus : (FOCUS_FOR_WANT[want][0] ?? 'whole');
  return { want, focus: chosen, focusLift: LIFTS.includes(chosen) ? chosen : 'none' };
}

/** The goal a want maps to, the same reading the store makes. */
export const GOAL_FOR_WANT: Record<Want, TrainingGoal> = {
  stronger: 'strength',
  muscle: 'hypertrophy',
  leaner: 'fatloss',
  fitter: 'fitter',
  keep: 'maintain',
};

export function wantOf(goal: TrainingGoal): Want | null {
  return (Object.keys(GOAL_FOR_WANT) as Want[]).find((w) => GOAL_FOR_WANT[w] === goal) ?? null;
}

const AIM: Record<TrainingGoal, string> = {
  strength: 'getting stronger',
  hypertrophy: 'building muscle',
  fatloss: 'getting leaner',
  fitter: 'getting fitter',
  maintain: 'keeping what you have',
  general: 'the general block',
};

const LIFT_WORD: Record<string, string> = {
  bench: 'the bench',
  squat: 'the squat',
  deadlift: 'the deadlift',
  ohp: 'the overhead press',
};

/**
 * What the rebuilt block changed, in one sentence. Read from the block
 * itself rather than the answers, so it cannot promise a top set the
 * constraints vetoed or a conditioning day that was not built.
 */
export function describeChange(before: TrainingProgramme | null, after: TrainingProgramme): string {
  const { inputs } = after;
  const week = after.weeks[0];
  const sessions = week.sessions.length;
  const exercises = after.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises));
  const topSet = exercises.some((e) => /heavy top single/.test(e.name));
  const conditioning = week.sessions.some((s) => s.title === 'Conditioning');
  const lifting = sessions - (conditioning ? 1 : 0);
  const accessories = week.sessions[0].exercises.filter((e) => e.accessory).length;

  let detail: string;
  switch (inputs.goal) {
    case 'strength':
      detail = inputs.focusLift
        ? `${LIFT_WORD[inputs.focusLift]} opens every session it is in${topSet ? ', with a heavy top set in week 3' : ''}`
        : 'the main lifts first, loads stepping up each week';
      break;
    case 'hypertrophy':
      detail =
        inputs.focusArea === 'whole'
          ? 'an extra set and an extra accessory in every session'
          : inputs.focusArea
            ? `an extra set and an extra accessory on the ${inputs.focusArea} body`
            : `${accessories} accessories a session`;
      break;
    case 'fatloss':
      detail = 'a finisher on every session but the deload, and the walk in your week stays';
      break;
    case 'fitter':
      detail = `${lifting} lifting and one conditioning${inputs.distance === '10k' ? ' for 10 km and beyond' : inputs.distance === 'sport' ? ' for your sport' : ' for a 5 km'}`;
      break;
    case 'maintain':
      detail = 'the same dose every week and no peak';
      break;
    default:
      detail = 'the standard block';
  }
  const was = before && before.inputs.goal !== inputs.goal ? `Was ${AIM[before.inputs.goal]}; now` : 'Now';
  return `${was} ${AIM[inputs.goal]}: ${sessions} sessions a week, ${detail}.`;
}
