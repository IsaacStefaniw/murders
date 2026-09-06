/**
 * The morning reading and the local day.
 *
 * Health readings are stamped as instants and the readiness read asks
 * "is this today's?". Answered by slicing the ISO string, that question
 * is answered in UTC — and in Sydney a reading taken at seven in the
 * morning was still yesterday's until eleven, so the readiness card went
 * blank for the whole working morning and the baseline quietly absorbed
 * the reading it should have been judging.
 *
 * Every time below is built from LOCAL components, so the expectations
 * are the same in Sydney, Perth, Auckland and UTC. Run this file under
 * each of those; only the local-day version of the code passes all four.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { baselineFor, readinessFrom } from '@/features/health/readiness';
import { sleepDebt } from '@/features/health/sleepDebt';
import { snapshotObservations } from '@/features/health/summarise';
import type { MetricObservation } from '@/features/model/metrics';

const local = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min, 0, 0);

/** Eleven in the morning, local, on Tuesday 8 September 2026. */
const NOW = local(2026, 9, 8, 11);

const reading = (key: string, value: number, at: Date, source: MetricObservation['source'] = 'healthkit'): MetricObservation => ({
  id: `${key}-${at.getTime()}`,
  key,
  value,
  at: at.toISOString(),
  source,
});

/** Ten mornings of the same number, each at seven, ending yesterday. */
const mornings = (key: string, value: number) =>
  Array.from({ length: 10 }, (_, i) => reading(key, value, local(2026, 9, 7 - i, 7)));

describe('a reading taken this morning, read before lunch', () => {
  it('counts as today, so a low HRV changes the session', () => {
    const metrics = [...mornings('body.hrv', 50), reading('body.hrv', 30, local(2026, 9, 8, 7))];
    const r = readinessFrom(metrics, NOW);
    expect(r?.band).toBe('back-off');
    expect(r?.signals[0]).toContain('40% below');
  });

  it('is kept out of the baseline, so it cannot normalise itself', () => {
    const metrics = [...mornings('body.hrv', 50), reading('body.hrv', 20, local(2026, 9, 8, 7))];
    expect(baselineFor(metrics, 'body.hrv', NOW)).toBe(50);
  });

  it('a raised resting heart rate this morning is seen too', () => {
    const metrics = [...mornings('body.restingHr', 52), reading('body.restingHr', 63, local(2026, 9, 8, 7))];
    expect(readinessFrom(metrics, NOW)?.band).toBe('back-off');
  });

  it('yesterday evening’s reading is still yesterday’s', () => {
    const metrics = [...mornings('body.hrv', 50), reading('body.hrv', 20, local(2026, 9, 7, 22))];
    expect(readinessFrom(metrics, NOW)).toBeNull();
  });
});

describe('a Health sync landing after a hand entry', () => {
  it('does not add a second sleep reading for the same local day', () => {
    const mine = reading('sleep.hours', 7, local(2026, 9, 8, 7), 'user');
    const out = snapshotObservations({ sleepHours: 6.5, restingHr: 54 }, [mine], NOW.toISOString());
    expect(out.map((o) => o.key)).toEqual(['body.restingHr']);
  });

  it('yesterday’s hand entry does not block today’s sync', () => {
    const mine = reading('sleep.hours', 7, local(2026, 9, 7, 7), 'user');
    const out = snapshotObservations({ sleepHours: 6.5 }, [mine], NOW.toISOString());
    expect(out.map((o) => o.key)).toEqual(['sleep.hours']);
  });
});

describe('sleep debt', () => {
  it('counts one night per local date, whoever wrote last', () => {
    const nights = Array.from({ length: 6 }, (_, i) => reading('sleep.hours', 7.5, local(2026, 9, 7 - i, 6)));
    // A second write for the same morning, later in the day.
    const corrected = reading('sleep.hours', 4, local(2026, 9, 7, 11), 'user');
    const d = sleepDebt([...nights, corrected], NOW)!;
    expect(d.nights).toBe(6);
    // The later write is the one that counts.
    expect(d.averageH).toBeLessThan(7.5);
  });
});

/**
 * The workout screen pre-fills the sleep chips from "today's" logged
 * sleep and finds it with `m.at.slice(0, 10) === todayKey()` — a UTC day
 * against a local one. In Sydney a reading entered at seven is not found
 * until eleven. The screen belongs to the training workstream; the test
 * is written and left skipped so the fix has somewhere to land:
 * `dateKeyOfIso(m.at) === today` in src/app/session/workout.tsx.
 */
describe('the workout screen’s sleep pre-fill', () => {
  it.skip('reads the day of a reading locally (src/app/session/workout.tsx, training-owned)', () => {
    const source = readFileSync(join(__dirname, '..', '..', '..', 'app', 'session', 'workout.tsx'), 'utf8');
    expect(source).not.toMatch(/\.at\.slice\(0, 10\)/);
    expect(source).toMatch(/dateKeyOfIso\(m\.at\)/);
  });
});
