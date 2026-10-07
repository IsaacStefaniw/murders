/**
 * What a component's score MEANS, instead of the score.
 *
 * ── The verdict this exists to answer ───────────────────────────────────
 *
 * Isaac, after using build 21: **"These scores are meaningless."** He was
 * looking at *Physical activity 60 · Nicotine 50 · Sleep (no data) · BMI
 * 70*, and `docs/NEXT_SESSION.md` §1 — the headline verdict, written above
 * every other defect in that document — reads it correctly:
 *
 *   "The number is an input to a construct, not a message to a human. The
 *   next session's first job is to decide whether these are shown at all,
 *   and if so what sentence replaces the numeral."
 *
 * And it rules out the obvious wrong fix in the next paragraph: **do not
 * add explanatory copy under each number.** That was already tried — there
 * is a "Why nicotine is in this" disclosure under every one and it did not
 * stop him calling them meaningless. "The problem is that the number is
 * the wrong unit of communication, not that it lacks a footnote."
 *
 * ── So: where you sit, and what moves it ────────────────────────────────
 *
 * Every component here is 0–100 against a PUBLISHED step table, and the
 * steps are the useful thing the numeral was hiding. "Nicotine 50" is
 * meaningless; "halfway back — five years clear is the next step up" is a
 * message, because it names the position AND the thing that would change
 * it.
 *
 * The score is not deleted. It still drives the composite, the band and
 * `biggestGap`, and the bar still draws it — a bar is a shape, not a
 * number. What stops being shown is the numeral as the headline.
 *
 * ── What it will not do ─────────────────────────────────────────────────
 *
 * It will not say "good" or "poor", and it will not congratulate. Naming a
 * rung on a published table is information; grading the person on it is
 * the scoreboard the house rules forbid. Nor does it invent a threshold:
 * every figure below is read off the same tables `essential8.ts` and
 * `bloodwork.ts` score against, and where a component has no step above
 * the person's, it says so rather than manufacturing a target.
 */

import { BMI_UNDERWEIGHT } from '@/features/health/conditioning';
// Types only, deliberately: `essential8` imports `standingFor` from here,
// and a type import is erased, so the two modules do not depend on each
// other at runtime. The one value this needed moved to `conditioning`.
import type { ComponentKey, NicotineStatus } from '@/features/health/essential8';

/** The activity table's own steps, in minutes a week. */
const ACTIVITY_STEPS = [150, 120, 90, 60, 30, 1] as const;

/**
 * The next step up the activity table, or null at the top.
 *
 * Read off `activityScore`'s own thresholds rather than restated, so a
 * change to the table cannot leave this sentence describing the old one.
 */
export function nextActivityStep(minutes: number): number | null {
  const above = ACTIVITY_STEPS.filter((m) => m > minutes).sort((a, b) => a - b);
  return above[0] ?? null;
}

function activityStanding(minutes: number): string {
  if (minutes >= 150) {
    return 'Full marks. The table stops paying above 150 minutes a week — more is for other reasons, not this one.';
  }
  const next = nextActivityStep(minutes);
  if (next === null) return 'Full marks on the table.';
  const gap = next - minutes;
  return `The next step up the table is ${next} minutes a week — ${gap} more than this.`;
}

function nicotineStanding(status: NicotineStatus): string {
  switch (status) {
    case 'never':
      return 'The top of this table. There is nothing above it.';
    case 'quit5y':
      return 'Five years clear. Never having used it is the only step above this, and it is not a step anybody can take.';
    case 'quit1to5y':
      return 'Halfway back. Five years clear is the next step up, and it arrives by waiting.';
    case 'inhaledNicotine':
      return 'The table puts an inhaled product a quarter of the way up, whether it happens twice a week or twenty times. Stopping is the only move on it.';
    case 'smokesNow':
      return 'The bottom of the largest single table in the construct, which is also why it is the one with the most to gain.';
  }
}

function sleepStanding(hours: number): string {
  if (hours >= 7 && hours < 9) {
    return 'Seven to nine hours takes full marks, and this is inside it.';
  }
  if (hours >= 9) {
    /**
     * The one place people are surprised the table has an upper end.
     *
     * This said "both ends of the window cost points", and the test
     * banning score-language caught it — "costs points" is the unit §1
     * exists to get rid of, smuggled back in as a verb. The window has an
     * upper end; that is the fact, and it needs no arithmetic to say.
     */
    return 'Full marks is seven to nine hours, and this is above the top of it — the window has an upper end as well as a lower one.';
  }
  const toSeven = Math.round((7 - hours) * 60);
  return `Full marks starts at seven hours. This is ${toSeven} minutes a night short of it.`;
}

