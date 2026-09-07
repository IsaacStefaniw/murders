/**
 * Goal composer — any goal becomes the universal loop (docs/VISION.md).
 *
 * The goal planner turns one sentence into domain-shaped milestones and a
 * recurring behaviour. The composer is the layer above it: where a
 * measurable target can be read from the goal, the milestones become steps
 * with explicit `doneWhen` conditions, and the goal gets a check-in schema
 * — how progress is measured, how often, and at whose effort. Steps backed
 * by a metric, a session count or a streak are checked off from evidence;
 * `assessGoal` states the verdict with its reason.
 *
 * What the research asks of a step, and what each one here carries:
 *
 * - A number and a date. Specific goals beat vague ones, and a far target
 *   on its own does not move anyone; the near markers do (Bandura and
 *   Schunk's proximal sub-goals). So every step has a value where one can
 *   be read, and a date computed from the pace the target date implies.
 * - The behaviour under it. Outcome-only goals are the weakest kind; the
 *   process goal — the routine on the calendar — is what carries the
 *   effect. Every step says how it gets reached, in the routine's own
 *   words.
 * - One "when X, I will Y" line. Implementation intentions are among the
 *   best-replicated findings in behaviour change (Gollwitzer and Sheeran,
 *   d = 0.65). One per step, plain, about the moment the plan meets the day.
 * - A check-in whose cadence matches the pace. Monitoring progress is the
 *   mechanism, not a nicety (Harkin et al. 2016); a number that changes
 *   monthly is asked weekly, a weight every few days, revenue monthly.
 *
 * Deterministic all the way down, so the simulation lab can gate it.
 */

import { addDays, dateKeyOfIso, dateKeyToDate, newId, todayKey } from '@/lib/dates';
import type {
  CheckinSpec,
  DoneWhen,
  Goal,
  GoalMilestone,
  GoalPace,
  LifeProfile,
  PlanActionEvent,
  Routine,
  Weekday,
} from '@/types/domain';

import { latest, type MetricObservation } from '@/features/model/metrics';

import { buildGoalPlan, parseGoal, timeframeToDate, type GoalPlan, type ParsedGoal } from './goalPlanner';
import { STALL_DAYS } from './stalled';

