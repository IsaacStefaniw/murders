/**
 * Cardio fitness — what VO₂max is for, and what it is not for.
 *
 * It is NOT for classifying anybody. Published VO₂max reference tables are
 * split by age and sex; we never ask anyone's sex, and colouring a number
 * against the wrong table would be a confident, invisible lie. So nothing
 * here says "your cardio fitness is poor". It reads the person's own
 * ninety-day direction and prescribes from that, which is both honest and
 * more useful — the trend is the part that responds to training.
 *
 * The prescription itself comes from the best-established protocol for
 * moving this number: a base of easy aerobic work, plus one hard interval
 * session built on the 4×4 pattern (four minutes hard, three easy, four
 * times). Grade B — consistently replicated in trials, mostly small and
 * mostly in untrained-to-recreational populations.
 *
 * The reason to care is worth saying once and not repeating: across large
 * cohort studies, cardiorespiratory fitness tracks all-cause mortality more
 * closely than almost any other modifiable measure. That is observational,
 * so it is association rather than proof, and it is said that way.
 */

import { latest, trend, type MetricObservation } from '@/features/model/metrics';

export interface ConditioningAdvice {
  /** Where the number is now, said without a verdict on it. */
  reading: string;
  /** What to do about it this block. */
  prescription: string;
  /** Why that, in one sentence. */
  why: string;
  /** How many conditioning sessions the block should carry. */
  sessionsPerWeek: number;
  /** True when one of those should be intervals rather than easy work. */
  includeIntervals: boolean;
}

/** The window a change in cardio fitness is legible over. */
const TREND_DAYS = 90;
/** Below this the change is Apple's estimate wobbling, not fitness moving. */
const MEANINGFUL = 1.0;

/**
 * What to do about cardio this block.
 *
 * Returns null when there is no VO₂max at all — in which case the training
 * hub asks for one rather than inventing advice.
 */
export function conditioningFrom(
  metrics: MetricObservation[],
  now: Date = new Date(),
): ConditioningAdvice | null {
  const current = latest(metrics, 'body.vo2max');
  if (!current) return null;

  const t = trend(metrics, 'body.vo2max', TREND_DAYS, now);
  const moved = t && Math.abs(t.delta) >= MEANINGFUL ? t : null;

  if (moved && moved.direction === 'up') {
    return {
      reading: `Cardio fitness ${moved.from} → ${moved.to} ml/kg/min over the last three months.`,
      prescription: 'Two easy aerobic sessions a week, 30–45 minutes each. Keep doing what you are doing.',
      why: 'It is rising. The base work is what is moving it, and the fastest way to stall progress is to make every session hard.',
      sessionsPerWeek: 2,
      includeIntervals: false,
    };
  }

  if (moved && moved.direction === 'down') {
    return {
      reading: `Cardio fitness ${moved.from} → ${moved.to} ml/kg/min over the last three months.`,
      prescription:
        'Two easy aerobic sessions, plus one interval session: four minutes hard, three easy, four times through.',
      why: 'It has drifted down. Intervals move this number faster than steady work does, and one a week is enough to do it.',
      sessionsPerWeek: 3,
      includeIntervals: true,
    };
  }

  return {
    reading: `Cardio fitness sitting at ${current.value} ml/kg/min.`,
    prescription:
      'Two easy aerobic sessions a week, plus one interval session: four minutes hard, three easy, four times through.',
    why: 'Flat means the current dose is maintaining rather than building. One hard session a week is what changes that.',
    sessionsPerWeek: 3,
    includeIntervals: true,
  };
}

/**
 * The one line of education, shown once beside the number rather than
 * repeated. Association, and labelled as association.
 */
export const VO2MAX_CONTEXT =
  'Across large observational studies, cardiorespiratory fitness tracks all-cause mortality more closely than almost any other measure you can change. Those are associations rather than proof — but the size of them is why this number is worth watching at all.';

/**
 * What BMI is and is not, said where BMI is shown.
 *
 * Included because the alternative — showing the number bare — quietly
 * tells a strong person they are overweight, and that is both wrong and
 * the kind of wrong that costs the app every other claim it makes.
 */
export const BMI_CONTEXT =
  'BMI is weight against height and nothing else — it cannot tell muscle from fat, and it reports a lot of strong people as overweight. Waist against height is the better simple one: under half your height is the usual mark.';
