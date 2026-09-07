/**
 * The first morning, for someone who already has two years of nights.
 *
 * The defect this file was written against: readiness needs fourteen days
 * of a person's OWN readings before it can say anything, and the adapter
 * read one sample from a 48-hour window. Someone who had worn a ring or a
 * watch every night for two years — whose phone already held every one of
 * those nights — got nothing, and waited a fortnight for a baseline that
 * was sitting on the device the whole time.
 *
 * Every time below is built from LOCAL components, so the expectations are
 * the same in Sydney, in Perth and in UTC. Run the file under
 * `TZ=Australia/Sydney` and under `TZ=UTC`; only a local-day version of
 * the code passes both, because a day stamped in UTC and read back in
 * Sydney is a different day for ten hours out of every twenty-four.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as healthkitModule from '@kingstinct/react-native-healthkit';
import { Platform } from 'react-native';

import { HISTORY_DAYS, syncAppleHealth } from '@/features/health/healthkit';
import { baselineFor, readinessCoverage, readinessFrom } from '@/features/health/readiness';
import {
  historyObservations,
  type DatedValue,
  type HealthHistory,
  type SleepSegment,
} from '@/features/health/summarise';
import { latest, type MetricObservation } from '@/features/model/metrics';
import { dateKeyOfIso } from '@/lib/dates';
import { STORE_KEY, checkBackup, exportBackup } from '@/state/backup';
import { PERSIST_VERSION } from '@/state/hygiene';
import { useAppStore } from '@/state/store';

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
  requestAuthorization: jest.Mock;
};

const s = () => useAppStore.getState();

/** An hour on a local day, counted back from today. */
function dayAt(daysAgo: number, hour: number, minute = 0): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hour, minute, 0, 0);
}

const dayKey = (daysAgo: number) => dateKeyOfIso(dayAt(daysAgo, 12).toISOString());

/** A reading a day at seven in the morning, `days` of them, ending yesterday. */
function everyMorning(days: number, value: (daysAgo: number) => number): DatedValue[] {
  return Array.from({ length: days }, (_, i) => ({
    at: dayAt(i + 1, 7).toISOString(),
    value: value(i + 1),
  }));
}

/** One night in stages, as Health files it: asleep from `fromH` last evening to `toH` this morning. */
function night(daysAgo: number, hours: number): SleepSegment[] {
  const wake = dayAt(daysAgo, 6, 30);
  const asleepAt = new Date(wake.getTime() - hours * 3600e3);
  const mid = new Date(wake.getTime() - (hours / 2) * 3600e3);
  return [
    { start: asleepAt.toISOString(), end: mid.toISOString(), asleep: true },
    { start: mid.toISOString(), end: wake.toISOString(), asleep: true },
  ];
}

/** Sixty days of a person who wears the thing every night. */
function twoMonths(): HealthHistory {
  return {
    hrvMs: everyMorning(HISTORY_DAYS, () => 60),
    restingHr: everyMorning(HISTORY_DAYS, () => 52),
    weightKg: everyMorning(HISTORY_DAYS, () => 84.2),
    sleep: Array.from({ length: HISTORY_DAYS }, (_, i) => night(i + 1, 7.5)).flat(),
  };
}

const user = (key: string, value: number, at: Date): MetricObservation => ({
  id: `own-${key}-${at.getTime()}`,
  key,
  value,
  at: at.toISOString(),
  source: 'user',
  note: 'entered by hand',
});

beforeEach(() => {
  s().resetAll();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.replaceProperty(Platform, 'OS', 'ios');
  hk.requestAuthorization.mockResolvedValue(true);
  hk.queryQuantitySamples.mockResolvedValue([]);
  hk.queryCategorySamples.mockResolvedValue([]);
});

