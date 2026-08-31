/**
 * Where you are heading — the sentence the app could not previously say.
 *
 * `assessGoals` marks a rung done once evidence satisfies it, and the
 * stall detector notices silence. Neither can say the thing a person
 * actually wants at 6am on a Tuesday: *at this rate you arrive in March,
 * and you said January.* That sentence is the co-pilot; everything else is
 * a to-do list with good manners.
 *
 * Two rules keep it honest.
 *
 * It refuses to project from noise. Three readings over two weeks is the
 * floor, and below it the answer is "not enough yet" rather than a
 * confident line through two points. A projection is a promise about the
 * future, and a wrong one costs more trust than a blank space.
 *
 * It fits a line rather than comparing endpoints. First-vs-last is what
 * `trend()` does for a quick read, and it turns one bad-scales morning into
 * a triumph or a crisis. Least squares uses every reading, so a single
 * outlier moves the answer a little rather than all of it.
 */

import { metricDef, type MetricObservation } from '@/features/model/metrics';
import { toDateKey } from '@/lib/dates';
import type { DoneWhen, Goal } from '@/types/domain';

/** Below these, no projection is offered at all. */
export const MIN_READINGS = 3;
export const MIN_SPAN_DAYS = 14;

export interface Fit {
  /** Units per day. */
  slope: number;
  /** Value at the most recent reading, from the fitted line. */
  fittedNow: number;
  readings: number;
  spanDays: number;
}

/** Least-squares fit of value against days elapsed. */
export function fitSeries(points: { at: string; value: number }[]): Fit | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.at.localeCompare(b.at));
  const t0 = new Date(sorted[0].at).getTime();
  const xs = sorted.map((p) => (new Date(p.at).getTime() - t0) / 86400e3);
  const ys = sorted.map((p) => p.value);
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  // Every reading on the same day: a real state, and not a slope.
  if (den === 0) return null;
  const slope = num / den;
  const intercept = meanY - slope * meanX;
  const spanDays = xs[n - 1];
  return { slope, fittedNow: intercept + slope * spanDays, readings: n, spanDays };
}

export type Verdict =
  | 'not-enough-data'
  | 'flat'
  | 'wrong-way'
  | 'on-track'
  | 'ahead'
  | 'behind'
  | 'arrived';

