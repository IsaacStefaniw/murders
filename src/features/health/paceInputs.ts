/**
 * Gathering the instrument's inputs from wherever they live.
 *
 * They are genuinely scattered — function tests and VO₂max in the metric
 * stream, activity in the plan, nicotine in the behaviour log, and the two
 * self-report answers in the interview. Two callers need exactly the same
 * gathering: the card that renders the reading, and the store action that
 * snapshots it when a test is recorded. Doing it twice would be the usual
 * way a displayed number and a stored one quietly drift apart.
 */

import { activityMinutes, bmiMisread, nicotineFromLogs } from '@/features/health/essential8';
import { bandFromDrinks, latestCount, type WeeklyCount } from '@/features/behaviours/weekly';
import { functionMetricKey } from '@/features/health/functionTests';
import type { PaceInputs } from '@/features/health/pace';
import { negativeHabitsFrom } from '@/features/health/negativeHabits';
import { sleepRegularityIndex, type SleepNight } from '@/features/health/sleepTiming';
import { selfReportedFrom } from '@/features/health/selfReport';
import type { MetricObservation } from '@/features/model/metrics';
import type { InterviewAnswers } from '@/features/onboarding/script';
import { addDays, todayKey } from '@/lib/dates';
import type {
  BehaviourEvent,
  BehaviourIntention,
  DailyPlan,
  LifeProfile,
  Routine,
  WorkoutLog,
} from '@/types/domain';
import type { CardioLog } from '@/features/training/cardio';
import type { NicotineStatus } from '@/features/health/essential8';
import { ageOf } from '@/features/health/age';

export interface PaceSources {
  profile: LifeProfile | null;
  metrics: MetricObservation[];
  plans: Record<string, DailyPlan>;
  routines: Routine[];
  cardioLogs: CardioLog[];
  /** Sessions that happened. See `activityMinutes` for why this is read. */
  workoutLogs: WorkoutLog[];
  behaviourIntentions: BehaviourIntention[];
  behaviourEvents: BehaviourEvent[];
  nicotineStatus: NicotineStatus | null;
  interviewAnswers: InterviewAnswers | undefined;
  /** Weekly figures the person actually recorded. */
  weeklyCounts?: WeeklyCount[];
  /** Answered or imported bed/wake times, newest last. */
  sleepNights: SleepNight[];
  today: string;
}

export function paceInputsFrom(s: PaceSources): PaceInputs {
  const latest = (key: string) => {
    let best: MetricObservation | null = null;
    for (const m of s.metrics) {
      if (m.key !== key) continue;
      if (!best || m.at > best.at) best = m;
    }
    return best?.value;
  };
  /** How many readings of a key landed in the last seven days, or null. */
  const countThisWeek = (key: string): number | null => {
    const from = addDays(s.today, -6);
    const n = s.metrics.filter(
      (m) => m.key === key && m.at.slice(0, 10) >= from && m.at.slice(0, 10) <= s.today,
    ).length;
    return n > 0 ? n : null;
  };
  const meanThisWeek = (key: string) => {
    const from = addDays(s.today, -6);
    const vs = s.metrics
      .filter((m) => m.key === key && m.at.slice(0, 10) >= from && m.at.slice(0, 10) <= s.today)
      .map((m) => m.value);
    return vs.length > 0 ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
  };

  const weight = latest('body.weight');
  const height = latest('body.height');
  const waist = latest('body.waist');
  const bmi = weight && height ? weight / (height / 100) ** 2 : null;
  const sex = s.profile?.sexAtBirth;

  return {
    // A birth year where there is one, so the Gompertz term is computed
    // on a year rather than on a decade midpoint. See health/age.ts.
    age: ageOf(s.profile, todayKey()),
    sexAtBirth: s.profile?.sexAtBirth,
    gripKg: latest(functionMetricKey('gripStrength')),
    balanceSeconds: latest(functionMetricKey('oneLegStand')),
    gaitMs: latest(functionMetricKey('gaitSpeed')),
    vo2max: latest('body.vo2max'),
    sleepHours: meanThisWeek('sleep.hours'),
    bmi,
    // A BMI the app has established is measuring the wrong thing for this
    // person is not a reading of this person. It is dropped rather than
    // scored, and the interval widens to say so.
    bmiMisread:
      bmiMisread({
        bmi,
        bodyFatPct: latest('body.bodyFat'),
        waistToHeight: waist && height ? waist / height : null,
        sex: sex === 'male' || sex === 'female' ? sex : null,
      }) !== null,
    activityMinutes: activityMinutes(
      s.plans,
      s.routines,
      s.today,
      s.cardioLogs,
      s.workoutLogs,
    ),
    nicotine:
      s.nicotineStatus ??
      nicotineFromLogs(s.behaviourIntentions, s.behaviourEvents, s.today),
    ...selfReportedFrom(s.interviewAnswers),
    ...negativeHabitsFrom(s.interviewAnswers),
    /**
     * A measured week beats a remembered one.
     *
     * `drinkingBand` is asked once, during onboarding, before the person
     * has any reason to be accurate, and then scored for a mortality
     * hazard forever. Where they have since recorded an actual weekly
     * figure, that is the reading and this is where it wins — the bands
     * are already denominated in standard drinks a week, so no conversion
     * or judgement is involved.
     */
    ...(() => {
      const measured = latestCount(s.weeklyCounts ?? [], 'alcohol');
      return measured ? { drinking: bandFromDrinks(measured.count) } : {};
    })(),
    sleepRegularity: sleepRegularityIndex(s.sleepNights, s.today),
    /**
     * Sauna sessions this week, counted before remembered.
     *
     * `recovery.saunaMinutes` is written once per COMPLETED session, so
     * the number of readings in the last seven days is the number of
     * sessions — a measured week, on the same principle the alcohol
     * block above states. `statedSaunaPerWeek` is the fallback for
     * somebody who has told us and not yet logged one, which is where
     * this starts for everybody.
     *
     * Deliberately NOT the maximum of the two. A week with two logged
     * sessions against a stated four is a week with two in it, and
     * letting the remembered figure win would make the component
     * unfalsifiable by its own data.
     */
    saunaPerWeek:
      countThisWeek('recovery.saunaMinutes') ?? s.profile?.statedSaunaPerWeek,
  };
}
