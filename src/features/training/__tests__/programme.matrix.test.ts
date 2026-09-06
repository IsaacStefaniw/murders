/**
 * buildProgramme across everything it can be asked for.
 *
 * Every equipment, goal and level, every constraint alone and in company,
 * three ages, with and without "this is too easy", with and without
 * baselines. The assertions are the health rules the block is not allowed
 * to break for anybody: a load never above the ceiling a constraint sets,
 * no barbell for someone without one, no deadlift or overhead press at
 * foundation, no near-maximal single beside any constraint, and a session
 * that fits the time it was built for.
 */

import { intensityCeiling } from '@/features/training/constraints';
import {
  buildProgramme,
  estimateSessionMin,
  type TrainingEquipment,
  type TrainingGoal,
  type TrainingInputs,
  type TrainingProgramme,
} from '@/features/training/programme';
import { patternOf } from '@/features/training/swap';
import type { PathLevel } from '@/features/paths/level';
import type { PhysicalConstraint } from '@/types/domain';

const EQUIPMENT: TrainingEquipment[] = ['gym', 'home', 'dumbbells', 'bodyweight'];
const GOALS: TrainingGoal[] = ['strength', 'hypertrophy', 'fatloss', 'general'];
const LEVELS: PathLevel[] = ['foundation', 'developing', 'established', 'advanced'];
// Typed as a record so a constraint added to the domain type without a row
// here fails to compile rather than silently escaping the matrix.
const EVERY_CONSTRAINT: Record<PhysicalConstraint, true> = {
  joints: true,
  balance: true,
  heart: true,
  recovering: true,
  pregnancy: true,
  energy: true,
  bloodSugar: true,
  hormonal: true,
  mentalHealth: true,
};
const CONSTRAINTS = Object.keys(EVERY_CONSTRAINT) as PhysicalConstraint[];
const CONSTRAINT_SETS: PhysicalConstraint[][] = [
  [],
  ...CONSTRAINTS.map((c) => [c]),
  ['joints', 'heart'],
  ['balance', 'pregnancy'],
  ['recovering', 'energy'],
  CONSTRAINTS,
];
const AGES = [25, 45, 60];
const BASELINES = { bench: 100, squat: 140, deadlift: 180, ohp: 60 };

/** The baseline a named movement's load was computed from, or null for one that has none. */
function baselineFor(name: string): number | null {
  const bare = name.replace(/ — heavy top single$/, '');
  if (bare === 'Bench press') return BASELINES.bench;
  if (bare === 'Squat') return BASELINES.squat;
  if (bare === 'Deadlift') return BASELINES.deadlift;
  if (bare === 'Overhead press') return BASELINES.ohp;
  return null;
}

const exercisesOf = (p: TrainingProgramme) =>
  p.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises));

interface Case {
  inputs: TrainingInputs;
  baselines: TrainingProgramme['baselines'];
  label: string;
}

/** Every combination, built once and shared by the assertions below. */
const CASES: Case[] = [];
for (const equipment of EQUIPMENT)
  for (const goal of GOALS)
    for (const level of LEVELS)
      for (const constraints of CONSTRAINT_SETS)
        for (const age of AGES)
          for (const pushHarder of [false, true])
            for (const withBaselines of [false, true]) {
              const inputs: TrainingInputs = {
                goal,
                experience: 'consistent',
                level,
                daysAvailable: 4,
                sessionMin: 60,
                equipment,
                focusLift: 'squat',
                age,
                constraints,
                pushHarder,
              };
              CASES.push({
                inputs,
                baselines: withBaselines ? BASELINES : {},
                label: `${equipment}/${goal}/${level}/[${constraints.join(',')}]/${age}/${pushHarder ? 'push' : 'plain'}/${withBaselines ? 'baselined' : 'fresh'}`,
              });
            }

const built = CASES.map((c) => ({ ...c, programme: buildProgramme(c.inputs, c.baselines) }));

