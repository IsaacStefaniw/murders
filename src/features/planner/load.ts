/**
 * How much the week should ask for, decided by what the person cleared.
 *
 * ── The defect ──────────────────────────────────────────────────────────
 *
 * In a six-month simulation one persona — low capacity, overcommits, the
 * one this app exists for — was handed 17.7 things a week and finished
 * 4.7. Twenty-six weeks. Twenty-seven per cent. Her goals were touched in
 * 12% of weeks. The weekly review deactivated two routines in half a year.
 *
 * She told the app at signup that she was running on fumes. Two things
 * then ignored her.
 *
 * `generate.ts` turned `capacity: 'minimal'` into reserving 35% of free
 * time instead of 25% — a tenth off the plan, for the most important
 * honesty question in the interview.
 *
 * And `weeklyChanges.ts` only ever looked at items marked `completed` or
 * `skipped`, needed two observations and a 60% skip rate before it would
 * offer to drop anything, and then dropped at most one routine a week.
 * Somebody drowning does not tap "skip" — they just do not open the app.
 * Their items stay `planned` and are therefore invisible to the one
 * mechanism meant to save them. The load-shedding valve was closed for
 * precisely the person it was built for.
 *
 * ── WHY A SERVO RATHER THAN A SETTING ───────────────────────────────────
 *
 * Repeated non-contingent failure is how a person learns that nothing they
 * do matters, and mastery experience is the best-supported source of the
 * self-efficacy that predicts whether they are still here in six months.
 * Thirteen undone items a week does not merely churn somebody; it teaches
 * them they are a person who does not follow plans, and they take that to
 * the next app.
 *
 * So plan volume stops being a fact about the person and becomes a
 * parameter the app moves. It aims at a completion rate rather than a
 * number of items — high enough to be a real week, low enough to be
 * cleared. The user can still override it for any week, and their
 * override always wins, because being told "you can only have four" by
 * software is its own insult.
 *
 * Nothing here shames, ranks, or scores. It changes the size of next week
 * and says one sentence about why.
 */

import type { DailyPlan } from '@/types/domain';
import { weekStartOf } from '@/features/behaviours/weekly';
import { addDays } from '@/lib/dates';

export type Capacity = 'minimal' | 'steady' | 'push';

/** Least to most demanding. Shedding moves down this list, never past it. */
export const CAPACITY_ORDER: Capacity[] = ['minimal', 'steady', 'push'];

/**
 * The fraction of free time held back, per gear.
 *
 * `minimal` used to be 0.35 against a 0.25 default, which is the tenth of
 * a plan that failed the persona above. It is now half the free day — a
 * gear that can actually be felt, because a gear that cannot is decoration.
 */
export const RESERVED_FREE_FRACTION: Record<Capacity, number> = {
  minimal: 0.5,
  steady: 0.25,
  push: 0.15,
};

/**
 * ── What was tried to make this gear bite, and what it cost ─────────────
 *
 * `RESERVED_FREE_FRACTION` above is the only lever the gear pulls, and it
 * only bites on a day that is already over-full. Measured on the persona
 * this module exists for — low capacity, overcommits — her week came out
 * at 19 items on `minimal`, 19 on `steady` and 19 on `push`. Her days were
 * not over-full. They were full of things she was not going to do.
 *
 * Three stronger levers were built and measured over six simulated months.
 * All three are recorded here because each looked obviously right
 * beforehand, and the next person to have the idea deserves the results.
 *
 *  1. DROP EVERY `could` ROUTINE at the lightest gear. Moved her week from
 *     19 items to 11 — and made her worse: 4.7 things done a week became
 *     2.5, and her completion rate fell from 27% to 20%. Tier is the
 *     library's judgement of how defensible a practice is. It is not a
 *     prediction of what a person will do, and cutting by it removed the
 *     things she was actually doing.
 *
 *  2. CAP HOW MANY DAYS a nice-to-have runs. Made her week BIGGER, 17.7 to
 *     22.2, because freeing a slot lets the placement engine put something
 *     else in it. A cap the scheduler can route around is not a cap.
 *
 *  3. CAP THE ITEMS PER DAY, after placement, where nothing can route
 *     around it. This one worked for her — rate 27% to 31%, and the weekly
 *     review finally started dropping routines (2 deactivations in six
 *     months became 4). It also took the night-shift persona from 35% to
 *     15%, and broke two standing invariants: the scheduler's promise that
 *     the energy shape never costs the day a routine, and this repo's own
 *     completion floor, which carries a comment saying never to lower it
 *     to make a build pass. So it was reverted.
 *
 * The honest state: plan volume is set by how many DAYS each routine runs,
 * decided once at signup by `buildLifeOperatingPlan`, and nothing after
 * that reduces it except the weekly review. Making the gear real means
 * changing what the review is allowed to do — shedding routines on
 * observed non-completion rather than shrinking their durations — not
 * adding another cap upstream of a scheduler that will route around it.
 * That is the next piece of work, and it is a bigger one than it looks.
 */

/**
 * The completion rate the plan aims at./**
 * The completion rate the plan aims at.
 *
 * Not 100%: a week you always clear is a week that stopped asking anything.
 * Not 50%: half a plan undone every week is the failure this file exists
 * to end. Eighty is a week that stretches and still closes.
 */
export const TARGET_COMPLETION = 0.8;

