/**
 * The end of the day, as the day rather than as a feeling.
 *
 * ── What this replaces ──────────────────────────────────────────────────
 *
 * The evening check-in asks for a five-point mood and two paragraphs of
 * free text. It is a journalling prompt wearing a review's name, and it is
 * wrong on every axis that matters here:
 *
 *   - It is slow. Two text fields at 9pm is homework.
 *   - It produces nothing the engine can use. The adaptation layer needs
 *     to know WHICH things happened and which did not; a mood of 3 tells
 *     it nothing about Tuesday at 6:15.
 *   - It gives no closure. You finish it having described the day rather
 *     than having finished it.
 *
 * Isaac's sketch is three columns against the day's own items — did it,
 * didn't, did something else — and then one line of result and tomorrow's
 * first thing. Whole day in three taps, and every tap is a fact the
 * scheduler can act on.
 *
 * ── THE THIRD COLUMN IS THE IMPORTANT ONE ───────────────────────────────
 *
 * "+" means "I did something else". It is the most-used control in any
 * honest review, because real days substitute rather than comply — and it
 * is currently a 56-chip wall on Today that nobody will scroll to.
 * Capturing it here means the app learns what someone ACTUALLY does, which
 * is the only thing the adaptation engine was ever able to use.
 *
 * ── WHAT IT REFUSES ─────────────────────────────────────────────────────
 *
 * No score, no percentage, no streak. The result line is a count and a
 * direction: "four of five this week" is a fact; "80%" is a grade. A
 * missed Tuesday is a missed Tuesday, not a reset to zero — the app has
 * said that on its Progress screen for some time and this is the screen
 * where it would be easiest to break the promise.
 */

import type {
  BehaviourEvent,
  BehaviourIntention,
  DailyPlan,
  PlanItem,
  PlanItemStatus,
} from '@/types/domain';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { addDays, durationMinutes, toMinutes } from '@/lib/dates';

/** What a person can say about one row. */
export type DayMark = 'did' | 'didnt' | 'instead';

/** The status a mark writes. 'instead' keeps the row honest: the planned
 *  thing did not happen, and something else is logged beside it. */
export const MARK_STATUS: Record<DayMark, PlanItemStatus> = {
  did: 'completed',
  didnt: 'skipped',
  instead: 'skipped',
};

export interface DayRow {
  item: PlanItem;
  /** Null where the person has not answered yet. */
  mark: DayMark | null;
}

/**
 * What a review is allowed to ask about.
 *
 * Generic work blocks are calendar noise, the same rule Today applies, and
 * fixed calendar events are the person's own diary rather than something
 * the app asked of them — "did your dentist appointment happen?" is the
 * app pretending to have scheduled someone's life. Exported so the week
 * grid reviews exactly the same set: two review screens disagreeing about
 * what counts is two different apps.
 */
export const isReviewable = (i: PlanItem) => i.title !== 'Work' && !i.fixed;

/**
 * The rows to review, in the order they happened. See `isReviewable`.
 */
export function dayRows(plan: DailyPlan | undefined): DayRow[] {
  return (plan?.items ?? [])
    .filter(isReviewable)
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .map((item) => ({
      item,
      mark:
        item.status === 'completed'
          ? ('did' as const)
          : item.status === 'skipped'
            ? ('didnt' as const)
            : null,
    }));
}

/**
 * The rows that still have no answer.
 *
 * ── The design mistake this exists to correct ───────────────────────────
 *
 * The first end-of-day screen asked about every item on the day. But Today
 * marks items as they happen — `ItemActions` calls `setItemStatus` from
 * the row, all day — so by the evening most of the day is already
 * answered, and the review was re-asking questions it had the answers to.
 *
 * That is why it read as a form however it was laid out. A person who
 * ticked three things off at the time and is then handed all five back at
 * 9pm has learned that the app was not listening. The fix is not a better
 * grid; it is asking about the GAP, which on most days is one or two
 * things and quite often nothing at all.
 */
export function unresolvedRows(plan: DailyPlan | undefined): DayRow[] {
  return dayRows(plan).filter((r) => r.mark === null);
}

/**
 * The part of a title a person would actually say.
 *
 * Protocol titles carry their method after a colon — "The urge answer:
 * two-minute reset" — which is right on a card you are about to follow
 * and wrong in a sentence about your evening. The browser showed the
 * closure line running to five lines of 28pt because it was reading
 * library titles out verbatim.
 */
function spoken(title: string): string {
  const head = title.split(/\s*[:—–]\s*/)[0];
  return head.length >= 6 ? head : title;
}

