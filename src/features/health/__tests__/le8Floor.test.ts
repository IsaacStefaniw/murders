/**
 * The Essential 8 component needs every part it can get before it pays out.
 *
 * Found 10 Nov 2026. Isaac asked how much younger he was; the instrument
 * answered **−6.5 years** from a profile whose only health input was one
 * night's sleep, while he vapes and had drunk four nights the week before.
 *
 * One night at 8.5 hours scores 100, the mean of one part is 100, and
 * `le8LogHazard(100)` is −1.1157 — which is −12.9 raw years and −7.7
 * after attenuation. It swamped everything else in the reading.
 *
 * ── Why this file is written the way it is ─────────────────────────────
 *
 * The first version of this suite passed while asserting nothing. One case
 * checked `BAND_MIN_COMPONENTS === 4` instead of exercising a reading at
 * four parts, and another wrapped its only assertion in
 * `if (strong.logHazard !== null)` — never true, because the floor I had
 * just set was higher than the number of parts that exist. Green, and
 * empty.
 *
 * So every case below asserts a value, never a constant, and nothing is
 * guarded by an `if`.
 */

import { sleepScore } from '@/features/health/essential8';
import { ATTENUATION, LE8_MIN_PARTS, MRDT_YEARS, readPace } from '@/features/health/pace';
import type { PaceInputs } from '@/features/health/pace';

const base: PaceInputs = { age: 38, sexAtBirth: 'male' };
const le8Of = (input: PaceInputs) => readPace(input).components.find((c) => c.id === 'le8')!;
/** All three parts `readPace` is able to score. */
const allThree: PaceInputs = { ...base, activityMinutes: 150, sleepHours: 7, bmi: 23 };

describe('his actual case', () => {
  it('does not pay out seven years for one night of sleep', () => {
    expect(sleepScore(8.5)).toBe(100);
    const reading = readPace({ ...base, sleepHours: 8.5 });
    expect(le8Of({ ...base, sleepHours: 8.5 }).logHazard).toBeNull();
    expect(reading.observed).toHaveLength(0);
    expect(reading.yearsEquivalent).toBeNull();
  });

  it('leaves the vape and the drink as the only things it can see', () => {
    const r = readPace({ ...base, sleepHours: 8.5, smoking: 'vapeOnly', drinking: 'moderate' });
    expect(r.observed.map((c) => c.id).sort()).toEqual(['alcohol', 'nicotine']);
    // Older, not younger — which is what two self-reported negatives mean.
    expect(r.yearsEquivalent).toBeCloseTo(1.6, 1);
  });
});

describe('the floor is all three parts, not four', () => {
  it('reads at three parts, with a real hazard rather than a null', () => {
    // The case the first fix broke: a floor of 4 on a pool of 3 made this
    // permanently null, and no test caught it.
    const le8 = le8Of(allThree);
    expect(le8.logHazard).not.toBeNull();
    expect(le8.source).toBe('measured');
    expect(le8.detail).toContain('3 of 8');
  });

  it('is silent at two parts and at one', () => {
    expect(le8Of({ ...base, sleepHours: 7, bmi: 23 }).logHazard).toBeNull();
    expect(le8Of({ ...base, sleepHours: 7 }).logHazard).toBeNull();
  });

  it('matches the number of parts that actually exist', () => {
    // Asserted through behaviour, not by reading the constant back: the
    // floor must be exactly satisfiable, so all-three reads and any
    // two-of-three does not.
    expect(LE8_MIN_PARTS).toBe(3);
    const pairs: PaceInputs[] = [
      { ...base, activityMinutes: 150, sleepHours: 7 },
      { ...base, activityMinutes: 150, bmi: 23 },
      { ...base, sleepHours: 7, bmi: 23 },
    ];
    for (const p of pairs) expect(le8Of(p).logHazard).toBeNull();
    expect(le8Of(allThree).logHazard).not.toBeNull();
  });

  it('a BMI misread takes it from readable to unread, which is the honest cost', () => {
    expect(le8Of(allThree).logHazard).not.toBeNull();
    expect(le8Of({ ...allThree, bmiMisread: true }).logHazard).toBeNull();
  });
});

describe('what the floor does and does not do', () => {
  it('still lets the component go negative once it is earned', () => {
    // Essential 8 is validated as linear across its full range and is one
    // of only two components here allowed an unbounded upside. The floor
    // must not quietly turn it into a penalty-only component. No `if`.
    const strong = le8Of({ ...base, activityMinutes: 300, sleepHours: 8, bmi: 23 });
    expect(strong.logHazard).toBeLessThan(0);
  });

  it('does NOT bound the pay-out, which is the part left open', () => {
    // Three parts all at 100 is still a mean of 100, so it still claims
    // the full credit of an eight-component construct from three. This
    // test exists to hold that defect visible rather than to bless it —
    // see LE8_MIN_PARTS for why closing it is a change of its own.
    const perfect = le8Of({ ...base, activityMinutes: 300, sleepHours: 8, bmi: 22 });
    const years = (perfect.logHazard! / Math.LN2) * MRDT_YEARS * ATTENUATION;
    expect(years).toBeLessThan(-5);
  });

  it('says why it is blocked rather than looking unmeasured', () => {
    expect(le8Of(base).blocked).toMatch(/Starts reading from your first/);
    expect(le8Of({ ...base, sleepHours: 8.5 }).blocked).toMatch(/1 of the 3 parts needed/);
    expect(le8Of(allThree).blocked).toBeUndefined();
  });
});
