/**
 * What goes on the bar today, from what came off it last time.
 *
 * ── Why this file is the reason the app should exist ────────────────────
 *
 * Everything else in Isaac's plan works on paper. The dinners work on
 * paper. The 17:30 decision works on paper. This does not: it needs last
 * session's reps, joined to this session's exercise, with arithmetic in
 * between — and doing that in your head at 12:17 on a Wednesday is
 * exactly the kind of small friction that ends a training block.
 *
 * ── The bug this replaces ─────────────────────────────────────────────
 *
 * `programme.ts` prescribes loads as a percentage of an estimated one-rep
 * max. Its scheme for a fat-loss block is:
 *
 *     wk1  3x6-10 @ 0.70     wk3  4x6-8 @ 0.75
 *     wk2  3x6-10 @ 0.725    wk4  2x8   @ 0.62
 *
 * **0.70 of a one-rep max is about a twelve-rep weight, prescribed
 * against a six-to-ten rep range.** Coherent at the very top of the
 * window and a warm-up at the bottom: one load for a four-rep range,
 * pegged at the easy end. Worse, the kg-prescribed main lifts carry no
 * `rpe` field at all, so nothing ever tells the person how hard the set
 * is supposed to be.
 *
 * Isaac found it in one sentence: *"those bench press kilos are way too
 * light I could do 15 reps of 90 consistently."* He was prescribed 90 kg
 * for sets of 6–10. Fifteen reps at 90 implies an e1RM near 138, so 90 was
 * 65% — his fifteen-rep weight, four times a week, in a deficit. That is
 * how somebody loses muscle while training hard.
 *
 * I had reproduced those percentages faithfully and verified they matched
 * the generator's output to the kilo, and never once asked whether the
 * percentage suited the rep range. **Verifying arithmetic is not verifying
 * a prescription.**
 *
 * ── Double progression, which removes the percentage entirely ───────────
 *
 * Three rules:
 *
 *   1. Work inside the week's rep range.
 *   2. Hit the TOP of the range on EVERY set with 1–2 reps still in the
 *      tank, and add one step next session.
 *   3. The added weight drops you to the bottom of the range. Climb it
 *      again.
 *
 * It cannot drift light, because the rep range polices it. It cannot drift
 * heavy, because the reserve does. And it needs no one-rep max, which is
 * the data this app has repeatedly been wrong about — a remembered max is
 * worse evidence than a set that actually happened.
 *
 * ── What it refuses to do ─────────────────────────────────────────────
 *
 * It never invents a load. With no history it returns `null` and the
 * caller asks for a calibration set, because the honest first session is a
 * calibration and pretending otherwise is what put 90 kg on the bar.
 */

import type { LoggedSet, WorkoutLog } from '@/types/domain';

/** Plate-sized steps. Upper body moves in halves of the lower-body step. */
export const STEP_KG: Record<'upper' | 'lower', number> = { upper: 2.5, lower: 5 };

/** Isaac's four main lifts, and which step each moves in. */
export const LIFT_STEP: Record<string, number> = {
  'Bench press': STEP_KG.upper,
  'Overhead press': STEP_KG.upper,
  Squat: STEP_KG.lower,
  Deadlift: STEP_KG.lower,
};

/**
 * Reps left in the tank, from a logged RPE.
 *
 * `LoggedSet.rpe` is optional, and an absent RPE is not a zero — it is
 * silence. A set logged without one cannot be read as "taken to failure"
 * and cannot be read as "easy", so `reserveOf` returns null and the rules
 * below treat the reserve condition as unmet rather than met. Guessing in
 * either direction is how a block runs away from somebody.
 */
export function reserveOf(set: LoggedSet): number | null {
  if (set.rpe === undefined) return null;
  return Math.max(0, 10 - set.rpe);
}

export interface RepRange {
  min: number;
  max: number;
}

/** The week's prescription. `reserve` is reps to leave, not an RPE. */
export interface WeekTarget {
  sets: number;
  range: RepRange;
  reserve: RepRange;
}

/**
 * The four weeks, as reps and reserve rather than percentages.
 *
 * Week 4 is a deload and its reserve is deliberately large: it is meant to
 * feel too easy, which is its whole job. A deload that feels like a test
 * is a fifth hard week with a nice name on it.
 */
export const BLOCK: WeekTarget[] = [
  { sets: 3, range: { min: 6, max: 10 }, reserve: { min: 1, max: 2 } },
  { sets: 3, range: { min: 6, max: 10 }, reserve: { min: 1, max: 2 } },
  { sets: 4, range: { min: 6, max: 8 }, reserve: { min: 1, max: 2 } },
  { sets: 2, range: { min: 8, max: 8 }, reserve: { min: 4, max: 5 } },
];

export type Verdict =
  /** Top of range on every set with reserve left. Add a step. */
  | 'progress'
  /** In range. Repeat the load and try for more reps. */
  | 'hold'
  /** Under range, or no reserve anywhere. Stay, and say why. */
  | 'stay'
  /** Under range twice running at this load. Take a step down. */
  | 'back-off'
  /** Nothing logged at this lift. Calibrate instead. */
  | 'calibrate';

export interface Prescription {
  lift: string;
  verdict: Verdict;
  /** Null only for 'calibrate'. */
  loadKg: number | null;
  target: WeekTarget;
  /** The sentence the screen shows. Plain, specific, never a scold. */
  line: string;
  /** What happened last time, for the screen to print beside today's. */
  last?: { date: string; loadKg: number; reps: number[]; reserve: number | null };
}

