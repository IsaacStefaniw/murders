/**
 * One routine per protocol, wherever routines come from.
 *
 * Routines arrive from four independent sources — the onboarding interview,
 * the goal wizard, a guided path, and the protocol library. Each was correct
 * on its own; together they produced duplicates. A user who onboarded with
 * training and then started the Training path got TWO `strength` routines,
 * and because both sources use the same day-preference ordering, both landed
 * on the same weekdays: two workouts on one day, with different titles, so
 * nothing downstream caught it.
 *
 * De-duplication used to live inside `buildLifeOperatingPlan`, which only
 * ever saw the array it had just built. This is the shared version, applied
 * on every merge into the store.
 *
 * Keyed on `protocolId`, falling back to `sessionType` — never on title,
 * since the colliding routines are titled differently by design
 * ("Strength workout" vs "Training that sticks"). The incoming routine wins:
 * it is the more tailored one and usually carries the goal whose milestones
 * the calendar is meant to serve. The routine it replaces is deactivated
 * rather than deleted, so its history and any completed items stay intact.
 */

import type { Routine } from '@/types/domain';

/** The identity a routine competes on. Null means it never collides. */
export function routineKey(r: Routine): string | null {
  if (r.protocolId) return `protocol:${r.protocolId}`;
  if (r.sessionType) return `session:${r.sessionType}`;
  return null;
}

export function mergeRoutines(existing: Routine[], incoming: Routine[]): Routine[] {
  const claimed = new Set(
    incoming.map(routineKey).filter((k): k is string => k !== null),
  );
  if (claimed.size === 0) return [...existing, ...incoming];

  const superseded = existing.map((r) => {
    const key = routineKey(r);
    if (!r.active || !key || !claimed.has(key)) return r;
    return { ...r, active: false };
  });
  return [...superseded, ...incoming];
}

/**
 * Collapse duplicates within a freshly built set, keeping the first.
 * Deliberately protocol-only: a freshly built set legitimately contains
 * several routines that share a session type (two journal-style practices,
 * say) and onboarding has always allowed that.
 */
export function dedupeRoutines(routines: Routine[]): Routine[] {
  const seen = new Set<string>();
  return routines.filter((r) => {
    if (!r.protocolId) return true;
    if (seen.has(r.protocolId)) return false;
    seen.add(r.protocolId);
    return true;
  });
}
