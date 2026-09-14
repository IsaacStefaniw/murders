/**
 * "This metric could be something we own... It should compile and compound
 * from many studies... but proprietary scoring or supporting is similar to
 * other offerings suggesting people's biological age."
 *
 * Two things to pin. First the arithmetic: every coefficient traces to a
 * published effect and none of them is ours. Second — and this is the part
 * that decides whether the instrument is worth owning — the constraints
 * that keep it from becoming the thing Isaac named. A weighted
 * questionnaire with an age-shaped number on the end is easy to build and
 * worth nothing, and the only defence against drifting into one is tests
 * that fail when it starts happening.
 */

import {
  ATTENUATION,
  CALIBRATION_REQUIREMENTS,
  FORBIDDEN_CLAIMS,
  FORBIDDEN_SELF_CLAIMS,
  MRDT_YEARS,
  PACE_MIN_READINGS,
  PACE_MIN_SPAN_DAYS,
  PROVISIONAL,
  balanceLogHazard,
  fitnessLogHazard,
  gaitLogHazard,
  gripLogHazard,
  le8LogHazard,
  MEASUREMENT_SE_YEARS,
  paceHeadline,
  paceOverTime,
  paceShareText,
  readPace,
  type PaceInputs,
} from '@/features/health/pace';
import { FUNCTION_TESTS } from '@/features/health/functionTests';

const BALANCE_LN = Math.log(1.8);

/* ── Provenance: the thing that makes this compilable ─────────────────── */

describe('every component traces to a study', () => {
  const reading = readPace({ age: 40 });

  it('carries a full citation, sample, design, effect and caveat', () => {
    for (const c of reading.components) {
      expect(c.provenance.study).toMatch(/\d{4}/);
      expect(c.provenance.journal.length).toBeGreaterThan(3);
      // Sample size, in numerals, so nobody can wave at "large cohorts".
      expect(c.provenance.sample).toMatch(/[\d,]{3,}/);
      expect(c.provenance.effect.length).toBeGreaterThan(30);
      expect(['A', 'B', 'C', 'D']).toContain(c.provenance.grade);
    }
  });

  it('states what would most easily make each one wrong', () => {
    // A citation without its caveat is a citation being used as decoration.
    for (const c of reading.components) {
      expect(c.provenance.caveat.length).toBeGreaterThan(40);
    }
  });

  it('explains why a component cannot be read, wherever it cannot', () => {
    for (const c of reading.components) {
      if (c.logHazard === null) expect(c.blocked).toBeTruthy();
    }
  });
});

/* ── The published effects ────────────────────────────────────────────── */

describe('grip, from PURE', () => {
  it('adds 16% hazard per 5 kg below the threshold', () => {
    // EWGSOP2 thresholds: 27 kg men, 16 kg women.
    expect(Math.exp(gripLogHazard(22, 'male'))).toBeCloseTo(1.16, 3);
    expect(Math.exp(gripLogHazard(17, 'male'))).toBeCloseTo(1.16 ** 2, 3);
    expect(Math.exp(gripLogHazard(11, 'female'))).toBeCloseTo(1.16, 3);
  });

  it('never turns strength into a bonus', () => {
    // PURE reports a DECREMENT effect. Reading it backwards as an unbounded
    // reward for being strong is an extrapolation the paper does not carry.
    expect(gripLogHazard(27, 'male')).toBe(0);
    expect(gripLogHazard(90, 'male')).toBe(0);
  });
});

describe('balance, from Araujo', () => {
  it('is binary, because the study was binary', () => {
    // Eleven seconds and forty seconds are the same result. The paper
    // licenses no dose curve and inventing one is the move to avoid.
    expect(balanceLogHazard(11)).toBe(0);
    expect(balanceLogHazard(40)).toBe(0);
    expect(balanceLogHazard(10)).toBe(0);
    expect(Math.exp(balanceLogHazard(9))).toBeCloseTo(1.8, 5);
    expect(Math.exp(balanceLogHazard(0))).toBeCloseTo(1.8, 5);
  });
});

describe('gait speed, from Studenski', () => {
  it('references 0.8 m/s and worsens below it', () => {
    expect(gaitLogHazard(0.8)).toBe(0);
    expect(Math.exp(gaitLogHazard(0.7))).toBeCloseTo(1 / 0.88, 3);
    expect(Math.exp(gaitLogHazard(0.6))).toBeCloseTo((1 / 0.88) ** 2, 3);
  });

  it('does not pay a bonus for walking fast', () => {
    expect(gaitLogHazard(1.2)).toBe(0);
    // And is capped, so a mistyped 9 m/s cannot produce a silly number.
    expect(gaitLogHazard(9)).toBe(0);
  });
});

