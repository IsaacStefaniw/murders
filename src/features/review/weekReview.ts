/**
 * The end of the week, as a grid of what actually happened.
 *
 * ── Why a grid and not a paragraph ──────────────────────────────────────
 *
 * The weekly review that exists today calls a language model, gets back a
 * narrative, and prints a completion percentage under it. It is pleasant
 * and it is nearly useless, for one reason: a person cannot see the SHAPE
 * of their week in prose. "You completed 58% of your activities" does not
 * tell you that every single thing at 6am died and everything at 10am
 * lived, which is the only fact in the week worth acting on.
 *
 * Isaac's sketch is hours down the left, days across the top, a mark in
 * every cell. Twelve cells of ✗ in one row is an argument that makes
 * itself. No score, no percentage, no streak — the same refusal the day
 * review makes, for the same reason.
 *
 * ── The three things the grid earns ─────────────────────────────────────
 *
 * 1. **Proposals from what happened**, not offered blind. A dead slot is a
 *    routine, a weekday and an hour that has now been observed failing
 *    more than once — so the app can name it ("6am Tuesday died twice")
 *    and offer the two answers that exist: move it, or stop pretending.
 *
 * 2. **The capacity dial as a direct control.** `load.ts` already runs a
 *    servo on week size and already lets a person override it, but the
 *    override lives on the Plan tab where nobody looks at it in the one
 *    moment they have evidence. + and − belong under the grid.
 *
 * 3. **Tap and move.** A cell with something in it can be nudged half an
 *    hour either way, there and then. Not drag-and-drop: a 7-column grid
 *    on a 390pt phone gives every cell about 40 points of width, and drag
 *    targets that small are a demo feature, not a usable one.
 *
 * ── What it deliberately does not do ────────────────────────────────────
 *
 * It does not grade the week, rank days, or award anything. It does not
 * propose dropping the last routine holding up a connection area — that
 * rule lives in `weeklyChanges.droppableRoutines` and is imported rather
 * than restated, because two review screens disagreeing about what the app
 * may take away is two different apps.
 */

import {
  ADD_ABOVE,
  CAPACITY_LABEL,
  CAPACITY_ORDER,
  SHED_BELOW,
  type Capacity,
} from '@/features/planner/load';
import { isReviewable } from '@/features/review/dayReview';
import { droppableRoutines, type WeeklyChange } from '@/features/review/weeklyChanges';
import { addDays, dateKeyToDate, toHHMM, toMinutes } from '@/lib/dates';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

/* ── The grid ─────────────────────────────────────────────────────────── */

/** Monday first, matching `weekStartOf`. Duplicated letters are the point. */
export const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/**
 * What one hour of one day came to.
 *
 * `ahead` is separate from `empty` on purpose. A person reviewing on a
 * Thursday has three days that have not happened yet, and marking those
 * cells with the same glyph as "nothing was on" would tell them they had
 * an empty weekend when in fact they have a full one coming.
 */
export type CellMark = 'did' | 'didnt' | 'mixed' | 'ahead' | 'empty';

/**
 * Three marks and two placeholders, chosen for a grid rather than a list.
 *
 * `mixed` has been through three glyphs. `◐` is missing from enough
 * fallback fonts to render as a box or a solid blob. `½` renders
 * everywhere and reads as a fraction — a number, in a grid of marks, which
 * is the one thing it must not look like. `≈` means "roughly, partly" in
 * every context a person has met it, is in every font, and is visually
 * unmistakable from both a tick and a cross.
 *
 * Colour is never the only difference between any two of these: each has
 * its own shape, and each cell carries a spoken label as well.
 */
export const CELL_GLYPH: Record<CellMark, string> = {
  did: '✓',
  didnt: '✗',
  mixed: '≈',
  ahead: '○',
  empty: '·',
};

export interface WeekCell {
  date: string;
  /** 0–23, the hour the items in this cell start in. */
  hour: number;
  mark: CellMark;
  items: PlanItem[];
}

export interface WeekGridRow {
  hour: number;
  label: string;
  /** Always seven, Monday first. */
  cells: WeekCell[];
  /**
   * Hours skipped between the row above and this one.
   *
   * The grid drops empty hours, which keeps it three rows instead of
   * nineteen — and quietly makes the vertical axis lie. Rows at 6am, 7am,
   * 10am and 4pm are drawn at equal spacing, so the eye reads the six
   * hours between ten and four as the same distance as the one between
   * six and seven. On a screen whose whole argument is "look at the SHAPE
   * of your week", a false shape is the worst defect available.
   *
   * So the gap is reported and the screen draws it. Zero on the first row
   * and on any row directly below the one above it.
   */
  gapBefore: number;
}

