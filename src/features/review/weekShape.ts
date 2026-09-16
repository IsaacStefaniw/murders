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

import { isBalance, protocolById, type Pillar, PILLAR_LABELS } from '@/features/knowledge/protocols';
import { durationMinutes } from '@/lib/dates';
import type { DailyPlan, LifeArea, PlanItem, Routine } from '@/types/domain';

/** The parts of a life, in the words the rest of the app uses. */
export const AREA_WORD: Record<LifeArea, string> = {
  family: 'family',
  relationship: 'your relationship',
  health: 'health',
  work: 'work',
  growth: 'growth',
  enjoyment: 'friends and enjoyment',
  admin: 'money',
};

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
  /**
   * This pillar's week is carried by practices that make no research
   * claim — see ProtocolBasis.
   *
   * Without this the grade tiebreak below sorted a week of family time
   * underneath a week of Zone 2, because the family practices grade
   * themselves honestly at D and E. That is the app ranking somebody's
   * children below their cardio on a scale that was never built to
   * compare the two.
   */
  balanceLed: boolean;
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
  /** Parts of life this week has something in it for. */
  areas: LifeArea[];
  /**
   * Priorities the person named that this week has nothing for.
   *
   * Isaac: "There are things that are not plausible to study but
   * constitute a well balanced life — evidenced more holistically than
   * specifically." A holistic reading is exactly this: not a score, not a
   * rate, just which parts of a life the week touches and which it
   * misses. The app can see that and a person in the middle of the week
   * cannot.
   */
  missing: LifeArea[];
  /** The balance reading, in one sentence. Empty when there is none. */
  balanceLine: string;
}

const pillarOf = (item: PlanItem, routines: Routine[]): Pillar | undefined => {
  const r = routines.find((x) => x.id === item.routineId);
  if (!r?.protocolId) return undefined;
  return protocolById(r.protocolId)?.pillar;
};

const protocolOf = (item: PlanItem, routines: Routine[]) => {
  const r = routines.find((x) => x.id === item.routineId);
  return r?.protocolId ? protocolById(r.protocolId) : undefined;
};

const gradeOf = (item: PlanItem, routines: Routine[]): string =>
  protocolOf(item, routines)?.evidenceLevel || 'E';

const areaOf = (item: PlanItem, routines: Routine[]): LifeArea | undefined =>
  protocolOf(item, routines)?.area ?? routines.find((x) => x.id === item.routineId)?.area;

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
  /** What the person said matters, so the balance reading is theirs. */
  priorities: readonly LifeArea[] = [],
): WeekShape {
  const acc = new Map<Pillar, PillarWeek>();
  const areas = new Set<LifeArea>();
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
          balanceLed: false,
        } satisfies PillarWeek);
      row.intended += 1;
      row.intendedMin += minutesOf(item);
      intended += 1;
      const area = areaOf(item, routines);
      if (area) areas.add(area);
      const protocol = protocolOf(item, routines);
      if (protocol && isBalance(protocol)) row.balanceLed = true;
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

  // A balance-led pillar ranks with the well-evidenced ones rather than
  // below the worst. Its practices grade themselves honestly at D and E
  // because that is what the research on them says; ordering by that
  // letter puts a person's family under their cardio.
  const rank = (p: PillarWeek) => (p.balanceLed && p.bestGrade > 'B' ? 'B' : p.bestGrade);
  const pillars = [...acc.values()].sort(
    (a, b) => b.intendedMin - a.intendedMin || rank(a).localeCompare(rank(b)),
  );

  const missing = priorities.filter((a) => !areas.has(a));

  return {
    from: dates[0] ?? today,
    to: dates[dates.length - 1] ?? today,
    pillars,
    intended,
    done,
    line: weekLine(pillars, intended, done, dates, today),
    areas: [...areas],
    missing,
    balanceLine: balanceLine(intended, priorities, missing),
  };
}

/**
 * The holistic reading: which parts of a life this week touches.
 *
 * Deliberately not a score and deliberately not a scold. It states a fact
 * the person cannot see from inside the week — seven days at a glance —
 * and stops. Whether nothing for family this week is a problem is theirs
 * to decide; four days out of seven is not a thing anybody's family is.
 *
 * Only ever reads against priorities the person named themselves. An app
 * telling somebody their week is unbalanced against a definition of
 * balance they never gave is the app deciding what their life is for.
 */
export function balanceLine(
  intended: number,
  priorities: readonly LifeArea[],
  missing: readonly LifeArea[],
): string {
  if (intended === 0 || priorities.length === 0) return '';
  if (missing.length === 0) return 'Every part of the week you said matters has something in it.';
  if (missing.length === priorities.length) return '';
  const words = missing.map((a) => AREA_WORD[a]);
  const said =
    words.length === 1
      ? words[0]
      : `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`;
  return `Nothing for ${said} this week.`;
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
    // Three endings, not two. A week led by time with the people in it
    // is not a week short of evidence — it is a week about something the
    // research does not grade, and saying "start with whichever is
    // easiest" to that person treats it as the consolation option.
    const ending = lead.balanceLed
      ? 'Nothing in the research grades that, and it is in your week anyway.'
      : lead.bestGrade <= 'B'
        ? 'That is the best-evidenced thing in your week.'
        : 'Start with whichever one is easiest to say yes to.';
    return `${intended} ${intended === 1 ? 'session' : 'sessions'} this week, mostly ${lead.label.toLowerCase()}. ${ending}`;
  }

  // Under way, and there is room.
  if (remaining <= daysLeft) {
    return `${done} of ${intended} done, and ${remaining} ${remaining === 1 ? 'session' : 'sessions'} left with ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to fit them.`;
  }

  // More left than days. Say the smallest true thing rather than the sum.
  return `${done} of ${intended} done. Fitting all of it in is unlikely now — pick the ${lead.label.toLowerCase()} one and let the rest go.`;
}
