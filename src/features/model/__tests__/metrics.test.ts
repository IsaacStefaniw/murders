/**
 * The metric stream's four ideas, at their edges.
 */

import { latest, METRICS, metricDef, observe, personalBest, recentRecords, trend, type MetricObservation } from '@/features/model/metrics';

const NOW = new Date(2026, 8, 8, 9, 0, 0, 0);
const at = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * 86400e3).toISOString();
const obs = (key: string, value: number, daysAgo: number, id = `${key}-${daysAgo}-${value}`): MetricObservation => ({
  id, key, value, at: at(daysAgo), source: 'user',
});

describe('observe', () => {
  it('stamps an ISO instant and a unique id', () => {
    const a = observe('body.weight', 84);
    const b = observe('body.weight', 84);
    expect(a.id).not.toBe(b.id);
    expect(Number.isNaN(Date.parse(a.at))).toBe(false);
    expect(a.source).toBe('user');
    expect(observe('body.weight', 84, 'healthkit', 'sync').note).toBe('sync');
  });

  it('every definition has a direction and a unit', () => {
    for (const def of METRICS) {
      expect(['higher', 'lower', 'steady']).toContain(def.direction);
      expect(def.unit.length).toBeGreaterThan(0);
    }
    expect(metricDef('body.restingHr')?.direction).toBe('lower');
    expect(metricDef('body.waist')?.direction).toBe('lower');
    expect(metricDef('body.hrv')?.direction).toBe('higher');
    expect(metricDef('no.such')).toBeUndefined();
  });
});

describe('latest', () => {
  it('is by time, not by insertion order', () => {
    const history = [obs('body.weight', 84, 1), obs('body.weight', 86, 10)];
    expect(latest(history, 'body.weight')!.value).toBe(84);
    expect(latest(history, 'body.hrv')).toBeNull();
  });
});

describe('personalBest', () => {
  it('is the lowest for a lower-is-better metric', () => {
    const history = [obs('body.restingHr', 60, 20), obs('body.restingHr', 52, 10), obs('body.restingHr', 55, 1)];
    expect(personalBest(history, 'body.restingHr')!.value).toBe(52);
    const waist = [obs('body.waist', 90, 20), obs('body.waist', 86, 10), obs('body.waist', 88, 1)];
    expect(personalBest(waist, 'body.waist')!.value).toBe(86);
  });

  it('is the highest for a higher-is-better metric, with ties going to the later reading', () => {
    const history = [obs('strength.bench.e1rm', 120, 20, 'early'), obs('strength.bench.e1rm', 120, 2, 'late'), obs('strength.bench.e1rm', 110, 1)];
    const best = personalBest(history, 'strength.bench.e1rm')!;
    expect(best.value).toBe(120);
    expect(best.id).toBe('late');
  });

  it('treats an unknown key as higher-is-better and an empty history as nothing', () => {
    expect(personalBest([obs('goal.g1.saved', 4000, 3), obs('goal.g1.saved', 6000, 1)], 'goal.g1.saved')!.value).toBe(6000);
    expect(personalBest([], 'body.weight')).toBeNull();
  });
});

describe('trend', () => {
  it('is first against latest inside the window, and nothing with one point', () => {
    const history = [obs('body.weight', 90, 60), obs('body.weight', 86, 20), obs('body.weight', 84.2, 1)];
    expect(trend(history, 'body.weight', 28, NOW)).toMatchObject({ from: 86, to: 84.2, delta: -1.8, direction: 'down' });
    expect(trend(history, 'body.weight', 90, NOW)).toMatchObject({ from: 90, to: 84.2, direction: 'down' });
    expect(trend(history, 'body.weight', 10, NOW)).toBeNull();
  });

  it('calls under half a unit flat, either way', () => {
    expect(trend([obs('body.hrv', 50, 10), obs('body.hrv', 50.4, 1)], 'body.hrv', 28, NOW)?.direction).toBe('flat');
    expect(trend([obs('body.hrv', 50, 10), obs('body.hrv', 49.6, 1)], 'body.hrv', 28, NOW)?.direction).toBe('flat');
    expect(trend([obs('body.hrv', 50, 10), obs('body.hrv', 50.5, 1)], 'body.hrv', 28, NOW)?.direction).toBe('up');
  });
});

describe('recentRecords', () => {
  it('a lower-is-better record counts too, and only with history behind it', () => {
    const history = [obs('body.restingHr', 60, 20), obs('body.restingHr', 52, 2)];
    expect(recentRecords(history, 7, NOW).map((r) => [r.def.key, r.value])).toEqual([['body.restingHr', 52]]);
    expect(recentRecords([obs('body.restingHr', 52, 2)], 7, NOW)).toEqual([]);
    expect(recentRecords([obs('body.restingHr', 60, 2), obs('body.restingHr', 52, 20)], 7, NOW)).toEqual([]);
  });
});
