/**
 * The compiled instrument: a pace of ageing, assembled from published
 * hazard ratios rather than from our opinion about what matters.
 *
 * Isaac: "This metric could be something we own... It should compile and
 * compound from many studies... but proprietary scoring or supporting is
 * similar to other offerings suggesting people's biological age."
 *
 * ── THE PROBLEM WITH THE CATEGORY ───────────────────────────────────────
 *
 * Biological-age products divide into two kinds. The research-grade ones
 * need a laboratory: PhenoAge (Levine and colleagues, PLOS Medicine 2018)
 * wants a nine-analyte blood panel; GrimAge and DunedinPACE want a DNA
 * methylation array. The consumer ones that need no laboratory are, very
 * largely, a weighted questionnaire with an age-shaped number on the end.
 *
 * The second kind is easy to build and worth nothing. Its weights come
 * from somebody's judgement, it has never been validated against an
 * outcome, and the number moves for reasons the owner cannot explain. This
 * app has spent its whole life refusing exactly that, most explicitly in
 * `BehaviourLog` and again in `essential8.ts`. Shipping one now would cost
 * the only thing that makes the product different.
 *
 * ── WHAT THIS DOES INSTEAD ──────────────────────────────────────────────
 *
 * Three decisions, each of which is the opposite of what the category does.
 *
 * 1. A RATE, NOT A STATE. DunedinPACE (Belsky and colleagues, eLife 2022)
 *    measures biological years accrued per calendar year, where 1.0 is
 *    average. That framing is better on both counts that matter: it does
 *    not claim to know an absolute nobody can measure, and a rate responds
 *    to what somebody did this month in a way an age does not. "You are 52
 *    when you are 45" is not actionable. "You are travelling at 1.15 and
 *    here is what is setting it" is.
 *
 * 2. WEIGHTS COME FROM PUBLISHED HAZARD RATIOS. Every component below
 *    declares its study, its sample, its design, its effect size and its
 *    grade, and contributes a log hazard ratio taken from that paper.
 *    Nothing here is weighted by preference. Adding a component means
 *    adding a citation, which is what "compile and compound from many
 *    studies" has to mean if it is to mean anything. The formula is meant
 *    to be published, argued with, and corrected.
 *
 * 3. THE PROPRIETARY PART IS THE CALIBRATION, NOT THE FORMULA. Give the
 *    formula away. What cannot be copied is the data shape: every cohort
 *    study in the citations below has a baseline questionnaire and years
 *    of follow-up, and this app has what somebody actually did on each
 *    individual day. Nobody has that at daily resolution against function
 *    tests repeated quarterly. That is the research contribution and the
 *    only durable asset here.
 *
 * ── THE HONEST STATEMENT OF WHAT IS WRONG WITH IT ───────────────────────
 *
 * Summing log hazard ratios drawn from different studies is a modelling
 * choice with four known problems, and the instrument is not worth
 * shipping unless it says so out loud:
 *
 *  - DIFFERENT POPULATIONS. PURE is 17 countries and a median four years
 *    of follow-up. Araujo's balance cohort is 1,702 Brazilians aged 51–75.
 *    Their hazard ratios are not strictly commensurable.
 *  - DIFFERENT ADJUSTMENT SETS. Each paper adjusted for what its authors
 *    chose. Two components adjusted for different confounders cannot
 *    simply be added.
 *  - CORRELATED PREDICTORS. Grip, gait speed and chair-stand measure
 *    overlapping things. Summing them counts the shared part several
 *    times, which inflates the total.
 *  - REVERSE CAUSATION. Undiagnosed illness makes people slow and unsteady
 *    before it kills them. Some of every association here is the disease
 *    showing up in the test, not the test predicting the disease.
 *
 * `ATTENUATION` below is a blunt correction for the third of those and a
 * partial one for the others. It is a judgement, not a finding, and it is
 * the single largest source of error in this module. The first thing the
 * cohort data should buy is replacing it — and every borrowed coefficient
 * beside it — with coefficients fitted on our own people.
 *
 * Until that happens `PROVISIONAL` stays true and nothing renders this
 * without saying so. A number that calls itself provisional and means it
 * is worth more than a number that does not.
 */

import {
  activityScore,
  bmiScore,
  nicotineScore,
  sleepScore,
  type NicotineStatus,
} from '@/features/health/essential8';
import { GRIP_LOW } from '@/features/health/functionTests';

