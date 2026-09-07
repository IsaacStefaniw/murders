/**
 * The rest alert against a fake operating system.
 *
 * The rules that matter here are the ones that keep a rest timer from
 * becoming a nag: exactly one pending alert at a time however many sets
 * are logged, a targeted cancel that does not take the evening's reminders
 * with it, and survival of the plan's cancel-and-replace sync — the one
 * that would otherwise silently swallow the buzz somebody is standing
 * there waiting for.
 */

import type { RestAlert } from '@/features/notifications/rest';
import type { PlannedNotification } from '@/features/notifications/schedule';

interface FakeOS {
  scheduled: Map<string, { title: string; when: number }>;
  cancelledAll: number;
  mod: Record<string, unknown>;
}

function fakeOS(status: 'granted' | 'denied' = 'granted'): FakeOS {
  const scheduled = new Map<string, { title: string; when: number }>();
  const os: FakeOS = { scheduled, cancelledAll: 0, mod: {} };
  let n = 0;
  os.mod = {
    getPermissionsAsync: async () => ({ status, canAskAgain: true }),
    requestPermissionsAsync: jest.fn(async () => ({ status })),
    scheduleNotificationAsync: async (input: {
      content: { title: string };
      trigger: { date: Date };
    }) => {
      const id = `os-${(n += 1)}`;
      scheduled.set(id, { title: input.content.title, when: input.trigger.date.getTime() });
      return id;
    },
    cancelScheduledNotificationAsync: async (id: string) => {
      scheduled.delete(id);
    },
    cancelAllScheduledNotificationsAsync: async () => {
      os.cancelledAll += 1;
      scheduled.clear();
    },
    getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
    setNotificationHandler: () => undefined,
    setNotificationChannelAsync: async () => undefined,
  };
  return os;
}

type Lib = typeof import('@/lib/notifications');

/** A fresh copy of the adapter, with its module-level cache reset. */
function loadLib(os: FakeOS): Lib {
  let lib!: Lib;
  jest.doMock('expo-notifications', () => os.mod);
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    lib = require('@/lib/notifications') as Lib;
  });
  return lib;
}

const alertAt = (offsetMs: number, title = 'Rest is up.'): RestAlert => ({
  at: Date.now() + offsetMs,
  title,
  body: 'Next set: Back squat.',
});

afterEach(() => {
  jest.resetModules();
  jest.dontMock('expo-notifications');
});

describe('the rest alert against the operating system', () => {
  it('schedules exactly one, at the end of the rest', async () => {
    const os = fakeOS();
    const lib = loadLib(os);
    expect(await lib.scheduleRestNotification(alertAt(90_000))).toBe(true);
    expect(os.scheduled.size).toBe(1);
  });

  /**
   * Forty sets in a session must not leave forty notifications queued. Each
   * new rest replaces the last, so the queue never grows past one.
   */
  it('keeps one pending however many sets are logged', async () => {
    const os = fakeOS();
    const lib = loadLib(os);
    for (let i = 0; i < 40; i += 1) {
      await lib.scheduleRestNotification(alertAt(60_000 + i));
    }
    expect(os.scheduled.size).toBe(1);
  });

  it('cancels the pending rest and nothing else', async () => {
    const os = fakeOS();
    const lib = loadLib(os);
    // The evening's plan is in the queue alongside the rest.
    const planned: PlannedNotification[] = [
      { id: 'p1', kind: 'wind_down', at: '22:30', date: '2099-01-01', title: 'Wind down', body: 'b' },
    ];
    await lib.syncScheduledNotifications(planned);
    await lib.scheduleRestNotification(alertAt(90_000));
    expect(os.scheduled.size).toBe(2);
    await lib.cancelRestNotification();
    expect(os.scheduled.size).toBe(1);
    expect([...os.scheduled.values()][0].title).toBe('Wind down');
  });

  it('is put back when the day’s plan re-syncs mid-rest', async () => {
    const os = fakeOS();
    const lib = loadLib(os);
    await lib.scheduleRestNotification(alertAt(90_000));
    const before = [...os.scheduled.values()][0].when;
    await lib.syncScheduledNotifications([]);
    expect(os.cancelledAll).toBe(1);
    expect(os.scheduled.size).toBe(1);
    // Same moment, not a fresh ninety seconds from the sync.
    expect([...os.scheduled.values()][0].when).toBe(before);
  });

  it('does not put back a rest that ended while the sync ran', async () => {
    const os = fakeOS();
    const lib = loadLib(os);
    await lib.scheduleRestNotification(alertAt(20));
    await new Promise((r) => setTimeout(r, 40));
    await lib.syncScheduledNotifications([]);
    expect(os.scheduled.size).toBe(0);
  });

  it('never schedules a rest in the past', async () => {
    const os = fakeOS();
    const lib = loadLib(os);
    expect(await lib.scheduleRestNotification(alertAt(-1_000))).toBe(false);
    expect(os.scheduled.size).toBe(0);
  });

  /** Turning notifications off means off — the rest alert included. */
  it('goes with everything else when notifications are turned off', async () => {
    const os = fakeOS();
    const lib = loadLib(os);
    await lib.scheduleRestNotification(alertAt(90_000));
    await lib.cancelAllNotifications();
    expect(os.scheduled.size).toBe(0);
    await lib.syncScheduledNotifications([]);
    expect(os.scheduled.size).toBe(0);
  });

  it('never asks for permission, and schedules nothing without it', async () => {
    const os = fakeOS('denied');
    const lib = loadLib(os);
    expect(await lib.scheduleRestNotification(alertAt(90_000))).toBe(false);
    expect(os.scheduled.size).toBe(0);
    expect(os.mod.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
