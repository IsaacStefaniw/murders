/**
 * "Am I better than six weeks ago?"
 *
 * ── The question the product exists to answer ───────────────────────────
 *
 * Asked in one of the three review sessions, on a Sunday morning, after
 * six weeks of use. The Progress tab answered with empty states, and the
 * finding written down was that it answers the central question with its
 * own blankness.
 *
 * Most of that turned out to be my harness. `features/sim/engine.ts`
 * pruned its working copy of `plans` to 21 days — with a comment claiming
 * that was "like the store does", where the store actually keeps 120 days
 * item-by-item — so a 45-day seed handed the app three weeks of history
 * and every screen reading further back rendered empty for any build. The
 * engine now archives every day it lives. The second time a finding on
 * this tab has been my instrument rather than the app, which is recorded
 * rather than quietly corrected, for the same reason as the first.
 *
 * What survived the correction is real and now provable: with 45 days of
 * plans in the store, nothing on the screen compared any two periods. The
 * only historical panels were a 28-day sparkline — one figure, no
 * comparison — and a chart fed by metrics the sim does not model.
 *
 * ── What it answers with ────────────────────────────────────────────────
 *
 * Three weeks against the three before, from `plans`, which is the one
 * source that is genuinely there in both windows. Measured on the fixed
 * seed, Alex's honest answer is:
 *
 *     days something happened   18 against 18
 *     things done               43 against 45
 *     time on them              17.6 hours against 24.6
 *
 * Which is to say: showing up exactly as often, and spending a third less
 * time. That is not a flattering answer and it is the right one — this is
 * the person who will respect a D over a confident claim (PERSONA.md
 * §3.5), and an encouraging screen would be the thing that loses them.
 *
 * ── The house rules, and where the line is ──────────────────────────────
 *
 * No score, no percentage, no streak, no grade. Two counts side by side
 * and the person draws the conclusion — §3.3's distinction between being
 * KNOWN and being MARKED. The threshold below is internal: it decides
 * which row is worth a sentence, and never reaches the screen as a figure.
 */

import { addDays, durationMinutes } from '@/lib/dates';
import type { BehaviourEvent, BehaviourIntention, DailyPlan } from '@/types/domain';
import { behaviourInfo } from '@/features/behaviours/catalog';

/** Days in each half of the comparison. */
export const WINDOW_DAYS = 21;

/**
 * How much a figure has to move before it earns the sentence.
 *
 * A fifth of the earlier figure. Three weeks is long enough that a fifth
 * is not one bad Tuesday, and short enough that a fifth is still a drift
 * worth naming rather than a trend nobody can act on. It is stated here
 * so it can be argued with; it is never printed.
 */
export const MOVED_FRACTION = 0.2;

export interface Comparison {
  key: string;
  /** The row label, as the screen prints it. */
  label: string;
  now: number;
  then: number;
  /** How to render the two figures. */
  unit: 'count' | 'minutes';
  /**
   * The direction the person is trying to go.
   *
   * Only used to word the sentence. It never becomes a tick or a cross:
   * fewer drinks is the direction somebody chose, not a mark out of ten.
   */
  wantMore: boolean;
}

export interface ThenAndNow {
  windowDays: number;
  /** Both windows had something to say about these. */
  rows: Comparison[];
  /** The one row worth a sentence, or null when nothing moved. */
  headline: string | null;
  /**
   * Set when there is not enough history to compare at all, and says how
   * much there is. Null once the comparison stands on its own.
   */
  shortfall: string | null;
}

/** "17.6 hours", "45 minutes" — whichever reads as the thing it is. */
export function spellMinutes(minutes: number): string {
  if (minutes < 90) return `${minutes} minutes`;
  return `${Math.round((minutes / 60) * 10) / 10} hours`;
}

const render = (value: number, unit: Comparison['unit']): string =>
  unit === 'minutes' ? spellMinutes(value) : String(value);

interface Half {
  days: number;
  dayssomething: number;
  done: number;
  minutes: number;
}

function half(plans: Record<string, DailyPlan>, from: string, to: string): Half {
  const out: Half = { days: 0, dayssomething: 0, done: 0, minutes: 0 };
  for (const [date, plan] of Object.entries(plans)) {
    if (date < from || date > to) continue;
    // Fixed items are the person's own diary rather than something the app
    // asked of them — the same rule `isReviewable` applies, because two
    // screens disagreeing about what counts is two different apps.
    const items = plan.items.filter((i) => !i.fixed);
    if (items.length === 0) continue;
    out.days += 1;
    const done = items.filter((i) => i.status === 'completed');
    if (done.length > 0) out.dayssomething += 1;
    out.done += done.length;
    for (const item of done) {
      // durationMinutes already returns 0 for a span it cannot make sense of.
      out.minutes += item.end ? durationMinutes(item.start, item.end) : 0;
    }
  }
  return out;
}

