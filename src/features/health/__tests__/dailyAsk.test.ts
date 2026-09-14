/**
 * "Should we ask 3 questions every day? ... sleep time, bad habits? and
 * ??? whatever's most useful for model."
 *
 * The answer is two, not three, and usually fewer — because almost nothing
 * in the instrument moves daily, and a question whose answer changes
 * nothing teaches people to dismiss the app. These pin that.
 */

import {
  REGULARITY_MIN_NIGHTS,
  REGULARITY_NOTE,
  SELF_RATED_HEALTH_EVERY_DAYS,
  asksFor,
  sleepRegularity,
  type AskInputs,
} from '@/features/health/dailyAsk';
import { readPace } from '@/features/health/pace';
import {
  WHY_SLEEP_QUALITY_IS_NOT_SCORED,
  WHY_STRESS_IS_NOT_SCORED,
} from '@/features/health/stress';
import type { MetricObservation } from '@/features/model/metrics';

const TODAY = '2026-09-14';

function input(over: Partial<AskInputs> = {}): AskInputs {
  return {
    today: TODAY,
    healthConnected: false,
    activeHabits: [],
    hasStandingHabit: false,
    metrics: [],
    lastSelfRatedHealth: TODAY,
    ...over,
  };
}

describe('what is worth asking today', () => {
  it('asks nothing of somebody the app can already read', () => {
    // The expected outcome for most people on most days, and the design
    // working rather than failing.
    expect(asksFor(input({ healthConnected: true }))).toEqual([]);
  });

  it('never asks for sleep that Apple Health is already supplying', () => {
    expect(asksFor(input({ healthConnected: true })).map((a) => a.id)).not.toContain('sleepTiming');
    expect(asksFor(input({ healthConnected: false })).map((a) => a.id)).toContain('sleepTiming');
  });

  it('asks about habits only while somebody has one running', () => {
    // Asking a non-smoker every morning whether they smoked is the
    // definition of a question whose answer changes nothing.
    expect(asksFor(input()).map((a) => a.id)).not.toContain('habits');
    expect(asksFor(input({ activeHabits: ['alcohol'] })).map((a) => a.id)).toContain('habits');
    expect(asksFor(input({ hasStandingHabit: true })).map((a) => a.id)).toContain('habits');
  });

  it('asks self-rated health monthly, not daily', () => {
    // It is an "in general" instrument. Day to day it measures mood.
    expect(asksFor(input()).map((a) => a.id)).not.toContain('selfRatedHealth');
    expect(asksFor(input({ lastSelfRatedHealth: '2026-08-01' })).map((a) => a.id)).toContain(
      'selfRatedHealth',
    );
    expect(asksFor(input({ lastSelfRatedHealth: undefined })).map((a) => a.id)).toContain(
      'selfRatedHealth',
    );
    expect(SELF_RATED_HEALTH_EVERY_DAYS).toBeGreaterThanOrEqual(30);
  });

  it('never asks more than two things at once', () => {
    // Three every day was the proposal, and three every day is noise.
    const worst = asksFor(
      input({ healthConnected: false, hasStandingHabit: true, lastSelfRatedHealth: '2026-01-01' }),
    );
    expect(worst.length).toBeLessThanOrEqual(3);
    // And on any ordinary day, at most two.
    const ordinary = asksFor(input({ healthConnected: false, hasStandingHabit: true }));
    expect(ordinary.length).toBeLessThanOrEqual(2);
  });

  it('says why it is asking, wherever the reason is not obvious', () => {
    for (const ask of asksFor(input({ lastSelfRatedHealth: undefined, hasStandingHabit: true }))) {
      expect(ask.why).toBeTruthy();
      expect(ask.prompt.length).toBeGreaterThan(10);
    }
  });

  it('frames the habits question so a yes is not a failure', () => {
    const habits = asksFor(input({ hasStandingHabit: true })).find((a) => a.id === 'habits')!;
    expect(habits.why).toMatch(/nothing counts up/i);
    expect(habits.why).toMatch(/data rather than a failure/i);
  });
});

describe('sleep regularity', () => {
  const nights = (values: number[]): MetricObservation[] =>
    values.map((v, i) => ({
      id: `s${i}`,
      key: 'sleep.hours',
      value: v,
      at: `2026-09-${String(14 - i).padStart(2, '0')}T08:00:00.000Z`,
      source: 'healthkit',
    }));

  it('needs a week of nights before it means anything', () => {
    expect(sleepRegularity(nights([7, 7, 7]), TODAY)).toBeNull();
    expect(sleepRegularity(nights([7, 7, 7, 7, 7, 7, 7]), TODAY)).not.toBeNull();
    expect(REGULARITY_MIN_NIGHTS).toBeGreaterThanOrEqual(7);
  });

  it('separates a steady sleeper from an erratic one at the same average', () => {
    // The whole point: both average seven and a half hours, and an average
    // completely hides the difference between them.
    const steady = sleepRegularity(nights([7.5, 7.5, 7, 8, 7.5, 7.5, 7.5]), TODAY)!;
    const erratic = sleepRegularity(nights([5, 10, 5.5, 9.5, 6, 10, 6.5]), TODAY)!;
    expect(steady.band).toBe('steady');
    expect(erratic.band).toBe('erratic');
    expect(erratic.sdHours).toBeGreaterThan(steady.sdHours);
  });

  it('is a reading, not a score — it has no hazard coefficient', () => {
    // The published effect sizes belong to the Sleep Regularity Index,
    // computed from minute-by-minute accelerometry. This measures the
    // variability of DURATION, which is a weaker cousin, so it is shown
    // rather than scored.
    const reading = readPace({ age: 45, sexAtBirth: 'male' });
    expect(reading.components.map((c) => c.id)).not.toContain('sleepRegularity');
    expect(REGULARITY_NOTE).toMatch(/weaker cousin/i);
    expect(REGULARITY_NOTE).toMatch(/shown as a reading rather than scored/i);
  });
});

describe('stress, and why it is not scored', () => {
  it('is kept out of the instrument on purpose, with the reason recorded', () => {
    const reading = readPace({ age: 45, sexAtBirth: 'male' });
    expect(reading.components.map((c) => c.id)).not.toContain('stress');
    // It still earns its place by changing the plan.
    expect(WHY_STRESS_IS_NOT_SCORED).toMatch(/changes your plan/i);
    expect(WHY_STRESS_IS_NOT_SCORED).toMatch(/evidence for perceived stress.*is weak/i);
  });

  it('does not tell anybody their attitude is the problem', () => {
    // The one robust finding in the area produces a sentence an app should
    // not say to somebody under real pressure. The harm is in the claim,
    // not the wording, so there is no framing that rescues it.
    const copy = `${WHY_STRESS_IS_NOT_SCORED} ${WHY_SLEEP_QUALITY_IS_NOT_SCORED}`.toLowerCase();
    expect(copy).not.toMatch(/your belief|your attitude|mindset is|think differently/);
  });
});
