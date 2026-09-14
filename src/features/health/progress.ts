/**
 * Telling "you got healthier" apart from "we measured you better".
 *
 * Isaac asked for the questionnaire to give a day-one reading and then to
 * show improvements. The first half is `selfReport.ts`. This is the second
 * half, and it contains the one trap in the whole feature.
 *
 * ── THE TRAP ────────────────────────────────────────────────────────────
 *
 * Somebody answers two questions at signup and gets 48. A fortnight later
 * they buy a dynamometer, do the four tests, and the figure reads 43.
 *
 * Nothing about them changed. They did not get five years younger in a
 * fortnight. The number moved because the instrument stopped guessing —
 * the self-reported walking pace was replaced by a measured gait speed,
 * and three components that had been blank now have values. That is better
 * knowledge, and reporting it as "you improved by 5 years" would be a lie
 * the person has no way of catching.
 *
 * It would also be a lie with a particular shape: flattering, arriving
 * early, and caused entirely by the user doing something the app asked
 * them to do. That is the exact structure of a metric designed to make
 * people feel good rather than to tell them anything, and it is what the
 * whole instrument exists to not be.
 *
 * ── SO EVERY MOVEMENT IS ATTRIBUTED ─────────────────────────────────────
 *
 * Between any two readings, each component moved for exactly one of three
 * reasons, and they are kept separate all the way to the screen:
 *
 *  - SHARPER — it was blank and now has a value, or it was asked and is
 *    now measured. The instrument knows more. This is NOT improvement and
 *    is never reported as such.
 *  - CHANGED — same component, same kind of measurement, different value.
 *    A grip that went from 38 kg to 43 kg. THIS is the only thing that may
 *    be called improvement.
 *  - LOST — it had a value and no longer does. Rare, and worth showing
 *    rather than silently widening the interval.
 *
 * The headline movement is then split into years-from-real-change and
 * years-from-better-measurement, which add up to the total. A person can
 * see both, and only the first is ever congratulated.
 *
 * ── WHY THIS IS ALSO THE BETTER PRODUCT ─────────────────────────────────
 *
 * "You are 2 years better on the markers, and 3 years of the move is just
 * us knowing more" is a sentence almost no health app would write. It is
 * also the sentence that makes the 2 believable. An app that has visibly
 * refused to take credit for the 3 has earned the right to be believed
 * about the 2.
 */

import {
  ATTENUATION,
  MRDT_YEARS,
  type PaceComponent,
  type PaceReading,
} from '@/features/health/pace';

const YEARS_PER_LOG_HAZARD = MRDT_YEARS / Math.LN2;

export type MovementKind = 'sharper' | 'changed' | 'lost';

export interface ComponentMovement {
  id: string;
  label: string;
  kind: MovementKind;
  /** Years the headline moved because of this component. Negative is better. */
  years: number;
  /** What happened, in the person's terms. */
  detail: string;
  /** True only where this was a genuine change in the person. */
  real: boolean;
}

export interface PaceProgress {
  movements: ComponentMovement[];
  /** Years of movement attributable to the person actually changing. */
  yearsFromChange: number;
  /** Years of movement attributable to the instrument knowing more. */
  yearsFromMeasurement: number;
  /** Markers read before and after. */
  coverageBefore: number;
  coverageAfter: number;
  /** The one sentence, written so it cannot take credit it has not earned. */
  headline: string;
}

/**
 * Compare two readings and attribute every year of movement.
 *
 * Order matters: `before` is the earlier reading. Passing them the wrong
 * way round produces a mirror image rather than an error, which is why the
 * caller should be reading from a dated series.
 */
