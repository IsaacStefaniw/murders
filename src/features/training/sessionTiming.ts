/**
 * Rest, measured instead of estimated.
 *
 * ── The complaint, which was correct ───────────────────────────────────
 *
 * Isaac, 10 Nov 2026: *"Start time should have been recorded above when I
 * noted session starting at bench press... after exercise bike, 5mins
 * before that."*
 *
 * He asked for his average rest and I gave him a formula with a hole in
 * it: `(session minutes - 6.3 work - 1.0 transitions) / 10`, and a table
 * of what it would be at 25, 30, 35, 40 minutes. A table of answers is
 * not an answer. The missing input was the start time, and **he had
 * already told me the session opened with five minutes on the bike.**
 *
 * ── Everything needed was already in the store ─────────────────────────
 *
 * `LoggedSet.at` is an ISO timestamp, written on every set since the log
 * existed. `WorkoutLog.durationMin` is saved when the session closes.
 * Nothing read either of them for timing: `baseline.ts` and `level.ts`
 * sort by `at` and nothing anywhere subtracts two of them.
 *
 * So this is not a new capture. It is the read that was missing, and the
 * estimate was never necessary for a session logged in the app.
 *
 * ── Why this measures BETWEEN SETS and ignores the warm-up ────────────
 *
 * My formula needed a total session duration and then subtracted work and
 * transitions out of it, which is why it needed a start time at all. That
 * was the wrong shape. Average rest is the mean gap between consecutive
 * sets, and consecutive set timestamps give it directly.
 *
 * **The five minutes on the bike never enters it.** A warm-up is not rest
 * between sets, so the window that matters opens at the first set and the
 * start time I was asking for was not the number I needed.
 *
 * ── Two things that would make the mean lie ───────────────────────────
 *
 *  1. **A superset is not rest.** Alternating incline cable and close-grip
 *     push-ups puts a near-zero gap between two sets by design. Counted as
 *     rest it drags the average down and makes a disciplined session look
 *     rushed.
 *  2. **One interruption moves the mean a long way.** A queue for the rack
 *     or a phone call for eight minutes, across ten gaps, shifts the mean
 *     by nearly fifty seconds while the other nine gaps were exactly as
 *     intended. So the median is reported beside it, and where they
 *     disagree the median is the honest read.
 *
 * ── And the ordering trap ─────────────────────────────────────────────
 *
 * `LoggedSet.index` is documented as *"1-based position within that
 * exercise"* — it is NOT the session order. Sorting by index would
 * interleave the exercises and compute gaps between sets that never
 * followed each other. Everything here sorts by `at`.
 */

import type { LoggedSet, WorkoutLog } from '@/types/domain';

/**
 * Below this, a gap between two DIFFERENT exercises is a superset
 * transition rather than a rest period.
 *
 * Forty-five seconds because the programme's shortest prescribed rest is
 * sixty (`ACCESSORIES`, the plank and the curls), so anything under
 * forty-five between two different movements was not somebody resting.
 * Two sets of the SAME exercise this close is a short rest, not a
 * superset, and is counted as rest however brief.
 */
export const SUPERSET_MAX_SEC = 45;

export type GapKind =
  /** A rest period, which is what the average is of. */
  | 'rest'
  /** Straight into the paired movement. Not rest, and not counted. */
  | 'superset';

export interface SetGap {
  after: string;
  before: string;
  seconds: number;
  kind: GapKind;
}

export interface SessionTiming {
  /** First and last set, as ISO strings. */
  firstSetAt: string;
  lastSetAt: string;
  /** First set to last set. Excludes the warm-up and the walk out. */
  spanSec: number;
  /** Every gap between consecutive sets, in the order they happened. */
  gaps: SetGap[];
  /** Mean of the rest gaps. Null when there are none to average. */
  avgRestSec: number | null;
  /** Median of the rest gaps — the robust one. Null on no rest gaps. */
  medianRestSec: number | null;
  longestRestSec: number | null;
  shortestRestSec: number | null;
  /** How many gaps were counted, and how many were set aside as supersets. */
  restCount: number;
  supersetCount: number;
}

const secondsBetween = (a: string, b: string) =>
  Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 1000));

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * The timing of one logged session, or null when there is not enough to
 * time.
 *
 * Needs two sets with parseable timestamps: one set has no gap after it,
 * and a session with nothing in it is not a session that went badly.
 */
export function sessionTiming(sets: LoggedSet[]): SessionTiming | null {
  const ordered = sets
    .filter((s) => Number.isFinite(Date.parse(s.at)))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (ordered.length < 2) return null;

  const gaps: SetGap[] = [];
  for (let i = 1; i < ordered.length; i += 1) {
    const prev = ordered[i - 1];
    const next = ordered[i];
    const seconds = secondsBetween(prev.at, next.at);
    const paired = prev.exercise !== next.exercise && seconds < SUPERSET_MAX_SEC;
    gaps.push({
      after: prev.exercise,
      before: next.exercise,
      seconds,
      kind: paired ? 'superset' : 'rest',
    });
  }

  const rests = gaps.filter((g) => g.kind === 'rest').map((g) => g.seconds);
  return {
    firstSetAt: ordered[0].at,
    lastSetAt: ordered[ordered.length - 1].at,
    spanSec: secondsBetween(ordered[0].at, ordered[ordered.length - 1].at),
    gaps,
    avgRestSec: rests.length ? Math.round(rests.reduce((a, b) => a + b, 0) / rests.length) : null,
    medianRestSec: rests.length ? median(rests) : null,
    longestRestSec: rests.length ? Math.max(...rests) : null,
    shortestRestSec: rests.length ? Math.min(...rests) : null,
    restCount: rests.length,
    supersetCount: gaps.length - rests.length,
  };
}

/** Convenience for a whole log. */
export const timingOf = (log: WorkoutLog): SessionTiming | null => sessionTiming(log.sets);

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/**
 * The sentence the screen shows.
 *
 * Leads with the median rather than the mean, and names the mean only when
 * the two disagree by more than fifteen seconds — at which point the
 * difference is the finding, because it means one gap was not like the
 * others. Printing both every time would be two numbers where one will do.
 */
export function restLine(timing: SessionTiming): string {
  if (timing.avgRestSec === null || timing.medianRestSec === null) {
    return 'Not enough sets logged yet to time the rest.';
  }
  const parts = [`Rest: ${mmss(timing.medianRestSec)} typical`];
  if (Math.abs(timing.avgRestSec - timing.medianRestSec) > 15) {
    parts.push(
      `average ${mmss(timing.avgRestSec)} — one gap was much longer than the rest, so the typical figure is the better one`,
    );
  }
  parts.push(`over ${timing.restCount} rests in ${mmss(timing.spanSec)} of lifting`);
  if (timing.supersetCount > 0) {
    parts.push(
      `${timing.supersetCount} superset ${timing.supersetCount === 1 ? 'change' : 'changes'} not counted as rest`,
    );
  }
  return `${parts.join(' · ')}.`;
}
