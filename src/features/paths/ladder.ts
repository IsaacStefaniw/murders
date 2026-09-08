/**
 * A pillar is an order, not a list.
 *
 * The research rounds produced a `ladder.md` per pillar and it says the
 * thing the library could not: what comes first, what is wasted until the
 * rung below is solid, and what the coach says at the transition. From the
 * work ladder — "Rung 1: the day has an end. Nothing above this rung works
 * while work never finishes."
 *
 * That sentence is the anti-overwhelm mechanism, and it is why somebody who
 * has listened to forty hours of podcasts still cannot start: they are being
 * offered rung four. A coach that knows the order offers one thing, and it
 * is the right one.
 *
 * This module is the engine. It holds no opinion about what is solid — the
 * caller supplies that, so the rule stays testable and this file stays free
 * of the store.
 */

import { protocolById, type Pillar } from '@/features/knowledge/protocols';

export interface Rung {
  /** 1-based, as the ladders are written. */
  n: number;
  title: string;
  /** The practices that constitute this rung. Any one of them counts. */
  protocolIds: string[];
  /** What the coach says when somebody reaches it. */
  coachLine?: string;
  /** Why nothing above this rung works yet. */
  why?: string;
}

export interface Ladder {
  id: string;
  pillar: Pillar;
  /** Who this variant is for. A pillar may have several. */
  variant: string;
  /**
   * Asked before any rung is offered at all.
   *
   * Connection needs this and nothing else does: a person being controlled
   * who reads advice about turning toward their partner is getting guidance
   * that does not apply to them, and no rung is safe until that is asked.
   */
  gate?: { ask: string; routeTo: string };
  rungs: Rung[];
  /** Practices that are not a rung and may start at any time. */
  alongside?: string[];
  /** What the coach says when somebody is stuck rather than progressing. */
  whenStuck: string;
  /**
   * Every card on this ladder is temporary and never chased. Someone three
   * weeks past a redundancy does not need an adherence score.
   */
  neverNag?: boolean;
}

/** True when the practice exists in the shipped library. */
const isLive = (protocolId: string): boolean => protocolById(protocolId) !== undefined;

/**
 * The rung's practices that actually exist yet.
 *
 * The ladders were written against the full research output and most of it
 * is still an unmerged candidate — 69 of the 94 ids the six ladders name.
 * A rung whose practices have not landed is DORMANT: it is skipped rather
 * than offered as an empty step, and it lights up by itself on the merge.
 */
export const liveProtocols = (rung: Rung): string[] => rung.protocolIds.filter(isLive);

/** A rung nobody can be offered yet, because none of its practices exist. */
export const isDormant = (rung: Rung): boolean => liveProtocols(rung).length === 0;

/** The rungs of this ladder that can actually be offered today. */
export const offerableRungs = (ladder: Ladder): Rung[] => ladder.rungs.filter((r) => !isDormant(r));

/**
 * The one rung the coach should be working on.
 *
 * The first rung the person has not made solid — and nothing above it, ever.
 * That is the whole point: rung four is not withheld to be stingy, it is
 * withheld because it does not work yet.
 *
 * `solid` answers "is this practice reliably part of their week". A rung
 * counts as solid when ANY of its practices is: the ladders list
 * alternatives, not checklists.
 *
 * Returns null when every offerable rung is solid — the person is at the
 * top of what this ladder has, which is a result and should be said.
 */
export function rungFor(ladder: Ladder, solid: (protocolId: string) => boolean): Rung | null {
  for (const rung of offerableRungs(ladder)) {
    if (!liveProtocols(rung).some(solid)) return rung;
  }
  return null;
}

/** How much of a ladder the shipped library can currently support. */
export function coverage(ladder: Ladder): { live: number; total: number; dormant: string[] } {
  const total = ladder.rungs.reduce((n, r) => n + r.protocolIds.length, 0);
  const live = ladder.rungs.reduce((n, r) => n + liveProtocols(r).length, 0);
  return { live, total, dormant: ladder.rungs.filter(isDormant).map((r) => r.title) };
}
