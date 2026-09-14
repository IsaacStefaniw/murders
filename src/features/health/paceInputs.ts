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

import { activityMinutes, nicotineFromLogs } from '@/features/health/essential8';
import { functionMetricKey } from '@/features/health/functionTests';
import type { PaceInputs } from '@/features/health/pace';
import { negativeHabitsFrom } from '@/features/health/negativeHabits';
import { sleepRegularityIndex, type SleepNight } from '@/features/health/sleepTiming';
import { selfReportedFrom } from '@/features/health/selfReport';
import type { MetricObservation } from '@/features/model/metrics';
import type { InterviewAnswers } from '@/features/onboarding/script';
import { addDays } from '@/lib/dates';
import type {
  BehaviourEvent,
  BehaviourIntention,
  DailyPlan,
  LifeProfile,
  Routine,
} from '@/types/domain';
import type { CardioLog } from '@/features/training/cardio';
import type { NicotineStatus } from '@/features/health/essential8';

export interface PaceSources {
  profile: LifeProfile | null;
  metrics: MetricObservation[];
  plans: Record<string, DailyPlan>;
  routines: Routine[];
  cardioLogs: CardioLog[];
  behaviourIntentions: BehaviourIntention[];
  behaviourEvents: BehaviourEvent[];
  nicotineStatus: NicotineStatus | null;
  interviewAnswers: InterviewAnswers | undefined;
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
  const meanThisWeek = (key: string) => {
    const from = addDays(s.today, -6);
    const vs = s.metrics
      .filter((m) => m.key === key && m.at.slice(0, 10) >= from && m.at.slice(0, 10) <= s.today)
      .map((m) => m.value);
    return vs.length > 0 ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
  };

  const weight = latest('body.weight');
  const height = latest('body.height');

  return {
    age: s.profile?.age,
    sexAtBirth: s.profile?.sexAtBirth,
    gripKg: latest(functionMetricKey('gripStrength')),
    balanceSeconds: latest(functionMetricKey('oneLegStand')),
    gaitMs: latest(functionMetricKey('gaitSpeed')),
    vo2max: latest('body.vo2max'),
    sleepHours: meanThisWeek('sleep.hours'),
    bmi: weight && height ? weight / (height / 100) ** 2 : null,
    activityMinutes: activityMinutes(s.plans, s.routines, s.today, s.cardioLogs),
    nicotine:
      s.nicotineStatus ??
      nicotineFromLogs(s.behaviourIntentions, s.behaviourEvents, s.today),
    ...selfReportedFrom(s.interviewAnswers),
    ...negativeHabitsFrom(s.interviewAnswers),
    sleepRegularity: sleepRegularityIndex(s.sleepNights, s.today),
  };
}
