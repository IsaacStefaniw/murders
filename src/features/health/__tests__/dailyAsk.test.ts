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
  dismissedToday,
  pendingAsk,
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
    nightsRecorded: [],
    metrics: [],
    lastSelfRatedHealth: TODAY,
    ...over,
  };
}

describe('what is worth asking today', () => {
  it('asks nothing of somebody the app can already read', () => {
    // The expected outcome for most people on most days, and the design
    // working rather than failing.
    expect(asksFor(input({ nightsRecorded: [TODAY] }))).toEqual([]);
  });

  it('gates on having LAST NIGHT, not on whether Health is connected', () => {
    // Connected does not mean supplying sleep: no watch, a watch not worn,
    // sleep tracking off. And it is not a property of the account at all —
    // somebody who usually wears a watch and forgot last night has a hole
    // in exactly the series this is building.
    expect(asksFor(input({ nightsRecorded: [TODAY] })).map((a) => a.id)).not.toContain(
      'sleepTiming',
    );
    expect(asksFor(input({ nightsRecorded: [] })).map((a) => a.id)).toContain('sleepTiming');
    // Has a long history, missed last night: still asked.
    expect(
      asksFor(input({ nightsRecorded: ['2026-09-11', '2026-09-12', '2026-09-13'] })).map(
        (a) => a.id,
      ),
    ).toContain('sleepTiming');
  });

  it('asks for the two times, not for how long they slept', () => {
    // Duration cannot see irregular timing at all — see sleepTiming.ts.
    const ask = asksFor(input()).find((a) => a.id === 'sleepTiming')!;
    expect(ask.prompt).toMatch(/fall asleep.*wake/i);
    expect(ask.why).toMatch(/two times, not the hours between/i);
  });

  /**
   * The habits ask is gone, and this is the test that keeps it gone.
   *
   * It was emitted daily for anyone who named a single thing in `lessOf`
   * during setup, with no cadence gate, no answered-state and no control
   * on the card — the whole UI was a sentence saying the log lives under
   * Coaches. An unanswerable question, every morning, forever, asked of
   * the person who had committed to the most.
   */
  it('never asks a question the card cannot take an answer to', () => {
    expect(asksFor(input()).map((a) => a.id)).not.toContain('habits');
    expect(
      asksFor(input({ lastSelfRatedHealth: undefined })).map((a) => a.id),
    ).not.toContain('habits');
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
    // Tightened from three once the habits ask went: the worst day this
    // can now produce is the sleep question and the monthly one.
    const worst = asksFor(input({ lastSelfRatedHealth: '2026-01-01' }));
    expect(worst.length).toBeLessThanOrEqual(2);
    // And on any ordinary day, one.
    expect(asksFor(input()).length).toBeLessThanOrEqual(1);
  });

  it('says why it is asking, wherever the reason is not obvious', () => {
    for (const ask of asksFor(input({ lastSelfRatedHealth: undefined }))) {
      expect(ask.why).toBeTruthy();
      expect(ask.prompt.length).toBeGreaterThan(10);
    }
  });

});

/**
 * "Not today" meaning today.
 *
 * The dismissal lived in a `useState` inside the card, so it did not
 * survive a remount — tab away, come back, and the app asked the same
 * question the same morning. And because Today's arbiter read availability
 * from the unfiltered list while the card filtered by that local state, a
 * dismissal left the attention slot claimed and empty under a caption
 * saying there were more things to look at.
 */
describe('an ask that was waved away', () => {
  it('is not offered again the same day', () => {
    const asks = asksFor(input());
    expect(asks.map((a) => a.id)).toContain('sleepTiming');
    expect(pendingAsk(input(), ['sleepTiming'])).toBeNull();
  });

  it('comes back tomorrow, because it is a daily question', () => {
    // Keyed by date rather than cleared overnight: there is no overnight
    // on a device that is simply opened again.
    const yesterday = { sleepTiming: '2026-09-13' };
    expect(dismissedToday(yesterday, TODAY)).toEqual([]);
    expect(pendingAsk(input(), dismissedToday(yesterday, TODAY))?.id).toBe('sleepTiming');
  });

  it('falls through to the next question rather than showing nothing', () => {
    // Waving away the sleep question on a month-boundary day should leave
    // the monthly one, not an empty card.
    const monthly = input({ lastSelfRatedHealth: undefined });
    expect(pendingAsk(monthly, ['sleepTiming'])?.id).toBe('selfRatedHealth');
  });

  /**
   * The rule Today states and this was breaking: "a slot is never claimed
   * by something that then renders nothing." Availability and the card now
   * ask the same function the same question.
   */
  it('releases the attention slot when there is nothing left to ask', () => {
    const both = ['sleepTiming', 'selfRatedHealth'] as const;
    expect(pendingAsk(input({ lastSelfRatedHealth: undefined }), [...both])).toBeNull();
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

  it('is the superseded measure, and says so rather than being scored', () => {
    // The duration version is never scored. The published effect sizes
    // belong to the index computed from CLOCK TIMES, which lives in
    // sleepTiming.ts and is the component the instrument actually reads —
    // this one is the fallback for somebody with months of Health duration
    // data and no answered bed times.
    const reading = readPace({ age: 45, sexAtBirth: 'male' });
    const component = reading.components.find((c) => c.id === 'sleepRegularity')!;
    expect(component.logHazard).toBeNull();
    expect(REGULARITY_NOTE).toMatch(/weaker cousin/i);
    expect(REGULARITY_NOTE).toMatch(/computes the real thing instead/i);
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
