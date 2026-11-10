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
 * ── The ramp to a heavy triple, which removes the percentage entirely ──
 *
 * Three rules, and they are his rather than a textbook's:
 *
 *   1. Ramp to one top set: 8, then 5, then 5, then 3.
 *   2. When the triple goes up with a rep still in the tank, add one step
 *      to EVERY set next session.
 *   3. Every fourth week the top two sets come off. Nothing else changes.
 *
 * It cannot drift light, because the triple polices it. It cannot drift
 * heavy, because the reserve does. And it needs no one-rep max, which is
 * the data this app has repeatedly been wrong about — a remembered max is
 * worse evidence than a set that actually happened. Three times in two
 * days I put his bench e1RM at 138, then 124–128, then 132, from three
 * sets he described; his own first answer of 130 was the closest of the
 * four.
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

/**
 * One rung of the ramp: reps to hit, and the load as a fraction of the top
 * set.
 *
 * ── Why a fraction here, after refusing one above ─────────────────────
 *
 * The thing this file refuses is a percentage of an **estimated one-rep
 * max** — a number nobody has lifted, derived by formula from a remembered
 * set, and wrong by nine kilos three times in two days in this project
 * alone. A fraction of the **top set** is a different animal: the top set
 * is a weight that went on the bar last session and came off it again, and
 * the lead-in sets are the ladder up to it. Nothing here is estimated.
 *
 * The shares are read off Isaac's own session, 10 Nov 2026:
 * 100 / 110 / 115 / 120, which is 0.83 / 0.92 / 0.96 / 1.00 to within the
 * rounding. They are his numbers, not a textbook's.
 */
export interface RampSet {
  /** Reps to hit on this set. */
  reps: number;
  /** Load as a fraction of the top set, before rounding to a plate step. */
  share: number;
}

/** The week's prescription. `reserve` is reps to leave, not an RPE. */
export interface WeekTarget {
  /**
   * Lightest first. The LAST entry is the top set, and it is the only one
   * the progression rule reads — see `prescribe`.
   */
  ramp: RampSet[];
  /** Reps to leave in the tank on the top set. */
  reserve: RepRange;
}

/**
 * The pyramid, which is what he actually does.
 *
 * ── What this replaces, and why the old one was wrong ─────────────────
 *
 * The first version of this block was `3 × 6–10`, flat. That was my
 * invention, not his, and he corrected it over three messages on 10 Nov:
 * 100 kg × 8, then 110 × 5, then 115 × 5, then 120 × 3 — *"I've been
 * training like this for years."*
 *
 * A flat triple of sets in a four-rep window and an ascending ramp to a
 * heavy triple are not the same stimulus and they are not the same
 * session. Prescribing the first to somebody who does the second is the
 * mistake this whole file was written to stop, in a new costume: I had
 * removed the bad percentage and kept my own guess about the shape.
 *
 * ── Why the three hard weeks are identical ────────────────────────────
 *
 * Because he said so. Asked how the weeks vary, the answer was that they
 * do not — he runs the pyramid and adds weight when the triple has a rep
 * left in it. That is already a progression, and a second one laid on top
 * of it (a percentage wave by week) would fight it: the load here comes
 * from last session's performance, so the week can only set reps and
 * reserve without the two rules pulling in opposite directions.
 *
 * Week 4 drops the top two sets rather than dropping the load, which is
 * also his: *"every fourth week, drop the top two sets."* It leaves the
 * 8 and the 5 at the weights they were, which is a deload you can still
 * recognise as your own session.
 */
const PYRAMID: RampSet[] = [
  { reps: 8, share: 0.83 },
  { reps: 5, share: 0.92 },
  { reps: 5, share: 0.96 },
  { reps: 3, share: 1 },
];

export const BLOCK: WeekTarget[] = [
  { ramp: PYRAMID, reserve: { min: 1, max: 2 } },
  { ramp: PYRAMID, reserve: { min: 1, max: 2 } },
  { ramp: PYRAMID, reserve: { min: 1, max: 2 } },
  // The deload, and its reserve is deliberately large: its whole job is to
  // feel too easy. A deload that feels like a test is a fifth hard week
  // with a nice name on it.
  { ramp: PYRAMID.slice(0, 2), reserve: { min: 4, max: 5 } },
];

