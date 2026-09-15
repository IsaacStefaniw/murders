/**
 * Where a lift sits against everybody else's.
 *
 * The training ladder has always been gated on volume — sessions logged
 * and weeks they were spread across — which measures persistence and says
 * nothing about strength. Someone who has trained for years and lifts
 * genuinely heavy arrived at "foundation" and was handed a beginner's
 * programme, which is the "this is too easy" complaint at its root.
 *
 * WHAT THESE NUMBERS ARE, AND WHO THEY COMPARE YOU TO. Ratios of estimated
 * one-rep max to bodyweight, approximating the tables lifting sites publish
 * from voluntary submissions. That is their whole provenance: self-selected
 * people who lift and chose to type a number in. They are useful for saying
 * "this is roughly where you sit AMONG PEOPLE WHO TRAIN", and they are not
 * clinical data, not normative, and not a target anybody is failing to meet.
 *
 * THE COMPARISON CLASS IS THE WHOLE POINT, AND THE APP USED TO HIDE IT.
 * A screen that prints "Beginner" over a 130 kg bench is not wrong about
 * the arithmetic; it is silent about the question "against whom", and the
 * reader supplies the worst answer. Against people who train, 1.5× is the
 * advanced bar. Against adults in general, roughly 1.0× bench is the median
 * man in his twenties or thirties, about 1.25× is near the ninetieth
 * percentile, and 1.75× is close to the ninety-ninth — so our "advanced"
 * bar sits inside the middle 50% of competitive powerlifters while most
 * adult men cannot press their own bodyweight once.
 *
 * Both comparisons are legitimate and they answer different questions. The
 * app now names which one it is making, every time it makes one.
 *
 * The general-population figures above are quoted for men only, and that is
 * a gap rather than a choice: the sources for women disagree with each
 * other by a factor of two and all of them trace back to the same lifting
 * culture rather than to population testing. Inventing the female number to
 * make the feature symmetrical would be worse than saying it is missing.
 *
 * WHY SEX IS REQUIRED. The male and female tables differ by roughly a
 * third on upper-body lifts, which is more than the gap between two whole
 * bands. Guessing would put a woman one or two bands below where she
 * belongs and hand her a programme beneath her, or the reverse. So without
 * an answer this module returns nothing and the ladder falls back to
 * volume, which is the honest outcome rather than a compromise.
 */

import type { LifeProfile } from '@/types/domain';
import { ageOf } from '@/features/health/age';
import { todayKey } from '@/lib/dates';

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
 * One band from several lifts — for PROGRAMMING, not for telling somebody
 * who they are.
 *
 * The middle, not the best. A single strong deadlift is common in people
 * whose pressing is untrained, and programming them as advanced across the
 * board on the strength of it is how someone gets hurt. Taking the lower
 * of the two middle values keeps one outlier from carrying the answer
 * while still letting genuine all-round strength through.
 *
 * That is right for choosing loads and wrong for a headline, and the hub
 * used it for both. Isaac benches 130 kg, squats 120 and deadlifts 140 —
 * a press-dominant profile with legs behind it — and the middle of those
 * three is the bottom band, so the app called a man with a 130 kg bench a
 * beginner. Nobody who benches 130 kg is a beginner at lifting. They are
 * experienced with lagging legs, which is a different sentence and a more
 * useful one.
 *
 * So this stays as it is and `strengthProfile` below is what the screen
 * reads instead.
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

/* ── What the screen says, as opposed to what the programme uses ──────── */

export const LIFT_NAME: Record<StrengthLift, string> = {
  bench: 'bench',
  squat: 'squat',
  deadlift: 'deadlift',
  ohp: 'overhead press',
};

export interface StrengthProfile {
  /** Each lift there is a number for, strongest first. */
  lifts: {
    lift: StrengthLift;
    band: StrengthBand;
    ratio: number;
    /** The lift described rather than the person graded. */
    context: LiftContext | null;
  }[];
  strongest: StrengthBand | null;
  weakest: StrengthBand | null;
  /** True where every banded lift sits in the same band. */
  even: boolean;
  /** The headline. Never one word for an uneven profile. */
  headline: string;
  /** The coaching sentence under it. */
  detail: string;
}

