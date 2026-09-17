import { asPercent } from '@/features/health/summarise';
import {
  LEAN_CEILING,
  WAIST_HEIGHT_HEALTHY,
  BMI_UNDERWEIGHT,
  bmiMisread,
  bmiScore,
  weekHealth,
  type WeekInputs,
} from '@/features/health/essential8';
import { readPace } from '@/features/health/pace';
import type { MetricObservation } from '@/features/model/metrics';

const TODAY = '2026-09-14';

function metric(key: string, value: number): MetricObservation {
  return { id: key, key, value, at: `${TODAY}T00:00:00.000Z`, source: 'user' };
}

function week(over: Partial<WeekInputs> = {}): WeekInputs {
  return {
    plans: {},
    routines: [],
    metrics: [],
    intentions: [],
    events: [],
    today: TODAY,
    ...over,
  };
}

/**
 * Isaac's case, kept as a test rather than as a note.
 *
 * 180cm, 81.6kg is a BMI of 25.2 — one fifth of a point over the cut point,
 * a thirty-point drop on the published table, and on a man at eleven per
 * cent body fat it is measuring muscle.
 */
const ISAAC = [metric('body.height', 180), metric('body.weight', 81.6)];

describe('BMI as a misread', () => {
  it('says nothing while BMI is inside the healthy band', () => {
    // Nothing to correct: the table is already paying full marks, so a
    // caveat here would be noise rather than a finding.
    expect(bmiMisread({ bmi: 22, bodyFatPct: 11 })).toBeNull();
    expect(bmiMisread({ bmi: 24.9, bodyFatPct: 35 })).toBeNull();
  });

  it('flags a lean person the table calls overweight', () => {
    const line = bmiMisread({ bmi: 25.2, bodyFatPct: 11, sex: 'male' });
    expect(line).toContain('11%');
    expect(line).toContain('25.2');
    expect(line).toMatch(/cannot tell muscle from fat/i);
  });

  it('does not flag someone the two measures agree about', () => {
    // Body fat above the ceiling AND a BMI over the cut point is the case
    // where BMI is doing exactly the job it is there to do.
    expect(bmiMisread({ bmi: 31, bodyFatPct: 34, sex: 'male' })).toBeNull();
  });

  it('uses the published ceiling for the sex it was given', () => {
    // 28% is over the male ceiling and under the female one, and the
    // published ranges really do differ by that much.
    expect(bmiMisread({ bmi: 26, bodyFatPct: 28, sex: 'male' })).toBeNull();
    expect(bmiMisread({ bmi: 26, bodyFatPct: 28, sex: 'female' })).toBeTruthy();
  });

  it('takes the lower ceiling when sex is unknown, so it flags fewer people', () => {
    // Guessing sex would be a confident invisible error in half of all
    // cases. Erring towards not flagging is the direction that cannot
    // invent a correction nobody asked for.
    expect(bmiMisread({ bmi: 26, bodyFatPct: 28 })).toBeNull();
    expect(LEAN_CEILING.male).toBeLessThan(LEAN_CEILING.female);
  });

  it('falls back to waist-to-height, which needs no new data', () => {
    const line = bmiMisread({ bmi: 26, waistToHeight: 0.45 });
    expect(line).toMatch(/waist is under half your height/i);
    expect(WAIST_HEIGHT_HEALTHY).toBe(0.5);

    // A waist at or over the threshold is not a contradiction.
    expect(bmiMisread({ bmi: 26, waistToHeight: 0.55 })).toBeNull();
  });

  it('prefers a direct reading over the proxy when it has both', () => {
    // Body fat measures the thing waist is a stand-in for, so where the two
    // disagree the direct one decides — and it decides in both directions.
    expect(bmiMisread({ bmi: 26, bodyFatPct: 30, waistToHeight: 0.45, sex: 'male' })).toBeNull();
  });
});

