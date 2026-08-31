/**
 * What actually happened in the gym.
 *
 * Until now the workout player counted taps. A set was a tick, and the tick
 * was thrown away when the screen closed — which meant `strength.*.e1rm`,
 * the spine of the Personal Performance Model, had never once been fed by a
 * real session. The programme could prescribe from baselines but nothing
 * could ever update a baseline. This module closes that loop.
 *
 * Two principles run through it:
 *
 * A logged set is a fact and is never silently reinterpreted. Weight and
 * reps go in as typed; estimates are derived on read, never written back
 * over the input.
 *
 * An estimated 1RM is only claimed where the movement actually supports one.
 * A goblet squat is not a back squat and a Romanian deadlift is not a
 * deadlift; writing either into a strength metric would corrupt the
 * baseline the next programme is computed from, and the person would never
 * know why their prescribed loads went strange. Where the lift is not
 * unambiguous the set is still recorded in full — it simply makes no claim.
 */

import { estimate1Rm, type MetricObservation } from '@/features/model/metrics';
import { newId } from '@/lib/dates';
import type { LoggedSet, WorkoutLog } from '@/types/domain';

export type MainLift = 'bench' | 'squat' | 'deadlift' | 'ohp';

export const LIFT_METRIC: Record<MainLift, string> = {
  bench: 'strength.bench.e1rm',
  squat: 'strength.squat.e1rm',
  deadlift: 'strength.deadlift.e1rm',
  ohp: 'strength.ohp.e1rm',
};

/**
 * Variations that share a word with a main lift but are not that lift.
 * Each one here is a baseline this module refuses to corrupt.
 */
const NOT_THE_MAIN_LIFT = [
  'romanian',
  'rdl',
  'stiff',
  'split',
  'goblet',
  'air squat',
  'hack',
  'front squat',
  'sumo',
  'single-leg',
  'bulgarian',
  'pike',
  'push-up',
  'pushup',
  'dumbbell bench',
  'db bench',
  'incline',
];

/**
 * The main barbell lift this exercise is, if it unambiguously is one.
 *
 * Deliberately strict. A false negative costs one metric reading; a false
 * positive quietly rewrites the baseline every future prescription is built
 * from.
 */
export function liftFor(exerciseName: string): MainLift | null {
  const name = exerciseName.toLowerCase();
  if (NOT_THE_MAIN_LIFT.some((v) => name.includes(v))) return null;
  if (name.includes('deadlift')) return 'deadlift';
  if (name.includes('bench press') || name === 'bench') return 'bench';
  if (name.includes('overhead press') || name.includes('military press') || name === 'ohp') {
    return 'ohp';
  }
  if (name.includes('squat')) return 'squat';
  return null;
}

export const makeSet = (
  exercise: string,
  index: number,
  reps: number,
  weightKg?: number,
  rpe?: number,
): LoggedSet => ({
  id: newId('ls'),
  exercise,
  index,
  reps,
  weightKg,
  rpe,
  at: new Date().toISOString(),
});

/** Epley on a loaded set. Bodyweight and unloaded work estimate nothing. */
export function e1rmOf(set: LoggedSet): number | null {
  if (!set.weightKg || set.weightKg <= 0 || set.reps <= 0) return null;
  // Past about 12 reps Epley drifts badly — a 20-rep set is an endurance
  // fact, not a strength estimate, and treating it as one inflates the
  // baseline.
  if (set.reps > 12) return null;
  return estimate1Rm(set.weightKg, set.reps);
}

/** kg × reps across a session. The honest volume number, ignoring bodyweight work. */
export const volumeOf = (sets: LoggedSet[]): number =>
  sets.reduce((total, s) => total + (s.weightKg ?? 0) * s.reps, 0);

const byDateDesc = (a: WorkoutLog, b: WorkoutLog) => b.date.localeCompare(a.date);

export interface LastPerformance {
  date: string;
  /** The heaviest set of that session — what a person means by "last time". */
  set: LoggedSet;
  /** Every set of that exercise that session, in order. */
  sets: LoggedSet[];
}

/**
 * What you did last time, which is the number people actually walk into the
 * gym wanting. Drawn from the most recent SESSION containing the exercise,
 * not the best set ever — a personal best from eight months ago is not a
 * starting point for today.
 */
