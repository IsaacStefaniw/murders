/**
 * Keeps the operating system's queue in step with what the app intends.
 *
 * Runs on mount and whenever the inputs that could change the answer
 * change. The planned list is derived deterministically from state, so the
 * strategy is cancel-and-replace rather than diffing: recomputing is cheap,
 * reconciling is not, and a person who turns something off gets silence
 * immediately instead of at the end of whatever was already queued.
 */

import { useEffect } from 'react';

import { plannedAcross } from '@/features/notifications/schedule';
import { cancelAllNotifications, syncScheduledNotifications } from '@/lib/notifications';
import { addDays, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/** How far ahead to queue. Beyond a few days the plan changes anyway. */
const HORIZON_DAYS = 3;

export function useNotificationSync(): void {
  const settings = useAppStore((s) => s.notifications);
  const profile = useAppStore((s) => s.profile);
  const plans = useAppStore((s) => s.plans);
  const routines = useAppStore((s) => s.routines);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);
  const metrics = useAppStore((s) => s.metrics);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!settings.enabled) {
        await cancelAllNotifications();
        return;
      }
      const today = todayKey();
      const dates = Array.from({ length: HORIZON_DAYS }, (_, i) => addDays(today, i));
      const planned = plannedAcross(
        dates,
        { profile, routines, behaviourIntentions, behaviourEvents, metrics, settings },
        plans,
      );
      if (cancelled) return;
      await syncScheduledNotifications(planned);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [settings, profile, plans, routines, behaviourIntentions, behaviourEvents, metrics]);
}