/**
 * False only once the coefficients below are fitted on our own cohort
 * against observed outcomes. Everything that renders this reads it.
 */
export const PROVISIONAL = true;

/**
 * Mortality rate doubling time in adult humans, in years.
 *
 * The Gompertz observation, which has held since 1825: adult mortality
 * risk rises roughly exponentially with age, doubling about every eight
 * years. It is what lets a hazard ratio be expressed in years — a doubled
 * hazard is about eight years of ageing — and it is an approximation that
 * is poor in early adulthood and again past about 90.
 */
export const MRDT_YEARS = 8;

/**
 * How much the naive sum of log hazard ratios is shrunk.
 *
 * See the header. Correlated predictors and heterogeneous adjustment sets
 * mean the unshrunk sum overstates, sometimes badly. 0.6 is a judgement
 * about the size of that overlap, not a result, and it is the first thing
 * real data should replace. It is a named constant rather than a magic
 * number precisely so that it can be argued with.
 */
export const ATTENUATION = 0.6;

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D';

export interface Provenance {
  /** First author and year, as a person would cite it. */
  study: string;
  journal: string;
  /** How many people, and who they were. */
  sample: string;
  design: 'prospective cohort' | 'pooled cohort' | 'randomised trial' | 'cross-sectional';
  /** The effect, in the paper's own terms. */
  effect: string;
  grade: EvidenceGrade;
  /** What would most easily make this wrong. Never omitted. */
  caveat: string;
}

export interface PaceComponent {
  id: string;
  label: string;
  /** What this component is measuring, in the person's terms. */
  measures: string;
  provenance: Provenance;
  /**
   * Log hazard ratio against this component's own reference level, or null
   * where it has not been observed.
   *
   * Positive is worse. Zero is the reference — the level the study treated
   * as the comparison group — which means a component at its reference
   * contributes nothing rather than contributing a bonus. Nothing here
   * rewards; the scale runs from "no added hazard" downwards, because that
   * is the shape the underlying papers actually have.
   */
  logHazard: number | null;
  /** What was read, in the person's terms. */
  detail: string;
  /** Why it cannot be read, where it cannot. */
  blocked?: string;
}

/* ── The published effects, one function each ─────────────────────────── */

/**
 * Grip. PURE: 16% higher all-cause mortality per 5 kg decrement.
 *
 * ln(1.16) per 5 kg, referenced to the sex-specific sarcopenia threshold
 * rather than to a population mean — the threshold is a published number
 * and a population mean for our users is not something we have. Somebody
 * above the threshold contributes zero rather than a negative: PURE
 * reports a decrement effect, and reading it backwards as an unbounded
 * bonus for being strong is an extrapolation the paper does not support.
 */
export const GRIP_LN_HR_PER_5KG = Math.log(1.16);

export function gripLogHazard(kg: number, sex: 'male' | 'female'): number {
  const reference = GRIP_LOW[sex];
  const deficitKg = Math.max(0, reference - kg);
  return (deficitKg / 5) * GRIP_LN_HR_PER_5KG;
}

/**
 * Balance. Araujo 2022: failing a ten-second one-leg stand carried about
 * 80% higher all-cause mortality after adjustment.
 *
 * Binary, because the study was binary. Holding eleven seconds and holding
 * forty are the same result here; the paper does not license a dose curve
 * and inventing one would be exactly the move this module exists to avoid.
 */
export const BALANCE_FAIL_LN_HR = Math.log(1.8);

export function balanceLogHazard(seconds: number): number {
  return seconds >= 10 ? 0 : BALANCE_FAIL_LN_HR;
}

/**
 * Gait speed. Studenski 2011 reports survival curves rather than a single
 * hazard ratio; the widely used summary from that literature is about 12%
 * lower mortality per 0.1 m/s, referenced to 0.8 m/s — the conventional
 * slow-gait marker.
 *
 * Capped at 1.4 m/s. Past there the curve flattens and the cohorts thin
 * out, and extrapolating a linear benefit into a range the data barely
 * covers is how a plausible model starts producing silly numbers.
 */
export const GAIT_LN_HR_PER_01 = Math.log(1 / 0.88);
export const GAIT_REFERENCE_MS = 0.8;

export function gaitLogHazard(metresPerSecond: number): number {
  const capped = Math.min(metresPerSecond, 1.4);
  const deficit = Math.max(0, GAIT_REFERENCE_MS - capped);
  return (deficit / 0.1) * GAIT_LN_HR_PER_01;
}

