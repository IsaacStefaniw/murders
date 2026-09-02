/**
 * Intelligent move options: before asking the user to pick a time, offer the
 * choices a good assistant would — next free window, this afternoon,
 * tonight, tomorrow. Every option is validated by the engine; an option
 * that would overlap something simply isn't offered.
 */

import { toMinutes } from '@/lib/dates';
import { availableStartsFor } from '@/features/planner/generate';
import type { DailyPlan, LifeProfile, PlanItem } from '@/types/domain';

export interface MoveOption {
  label: string;
  kind: 'slot' | 'tomorrow' | 'choose';
  start?: string;
}

export function smartMoveOptions(
  item: PlanItem,
  plan: DailyPlan,
  profile: LifeProfile,
  nowMin: number,
): { options: MoveOption[]; allSlots: string[] } {
  const allSlots = availableStartsFor(item, plan, profile, 12, Math.max(nowMin, 0));
  const after = (min: number) => allSlots.find((s) => toMinutes(s) >= min);

  const options: MoveOption[] = [];
  const nextFree = after(Math.max(nowMin, 0));
  if (nextFree) options.push({ label: 'Next free window', kind: 'slot', start: nextFree });

  if (nowMin < 15 * 60) {
    const afternoon = allSlots.find(
      (s) => toMinutes(s) >= Math.max(12 * 60, nowMin) && toMinutes(s) < 17 * 60,
    );
    if (afternoon && afternoon !== nextFree) {
      options.push({ label: 'This afternoon', kind: 'slot', start: afternoon });
    }
  }

  // From 5pm or now, whichever is later. Searching from a flat 5pm meant
  // that at 8pm "Tonight" could offer 5:15pm — a window already closed,
  // which Today files under "Earlier — did it happen?", so the move read
  // as the app deciding the thing was done.
  const tonight = after(Math.max(17 * 60, nowMin));
  if (tonight && !options.some((o) => o.start === tonight)) {
    options.push({ label: 'Tonight', kind: 'slot', start: tonight });
  }

  options.push({ label: 'Tomorrow', kind: 'tomorrow' });
  if (allSlots.length > 0) options.push({ label: 'Choose time', kind: 'choose' });
  return { options, allSlots };
}
