/**
 * Adaptation engine — deterministic behavioural learning.
 *
 * Looks at what actually happened (plan item outcomes) and proposes concrete
 * changes: move a routine that keeps getting skipped to the time of day where
 * the user actually completes things. Suggestions always carry a reason and
 * are applied only when the user accepts.
 */

import { newId, toMinutes } from '@/lib/dates';
import type { PlanItem, Routine, Suggestion } from '@/types/domain';

type Slot = 'morning' | 'midday' | 'evening';

const SLOT_WINDOWS: Record<Slot, { start: string; end: string; label: string }> = {
  morning: { start: '06:00', end: '09:00', label: 'morning' },
  midday: { start: '11:30', end: '14:00', label: 'lunchtime' },
  evening: { start: '17:30', end: '20:30', label: 'evening' },
};

function slotOf(start: string): Slot {
  const m = toMinutes(start);
  if (m < 11 * 60) return 'morning';
  if (m < 16 * 60) return 'midday';
  return 'evening';
}

const MIN_OBSERVATIONS = 3;
const SKIP_RATE_THRESHOLD = 0.6;

/**
 * Detect routines whose scheduled slot isn't sticking and suggest moving them
 * to the slot with the user's best completion rate.
 */
export function detectSlotMismatch(history: PlanItem[], routines: Routine[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const resolved = history.filter((i) => i.status === 'completed' || i.status === 'skipped');

  // Overall completion rate per slot, across all non-fixed items.
  const slotStats: Record<Slot, { completed: number; total: number }> = {
    morning: { completed: 0, total: 0 },
    midday: { completed: 0, total: 0 },
    evening: { completed: 0, total: 0 },
  };
  for (const item of resolved) {
    if (item.fixed) continue;
    const s = slotStats[slotOf(item.start)];
    s.total += 1;
    if (item.status === 'completed') s.completed += 1;
  }

  for (const routine of routines) {
    if (!routine.active) continue;
    const items = resolved.filter((i) => i.routineId === routine.id);
    if (items.length < MIN_OBSERVATIONS) continue;

    const skipped = items.filter((i) => i.status === 'skipped').length;
    const skipRate = skipped / items.length;
    if (skipRate < SKIP_RATE_THRESHOLD) continue;

    const currentSlot = slotOf(routine.preferredStart);
    const alternatives = (Object.keys(slotStats) as Slot[])
      .filter((s) => s !== currentSlot && slotStats[s].total >= MIN_OBSERVATIONS)
      .map((s) => ({ slot: s, rate: slotStats[s].completed / slotStats[s].total }))
      .sort((a, b) => b.rate - a.rate);

    const best = alternatives[0];
    if (!best || best.rate < 0.5) continue;

    const target = SLOT_WINDOWS[best.slot];
    suggestions.push({
      id: newId('sug'),
      kind: 'move_routine',
      message: `${SLOT_WINDOWS[currentSlot].label[0].toUpperCase()}${SLOT_WINDOWS[currentSlot].label.slice(1)} ${routine.title.toLowerCase()} isn't sticking. You complete ${target.label} activities far more consistently. Make ${target.label} the default?`,
      reason: `You skipped ${skipped} of the last ${items.length} scheduled sessions, while your ${target.label} completion rate is ${Math.round(best.rate * 100)}%.`,
      payload: {
        routineId: routine.id,
        preferredStart: target.start,
        preferredEnd: target.end,
      },
      confidence: Math.min(0.9, 0.5 + skipRate * 0.4),
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }
  return suggestions;
}

/** Apply an accepted move_routine suggestion to the routine list. */
export function applyMoveRoutine(routines: Routine[], suggestion: Suggestion): Routine[] {
  const payload = suggestion.payload as
    | { routineId: string; preferredStart: string; preferredEnd: string }
    | undefined;
  if (suggestion.kind !== 'move_routine' || !payload) return routines;
  return routines.map((r) =>
    r.id === payload.routineId
      ? { ...r, preferredStart: payload.preferredStart, preferredEnd: payload.preferredEnd }
      : r,
  );
}

/**
 * "Don't miss twice" — the anti-fragile alternative to streaks.
 *
 * A single miss is noise and is never surfaced. Two consecutive misses are
 * the fork where habits tend to unravel, so INTENT offers to protect the
 * next session (raising it to Must). There is deliberately nothing to
 * "break": misses carry no loss, only a pattern worth resetting.
 */
export function detectMissedTwice(history: PlanItem[], routines: Routine[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const resolved = history
    .filter((i) => i.status === 'completed' || i.status === 'skipped')
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const routine of routines) {
    if (!routine.active || routine.tier === 'must') continue;
    const items = resolved.filter((i) => i.routineId === routine.id);
    if (items.length < 2) continue;
    const [prev, last] = items.slice(-2);
    if (prev.status !== 'skipped' || last.status !== 'skipped') continue;

    suggestions.push({
      id: newId('sug'),
      kind: 'protect_time',
      message: `Two ${routine.title.toLowerCase()} sessions slipped. Protect the next one?`,
      reason:
        'One miss is noise — two in a row is where routines tend to unravel. ' +
        'Protecting the next session resets the pattern; nothing is broken.',
      payload: { routineId: routine.id },
      confidence: 0.7,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }
  return suggestions;
}

/** A user manually moving a plan item — the strongest preference signal we get. */
export interface ManualMove {
  routineId: string;
  start: string; // where the user moved it to
  date: string;
}

/**
 * Moved-then-completed learning — the strongest evidence in the hierarchy:
 *   same routine, user-moved, then completed
 *   > same routine completion by time
 *   > general completion behaviour by time.
 *
 * "You moved 6 of your last 8 workouts to the evening — and completed 5 of
 * them. Make evenings the default?" This is INTENT working.
 */
export function detectMoveOutcome(
  moves: ManualMove[],
  plansByDate: Record<string, { items: PlanItem[] }>,
  routines: Routine[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const RECENT = 8;

  for (const routine of routines) {
    if (!routine.active) continue;
    const own = moves.filter((m) => m.routineId === routine.id).slice(-RECENT);
    if (own.length < 3) continue;

    // Dominant destination slot among the recent moves.
    const bySlot = new Map<Slot, ManualMove[]>();
    for (const m of own) {
      const slot = slotOf(m.start);
      bySlot.set(slot, [...(bySlot.get(slot) ?? []), m]);
    }
    const [slot, slotMoves] = [...bySlot.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    if (slotMoves.length < 3 || slotOf(routine.preferredStart) === slot) continue;

    // Did the moved sessions actually happen?
    let completed = 0;
    let resolved = 0;
    for (const m of slotMoves) {
      const item = plansByDate[m.date]?.items.find(
        (i) => i.routineId === routine.id && i.status !== 'planned',
      );
      if (!item) continue;
      resolved += 1;
      if (item.status === 'completed') completed += 1;
    }
    if (resolved < 2 || completed / resolved < 0.6) continue;

    const target = SLOT_WINDOWS[slot];
    suggestions.push({
      id: newId('sug'),
      kind: 'move_routine',
      message: `You've moved ${slotMoves.length} of your last ${own.length} ${routine.title.toLowerCase()} sessions to the ${target.label} — and completed ${completed} of them. Make the ${target.label} the default?`,
      reason:
        'Your own moves, followed through, are the strongest evidence there is. The plan should follow what you actually do.',
      payload: {
        routineId: routine.id,
        preferredStart: target.start,
        preferredEnd: target.end,
      },
      confidence: 0.9,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }
  return suggestions;
}

/**
 * Two manual moves of the same routine into the same part of the day mean
 * the schedule is wrong, not the user. Offer to make that slot the default.
 */
export function detectMovePattern(moves: ManualMove[], routines: Routine[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  for (const routine of routines) {
    if (!routine.active) continue;
    const own = moves.filter((m) => m.routineId === routine.id).slice(-2);
    if (own.length < 2) continue;
    const [a, b] = own;
    const slot = slotOf(a.start);
    if (slotOf(b.start) !== slot || slotOf(routine.preferredStart) === slot) continue;

    const target = SLOT_WINDOWS[slot];
    suggestions.push({
      id: newId('sug'),
      kind: 'move_routine',
      message: `You keep moving ${routine.title.toLowerCase()} to the ${target.label}. Make that the default?`,
      reason: `You've manually moved it there twice — the plan should follow you, not the other way round.`,
      payload: {
        routineId: routine.id,
        preferredStart: target.start,
        preferredEnd: target.end,
      },
      confidence: 0.8,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }
  return suggestions;
}

/**
 * Shrink-to-fit — for routines that keep slipping when *no better slot
 * exists* (the move detectors claim those first in the hierarchy). A
 * 30-minute session that happens beats a 45-minute one that doesn't; the
 * modality's shortening floor is respected via `floorFor`, and the user
 * can always grow it back.
 */
export function detectShrinkToFit(
  history: PlanItem[],
  routines: Routine[],
  floorFor: (r: Routine) => number,
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const resolved = history.filter((i) => i.status === 'completed' || i.status === 'skipped');

  for (const routine of routines) {
    if (!routine.active) continue;
    const items = resolved.filter((i) => i.routineId === routine.id);
    if (items.length < 4) continue;

    const skipped = items.filter((i) => i.status === 'skipped').length;
    const skipRate = skipped / items.length;
    if (skipRate < SKIP_RATE_THRESHOLD) continue;

    const floor = floorFor(routine);
    const newDurationMin = Math.max(floor, Math.round((routine.durationMin * 2) / 3 / 5) * 5);
    if (newDurationMin >= routine.durationMin) continue;

    suggestions.push({
      id: newId('sug'),
      kind: 'shorten_workout',
      message: `${routine.title} keeps slipping at ${routine.durationMin} minutes. A ${newDurationMin}-minute version that happens beats a ${routine.durationMin}-minute one that doesn't. Shrink it?`,
      reason: `You completed ${items.length - skipped} of the last ${items.length}. Smaller asks survive real weeks — and you can grow it back any time.`,
      payload: { routineId: routine.id, newDurationMin },
      confidence: 0.65,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }
  return suggestions;
}

/** Apply an accepted shorten suggestion: shrink the routine's duration. */
export function applyShorten(routines: Routine[], suggestion: Suggestion): Routine[] {
  const payload = suggestion.payload as { routineId: string; newDurationMin: number } | undefined;
  if (suggestion.kind !== 'shorten_workout' || !payload) return routines;
  return routines.map((r) =>
    r.id === payload.routineId ? { ...r, durationMin: payload.newDurationMin } : r,
  );
}

/** Apply an accepted protect_time suggestion: raise the routine to Must. */
export function applyProtectTime(routines: Routine[], suggestion: Suggestion): Routine[] {
  const payload = suggestion.payload as { routineId: string } | undefined;
  if (suggestion.kind !== 'protect_time' || !payload) return routines;
  return routines.map((r) =>
    r.id === payload.routineId ? { ...r, tier: 'must' as const } : r,
  );
}
