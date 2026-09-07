/**
 * Closing the working day: tomorrow's first thing, carried to tomorrow.
 *
 * The shutdown ritual has the best cheap evidence in this coach —
 * naming a plan for unfinished work quiets it about as well as finishing
 * it does (Masicampo & Baumeister 2011), and an evening that actually
 * leaves work predicts the next morning (Sonnentag). The routine was on
 * the calendar; nothing asked the question and nothing carried the
 * answer anywhere. This does both with the plumbing that already exists:
 * the work goal's `nextFocus` is stamped as "Next step" on every work
 * block on Today, so the first thing lands on tomorrow's first block.
 *
 * The weekly review writes the same field with the week's one lever, so
 * the lever is kept aside while a first thing is pending and put back
 * once that day has passed. The clean version is a `firstThing` on the
 * day's plan itself; that needs the store and is proposed in the report.
 *
 * Everything here is pure. The hub applies the result through
 * `updatePathAnswers`, `setGoalNextFocus` and `regeneratePlan`.
 */

import { addDays, weekdayOf } from '@/lib/dates';
import type { Weekday } from '@/types/domain';

export const FIRST_THING_KEY = 'firstThing';
export const FIRST_THING_FOR_KEY = 'firstThingFor';
export const WEEK_LEVER_KEY = 'weekLever';

export interface FirstThing {
  text: string;
  /** The date it is for. */
  forDate: string;
}

/** The next working day after `today`; tomorrow when the week has no shape. */
export function nextWorkDay(today: string, workDays: Weekday[]): string {
  if (workDays.length === 0) return addDays(today, 1);
  for (let i = 1; i <= 7; i++) {
    const date = addDays(today, i);
    if (workDays.includes(weekdayOf(date))) return date;
  }
  return addDays(today, 1);
}

/** The first thing on file, if its day has not passed. */
export function pendingFirstThing(
  answers: Record<string, string> | undefined,
  today: string,
): FirstThing | null {
  const text = answers?.[FIRST_THING_KEY]?.trim();
  const forDate = answers?.[FIRST_THING_FOR_KEY];
  if (!text || !forDate || forDate < today) return null;
  return { text, forDate };
}

export interface ShutdownResult {
  forDate: string;
  /** Merged into the work path's answers. */
  answersPatch: Record<string, string>;
  /** What the work goal's next step becomes. */
  nextFocus: string;
}

/**
 * Close the day with tomorrow's first thing.
 *
 * The lever on file is kept aside once, the first time a first thing
 * replaces it; a second shutdown in a row does not overwrite the lever
 * with the earlier first thing.
 */
export function closeDay(input: {
  firstThing: string;
  today: string;
  workDays: Weekday[];
  answers: Record<string, string> | undefined;
  currentFocus: string | undefined;
}): ShutdownResult | null {
  const text = input.firstThing.trim();
  if (!text) return null;
  const forDate = nextWorkDay(input.today, input.workDays);
  const previous = input.answers?.[FIRST_THING_KEY];
  const answersPatch: Record<string, string> = {
    [FIRST_THING_KEY]: text,
    [FIRST_THING_FOR_KEY]: forDate,
  };
  const focusIsLever = !!input.currentFocus && input.currentFocus !== previous;
  if (focusIsLever) answersPatch[WEEK_LEVER_KEY] = input.currentFocus!;
  return { forDate, answersPatch, nextFocus: text };
}

export interface RestoreResult {
  answersPatch: Record<string, string>;
  nextFocus: string | undefined;
}

/**
 * Once the first thing's day has passed, the week's lever goes back on the
 * work goal. Null when there is nothing to do, so a hub can call this on
 * every render without looping.
 */
export function restoreLever(input: {
  today: string;
  answers: Record<string, string> | undefined;
  currentFocus: string | undefined;
}): RestoreResult | null {
  const text = input.answers?.[FIRST_THING_KEY];
  const forDate = input.answers?.[FIRST_THING_FOR_KEY];
  if (!text || !forDate || forDate >= input.today) return null;
  // Somebody else changed the focus since; leave it alone and just forget.
  const stillOurs = input.currentFocus === text;
  return {
    answersPatch: { [FIRST_THING_KEY]: '', [FIRST_THING_FOR_KEY]: '' },
    nextFocus: stillOurs ? input.answers?.[WEEK_LEVER_KEY] || undefined : input.currentFocus,
  };
}
