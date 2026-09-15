/**
 * The seven coaches, as people rather than as configuration.
 *
 * ── What this changes, and why it is a reversal ─────────────────────────
 *
 * The Coaches tab currently opens with the line "a coach here is a program,
 * not a person". That was an honest decision at the time — it promised
 * nothing the software could not deliver, and it warned people off
 * expecting a chatbot. But it also describes the problem exactly: seven
 * entries titled "Training", "Money", "Work & leadership", with a promise
 * paragraph each and not one line of character between them. They are
 * configuration screens wearing the word coach.
 *
 * Isaac's sketch asks for the opposite, and is right to: a coach you chose
 * is one you listen to, and you cannot choose a program. Not mascots —
 * SPECIALISTS WITH A MANNER, the way a good gym has one person who talks
 * about load and another who talks about sleep.
 *
 * ── The refusal is the character ────────────────────────────────────────
 *
 * Of the five lines each coach gets, the one that does the work is
 * `refusal`. A training coach that says "I will never tell you to train
 * through pain" is instantly more trustworthy than one that lists
 * features, because it has told you the thing it will not do to get what
 * it wants. Every coach already had this material — it is sitting in the
 * `safety` lines of its protocols and in the product decisions written up
 * in `docs/` — and no mouth to say it with.
 *
 * Each refusal here is a real constraint the code already honours:
 *
 *   - Sol keeps no streak, and `dayReview` and `weekReview` both refuse to
 *     compute one.
 *   - Bo will not move the children down the list, and `weeklyChanges`
 *     will not rest the last routine in a connection area.
 *   - Ren will not train you through pain, which is the modality registry's
 *     shortening floor and the auto-regulation pass.
 *
 * A refusal the app does not keep is worse than no refusal at all, so
 * nothing is promised here that is not already true in code.
 *
 * ── Names ───────────────────────────────────────────────────────────────
 *
 * Short, first-name-only, and deliberately not gendered by the copy: no
 * coach is referred to as he or she anywhere in the app, because a person
 * reading this should be able to hear whoever they want.
 */

import type { PathId } from '@/features/paths/definitions';

export interface CoachVoice {
  /** What to call it. */
  name: string;
  /** What it knows, in the words a person would use. */
  discipline: string;
  /** How it introduces itself, in its own voice. */
  opener: string;
  /** What it will do for you. Concrete, and something the app does. */
  promise: string;
  /** What it needs from you. One thing, not a list. */
  ask: string;
  /** The thing it will never do. The line that makes it trustworthy. */
  refusal: string;
}

export const COACH_VOICES: Record<PathId, CoachVoice> = {
  training: {
    name: 'Ren',
    discipline: 'strength and conditioning',
    opener: 'I’m Ren. I deal in load, and I add it slowly.',
    promise:
      'Every session written before you get there, sized to the week you actually have rather than the one you meant to have.',
    ask: 'Tell me when a session doesn’t happen. I can’t fix a Tuesday I never hear about.',
    refusal: 'I will never tell you to train through pain.',
  },
  nutrition: {
    name: 'Mara',
    discipline: 'food, without the counting',
    opener: 'I’m Mara. I don’t count anything, and I won’t ask you to.',
    promise:
      'Dinners decided before you’re hungry, a protein number that’s yours, and a walk that earns its twenty minutes.',
    ask: 'One honest answer a week about what you actually ate. An answer, not a log.',
    refusal: 'I will never put you on a diet, and I will never call a food bad.',
  },
  money: {
    name: 'Nell',
    discipline: 'money, and the boring parts of it',
    opener: 'I’m Nell. Money is arithmetic and habit, and I only work on the habit.',
    promise:
      'One transfer on payday, a date on the target, and a number each week that says whether it moved.',
    ask: 'Two minutes a fortnight to check one thing is actually set up, rather than meant to be.',
    refusal: 'I will never tell you what to invest in. That is not what I am.',
  },
  work: {
    name: 'Ivo',
    discipline: 'focus and decisions',
    opener: 'I’m Ivo. I care about the two hours a week nobody else can have.',
    promise:
      'Thinking time that survives the calendar, and a written record of what you decided and why.',
    ask: 'Name the bet in one sentence, and let me hold you to it.',
    refusal: 'I will never ask you to work longer. Only differently.',
  },
  recovery: {
    name: 'Sol',
    discipline: 'habits and the moments they win',
    opener: 'I’m Sol. I’m here for the hour that usually beats you.',
    promise:
      'A rehearsed answer, waiting in the exact window the urge arrives, decided while you were calm.',
    ask: 'Log the moment even when you gave in. Especially then — that one is the useful one.',
    refusal: 'I will never make you explain a slip, and I will never keep a streak.',
  },
  relationship: {
    name: 'Juno',
    discipline: 'the person you live with',
    opener: 'I’m Juno. Five minutes at the door beats a weekend away you never book.',
    promise:
      'Small attention, on the calendar, so it stops depending on how your day went.',
    ask: 'Tell me one true thing about how it’s going. It doesn’t leave your phone.',
    refusal: 'I will never score your relationship, and I will never speak for the other person.',
  },
  family: {
    name: 'Bo',
    discipline: 'family time and the trips you keep postponing',
    opener: 'I’m Bo. The weekend that happens beats the one you meant to have.',
    promise:
      'Time with each of them by name, and the next trip booked early enough that looking forward to it counts.',
    ask: 'Tell me when work ate the evening. I defend the next one harder.',
    refusal: 'I will never move your family down the list to make the week fit.',
  },
};

/** The coach for a path, for the screens that only hold an id. */
export function voiceFor(pathId: PathId): CoachVoice {
  return COACH_VOICES[pathId];
}

/**
 * How a coach introduces itself in one line, for a list.
 *
 * The discipline rather than the promise: a list of seven promises is a
 * feature matrix, and nobody chooses a person from one.
 */
export function coachLine(pathId: PathId): string {
  const v = COACH_VOICES[pathId];
  return `${v.name} · ${v.discipline}`;
}
