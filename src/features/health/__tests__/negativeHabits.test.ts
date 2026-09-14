/**
 * "Don't forget to ask negative habits as well?"
 *
 * The largest hole in the day-one reading. The app only knew somebody
 * smoked if they had ALREADY decided to quit and set up an intention — so
 * a person who smokes and is not yet ready to stop was invisible on the
 * single largest modifiable component there is.
 *
 * These pin the evidence, the two filing decisions that follow from it,
 * and the framing rule: for the components where cessation has been
 * measured, what gets shown is the gain.
 */

import {
  DRINKING_YEARS_LOST,
  SMOKING_RR,
  drinkingLogHazard,
  negativeHabitsFrom,
  smokingLogHazard,
  yearsFromQuitting,
} from '@/features/health/negativeHabits';
import { MRDT_YEARS, readPace, type PaceInputs } from '@/features/health/pace';

const base: PaceInputs = { age: 45, sexAtBirth: 'male' };

describe('smoking, from Jha', () => {
  it('carries the published direction and size', () => {
    expect(SMOKING_RR.never).toBe(1);
    expect(smokingLogHazard('never')).toBe(0);
    expect(SMOKING_RR.current).toBeGreaterThan(2);
    // The excess narrows with time since stopping, which is the paper's
    // central finding and the reason to ask at all.
    expect(SMOKING_RR.quitLongAgo).toBeLessThan(SMOKING_RR.quitRecently);
    expect(SMOKING_RR.quitRecently).toBeLessThan(SMOKING_RR.current);
  });

  it('lands near a decade for a current smoker, as the study found', () => {
    // The whole reason nicotine left the Essential 8 sub-score: there it
    // was one component of eight and worth about a year.
    const years = (Math.log(SMOKING_RR.current) / Math.LN2) * MRDT_YEARS;
    expect(years).toBeGreaterThan(9);
    expect(years).toBeLessThan(13);
  });

  it('scales the cessation gain by age, as the paper does', () => {
    expect(yearsFromQuitting(30)).toMatch(/ten/);
    expect(yearsFromQuitting(40)).toMatch(/nine/);
    expect(yearsFromQuitting(50)).toMatch(/six/);
    // And never says the benefit runs out.
    expect(yearsFromQuitting(70)).toMatch(/does not run out/);
  });

  it('is not counted twice — nicotine left the Essential 8 sub-score', () => {
    // Same person, told and not told. The Essential 8 component must read
    // the same either way, or smoking is in the total twice.
    const told = readPace({ ...base, smoking: 'current', activityMinutes: 150, sleepHours: 7, bmi: 23 });
    const not = readPace({ ...base, activityMinutes: 150, sleepHours: 7, bmi: 23 });
    const le8Told = told.components.find((c) => c.id === 'le8')!;
    const le8Not = not.components.find((c) => c.id === 'le8')!;
    expect(le8Told.logHazard).toBe(le8Not.logHazard);
    expect(le8Told.detail).toMatch(/3 of 8/);
  });

  it('uses what they told us ahead of what the behaviour log inferred', () => {
    const both = readPace({ ...base, smoking: 'never', nicotine: 'smokesNow' });
    const smoking = both.components.find((c) => c.id === 'nicotine')!;
    expect(smoking.logHazard).toBe(0);
    expect(smoking.source).toBe('self-reported');
  });

  it('still falls back to the behaviour log for somebody who was not asked', () => {
    const inferred = readPace({ ...base, nicotine: 'smokesNow' });
    const smoking = inferred.components.find((c) => c.id === 'nicotine')!;
    expect(smoking.logHazard).toBeGreaterThan(0);
    expect(smoking.source).toBe('measured');
  });

  it('says plainly that the vaping figure is a judgement, not a finding', () => {
    // There is no long-term mortality cohort for vaping. Anybody quoting a
    // hazard ratio for it is quoting something that does not exist.
    const c = readPace({ ...base, smoking: 'vapeOnly' }).components.find((x) => x.id === 'nicotine')!;
    expect(c.provenance.caveat).toMatch(/no long-term mortality cohort/i);
    expect(c.provenance.caveat).toMatch(/judgement rather than a measured outcome/i);
  });
});

