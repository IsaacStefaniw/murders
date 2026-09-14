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
  sleepScore,
  type NicotineStatus,
} from '@/features/health/essential8';
import { GRIP_LOW } from '@/features/health/functionTests';
import {
  SRI_PROVENANCE,
  sriLogHazard,
  type SleepRegularityIndex,
} from '@/features/health/sleepTiming';
import {
  DRINKING_LABEL,
  DRINKING_PROVENANCE,
  SMOKING_DETAIL,
  SMOKING_PROVENANCE,
  drinkingLogHazard,
  smokingLogHazard,
  yearsFromQuitting,
  type DrinkingBand,
  type SmokingStatus,
} from '@/features/health/negativeHabits';
import {
  SELF_RATED_HEALTH_PROVENANCE,
  SELF_REPORT_SE_MULTIPLIER,
  WALKING_PACE_PROVENANCE,
  selfRatedHealthLogHazard,
  walkingPaceLogHazard,
  type SelfRatedHealth,
  type WalkingPace,
} from '@/features/health/selfReport';

/** Re-exported so callers get the whole instrument from one module. */
export { SELF_REPORT_SE_MULTIPLIER };

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

/**
 * Where a component's value came from.
 *
 * The distinction is load-bearing, not bookkeeping. A self-reported
 * walking pace and a measured gait speed answer the same question with
 * different precision, and when the measured one arrives it REPLACES the
 * proxy rather than averaging with it. The number then moves — and that
 * movement is better knowledge, not a healthier person. `progress.ts`
 * exists to keep those two apart.
 */
export type ComponentSource = 'measured' | 'self-reported';

export interface PaceComponent {
  id: string;
  label: string;
  /** Null where the component could not be read at all. */
  source: ComponentSource | null;
  /** What this component is measuring, in the person's terms. */
  measures: string;
  provenance: Provenance;
  /**
   * Log hazard ratio against this component's own reference level, or null
   * where it has not been observed. Positive is worse; zero is that
   * component's reference.
   *
   * Whether a component may go NEGATIVE — that is, whether being
   * exceptional earns credit rather than merely avoiding a penalty — is
   * decided per component by what its own paper supports, and the two
   * answers are both represented here:
   *
   *  - Grip and gait speed are floored at zero. PURE and the gait
   *    literature report DECREMENT effects; reading them backwards as an
   *    unbounded bonus is an extrapolation neither carries.
   *  - Fitness and the Essential 8 composite may go negative, because
   *    theirs do. Mandsager found a dose-response with explicitly no upper
   *    limit to the benefit, and Life's Essential 8 is validated as linear
   *    across its full 0–100 range rather than only below its midpoint.
   *
   * The asymmetry is not an oversight. It is the whole discipline: each
   * component runs in the direction, and only as far as, its own evidence
   * goes.
   */
  logHazard: number | null;
  /** What was read, in the person's terms. */
  detail: string;
  /** Why it cannot be read, where it cannot. */
  blocked?: string;
  /**
   * What measuring this properly would buy, where it is currently a proxy.
   *
   * The honest version of a nudge: it says what changes, and `progress.ts`
   * then refuses to report the resulting movement as somebody getting
   * healthier.
   */
  upgradeTo?: string;
  /**
   * The years available here, stated as a gain rather than a deficit.
   *
   * Set only where the evidence supports a number for CHANGING, not merely
   * for being. Smoking has one because cessation has been measured
   * directly and repeatedly; grip strength does not, because nobody has
   * shown that training grip moves mortality.
   *
   * This is the field that makes asking about smoking a kindness rather
   * than an accusation — it is the only place in the app that says how big
   * the prize is, and it cannot say that without having asked.
   */
  opportunity?: string;
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
  /**
   * What they told us before anything was measured.
   *
   * Isaac: "people are not starting from 0." Somebody opening this app is
   * not unmeasured, they are unasked — and two questions carry most of
   * what can be had for free.
   */
  selfRatedHealth?: SelfRatedHealth;
  walkingPace?: WalkingPace;
  /**
   * The two nobody wants to ask. They are also the two most moveable
   * things here — see `negativeHabits.ts` for why asking is the kind
   * thing rather than the unkind one.
   */
  smoking?: SmokingStatus;
  drinking?: DrinkingBand;
  /**
   * Sleep regularity, computed from answered bed and wake times.
   *
   * The one component that needs a SERIES rather than a reading, which is
   * the whole case for asking two clock times each morning.
   */
  sleepRegularity?: SleepRegularityIndex | null;
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

