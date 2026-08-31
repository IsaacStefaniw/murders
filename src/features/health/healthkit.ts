/**
 * Thin Apple Health adapter — the ONLY file that talks to HealthKit.
 *
 * Everything meaningful (windowing, merging, dedupe) lives in
 * summarise.ts, which is pure and tested. On non-iOS platforms the
 * underlying library exports safe no-ops, so the web preview and tests
 * never touch native code. Read-only: INTENT never writes to Health.
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
] as const;

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

  const [sleep, rhr, weight] = await Promise.all([
    queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      limit: 0,
      filter: { date: { startDate: since(18), endDate: now } },
    }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierRestingHeartRate', {
      limit: 1,
      unit: 'count/min',
      filter: { date: { startDate: since(48), endDate: now } },
    }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', {
      limit: 1,
      unit: 'kg',
      filter: { date: { startDate: since(48), endDate: now } },
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
  };
}

/**
 * Pull last night's sleep, latest resting HR and weight into the metric
 * stream. Throttled unless forced; silent on failure — health data is a
 * quiet input, never an error the user has to manage.
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
