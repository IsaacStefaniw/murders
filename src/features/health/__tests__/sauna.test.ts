/**
 * The sauna component — added and withdrawn on the same day.
 *
 * Isaac asked for the things the instrument could not see to be
 * incorporated. The research found a real hazard ratio: Laukkanen 2015,
 * JAMA Internal Medicine, Kuopio Ischaemic Heart Disease cohort, 2,315
 * Finnish men, 20.7 years, 929 deaths, four to seven sessions a week
 * against ONE at all-cause HR 0.60 (0.46-0.80).
 *
 * Then he asked why it showed as a negative, and checking it properly
 * turned up two things.
 *
 * The magnitude: ln(0.60) is -5.90 raw years, against current smoking at
 * +11.9 in this same instrument. Four saunas a week was worth half of
 * lifetime smoking in the opposite direction, from one observational
 * cohort of self-reporting men.
 *
 * The fault: the reference is ONE session a week, not none. Everybody in
 * that comparison saunas. relativeHazard is defined against somebody at
 * every component's reference level, and crediting the full 0.60 against
 * a person who has never used a sauna pays out against a baseline nobody
 * measured — the same error as the Essential 8 bug fixed that morning.
 *
 * So it is recorded and not scored, and these hold that line.
 */

import { readPace, SAUNA_MIN_SESSIONS, saunaLogHazard } from '@/features/health/pace';
import { SMOKING_RR } from '@/features/health/negativeHabits';
import type { PaceInputs } from '@/features/health/pace';

const base: PaceInputs = { age: 38, sexAtBirth: 'male' };
const saunaOf = (i: PaceInputs) => readPace(i).components.find((c) => c.id === 'sauna')!;

describe('it is recorded and not scored', () => {
  it('scores zero at every frequency, including the published band', () => {
    for (const n of [0, 1, 2, 3, 3.5, 4, 7, 14]) expect(saunaLogHazard(n)).toBe(0);
  });

  it('never contributes to the reading', () => {
    const none = readPace({ ...base, smoking: 'vapeOnly', drinking: 'moderate' });
    for (const n of [3, 4, 7]) {
      const r = readPace({ ...base, smoking: 'vapeOnly', drinking: 'moderate', saunaPerWeek: n });
      expect(r.yearsEquivalent).toBeCloseTo(none.yearsEquivalent!, 10);
    }
  });

  it('is never counted as observed, so coverage does not overstate', () => {
    // A component that cannot move the figure must not inflate the
    // "3 of 11 markers" the headline leans on.
    expect(readPace({ ...base, saunaPerWeek: 4 }).observed.map((c) => c.id)).not.toContain('sauna');
  });

  it('still shows what he does, rather than reading as unasked', () => {
    const c = saunaOf({ ...base, saunaPerWeek: 3.5 });
    expect(c.detail).toBe('3.5 a week, recorded and not scored');
    expect(c.source).toBe('self-reported');
  });

  it('says the reason, and the reason is the reference level', () => {
    const c = saunaOf({ ...base, saunaPerWeek: 4 });
    expect(c.blocked).toMatch(/against ONE, not against none/);
    expect(c.blocked).toMatch(/wrong baseline/);
  });

  it('asks the question when it has no answer', () => {
    expect(saunaOf(base).detail).toBe('Not asked yet');
    expect(saunaOf(base).blocked).toMatch(/sessions in a usual week/);
  });
});

describe('why the magnitude could not stand', () => {
  it('would have been half of lifetime smoking, in the other direction', () => {
    const MRDT = 8;
    const saunaYears = (Math.log(0.6) / Math.LN2) * MRDT;
    const smokingYears = (Math.log(SMOKING_RR.current) / Math.LN2) * MRDT;
    expect(saunaYears).toBeCloseTo(-5.9, 1);
    expect(smokingYears).toBeCloseTo(11.9, 1);
    // One observational cohort of 2,315 self-reporting men, against a
    // 200,000-person linkage. The ratio is the argument.
    expect(Math.abs(saunaYears) / smokingYears).toBeGreaterThan(0.45);
  });
});

describe('the evidence is kept on the page', () => {
  it('carries the full provenance even though it scores nothing', () => {
    const c = saunaOf({ ...base, saunaPerWeek: 4 });
    expect(c.provenance.study).toMatch(/Laukkanen/);
    expect(c.provenance.grade).toBe('C');
    expect(c.provenance.effect).toMatch(/versus one/i);
    expect(c.provenance.caveat).toMatch(/healthy-user/i);
    expect(SAUNA_MIN_SESSIONS).toBe(4);
  });
});
