import { formatDateLong } from '@/lib/dates';
import { observe, type MetricObservation } from '@/features/model/metrics';
import {
  allTrajectories,
  fitSeries,
  goalTrajectory,
  MIN_READINGS,
  MIN_SPAN_DAYS,
  projectMetric,
} from '@/features/model/trajectory';
import type { Goal } from '@/types/domain';

const NOW = new Date('2026-03-01T09:00:00');

/** A reading `daysAgo` before NOW. */
const at = (key: string, value: number, daysAgo: number): MetricObservation => ({
  ...observe(key, value),
  at: new Date(NOW.getTime() - daysAgo * 86400e3).toISOString(),
});

/** Weekly readings walking from `from` to `to` over `weeks`. */
const series = (key: string, from: number, to: number, weeks: number): MetricObservation[] =>
  Array.from({ length: weeks + 1 }, (_, i) =>
    at(key, from + ((to - from) * i) / weeks, (weeks - i) * 7),
  );

describe('fitSeries', () => {
  it('finds the slope of a clean line', () => {
    const fit = fitSeries([
      { at: '2026-01-01T00:00:00.000Z', value: 100 },
      { at: '2026-01-08T00:00:00.000Z', value: 93 },
      { at: '2026-01-15T00:00:00.000Z', value: 86 },
    ])!;
    expect(fit.slope).toBeCloseTo(-1, 5);
    expect(fit.readings).toBe(3);
    expect(fit.spanDays).toBe(14);
  });

  /**
   * The reason this is a fit rather than first-vs-last. One bad-scales
   * morning at the end of a series turns an endpoint comparison into a
   * triumph or a crisis; least squares lets it move the answer a little.
   */
  it('lets a single outlier move the answer a little, not all of it', () => {
    const clean = fitSeries([
      { at: '2026-01-01T00:00:00.000Z', value: 90 },
      { at: '2026-01-08T00:00:00.000Z', value: 89 },
      { at: '2026-01-15T00:00:00.000Z', value: 88 },
      { at: '2026-01-22T00:00:00.000Z', value: 87 },
    ])!;
    const withOutlier = fitSeries([
      { at: '2026-01-01T00:00:00.000Z', value: 90 },
      { at: '2026-01-08T00:00:00.000Z', value: 89 },
      { at: '2026-01-15T00:00:00.000Z', value: 88 },
      { at: '2026-01-22T00:00:00.000Z', value: 91 },
    ])!;
    // Endpoint arithmetic would flip the sign outright; the fit only softens.
    expect(clean.slope).toBeLessThan(0);
    expect(withOutlier.slope).toBeGreaterThan(clean.slope);
    expect(withOutlier.slope).toBeLessThan(0.2);
  });

  it('has no slope from a single point or a single day', () => {
    expect(fitSeries([{ at: '2026-01-01T00:00:00.000Z', value: 90 }])).toBeNull();
    expect(
      fitSeries([
        { at: '2026-01-01T09:00:00.000Z', value: 90 },
        { at: '2026-01-01T09:00:00.000Z', value: 92 },
      ]),
    ).toBeNull();
  });
});

