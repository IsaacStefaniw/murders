/**
 * ACCEPTANCE TEST — TRAINING (from the Performance Intelligence brief).
 * Two people must get materially different programmes — different split,
 * volume, intensity, exercise selection, loads, progression and session
 * length — and observed performance must change the next block.
 */

import { observe } from '@/features/model/metrics';
import {
  autoRegulate,
  baselinesFrom,
  buildProgramme,
  estimate1Rm,
  type TrainingProgramme,
} from '@/features/training/programme';

const intermediate = buildProgramme(
  {
    goal: 'strength',
    experience: 'consistent',
    daysAvailable: 4,
    sessionMin: 60,
    equipment: 'gym',
    focusLift: 'bench',
    age: 38,
  },
  { bench: 120, squat: 150, deadlift: 180 },
);

const beginner = buildProgramme(
  {
    goal: 'hypertrophy',
    experience: 'new',
    daysAvailable: 3,
    sessionMin: 30,
    equipment: 'dumbbells',
  },
  {},
);

const allExercises = (p: TrainingProgramme) => p.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises));
const weeklySets = (p: TrainingProgramme, week: number) =>
  p.weeks[week - 1].sessions.reduce((n, s) => n + s.exercises.reduce((m, e) => m + e.sets, 0), 0);

describe('acceptance: two people, two genuinely different programmes', () => {
  it('different split and session count', () => {
    expect(intermediate.weeks[0].sessions).toHaveLength(4);
    expect(intermediate.weeks[0].sessions.map((s) => s.title)).toEqual([
      'Upper A',
      'Lower A',
      'Upper B',
      'Lower B',
    ]);
    expect(beginner.weeks[0].sessions).toHaveLength(3);
    expect(beginner.weeks[0].sessions.every((s) => s.title.startsWith('Full body'))).toBe(true);
  });

  it('different exercise selection for the equipment that exists', () => {
    const gymNames = allExercises(intermediate).map((e) => e.name);
    const dbNames = allExercises(beginner).map((e) => e.name);
    expect(gymNames).toContain('Bench press');
    expect(gymNames.some((n) => n.includes('Squat'))).toBe(true);
    expect(dbNames.some((n) => n.includes('Dumbbell') || n.includes('Goblet'))).toBe(true);
    expect(dbNames).not.toContain('Bench press');
  });

  it('loads from real baselines vs effort-anchored prescriptions', () => {
    const bench1 = intermediate.weeks[0].sessions[0].exercises.find((e) => e.name === 'Bench press')!;
    expect(bench1.loadKg).toBe(90); // 75% of 120
    expect(bench1.sets).toBe(4);
    expect(bench1.reps).toBe('6');
    const beginnerMain = beginner.weeks[0].sessions[0].exercises[0];
    expect(beginnerMain.loadKg).toBeUndefined();
    expect(beginnerMain.rpe).toBeDefined();
  });

  it('real progression: heavier through the block, then a deload', () => {
    const benchAt = (wk: number) =>
      intermediate.weeks[wk - 1].sessions[0].exercises.find((e) => e.name === 'Bench press')!;
    expect(benchAt(2).loadKg!).toBeGreaterThan(benchAt(1).loadKg!);
    expect(benchAt(3).loadKg!).toBeGreaterThan(benchAt(2).loadKg!);
    expect(benchAt(4).loadKg!).toBeLessThan(benchAt(1).loadKg!); // deload
    expect(intermediate.weeks[3].phase).toBe('deload');
    // Peak week carries the heavy top single for the focus lift.
    const wk3 = intermediate.weeks[2].sessions[0].exercises[0];
    expect(wk3.name).toContain('heavy top single');
    expect(wk3.loadKg).toBe(107.5); // 90% of 120
  });

  it('different volume and session length', () => {
    expect(weeklySets(intermediate, 1)).toBeGreaterThan(weeklySets(beginner, 1));
    for (const s of beginner.weeks[0].sessions) expect(s.estimatedMin).toBeLessThanOrEqual(30);
    for (const s of intermediate.weeks[0].sessions) expect(s.estimatedMin).toBeLessThanOrEqual(60);
  });

  it('observed performance changes the next block', () => {
    const metrics = [observe('strength.bench.e1rm', estimate1Rm(122.5, 3))]; // 134.7 → new baseline
    const next = buildProgramme(intermediate.inputs, {
      ...intermediate.baselines,
      ...baselinesFrom(metrics),
    });
    const before = intermediate.weeks[0].sessions[0].exercises.find((e) => e.name === 'Bench press')!;
    const after = next.weeks[0].sessions[0].exercises.find((e) => e.name === 'Bench press')!;
    expect(after.loadKg!).toBeGreaterThan(before.loadKg!);
  });
});

describe('auto-regulation: reality outranks the plan', () => {
  const session = intermediate.weeks[0].sessions[0];

  it('short sleep + tight window keeps the stimulus, cuts accessories', () => {
    const adjusted = autoRegulate(session, { availableMin: 32, sleptHours: 5.7, age: 38 });
    expect(adjusted.estimatedMin).toBeLessThanOrEqual(32);
    expect(adjusted.note).toContain('keeping the stimulus');
    // The focus lift survives.
    expect(adjusted.exercises[0].name).toBe('Bench press');
    expect(adjusted.exercises.filter((e) => e.accessory).length).toBeLessThan(
      session.exercises.filter((e) => e.accessory).length,
    );
  });

  it('a normal day passes through untouched', () => {
    expect(autoRegulate(session, { availableMin: 60, sleptHours: 8 })).toEqual(session);
  });
});