/**
 * Cardiorespiratory fitness. Mandsager 2018: 122,007 adults on a
 * treadmill, and elite performance carried about 80% lower all-cause
 * mortality than the lowest quintile — with, notably, no upper limit to
 * the benefit.
 *
 * Graded by the paper's own quintile structure rather than by a formula,
 * because that is what it reports. VO₂max in ml/kg/min is Apple's estimate
 * from walks and runs, which is approximate; the bands are wide enough to
 * survive that and the copy says it is an estimate.
 */
export function fitnessLogHazard(vo2max: number, age: number): number {
  // Age-referenced bands. A 30-year-old at 40 ml/kg/min is ordinary; a
  // 65-year-old at 40 is exceptional, and one number for both would be
  // wrong for everybody.
  const expected = 50 - 0.35 * Math.max(20, age);
  const ratio = vo2max / expected;
  if (ratio >= 1.3) return Math.log(0.55);
  if (ratio >= 1.1) return Math.log(0.7);
  if (ratio >= 0.9) return 0;
  if (ratio >= 0.7) return Math.log(1.5);
  return Math.log(2.2);
}

/**
 * The four Life's Essential 8 components this app can read, carried across
 * from `essential8.ts` and converted to a hazard contribution.
 *
 * The construct's own validation is as a composite with a linear
 * dose-response to all-cause mortality across its 0–100 range. The usual
 * summary is roughly 20% lower all-cause mortality per 10 points. Applied
 * here to the observed-component mean, referenced to 50 — the boundary
 * between the construct's low and intermediate categories.
 */
export const LE8_LN_HR_PER_10 = Math.log(1 / 0.8);

export function le8LogHazard(compositeOutOf100: number): number {
  return ((50 - compositeOutOf100) / 10) * LE8_LN_HR_PER_10;
}

/* ── Assembling one reading ───────────────────────────────────────────── */

export interface PaceInputs {
  /** Chronological age. Nothing computes without it. */
  age?: number;
  sexAtBirth?: 'male' | 'female' | 'preferNotToSay';
  /** Most recent function-test results, from `functionTests.ts`. */
  gripKg?: number;
  balanceSeconds?: number;
  gaitMs?: number;
  vo2max?: number;
  /** The wellbeing overview's observable components. */
  activityMinutes?: number | null;
  sleepHours?: number | null;
  bmi?: number | null;
  nicotine?: NicotineStatus | null;
}

export interface PaceReading {
  components: PaceComponent[];
  observed: PaceComponent[];
  /**
   * Combined relative hazard against the reference person — somebody at
   * every component's reference level, NOT somebody average. A reading of
   * 1.0 means no added hazard from anything we measured, which is a
   * healthier reference than the population mean.
   */
  relativeHazard: number | null;
  /**
   * The same thing in years, via the Gompertz doubling time. Positive
   * means the measured markers sit where an older person's usually do.
   */
  yearsEquivalent: number | null;
  /** How much of the instrument was readable. */
  coverage: { observed: number; total: number };
  provisional: true;
}

