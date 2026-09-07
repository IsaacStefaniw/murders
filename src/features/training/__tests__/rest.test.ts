import { formatRest, restEndsAt, restIsOver, restRemaining } from '@/features/training/rest';

/**
 * The rest timer's whole reason for existing is the phone that went into a
 * pocket. These tests are the pocket: time jumps, nothing ticks, and the
 * answer still has to be right when the screen comes back.
 */
describe('the rest timer survives a locked phone', () => {
  const T0 = 1_777_000_000_000; // an arbitrary fixed moment

  it('counts from the end, so four minutes away does not become one second', () => {
    const ends = restEndsAt(T0, 90)!;
    // The screen is watched for two seconds, then locked for four minutes.
    expect(restRemaining(ends, T0 + 2_000)).toBe(88);
    expect(restRemaining(ends, T0 + 240_000)).toBe(0);
    // A countdown in state would have said 88 here. That was the bug.
    expect(restIsOver(ends, T0 + 240_000)).toBe(true);
  });

  it('shows the full rest at the moment it starts, not one second short', () => {
    const ends = restEndsAt(T0, 90)!;
    expect(restRemaining(ends, T0)).toBe(90);
    // Rounding up means the last second is shown for the second it exists.
    expect(restRemaining(ends, T0 + 89_100)).toBe(1);
    expect(restRemaining(ends, T0 + 90_000)).toBe(0);
  });

  it('never goes negative, however long the phone was away', () => {
    const ends = restEndsAt(T0, 60)!;
    expect(restRemaining(ends, T0 + 86_400_000)).toBe(0);
  });

  it('starts no timer for the accessory work that carries no rest', () => {
    expect(restEndsAt(T0, 0)).toBeNull();
    expect(restEndsAt(T0, -30)).toBeNull();
    expect(restRemaining(null, T0)).toBe(0);
    expect(restIsOver(null, T0)).toBe(false);
  });

  it('is not over the instant before it is over', () => {
    const ends = restEndsAt(T0, 120)!;
    expect(restIsOver(ends, T0 + 119_999)).toBe(false);
    expect(restIsOver(ends, T0 + 120_000)).toBe(true);
  });

  it('reads a minute and a half as a minute and a half', () => {
    expect(formatRest(90)).toBe('1:30');
    expect(formatRest(45)).toBe('45s');
    expect(formatRest(60)).toBe('1:00');
    expect(formatRest(125)).toBe('2:05');
    expect(formatRest(0)).toBe('0s');
    expect(formatRest(-5)).toBe('0s');
  });
});
