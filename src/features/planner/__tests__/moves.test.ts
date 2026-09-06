/**
 * Every way a thing moves on a day, and the two promises that hold for all
 * of them: nothing overlaps afterwards, and the displaced list says exactly
 * what changed — no more, no less.
 */

import { candidateStartsFor, isImmovable, moveWithBump, pastStartsFor } from '@/features/planner/moveWithBump';
import { grantedEntitlement } from '@/features/plus/entitlement';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { useAppStore } from '@/state/store';
import { addDays, durationMinutes, todayKey, toHHMM, toMinutes, weekdayOf } from '@/lib/dates';
import type { DailyPlan, PlanItem } from '@/types/domain';

const at = (start: string, end: string, title: string, patch: Partial<PlanItem> = {}): PlanItem => ({
  id: title,
  date: '2026-09-01',
  start,
  end,
  title,
  area: 'health',
  tier: 'should',
  status: 'planned',
  fixed: false,
  ...patch,
});
const day = (...items: PlanItem[]): DailyPlan => ({ date: '2026-09-01', items });
const ctx = { wakeTime: '06:30', sleepTime: '22:30' };
const byId = (o: { items: PlanItem[] }, id: string) => o.items.find((i) => i.id === id)!;

const startOf = (i: PlanItem) => toMinutes(i.start);
const endOf = (i: PlanItem) => toMinutes(i.start) + durationMinutes(i.start, i.end);
const overlaps = (a: PlanItem, b: PlanItem) => startOf(a) < endOf(b) && startOf(b) < endOf(a);

/**
 * The invariants every move must leave behind.
 *
 * Three overlaps are allowed and only three: the moved item over something
 * immovable, when the person chose that and was told (`overlapsFixed`);
 * an item the day had no room for, left where it was and reported with
 * `to: null`; and two things that already overlapped before the move and
 * that the move did not touch — a completed walk logged during work is
 * a record, and no move elsewhere on the day may rewrite it.
 */
function expectHonest(before: DailyPlan, movedId: string, out: ReturnType<typeof moveWithBump>) {
  const after = out.items;
  expect(after.map((i) => i.id).sort()).toEqual(before.items.map((i) => i.id).sort());

  const wasById = new Map(before.items.map((i) => [i.id, i]));
  const alreadyThere = (a: PlanItem, b: PlanItem) => {
    const wasA = wasById.get(a.id)!;
    const wasB = wasById.get(b.id)!;
    return overlaps(wasA, wasB) && wasA.start === a.start && wasB.start === b.start;
  };

  const noRoom = new Set(out.displaced.filter((d) => d.to === null).map((d) => d.id));
  const live = after.filter((i) => i.status !== 'skipped');
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const a = live[i];
      const b = live[j];
      if (!overlaps(a, b)) continue;
      const chosenOverFixed =
        out.overlapsFixed && ((a.id === movedId && isImmovable(b)) || (b.id === movedId && isImmovable(a)));
      const excused = chosenOverFixed || noRoom.has(a.id) || noRoom.has(b.id) || alreadyThere(a, b);
      expect({ a: `${a.title} ${a.start}`, b: `${b.title} ${b.start}`, excused }).toEqual({
        a: `${a.title} ${a.start}`,
        b: `${b.title} ${b.start}`,
        excused: true,
      });
    }
  }

  for (const was of before.items) {
    if (was.id === movedId) continue;
    const now = byId(out, was.id);
    const report = out.displaced.find((d) => d.id === was.id);
    if (isImmovable(was) || was.status === 'skipped') {
      expect({ title: was.title, start: now.start, report }).toEqual({ title: was.title, start: was.start, report: undefined });
      continue;
    }
    if (now.start !== was.start) {
      expect(report).toEqual({ id: was.id, title: was.title, from: was.start, to: now.start });
    } else if (report) {
      expect(report.to).toBeNull();
    }
  }
}

