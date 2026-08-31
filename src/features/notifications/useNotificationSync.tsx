/**
 * Keeps the operating system's queue in step with what the app intends.
 *
 * Re-syncs when the PLANNED LIST changes, not when the state behind it
 * does. Within a sync the strategy is cancel-and-replace rather than
 * diffing: recomputing is cheap, reconciling is not, and someone who turns
 * a category off gets silence immediately instead of at the end of whatever
 * was already queued.
 */

import { useEffect, useMemo, useRef } from 'react';

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

  /**
   * The planned list, not the state it came from, is what decides whether
   * the OS queue needs touching. `metrics` gets a new array identity on
   * every reading, so keying the effect on the inputs meant a cancel-and-
   * reschedule of everything each time someone logged a set — ten writes
   * for a single workout, none of which changed a single notification.
   */
  const planned = useMemo(() => {
    if (!settings.enabled) return [];
    const today = todayKey();
    const dates = Array.from({ length: HORIZON_DAYS }, (_, i) => addDays(today, i));
    return plannedAcross(
      dates,
      { profile, routines, behaviourIntentions, behaviourEvents, metrics, settings },
      plans,
    );
  }, [settings, profile, plans, routines, behaviourIntentions, behaviourEvents, metrics]);

  const signature = JSON.stringify(planned.map((n) => [n.id, n.at, n.body]));
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (lastSynced.current === signature) return;
    lastSynced.current = signature;
    let cancelled = false;

    const run = async () => {
      if (!settings.enabled) {
        await cancelAllNotifications();
        return;
      }
      if (cancelled) return;
      await syncScheduledNotifications(planned);
    };

    void run();
    return () => {
      cancelled = true;
    };
    // `signature` is the whole point: identical plans do not re-sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}
