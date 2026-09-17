/**
 * Weekly review → applied change. Insight without action is a diary;
 * IntentNorth offers to make the change, and one tap applies it to next week.
 * Deterministic, derived from what actually happened.
 */

import { MODALITIES } from '@/features/modalities/registry';
import { protocolById } from '@/features/knowledge/protocols';
import { detectSlotMismatch } from '@/lib/scheduling/adaptation';
import { addDays } from '@/lib/dates';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

export interface WeeklyChange {
  id: string;
  description: string;
  kind: 'deactivate_routine' | 'move_routine' | 'shorten_routine';
  routineId: string;
  payload?: { preferredStart?: string; preferredEnd?: string; newDurationMin?: number };
}

export interface WeeklyReviewProposal {
  noticed: string[];
  changes: WeeklyChange[];
}

/**
 * Areas where the last routine standing is never the one to cut.
 *
 * Resting "date night" because it slipped twice defeats the whole product.
 * (Cohort simulation: pruning these fed a permanent anticipation-gap loop.)
 */
export const CONNECTION_AREAS = new Set(['relationship', 'family', 'enjoyment']);

/**
 * The routines the app may ever offer to rest.
 *
 * One rule, in one place, because two screens now ask the question: the
 * weekly proposal below and the end-of-week grid. A "drop it" button that
 * appears on one screen and not the other would be the app disagreeing
 * with itself about what it is allowed to take away.
 */
/**
 * A practice whose own library entry says a skipped day means nothing.
 *
 * ── The flag that was honoured everywhere except here ───────────────────
 *
 * `Protocol.neverNag` exists for one person and its doc comment names
 * them: "Someone three weeks after a bereavement or a redundancy does not
 * need the adaptation engine reporting that they are 40% adherent, and the
 * engine cannot know not to." The suggestion pipeline honours it. The
 * notifier honours it. The two code paths that actually TAKE SOMETHING
 * AWAY — this one, feeding both the weekly panel's proposal and the End of
 * Week grid's "Drop it" button — never read `protocolId` at all.
 *
 * Worked through on the app's own data. `transition-anchor`, "One thing
 * that still happens", is `neverNag`, daily, fifteen minutes, tier
 * `should`, and carries a comment three lines above saying it is THE ONE
 * THING MEANT TO SURVIVE minimal-capacity trimming. Somebody three weeks
 * into a bereavement completes it two days in seven. That clears the
 * skip-rate gate; it has no `sessionType` so it takes the default
 * ten-minute floor; week one shrinks it fifteen to ten. Week two it is
 * already at the floor, so the branch below offers to rest it. The app
 * removes the fixed point from the week of the person it was written for.
 *
 * The flag's own wording settles what to do: if a skipped day carries no
 * meaning, it cannot be evidence for removal. So these leave the droppable
 * set entirely — no rest, and no shrink either, because the shrink branch
 * reads this same list and a fixed point cut in half has stopped being a
 * fixed point.
 *
 * The cohort was re-run with and without this filter across all ten
 * personas: identical completion, identical coach benefit. It costs
 * nothing and it stops the one case it was written for.
 */
const neverNagged = (r: Routine): boolean =>
  Boolean(r.protocolId && protocolById(r.protocolId)?.neverNag);

export function droppableRoutines(routines: Routine[]): Routine[] {
  const activeByArea = new Map<string, number>();
  for (const r of routines) {
    if (r.active) activeByArea.set(r.area, (activeByArea.get(r.area) ?? 0) + 1);
  }
  return routines
    .filter((r) => r.active && !r.protected && r.tier !== 'must')
    .filter((r) => !neverNagged(r))
    .filter((r) => !(CONNECTION_AREAS.has(r.area) && (activeByArea.get(r.area) ?? 0) <= 1));
}

