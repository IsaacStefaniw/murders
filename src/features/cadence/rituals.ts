/**
 * Setting up the month, the week and the day — and looking back at two of
 * them.
 *
 * The app could plan a week and could review one. What it could not do was
 * let somebody sit down for two minutes and decide what a period was FOR,
 * which is the move that makes a plan theirs rather than the app's. A
 * generated week nobody chose is a week nobody defends.
 *
 * Four rules this module keeps:
 *
 * 1. **Optional, always.** Nothing here is ever overdue and nothing is
 *    counted against anybody. A ritual that is skipped simply does not
 *    appear again for that period. The app already refuses to nag about
 *    behaviours for good reasons; a planning habit deserves the same.
 * 2. **Two minutes means two or three questions.** Every extra question is
 *    a reason not to start. Where a longer version exists it is the weekly
 *    review, which already has its own screen.
 * 3. **Look back before planning forward.** At the turn of a month both the
 *    review and the setup come due, and they are offered in that order,
 *    because a month planned without reading the last one is a guess.
 * 4. **No cadence is invented in the calendar.** This is the honest answer
 *    to the limitation the pathway ladders ran into: a routine cannot recur
 *    less often than weekly, so a monthly review scheduled weekly would be
 *    that review twelve times over. A ritual is not a routine. It is
 *    computed from the date and disappears once answered.
 * 5. **The day is not here.** `check-in/morning` already sets the day up —
 *    three priorities and one intention, in thirty seconds — and a second
 *    day-setup would be the same duplication the pathway rungs were just
 *    fixed for. This module owns the two periods nothing owned: the week
 *    and the month.
 */

import { addDays, dateKeyToDate, toDateKey, weekStartOf } from '@/lib/dates';

export type RitualKind = 'month-review' | 'month-setup' | 'week-review' | 'week-setup';

export interface RitualQuestion {
  key: string;
  prompt: string;
  /** A nudge under the field, where the question needs one. */
  hint?: string;
  /** True where the answer is one of the person's goals rather than text. */
  goalPick?: boolean;
}

export interface Ritual {
  kind: RitualKind;
  title: string;
  /** What period it is about — '2026-09', a week-start date key, or a day. */
  periodKey: string;
  /** Shown so nobody wonders which week is meant. */
  periodLabel: string;
  minutes: number;
  why: string;
  questions: RitualQuestion[];
}

/** The store key for an answered ritual. */
export const ritualKey = (kind: RitualKind, periodKey: string): string => `${kind}:${periodKey}`;

export interface RitualEntry {
  answers: Record<string, string>;
  completedAt: string;
  /** Set where the person chose to pass rather than answer. */
  skipped?: boolean;
}

/* ── The questions ──────────────────────────────────────────────────────
 *
 * Written to be answerable in a sentence. "What is this month for?" is a
 * question somebody can answer while the kettle boils; "define your
 * quarterly objectives" is a question that gets an app deleted.
 */

const MONTH_SETUP: RitualQuestion[] = [
  {
    key: 'for',
    prompt: 'What is this month for?',
    hint: 'One thing. If it is three things it is none of them.',
  },
  {
    key: 'goal',
    prompt: 'Which goal does that serve?',
    goalPick: true,
  },
  {
    key: 'known',
    prompt: 'What is already booked that will take real time?',
    hint: 'Travel, a deadline, someone visiting. Naming it now is how the plan survives it.',
  },
];

const MONTH_REVIEW: RitualQuestion[] = [
  { key: 'moved', prompt: 'What actually moved?' },
  {
    key: 'learned',
    prompt: 'What did you learn about how your months go?',
    hint: 'Not what you should have done. What is true about how the month actually ran.',
  },
];

const WEEK_SETUP: RitualQuestion[] = [
  {
    key: 'for',
    prompt: 'What is this week for?',
    hint: 'The one thing that, if it happened, would make the week worth it.',
  },
  {
    key: 'risk',
    prompt: 'Which day is most at risk?',
    hint: 'The one with the late finish, the travel, the thing you are dreading.',
  },
];

const WEEK_REVIEW: RitualQuestion[] = [
  { key: 'moved', prompt: 'What moved?' },
  {
    key: 'blocked',
    prompt: 'What got in the way — once, or every time?',
    hint: 'Once is a bad week. Every time is something to change.',
  },
];