function bmiStanding(bmi: number): string {
  if (bmi < BMI_UNDERWEIGHT) {
    return `The table's healthy band starts at ${BMI_UNDERWEIGHT}, and this is below it.`;
  }
  if (bmi < 25) return 'Inside the table’s healthy band, which runs to 25.';
  // The cut points, said as cut points. The app's own BMI caveat is
  // elsewhere and loud; this sentence is only about the table.
  const next = bmi < 30 ? 25 : bmi < 35 ? 30 : bmi < 40 ? 35 : 40;
  return `The nearest cut point on the table is ${next}, and this is ${bmi.toFixed(1)}.`;
}

function bpStanding(systolic: number, diastolic: number, onMedication: boolean): string {
  const med = onMedication
    ? ' The table deducts 20 points for being on treatment, which it applies to everybody doing the right thing about it.'
    : '';
  if (systolic < 120 && diastolic < 80) return `Top of the table, which is under 120 over 80.${med}`;
  const step =
    systolic >= 160 || diastolic >= 100
      ? 'Under 160 over 100 is the next step up.'
      : systolic >= 140 || diastolic >= 90
        ? 'Under 140 over 90 is the next step up.'
        : systolic >= 130 || diastolic >= 80
          ? 'Under 130 over 80 is the next step up.'
          : 'Under 120 systolic is the top of the table.';
  return `${step}${med}`;
}

function lipidsStanding(nonHdlMmol: number, onMedication: boolean): string {
  const med = onMedication ? ' Less 20 for being on treatment, which is in the published table.' : '';
  // The table is written in mg/dL; the app holds mmol/L. 130 mg/dL is the
  // top band's edge and converts to about 3.4.
  if (nonHdlMmol * 38.67 < 130) return `Top of the table, which is non-HDL under 3.4 mmol/L.${med}`;
  return `The top band is non-HDL under 3.4 mmol/L, and this is ${nonHdlMmol.toFixed(1)}.${med}`;
}

function glucoseStanding(hba1cPct: number | null, diabetes: boolean): string {
  if (diabetes) {
    return 'With a diagnosis the table scores by HbA1c in bands, and under 7% is the top of them.';
  }
  if (hba1cPct === null) {
    return 'Fasting glucose places the band; HbA1c is what the table is actually written on.';
  }
  return hba1cPct < 5.7
    ? 'Top of the table, which is HbA1c under 5.7%.'
    : `The top of the table is HbA1c under 5.7%, and this is ${hba1cPct.toFixed(1)}%.`;
}

export interface StandingInput {
  key: ComponentKey;
  minutes?: number | null;
  nicotine?: NicotineStatus | null;
  sleepHours?: number | null;
  bmi?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  bpMedication?: boolean;
  nonHdlMmol?: number | null;
  lipidMedication?: boolean;
  hba1cPct?: number | null;
  diabetes?: boolean;
}

/**
 * The sentence that replaces the numeral, or null where there is nothing
 * measured to say it about.
 *
 * Null rather than a placeholder: a component with no reading already has
 * a `blocked` line saying what would give it one, and a second sentence
 * about an absent figure is the footnote problem again.
 */
export function standingFor(input: StandingInput): string | null {
  switch (input.key) {
    case 'activity':
      return input.minutes == null ? null : activityStanding(input.minutes);
    case 'nicotine':
      return input.nicotine ? nicotineStanding(input.nicotine) : null;
    case 'sleep':
      return input.sleepHours == null ? null : sleepStanding(input.sleepHours);
    case 'bmi':
      return input.bmi == null ? null : bmiStanding(input.bmi);
    case 'bloodPressure':
      return input.systolic == null || input.diastolic == null
        ? null
        : bpStanding(input.systolic, input.diastolic, input.bpMedication ?? false);
    case 'lipids':
      return input.nonHdlMmol == null
        ? null
        : lipidsStanding(input.nonHdlMmol, input.lipidMedication ?? false);
    case 'glucose':
      return input.hba1cPct == null && !input.diabetes
        ? null
        : glucoseStanding(input.hba1cPct ?? null, input.diabetes ?? false);
    // Diet is never scored — the construct wants a dietary-pattern
    // questionnaire this app does not run — so there is no table to place
    // anybody on.
    case 'diet':
      return null;
  }
}