const list = (names: string[]): string =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/**
 * The person's strength as a shape rather than a score.
 *
 * The hub used to print one word — the median band — over the caption
 * "from the middle of your bench, squat, deadlift". For anybody whose
 * lifts are uneven that word is the lowest one, and the lowest word for a
 * man benching 130 kg was "Beginner".
 *
 * An uneven profile is the normal case, not an edge case, and naming the
 * imbalance is the more useful thing to say: it is what a coach would lead
 * with and it points at what to train next. So an even profile gets its
 * band as the headline and an uneven one gets its shape.
 */
export function strengthProfile(
  maxes: LiftMaxes,
  profile: Pick<LifeProfile, 'weightKg' | 'sexAtBirth' | 'age'>,
): StrengthProfile {
  const weightKg = profile.weightKg ?? 0;
  const lifts = STRENGTH_LIFTS.flatMap((lift) => {
    const e1rm = maxes[lift];
    if (e1rm === undefined || weightKg <= 0) return [];
    const band = bandForLift(lift, e1rm, profile);
    return band
      ? [{ lift, band, ratio: e1rm / weightKg, context: liftContext(lift, e1rm, profile) }]
      : [];
  }).sort((a, b) => bandRank(b.band) - bandRank(a.band) || b.ratio - a.ratio);

  if (lifts.length === 0) {
    return {
      lifts, strongest: null, weakest: null, even: true,
      headline: 'Not enough to say yet',
      detail: 'Log a main lift and IntentNorth can place it.',
    };
  }

  const strongest = lifts[0].band;
  const weakest = lifts[lifts.length - 1].band;
  const even = strongest === weakest;

  if (even) {
    return {
      lifts, strongest, weakest, even,
      headline: BAND_LABEL[strongest],
      detail:
        lifts.length === 1
          ? `Your ${LIFT_NAME[lifts[0].lift]}, relative to bodyweight.`
          : `All ${lifts.length} of your main lifts sit here, relative to bodyweight.`,
    };
  }

  const ahead = lifts.filter((l) => l.band === strongest).map((l) => LIFT_NAME[l.lift]);
  const behind = lifts.filter((l) => l.band === weakest).map((l) => LIFT_NAME[l.lift]);

  /*
    Where a general-population reading exists, it leads.

    "Intermediate bench" is a true sentence about a room of powerlifters
    and it is not the question anybody is asking. A 130 kg bench at 88 kg
    is 1.48× — two hundredths under our "advanced" bar, and the top tenth
    of men. Leading with the band buries the meaningful half.
  */
  // No headline verdict. The strongest lift is named, and the reading is
  // left to the per-lift lines, which describe rather than grade.
  const top = lifts[0];
  const general = `Your ${LIFT_NAME[top.lift]} is your strongest lift`;

  return {
    lifts, strongest, weakest, even,
    headline: general ?? `${BAND_LABEL[strongest]} ${list(ahead)}`,
    detail: `Your ${list(ahead)} ${ahead.length > 1 ? 'are' : 'is'} ahead of your ${list(behind)}, relative to bodyweight. That gap is the thing worth training, not a verdict on you — an uneven profile is the normal one.`,
  };
}

/** Who the bands compare somebody to. Shown wherever a band is shown. */
export const COMPARISON_CLASS = 'among people who train and log their lifts';

/**
 * Retired: superseded by `populationPlace`.
 *
 * This was a bench-only, men-only sentence bolted onto a scale that still
 * described a gym. The scale itself was the problem, so the sentence went
 * with it.
 */


/* ── Where a lift sits, said only as far as the evidence goes ────────── */