export interface DayTold {
  /** What happened, in the person's own titles. The closure line. */
  headline: string;
  /** What didn't, and what is still open. Context, not a verdict. */
  note: string;
}

/**
 * The day, told back.
 *
 * The closure job, which the marking grid never did: a person at the end
 * of a day wants to put it down, and a count is not how anybody puts a day
 * down. It names what happened, in their own titles, because "four of
 * five" is a score and "you trained and made dinner" is an evening.
 *
 * Split in two for the same reason the week screen splits its finding from
 * its count: what happened is the closure and belongs in the large type;
 * what did not is context and belongs under it, quietly. Run together in
 * one headline they made a five-line paragraph out of an ordinary Tuesday.
 *
 * It reports and never grades. The evaluative line stays at week scale for
 * the reason `dayResult` gives — one day is noise — so this says what the
 * day contained and stops there.
 */
/**
 * What the day held that was not on the plan.
 *
 * ── The worst sentence the product has said ───────────────────────────
 *
 * A review run as the target persona logged a drink at 21:50 and opened
 * the end-of-day screen four minutes later, specifically to be held to it.
 * The screen said:
 *
 *     "Easy cardio, talking pace and The urge answer happened.
 *      The daily walk and Get into the best shape of … didn't."
 *
 * The drink is absent — and worse than absent, the protocol built to
 * prevent it is reported as Done, because that plan item was ticked
 * earlier in the evening. So the last thing the product said before bed
 * was that the urge answer had worked, ninety seconds after being told it
 * had not.
 *
 * The cause is structural rather than a slip: `dayRows` reads
 * `plan.items` and nothing else, so the day review could not see a
 * behaviour event if it tried. For a person whose stated reason for being
 * here is "hold me to it", the one screen whose job is the truth about
 * today was built unable to see the thing they most wanted held.
 *
 * ── Why it is counted and not judged ──────────────────────────────────
 *
 * It reports. Three drinks is "three", not "three again" and not a
 * number going down — the house rule against scoreboards holds here as
 * everywhere, and the aftermath flow already owns the de-escalation. The
 * day review's job is only to not lie by omission.
 */