describe('sixty days of history, read on the first morning', () => {
  it('is one reading per key per local day, at that day’s own noon', () => {
    const out = historyObservations(twoMonths(), []);
    const hrv = out.filter((o) => o.key === 'body.hrv');
    expect(hrv).toHaveLength(HISTORY_DAYS);
    expect(new Set(hrv.map((o) => dateKeyOfIso(o.at))).size).toBe(HISTORY_DAYS);
    expect(out.every((o) => o.source === 'healthkit')).toBe(true);
    // Noon local, which is the stamp a saved session already gets.
    for (const o of hrv) expect(new Date(o.at).getHours()).toBe(12);
  });

  it('gives a real fourteen-day median immediately, not in a fortnight', () => {
    const metrics = historyObservations(twoMonths(), []);
    expect(baselineFor(metrics, 'body.hrv')).toBe(60);
    expect(baselineFor(metrics, 'body.restingHr')).toBe(52);
    // What the person actually sees: this morning's reading, read against
    // their own normal, on day one.
    const thisMorning: MetricObservation = {
      id: 'today-hrv',
      key: 'body.hrv',
      value: 35,
      at: dayAt(0, 7).toISOString(),
      source: 'healthkit',
    };
    const r = readinessFrom([...metrics, thisMorning])!;
    expect(r.band).toBe('back-off');
    expect(r.signals[0]).toContain('35 against 60');
    expect(readinessCoverage([...metrics, thisMorning]).ready).toBe(true);
  });

  it('every day it writes reads back as the day it came from, in this timezone', () => {
    const out = historyObservations(twoMonths(), []);
    const days = new Set(out.map((o) => dateKeyOfIso(o.at)));
    for (let i = 1; i <= HISTORY_DAYS; i++) expect(days.has(dayKey(i))).toBe(true);
    // Today belongs to the snapshot path, and no reading is stamped ahead of now.
    expect(days.has(dayKey(0))).toBe(false);
    expect(out.every((o) => o.at <= new Date().toISOString())).toBe(true);
  });

  it('counts a night that crosses midnight once, on the morning it ended', () => {
    const out = historyObservations({ sleep: night(1, 7.5) }, []);
    expect(out).toHaveLength(1);
    expect(out[0].key).toBe('sleep.hours');
    expect(out[0].value).toBe(7.5);
    expect(dateKeyOfIso(out[0].at)).toBe(dayKey(1));
  });

  it('counts only time asleep — in bed and awake are not sleep', () => {
    const wake = dayAt(2, 6, 30);
    const segments: SleepSegment[] = [
      { start: new Date(wake.getTime() - 9 * 3600e3).toISOString(), end: new Date(wake.getTime() - 8 * 3600e3).toISOString(), asleep: false },
      { start: new Date(wake.getTime() - 8 * 3600e3).toISOString(), end: wake.toISOString(), asleep: true },
    ];
    expect(historyObservations({ sleep: segments }, [])[0].value).toBe(8);
  });
});

describe('running it twice writes nothing the second time', () => {
  it('because a day that already has a reading is left alone', () => {
    const first = historyObservations(twoMonths(), []);
    expect(first.length).toBeGreaterThan(200);
    expect(historyObservations(twoMonths(), first)).toEqual([]);
    // And a third time, against the same stream.
    expect(historyObservations(twoMonths(), [...first])).toEqual([]);
  });
});

describe('a reading the person entered themselves', () => {
  it('is never overwritten by one read back from Health', () => {
    const mine = user('body.hrv', 41, dayAt(3, 8));
    const out = historyObservations(twoMonths(), [mine]);
    const thatDay = out.filter((o) => o.key === 'body.hrv' && dateKeyOfIso(o.at) === dayKey(3));
    expect(thatDay).toEqual([]);
    // Theirs still stands, and it is theirs the engine reads for that day.
    expect(latest([...out, mine].filter((o) => dateKeyOfIso(o.at) === dayKey(3)), 'body.hrv')?.value).toBe(41);
    // Every other day is still filled in.
    expect(out.filter((o) => o.key === 'body.hrv')).toHaveLength(HISTORY_DAYS - 1);
  });
});

