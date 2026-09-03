/**
 * Where a lift sits against everybody else's.
 *
 * The training ladder has always been gated on volume — sessions logged
 * and weeks they were spread across — which measures persistence and says
 * nothing about strength. Someone who has trained for years and lifts
 * genuinely heavy arrived at "foundation" and was handed a beginner's
 * programme, which is the "this is too easy" complaint at its root.
 *
 * WHAT THESE NUMBERS ARE. Ratios of estimated one-rep max to bodyweight,
 * approximating the population tables that lifting sites publish from
 * voluntary submissions. That is their whole provenance: self-selected
 * people who chose to enter a number. They are useful for saying "this is
 * roughly where you sit", and they are not clinical data, not normative,
 * and not a target anybody is failing to meet. The app bands with them and
 * never scores anyone against them.
 *
 * WHY SEX IS REQUIRED. The male and female tables differ by roughly a
 * third on upper-body lifts, which is more than the gap between two whole
 * bands. Guessing would put a woman one or two bands below where she
 * belongs and hand her a programme beneath her, or the reverse. So without
 * an answer this module returns nothing and the ladder falls back to
 * volume, which is the honest outcome rather than a compromise.
 */

import type { LifeProfile } from '@/types/domain';

export type StrengthLift = 'bench' | 'squat' | 'deadlift' | 'ohp';

export const STRENGTH_LIFTS: StrengthLift[] = ['bench', 'squat', 'deadlift', 'ohp'];

/**
 * Isaac's four bands. Deliberately the same four words people already use
 * about themselves, so the app's answer can be compared with their own.
 */
export type StrengthBand = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export const BAND_ORDER: StrengthBand[] = ['beginner', 'intermediate', 'advanced', 'elite'];

export const bandRank = (b: StrengthBand): number => BAND_ORDER.indexOf(b);

export const BAND_LABEL: Record<StrengthBand, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
};

/** e1RM ÷ bodyweight needed to reach each band. Below the first is untrained. */
type BandRatios = Record<StrengthBand, number>;

const MALE: Record<StrengthLift, BandRatios> = {
  bench: { beginner: 0.75, intermediate: 1.0, advanced: 1.5, elite: 2.0 },
  squat: { beginner: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
  deadlift: { beginner: 1.25, intermediate: 1.75, advanced: 2.5, elite: 3.0 },
  ohp: { beginner: 0.45, intermediate: 0.65, advanced: 0.9, elite: 1.15 },
};

const FEMALE: Record<StrengthLift, BandRatios> = {
  bench: { beginner: 0.4, intermediate: 0.6, advanced: 0.9, elite: 1.25 },
  squat: { beginner: 0.7, intermediate: 1.1, advanced: 1.6, elite: 2.0 },
  deadlift: { beginner: 0.9, intermediate: 1.3, advanced: 1.9, elite: 2.4 },
  ohp: { beginner: 0.3, intermediate: 0.45, advanced: 0.6, elite: 0.8 },
};

/**
 * A coarse allowance for age, and labelled coarse on purpose.
 *
 * The published tables are dominated by people in their twenties and
 * thirties. Applied flat, a sixty-year-old who trains hard is banded
 * "beginner" permanently, which is both wrong and the most demotivating
 * thing the app could tell him. One percent per year over forty, capped at
 * thirty, is a round number chosen to be roughly right rather than a curve
 * fitted to data that would need to exist first.
 */
export function ageAllowance(age?: number): number {
  if (!age || age <= 40) return 1;
  return 1 - Math.min(0.3, (age - 40) * 0.01);
}

/**
 * The band one lift sits in, or null when the inputs cannot support an
 * answer — no bodyweight, or no sex to pick a table with.
 */
export function bandForLift(
  lift: StrengthLift,
  e1rmKg: number,
  profile: Pick<LifeProfile, 'weightKg' | 'sexAtBirth' | 'age'>,
): StrengthBand | null {
  const { weightKg, sexAtBirth, age } = profile;
  if (!weightKg || weightKg <= 0 || e1rmKg <= 0) return null;
  if (sexAtBirth !== 'male' && sexAtBirth !== 'female') return null;

  const table = (sexAtBirth === 'female' ? FEMALE : MALE)[lift];
  const ratio = e1rmKg / weightKg;
  const allowance = ageAllowance(age);

  let band: StrengthBand | null = null;
  for (const candidate of BAND_ORDER) {
    if (ratio >= table[candidate] * allowance) band = candidate;
    else break;
  }
  return band;
}

/**
 * One band from several lifts.
 *
 * The middle, not the best. A single strong deadlift is common in people
 * whose pressing is untrained, and programming them as advanced across the
 * board on the strength of it is how someone gets hurt. Taking the lower
 * of the two middle values keeps one outlier from carrying the answer
 * while still letting genuine all-round strength through.
 */
export function overallBand(bands: (StrengthBand | null)[]): StrengthBand | null {
  const known = bands.filter((b): b is StrengthBand => b !== null);
  if (known.length === 0) return null;
  const sorted = [...known].sort((a, b) => bandRank(a) - bandRank(b));
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** The latest e1RM observed for each lift, from the metrics stream. */
export interface LiftMaxes {
  bench?: number;
  squat?: number;
  deadlift?: number;
  ohp?: number;
}

export const metricKeyFor = (lift: StrengthLift): string => `strength.${lift}.e1rm`;

/**
 * Band every lift there is a number for, then reduce to one.
 *
 * Returns nulls rather than guesses throughout: the caller needs to be
 * able to tell "not strong" from "not known", because those two call for
 * completely different behaviour and conflating them is what would put a
 * beginner's programme in front of an experienced lifter.
 */
export function assessStrength(
  maxes: LiftMaxes,
  profile: Pick<LifeProfile, 'weightKg' | 'sexAtBirth' | 'age'>,
): { band: StrengthBand | null; perLift: Partial<Record<StrengthLift, StrengthBand>> } {
  const perLift: Partial<Record<StrengthLift, StrengthBand>> = {};
  const bands: (StrengthBand | null)[] = [];
  for (const lift of STRENGTH_LIFTS) {
    const e1rm = maxes[lift];
    if (e1rm === undefined) continue;
    const band = bandForLift(lift, e1rm, profile);
    if (band) perLift[lift] = band;
    bands.push(band);
  }
  return { band: overallBand(bands), perLift };
}

/**
 * Whether the log itself proves the top rung, independent of how long the
 * person has been using the app.
 *
 * This is the evidence the forty-week wait was a proxy for. Someone
 * already lifting at the advanced standard does not need ten months of
 * app history to be programmed for it.
 */
export function meetsAdvancedStandard(
  maxes: LiftMaxes,
  profile: Pick<LifeProfile, 'weightKg' | 'sexAtBirth' | 'age'>,
): boolean {
  const { band } = assessStrength(maxes, profile);
  return band !== null && bandRank(band) >= bandRank('advanced');
}
