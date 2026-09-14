/**
 * The two questions nobody wants to ask, and the reason to ask them anyway.
 *
 * Isaac: "don't forget to ask negative habits as well?"
 *
 * He is right, and it was the largest hole in the day-one reading. The app
 * only knew somebody smoked if they had ALREADY decided to quit and set up
 * a behaviour intention. A person who smokes twenty a day and is not
 * currently trying to stop read as "nicotine: not known" — on the single
 * largest modifiable component in the whole instrument.
 *
 * ── WHY ASKING IS THE KIND THING, NOT THE UNKIND ONE ────────────────────
 *
 * `catalog.ts` settled this argument in this codebase already: "withholding
 * something true because a reader might mishear it is condescension, not
 * care", and "say what the behaviour DOES, never that it IS bad".
 *
 * There is a second and stronger reason here. These are the most MOVEABLE
 * components in the instrument, by a wide margin. Grip strength shifts over
 * months of training and buys a year or two. Stopping smoking before forty
 * recovers about nine-tenths of a decade — the largest single number
 * anywhere in this module, and it is a number of years GAINED.
 *
 * So for a smoker this is not a penalty they did not ask for. It is the
 * only place in the app that quantifies the size of the prize, and it
 * cannot do that without asking. `whatWouldChange` in `pace.ts` exists so
 * the gain is what gets shown, not the deficit.
 *
 * ── WHY SMOKING LEFT THE ESSENTIAL 8 SUB-SCORE ──────────────────────────
 *
 * Life's Essential 8 scores nicotine as one component of eight, so a
 * lifelong smoker loses at most an eighth of that composite. Averaged into
 * a sub-score built from four readable components, a current smoker's zero
 * became about a 25-point dent — which then became, after attenuation, a
 * year or so.
 *
 * The direct literature says roughly ten. Jha and colleagues followed more
 * than 200,000 adults and found smokers lose about a decade of life, with
 * cessation recovering most of it. Using the weaker of two available
 * numbers, because it happened to arrive inside a composite we already had,
 * would be a filing decision producing a factual error.
 *
 * So nicotine is scored HERE, on its own evidence, and removed from the
 * Essential 8 sub-score to avoid counting it twice. That sub-score now
 * reads three of eight and says so.
 *
 * ── WHY ALCOHOL IS IN PACE BUT NOT IN ESSENTIAL 8 ───────────────────────
 *
 * Not a reversal of `essential8.ts`, which keeps alcohol beside its score
 * rather than inside it. That rule exists because alcohol is not an AHA
 * component and smuggling it in would make our composite wear their name.
 *
 * Pace is our own instrument and is explicitly assembled from many studies.
 * Alcohol arrives here with its own citation — 599,912 drinkers across 83
 * prospective studies — and stands on that rather than on borrowed
 * authority. Both rules are the same rule.
 */

import type { Provenance } from '@/features/health/pace';
import type { InterviewAnswers } from '@/features/onboarding/script';

/* ── Nicotine ─────────────────────────────────────────────────────────── */

export type SmokingStatus =
  | 'never'
  | 'quitLongAgo'
  | 'quitRecently'
  | 'vapeOnly'
  | 'current';

/**
 * Against never-smoked.
 *
 * Current smoking at 2.8 is the middle of the range Jha reports across
 * sexes and age bands. The ex-smoker figures follow the same paper's
 * central finding: the excess narrows sharply with time since quitting,
 * and somebody who stopped a decade ago sits close to a never-smoker.
 *
 * `vapeOnly` is the honest problem. There is no long-term mortality
 * cohort for vaping — it has not existed long enough for one, and anybody
 * quoting a mortality hazard ratio for it is quoting something that does
 * not exist. Life's Essential 8 places inhaled nicotine at 25 of 100,
 * which is a considered judgement by a scientific panel rather than a
 * finding. The small figure here mirrors that judgement and says clearly
 * that it is one.
 */
export const SMOKING_RR: Record<SmokingStatus, number> = {
  never: 1.0,
  quitLongAgo: 1.15,
  quitRecently: 1.5,
  vapeOnly: 1.2,
  current: 2.8,
};

export function smokingLogHazard(status: SmokingStatus): number {
  return Math.log(SMOKING_RR[status]);
}

