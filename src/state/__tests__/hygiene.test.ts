import type { DailyPlan, PlanItem, Suggestion } from '@/types/domain';
import { addDays } from '@/lib/dates';
import {
  FULL_PLAN_DAYS,
  KEEP_PLAN_DAYS,
  MAX_BEHAVIOUR_EVENTS,
  capList,
  capSuggestions,
  compactItem,
  migratePersisted,
  pruneHistory,
  prunePlans,
} from '../hygiene';

const today = '2026-09-04';
const item = (date: string, extra: Partial<PlanItem> = {}): PlanItem =>
  ({ id: 'i-' + date, date, start: '07:00', end: '07:30', title: 'Walk', area: 'health', tier: 'core', status: 'completed', fixed: false, routineId: 'r1', focus: 'First week done', evidence: { kind: 'tap' }, ...extra }) as unknown as PlanItem;
const plan = (date: string): DailyPlan => ({ date, items: [item(date)], displaced: [{ title: 'x', area: 'health' }], summary: 'a day' } as DailyPlan);

describe('prunePlans', () => {
  it('keeps recent and future days exactly, compacts older ones, drops the distant past', () => {
    const plans: Record<string, DailyPlan> = {};
    for (const d of [addDays(today, 3), today, addDays(today, -10), addDays(today, -(FULL_PLAN_DAYS + 5)), addDays(today, -(KEEP_PLAN_DAYS + 5))]) plans[d] = plan(d);
    const out = prunePlans(plans, today);
    expect(out[addDays(today, 3)]).toBe(plans[addDays(today, 3)]);
    expect(out[today]).toBe(plans[today]);
    expect(out[addDays(today, -10)]).toBe(plans[addDays(today, -10)]);
    const old = out[addDays(today, -(FULL_PLAN_DAYS + 5))];
    expect(old.items[0].status).toBe('completed');
    expect(old.items[0].title).toBe('Walk');
    expect(old.items[0].routineId).toBe('r1');
    expect('focus' in old.items[0]).toBe(false);
    expect('evidence' in old.items[0]).toBe(false);
    expect(old.displaced).toBeUndefined();
    expect(out[addDays(today, -(KEEP_PLAN_DAYS + 5))]).toBeUndefined();
  });

  it('returns the same object when there is nothing to do, so no write happens', () => {
    const plans = { [today]: plan(today), [addDays(today, -1)]: plan(addDays(today, -1)) };
    expect(prunePlans(plans, today)).toBe(plans);
    const once = prunePlans({ [addDays(today, -200)]: plan(addDays(today, -200)) }, today);
    expect(prunePlans(once, today)).toBe(once);
  });

  it('a compacted item keeps only what history reads', () => {
    expect(Object.keys(compactItem(item(today))).sort()).toEqual(['area', 'date', 'end', 'fixed', 'id', 'routineId', 'start', 'status', 'tier', 'title']);
  });
});

describe('caps', () => {
  it('lists keep their most recent entries', () => {
    const list = Array.from({ length: MAX_BEHAVIOUR_EVENTS + 10 }, (_, i) => i);
    const out = capList(list, MAX_BEHAVIOUR_EVENTS);
    expect(out).toHaveLength(MAX_BEHAVIOUR_EVENTS);
    expect(out[out.length - 1]).toBe(MAX_BEHAVIOUR_EVENTS + 9);
    const small = list.slice(0, 5);
    expect(capList(small, MAX_BEHAVIOUR_EVENTS)).toBe(small);
  });

  it('open suggestions are never dropped', () => {
    const s = (i: number, status: string): Suggestion => ({ id: 's' + i, status } as unknown as Suggestion);
    const list = [...Array.from({ length: 300 }, (_, i) => s(i, 'accepted')), s(999, 'open')];
    const out = capSuggestions(list);
    expect(out.some((x) => x.id === 's999')).toBe(true);
    expect(out.filter((x) => x.status !== 'open')).toHaveLength(200);
  });

  it('pruneHistory returns only the keys that changed', () => {
    const patch = pruneHistory({ plans: { [today]: plan(today) }, behaviourEvents: [], reflections: [], workoutLogs: [], suggestions: [] }, today);
    expect(patch).toEqual({});
  });
});

describe('migratePersisted', () => {
  it('version 0 to 1 keeps a good state untouched and repairs a corrupt list', () => {
    const good = { profile: { firstName: 'Sam' }, goals: [{ id: 'g' }], plans: { [today]: plan(today) } };
    expect(migratePersisted(good, 0)).toEqual(good);
    const bad = { profile: { firstName: 'Sam' }, goals: 'oops', plans: [] };
    const out = migratePersisted(bad, 0) as Record<string, unknown>;
    expect(out.goals).toEqual([]);
    expect(out.plans).toEqual({});
    expect(out.profile).toEqual({ firstName: 'Sam' });
  });
});
