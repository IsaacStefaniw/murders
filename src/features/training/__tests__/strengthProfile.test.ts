import { readFileSync } from 'fs';
import { join } from 'path';

import {
  liftContext,
  NOT_STRENGTH_TRAINING,
  participationLine,
  strengthProfile,
} from '@/features/training/standards';
import type { LifeProfile } from '@/types/domain';

const man = (weightKg: number, age = 37) =>
  ({ weightKg, sexAtBirth: 'male', age }) as LifeProfile;

/** Isaac's lifts. The scale called two of these "Beginner". */
const ISAAC = { bench: 130, squat: 120, deadlift: 140 };
const HIM = man(88);

describe('a person is not graded', () => {
  it('never leads with a verdict', () => {
    const p = strengthProfile(ISAAC, HIM);
    expect(p.headline).toBe('Your bench is your strongest lift');
    expect(p.headline.toLowerCase()).not.toContain('beginner');
    expect(p.headline.toLowerCase()).not.toContain('intermediate');
  });

  it('names the gap as the thing to train, not as a judgement', () => {
    const { detail } = strengthProfile(ISAAC, HIM);
    expect(detail).toContain('squat');
    expect(detail).toMatch(/worth training/);
    expect(detail).toMatch(/uneven profile is the normal one/);
  });

  it('returns every lift with its own context, strongest first', () => {
    const { lifts } = strengthProfile(ISAAC, HIM);
    expect(lifts[0].lift).toBe('bench');
    expect(lifts[0].ratio).toBeCloseTo(130 / 88, 2);
    expect(lifts.every((l) => l.context !== null)).toBe(true);
  });

  it('says so when there is nothing to place', () => {
    expect(strengthProfile({}, HIM).headline).toBe('Not enough to say yet');
    expect(
      strengthProfile(ISAAC, { sexAtBirth: 'male' } as LifeProfile).headline,
    ).toBe('Not enough to say yet');
  });
});

describe('against whom — said only as far as the data goes', () => {
  it('describes the lift instead of grading the person', () => {
    // The deadlift that used to come back as "Beginner", a word anybody
    // would read as "has never been to a gym".
    const dl = liftContext('deadlift', 140, HIM)!;
    expect(dl.line).not.toMatch(/beginner/i);
    expect(dl.line).toMatch(/marks trained lifters are measured against/);
    // No band word anywhere in what a person reads.
    for (const word of ['beginner', 'intermediate', 'advanced', 'elite']) {
      expect(dl.line.toLowerCase()).not.toContain(word);
    }
    expect(dl.next?.band).toBe('intermediate');
  });

  it('names the next mark, so a number has somewhere to go', () => {
    const bench = liftContext('bench', 130, HIM)!;
    expect(bench.passed).toBe('intermediate');
    expect(bench.next?.band).toBe('advanced');
    expect(bench.next?.ratio).toBeCloseTo(1.5, 2);
  });

  it('states the participation figure, which IS measured', () => {
    // AIHW 2022, a representative national survey — unlike every lifting
    // table, which is people who lift and chose to record it.
    expect(NOT_STRENGTH_TRAINING.male).toBe(0.71);
    expect(NOT_STRENGTH_TRAINING.female).toBe(0.76);
    expect(participationLine(HIM)).toMatch(/71% of Australian men/);
    expect(participationLine(HIM)).toMatch(/self-selected/);
  });

  it('claims no percentile against the general population, ever', () => {
    // Three attempts at one were wrong the same way: the reference class
    // was always lifters, right down to the "untrained" row. Nobody has
    // one-rep-max tested a representative sample of adults and nobody can,
    // so any figure would be invented. This stops it growing back.
    const source = readFileSync(join(__dirname, '..', 'standards.ts'), 'utf8');
    expect(source).not.toMatch(/percentile:/);
    expect(source).toMatch(/data does not exist/);
  });

  it('refuses to place a lift without a bodyweight or a sex', () => {
    expect(liftContext('bench', 130, { weightKg: 88 } as LifeProfile)).toBeNull();
    expect(liftContext('bench', 130, { sexAtBirth: 'male' } as LifeProfile)).toBeNull();
  });

  it('adjusts the marks for age rather than holding a 60-year-old to 25', () => {
    // Compared at the SAME mark: a 60-year-old's third bar sits lower than
    // a 30-year-old's. (An earlier version of this test compared whichever
    // mark each had reached, which are different bars and prove nothing.)
    const older = liftContext('bench', 40, man(88, 60))!;
    const younger = liftContext('bench', 40, man(88, 30))!;
    expect(older.next!.band).toBe(younger.next!.band);
    expect(older.next!.ratio).toBeLessThan(younger.next!.ratio);
  });
});