describe('fitness, from Mandsager', () => {
  it('grades against what is expected for the age, not one flat number', () => {
    // 40 ml/kg/min is ordinary at 30 and exceptional at 65. One threshold
    // for both would be wrong for everybody.
    expect(fitnessLogHazard(40, 30)).toBeGreaterThan(fitnessLogHazard(40, 65));
  });

  it('runs in the direction the paper found, with no ceiling on benefit', () => {
    expect(fitnessLogHazard(60, 40)).toBeLessThan(0);
    expect(fitnessLogHazard(20, 40)).toBeGreaterThan(0);
  });
});

describe('the behaviours, from Life’s Essential 8', () => {
  it('references 50 — the construct’s own low/intermediate boundary', () => {
    expect(le8LogHazard(50)).toBe(0);
    expect(Math.exp(le8LogHazard(40))).toBeCloseTo(1 / 0.8, 3);
    expect(Math.exp(le8LogHazard(60))).toBeCloseTo(0.8, 3);
  });
});

/* ── Combining them, and being honest about it ────────────────────────── */

function inputs(over: Partial<PaceInputs> = {}): PaceInputs {
  return { age: 45, sexAtBirth: 'male', ...over };
}

describe('one reading', () => {
  it('reads nothing where nothing was measured', () => {
    const out = readPace(inputs());
    expect(out.relativeHazard).toBeNull();
    expect(out.yearsEquivalent).toBeNull();
    expect(out.coverage.observed).toBe(0);
  });

  it('shrinks the naive sum, and says the shrinkage is a judgement', () => {
    // Correlated predictors and different adjustment sets mean the unshrunk
    // sum overstates. ATTENUATION is the correction and the single largest
    // source of error here, which is why it is a named constant.
    const out = readPace(inputs({ balanceSeconds: 5, gaitMs: 0.7 }));
    const naive = balanceLogHazard(5) + gaitLogHazard(0.7);
    expect(Math.log(out.relativeHazard!)).toBeCloseTo(naive * ATTENUATION, 6);
    expect(ATTENUATION).toBeLessThan(1);
  });

  it('converts hazard to years through the Gompertz doubling time', () => {
    // A doubled hazard is about eight years of ageing. That is the only
    // reason a hazard ratio may be spoken about in years at all.
    const out = readPace(inputs({ balanceSeconds: 0 }));
    const expectedYears =
      (Math.log(Math.exp(BALANCE_LN * ATTENUATION)) / Math.log(2)) * MRDT_YEARS;
    expect(out.yearsEquivalent).toBeCloseTo(expectedYears, 6);
    expect(MRDT_YEARS).toBe(8);
  });

  it('references a healthy person, not an average one', () => {
    // Everything at its reference level contributes nothing, so 1.0 means
    // "no added hazard from anything measured" rather than "typical".
    const out = readPace(
      inputs({ balanceSeconds: 30, gaitMs: 1.2, gripKg: 50 }),
    );
    expect(out.relativeHazard).toBeCloseTo(1, 6);
    expect(out.yearsEquivalent).toBeCloseTo(0, 6);
  });

  it('counts coverage, so a two-component reading cannot pass as a whole one', () => {
    const out = readPace(inputs({ balanceSeconds: 12, gaitMs: 1.0 }));
    expect(out.coverage).toEqual({ observed: 2, total: 5 });
  });

  it('will not read grip without the sex the thresholds are specific to', () => {
    const out = readPace(inputs({ sexAtBirth: 'preferNotToSay', gripKg: 20 }));
    const grip = out.components.find((c) => c.id === 'grip')!;
    expect(grip.logHazard).toBeNull();
    expect(grip.blocked).toMatch(/sex-specific/);
  });
});

/* ── The rate: the part that needs our own data ───────────────────────── */

