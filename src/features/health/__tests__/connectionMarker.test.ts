/**
 * Connection, as a marker component.
 *
 * Nine components and not one about other people — in an app whose target
 * persona is defined partly by being social, whose library carries 24
 * connection practices, and which has a whole follow-through for turning
 * a message into a Saturday.
 *
 * These tests are about not overclaiming. The evidence is real and the
 * easiest way to spoil it is to assert more than the paper does.
 */

import {
  LONELINESS_PROVENANCE,
  LONELINESS_RR,
  lonelinessLogHazard,
  selfReportedFrom,
  type Loneliness,
} from '@/features/health/selfReport';
import { readPace, type PaceInputs } from '@/features/health/pace';
import { INTERVIEW_STEPS } from '@/features/onboarding/script';
import { SECTION_OF } from '@/features/onboarding/sections';

const base: PaceInputs = { age: 34, sexAtBirth: 'male' };

const connection = (input: PaceInputs) =>
  readPace(input).components.find((c) => c.id === 'connection')!;

describe('the hazard', () => {
  it('uses the published figure and nothing else', () => {
    // Holt-Lunstad 2015: loneliness OR 1.26.
    expect(LONELINESS_RR.often).toBe(1.26);
    expect(LONELINESS_RR.rarely).toBe(1.0);
    expect(lonelinessLogHazard('often')).toBeCloseTo(Math.log(1.26), 10);
    expect(lonelinessLogHazard('rarely')).toBe(0);
  });

  /**
   * The meta-analysis reports a BINARY contrast. A "sometimes" band would
   * need a number it does not contain, and for this construct it would
   * also assert a dose-response nobody established — the constituent
   * studies mostly dichotomised. Two real levels beats three with a guess
   * in the middle, which is the same call `SELF_RATED_HEALTH_RR` records.
   */
  it('has exactly two levels, because the evidence has two', () => {
    expect(Object.keys(LONELINESS_RR).sort()).toEqual(['often', 'rarely']);
  });

  it('never pays a bonus for feeling connected', () => {
    // Rarely-lonely is the REFERENCE, not a credit. The paper contrasts
    // lonely against not; it does not show that unusually connected people
    // do better than the reference, so claiming it would be invention.
    for (const level of Object.keys(LONELINESS_RR) as Loneliness[]) {
      expect(lonelinessLogHazard(level)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('the grade, and what it admits', () => {
  it('is graded B despite a sample that would carry A', () => {
    expect(LONELINESS_PROVENANCE.grade).toBe('B');
  });

  it('names reverse causation specifically, not as a formality', () => {
    // Illness isolates people, so part of this association runs the other
    // way. A generic "observational" caveat would hide that.
    expect(LONELINESS_PROVENANCE.caveat).toMatch(/reverse causation/i);
    expect(LONELINESS_PROVENANCE.caveat).toMatch(/illness isolates/i);
  });

  it('says it is not combining the subjective and objective measures', () => {
    // Loneliness 1.26 and living alone 1.32 come off the same data and
    // overlap heavily; adding them would count the same people twice.
    expect(LONELINESS_PROVENANCE.caveat).toMatch(/living alone/i);
    expect(LONELINESS_PROVENANCE.effect).toMatch(/1\.26|26%/);
  });

  it('carries a real citation', () => {
    expect(LONELINESS_PROVENANCE.study).toMatch(/Holt-Lunstad/);
    expect(LONELINESS_PROVENANCE.journal).toMatch(/Perspectives on Psychological Science/);
    expect(LONELINESS_PROVENANCE.sample).toMatch(/70 prospective studies/);
  });
});

describe('the component', () => {
  it('reads as self-reported, so the interval widens for it', () => {
    expect(connection({ ...base, loneliness: 'often' }).source).toBe('self-reported');
  });

  it('shows the answer in the words it was offered in', () => {
    expect(connection({ ...base, loneliness: 'often' }).detail).toBe('Often');
    expect(connection({ ...base, loneliness: 'rarely' }).detail).toBe('Rarely or never');
  });

  it('is unread rather than assumed when the question has not been put', () => {
    const c = connection(base);
    expect(c.source).toBeNull();
    expect(c.logHazard).toBeNull();
    expect(c.detail).toBe('Not asked yet');
    expect(c.blocked).toBeTruthy();
  });

  it('counts toward coverage only once it is answered', () => {
    const without = readPace(base);
    const with_ = readPace({ ...base, loneliness: 'rarely' });
    expect(with_.coverage.observed).toBe(without.coverage.observed + 1);
    expect(with_.coverage.total).toBe(without.coverage.total);
  });

  it('moves the reading in the direction the paper found', () => {
    const lonely = readPace({ ...base, loneliness: 'often' });
    const not = readPace({ ...base, loneliness: 'rarely' });
    expect(lonely.relativeHazard!).toBeGreaterThan(not.relativeHazard!);
    expect(lonely.yearsEquivalent!).toBeGreaterThan(not.yearsEquivalent!);
  });
});

describe('the question that feeds it', () => {
  const step = INTERVIEW_STEPS.find((s) => s.id === 'loneliness')!;

  it('exists, is optional, and offers the two published levels', () => {
    expect(step).toBeDefined();
    expect(step.optional).toBe(true);
    expect(step.kind).toBe('single');
    const options = typeof step.options === 'function' ? step.options({}) : step.options!;
    expect(options.map((o) => o.value).sort()).toEqual(['often', 'rarely']);
  });

  it('goes to the coach that owns the friendship ladder', () => {
    // `nextRung.laddersFor('relationship')` returns the friendship ladder,
    // so that coach is the one with somewhere to go after the answer.
    expect(step.deferTo).toBe('relationship');
  });

  it('has a home in setup, like every other question', () => {
    expect(SECTION_OF.loneliness).toBeTruthy();
  });

  it('is read back into the instrument, and junk is not', () => {
    expect(selfReportedFrom({ loneliness: 'often' }).loneliness).toBe('often');
    expect(selfReportedFrom({ loneliness: 'sometimes' }).loneliness).toBeUndefined();
    expect(selfReportedFrom({}).loneliness).toBeUndefined();
    expect(selfReportedFrom(undefined).loneliness).toBeUndefined();
  });
});
