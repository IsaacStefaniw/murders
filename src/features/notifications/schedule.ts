/**
 * What the app is allowed to say, and when.
 *
 * The behaviour engine computes a time to intervene BEFORE a habit's usual
 * window. Until now that time could only be read inside the app, which is
 * the one place a person is not looking at 8pm on a Thursday. This module
 * turns computed times into scheduled notifications.
 *
 * It is deliberately the strictest module in the codebase, because the
 * failure mode is not a bug — it is a person turning notifications off, and
 * with them the one nudge that would have landed. Three rules do the work:
 *
 * A hard daily cap. Three by default, priority-ordered, and anything past
 * the cap is dropped rather than deferred. An app that says four things a
 * day gets muted in a fortnight.
 *
 * Quiet hours that move things EARLIER, never later. The same semantics as
 * the scheduler's `deadline` anchor. A reminder about a late-night habit is
 * worth sending at 22:45; the same reminder at 03:00 is an alarm clock.
 *
 * Nothing about a protocol marked `neverNag`, ever. That flag says in data
 * that a practice must never generate a streak, a score, or a missed-it
 * message, and a push notification is the loudest possible version of one.
 */

import { behaviourInfo } from '@/features/behaviours/catalog';
import { dueInterventions } from '@/features/behaviours/patterns';
import { protocolById } from '@/features/knowledge/protocols';
import type { MetricObservation } from '@/features/model/metrics';
import { toMinutes } from '@/lib/dates';
import type {
  BehaviourEvent,
  BehaviourIntention,
  DailyPlan,
  LifeProfile,
  Routine,
} from '@/types/domain';

export type NotificationKind = 'intervention' | 'session' | 'wind_down';

export interface PlannedNotification {
  /**
   * Stable across recomputations, so rescheduling the same day twice does
   * not produce two of everything.
   */
  id: string;
  kind: NotificationKind;
  /** Local wall-clock time, HH:MM, on `date`. */
  at: string;
  date: string;
  title: string;
  body: string;
}

export interface NotificationSettings {
  enabled: boolean;
  /** Interventions ahead of a behaviour's usual window. */
  interventions: boolean;
  /** A nudge as a planned session's window opens. */
  sessions: boolean;
  /** One evening reminder to start winding down. */
  windDown: boolean;
  /** Hard ceiling per day. Never exceeded, whatever is enabled. */
  dailyCap: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  interventions: true,
  sessions: false,
  windDown: false,
  dailyCap: 3,
};

/** Priority when the cap bites. Interventions are the reason this exists. */
const PRIORITY: Record<NotificationKind, number> = {
  intervention: 0,
  wind_down: 1,
  session: 2,
};

export interface QuietHours {
  /** HH:MM the quiet period begins. */
  from: string;
  /** HH:MM it ends. */
  to: string;
}

/**
 * Quiet hours derived from the person's own night, not a fixed default.
 *
 * Half an hour after their stated bedtime, until they wake. Someone who
 * sleeps at one in the morning should not be silenced from ten.
 */
export function quietHoursFor(profile: LifeProfile | null): QuietHours {
  if (!profile) return { from: '23:00', to: '07:00' };
  const sleep = toMinutes(profile.sleepTime);
  return { from: minutesToHHMM(sleep + 30), to: profile.wakeTime };
}

const minutesToHHMM = (min: number): string => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export const isQuiet = (time: string, quiet: QuietHours): boolean => {
  const t = toMinutes(time);
  const from = toMinutes(quiet.from);
  const to = toMinutes(quiet.to);
  // Quiet hours normally wrap midnight; both orders are handled.
  return from <= to ? t >= from && t < to : t >= from || t < to;
};

/**
 * Pull a quiet-hours notification back to just before the quiet period.
 *
 * Earlier, never later — the same rule the scheduler applies to a deadline
 * anchor, and for the same reason: a reminder delivered after the moment it
 * was about is worse than no reminder, because it also teaches the person
 * the app's timing cannot be trusted.
 */
