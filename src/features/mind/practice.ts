/**
 * Mind v2 — a stillness practice that PROGRESSES, like training does.
 *
 * Every completed breath or meditation session logs its minutes as a
 * mind.minutes observation. The last four weeks of minutes place the
 * user on a level — two-minute resets → five steady minutes → ten-minute
 * sits → sits + NSDR — and the hub shows exactly one prescription and
 * what advances it. Nothing is gated: any level's session can always be
 * run; the level is a mirror, not a lock.
 */

import type { MetricObservation } from '@/features/model/metrics';

export interface PracticeLevel {
  level: number;
  title: string;
  prescription: string;
  /** 28-day minutes at which this level is reached. */
  minutesFor: number;
}

export const PRACTICE_LEVELS: PracticeLevel[] = [
  {
    level: 1,
    title: 'Two-minute resets',
    prescription:
      'One two-minute breath reset a day, attached to something that already happens — the kettle, the school run, the car park.',
    minutesFor: 0,
  },
  {
    level: 2,
    title: 'Five steady minutes',
    prescription:
      'Three five-minute sits a week, same chair, same time. Consistency is the skill; calm is a side effect.',
    minutesFor: 40,
  },
  {
    level: 3,
    title: 'Ten-minute sits',
    prescription:
      'Ten minutes, most days. The wandering mind isn’t failure — noticing it wandered IS the rep.',
    minutesFor: 120,
  },
  {
    level: 4,
    title: 'Sits + NSDR',
    prescription:
      'Keep the daily sit, add one NSDR when the afternoon dips — recovery you can schedule.',
    minutesFor: 240,
  },
];

const windowMinutes = (metrics: MetricObservation[], days: number): number => {
  const cutoff = new Date(Date.now() - days * 86400e3).toISOString();
  return Math.round(
    metrics.filter((o) => o.key === 'mind.minutes' && o.at >= cutoff).reduce((s, o) => s + o.value, 0),
  );
};

export const minutesThisWeek = (metrics: MetricObservation[]): number => windowMinutes(metrics, 7);

export function practiceLevel(
  metrics: MetricObservation[],
  establishedMeditator = false,
): PracticeLevel {
  const monthMinutes = windowMinutes(metrics, 28);
  const earned = [...PRACTICE_LEVELS].reverse().find((l) => monthMinutes >= l.minutesFor)!;
  // An existing meditation habit starts at "five steady minutes" — INTENT
  // never talks to an established meditator like a beginner.
  if (establishedMeditator && earned.level < 2) return PRACTICE_LEVELS[1];
  return earned;
}

export interface PracticeState {
  level: PracticeLevel;
  next: PracticeLevel | null;
  weekMinutes: number;
  monthMinutes: number;
  message: string;
}

export function practiceState(
  metrics: MetricObservation[],
  establishedMeditator = false,
): PracticeState {
  const level = practiceLevel(metrics, establishedMeditator);
  const next = PRACTICE_LEVELS.find((l) => l.level === level.level + 1) ?? null;
  const weekMinutes = minutesThisWeek(metrics);
  const monthMinutes = windowMinutes(metrics, 28);
  const message = next
    ? `${weekMinutes} min this week. ${next.minutesFor - monthMinutes} more this month reaches “${next.title}”.`
    : `${weekMinutes} min this week — the practice is established. Protect it like sleep.`;
  return { level, next, weekMinutes, monthMinutes, message };
}