/** Below this, for two weeks running, the plan sheds a gear on its own. */
export const SHED_BELOW = 0.5;

/** At or above this, for two weeks running, it gives a gear back. */
export const ADD_ABOVE = 0.85;

export interface WeekLoad {
  weekStart: string;
  planned: number;
  completed: number;
  /** null where the week held nothing to do — not a zero. */
  rate: number | null;
}

/**
 * One week's load. Fixed calendar events are excluded: they are the
 * person's own diary, not something the app asked of them.
 */
export function weekLoad(plans: Record<string, DailyPlan>, weekStart: string): WeekLoad {
  let planned = 0;
  let completed = 0;
  for (let i = 0; i < 7; i++) {
    for (const item of plans[addDays(weekStart, i)]?.items ?? []) {
      if (item.fixed) continue;
      planned += 1;
      if (item.status === 'completed') completed += 1;
    }
  }
  return { weekStart, planned, completed, rate: planned > 0 ? completed / planned : null };
}

export type LoadAction = 'shed' | 'hold' | 'add';

export interface LoadVerdict {
  action: LoadAction;
  /** The gear this implies, given what the person said they had. */
  capacity: Capacity;
  /** One sentence, in their numbers. Null where there is nothing to say. */
  line: string | null;
}

function step(from: Capacity, by: -1 | 1): Capacity {
  const i = CAPACITY_ORDER.indexOf(from);
  return CAPACITY_ORDER[Math.min(CAPACITY_ORDER.length - 1, Math.max(0, i + by))];
}

/**
 * What next week should be, from the last two finished weeks.
 *
 * Two weeks rather than one on purpose. One bad week is a bad week — a
 * deadline, a bug, a sick child — and an app that shrinks the plan every
 * time somebody has a rough Tuesday is as unhelpful as one that never
 * shrinks it at all. Two in a row is a pattern.
 *
 * `stated` is the ceiling. Giving a gear back never takes somebody past
 * what they themselves said they had room for.
 */
export function loadVerdict(recent: WeekLoad[], stated: Capacity, current: Capacity): LoadVerdict {
  const measured = recent.filter((w) => w.rate !== null && w.planned >= 3).slice(-2);
  if (measured.length < 2) return { action: 'hold', capacity: current, line: null };

  const [a, b] = measured;
  const total = a.planned + b.planned;
  const done = a.completed + b.completed;

  if (a.rate! < SHED_BELOW && b.rate! < SHED_BELOW) {
    const next = step(current, -1);
    if (next === current) {
      return {
        action: 'hold',
        capacity: current,
        line: `You cleared ${done} of ${total} over the last fortnight. The week is already as small as it goes — the next thing to cut is a routine, not a gear.`,
      };
    }
    return {
      action: 'shed',
      capacity: next,
      line: `You cleared ${done} of ${total} over the last fortnight, so next week is smaller. It grows back as you start clearing it.`,
    };
  }

  if (a.rate! >= ADD_ABOVE && b.rate! >= ADD_ABOVE && current !== stated) {
    return {
      action: 'add',
      capacity: step(current, 1),
      line: `You cleared ${done} of ${total} over the last fortnight, so next week has a little more in it.`,
    };
  }

  return { action: 'hold', capacity: current, line: null };
}

/** How the three gears read to a person. No judgement in any of them. */
export const CAPACITY_LABEL: Record<Capacity, string> = {
  minimal: 'Light',
  steady: 'Normal',
  push: 'Room to push',
};

export const CAPACITY_BLURB: Record<Capacity, string> = {
  minimal: 'The few things that matter most, and nothing else.',
  steady: 'A full week that still closes.',
  push: 'More in it, for a week with room.',
};

/* ── Resolving one week's gear ────────────────────────────────────────── */

/** A week the person set the gear on themselves. */
export interface WeekCapacityOverride {
  weekStart: string;
  capacity: Capacity;
  setAt: string;
}

export interface EffectiveCapacity {
  capacity: Capacity;
  /** Who decided: the person, the servo, or their standing answer. */
  source: 'you' | 'plan' | 'stated';
  /** Shown where the plan moved itself. Null where nothing needs saying. */
  line: string | null;
}

/**
 * The gear for the week containing `date`.
 *
 * Order of authority, and it is not negotiable: the person, then the
 * servo, then what they said at signup. Being told by software that you
 * can only have four things this week, when you know you have room for
 * ten, is its own small insult — so an explicit choice always wins and is
 * never quietly overridden.
 */
export function effectiveCapacity(input: {
  stated: Capacity;
  overrides: WeekCapacityOverride[];
  plans: Record<string, DailyPlan>;
  date: string;
}): EffectiveCapacity {
  const thisWeek = weekStartOf(input.date);
  const chosen = input.overrides.find((o) => o.weekStart === thisWeek);
  if (chosen) return { capacity: chosen.capacity, source: 'you', line: null };

  // The two weeks before this one, whether or not they were the last two
  // on the calendar — a gap is not a signal.
  const recent = [weekStartOf(addDays(thisWeek, -14)), weekStartOf(addDays(thisWeek, -7))].map((w) =>
    weekLoad(input.plans, w),
  );
  const verdict = loadVerdict(recent, input.stated, input.stated);
  return verdict.action === 'hold'
    ? { capacity: input.stated, source: 'stated', line: verdict.line }
    : { capacity: verdict.capacity, source: 'plan', line: verdict.line };
}
