/**
 * The level ladder, from the training side: what the log and the lifts
 * prove, and how claim, measurement, earned level and a step-back combine.
 */

import { observe, type MetricObservation } from '@/features/model/metrics';
import {
  EMPTY_EVIDENCE,
  levelFor,
  levelProgress,
  type LevelEvidence,
} from '@/features/paths/level';
import {
  latestMaxes,
  measuredTrainingLevel,
  trainingEvidence,
  TRAINING_STANDARD_TEXT,
} from '@/features/training/level';
import type { LifeProfile, WorkoutLog } from '@/types/domain';

const NOW = new Date('2026-09-05T12:00:00');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400e3).toISOString();
const session = (key: string, value: number, days: number): MetricObservation => ({
  ...observe(key, value, 'user', `workout:w${days}`),
  at: daysAgo(days),
});

const man = { weightKg: 85, sexAtBirth: 'male', age: 35 } as LifeProfile;

const log = (date: string, sets: number): WorkoutLog => ({
  id: `w-${date}`,
  date,
  title: 'Upper A',
  sets: Array.from({ length: sets }, (_, i) => ({
    id: `s-${date}-${i}`,
    exercise: 'Bench press',
    index: i + 1,
    reps: 5,
    weightKg: 80,
    at: `${date}T09:00:00.000Z`,
  })),
  createdAt: `${date}T09:00:00.000Z`,
  updatedAt: `${date}T09:00:00.000Z`,
});

describe('latestMaxes is the weighted read', () => {
  it('is not lowered by a bad day', () => {
    const maxes = latestMaxes([session('strength.bench.e1rm', 110, 7), session('strength.bench.e1rm', 92, 0)], NOW);
    expect(maxes.bench).toBeCloseTo(110 * (1 - 0.0125), 1);
  });

  it('reads each lift on its own and leaves the unlogged ones out', () => {
    const maxes = latestMaxes([session('strength.squat.e1rm', 150, 0)], NOW);
    expect(maxes).toEqual({ squat: 150 });
  });
});

describe('measuredTrainingLevel', () => {
  it('is nothing without a profile to place the lifts against', () => {
    expect(measuredTrainingLevel([session('strength.bench.e1rm', 128, 0)], null)).toBeNull();
    expect(measuredTrainingLevel([session('strength.bench.e1rm', 128, 0)], undefined)).toBeNull();
    expect(measuredTrainingLevel([], man)).toBeNull();
  });

  it('starts an intermediate lifter at developing and an advanced one at established', () => {
    // Clear of the band edges: the measurement is read against the real
    // clock, so a reading exactly on a bar drifts under it by the time
    // the test runs.
    expect(measuredTrainingLevel([session('strength.bench.e1rm', 90, 0)], man)).toBe('developing');
    expect(measuredTrainingLevel([session('strength.bench.e1rm', 130, 0)], man)).toBe('established');
  });

  it('never measures anyone into advanced — that rung is earned', () => {
    const elite = [
      session('strength.bench.e1rm', 175, 0),
      session('strength.squat.e1rm', 215, 0),
      session('strength.deadlift.e1rm', 260, 0),
      session('strength.ohp.e1rm', 100, 0),
    ];
    expect(measuredTrainingLevel(elite, man)).toBe('established');
  });

  it('puts a beginner at foundation rather than below it', () => {
    expect(measuredTrainingLevel([session('strength.bench.e1rm', 70, 0)], man)).toBe('foundation');
  });
});

describe('trainingEvidence', () => {
  it('meets the standard through the strength route when the lifts are advanced', () => {
    const strong = [
      session('strength.bench.e1rm', 128, 0),
      session('strength.squat.e1rm', 175, 0),
      session('strength.deadlift.e1rm', 215, 0),
    ];
    expect(trainingEvidence([], strong, man).standardsMet).toBe(true);
    // Without a profile the strength route is shut and the training-age
    // route (three baselined, two improved over eight weeks) is not met.
    expect(trainingEvidence([], strong, null).standardsMet).toBe(false);
  });

  it('counts sessions and weeks from the log, not from the metrics', () => {
    const ev = trainingEvidence([log('2026-03-02', 3), log('2026-03-09', 3), log('2026-03-10', 0)], []);
    expect(ev.sessions).toBe(2);
    expect(ev.weeks).toBe(2);
  });
});

