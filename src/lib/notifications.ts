/**
 * The thin layer between computed times and the operating system.
 *
 * Everything decision-shaped lives in `features/notifications/schedule.ts`
 * and is pure. This file only asks permission, hands the list to the OS,
 * and clears what it previously scheduled. Keeping it this thin is what
 * lets the rules be tested at all — none of them need a device.
 *
 * It degrades rather than throws. The module is loaded dynamically, so a
 * build without it, a simulator that refuses, or a user who declines
 * permission all end at the same place: the times still appear in the app,
 * they simply do not arrive on the lock screen. An app that crashes because
 * someone said no to notifications deserves the review it gets.
 */

import type { RestAlert } from '@/features/notifications/rest';
import type { PlannedNotification } from '@/features/notifications/schedule';
import { toMinutes } from '@/lib/dates';

export type PermissionState = 'granted' | 'denied' | 'unavailable' | 'undetermined';

/**
 * The slice of expo-notifications used here. Declared structurally so the
 * dynamic import needs no type gymnastics and so a missing module is a
 * runtime absence rather than a compile error.
 */
interface NotificationsModule {
  getPermissionsAsync: () => Promise<{ status: string; canAskAgain: boolean }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  scheduleNotificationAsync: (input: {
    content: { title: string; body: string; data?: Record<string, unknown> };
    trigger: unknown;
  }) => Promise<string>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  cancelScheduledNotificationAsync?: (identifier: string) => Promise<void>;
  getAllScheduledNotificationsAsync: () => Promise<unknown[]>;
  setNotificationHandler: (handler: unknown) => void;
  setNotificationChannelAsync?: (id: string, channel: Record<string, unknown>) => Promise<unknown>;
  addNotificationResponseReceivedListener?: (
    listener: (response: NotificationResponseLike) => void,
  ) => { remove: () => void };
  getLastNotificationResponseAsync?: () => Promise<NotificationResponseLike | null>;
}

type NotificationResponseLike = {
  notification: { request: { content: { data?: Record<string, unknown> } } };
};

/**
 * Without a handler, iOS does not present a notification that arrives while
 * the app is in the FOREGROUND — it is delivered and silently swallowed.
 *
 * That is the failure mode this whole feature is most likely to ship with
 * and least likely to notice: the 20:15 intervention fires while someone
 * has the app open, nothing appears, and the reasonable conclusion is that
 * notifications are broken.
 *
 * `shouldShowAlert` is deprecated in this SDK; banner and list are the
 * fields that now decide presentation, and setting only the old one is the
 * same silent nothing.
 */
let handlerInstalled = false;

function installHandler(mod: NotificationsModule): void {
  if (handlerInstalled) return;
  handlerInstalled = true;
  try {
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        // No sound and no badge. An intervention is a quiet suggestion at a
        // useful moment; a chime and a red dot make it an alarm, and an
        // alarm about a habit is the thing people turn off.
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // A build without the module, or one that refuses — the app still works.
  }
}

let cached: NotificationsModule | null | undefined;

/**
 * The module itself, however this runtime is willing to hand it over.
 *
 * A dynamic import is not available everywhere the code runs — a plain
 * CommonJS test runner throws "a dynamic import callback was invoked
 * without --experimental-vm-modules" — and this file treated that throw as
 * "the module is absent". Which meant every rule in it, including the one
 * about the queue, was untestable and therefore untested. The synchronous
 * form is the fallback, not the first choice: the import is what keeps a
 * native module out of the web bundle.
 */
async function loadModule(): Promise<NotificationsModule> {
  try {
    return (await import('expo-notifications')) as unknown as NotificationsModule;
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  }
}

/** Null when the native module is absent — a web build, or one without it. */
async function load(): Promise<NotificationsModule | null> {
  if (cached !== undefined) return cached;
  try {
    cached = await loadModule();
    installHandler(cached);
    // Android drops any notification without a channel from API 26 on.
    // iPhone-first does not mean iPhone-only, and a silent drop is a bug
    // that only appears on someone else's phone.
    await cached.setNotificationChannelAsync?.('default', {
      name: 'IntentNorth',
      importance: 4,
      sound: null,
      vibrationPattern: [0, 250],
    });
  } catch {
    cached = null;
  }
  return cached;
}

export async function notificationPermission(): Promise<PermissionState> {
  const mod = await load();
  if (!mod) return 'unavailable';
  try {
    const { status } = await mod.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    return status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'unavailable';
  }
}

/**
 * Ask, once, at a moment the person has just opted in.
 *
 * Never called on launch. A permission prompt before anyone has seen what
 * the app would say is the fastest way to a permanent no, and iOS only
 * offers the prompt once.
 */
