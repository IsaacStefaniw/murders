import type { MetricObservation } from '@/features/model/metrics';
import type { DailyPlan, LifeProfile, Routine } from '@/types/domain';
import { addDays } from '@/lib/dates';

/**
 * The state a person's week is in, which decides what the app may ask of
 * them next.
 *
 * Named rather than scored, because a number invites the reader to try to
 * improve the number.
 */
export type BudgetState = 'start' | 'stable' | 'strained' | 'disrupted' | 'return';

export interface CommitmentBudget {
  state: BudgetState;
  /**
   * How many NEW practices the app may propose right now. Never more than
   * one, and often none.
   *
   * This is the whole idea in one field. An app that maximises scheduled
   * practices produces a beautiful week nobody lives; the thing worth
   * maximising is how many worthwhile changes survive contact with a real
   * week, and that number is small.
   */
  newThingsAllowed: number;
  /** The one change everything else is arranged around. */
  anchorRoutineId: string | null;
  /** Said to the person, in their words. Never a verdict on them. */
  line: string;
  /** The reason, on request. */
  because: string;
}

export interface BudgetInput {
  routines: Routine[];
  /** Plans keyed by date, most recent fortnight is enough. */
  plans: Record<string, DailyPlan | undefined>;
  metrics: MetricObservation[];
  profile: LifeProfile | null;
  /** ISO timestamp of the previous open, if the app has ever been opened. */
  lastOpenedAt: string | null;
  today: string;
  now?: Date;
}

/** Under this many days of history, everybody is starting. */
const SETTLING_DAYS = 10;
/** An absence this long changes what the next screen should say. */
const AWAY_DAYS = 3;
/** Above this share of moved-or-skipped items, the week is pushing back. */
const STRAIN_SHARE = 0.4;
/** Nights under this, three of them in a week, is a strained week. */
const SHORT_NIGHT_H = 6;

interface Fortnight {
  planned: number;
  completed: number;
  moved: number;
  skipped: number;
  daysWithAnyPlan: number;
}

function lastFortnight(plans: Record<string, DailyPlan | undefined>, today: string): Fortnight {
  const out: Fortnight = { planned: 0, completed: 0, moved: 0, skipped: 0, daysWithAnyPlan: 0 };
  for (let i = 1; i <= 14; i++) {
    const items = plans[addDays(today, -i)]?.items ?? [];
    if (items.length === 0) continue;
    out.daysWithAnyPlan += 1;
    for (const item of items) {
      if (item.fixed) continue;
      out.planned += 1;
      if (item.status === 'completed') out.completed += 1;
      else if (item.status === 'skipped') out.skipped += 1;
      if (item.movedFrom) out.moved += 1;
    }
  }
  return out;
}

function shortNights(metrics: MetricObservation[], today: string): number {
  const from = addDays(today, -7);
  let n = 0;
  for (const m of metrics) {
    if (m.key !== 'sleep.hours') continue;
    const day = m.at.slice(0, 10);
    if (day < from || day > today) continue;
    if (m.value < SHORT_NIGHT_H) n += 1;
  }
  return n;
}

/**
 * The one change everything else is arranged around.
 *
 * Preference order is deliberate and not "the highest evidence grade": the
 * anchor is whatever this person has actually been doing, because an
 * anchor they are already keeping is an anchor. Only when nothing has been
 * kept does it fall back to what the plan considers most important.
 */
function anchorFrom(routines: Routine[], plans: Record<string, DailyPlan | undefined>, today: string): string | null {
  const active = routines.filter((r) => r.active);
  if (active.length === 0) return null;
  const kept = new Map<string, number>();
  for (let i = 1; i <= 28; i++) {
    for (const item of plans[addDays(today, -i)]?.items ?? []) {
      if (item.status !== 'completed' || !item.routineId) continue;
      kept.set(item.routineId, (kept.get(item.routineId) ?? 0) + 1);
    }
  }
  const best = active
    .map((r) => ({ r, n: kept.get(r.id) ?? 0 }))
    .sort((a, b) => b.n - a.n)[0];
  if (best && best.n > 0) return best.r.id;
  const TIER = { must: 0, should: 1, could: 2 } as const;
  return [...active].sort((a, b) => TIER[a.tier] - TIER[b.tier])[0]?.id ?? null;
}

/**
 * What the app may ask of somebody this week.
 *
 * Every signal here already existed and was being read by a different
 * feature for a different purpose: adherence for the weekly report, moves
 * for learned placement, sleep for auto-regulation, capacity for plan
 * size. This is where they stop being five features and become one
 * decision — how much new is reasonable right now — which is the decision
 * that was being made implicitly, by default, as "all of it".
 */
