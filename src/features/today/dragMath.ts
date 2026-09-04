/**
 * The arithmetic behind press-and-hold-and-drag on a day.
 *
 * The list is not a timeline — rows have whatever height their content
 * needs — so a drag cannot read its target off the pixels underneath.
 * Instead the finger's vertical travel is time: one pixel is one minute,
 * snapped to the quarter hour, so dragging a row a hand's width moves it
 * about three hours and the floating label says exactly where it lands.
 */
import { formatTime, toHHMM, toMinutes } from '@/lib/dates';
import type { Displacement } from '@/features/planner/moveWithBump';

export const MINUTES_PER_PIXEL = 1;
export const SNAP_MIN = 15;
/** Less travel than this is a hold, not a drag. */
export const DRAG_THRESHOLD_PX = 10;

export function targetStartFor(
  start: string,
  durationMin: number,
  dy: number,
  bounds: { dayStart: string; dayEnd: string },
): string {
  const from = toMinutes(start);
  const raw = from + dy * MINUTES_PER_PIXEL;
  const snapped = Math.round(raw / SNAP_MIN) * SNAP_MIN;
  const lo = toMinutes(bounds.dayStart);
  // A bedtime after midnight reads as an earlier number than the wake time;
  // the day still ends at midnight for planning, never after it.
  const endRaw = toMinutes(bounds.dayEnd);
  const end = endRaw <= lo ? 24 * 60 : Math.min(endRaw, 24 * 60);
  const hi = end - durationMin;
  const clamped = Math.max(lo, Math.min(hi, snapped));
  return toHHMM(clamped);
}

export function isDrag(dy: number): boolean {
  return Math.abs(dy) >= DRAG_THRESHOLD_PX;
}

/** What a drop displaced, in the words the move picker already uses. */
export function knockOnLine(displaced: Displacement[]): string | null {
  if (displaced.length === 0) return null;
  return (
    'Moved to make room: ' +
    displaced
      .map((d) => (d.to ? `${d.title} → ${formatTime(d.to)}` : `${d.title} — no room left today, left where it was`))
      .join(' · ')
  );
}