describe('a misread component stops being treated as a finding', () => {
  const lean = week({ metrics: [...ISAAC, metric('body.bodyFat', 11)] });

  it('still scores it, because the published table is the published table', () => {
    const bmi = weekHealth(lean).components.find((c) => c.key === 'bmi')!;
    expect(bmi.score).toBe(bmiScore(25.2));
    expect(bmi.misread).toBeTruthy();
  });

  it('leaves it out of the composite rather than averaging in a wrong number', () => {
    const out = weekHealth(lean);
    expect(out.observed.map((c) => c.key)).toContain('bmi');
    expect(out.counted.map((c) => c.key)).not.toContain('bmi');
    // Nothing else is readable in this week, so there is nothing left to
    // average — which is the honest answer, not a zero.
    expect(out.composite).toBeNull();
  });

  it('never names it as the biggest gap', () => {
    // The failure this exists to prevent: telling a man at 11% body fat
    // that body mass is where he has the most room.
    const out = weekHealth(
      week({
        metrics: [...ISAAC, metric('body.bodyFat', 11), metric('sleep.hours', 7.5)],
        nicotine: 'never',
      }),
    );
    expect(out.biggestGap?.key).not.toBe('bmi');
  });

  it('counts it as unread in the markers instrument, widening the interval', () => {
    const withBmi = readPace({ age: 40, bmi: 25.2, sleepHours: 7.5 });
    const misread = readPace({ age: 40, bmi: 25.2, bmiMisread: true, sleepHours: 7.5 });
    const le8 = (r: typeof withBmi) => r.components.find((c) => c.id === 'le8')!;

    expect(le8(withBmi).detail).toContain('2 of 8');
    expect(le8(misread).detail).toContain('1 of 8');
    expect(le8(misread).detail).toMatch(/body mass left out/i);
  });

  it('asks for what would settle it when it cannot tell either way', () => {
    const bmi = weekHealth(week({ metrics: ISAAC })).components.find((c) => c.key === 'bmi')!;
    expect(bmi.misread).toBeUndefined();
    expect(bmi.blocked).toMatch(/body fat percentage or a waist measurement/i);
  });
});

describe('body fat arriving from Health', () => {
  it('reads a percentage whichever way the framework hands it over', () => {
    // HKUnit.percent() is defined on 0-1 and wrappers disagree about
    // scaling it. A silent factor of a hundred here would not look wrong
    // on screen — it would just be false.
    expect(asPercent(0.11)).toBe(11);
    expect(asPercent(11)).toBe(11);
    expect(asPercent(0.235)).toBe(23.5);
  });

  it('drops anything that is not a body composition reading', () => {
    expect(asPercent(0)).toBeNull();
    expect(asPercent(-1)).toBeNull();
    expect(asPercent(NaN)).toBeNull();
    expect(asPercent(undefined)).toBeNull();
    expect(asPercent(0.001)).toBeNull();
    expect(asPercent(95)).toBeNull();
  });
});

/**
 * The one place this app could do real harm.
 *
 * `bmiScore` implements the published Life's Essential 8 table faithfully
 * and the table awards 100 for anything under 25. So a BMI of 16 came back
 * as a perfect score, fed the composite, and was presented to the person as
 * the part of their health going best — to exactly the person the file's
 * own header says this library must never become "a restriction scoreboard"
 * for.
 */
describe('a BMI the table would give full marks to and should not', () => {
  it('stops counting below the underweight line', () => {
    expect(bmiMisread({ bmi: 16 })).toBeTruthy();
    expect(bmiMisread({ bmi: BMI_UNDERWEIGHT - 0.1 })).toBeTruthy();
  });

  it('leaves a healthy weight alone', () => {
    expect(bmiMisread({ bmi: BMI_UNDERWEIGHT })).toBeNull();
    expect(bmiMisread({ bmi: 21 })).toBeNull();
  });

  it('fires on BMI alone — it must not wait for a body-fat reading', () => {
    // The person least likely to have entered a body-fat percentage is the
    // person this branch exists for.
    expect(bmiMisread({ bmi: 16, bodyFatPct: null, waistToHeight: null })).toBeTruthy();
  });

  it('points at a human and never at a target', () => {
    const said = bmiMisread({ bmi: 16 })!;
    expect(said).toMatch(/doctor/i);
    // No instruction to eat, gain, or reach a number. The app cannot know
    // why somebody's weight is where it is.
    expect(said).not.toMatch(/\beat\b|gain weight|put on|should weigh|aim for|target/i);
    // And it does not diagnose.
    expect(said).not.toMatch(/anorexi|eating disorder|unhealthy|dangerous|too thin/i);
  });

  it('says why the number is left out rather than silently dropping it', () => {
    expect(bmiMisread({ bmi: 16 })).toMatch(/left out|not counted|not measuring/i);
  });
});
