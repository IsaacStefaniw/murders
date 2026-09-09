import { addDays } from '@/lib/dates';
import type { DailyPlan, Routine } from '@/types/domain';

export interface PersonalResponse {
  /** Times this person finished it. */
  kept: number;
  /** Distinct weeks it happened in. */
  weeks: number;
  /** Beside the grade, never inside it. */
  line: string;
}

const weekKey = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
};

/**
 * What this practice has actually done for this person, beside the grade
 * rather than inside it.
 *
 * The grade is about the research and must stay that way: a practice
 * somebody has kept for eleven weeks is not better evidenced than it was
 * in week one, and letting a personal record move a published letter
 * would quietly turn the whole library into a preference engine wearing a
 * lab coat.
 *
 * But the personal record is the more useful number to the person holding
 * the phone, and it belongs on the same card. A C-grade practice you have
 * kept for eleven weeks is worth more to you than an A you have never
 * managed twice, and no amount of evidence changes that.
 *
 * Null until there is something true to say. An empty personal record is
 * not a zero to display.
 */
export function personalResponse(
  protocolId: string,
  routines: Routine[],
  plans: Record<string, DailyPlan | undefined>,
  today: string,
  daysBack = 180,
): PersonalResponse | null {
  const ids = new Set(routines.filter((r) => r.protocolId === protocolId).map((r) => r.id));
  if (ids.size === 0) return null;

  let kept = 0;
  const weeks = new Set<string>();
  for (let i = 0; i <= daysBack; i++) {
    const date = addDays(today, -i);
    for (const item of plans[date]?.items ?? []) {
      if (item.status !== 'completed' || !item.routineId || !ids.has(item.routineId)) continue;
      kept += 1;
      weeks.add(weekKey(date));
    }
  }
  if (kept === 0) return null;

  const w = weeks.size;
  const line =
    w >= 4
      ? `You have kept this in ${w} different weeks — ${kept} times in all. That is the number that matters to you.`
      : `You have done this ${kept} ${kept === 1 ? 'time' : 'times'}, across ${w} ${w === 1 ? 'week' : 'weeks'} so far.`;
  return { kept, weeks: w, line };
}