/** "$2m" → 2_000_000; "$40k" → 40_000; "$100,000" → 100_000; "120kg" → 120; "15%" → 15. */
export function parseTargetValue(target?: string): { value: number; unit: string } | null {
  if (!target) return null;
  const m = target.replace(/,/g, '').match(/\$?\s*([\d.]+)\s*(million|kg|km|lbs|m|k|%)?/i);
  if (!m) return null;
  let value = Number(m[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const suffix = (m[2] ?? '').toLowerCase();
  const money = target.trim().startsWith('$');
  if (suffix === 'm' || suffix === 'million') value *= 1_000_000;
  if (suffix === 'k' && money) value *= 1_000;
  const unit = money ? '$' : suffix === 'kg' || suffix === 'lbs' ? 'kg' : suffix === 'km' || (suffix === 'k' && !money) ? 'km' : suffix === '%' ? '%' : '';
  return { value, unit };
}

const LIFTS: [RegExp, string, string][] = [
  [/bench/i, 'strength.bench.e1rm', 'Bench press'],
  [/squat/i, 'strength.squat.e1rm', 'Squat'],
  [/deadlift/i, 'strength.deadlift.e1rm', 'Deadlift'],
  [/overhead|ohp|press/i, 'strength.ohp.e1rm', 'Overhead press'],
];

/** What this pass knows beyond the sentence: the day, the date, the readings so far. */
export interface ComposeContext {
  /** "YYYY-MM-DD", local. Defaults to today. */
  today?: string;
  /** The date the person chose; wins over the one read from the sentence. */
  targetDate?: string;
  /** Readings so far — a lift's estimated max, a weight — so a step can start from where they are. */
  metrics?: MetricObservation[];
}

interface StepExtras {
  dueDate?: string;
  how?: string;
  intention?: string;
}

const step = (title: string, doneWhen: DoneWhen, extras: StepExtras = {}): GoalMilestone => ({
  id: newId('ms'),
  title,
  done: false,
  doneWhen,
  ...extras,
});

const fmt = (value: number, unit: string): string =>
  unit === '$' ? `$${value.toLocaleString('en-AU')}` : `${value}${unit ? ` ${unit}` : ''}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2028-06-30" → "30 Jun 2028". Year included: a goal can be two years out. */
export function formatDay(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** [1, 3, 5] → "Mon, Wed and Fri"; [0] → "Sundays"; all seven → "every day". */
export function dayNames(days: Weekday[]): string {
  if (days.length >= 7) return 'every day';
  if (days.length === 1) return `${DAY_NAMES[days[0]]}s`;
  const sorted = [...days].sort((a, b) => a - b).map((d) => DAY_SHORT[d]);
  return `${sorted.slice(0, -1).join(', ')} and ${sorted[sorted.length - 1]}`;
}

const daysBetween = (from: string, to: string): number =>
  Math.round((dateKeyToDate(to).getTime() - dateKeyToDate(from).getTime()) / 86400e3);

const DAYS_PER_MONTH = 30.4375;

const monthsBetween = (from: string, to: string): number => daysBetween(from, to) / DAYS_PER_MONTH;

/**
 * The pace a savings target implies: how much a month, from where the
 * person is to where they want to be, by the date. Pure arithmetic and
 * nothing else — no rate of return, no product, no advice about how.
 *
 * This belongs with the money coach's `savingsPlan` once that lands; it
 * lives here so the goal draft can compute the monthly amount today.
 */
export function savingsPace(
  current: number,
  target: number,
  today: string,
  targetDate: string,
): { perMonth: number; months: number } | null {
  const months = monthsBetween(today, targetDate);
  if (months <= 0 || target <= current) return null;
  return { perMonth: Math.round((target - current) / months), months: Math.round(months * 10) / 10 };
}

/**
 * The date a value is reached at a straight-line pace from the start to
 * the target. Steps between get their dates from here.
 */
function dateAtValue(
  startValue: number,
  targetValue: number,
  startDate: string,
  targetDate: string,
  value: number,
): string {
  const span = targetValue - startValue;
  if (span === 0) return targetDate;
  const fraction = Math.min(1, Math.max(0, (value - startValue) / span));
  return addDays(startDate, Math.round(daysBetween(startDate, targetDate) * fraction));
}

/** The routine's own line: "Strength on Mon, Wed and Fri, 45 min". */
function routineLine(r: Routine | undefined): string | undefined {
  if (!r) return undefined;
  return `${r.title} on ${dayNames(r.days)}, ${r.durationMin} min`;
}

/**
 * Compose a full draft: planner routines + measurable steps + check-in
 * schema. Falls back to the planner's own milestones (as confirm steps)
 * where no measurable target can be read — an honest list beats a fake
 * number.
 */
export function composeGoalDraft(
  parsed: ParsedGoal,
  profile: LifeProfile | null,
  why?: string,
  answers: Record<string, string> = {},
  ctx: ComposeContext = {},
): GoalPlan {
  const plan = buildGoalPlan(parsed, profile, why, answers);
  const goalId = plan.goal.id;
  const today = ctx.today ?? todayKey();
  const targetDate = ctx.targetDate ?? timeframeToDate(parsed.timeframe, today);
  const metrics = ctx.metrics ?? [];
  const target = parseTargetValue(parsed.target);
  const text = parsed.title;

  let ladder: GoalMilestone[] | null = null;
  let pace: GoalPace | undefined;
  const checkins: CheckinSpec[] = [];

  const planCheckin = (label: string): CheckinSpec => ({
    id: newId('ci'),
    metricKey: `goal.${goalId}.sessions`,
    label,
    cadenceDays: 7,
    source: 'plan',
  });

  const workout = plan.routines.find((r) => r.sessionType === 'workout');
  const mainRoutine = plan.routines[0];
  /** Sessions a week across the goal's routines, for dating count steps. */
  const sessionsPerWeek = Math.max(1, plan.routines.reduce((n, r) => n + r.days.length, 0));
  const weeksFor = (sessions: number) => Math.ceil(sessions / sessionsPerWeek);

  const lift = LIFTS.find(([re]) => re.test(text));
  const isFitness = parsed.domain === 'fitness' || parsed.domain === 'health';
  const savingWords = /\b(save|savings|deposit|buffer|emergency fund|set aside|put away)\b/i.test(text);
  const debtWords = /\b(pay off|debt|clear|credit card|loan|mortgage)\b/i.test(text);

  if (isFitness && lift && target && target.unit === 'kg') {
    // Strength target: consistency first, then the number. The estimated
    // max arrives from logged working sets — no extra measurement to
    // remember. With a reading already in, a halfway load gets its own
    // step and date; without one the first sessions produce it.
    const [, metricKey, label] = lift;
    const how = routineLine(workout)
      ? `${routineLine(workout)} — the load rises a little each week`
      : 'Strength sessions on the plan — the load rises a little each week';
    const intention = 'When the session is on today’s plan, I will load today’s number before deciding how I feel about it.';
    const baseline = latest(metrics, metricKey)?.value;
    const liftStep = (value: number, due?: string) =>
      step(`${label} at ${fmt(value, 'kg')} (estimated 1RM)`, { kind: 'metric', metricKey, op: 'gte', value, unit: 'kg' }, { dueDate: due, how, intention });
    ladder = [
      step('First week of sessions in', { kind: 'streak', weeks: 1, minPerWeek: 2 }, { dueDate: addDays(today, 7), how, intention }),
      step('Four consistent weeks', { kind: 'streak', weeks: 4, minPerWeek: 2 }, { dueDate: addDays(today, 28), how, intention }),
    ];
    if (baseline && baseline < target.value) {
      const mid = Math.round((baseline + (target.value - baseline) / 2) * 2) / 2;
      ladder.push(liftStep(mid, targetDate ? dateAtValue(baseline, target.value, today, targetDate, mid) : undefined));
      if (targetDate) {
        const months = monthsBetween(today, targetDate);
        if (months > 0) {
          pace = { perMonth: Math.round(((target.value - baseline) / months) * 10) / 10, unit: 'kg', startValue: baseline, startDate: today, targetValue: target.value };
        }
      }
    }
    ladder.push(liftStep(target.value, targetDate));
    checkins.push({
      id: newId('ci'),
      metricKey,
      label: `${label} estimated 1RM`,
      unit: 'kg',
      cadenceDays: 7,
      source: 'plan',
    });
  } else if (isFitness && /\b(marathon|half marathon|triathlon|10k|5k|fun run|race)\b/i.test(text)) {
    // Endurance event: the build is consistency, counted back from the
    // day; the day itself only the person can call. A near event drops
    // the base steps it has no room for rather than dating them past it.
    const how = routineLine(workout)
      ? `${routineLine(workout)}, one of them long`
      : 'Runs on the plan, one of them long';
    const intention = 'When I get home and do not feel like it, I will put my shoes on and run ten minutes — stopping after that is allowed.';
    const daysLeft = targetDate ? daysBetween(today, targetDate) : Infinity;
    ladder = [];
    if (daysLeft >= 35) {
      ladder.push(step('Four consistent training weeks', { kind: 'streak', weeks: 4, minPerWeek: 2 }, { dueDate: addDays(today, 28), how, intention }));
    }
    if (daysLeft >= 70) {
      ladder.push(step('Eight weeks in — the base is real', { kind: 'streak', weeks: 8, minPerWeek: 2 }, { dueDate: addDays(today, 56), how, intention }));
    }
    ladder.push(
      step('Longest session done and recovered from', { kind: 'confirm' }, {
        dueDate: targetDate ? addDays(targetDate, -14) : undefined,
        how: 'The long one, two weekends before the day, then an easy fortnight',
        intention: 'When the long run is on the plan, I will start it slower than feels right.',
      }),
      step('Event completed', { kind: 'confirm' }, {
        dueDate: targetDate,
        how: 'Turn up rested. The work is already done.',
        intention: 'When the day comes, I will run the first half at the pace I trained, not the pace of the crowd.',
      }),
    );
    checkins.push(planCheckin('Training sessions completed'));
  } else if (isFitness && target && target.unit === 'kg' && /\b(weigh|weight|lose|lean|cut|down to|get to)\b/i.test(text)) {
    // Body-weight target: absolute ("get to 80kg") uses the number; a delta
    // ("lose 5kg") needs a starting weight to become one. The trend, not a
    // morning, is what moves a step; the readings arrive from Health.
    const startWeight = profile?.weightKg ?? latest(metrics, 'body.weight')?.value;
    const lose = /\b(lose|cut|down|drop)\b/i.test(text) || target.value < (startWeight ?? Infinity);
    const absolute = /\b(to|at|reach|get to)\b/i.test(text) || !startWeight
      ? target.value
      : lose
        ? startWeight - target.value
        : startWeight + target.value;
    const how = plan.routines.length > 0
      ? `${plan.routines.map((r) => routineLine(r)).join(' · ')} · weigh-ins arrive from Apple Health`
      : 'Weigh-ins arrive from Apple Health, same time of day';
    const intention = 'When I sit down to eat, I will put the protein on the plate first.';
    const weightStep = (value: number, due?: string) =>
      step(`Body weight ${lose ? 'at or under' : 'at or over'} ${fmt(value, 'kg')}`, { kind: 'metric', metricKey: 'body.weight', op: lose ? 'lte' : 'gte', value, unit: 'kg' }, { dueDate: due, how, intention });
    ladder = [
      step('Three weeks of weigh-ins — the trend is visible', { kind: 'confirm' }, {
        dueDate: addDays(today, 21),
        how: 'Two or three mornings a week on the scales; Health carries the number in',
        intention: 'When I get up on a weigh-in morning, I will step on the scales before coffee.',
      }),
    ];
    if (startWeight && startWeight !== absolute) {
      const gap = absolute - startWeight;
      for (const f of [1 / 3, 2 / 3]) {
        const value = Math.round((startWeight + gap * f) * 2) / 2;
        ladder.push(weightStep(value, targetDate ? dateAtValue(startWeight, absolute, today, targetDate, value) : undefined));
      }
      if (targetDate) {
        const months = monthsBetween(today, targetDate);
        if (months > 0) {
          const perMonth = Math.round((Math.abs(gap) / months) * 10) / 10;
          const perWeek = perMonth / 4.35;
          pace = {
            perMonth,
            unit: 'kg',
            startValue: startWeight,
            startDate: today,
            targetValue: absolute,
            // Faster than most people hold, said plainly and handed on.
            note: perWeek > 1
              ? `That date needs about ${Math.round(perWeek * 10) / 10} kg a week. Faster than about a kilo a week is more than most people can keep up; a later date is kinder, and a GP or dietitian is the person to ask about a fast one.`
              : undefined,
          };
        }
      }
    }
    ladder.push(weightStep(absolute, targetDate));
    checkins.push({
      id: newId('ci'),
      metricKey: 'body.weight',
      label: 'Body weight',
      unit: 'kg',
      cadenceDays: 3,
      source: 'health',
    });
  } else if (parsed.domain === 'finance' && target && target.unit === '$' && (savingWords || !debtWords)) {
    // Savings target, the worked example: from where the person is to the
    // number by the date. The monthly amount is the target date's own
    // arithmetic. Steps come fast at first — the first $1,000 more, a month
    // of expenses banked — then quarter marks. Each is dated at the pace,
    // tied to the payday transfer and the Sunday check-in.
    const current = Math.max(0, Number(answers.saved) || 0);
    const expenses = Math.max(0, Number(answers.expenses) || 0);
    const metricKey = `goal.${goalId}.saved`;
    const checkin = plan.routines.find((r) => r.protocolId === 'money-checkin');
    const checkinLine = checkin ? `Money check-in on ${dayNames(checkin.days)}` : 'Money check-in on Sundays';
    const paced = targetDate ? savingsPace(current, target.value, today, targetDate) : null;
    const monthly = paced ? fmt(paced.perMonth, '$') : null;
    const how = monthly
      ? `${monthly} a month moved on payday, before anything else · ${checkinLine}`
      : `A fixed amount moved on payday, before anything else · ${checkinLine}`;
    const intention = monthly
      ? `When pay lands, I will move the ${monthly} before anything else is spent.`
      : 'When pay lands, I will move the savings before anything else is spent.';
    if (paced) {
      pace = { perMonth: paced.perMonth, unit: '$', startValue: current, startDate: today, targetValue: target.value };
    }

    const candidates: [number, string][] = [
      [current + 1000, 'First $1,000 more'],
      [expenses, 'A month of expenses banked'],
      [Math.round(target.value * 0.25), 'A quarter of the way'],
      [Math.round(target.value * 0.5), 'Halfway'],
      [Math.round(target.value * 0.75), 'Three quarters'],
      [target.value, 'Done'],
    ];
    const seen = new Set<number>();
    const amounts = candidates
      .filter(([v]) => v > current && v <= target.value && !seen.has(v) && seen.add(v))
      .sort((a, b) => a[0] - b[0]);

    ladder = [];
    // Only when they said the transfer is not running: what someone has
    // already automated decides where the first move is, and an unasked
    // question is not a "no".
    if (answers.automation === 'no' || answers.automation === 'partial') {
      ladder.push(
        step('The transfer set up on payday', { kind: 'confirm' }, {
          dueDate: addDays(today, 7),
          how: 'Set once in the banking app; after that it runs without you',
          intention: 'When I next open the banking app, I will set the transfer up before I close it.',
        }),
      );
    }
    for (const [value, label] of amounts) {
      ladder.push(
        step(`${label}: ${fmt(value, '$')} set aside`, { kind: 'metric', metricKey, op: 'gte', value, unit: '$' }, {
          dueDate: targetDate ? dateAtValue(current, target.value, today, targetDate, value) : undefined,
          how,
          intention,
        }),
      );
    }
    checkins.push({
      id: newId('ci'),
      metricKey,
      label: 'Amount set aside',
      unit: '$',
      cadenceDays: 7,
      source: 'ask',
      prompt: `How much is set aside toward “${text}” right now?`,
    });
  } else if (parsed.domain === 'finance' && target && target.unit === '$') {
    // A debt with a number: the same quarter marks, counted as paid off.
    const metricKey = `goal.${goalId}.paid`;
    const checkin = plan.routines.find((r) => r.protocolId === 'money-checkin');
    const how = `A fixed extra payment on payday, before anything else · Money check-in on ${dayNames(checkin?.days ?? [0])}`;
    const intention = 'When pay lands, I will make the extra payment before anything else is spent.';
    ladder = [
      step('Every debt listed with its rate', { kind: 'confirm' }, {
        dueDate: addDays(today, 7),
        how: 'One list, highest rate at the top',
        intention: 'When I next have twenty quiet minutes, I will write the list before anything else.',
      }),
      ...[0.25, 0.5, 0.75, 1].map((f, i) =>
        step(`${['A quarter of the way', 'Halfway', 'Three quarters', 'Done'][i]}: ${fmt(Math.round(target.value * f), '$')} paid off`, { kind: 'metric', metricKey, op: 'gte', value: Math.round(target.value * f), unit: '$' }, {
          dueDate: targetDate ? dateAtValue(0, target.value, today, targetDate, target.value * f) : undefined,
          how,
          intention,
        }),
      ),
    ];
    checkins.push({
      id: newId('ci'),
      metricKey,
      label: 'Amount paid off',
      unit: '$',
      cadenceDays: 7,
      source: 'ask',
      prompt: `How much of “${text}” is paid off so far?`,
    });
  } else if ((parsed.domain === 'business' || parsed.domain === 'career') && target && target.unit === '$') {
    const metricKey = `goal.${goalId}.revenue`;
    const growth = plan.routines.find((r) => r.sessionType === 'business_review');
    const how = growth ? `${routineLine(growth)} — one lever, worked before email` : 'The growth block each week — one lever, worked before email';
    const intention = 'When the growth block starts, I will work the lever from the last review before I open email.';
    ladder = [
      step('Current baseline written down', { kind: 'confirm' }, {
        dueDate: addDays(today, 7),
        how: 'The number as it stands, in the first review',
        intention: 'When the first growth block starts, I will write the current number before anything else.',
      }),
      ...[0.25, 0.5, 0.75, 1].map((f, i) =>
        step(`${['A quarter of the way', 'Halfway', 'Three quarters', 'Done'][i]}: ${fmt(Math.round(target.value * f), '$')} run rate`, { kind: 'metric', metricKey, op: 'gte', value: Math.round(target.value * f), unit: '$' }, {
          dueDate: targetDate ? dateAtValue(0, target.value, today, targetDate, target.value * f) : undefined,
          how,
          intention,
        }),
      ),
    ];
    checkins.push({
      id: newId('ci'),
      metricKey,
      label: 'Revenue run rate',
      unit: '$',
      cadenceDays: 30,
      source: 'ask',
      prompt: `Roughly, what's the current annualised revenue for “${text}”?`,
    });
  } else if (parsed.domain === 'personal' || parsed.domain === 'experience') {
    // Creative / project goals: the honest measure is sessions of real work,
    // plus the finish only the person can call. Experience goals keep the
    // planner's own concrete list (pick, dates, budget, book).
    if (parsed.domain === 'personal') {
      const how = routineLine(mainRoutine) ?? 'Working sessions on the plan';
      const intention = 'When the block starts, I will open the work before I open anything else.';
      ladder = [
        step('Five working sessions in', { kind: 'count', target: 5 }, { dueDate: addDays(today, weeksFor(5) * 7), how, intention }),
        step('Twenty sessions — this is a practice now', { kind: 'count', target: 20 }, { dueDate: addDays(today, weeksFor(20) * 7), how, intention }),
        step('Finished, by your own standard', { kind: 'confirm' }, { dueDate: targetDate, how, intention }),
      ];
      checkins.push(planCheckin('Working sessions completed'));
    }
  } else if (parsed.domain === 'relationship' || parsed.domain === 'family' || parsed.domain === 'friends') {
    /**
     * The goals with nothing external enforcing them.
     *
     * These had no steps at all — a date night or a family adventure was
     * filed as a goal and then given nothing, which meant it could never
     * visibly progress and never fed the trajectory engine. That is the
     * worst place to have the gap: nobody is going to send a calendar
     * invite for the thing you promised your own family, so the only
     * pressure on it is whether it can be seen working.
     *
     * The steps are weeks in a row rather than a count, because with these
     * the pattern IS the goal. Six occasional date nights across a year is
     * not the thing anybody meant. No number is invented for them.
     */
    const ritual = mainRoutine;
    const how = ritual
      ? `${ritual.title} on ${dayNames(ritual.days)} — in the diary before the week starts`
      : 'One fixed time a week, in the diary before the week starts';
    const intention = 'When something else lands on that time, I will move the something else.';
    ladder = [
      step('Two weeks running', { kind: 'streak', weeks: 2, minPerWeek: 1 }, { dueDate: addDays(today, 14), how, intention }),
      step('Six weeks running — it is starting to be normal', { kind: 'streak', weeks: 6, minPerWeek: 1 }, { dueDate: addDays(today, 42), how, intention }),
      step('A full season of it', { kind: 'streak', weeks: 12, minPerWeek: 1 }, { dueDate: addDays(today, 84), how, intention }),
    ];
    if (parsed.domain === 'relationship') {
      ladder.push(
        step('One conversation you had been putting off', { kind: 'confirm' }, {
          dueDate: addDays(today, 28),
          how: 'The first two sentences written down before you start',
          intention: 'When we have a quiet ten minutes, I will say the first sentence I wrote.',
        }),
      );
    }
    checkins.push(planCheckin('Times it actually happened'));
  } else if (parsed.domain === 'behaviour') {
    /**
     * Counted down rather than up, and never framed as a score.
     *
     * These used to be streak steps counting "weeks with the counter-move
     * in place" — but a behaviour goal puts nothing on the calendar, so no
     * completion ever carried its id and no step could ever tick. Steps
     * that cannot move are worse than none. They are dated and confirmed
     * by the person now, with the urge tool as the how. A single bad night
     * does not reset anything: the pattern is what is being changed.
     */
    const days = Number(text.match(/(\d+)\s*days?/i)?.[1]) || 0;
    const how = 'Every urge logged in the urge tool, the counter-move ready — the tool is always free';
    const intention = 'When the urge comes, I will do the two-minute breath reset before I decide anything.';
    ladder = [
      step('Name the usual trigger', { kind: 'confirm' }, {
        dueDate: addDays(today, 2),
        how: 'Three honest urge logs usually show it',
        intention: 'When I log an urge, I will note where I was and what had just happened.',
      }),
      step('Choose the counter-move', { kind: 'confirm' }, {
        dueDate: addDays(today, 2),
        how: 'One thing, small enough to do every time',
        intention: 'When the trigger shows up, I will do the counter-move before anything else.',
      }),
    ];
    if (days > 0) {
      const marks = [3, 7, 14, 30, 60, 90].filter((d) => d < days);
      for (const d of [...marks, days]) {
        ladder.push(step(`${d} days clear`, { kind: 'confirm' }, { dueDate: addDays(today, d), how, intention }));
      }
    } else {
      ladder.push(
        step('A week of logging honestly', { kind: 'confirm' }, { dueDate: addDays(today, 7), how, intention }),
        step('Four weeks of knowing your own pattern', { kind: 'confirm' }, { dueDate: addDays(today, 28), how, intention }),
        step('Twelve weeks — the pattern has changed', { kind: 'confirm' }, { dueDate: addDays(today, 84), how, intention }),
      );
    }
  }

  // Every step has a condition; planner milestones become confirm steps,
  // spread to the date where there is one, with the routine as the how.
  const base = ladder ?? plan.goal.milestones ?? [];
  const fallbackIntention = /\bmeditat/i.test(text)
    ? 'When the kettle goes on in the morning, I will sit for ten minutes before anything else.'
    : answers.anchor === 'sleep' || /\bsleep\b/i.test(text)
      ? 'When the wind-down comes up on the plan, I will put the phone on charge in another room.'
      : answers.anchor === 'food'
        ? 'When I plan Sunday, I will decide the dinners before the shop.'
        : 'When it comes up on today’s plan, I will start it before deciding whether I feel like it.';
  const milestones = base.map((m, i) => ({
    ...m,
    doneWhen: m.doneWhen ?? ({ kind: 'confirm' } as DoneWhen),
    dueDate:
      m.dueDate ??
      (ladder
        ? undefined
        : targetDate
          ? addDays(today, Math.round((daysBetween(today, targetDate) * (i + 1)) / base.length))
          : addDays(today, 14 * (i + 1))),
    how: m.how ?? (ladder ? undefined : routineLine(mainRoutine)),
    intention: m.intention ?? (ladder ? undefined : fallbackIntention),
  }));
  if (checkins.length === 0 && plan.routines.length > 0) {
    checkins.push(planCheckin('Sessions completed'));
  }

  return {
    ...plan,
    goal: {
      ...plan.goal,
      milestones: milestones.length > 0 ? milestones : undefined,
      checkins: checkins.length > 0 ? checkins : undefined,
      targetDate,
      pace,
    },
  };
}

