/**
 * Training level — the evidence half of the ladder in features/paths/level.
 *
 * The generic module decides how a claim and a log combine. This one
 * supplies the training-specific facts: how many sessions were logged,
 * across how many weeks, and whether the top rung's extra standard is met.
 *
 * The standard used to reject population strength tables outright, on two
 * grounds. One has expired and one has not, and keeping them apart is the
 * whole design here.
 *
 * EXPIRED: that the app does not ask anyone's sex, so one sex's numbers
 * would be applied to everybody and the gate would be quietly wrong for
 * half the people it judged. The app asks now. Where it has an answer, the
 * table is legitimate; where it does not, features/training/standards
 * returns nothing and this falls back to what it always did.
 *
 * STILL TRUE: that what makes top singles and an overreach week
 * appropriate is training age, not absolute load. A person who has been
 * under a bar long enough for us to have watched several lifts improve has
 * that training age. A naturally strong beginner does not, and is exactly
 * who this protects.
 *
 * So the two now do different jobs. The strength band sets where somebody
 * STARTS, because arriving at "foundation" with a 200kg deadlift is the
 * complaint we set out to fix. The training-age standard still governs the
 * top rung, because that is where the risk is. Either can open the
 * advanced gate — but the gate behind it still asks for forty-eight
 * sessions across twenty weeks, so nobody reaches an overreach week on
 * their first day whatever they lift.
 */

import { type MetricObservation } from '@/features/model/metrics';
import { distinctWeeks, type LevelEvidence, type PathLevel } from '@/features/paths/level';
import type { LifeProfile, WorkoutLog } from '@/types/domain';

import {
  STRENGTH_LIFTS,
  assessStrength,
  meetsAdvancedStandard,
  metricKeyFor,
  type LiftMaxes,
  type StrengthBand,
} from './standards';

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
export function trainingEvidence(
  logs: WorkoutLog[],
  metrics: MetricObservation[],
  profile?: Pick<LifeProfile, 'weightKg' | 'sexAtBirth' | 'age'> | null,
): LevelEvidence {
  const performed = logs.filter((l) => l.sets.length > 0);
  return {
    sessions: performed.length,
    weeks: distinctWeeks(performed.map((l) => l.date)),
    // Either route. Watching two lifts climb over eight weeks proves
    // training age; lifting at the advanced standard proves the strength
    // that wait was a proxy for. Both still sit behind the volume gate.
    standardsMet:
      trainingStandard(metrics).met ||
      (profile ? meetsAdvancedStandard(latestMaxes(metrics), profile) : false),
  };
}

/** The most recent e1RM observed for each main lift. */
export function latestMaxes(metrics: MetricObservation[]): LiftMaxes {
  const out: LiftMaxes = {};
  for (const lift of STRENGTH_LIFTS) {
    const own = metrics
      .filter((o) => o.key === metricKeyFor(lift))
      .sort((a, b) => a.at.localeCompare(b.at));
    if (own.length > 0) out[lift] = own[own.length - 1].value;
  }
  return out;
}

/**
 * The rung this person's lifts justify starting at, or null when the app
 * cannot assess them. Never `advanced` — see measuredFloor.
 */
export function measuredTrainingLevel(
  metrics: MetricObservation[],
  profile?: Pick<LifeProfile, 'weightKg' | 'sexAtBirth' | 'age'> | null,
): PathLevel | null {
  if (!profile) return null;
  const { band } = assessStrength(latestMaxes(metrics), profile);
  if (!band) return null;
  return BAND_TO_LEVEL[band];
}

const BAND_TO_LEVEL: Record<StrengthBand, PathLevel> = {
  beginner: 'foundation',
  intermediate: 'developing',
  advanced: 'established',
  elite: 'established',
};

/** The sentence the hub uses when the top rung is the only thing left. */
export const TRAINING_STANDARD_TEXT =
  'baselines on three main lifts and measured progress on two of them';