export interface Trajectory {
  metricKey: string;
  label: string;
  unit: string;
  /** The most recent actual reading, not the fitted one. */
  current: number;
  target: number;
  /** Which way counts as progress for this goal. */
  toward: 'higher' | 'lower';
  ratePerWeek: number;
  /** Null when flat, going the wrong way, or already there. */
  weeksToTarget: number | null;
  projectedDate: string | null;
  targetDate?: string;
  verdict: Verdict;
  headline: string;
  /** The rate that would arrive on time — only when there is a deadline and a gap. */
  requiredRatePerWeek?: number;
  gapNote?: string;
  readings: number;
  spanDays: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const fmt = (n: number, decimals = 1) =>
  decimals === 0 ? String(Math.round(n)) : String(Math.round(n * 10 ** decimals) / 10 ** decimals);

const addDaysTo = (from: Date, days: number) => new Date(from.getTime() + days * 86400e3);

export interface ProjectOptions {
  /**
   * Which way counts as progress. Comes from the goal's own condition
   * ('gte' means higher) where one exists.
   *
   * It must not be inferred from current-vs-target: a 100 kg bench goal
   * with 105 kg on the bar is ACHIEVED, and inferring direction from the
   * gap reads it as needing to lose 5 kg and reports "moving the wrong
   * way" at the exact moment the person succeeded.
   */
  toward?: 'higher' | 'lower';
  targetDate?: string;
  now?: Date;
}

/**
 * The projection for one metric against one target.
 */
export function projectMetric(
  observations: MetricObservation[],
  metricKey: string,
  target: number,
  opts: ProjectOptions = {},
): Trajectory | null {
  const { targetDate, now = new Date() } = opts;
  const def = metricDef(metricKey);
  const points = observations
    .filter((o) => o.key === metricKey)
    .map((o) => ({ at: o.at, value: o.value }))
    .sort((a, b) => a.at.localeCompare(b.at));
  if (points.length === 0) return null;

  const current = points[points.length - 1].value;
  const label = def?.label ?? metricKey;
  const unit = def?.unit ?? '';
  /**
   * Stated intent first, then the metric's own declared direction, and only
   * then the gap. The last is the right answer for a direction-neutral
   * metric like body weight, where someone under their target is trying to
   * go up and the definition says nothing either way.
   */
  const toward: 'higher' | 'lower' =
    opts.toward ??
    (def?.direction === 'higher' || def?.direction === 'lower'
      ? def.direction
      : target >= current
        ? 'higher'
        : 'lower');
  const decimals = def?.decimals ?? 0;

  const base = {
    metricKey,
    label,
    unit,
    current,
    target,
    toward,
    targetDate,
  };

  const fit = fitSeries(points);
  if (!fit || fit.readings < MIN_READINGS || fit.spanDays < MIN_SPAN_DAYS) {
    const needed = Math.max(0, MIN_READINGS - points.length);
    return {
      ...base,
      ratePerWeek: 0,
      weeksToTarget: null,
      projectedDate: null,
      verdict: 'not-enough-data',
      headline:
        needed > 0
          ? `${needed} more reading${needed === 1 ? '' : 's'} and this can show a direction.`
          : 'A couple more weeks of readings and this can show a direction.',
      readings: points.length,
      spanDays: Math.round(fit?.spanDays ?? 0),
    };
  }

  const ratePerWeek = round1(fit.slope * 7);
  const remaining = target - current;
  const arrived = toward === 'higher' ? current >= target : current <= target;

  if (arrived) {
    return {
      ...base,
      ratePerWeek,
      weeksToTarget: 0,
      projectedDate: null,
      verdict: 'arrived',
      headline: `Already there — ${fmt(current, decimals)} ${unit} against a target of ${fmt(target, decimals)}.`,
      readings: fit.readings,
      spanDays: Math.round(fit.spanDays),
    };
  }

  // A rate that would take more than five years to arrive is flat in every
  // sense that matters to a person planning a year.
  const weeksRaw = ratePerWeek === 0 ? Infinity : remaining / ratePerWeek;
  const movingToward = weeksRaw > 0 && Number.isFinite(weeksRaw);

  if (!movingToward || weeksRaw > 260) {
    const wrongWay = ratePerWeek !== 0 && weeksRaw < 0;
    return {
      ...base,
      ratePerWeek,
      weeksToTarget: null,
      projectedDate: null,
      verdict: wrongWay ? 'wrong-way' : 'flat',
      headline: wrongWay
        ? `Moving away from this by about ${fmt(Math.abs(ratePerWeek), decimals)} ${unit} a week.`
        : `Flat for ${Math.round(fit.spanDays)} days. At this rate it does not arrive.`,
      ...deadlineGap(remaining, targetDate, now, unit, decimals),
      readings: fit.readings,
      spanDays: Math.round(fit.spanDays),
    };
  }

  const weeksToTarget = Math.round(weeksRaw * 10) / 10;
  const projected = addDaysTo(now, weeksRaw * 7);
  const projectedDate = toDateKey(projected);

  if (!targetDate) {
    return {
      ...base,
      ratePerWeek,
      weeksToTarget,
      projectedDate,
      verdict: 'on-track',
      headline: `At this rate: ${projectedDate}, about ${Math.round(weeksToTarget)} weeks out.`,
      readings: fit.readings,
      spanDays: Math.round(fit.spanDays),
    };
  }

  const deadline = new Date(`${targetDate}T23:59:59`);
  const slackDays = (deadline.getTime() - projected.getTime()) / 86400e3;
  const verdict: Verdict = slackDays >= 14 ? 'ahead' : slackDays >= -3 ? 'on-track' : 'behind';

  const headline =
    verdict === 'ahead'
      ? `At this rate: ${projectedDate} — about ${Math.round(slackDays / 7)} weeks ahead of ${targetDate}.`
      : verdict === 'on-track'
        ? `At this rate: ${projectedDate}. Target ${targetDate}. That lands.`
        : `At this rate: ${projectedDate}. You said ${targetDate}.`;

  return {
    ...base,
    ratePerWeek,
    weeksToTarget,
    projectedDate,
    verdict,
    headline,
    ...(verdict === 'behind' ? deadlineGap(remaining, targetDate, now, unit, decimals) : {}),
    readings: fit.readings,
    spanDays: Math.round(fit.spanDays),
  };
}

/**
 * What rate would arrive on time.
 *
 * Stated as a rate rather than an instruction, because the app does not
 * know which lever this person can actually pull — and a deadline already
 * past is said plainly rather than dressed up as a very large number.
 */
function deadlineGap(
  remaining: number,
  targetDate: string | undefined,
  now: Date,
  unit: string,
  decimals: number,
): { requiredRatePerWeek?: number; gapNote?: string } {
  if (!targetDate) return {};
  const weeksLeft = (new Date(`${targetDate}T23:59:59`).getTime() - now.getTime()) / (7 * 86400e3);
  if (weeksLeft <= 0) {
    return { gapNote: `${targetDate} has passed. Worth moving the date or the target.` };
  }
  const required = round1(remaining / weeksLeft);
  return {
    requiredRatePerWeek: required,
    gapNote: `Arriving by ${targetDate} needs about ${fmt(Math.abs(required), decimals)} ${unit} a week, ${Math.round(weeksLeft)} weeks running.`,
  };
}

/**
 * The trajectory for a goal, from the first metric rung it has a target for.
 *
 * Goals whose rungs are counts, streaks or confirmations get nothing here,
 * and that is correct — "read twelve books" has no rate to fit, and a
 * projection invented for it would be arithmetic pretending to be insight.
 */
export function goalTrajectory(
  goal: Goal,
  metrics: MetricObservation[],
  now = new Date(),
): Trajectory | null {
  const metricRungs = (goal.milestones ?? [])
    .filter((m) => !m.done && m.doneWhen?.kind === 'metric')
    .map((m) => m.doneWhen as Extract<DoneWhen, { kind: 'metric' }>);
  const rung = metricRungs[metricRungs.length - 1] ?? null;
  if (!rung) return null;
  return projectMetric(metrics, rung.metricKey, rung.value, {
    toward: rung.op === 'gte' ? 'higher' : 'lower',
    targetDate: goal.targetDate,
    now,
  });
}

/** Every projection worth showing, most urgent first. */
export function allTrajectories(
  goals: Goal[],
  metrics: MetricObservation[],
  now = new Date(),
): { goal: Goal; trajectory: Trajectory }[] {
  const order: Record<Verdict, number> = {
    behind: 0,
    'wrong-way': 1,
    flat: 2,
    'on-track': 3,
    ahead: 4,
    arrived: 5,
    'not-enough-data': 6,
  };
  return goals
    .filter((g) => g.status === 'active')
    .map((goal) => ({ goal, trajectory: goalTrajectory(goal, metrics, now) }))
    .filter((x): x is { goal: Goal; trajectory: Trajectory } => x.trajectory !== null)
    .sort((a, b) => order[a.trajectory.verdict] - order[b.trajectory.verdict]);
}
