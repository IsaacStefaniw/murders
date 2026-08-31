/**
 * Asking for the numbers the plan is built on.
 *
 * The goal composer drafts a `CheckinSpec` for every measurable goal — a
 * metric key, a cadence, and a one-line question. Those specs were shown
 * once on the review step of the goal wizard and then never again. Nothing
 * in the app asked. Which meant, for every goal whose progress is a number
 * a person has to supply:
 *
 *   no question → no observation → no evidence → the milestone never ticks,
 *   the trajectory says "not enough data" forever, and the Data tab stays
 *   empty no matter how well the person is actually doing.
 *
 * The whole measurement architecture was a closed circuit with the input
 * disconnected. This module is the input.
 *
 * Its job is as much about NOT asking. A daily form is how a life-tracking
 * app dies; three questions in a row is a form. So: one at a time, only
 * when genuinely due, never for something the phone already knows, and
 * silent for a fortnight after someone declines.
 */

import { latest, metricDef, type MetricObservation } from '@/features/model/metrics';
import type { CheckinSpec, Goal } from '@/types/domain';

/**
 * How long a dismissal lasts. Long enough that saying "not now" is a real
 * answer rather than a snooze that reappears tomorrow.
 */
export const DISMISS_DAYS = 14;

/** Grace before a cadence counts as overdue — a 7-day check-in on day 8 is fine. */
const GRACE_DAYS = 1;

export interface DueCheckin {
  goal: Goal;
  spec: CheckinSpec;
  /** Days since the last reading, or null when there has never been one. */
  daysSince: number | null;
  /** How far past the cadence, used only for ordering. */
  overdueBy: number;
  /** The last value, so the input can be pre-filled rather than blank. */
  lastValue: number | null;
  question: string;
}

const daysBetween = (from: string, to: Date) =>
  Math.floor((to.getTime() - new Date(from).getTime()) / 86400e3);

/**
 * The questions worth asking right now, most overdue first.
 *
 * Only `source: 'ask'` specs appear. A 'health' spec is answered by
 * HealthKit and a 'plan' spec is derived from completed sessions — asking
 * for either would be asking someone to type something the app already
 * knows, which is the fastest way to teach them that its questions are not
 * worth answering.
 */
export function dueCheckins(
  goals: Goal[],
  metrics: MetricObservation[],
  dismissedAt: Record<string, string> = {},
  now = new Date(),
): DueCheckin[] {
  const out: DueCheckin[] = [];

  for (const goal of goals) {
    if (goal.status !== 'active') continue;
    for (const spec of goal.checkins ?? []) {
      if (spec.source !== 'ask') continue;

      const dismissed = dismissedAt[spec.id];
      if (dismissed && daysBetween(dismissed, now) < DISMISS_DAYS) continue;

      const last = latest(metrics, spec.metricKey);
      const daysSince = last ? daysBetween(last.at, now) : null;

      // Never asked: due immediately — this is the reading everything else
      // waits on, and a goal with no baseline can never show a trajectory.
      const overdueBy =
        daysSince === null ? Number.MAX_SAFE_INTEGER : daysSince - spec.cadenceDays;
      if (daysSince !== null && daysSince < spec.cadenceDays - GRACE_DAYS) continue;

      out.push({
        goal,
        spec,
        daysSince,
        overdueBy,
        lastValue: last?.value ?? null,
        question: spec.prompt ?? `${spec.label}?`,
      });
    }
  }

  return out.sort((a, b) => b.overdueBy - a.overdueBy);
}

/**
 * The single question to put in front of someone today, or none.
 *
 * One. Not the list. A person who opens the app to see what to do next and
 * is met with three form fields closes it, and the honest way to gather a
 * fortnight of readings is a fortnight of single questions.
 */
export function nextCheckin(
  goals: Goal[],
  metrics: MetricObservation[],
  dismissedAt: Record<string, string> = {},
  now = new Date(),
): DueCheckin | null {
  return dueCheckins(goals, metrics, dismissedAt, now)[0] ?? null;
}

/** Unit and decimals for the input, from the metric definition where one exists. */
export function inputHintFor(spec: CheckinSpec): { unit: string; decimals: number } {
  const def = metricDef(spec.metricKey);
  return { unit: spec.unit ?? def?.unit ?? '', decimals: def?.decimals ?? 0 };
}

/**
 * A plain-words note on what this reading is for.
 *
 * People answer a question they understand the point of. "Feeds your
 * projection" is worth a sentence; a bare number field is not.
 */
export function whyAsking(due: DueCheckin): string {
  if (due.daysSince === null) {
    return 'First reading — everything else is measured from here.';
  }
  if (due.lastValue !== null) {
    const { unit } = inputHintFor(due.spec);
    return `Last time: ${due.lastValue}${unit ? ` ${unit}` : ''}, ${due.daysSince} days ago.`;
  }
  return `${due.daysSince} days since the last one.`;
}
