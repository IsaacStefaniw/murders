/**
 * Keeping the persisted state a size a phone can write on every tap.
 *
 * Every change serialises the whole store to one AsyncStorage key, and
 * until now nothing was ever removed: every day's plan, every behaviour
 * event, every reflection, forever. A year of use is roughly 2,500 plan
 * items and a save that gets slower with each of them.
 *
 * The rule: the recent past stays exactly as it was, the older past keeps
 * only what any screen still reads from it, and the distant past goes.
 * Every consumer of history — the weekly report, the cohort comparison,
 * the coach note, level evidence, the suggestions engine — reads a plan's
 * date and an item's title, area, status, routine and goal. Nothing reads
 * an old item's guidance, focus or move history, so those are what a
 * compacted item drops.
 */
import { addDays } from '@/lib/dates';
import type { BehaviourEvent, DailyPlan, PlanItem, Reflection, Suggestion, WorkoutLog } from '@/types/domain';

/** Days kept exactly as planned, item by item. */
export const FULL_PLAN_DAYS = 120;
/** Days kept in compact form; beyond this a day is gone. */
export const KEEP_PLAN_DAYS = 730;
export const MAX_BEHAVIOUR_EVENTS = 2000;
export const MAX_REFLECTIONS = 730;
export const MAX_WORKOUT_LOGS = 500;
export const MAX_RESOLVED_SUGGESTIONS = 200;

const KEPT_ITEM_KEYS: (keyof PlanItem)[] = [
  'id', 'date', 'start', 'end', 'title', 'area', 'tier', 'status', 'routineId', 'goalId', 'fixed',
];

export function compactItem(item: PlanItem): PlanItem {
  const out: Partial<PlanItem> = {};
  for (const k of KEPT_ITEM_KEYS) {
    if (item[k] !== undefined) (out as Record<string, unknown>)[k] = item[k];
  }
  return out as PlanItem;
}

export function compactPlan(plan: DailyPlan): DailyPlan {
  return { date: plan.date, items: plan.items.map(compactItem), approvedAt: plan.approvedAt };
}

/**
 * Plans, pruned. Today and every later day are untouched; the last
 * FULL_PLAN_DAYS are untouched; older days are compacted; days past
 * KEEP_PLAN_DAYS are dropped. Returns the same object when nothing
 * changed, so callers can skip a write.
 */
export function prunePlans(plans: Record<string, DailyPlan>, today: string): Record<string, DailyPlan> {
  const fullFrom = addDays(today, -FULL_PLAN_DAYS);
  const keepFrom = addDays(today, -KEEP_PLAN_DAYS);
  let changed = false;
  const next: Record<string, DailyPlan> = {};
  for (const [date, plan] of Object.entries(plans)) {
    if (date >= fullFrom) {
      next[date] = plan;
    } else if (date >= keepFrom) {
      const compact = plan.items.every((i) => Object.keys(i).length <= KEPT_ITEM_KEYS.length && !('focus' in i) && !('evidence' in i));
      if (compact && !plan.displaced && !plan.summary && !plan.lookForward) {
        next[date] = plan;
      } else {
        next[date] = compactPlan(plan);
        changed = true;
      }
    } else {
      changed = true;
    }
  }
  return changed ? next : plans;
}

/** The last `max` entries of a chronological list; the same array when it already fits. */
export function capList<T>(list: T[], max: number): T[] {
  return list.length > max ? list.slice(-max) : list;
}

/** Open suggestions are all kept; resolved ones are the last few hundred. */
export function capSuggestions(list: Suggestion[]): Suggestion[] {
  const resolved = list.filter((s) => s.status !== 'open');
  if (resolved.length <= MAX_RESOLVED_SUGGESTIONS) return list;
  const drop = new Set(resolved.slice(0, resolved.length - MAX_RESOLVED_SUGGESTIONS).map((s) => s.id));
  return list.filter((s) => !drop.has(s.id));
}

export type HistorySlice = {
  plans: Record<string, DailyPlan>;
  behaviourEvents: BehaviourEvent[];
  reflections: Reflection[];
  workoutLogs: WorkoutLog[];
  suggestions: Suggestion[];
};

/** Everything above, as a patch; only the keys that changed are present. */
export function pruneHistory(state: HistorySlice, today: string): Partial<HistorySlice> {
  const patch: Partial<HistorySlice> = {};
  const plans = prunePlans(state.plans, today);
  if (plans !== state.plans) patch.plans = plans;
  const be = capList(state.behaviourEvents, MAX_BEHAVIOUR_EVENTS);
  if (be !== state.behaviourEvents) patch.behaviourEvents = be;
  const re = capList(state.reflections, MAX_REFLECTIONS);
  if (re !== state.reflections) patch.reflections = re;
  const wl = capList(state.workoutLogs, MAX_WORKOUT_LOGS);
  if (wl !== state.workoutLogs) patch.workoutLogs = wl;
  const su = capSuggestions(state.suggestions);
  if (su !== state.suggestions) patch.suggestions = su;
  return patch;
}

/**
 * The persisted-state version. Bump it when a stored shape changes, and
 * teach `migratePersisted` the step. Version 0 is every install before
 * this existed; the migration to 1 is the identity, because the shape
 * did not change — the point of adding it now is that the next change
 * has somewhere to go instead of a patch on rehydrate.
 */
export const PERSIST_VERSION = 1;

export function migratePersisted(persisted: unknown, fromVersion: number): unknown {
  const state = (persisted ?? {}) as Record<string, unknown>;
  if (fromVersion < 1) {
    // Nothing structural changed between 0 and 1. Lists that should be
    // arrays but were somehow persisted as something else are reset,
    // which is the one failure mode a bad early write could leave behind.
    for (const key of ['goals', 'routines', 'planEvents', 'behaviourIntentions', 'behaviourEvents', 'reflections', 'suggestions', 'metrics', 'workoutLogs']) {
      if (key in state && !Array.isArray(state[key])) state[key] = [];
    }
    if ('plans' in state && (typeof state.plans !== 'object' || state.plans === null || Array.isArray(state.plans))) state.plans = {};
  }
  return state;
}
