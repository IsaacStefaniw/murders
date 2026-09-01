/**
 * Preset goals — a starting line for people who know they want something
 * and do not yet know how to say it.
 *
 * The blank box in front of "what do you want?" is not neutral. It asks
 * someone to be articulate about their own life before anything has been
 * given to them, and the honest answer for most people at that moment is
 * "I don't know, better?". A shelf of well-formed goals turns that into
 * recognition, which is a far easier act than composition.
 *
 * The important architectural decision: A PRESET IS AN INPUT, NOT A
 * PARALLEL SYSTEM. Each one is just the sentence a person would have typed
 * if they knew how, and it goes through exactly the same parser and
 * milestone composer as free text. So a preset can never drift from what
 * typing produces, and nothing here needs a second ladder-building code
 * path to maintain.
 *
 * Each carries its honest cost. A goal presented without what it will take
 * is a wish, and the whole failure mode of goal-setting apps is people
 * accepting six of them in one sitting.
 */

import type { PathId } from '@/features/paths/definitions';
import type { GoalDomain } from '@/types/domain';

export interface GoalPreset {
  id: string;
  /** The goal text, phrased exactly as it will be parsed. */
  text: string;
  /** The shelf label — shorter than the text. */
  label: string;
  /** What this actually asks of you, per week, in plain terms. */
  commitment: string;
  domain: GoalDomain;
  /** The coach this turns on, when it turns one on. */
  path?: PathId;
}

export interface PresetGroup {
  title: string;
  /** Why someone would be in this group — shown under the heading. */
  blurb: string;
  presets: GoalPreset[];
}

/**
 * Targets are written into the text on purpose: the composer builds a
 * numeric ladder when it can parse one and a consistency ladder when it
 * cannot, and a numeric ladder is the better goal wherever the number is
 * genuinely measurable.
 *
 * `domain` records what the PARSER makes of each sentence, not what a
 * person filing it would say. "Ten hours of deep work" reads as personal
 * discipline rather than a career move, and the test beside this file
 * locks each one — so a change to the parser that stops "Bench press
 * 100kg" reading as fitness fails here rather than in someone's week.
 */