/**
 * WHY THERE IS NO PERCENTILE HERE, AND WHY THERE WILL NOT BE ONE.
 *
 * Three attempts at this were wrong in the same direction, each time by
 * failing to interrogate the reference class.
 *
 * First the screen printed the MEDIAN band over an uneven profile, so a
 * 130 kg bench came out "Beginner". Then it named the comparison class but
 * kept a scale whose bottom rung is a trained novice. Then it built a
 * percentile on top of that scale, using the untrained row as an anchor --
 * and that row is itself a lifting-table construct meaning "an untrained
 * person about to start a barbell programme who has been shown the
 * movement", not a man of forty-five who has never held a barbell and
 * could not perform a competent squat at all.
 *
 * The honest finding is that the data does not exist. Nobody has one-rep-
 * max tested a representative sample of adults on these lifts and nobody
 * is going to, because you cannot max-test people who have never trained.
 * EVERY figure available comes from people who lift and chose to record
 * it. A percentile against the general population would therefore be
 * invented, however carefully, and the app does not invent numbers.
 *
 * What IS measured is who trains at all, and that is stated below. It is
 * enough to place somebody honestly without a decimal place.
 */

/**
 * Australians aged 18-64 NOT doing the recommended two days a week of
 * muscle-strengthening activity, by sex. AIHW, 2022.
 *
 * A representative national survey rather than a self-selected sample,
 * which is what makes it usable where the lifting tables are not.
 * Non-compliance rises further with age.
 */
export const NOT_STRENGTH_TRAINING = { male: 0.71, female: 0.76 } as const;

/**
 * The marks, named by position rather than by a word about a person.
 *
 * "Past the beginner mark" still contains the word that started all of
 * this. A lifter's table has four bars on it; calling them the first,
 * second, third and top places a lift precisely and labels nobody.
 */
export const MARK_LABEL: Record<StrengthBand, string> = {
  beginner: 'first',
  intermediate: 'second',
  advanced: 'third',
  elite: 'top',
};

export interface LiftContext {
  ratio: number;
  /** The threshold just cleared, and the next one, in lifters' terms. */
  passed: StrengthBand | null;
  next: { band: StrengthBand; ratio: number } | null;
  /** What the screen says. No verdict on the person. */
  line: string;
}

/**
 * One lift, described rather than graded.
 *
 * States the ratio, which threshold it has passed among people who lift,
 * and what the next one is — so the number is placed without anybody being
 * labelled. "Past the intermediate mark for trained lifters" is a fact
 * about a lift. "Beginner" was a word about a person.
 */
export function liftContext(
  lift: StrengthLift,
  e1rmKg: number,
  profile: Pick<LifeProfile, 'weightKg' | 'sexAtBirth' | 'age'>,
): LiftContext | null {
  const { weightKg, sexAtBirth } = profile;
  if (!weightKg || weightKg <= 0 || e1rmKg <= 0) return null;
  if (sexAtBirth !== 'male' && sexAtBirth !== 'female') return null;

  const table = (sexAtBirth === 'female' ? FEMALE : MALE)[lift];
  const allowance = ageAllowance(ageOf(profile, todayKey()));
  const ratio = e1rmKg / weightKg;

  let passed: StrengthBand | null = null;
  let next: { band: StrengthBand; ratio: number } | null = null;
  for (const band of BAND_ORDER) {
    const bar = table[band] * allowance;
    if (ratio >= bar) passed = band;
    else {
      next = { band, ratio: bar };
      break;
    }
  }

  const line = passed
    ? `Past the ${MARK_LABEL[passed]} of four marks trained lifters are measured against` +
      (next ? `; the ${MARK_LABEL[next.band]} is ${next.ratio.toFixed(2)}×.` : ', which is the highest.')
    : next
      ? `Approaching the first of four marks trained lifters are measured against, which is ${next.ratio.toFixed(2)}×.`
      : '';

  return { ratio, passed, next, line };
}

/** The one thing about the general population that is actually measured. */
export function participationLine(profile: Pick<LifeProfile, 'sexAtBirth'>): string | null {
  const sex = profile.sexAtBirth;
  if (sex !== 'male' && sex !== 'female') return null;
  const pct = Math.round(NOT_STRENGTH_TRAINING[sex] * 100);
  const people = sex === 'female' ? 'women' : 'men';
  return `${pct}% of Australian ${people} aged 18–64 do no strength training twice a week, so the marks below describe a small, self-selected group rather than the population.`;
}