  // Nicotine is deliberately NOT in here. Essential 8 scores it as one
  // component of eight, which after averaging and attenuation values a
  // lifetime of smoking at about a year. The direct literature says ten.
  // It is scored on its own evidence below and left out here so it is not
  // counted twice. See negativeHabits.ts.
  const le8Parts: number[] = [];
  if (input.activityMinutes != null) le8Parts.push(activityScore(input.activityMinutes));
  if (input.sleepHours != null) le8Parts.push(sleepScore(input.sleepHours));
  if (input.bmi != null) le8Parts.push(bmiScore(input.bmi));
  const le8 =
    le8Parts.length > 0 ? le8Parts.reduce((a, b) => a + b, 0) / le8Parts.length : null;

  // Asked beats inferred. Somebody who told us gets their answer used; the
  // behaviour log is only the fallback for somebody who did not.
  const smoking: SmokingStatus | undefined =
    input.smoking ??
    (input.nicotine === 'smokesNow'
      ? 'current'
      : input.nicotine === 'inhaledNicotine'
        ? 'vapeOnly'
        : input.nicotine === 'never'
          ? 'never'
          : input.nicotine === 'quit5y'
            ? 'quitLongAgo'
            : input.nicotine === 'quit1to5y'
              ? 'quitRecently'
              : undefined);