export function paceProgress(before: PaceReading, after: PaceReading): PaceProgress {
  const byId = new Map(before.components.map((c) => [c.id, c]));
  const movements: ComponentMovement[] = [];

  for (const now of after.components) {
    const then = byId.get(now.id);
    if (!then) continue;
    const movement = classify(then, now);
    if (movement) movements.push(movement);
  }

  const yearsFromChange = movements
    .filter((m) => m.real)
    .reduce((sum, m) => sum + m.years, 0);
  const yearsFromMeasurement = movements
    .filter((m) => !m.real)
    .reduce((sum, m) => sum + m.years, 0);

  return {
    movements,
    yearsFromChange,
    yearsFromMeasurement,
    coverageBefore: before.coverage.observed,
    coverageAfter: after.coverage.observed,
    headline: headlineFor(
      yearsFromChange,
      yearsFromMeasurement,
      before.coverage.observed,
      after.coverage.observed,
    ),
  };
}

function classify(then: PaceComponent, now: PaceComponent): ComponentMovement | null {
  const years = yearsOf((now.logHazard ?? 0) - (then.logHazard ?? 0));

  if (then.logHazard === null && now.logHazard !== null) {
    return {
      id: now.id,
      label: now.label,
      kind: 'sharper',
      years,
      detail: `Measured for the first time — ${now.detail}.`,
      real: false,
    };
  }

  if (then.logHazard !== null && now.logHazard === null) {
    return {
      id: now.id,
      label: now.label,
      kind: 'lost',
      years,
      detail: 'No longer readable.',
      real: false,
    };
  }

  if (then.logHazard === null && now.logHazard === null) return null;

  // Asked, then measured. The value almost always moves, and none of that
  // movement is the person.
  if (then.source === 'self-reported' && now.source === 'measured') {
    return {
      id: now.id,
      label: now.label,
      kind: 'sharper',
      years,
      detail: `Measured rather than estimated — ${now.detail}.`,
      real: false,
    };
  }

  // Same component, same kind of reading, different number. The only case
  // that is allowed to be called improvement.
  if (Math.abs(years) < 0.05) return null;
  return {
    id: now.id,
    label: now.label,
    kind: 'changed',
    years,
    detail: `${then.detail} → ${now.detail}.`,
    real: true,
  };
}

function yearsOf(logHazardDelta: number): number {
  return logHazardDelta * ATTENUATION * YEARS_PER_LOG_HAZARD;
}

/**
 * The sentence.
 *
 * Written to be unable to overstate: measurement movement is always named
 * when it exists, and where the only movement is measurement the copy says
 * so outright rather than letting a smaller number imply progress.
 *
 * The coverage case is subtle and was found by a test. Somebody can add
 * two markers that both read at their reference level: the figure does not
 * move at all, so the naive answer is "nothing has moved" — which is true
 * about the number and wrong about the reading, because the interval just
 * got tighter. Measuring more and finding nothing wrong IS a result, and
 * a person who has just done four tests deserves to be told what they
 * bought rather than "nothing".
 */
function headlineFor(
  change: number,
  measurement: number,
  coverageBefore: number,
  coverageAfter: number,
): string {
  const real = round1(change);
  const meas = round1(measurement);
  const moreMarkers = coverageAfter - coverageBefore;

  if (real === 0 && meas === 0) {
    if (moreMarkers > 0) {
      return (
        `Your markers have not moved. You have measured ${moreMarkers} more of ` +
        `them though, and they came back where they should be — same figure, ` +
        `tighter margin around it.`
      );
    }
    if (moreMarkers < 0) {
      return `Your markers have not moved, but ${Math.abs(moreMarkers)} are no longer readable, so the margin has widened.`;
    }
    return 'Nothing has moved.';
  }

  if (real === 0) {
    return (
      `Your markers have not moved. The figure shifted ${Math.abs(meas)} ` +
      `${plural(Math.abs(meas))} because we can see more of them, which is ` +
      `not the same thing.`
    );
  }

  const direction = real < 0 ? 'better' : 'worse';
  const core = `${Math.abs(real)} ${plural(Math.abs(real))} ${direction} on the markers themselves.`;
  if (meas === 0) return core;
  return (
    `${core} A further ${Math.abs(meas)} ${plural(Math.abs(meas))} of the ` +
    `change is us knowing more rather than you being different.`
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function plural(n: number): string {
  return n === 1 ? 'year' : 'years';
}
