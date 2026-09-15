import {
  BIRTH_YEAR_MIN,
  MIN_AGE,
  ageOf,
  agePrecision,
  birthYearRange,
  isPlausibleBirthYear,
} from '@/features/health/age';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { INTERVIEW_STEPS } from '@/features/onboarding/script';
import { setupSteps } from '@/features/onboarding/sections';
import type { LifeProfile } from '@/types/domain';

/**
 * How old somebody actually is.
 *
 * The interview asked for a decade and stored the midpoint, and `pace.ts`
 * ran a Gompertz hazard on it — risk doubling about every eight years,
 * computed on a number that could be five years out. This is the test that
 * keeps a year in front of a bucket.
 */

const TODAY = '2026-09-15';
const profile = (over: Partial<LifeProfile> = {}): LifeProfile =>
  ({ firstName: 'Isaac', createdAt: '2026-01-01T00:00:00.000Z', ...over }) as LifeProfile;

describe('the age to compute with', () => {
  it('prefers a birth year over the decade bucket', () => {
    expect(ageOf(profile({ birthYear: 1986, age: 45 }), TODAY)).toBe(40);
  });

  it('falls back to the bucket where there is no year', () => {
    expect(ageOf(profile({ age: 45 }), TODAY)).toBe(45);
  });

  it('is absent where nothing was said, rather than guessed', () => {
    expect(ageOf(profile(), TODAY)).toBeUndefined();
    expect(ageOf(null, TODAY)).toBeUndefined();
  });

  it('is right the day after a birthday without anybody telling it', () => {
    // A stored age goes stale. A year does not.
    expect(ageOf(profile({ birthYear: 1986 }), '2026-01-01')).toBe(40);
    expect(ageOf(profile({ birthYear: 1986 }), '2027-01-01')).toBe(41);
  });

  it('ignores a year that is not one', () => {
    for (const birthYear of [1800, 3000, 2026, 20.5]) {
      expect(ageOf(profile({ birthYear, age: 35 }), TODAY)).toBe(35);
    }
  });
});

describe('what counts as a birth year', () => {
  it('runs from the oldest plausible human to the youngest plausible user', () => {
    const { min, max } = birthYearRange(TODAY);
    expect(min).toBe(BIRTH_YEAR_MIN);
    expect(max).toBe(2026 - MIN_AGE);
    expect(isPlausibleBirthYear(1986, TODAY)).toBe(true);
    expect(isPlausibleBirthYear(max, TODAY)).toBe(true);
    expect(isPlausibleBirthYear(max + 1, TODAY)).toBe(false);
    expect(isPlausibleBirthYear(min - 1, TODAY)).toBe(false);
  });
});

describe('the error budget', () => {
  it('says half a year on a birth year and five on a decade', () => {
    expect(agePrecision(profile({ birthYear: 1986 }), TODAY)).toMatchObject({
      source: 'birthYear',
      plusMinus: 0.5,
      line: null,
    });
    const decade = agePrecision(profile({ age: 45 }), TODAY);
    expect(decade.source).toBe('decade');
    expect(decade.plusMinus).toBe(5);
    // And it says so on the screen, rather than only in a comment.
    expect(decade.line).toMatch(/decade rather than a year/);
  });

  it('says what is missing where nothing was given', () => {
    expect(agePrecision(profile(), TODAY)).toMatchObject({ source: 'none', plusMinus: null });
  });
});

describe('the question', () => {
  it('is asked in setup, in the health section, before the decade', () => {
    const ids = setupSteps({}).map((s) => s.step.id);
    expect(ids).toContain('birthYear');
    expect(ids.indexOf('birthYear')).toBeLessThan(ids.indexOf('age'));
  });

  it('never asks for both', () => {
    const asked = setupSteps({ birthYear: '1986' }).map((s) => s.step.id);
    expect(asked).toContain('birthYear');
    expect(asked).not.toContain('age');
  });

  it('still offers the decade to somebody who would rather not say a year', () => {
    expect(setupSteps({}).map((s) => s.step.id)).toContain('age');
  });

  it('is typed as a number', () => {
    const step = INTERVIEW_STEPS.find((s) => s.id === 'birthYear')!;
    expect(step.kind).toBe('text');
    expect(step.keyboardType).toBe('numeric');
    expect(step.optional).toBe(true);
  });
});

describe('through the plan builder', () => {
  const base = {
    name: 'Isaac',
    weekShape: 'standard',
    priorities: ['health'],
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '9-5',
    sleep: '6-22',
    energy: 'morning',
    trainingDays: '3',
    capacity: 'steady',
  };

  it('carries a year onto the profile', () => {
    const plan = buildLifeOperatingPlan({ ...base, birthYear: '1986' });
    expect(plan.profile.birthYear).toBe(1986);
    expect(ageOf(plan.profile, TODAY)).toBe(40);
  });

  it('drops a year that would poison the hazard model', () => {
    // An age of minus four hundred would otherwise propagate straight in.
    const plan = buildLifeOperatingPlan({ ...base, birthYear: '2400' });
    expect(plan.profile.birthYear).toBeUndefined();
  });
});
