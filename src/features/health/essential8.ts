/**
 * The week, read against a published score rather than one we invented.
 *
 * Isaac asked for an overall health tracker: things logged this week
 * against unhealthy habits. The obvious build is a number that goes up
 * when you train and down when you drink, and this app has already
 * refused that once, in `BehaviourLog`: "a number here would become a
 * total, a total would become a chart, and the chart would be a
 * restriction scoreboard aimed at the people least well served by one."
 *
 * That objection is to a scoreboard WE made up. It is not an objection to
 * measurement, and the field already has a measured answer.
 *
 * ── LIFE'S ESSENTIAL 8 ──────────────────────────────────────────────────
 *
 * The American Heart Association's 2022 construct of cardiovascular
 * health. Eight components, each scored 0–100 against published
 * thresholds, composite is their unweighted mean, and the categories are
 * 0–49 low, 50–74 intermediate, 75–100 high. It replaced Life's Simple 7
 * and added sleep.
 *
 * It earns its place here because it has been tested as a predictor
 * rather than proposed as a dashboard: in prospective cohorts a higher
 * score carries a LINEAR dose-response with both all-cause and
 * cardiovascular mortality. That is the sentence that makes a score worth
 * showing somebody — not that it feels motivating, but that moving it
 * moves something real.
 *
 * ── WHAT THIS APP CAN AND CANNOT SEE ────────────────────────────────────
 *
 * Four of the eight. Physical activity, nicotine exposure, sleep and BMI
 * are all observable from what the app already holds. Diet needs a dietary
 * pattern score the app does not compute; blood lipids, blood glucose and
 * blood pressure need a pathology result and a cuff.
 *
 * So the composite here is the mean of what is OBSERVED and is labelled
 * as such everywhere. It is not a Life's Essential 8 score and must never
 * be presented as one — half the components missing is half the construct
 * missing, and the three blood measures are where a lot of the risk
 * actually sits. Saying "4 of 8" every time is the price of using the
 * name at all.
 *
 * ── WHAT IS DELIBERATELY NOT IN THE SCORE ───────────────────────────────
 *
 * Alcohol. It is not a Life's Essential 8 component, and quietly adding it
 * would make this our composite wearing the AHA's name. It is reported
 * beside the score against its own source — the Australian guideline of no
 * more than ten standard drinks a week and no more than four on any day —
 * because it matters and because Isaac asked for it.
 *
 * Nothing here subtracts. A component scores what the published table says
 * it scores; a heavy week shows up as a lower component, in public, with
 * the threshold named. That is measurement rather than a penalty, and the
 * difference is that a person can see exactly what moved and why.
 */

import { protocolById } from '@/features/knowledge/protocols';
import type { MetricObservation } from '@/features/model/metrics';
import type { BehaviourEvent, BehaviourIntention, DailyPlan, Routine } from '@/types/domain';
import { addDays } from '@/lib/dates';

export type ComponentKey =
  | 'activity'
  | 'nicotine'
  | 'sleep'
  | 'bmi'
  | 'diet'
  | 'lipids'
  | 'glucose'
  | 'bloodPressure';

export interface Component {
  key: ComponentKey;
  label: string;
  /** 0–100 on the published scale, or null where it cannot be observed. */
  score: number | null;
  /** What was actually measured, in the person's terms. */
  detail: string;
  /** What the evidence says this component buys. */
  why: string;
  /** Why it is not observed, where it is not. */
  blocked?: string;
}

export const CATEGORY_CUTOFFS = { intermediate: 50, high: 75 } as const;

/* ── The published scoring tables ─────────────────────────────────────── */

/** Minutes a week of moderate-intensity activity. AHA, Life's Essential 8. */
export function activityScore(minutesPerWeek: number): number {
  if (minutesPerWeek >= 150) return 100;
  if (minutesPerWeek >= 120) return 90;
  if (minutesPerWeek >= 90) return 80;
  if (minutesPerWeek >= 60) return 60;
  if (minutesPerWeek >= 30) return 40;
  if (minutesPerWeek >= 1) return 20;
  return 0;
}

export type NicotineStatus =
  | 'never'
  | 'quit5y'
  | 'quit1to5y'
  | 'inhaledNicotine'
  | 'smokesNow';

/**
 * Nicotine exposure. Note that the scale is about STATUS rather than
 * count: an inhaled nicotine delivery system — vaping — scores 25 on the
 * published table whether it happened twice this week or twenty times.
 * The app does not have a finer instrument than the table does.
 */
export function nicotineScore(status: NicotineStatus): number {
  switch (status) {
    case 'never': return 100;
    case 'quit5y': return 75;
    case 'quit1to5y': return 50;
    case 'inhaledNicotine': return 25;
    case 'smokesNow': return 0;
  }
}