/** How many sets the week asks for. */
export const setsIn = (target: WeekTarget): number => target.ramp.length;

/** The top set of the week — the one the progression rule reads. */
export const topSetOf = (target: WeekTarget): RampSet => target.ramp[target.ramp.length - 1];

export type Verdict =
  /** Top set hit its reps with reserve left. Add a step to the whole ramp. */
  | 'progress'
  /** Top set made its reps with nothing to spare. Repeat the load. */
  | 'hold'
  /** Top set came in under its reps. Stay, and say why. */
  | 'stay'
  /** Under the target twice running at this load. Take a step down. */
  | 'back-off'
  /** Nothing logged at this lift. Calibrate instead. */
  | 'calibrate';

/** One set as it goes on the bar today. */
export interface PrescribedSet {
  reps: number;
  loadKg: number;
  /** True for the set the progression rule reads. */
  top: boolean;
}

export interface Prescription {
  lift: string;
  verdict: Verdict;
  /**
   * The TOP set's load — the number the ramp is built from and the one the
   * progression moves. Null only for 'calibrate'.
   */
  loadKg: number | null;
  /** Every set, lightest first. Empty only for 'calibrate'. */
  sets: PrescribedSet[];
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

/**
 * The top set of a logged session: the heaviest weight that went up.
 *
 * **This reverses the earlier rule deliberately.** The first version took
 * the heaviest among the most frequent weights — the modal load — so that
 * a session run at 100 with one back-off set at 90 read as 100. Under a
 * flat block that was right, because every working set carried the same
 * weight and the odd one out was noise.
 *
 * Under a pyramid it is wrong, and wrong in the direction that matters. A
 * session of 100/110/115/120 has four weights with a count of one each,
 * and a session of 110/110/115/120 has a mode of 110 — so the modal rule
 * would read his top set as ten kilos lighter than it was and then
 * progress from there. The ramp's anchor is the heaviest set, full stop.
 */
function topLoadOf(sets: LoggedSet[]): number | null {
  const weights = sets.map((s) => s.weightKg).filter((w): w is number => w !== undefined);
  return weights.length === 0 ? null : Math.max(...weights);
}

/** The sets logged at the session's top weight, which is where the rule looks. */
function topSets(sets: LoggedSet[], topKg: number): LoggedSet[] {
  return sets.filter((s) => s.weightKg === topKg);
}

/**
 * The reserve on the top set — the binding one when it was done twice.
 *
 * An absent RPE is silence, not a zero (see `reserveOf`), so a top set
 * logged without one leaves the reserve condition unmet rather than met.
 * The load does not move on a set nobody said anything about.
 */
function topReserve(sets: LoggedSet[]): number | null {
  const values = sets.map(reserveOf).filter((r): r is number => r !== null);
  return values.length === 0 ? null : Math.min(...values);
}

/**
 * The ramp in kilos, from the top set's load.
 *
 * Every rung is rounded to the lift's own plate step, because a number you
 * cannot load is not a prescription — and clamped at the top set, since
 * rounding 0.96 upward could otherwise put the third set above the fourth.
 *
 * **One consequence, said plainly because a line of copy got it wrong
 * first.** The rungs are proportional, so a 5 kg bump in a squat top set
 * lifts the 0.83 rung by 0.85 kg — which rounds to nothing on a 5 kg grid.
 * A top set going 100 → 105 takes the ramp from 85/90/95/100 to
 * 85/95/100/105: the bottom rung lags a session and then catches up. So
 * the prescription says *the top set* is up a step, never "every set",
 * and the screen prints the whole ramp rather than a step and a promise.
 */
export function rampFor(lift: string, topKg: number, target: WeekTarget): PrescribedSet[] {
  const step = LIFT_STEP[lift] ?? STEP_KG.upper;
  const last = target.ramp.length - 1;
  return target.ramp.map((rung, i) => ({
    reps: rung.reps,
    loadKg: Math.min(topKg, Math.round((topKg * rung.share) / step) * step),
    top: i === last,
  }));
}

/** "100 / 110 / 115 / 120 kg" — the ramp as a person reads it. */
export function rampLine(sets: PrescribedSet[]): string {
  return `${sets.map((s) => s.loadKg).join(' / ')} kg`;
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
  const top = topSetOf(target);
  const step = LIFT_STEP[lift] ?? STEP_KG.upper;
  const history = historyFor(logs, lift);

  if (history.length === 0) {
    return {
      lift,
      verdict: 'calibrate',
      loadKg: null,
      sets: [],
      target,
      line: `First time on ${lift.toLowerCase()} in the app. Work up to a set of ${top.reps} you are sure of, stop with a rep or two left, and note it — the ramp builds itself from that number next time.`,
    };
  }

  const [latest, previous] = history;
  const topKg = topLoadOf(latest.sets);
  const reps = latest.sets.map((s) => s.reps);
  const last =
    topKg === null
      ? undefined
      : { date: latest.log.date, loadKg: topKg, reps, reserve: topReserve(topSets(latest.sets, topKg)) };

  if (topKg === null) {
    return {
      lift,
      verdict: 'calibrate',
      loadKg: null,
      sets: [],
      target,
      line: `Last ${lift.toLowerCase()} was logged without a weight, so there is nothing to work from. Note the load this time and the next one prescribes itself.`,
      last,
    };
  }

  const heaviest = topSets(latest.sets, topKg);
  const topReps = Math.max(...heaviest.map((s) => s.reps));
  const reserve = topReserve(heaviest);
  const made = topReps >= top.reps;
  const hasReserve = reserve !== null && reserve >= target.reserve.min;

  const atLoad = (kg: number) => ({ sets: rampFor(lift, kg, target), loadKg: kg });

  // The rule, and both halves are required. Reps at zero reserve is a set
  // taken to failure, which is a different thing and is not evidence the
  // load is ready to move.
  if (made && hasReserve) {
    const next = atLoad(topKg + step);
    return {
      lift,
      verdict: 'progress',
      ...next,
      target,
      line: `${rampLine(next.sets)} — the top set is up ${step}. Last time it was ${topReps} at ${topKg} kg with ${reserve} left, so it moves.`,
      last,
    };
  }

  // Two sessions short of the target at the same top load is not a bad day,
  // it is the wrong load. Down a step rather than a third attempt at it.
  const previousTop = previous ? topLoadOf(previous.sets) : null;
  const previousShort =
    previous && previousTop !== null
      ? Math.max(...topSets(previous.sets, previousTop).map((s) => s.reps)) < top.reps
      : false;
  if (!made && previousTop === topKg && previousShort) {
    const down = atLoad(Math.max(step, topKg - step));
    return {
      lift,
      verdict: 'back-off',
      ...down,
      target,
      line: `${rampLine(down.sets)} — the top set is down ${step}. It has come in under ${top.reps} twice at ${topKg} kg, so it is the load rather than the day.`,
      last,
    };
  }

  if (!made) {
    const same = atLoad(topKg);
    return {
      lift,
      verdict: 'stay',
      ...same,
      target,
      line: `${rampLine(same.sets)} — the same again. Last time the top set was ${topReps}, and it wants ${top.reps} before the weight moves.`,
      last,
    };
  }

  const same = atLoad(topKg);
  return {
    lift,
    verdict: 'hold',
    ...same,
    target,
    line: `${rampLine(same.sets)} — the same again, and ${top.reps} on the top set with a rep left. Last time: ${reps.join('/')}${reserve === null ? ' (no effort noted, so the load stays)' : ` with ${reserve} left`}.`,
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
  if (target.reserve.min >= 4) {
    return `Deload — the top two sets come off and that is the whole change. ${setsIn(target)} sets, and leave four or five reps in the tank.`;
  }
  return `Stop with ${target.reserve.min}–${target.reserve.max} reps left on the top set. The last one should be slow and certain, not a question.`;
}