describe('pace over time', () => {
  const series = (n: number, stepDays: number, perYear: number) =>
    Array.from({ length: n }, (_, i) => ({
      date: new Date(Date.UTC(2025, 0, 1) + i * stepDays * 86_400_000)
        .toISOString()
        .slice(0, 10),
      yearsEquivalent: (i * stepDays * perYear) / 365.25,
    }));

  it('refuses a slope from too few readings', () => {
    // A line through two points a fortnight apart is an artefact of how
    // well somebody slept before the second one.
    expect(paceOverTime(series(2, 200, 0.5))).toBeNull();
    expect(PACE_MIN_READINGS).toBeGreaterThanOrEqual(3);
  });

  it('refuses a slope from too short a span', () => {
    expect(paceOverTime(series(6, 10, 0.5))).toBeNull();
    expect(PACE_MIN_SPAN_DAYS).toBeGreaterThanOrEqual(180);
  });

  it('reads 1.0 for somebody holding steady', () => {
    // Ordinary ageing: one biological year per calendar year, because the
    // offset is not moving.
    expect(paceOverTime(series(6, 90, 0))!.pace).toBeCloseTo(1, 6);
  });

  it('reads above 1 when the offset is growing, below when it shrinks', () => {
    expect(paceOverTime(series(6, 90, 0.4))!.pace).toBeCloseTo(1.4, 4);
    expect(paceOverTime(series(6, 90, -0.3))!.pace).toBeCloseTo(0.7, 4);
  });

  it('keeps confidence low until there is a real series behind it', () => {
    expect(paceOverTime(series(3, 90, 0.2))!.confidence).toBe('low');
    expect(paceOverTime(series(6, 90, 0.2))!.confidence).toBe('moderate');
  });
});

/* ── The constraints that keep this from becoming the other thing ─────── */

describe('what this instrument may never do', () => {
  it('stays provisional until the coefficients are our own', () => {
    // Every coefficient above is borrowed from somebody else's cohort.
    // Until they are fitted on our own people against observed outcomes,
    // nothing may render this without saying so.
    expect(PROVISIONAL).toBe(true);
  });

  it('names what calibration would actually require', () => {
    expect(CALIBRATION_REQUIREMENTS.length).toBeGreaterThanOrEqual(5);
    const all = CALIBRATION_REQUIREMENTS.join(' ');
    expect(all).toMatch(/consent/i);
    expect(all).toMatch(/analysis plan|statistician/i);
    // And says out loud that this is years away, rather than implying a
    // quarter's work.
    expect(all).toMatch(/years, not quarters/i);
  });

  it('forbids the claims the category actually makes', () => {
    for (const claim of ['your biological age is', 'reverse your age', 'clinically proven']) {
      expect(FORBIDDEN_CLAIMS).toContain(claim);
    }
  });

  it('makes no forbidden claim anywhere in its copy', () => {
    const reading = readPace(inputs({ balanceSeconds: 4, gaitMs: 0.6, gripKg: 20 }));
    const copy = [
      ...reading.components.map((c) => `${c.label} ${c.measures} ${c.detail} ${c.blocked ?? ''}`),
      ...reading.components.map((c) => `${c.provenance.effect} ${c.provenance.caveat}`),
      ...FUNCTION_TESTS.map((t) => `${t.measures} ${t.evidence} ${t.safety}`),
    ]
      .join(' ')
      .toLowerCase();
    for (const claim of FORBIDDEN_CLAIMS) {
      expect(copy).not.toContain(claim);
    }
  });

  it('never claims validation for ITSELF, while still describing others\u2019', () => {
    // The distinction is the point. "The SPPB is validated in older adults"
    // is a true sentence about thirty years of other people's work.
    // "Our pace score is validated" is a lie until PROVISIONAL is false.
    const reading = readPace(inputs({ balanceSeconds: 4, gaitMs: 0.6, gripKg: 20 }));
    const ownWords = reading.components
      .map((c) => `${c.label} ${c.measures} ${c.detail} ${c.blocked ?? ''}`)
      .join(' ')
      .toLowerCase();
    for (const word of FORBIDDEN_SELF_CLAIMS) {
      expect(ownWords).not.toContain(word);
    }
    // And the permitted use survives, so the rule is a scalpel not a ban.
    const sppb = FUNCTION_TESTS.find((t) => t.id === 'sitToStand')!;
    expect(sppb.evidence).toContain('validated in older adults');
  });

  it('describes every function test as observational, with a safety line', () => {
    for (const t of FUNCTION_TESTS) {
      expect(t.safety.length).toBeGreaterThan(40);
      expect(t.evidence).toMatch(/[\d,]{3,}/);
      expect(t.steps.length).toBeGreaterThanOrEqual(4);
    }
  });
});

