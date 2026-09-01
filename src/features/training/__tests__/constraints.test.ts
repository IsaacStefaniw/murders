import { buildProgramme, type TrainingInputs } from '@/features/training/programme';
import {
  applyConstraints,
  constraintNote,
  intensityCeiling,
  rulesOutComplexLifts,
} from '@/features/training/constraints';

const base: TrainingInputs = {
  goal: 'strength',
  experience: 'consistent',
  daysAvailable: 4,
  sessionMin: 60,
  equipment: 'gym',
};

const names = (inputs: TrainingInputs) =>
  buildProgramme(inputs, { squat: 100, bench: 80, deadlift: 140 })
    .weeks[0].sessions.flatMap((s) => s.exercises.map((e) => e.name));

describe('training under constraints', () => {
  it('swaps the loaded lifts rather than deleting the movement', () => {
    const withSore = names({ ...base, constraints: ['joints'] });
    expect(withSore).not.toContain('Squat');
    expect(withSore).not.toContain('Deadlift');
    // The pattern survives — this is the whole rule.
    expect(withSore.some((n) => /squat/i.test(n))).toBe(true);
    expect(withSore.some((n) => /hinge/i.test(n))).toBe(true);
  });

  it('does not log a substituted movement against the barbell baseline', () => {
    // A goblet squat recorded as a squat baseline would corrupt every
    // strength number the app later reports.
    const programme = buildProgramme(
      { ...base, constraints: ['joints'] },
      { squat: 100, bench: 80 },
    );
    const loaded = programme.weeks[0].sessions
      .flatMap((s) => s.exercises)
      .filter((e) => e.loadKg !== undefined);
    expect(loaded).toHaveLength(0);
  });

  it('puts balance work first, while there is attention left for it', () => {
    const session = buildProgramme({ ...base, constraints: ['balance'] }, {}).weeks[0]
      .sessions[0];
    expect(session.exercises[0].name).toMatch(/balance/i);
  });

  it('lowers the ceiling on load rather than subtracting from it', () => {
    expect(intensityCeiling(undefined)).toBe(0.9);
    expect(intensityCeiling(['recovering'])).toBe(0.7);
    // Several at once cannot stack into something useless.
    expect(intensityCeiling(['recovering', 'heart', 'joints', 'energy'])).toBe(0.7);
  });

  it('rules out the technical lifts for the constraints that warrant it', () => {
    expect(rulesOutComplexLifts(['joints'])).toBe(true);
    expect(rulesOutComplexLifts(['balance'])).toBe(true);
    expect(rulesOutComplexLifts([])).toBe(false);
    // A heart condition is a reason to go lighter, not to ban the barbell.
    expect(rulesOutComplexLifts(['heart'])).toBe(false);
  });

  it('leaves an unconstrained programme exactly as it was', () => {
    expect(names({ ...base })).toEqual(names({ ...base, constraints: [] }));
    expect(applyConstraints([{ name: 'Squat', lift: 'squat', primary: true }], undefined)).toEqual([
      { name: 'Squat', lift: 'squat', primary: true },
    ]);
  });

  it('says what changed and where the app stops being qualified', () => {
    const note = constraintNote(['joints']);
    expect(note).toMatch(/not an assessment/i);
    expect(note).toMatch(/professional/i);
    expect(constraintNote([])).toBeNull();
  });

  it('carries the note into the programme a person actually reads', () => {
    const programme = buildProgramme({ ...base, constraints: ['balance'] }, {});
    expect(programme.notes.some((n) => /professional/i.test(n))).toBe(true);
  });
});