/** Sets for one exercise from one log, in order. */
function setsFor(log: WorkoutLog, lift: string): LoggedSet[] {
  return log.sets.filter((s) => s.exercise === lift).sort((a, b) => a.index - b.index);
}

/**
 * The most recent sessions containing this lift, newest first.
 *
 * Newest first because every rule below cares about the last session and
 * one of them cares about the one before it.
 */
export function historyFor(logs: WorkoutLog[], lift: string): { log: WorkoutLog; sets: LoggedSet[] }[] {
  return logs
    .map((log) => ({ log, sets: setsFor(log, lift) }))
    .filter((x) => x.sets.length > 0)
    .sort((a, b) => b.log.date.localeCompare(a.log.date));
}

/** The load a session was run at — the modal weight, not the heaviest set. */
function loadOf(sets: LoggedSet[]): number | null {
  const weights = sets.map((s) => s.weightKg).filter((w): w is number => w !== undefined);
  if (weights.length === 0) return null;
  const counts = new Map<number, number>();
  for (const w of weights) counts.set(w, (counts.get(w) ?? 0) + 1);
  // Heaviest among the most frequent, so a session run at 100 with one
  // back-off set at 90 reads as 100 rather than as a coin toss.
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

/** The smallest reserve across the working sets — the binding one. */
function bindingReserve(sets: LoggedSet[]): number | null {
  const values = sets.map(reserveOf).filter((r): r is number => r !== null);
  return values.length === 0 ? null : Math.min(...values);
}

/**
 * Today's prescription for one lift.
 *
 * `week` is 1-based and clamped, so a fifth week of a four-week block
 * repeats the deload rather than throwing — a block that outlives its own
 * length is a scheduling question, not a reason to show an error.
 */
export function prescribe(
  lift: string,
  logs: WorkoutLog[],
  week: number,
): Prescription {
  const target = BLOCK[Math.min(Math.max(week, 1), BLOCK.length) - 1];
  const step = LIFT_STEP[lift] ?? STEP_KG.upper;
  const history = historyFor(logs, lift);

  if (history.length === 0) {
    return {
      lift,
      verdict: 'calibrate',
      loadKg: null,
      target,
      line: `First time on ${lift.toLowerCase()} in the app. Pick a weight you could do about twelve times, do a set of eight, and count what you had left — 1 or 2 is right.`,
    };
  }

  const [latest, previous] = history;
  const load = loadOf(latest.sets);
  const reps = latest.sets.map((s) => s.reps);
  const reserve = bindingReserve(latest.sets);
  const last = load === null ? undefined : { date: latest.log.date, loadKg: load, reps, reserve };

  if (load === null) {
    return {
      lift,
      verdict: 'calibrate',
      loadKg: null,
      target,
      line: `Last ${lift.toLowerCase()} was logged without a weight, so there is nothing to work from. Note the load this time and the next one prescribes itself.`,
      last,
    };
  }

  const hitTop = reps.length >= target.sets && reps.every((r) => r >= target.range.max);
  const underRange = reps.some((r) => r < target.range.min);
  const hasReserve = reserve !== null && reserve >= target.reserve.min;

  // Rule 2. Both halves required: the reps AND something left. Reps alone
  // at zero reserve is a set taken to failure, which is a different thing
  // and is not evidence the load is ready to move.
  if (hitTop && hasReserve) {
    return {
      lift,
      verdict: 'progress',
      loadKg: load + step,
      target,
      line: `${load + step} kg today, up ${step}. Last time you got ${reps.join('/')} at ${load} kg with ${reserve} left — that is the top of the range on every set, so it moves.`,
      last,
    };
  }

  // Two sessions under the range at the same load is not a bad day, it is
  // the wrong load. Down a step rather than a third attempt at it.
  const previousLoad = previous ? loadOf(previous.sets) : null;
  const previousUnder = previous ? previous.sets.some((s) => s.reps < target.range.min) : false;
  if (underRange && previousLoad === load && previousUnder) {
    return {
      lift,
      verdict: 'back-off',
      loadKg: Math.max(step, load - step),
      target,
      line: `${Math.max(step, load - step)} kg today, down ${step}. ${load} kg has come in under ${target.range.min} reps twice, so it is the load rather than the day.`,
      last,
    };
  }

  if (underRange) {
    return {
      lift,
      verdict: 'stay',
      loadKg: load,
      target,
      line: `${load} kg again. Last time you got ${reps.join('/')}, which is under ${target.range.min} on at least one set — same weight until all ${target.sets} are in range.`,
      last,
    };
  }

  return {
    lift,
    verdict: 'hold',
    loadKg: load,
    target,
    line: `${load} kg again, and go for ${target.range.max} on all ${target.sets} sets. Last time: ${reps.join('/')}${reserve === null ? '' : ` with ${reserve} left`}.`,
    last,
  };
}

/**
 * The line that says what the reserve means, in words rather than a number.
 *
 * "RPE 8" is jargon that drifts. "Stop with one or two left" cannot be
 * misread, and the deload's "it should feel easy" is the only instruction
 * that week needs.
 */
export function reserveLine(target: WeekTarget): string {
  if (target.reserve.min >= 4) return 'Deload. Leave four or five reps in the tank — it is meant to feel easy.';
  return `Stop with ${target.reserve.min}–${target.reserve.max} reps left. The last one should be slow and certain, not a question.`;
}