describe('D1 to a free slot', () => {
  it('displaces nothing and overlaps nothing', () => {
    const plan = day(
      at('09:00', '17:00', 'Work', { id: 'work', fixed: true }),
      at('18:00', '18:30', 'Walk', { id: 'walk' }),
      at('07:00', '08:00', 'Training', { id: 'training' }),
    );
    const out = moveWithBump(plan, 'training', '19:00', ctx);
    expect(byId(out, 'training')).toMatchObject({ start: '19:00', end: '20:00', movedFrom: '07:00' });
    expect(out.displaced).toEqual([]);
    expect(out.overlapsFixed).toBe(false);
    expectHonest(plan, 'training', out);
  });
});

describe('D2 with bumps', () => {
  it('reports exactly the items whose start changed', () => {
    const plan = day(
      at('09:00', '17:00', 'Work', { id: 'work', fixed: true }),
      at('17:15', '17:45', 'Walk', { id: 'walk' }),
      at('17:45', '18:30', 'Dinner', { id: 'dinner', tier: 'must' }),
      at('20:00', '20:20', 'Read', { id: 'read', tier: 'could' }),
      at('07:00', '08:00', 'Training', { id: 'training' }),
    );
    const out = moveWithBump(plan, 'training', '17:30', ctx);
    expectHonest(plan, 'training', out);
    // Dinner and the walk collide with the chosen hour. The walk then
    // lands beside Read, so Read moves too: a cascade, and every step of
    // it is in the list.
    expect(out.displaced.map((d) => d.id)).toEqual(expect.arrayContaining(['dinner', 'walk']));
  });
});

describe('D3 a skipped item', () => {
  const plan = day(
    at('18:00', '18:30', 'Walk', { id: 'walk', status: 'skipped' }),
    at('12:00', '13:00', 'Training', { id: 'training' }),
  );

  it('is neither bumped nor reported — it is not occupying the hour', () => {
    const out = moveWithBump(plan, 'training', '18:00', ctx);
    expect(byId(out, 'training').start).toBe('18:00');
    expect(byId(out, 'walk')).toMatchObject({ start: '18:00', status: 'skipped' });
    expect(out.displaced).toEqual([]);
    expectHonest(plan, 'training', out);
  });

  it('is not priced as a bump by the picker', () => {
    const c = candidateStartsFor(plan, 'training', ctx).find((x) => x.start === '18:00')!;
    expect(c.bumps).toBe(0);
  });
});

describe('D4 a fixed block that ends at midnight', () => {
  const plan = day(
    at('19:00', '00:00', 'Work', { id: 'work', fixed: true, area: 'work' }),
    at('12:00', '13:00', 'Training', { id: 'training' }),
  );

  it('is seen as a clash by a move into it', () => {
    const out = moveWithBump(plan, 'training', '20:00', ctx);
    expect(out.overlapsFixed).toBe(true);
  });

  it('is priced as during work by the picker', () => {
    const c = candidateStartsFor(plan, 'training', ctx).find((x) => x.start === '20:00')!;
    expect(c.hitsFixed).toBe(true);
  });
});

describe('D5 the picker with a current time', () => {
  const plan = day(
    at('09:00', '12:00', 'Work', { id: 'work', fixed: true }),
    at('12:30', '13:30', 'Training', { id: 'training' }),
  );

  it('offers nothing before now and nothing past midnight, for a night owl too', () => {
    const owl = { wakeTime: '08:30', sleepTime: '00:15', notBefore: toMinutes('21:10') };
    const c = candidateStartsFor(plan, 'training', owl);
    expect(c.length).toBeGreaterThan(0);
    for (const x of c) {
      expect(toMinutes(x.start)).toBeGreaterThanOrEqual(toMinutes('21:10'));
      expect(toMinutes(x.start) + 60).toBeLessThanOrEqual(1440);
    }
  });
});

