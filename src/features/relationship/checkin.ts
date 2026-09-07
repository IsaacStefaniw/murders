/**
 * The weekly two-of-you check-in, as three questions that change next week.
 *
 * The practice in the library ('partner-checkin-weekly') was a twenty-minute
 * block called "logistics". Nothing in it produced anything: a couple sat
 * down, talked, and the week after looked exactly like the week before.
 * The survey evidence behind it is about how fairly the load FEELS shared,
 * and that only moves when something is actually handed across.
 *
 * So the check-in is three questions, and two of the answers land on next
 * week's plan: the swap becomes the moment it is handed over, and the thing
 * they need becomes a block with their name on it. The first answer is
 * kept as words, because the thing that worked is already on the plan.
 */

import { addDays, dateKeyToDate } from '@/lib/dates';

export type CheckinKey = 'keep' | 'swap' | 'need';

export interface CheckinQuestion {
  key: CheckinKey;
  question: string;
  placeholder: string;
}

export const CHECKIN_QUESTIONS: CheckinQuestion[] = [
  {
    key: 'keep',
    question: 'What worked this week that we should keep?',
    placeholder: 'The Thursday walk, say',
  },
  {
    key: 'swap',
    question: 'One thing to swap next week — who takes what?',
    placeholder: 'I do the Tuesday pick-up, you do bedtime',
  },
  {
    key: 'need',
    question: 'One thing you need from me next week?',
    placeholder: 'An evening with no plans',
  },
];

export type CheckinAnswers = Partial<Record<CheckinKey, string>>;

export interface CheckinPlanItem {
  date: string;
  title: string;
  area: 'relationship' | 'family';
  start: string;
  durationMin: number;
}

const SUNDAY = 0;

/** The coming Monday — next week starts there, whatever day it is now. */
export function nextWeekStart(today: string): string {
  const day = dateKeyToDate(today).getDay();
  const untilMonday = day === SUNDAY ? 1 : (8 - day) % 7 || 7;
  return addDays(today, untilMonday);
}

/** Next Sunday evening, when the check-in lives. Today if today is Sunday. */
export function nextCheckinDate(today: string): string {
  const day = dateKeyToDate(today).getDay();
  return day === SUNDAY ? today : addDays(today, 7 - day);
}

const clean = (s: string | undefined): string => (s ?? '').trim();

/**
 * What the answers put on next week's plan.
 *
 * The swap goes on Monday evening, because a swap that is not said out
 * loud at the start of the week is still the old arrangement by Tuesday.
 * The need goes mid-week with the partner's name on it, so it is a thing
 * the person does rather than a thing they meant to.
 */
export function checkinPlanItems(
  answers: CheckinAnswers,
  today: string,
  partnerName?: string,
): CheckinPlanItem[] {
  const monday = nextWeekStart(today);
  const items: CheckinPlanItem[] = [];
  const swap = clean(answers.swap);
  if (swap) {
    items.push({
      date: monday,
      title: `Swap this week: ${swap}`,
      area: 'family',
      start: '19:00',
      durationMin: 10,
    });
  }
  const need = clean(answers.need);
  if (need) {
    items.push({
      date: addDays(monday, 2),
      title: `For ${partnerName || 'them'}: ${need}`,
      area: 'relationship',
      start: '19:30',
      durationMin: 30,
    });
  }
  return items;
}

/** The check-in as a message — short enough that the other person reads it. */
export function checkinShareText(answers: CheckinAnswers, partnerName?: string): string {
  const lines: string[] = [];
  const keep = clean(answers.keep);
  const swap = clean(answers.swap);
  const need = clean(answers.need);
  if (keep) lines.push(`Keeping: ${keep}`);
  if (swap) lines.push(`Swapping: ${swap}`);
  if (need) lines.push(`You asked for: ${need} — it is on my week.`);
  if (lines.length === 0) return '';
  const opener = partnerName ? `Our check-in, ${partnerName}:` : 'Our check-in:';
  return `${opener}\n${lines.join('\n')}`;
}

export function checkinHasAnswers(answers: CheckinAnswers): boolean {
  return CHECKIN_QUESTIONS.some((q) => clean(answers[q.key]).length > 0);
}