export const SMOKING_PROVENANCE: Provenance = {
  study: 'Jha and colleagues, 2013',
  journal: 'New England Journal of Medicine',
  sample: 'More than 200,000 US adults aged 25–79 followed prospectively, with national mortality linkage',
  design: 'prospective cohort',
  effect:
    'Smokers lost about a decade of life against never-smokers. Quitting at 25–34, 35–44 and 45–54 returned about 10, 9 and 6 of those years; stopping before 40 avoided roughly 90% of the excess',
  grade: 'A',
  caveat:
    'The vaping level is the weakest thing in this instrument: no long-term mortality cohort for it exists, so that figure follows the American Heart Association’s judgement rather than a measured outcome.',
};

/** The prize, in the study's own terms, for somebody who stops now. */
export function yearsFromQuitting(age: number | undefined): string {
  if (age == null) return 'Stopping returns most of it, and the earlier the more.';
  if (age < 35) return 'Stopping now returns about ten of those years.';
  if (age < 45) return 'Stopping now returns about nine of those years.';
  if (age < 55) return 'Stopping now returns about six of those years.';
  return 'Stopping still returns several of those years — the benefit does not run out with age.';
}

/* ── Alcohol ──────────────────────────────────────────────────────────── */

export type DrinkingBand = 'none' | 'lowRisk' | 'moderate' | 'high' | 'veryHigh';

/**
 * Bands in Australian standard drinks a week. One standard drink is 10g of
 * alcohol, which makes the Wood threshold of 100g a week exactly the ten
 * drinks the Australian guideline already names — a convergence worth
 * pointing out to somebody, because it means two independent bodies landed
 * on the same number.
 *
 * The hazards are converted from the paper's own life-expectancy findings
 * at age 40 rather than from a hazard ratio, because life-expectancy loss
 * is what it reported and converting back through the Gompertz doubling
 * time is one step rather than two.
 */
export const DRINKING_YEARS_LOST: Record<DrinkingBand, number> = {
  none: 0,
  lowRisk: 0,
  moderate: 0.5,
  high: 1.5,
  veryHigh: 4.5,
};

export const DRINKING_LABEL: Record<DrinkingBand, string> = {
  none: 'None',
  lowRisk: 'Up to 10 a week',
  moderate: '11 to 20 a week',
  high: '21 to 35 a week',
  veryHigh: 'More than 35 a week',
};

/** Gompertz: a doubled hazard is about eight years. Inverted here. */
export function drinkingLogHazard(band: DrinkingBand): number {
  return (DRINKING_YEARS_LOST[band] / 8) * Math.LN2;
}

export const DRINKING_PROVENANCE: Provenance = {
  study: 'Wood and colleagues, 2018',
  journal: 'The Lancet',
  sample: '599,912 current drinkers without prior cardiovascular disease, pooled across 83 prospective studies in 19 countries',
  design: 'pooled cohort',
  effect:
    'Lowest all-cause mortality at about 100g of alcohol a week — ten Australian standard drinks, the same figure the national guideline names. Against that, drinking 100–200g cost roughly six months of life expectancy at 40, 200–350g one to two years, and above 350g four to five years',
  grade: 'A',
  caveat:
    'Current drinkers only, so it says nothing about whether drinking nothing beats drinking a little — people who have stopped often stopped for a reason, which distorts that comparison in every study of this kind.',
};

/* ── Reading the answers ──────────────────────────────────────────────── */

export interface NegativeHabits {
  smoking?: SmokingStatus;
  drinking?: DrinkingBand;
}

const SMOKING_VALUES: SmokingStatus[] = [
  'never',
  'quitLongAgo',
  'quitRecently',
  'vapeOnly',
  'current',
];
const DRINKING_VALUES: DrinkingBand[] = ['none', 'lowRisk', 'moderate', 'high', 'veryHigh'];

export function negativeHabitsFrom(answers: InterviewAnswers | undefined): NegativeHabits {
  if (!answers) return {};
  const smoking = answers.smokingStatus;
  const drinking = answers.drinkingBand;
  return {
    smoking: SMOKING_VALUES.includes(smoking as SmokingStatus)
      ? (smoking as SmokingStatus)
      : undefined,
    drinking: DRINKING_VALUES.includes(drinking as DrinkingBand)
      ? (drinking as DrinkingBand)
      : undefined,
  };
}

/**
 * How each is described back to the person.
 *
 * Stated as what it is, never as what they are. "Smoking now" rather than
 * "smoker"; a band of drinks rather than "heavy drinker". The difference
 * costs nothing and is the whole distance between a measurement and a
 * label somebody has to argue with.
 */
export const SMOKING_DETAIL: Record<SmokingStatus, string> = {
  never: 'Never smoked',
  quitLongAgo: 'Stopped more than ten years ago',
  quitRecently: 'Stopped within the last ten years',
  vapeOnly: 'Vaping, not smoking',
  current: 'Smoking now',
};