describe('D6 it already happened', () => {
  it('offers only times that ended before now, latest first', () => {
    const plan = day(
      at('09:00', '12:00', 'Work', { id: 'work', fixed: true }),
      at('16:00', '16:30', 'Walk', { id: 'walk' }),
    );
    const past = pastStartsFor(plan, 'walk', ctx, toMinutes('15:20'));
    expect(past[0].start).toBe('14:30');
    for (const c of past) expect(toMinutes(c.start) + 30).toBeLessThanOrEqual(toMinutes('15:20'));
    for (let i = 1; i < past.length; i += 1) expect(past[i].start < past[i - 1].start).toBe(true);
  });

  it('placing it there leaves the day honest like any other move', () => {
    const plan = day(
      at('09:00', '12:00', 'Work', { id: 'work', fixed: true }),
      at('14:00', '14:30', 'Stretch', { id: 'stretch' }),
      at('16:00', '16:30', 'Walk', { id: 'walk' }),
    );
    const out = moveWithBump(plan, 'walk', '14:00', ctx);
    expectHonest(plan, 'walk', out);
    expect(out.displaced.map((d) => d.id)).toEqual(['stretch']);
  });
});

/** The store, driven the way the screens drive it. */
const onboard = () => {
  useAppStore.getState().resetAll();
  const built = buildLifeOperatingPlan({
    name: 'Sam',
    priorities: ['health', 'work'],
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    energy: 'morning',
    trainingDays: '3',
    capacity: 'steady',
  });
  useAppStore.setState({ entitlement: grantedEntitlement() });
  useAppStore.getState().completeOnboarding({
    profile: built.profile,
    goals: built.goals,
    routines: built.routines,
    behaviourIntentions: built.behaviourIntentions,
  });
  // The next Monday: a work day with flexible items on it.
  const today = todayKey();
  const date = addDays(today, (8 - weekdayOf(today)) % 7 || 7);
  useAppStore.getState().ensurePlan(date);
  return date;
};

const expectNoOverlapsOn = (date: string) => {
  const items = useAppStore.getState().plans[date]!.items.filter((i) => i.status !== 'skipped');
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      expect({ a: `${items[i].title} ${items[i].start}`, b: `${items[j].title} ${items[j].start}`, clash: overlaps(items[i], items[j]) }).toEqual({
        a: `${items[i].title} ${items[i].start}`,
        b: `${items[j].title} ${items[j].start}`,
        clash: false,
      });
    }
  }
};

describe('D7 to tomorrow', () => {
  it('leaves today, lands on tomorrow without overlapping, and remembers where it came from', () => {
    const date = onboard();
    const tomorrow = addDays(date, 1);
    const s = useAppStore.getState();
    const item = s.plans[date]!.items.find((i) => !i.fixed)!;
    s.moveItemToDate(date, item.id, tomorrow);

    const state = useAppStore.getState();
    expect(state.plans[date]!.items.some((i) => i.id === item.id)).toBe(false);
    const landed = state.plans[tomorrow]!.items.find((i) => i.title === item.title && i.movedFrom === item.start);
    expect(landed).toMatchObject({ date: tomorrow, status: 'planned', routineId: item.routineId });
    expect(durationMinutes(landed!.start, landed!.end)).toBe(durationMinutes(item.start, item.end));
    expectNoOverlapsOn(tomorrow);
  });
});

describe('D7b to a tomorrow with no room', () => {
  /**
   * Fails today: `moveItemToDate` in src/state/store.ts falls back to the
   * item's own start when the target day offers no free slot, and appends
   * it — so it lands on top of whatever is there, with nothing displaced
   * and nothing reported. Every other move goes through `moveWithBump`;
   * this one should too. The store is owned by another workstream in this
   * review; the test is left here, skipped, for the fix to turn on.
   */
  it.skip('either finds room by bumping, or says so — never a silent overlap', () => {
    const date = onboard();
    const tomorrow = addDays(date, 1);
    useAppStore.getState().ensurePlan(tomorrow);
    useAppStore.setState({
      plans: {
        ...useAppStore.getState().plans,
        [tomorrow]: {
          date: tomorrow,
          items: [at('06:30', '22:30', 'All day thing', { id: 'solid', date: tomorrow, area: 'family' })],
        },
      },
    });
    const item = useAppStore.getState().plans[date]!.items.find((i) => !i.fixed)!;
    useAppStore.getState().moveItemToDate(date, item.id, tomorrow);
    expectNoOverlapsOn(tomorrow);
  });
});