/** One-sentence composer entry point. */
export function composeFromText(
  text: string,
  profile: LifeProfile | null,
  why?: string,
  answers: Record<string, string> = {},
  ctx: ComposeContext = {},
): GoalPlan {
  return composeGoalDraft(parseGoal(text), profile, why, answers, ctx);
}

// ---------------------------------------------------------------------------
// Human labels — the draft must be legible before it is approved.

export function describeDoneWhen(dw: DoneWhen | undefined): string {
  if (!dw || dw.kind === 'confirm') return 'you call it done';
  if (dw.kind === 'metric') {
    return `${dw.op === 'gte' ? 'reaches' : 'comes down to'} ${fmt(dw.value, dw.unit ?? '')}`;
  }
  if (dw.kind === 'count') return `${dw.target} sessions completed`;
  return `${dw.weeks} week${dw.weeks > 1 ? 's' : ''} running with ${dw.minPerWeek}+ sessions`;
}

/** "by 30 Jun 2028 · done when reaches $25,000" — the line under a step. */
export function describeStep(m: GoalMilestone): string {
  const when = m.dueDate ? `by ${formatDay(m.dueDate)} · ` : '';
  return `${when}done when ${describeDoneWhen(m.doneWhen)}`;
}

export function describeCheckin(spec: CheckinSpec): string {
  const cadence =
    spec.cadenceDays <= 3 ? 'a few times a week' : spec.cadenceDays <= 7 ? 'weekly' : 'monthly';
  if (spec.source === 'health') return `${spec.label} — arrives from Apple Health, ${cadence}`;
  if (spec.source === 'plan') return `${spec.label} — counted from what you complete, no logging`;
  return `${spec.label} — one question, ${cadence}`;
}

