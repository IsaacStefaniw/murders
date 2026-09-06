/**
 * The one file that talks to HealthKit, with HealthKit replaced.
 *
 * Off iOS every call answers "no" and touches nothing; on iOS a refused
 * permission is a quiet false; a granted one records the connection and
 * pulls a first snapshot into the same metric stream a hand entry uses.
 */

import * as healthkitModule from '@kingstinct/react-native-healthkit';
import { Platform } from 'react-native';

import { connectAppleHealth, healthAvailable, syncAppleHealth } from '@/features/health/healthkit';
import { latest } from '@/features/model/metrics';
import { useAppStore } from '@/state/store';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  CategoryValueSleepAnalysis: { asleepUnspecified: 1, asleepCore: 3, asleepDeep: 4, asleepREM: 5, inBed: 0, awake: 2 },
  isHealthDataAvailableAsync: jest.fn(async () => true),
  queryCategorySamples: jest.fn(async () => []),
  queryQuantitySamples: jest.fn(async () => []),
  requestAuthorization: jest.fn(async () => false),
}));

const hk = healthkitModule as unknown as {
  isHealthDataAvailableAsync: jest.Mock;
  queryCategorySamples: jest.Mock;
  queryQuantitySamples: jest.Mock;
  requestAuthorization: jest.Mock;
};

// jest-expo runs as iOS by default; both sides of the platform guard are set explicitly.
const onIos = () => jest.replaceProperty(Platform, 'OS', 'ios');
const onAndroid = () => jest.replaceProperty(Platform, 'OS', 'android');

beforeEach(() => {
  useAppStore.getState().resetAll();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  hk.requestAuthorization.mockResolvedValue(false);
  hk.queryQuantitySamples.mockResolvedValue([]);
  hk.queryCategorySamples.mockResolvedValue([]);
});

describe('off iOS', () => {
  it('nothing is available and nothing is asked', async () => {
    onAndroid();
    expect(await healthAvailable()).toBe(false);
    expect(hk.isHealthDataAvailableAsync).not.toHaveBeenCalled();
    useAppStore.setState({ healthConnectedAt: '2026-09-01T00:00:00.000Z' });
    await syncAppleHealth(true);
    expect(hk.queryQuantitySamples).not.toHaveBeenCalled();
    expect(useAppStore.getState().healthLastSyncAt).toBeNull();
  });
});

describe('on iOS', () => {
  it('is available when the device says so', async () => {
    onIos();
    expect(await healthAvailable()).toBe(true);
    hk.isHealthDataAvailableAsync.mockRejectedValueOnce(new Error('no'));
    expect(await healthAvailable()).toBe(false);
  });

  it('a refused permission is a false, with no connection recorded', async () => {
    onIos();
    expect(await connectAppleHealth()).toBe(false);
    expect(useAppStore.getState().healthConnectedAt).toBeNull();
  });

  it('a thrown request is also a false, never a crash', async () => {
    onIos();
    hk.requestAuthorization.mockRejectedValueOnce(new Error('no entitlement'));
    expect(await connectAppleHealth()).toBe(false);
  });

  it('a granted permission records the connection and syncs a first snapshot', async () => {
    onIos();
    hk.requestAuthorization.mockResolvedValue(true);
    hk.queryQuantitySamples.mockImplementation(async (id: string) =>
      id.includes('RestingHeartRate') ? [{ quantity: 54, startDate: new Date(), endDate: new Date() }] : [],
    );
    expect(await connectAppleHealth()).toBe(true);
    const s = useAppStore.getState();
    expect(s.healthConnectedAt).not.toBeNull();
    expect(s.healthLastSyncAt).not.toBeNull();
    expect(latest(s.metrics, 'body.restingHr')?.value).toBe(54);
    expect(latest(s.metrics, 'body.restingHr')?.source).toBe('healthkit');
  });

  it('a sync without a connection does nothing', async () => {
    onIos();
    await syncAppleHealth(true);
    expect(hk.queryQuantitySamples).not.toHaveBeenCalled();
  });

  it('a sync within six hours of the last is skipped unless forced', async () => {
    onIos();
    useAppStore.setState({
      healthConnectedAt: '2026-09-01T00:00:00.000Z',
      healthLastSyncAt: new Date(Date.now() - 3600e3).toISOString(),
    });
    await syncAppleHealth();
    expect(hk.queryQuantitySamples).not.toHaveBeenCalled();
    await syncAppleHealth(true);
    expect(hk.queryQuantitySamples).toHaveBeenCalled();
  });

  it('a failing query leaves the other signals intact', async () => {
    onIos();
    useAppStore.setState({ healthConnectedAt: '2026-09-01T00:00:00.000Z' });
    hk.queryQuantitySamples.mockImplementation(async (id: string) => {
      if (id.includes('BodyMass')) throw new Error('denied');
      if (id.includes('RestingHeartRate')) return [{ quantity: 51 }];
      return [];
    });
    await syncAppleHealth(true);
    expect(latest(useAppStore.getState().metrics, 'body.restingHr')?.value).toBe(51);
    expect(latest(useAppStore.getState().metrics, 'body.weight')).toBeNull();
  });
});
