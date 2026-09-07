/**
 * Whether a rest that is still running when the app goes away is allowed
 * to reach the lock screen, and what it says when it does.
 *
 * Hevy and Strong both put the rest timer on the lock screen with a Live
 * Activity, which needs a native build. The useful half of that does not:
 * a one-shot local notification at the moment the rest ends, and nothing
 * else. This module is the "whether" — pure, so the three ways it can say
 * no are tests rather than a phone in a pocket.
 *
 * Three rules, and they are all refusals:
 *
 * It is one notification, once. Not a reminder, not a follow-up, not a
 * second one if the phone stays locked. A rest timer that nags is a rest
 * timer that gets the app's notifications turned off, and the notification
 * that matters here is the one about a habit at 8pm, not this one.
 *
 * It never asks for permission. The prompt belongs in Settings, at the
 * moment someone opts in, and iOS offers it exactly once — spending it
 * mid-set, sweaty, between a squat and the next squat, is the fastest
 * route to a permanent no. Without permission the timer is a foreground
 * timer, and the screen says nothing about notifications at all.
 *
 * It obeys the master switch. Someone with every notification off has said
 * what they want; the rest timer is not the exception that argues.
 */

import type { NotificationSettings } from '@/features/notifications/schedule';
import type { PermissionState } from '@/lib/notifications';

/** The single pending rest alert, resolved to an absolute moment. */
export interface RestAlert {
  /** Epoch milliseconds. The one time this ever fires. */
  at: number;
  title: string;
  body: string;
}

export interface RestAlertInput {
  /** Epoch milliseconds the current rest ends, or null when none is running. */
  endsAt: number | null | undefined;
  now: number;
  /** The lift the next set belongs to, when the screen knows it. */
  exercise?: string;
  /** The person's own notification settings. Only the master switch applies. */
  settings: Pick<NotificationSettings, 'enabled'>;
  /** What permission already is. Never what it could be made to be. */
  permission: PermissionState;
}

/**
 * The alert to schedule, or null — which is every case where the honest
 * answer is silence: no rest running, a rest that has already ended (a
 * trigger in the past fires immediately on some platforms, which reads as
 * the app shouting for no reason), notifications off, permission not
 * granted.
 */
export function restAlert(input: RestAlertInput): RestAlert | null {
  const { endsAt, now, exercise, settings, permission } = input;
  if (endsAt == null || !Number.isFinite(endsAt)) return null;
  if (endsAt <= now) return null;
  if (!settings.enabled) return null;
  if (permission !== 'granted') return null;
  return {
    at: endsAt,
    title: 'Rest is up.',
    body: exercise ? `Next set: ${exercise}.` : 'Next set when you are ready.',
  };
}
