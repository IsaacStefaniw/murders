/**
 * Comparison in the weekly report — and the line it must not cross.
 *
 * ── Why "compared to other people" is not shipped here ──────────────────
 *
 * Social comparison is one of the strongest retention levers there is, and
 * it is also where habit apps most often start lying. "You're in the top
 * 20% of users this week" is trivial to write and, with a few hundred
 * users, means almost nothing; with zero users it means nothing at all. An
 * invented peer group is a fabricated result, and this app has a test
 * suite whose entire job is to stop unearned claims reaching a screen.
 *
 * So peer comparison is BUILT and DORMANT. `peerComparison` returns null
 * until a real cohort of sufficient size is passed to it. There is no
 * such cohort today, nothing calls it with one, and the function cannot
 * invent one — the gate is the feature.
 *
 * ── What ships instead, and why it is not a consolation prize ───────────
 *
 * Comparison against your own past. It works on day eight, needs nobody
 * else, cannot be gamed, and is a better motivator for the thing this app
 * is actually for: nobody's life is improved by beating a stranger at
 * scheduling, and "more than you managed last month" is a truer claim than
 * any percentile.
 *
 * The rule for every line produced here: it must be checkable by the
 * person reading it against numbers the same screen shows.
 */

import type { WeekSlice } from './cohort';

export interface SelfComparison {
  /** The completed count for the week being reported. */
  thisWeek: number;
  /** Mean completed across earlier complete weeks. Null with no history. */
  yourAverage: number | null;
  /** The first full week, as a "look how far" anchor. Null in week one. */
  firstWeek: number | null;
  /** Best complete week so far, excluding the one being reported. */
  yourBest: number | null;
  /** Plain sentence, or null when there is genuinely nothing to say. */
  line: string | null;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Compare the most recent complete week against this person's own history.
 *
 * `weeks` is expected oldest-first, as `computeCohortMetrics` produces it.
 * The week in progress is excluded by the caller — half a week compared
 * against whole ones would report a decline every Monday.
 */
export function selfComparison(weeks: WeekSlice[]): SelfComparison | null {
  if (weeks.length === 0) return null;

  const current = weeks[weeks.length - 1];
  const history = weeks.slice(0, -1);
  const thisWeek = current.completed;

  const yourAverage = mean(history.map((w) => w.completed));
  const firstWeek = history.length > 0 ? history[0].completed : null;
  const yourBest = history.length > 0 ? Math.max(...history.map((w) => w.completed)) : null;

  return {
    thisWeek,
    yourAverage,
    firstWeek,
    yourBest,
    line: comparisonLine(thisWeek, yourAverage, firstWeek, yourBest, history.length),
  };
}

/**
 * The sentence.
 *
 * Two rules it follows and a habit app usually does not. It never shames a
 * quieter week — a week below average gets context, not a verdict, because
 * the weeks people most need this app are the bad ones and a scolding is
 * how you lose them. And it never claims an improvement the numbers do not
 * support: with one week of history there is no trend, and it says so by
 * saying nothing.
 */
function comparisonLine(
  thisWeek: number,
  average: number | null,
  firstWeek: number | null,
  best: number | null,
  historyWeeks: number,
): string | null {
  if (historyWeeks === 0) {
    return thisWeek > 0
      ? `${thisWeek} done in your first week. Next week has something to measure against.`
      : null;
  }

  if (average === null) return null;

  // A single prior week is a sample of one; comparing to it invites a
  // conclusion the data cannot carry.
  if (historyWeeks < 2) {
    return `${thisWeek} done this week, ${firstWeek} the week before.`;
  }

  if (best !== null && thisWeek > best) {
    return `${thisWeek} done — more than any week since you started.`;
  }

  const delta = thisWeek - average;
  const rounded = Math.round(average * 10) / 10;

  if (delta >= 1) {
    return `${thisWeek} done, against your usual ${rounded}. A stronger week than most.`;
  }
  if (delta <= -1) {
    return `${thisWeek} done, against your usual ${rounded}. Quieter weeks happen; the plan does not reset.`;
  }
  return `${thisWeek} done — right on your usual ${rounded}. Steady is the point.`;
}

/**
 * How many real people it takes before a percentile means anything.
 *
 * Not a tuning knob. Below this, one unusual person moves the number
 * several places and the comparison is noise wearing a percentage sign.
 */
export const MIN_COHORT_FOR_COMPARISON = 200;

export interface CohortSnapshot {
  /** Completed counts for one week, one entry per person. */
  weeklyCompleted: number[];
}

export interface PeerComparison {
  percentile: number;
  cohortSize: number;
  line: string;
}

/**
 * Where this week sits among real people's weeks.
 *
 * Returns null — always — until a genuine cohort of at least
 * MIN_COHORT_FOR_COMPARISON people is handed to it. Nothing in the app
 * calls this with real data yet, because no such data exists. That is the
 * correct state, and it is enforced here rather than left to whoever wires
 * it up later.
 *
 * Simulated cohorts must NEVER be passed in. The simulator produces
 * thousands of plausible users and presenting a real person's week against
 * them as "other people" would be a fabricated result, whatever the
 * intention behind it.
 */
export function peerComparison(
  thisWeek: number,
  cohort: CohortSnapshot | null,
): PeerComparison | null {
  if (!cohort) return null;
  const sample = cohort.weeklyCompleted;
  if (sample.length < MIN_COHORT_FOR_COMPARISON) return null;

  const below = sample.filter((v) => v < thisWeek).length;
  const percentile = Math.round((below / sample.length) * 100);

  return {
    percentile,
    cohortSize: sample.length,
    line: `${thisWeek} done — more than ${percentile}% of ${sample.length} people this week.`,
  };
}
