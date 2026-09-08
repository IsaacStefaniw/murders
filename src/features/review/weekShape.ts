/**
 * What this week is for.
 *
 * The Plan tab renders seven days in a row, and the weekly report counts
 * what was done afterwards. Between them there was nothing that said what
 * the week was SHAPED like or why — which is most of what a coach actually
 * does. A coach does not say "here is Tuesday". They say "three strength
 * sessions this week, and that is the one that matters".
 *
 * Everything here comes from data the app already holds. Every protocol
 * encodes its own intended weekly dose as `days.length × durationMin`, and
 * nothing had ever read it that way.
 */

import { protocolById, type Pillar, PILLAR_LABELS } from '@/features/knowledge/protocols';
import { durationMinutes } from '@/lib/dates';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

export interface PillarWeek {
  pillar: Pillar;
  label: string;
  /** Sessions the week intends, and how many are behind them. */
  intended: number;
  done: number;
  /** Minutes, the same way. */
  intendedMin: number;
  doneMin: number;
  /** Best evidence grade in this pillar's week, for ordering what to say. */
  bestGrade: string;
}

export interface WeekShape {
  from: string;
  to: string;
  pillars: PillarWeek[];
  /** Sessions across every pillar. */
  intended: number;
  done: number;
  /** The one sentence the coach opens the week with. Never a scold. */
  line: string;
}

const pillarOf = (item: PlanItem, routines: Routine[]): Pillar | undefined => {
  const r = routines.find((x) => x.id === item.routineId);
  if (!r?.protocolId) return undefined;
  return protocolById(r.protocolId)?.pillar;
};

const gradeOf = (item: PlanItem, routines: Routine[]): string => {
  const r = routines.find((x) => x.id === item.routineId);
  return (r?.protocolId && protocolById(r.protocolId)?.evidenceLevel) || 'E';
};

/** Minutes an item is worth: what it actually took, else what it was given. */
const minutesOf = (item: PlanItem): number =>
  item.actualMin ?? durationMinutes(item.start, item.end);

/**
 * The week's shape across the seven dates given.
 *
 * `dates` is the caller's week — usually today plus six, so "this week"
 * means the week the person is standing in rather than a calendar one.
 */
export function buildWeekShape(
  dates: string[],
  plans: Record<string, DailyPlan>,
  routines: Routine[],
  today: string,
): WeekShape {
  const acc = new Map<Pillar, PillarWeek>();
  let intended = 0;
  let done = 0;

  for (const date of dates) {
    for (const item of plans[date]?.items ?? []) {
      if (item.fixed) continue;
      const pillar = pillarOf(item, routines);
      if (!pillar) continue;
      const row =
        acc.get(pillar) ??
        ({
          pillar,
          label: PILLAR_LABELS[pillar],
          intended: 0,
          done: 0,
          intendedMin: 0,
          doneMin: 0,
          bestGrade: 'E',
        } satisfies PillarWeek);
      row.intended += 1;
      row.intendedMin += minutesOf(item);
      intended += 1;
      const grade = gradeOf(item, routines);
      if (grade < row.bestGrade) row.bestGrade = grade;
      if (item.status === 'completed') {
        row.done += 1;
        row.doneMin += minutesOf(item);
        done += 1;
      }
      acc.set(pillar, row);
    }
  }

  const pillars = [...acc.values()].sort(
    (a, b) => b.intendedMin - a.intendedMin || a.bestGrade.localeCompare(b.bestGrade),
  );

  return {
    from: dates[0] ?? today,
    to: dates[dates.length - 1] ?? today,
    pillars,
    intended,
    done,
    line: weekLine(pillars, intended, done, dates, today),
  };
}

/**
 * The sentence at the top of the week.
 *
 * Four states, and none of them is a telling-off. A week that has gone
 * badly gets the smallest true next step, because somebody reading this on
 * a Thursday having done nothing does not need the arithmetic — they need a
 * way back in.
 */
export function weekLine(
  pillars: PillarWeek[],
  intended: number,
  done: number,
  dates: string[],
  today: string,
): string {
  if (intended === 0) return 'Nothing scheduled this week yet.';

  const lead = pillars[0];
  const remaining = intended - done;
  const daysLeft = dates.filter((d) => d >= today).length;

  // Everything in.
  if (remaining === 0) {
    return `That is the whole week done — ${intended} ${intended === 1 ? 'session' : 'sessions'}. Anything else is a bonus.`;
  }

  // Not started, and the week is still ahead.
  if (done === 0) {
    return `${intended} ${intended === 1 ? 'session' : 'sessions'} this week, mostly ${lead.label.toLowerCase()}. ${
      lead.bestGrade <= 'B' ? 'That is the best-evidenced thing in your week.' : 'Start with whichever one is easiest to say yes to.'
    }`;
  }

  // Under way, and there is room.
  if (remaining <= daysLeft) {
    return `${done} of ${intended} done, and ${remaining} ${remaining === 1 ? 'session' : 'sessions'} left with ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to fit them.`;
  }

  // More left than days. Say the smallest true thing rather than the sum.
  return `${done} of ${intended} done. Fitting all of it in is unlikely now — pick the ${lead.label.toLowerCase()} one and let the rest go.`;
}