describe('the programme matrix', () => {
  it('covers every combination the intake can produce', () => {
    expect(CASES.length).toBe(4 * 4 * 4 * CONSTRAINT_SETS.length * 3 * 2 * 2);
  });

  it('never loads above the ceiling the constraints set, rounding included', () => {
    for (const { programme, inputs, label } of built) {
      const ceiling = intensityCeiling(inputs.constraints);
      for (const e of exercisesOf(programme)) {
        if (e.loadKg == null) continue;
        const base = baselineFor(e.name);
        // A load with no baseline behind it would be a number from nowhere.
        expect([label, e.name, base]).toEqual([label, e.name, expect.any(Number)]);
        expect([label, e.name, e.loadKg]).toEqual([label, e.name, expect.any(Number)]);
        if (e.loadKg > base! * ceiling) {
          throw new Error(`${label}: ${e.name} at ${e.loadKg} kg is above ${ceiling} × ${base}`);
        }
      }
    }
  });

  it('gives a bodyweight trainee no barbell and no computed load, and no load anywhere a barbell lift is not programmed', () => {
    const barbell = ['Bench press', 'Squat', 'Deadlift', 'Overhead press', 'Barbell row'];
    for (const { programme, inputs, label } of built) {
      if (inputs.equipment === 'gym') continue;
      for (const e of exercisesOf(programme)) {
        if (barbell.includes(e.name)) throw new Error(`${label}: ${e.name}`);
        if (e.loadKg != null) throw new Error(`${label}: ${e.name} carries ${e.loadKg} kg`);
      }
    }
  });

  it('never programmes the deadlift or the overhead press at foundation', () => {
    for (const { programme, inputs, label } of built) {
      if (inputs.level !== 'foundation') continue;
      for (const e of exercisesOf(programme)) {
        if (e.name === 'Deadlift' || e.name === 'Overhead press' || /^(Deadlift|Overhead press) — /.test(e.name)) {
          throw new Error(`${label}: ${e.name}`);
        }
      }
    }
  });

  it('offers no near-maximal single beside any constraint', () => {
    for (const { programme, inputs, label } of built) {
      if ((inputs.constraints?.length ?? 0) === 0) continue;
      for (const e of exercisesOf(programme)) {
        if (e.reps === '1' || /top single/i.test(e.name)) throw new Error(`${label}: ${e.name}`);
      }
    }
  });

  it('gives every movement a pattern the swap table knows, so it can be swapped', () => {
    // The interval finisher and the balance opener are not movements a
    // person swaps: one is conditioning, the other is a constraint's
    // opening ritual.
    const unswappable = /^(Finisher|Balance):/;
    const missing = new Set<string>();
    for (const { programme } of built) {
      for (const e of exercisesOf(programme)) {
        if (unswappable.test(e.name)) continue;
        if (patternOf(e.name.replace(/ — heavy top single$/, '')) === null) missing.add(e.name);
      }
    }
    expect([...missing].sort()).toEqual([]);
  });

  it('fits the session to the time it was built for, and says the honest number', () => {
    for (const { programme, inputs, label } of built) {
      for (const week of programme.weeks) {
        for (const s of week.sessions) {
          const real = estimateSessionMin(s.exercises, inputs.age);
          if (s.estimatedMin !== real) {
            throw new Error(`${label} ${s.title}: shows ${s.estimatedMin} min, takes ${real}`);
          }
          if (real > inputs.sessionMin) {
            throw new Error(`${label} ${s.title}: takes ${real} min of ${inputs.sessionMin}`);
          }
        }
      }
    }
  });

  it('is always four weeks with the deload last', () => {
    for (const { programme } of built) {
      expect(programme.weeks.map((w) => w.phase)).toEqual(['build', 'build', 'progress', 'deload']);
      expect(programme.weeks.map((w) => w.week)).toEqual([1, 2, 3, 4]);
    }
  });

  it('builds longer warm-ups into the estimate from 45, and says so', () => {
    const at = (age: number) =>
      buildProgramme({ ...CASES[0].inputs, age, constraints: [], pushHarder: false }, BASELINES);
    const young = at(25);
    const mid = at(45);
    const older = at(60);
    expect(young.notes.join(' ')).not.toMatch(/45\+/);
    expect(mid.notes.join(' ')).toMatch(/45\+/);
    expect(older.notes.join(' ')).toMatch(/45\+/);
    // Same exercises, four more minutes of warm-up.
    expect(estimateSessionMin(young.weeks[0].sessions[0].exercises, 45)).toBe(
      estimateSessionMin(young.weeks[0].sessions[0].exercises, 25) + 4,
    );
  });

  it('never talks like a clinic', () => {
    for (const { programme, label } of built) {
      const read = [
        ...programme.notes,
        ...programme.weeks.flatMap((w) => [w.focus, ...w.sessions.map((s) => s.note ?? '')]),
      ].join('\n');
      if (/prescri|diagnos|treat(ment)?\b|clinical|medical advice/i.test(read)) {
        throw new Error(`${label}: ${read.match(/.{0,40}(prescri|diagnos|treat|clinical|medical).{0,40}/i)?.[0]}`);
      }
    }
  });
});