describe('D8 shorten', () => {
  it('keeps the start, shrinks the end, and records the original length', () => {
    const date = onboard();
    const s = useAppStore.getState();
    const item = s.plans[date]!.items.find((i) => !i.fixed && durationMinutes(i.start, i.end) > 20)!;
    const original = durationMinutes(item.start, item.end);
    s.shortenItem(date, item.id, 20);
    const after = useAppStore.getState().plans[date]!.items.find((i) => i.id === item.id)!;
    expect(after.start).toBe(item.start);
    expect(after.end).toBe(toHHMM(toMinutes(item.start) + 20));
    expect(after.shortenedFromMin).toBe(original);
    expectNoOverlapsOn(date);
  });

  it('does nothing when asked to make it longer', () => {
    const date = onboard();
    const s = useAppStore.getState();
    const item = s.plans[date]!.items.find((i) => !i.fixed)!;
    s.shortenItem(date, item.id, durationMinutes(item.start, item.end) + 30);
    const after = useAppStore.getState().plans[date]!.items.find((i) => i.id === item.id)!;
    expect(after.end).toBe(item.end);
    expect(after.shortenedFromMin).toBeUndefined();
  });
});

describe('D9 quick-add into a full day', () => {
  it('takes the chosen time, names what it moved, and leaves no overlaps', () => {
    const date = onboard();
    const s = useAppStore.getState();
    // Fill the evening so the addition has to bump something.
    s.addPlanItem(date, { title: 'Dinner', area: 'family', start: '18:00', durationMin: 60 });
    s.addPlanItem(date, { title: 'Reading', area: 'growth', start: '19:15', durationMin: 45 });
    s.addPlanItem(date, { title: 'Call Mum', area: 'family', start: '20:15', durationMin: 30 });
    expectNoOverlapsOn(date);

    const before = useAppStore.getState().plans[date]!.items;
    const displaced = useAppStore.getState().addPlanItem(date, {
      title: 'Coffee with Dan',
      area: 'enjoyment',
      start: '19:00',
      durationMin: 60,
    });
    const after = useAppStore.getState().plans[date]!.items;
    expect(after.find((i) => i.title === 'Coffee with Dan')).toMatchObject({ start: '19:00', end: '20:00' });
    expectNoOverlapsOn(date);

    // Honest: every item whose start changed is in the list, and only those.
    const changed = before
      .filter((b) => after.find((a) => a.id === b.id)!.start !== b.start)
      .map((b) => b.id)
      .sort();
    expect(displaced.filter((d) => d.to !== null).map((d) => d.id).sort()).toEqual(changed);
    expect(changed).toContain(before.find((i) => i.title === 'Reading')!.id);
  });
});

describe('D10 a seeded fuzz over days and targets', () => {
  // A tiny deterministic generator so a failure reproduces from its seed.
  const rng = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const randomDay = (next: () => number): DailyPlan => {
    const items: PlanItem[] = [];
    if (next() < 0.7) items.push(at('09:00', '17:00', 'Work', { id: 'work', fixed: true, area: 'work' }));
    const n = 3 + Math.floor(next() * 4);
    for (let i = 0; i < n; i += 1) {
      const start = 420 + Math.floor(next() * 56) * 15; // 07:00 to 20:45
      const dur = 15 * (1 + Math.floor(next() * 4));
      const roll = next();
      const status = roll < 0.15 ? 'completed' : roll < 0.3 ? 'skipped' : 'planned';
      const tier = next() < 0.3 ? 'must' : next() < 0.5 ? 'could' : 'should';
      items.push(at(toHHMM(start), toHHMM(start + dur), `Item ${i}`, { id: `i${i}`, status, tier }));
    }
    return day(...items);
  };

  it('never leaves an overlap, never moves an immovable, never loses anything', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const next = rng(seed);
      const plan = randomDay(next);
      const movable = plan.items.filter((i) => !i.fixed);
      const target = movable[Math.floor(next() * movable.length)];
      const to = toHHMM(390 + Math.floor(next() * 60) * 15);
      const out = moveWithBump(plan, target.id, to, ctx);
      expect({ seed, start: byId(out, target.id).start }).toEqual({ seed, start: to });
      expectHonest(plan, target.id, out);
    }
  });
});