describe('alcohol, from Wood', () => {
  it('puts the reference where the pooled data does', () => {
    // 100g a week is ten Australian standard drinks — the same number the
    // national guideline lands on, from a completely separate direction.
    expect(DRINKING_YEARS_LOST.lowRisk).toBe(0);
    expect(drinkingLogHazard('lowRisk')).toBe(0);
    expect(drinkingLogHazard('none')).toBe(0);
  });

  it('rises with the bands, in the paper’s own life-expectancy terms', () => {
    expect(DRINKING_YEARS_LOST.moderate).toBeLessThan(DRINKING_YEARS_LOST.high);
    expect(DRINKING_YEARS_LOST.high).toBeLessThan(DRINKING_YEARS_LOST.veryHigh);
    // Converted through the same Gompertz doubling everything else uses.
    const years = (drinkingLogHazard('veryHigh') / Math.LN2) * MRDT_YEARS;
    expect(years).toBeCloseTo(DRINKING_YEARS_LOST.veryHigh, 6);
  });

  it('says it cannot speak to whether none beats a little', () => {
    // Current drinkers only. People who stopped often stopped for a reason.
    const c = readPace({ ...base, drinking: 'lowRisk' }).components.find((x) => x.id === 'alcohol')!;
    expect(c.provenance.caveat).toMatch(/current drinkers only/i);
  });
});

describe('how these are put to somebody', () => {
  it('leads with the gain for a smoker, not the deficit', () => {
    // The only place in the app that quantifies the size of the prize, and
    // it cannot do that without having asked.
    // Age 45 sits in Jha's 45–54 band, which returned about six years.
    const c = readPace({ ...base, smoking: 'current' }).components.find((x) => x.id === 'nicotine')!;
    expect(c.opportunity).toBeTruthy();
    expect(c.opportunity).toMatch(/stopping now returns about six/i);
    // And a younger smoker is told the larger number, because it is theirs.
    const younger = readPace({ ...base, age: 32, smoking: 'current' }).components.find(
      (x) => x.id === 'nicotine',
    )!;
    expect(younger.opportunity).toMatch(/about ten/i);
  });

  it('offers no opportunity where the evidence does not support one', () => {
    // Grip predicts mortality; nobody has shown that training grip moves
    // it. So there is no number to offer, and none is invented.
    const c = readPace({ ...base, gripKg: 20 }).components.find((x) => x.id === 'grip')!;
    expect(c.opportunity).toBeUndefined();
  });

  it('tells an ex-smoker the clock is already working for them', () => {
    const c = readPace({ ...base, smoking: 'quitRecently' }).components.find((x) => x.id === 'nicotine')!;
    expect(c.opportunity).toMatch(/improves on its own/i);
  });

  it('describes the behaviour, never labels the person', () => {
    // catalog.ts settled this: say what it DOES, never that they ARE.
    for (const status of ['never', 'quitLongAgo', 'quitRecently', 'vapeOnly', 'current'] as const) {
      const c = readPace({ ...base, smoking: status }).components.find((x) => x.id === 'nicotine')!;
      expect(c.detail.toLowerCase()).not.toMatch(/\bsmoker\b|\balcoholic\b|\bheavy drinker\b/);
    }
    for (const band of ['none', 'lowRisk', 'moderate', 'high', 'veryHigh'] as const) {
      const c = readPace({ ...base, drinking: band }).components.find((x) => x.id === 'alcohol')!;
      expect(c.detail.toLowerCase()).not.toMatch(/\bheavy\b|\bproblem\b|\bexcessive\b/);
    }
  });
});

describe('reading the answers', () => {
  it('takes both, and tolerates either being skipped', () => {
    expect(negativeHabitsFrom({ smokingStatus: 'current', drinkingBand: 'high' })).toEqual({
      smoking: 'current',
      drinking: 'high',
    });
    expect(negativeHabitsFrom({ smokingStatus: 'current' })).toEqual({ smoking: 'current' });
    expect(negativeHabitsFrom({})).toEqual({});
    expect(negativeHabitsFrom(undefined)).toEqual({});
  });

  it('does not accept junk as an answer', () => {
    expect(negativeHabitsFrom({ smokingStatus: 'sometimes', drinkingBand: 'lots' })).toEqual({});
  });
});
