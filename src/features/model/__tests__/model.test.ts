import {
  estimate1Rm,
  latest,
  observe,
  personalBest,
  recentRecords,
  trend,
  type MetricObservation,
} from '@/features/model/metrics';
import { isAnswered, nextQuestion, QUESTIONS } from '@/features/model/questionEngine';
import type { LifeProfile } from '@/types/domain';

const at = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400e3).toISOString();
const obs = (key: string, value: number, daysAgo: number): MetricObservation => ({
  ...observe(key, value),
  at: at(daysAgo),
});

describe('metrics framework', () => {
  it('Epley e1RM behaves', () => {
    expect(estimate1Rm(100, 1)).toBe(100);
    expect(estimate1Rm(120, 3)).toBe(132);
    expect(estimate1Rm(60, 8)).toBe(76);
  });

  it('latest, best (direction-aware) and trend', () => {
    const history = [
      obs('strength.bench.e1rm', 120, 30),
      obs('strength.bench.e1rm', 127.5, 2),
      obs('body.restingHr', 62, 20),
      obs('body.restingHr', 55, 1),
    ];
    expect(latest(history, 'strength.bench.e1rm')!.value).toBe(127.5);
    expect(personalBest(history, 'strength.bench.e1rm')!.value).toBe(127.5);
    expect(personalBest(history, 'body.restingHr')!.value).toBe(55); // lower is better
    const t = trend(history, 'strength.bench.e1rm', 60)!;
    expect(t).toMatchObject({ from: 120, to: 127.5, direction: 'up' });
  });

  it('recent records surface only fresh PBs with history behind them', () => {
    const history = [obs('strength.bench.e1rm', 120, 30), obs('strength.bench.e1rm', 127.5, 2)];
    expect(recentRecords(history, 7).map((r) => r.def.key)).toEqual(['strength.bench.e1rm']);
    // A single first-ever entry is a baseline, not a record.
    expect(recentRecords([obs('strength.squat.e1rm', 150, 1)], 7)).toHaveLength(0);
  });
});

describe('question engine', () => {
  const profile = { age: 38, weightKg: 88 } as LifeProfile;

  it('never asks what it already knows, from any source', () => {
    const age = QUESTIONS.find((q) => q.id === 'age')!;
    const weight = QUESTIONS.find((q) => q.id === 'weight')!;
    expect(isAnswered(age, { profile, metrics: [], askedAt: {} })).toBe(true);
    expect(isAnswered(weight, { profile: null, metrics: [obs('body.weight', 88, 1)], askedAt: {} })).toBe(true);
  });

  it('asks the highest-value unanswered question, one at a time', () => {
    const q = nextQuestion({ profile, metrics: [], askedAt: {}, domain: 'training' });
    expect(q!.id).toBe('bench-baseline');
    const afterBench = nextQuestion({
      profile,
      metrics: [obs('strength.bench.e1rm', 120, 1)],
      askedAt: {},
      domain: 'training',
    });
    expect(afterBench!.id).toBe('squat-baseline');
  });

  it('respects the ask cooldown and can run out of questions', () => {
    const allKnown = nextQuestion({
      profile,
      metrics: ['bench', 'squat', 'deadlift', 'ohp'].map((l) => obs(`strength.${l}.e1rm`, 100, 1)),
      askedAt: {},
      domain: 'training',
    });
    expect(allKnown).toBeNull();
    const snoozed = nextQuestion({
      profile,
      metrics: [],
      askedAt: { 'bench-baseline': at(2) },
      domain: 'training',
    });
    expect(snoozed!.id).toBe('squat-baseline');
  });

  it('choice questions only surface once their path exists', () => {
    // Relationship questions all target a path, so the domain stays silent
    // until that path is started.
    const noPath = nextQuestion({ profile, metrics: [], askedAt: {}, domain: 'relationship' });
    expect(noPath).toBeNull();
    const withPath = nextQuestion({
      profile,
      metrics: [],
      askedAt: {},
      pathAnswers: { relationship: { temperature: 'drifting' } },
      domain: 'relationship',
    });
    expect(withPath!.id).toBe('partner-window');
    expect(withPath!.input).toBe('choice');
  });

  it('a metric question needs no path — it asks for a number we already use', () => {
    // finance.savingsRate drives assessMoney, so it is worth asking for
    // whether or not the money path has been started.
    const asked = nextQuestion({ profile, metrics: [], askedAt: {}, domain: 'finance' });
    expect(asked!.id).toBe('money-savings-rate');
    expect(asked!.metricKey).toBe('finance.savingsRate');
  });

  it('a choice answered into path answers is never re-asked', () => {
    const trouble = QUESTIONS.find((q) => q.id === 'food-trouble')!;
    const ctx = {
      profile,
      metrics: [],
      askedAt: {},
      pathAnswers: { nutrition: { aim: 'weight', trouble: 'evenings' } },
    };
    expect(isAnswered(trouble, ctx)).toBe(true);
    // The interview's foodTrouble answer lands as path answers — so the
    // engine moves on to what it still doesn't know.
    const next = nextQuestion({ ...ctx, profile: null, domain: 'nutrition' });
    expect(next!.id).toBe('weight');
  });
});
