/**
 * A dated reading, kept small enough to store on every change.
 *
 * `progress.ts` needs two readings to attribute movement between them, and
 * reconstructing what the instrument would have said six months ago means
 * replaying the metric stream, the interview answers and the plan history
 * together. Storing the answer at the moment it changes is cheaper and
 * exact, and a snapshot is three fields per component.
 *
 * `source` is the field that earns its place: without it, a walking pace
 * that was asked in January and measured in June looks like a person who
 * got faster.
 */

import type { ComponentSource, PaceReading } from '@/features/health/pace';

export interface PaceSnapshot {
  /** Date key. One per day — see `snapshotPace`. */
  date: string;
  /** Component id to what it read and where the value came from. */
  components: Record<string, { logHazard: number | null; source: ComponentSource | null }>;
  /** The headline at the time, so a chart needs no recomputation. */
  yearsEquivalent: number | null;
  plusMinus: number | null;
  observed: number;
}

export function snapshotOf(
  reading: PaceReading,
  plusMinus: number | null,
): Omit<PaceSnapshot, 'date'> {
  const components: PaceSnapshot['components'] = {};
  for (const c of reading.components) {
    components[c.id] = { logHazard: c.logHazard, source: c.source };
  }
  return {
    components,
    yearsEquivalent: reading.yearsEquivalent,
    plusMinus,
    observed: reading.coverage.observed,
  };
}

/**
 * Rehydrate a snapshot into something `paceProgress` can compare against.
 *
 * Only the fields progress reads are restored — the provenance and the
 * copy come from the live component list, because those are code rather
 * than data and a six-month-old caveat should not be shown when the
 * current one is better.
 */
export function readingFromSnapshot(
  snapshot: PaceSnapshot,
  template: PaceReading,
): PaceReading {
  const components = template.components.map((c) => {
    const stored = snapshot.components[c.id];
    return stored ? { ...c, logHazard: stored.logHazard, source: stored.source } : { ...c, logHazard: null, source: null };
  });
  const observed = components.filter((c) => c.logHazard !== null);
  return {
    ...template,
    components,
    observed,
    yearsEquivalent: snapshot.yearsEquivalent,
    coverage: { observed: observed.length, total: components.length },
  };
}
