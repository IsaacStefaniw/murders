import { protocolById } from '@/features/knowledge/protocols';
import { addDays, formatDateLong, formatTime, todayKey } from '@/lib/dates';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

export interface Placement {
  title: string;
  date: string;
  /** True when the practice's first run is today rather than later this week. */
  today: boolean;
  start: string;
  /** What it now sits after, and what it sits before, when there is one. */
  after?: string;
  before?: string;
  /** Why the scheduler chose that hour, in the person's terms. */
  reason: string;
}

const NEIGHBOURING = (items: PlanItem[], id: string) => {
  const ordered = [...items].sort((a, b) => a.start.localeCompare(b.start));
  const i = ordered.findIndex((x) => x.id === id);
  return { prev: i > 0 ? ordered[i - 1] : undefined, next: i >= 0 ? ordered[i + 1] : undefined };
};

/**
 * Why the hour, said the way the person would ask it.
 *
 * The scheduler's reasoning is not a mystery — every practice declares
 * what it hangs off — but the app had never said it out loud at the one
 * moment somebody wants to know, which is the second after they add
 * something and see it land at 7:25.
 */
function reasonFor(routine: Routine | undefined, protocolId: string | undefined): string {
  const anchor = protocolId ? protocolById(protocolId)?.anchor : undefined;
  if (anchor?.kind === 'wake') {
    return 'It hangs off when you wake rather than off the clock, so it moves with you on a late start.';
  }
  if (anchor?.kind === 'sleep') {
    return anchor.deadline
      ? 'It is measured back from your bedtime, and it is a deadline rather than a preference — the day being busy does not push it later.'
      : 'It is measured back from your bedtime, so it moves with the night rather than sitting at a fixed hour.';
  }
  if (routine?.duringWork) {
    return 'It belongs inside the working day, so it is carved out of work hours rather than added to your evening.';
  }
  if (routine?.timeAnchored) {
    return 'The hour is part of what this is, so it stays near it even on a full day.';
  }
  return 'It went into the first gap that fits it, around the things you had already committed to.';
}

/**
 * Where a newly added practice actually landed, and what it landed between.
 *
 * The scheduling is the product and it had no reveal moment: you tapped
 * "Add to my plan", the button changed, and whatever the engine did with
 * your week happened somewhere you were not looking. A person who never
 * opens the Week tab could use this app for a fortnight without ever
 * seeing it schedule anything.
 *
 * Returns null when the practice does not run in the next seven days,
 * which is honest rather than a failure — some practices are weekly and
 * land next Tuesday.
 */
export function placementFor(
  protocolId: string,
  routines: Routine[],
  plans: Record<string, DailyPlan | undefined>,
  from = todayKey(),
): Placement | null {
  const routine = routines.find((r) => r.protocolId === protocolId && r.active);
  if (!routine) return null;
  for (let i = 0; i <= 6; i++) {
    const date = addDays(from, i);
    const items = plans[date]?.items ?? [];
    const item = items.find((x) => x.routineId === routine.id);
    if (!item) continue;
    const { prev, next } = NEIGHBOURING(items, item.id);
    return {
      title: item.title,
      date,
      today: i === 0,
      start: item.start,
      after: prev?.title,
      before: next?.title,
      reason: reasonFor(routine, protocolId),
    };
  }
  return null;
}

/** The confirmation sentence: what happened, where, and between what. */
export function placementLine(p: Placement): string {
  const when = p.today ? `at ${formatTime(p.start)}` : `${formatDateLong(p.date)} at ${formatTime(p.start)}`;
  const between = p.after && p.before
    ? `, after ${p.after} and before ${p.before}`
    : p.after
      ? `, after ${p.after}`
      : p.before
        ? `, before ${p.before}`
        : '';
  return `${p.title} added ${when}${between}.`;
}