/** "$4,046 a month" / "0.6 kg a month". */
export function describePace(pace: GoalPace): string {
  return `${fmt(pace.perMonth, pace.unit)} a month`;
}

// ---------------------------------------------------------------------------
// Landing — "at this rate you land on …", from day one.

export interface Landing {
  headline: string;
  landsOn: string | null;
  /** 'planned' until the readings say otherwise. */
  verdict: 'planned' | 'on-track' | 'ahead' | 'behind' | 'flat' | 'arrived';
}

/**
 * Where the goal lands, from its own pace.
 *
 * The trajectory engine fits a line through readings and refuses below
 * three over two weeks — right for a projection, but it left a new goal
 * with no date for a fortnight when the plan's own arithmetic already had
 * one. This says the planned landing on day one, and the actual one once
 * the readings have moved: the amount set aside since the start, over the
 * time since the start, carried forward. Plain division, stated as such.
 */
export function paceLanding(goal: Goal, metrics: MetricObservation[], today = todayKey()): Landing | null {
  const pace = goal.pace;
  if (!pace) return null;
  const metricStep = (goal.milestones ?? []).filter((m) => m.doneWhen?.kind === 'metric').pop();
  const dw = metricStep?.doneWhen;
  const metricKey = dw?.kind === 'metric' ? dw.metricKey : null;
  const toward: 'higher' | 'lower' = pace.targetValue >= pace.startValue ? 'higher' : 'lower';
  const reading = metricKey ? latest(metrics, metricKey) : null;
  const current = reading?.value ?? pace.startValue;
  const remaining = toward === 'higher' ? pace.targetValue - current : current - pace.targetValue;
  const unit = pace.unit;

  if (remaining <= 0) {
    return { headline: `Already there: ${fmt(current, unit)} against ${fmt(pace.targetValue, unit)}.`, landsOn: null, verdict: 'arrived' };
  }

  const monthsIn = monthsBetween(pace.startDate, today);
  const moved = toward === 'higher' ? current - pace.startValue : pace.startValue - current;
  const target = goal.targetDate;

  // Enough time and movement for the actual rate to mean something.
  if (reading && monthsIn >= 0.25 && moved !== 0) {
    if (moved < 0) {
      return {
        headline: `Moving away from it: ${fmt(current, unit)} now, ${fmt(pace.startValue, unit)} at the start.`,
        landsOn: null,
        verdict: 'flat',
      };
    }
    const rate = moved / monthsIn;
    const landsOn = addDays(today, Math.round((remaining / rate) * DAYS_PER_MONTH));
    const rateText = fmt(unit === '$' ? Math.round(rate) : Math.round(rate * 10) / 10, unit);
    if (!target) {
      return { headline: `At ${rateText} a month you land on ${formatDay(landsOn)}.`, landsOn, verdict: 'on-track' };
    }
    const slack = daysBetween(landsOn, target);
    const verdict: Landing['verdict'] = slack >= 14 ? 'ahead' : slack >= -3 ? 'on-track' : 'behind';
    const tail =
      verdict === 'ahead'
        ? `about ${Math.round(slack / 7)} weeks ahead of ${formatDay(target)}.`
        : verdict === 'on-track'
          ? `That lands on ${formatDay(target)}.`
          : `You said ${formatDay(target)}; that needs ${describePace(pace)} from here.`;
    return { headline: `At ${rateText} a month you land on ${formatDay(landsOn)} — ${tail}`, landsOn, verdict };
  }

  if (reading && monthsIn >= 1 && moved === 0) {
    return {
      headline: `Nothing has moved since ${formatDay(pace.startDate)}. At ${describePace(pace)} it would land on ${target ? formatDay(target) : 'the date you set'}.`,
      landsOn: null,
      verdict: 'flat',
    };
  }

  const landsOn = addDays(today, Math.round((remaining / pace.perMonth) * DAYS_PER_MONTH));
  return {
    headline: `At ${describePace(pace)} from ${fmt(current, unit)} you land on ${formatDay(landsOn)}.`,
    landsOn,
    verdict: 'planned',
  };
}

