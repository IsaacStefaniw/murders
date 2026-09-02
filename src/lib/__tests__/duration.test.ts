/**
 * Duration across midnight.
 *
 * Ten places in the app computed `toMinutes(end) - toMinutes(start)`. That
 * is correct until an item crosses midnight and then it is catastrophically
 * wrong — a wind-down at 23:40–00:00 came back as MINUS 1420 minutes — and
 * a negative number does not throw. It quietly poisons whatever it touches.
 */

import { durationMinutes } from '@/lib/dates';

describe('durationMinutes', () => {
  it('measures an ordinary block', () => {
    expect(durationMinutes('09:00', '10:30')).toBe(90);
  });

  it('measures a block that ends at midnight', () => {
    // The exact case from the plan: "Wind down, screens away 23:40–00:00".
    expect(durationMinutes('23:40', '00:00')).toBe(20);
  });

  it('measures a block that runs past midnight', () => {
    expect(durationMinutes('23:00', '00:45')).toBe(105);
  });

  it('treats a zero-length block as zero, not as a full day', () => {
    expect(durationMinutes('09:00', '09:00')).toBe(0);
  });

  it('refuses to invent a 20-hour block out of a data error', () => {
    // A wrap only makes sense for a short overnight span. 09:00 to 05:00 is
    // far likelier to be reversed fields than a twenty-hour commitment, and
    // returning 1200 minutes would let one bad row swallow a whole day.
    expect(durationMinutes('09:00', '05:00')).toBe(0);
  });
});
