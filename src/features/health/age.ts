/**
 * How old somebody actually is, rather than which decade they said.
 *
 * ── The defect ──────────────────────────────────────────────────────────
 *
 * The interview asks "roughly which decade are you in?" and stores the
 * midpoint: 20s becomes 25, 40s becomes 45. That is a sensible thing to
 * ask in a chip list and a poor thing to compute with, and the app
 * computes with it in the one place where it matters most.
 *
 * `pace.ts` runs a Gompertz hazard model. Mortality risk rises roughly
 * exponentially with age, doubling about every eight years — so an age
 * that can be five years out in either direction is a hazard that can be
 * out by a factor of about 1.5 before any of the measured components are
 * considered. Every interval the pace reading publishes is computed on
 * that number. The fitness term is worse still: `fitnessLogHazard` reads
 * VO₂max against `50 - 0.35 * age`, so five years of error moves the
 * expected value by 1.75 ml/kg/min, which is a meaningful share of the
 * spread the whole term is trying to detect.
 *
 * The decade bucket also goes stale silently. Somebody who answers "40s"
 * at 49 is still 45 to this app three years later.
 *
 * ── The fix, and why it is a year rather than a date ────────────────────
 *
 * A birth year is one number, it never needs updating, and it is accurate
 * to within a year by construction — which takes the dominant term in the
 * marker error budget from ±5 years to ±1. A full birth date would take it
 * to zero and is a materially more sensitive thing to hold on a device
 * that promises nothing leaves the phone: a birth date plus a first name
 * is most of an identity, and a birth year is not. The remaining year of
 * error is worth that.
 *
 * The decade question stays for anyone who would rather not say, and is
 * skipped entirely once a year is given so nobody is asked twice.
 */

import type { LifeProfile } from '@/types/domain';

/** Older than the oldest verified human, or not yet born, is a typo. */
export const BIRTH_YEAR_MIN = 1900;

/** Nothing here is built for children, and the tables are adult tables. */
export const MIN_AGE = 13;

export function birthYearRange(today: string): { min: number; max: number } {
  const year = Number(today.slice(0, 4));
  return { min: BIRTH_YEAR_MIN, max: year - MIN_AGE };
}

export function isPlausibleBirthYear(year: number, today: string): boolean {
  const { min, max } = birthYearRange(today);
  return Number.isInteger(year) && year >= min && year <= max;
}

/**
 * The age to compute with.
 *
 * A birth year wins outright, and is recomputed from today rather than
 * stored, so it is right on the day after a birthday without anybody
 * having told the app. The decade midpoint is the fallback, and absent is
 * a supported answer that everything downstream already handles by not
 * rendering.
 */
export function ageOf(
  profile: Pick<LifeProfile, 'age' | 'birthYear'> | null | undefined,
  today: string,
): number | undefined {
  if (!profile) return undefined;
  if (profile.birthYear != null && isPlausibleBirthYear(profile.birthYear, today)) {
    return Number(today.slice(0, 4)) - profile.birthYear;
  }
  return profile.age;
}

/**
 * How much the age is trusted, for anything that publishes an interval.
 *
 * `pace.ts` already says out loud what each component's evidence is and is
 * not; this is the same courtesy for the input every component is computed
 * against. Half a year of expected error from a birth year — the person is
 * somewhere in their birth year — against five from a decade bucket.
 */
export interface AgePrecision {
  source: 'birthYear' | 'decade' | 'none';
  /** Expected error in years, either side. */
  plusMinus: number | null;
  line: string | null;
}

export function agePrecision(
  profile: Pick<LifeProfile, 'age' | 'birthYear'> | null | undefined,
  today: string,
): AgePrecision {
  if (profile?.birthYear != null && isPlausibleBirthYear(profile.birthYear, today)) {
    return { source: 'birthYear', plusMinus: 0.5, line: null };
  }
  if (profile?.age != null) {
    return {
      source: 'decade',
      plusMinus: 5,
      line: 'Your age is a decade rather than a year, which widens every interval below. A birth year narrows it.',
    };
  }
  return {
    source: 'none',
    plusMinus: null,
    line: 'Nothing here computes without an age.',
  };
}
