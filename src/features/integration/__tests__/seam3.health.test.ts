/**
 * Seam 3 — last night, walked to the note on the session.
 *
 * Apple Health answers the adapter with sleep segments and this morning's
 * heart-rate variability; the adapter writes them into the same metric
 * stream a hand entry uses; readiness reads them against the person's own
 * baseline; the workout screen hands both to autoRegulate; and the session
 * carries a note that says what changed and why. HealthKit itself is
 * replaced, as in the adapter's own suite. Nothing here talks to a phone.
 */

import * as healthkitModule from '@kingstinct/react-native-healthkit';
import { Platform } from 'react-native';

import { syncAppleHealth } from '@/features/health/healthkit';
import { readinessFrom } from '@/features/health/readiness';
import { latest } from '@/features/model/metrics';
import { autoRegulate, weekOf, type ProgrammeSession } from '@/features/training/programme';
import { dateKeyOfIso, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

import { daysAgoAt, onboard } from './harness';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  CategoryValueSleepAnalysis: { asleepUnspecified: 1, asleepCore: 3, asleepDeep: 4, asleepREM: 5, inBed: 0, awake: 2 },
  isHealthDataAvailableAsync: jest.fn(async () => true),
  queryCategorySamples: jest.fn(async () => []),
  queryQuantitySamples: jest.fn(async () => []),
  requestAuthorization: jest.fn(async () => true),
}));

const hk = healthkitModule as unknown as {
  queryCategorySamples: jest.Mock;
  queryQuantitySamples: jest.Mock;
};

const s = () => useAppStore.getState();

/** One night's sleep as Health reports it: core and REM, ending hours ago. */
function night(hours: number) {
  const end = Date.now() - 3 * 3600e3;
  const start = end - hours * 3600e3;
  const mid = start + (hours / 2) * 3600e3;
  return [
    { startDate: new Date(start), endDate: new Date(mid), value: 3 },
    { startDate: new Date(mid), endDate: new Date(end), value: 5 },
  ];
}

/** What the workout screen runs today: the programmed session for the weekday. */
function todaysSession(): ProgrammeSession {
  const programme = s().trainingProgramme!;
  const week = weekOf(programme)!;
  expect(week).toBe(1);
  const sessions = programme.weeks[week - 1].sessions;
  const weekday = new Date().getDay();
  return sessions[Math.floor((weekday * sessions.length) / 7) % sessions.length];
}

/** Fourteen mornings of the person's own HRV, so this morning has a normal to be read against. */
function seedHrvBaseline(ms: number) {
  const history = Array.from({ length: 13 }, (_, i) => ({
    id: `hrv-${i}`,
    key: 'body.hrv',
    value: ms,
    at: daysAgoAt(i + 1, 7),
    source: 'healthkit' as const,
  }));
  useAppStore.setState({ metrics: [...s().metrics, ...history] });
}

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  hk.queryCategorySamples.mockResolvedValue([]);
  hk.queryQuantitySamples.mockResolvedValue([]);
  onboard({ age: '35' });
  s().startPath('training', { experience: 'consistent', frequency: '3-4', limiter: 'nothing' });
  s().buildTrainingBlock();
  s().setHealthConnected();
});

afterEach(() => jest.restoreAllMocks());

