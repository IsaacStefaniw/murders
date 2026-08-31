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
  getAllScheduledNotificationsAsync: () => Promise<unknown[]>;
  setNotificationHandler: (handler: unknown) => void;
  AndroidImportance?: Record<string, number>;
  SchedulableTriggerInputTypes?: Record<string, string>;
}

let cached: NotificationsModule | null | undefined;

/** Null when the native module is absent — a web build, or one without it. */
async function load(): Promise<NotificationsModule | null> {
  if (cached !== undefined) return cached;
  try {
    cached = (await import('expo-notifications')) as unknown as NotificationsModule;
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
  if (state !== 'granted') return { scheduled: 0, state };

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
  return { scheduled, state };
}

export async function cancelAllNotifications(): Promise<void> {
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
