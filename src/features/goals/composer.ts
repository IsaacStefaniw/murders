/**
 * Goal composer v1 — any goal becomes the universal loop (docs/VISION.md).
 *
 * The goal planner already turns one sentence into domain-shaped milestones
 * and a recurring behaviour. The composer is the layer above it: where a
 * measurable target can be read from the goal, milestones become rungs with
 * explicit `doneWhen` conditions, and the goal gets a check-in schema — how
 * progress is measured, how often, and at whose effort. Rungs backed by a
 * metric, a session count or a streak are checked off from evidence;
 * `assessGoal` states the verdict with its reason.
 *
 * Deterministic all the way down, so the simulation lab can gate it.
 */

import { newId } from '@/lib/dates';
import type {
  CheckinSpec,
  DoneWhen,
  Goal,
  GoalMilestone,
  LifeProfile,
  PlanActionEvent,
} from '@/types/domain';

import { latest, type MetricObservation } from '@/features/model/metrics';

import { buildGoalPlan, parseGoal, type GoalPlan, type ParsedGoal } from './goalPlanner';
import { STALL_DAYS } from './stalled';

/** "$2m" → 2_000_000; "$40k" → 40_000; "120kg" → 120; "15%" → 15. */
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

const rung = (title: string, doneWhen: DoneWhen): GoalMilestone => ({
  id: newId('ms'),
  title,
  done: false,
  doneWhen,
});

const fmt = (value: number, unit: string): string =>
  unit === '$' ? `$${value.toLocaleString('en-AU')}` : `${value}${unit ? ` ${unit}` : ''}`;

/**
 * Fractional ladder toward a numeric target: early rungs come fast (first
 * evidence of motion), later rungs carry the distance.
 */
function fractionLadder(
  what: string,
  metricKey: string,
  target: number,
  unit: string,
): GoalMilestone[] {
  const steps: [number, string][] = [
    [0.1, 'First tenth'],
    [0.25, 'A quarter there'],
    [0.5, 'Halfway'],
    [1, 'Done'],
  ];
  return steps.map(([f, label]) =>
    rung(`${label}: ${fmt(Math.round(target * f), unit)} ${what}`, {
      kind: 'metric',
      metricKey,
      op: 'gte',
      value: Math.round(target * f),
      unit,
    }),
  );
}

/**
 * Compose a full draft: planner routines + measurable ladder + check-in
 * schema. Falls back to the planner's own milestones (as confirm rungs)
 * where no measurable target can be read — an honest ladder beats a fake
 * number.
 */