export interface WeekGrid {
  weekStart: string;
  days: string[];
  /** Only the hours the week actually used, earliest first. */
  rows: WeekGridRow[];
  done: number;
  total: number;
  /** How the week reads in one line. A count, never a rate. */
  line: string;
}

/** "6am", "12pm", "1pm" — the sketch's own labels. */
export function hourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? 'am' : 'pm';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}${suffix}`;
}

function markOf(items: PlanItem[], date: string, today: string): CellMark {
  if (items.length === 0) return 'empty';
  const done = items.filter((i) => i.status === 'completed').length;
  if (done === items.length) return 'did';
  // A day that has not arrived has not failed. Anything unfinished on it
  // is still ahead, however the rest of the cell resolved.
  if (date > today) return 'ahead';
  if (done > 0) return 'mixed';
  return 'didnt';
}

/**
 * The week, bucketed into the hours it actually used.
 *
 * Empty hours are dropped rather than rendered as blank rows: a grid
 * running 5am to 11pm is nineteen rows on a phone, seventeen of which say
 * nothing, and the row that matters stops being visible. The sketch shows
 * three rows for a full week, which is right.
 */
export function weekGrid(
  plans: Record<string, DailyPlan>,
  weekStart: string,
  today: string,
): WeekGrid {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byHour = new Map<number, PlanItem[][]>();
  let done = 0;
  let total = 0;

  days.forEach((date, col) => {
    for (const item of (plans[date]?.items ?? []).filter(isReviewable)) {
      const hour = Math.floor(toMinutes(item.start) / 60);
      if (!byHour.has(hour)) {
        byHour.set(
          hour,
          Array.from({ length: 7 }, () => [] as PlanItem[]),
        );
      }
      byHour.get(hour)![col].push(item);
      // A Saturday that has not arrived is not a thing that failed to
      // happen, so it stays out of the denominator. Reviewed on a
      // Thursday, "7 of 9" read as two misses where there was one.
      if (item.status === 'completed') {
        done += 1;
        total += 1;
      } else if (date <= today) {
        total += 1;
      }
    }
  });

  const hours = [...byHour.keys()].sort((a, b) => a - b);
  const rows: WeekGridRow[] = hours.map((hour, i) => ({
    hour,
    label: hourLabel(hour),
    gapBefore: i === 0 ? 0 : hour - hours[i - 1] - 1,
    cells: byHour.get(hour)!.map((items, col) => ({
      date: days[col],
      hour,
      items,
      mark: markOf(items, days[col], today),
    })),
  }));

  const line =
    total === 0 ? 'Nothing was on this week.' : `${done} of ${total} things happened.`;

  return { weekStart, days, rows, done, total, line };
}

/**
 * "8–14 Sep", the sketch's header. Crosses months as "28 Sep – 4 Oct".
 *
 * Spelled out rather than taken from `toLocaleDateString`, which returns
 * "Sept" for September on some ICU builds and "Sep" on others — a header
 * that changes shape depending on which phone is holding it.
 */
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function weekRangeLabel(weekStart: string): string {
  const from = dateKeyToDate(weekStart);
  const to = dateKeyToDate(addDays(weekStart, 6));
  const month = (d: Date) => MONTHS[d.getMonth()];
  return month(from) === month(to)
    ? `${from.getDate()}–${to.getDate()} ${month(to)}`
    : `${from.getDate()} ${month(from)} – ${to.getDate()} ${month(to)}`;
}

/* ── What changes next week ───────────────────────────────────────────── */

/** How far back a slot is judged on. Three weeks is two chances to recur. */
export const SLOT_HISTORY_WEEKS = 3;

/** Below this many sightings a dead slot is a bad week, not a pattern. */
export const SLOT_MIN_OBSERVATIONS = 2;

/** How far "tap and move" and the morning shift nudge something. */
export const NUDGE_MINUTES = 30;

export interface WeekAction {
  id: string;
  label: string;
  /** Applied through the store's existing weekly-change applier. */
  changes?: WeeklyChange[];
  /** Sets the coming week's gear directly. Mutually exclusive with changes. */
  capacity?: Capacity;
}

/** One cell of the grid, named so a claim can point at its own evidence. */
export interface WeekFocus {
  /** 0–6, Monday first. */
  col: number;
  hour: number;
}

export interface WeekProposal {
  id: string;
  /** The observation, in the person's own week. */
  line: string;
  actions: WeekAction[];
  /**
   * The cells this observation was read off.
   *
   * A finding stated above a grid is a claim, and a claim you have to hunt
   * for in a 7-column table is a claim most people take on trust or
   * ignore. Naming the cells lets the screen ring them, so "6am Tuesday
   * died twice" and the two crosses it came from are the same gesture.
   *
   * Absent on the capacity dial, which is a standing question rather than
   * a reading of any particular cell.
   */
  focus?: WeekFocus[];
}

/** Twice reads better than 2 times; past four, the numeral is clearer. */
function countWord(n: number): string {
  return n === 2 ? 'twice' : n === 3 ? 'three times' : `${n} times`;
}

/**
 * The count, AND the window it was counted over.
 *
 * `deadSlots` looks back `SLOT_HISTORY_WEEKS` weeks; the grid directly
 * above this sentence shows ONE. So a bare "died three times" sent anybody
 * who checked looking for three crosses in a picture that holds one, and a
 * claim you cannot check against the picture beside it is how a picture
 * stops being believed. Every week in the window is both the stronger
 * sentence and the shorter one.
 */
export function overWeeks(seen: number): string {
  return seen >= SLOT_HISTORY_WEEKS
    ? `${SLOT_HISTORY_WEEKS} weeks running`
    : `${countWord(seen)} in the last ${SLOT_HISTORY_WEEKS} weeks`;
}

/** The routine's window length, so a move keeps the room it had. */
function windowMinutes(r: Routine): number {
  const width = toMinutes(r.preferredEnd) - toMinutes(r.preferredStart);
  return width > 0 ? width : 60;
}

function moveChange(r: Routine, startMin: number, why: string): WeeklyChange {
  const start = Math.max(0, Math.min(23 * 60 + 30, startMin));
  return {
    id: `move-${r.id}-${start}`,
    kind: 'move_routine',
    routineId: r.id,
    payload: {
      preferredStart: toHHMM(start),
      preferredEnd: toHHMM(Math.min(23 * 60 + 59, start + windowMinutes(r))),
    },
    description: why,
  };
}

interface Slot {
  routine: Routine;
  col: number;
  hour: number;
  seen: number;
  /** Hours this routine was actually completed in, across the same window. */
  livedAt: number[];
}

/**
 * Slots that have now failed more than once.
 *
 * Judged across `SLOT_HISTORY_WEEKS` rather than the reviewed week alone,
 * because one week can only ever see a weekday slot once — and "6am
 * Tuesday died" said after a single Tuesday is the app calling a coin toss
 * a pattern. An untouched item counts as a death, for the reason set out
 * in `weeklyChanges`: the person who is drowning does not tap skip.
 */
export function deadSlots(
  plans: Record<string, DailyPlan>,
  weekStart: string,
  routines: Routine[],
  today: string,
): Slot[] {
  const byId = new Map(routines.map((r) => [r.id, r]));
  const seen = new Map<string, Slot>();
  const lived = new Map<string, number[]>();

  for (let w = SLOT_HISTORY_WEEKS - 1; w >= 0; w--) {
    const start = addDays(weekStart, -7 * w);
    for (let col = 0; col < 7; col++) {
      const date = addDays(start, col);
      // A day that has not arrived cannot have died. Reviewed mid-week,
      // counting the coming Saturday made a slot look one death worse than
      // the person's week actually was.
      if (date > today) continue;
      for (const item of (plans[date]?.items ?? []).filter(isReviewable)) {
        if (!item.routineId) continue;
        const routine = byId.get(item.routineId);
        if (!routine || !routine.active) continue;
        const hour = Math.floor(toMinutes(item.start) / 60);
        if (item.status === 'completed') {
          lived.set(item.routineId, [...(lived.get(item.routineId) ?? []), hour]);
          // A completion clears the slot's tally: one good Tuesday means the
          // slot works and the week was the problem. Weeks are walked oldest
          // first so the most recent evidence is the evidence that stands.
          seen.delete(`${item.routineId}|${col}|${hour}`);
          continue;
        }
        const key = `${item.routineId}|${col}|${hour}`;
        const prior = seen.get(key);
        seen.set(
          key,
          prior
            ? { ...prior, seen: prior.seen + 1 }
            : { routine, col, hour, seen: 1, livedAt: [] },
        );
      }
    }
  }

  return [...seen.values()]
    .filter((s) => s.seen >= SLOT_MIN_OBSERVATIONS)
    .map((s) => ({ ...s, livedAt: lived.get(s.routine.id) ?? [] }))
    .sort((a, b) => b.seen - a.seen || a.hour - b.hour);
}

/** Where this routine's completions actually are, if they agree on an hour. */
function livedHour(slot: Slot): number | null {
  if (slot.livedAt.length === 0) return null;
  const tally = new Map<number, number>();
  for (const h of slot.livedAt) tally.set(h, (tally.get(h) ?? 0) + 1);
  const [best] = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  return best[0] === slot.hour ? null : best[0];
}

function slotActions(slot: Slot, routines: Routine[]): WeekAction[] {
  const target = livedHour(slot);
  const toHour = target ?? slot.hour + 1;
  const actions: WeekAction[] = [
    {
      id: `slot-move-${slot.routine.id}`,
      label: `Move to ${hourLabel(toHour)}`,
      changes: [
        moveChange(
          slot.routine,
          toHour * 60,
          target === null
            ? `Move ${slot.routine.title.toLowerCase()} an hour later.`
            : `Move ${slot.routine.title.toLowerCase()} to where it actually happens.`,
        ),
      ],
    },
  ];
  if (droppableRoutines(routines).some((r) => r.id === slot.routine.id)) {
    actions.push({
      id: `slot-drop-${slot.routine.id}`,
      label: 'Drop it',
      changes: [
        {
          id: `drop-${slot.routine.id}`,
          kind: 'deactivate_routine',
          routineId: slot.routine.id,
          description: `Rest ${slot.routine.title.toLowerCase()} — fewer plans, kept, beat more plans, missed.`,
        },
      ],
    });
  }
  return actions;
}

function slotProposal(slot: Slot, routines: Routine[]): WeekProposal {
  return {
    id: `slot-${slot.routine.id}-${slot.col}-${slot.hour}`,
    line: `${hourLabel(slot.hour)} ${DAY_NAMES[slot.col]} — ${slot.routine.title.toLowerCase()} died ${overWeeks(slot.seen)}.`,
    actions: slotActions(slot, routines),
    focus: [{ col: slot.col, hour: slot.hour }],
  };
}

/** Below this many weekdays, an hour that fails is a day problem. */
export const SPREAD_MIN_DAYS = 3;

/**
 * One hour that is failing across the week, said as one hour.
 *
 * `deadSlots` keys on routine + weekday + hour, which is right for "6am
 * Tuesday" and wrong for a daily routine: seven identical findings, of
 * which the screen shows the top one. That was survivable while the
 * findings sat below the grid. It is not survivable now they ARE the
 * headline — the browser showed "7am Monday — protein at breakfast died
 * twice" in 28pt type directly above a 7am row holding seven crosses,
 * with one of them ringed and the near-identical Tuesday repeated
 * underneath. A person reading that concludes the app can see a seventh
 * of their problem.
 *
 * So slots that share a routine and an hour across `SPREAD_MIN_DAYS` or
 * more weekdays collapse into one finding about the hour, ringing every
 * cell it was read off. The count stays checkable against the row: "died
 * every day it was on" when the group covers the routine's whole
 * schedule, and "5 of the 7 days" when it does not.
 */
function spreadProposal(group: Slot[], routines: Routine[]): WeekProposal {
  const [first] = group;
  const onDays = first.routine.days?.length ?? group.length;
  const how =
    group.length >= onDays
      ? 'died every day it was on'
      : `died on ${group.length} of the ${onDays} days it was on`;
  return {
    id: `spread-${first.routine.id}-${first.hour}`,
    line: `${hourLabel(first.hour)} is not working — ${first.routine.title.toLowerCase()} ${how}.`,
    actions: slotActions(first, routines),
    focus: group.map((s) => ({ col: s.col, hour: s.hour })),
  };
}

/**
 * The morning that is not happening.
 *
 * The sketch's third bullet is "everything 30 min later", which as written
 * is a blunt global instrument — so it is offered only on the evidence
 * that produces it: the earliest hours of the week held things, none of
 * them happened, and things later in the day did. That is a person whose
 * day starts later than their plan believes, and the honest fix is to move
 * the early band rather than the whole week.
 */
function shiftProposal(grid: WeekGrid, routines: Routine[]): WeekProposal | null {
  const occupied = grid.rows.filter((r) => r.cells.some((c) => c.items.length > 0));
  if (occupied.length < 2) return null;

  // Days that have not arrived cannot have died, so `ahead` cells are not
  // evidence either way and are left out of the count entirely.
  let deadUntil = -1;
  let deadItems = 0;
  for (const row of occupied) {
    const judged = row.cells.filter((c) => c.mark !== 'ahead' && c.items.length > 0);
    if (judged.length === 0) break;
    if (judged.some((c) => c.mark === 'did' || c.mark === 'mixed')) break;
    deadUntil = row.hour;
    deadItems += judged.reduce((n, c) => n + c.items.length, 0);
  }
  if (deadUntil < 0 || deadItems < SLOT_MIN_OBSERVATIONS) return null;
  // A week where nothing at all happened is not a timing problem, and
  // telling somebody who had that week to try again half an hour later is
  // the app missing the point badly.
  if (grid.done === 0) return null;

  const cutoff = deadUntil + 1;
  const affected = routines.filter(
    (r) => r.active && r.flexible && Math.floor(toMinutes(r.preferredStart) / 60) <= deadUntil,
  );
  if (affected.length === 0) return null;

  const focus: WeekFocus[] = [];
  for (const row of occupied) {
    if (row.hour > deadUntil) break;
    row.cells.forEach((c, col) => {
      if (c.items.length > 0 && c.mark !== 'ahead') focus.push({ col, hour: row.hour });
    });
  }

  return {
    id: `shift-${cutoff}`,
    line: `Nothing before ${hourLabel(cutoff)} happened, ${countWord(deadItems)}.`,
    focus,
    actions: [
      {
        id: 'shift-later',
        label: `Start ${NUDGE_MINUTES} min later`,
        changes: affected.map((r) =>
          moveChange(
            r,
            toMinutes(r.preferredStart) + NUDGE_MINUTES,
            `Start ${r.title.toLowerCase()} half an hour later.`,
          ),
        ),
      },
    ],
  };
}

/**
 * The capacity dial, as the sketch's `[ + ] [ − ]`.
 *
 * Always present, because the question "is next week the right size?" is
 * always worth asking at the end of a week, and because a control that
 * only appears when the app has an opinion is a control nobody learns to
 * look for.
 */
function capacityProposal(grid: WeekGrid, current: Capacity, forward: string): WeekProposal {
  const rate = grid.total > 0 ? grid.done / grid.total : null;
  const i = CAPACITY_ORDER.indexOf(current);
  // The gear itself is named in the caption under the buttons, so the line
  // asks the question rather than repeating the answer back.
  const settled = `Is ${forward} the right size?`;
  // Only ever asks in a direction that has a button. The browser caught
  // "More than half of it went untouched. Less this week?" printed above
  // a lone `+ Normal`, on somebody already in the lowest gear — the app
  // proposing the one thing it had no way to do.
  const canDown = i > 0;
  const canUp = i < CAPACITY_ORDER.length - 1;
  const line =
    rate === null
      ? settled
      : rate >= ADD_ABOVE && canUp
        ? 'You cleared nearly all of it. Room for one more?'
        : rate < SHED_BELOW && canDown
          ? `More than half of it went untouched. Less ${forward}?`
          : settled;

  const actions: WeekAction[] = [];
  if (canDown) {
    actions.push({
      id: 'capacity-down',
      label: `− ${CAPACITY_LABEL[CAPACITY_ORDER[i - 1]]}`,
      capacity: CAPACITY_ORDER[i - 1],
    });
  }
  if (canUp) {
    actions.push({
      id: 'capacity-up',
      label: `+ ${CAPACITY_LABEL[CAPACITY_ORDER[i + 1]]}`,
      capacity: CAPACITY_ORDER[i + 1],
    });
  }
  return { id: 'capacity', line, actions };
}

/** At most three, the sketch's own count. More than three is a backlog. */
export const MAX_PROPOSALS = 3;

export function weekProposals(input: {
  grid: WeekGrid;
  plans: Record<string, DailyPlan>;
  routines: Routine[];
  capacity: Capacity;
  /** The day the review is being run on, so nothing ahead counts as dead. */
  today: string;
  /** "next week" or "this week" — whichever the changes actually land on. */
  forward?: string;
}): WeekProposal[] {
  const { grid, plans, routines, capacity, today, forward = 'next week' } = input;
  const out: WeekProposal[] = [];

  const slots = deadSlots(plans, grid.weekStart, routines, today);
  // Grouped by routine and hour, so a daily routine produces one finding
  // about the hour rather than seven near-identical ones about weekdays.
  const byHour = new Map<string, Slot[]>();
  for (const s of slots) {
    const key = `${s.routine.id}|${s.hour}`;
    byHour.set(key, [...(byHour.get(key) ?? []), s]);
  }
  const taken = new Set<string>();
  for (const slot of slots) {
    if (out.length >= 2) break;
    const key = `${slot.routine.id}|${slot.hour}`;
    if (taken.has(key)) continue;
    taken.add(key);
    const group = byHour.get(key)!;
    out.push(
      group.length >= SPREAD_MIN_DAYS
        ? spreadProposal(group, routines)
        : slotProposal(slot, routines),
    );
  }

  // Suppressed when a slot proposal already names a routine in the early
  // band: applying both would move the same thing twice.
  const shift = shiftProposal(grid, routines);
  if (
    shift &&
    !slots.some((s) => shift.actions[0].changes?.some((c) => c.routineId === s.routine.id))
  ) {
    out.push(shift);
  }

  out.push(capacityProposal(grid, capacity, forward));
  return out.slice(0, MAX_PROPOSALS);
}

/* ── The finding, and the evidence for it ─────────────────────────────── */

export interface WeekLead {
  /** The sentence the screen opens with. */
  headline: string;
  /** The count, quietly, under it. Empty where it would repeat the headline. */
  under: string;
  /** The proposal the headline came from, and whose cells to ring. */
  proposal: WeekProposal | null;
  /** Everything else, in order, for below the evidence. */
  rest: WeekProposal[];
}

/**
 * What the week screen should say first.
 *
 * ── The mistake this corrects ───────────────────────────────────────────
 *
 * The screen opened with the grid: seven columns of marks, a legend, a
 * count, and then — below all of it — the sentence the app had already
 * worked out. That asks the person to do analysis the app has done, and
 * then does it for them anyway, further down, where they may never reach.
 *
 * `deadSlots` knows "6am Tuesday died twice" before the screen renders a
 * single cell. Leading with it costs nothing and is the entire value of
 * having a week's data at all: a person can see their own Tuesday; they
 * cannot see three Tuesdays at once, and that is exactly the thing the app
 * can do and they cannot.
 *
 * So the grid keeps its job and loses its position. Finding, then the
 * decision it implies, then the grid as the evidence underneath — with the
 * cells the finding was read off ringed, so the claim can be checked in
 * one look rather than taken on trust.
 *
 * ── When there is no finding ────────────────────────────────────────────
 *
 * Most weeks there is none, and the honest headline then is not a number.
 * "Nothing went wrong twice in the same place" is what `deadSlots`
 * returning empty actually means, and it is worth saying: a person whose
 * week felt scrappy has just been told the scrappiness did not repeat.
 */
export function weekLead(
  grid: WeekGrid,
  proposals: WeekProposal[],
  /** "this week" or "last week" — whichever `reviewPeriod` is looking at. */
  back = 'this week',
): WeekLead {
  const lead = proposals.find((p) => p.id !== 'capacity') ?? null;
  const headline = lead
    ? lead.line
    : grid.total === 0
      ? `Nothing was on ${back}.`
      : grid.done === grid.total
        ? 'All of it happened.'
        : 'Nothing went wrong twice in the same place.';
  return {
    headline,
    under: grid.total === 0 ? '' : grid.line,
    proposal: lead,
    rest: proposals.filter((p) => p !== lead),
  };
}

/* ── Tap and move ─────────────────────────────────────────────────────── */

/**
 * Nudging one cell, from the grid itself.
 *
 * Moves the routines behind the cell rather than the items in it: changing
 * one Tuesday changes one Tuesday and the person is back here next week
 * having the same conversation. The week under review is over — the only
 * useful edit is to the thing that will produce next week.
 */
export function nudgeCell(
  cell: WeekCell,
  routines: Routine[],
  deltaMinutes: number,
): WeeklyChange[] {
  const ids = new Set(cell.items.map((i) => i.routineId).filter(Boolean) as string[]);
  return routines
    .filter((r) => ids.has(r.id) && r.active)
    .map((r) =>
      moveChange(
        r,
        toMinutes(r.preferredStart) + deltaMinutes,
        deltaMinutes < 0
          ? `Bring ${r.title.toLowerCase()} forward half an hour.`
          : `Push ${r.title.toLowerCase()} back half an hour.`,
      ),
    );
}

/** What the cell can say for itself when tapped. */
export function cellSummary(cell: WeekCell): string | null {
  if (cell.items.length === 0) return null;
  return cell.items.map((i) => i.title).join(', ');
}
