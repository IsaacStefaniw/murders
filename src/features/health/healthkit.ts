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

import { readinessCoverage } from './readiness';
import {
  historyObservations,
  sleepHoursLastNight,
  snapshotObservations,
  type DatedValue,
  type HealthHistory,
  type HealthSnapshot,
} from './summarise';

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
export const WINDOW_HOURS = {
  sleep: 18,
  restingHr: 48,
  weight: 48,
  hrv: 48,
  vo2max: 24 * 90,
  height: 24 * 365 * 5,
  waist: 24 * 90,
} as const;

/**
 * How far back the ONE-TIME read-back of history looks, in days.
 *
 * Someone who has worn a ring or a watch for two years already has every
 * night of it in Health. The windows above are about "what is today's
 * reading", and reading only those means a person waits a fortnight for a
 * baseline their phone could hand over on the first morning. Sixty days is
 * four times the fourteen the baseline is drawn from, so a person who
 * wears it most nights clears the bar even with gaps, and it is still a
 * small enough read to finish while they are looking at the screen.
 */
export const HISTORY_DAYS = 60;

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
 * Every sample in the window, turned into instants and numbers.
 *
 * A sample whose date or value did not come through is dropped rather than
 * guessed at: a reading that cannot be placed on a day is not a reading.
 */
function dated(
  rows: readonly { readonly quantity: number; readonly startDate: Date; readonly endDate: Date }[],
): DatedValue[] {
  return rows.flatMap((s) => {
    const at = new Date(s.endDate ?? s.startDate).getTime();
    if (!Number.isFinite(at) || !Number.isFinite(s.quantity)) return [];
    return [{ at: new Date(at).toISOString(), value: s.quantity }];
  });
}

/**
 * The history query: the same identifiers as the snapshot, one window of
 * sixty days, and no `limit` — every sample, not the latest one.
 *
 * Separate from `readSnapshot` on purpose. The per-signal windows above
 * answer "is this today's reading", which is a different question, and
 * folding the two together would either widen the daily read or narrow
 * this one.
 */
async function readHistory(now: Date): Promise<HealthHistory> {
  const startDate = new Date(now.getTime() - HISTORY_DAYS * 24 * 3600e3);
  const filter = { date: { startDate, endDate: now } };
  const all = { limit: 0 } as const;

  const [sleep, rhr, weight, hrv] = await Promise.all([
    queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { ...all, filter }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierRestingHeartRate', {
      ...all,
      unit: 'count/min',
      filter,
    }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', { ...all, unit: 'kg', filter }).catch(() => []),
    queryQuantitySamples('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', {
      ...all,
      unit: 'ms',
      filter,
    }).catch(() => []),
  ]);

  return {
    // The same asleep-category handling the nightly path uses; in-bed and
    // awake stages are not sleep and never counted as it.
    sleep: sleep.flatMap((s) => {
      const start = new Date(s.startDate).getTime();
      const end = new Date(s.endDate).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
      return [
        {
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          asleep: ASLEEP_VALUES.has(s.value as number),
        },
      ];
    }),
    restingHr: dated(rhr),
    weightKg: dated(weight),
    hrvMs: dated(hrv),
  };
}

/**
 * The one-time read-back, on the first sync after Health is connected.
 *
 * It runs once and is remembered, so a launch never pays for it twice.
 * When every baseline the read-back is for already exists — they have been
 * logging by hand, or they restored a backup — there is nothing left for
 * it to add, so the read is skipped and only the flag is written.
 */
async function backfillHistory(now: Date): Promise<void> {
  const store = useAppStore.getState();
  if (store.healthHistoryReadAt) return;
  if (readinessCoverage(store.metrics, now).missing.length === 0) {
    store.appendHealthHistory([]);
    return;
  }
  const history = await readHistory(now);
  // If Health holds nothing, this is an empty list and nothing is written.
  // The app says nothing rather than inventing a first fortnight.
  store.appendHealthHistory(historyObservations(history, store.metrics, now.toISOString()));
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
    // History first, then today: the read-back fills the days before this
    // one, and the snapshot below reads the stream again so today is never
    // written twice.
    await backfillHistory(now);
    const observations = snapshotObservations(
      await readSnapshot(now),
      useAppStore.getState().metrics,
      now.toISOString(),
    );
    store.appendHealthObservations(observations);
  } catch {
    // Next sync will try again; the engine works fine without it.
  }
}