// ---------------------------------------------------------------------------
// Assessment — evidence checks steps off and states why.

export interface GoalAssessContext {
  metrics: MetricObservation[];
  planEvents: PlanActionEvent[];
  /** "YYYY-MM-DD", local; defaults to today. */
  today?: string;
}

export interface GoalAssessment {
  /** Milestones whose doneWhen is now satisfied by evidence. */
  autoDone: string[];
  /**
   * Milestones previously auto-completed whose evidence no longer holds —
   * a corrected metric, a deleted reading. Only ever evidence-backed steps:
   * a step the USER confirmed stays confirmed, because that was their call
   * and not a number's.
   */
  autoUndone: string[];
  state: 'done' | 'on-track' | 'stalled' | 'need-data';
  /** The verdict's evidence, stated plainly. */
  reason: string;
  /** The first step still open after auto-completion. */
  next?: GoalMilestone;
}

/** Monday-anchored week key for streak counting. */
const weekKey = (date: string): string => {
  const d = new Date(`${date}T12:00:00Z`);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return d.toISOString().slice(0, 10);
};

function goalCompletions(goal: Goal, events: PlanActionEvent[]): PlanActionEvent[] {
  return events.filter((e) => e.kind === 'completed' && e.goalId === goal.id);
}

/** Consecutive weeks (ending at the most recent active week) with enough sessions. */
export function streakWeeks(dates: string[], minPerWeek: number): number {
  if (dates.length === 0) return 0;
  const perWeek = new Map<string, number>();
  for (const d of dates) {
    const k = weekKey(d);
    perWeek.set(k, (perWeek.get(k) ?? 0) + 1);
  }
  const weeks = [...perWeek.keys()].sort().reverse();
  let count = 0;
  let cursor = weeks[0];
  for (const w of weeks) {
    if (w !== cursor || (perWeek.get(w) ?? 0) < minPerWeek) break;
    count += 1;
    const prev = new Date(`${cursor}T12:00:00Z`);
    prev.setUTCDate(prev.getUTCDate() - 7);
    cursor = prev.toISOString().slice(0, 10);
  }
  return count;
}

