/**
 * When a routine ACTUALLY happens, as against the time the app prints.
 *
 * ── Why this exists: the founder stopped using his own app ──────────────
 *
 * Isaac, 22 Oct 2026: *"The problem is that people stop using the app I've
 * stopped using it."* Asked which was closest to what happened, he picked
 * **"I opened it and it was wrong — the plan didn't match my actual day."**
 * And on notifications: **"On, and I ignored or killed them."**
 *
 * Measured across eleven personas and twenty-six weeks
 * (`npm run usertest:statedtime`): **36 of 63 active routines drift
 * fifteen minutes or more between the time the routines screen shows and
 * the time the plan actually runs them. Twenty-eight drift an hour or
 * more.** The worst is a night nurse whose wind-down shows 06:00 and runs
 * 23:40 — a seventeen-hour gap.
 *
 * Isaac's own screen read:
 *
 *     Strength workout              17:30   ← at work until 18:30
 *     Message a friend, make a plan 17:30   ← same minute as the above
 *     The daily walk                17:45   ← at work
 *     Easy cardio, talking pace     17:45   ← same minute as the walk
 *     Get into the best shape of …  12:05   ← the `?? '12:05'` fallback
 *
 * while Today placed them at 6:45pm, 8:50pm and 9:40pm. **The plan copes.
 * The screen he opened does not know that.**
 *
 * ── Why the printed time is wrong, mechanically ─────────────────────────
 *
 * `protocols.startFor` resolves an anchor ONCE, when the routine is
 * created: `wakeTime + offset` for a wake anchor, `sleepTime - offset` for
 * a sleep one, else the protocol's literal `start`, else noon. That is a
 * SEED. It takes no account of the other routines competing for the same
 * minute, and none of the person's working hours.
 *
 * So five wake-anchored practices all get the same `preferredStart` —
 * `new_parent`'s screen genuinely says five different things begin at
 * 06:00 — and the placement pass then spreads them across the morning
 * without ever writing back. The screen prints the collision.
 *
 * ── What this module does, and what it refuses to do ────────────────────
 *
 * It reads the plan history and reports where each routine actually runs.
 * It does NOT write to `preferredStart`: that field is the person's
 * request and the screen invites them to set it ("You know your week
 * better than the scheduler does"). Overwriting a request with an
 * observation would quietly delete the one thing on that screen they
 * control.
 *
 * The same three-day floor as `applyLearnedDurations`, for the same
 * reason: "a number built from one bad afternoon is worse than no number".
 */

import { addDays, toHHMM, toMinutes } from '@/lib/dates';
import type { DailyPlan, Routine } from '@/types/domain';

/** Days of evidence before an observed time is worth printing. */
export const LEARNED_START_MIN_DAYS = 3;

/** How far back to look. A month is enough to survive one odd fortnight. */
export const LEARNED_START_WINDOW = 28;

/** Below this the stated time and the real one are the same thing. */
export const DRIFT_WORTH_SAYING = 15;

export interface ObservedStart {
  routineId: string;
  /** Where it usually runs, median of the window. */
  usual: string;
  /** Days it was seen on. */
  days: number;
  /**
   * Minutes from the stated preference to where it runs. Positive means
   * later than asked for.
   */
  drift: number;
}

/**
 * The median rather than the mean.
 *
 * One session dragged to midnight by a late finish should not move the
 * reported time by two hours — it is the typical day a person is trying to
 * recognise, and a mean is the statistic that a single outlier owns.
 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

export function observedStarts(
  plans: Record<string, DailyPlan>,
  routines: Routine[],
  today: string,
  windowDays = LEARNED_START_WINDOW,
): Map<string, ObservedStart> {
  const from = addDays(today, -(windowDays - 1));
  const seen = new Map<string, number[]>();

  for (const [date, plan] of Object.entries(plans)) {
    // Days that have not happened are the scheduler's intention rather
    // than the person's week. Including them would report the plan back
    // to itself.
    if (date < from || date > today) continue;
    for (const item of plan.items) {
      if (!item.routineId || item.fixed) continue;
      seen.set(item.routineId, [...(seen.get(item.routineId) ?? []), toMinutes(item.start)]);
    }
  }

  const byId = new Map(routines.map((r) => [r.id, r]));
  const out = new Map<string, ObservedStart>();
  for (const [routineId, starts] of seen) {
    if (starts.length < LEARNED_START_MIN_DAYS) continue;
    const routine = byId.get(routineId);
    if (!routine) continue;
    const usualMin = median(starts);
    out.set(routineId, {
      routineId,
      usual: toHHMM(usualMin),
      days: starts.length,
      drift: usualMin - toMinutes(routine.preferredStart),
    });
  }
  return out;
}

/** True where the gap is big enough that printing the stated time misleads. */
export const driftsMeaningfully = (observed: ObservedStart | undefined): boolean =>
  observed !== undefined && Math.abs(observed.drift) >= DRIFT_WORTH_SAYING;

/**
 * Where this routine runs, for a screen to print. The observed time once
 * there is enough of it, otherwise the stated one — which is all the app
 * knows on day one and is honest then.
 */
export function startToShow(routine: Routine, observed: ObservedStart | undefined): string {
  return observed ? observed.usual : routine.preferredStart;
}

/**
 * The sentence that explains the difference, or null where there is none.
 *
 * It explains rather than just reporting, because the gap is nearly always
 * the scheduler doing something correct for a reason the person cannot see
 * — work, or four things wanting the same minute. "Runs at 6:45pm" is a
 * correction; "you asked for 5:30pm, and you are at work until 6:30pm" is
 * the reason, and it is the sentence a coach would say.
 */
export function startExplanation(
  routine: Routine,
  observed: ObservedStart | undefined,
  profile: { workEnd?: string; workStart?: string } | null | undefined,
): string | null {
  if (!driftsMeaningfully(observed) || !observed) return null;

  const asked = routine.preferredStart;
  const runs = observed.usual;
  const atWork =
    profile?.workStart &&
    profile.workEnd &&
    toMinutes(asked) >= toMinutes(profile.workStart) &&
    toMinutes(asked) < toMinutes(profile.workEnd) &&
    !routine.duringWork;

  if (atWork) {
    return `You asked for ${asked}, and you are at work until ${profile.workEnd}. It runs about ${runs}.`;
  }
  const later = observed.drift > 0;
  return `You asked for ${asked}. It runs about ${runs} — the day does not have room where you put it, so the plan moves it ${later ? 'later' : 'earlier'}.`;
}