/* ── The headline, which Isaac chose over showing components alone ────── */

describe('the headline figure', () => {
  const strong = readPace(
    inputs({ age: 45, gripKg: 50, balanceSeconds: 30, gaitMs: 1.3, vo2max: 48 }),
  );

  it('cannot be obtained without its interval and its coverage', () => {
    // Not a convention — a type guarantee. plusMinus and coverage are
    // non-optional fields on PaceHeadline, so there is no code path that
    // hands a caller the number alone. The failure mode of every product
    // in this category is a confident numeral with the width stripped off.
    const h = paceHeadline(strong, 45)!;
    expect(h.plusMinus).toBeGreaterThan(0);
    expect(h.coverage.total).toBe(5);
    expect(h.qualifier).toMatch(/give or take/i);
    expect(h.qualifier).toMatch(/not a biological age/i);
  });

  it('refuses to exist with no age or no readings', () => {
    // A headline built on nothing is exactly the artefact this module is
    // for avoiding.
    expect(paceHeadline(strong, undefined)).toBeNull();
    expect(paceHeadline(readPace(inputs()), 45)).toBeNull();
  });

  it('widens the interval for every marker it could not read', () => {
    const one = paceHeadline(readPace(inputs({ balanceSeconds: 30 })), 45)!;
    const four = paceHeadline(strong, 45)!;
    expect(one.plusMinus).toBeGreaterThan(four.plusMinus);
  });

  it('keeps an interval even when every marker sits at its reference', () => {
    // The estimation error is proportional to the effect, so somebody
    // average on everything would otherwise be handed a suspiciously
    // confident number. Grip varies between mornings; a measurement is not
    // certain for having come out at the reference.
    const h = paceHeadline(strong, 45)!;
    expect(strong.yearsEquivalent).toBeLessThanOrEqual(0);
    expect(h.plusMinus).toBeGreaterThanOrEqual(Math.round(1.96 * MEASUREMENT_SE_YEARS));
  });

  it('never claims better precision than the measurement floor allows', () => {
    // Five components at the test-retest floor is about ±5 years, and
    // nothing may promise better than that.
    const floor = Math.round(1.96 * Math.sqrt(5) * MEASUREMENT_SE_YEARS);
    for (const age of [30, 45, 68]) {
      const h = paceHeadline(
        readPace(inputs({ age, gripKg: 50, balanceSeconds: 30, gaitMs: 1.3, vo2max: 48, activityMinutes: 200, sleepHours: 7.5, bmi: 23, nicotine: 'never' })),
        age,
      )!;
      expect(h.plusMinus).toBeGreaterThanOrEqual(floor);
      expect(h.plusMinusIfComplete).toBeGreaterThanOrEqual(floor);
    }
  });

  it('tells somebody what measuring the rest would buy them', () => {
    // The honest thing and the engaging thing are the same thing here.
    const partial = paceHeadline(readPace(inputs({ balanceSeconds: 30, gaitMs: 1.3 })), 45)!;
    expect(partial.plusMinusIfComplete).toBeLessThan(partial.plusMinus);
  });

  it('rounds to whole years, because a decimal here is false precision', () => {
    const h = paceHeadline(strong, 45)!;
    expect(Number.isInteger(h.years)).toBe(true);
    expect(Number.isInteger(h.plusMinus)).toBe(true);
  });
});

describe('what leaves the app when somebody shares it', () => {
  const h = paceHeadline(
    readPace(inputs({ age: 45, gripKg: 50, balanceSeconds: 30, gaitMs: 1.3 })),
    45,
  )!;
  const text = paceShareText(h);

  it('carries the interval, the coverage and the caveat in the body', () => {
    // A number that leaves the app loses its screen and every
    // qualification underneath it. They travel in the text or not at all.
    expect(text).toMatch(/give or take \d+ years/i);
    expect(text).toMatch(/\d+ of \d+ markers/i);
    expect(text).toMatch(/not validated on its own yet/i);
    expect(text).toMatch(/not a biological age/i);
  });

  it('makes no forbidden claim', () => {
    const lower = text.toLowerCase();
    for (const claim of FORBIDDEN_CLAIMS) {
      expect(lower).not.toContain(claim);
    }
  });

  it('says which way round it is without overstating it', () => {
    expect(text).toMatch(/younger than|older than|the same as/);
  });
});
