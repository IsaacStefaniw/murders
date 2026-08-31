import { dateFor } from '@/lib/notifications';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/features/notifications/schedule';
import type { PlannedNotification } from '@/features/notifications/schedule';

const planned = (date: string, at: string): PlannedNotification => ({
  id: `x:${date}:${at}`,
  kind: 'intervention',
  at,
  date,
  title: 'The hour before',
  body: 'body',
});

describe('the OS adapter contract', () => {
  /**
   * A notification is scheduled against a wall-clock time the person chose,
   * on a local date key. Building the Date from UTC parts would fire it at
   * the wrong hour for everyone outside Greenwich — which in Australia is
   * the middle of the afternoon for an evening intervention.
   */
  it('builds the trigger time in local time, not UTC', () => {
    const d = dateFor(planned('2026-04-03', '20:15'));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(3);
    expect(d.getHours()).toBe(20);
    expect(d.getMinutes()).toBe(15);
    expect(d.getSeconds()).toBe(0);
  });

  it('handles a time past midnight on the stated date', () => {
    const d = dateFor(planned('2026-04-03', '00:30'));
    expect(d.getDate()).toBe(3);
    expect(d.getHours()).toBe(0);
  });

  /**
   * iOS silently drops scheduled local notifications past 64, keeping the
   * soonest and discarding the rest. The horizon and cap together must stay
   * well under that or the queue starts losing its tail without a word.
   */
  it('cannot possibly exceed the iOS 64-notification ceiling', () => {
    const HORIZON_DAYS = 3; // features/notifications/useNotificationSync
    expect(HORIZON_DAYS * DEFAULT_NOTIFICATION_SETTINGS.dailyCap).toBeLessThan(64);
  });
});
