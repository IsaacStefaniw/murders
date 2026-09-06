/**
 * One person, the way the app makes them: the opening interview, the plan
 * review starting the paths the answers justify, Plus on unless a seam is
 * about the free tier. Shared by the six seam suites so each of them
 * starts from the same real store.
 */

import { grantedEntitlement } from '@/features/plus/entitlement';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { useAppStore } from '@/state/store';
import { addDays, todayKey, weekdayOf } from '@/lib/dates';
import type { InterviewAnswers } from '@/features/onboarding/script';
import type { Weekday } from '@/types/domain';

export const BASE_ANSWERS: InterviewAnswers = {
  name: 'Sam',
  priorities: ['health', 'work'],
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'morning',
  trainingDays: '3',
  capacity: 'steady',
  ambition: 'Get stronger',
};

/** Onboard from the interview and start every path the answers justify. */
export function onboard(extra: InterviewAnswers = {}, opts: { plus?: boolean } = {}) {
  useAppStore.getState().resetAll();
  const answers = { ...BASE_ANSWERS, ...extra };
  const built = buildLifeOperatingPlan(answers);
  if (opts.plus !== false) useAppStore.setState({ entitlement: grantedEntitlement() });
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
    answers,
  });
  for (const start of built.pathStarts) useAppStore.getState().startPath(start.id, start.answers);
  return built;
}

/** The next date on or after today that falls on this weekday. */
export function nextDateOn(day: Weekday): string {
  const today = todayKey();
  return addDays(today, (day - weekdayOf(today) + 7) % 7);
}

/** Let the persist middleware finish writing to the storage mock. */
export const flush = () => new Promise((r) => setTimeout(r, 0));

/** A local instant, so the same wall-clock time is meant in every zone. */
export const local = (y: number, m: number, d: number, h: number, min = 0) =>
  new Date(y, m - 1, d, h, min, 0, 0);

/** The same wall-clock hour on a day this many days back from now. */
export function daysAgoAt(days: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
