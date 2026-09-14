/**
 * "Asking when they fell asleep/woke up answers the consistency??? which is
 * why it's important signal each day."
 *
 * Exactly, and it corrects the previous build. Regularity was computed from
 * the variability of how LONG somebody slept, because sleep.hours was all
 * the app stored. These pin why that was the wrong quantity, and that the
 * index from clock times is the published one.
 */

import { readPace } from '@/features/health/pace';
import {
  SRI_MIN_NIGHTS,
  SRI_RR,
  sleepRegularityIndex,
  sriLogHazard,
  type SleepNight,
} from '@/features/health/sleepTiming';
import { sleepRegularity } from '@/features/health/dailyAsk';
import type { MetricObservation } from '@/features/model/metrics';

const TODAY = '2026-09-14';

/** n nights ending today, each with the given bed and wake clock times. */
function nights(spec: [bed: number, wake: number][]): SleepNight[] {
  return spec.map(([bedMin, wakeMin], i) => ({
    date: `2026-09-${String(14 - (spec.length - 1 - i)).padStart(2, '0')}`,
    bedMin,
    wakeMin,
  }));
}

const ELEVEN_PM = 23 * 60;
const SEVEN_AM = 7 * 60;

describe('the index', () => {
  it('needs a week of nights, as the study used', () => {
    expect(sleepRegularityIndex(nights([[ELEVEN_PM, SEVEN_AM]]), TODAY)).toBeNull();
    expect(SRI_MIN_NIGHTS).toBe(7);
  });

  it('reads 100 for identical timing every night', () => {
    const same = nights(Array.from({ length: 8 }, () => [ELEVEN_PM, SEVEN_AM] as [number, number]));
    const out = sleepRegularityIndex(same, TODAY)!;
    expect(out.sri).toBeCloseTo(100, 6);
    expect(out.band).toBe('regular');
  });

  it('falls as timing shifts, even when the hours are unchanged', () => {
    // The whole correction. Both of these average exactly eight hours a
    // night with no variation in duration at all — and one is regular
    // while the other is not. Duration cannot tell them apart.
    const steady = nights(
      Array.from({ length: 8 }, () => [ELEVEN_PM, SEVEN_AM] as [number, number]),
    );
    const shifting = nights(
      Array.from({ length: 8 }, (_, i) =>
        i % 2 === 0 ? [22 * 60, 6 * 60] : [1 * 60, 9 * 60],
      ) as [number, number][],
    );
    const a = sleepRegularityIndex(steady, TODAY)!;
    const b = sleepRegularityIndex(shifting, TODAY)!;
    expect(a.sri).toBeGreaterThan(b.sri);
    expect(b.band).not.toBe('regular');

    // And the superseded duration measure calls them identical, which is
    // precisely why it was the wrong quantity.
    const hours = (ns: SleepNight[]): MetricObservation[] =>
      ns.map((n, i) => ({
        id: `m${i}`,
        key: 'sleep.hours',
        value: 8,
        at: `${n.date}T08:00:00.000Z`,
        source: 'user',
      }));
    expect(sleepRegularity(hours(steady), TODAY)!.band).toBe(
      sleepRegularity(hours(shifting), TODAY)!.band,
    );
  });

  it('handles a night that crosses midnight', () => {
    // The fiddly part and the part that has to be right: an eleven-o'clock
    // bedtime is not a property of the morning it ends on.
    const out = sleepRegularityIndex(
      nights(Array.from({ length: 8 }, () => [ELEVEN_PM, SEVEN_AM] as [number, number])),
      TODAY,
    )!;
    // Eight nights describe seven complete days, so six pairs — the first
    // and last day are partial by construction and excluded.
    expect(out.pairs).toBe(6);
  });

  it('counts only consecutive pairs, never interpolating across a gap', () => {
    // Somebody who logs Monday and then Friday has told us nothing about
    // Tuesday, and the index must not pretend otherwise.
    const sparse: SleepNight[] = [
      { date: '2026-09-02', bedMin: ELEVEN_PM, wakeMin: SEVEN_AM },
      { date: '2026-09-05', bedMin: ELEVEN_PM, wakeMin: SEVEN_AM },
      { date: '2026-09-08', bedMin: ELEVEN_PM, wakeMin: SEVEN_AM },
      { date: '2026-09-11', bedMin: ELEVEN_PM, wakeMin: SEVEN_AM },
      { date: '2026-09-12', bedMin: ELEVEN_PM, wakeMin: SEVEN_AM },
      { date: '2026-09-13', bedMin: ELEVEN_PM, wakeMin: SEVEN_AM },
      { date: '2026-09-14', bedMin: ELEVEN_PM, wakeMin: SEVEN_AM },
    ];
    const out = sleepRegularityIndex(sparse, TODAY, 21)!;
    // Four consecutive nights at the end describe three complete days,
    // which is two comparable pairs. The isolated nights contribute
    // nothing, which is the point.
    expect(out.pairs).toBe(2);
  });
});

describe('as a component', () => {
  it('carries the published contrast, and is graded for the interpolation', () => {
    expect(SRI_RR.regular).toBe(1);
    expect(SRI_RR['very irregular']).toBeCloseTo(1.43, 2);
    expect(sriLogHazard('regular')).toBe(0);
    expect(sriLogHazard('very irregular')).toBeGreaterThan(0);
  });

  it('is scored, and marked self-reported because both errors flatter', () => {
    // Self-reported times, and a one-block model that cannot see night
    // wakings the accelerometry counted. Both push the same way.
    const reading = readPace({
      age: 45,
      sexAtBirth: 'male',
      sleepRegularity: { sri: 55, pairs: 10, band: 'very irregular' },
    });
    const c = reading.components.find((x) => x.id === 'sleepRegularity')!;
    expect(c.source).toBe('self-reported');
    expect(c.logHazard).toBeGreaterThan(0);
    expect(c.provenance.caveat).toMatch(/make ours read more regular than the truth/i);
  });

  it('says what it needs and why it cannot be back-filled', () => {
    const c = readPace({ age: 45 }).components.find((x) => x.id === 'sleepRegularity')!;
    expect(c.logHazard).toBeNull();
    expect(c.blocked).toMatch(/cannot be worked out later from an average/i);
  });
});

describe('the window edges', () => {
  it('does not read a clean fortnight as irregular just from where it was cut', () => {
    // Found by a test. A calendar day takes its morning from the night
    // dated that day and its evening from the night after; with only one
    // of those the day looks awake for half of it. A perfect
    // eleven-to-seven sleeper was scoring 92 instead of 100, entirely as
    // an artefact of the window boundary.
    for (const n of [7, 8, 10, 14]) {
      const perfect = nights(
        Array.from({ length: n }, () => [ELEVEN_PM, SEVEN_AM] as [number, number]),
      );
      expect(sleepRegularityIndex(perfect, TODAY)!.sri).toBeCloseTo(100, 6);
    }
  });

  it('separates a small drift from a real swing', () => {
    const drift = nights(
      Array.from({ length: 8 }, (_, i) =>
        i % 2 === 0 ? [ELEVEN_PM, SEVEN_AM] : [ELEVEN_PM + 45, SEVEN_AM + 45],
      ) as [number, number][],
    );
    const swing = nights(
      Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? [22 * 60, 6 * 60] : [60, 9 * 60])) as [
        number,
        number,
      ][],
    );
    expect(sleepRegularityIndex(drift, TODAY)!.band).toBe('regular');
    expect(sleepRegularityIndex(swing, TODAY)!.band).toBe('very irregular');
  });
});