describe('a device with only three days on it', () => {
  it('produces no baseline, and the coverage says so honestly', () => {
    const short: HealthHistory = {
      hrvMs: everyMorning(3, () => 58),
      restingHr: everyMorning(3, () => 51),
      sleep: [night(1, 7), night(2, 7), night(3, 7)].flat(),
    };
    const metrics = historyObservations(short, []);
    expect(metrics.filter((o) => o.key === 'body.hrv')).toHaveLength(3);
    expect(baselineFor(metrics, 'body.hrv')).toBeNull();
    expect(readinessFrom(metrics)).toBeNull();
    const coverage = readinessCoverage(metrics);
    expect(coverage.ready).toBe(false);
    expect(coverage.missing).toEqual(['heart-rate variability', 'resting heart rate']);
    // Three days is not evidence that a signal will never come.
    expect(coverage.note).toBeNull();
  });
});

describe('through the adapter, on the first sync', () => {
  /** Health answers with sixty days; the snapshot query still gets one sample. */
  function healthHolds(history: HealthHistory) {
    const quantity = (rows: DatedValue[] | undefined) =>
      (rows ?? []).map((v) => ({ quantity: v.value, startDate: new Date(v.at), endDate: new Date(v.at) }));
    hk.queryQuantitySamples.mockImplementation(async (id: string, options: { limit?: number }) => {
      const rows = id.includes('HeartRateVariability')
        ? quantity(history.hrvMs)
        : id.includes('RestingHeartRate')
          ? quantity(history.restingHr)
          : id.includes('BodyMass')
            ? quantity(history.weightKg)
            : [];
      if (rows.length === 0) return [];
      return options.limit === 1 ? [rows[rows.length - 1]] : rows;
    });
    hk.queryCategorySamples.mockImplementation(async () =>
      (history.sleep ?? []).map((seg) => ({
        startDate: new Date(seg.start),
        endDate: new Date(seg.end),
        value: seg.asleep ? 3 : 0,
      })),
    );
  }

  it('the person’s own normal is there on day one, and their morning is read against it', async () => {
    healthHolds({
      ...twoMonths(),
      // This morning's reading, well under their own normal.
      hrvMs: [...everyMorning(HISTORY_DAYS, () => 60), { at: dayAt(0, 6, 45).toISOString(), value: 35 }],
    });
    useAppStore.setState({ healthConnectedAt: new Date().toISOString() });

    await syncAppleHealth(true);

    const metrics = s().metrics;
    expect(baselineFor(metrics, 'body.hrv')).toBe(60);
    expect(baselineFor(metrics, 'body.restingHr')).toBe(52);
    expect(latest(metrics, 'body.hrv')?.value).toBe(35);
    expect(readinessFrom(metrics)?.band).toBe('back-off');
    expect(s().healthHistoryReadAt).not.toBeNull();
  });

  it('does not read the history again on the next sync, or the one after', async () => {
    healthHolds(twoMonths());
    useAppStore.setState({ healthConnectedAt: new Date().toISOString() });
    await syncAppleHealth(true);
    const after = s().metrics.length;
    const readAt = s().healthHistoryReadAt;

    await syncAppleHealth(true);
    await syncAppleHealth(true);

    expect(s().metrics.length).toBe(after);
    expect(s().healthHistoryReadAt).toBe(readAt);
  });

  it('skips the read entirely for someone whose own readings are already a baseline', async () => {
    healthHolds(twoMonths());
    const own = [
      ...Array.from({ length: 14 }, (_, i) => user('body.hrv', 55, dayAt(i + 1, 7))),
      ...Array.from({ length: 14 }, (_, i) => user('body.restingHr', 49, dayAt(i + 1, 7))),
    ];
    useAppStore.setState({ healthConnectedAt: new Date().toISOString(), metrics: own });

    await syncAppleHealth(true);

    // Nothing was read back over the top of their own fortnight. Today's
    // snapshot still lands, as it does every morning.
    const backfilled = s().metrics.filter((m) => m.source === 'healthkit' && dateKeyOfIso(m.at) !== dayKey(0));
    expect(backfilled).toEqual([]);
    expect(s().metrics.filter((m) => m.source === 'user')).toHaveLength(own.length);
    expect(s().healthHistoryReadAt).not.toBeNull();
  });

  it('says nothing at all when Health holds nothing', async () => {
    healthHolds({});
    useAppStore.setState({ healthConnectedAt: new Date().toISOString() });

    await syncAppleHealth(true);

    expect(s().metrics).toEqual([]);
    expect(readinessFrom(s().metrics)).toBeNull();
    expect(readinessCoverage(s().metrics).note).toBeNull();
  });

  it('never writes to Health', () => {
    const source = readFileSync(join(__dirname, '..', 'healthkit.ts'), 'utf8');
    expect(source).not.toMatch(/save[A-Z]\w*(Sample|Object)|deleteObjects|toWrite|toShare/);
  });
});

