/**
 * A coach with something to say, and one thing to ask.
 *
 * ── Why this is a screen and not a notification ─────────────────────────
 *
 * The sketch's strongest idea: "allow them to interrupt the user at points
 * with a different screen to ask questions and actually coach them." The
 * distinction matters. A card on Today is something you scroll past; a
 * notification is something you dismiss. An interruption arrives, says one
 * thing, asks one thing, takes the answer, and leaves. That is what a
 * person with expertise does when they notice something, and it is the
 * only shape in which the app gets to be a coach rather than a dashboard.
 *
 * ── The rules, and why each one is load-bearing ─────────────────────────
 *
 * **One at a time. Ever.** A coach that interrupts twice in a day is a
 * notification with a face on it. `nextInterrupt` returns at most one, and
 * once it has been shown it is recorded and never shown again.
 *
 * **Two answers, never three.** A third option is the app hedging, and a
 * person being interrupted has about four seconds of goodwill.
 *
 * **It always says why it fired.** Every interruption carries `because`,
 * in the person's own numbers. An app that asks without saying why is a
 * survey.
 *
 * **Adding is gated; fixing is not.** `commitmentBudget` already decides
 * how much new is reasonable this week, and `mayOffer` is the gate. But
 * only interruptions that ADD something go through it — a strained week is
 * exactly when moving a dead Tuesday matters most, and refusing to offer
 * the fix because the week is hard would be the gate working backwards.
 *
 * ── What is deliberately not here yet ───────────────────────────────────
 *
 * Nutrition ("the fibre protocol you added a week ago — how is it going?")
 * needs a routine to know when it was added, and `Routine` has no
 * `createdAt`. Money ("is your offset actually linked?") needs the money
 * path to record whether the step was ever confirmed. Both are real
 * triggers and both need a field that does not exist; inventing a
 * plausible-looking one that fires on nothing would be worse than four
 * triggers that work.
 */

import { mayOffer, type CommitmentBudget } from '@/features/budget/commitment';
import type { MetricObservation } from '@/features/model/metrics';
import { deadSlots, hourLabel } from '@/features/review/weekReview';
import { voiceFor } from '@/features/coaches/voices';
import { PATH_AREA, type PathId } from '@/features/paths/definitions';
import type { WeeklyChange } from '@/features/review/weeklyChanges';
import { isReviewable } from '@/features/review/dayReview';
import {
  addDays,
  durationMinutes,
  formatTime,
  toHHMM,
  toMinutes,
  weekStartOf,
} from '@/lib/dates';
import type { DailyPlan, LifeArea, LifeProfile, PlanItem, Routine } from '@/types/domain';

/** What answering does. The screen switches on `kind`; nothing else does. */
export type InterruptEffect =
  | { kind: 'none' }
  | { kind: 'changes'; changes: WeeklyChange[] }
  | { kind: 'intensity'; pathId: PathId; push: boolean }
  | { kind: 'moveItem'; date: string; itemId: string; start: string }
  | { kind: 'moveItemToDate'; date: string; itemId: string; targetDate: string };

export interface InterruptAnswer {
  id: string;
  label: string;
  effect: InterruptEffect;
}

export interface CoachInterrupt {
  /** Stable for the occasion, so it is shown once and never again. */
  id: string;
  pathId: PathId;
  /** What the coach says, in its own voice. */
  says: string;
  /** The one question. */
  asks: string;
  /** Exactly two. */
  answers: [InterruptAnswer, InterruptAnswer];
  /** Why it fired, in the person's own numbers. Always shown. */
  because: string;
  /** True where saying yes means one more thing to do. Gated by mayOffer. */
  adds: boolean;
  /** Lower sorts first. Today beats this week beats whenever. */
  urgency: number;
}

/* ── Which coach owns what ────────────────────────────────────────────── */

/**
 * The coach for a part of life.
 *
 * Three paths share `health`; training is the one that speaks for it,
 * because every trigger that fires on a health routine is about when and
 * how hard, which is Ren's subject.
 */
export function coachForArea(area: LifeArea): PathId {
  const exact = (Object.keys(PATH_AREA) as PathId[]).find(
    (id) => PATH_AREA[id] === area && id !== 'recovery' && id !== 'nutrition',
  );
  return exact ?? 'training';
}