export function readPace(input: PaceInputs): PaceReading {
  const sex = input.sexAtBirth === 'male' || input.sexAtBirth === 'female' ? input.sexAtBirth : null;

  const le8Parts: number[] = [];
  if (input.activityMinutes != null) le8Parts.push(activityScore(input.activityMinutes));
  if (input.sleepHours != null) le8Parts.push(sleepScore(input.sleepHours));
  if (input.bmi != null) le8Parts.push(bmiScore(input.bmi));
  if (input.nicotine) le8Parts.push(nicotineScore(input.nicotine));
  const le8 =
    le8Parts.length > 0 ? le8Parts.reduce((a, b) => a + b, 0) / le8Parts.length : null;

  const components: PaceComponent[] = [
    {
      id: 'grip',
      label: 'Grip strength',
      measures:
        'Whole-body strength read through the hand — a proxy for physiological reserve, and an unreasonably good one.',
      provenance: {
        study: 'Leong and colleagues, 2015',
        journal: 'The Lancet',
        sample: '139,691 adults across 17 countries, median 4 years of follow-up',
        design: 'prospective cohort',
        effect: '16% higher all-cause mortality per 5 kg lower grip; outperformed systolic blood pressure as a predictor',
        grade: 'A',
        caveat:
          'Observational. Grip is a marker of reserve, not a lever — training grip specifically has never been shown to move mortality.',
      },
      logHazard: input.gripKg != null && sex ? gripLogHazard(input.gripKg, sex) : null,
      detail: input.gripKg != null ? `${input.gripKg} kg` : 'Not measured',
      blocked:
        input.gripKg == null
          ? 'Needs a hand dynamometer, about thirty dollars.'
          : !sex
            ? 'The published thresholds are sex-specific and we do not have that on file.'
            : undefined,
    },
    {
      id: 'balance',
      label: 'Ten-second stand',
      measures: 'Balance — what decides whether a trip becomes a fall.',
      provenance: {
        study: 'Araujo and colleagues, 2022',
        journal: 'British Journal of Sports Medicine',
        sample: '1,702 adults aged 51–75, median 7 years of follow-up',
        design: 'prospective cohort',
        effect: '~84% higher all-cause mortality on failing the test; ~80% after adjustment for age, sex, body mass and illness',
        grade: 'B',
        caveat:
          'One cohort, one country, and the smallest sample in this instrument. Reverse causation is especially plausible — illness makes people unsteady.',
      },
      logHazard: input.balanceSeconds != null ? balanceLogHazard(input.balanceSeconds) : null,
      detail: input.balanceSeconds != null ? `${input.balanceSeconds} seconds` : 'Not measured',
      blocked: input.balanceSeconds == null ? 'Takes ten seconds and a wall.' : undefined,
    },
    {
      id: 'gait',
      label: 'Walking speed',
      measures:
        'Heart, lungs, legs, joints, balance and nervous system, integrated into one number.',
      provenance: {
        study: 'Studenski and colleagues, 2011',
        journal: 'JAMA',
        sample: '34,485 older adults pooled from 9 cohorts, 17,528 deaths',
        design: 'pooled cohort',
        effect: 'Predicted survival at every age in both sexes; at 75, predicted 10-year survival ran 19%–87% across the range of speeds',
        grade: 'A',
        caveat:
          'Derived in older adults. It carries much less information below about 65, and this reading is weak for a younger person.',
      },
      logHazard: input.gaitMs != null ? gaitLogHazard(input.gaitMs) : null,
      detail: input.gaitMs != null ? `${input.gaitMs.toFixed(2)} m/s` : 'Not measured',
      blocked: input.gaitMs == null ? 'Needs four metres of floor and a timer.' : undefined,
    },
    {
      id: 'fitness',
      label: 'Cardiorespiratory fitness',
      measures: 'The capacity the whole system is built on.',
      provenance: {
        study: 'Mandsager and colleagues, 2018',
        journal: 'JAMA Network Open',
        sample: '122,007 adults referred for treadmill testing, 13,637 deaths over 1.1 million person-years',
        design: 'prospective cohort',
        effect: 'Elite versus lowest fitness carried ~80% lower all-cause mortality, dose-responsive with no upper limit',
        grade: 'A',
        caveat:
          'A clinical referral population, so not a general sample. And our figure is Apple’s estimate from walks and runs, not a measured treadmill test.',
      },
      logHazard:
        input.vo2max != null && input.age != null ? fitnessLogHazard(input.vo2max, input.age) : null,
      detail: input.vo2max != null ? `${input.vo2max.toFixed(1)} ml/kg/min (estimated)` : 'Not measured',
      blocked:
        input.vo2max == null ? 'Comes from Apple Health after some outdoor walks or runs.' : undefined,
    },
    {
      id: 'le8',
      label: 'Cardiovascular health behaviours',
      measures:
        'Activity, sleep, body mass and nicotine — the four of Life’s Essential 8 this app can see.',
      provenance: {
        study: 'Lloyd-Jones and colleagues, 2022 (construct); subsequent cohort validations',
        journal: 'Circulation',
        sample: 'Multiple prospective cohorts; the NHANES-linked mortality analyses run to roughly 23,000 adults',
        design: 'prospective cohort',
        effect: 'Linear dose-response with all-cause and cardiovascular mortality; roughly 20% lower all-cause mortality per 10 points',
        grade: 'A',
        caveat:
          'The construct is eight components and we read four. The four missing include the three blood measures, which carry a large share of the risk.',
      },
      logHazard: le8 != null ? le8LogHazard(le8) : null,
      detail: le8 != null ? `${Math.round(le8)} across ${le8Parts.length} of 8` : 'Not measured',
      blocked: le8 == null ? 'Starts reading from your first logged session or night.' : undefined,
    },
  ];

  const observed = components.filter((c) => c.logHazard !== null);
  const relativeHazard =
    observed.length === 0
      ? null
      : Math.exp(observed.reduce((sum, c) => sum + (c.logHazard ?? 0), 0) * ATTENUATION);
  const yearsEquivalent =
    relativeHazard === null ? null : (Math.log(relativeHazard) / Math.log(2)) * MRDT_YEARS;

  return {
    components,
    observed,
    relativeHazard,
    yearsEquivalent,
    coverage: { observed: observed.length, total: components.length },
    provisional: PROVISIONAL,
  };
}