/** Average hours a night. */
export function sleepScore(hours: number): number {
  if (hours >= 7 && hours < 9) return 100;
  if (hours >= 9 && hours < 10) return 90;
  if (hours >= 6 && hours < 7) return 70;
  if ((hours >= 5 && hours < 6) || hours >= 10) return 40;
  if (hours >= 4 && hours < 5) return 20;
  return 0;
}

export function bmiScore(bmi: number): number {
  if (bmi < 25) return 100;
  if (bmi < 30) return 70;
  if (bmi < 35) return 30;
  if (bmi < 40) return 15;
  return 0;
}

/* ── Reading the week out of what the app holds ───────────────────────── */

/**
 * What counts as physical activity, and what deliberately does not.
 *
 * Life's Essential 8 scores MINUTES OF MODERATE-TO-VIGOROUS PHYSICAL
 * ACTIVITY, self-reported. That is a narrower thing than "time spent on
 * health": a ten-minute mobility routine, a sauna, a breathing practice and
 * a meal plan all live in the health area of this app and none of them is
 * MVPA. Counting the health area wholesale would have inflated the
 * component that Isaac's own week loads most heavily, which is the one way
 * a score like this becomes worse than no score.
 *
 * So an item counts when it is a session the gym modality runs
 * (`sessionType === 'workout'`), or when its routine's protocol sits in the
 * training pillar and is not on the list below of training-pillar practices
 * that are preparation, mobility, recovery or planning rather than effort.
 *
 * Two known ways this UNDERSTATES, both deliberate:
 *  - The published table pays vigorous minutes double. The app does not
 *    know intensity, so every counted minute is scored as moderate.
 *  - Activity the app never saw — a walk to the shops, a weekend hike —
 *    cannot be counted. The card says so rather than implying the number
 *    is a measure of the week rather than of the week the app watched.
 *
 * Understating is the safe direction. It can prompt somebody to move more;
 * it cannot tell somebody they have done enough when they have not.
 */
const NOT_MVPA = new Set([
  'training-warmup',
  'prelift-ankle-hip',
  'mobility-10',
  'stretch-target-rom',
  'end-range-strength',
  'thoracic-desk-reset',
  'niggle-check',
  'train-to-symptoms',
  'cycle-symptom-log',
  'add-one-to-your-estimate',
  'two-in-the-tank-for-strength',
  'deload-week',
  'race-taper',
  'easy-day-discipline',
  'caffeine-timing',
  'cold-finish',
  'cold-for-tomorrow',
  'cold-on-non-lifting-days',
  'sauna-recovery-low-heat',
  'pelvic-floor-training',
]);

/** True where this plan item is moderate-to-vigorous physical activity. */
export function countsAsActivity(
  item: { sessionType?: string; routineId?: string },
  routines: Routine[],
): boolean {
  if (item.sessionType === 'workout') return true;
  if (!item.routineId) return false;
  const routine = routines.find((r) => r.id === item.routineId);
  const protocol = routine?.protocolId ? protocolById(routine.protocolId) : undefined;
  if (!protocol || protocol.pillar !== 'training') return false;
  return !NOT_MVPA.has(protocol.id);
}

/**
 * Minutes of completed physical activity across the seven days to `today`,
 * or null where the app was not watching the week at all.
 *
 * The distinction matters more than it looks. Zero minutes scores zero on
 * the published table, and zero is the right answer for a week the app
 * watched and nothing happened in. It is the WRONG answer for somebody who
 * opened the app on Sunday with no plan behind them — there, the app has
 * not measured a sedentary week, it has measured nothing, and reporting a
 * nought would be the app inventing a failure and then scoring it.
 *
 * So the week counts as watched when it holds any plan item at all,
 * whatever became of it. A week of planned sessions all skipped is a real
 * zero and shows as one.
 */
export function activityMinutes(
  plans: Record<string, DailyPlan>,
  routines: Routine[],
  today: string,
): number | null {
  const from = addDays(today, -6);
  let minutes = 0;
  let watched = false;
  for (const [date, plan] of Object.entries(plans)) {
    if (date < from || date > today) continue;
    if (plan.items.length > 0) watched = true;
    for (const item of plan.items) {
      if (item.status !== 'completed') continue;
      if (!countsAsActivity(item, routines)) continue;
      const [sh, sm] = item.start.split(':').map(Number);
      const [eh, em] = item.end.split(':').map(Number);
      minutes += Math.max(0, eh * 60 + em - (sh * 60 + sm));
    }
  }
  return watched ? minutes : null;
}

/** The most recent value of a metric, or null. */
function latest(metrics: MetricObservation[], key: string): number | null {
  let best: MetricObservation | null = null;
  for (const m of metrics) {
    if (m.key !== key) continue;
    if (!best || m.at > best.at) best = m;
  }
  return best ? best.value : null;
}