/* ── Triggers ─────────────────────────────────────────────────────────── */

/** Three nights under this in a week is the week saying something. */
export const SHORT_NIGHT_HOURS = 6;
export const SHORT_NIGHTS_TRIGGER = 3;

/** Held this many times running before more load is even offered. */
export const HELD_IN_A_ROW = 3;

/** How close to a family block the coach speaks up. */
export const FAMILY_WINDOW_MIN = 90;
export const FAMILY_FLOOR_MIN = 10;

/** How late the coach offers to say you will be. */
export const FAMILY_LATE_MIN = 20;

export interface InterruptInput {
  routines: Routine[];
  plans: Record<string, DailyPlan>;
  metrics: MetricObservation[];
  profile: LifeProfile | null;
  budget: CommitmentBudget;
  today: string;
  /** Minutes since midnight. Separate from `today` so tests can stand anywhere. */
  nowMinutes: number;
  /** Interruptions already shown. Each one happens once. */
  seen: readonly string[];
}

const dayItems = (plans: Record<string, DailyPlan>, date: string): PlanItem[] =>
  (plans[date]?.items ?? []).filter(isReviewable);

/**
 * A slot that has died more than once.
 *
 * The same evidence the week review uses, said by a person instead of
 * printed in a list — "Tuesday at 6am isn't working" arriving from Ren on
 * the day it matters is a different thing from a bullet in a review
 * screen nobody opened.
 */
function slotInterrupt(input: InterruptInput): CoachInterrupt | null {
  const slots = deadSlots(input.plans, weekStartOf(input.today), input.routines, input.today);
  const slot = slots[0];
  if (!slot) return null;
  const pathId = coachForArea(slot.routine.area);
  const v = voiceFor(pathId);
  const width = Math.max(60, toMinutes(slot.routine.preferredEnd) - toMinutes(slot.routine.preferredStart));
  const to = (slot.hour + 1) * 60;
  return {
    id: `slot:${slot.routine.id}:${slot.col}:${slot.hour}`,
    pathId,
    says: `${hourLabel(slot.hour)} isn't working for ${slot.routine.title.toLowerCase()}. That's ${slot.seen} times now.`,
    asks: `Move it an hour later, or leave it where it is?`,
    because: `${v.name} watches when things happen, not just whether they do.`,
    adds: false,
    urgency: 2,
    answers: [
      {
        id: 'move',
        label: `Move to ${hourLabel(slot.hour + 1)}`,
        effect: {
          kind: 'changes',
          changes: [
            {
              id: `move-${slot.routine.id}-${to}`,
              kind: 'move_routine',
              routineId: slot.routine.id,
              payload: { preferredStart: toHHMM(to), preferredEnd: toHHMM(to + width) },
              description: `Move ${slot.routine.title.toLowerCase()} an hour later.`,
            },
          ],
        },
      },
      { id: 'leave', label: 'Leave it', effect: { kind: 'none' } },
    ],
  };
}

/** The routine held three times running, and the offer that earns. */
function loadInterrupt(input: InterruptInput): CoachInterrupt | null {
  for (const r of input.routines) {
    if (!r.active || r.area !== 'health' || !r.sessionType) continue;
    const seen: PlanItem[] = [];
    for (let i = 1; i <= 28 && seen.length < HELD_IN_A_ROW; i++) {
      const own = dayItems(input.plans, addDays(input.today, -i)).filter(
        (x) => x.routineId === r.id,
      );
      seen.push(...own);
    }
    if (seen.length < HELD_IN_A_ROW) continue;
    if (!seen.slice(0, HELD_IN_A_ROW).every((x) => x.status === 'completed')) continue;
    const v = voiceFor('training');
    return {
      id: `load:${r.id}:${input.today}`,
      pathId: 'training',
      says: `Three of ${r.title.toLowerCase()} in a row, all finished.`,
      asks: 'Ready for more, or hold here a while?',
      because: `${v.name} adds load off what you kept, never off the calendar.`,
      adds: true,
      urgency: 3,
      answers: [
        {
          id: 'more',
          label: 'Add a little',
          effect: { kind: 'intensity', pathId: 'training', push: true },
        },
        { id: 'hold', label: 'Hold here', effect: { kind: 'none' } },
      ],
    };
  }
  return null;
}