describe('a short night from Apple Health changes the session and says so', () => {
  it('sleep → metric → readiness → autoRegulate → the note', async () => {
    hk.queryCategorySamples.mockResolvedValue(night(5.5));
    await syncAppleHealth(true);

    // The metric, on today's local day, from Health.
    const sleep = latest(s().metrics, 'sleep.hours')!;
    expect(sleep.value).toBe(5.5);
    expect(sleep.source).toBe('healthkit');
    expect(dateKeyOfIso(sleep.at)).toBe(todayKey());
    expect(s().healthLastSyncAt).not.toBeNull();

    // Readiness names the number and the line it crossed.
    const readiness = readinessFrom(s().metrics)!;
    expect(readiness.band).toBe('caution');
    expect(readiness.signals).toEqual(['5.5 hours of sleep — under the six that changes what a session should be.']);
    expect(readiness.headline).toBe('Worth going in a little conservative today.');

    // The session, regulated the way the workout screen regulates it.
    const programmed = todaysSession();
    const mains = programmed.exercises.filter((e) => !e.accessory);
    expect(programmed.exercises.filter((e) => e.accessory).length).toBeGreaterThan(1);
    const adjusted = autoRegulate(programmed, {
      availableMin: 60,
      sleptHours: sleep.value,
      age: s().trainingProgramme!.inputs.age,
      readiness: readiness.band,
    })!;
    expect(adjusted.note).toBe('Short night — main work stays, accessories rest today.');
    expect(adjusted.exercises.filter((e) => !e.accessory).map((e) => e.name)).toEqual(mains.map((e) => e.name));
    expect(adjusted.exercises.filter((e) => e.accessory)).toHaveLength(1);
    expect(adjusted.exercises.filter((e) => !e.accessory).map((e) => e.loadKg)).toEqual(mains.map((e) => e.loadKg));
    // The screen shows the note in place of the week's focus.
    expect(adjusted.note ?? s().trainingProgramme!.weeks[0].focus).toBe(adjusted.note);

    // A second sync the same morning writes nothing new.
    const count = s().metrics.length;
    await syncAppleHealth(true);
    expect(s().metrics.length).toBe(count);
  });

  it('HRV well under the person’s own normal backs the session off, with a full night', async () => {
    seedHrvBaseline(60);
    hk.queryCategorySamples.mockResolvedValue(night(7.5));
    hk.queryQuantitySamples.mockImplementation(async (id: string) =>
      id.includes('HeartRateVariability') ? [{ quantity: 40 }] : [],
    );
    await syncAppleHealth(true);

    expect(latest(s().metrics, 'body.hrv')!.value).toBe(40);
    expect(latest(s().metrics, 'sleep.hours')!.value).toBe(7.5);

    const readiness = readinessFrom(s().metrics)!;
    expect(readiness.band).toBe('back-off');
    expect(readiness.signals).toHaveLength(1);
    expect(readiness.signals[0]).toMatch(/33% below your own two-week normal \(40 against 60 ms\)/);
    expect(readiness.headline).toBe('Keep the main work, drop the extras today.');

    const programmed = todaysSession();
    const adjusted = autoRegulate(programmed, {
      availableMin: 60,
      sleptHours: 7.5,
      age: s().trainingProgramme!.inputs.age,
      readiness: readiness.band,
    })!;
    expect(adjusted.note).toBe('Your own recovery numbers are down this morning — main work stays, accessories rest today.');
    expect(adjusted.exercises.filter((e) => e.accessory)).toHaveLength(1);
    expect(adjusted.exercises.filter((e) => !e.accessory)).toHaveLength(programmed.exercises.filter((e) => !e.accessory).length);
  });

  it('a normal night and a normal morning leave the session untouched, with no note', async () => {
    seedHrvBaseline(60);
    hk.queryCategorySamples.mockResolvedValue(night(7.5));
    hk.queryQuantitySamples.mockImplementation(async (id: string) =>
      id.includes('HeartRateVariability') ? [{ quantity: 58 }] : [],
    );
    await syncAppleHealth(true);
    expect(readinessFrom(s().metrics)).toBeNull();
    const programmed = todaysSession();
    const adjusted = autoRegulate(programmed, { availableMin: 60, sleptHours: 7.5, readiness: undefined });
    expect(adjusted).toBe(programmed);
    expect(adjusted!.note).toBeUndefined();
  });

  it('a hand entry this morning is kept when Health syncs after it', async () => {
    s().addMetric('sleep.hours', 6.5, 'pre-workout check');
    hk.queryCategorySamples.mockResolvedValue(night(5));
    await syncAppleHealth(true);
    const own = s().metrics.filter((m) => m.key === 'sleep.hours');
    expect(own).toHaveLength(1);
    expect(own[0].value).toBe(6.5);
    expect(readinessFrom(s().metrics)).toBeNull();
    const adjusted = autoRegulate(todaysSession(), { availableMin: 60, sleptHours: 6.5 });
    expect(adjusted!.note).toBeUndefined();
  });
});
