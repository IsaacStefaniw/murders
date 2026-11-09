/**
 * The journal arm: the questions, and what the answers are for.
 *
 * ── What was already here, and what was actually missing ──────────────
 *
 * Isaac asked for *"a big journaling arm"*, and then, the next evening:
 * *"I vaped last night 2 small sessions in the bathroom, which is much
 * better than usual and I had 0 Alcohol... these needs to be logged and
 * questioned."*
 *
 * Almost all of it existed. `BehaviourEvent` is the entry — timestamped,
 * so several a day, with `trigger`, `context`, `detail` and a relative
 * `size`. `features/behaviours/patterns.ts` is the read: `hotWindow`
 * finds the hours a behaviour clusters in, `weekdayShape` the days,
 * `coFactor` what travels with it, `interventionTime` when to speak.
 * `BehaviourIntention.ifThen` already stores an implementation intention,
 * and its own comment makes the argument better than I would.
 *
 * **The gap was never the code. It was that none of it held his data, and
 * he was logging to a chat window.** So this module is the capture — the
 * questions that fill those fields — and the sentence that reads them
 * back.
 *
 * ── The questions, and why these four ─────────────────────────────────
 *
 * `urge-log` (graded B) says: *"one line per urge — what happened, where
 * you were, what you did, written before any judgement about it."* Its
 * card also says why it earns a place: *"the fastest way to find that the
 * real trigger is six o'clock and an empty house rather than stress,
 * which is what nearly everyone assumes."*
 *
 * So the four questions are the four fields the pattern engine needs, and
 * no more. Anything else is a form somebody abandons on a Tuesday.
 *
 * ── What the first real entry already changed ─────────────────────────
 *
 * Entry one, 8 Nov 2026: two small vaping sessions, during 17:30-20:30,
 * trigger "the kids — a hard bedtime", in the bathroom, hiding it, with an
 * intention but no if-then. Alcohol zero.
 *
 * `profile.ts` modelled one chain: hard stretch -> stress -> vape, then
 * boys asleep -> quiet house -> drink. **The first real data point splits
 * it in two.** The vape landed DURING the stretch, not after it — so the
 * vape lives in 17:30-20:30 and the drink lives in 20:30-22:00. Both are
 * downstream of the same stress at different hours, which means they need
 * two interventions rather than one, and the 17:30 decision cannot cover
 * a thing that happens at 19:20.
 *
 * One data point is one data point. `MIN_EVENTS_FOR_PATTERN` is 4 and
 * nothing here pretends otherwise — but a model that survives first
 * contact in shape and fails in timing is worth saying out loud rather
 * than quietly leaving wrong.
 */

import type { BehaviourKey } from '@/types/domain';

/* ── The capture ───────────────────────────────────────────────────── */

export type JournalKind =
  /** A slip or an urge. Fills a BehaviourEvent. */
  | 'event'
  /** A clear night, which is data too — see `CLEAR_IS_DATA`. */
  | 'clear'
  /** The five-minute evening journal. Free text, no fields. */
  | 'evening'
  /** A decision and its reasoning, written before the outcome is known. */
  | 'decision';

export interface Question {
  id: 'when' | 'trigger' | 'where' | 'plan' | 'size';
  /** Asked in plain words, never as an interrogation. */
  ask: string;
  /** Which BehaviourEvent field the answer fills. */
  fills: 'occurredAt' | 'trigger' | 'context' | 'detail' | 'size';
  /** Why this question and not a different one. */
  because: string;
}

/**
 * The four, in this order.
 *
 * `when` is first because it is the only one the pattern engine cannot do
 * without: `hotWindow` is entirely a function of the hour, and an entry
 * with no time is an entry that never contributes to a window. Everything
 * else degrades gracefully; a missing time does not.
 *
 * `plan` is last and it is not a pattern field. It is there because the
 * three grade-A protocols in this app are if-then plans, and the honest
 * answer to "did you have one" is usually no — which is the finding that
 * makes writing one feel worth five minutes.
 */