describe('what the block says about the focus lift', () => {
  const base: TrainingInputs = {
    goal: 'strength',
    experience: 'consistent',
    daysAvailable: 4,
    sessionMin: 60,
    equipment: 'gym',
    focusLift: 'bench',
    age: 30,
  };
  const focusNote = (inputs: TrainingInputs) =>
    buildProgramme(inputs, BASELINES).notes.find((n) => n.startsWith('Focus:'));

  it('promises the heavy top set only where the block gives one', () => {
    expect(focusNote({ ...base, level: 'established' })).toMatch(/heavy top set/);
    expect(focusNote({ ...base, level: 'advanced' })).toMatch(/heavy top set/);
    // Foundation and developing never get a top single, so the note must
    // not announce one.
    expect(focusNote({ ...base, level: 'foundation' })).not.toMatch(/heavy top set/);
    expect(focusNote({ ...base, level: 'developing' })).not.toMatch(/heavy top set/);
  });

  it('does not promise a top set in one line and withdraw it in the next', () => {
    const notes = buildProgramme({ ...base, level: 'established', constraints: ['heart'] }, BASELINES).notes;
    expect(notes.join(' ')).toMatch(/No heavy single/);
    expect(notes.find((n) => n.startsWith('Focus:'))).not.toMatch(/heavy top set/);
  });

  it('gives the focus lift the lead slot\'s volume, not a lighter session', () => {
    // Naming the deadlift as the focus used to move it to the front and
    // then prescribe it as the second lift it had been, so the person who
    // asked for more deadlift got three sets of it and lost a squat set.
    const lower = (focusLift?: 'deadlift') =>
      buildProgramme({ ...base, level: 'established', focusLift }, BASELINES).weeks[0].sessions[1].exercises.filter((e) => !e.accessory);
    const plain = lower();
    const focused = lower('deadlift');
    expect(focused[0].name).toBe('Deadlift');
    expect(focused[0].sets).toBe(plain[0].sets);
    expect(focused[0].loadKg! / BASELINES.deadlift).toBeCloseTo(plain[0].loadKg! / BASELINES.squat, 5);
    const setsOf = (xs: typeof plain) => xs.reduce((n, e) => n + e.sets, 0);
    expect(setsOf(focused)).toBe(setsOf(plain));
  });

  it('says nothing about a lift the constraints swapped out of the block', () => {
    // Joints swap the bench for a floor press; there is no bench to open a
    // session with, so a note claiming it does is describing another block.
    expect(focusNote({ ...base, level: 'established', constraints: ['joints'] })).toBeUndefined();
  });
});

describe('sessions per week', () => {
  const inputs = (daysAvailable: number): TrainingInputs => ({
    goal: 'general',
    experience: 'returning',
    daysAvailable,
    sessionMin: 45,
    equipment: 'gym',
  });

  it('clamps between two and five, and names the split honestly', () => {
    const expected: Record<number, number> = { 1: 2, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5, 7: 5 };
    for (const [days, count] of Object.entries(expected)) {
      const p = buildProgramme(inputs(Number(days)));
      for (const w of p.weeks) expect(w.sessions).toHaveLength(count);
      const titles = p.weeks[0].sessions.map((s) => s.title);
      if (count <= 3) expect(titles.every((t) => t.startsWith('Full body'))).toBe(true);
      else expect(titles.slice(0, 4)).toEqual(['Upper A', 'Lower A', 'Upper B', 'Lower B']);
    }
  });

  it('gives each session in a week its own title', () => {
    for (const days of [2, 3, 4, 5]) {
      const titles = buildProgramme(inputs(days)).weeks[0].sessions.map((s) => s.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});
