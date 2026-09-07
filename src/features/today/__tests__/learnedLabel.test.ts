/**
 * The line on the row that says how long this really takes you.
 *
 * It is only worth the space when the block on screen disagrees with the
 * person's own history — a 30-minute slot for something that has taken 45
 * the last four times. Once placement catches up and the day holds the
 * real length, the line goes quiet, which is the point: it is a
 * disagreement, not a permanent badge.
 */

// The label lives beside the number it renders rather than in the row:
// `plan-item-row.tsx` pulls in the theme, and the theme pulls in a
// stylesheet jest cannot parse, so a helper exported from the row itself
// could never be tested. The row imports this.
import { usuallyLabel } from '@/lib/scheduling/adaptation';

describe('usuallyLabel', () => {
  it('says nothing when nothing has been learned', () => {
    expect(usuallyLabel(30, null)).toBeNull();
    expect(usuallyLabel(30, undefined)).toBeNull();
  });

  it('speaks up when the block is much shorter than the sessions really are', () => {
    expect(usuallyLabel(30, { minutes: 42, count: 4 })).toBe('Usually 42 min');
  });

  it('speaks up when the block is much longer than the sessions really are', () => {
    expect(usuallyLabel(60, { minutes: 25, count: 5 })).toBe('Usually 25 min');
  });

  it('stays quiet when the plan and the history broadly agree', () => {
    // A fifth either way is close enough that saying so would be noise.
    expect(usuallyLabel(45, { minutes: 45, count: 3 })).toBeNull();
    expect(usuallyLabel(45, { minutes: 50, count: 3 })).toBeNull();
    expect(usuallyLabel(45, { minutes: 40, count: 3 })).toBeNull();
  });

  it('speaks at just over a fifth, and not at just under', () => {
    expect(usuallyLabel(50, { minutes: 61, count: 3 })).toBe('Usually 61 min');
    expect(usuallyLabel(50, { minutes: 60, count: 3 })).toBeNull();
  });

  it('says nothing about a block with no length', () => {
    expect(usuallyLabel(0, { minutes: 42, count: 4 })).toBeNull();
  });

  it('uses plain words and no numbers the person did not earn', () => {
    const label = usuallyLabel(30, { minutes: 42, count: 4 })!;
    expect(label).toMatch(/^Usually \d+ min$/);
    expect(label).not.toMatch(/median|average|estimate|predicted/i);
  });
});
