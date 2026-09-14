/**
 * "Add/remove/swap exercises on a day, log any lift."
 *
 * Swapping already worked. These are the other two — and the rules that
 * keep them from turning a lifting session into something else.
 */

import type { PrescribedExercise } from '@/features/training/programme';
import {
  addedKey,
  applySessionEdits,
  canDrop,
  dropKey,
  droppedFrom,
} from '@/features/training/sessionEdits';

const SESSION: PrescribedExercise[] = [
  { name: 'Bench press', sets: 4, reps: '5', restSec: 180 },
  { name: 'Overhead press', sets: 3, reps: '8', restSec: 120 },
  { name: 'Barbell row', sets: 3, reps: '8', restSec: 120 },
  { name: 'Lat pulldown', sets: 3, reps: '10–12', restSec: 90, accessory: true },
];

const P = 'prog1';
const T = 'Chest, shoulders & back A';

describe('taking something out', () => {
  it('removes it from the session', () => {
    const drops = { [dropKey(P, T, 'Overhead press')]: true as const };
    const out = applySessionEdits(SESSION, drops, {}, P, T);
    expect(out.map((e) => e.name)).toEqual(['Bench press', 'Barbell row', 'Lat pulldown']);
  });

  it('is scoped to one session of one programme, like a swap', () => {
    const drops = { [dropKey(P, T, 'Overhead press')]: true as const };
    expect(applySessionEdits(SESSION, drops, {}, P, 'Legs & glutes A')).toHaveLength(4);
    expect(applySessionEdits(SESSION, drops, {}, 'prog2', T)).toHaveLength(4);
  });

  it('names what was taken out, so a lift cannot vanish quietly', () => {
    const drops = { [dropKey(P, T, 'Overhead press')]: true as const };
    expect(droppedFrom(SESSION, drops, P, T)).toEqual(['Overhead press']);
    expect(droppedFrom(SESSION, {}, P, T)).toEqual([]);
  });
});

describe('what may be taken out', () => {
  it('always lets an accessory go', () => {
    expect(canDrop(SESSION, {}, P, T, 'Lat pulldown')).toBe(true);
  });

  it('lets main lifts go while more than one remains', () => {
    expect(canDrop(SESSION, {}, P, T, 'Bench press')).toBe(true);
  });

  it('keeps the last main lift', () => {
    // Otherwise the session is an accessory circuit with a lifting
    // session's name on it.
    const drops = {
      [dropKey(P, T, 'Bench press')]: true as const,
      [dropKey(P, T, 'Overhead press')]: true as const,
    };
    expect(canDrop(SESSION, drops, P, T, 'Barbell row')).toBe(false);
    // The accessory can still go even then.
    expect(canDrop(SESSION, drops, P, T, 'Lat pulldown')).toBe(true);
  });

  it('says no to a movement that is not there', () => {
    expect(canDrop(SESSION, {}, P, T, 'Sled push')).toBe(false);
  });
});

describe('putting something in', () => {
  const added = { [addedKey(P, T)]: [{ name: 'Chin-ups', sets: 3, reps: 'AMRAP' }] };

  it('goes on the end, after the programmed work', () => {
    // The main lifts stay where the person is freshest — the one part of
    // session order with evidence behind it.
    const out = applySessionEdits(SESSION, {}, added, P, T);
    expect(out).toHaveLength(5);
    expect(out[4].name).toBe('Chin-ups');
  });

  it('carries no prescribed load', () => {
    // A number beside a movement the app has never measured is a guess in
    // the same typeface as a calculation.
    const out = applySessionEdits(SESSION, {}, added, P, T);
    expect(out[4].loadKg).toBeUndefined();
    expect(out[4].rpe).toBe(7);
  });

  it('is scoped to its own session', () => {
    expect(applySessionEdits(SESSION, {}, added, P, 'Legs & glutes A')).toHaveLength(4);
  });

  it('combines with a drop', () => {
    const drops = { [dropKey(P, T, 'Overhead press')]: true as const };
    const out = applySessionEdits(SESSION, drops, added, P, T);
    expect(out.map((e) => e.name)).toEqual([
      'Bench press',
      'Barbell row',
      'Lat pulldown',
      'Chin-ups',
    ]);
  });
});

describe('no edits at all', () => {
  it('leaves the session exactly as the programme built it', () => {
    expect(applySessionEdits(SESSION, {}, {}, P, T)).toEqual(SESSION);
  });
});
