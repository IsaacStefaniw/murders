/**
 * The day-one reading: what somebody can be asked, before anything has
 * been measured.
 *
 * Isaac: "can the pre questionnaire help you land in this bucket then? and
 * show improvements... people are not starting from 0."
 *
 * That is the correction the instrument needed. Somebody opening this app
 * is not unmeasured, they are UNASKED. They arrive carrying thirty years
 * of training or thirty years of smoking, a body that either climbs stairs
 * easily or does not, and a fairly accurate private sense of how their
 * health is going. Greeting all of that with "nothing measured yet" is
 * both useless and untrue, and it is the reason a longevity feature dies
 * in the first session — the person cannot see themselves in it.
 *
 * ── THE TWO QUESTIONS THAT CARRY THE MOST ───────────────────────────────
 *
 * SELF-RATED HEALTH is the single most striking finding in this whole
 * module. One question — "in general, would you say your health is
 * excellent, good, fair or poor" — predicts death with an effect size
 * that survives adjustment for functional status, comorbidity, depression
 * and cognition. DeSalvo's 2006 meta-analysis pooled 22 cohorts and found
 * poor-versus-excellent at 1.92. People know something about themselves
 * that the blood panel does not contain, and asking is the only way to get
 * at it.
 *
 * SELF-REPORTED WALKING PACE does nearly the same job as a measured gait
 * speed test, from a question. UK Biobank ran it on 420,727 people, and
 * slow-versus-brisk carried hazard ratios from 1.31 to 2.16 depending on
 * body-mass tertile. It is the proxy that lets somebody have a mobility
 * reading on day one, before they have paced out four metres of hallway.
 *
 * ── PROXIES ARE PROXIES ─────────────────────────────────────────────────
 *
 * Every component here is marked `self-reported`, and self-report carries
 * a wider interval than measurement does — see SELF_REPORT_SE_MULTIPLIER.
 * When the measured version of the same construct arrives, it REPLACES the
 * proxy rather than being averaged with it, and the interval narrows.
 *
 * The narrowing is not improvement, and the app must never say it is. That
 * distinction lives in `progress.ts` and it is the most important thing in
 * this feature.
 */

import type { EvidenceGrade, Provenance } from '@/features/health/pace';
import type { InterviewAnswers } from '@/features/onboarding/script';

/**
 * How much wider a self-reported component's error bars are than a
 * measured one's.
 *
 * A stated approximation, not a published quantity. Self-report carries
 * recall error, social desirability and the plain fact that "brisk" means
 * different things to different people — but the underlying studies
 * measured mortality against the SELF-REPORT, not against a corrected
 * version of it, so the association already has that noise priced in. The
 * multiplier is therefore modest rather than punitive.
 */
export const SELF_REPORT_SE_MULTIPLIER = 1.6;

/* ── Self-rated health ────────────────────────────────────────────────── */

export type SelfRatedHealth = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Four levels, not five.
 *
 * The usual consumer instrument offers excellent / very good / good / fair
 * / poor. DeSalvo's meta-analysis reports pooled relative risks for
 * exactly four — excellent, good, fair, poor — and interpolating a fifth
 * would mean inventing a number and presenting it beside four real ones.
 * Four real levels beats five with a guess in the middle.
 */
export const SELF_RATED_HEALTH_RR: Record<SelfRatedHealth, number> = {
  excellent: 1.0,
  good: 1.23,
  fair: 1.44,
  poor: 1.92,
};

export function selfRatedHealthLogHazard(rating: SelfRatedHealth): number {
  return Math.log(SELF_RATED_HEALTH_RR[rating]);
}

export const SELF_RATED_HEALTH_PROVENANCE: Provenance = {
  study: 'DeSalvo and colleagues, 2006',
  journal: 'Journal of General Internal Medicine',
  sample: '22 prospective community cohorts, pooled from 163 screened studies',
  design: 'pooled cohort',
  effect:
    'Against "excellent": good 1.23, fair 1.44, poor 1.92 for all-cause mortality — and the association held after adjusting for comorbidity, functional status, cognition and depression',
  grade: 'A',
  caveat:
    'It is a judgement, so it moves with mood, with what a person has recently been told, and with what they are comparing themselves to. Some of its power is that it captures illness nobody has diagnosed yet.',
};

/* ── Self-reported walking pace ───────────────────────────────────────── */

export type WalkingPace = 'slow' | 'steady' | 'brisk';

/**
 * Against brisk. The reported comparison is slow versus fast; `steady` is
 * INTERPOLATED between them and is the reason this component is graded B
 * rather than A despite the sample size.
 *
 * The slow figure is a conservative pick from a genuinely wide reported
 * range — 1.31 to 2.16 across body-mass tertiles in the UK Biobank
 * analysis. Taking the midpoint understates the worst case and overstates
 * the best, which is what a single number always does and why the
 * interval around the whole instrument is as wide as it is.
 */
export const WALKING_PACE_RR: Record<WalkingPace, number> = {
  brisk: 1.0,
  steady: 1.25,
  slow: 1.6,
};

export function walkingPaceLogHazard(pace: WalkingPace): number {
  return Math.log(WALKING_PACE_RR[pace]);
}

export const WALKING_PACE_PROVENANCE: Provenance = {
  study: 'Yates, Celis-Morales and colleagues, 2017',
  journal: 'European Heart Journal',
  sample: '420,727 UK Biobank participants free of cancer and cardiovascular disease, 8,598 deaths over 6.3 years',
  design: 'prospective cohort',
  effect:
    'Slow versus brisk walkers carried all-cause mortality hazard ratios from 1.31 to 2.16 depending on body-mass tertile, adjusted for deprivation, ethnicity, employment, medication, alcohol, diet, activity and television time',
  grade: 'B',
  caveat:
    'The middle category is interpolated rather than reported, and the effect varies about twofold across body-mass groups. "Brisk" also means different things to different people, which is noise the study itself carried.',
};

/* ── Reading the questionnaire ────────────────────────────────────────── */

export interface SelfReported {
  selfRatedHealth?: SelfRatedHealth;
  walkingPace?: WalkingPace;
}

/**
 * Pull what the instrument can use out of answers already given.
 *
 * Deliberately forgiving about missing answers: the interview is skippable
 * in places and a person who declined a question should get a narrower
 * reading, never an error and never a default that pretends they answered.
 */
export function selfReportedFrom(answers: InterviewAnswers | undefined): SelfReported {
  if (!answers) return {};
  const health = answers.selfRatedHealth;
  const pace = answers.walkingPace;
  return {
    selfRatedHealth:
      health === 'excellent' || health === 'good' || health === 'fair' || health === 'poor'
        ? health
        : undefined,
    walkingPace: pace === 'slow' || pace === 'steady' || pace === 'brisk' ? pace : undefined,
  };
}

/**
 * What a person is told about why they were asked.
 *
 * Both of these questions look, to somebody filling in an onboarding form,
 * like small talk. They are the two highest-value questions in the whole
 * interview, and saying so is both true and the thing that makes people
 * answer them carefully.
 */
export const WHY_ASKED: Record<'selfRatedHealth' | 'walkingPace', string> = {
  selfRatedHealth:
    'This one question predicts health outcomes better than most blood tests do, across 22 studies and decades of follow-up. People know something about themselves that a lab result does not contain.',
  walkingPace:
    'Usual walking pace pulls together the heart, the lungs, the legs and the balance system into one answer. In a study of 420,727 people it separated outcomes about as well as a measured walking test does.',
};

export const GRADES: readonly EvidenceGrade[] = ['A', 'B', 'C', 'D'];