export function buildWeeklyChanges(input: {
  weekStart: string;
  plans: Record<string, DailyPlan>;
  routines: Routine[];
}): WeeklyReviewProposal {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(input.weekStart, i));
  const items: PlanItem[] = weekDates
    .flatMap((d) => input.plans[d]?.items ?? [])
    .filter((i) => !i.fixed);
  /**
   * An untouched item is the loudest signal, not the absent one.
   *
   * This used to count only items marked `completed` or `skipped`, which
   * quietly assumed somebody who does not do a thing tells the app so.
   * They do not. The person drowning in a plan is precisely the one who
   * never taps "skip" — they stop opening it — so their items stay
   * `planned` and were invisible to the one mechanism built to rescue
   * them. In a six-month simulation that produced two deactivations in
   * twenty-six weeks for a persona completing 27% of her week.
   *
   * The week being reviewed is over, so anything still `planned` is a
   * thing that did not happen. It counts.
   */
  const resolved = items.filter(
    (i) => i.status === 'completed' || i.status === 'skipped' || i.status === 'planned',
  );
  const completed = resolved.filter((i) => i.status === 'completed');

  const noticed: string[] = [];
  const changes: WeeklyChange[] = [];

  if (resolved.length > 0) {
    noticed.push(`${completed.length} of ${resolved.length} flexible activities happened.`);
  }

  // Routines that repeatedly didn't happen: offer to drop the least
  // essential one rather than let the whole plan feel like failure.
  const droppable = droppableRoutines(input.routines)
    .map((r) => {
      const own = resolved.filter((i) => i.routineId === r.id);
      // Skipped and never-touched are the same outcome for this purpose:
      // the thing did not happen. Only a completion counts against it.
      const missed = own.filter((i) => i.status !== 'completed').length;
      return { routine: r, obs: own.length, skipRate: own.length ? missed / own.length : 0 };
    })
    .filter((x) => x.obs >= 2 && x.skipRate >= 0.6)
    .sort((a, b) => b.skipRate - a.skipRate);

  if (droppable.length > 0) {
    const worst = droppable[0].routine;
    noticed.push(`${worst.title} kept not happening.`);
    // Recovery-first: shrink before resting. Resting is the last resort,
    // taken only when the routine is already at its modality's floor.
    // (Cohort simulation: the review was amputating routines the
    // adaptation layer would rather have shrunk — 10% of users lost 3+.)
    const floor =
      (worst.sessionType && MODALITIES[worst.sessionType]?.shorteningFloorMin) || 10;
    const newDurationMin = Math.max(floor, Math.round((worst.durationMin * 2) / 3 / 5) * 5);
    if (newDurationMin < worst.durationMin) {
      changes.push({
        id: `shrink-${worst.id}`,
        kind: 'shorten_routine',
        routineId: worst.id,
        payload: { newDurationMin },
        description: `Shrink ${worst.title.toLowerCase()} to ${newDurationMin} minutes — a smaller version that happens beats a longer one that doesn't.`,
      });
    } else {
      changes.push({
        id: `drop-${worst.id}`,
        kind: 'deactivate_routine',
        routineId: worst.id,
        description: `Rest ${worst.title.toLowerCase()} for now — fewer plans, kept, beat more plans, missed.`,
      });
    }
  }

  // Slot mismatches become move changes (second droppable candidate is
  // spared if a better time might fix it).
  for (const s of detectSlotMismatch(resolved, input.routines).slice(0, 2)) {
    const payload = s.payload as {
      routineId: string;
      preferredStart: string;
      preferredEnd: string;
    };
    if (changes.some((c) => c.routineId === payload.routineId)) continue;
    const routine = input.routines.find((r) => r.id === payload.routineId);
    if (!routine) continue;
    changes.push({
      id: `move-${routine.id}`,
      kind: 'move_routine',
      routineId: routine.id,
      payload: { preferredStart: payload.preferredStart, preferredEnd: payload.preferredEnd },
      description: `Move ${routine.title.toLowerCase()} to where your completions actually are.`,
    });
  }

  return { noticed, changes: changes.slice(0, 3) };
}