export function lastPerformance(
  logs: WorkoutLog[],
  exercise: string,
  excludeLogId?: string,
): LastPerformance | null {
  for (const log of [...logs].sort(byDateDesc)) {
    if (log.id === excludeLogId) continue;
    const sets = log.sets.filter((s) => s.exercise === exercise).sort((a, b) => a.index - b.index);
    if (sets.length === 0) continue;
    const heaviest = sets.reduce((best, s) =>
      (s.weightKg ?? 0) > (best.weightKg ?? 0) ? s : best,
    );
    return { date: log.date, set: heaviest, sets };
  }
  return null;
}

/** Best estimated 1RM ever recorded for an exercise. */
export function bestE1rm(logs: WorkoutLog[], exercise: string): { value: number; date: string } | null {
  let best: { value: number; date: string } | null = null;
  for (const log of logs) {
    for (const set of log.sets) {
      if (set.exercise !== exercise) continue;
      const e = e1rmOf(set);
      if (e !== null && (!best || e > best.value)) best = { value: e, date: log.date };
    }
  }
  return best;
}

export interface NextSuggestion {
  weightKg: number;
  reason: string;
  /** False when repeating the same load is the right call. */
  increased: boolean;
}

/**
 * Progressive overload, the boring version that works.
 *
 * Add load only when the last session actually completed its prescribed
 * reps across every set. Anything else repeats the load — including a
 * session where reps fell off partway, which is the exact case a
 * naive "add 2.5 kg every week" rule turns into a stall and then an injury.
 */
export function suggestNext(
  logs: WorkoutLog[],
  exercise: string,
  targetReps: number,
  targetSets: number,
): NextSuggestion | null {
  const last = lastPerformance(logs, exercise);
  if (!last || !last.set.weightKg) return null;
  const load = last.set.weightKg;

  const workingSets = last.sets.filter((s) => (s.weightKg ?? 0) >= load);
  const hitEverything =
    workingSets.length >= targetSets && workingSets.every((s) => s.reps >= targetReps);

  if (!hitEverything) {
    return {
      weightKg: load,
      reason: `Same ${load} kg — last time was ${last.sets.map((s) => s.reps).join('/')} reps.`,
      increased: false,
    };
  }

  // Lower-body lifts carry a bigger absolute jump because the same relative
  // step is a larger number on a heavier lift.
  const lift = liftFor(exercise);
  const step = lift === 'squat' || lift === 'deadlift' ? 5 : 2.5;
  return {
    weightKg: load + step,
    reason: `You hit every rep at ${load} kg. Up ${step}.`,
    increased: true,
  };
}

/**
 * The metric observations a saved session produces.
 *
 * One per main lift, taking that session's best estimate — a session is one
 * data point, not five. Sessions with no unambiguous main lift produce
 * nothing, and that silence is correct.
 */
export function observationsFrom(log: WorkoutLog): { key: string; value: number; note: string }[] {
  const best = new Map<MainLift, number>();
  for (const set of log.sets) {
    const lift = liftFor(set.exercise);
    if (!lift) continue;
    const e = e1rmOf(set);
    if (e === null) continue;
    if (!best.has(lift) || e > best.get(lift)!) best.set(lift, e);
  }
  return [...best.entries()].map(([lift, value]) => ({
    key: LIFT_METRIC[lift],
    value,
    note: `estimated from ${log.title}`,
  }));
}

/** Sessions in a rolling window, newest first. */
export function recentLogs(logs: WorkoutLog[], days = 56): WorkoutLog[] {
  const cutoff = new Date(Date.now() - days * 86400e3).toISOString().slice(0, 10);
  return logs.filter((l) => l.date >= cutoff).sort(byDateDesc);
}

/** Weekly training volume, oldest week first — the Data screen's bar chart. */
export function weeklyVolume(
  logs: WorkoutLog[],
  weeks = 8,
  now = new Date(),
): { weekStart: string; volume: number; sessions: number }[] {
  const out: { weekStart: string; volume: number; sessions: number }[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = new Date(now.getTime() - i * 7 * 86400e3);
    const start = new Date(end.getTime() - 6 * 86400e3);
    const startKey = start.toISOString().slice(0, 10);
    const endKey = end.toISOString().slice(0, 10);
    const inWeek = logs.filter((l) => l.date >= startKey && l.date <= endKey);
    out.push({
      weekStart: startKey,
      volume: inWeek.reduce((t, l) => t + volumeOf(l.sets), 0),
      sessions: inWeek.length,
    });
  }
  return out;
}

/** A blank log for a session about to be performed. */
export function newLog(date: string, title: string): WorkoutLog {
  const at = new Date().toISOString();
  return { id: newId('wl'), date, title, sets: [], createdAt: at, updatedAt: at };
}

export type { LoggedSet, WorkoutLog };
export { estimate1Rm };
export type { MetricObservation };