describe('projectMetric', () => {
  /**
   * A projection is a promise about the future. A wrong one costs more
   * trust than a blank space, so two points and a fortnight is the floor.
   */
  it('refuses to project from noise, and says how far off it is', () => {
    const thin = [at('body.weight', 90, 3), at('body.weight', 89, 0)];
    const t = projectMetric(thin, 'body.weight', 82, { now: NOW })!;
    expect(t.verdict).toBe('not-enough-data');
    expect(t.headline).toContain('1 more reading');
    expect(MIN_READINGS).toBeGreaterThanOrEqual(3);
    expect(MIN_SPAN_DAYS).toBeGreaterThanOrEqual(14);
  });

  it('refuses when the readings are plentiful but crammed into days', () => {
    const crammed = [
      at('body.weight', 90, 4),
      at('body.weight', 89.6, 3),
      at('body.weight', 89.4, 2),
      at('body.weight', 89.1, 1),
    ];
    expect(projectMetric(crammed, 'body.weight', 82, { now: NOW })!.verdict).toBe(
      'not-enough-data',
    );
  });

  it('projects a date and a weekly rate from a real run of readings', () => {
    const weight = series('body.weight', 92, 88, 8); // −0.5 kg/week
    const t = projectMetric(weight, 'body.weight', 86, { now: NOW })!;
    expect(t.ratePerWeek).toBeCloseTo(-0.5, 1);
    expect(t.toward).toBe('lower');
    expect(t.weeksToTarget).toBeCloseTo(4, 0);
    expect(t.verdict).toBe('on-track');
    expect(t.headline).toContain(formatDateLong('2026-03-29'));
  });

  /** The sentence the whole engine exists to produce. */
  it('says plainly when the current rate misses the date', () => {
    const weight = series('body.weight', 92, 90, 8); // −0.25 kg/week
    const t = projectMetric(weight, 'body.weight', 86, { targetDate: '2026-04-01', now: NOW })!;
    expect(t.verdict).toBe('behind');
    expect(t.headline).toContain(`You said ${formatDateLong('2026-04-01')}`);
    expect(t.requiredRatePerWeek).toBeDefined();
    expect(t.gapNote).toContain('a week');
  });

  it('recognises comfortably ahead of the date', () => {
    const weight = series('body.weight', 92, 88, 8);
    const t = projectMetric(weight, 'body.weight', 87, { targetDate: '2026-09-01', now: NOW })!;
    expect(t.verdict).toBe('ahead');
  });

  it('names the wrong direction rather than projecting a date that never comes', () => {
    const weight = series('body.weight', 88, 92, 8); // gaining
    const t = projectMetric(weight, 'body.weight', 85, { targetDate: '2026-06-01', now: NOW })!;
    expect(t.verdict).toBe('wrong-way');
    expect(t.projectedDate).toBeNull();
    expect(t.gapNote).toContain('a week');
  });

  it('calls a flat run flat instead of projecting into the next decade', () => {
    const weight = series('body.weight', 90, 90.05, 8);
    const t = projectMetric(weight, 'body.weight', 82, { now: NOW })!;
    expect(t.verdict).toBe('flat');
    expect(t.weeksToTarget).toBeNull();
  });

  it('knows when the target is already met', () => {
    const bench = series('strength.bench.e1rm', 90, 105, 8);
    const t = projectMetric(bench, 'strength.bench.e1rm', 100, { now: NOW })!;
    expect(t.verdict).toBe('arrived');
    expect(t.headline).toContain('Already there');
  });

  /**
   * Body weight declares itself direction-neutral, so the gap is the right
   * signal there: someone under their goal weight is trying to go up. That
   * fallback must never reach a metric that HAS a direction — see the
   * already-met case above, which it would misread as going backwards.
   */
  it('falls back to the gap only for a direction-neutral metric', () => {
    const weight = series('body.weight', 70, 74, 8);
    const t = projectMetric(weight, 'body.weight', 80, { now: NOW })!;
    expect(t.toward).toBe('higher');
    expect(t.verdict).toBe('on-track');
  });

  it('says a passed deadline has passed rather than inventing a rate', () => {
    const weight = series('body.weight', 92, 91.9, 8);
    const t = projectMetric(weight, 'body.weight', 85, { targetDate: '2026-01-01', now: NOW })!;
    expect(t.gapNote).toContain('has passed');
    expect(t.requiredRatePerWeek).toBeUndefined();
  });

  it('has nothing to say about a metric never recorded', () => {
    expect(projectMetric([], 'body.weight', 80, { now: NOW })).toBeNull();
  });
});

describe('goalTrajectory', () => {
  const goal = (over: Partial<Goal> = {}): Goal => ({
    id: 'g1',
    title: 'Get to 86 kg',
    area: 'health',
    status: 'active',
    createdAt: NOW.toISOString(),
    routineIds: [],
    milestones: [
      {
        id: 'm1',
        title: '90 kg',
        done: true,
        doneWhen: { kind: 'metric', metricKey: 'body.weight', op: 'lte', value: 90 },
      },
      {
        id: 'm2',
        title: '86 kg',
        done: false,
        doneWhen: { kind: 'metric', metricKey: 'body.weight', op: 'lte', value: 86 },
      },
    ],
    ...over,
  });

  it('projects toward the goal’s outstanding metric rung', () => {
    const t = goalTrajectory(goal(), series('body.weight', 92, 88, 8), NOW)!;
    expect(t.target).toBe(86);
  });

  /**
   * "Read twelve books" has no rate to fit. A projection invented for it
   * would be arithmetic pretending to be insight.
   */
  it('offers nothing for count, streak and confirm rungs', () => {
    const counted = goal({
      milestones: [{ id: 'm', title: 'Twelve books', done: false, doneWhen: { kind: 'count', target: 12 } }],
    });
    expect(goalTrajectory(counted, [], NOW)).toBeNull();

    const confirmed = goal({
      milestones: [{ id: 'm', title: 'Ship it', done: false, doneWhen: { kind: 'confirm' } }],
    });
    expect(goalTrajectory(confirmed, [], NOW)).toBeNull();
  });

  it('ignores rungs already ticked off', () => {
    const allDone = goal({
      milestones: [
        {
          id: 'm1',
          title: '90 kg',
          done: true,
          doneWhen: { kind: 'metric', metricKey: 'body.weight', op: 'lte', value: 90 },
        },
      ],
    });
    expect(goalTrajectory(allDone, series('body.weight', 92, 88, 8), NOW)).toBeNull();
  });

  it('sorts the ones needing attention to the top and skips inactive goals', () => {
    const behind = { ...goal(), id: 'behind', targetDate: '2026-04-01' };
    const fine = { ...goal(), id: 'fine', targetDate: '2027-01-01' };
    const paused = { ...goal(), id: 'paused', status: 'paused' as const };
    const metrics = series('body.weight', 92, 90, 8);
    const out = allTrajectories([fine, behind, paused], metrics, NOW);
    expect(out.map((x) => x.goal.id)).toEqual(['behind', 'fine']);
    expect(out[0].trajectory.verdict).toBe('behind');
  });
});
