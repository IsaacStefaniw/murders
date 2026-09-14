/**
 * A thing you can still do is not a thing to account for.
 *
 * Isaac, on his own phone at 7:00am, looking at a 6:40am habit: "what does
 * this mean?" The block's window had closed ten minutes earlier and the
 * app had already filed it under "EARLIER — DID IT HAPPEN?" — at the top
 * of the screen, past tense, with a Start button underneath it.
 *
 * `today.tsx` holds the buckets inline, so this tests the rule itself: how
 * long a block stays startable after its window closes, and when it
 * becomes a matter of record.
 */

import { toMinutes } from '@/lib/dates';

/** Mirrors the constant in app/(tabs)/today.tsx. */
const OVERDUE_GRACE_MIN = 60;

interface Row {
  end: string;
  status: 'planned' | 'completed' | 'skipped';
}

/** The rule under test, in the same shape the screen applies it. */
function bucket(item: Row, now: number): 'still-open' | 'ledger' {
  const past = toMinutes(item.end) <= now;
  if (!past) return 'still-open';
  return item.status === 'planned' && now - toMinutes(item.end) < OVERDUE_GRACE_MIN
    ? 'still-open'
    : 'ledger';
}

const at = (hhmm: string) => toMinutes(hhmm);

describe('a block that has just slipped', () => {
  it('is still open ten minutes after its window closed', () => {
    // Isaac's exact case: a 6:40 habit ending 6:50, looked at at 7:00.
    expect(bucket({ end: '06:50', status: 'planned' }, at('07:00'))).toBe('still-open');
  });

  it('stays open for the whole grace hour', () => {
    expect(bucket({ end: '06:50', status: 'planned' }, at('07:49'))).toBe('still-open');
  });

  it('becomes a question once the day has moved on', () => {
    expect(bucket({ end: '06:50', status: 'planned' }, at('07:50'))).toBe('ledger');
    expect(bucket({ end: '06:50', status: 'planned' }, at('12:00'))).toBe('ledger');
  });

  it('never asks about something already answered', () => {
    // Done or skipped inside the grace window belongs in the record, not
    // in the list of things still to do.
    expect(bucket({ end: '06:50', status: 'completed' }, at('07:00'))).toBe('ledger');
    expect(bucket({ end: '06:50', status: 'skipped' }, at('07:00'))).toBe('ledger');
  });

  it('leaves anything still ahead alone', () => {
    expect(bucket({ end: '09:15', status: 'planned' }, at('07:00'))).toBe('still-open');
  });
});
