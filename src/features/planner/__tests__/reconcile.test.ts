/**
 * The pure half of "a rebuilt day keeps what the person did". The store
 * rows are in regeneration.test.ts; these pin the rules one at a time.
 */

import { reconcilePlan } from '@/features/planner/reconcile';
import { durationMinutes, toMinutes } from '@/lib/dates';
import type { PlanItem } from '@/types/domain';

const DATE = '2026-09-14';
const ctx = { wakeTime: '06:30', sleepTime: '22:30' };

const at = (id: string, start: string, end: string, patch: Partial<PlanItem> = {}): PlanItem => ({
  id, date: DATE, start, end, title: id, area: 'health', tier: 'should', status: 'planned', fixed: false, ...patch,
});

const overlaps = (a: PlanItem, b: PlanItem) =>
  toMinutes(a.start) < toMinutes(b.start) + durationMinutes(b.start, b.end) &&
  toMinutes(b.start) < toMinutes(a.start) + durationMinutes(a.start, a.end);

const noOverlaps = (items: PlanItem[]) => {
  const live = items.filter((i) => i.status !== 'skipped');
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      expect({ a: live[i].id, b: live[j].id, clash: overlaps(live[i], live[j]) }).toEqual({ a: live[i].id, b: live[j].id, clash: false });
    }
  }
};

const fresh = () => [
  at('work', '09:00', '17:30', { fixed: true, title: 'Work', area: 'work' }),
  at('workout', '06:45', '07:30', { routineId: 'r-workout', tier: 'must' }),
  at('walk', '18:00', '18:30', { routineId: 'r-walk' }),
  at('winddown', '21:55', '22:15', { routineId: 'r-winddown', tier: 'could' }),
];
const running = new Set(['r-workout', 'r-walk', 'r-winddown']);

describe('with no previous day', () => {
  it('is the fresh plan, untouched', () => {
    const f = fresh();
    expect(reconcilePlan(f, undefined, running, ctx)).toBe(f);
    expect(reconcilePlan(f, [], running, ctx)).toBe(f);
  });
});

describe('records', () => {
  it('a completed item stays completed and its fresh twin is dropped', () => {
    const done = at('workout', '06:45', '07:30', { routineId: 'r-workout', status: 'completed', evidence: { source: 'manual', confidence: 1, at: 'x' } });
    const out = reconcilePlan(fresh(), [...fresh().filter((i) => i.id !== 'workout'), done], running, ctx);
    expect(out.filter((i) => i.routineId === 'r-workout')).toEqual([done]);
    noOverlaps(out);
  });

  it('a completed item is kept even when its routine no longer runs', () => {
    const done = at('workout', '06:45', '07:30', { routineId: 'r-workout', status: 'completed' });
    const freshWithout = fresh().filter((i) => i.id !== 'workout');
    const out = reconcilePlan(freshWithout, [done], new Set(['r-walk', 'r-winddown']), ctx);
    expect(out.find((i) => i.id === 'workout')).toEqual(done);
  });

  it('a skipped item stays skipped, takes no room, and is not carried onto a fresh twin', () => {
    const skipped = at('winddown', '21:55', '22:15', { routineId: 'r-winddown', status: 'skipped' });
    const out = reconcilePlan(fresh(), [skipped], running, ctx);
    expect(out.filter((i) => i.routineId === 'r-winddown')).toEqual([skipped]);
  });

  it('a completed block that now sits where the engine put something pushes that something aside', () => {
    // The engine now wants the walk at 06:45; the person already did the workout there.
    const f = [at('work', '09:00', '17:30', { fixed: true }), at('walk', '06:45', '07:15', { routineId: 'r-walk' })];
    const done = at('workout', '06:45', '07:30', { routineId: 'r-workout', status: 'completed' });
    const out = reconcilePlan(f, [done], running, ctx);
    expect(out.find((i) => i.id === 'workout')).toEqual(done);
    expect(out.find((i) => i.id === 'walk')!.start).not.toBe('06:45');
    noOverlaps(out);
  });
});

describe('decisions', () => {
  it('a moved item stays where the person put it, and the fresh twin is dropped', () => {
    const moved = at('walk', '20:00', '20:30', { routineId: 'r-walk', movedFrom: '18:00' });
    const out = reconcilePlan(fresh(), [moved], running, ctx);
    expect(out.filter((i) => i.routineId === 'r-walk')).toEqual([moved]);
    noOverlaps(out);
  });

  it('a moved item whose routine was switched off is not resurrected', () => {
    const moved = at('walk', '20:00', '20:30', { routineId: 'r-walk', movedFrom: '18:00' });
    const freshWithout = fresh().filter((i) => i.id !== 'walk');
    const out = reconcilePlan(freshWithout, [moved], new Set(['r-workout', 'r-winddown']), ctx);
    expect(out.some((i) => i.routineId === 'r-walk')).toBe(false);
  });

  it('an added block survives and bumps what the engine put on top of it', () => {
    const coffee = at('coffee', '18:00', '18:30', { title: 'Coffee with Dan', area: 'enjoyment' });
    const out = reconcilePlan(fresh(), [coffee], running, ctx);
    expect(out.find((i) => i.id === 'coffee')).toEqual(coffee);
    expect(out.find((i) => i.id === 'walk')!.start).not.toBe('18:00');
    noOverlaps(out);
  });

  it('a shortened item keeps its length', () => {
    const short = at('walk', '18:00', '18:10', { routineId: 'r-walk', shortenedFromMin: 30 });
    const out = reconcilePlan(fresh(), [short], running, ctx);
    expect(out.find((i) => i.routineId === 'r-walk')).toEqual(short);
  });

  it('a moved routine item now under the new work hours gives way to the engine’s placement', () => {
    const moved = at('walk', '12:00', '12:30', { routineId: 'r-walk', movedFrom: '18:00' });
    const out = reconcilePlan(fresh(), [moved], running, ctx);
    const walk = out.find((i) => i.routineId === 'r-walk')!;
    expect(walk.start).toBe('18:00');
    expect(walk.movedFrom).toBeUndefined();
    noOverlaps(out);
  });
});

describe('what is not kept', () => {
  it('a planned, untouched routine item is replaced by the fresh one', () => {
    const stale = at('walk', '18:00', '18:30', { routineId: 'r-walk', focus: 'old note' } as Partial<PlanItem>);
    const out = reconcilePlan(fresh(), fresh().map((i) => (i.id === 'walk' ? stale : i)), running, ctx);
    expect(out.find((i) => i.id === 'walk')).toEqual(fresh().find((i) => i.id === 'walk'));
  });

  it('fixed blocks are always the fresh ones', () => {
    const oldWork = at('work', '08:00', '16:00', { fixed: true, title: 'Work', area: 'work', status: 'completed' });
    const out = reconcilePlan(fresh(), [oldWork], running, ctx);
    expect(out.filter((i) => i.fixed)).toEqual([fresh()[0]]);
  });

  it('the result is in start order', () => {
    const moved = at('walk', '20:00', '20:30', { routineId: 'r-walk', movedFrom: '18:00' });
    const done = at('workout', '06:45', '07:30', { routineId: 'r-workout', status: 'completed' });
    const out = reconcilePlan(fresh(), [moved, done], running, ctx);
    const starts = out.map((i) => i.start);
    expect([...starts].sort()).toEqual(starts);
  });
});