function satisfied(dw: DoneWhen, goal: Goal, ctx: GoalAssessContext): boolean {
  if (dw.kind === 'confirm') return false;
  if (dw.kind === 'metric') {
    const obs = latest(ctx.metrics, dw.metricKey);
    if (!obs) return false;
    return dw.op === 'gte' ? obs.value >= dw.value : obs.value <= dw.value;
  }
  const completions = goalCompletions(goal, ctx.planEvents);
  if (dw.kind === 'count') return completions.length >= dw.target;
  return streakWeeks(completions.map((e) => e.date), dw.minPerWeek) >= dw.weeks;
}

export function assessGoal(goal: Goal, ctx: GoalAssessContext): GoalAssessment {
  // The local day. Slicing an ISO timestamp gave the UTC day, which east
  // of Greenwich is yesterday until late morning.
  const today = ctx.today ?? todayKey();
  const milestones = goal.milestones ?? [];
  const autoDone = milestones
    .filter((m) => !m.done && m.doneWhen && satisfied(m.doneWhen, goal, ctx))
    .map((m) => m.id);
  // Evidence that stops holding un-ticks the step it ticked. Without this a
  // mistyped number could permanently mark a goal complete.
  const autoUndone = milestones
    .filter(
      (m) =>
        m.done &&
        m.doneWhen &&
        m.doneWhen.kind !== 'confirm' &&
        !satisfied(m.doneWhen, goal, ctx),
    )
    .map((m) => m.id);
  const open = milestones.filter((m) => !m.done && !autoDone.includes(m.id));
  const next = open[0];

  if (milestones.length > 0 && open.length === 0) {
    return { autoDone, autoUndone, state: 'done', reason: 'Every step is done.' };
  }

  // The first number the goal waits on, even when a setup step sits ahead
  // of it: "set the transfer up" is next, but the reading is what starts
  // the trend, and that is the more useful thing to say.
  const firstMetric = open.find((m) => m.doneWhen?.kind === 'metric');
  if (firstMetric?.doneWhen?.kind === 'metric' && !latest(ctx.metrics, firstMetric.doneWhen.metricKey)) {
    const ask = goal.checkins?.find((c) => c.metricKey === (firstMetric.doneWhen as { metricKey: string }).metricKey);
    return {
      autoDone,
      autoUndone,
      state: 'need-data',
      reason: ask
        ? `No reading yet for ${ask.label.toLowerCase()} — one answer starts the trend.`
        : 'No reading yet for the next step.',
      next,
    };
  }

  if (next?.doneWhen?.kind === 'metric') {
    const dw = next.doneWhen;
    const obs = latest(ctx.metrics, dw.metricKey)!;
    const gap = dw.op === 'gte' ? dw.value - obs.value : obs.value - dw.value;
    if (gap > 0) {
      return {
        autoDone,
        autoUndone,
        state: recentProgress(goal, ctx, today) ? 'on-track' : 'stalled',
        reason: `At ${fmt(obs.value, dw.unit ?? '')} — ${fmt(Math.round(gap * 10) / 10, dw.unit ?? '')} from “${next.title}”.`,
        next,
      };
    }
  }

  if (next?.doneWhen?.kind === 'streak') {
    const dw = next.doneWhen;
    const weeks = streakWeeks(
      goalCompletions(goal, ctx.planEvents).map((e) => e.date),
      dw.minPerWeek,
    );
    return {
      autoDone,
      autoUndone,
      state: weeks > 0 || recentProgress(goal, ctx, today) ? 'on-track' : 'stalled',
      reason:
        weeks > 0
          ? `${weeks} week${weeks > 1 ? 's' : ''} running of ${dw.minPerWeek}+ sessions — ${dw.weeks} completes “${next.title}”.`
          : `The streak starts with ${dw.minPerWeek} sessions this week.`,
      next,
    };
  }

  if (next?.doneWhen?.kind === 'count') {
    const done = goalCompletions(goal, ctx.planEvents).length;
    return {
      autoDone,
      autoUndone,
      state: recentProgress(goal, ctx, today) ? 'on-track' : 'stalled',
      reason: `${done} of ${next.doneWhen.target} sessions toward “${next.title}”.`,
      next,
    };
  }

  return {
    autoDone,
    autoUndone,
    state: recentProgress(goal, ctx, today) ? 'on-track' : 'stalled',
    reason: next
      ? `Next: “${next.title}” — ${describeDoneWhen(next.doneWhen)}.`
      : 'No steps on this goal yet.',
    next,
  };
}

