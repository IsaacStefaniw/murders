/**
 * Mood as a number the model can read.
 *
 * The case that matters is the first one: the answer he actually gave had
 * to be storable, and in `1 | 2 | 3 | 4 | 5` it was not.
 */

import {
  cleanMood,
  MOOD_CHIPS,
  MOOD_KEY,
  MOOD_RANGE,
  moodLabel,
  moodStanding,
  toReflectionMood,
} from '@/features/health/mood';
import { METRICS } from '@/features/model/metrics';

describe('the answer he gave is storable', () => {
  it('holds 7.5 without rounding it away', () => {
    expect(cleanMood(7.5)).toBe(7.5);
  });

  it('reads 7.5 as the chip he would have tapped', () => {
    // Rounds half upward: 7.5 is Good, not Fine. The band a half step
    // lands in has to still mean the word that was tapped.
    expect(toReflectionMood(7.5)).toBe(4);
    expect(moodLabel(7.5)).toBe('Good');
  });

  it('has a metric definition, which is the whole point', () => {
    // Without this the score sits on a Reflection and readiness,
    // Essential 8, paceInputs and summarise — all of which read `metrics`
    // — cannot see it.
    const def = METRICS.find((m) => m.key === MOOD_KEY);
    expect(def).toMatchObject({ key: 'mind.mood', unit: '/10', domain: 'mind', decimals: 1 });
  });
});

describe('cleanMood', () => {
  it('snaps to the half step', () => {
    expect(cleanMood(7.3)).toBe(7.5);
    expect(cleanMood(7.1)).toBe(7);
    expect(cleanMood(6.75)).toBe(7);
  });

  it('clamps rather than storing a typo', () => {
    expect(cleanMood(75)).toBe(10);
    expect(cleanMood(-4)).toBe(0);
  });

  it('never leaves the range, for any input', () => {
    for (let v = -20; v <= 30; v += 0.25) {
      const c = cleanMood(v);
      expect(c).toBeGreaterThanOrEqual(MOOD_RANGE.min);
      expect(c).toBeLessThanOrEqual(MOOD_RANGE.max);
    }
  });
});

describe('the bucket for the one consumer that still reads 1-5', () => {
  it('maps every chip onto its own rung', () => {
    expect(MOOD_CHIPS.map((c) => toReflectionMood(c.score))).toEqual([1, 2, 3, 4, 5]);
  });

  it('puts each chip at the centre of its band, so a half step stays inside the word', () => {
    for (const chip of MOOD_CHIPS) {
      const rung = toReflectionMood(chip.score);
      for (const score of [chip.score - 0.5, chip.score, chip.score + 0.5]) {
        if (score < MOOD_RANGE.min || score > MOOD_RANGE.max) continue;
        expect(toReflectionMood(score)).toBe(rung);
      }
    }
  });

  it('never returns a zero, because ReflectionMood has no zero', () => {
    expect(toReflectionMood(0)).toBe(1);
    expect(toReflectionMood(0.5)).toBe(1);
    expect(toReflectionMood(1)).toBe(1);
  });

  it('stays inside 1-5 for every score in the range', () => {
    for (let v = 0; v <= 10; v += 0.5) {
      const b = toReflectionMood(v);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(5);
    }
  });

  it('labels every score with a real word', () => {
    for (let v = 0; v <= 10; v += 0.5) {
      expect(MOOD_CHIPS.map((c) => c.label)).toContain(moodLabel(v));
    }
  });
});

describe('what a run of readings may claim', () => {
  it('refuses to call one reading a mood', () => {
    expect(moodStanding(1)).toMatch(/not yet a mood/);
  });

  it('says nothing is worth a line before a fortnight', () => {
    expect(moodStanding(0)).toMatch(/Nothing recorded yet/);
    expect(moodStanding(5)).toMatch(/fortnight/);
    expect(moodStanding(13)).toMatch(/fortnight/);
    expect(moodStanding(14)).toMatch(/enough/);
  });
});