export function commitmentBudget(input: BudgetInput): CommitmentBudget {
  const { routines, plans, metrics, profile, lastOpenedAt, today, now = new Date() } = input;
  const anchorRoutineId = anchorFrom(routines, plans, today);
  const anchor = routines.find((r) => r.id === anchorRoutineId) ?? null;
  const anchorName = anchor?.title ?? 'the one thing you are keeping';

  const daysAway = lastOpenedAt
    ? Math.floor((now.getTime() - Date.parse(lastOpenedAt)) / 86400e3)
    : 0;
  if (Number.isFinite(daysAway) && daysAway >= AWAY_DAYS) {
    return {
      state: 'return',
      newThingsAllowed: 0,
      anchorRoutineId,
      line: `Back after ${daysAway} days. Start with ${anchorName} and nothing else.`,
      because:
        'Coming back is the moment an app is most tempted to hand you everything it was holding, and the moment that is least likely to work. One thing you already know how to do, until the week feels like yours again.',
    };
  }

  if (profile?.capacity === 'minimal') {
    return {
      state: 'disrupted',
      newThingsAllowed: 0,
      anchorRoutineId,
      line: `A minimum week: ${anchorName}, and room for whatever else the week wants.`,
      because:
        'You told the app capacity is minimal, so it is not adding anything and it is not going to keep suggesting. Change it whenever the week changes back.',
    };
  }

  const f = lastFortnight(plans, today);
  if (f.daysWithAnyPlan < SETTLING_DAYS) {
    return {
      state: 'start',
      newThingsAllowed: 1,
      anchorRoutineId,
      line: anchor
        ? `One anchor — ${anchorName} — and one thing that makes it easier. The rest waits.`
        : 'One anchor and one thing that makes it easier. The rest waits.',
      because:
        'Everything in the library is worth doing and that is exactly the problem: a first week with nine new practices in it is a first week nobody finishes. Two is a number that survives a Tuesday, and more gets offered once these two are yours.',
    };
  }

  const disturbed = f.planned > 0 ? (f.moved + f.skipped) / f.planned : 0;
  const tired = shortNights(metrics, today) >= 3;
  if (disturbed >= STRAIN_SHARE || tired) {
    return {
      state: 'strained',
      newThingsAllowed: 0,
      anchorRoutineId,
      line: `A full fortnight. ${anchorName} stays; everything else gets shorter.`,
      because: tired
        ? 'Three short nights in a week is the week telling you something, and the honest response is less, not a better plan. Nothing new until it settles.'
        : 'A lot got moved or missed in the last fortnight, which is information about the week rather than about you. Nothing new goes in while it is like this.',
    };
  }

  return {
    state: 'stable',
    newThingsAllowed: 1,
    anchorRoutineId,
    line: `${anchorName} is holding. There is room for one more thing if you want it.`,
    because:
      'The last fortnight went in mostly as planned, which is the only honest reason to add anything. One at a time, so it is always clear which change did what.',
  };
}

/**
 * Whether the app may propose something new right now.
 *
 * The gate is on what the app OFFERS, never on what a person chooses. If
 * someone opens the library and adds a practice in a strained week, that
 * is their call and the app takes it — being told "not now" by software
 * about your own life is the thing this product exists not to do.
 */
export const mayOffer = (budget: CommitmentBudget): boolean => budget.newThingsAllowed > 0;

export interface StartingSet {
  /** The one change the first weeks are arranged around. */
  anchorId: string | null;
  /** The small daily thing that makes the anchor easier to keep. */
  supportId: string | null;
  /** Everything else, held rather than dropped. */
  heldIds: string[];
}

/**
 * What actually starts on day one, out of everything the interview justified.
 *
 * The plan the interview produces is right — every routine in it is
 * warranted by something the person said. It is also, on a first Monday,
 * nine new things at once, and the number of new things that survive a
 * first week is closer to two. So the plan stays whole and the *start* is
 * two of it: an anchor, and one short daily practice that makes the
 * anchor easier to keep.
 *
 * Held is not dropped and is not hidden. Every held routine is listed,
 * with a switch, on the screen where the plan is approved — the person
 * can start all nine if they want to, and the app will not argue. What it
 * will not do is choose nine on their behalf.
 */
export function startingSet(routines: Routine[]): StartingSet {
  const active = routines.filter((r) => r.active);
  if (active.length === 0) return { anchorId: null, supportId: null, heldIds: [] };

  const TIER = { must: 0, should: 1, could: 2 } as const;
  const byImportance = [...active].sort(
    (a, b) => TIER[a.tier] - TIER[b.tier] || b.durationMin - a.durationMin,
  );
  const anchor = byImportance[0];

  // The support is small and near-daily on purpose. A second big block is
  // a second anchor, and two anchors is the failure this exists to avoid.
  const support =
    [...active]
      .filter((r) => r.id !== anchor.id && r.days.length >= 5)
      .sort((a, b) => a.durationMin - b.durationMin)[0] ??
    [...active].filter((r) => r.id !== anchor.id).sort((a, b) => a.durationMin - b.durationMin)[0] ??
    null;

  const keep = new Set([anchor.id, support?.id].filter(Boolean) as string[]);
  return {
    anchorId: anchor.id,
    supportId: support?.id ?? null,
    heldIds: active.filter((r) => !keep.has(r.id)).map((r) => r.id),
  };
}
