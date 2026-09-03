/**
 * "Is my training program advanced or same for every other user?"
 *
 * It was the same, because the ladder only ever measured how long someone
 * had been using the app. These are the numbers that let it measure the
 * lifting instead.
 */

import {
  ageAllowance,
  assessStrength,
  bandForLift,
  meetsAdvancedStandard,
  overallBand,
} from '@/features/training/standards';
import type { LifeProfile } from '@/types/domain';

const man = { weightKg: 85, sexAtBirth: 'male', age: 35 } as LifeProfile;
const woman = { weightKg: 65, sexAtBirth: 'female', age: 35 } as LifeProfile;

describe('banding one lift', () => {
  it('places a man by bodyweight multiple', () => {
    // 85kg bodyweight: 60kg bench is 0.71x and under the beginner bar,
    // 70 clears it, 85 is bodyweight and exactly the intermediate bar,
    // 128 is advanced, 170 is double bodyweight.
    expect(bandForLift('bench', 60, man)).toBeNull();
    expect(bandForLift('bench', 70, man)).toBe('beginner');
    expect(bandForLift('bench', 85, man)).toBe('intermediate');
    expect(bandForLift('bench', 128, man)).toBe('advanced');
    expect(bandForLift('bench', 170, man)).toBe('elite');
  });

  it('uses a different table for a woman, not a scaled male one', () => {
    // 65kg bodyweight. A 60kg bench is 0.92x — advanced on the female
    // table, and barely past beginner on the male one. Reading it off the
    // wrong table is a two-band error, which is a whole different programme.
    expect(bandForLift('bench', 60, woman)).toBe('advanced');
    expect(bandForLift('bench', 60, { ...woman, sexAtBirth: 'male' })).toBe('beginner');
  });
});

describe('what it refuses to answer', () => {
  it('returns nothing rather than guessing when sex is unknown', () => {
    expect(bandForLift('squat', 150, { ...man, sexAtBirth: undefined })).toBeNull();
    expect(bandForLift('squat', 150, { ...man, sexAtBirth: 'preferNotToSay' })).toBeNull();
  });

  it('returns nothing without a bodyweight to divide by', () => {
    expect(bandForLift('squat', 150, { ...man, weightKg: undefined })).toBeNull();
  });

  it('separates "not known" from "not strong" for the caller', () => {
    // Both come back null from bandForLift, so assessStrength must not
    // report a band it cannot support.
    expect(assessStrength({ squat: 150 }, { ...man, sexAtBirth: undefined }).band).toBeNull();
    expect(assessStrength({}, man).band).toBeNull();
  });
});

describe('age', () => {
  it('leaves anyone under forty alone', () => {
    expect(ageAllowance(25)).toBe(1);
    expect(ageAllowance(40)).toBe(1);
    expect(ageAllowance(undefined)).toBe(1);
  });

  it('stops banding a sixty-year-old who trains hard as untrained', () => {
    const older = { ...man, age: 65 };
    // 100kg bench at 85kg bodyweight: 1.18x.
    expect(bandForLift('bench', 100, man)).toBe('intermediate');
    expect(bandRankOf(bandForLift('bench', 100, older))).toBeGreaterThanOrEqual(
      bandRankOf(bandForLift('bench', 100, man)),
    );
  });

  it('caps the allowance so it cannot run away', () => {
    expect(ageAllowance(90)).toBe(0.7);
    expect(ageAllowance(200)).toBe(0.7);
  });
});

const bandRankOf = (b: string | null) =>
  ['beginner', 'intermediate', 'advanced', 'elite'].indexOf(b ?? '');

describe('reducing several lifts to one band', () => {
  it('does not let a single strong lift carry the rest', () => {
    // An elite deadlift beside two beginner presses is a common shape, and
    // programming that person as elite across the board is how they get hurt.
    expect(overallBand(['elite', 'beginner', 'beginner'])).toBe('beginner');
  });

  it('lets genuine all-round strength through', () => {
    expect(overallBand(['advanced', 'advanced', 'elite'])).toBe('advanced');
  });

  it('answers from a single lift when that is all there is', () => {
    expect(overallBand(['intermediate'])).toBe('intermediate');
  });
});

describe('the advanced gate', () => {
  it('opens on lifts alone, without ten months of app history', () => {
    const strong = { bench: 128, squat: 175, deadlift: 215, ohp: 78 };
    expect(meetsAdvancedStandard(strong, man)).toBe(true);
  });

  it('stays shut for someone the app cannot assess', () => {
    const strong = { bench: 128, squat: 175, deadlift: 215, ohp: 78 };
    expect(meetsAdvancedStandard(strong, { ...man, sexAtBirth: undefined })).toBe(false);
  });

  it('stays shut on one strong lift', () => {
    expect(meetsAdvancedStandard({ deadlift: 260, bench: 70, squat: 90 }, man)).toBe(false);
  });
});
