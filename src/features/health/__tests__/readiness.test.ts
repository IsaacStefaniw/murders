import { conditioningFrom } from '@/features/health/conditioning';
import { baselineFor, readinessFrom } from '@/features/health/readiness';
import { bmiFrom, waistToHeight } from '@/features/health/summarise';
import type { MetricObservation } from '@/features/model/metrics';

const NOW = new Date('2026-03-20T08:00:00.000Z');

const obs = (key: string, value: number, daysAgo: number): MetricObservation => ({
  id: `${key}-${daysAgo}-${value}`,
  key,
  value,
  at: new Date(NOW.getTime() - daysAgo * 86400e3).toISOString(),
  source: 'healthkit',
});

/** A fortnight of steady readings, plus whatever landed this morning. */
const history = (key: string, normal: number, today?: number) => [
  ...Array.from({ length: 10 }, (_, i) => obs(key, normal, i + 1)),
  ...(today != null ? [obs(key, today, 0)] : []),
];

describe('the baseline', () => {
  it('is the person’s own median, not a population number', () => {
    expect(baselineFor(history('body.hrv', 45), 'body.hrv', NOW)).toBe(45);
  });

  /**
   * Excluding today matters: including it drags the baseline toward the
   * reading being judged, so a genuinely unusual morning compares itself
   * against itself and looks ordinary.
   */
  it('excludes today, so an unusual morning cannot normalise itself', () => {
    expect(baselineFor(history('body.hrv', 45, 20), 'body.hrv', NOW)).toBe(45);
  });

  it('refuses to exist below five readings', () => {
    const thin = Array.from({ length: 4 }, (_, i) => obs('body.hrv', 45, i + 1));
    expect(baselineFor(thin, 'body.hrv', NOW)).toBeNull();
  });

  /**
   * A median rather than a mean, so a run of bad days cannot quietly
   * redefine bad as normal and switch the signal off when it is needed.
   */
  it('is barely moved by one terrible reading', () => {
    const withOutlier = [...history('body.hrv', 45), obs('body.hrv', 5, 11)];
    expect(baselineFor(withOutlier, 'body.hrv', NOW)).toBe(45);
  });
});

describe('reading the morning', () => {
  it('says nothing when there is nothing to say', () => {
    expect(readinessFrom(history('body.hrv', 45, 46), NOW)).toBeNull();
  });

  it('says nothing at all without a baseline, rather than a green light', () => {
    expect(readinessFrom([obs('body.hrv', 12, 0)], NOW)).toBeNull();
  });

  it('notices HRV well under this person’s own normal', () => {
    const r = readinessFrom(history('body.hrv', 50, 30), NOW);
    expect(r?.band).toBe('back-off');
    expect(r?.signals[0]).toContain('40% below your own two-week normal');
  });

  /**
   * The whole point of the module. 30ms is unremarkable in the population
   * and alarming for someone who normally sits at 50; 60ms is fine for
   * someone who normally sits at 65. A population band gets both wrong.
   */
  it('reads the same number two ways for two different people', () => {
    expect(readinessFrom(history('body.hrv', 50, 30), NOW)?.band).toBe('back-off');
    expect(readinessFrom(history('body.hrv', 32, 30), NOW)).toBeNull();
  });

  it('treats a raised resting heart rate the same way', () => {
    const r = readinessFrom(history('body.restingHr', 52, 63), NOW);
    expect(r?.band).toBe('back-off');
  });

  it('escalates when two milder signals land together', () => {
    const r = readinessFrom(
      [...history('body.hrv', 50, 42), ...history('body.restingHr', 52, 58)],
      NOW,
    );
    expect(r?.band).toBe('back-off');
    expect(r?.signals).toHaveLength(2);
  });

  it('counts a short night even with no wearable at all', () => {
    const r = readinessFrom([obs('sleep.hours', 5.2, 0)], NOW);
    expect(r?.band).toBe('caution');
  });

  it('ignores yesterday’s reading — today is the question', () => {
    const stale = [...history('body.hrv', 50), obs('body.hrv', 20, 1)];
    expect(readinessFrom(stale, NOW)).toBeNull();
  });
});

describe('cardio fitness', () => {
  it('asks rather than invents when there is no reading', () => {
    expect(conditioningFrom([])).toBeNull();
  });

  /**
   * Never classifies. A number that would be "poor" on one published table
   * and "good" on another is reported as a number and a direction.
   */
  it('reports the direction, never a verdict on the person', () => {
    const rising = conditioningFrom([obs('body.vo2max', 38, 80), obs('body.vo2max', 43, 1)], NOW);
    expect(rising?.includeIntervals).toBe(false);
    expect(rising?.reading).toContain('38 → 43');
    expect(JSON.stringify(rising)).not.toMatch(/poor|below average|excellent/i);
  });

  it('prescribes intervals when the number has drifted down', () => {
    const falling = conditioningFrom([obs('body.vo2max', 45, 80), obs('body.vo2max', 40, 1)], NOW);
    expect(falling?.includeIntervals).toBe(true);
    expect(falling?.sessionsPerWeek).toBe(3);
  });

  it('treats a flat line as maintaining, not as progress', () => {
    const flat = conditioningFrom([obs('body.vo2max', 42, 80), obs('body.vo2max', 42.2, 1)], NOW);
    expect(flat?.includeIntervals).toBe(true);
    expect(flat?.why).toContain('maintaining');
  });
});

describe('the two body ratios', () => {
  it('computes BMI rather than trusting whatever wrote to HealthKit', () => {
    expect(bmiFrom(80, 180)).toBe(24.7);
  });

  it('returns nothing rather than a number built from a missing input', () => {
    expect(bmiFrom(80, null)).toBeNull();
    expect(bmiFrom(80, 0)).toBeNull();
    expect(bmiFrom(80, 40)).toBeNull();
  });

  it('computes waist-to-height, the one that survives having muscle', () => {
    expect(waistToHeight(85, 180)).toBe(0.47);
    expect(waistToHeight(null, 180)).toBeNull();
  });
});