describe('a person with no device', () => {
  it('is completely unaffected — nothing is read, nothing is written, nothing is claimed', async () => {
    await syncAppleHealth(true);
    expect(hk.queryQuantitySamples).not.toHaveBeenCalled();
    expect(hk.queryCategorySamples).not.toHaveBeenCalled();
    expect(s().metrics).toEqual([]);
    expect(s().healthHistoryReadAt).toBeNull();
    expect(s().healthLastSyncAt).toBeNull();
    expect(readinessFrom(s().metrics)).toBeNull();
    expect(readinessCoverage(s().metrics)).toEqual({
      ready: false,
      missing: ['heart-rate variability', 'resting heart rate'],
      workingFrom: [],
      note: null,
    });
  });

  it('and their hand-entered numbers still read exactly as they did', () => {
    const mine = Array.from({ length: 6 }, (_, i) => user('body.hrv', 50, dayAt(i + 1, 7)));
    useAppStore.setState({ metrics: mine });
    expect(baselineFor(s().metrics, 'body.hrv')).toBe(50);
    expect(s().healthHistoryReadAt).toBeNull();
  });
});

describe('the cap on the metric stream', () => {
  const CAP = 2000;

  it('never evicts the person’s own readings to make room for a read-back', () => {
    const own = Array.from({ length: CAP }, (_, i) => user('body.weight', 84, dayAt(CAP - i, 9)));
    useAppStore.setState({ metrics: own });

    s().appendHealthHistory(historyObservations(twoMonths(), []));

    const after = s().metrics;
    expect(after).toHaveLength(CAP);
    expect(after.every((o) => o.source === 'user')).toBe(true);
    expect(after.map((o) => o.id)).toEqual(own.map((o) => o.id));
    // It still only runs once, whatever it managed to write.
    expect(s().healthHistoryReadAt).not.toBeNull();
  });

  it('takes the room that is left, keeping its most recent days', () => {
    const own = Array.from({ length: CAP - 10 }, (_, i) => user('body.weight', 84, dayAt(CAP - i, 9)));
    useAppStore.setState({ metrics: own });
    const history = historyObservations(twoMonths(), []);

    s().appendHealthHistory(history);

    const after = s().metrics;
    expect(after).toHaveLength(CAP);
    expect(after.filter((o) => o.source === 'user')).toHaveLength(CAP - 10);
    expect(after.slice(-10)).toEqual(history.slice(-10));
  });
});