export function composeGoalDraft(
  parsed: ParsedGoal,
  profile: LifeProfile | null,
  why?: string,
  answers: Record<string, string> = {},
): GoalPlan {
  const plan = buildGoalPlan(parsed, profile, why, answers);
  const goalId = plan.goal.id;
  const target = parseTargetValue(parsed.target);
  const text = parsed.title;

  let ladder: GoalMilestone[] | null = null;
  const checkins: CheckinSpec[] = [];

  const planCheckin = (label: string): CheckinSpec => ({
    id: newId('ci'),
    metricKey: `goal.${goalId}.sessions`,
    label,
    cadenceDays: 7,
    source: 'plan',
  });

  const lift = LIFTS.find(([re]) => re.test(text));
  if ((parsed.domain === 'fitness' || parsed.domain === 'health') && lift && target && target.unit === 'kg') {
    // Strength target: consistency first, then the number. The e1RM arrives
    // from logged working sets — no extra measurement to remember.
    const [, metricKey, label] = lift;
    ladder = [
      rung('First week of sessions in', { kind: 'streak', weeks: 1, minPerWeek: 2 }),
      rung('Four consistent weeks', { kind: 'streak', weeks: 4, minPerWeek: 2 }),
      rung(`${label} at ${fmt(target.value, 'kg')} (estimated 1RM)`, {
        kind: 'metric',
        metricKey,
        op: 'gte',
        value: target.value,
        unit: 'kg',
      }),
    ];
    checkins.push({
      id: newId('ci'),
      metricKey,
      label: `${label} estimated 1RM`,
      unit: 'kg',
      cadenceDays: 7,
      source: 'plan',
    });
  } else if (
    (parsed.domain === 'fitness' || parsed.domain === 'health') &&
    /\b(marathon|half marathon|triathlon|10k|5k|fun run|race)\b/i.test(text)
  ) {
    // Endurance event: the build is consistency; the day itself only the
    // user can call.
    ladder = [
      rung('Four consistent training weeks', { kind: 'streak', weeks: 4, minPerWeek: 2 }),
      rung('Eight weeks in — the base is real', { kind: 'streak', weeks: 8, minPerWeek: 2 }),
      rung('Longest session done and recovered from', { kind: 'confirm' }),
      rung('Event completed', { kind: 'confirm' }),
    ];
    checkins.push(planCheckin('Training sessions completed'));
  } else if (
    (parsed.domain === 'fitness' || parsed.domain === 'health') &&
    target && target.unit === 'kg' && /\b(weigh|weight|lose|lean|cut|down to|get to)\b/i.test(text)
  ) {
    // Body-weight target: absolute ("get to 80kg") uses the number; a delta
    // ("lose 5kg") needs the profile baseline to become one.
    const lose = /\b(lose|cut|down|drop)\b/i.test(text) || target.value < (profile?.weightKg ?? Infinity);
    const absolute = /\b(to|at|reach|get to)\b/i.test(text) || !profile?.weightKg
      ? target.value
      : lose
        ? profile.weightKg - target.value
        : profile.weightKg + target.value;
    ladder = [
      rung('Two weigh-ins a week for three weeks — the trend is visible', { kind: 'confirm' }),
      rung(`Body weight ${lose ? 'at or under' : 'at or over'} ${fmt(absolute, 'kg')}`, {
        kind: 'metric',
        metricKey: 'body.weight',
        op: lose ? 'lte' : 'gte',
        value: absolute,
        unit: 'kg',
      }),
    ];
    checkins.push({
      id: newId('ci'),
      metricKey: 'body.weight',
      label: 'Body weight',
      unit: 'kg',
      cadenceDays: 3,
      source: 'health',
    });
  } else if (parsed.domain === 'finance' && target && target.unit === '$') {
    const metricKey = `goal.${goalId}.saved`;
    ladder = fractionLadder('set aside', metricKey, target.value, '$');
    checkins.push({
      id: newId('ci'),
      metricKey,
      label: 'Amount set aside',
      unit: '$',
      cadenceDays: 7,
      source: 'ask',
      prompt: `How much is set aside toward “${text}” right now?`,
    });
  } else if ((parsed.domain === 'business' || parsed.domain === 'career') && target && target.unit === '$') {
    const metricKey = `goal.${goalId}.revenue`;
    ladder = [
      rung('Current baseline written down', { kind: 'confirm' }),
      ...fractionLadder('run rate', metricKey, target.value, '$'),
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
    // plus the finish only the user can call. Experience goals keep the
    // planner's own concrete ladder (pick, dates, budget, book).
    if (parsed.domain === 'personal') {
      ladder = [
        rung('Five working sessions in', { kind: 'count', target: 5 }),
        rung('Twenty sessions — this is a practice now', { kind: 'count', target: 20 }),
        rung('Finished, by your own standard', { kind: 'confirm' }),
      ];
      checkins.push(planCheckin('Working sessions completed'));
    }
  }

  // Every rung has a condition; planner milestones become confirm rungs.
  const milestones = (ladder ?? plan.goal.milestones ?? []).map((m) => ({
    ...m,
    doneWhen: m.doneWhen ?? ({ kind: 'confirm' } as DoneWhen),
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
    },
  };
}

/** One-sentence composer entry point. */
export function composeFromText(
  text: string,
  profile: LifeProfile | null,
  why?: string,
  answers: Record<string, string> = {},
): GoalPlan {
  return composeGoalDraft(parseGoal(text), profile, why, answers);
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

export function describeCheckin(spec: CheckinSpec): string {
  const cadence =
    spec.cadenceDays <= 3 ? 'a few times a week' : spec.cadenceDays <= 7 ? 'weekly' : 'monthly';
  if (spec.source === 'health') return `${spec.label} — arrives from Apple Health, ${cadence}`;
  if (spec.source === 'plan') return `${spec.label} — counted from what you complete, no logging`;
  return `${spec.label} — one question, ${cadence}`;
}

// ---------------------------------------------------------------------------
// Assessment — evidence checks rungs off and states why.

export interface GoalAssessContext {
  metrics: MetricObservation[];
  planEvents: PlanActionEvent[];
  /** "YYYY-MM-DD"; defaults to today. */
  today?: string;
}

export interface GoalAssessment {
  /** Milestones whose doneWhen is now satisfied by evidence. */
  autoDone: string[];
  /**
   * Milestones previously auto-completed whose evidence no longer holds —
   * a corrected metric, a deleted reading. Only ever evidence-backed rungs:
   * a rung the USER confirmed stays confirmed, because that was their call
   * and not a number's.
   */
  autoUndone: string[];
  state: 'done' | 'on-track' | 'stalled' | 'need-data';
  /** The verdict's evidence, stated plainly. */
  reason: string;
  /** The first rung still open after auto-completion. */
  next?: GoalMilestone;
}

const dayKey = (iso: string) => iso.slice(0, 10);

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
  const today = ctx.today ?? dayKey(new Date().toISOString());
  const milestones = goal.milestones ?? [];
  const autoDone = milestones
    .filter((m) => !m.done && m.doneWhen && satisfied(m.doneWhen, goal, ctx))
    .map((m) => m.id);
  // Evidence that stops holding un-ticks the rung it ticked. Without this a
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
    return { autoDone, autoUndone, state: 'done', reason: 'Every rung of the ladder is complete.' };
  }

  if (next?.doneWhen?.kind === 'metric') {
    const dw = next.doneWhen;
    const obs = latest(ctx.metrics, dw.metricKey);
    if (!obs) {
      const ask = goal.checkins?.find((c) => c.metricKey === dw.metricKey);
      return {
        autoDone,
        autoUndone,
        state: 'need-data',
        reason: ask
          ? `No reading yet for ${ask.label.toLowerCase()} — one answer starts the trend.`
          : 'No reading yet for the next rung.',
        next,
      };
    }
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
      : 'No ladder on this goal yet.',
    next,
  };
}

/** Any milestone completion, goal session or goal metric inside the stall window. */
function recentProgress(goal: Goal, ctx: GoalAssessContext, today: string): boolean {
  const cutoffMs = new Date(`${today}T00:00:00Z`).getTime() - STALL_DAYS * 86400e3;
  const cutoff = new Date(cutoffMs).toISOString();
  if (goal.createdAt >= cutoff) return true;
  if ((goal.milestones ?? []).some((m) => m.doneAt && m.doneAt >= cutoff)) return true;
  if (goalCompletions(goal, ctx.planEvents).some((e) => e.date >= cutoff.slice(0, 10))) return true;
  const keys = new Set((goal.checkins ?? []).map((c) => c.metricKey));
  return ctx.metrics.some((o) => keys.has(o.key) && o.at >= cutoff);
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