  const components: PaceComponent[] = [
    {
      id: 'grip',
      source: input.gripKg != null && sex ? 'measured' : null,
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
      source: input.balanceSeconds != null ? 'measured' : null,
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
      // Measured beats asked, and never averages with it. Two instruments
      // answering the same question with different precision should not be
      // blended — the better one simply takes over.
      source: input.gaitMs != null ? 'measured' : input.walkingPace ? 'self-reported' : null,
      measures:
        'Heart, lungs, legs, joints, balance and nervous system, integrated into one number.',
      provenance: input.gaitMs != null ? {
        study: 'Studenski and colleagues, 2011',
        journal: 'JAMA',
        sample: '34,485 older adults pooled from 9 cohorts, 17,528 deaths',
        design: 'pooled cohort',
        effect: 'Predicted survival at every age in both sexes; at 75, predicted 10-year survival ran 19%–87% across the range of speeds',
        grade: 'A',
        caveat:
          'Derived in older adults. It carries much less information below about 65, and this reading is weak for a younger person.',
      } : WALKING_PACE_PROVENANCE,
      logHazard:
        input.gaitMs != null
          ? gaitLogHazard(input.gaitMs)
          : input.walkingPace
            ? walkingPaceLogHazard(input.walkingPace)
            : null,
      detail:
        input.gaitMs != null
          ? `${input.gaitMs.toFixed(2)} m/s, measured`
          : input.walkingPace
            ? `${input.walkingPace === 'steady' ? 'steady' : input.walkingPace} pace, as you described it`
            : 'Not measured',
      blocked:
        input.gaitMs != null || input.walkingPace
          ? undefined
          : 'Tell us your usual walking pace, or measure it over four metres.',
      upgradeTo:
        input.gaitMs == null && input.walkingPace
          ? 'Timing yourself over four metres replaces this with the measured version and narrows the interval.'
          : undefined,
    },
    {
      id: 'selfRatedHealth',
      label: 'How your health feels to you',
      source: input.selfRatedHealth ? 'self-reported' : null,
      measures:
        'Your own judgement of your health. It looks like small talk and it is the single most striking finding in this instrument — people know something about themselves that no lab result contains.',
      provenance: SELF_RATED_HEALTH_PROVENANCE,
      logHazard: input.selfRatedHealth ? selfRatedHealthLogHazard(input.selfRatedHealth) : null,
      detail: input.selfRatedHealth ? capitalise(input.selfRatedHealth) : 'Not asked yet',
      blocked: input.selfRatedHealth ? undefined : 'One question, and it never needs measuring.',
    },
    {
      id: 'fitness',
      source: input.vo2max != null && input.age != null ? 'measured' : null,
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
      id: 'nicotine',
      label: 'Smoking',
      source: smoking ? (input.smoking ? 'self-reported' : 'measured') : null,
      measures:
        'The largest single moveable thing in this instrument, in both directions. It is also the only component where the number worth showing somebody is the one they would GAIN.',
      provenance: SMOKING_PROVENANCE,
      logHazard: smoking ? smokingLogHazard(smoking) : null,
      detail: smoking ? SMOKING_DETAIL[smoking] : 'Not asked yet',
      blocked: smoking
        ? undefined
        : 'One question. It matters more than anything else here, and the app will not guess at it.',
      opportunity:
        smoking === 'current'
          ? `Smoking costs about a decade against never having smoked. ${yearsFromQuitting(input.age)}`
          : smoking === 'quitRecently'
            ? 'Most of the excess falls away over the first decade after stopping, so this one improves on its own as that time passes.'
            : undefined,
    },
    {
      id: 'alcohol',
      label: 'Alcohol',
      source: input.drinking ? 'self-reported' : null,
      measures:
        'How much, across a usual week. Inside this instrument rather than beside it, because pace is assembled from many studies and alcohol arrives with a large one of its own.',
      provenance: DRINKING_PROVENANCE,
      logHazard: input.drinking ? drinkingLogHazard(input.drinking) : null,
      detail: input.drinking ? DRINKING_LABEL[input.drinking] : 'Not asked yet',
      blocked: input.drinking ? undefined : 'One question, in standard drinks across a usual week.',
      opportunity:
        input.drinking === 'high' || input.drinking === 'veryHigh'
          ? 'The pooled data puts the lowest all-cause mortality at about ten standard drinks a week — the same number the Australian guideline names. Coming down toward it is where the years in this component are.'
          : undefined,
    },
    {
      id: 'sleepRegularity',
      label: 'Sleep regularity',
      // Self-reported, because it is built from answered clock times and a
      // one-block model of the night, where the study used accelerometry.
      // Both simplifications flatter, so it takes the wider interval.
      source: input.sleepRegularity ? 'self-reported' : null,
      measures:
        'How closely your sleep timing matches from one day to the next — not how long you sleep, which is a different thing and a weaker predictor.',
      provenance: SRI_PROVENANCE,
      logHazard: input.sleepRegularity ? sriLogHazard(input.sleepRegularity.band) : null,
      detail: input.sleepRegularity
        ? `${Math.round(input.sleepRegularity.sri)} out of 100 — ${input.sleepRegularity.band}`
        : 'Not enough nights yet',
      blocked: input.sleepRegularity
        ? undefined
        : 'Needs a week of bed and wake times. It is the one thing here that cannot be worked out later from an average.',
    },
    {
      id: 'le8',
      source: le8 != null ? 'measured' : null,
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

/* ── The headline, and the uncertainty that has to travel with it ────── */

/**
 * How wide the error bars are, and why they are on the hero rather than in
 * a footnote.
 *
 * Isaac chose a headline number. The engine can produce one, and a
 * headline number is a legitimate product decision — but the figure has
 * uncertainty of several years, and the failure mode of every product in
 * this category is a big confident numeral with that uncertainty stripped
 * off. `PaceHeadline` therefore makes the interval and the coverage
 * non-optional fields: there is no way to obtain the number from this
 * module without also holding what it is worth.
 *
 * It is also the better mechanic. The interval narrows visibly as somebody
 * measures more, which turns honesty into the thing that makes the number
 * better rather than the thing that apologises for it.
 *
 * ── WHERE THE WIDTH COMES FROM ──────────────────────────────────────────
 *
 * Three sources, combined in quadrature:
 *
 * 1. Each component's own effect is estimated with error. We do not hold
 *    every published confidence interval, so the error is approximated
 *    from the evidence grade — a proxy for sample size and replication.
 * 2. `ATTENUATION` is a judgement, not a finding, so it carries its own
 *    uncertainty proportional to the size of the total it is shrinking.
 * 3. Components we could not read could have gone either way. Each unread
 *    one widens the interval, which is what makes measuring pay.
 *
 * None of these three numbers is a published quantity. They are stated
 * approximations, chosen to be honest about width rather than flattering,
 * and they are exported so they can be argued with.
 */
export const GRADE_RELATIVE_SE: Record<EvidenceGrade, number> = {
  A: 0.25,
  B: 0.4,
  C: 0.55,
  D: 0.75,
};

/** Uncertainty in ATTENUATION itself, as a fraction of what it shrinks. */
export const ATTENUATION_RELATIVE_SE = 0.25;

/** Years of uncertainty added by each component we could not read. */
export const UNREAD_COMPONENT_YEARS = 2.5;

/**
 * Test-retest uncertainty carried by each component we DID read, in years.
 *
 * Without this the interval collapses for somebody sitting at every
 * reference level, because the estimation error is proportional to the
 * effect and the effect is zero — so a person measuring exactly average on
 * everything would be handed a suspiciously confident number. That is
 * backwards. Grip varies a few kilograms between mornings, balance varies
 * with the floor and the shoes, and Apple's VO₂max estimate wanders. A
 * measurement is never certain just because it came out at the reference.
 *
 * It also sets the floor on how good the headline can ever get: five
 * components at this floor is about ±5 years, and the instrument never
 * claims better than that.
 */
export const MEASUREMENT_SE_YEARS = 1.2;



/** Log-hazard to years, via the Gompertz doubling time. */
const YEARS_PER_LOG_HAZARD = MRDT_YEARS / Math.LN2;

export interface PaceHeadline {
  /**
   * The figure, in years. Chronological age adjusted by the measured
   * markers. Rounded, because a decimal place here is false precision
   * against an interval several years wide.
   */
  years: number;
  /** Their actual age, always shown beside it. */
  chronological: number;
  /** Plus or minus, in years. 95% interval. Never optional. */
  plusMinus: number;
  /** How much of the instrument was readable. Never optional. */
  coverage: { observed: number; total: number };
  /** How much narrower the interval gets if everything is measured. */
  plusMinusIfComplete: number;
  provisional: true;
  /** The one sentence that has to appear wherever the number appears. */
  qualifier: string;
}

/**
 * The headline figure with its interval attached.
 *
 * Returns null where there is no chronological age or nothing was
 * measured — a headline built on no readings is the exact artefact this
 * whole module exists to avoid producing.
 */
export function paceHeadline(reading: PaceReading, age: number | undefined): PaceHeadline | null {
  if (age == null || reading.yearsEquivalent === null) return null;

  // 1. Component estimation error, in log-hazard space, widened where the
  //    value was asked rather than measured.
  let varianceLog = 0;
  for (const c of reading.observed) {
    const widen = c.source === 'self-reported' ? SELF_REPORT_SE_MULTIPLIER : 1;
    const se = Math.abs(c.logHazard ?? 0) * GRADE_RELATIVE_SE[c.provenance.grade] * widen;
    varianceLog += se ** 2;
  }
  const sumLog = reading.observed.reduce((sum, c) => sum + (c.logHazard ?? 0), 0);

  // 2. The attenuation judgement, proportional to what it is shrinking.
  const attenuationSe = Math.abs(sumLog * ATTENUATION) * ATTENUATION_RELATIVE_SE;

  const estimationVarYears =
    (varianceLog * ATTENUATION ** 2 + attenuationSe ** 2) * YEARS_PER_LOG_HAZARD ** 2;

  // 3. Test-retest error on each reading we took. Does not vanish at the
  //    reference, because a measurement is not certain for coming out
  //    average.
  const observedCount = reading.coverage.observed;
  const measuredVar = reading.observed.reduce(
    (v, c) =>
      v +
      (MEASUREMENT_SE_YEARS * (c.source === 'self-reported' ? SELF_REPORT_SE_MULTIPLIER : 1)) ** 2,
    0,
  );

  // 4. What we could not see. Quadrature again: four unknowns are not four
  //    times as uncertain as one.
  const unread = reading.coverage.total - reading.coverage.observed;
  const coverageVar = unread * UNREAD_COMPONENT_YEARS ** 2;

  const plusMinus = Math.max(
    1,
    Math.round(1.96 * Math.sqrt(estimationVarYears + measuredVar + coverageVar)),
  );

  // What measuring everything would buy. The unread components are assumed
  // to carry estimation error like the ones we have — a stated assumption,
  // and the only way to answer "is it worth doing the other two tests?"
  // before they are done.
  const scaledEstimation =
    observedCount > 0 ? estimationVarYears * (reading.coverage.total / observedCount) : 0;
  const ifComplete = Math.max(
    1,
    Math.round(
      1.96 * Math.sqrt(scaledEstimation + reading.coverage.total * MEASUREMENT_SE_YEARS ** 2),
    ),
  );

  return {
    years: Math.round(age + reading.yearsEquivalent),
    chronological: age,
    plusMinus,
    coverage: reading.coverage,
    plusMinusIfComplete: ifComplete,
    provisional: PROVISIONAL,
    qualifier:
      `Give or take ${plusMinus} years, from ${reading.coverage.observed} of ` +
      `${reading.coverage.total} markers. Not a biological age and not a ` +
      `prediction about you — it is where your measured markers sit.`,
  };
}

/**
 * What gets shared, when somebody shares it.
 *
 * The moment a number leaves the app it loses its screen, and with it
 * every caveat that was sitting underneath. So the shared text carries the
 * interval, the coverage and the disclaimer in the body rather than in a
 * link nobody follows. It is longer than a boast and that is deliberate:
 * the shareable artefact should be the honest one, or there is no point
 * having been honest on the screen.
 */
export function paceShareText(headline: PaceHeadline): string {
  const direction =
    headline.years < headline.chronological
      ? `${headline.chronological - headline.years} years younger than`
      : headline.years > headline.chronological
        ? `${headline.years - headline.chronological} years older than`
        : 'the same as';
  return [
    `My markers read ${headline.years} — ${direction} my actual age.`,
    ``,
    `Give or take ${headline.plusMinus} years, from ${headline.coverage.observed} of ${headline.coverage.total} markers measured.`,
    `Compiled from published cohort studies, not validated on its own yet.`,
    `It is not a biological age, and not a prediction about anybody.`,
  ].join('\n');
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

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  // "Drinking above 350g cost four to five years of life expectancy at 40"
  // is a correct summary of what Wood and colleagues measured across
  // 599,912 people. "Your life expectancy is 82" is a claim about one
  // person that nothing here can support. Same words, and the difference
  // is entirely whether the sentence is about a cohort or about you.
  'life expectancy',
] as const;