export function dayAlsoHeld(
  events: BehaviourEvent[],
  intentions: BehaviourIntention[],
  date: string,
  /**
   * Whether `date` is today.
   *
   * The line said "Also logged today" unconditionally, which was right
   * while this screen could only ever show today. Once it took a date, the
   * browser put "Also logged today: one alcohol." under a heading reading
   * TUESDAY, OCTOBER 6 — a sentence that is simply false about the day it
   * is on, on the one screen whose entire job is not lying about a day.
   *
   * Defaults true, which is the behaviour every existing caller and test
   * already relies on.
   */
  isToday = true,
): string | null {
  const byId = new Map(intentions.map((i) => [i.id, i]));
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.occurredAt.slice(0, 10) !== date) continue;
    const behaviour = byId.get(e.intentionId)?.behaviour;
    if (!behaviour) continue;
    counts.set(behaviour, (counts.get(behaviour) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  const parts = [...counts.entries()].map(([behaviour, n]) => {
    const label = behaviourInfo(behaviour as BehaviourIntention['behaviour']).label.toLowerCase();
    return n === 1 ? `one ${label}` : `${n} ${label}`;
  });
  const said =
    parts.length <= 2 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
  // Plain and flat. "Logged" rather than "you had", because the second is
  // an accusation and the first is a record. On a past day the word
  // "today" comes off rather than becoming "that day": the heading above
  // already names the day, and a second mention is the app explaining
  // itself.
  return isToday ? `Also logged today: ${said}.` : `Also logged: ${said}.`;
}

export function dayTold(rows: DayRow[]): DayTold {
  if (rows.length === 0) return { headline: 'Nothing was on today.', note: '' };

  const kept = rows.filter((r) => r.item.status === 'completed').map((r) => spoken(r.item.title));
  const missed = rows.filter((r) => r.mark === 'didnt').map((r) => spoken(r.item.title));
  const open = rows.filter((r) => r.mark === null).length;

  if (kept.length === rows.length) return { headline: 'All of it happened.', note: '' };
  if (kept.length === 0 && open === 0) return { headline: 'None of it happened today.', note: '' };

  const said = (titles: string[]): string =>
    titles.length <= 2
      ? titles.join(' and ')
      : `${titles[0]} and ${titles.length - 1} more`;

  // Nothing ticked and nothing answered is not a day that went badly, it
  // is a day the app has not been told about — so it asks rather than
  // asserting. "None of it happened yet" is a verdict on evidence the
  // screen is about to go and collect.
  if (kept.length === 0 && missed.length === 0) return { headline: 'How did today go?', note: '' };

  const note: string[] = [];
  if (missed.length > 0) note.push(`${said(missed)} didn't.`);
  if (open > 0) note.push(open === 1 ? '1 still unanswered.' : `${open} still unanswered.`);

  return {
    headline: kept.length > 0 ? `${said(kept)} happened.` : `${said(missed)} didn't.`,
    note: kept.length > 0 ? note.join(' ') : note.slice(1).join(' '),
  };
}

export interface DayResult {
  /** This day. */
  done: number;
  total: number;
  /** The seven days ending today — the context that stops one day being a verdict. */
  weekDone: number;
  weekTotal: number;
  /** Completions per day across the week, oldest first, for the sparkline. */
  trend: number[];
  line: string;
}

/**
 * The one line under the grid.
 *
 * Deliberately the WEEK rather than the day. A single day is noise, and a
 * person who did one of three today is not having the conversation the
 * number implies — where a week of four out of five says something real.
 */
export function dayResult(
  plans: Record<string, DailyPlan>,
  today: string,
): DayResult {
  const trend: number[] = [];
  let weekDone = 0;
  let weekTotal = 0;
  for (let i = 6; i >= 0; i--) {
    const rows = dayRows(plans[addDays(today, -i)]);
    const done = rows.filter((r) => r.item.status === 'completed').length;
    trend.push(done);
    weekDone += done;
    weekTotal += rows.length;
  }
  const rows = dayRows(plans[today]);
  const done = rows.filter((r) => r.item.status === 'completed').length;

  const line =
    weekTotal === 0
      ? 'Nothing planned this week yet.'
      : `${weekDone} of ${weekTotal} this week.`;

  return { done, total: rows.length, weekDone, weekTotal, trend, line };
}

/**
 * Tomorrow's first thing, so the review ends by setting up the next day.
 *
 * This is what makes the screen worth opening rather than worth
 * dismissing: it finishes one day and hands you the next, with the one
 * control that matters on it.
 */
export function tomorrowFirst(
  plans: Record<string, DailyPlan>,
  today: string,
): PlanItem | null {
  const rows = dayRows(plans[addDays(today, 1)]);
  return rows[0]?.item ?? null;
}

/** How long the row took, for the ones that have a length worth saying. */
export function rowLength(item: PlanItem): string | null {
  const mins = durationMinutes(item.start, item.end);
  if (mins < 30) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/* ── Which day you are looking at ─────────────────────────────────────── */

export interface ReviewableDay {
  /** The day to show, after clamping. */
  date: string;
  /** The earliest day there is a record for. */
  earliest: string;
  /** Whether the back arrow does anything. */
  canGoBack: boolean;
  isToday: boolean;
}

/**
 * The day the review screen should show, given what was asked for.
 *
 * Isaac, on his own week: *"I can't remember what was or wasn't included
 * but I need to check."* (`docs/NEXT_SESSION.md` §2.2.) The screen was
 * pinned to today. It now takes a date, and this is the rule about which
 * dates are real — extracted from the component because it is a rule
 * rather than a layout, and because every one of its edges is a way to
 * show somebody a day that does not exist.
 *
 * Three clamps:
 *
 *   - **Never ahead of today.** Tomorrow is a plan, not a review, and the
 *     Week tab is where a plan gets changed. A forward arrow into an
 *     unlived day would invite marking things done before they happen.
 *   - **Never before the record.** The store keeps 120 days of plans
 *     item-by-item and then drops them, so walking back past the first one
 *     hands over a run of identical empty screens with no way to tell
 *     "nothing happened" from "the app has forgotten".
 *   - **Never a malformed date.** A route parameter is a string from
 *     outside; anything that is not YYYY-MM-DD falls back to today rather
 *     than rendering a screen about `NaN`.
 */
export function reviewableDay(input: {
  requested: string | undefined | null;
  today: string;
  plans: Record<string, DailyPlan>;
}): ReviewableDay {
  const { requested, today, plans } = input;

  const past = Object.keys(plans)
    .filter((d) => d <= today)
    .sort();
  const earliest = past.length > 0 ? past[0] : today;

  let date = today;
  if (typeof requested === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(requested)) {
    date = requested > today ? today : requested < earliest ? earliest : requested;
  }

  return { date, earliest, canGoBack: date > earliest, isToday: date === today };
}