const MONTH_LABEL = (key: string): string =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const WEEK_LABEL = (start: string): string => {
  const from = dateKeyToDate(start);
  const to = dateKeyToDate(addDays(start, 6));
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${from.toLocaleDateString(undefined, opts)} – ${to.toLocaleDateString(undefined, opts)}`;
};

const monthKeyOf = (dateKey: string): string => dateKey.slice(0, 7);

const previousMonthKey = (dateKey: string): string => {
  const d = dateKeyToDate(dateKey);
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return toDateKey(d).slice(0, 7);
};

/**
 * How many days into a month the turn-of-month rituals stay available.
 *
 * Five, not one. Somebody who opens the app on the fourth has not missed
 * the month, and a window of one day is a window most people are outside
 * of — which would make this a feature that exists and never fires.
 */
export const MONTH_WINDOW_DAYS = 5;

/**
 * What is worth offering today, in the order it should be offered.
 *
 * Never more than one of each, never anything already answered or passed
 * on, and never anything about a period that has not finished.
 */
export function ritualsDue(
  today: string,
  done: Record<string, RitualEntry>,
  goalTitles: string[] = [],
): Ritual[] {
  const out: Ritual[] = [];
  const dayOfMonth = Number(today.slice(8, 10));
  const weekday = dateKeyToDate(today).getDay();
  const thisWeek = weekStartOf(today);
  const lastWeek = addDays(thisWeek, -7);

  const add = (r: Ritual) => {
    if (!done[ritualKey(r.kind, r.periodKey)]) out.push(r);
  };

  // Look back first, and only at periods that have actually finished.
  if (dayOfMonth <= MONTH_WINDOW_DAYS) {
    const key = previousMonthKey(today);
    add({
      kind: 'month-review',
      title: 'Look back at last month',
      periodKey: key,
      periodLabel: MONTH_LABEL(key),
      minutes: 2,
      why: 'Two questions about the month that finished, so the next one is planned against what actually happened.',
      questions: MONTH_REVIEW,
    });
    const thisMonth = monthKeyOf(today);
    add({
      kind: 'month-setup',
      title: 'Set up this month',
      periodKey: thisMonth,
      periodLabel: MONTH_LABEL(thisMonth),
      minutes: 2,
      why: 'One thing the month is for, the goal it serves, and what is already booked against it.',
      questions: goalTitles.length > 0 ? MONTH_SETUP : MONTH_SETUP.filter((q) => !q.goalPick),
    });
  }

  // Sunday and Monday are the turn of the week. Sunday evening and Monday
  // morning are both when people actually do this, so both are offered.
  if (weekday === 0 || weekday === 1) {
    add({
      kind: 'week-review',
      title: 'Look back at last week',
      periodKey: lastWeek,
      periodLabel: WEEK_LABEL(lastWeek),
      minutes: 2,
      why: 'What moved, and whether the thing in the way was a one-off.',
      questions: WEEK_REVIEW,
    });
    add({
      kind: 'week-setup',
      title: 'Set up this week',
      periodKey: thisWeek,
      periodLabel: WEEK_LABEL(thisWeek),
      minutes: 2,
      why: 'The one thing the week is for, and the day most likely to take it.',
      questions: WEEK_SETUP,
    });
  }

  return out;
}

/** The one to offer, where a screen has room for one. */
export const nextRitual = (
  today: string,
  done: Record<string, RitualEntry>,
  goalTitles: string[] = [],
): Ritual | null => ritualsDue(today, done, goalTitles)[0] ?? null;

/**
 * What a person said this period was for, if they said anything.
 *
 * Read by whatever wants to show it back — the day screen, the week
 * screen. An intention nobody repeats to you is an intention you forget by
 * Wednesday, which is the whole reason for writing it down.
 */
export function statedPurpose(
  kind: 'month-setup' | 'week-setup',
  periodKey: string,
  done: Record<string, RitualEntry>,
): string | null {
  const entry = done[ritualKey(kind, periodKey)];
  if (!entry || entry.skipped) return null;
  return entry.answers.for?.trim() || null;
}

/** Everything answered, newest first — the record a review can read. */
export function ritualHistory(
  kind: RitualKind,
  done: Record<string, RitualEntry>,
): { periodKey: string; entry: RitualEntry }[] {
  return Object.entries(done)
    .filter(([k]) => k.startsWith(`${kind}:`))
    .map(([k, entry]) => ({ periodKey: k.slice(kind.length + 1), entry }))
    .filter(({ entry }) => !entry.skipped)
    .sort((a, b) => (a.periodKey < b.periodKey ? 1 : -1));
}
