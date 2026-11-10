/**
 * The sauna component — the one thing the research turned up that moves.
 *
 * Isaac, 10 Nov 2026: "How do we ensure they're incorporated — do
 * research and change, don't rely on our past app." He was objecting to
 * a reading that could not see a twenty-year habit, and he was right.
 *
 * Laukkanen 2015, JAMA Internal Medicine, Kuopio Ischaemic Heart Disease
 * cohort: 2,315 Finnish men, 20.7 years, 929 deaths. Four to seven
 * sessions a week against one, all-cause HR 0.60 (0.46-0.80).
 *
 * The hard part of this component is the threshold, not the hazard.
 */

import {
  readPace,
  SAUNA_FREQUENT_HR,
  SAUNA_MIN_SESSIONS,
  saunaLogHazard,
} from '@/features/health/pace';
import type { PaceInputs } from '@/features/health/pace';

const base: PaceInputs = { age: 38, sexAtBirth: 'male' };
const saunaOf = (i: PaceInputs) => readPace(i).components.find((c) => c.id === 'sauna')!;

describe('the threshold is four, because the band is four to seven', () => {
  it('scores nothing at three a week rather than interpolating', () => {
    // The paper's reference is one session and its band is 4-7. The 2-3
    // figure is not one we have, and inventing it is the thing this file
    // exists not to do.
    expect(saunaLogHazard(3)).toBe(0);
    expect(saunaLogHazard(3.5)).toBe(0);
    expect(saunaLogHazard(0)).toBe(0);
  });

  it('pays the published hazard at four and above', () => {
    expect(saunaLogHazard(4)).toBeCloseTo(Math.log(SAUNA_FREQUENT_HR), 10);
    expect(saunaLogHazard(7)).toBe(saunaLogHazard(4));
  });

  it('does not keep paying out above the band', () => {
    // Nobody measured ten a week. The cohort's top group is 4-7 and the
    // component is flat across it rather than dose-responsive.
    expect(saunaLogHazard(10)).toBe(saunaLogHazard(4));
    expect(SAUNA_MIN_SESSIONS).toBe(4);
  });

  it('says WHY three scores nothing, rather than looking unmeasured', () => {
    const three = saunaOf({ ...base, saunaPerWeek: 3 });
    expect(three.logHazard).toBe(0);
    expect(three.detail).toMatch(/published band is 4–7/);
    expect(three.opportunity).toMatch(/fourth session/);
  });
});

describe('what it does to a reading', () => {
  it('is worth about four years at four a week, after attenuation', () => {
    const without = readPace({ ...base, smoking: 'vapeOnly', drinking: 'moderate' });
    const with4 = readPace({ ...base, smoking: 'vapeOnly', drinking: 'moderate', saunaPerWeek: 4 });
    expect(without.yearsEquivalent).toBeGreaterThan(0);
    // ln(0.6)/ln(2) * 8 * 0.6 = about -3.5 years.
    const moved = with4.yearsEquivalent! - without.yearsEquivalent!;
    expect(moved).toBeLessThan(-3);
    expect(moved).toBeGreaterThan(-4);
  });

  it('changes nothing at three a week, which is the honest half', () => {
    const three = readPace({ ...base, smoking: 'vapeOnly', drinking: 'moderate', saunaPerWeek: 3 });
    const none = readPace({ ...base, smoking: 'vapeOnly', drinking: 'moderate' });
    // Observed, because zero is a reading against the reference level —
    // but it moves nothing.
    expect(three.yearsEquivalent).toBeCloseTo(none.yearsEquivalent!, 6);
  });

  it('is observed once asked, so coverage reflects the question', () => {
    expect(readPace(base).observed.map((c) => c.id)).not.toContain('sauna');
    expect(readPace({ ...base, saunaPerWeek: 3 }).observed.map((c) => c.id)).toContain('sauna');
  });
});

describe('what it is honest about', () => {
  it('carries the healthy-user problem in its own provenance', () => {
    const c = saunaOf({ ...base, saunaPerWeek: 4 });
    expect(c.provenance.grade).toBe('C');
    expect(c.provenance.caveat).toMatch(/healthy-user/i);
    expect(c.provenance.caveat).toMatch(/men only/i);
    expect(c.provenance.sample).toMatch(/2,315/);
  });

  it('is self-reported, never measured', () => {
    // It is a remembered weekly count. The interval should say so.
    expect(saunaOf({ ...base, saunaPerWeek: 4 }).source).toBe('self-reported');
  });

  it('asks one question when it has nothing', () => {
    expect(saunaOf(base).logHazard).toBeNull();
    expect(saunaOf(base).blocked).toMatch(/sessions in a usual week/);
  });
});
