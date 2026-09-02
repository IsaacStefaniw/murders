/**
 * Thin Apple Health adapter — the ONLY file that talks to HealthKit.
 *
 * Everything meaningful (windowing, merging, dedupe) lives in
 * summarise.ts, which is pure and tested. On non-iOS platforms the
 * underlying library exports safe no-ops, so the web preview and tests
 * never touch native code. Read-only: IntentNorth never writes to Health.
 */

import {
  CategoryValueSleepAnalysis,
  isHealthDataAvailableAsync,
  queryCategorySamples,
  queryQuantitySamples,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import { Platform } from 'react-native';

import { useAppStore } from '@/state/store';

import { sleepHoursLastNight, snapshotObservations, type HealthSnapshot } from './summarise';

const READ_TYPES = [
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierVO2Max',
  'HKQuantityTypeIdentifierHeight',
  'HKQuantityTypeIdentifierWaistCircumference',
] as const;

/**
 * How far back each signal is worth looking, in hours.
 *
 * These are not one number because the signals do not move at one speed.
 * HRV and resting heart rate are today's readings and stale ones say
 * nothing about today; VO2max is estimated from outdoor walks and may not
 * update for a fortnight; height does not change. Using a single window
 * would either throw away a perfectly good VO2max or treat a three-week-old
 * HRV as this morning's recovery.
 */
const WINDOW_HOURS = {
  sleep: 18,
  restingHr: 48,
  weight: 48,
  hrv: 48,
  vo2max: 24 * 90,
  height: 24 * 365 * 5,
  waist: 24 * 90,
} as const;

const ASLEEP_VALUES = new Set<number>([
  CategoryValueSleepAnalysis.asleepUnspecified,
  CategoryValueSleepAnalysis.asleepCore,
  CategoryValueSleepAnalysis.asleepDeep,
  CategoryValueSleepAnalysis.asleepREM,
]);

const SYNC_INTERVAL_HOURS = 6;

export async function healthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await isHealthDataAvailableAsync();
  } catch {
    return false;
  }
}

/** Ask for read access and, on success, record the connection + sync. */
export async function connectAppleHealth(): Promise<boolean> {
  try {
    const granted = await requestAuthorization({ toRead: READ_TYPES });
    if (!granted) return false;
    useAppStore.getState().setHealthConnected();
    await syncAppleHealth(true);
    return true;
  } catch {
    return false;
  }
}

async function readSnapshot(now: Date): Promise<HealthSnapshot> {
  const since = (hours: number) => new Date(now.getTime() - hours * 3600e3);

  // Spelled out rather than looped: the unit is part of each identifier's
  // type, so writing them literally is what makes the compiler check that
  // 'ml/(kg*min)' is the VO2max unit and 'cm' is a length. A helper taking
  // strings would have compiled happily with either one wrong, and the
  // catch below would have turned that into a silently missing metric.
  const latestSample = { limit: 1 } as const;
  const window = (hours: number) => ({ date: { startDate: since(hours), endDate: now } });

  const [sleep, rhr, weight, hrv, vo2max, height, waist] = await Promise.all([
    queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      limit: 0,
      filter: window(WINDOW_HOURS.sleep),
    }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierRestingHeartRate', {
      ...latestSample,
      unit: 'count/min',
      filter: window(WINDOW_HOURS.restingHr),
    }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', {
      ...latestSample,
      unit: 'kg',
      filter: window(WINDOW_HOURS.weight),
    }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', {
      ...latestSample,
      unit: 'ms',
      filter: window(WINDOW_HOURS.hrv),
    }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierVO2Max', {
      ...latestSample,
      unit: 'ml/(kg*min)',
      filter: window(WINDOW_HOURS.vo2max),
    }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierHeight', {
      ...latestSample,
      unit: 'cm',
      filter: window(WINDOW_HOURS.height),
    }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierWaistCircumference', {
      ...latestSample,
      unit: 'cm',
      filter: window(WINDOW_HOURS.waist),
    }).catch(() => []),
  ]);

  return {
    sleepHours: sleepHoursLastNight(
      sleep.map((s) => ({
        start: new Date(s.startDate).toISOString(),
        end: new Date(s.endDate).toISOString(),
        asleep: ASLEEP_VALUES.has(s.value as number),
      })),
      now,
    ),
    restingHr: rhr[0]?.quantity ?? null,
    weightKg: weight[0]?.quantity ?? null,
    hrvMs: hrv[0]?.quantity ?? null,
    vo2max: vo2max[0]?.quantity ?? null,
    heightCm: height[0]?.quantity ?? null,
    waistCm: waist[0]?.quantity ?? null,
  };
}

/**
 * Pull the latest readings into the metric stream. Throttled unless
 * forced; silent on failure — health data is a quiet input, never an error
 * the user has to manage.
 */
export async function syncAppleHealth(force = false): Promise<void> {
  const store = useAppStore.getState();
  if (!store.healthConnectedAt || Platform.OS !== 'ios') return;
  const last = store.healthLastSyncAt;
  if (!force && last && Date.now() - new Date(last).getTime() < SYNC_INTERVAL_HOURS * 3600e3) {
    return;
  }
  try {
    const now = new Date();
    const observations = snapshotObservations(await readSnapshot(now), store.metrics, now.toISOString());
    store.appendHealthObservations(observations);
  } catch {
    // Next sync will try again; the engine works fine without it.
  }
}