export const QUESTIONS: Question[] = [
  {
    id: 'when',
    ask: 'Roughly what time?',
    fills: 'occurredAt',
    because:
      'The only field the pattern read cannot work without. hotWindow is a function of the hour and nothing else.',
  },
  {
    id: 'trigger',
    ask: 'What was going on just before?',
    fills: 'trigger',
    because:
      'The named trigger and the real one are usually different, and the log is the only way to find out which.',
  },
  {
    id: 'where',
    ask: 'Where were you?',
    fills: 'context',
    because:
      'A place is a cue, and a cue can be changed without changing anything about willpower.',
  },
  {
    id: 'plan',
    ask: 'Did you have a plan for tonight before it started?',
    fills: 'detail',
    because:
      'An intention and an if-then are not the same thing, and the difference between them is most of the effect.',
  },
];

/**
 * A clear night is an entry, not an absence.
 *
 * He reported *"0 Alcohol"* unprompted and alongside a vaping slip, which
 * is the behaviour of somebody keeping score of the right thing. If the
 * journal only ever records slips then the record of a good fortnight is
 * an empty screen, and an empty screen reads as nothing happened rather
 * than as something held.
 *
 * This is NOT a streak. `StopProgramme` already counts clear nights and
 * this does not duplicate it. The point is narrower: a `clear` entry
 * exists so that the log can be read back as what actually occurred, and
 * so a slip never sits on a page by itself.
 */
export const CLEAR_IS_DATA =
  'A night you held is an entry. Without it the log is a list of slips, and a list of slips is not a record of a fortnight.';

/* ── The read ──────────────────────────────────────────────────────── */

/**
 * What the journal is allowed to claim, given how much of it there is.
 *
 * `MIN_EVENTS_FOR_PATTERN` is 4 in `patterns.ts` and every function there
 * returns null below it. This mirrors that in words, because the screen
 * needs something honest to say in the meantime — and "not enough yet" is
 * a true sentence where a confident pattern drawn from two entries is not.
 */
export function standing(entryCount: number): string {
  if (entryCount === 0) {
    return 'Nothing logged yet. The first entry is worth more than the next ten, because it is the one that makes the rest comparable.';
  }
  if (entryCount === 1) {
    return 'One entry. Too few to see a pattern and enough to start one — four is where the hours and days become readable.';
  }
  if (entryCount < 4) {
    return `${entryCount} entries. Four is where the pattern read switches on; nothing before that is worth drawing a line through.`;
  }
  return `${entryCount} entries — enough for the hours and the days to be read rather than guessed.`;
}

/**
 * The one thing concealment changes, said once and without moralising.
 *
 * He answered that the bathroom was about hiding it. That is the single
 * most consequential answer in the first entry, and it is not a character
 * question:
 *
 *  - his own profile records, twice, that *"plans with other people in
 *    them survive a bad week; plans with only themselves in them do
 *    not"*. Futsal is the proof. A behaviour nobody else knows about is
 *    structurally a plan with only himself in it.
 *  - a thing done in a locked room has no cue that can be changed and no
 *    person who can help, so both of the levers this app actually has are
 *    unavailable.
 *
 * So the app says this, exactly once, and then never again — a sentence
 * repeated nightly is a scold, and rule 7 forbids one.
 */
export const CONCEALMENT_NOTE =
  'A thing done where nobody sees it has no cue to change and nobody to help. Your own week already shows what a plan with another person in it survives — that is what futsal is. This is the same lever, pointed at a harder thing.';

/** Behaviours this arm tracks for him. Two, deliberately. */
export const TRACKED: BehaviourKey[] = ['vaping', 'alcohol'];

/**
 * Where each behaviour actually happens, from the entries rather than from
 * the plan's assumption.
 *
 * Seeded with what `profile.ts` assumed so the two can be compared, and
 * labelled `assumed` until `hotWindow` has four events to overrule it.
 * The first entry already contradicts one of them.
 */
export const ASSUMED_WINDOW: Record<string, { from: string; to: string; note: string }> = {
  vaping: {
    from: '17:30',
    to: '20:30',
    note: 'The hard stretch. Assumed downstream of the drink; the first real entry says it is downstream of bedtime instead, and happens two hours earlier than the plan expected.',
  },
  alcohol: {
    from: '20:30',
    to: '22:00',
    note: 'The quiet window, once the boys are asleep. Not yet contradicted by anything logged.',
  },
};
