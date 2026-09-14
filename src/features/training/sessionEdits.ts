/**
 * Taking something out of today's session, and putting something in.
 *
 * Isaac: "more flexibility in training blocks — add/remove/swap exercises
 * on a day, log any lift."
 *
 * Swapping already worked: a press for a press, a hinge for a hinge, on
 * the equipment you have (`swap.ts`). What it could not do is the two
 * things people actually want on a Tuesday — the shoulder is unhappy so
 * the overhead press comes out, or the rack is free so a set of chin-ups
 * goes in. Both used to require pretending: skip the session, or log a
 * lift that was not done.
 *
 * ── WHY DROPS AND ADDITIONS ARE STORED SEPARATELY FROM SWAPS ────────────
 *
 * A swap keeps the programme's intent and changes the movement. A drop
 * throws the intent away, and an addition is intent the programme never
 * had. Folding all three into one map would make it impossible to tell
 * "I did a different press" from "I did no press", and the first is a
 * programme running as designed while the second is a hole in the week.
 * Anything reading adherence later needs to be able to see the difference.
 *
 * ── WHAT A DROP IS NOT ──────────────────────────────────────────────────
 *
 * It is not a deletion. The exercise stays in the block and comes back
 * next week; a drop is scoped to one session of one programme, exactly
 * like a swap, and is reversible from the same place. Somebody whose
 * shoulder is sore this week should not have to rebuild a block to get
 * their pressing back.
 *
 * ── THE ONE RULE ON ADDITIONS ───────────────────────────────────────────
 *
 * An added lift carries no prescribed load. The programme's loads are
 * computed from a tested baseline for a specific lift, and a number the
 * app puts beside a movement it has never measured would be a guess
 * wearing the same typeface as a calculation. Added lifts go by effort
 * until they have a history of their own — the same rule a swapped lift
 * already follows.
 */

import type { PrescribedExercise } from '@/features/training/programme';
import { swapKey } from '@/features/training/swap';

/** Scoped to one session of one programme, exactly like a swap. */
export function dropKey(programmeId: string, sessionTitle: string, name: string): string {
  return swapKey(programmeId, sessionTitle, name);
}

/** Where a session's added lifts live. */
export function addedKey(programmeId: string, sessionTitle: string): string {
  return `${programmeId}::${sessionTitle}`;
}

/** An added lift, as the person described it. */
export interface AddedExercise {
  name: string;
  sets: number;
  reps: string;
}

/**
 * The session as it will actually be done: dropped movements gone, added
 * ones on the end.
 *
 * Additions go last on purpose. They are the extra thing, and putting them
 * after the programmed work keeps the main lifts where the person is
 * freshest — which is the one part of session order that has any evidence
 * behind it.
 */
export function applySessionEdits(
  exercises: PrescribedExercise[],
  drops: Record<string, true>,
  added: Record<string, AddedExercise[]>,
  programmeId: string,
  sessionTitle: string,
): PrescribedExercise[] {
  const kept = exercises.filter((e) => !drops[dropKey(programmeId, sessionTitle, e.name)]);
  const extras = added[addedKey(programmeId, sessionTitle)] ?? [];
  return [
    ...kept,
    ...extras.map<PrescribedExercise>((e) => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      // No load, by design. See the header.
      rpe: 7,
      restSec: 90,
      accessory: true,
    })),
  ];
}

/**
 * What a session lost, for the screen to say out loud.
 *
 * A session quietly two movements shorter than the programme built is how
 * somebody loses a lift for a month without noticing. The screen names
 * them and offers them back.
 */
export function droppedFrom(
  exercises: PrescribedExercise[],
  drops: Record<string, true>,
  programmeId: string,
  sessionTitle: string,
): string[] {
  return exercises
    .filter((e) => drops[dropKey(programmeId, sessionTitle, e.name)])
    .map((e) => e.name);
}

/**
 * Whether a session can afford to lose this movement.
 *
 * One main lift has to survive, or the session is an accessory circuit
 * with a lifting session's name on it. Accessories can all go.
 */
export function canDrop(
  exercises: PrescribedExercise[],
  drops: Record<string, true>,
  programmeId: string,
  sessionTitle: string,
  name: string,
): boolean {
  const target = exercises.find((e) => e.name === name);
  if (!target) return false;
  if (target.accessory) return true;
  const mainsLeft = exercises.filter(
    (e) => !e.accessory && e.name !== name && !drops[dropKey(programmeId, sessionTitle, e.name)],
  );
  return mainsLeft.length >= 1;
}