export const PRESET_GROUPS: PresetGroup[] = [
  {
    title: 'Strength',
    blurb: 'Each of these becomes a four-week block with your own loads in it.',
    presets: [
      {
        id: 'bench-100',
        text: 'Bench press 100kg',
        label: 'Bench 100kg',
        commitment: '3 sessions a week, 45–60 minutes',
        domain: 'fitness',
        path: 'training',
      },
      {
        id: 'squat-140',
        text: 'Squat 140kg',
        label: 'Squat 140kg',
        commitment: '3 sessions a week, 45–60 minutes',
        domain: 'fitness',
        path: 'training',
      },
      {
        id: 'deadlift-180',
        text: 'Deadlift 180kg',
        label: 'Deadlift 180kg',
        commitment: '3 sessions a week, 45–60 minutes',
        domain: 'fitness',
        path: 'training',
      },
      {
        id: 'train-consistently',
        text: 'Train three times a week, every week',
        label: 'Train 3× a week',
        commitment: '3 sessions a week — the number is the point, not the load',
        domain: 'fitness',
        path: 'training',
      },
    ],
  },
  {
    title: 'Endurance',
    blurb: 'Distance goals build backwards from the date, so the long runs land in the right weeks.',
    presets: [
      {
        id: 'run-5k',
        text: 'Run 5k without stopping',
        label: 'Run 5k',
        commitment: '3 runs a week, starting with run-walk',
        domain: 'fitness',
        path: 'training',
      },
      {
        id: 'run-10k',
        text: 'Run a 10k',
        label: 'Run a 10k',
        commitment: '3–4 runs a week, one of them long',
        domain: 'fitness',
        path: 'training',
      },
      {
        id: 'half-marathon',
        text: 'Run a half marathon',
        label: 'Half marathon',
        commitment: '4 runs a week for about 16 weeks',
        domain: 'fitness',
        path: 'training',
      },
    ],
  },
  {
    title: 'Body composition',
    blurb: 'Weight goals move slowly on purpose — the ladder is built around a trend, not a morning.',
    presets: [
      {
        id: 'lose-5kg',
        text: 'Lose 5kg',
        label: 'Lose 5kg',
        commitment: 'A weekly weigh-in and a protein target',
        domain: 'fitness',
        path: 'nutrition',
      },
      {
        id: 'lose-10kg',
        text: 'Lose 10kg',
        label: 'Lose 10kg',
        commitment: 'A weekly weigh-in, a protein target, and about six months',
        domain: 'fitness',
        path: 'nutrition',
      },
      {
        id: 'protein-daily',
        text: 'Hit my protein target every day',
        label: 'Protein every day',
        commitment: 'One decision at breakfast, most days',
        domain: 'personal',
        path: 'nutrition',
      },
    ],
  },
  {
    title: 'Money',
    blurb: 'Each becomes a ladder of amounts, checked monthly rather than daily.',
    presets: [
      {
        id: 'buffer-10k',
        text: 'Save $10,000 as an emergency buffer',
        label: 'A $10k buffer',
        commitment: 'One automatic transfer and a monthly check-in',
        domain: 'finance',
        path: 'money',
      },
      {
        id: 'save-50k',
        text: 'Save $50,000',
        label: 'Save $50k',
        commitment: 'A savings rate you review monthly',
        domain: 'finance',
        path: 'money',
      },
      {
        id: 'clear-debt',
        text: 'Clear my credit card debt',
        label: 'Clear the card',
        commitment: 'A fixed monthly payment and no new balance',
        domain: 'finance',
        path: 'money',
      },
    ],
  },
  {
    title: 'Work',
    blurb: 'Protected time, defended against the calendar rather than hoped for.',
    presets: [
      {
        id: 'deep-work',
        text: 'Get 10 hours of deep work a week',
        label: '10 deep hours a week',
        commitment: 'Two protected blocks a day, most days',
        domain: 'personal',
        path: 'work',
      },
      {
        id: 'finish-thing',
        text: 'Finish the thing I keep not finishing',
        label: 'Finish the thing',
        commitment: 'One block a day until it is done',
        domain: 'personal',
        path: 'work',
      },
    ],
  },
  {
    title: 'Mind and recovery',
    blurb: 'Small, daily, and measured in weeks rather than minutes.',
    presets: [
      {
        id: 'meditate-daily',
        text: 'Meditate every day for a year',
        label: 'Meditate daily',
        commitment: '10 minutes, in the app, most mornings',
        domain: 'personal',
        path: 'recovery',
      },
      {
        id: 'sleep-seven',
        text: 'Get seven hours of sleep on weeknights',
        label: 'Seven hours, weeknights',
        commitment: 'A wind-down that starts on time',
        domain: 'health',
        path: 'recovery',
      },
      {
        id: 'drink-less',
        text: 'Drink less',
        label: 'Drink less',
        commitment: 'Logging honestly, and one counter-move ready',
        domain: 'behaviour',
        path: 'recovery',
      },
    ],
  },
  {
    title: 'People',
    blurb: 'The ones that are hardest to keep, because nothing external enforces them.',
    presets: [
      {
        id: 'date-night',
        text: 'A proper date night every week',
        label: 'Weekly date night',
        commitment: 'One evening, in the diary before the week starts',
        domain: 'relationship',
        path: 'relationship',
      },
      {
        id: 'family-adventure',
        text: 'One family adventure every week',
        label: 'Weekly adventure',
        commitment: 'Half a day, decided in advance',
        domain: 'family',
        path: 'family',
      },
      {
        id: 'see-friends',
        text: 'See a friend every fortnight',
        label: 'See friends',
        commitment: 'One arrangement you actually make',
        domain: 'friends',
      },
    ],
  },
];

export const ALL_PRESETS: GoalPreset[] = PRESET_GROUPS.flatMap((g) => g.presets);

export const presetById = (id: string): GoalPreset | undefined =>
  ALL_PRESETS.find((p) => p.id === id);