describe('a signal that is never coming', () => {
  /** A fortnight of sleep and resting heart rate, and not one variability reading. */
  const withoutHrv = () =>
    historyObservations(
      {
        restingHr: everyMorning(14, () => 52),
        sleep: Array.from({ length: 14 }, (_, i) => night(i + 1, 7.5)).flat(),
      },
      [],
    );

  it('is not listed as one more day of waiting', () => {
    const coverage = readinessCoverage(withoutHrv());
    expect(coverage.missing).not.toContain('heart-rate variability');
    expect(coverage.ready).toBe(true);
  });

  it('says what the read is working from instead, in plain words', () => {
    const coverage = readinessCoverage(withoutHrv());
    expect(coverage.workingFrom).toEqual(['resting heart rate', 'sleep']);
    expect(coverage.note).toContain('resting heart rate and sleep');
    expect(coverage.note).toContain('never come through');
    // No device is named, because none can be: only the absence of a type
    // is visible. And nothing here tells anyone what to do about it.
    expect(coverage.note).not.toMatch(/oura|whoop|garmin|apple watch|fitbit|polar/i);
    expect(coverage.note).not.toMatch(/\byou should\b|\btry\b|\bbuy\b|\bswitch to\b/i);
  });

  it('is still just missing while the days are few', () => {
    const early = historyObservations(
      {
        restingHr: everyMorning(6, () => 52),
        sleep: Array.from({ length: 6 }, (_, i) => night(i + 1, 7.5)).flat(),
      },
      [],
    );
    const coverage = readinessCoverage(early);
    expect(coverage.missing).toContain('heart-rate variability');
    expect(coverage.note).toBeNull();
  });

  it('and once one has ever arrived, it is waited for again', () => {
    const oneReading = user('body.hrv', 48, dayAt(9, 7));
    const coverage = readinessCoverage([...withoutHrv(), oneReading]);
    expect(coverage.missing).toContain('heart-rate variability');
    expect(coverage.note).toBeNull();
  });
});

describe('the once-only flag survives being put away and taken out again', () => {
  it('is part of the persisted state, and an older install starts with it unset', async () => {
    const { partialize } = useAppStore.persist.getOptions();
    expect('healthHistoryReadAt' in (partialize!(s()) as Record<string, unknown>)).toBe(true);

    // A blob from a build that never had the key: the read-back has not
    // run for this person, so it is null and it will run once.
    const older = partialize!(s()) as Record<string, unknown>;
    delete older.healthHistoryReadAt;
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ state: older, version: PERSIST_VERSION }));
    await useAppStore.persist.rehydrate();
    expect(s().healthHistoryReadAt).toBeNull();
  });

  it('comes back as it was written, so the read-back does not run twice', async () => {
    const stamp = new Date().toISOString();
    useAppStore.setState({ healthHistoryReadAt: stamp, healthConnectedAt: stamp });
    const stored = useAppStore.persist.getOptions().partialize!(s()) as Record<string, unknown>;
    expect(stored.healthHistoryReadAt).toBe(stamp);

    s().resetAll();
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ state: stored, version: PERSIST_VERSION }));
    await useAppStore.persist.rehydrate();

    expect(s().healthHistoryReadAt).toBe(stamp);
    hk.queryQuantitySamples.mockResolvedValue([]);
    await syncAppleHealth(true);
    // The snapshot ran; the history query did not.
    expect(hk.queryQuantitySamples.mock.calls.every(([, options]) => options.limit === 1)).toBe(true);
  });

  it('is carried by a backup taken from the same persisted blob', async () => {
    const stamp = new Date().toISOString();
    useAppStore.setState({ healthHistoryReadAt: stamp });
    await AsyncStorage.setItem(
      STORE_KEY,
      JSON.stringify({ state: useAppStore.persist.getOptions().partialize!(s()), version: PERSIST_VERSION }),
    );
    const backup = await exportBackup();
    expect(checkBackup(backup!).ok).toBe(true);
    expect(JSON.parse(backup!).state.healthHistoryReadAt).toBe(stamp);
  });
});

describe('nothing on a screen claims a baseline is still missing when it is not', () => {
  it('no screen carries the sentence at all', () => {
    const roots = ['src/app', 'src/features', 'src/components'];
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(entry.name) && !/__tests__/.test(p)) files.push(p);
      }
    };
    for (const r of roots) walk(join(process.cwd(), r));
    const hits = files.filter((f) => /not enough readings|enough readings yet|no baseline yet/i.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
});