function occasions(
  events: BehaviourEvent[],
  ids: Set<string>,
  from: string,
  to: string,
): number {
  let n = 0;
  for (const e of events) {
    if (!ids.has(e.intentionId)) continue;
    const date = e.occurredAt.slice(0, 10);
    if (date < from || date > to) continue;
    n += 1;
  }
  return n;
}

/**
 * The last three weeks against the three before.
 *
 * `today` is the last day of the recent window, so the comparison is
 * "the three weeks up to and including today" against the three before
 * that — no gap, and no overlap.
 */
export function thenAndNow(input: {
  plans: Record<string, DailyPlan>;
  behaviourEvents: BehaviourEvent[];
  behaviourIntentions: BehaviourIntention[];
  today: string;
}): ThenAndNow {
  const { plans, behaviourEvents, behaviourIntentions, today } = input;

  const nowFrom = addDays(today, -(WINDOW_DAYS - 1));
  const thenTo = addDays(nowFrom, -1);
  const thenFrom = addDays(thenTo, -(WINDOW_DAYS - 1));

  const now = half(plans, nowFrom, today);
  const then = half(plans, thenFrom, thenTo);

  // Nothing to compare against. Say how much there is rather than showing
  // an empty frame, which is the thing this whole module exists to stop.
  if (then.days === 0) {
    const have = Object.keys(plans).filter((d) => d <= today).length;
    return {
      windowDays: WINDOW_DAYS,
      rows: [],
      headline: null,
      shortfall:
        have === 0
          ? 'Nothing to compare yet. This fills in once there are a few weeks behind you.'
          : `${have} ${have === 1 ? 'day' : 'days'} of history so far. This compares three weeks against the three before, so it starts answering at six.`,
    };
  }

  const rows: Comparison[] = [
    {
      key: 'days',
      label: 'Days something happened',
      now: now.dayssomething,
      then: then.dayssomething,
      unit: 'count',
      wantMore: true,
    },
    {
      key: 'done',
      label: 'Things done',
      now: now.done,
      then: then.done,
      unit: 'count',
      wantMore: true,
    },
    {
      key: 'minutes',
      label: 'Time on them',
      now: now.minutes,
      then: then.minutes,
      unit: 'minutes',
      wantMore: true,
    },
  ];

  // One row per thing they are cutting back on, and only where BOTH
  // windows have something — a behaviour first logged a fortnight ago
  // compared against a window that could not contain it would read as a
  // jump from nothing, which is an artefact of when logging started.
  for (const intention of behaviourIntentions.filter((b) => b.active)) {
    const ids = new Set([intention.id]);
    const n = occasions(behaviourEvents, ids, nowFrom, today);
    const t = occasions(behaviourEvents, ids, thenFrom, thenTo);
    if (n === 0 && t === 0) continue;
    if (t === 0) continue;
    rows.push({
      key: `behaviour:${intention.behaviour}`,
      label: behaviourInfo(intention.behaviour).label,
      now: n,
      then: t,
      unit: 'count',
      wantMore: false,
    });
  }

  return {
    windowDays: WINDOW_DAYS,
    rows,
    headline: headlineFor(rows),
    shortfall: null,
  };
}

/**
 * The one sentence, or none.
 *
 * Names the single row that moved most and gives both figures. Not a
 * summary of all of them: a paragraph of four comparisons is a report,
 * and this person has about eight seconds (PERSONA.md §3.1).
 */
export function headlineFor(rows: Comparison[]): string | null {
  if (rows.length === 0) return null;

  let best: { row: Comparison; share: number } | null = null;
  for (const row of rows) {
    if (row.then === 0) continue;
    const share = Math.abs(row.now - row.then) / row.then;
    if (share < MOVED_FRACTION) continue;
    if (!best || share > best.share) best = { row, share };
  }

  if (!best) {
    return 'The last three weeks look much like the three before.';
  }

  const { row } = best;
  const up = row.now > row.then;
  const direction = up ? 'up' : 'down';
  return `${row.label} is ${direction}: ${render(row.now, row.unit)}, against ${render(row.then, row.unit)} in the three weeks before.`;
}