export async function requestNotificationPermission(): Promise<PermissionState> {
  const mod = await load();
  if (!mod) return 'unavailable';
  try {
    const existing = await mod.getPermissionsAsync();
    if (existing.status === 'granted') return 'granted';
    if (!existing.canAskAgain) return 'denied';
    const { status } = await mod.requestPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/**
 * Replace everything scheduled with exactly this list.
 *
 * Cancel-then-schedule rather than diffing: the planned list is derived
 * deterministically from state, so recomputing it is cheap and reconciling
 * it is not. It also means a person who turns something off gets silence
 * immediately rather than at the end of whatever was already queued.
 *
 * Returns how many actually reached the OS, so callers can tell the
 * difference between "nothing to say" and "could not say it".
 */
export async function syncScheduledNotifications(
  planned: PlannedNotification[],
): Promise<{ scheduled: number; state: PermissionState }> {
  const mod = await load();
  if (!mod) return { scheduled: 0, state: 'unavailable' };

  const state = await notificationPermission();
  try {
    await mod.cancelAllScheduledNotificationsAsync();
  } catch {
    return { scheduled: 0, state: 'unavailable' };
  }
  if (state !== 'granted') {
    // The queue is empty and permission is gone, so the rest alert is too.
    // Forgetting it here is what stops a later sync resurrecting it.
    pendingRest = null;
    return { scheduled: 0, state };
  }

  let scheduled = 0;
  for (const item of planned) {
    const when = dateFor(item);
    // A trigger already in the past fires immediately on some platforms,
    // which reads to the user as the app shouting for no reason.
    if (when.getTime() <= Date.now()) continue;
    try {
      await mod.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: item.body,
          data: { id: item.id, kind: item.kind },
        },
        trigger: { type: 'date', date: when },
      });
      scheduled += 1;
    } catch {
      // One failure should not cost the rest of the day's notifications.
    }
  }
  // Cancel-and-replace above wiped the OS queue, and a rest running right
  // now was in it. Without this, logging a set while the day's plan happens
  // to re-sync silently swallows the one buzz someone is standing there
  // waiting for. It is put back, not counted: see `armRest`.
  await rearmRest(mod);
  return { scheduled, state };
}

/**
 * THE REST TIMER'S ONE NOTIFICATION.
 *
 * Everything else this module schedules comes from the day's plan and is
 * replaced wholesale on every sync. The rest alert does not: it is a single
 * pending thing, started by hand thirty seconds ago, and it belongs to the
 * screen that started it rather than to the plan.
 *
 * That makes three rules, all of them about restraint. Only ever one is
 * pending — scheduling a second cancels the first, so a session of forty
 * sets leaves one notification in the queue, never forty. It is never
 * counted against the daily cap, because the cap exists to stop the app
 * saying things nobody asked for and this is the opposite of that. And it
 * is cancelled the moment the next set is logged or the person leaves, so
 * a set already finished never buzzes.
 */
let pendingRest: { osId: string; alert: RestAlert } | null = null;

/** Hands one alert to the OS and remembers what to cancel. */
async function armRest(mod: NotificationsModule, alert: RestAlert): Promise<boolean> {
  if (alert.at <= Date.now()) return false;
  try {
    const osId = await mod.scheduleNotificationAsync({
      content: {
        title: alert.title,
        body: alert.body,
        data: { id: 'rest', kind: 'rest' },
      },
      trigger: { type: 'date', date: new Date(alert.at) },
    });
    pendingRest = { osId, alert };
    return true;
  } catch {
    pendingRest = null;
    return false;
  }
}

/** After a cancel-and-replace sync, put the still-running rest back. */
async function rearmRest(mod: NotificationsModule): Promise<void> {
  const current = pendingRest;
  pendingRest = null;
  if (!current) return;
  await armRest(mod, current.alert);
}

/**
 * Schedule the one-shot for a rest that is still running.
 *
 * Never asks for permission — the caller has already decided, in
 * `features/notifications/rest.ts`, that there is something to say and
 * that it is allowed to be said. This only says it. Returns whether the OS
 * took it, so a caller can tell "nothing to schedule" from "could not".
 */
export async function scheduleRestNotification(alert: RestAlert): Promise<boolean> {
  const mod = await load();
  if (!mod) return false;
  // Belt and braces against a permission revoked since the screen mounted:
  // a scheduled notification nobody agreed to is worse than a missing one.
  if ((await notificationPermission()) !== 'granted') {
    pendingRest = null;
    return false;
  }
  await cancelRestNotification();
  return armRest(mod, alert);
}

/**
 * Drop the pending rest alert and nothing else.
 *
 * Deliberately not `cancelAllNotifications`: the person logging a set
 * quickly must not lose this evening's wind-down reminder as a side effect
 * of being quick.
 */
export async function cancelRestNotification(): Promise<void> {
  const current = pendingRest;
  pendingRest = null;
  if (!current) return;
  const mod = await load();
  if (!mod) return;
  try {
    await mod.cancelScheduledNotificationAsync?.(current.osId);
  } catch {
    // Already fired, already gone, or a build without the module.
  }
}

/**
 * What happens when a person taps a notification. The payload carries the
 * kind the scheduler set; the handler decides where in the app that leads.
 * The response that launched the app from cold is delivered too, once.
 * Returns a cleanup; safe on a build without the module.
 */
export function onNotificationTap(handler: (data: Record<string, unknown>) => void): () => void {
  let sub: { remove: () => void } | null = null;
  let live = true;
  void load().then(async (mod) => {
    if (!mod || !live) return;
    try {
      const last = await mod.getLastNotificationResponseAsync?.();
      const data = last?.notification.request.content.data;
      if (data && live) handler(data);
    } catch {
      // No launch response; an ordinary open.
    }
    try {
      sub =
        mod.addNotificationResponseReceivedListener?.((r) => {
          const data = r.notification.request.content.data;
          if (data) handler(data);
        }) ?? null;
    } catch {
      sub = null;
    }
  });
  return () => {
    live = false;
    sub?.remove();
  };
}

export async function cancelAllNotifications(): Promise<void> {
  // "All" includes the rest alert. This is the path someone takes when they
  // turn notifications off, and off means off.
  pendingRest = null;
  const mod = await load();
  if (!mod) return;
  try {
    await mod.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled, or nothing to schedule with.
  }
}

/** A planned notification's local Date. Exported for the test to reason about. */
export function dateFor(item: PlannedNotification): Date {
  const [y, m, d] = item.date.split('-').map(Number);
  const minutes = toMinutes(item.at);
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0);
}