/** Any milestone completion, goal session or goal metric inside the stall window. */
function recentProgress(goal: Goal, ctx: GoalAssessContext, today: string): boolean {
  const cutoff = addDays(today, -STALL_DAYS);
  if (dateKeyOfIso(goal.createdAt) >= cutoff) return true;
  if ((goal.milestones ?? []).some((m) => m.doneAt && dateKeyOfIso(m.doneAt) >= cutoff)) return true;
  if (goalCompletions(goal, ctx.planEvents).some((e) => e.date >= cutoff)) return true;
  const keys = new Set((goal.checkins ?? []).map((c) => c.metricKey));
  return ctx.metrics.some((o) => keys.has(o.key) && dateKeyOfIso(o.at) >= cutoff);
}

/** The 'ask' check-in that is due — one question, only when its cadence has lapsed. */
export function dueCheckin(
  goal: Goal,
  metrics: MetricObservation[],
  now = Date.now(),
): CheckinSpec | null {
  for (const spec of goal.checkins ?? []) {
    if (spec.source !== 'ask') continue;
    const last = latest(metrics, spec.metricKey);
    if (!last) return spec;
    if (new Date(last.at).getTime() <= now - spec.cadenceDays * 86400e3) return spec;
  }
  return null;
}

/** The question a goal moves on, due or not — the review asks it every week. */
export function askCheckin(goal: Goal): CheckinSpec | null {
  return goal.checkins?.find((c) => c.source === 'ask') ?? null;
}