/** Mean of a metric across the seven days to `today`. */
function meanThisWeek(
  metrics: MetricObservation[],
  key: string,
  today: string,
): number | null {
  const from = addDays(today, -6);
  const values = metrics
    .filter((m) => m.key === key && m.at.slice(0, 10) >= from && m.at.slice(0, 10) <= today)
    .map((m) => m.value);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Nicotine status from what the app can see.
 *
 * Deliberately conservative and deliberately limited. The app knows
 * whether somebody logged vaping or smoking recently; it does not know
 * whether a person who has logged nothing never smoked or quit last year,
 * and those score 100 and 25. So an absence of logs is NOT read as
 * "never" — it is read as not observed, and the card asks rather than
 * assumes.
 */
export function nicotineFromLogs(
  intentions: BehaviourIntention[],
  events: BehaviourEvent[],
  today: string,
  windowDays = 30,
): NicotineStatus | null {
  const from = addDays(today, -(windowDays - 1));
  const byId = new Map(intentions.map((i) => [i.id, i.behaviour]));
  let smoked = false;
  let vaped = false;
  for (const e of events) {
    const date = e.occurredAt.slice(0, 10);
    if (date < from || date > today) continue;
    const behaviour = byId.get(e.intentionId);
    if (behaviour === 'smoking') smoked = true;
    if (behaviour === 'vaping') vaped = true;
  }
  if (smoked) return 'smokesNow';
  if (vaped) return 'inhaledNicotine';
  // A clear month is not a status. Somebody working on quitting who had a
  // clean thirty days scores 50 or 75 depending on when they stopped, and
  // somebody who never started scores 100 — the app cannot tell those apart
  // from an absence of logs, and the gap between the ends is the whole
  // scale. Unknown is the honest answer; the card asks.
  return null;
}

export interface WeekInputs {
  plans: Record<string, DailyPlan>;
  routines: Routine[];
  metrics: MetricObservation[];
  intentions: BehaviourIntention[];
  events: BehaviourEvent[];
  today: string;
  /** Stated directly, where the logs cannot tell 'never' from 'quit'. */
  nicotine?: NicotineStatus;
}

export interface WeekHealth {
  components: Component[];
  observed: Component[];
  /** Mean of the observed components. NOT a Life's Essential 8 score. */
  composite: number | null;
  band: 'low' | 'intermediate' | 'high' | null;
  headline: string;
  /** The single component with the most room, by published points. */
  biggestGap: Component | null;
}

export function weekHealth(input: WeekInputs): WeekHealth {
  const { plans, routines, metrics, intentions, events, today } = input;

  const minutes = activityMinutes(plans, routines, today);
  const sleepHours = meanThisWeek(metrics, 'sleep.hours', today);
  const weightKg = latest(metrics, 'body.weight');
  const heightCm = latest(metrics, 'body.height');
  const bmi = weightKg && heightCm ? weightKg / (heightCm / 100) ** 2 : null;
  const nicotine = input.nicotine ?? nicotineFromLogs(intentions, events, today);

  const components: Component[] = [
    {
      key: 'activity',
      label: 'Physical activity',
      score: minutes === null ? null : activityScore(minutes),
      detail:
        minutes === null
          ? 'No week to read yet'
          : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} of training the app watched this week`,
      why: 'The component with the most room to move for most people. The published table pays full marks at 150 minutes a week and pays something for anything above zero — the step from nothing to a little is worth more than the step from a lot to more. Only sessions the app saw are counted, and mobility, sauna and warm-ups are not counted as activity, so a real week is usually better than this number.',
      blocked:
        minutes === null
          ? 'Nothing was planned this week, so there is no week to read. This scores from the first session you plan or log.'
          : undefined,
    },
    {
      key: 'nicotine',
      label: 'Nicotine',
      score: nicotine ? nicotineScore(nicotine) : null,
      detail: nicotine
        ? {
            never: 'Never used',
            quit5y: 'Quit more than five years ago',
            quit1to5y: 'Quit one to five years ago',
            inhaledNicotine: 'Vaping or another inhaled nicotine product',
            smokesNow: 'Smoking now',
          }[nicotine]
        : 'Not known',
      why: 'The largest single modifiable component in the construct, and the only one where the published table separates people by a hundred points. Vaping is not scored as zero, and it is not scored as clean either: an inhaled nicotine product sits at 25.',
      blocked: nicotine
        ? undefined
        : 'The logs cannot tell somebody who never smoked from somebody who quit last year, and the table puts a hundred points between them. Tell the app which, and this scores.',
    },
    {
      key: 'sleep',
      label: 'Sleep',
      score: sleepHours === null ? null : sleepScore(sleepHours),
      detail: sleepHours === null ? 'No sleep recorded this week' : `${sleepHours.toFixed(1)} hours a night on average`,
      why: 'The component added in 2022, and the one most people are surprised to see scored at all. Seven to nine hours takes full marks; both ends of that window cost points, which is why "more is better" is the wrong instinct here.',
      blocked: sleepHours === null ? 'Connect Apple Health, or log a night, and this scores.' : undefined,
    },
    {
      key: 'bmi',
      label: 'Body mass index',
      score: bmi === null ? null : bmiScore(bmi),
      detail: bmi === null ? 'Height or weight missing' : `${bmi.toFixed(1)}`,
      why: 'A crude instrument that the construct uses anyway, because at population scale it predicts. It says nothing about one person’s build, and a heavily muscled person will score below where their health sits.',
      blocked: bmi === null ? 'Add your height and weight in Body numbers and this scores.' : undefined,
    },
    {
      key: 'diet',
      label: 'Diet',
      score: null,
      detail: 'Not scored',
      why: 'Scored in the construct from a full dietary-pattern questionnaire, which the app does not run. The fibre and less-processed practices in the library are the levers this component rewards.',
      blocked: 'Needs a dietary pattern score the app does not compute.',
    },
    {
      key: 'lipids',
      label: 'Blood lipids',
      score: null,
      detail: 'Not scored',
      why: 'Non-HDL cholesterol. One of the three components carrying a large share of the risk, and one no phone can see.',
      blocked: 'Needs a blood test. Worth asking your GP for, alongside glucose.',
    },
    {
      key: 'glucose',
      label: 'Blood glucose',
      score: null,
      detail: 'Not scored',
      why: 'HbA1c or fasting glucose. The component that most often moves first and silently.',
      blocked: 'Needs a blood test.',
    },
    {
      key: 'bloodPressure',
      label: 'Blood pressure',
      score: null,
      detail: 'Not scored',
      why: 'The single largest contributor to cardiovascular risk at population level, and completely invisible without a cuff.',
      blocked: 'Needs a cuff. Pharmacies measure it free.',
    },
  ];

  const observed = components.filter((c) => c.score !== null);
  const composite =
    observed.length === 0
      ? null
      : observed.reduce((sum, c) => sum + (c.score ?? 0), 0) / observed.length;

  const band =
    composite === null
      ? null
      : composite >= CATEGORY_CUTOFFS.high
        ? 'high'
        : composite >= CATEGORY_CUTOFFS.intermediate
          ? 'intermediate'
          : 'low';

  // The most room, measured in published points rather than in opinion.
  const biggestGap =
    observed.length === 0
      ? null
      : observed.reduce((worst, c) => ((c.score ?? 100) < (worst.score ?? 100) ? c : worst));

  const headline =
    composite === null
      ? 'Nothing observed yet'
      : `${Math.round(composite)} across the ${observed.length} of 8 we can see`;

  return { components, observed, composite, band, headline, biggestGap };
}

/* ── Alcohol, beside the score rather than inside it ──────────────────── */

/** NHMRC: no more than 10 standard drinks a week, no more than 4 in a day. */
export const ALCOHOL_GUIDELINE = { perWeek: 10, perDay: 4 } as const;

export interface AlcoholWeek {
  events: number;
  /** True where a single day carried more than the daily guideline's worth. */
  heaviestDay: number;
  line: string;
}

/**
 * Counted, never scored.
 *
 * The app records that a drinking occasion happened, not how many standard
 * drinks were in it — `BehaviourLog` refuses a quantity on purpose. So this
 * reports occasions against the guideline's shape and says plainly what it
 * cannot know, rather than inventing a number of units.
 */
export function alcoholWeek(
  intentions: BehaviourIntention[],
  events: BehaviourEvent[],
  today: string,
): AlcoholWeek | null {
  const drinking = intentions.filter((i) => i.behaviour === 'alcohol').map((i) => i.id);
  if (drinking.length === 0) return null;
  const from = addDays(today, -6);
  const byDay = new Map<string, number>();
  for (const e of events) {
    if (!drinking.includes(e.intentionId)) continue;
    const date = e.occurredAt.slice(0, 10);
    if (date < from || date > today) continue;
    byDay.set(date, (byDay.get(date) ?? 0) + 1);
  }
  const total = [...byDay.values()].reduce((a, b) => a + b, 0);
  const heaviestDay = byDay.size === 0 ? 0 : Math.max(...byDay.values());
  return {
    events: total,
    heaviestDay,
    line:
      total === 0
        ? 'No drinking occasions logged this week.'
        : `${total} drinking ${total === 1 ? 'occasion' : 'occasions'} across ${byDay.size} ${byDay.size === 1 ? 'day' : 'days'}. The Australian guideline is no more than ten standard drinks a week and no more than four on any day — the app counts occasions rather than drinks, so how those compare is yours to judge.`,
  };
}
