/**
 * "Where did it get my BMI from?"
 *
 * Isaac, using his own app, about a figure that was correct. The number
 * was never the problem — the silence about its origin was. These tests
 * are mostly about the two ways this can go wrong: naming a source that
 * does not exist, and going quiet about one that does.
 */

import {
  fromIngredients,
  fromObservation,
  fromReadings,
  sourceWord,
  whenWord,
} from '@/features/health/provenance';
import type { MetricObservation } from '@/features/model/metrics';

const TODAY = '2026-10-07';

const obs = (over: Partial<MetricObservation> = {}): MetricObservation => ({
  id: over.id ?? 'm1',
  key: over.key ?? 'body.weight',
  value: over.value ?? 83.4,
  at: over.at ?? `${TODAY}T07:10:00.000Z`,
  source: over.source ?? 'healthkit',
  note: over.note,
});

describe('who supplied it', () => {
  it('names the device, or the person, or the app', () => {
    expect(sourceWord('healthkit')).toBe('Apple Health');
    expect(sourceWord('user')).toBe('you entered it');
    expect(sourceWord('integration')).toBe('a connected app');
  });

  it('does not pretend the app measured what it only calculated', () => {
    expect(sourceWord('derived')).toBe('the app worked it out');
  });
});

describe('when, as a person would say it', () => {
  it('uses today and yesterday where those are the answer', () => {
    expect(whenWord(`${TODAY}T07:00:00Z`, TODAY)).toBe('today');
    expect(whenWord('2026-10-06T22:00:00Z', TODAY)).toBe('yesterday');
  });

  it('gives a date rather than arithmetic for anything older', () => {
    // "18 days ago" is a sum the reader has to do; "19 Sep" is something
    // they can check against their own memory.
    expect(whenWord('2026-09-19T08:00:00Z', TODAY)).toBe('19 Sep');
    expect(whenWord('2026-01-02T08:00:00Z', TODAY)).toBe('2 Jan');
  });

  it('shows the year once it is not this one', () => {
    // A height from last autumn is the difference between a current
    // figure and a stale one, and hiding it would be the same omission
    // this module exists to fix.
    expect(whenWord('2025-09-14T08:00:00Z', TODAY)).toBe('14 Sep 2025');
  });

  it('does not invent a date out of a malformed timestamp', () => {
    expect(whenWord('not-a-date', TODAY)).toBe('at some point');
  });
});

describe('a figure read straight off one observation', () => {
  it('says where and when', () => {
    expect(fromObservation(obs(), TODAY)).toBe('Apple Health, today');
    expect(fromObservation(obs({ source: 'user', at: '2026-09-14T09:00:00Z' }), TODAY)).toBe(
      'you entered it, 14 Sep',
    );
  });

  it('says nothing about nothing', () => {
    expect(fromObservation(null, TODAY)).toBeNull();
    expect(fromObservation(undefined, TODAY)).toBeNull();
  });
});

describe('a figure computed from several', () => {
  const weight = obs({ key: 'body.weight', value: 83.4 });
  const height = obs({
    id: 'm2',
    key: 'body.height',
    value: 182,
    source: 'user',
    at: '2026-09-14T09:00:00Z',
  });

  it('answers the question that produced this module', () => {
    expect(
      fromIngredients(
        [
          { value: '83.4 kg', obs: weight },
          { value: '182 cm', obs: height },
        ],
        TODAY,
      ),
    ).toBe('From 83.4 kg (Apple Health, today) and 182 cm (you entered it, 14 Sep).');
  });

  it('reads as a sentence with one, two or three ingredients', () => {
    expect(fromIngredients([{ value: '128/82', obs: weight }], TODAY)).toBe(
      'From 128/82 (Apple Health, today).',
    );
    const three = fromIngredients(
      [
        { value: 'a', obs: weight },
        { value: 'b', obs: weight },
        { value: 'c', obs: height },
      ],
      TODAY,
    )!;
    expect(three).toContain('(Apple Health, today), b');
    expect(three).toContain('and c (');
  });

  /**
   * The important refusal. A partial answer would name the input the
   * person already trusts and go quiet about the one they are asking
   * after, which is worse than saying nothing.
   */
  it('says nothing at all unless every ingredient can be traced', () => {
    expect(
      fromIngredients(
        [
          { value: '83.4 kg', obs: weight },
          { value: '182 cm', obs: null },
        ],
        TODAY,
      ),
    ).toBeNull();
    expect(fromIngredients([], TODAY)).toBeNull();
  });
});

describe('a figure averaged over several readings', () => {
  const night = (back: number, source: MetricObservation['source'] = 'healthkit') =>
    obs({
      id: `n${back}`,
      key: 'sleep.hours',
      value: 7.2,
      source,
      at: `2026-10-0${7 - back}T07:00:00.000Z`,
    });

  it('says how many, because that decides whether a mean means anything', () => {
    expect(fromReadings([night(0), night(1), night(2)], 'night', TODAY)).toBe(
      'From 3 nights — Apple Health. Most recent today.',
    );
  });

  it('is honest about a mean of one', () => {
    expect(fromReadings([night(2)], 'night', TODAY)).toBe(
      'From one night — Apple Health, 5 Oct.',
    );
  });

  it('names every source where the readings came from more than one', () => {
    // A week of Apple Health nights with one typed in by hand is worth
    // knowing about.
    const mixed = fromReadings([night(0), night(1, 'user')], 'night', TODAY)!;
    expect(mixed).toContain('Apple Health and you entered it');
  });

  it('says nothing about no readings', () => {
    expect(fromReadings([], 'night', TODAY)).toBeNull();
  });
});

describe('the house rules', () => {
  it('never produces a sentence that sounds like provenance and is not', () => {
    const vague = /calculated from your data|based on your info|from your profile|automatically/i;
    const lines = [
      fromObservation(obs(), TODAY),
      fromObservation(obs({ source: 'derived' }), TODAY),
      fromIngredients([{ value: '1', obs: obs() }], TODAY),
      fromReadings([obs({ key: 'sleep.hours' })], 'night', TODAY),
    ].filter((x): x is string => x !== null);
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      expect(line).not.toMatch(vague);
      expect(line).not.toMatch(/undefined|NaN|null/);
    }
  });
});