/** Three short nights, and today's hardest thing offered to tomorrow. */
function sleepInterrupt(input: InterruptInput): CoachInterrupt | null {
  const from = addDays(input.today, -7);
  const short = input.metrics.filter(
    (m) =>
      m.key === 'sleep.hours' &&
      m.at.slice(0, 10) >= from &&
      m.at.slice(0, 10) <= input.today &&
      m.value < SHORT_NIGHT_HOURS,
  ).length;
  if (short < SHORT_NIGHTS_TRIGGER) return null;

  const hardest = dayItems(input.plans, input.today)
    .filter((i) => i.status === 'planned')
    .sort((a, b) => durationMinutes(b.start, b.end) - durationMinutes(a.start, a.end))[0];
  if (!hardest) return null;

  const v = voiceFor('recovery');
  return {
    id: `sleep:${input.today}`,
    pathId: 'recovery',
    says: `${short} short nights this week. ${hardest.title} is on for today.`,
    asks: 'Today, or push it to tomorrow?',
    because: `${v.name} would rather move one session than watch a fortnight go.`,
    adds: false,
    urgency: 1,
    answers: [
      { id: 'today', label: 'Today, as planned', effect: { kind: 'none' } },
      {
        id: 'tomorrow',
        label: 'Tomorrow',
        effect: {
          kind: 'moveItemToDate',
          date: input.today,
          itemId: hardest.id,
          targetDate: addDays(input.today, 1),
        },
      },
    ],
  };
}

/** The evening that work is about to eat. */
function familyInterrupt(input: InterruptInput): CoachInterrupt | null {
  const next = dayItems(input.plans, input.today)
    .filter((i) => i.area === 'family' || i.area === 'relationship')
    .filter((i) => i.status === 'planned')
    .map((i) => ({ item: i, inMin: toMinutes(i.start) - input.nowMinutes }))
    .filter((x) => x.inMin >= FAMILY_FLOOR_MIN && x.inMin <= FAMILY_WINDOW_MIN)
    .sort((a, b) => a.inMin - b.inMin)[0];
  if (!next) return null;

  const pathId = coachForArea(next.item.area);
  const v = voiceFor(pathId);
  const later = toMinutes(next.item.start) + FAMILY_LATE_MIN;
  return {
    id: `family:${next.item.id}`,
    pathId,
    says: `${next.item.title} in ${next.inMin} minutes.`,
    asks: `Making it, or shall I move it to ${formatTime(toHHMM(later))}?`,
    because: `${v.name} asks now rather than asking tomorrow how it went.`,
    adds: false,
    urgency: 0,
    answers: [
      { id: 'making-it', label: 'Making it', effect: { kind: 'none' } },
      {
        id: 'late',
        label: `${FAMILY_LATE_MIN} minutes later`,
        effect: {
          kind: 'moveItem',
          date: input.today,
          itemId: next.item.id,
          start: toHHMM(later),
        },
      },
    ],
  };
}

/* ── Arbitration ──────────────────────────────────────────────────────── */

const TRIGGERS = [familyInterrupt, sleepInterrupt, slotInterrupt, loadInterrupt];

/**
 * Everything a coach could say right now, most urgent first.
 *
 * Exported so the interrupt screen can resolve the one it was opened with,
 * rather than recomputing "the next one" and finding that showing it has
 * already taken it off the list.
 */
export function coachInterrupts(input: InterruptInput): CoachInterrupt[] {
  if (!input.profile) return [];
  const all = TRIGGERS.map((t) => t(input)).filter((x): x is CoachInterrupt => x !== null);
  return all.sort((a, b) => a.urgency - b.urgency);
}

/**
 * The one interruption to show, or nothing.
 *
 * Nothing is the common answer and that is correct. A coach that always
 * has something to say is a coach nobody believes.
 */
export function nextInterrupt(input: InterruptInput): CoachInterrupt | null {
  const seen = new Set(input.seen);
  const offer = mayOffer(input.budget);
  return (
    coachInterrupts(input).find((i) => !seen.has(i.id) && (offer || !i.adds)) ?? null
  );
}