export function pullOutOfQuiet(time: string, quiet: QuietHours): string {
  if (!isQuiet(time, quiet)) return time;
  return minutesToHHMM(toMinutes(quiet.from) - 5);
}

export interface ScheduleInput {
  date: string;
  profile: LifeProfile | null;
  plan: DailyPlan | null;
  routines: Routine[];
  behaviourIntentions: BehaviourIntention[];
  behaviourEvents: BehaviourEvent[];
  metrics: MetricObservation[];
  settings: NotificationSettings;
}

/**
 * Everything worth saying on one day, already capped and ordered by time.
 *
 * Returns an empty list rather than throwing when notifications are off, so
 * a caller can always ask and always reschedule from the answer.
 */
export function plannedNotifications(input: ScheduleInput, now = new Date()): PlannedNotification[] {
  const { settings, profile, date } = input;
  if (!settings.enabled) return [];

  const quiet = quietHoursFor(profile);
  const candidates: PlannedNotification[] = [];

  if (settings.interventions) {
    const due = dueInterventions(
      input.behaviourIntentions,
      input.behaviourEvents,
      input.metrics,
      date,
      now,
    );
    for (const iv of due) {
      const info = behaviourInfo(iv.intention.behaviour);
      candidates.push({
        id: `intervention:${iv.intention.id}:${date}`,
        kind: 'intervention',
        at: pullOutOfQuiet(iv.at, quiet),
        date,
        title: 'The hour before',
        // Names the time and the plan, never the behaviour's worth. The
        // whole design of the behaviour engine is that it reports patterns
        // rather than verdicts, and a notification must not be where that
        // slips.
        body: `${info.label} usually lands ${iv.pattern.window?.label ?? 'about now'}. Good moment to line something else up.`,
      });
    }
  }

  if (settings.sessions && input.plan) {
    const byRoutine = new Map(input.routines.map((r) => [r.id, r]));
    for (const item of input.plan.items) {
      if (item.status !== 'planned' || item.fixed) continue;
      const routine = item.routineId ? byRoutine.get(item.routineId) : undefined;
      const protocol = routine?.protocolId ? protocolById(routine.protocolId) : undefined;
      // `neverNag` says in data that this practice must never produce a
      // missed-it message. A push is the loudest possible one.
      if (protocol?.neverNag) continue;
      if (isQuiet(item.start, quiet)) continue;
      candidates.push({
        id: `session:${item.id}`,
        kind: 'session',
        at: item.start,
        date,
        title: item.title,
        body: `Your window opens now — ${item.start} to ${item.end}.`,
      });
    }
  }

  if (settings.windDown && profile) {
    const at = minutesToHHMM(toMinutes(profile.sleepTime) - 35);
    candidates.push({
      id: `wind_down:${date}`,
      kind: 'wind_down',
      at,
      date,
      title: 'Winding down',
      body: `Bed at ${profile.sleepTime}. The half hour before is what makes it work.`,
    });
  }

  const nowTime = minutesToHHMM(now.getHours() * 60 + now.getMinutes());
  const isToday = date === toDateKeyLocal(now);

  return candidates
    // Nothing in the past: a notification for 19:45 scheduled at 20:10 would
    // fire immediately, which reads as a bug and is one.
    .filter((n) => !isToday || toMinutes(n.at) > toMinutes(nowTime))
    .sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || toMinutes(a.at) - toMinutes(b.at))
    .slice(0, Math.max(0, settings.dailyCap))
    .sort((a, b) => toMinutes(a.at) - toMinutes(b.at));
}

const toDateKeyLocal = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Every notification for the days ahead, so one pass can reschedule all of them. */
export function plannedAcross(
  dates: string[],
  base: Omit<ScheduleInput, 'date' | 'plan'>,
  plans: Record<string, DailyPlan>,
  now = new Date(),
): PlannedNotification[] {
  return dates.flatMap((date) =>
    plannedNotifications({ ...base, date, plan: plans[date] ?? null }, now),
  );
}
