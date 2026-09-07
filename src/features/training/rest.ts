/**
 * The rest timer's arithmetic, and nothing else.
 *
 * A rest timer that counts down in a variable is a rest timer that lies.
 * `setInterval` does not run while the screen is off, the phone is in a
 * pocket, or another app is in front — so a ninety-second rest counted one
 * tick at a time still reads "68s" when you come back four minutes later,
 * and the one number the person came back to check is the one number that
 * is wrong.
 *
 * So the timer holds an END TIMESTAMP and derives the rest. Coming back is
 * a subtraction, not a replay, which makes backgrounding a non-event: the
 * screen shows the truth whether it was watched or not.
 *
 * Pure on purpose — every rule below is a test rather than a stopwatch.
 */

/** Milliseconds in a second, named so the arithmetic reads. */
const SECOND_MS = 1000;

/**
 * When a rest of `restSec`, started at `now`, ends.
 *
 * Null for a rest of nothing: some accessory work carries `restSec: 0`,
 * and a timer that starts at zero seconds is a flash of a card nobody
 * asked for.
 */
export function restEndsAt(now: number, restSec: number): number | null {
  if (!Number.isFinite(now) || !Number.isFinite(restSec) || restSec <= 0) return null;
  return now + Math.round(restSec) * SECOND_MS;
}

/**
 * Whole seconds left, never negative.
 *
 * Rounded UP, so a rest that has just started reads as its full length
 * rather than one second short of it, and the last second is shown for the
 * whole of the second it exists rather than being skipped.
 */
export function restRemaining(endsAt: number | null | undefined, now: number): number {
  if (endsAt == null || !Number.isFinite(endsAt) || !Number.isFinite(now)) return 0;
  const left = endsAt - now;
  if (left <= 0) return 0;
  return Math.ceil(left / SECOND_MS);
}

/**
 * Whether the rest has run out — including the rest that ran out while the
 * phone was locked, which is the case this whole module exists for.
 */
export function restIsOver(endsAt: number | null | undefined, now: number): boolean {
  if (endsAt == null || !Number.isFinite(endsAt)) return false;
  return now >= endsAt;
}

/**
 * How the number is read aloud on the card: `1:30` once it is worth
 * counting in minutes, plain seconds below that. Nobody reads "90s" as a
 * minute and a half while breathing hard.
 */
export function formatRest(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