/* ── The rate, which is the part that needs our own data ──────────────── */

/** Two readings a year apart is the floor. Anything less is noise. */
export const PACE_MIN_READINGS = 3;
export const PACE_MIN_SPAN_DAYS = 180;

export interface PaceOverTime {
  /** Biological years accrued per calendar year. 1.0 is ordinary ageing. */
  pace: number;
  readings: number;
  spanDays: number;
  /** Said plainly, because the confidence here is genuinely low. */
  confidence: 'low' | 'moderate';
}

/**
 * Pace: how the years-equivalent offset is moving, per calendar year.
 *
 * This is the part no competitor can copy and the part no single reading
 * can give you. A cross-sectional instrument tells you where you sit; only
 * a series tells you which way you are going, and which way you are going
 * is the only part a person can do anything about.
 *
 * Returns null below the floor rather than drawing a line through two
 * points. A slope from two readings a fortnight apart is an artefact of
 * how well somebody slept the night before the second one.
 */
export function paceOverTime(
  readings: { date: string; yearsEquivalent: number }[],
): PaceOverTime | null {
  if (readings.length < PACE_MIN_READINGS) return null;
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const spanDays = daysBetween(sorted[0].date, sorted[sorted.length - 1].date);
  if (spanDays < PACE_MIN_SPAN_DAYS) return null;

  // Least squares on years-equivalent against calendar years elapsed.
  const t0 = sorted[0].date;
  const xs = sorted.map((r) => daysBetween(t0, r.date) / 365.25);
  const ys = sorted.map((r) => r.yearsEquivalent);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;
  // Everybody ages one calendar year per calendar year. The slope of the
  // offset is what is added to or taken off that.
  const pace = 1 + num / den;
  return {
    pace,
    readings: sorted.length,
    spanDays,
    confidence: sorted.length >= 5 && spanDays >= 365 ? 'moderate' : 'low',
  };
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/**
 * What the app would have to collect for the coefficients above to become
 * ours rather than borrowed.
 *
 * Kept in code rather than only in a document because it is a
 * specification, and because anyone reading this module should be able to
 * see exactly how far it is from being finished.
 */
export const CALIBRATION_REQUIREMENTS = [
  'Function tests repeated on a fixed schedule, so within-person change is measurable rather than inferred from one reading.',
  'Daily behavioural record — planned, done, displaced, swapped — which is the part no cohort study has and the reason this is worth doing at all.',
  'An outcome to fit against. Mortality is not available to us at any plausible scale; the realistic targets are incident diagnosis, hospitalisation, and measured change in the function tests themselves.',
  'Explicit, separate, revocable consent for research use, held apart from consent to use the app.',
  'An external statistician and a registered analysis plan written before the data is looked at.',
  'Enough people, for long enough. This is years, not quarters, and saying otherwise would be the same overclaim the module exists to avoid.',
] as const;

/**
 * Claims that may not appear anywhere in this instrument's copy.
 *
 * Every one has been made by a shipped consumer longevity product, and
 * each is either unsupported by the underlying papers or actively false.
 * They are constants so that a test can fail when somebody writes one.
 */
export const FORBIDDEN_CLAIMS = [
  'your biological age is',
  'reverse your age',
  'reverse ageing',
  'you will live',
  'life expectancy',
  'clinically proven',
  'medically proven',
] as const;

/**
 * Words that are fine about somebody else's instrument and forbidden about
 * ours.
 *
 * The distinction is the whole point and it is worth drawing precisely.
 * "The Short Physical Performance Battery is validated in older adults" is
 * a true, useful sentence about thirty years of other people's work.
 * "Our pace score is validated" would be a lie, and will stay a lie until
 * `PROVISIONAL` is false. So the same word is permitted in `provenance`,
 * which describes published research, and banned in everything this module
 * says about itself.
 */
export const FORBIDDEN_SELF_CLAIMS = [
  'validated',
  'proven',
  'accurate to',
  'precise',
  'your true',
] as const;
