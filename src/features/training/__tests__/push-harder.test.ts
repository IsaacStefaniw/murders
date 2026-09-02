/**
 * "This is too easy" — the missing half of the level control.
 *
 * The app has always had a step-back. It has never had a step-up, so the
 * only thing a person could tell it was that it had overshot. These tests
 * lock the two properties that make the new control safe to hand anybody:
 * it raises the DOSE, and it changes no STRUCTURE.
 */

import { intensityCeiling } from '@/features/training/constraints';
import {
  buildProgramme,
  tuningFor,
  type TrainingInputs,
} from '@/features/training/programme';

const BASE: TrainingInputs = {
  goal: 'strength',
  experience: 'consistent',
  level: 'established',
  daysAvailable: 4,
  sessionMin: 60,
  equipment: 'gym',
  focusLift: 'squat',
  age: 40,
};

const BASELINES = { bench: 100, squat: 140, deadlift: 180, ohp: 60 };

const mainsOf = (p: ReturnType<typeof buildProgramme>) =>
  p.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises.filter((e) => !e.accessory)));

describe('tuningFor', () => {
  it('raises every dosage dial and no structural one', () => {
    for (const level of ['foundation', 'developing', 'established', 'advanced'] as const) {
      const base = tuningFor(level);
      const pushed = tuningFor(level, true);

      expect(pushed.setsDelta).toBe(base.setsDelta + 1);
      expect(pushed.pctDelta).toBeCloseTo(base.pctDelta + 0.025, 5);
      expect(pushed.accessoryDelta).toBe(base.accessoryDelta + 1);
      expect(pushed.rpeCap).toBeGreaterThanOrEqual(base.rpeCap);

      // The structural fields are the ones that hurt someone who is not
      // ready. A button press must never buy them.
      expect(pushed.complexLifts).toBe(base.complexLifts);
      expect(pushed.topSingle).toBe(base.topSingle);
      expect(pushed.overreach).toBe(base.overreach);
      expect(pushed.technicalFocus).toBe(base.technicalFocus);
    }
  });

  it('never prescribes past one clean rep in reserve', () => {
    // RPE 10 is a grinding failure. Nothing in the app asks for it, and a
    // person tapping "too easy" three times must not arrive there either.
    expect(tuningFor('advanced', true).rpeCap).toBe(9);
  });

  it('does not hand a foundation lifter the barbell lifts', () => {
    expect(tuningFor('foundation', true).complexLifts).toBe(false);
  });
});

describe('buildProgramme with pushHarder', () => {
  const normal = buildProgramme(BASE, BASELINES);
  const pushed = buildProgramme({ ...BASE, pushHarder: true }, BASELINES);

  it('actually gets harder rather than only claiming to', () => {
    const normalSets = mainsOf(normal).reduce((n, e) => n + e.sets, 0);
    const pushedSets = mainsOf(pushed).reduce((n, e) => n + e.sets, 0);
    expect(pushedSets).toBeGreaterThan(normalSets);

    const heaviestNormal = Math.max(...mainsOf(normal).map((e) => e.loadKg ?? 0));
    const heaviestPushed = Math.max(...mainsOf(pushed).map((e) => e.loadKg ?? 0));
    expect(heaviestPushed).toBeGreaterThan(heaviestNormal);
  });

  it('says out loud that it was asked for', () => {
    // A block that silently got harder is a block the person blames
    // themselves for struggling with.
    expect(pushed.notes.join(' ')).toMatch(/you asked for more/i);
    expect(normal.notes.join(' ')).not.toMatch(/you asked for more/i);
  });

  it('keeps the deload a deload', () => {
    // Week 4 exists to be easy. If pushing hardens it too, the block stops
    // being a block and becomes a slope with no bottom.
    const week4 = pushed.weeks.find((w) => w.week === 4);
    const week3 = pushed.weeks.find((w) => w.week === 3);
    const heaviest = (w: typeof week4) =>
      Math.max(...(w?.sessions ?? []).flatMap((s) => s.exercises.map((e) => e.loadKg ?? 0)));
    expect(heaviest(week4)).toBeLessThan(heaviest(week3));
  });

  it('cannot push a constrained lifter past their own ceiling', () => {
    // The whole safety property. Someone training around a heart condition
    // has a 0.7 ceiling; no amount of "this is too easy" may exceed it.
    const constrained = buildProgramme(
      { ...BASE, pushHarder: true, constraints: ['heart'] },
      BASELINES,
    );
    const ceiling = intensityCeiling(['heart']);
    for (const e of mainsOf(constrained)) {
      if (e.loadKg == null) continue;
      const lift = e.name.toLowerCase();
      const base =
        lift.includes('squat') ? BASELINES.squat
        : lift.includes('deadlift') || lift.includes('hinge') ? BASELINES.deadlift
        : lift.includes('bench') || lift.includes('press') ? BASELINES.bench
        : null;
      if (base == null) continue;
      // Rounding to the nearest 2.5 kg can land a hair above the exact
      // percentage; the ceiling is a training limit, not a metrology one.
      expect(e.loadKg).toBeLessThanOrEqual(base * ceiling + 2.5);
    }
  });
});
