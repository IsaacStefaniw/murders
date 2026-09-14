import {
  COMPARISON_CLASS,
  generalPopulationNote,
  strengthProfile,
} from '@/features/training/standards';
import type { LifeProfile } from '@/types/domain';

const man = (weightKg: number, age = 35) =>
  ({ weightKg, sexAtBirth: 'male', age }) as LifeProfile;

/** Isaac's lifts, which the app called "Beginner". */
const ISAAC = { bench: 130, squat: 120, deadlift: 140 };

describe('a person is not one word', () => {
  it('never leads with the weakest lift for an uneven profile', () => {
    const p = strengthProfile(ISAAC, man(90));
    expect(p.even).toBe(false);
    // The bug: the median of [intermediate, beginner, beginner] is
    // "beginner", and that is what a 130 kg bench used to be called.
    expect(p.headline.toLowerCase()).not.toContain('beginner');
    expect(p.headline).toContain('bench');
  });

  it('leads with the general population, which is the question being asked', () => {
    // 1.44x at 90 kg and 1.63x at 80 kg are both the top tenth of men.
    // "Intermediate bench" is a true sentence about a room of powerlifters
    // and it is not what anybody wants to know.
    expect(strengthProfile(ISAAC, man(90)).headline).toBe('Your bench is in the top tenth of men');
    expect(strengthProfile(ISAAC, man(80)).headline).toBe('Your bench is in the top tenth of men');
  });

  it('falls back to the lift shape where no population reading exists', () => {
    // Women and the non-bench lifts have no general-population figure we
    // are willing to state, so the shape is what is left.
    const woman = { weightKg: 70, sexAtBirth: 'female', age: 35 } as LifeProfile;
    expect(strengthProfile(ISAAC, woman).headline).toMatch(/bench$/);
  });

  it('names the gap as the thing to train, not as a verdict', () => {
    const detail = strengthProfile(ISAAC, man(90)).detail;
    expect(detail).toContain('squat');
    expect(detail).toContain('deadlift');
    expect(detail).toMatch(/worth training/);
    expect(detail).toMatch(/uneven profile is the normal one/);
  });

  it('returns every lift with its own band, strongest first', () => {
    const { lifts } = strengthProfile(ISAAC, man(90));
    expect(lifts.map((l) => l.lift)).toEqual(['bench', 'deadlift', 'squat']);
    expect(lifts[0].ratio).toBeCloseTo(130 / 90, 2);
  });

  it('still gives one word when the lifts genuinely agree', () => {
    // 0.80x, 1.11x, 1.44x at 90 kg — all three inside the bottom band.
    const even = strengthProfile({ bench: 72, squat: 100, deadlift: 130 }, man(90));
    expect(even.even).toBe(true);
    expect(even.headline).toBe('Beginner');
    expect(even.detail).toMatch(/All 3 of your main lifts/);
  });

  it('says so when there is nothing to place', () => {
    expect(strengthProfile({}, man(90)).headline).toBe('Not enough to say yet');
  });

  it('places nothing without a bodyweight to divide by', () => {
    expect(strengthProfile(ISAAC, { sexAtBirth: 'male' } as LifeProfile).lifts).toEqual([]);
  });
});

describe('against whom', () => {
  it('names the comparison class, which the screen used to leave out', () => {
    expect(COMPARISON_CLASS).toContain('people who train');
  });

  it('orients a bench against the general population too', () => {
    // 1.44x — Isaac at 90 kg. Mid-pack among lifters, top tenth of men.
    expect(generalPopulationNote('bench', 130 / 90, { sexAtBirth: 'male' })).toMatch(/top ten percent/);
    expect(generalPopulationNote('bench', 1.8, { sexAtBirth: 'male' })).toMatch(/top one percent/);
    expect(generalPopulationNote('bench', 1.05, { sexAtBirth: 'male' })).toMatch(/above the median/);
    expect(generalPopulationNote('bench', 0.8, { sexAtBirth: 'male' })).toMatch(/about one times/);
  });

  it('claims nothing where the sources do not support a claim', () => {
    // The female figures disagree by a factor of two and all trace back to
    // lifting culture rather than population testing. Silence beats a
    // number invented to make the feature symmetrical.
    expect(generalPopulationNote('bench', 1.4, { sexAtBirth: 'female' })).toBeNull();
    // And no general-population claim for squat or deadlift at all: most
    // adults have never attempted a one-rep max on either.
    expect(generalPopulationNote('squat', 2.0, { sexAtBirth: 'male' })).toBeNull();
    expect(generalPopulationNote('deadlift', 2.5, { sexAtBirth: 'male' })).toBeNull();
  });
});
