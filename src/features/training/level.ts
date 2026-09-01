/**
 * Training level — the evidence half of the ladder in features/paths/level.
 *
 * The generic module decides how a claim and a log combine. This one
 * supplies the training-specific facts: how many sessions were logged,
 * across how many weeks, and whether the top rung's extra standard is met.
 *
 * That standard is deliberately NOT a population strength table. We do not
 * ask anyone's sex, and applying one sex's numbers to everybody would make
 * the gate wrong for half the people it judges — quietly, in a direction
 * they would have no way to see. It is also the wrong question: what makes
 * top singles and an overreach week appropriate is training age, not
 * absolute load. A person who has been under a bar long enough for us to
 * have watched several lifts improve has that training age. A person who
 * is simply heavy does not.
 *
 * So the standard is: baselines on most of the main lifts, and measured
 * improvement on more than one of them over a real stretch of time. It is
 * evidence we actually hold, about this person, and it means the same
 * thing for everybody.
 */

import { type MetricObservation } from '@/features/model/metrics';
import { distinctWeeks, type LevelEvidence } from '@/features/paths/level';
import type { WorkoutLog } from '@/types/domain';

import { LIFT_METRIC, type MainLift } from './log';

/** Main lifts with a baseline required before the top rung is considered. */
const LIFTS_WITH_BASELINE_REQUIRED = 3;
/** Lifts that must show measured improvement. */
const LIFTS_IMPROVED_REQUIRED = 2;
/** Improvement has to span this long — a fortnight of novice gains is not training age. */
const MIN_IMPROVEMENT_SPAN_DAYS = 56;
/** Below this the change is measurement noise, not progress. */
const MEANINGFUL_KG = 2.5;

interface LiftHistory {
  lift: MainLift;
  first: MetricObservation;
  last: MetricObservation;
  spanDays: number;
}

function historyFor(metrics: MetricObservation[], lift: MainLift): LiftHistory | null {
  const own = metrics
    .filter((o) => o.key === LIFT_METRIC[lift])
    .sort((a, b) => a.at.localeCompare(b.at));
  if (own.length === 0) return null;
  const first = own[0];
  const last = own[own.length - 1];
  return {
    lift,
    first,
    last,
    spanDays: Math.floor((Date.parse(last.at) - Date.parse(first.at)) / 86400e3),
  };
}

/**
 * Whether the training-age standard is met, and the lifts that show it.
 * Returned together so the hub can say WHICH lifts earned it rather than
 * announcing an unexplained promotion.
 */
export function trainingStandard(metrics: MetricObservation[]): {
  met: boolean;
  baselined: MainLift[];
  improved: MainLift[];
} {
  const lifts: MainLift[] = ['bench', 'squat', 'deadlift', 'ohp'];
  const histories = lifts.map((l) => historyFor(metrics, l)).filter((h): h is LiftHistory => h !== null);
  const baselined = histories.map((h) => h.lift);
  const improved = histories
    .filter((h) => h.spanDays >= MIN_IMPROVEMENT_SPAN_DAYS && h.last.value - h.first.value >= MEANINGFUL_KG)
    .map((h) => h.lift);
  return {
    met: baselined.length >= LIFTS_WITH_BASELINE_REQUIRED && improved.length >= LIFTS_IMPROVED_REQUIRED,
    baselined,
    improved,
  };
}

/**
 * What the training log shows, in the shape the generic ladder reads.
 *
 * An empty session does not count. Opening the workout screen and closing
 * it again is not a session, and counting it would make the gate a measure
 * of curiosity rather than work.
 */
export function trainingEvidence(logs: WorkoutLog[], metrics: MetricObservation[]): LevelEvidence {
  const performed = logs.filter((l) => l.sets.length > 0);
  return {
    sessions: performed.length,
    weeks: distinctWeeks(performed.map((l) => l.date)),
    standardsMet: trainingStandard(metrics).met,
  };
}

/** The sentence the hub uses when the top rung is the only thing left. */
export const TRAINING_STANDARD_TEXT =
  'baselines on three main lifts and measured progress on two of them';
