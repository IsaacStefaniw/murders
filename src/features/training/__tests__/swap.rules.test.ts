/**
 * The swap keeps the pattern and keeps the rules.
 *
 * A swap is the programme being right about the pattern and wrong about
 * the movement. It must never be a back door: not to a barbell the person
 * does not have, not to the deadlift a foundation block withheld, not to
 * the loaded squat a sore knee swapped out.
 */

import { rulesOutComplexLifts } from '@/features/training/constraints';
import {
  buildProgramme,
  complexLiftsAllowed,
  type PrescribedExercise,
  type TrainingEquipment,
  type TrainingInputs,
} from '@/features/training/programme';
import {
  alternativesFor,
  applyExerciseSwaps,
  PATTERNS,
  patternOf,
  swapKey,
} from '@/features/training/swap';
import type { PathLevel } from '@/features/paths/level';

const EQUIPMENT: TrainingEquipment[] = ['gym', 'home', 'dumbbells', 'bodyweight'];
const EVERY_MOVEMENT = PATTERNS.flatMap((p) => p.movements);

describe('alternativesFor on every equipment', () => {
  it('never returns the movement itself, only the same pattern, only on equipment the person has', () => {
    for (const eq of EQUIPMENT) {
      for (const m of EVERY_MOVEMENT) {
        const alts = alternativesFor(m.name, eq);
        expect(alts).not.toContain(m.name);
        for (const a of alts) {
          expect(patternOf(a)).toBe(patternOf(m.name));
          const def = EVERY_MOVEMENT.find((x) => x.name === a)!;
          expect([m.name, eq, a, def.equipment]).toEqual([m.name, eq, a, expect.arrayContaining([eq])]);
        }
      }
    }
  });

  it('never offers a barbell to someone without one', () => {
    const barbell = ['Bench press', 'Squat', 'Deadlift', 'Overhead press', 'Barbell row', 'Front squat', 'Trap-bar deadlift'];
    for (const eq of ['home', 'dumbbells', 'bodyweight'] as const) {
      for (const m of EVERY_MOVEMENT) {
        for (const a of alternativesFor(m.name, eq)) expect(barbell).not.toContain(a);
      }
    }
  });

  it('is empty for a movement the table does not know', () => {
    expect(alternativesFor('Finisher: intervals', 'gym')).toEqual([]);
    expect(patternOf('Finisher: intervals')).toBeNull();
  });
});

describe('the swap respects the block it belongs to', () => {
  const inputs = (level: PathLevel, constraints: TrainingInputs['constraints'] = []): TrainingInputs => ({
    goal: 'strength',
    experience: 'consistent',
    level,
    daysAvailable: 4,
    sessionMin: 60,
    equipment: 'gym',
    constraints,
  });

  it('does not hand a foundation lifter the deadlift or overhead press through a swap', () => {
    const rules = { complexLifts: complexLiftsAllowed(inputs('foundation')) };
    expect(rules.complexLifts).toBe(false);
    expect(alternativesFor('Romanian deadlift — hinge practice', 'gym', rules)).not.toContain('Deadlift');
    expect(alternativesFor('Romanian deadlift — hinge practice', 'gym', rules)).not.toContain('Trap-bar deadlift');
    expect(alternativesFor('Dumbbell shoulder press', 'gym', rules)).not.toContain('Overhead press');
    // Something is still on offer — the swap is guarded, not removed.
    expect(alternativesFor('Romanian deadlift — hinge practice', 'gym', rules).length).toBeGreaterThan(0);
    expect(alternativesFor('Dumbbell shoulder press', 'gym', rules).length).toBeGreaterThan(0);
  });

  it('opens them again once the level has earned them', () => {
    const rules = { complexLifts: complexLiftsAllowed(inputs('developing')) };
    expect(alternativesFor('Romanian deadlift — hinge practice', 'gym', rules)).toContain('Deadlift');
    expect(alternativesFor('Dumbbell shoulder press', 'gym', rules)).toContain('Overhead press');
  });

  it('does not offer the loaded lift a joint or an injury swapped out', () => {
    for (const constraint of ['joints', 'recovering'] as const) {
      const rules = { complexLifts: complexLiftsAllowed(inputs('established', [constraint])), constraints: [constraint] };
      expect(rulesOutComplexLifts([constraint])).toBe(true);
      expect(alternativesFor('Dumbbell floor press', 'gym', rules)).not.toContain('Bench press');
      expect(alternativesFor('Goblet squat — to a box, comfortable depth', 'gym', rules)).not.toContain('Squat');
      expect(alternativesFor('Hip hinge to a box', 'gym', rules)).not.toContain('Deadlift');
      expect(alternativesFor('Chest-supported row', 'gym', rules)).not.toContain('Barbell row');
      expect(alternativesFor('Landmine press — shoulder-friendly angle', 'gym', rules)).not.toContain('Overhead press');
    }
  });

  it('still has something to offer a constrained person', () => {
    const p = buildProgramme(inputs('established', ['joints']), { squat: 140, bench: 100 });
    const rules = { complexLifts: complexLiftsAllowed(p.inputs), constraints: p.inputs.constraints };
    const swappable = p.weeks[0].sessions
      .flatMap((s) => s.exercises)
      .filter((e) => !/^(Finisher|Balance):/.test(e.name))
      .filter((e) => alternativesFor(e.name, 'gym', rules).length > 0);
    expect(swappable.length).toBeGreaterThan(0);
  });

  it('agrees with what the block itself programmed', () => {
    for (const level of ['foundation', 'developing', 'established', 'advanced'] as PathLevel[]) {
      const names = buildProgramme(inputs(level)).weeks[0].sessions.flatMap((s) => s.exercises.map((e) => e.name));
      expect(names.includes('Deadlift')).toBe(complexLiftsAllowed(inputs(level)));
      expect(names.includes('Overhead press')).toBe(complexLiftsAllowed(inputs(level)));
    }
    expect(complexLiftsAllowed(inputs('advanced', ['balance']))).toBe(false);
    expect(complexLiftsAllowed(inputs('advanced', ['heart']))).toBe(true);
  });
});