describe('levelFor', () => {
  const evidence = (sessions: number, weeks: number, standardsMet = false): LevelEvidence => ({ sessions, weeks, standardsMet });

  it('believes a claim up to established', () => {
    expect(levelFor('training', 'foundation')).toBe('foundation');
    expect(levelFor('training', 'developing')).toBe('developing');
    expect(levelFor('training', 'established')).toBe('established');
    expect(levelFor('training', 'advanced')).toBe('established');
    expect(levelFor('training', null)).toBe('foundation');
  });

  it('lets a measurement outrank a claim, in either direction only upward', () => {
    expect(levelFor('training', 'foundation', EMPTY_EVIDENCE, null, 'established')).toBe('established');
    expect(levelFor('training', 'established', EMPTY_EVIDENCE, null, 'foundation')).toBe('established');
    expect(levelFor('training', null, EMPTY_EVIDENCE, null, 'developing')).toBe('developing');
  });

  it('lets the log outrank both', () => {
    expect(levelFor('training', 'foundation', evidence(36, 16))).toBe('established');
    expect(levelFor('training', 'foundation', evidence(12, 6))).toBe('developing');
    expect(levelFor('training', 'established', evidence(12, 6))).toBe('established');
  });

  it('opens advanced only from the log, and only with the standard', () => {
    expect(levelFor('training', 'established', evidence(100, 40, false))).toBe('established');
    expect(levelFor('training', 'established', evidence(100, 40, true))).toBe('advanced');
    // The proven gate: 48 sessions across 20 weeks with the standard met.
    expect(levelFor('training', null, evidence(48, 20, true))).toBe('advanced');
    expect(levelFor('training', null, evidence(48, 19, true))).toBe('established');
    expect(levelFor('training', null, evidence(47, 20, true))).toBe('established');
    // Volume alone below the long gate, without the standard, stops at established.
    expect(levelFor('training', null, evidence(99, 39, false))).toBe('established');
  });

  it('applies a step-back as a cap and never as a lift', () => {
    expect(levelFor('training', 'established', EMPTY_EVIDENCE, 'developing')).toBe('developing');
    expect(levelFor('training', 'established', evidence(100, 40, true), 'foundation')).toBe('foundation');
    expect(levelFor('training', 'foundation', EMPTY_EVIDENCE, 'established')).toBe('foundation');
    expect(levelFor('training', 'developing', EMPTY_EVIDENCE, 'developing')).toBe('developing');
  });
});

describe('the sentence the hub shows', () => {
  it('counts down sessions and weeks in plain words', () => {
    const p = levelProgress('training', 'foundation', { sessions: 11, weeks: 5, standardsMet: false }, TRAINING_STANDARD_TEXT);
    expect(p.text).toBe('1 more session and 1 more week to reach Developing.');
    expect(p.sessionsToGo).toBe(1);
    expect(p.weeksToGo).toBe(1);
  });

  it('says when the next rung is unlocked', () => {
    const p = levelProgress('training', 'foundation', { sessions: 12, weeks: 6, standardsMet: false }, TRAINING_STANDARD_TEXT);
    expect(p.text).toBe('Developing is unlocked — the next block steps up.');
  });

  it('names the standard when volume is met and the standard is not', () => {
    const p = levelProgress('training', 'established', { sessions: 100, weeks: 40, standardsMet: false }, TRAINING_STANDARD_TEXT);
    expect(p.blockedBy).toBe(TRAINING_STANDARD_TEXT);
    expect(p.text).toBe(`Advanced also needs ${TRAINING_STANDARD_TEXT}.`);
  });

  it('uses the shorter gate once the standard is met', () => {
    const p = levelProgress('training', 'established', { sessions: 40, weeks: 18, standardsMet: true }, TRAINING_STANDARD_TEXT);
    expect(p.sessionsToGo).toBe(8);
    expect(p.weeksToGo).toBe(2);
    expect(p.text).toBe('8 more sessions and 2 more weeks to reach Advanced.');
  });

  it('has nowhere further to go from the top', () => {
    const p = levelProgress('training', 'advanced', { sessions: 200, weeks: 80, standardsMet: true }, TRAINING_STANDARD_TEXT);
    expect(p.next).toBeNull();
    expect(p.text).toMatch(/Top of the ladder/);
  });
});
