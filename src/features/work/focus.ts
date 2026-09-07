/**
 * Focus time the app already knows about.
 *
 * The hub asked for a weekly number typed by hand while the plans on the
 * phone held the answer: which focus blocks were planned, which were
 * ticked off, and how long each was. Sunsama sells "planned against
 * actual" as its headline feature; here it is arithmetic over days that
 * already happened. The typed number stays as a correction — a person
 * who did three hours at the kitchen table on Sunday can still say so.
 */

import { addDays, durationMinutes, weekStartOf } from '@/lib/dates';
import type { MetricObservation } from '@/features/model/metrics';
import type { DailyPlan, Routine } from '@/types/domain';

/** The practices that count as a focus block. */
export const FOCUS_PROTOCOLS = new Set(['deep-work', 'meeting-free-morning']);

export interface FocusWeek {
  /** Monday of the week. */
  weekStart: string;
  /** Focus blocks the plan held that week, and how many were done. */
  planned: number;
  held: number;
  /** Minutes of focus blocks done. */
  heldMin: number;
  /** Hours the person typed for that week, if they did. */
  loggedHours: number | null;
}

function isFocusRoutine(r: Routine): boolean {
  return !!r.protocolId && FOCUS_PROTOCOLS.has(r.protocolId);
}

/**
 * The last `weeks` weeks of focus blocks, oldest first, ending with the
 * week that contains `today`. Weeks with nothing planned still appear so
 * a chart's x-axis is honest about the gap.
 */
export function weeklyFocus(
  plans: Record<string, DailyPlan>,
  routines: Routine[],
  metrics: MetricObservation[],
  today: string,
  weeks = 8,
): FocusWeek[] {
  const focusIds = new Set(routines.filter(isFocusRoutine).map((r) => r.id));
  const thisWeek = weekStartOf(today);
  const out: FocusWeek[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = addDays(thisWeek, -7 * w);
    const weekEnd = addDays(weekStart, 6);
    let planned = 0;
    let held = 0;
    let heldMin = 0;
    for (const plan of Object.values(plans)) {
      if (plan.date < weekStart || plan.date > weekEnd) continue;
      for (const item of plan.items) {
        if (!item.routineId || !focusIds.has(item.routineId)) continue;
        planned += 1;
        if (item.status === 'completed') {
          held += 1;
          heldMin += durationMinutes(item.start, item.end);
        }
      }
    }
    // The typed number for the week: the last reading dated inside it.
    const logged = metrics
      .filter((m) => m.key === 'work.deepHours')
      .filter((m) => {
        const day = m.at.slice(0, 10);
        return day >= weekStart && day <= weekEnd;
      })
      .sort((a, b) => a.at.localeCompare(b.at));
    const loggedHours = logged.length ? logged[logged.length - 1].value : null;
    out.push({ weekStart, planned, held, heldMin, loggedHours });
  }
  return out;
}

/** Hours for a week: what was typed if anything was, else what was ticked off. */
export function focusHours(week: FocusWeek): number {
  if (week.loggedHours !== null) return week.loggedHours;
  return Math.round((week.heldMin / 60) * 10) / 10;
}

export interface FocusSummary {
  /** Hours this week so far. */
  thisWeek: number;
  /** Mean hours across the earlier weeks that had anything planned or logged. */
  priorMean: number | null;
  /** Blocks held of blocks planned, this week. */
  held: number;
  planned: number;
  /** One line for the hub. */
  line: string;
}

export function summariseFocus(weeks: FocusWeek[], targetHours: number): FocusSummary {
  const current = weeks[weeks.length - 1];
  const thisWeek = current ? focusHours(current) : 0;
  const prior = weeks
    .slice(0, -1)
    .filter((w) => w.planned > 0 || w.loggedHours !== null)
    .map(focusHours);
  const priorMean = prior.length
    ? Math.round((prior.reduce((a, b) => a + b, 0) / prior.length) * 10) / 10
    : null;
  const held = current?.held ?? 0;
  const planned = current?.planned ?? 0;

  let line: string;
  if (planned === 0 && thisWeek === 0) {
    line = `Nothing counted yet this week. The target for your week is about ${targetHours} h.`;
  } else if (planned > 0 && held === 0) {
    line = `${planned} focus ${planned === 1 ? 'block' : 'blocks'} planned this week, none ticked off yet.`;
  } else {
    const blocks = planned > 0 ? `${held} of ${planned} blocks held, ` : '';
    const against =
      thisWeek >= targetHours
        ? 'at the target'
        : `against about ${targetHours} h`;
    line = `${blocks}${thisWeek} h so far ${against}.`;
  }
  return { thisWeek, priorMean, held, planned, line };
}