describe('applyExerciseSwaps', () => {
  const exercises: PrescribedExercise[] = [
    { name: 'Squat', sets: 4, reps: '5', loadKg: 100, restSec: 150 },
    { name: 'Bench press', sets: 4, reps: '6', loadKg: 75, rpe: 8, restSec: 120 },
    { name: 'Lat pulldown', sets: 3, reps: '10–12', rpe: 7, restSec: 75, accessory: true },
  ];

  it('drops the load, sets the effort, keeps the rest, and remembers where it came from', () => {
    const swaps = { [swapKey('p1', 'Lower A', 'Squat')]: 'Front squat' };
    const [out] = applyExerciseSwaps(exercises, swaps, 'p1', 'Lower A');
    expect(out).toEqual({
      name: 'Front squat',
      sets: 4,
      reps: '5',
      rpe: 7,
      restSec: 150,
      swappedFrom: 'Squat',
    });
    expect('loadKg' in out).toBe(false);
  });

  it('keeps an effort target that was already there', () => {
    const swaps = { [swapKey('p1', 'Upper A', 'Bench press')]: 'Dumbbell bench press' };
    const out = applyExerciseSwaps(exercises, swaps, 'p1', 'Upper A')[1];
    expect(out.rpe).toBe(8);
    expect(out.loadKg).toBeUndefined();
  });

  it('never leaks a swap across sessions or across programmes', () => {
    const swaps = { [swapKey('p1', 'Lower A', 'Squat')]: 'Front squat' };
    expect(applyExerciseSwaps(exercises, swaps, 'p1', 'Lower B')).toEqual(exercises);
    expect(applyExerciseSwaps(exercises, swaps, 'p2', 'Lower A')).toEqual(exercises);
    // Same person, next block: the new block starts clean.
    const next = buildProgramme({ goal: 'strength', experience: 'consistent', daysAvailable: 4, sessionMin: 60, equipment: 'gym' });
    const after = applyExerciseSwaps(next.weeks[0].sessions[1].exercises, swaps, next.id, 'Lower A');
    expect(after).toEqual(next.weeks[0].sessions[1].exercises);
  });

  it('treats a swap to the same name as no swap', () => {
    const swaps = { [swapKey('p1', 'Lower A', 'Squat')]: 'Squat' };
    expect(applyExerciseSwaps(exercises, swaps, 'p1', 'Lower A')[0]).toBe(exercises[0]);
  });

  it('keys on programme, session and movement, with none of them able to collide', () => {
    expect(swapKey('p1', 'Lower A', 'Squat')).not.toBe(swapKey('p1', 'Lower B', 'Squat'));
    expect(swapKey('p1', 'Lower A', 'Squat')).not.toBe(swapKey('p2', 'Lower A', 'Squat'));
    expect(swapKey('p1', 'Lower A', 'Squat')).not.toBe(swapKey('p1', 'Lower A', 'Front squat'));
  });
});
