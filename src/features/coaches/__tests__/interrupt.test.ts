import type { CommitmentBudget } from '@/features/budget/commitment';
import {
  FAMILY_LATE_MIN,
  HELD_IN_A_ROW,
  SHORT_NIGHTS_TRIGGER,
  coachForArea,
  coachInterrupts,
  nextInterrupt,
} from '@/features/coaches/interrupt';
import { COACH_VOICES } from '@/features/coaches/voices';
import type { MetricObservation } from '@/features/model/metrics';
import { addDays } from '@/lib/dates';
import type { DailyPlan, LifeProfile, PlanItem, Routine } from '@/types/domain';

/**
 * A coach with something to say.
 *
 * The failure modes worth testing are not crashes. They are: interrupting
 * about nothing, interrupting twice, interrupting the same way forever,
 * and asking without saying why.
 */

const TODAY = '2026-09-15'; // a Tuesday
const WEEK = '2026-09-14';

const profile = (over: Partial<LifeProfile> = {}): LifeProfile =>
  ({
    createdAt: '2026-01-01T00:00:00.000Z',
    priorities: ['family', 'health'],
    workDays: [1, 2, 3, 4, 5],
    workStart: '09:00',
    workEnd: '17:30',
    capacity: 'steady',
    ...over,
  }) as LifeProfile;

const OPEN: CommitmentBudget = {
  state: 'stable',
  newThingsAllowed: 1,
  anchorRoutineId: null,
  line: '',
  because: '',
};
const SHUT: CommitmentBudget = { ...OPEN, state: 'strained', newThingsAllowed: 0 };

function item(over: Partial<PlanItem> = {}): PlanItem {
  return {
    id: over.id ?? `pi-${over.date ?? TODAY}-${over.start ?? '06:00'}`,
    date: TODAY,
    start: '06:00',
    end: '06:45',
    title: 'Strength',
    area: 'health',
    tier: 'should',
    status: 'planned',
    fixed: false,
    ...over,
  } as PlanItem;
}

function routine(over: Partial<Routine> = {}): Routine {
  return {
    id: over.id ?? 'r-strength',
    title: 'Strength',
    area: 'health',
    days: [1, 2, 3, 4, 5],
    durationMin: 45,
    preferredStart: '06:00',
    preferredEnd: '07:00',
    energy: 'high',
    flexible: true,
    protected: false,
    active: true,
    tier: 'should',
    sessionType: 'strength',
    ...over,
  } as Routine;
}

function plans(entries: Record<string, PlanItem[]>): Record<string, DailyPlan> {
  const out: Record<string, DailyPlan> = {};
  for (const [date, items] of Object.entries(entries)) {
    out[date] = { date, items: items.map((i) => ({ ...i, date })) } as DailyPlan;
  }
  return out;
}

const sleep = (date: string, hours: number): MetricObservation =>
  ({ key: 'sleep.hours', value: hours, at: `${date}T07:00:00.000Z` }) as MetricObservation;

const input = (over: Partial<Parameters<typeof coachInterrupts>[0]> = {}) => ({
  routines: [],
  plans: {},
  metrics: [],
  profile: profile(),
  budget: OPEN,
  today: TODAY,
  nowMinutes: 12 * 60,
  seen: [],
  ...over,
});

/* ── Saying nothing ───────────────────────────────────────────────────── */

describe('most of the time it has nothing to say', () => {
  it('says nothing on an ordinary day', () => {
    expect(nextInterrupt(input())).toBeNull();
  });

  it('says nothing at all without a profile', () => {
    expect(coachInterrupts(input({ profile: null }))).toEqual([]);
  });
});

/* ── The rules ────────────────────────────────────────────────────────── */

describe('one at a time, and once only', () => {
  const r = routine();
  const dead = plans({
    [addDays(WEEK, -7)]: [item({ routineId: r.id, status: 'skipped' })],
    [WEEK]: [item({ routineId: r.id, status: 'skipped' })],
  });
  const nights = [sleep(addDays(TODAY, -1), 5), sleep(addDays(TODAY, -2), 5.5), sleep(addDays(TODAY, -3), 5)];

  it('picks exactly one even when several could fire', () => {
    const all = coachInterrupts(
      input({
        routines: [r],
        plans: { ...dead, [TODAY]: { date: TODAY, items: [item({ status: 'planned' })] } as DailyPlan },
        metrics: nights,
      }),
    );
    expect(all.length).toBeGreaterThan(1);
    expect(nextInterrupt(input({ routines: [r], plans: { ...dead, [TODAY]: { date: TODAY, items: [item({})] } as DailyPlan }, metrics: nights }))).not.toBeNull();
  });

  it('puts the one about today ahead of the one about the week', () => {
    const all = coachInterrupts(
      input({
        routines: [r],
        plans: { ...dead, [TODAY]: { date: TODAY, items: [item({})] } as DailyPlan },
        metrics: nights,
      }),
    );
    expect(all[0].id.startsWith('sleep:')).toBe(true);
  });

  it('never says the same thing twice', () => {
    const args = { routines: [r], plans: dead };
    const first = nextInterrupt(input(args));
    expect(first).not.toBeNull();
    expect(nextInterrupt(input({ ...args, seen: [first!.id] }))).toBeNull();
  });
});

describe('the gate', () => {
  it('holds back an offer to add in a strained week', () => {
    // Three sessions held in a row: the "ready for more?" trigger.
    const r = routine();
    const held = plans(
      Object.fromEntries(
        [1, 2, 3].map((i) => [
          addDays(TODAY, -i),
          [item({ routineId: r.id, status: 'completed' })],
        ]),
      ),
    );
    expect(nextInterrupt(input({ routines: [r], plans: held, budget: OPEN }))?.id).toMatch(/^load:/);
    expect(nextInterrupt(input({ routines: [r], plans: held, budget: SHUT }))).toBeNull();
    expect(HELD_IN_A_ROW).toBe(3);
  });

  it('never holds back a fix, because a hard week is when a fix matters', () => {
    const r = routine();
    const dead = plans({
      [addDays(WEEK, -7)]: [item({ routineId: r.id, status: 'skipped' })],
      [WEEK]: [item({ routineId: r.id, status: 'skipped' })],
    });
    const found = nextInterrupt(input({ routines: [r], plans: dead, budget: SHUT }));
    expect(found?.id.startsWith('slot:')).toBe(true);
    expect(found?.adds).toBe(false);
  });
});

describe('the shape of what it says', () => {
  const r = routine();
  const dead = plans({
    [addDays(WEEK, -7)]: [item({ routineId: r.id, status: 'skipped' })],
    [WEEK]: [item({ routineId: r.id, status: 'skipped' })],
  });

  it('offers two answers and never three', () => {
    for (const i of coachInterrupts(input({ routines: [r], plans: dead }))) {
      expect(i.answers).toHaveLength(2);
    }
  });

  it('always says why it fired, and names the coach saying it', () => {
    const found = nextInterrupt(input({ routines: [r], plans: dead }))!;
    expect(found.because.length).toBeGreaterThan(0);
    expect(found.because).toContain(COACH_VOICES[found.pathId].name);
  });

  it('asks a question', () => {
    for (const i of coachInterrupts(input({ routines: [r], plans: dead }))) {
      expect(i.asks.endsWith('?')).toBe(true);
    }
  });
});

/* ── Each trigger ─────────────────────────────────────────────────────── */

describe('the dead slot', () => {
  const r = routine();
  const dead = plans({
    [addDays(WEEK, -7)]: [item({ routineId: r.id, status: 'skipped' })],
    [WEEK]: [item({ routineId: r.id, status: 'skipped' })],
  });

  it('names the hour, the count, and offers the hour after it', () => {
    const found = nextInterrupt(input({ routines: [r], plans: dead }))!;
    expect(found.says).toBe("6am isn't working for strength. That's 2 times now.");
    expect(found.answers[0].label).toBe('Move to 7am');
    expect(found.answers[0].effect).toMatchObject({
      kind: 'changes',
      changes: [{ kind: 'move_routine', payload: { preferredStart: '07:00' } }],
    });
    expect(found.answers[1].effect.kind).toBe('none');
  });
});

describe('three held in a row', () => {
  it('offers load only off what was actually kept', () => {
    const r = routine();
    const held = plans(
      Object.fromEntries(
        [1, 2, 3].map((i) => [addDays(TODAY, -i), [item({ routineId: r.id, status: 'completed' })]]),
      ),
    );
    const found = nextInterrupt(input({ routines: [r], plans: held }))!;
    expect(found.pathId).toBe('training');
    expect(found.adds).toBe(true);
    expect(found.answers[0].effect).toEqual({ kind: 'intensity', pathId: 'training', push: true });
  });

  it('stays quiet when one of the three was missed', () => {
    const r = routine();
    const mixed = plans({
      [addDays(TODAY, -1)]: [item({ routineId: r.id, status: 'completed' })],
      [addDays(TODAY, -2)]: [item({ routineId: r.id, status: 'skipped' })],
      [addDays(TODAY, -3)]: [item({ routineId: r.id, status: 'completed' })],
    });
    expect(coachInterrupts(input({ routines: [r], plans: mixed }))).toEqual([]);
  });
});

describe('three short nights', () => {
  const nights = [sleep(addDays(TODAY, -1), 5), sleep(addDays(TODAY, -2), 5.5), sleep(addDays(TODAY, -3), 5)];
  const todayPlan = plans({
    [TODAY]: [item({ start: '06:00', end: '07:30', title: 'Strength' }), item({ start: '20:00', end: '20:15', title: 'Wind down' })],
  });

  it('offers to move the longest thing to tomorrow, not to cancel it', () => {
    const found = nextInterrupt(input({ plans: todayPlan, metrics: nights }))!;
    expect(found.pathId).toBe('recovery');
    expect(found.says).toContain('Strength');
    expect(found.answers[1].effect).toMatchObject({
      kind: 'moveItemToDate',
      targetDate: addDays(TODAY, 1),
    });
    expect(SHORT_NIGHTS_TRIGGER).toBe(3);
  });

  it('stays quiet at two short nights', () => {
    expect(
      coachInterrupts(input({ plans: todayPlan, metrics: nights.slice(0, 2) })),
    ).toEqual([]);
  });

  it('has nothing to offer when the day is already done', () => {
    const done = plans({ [TODAY]: [item({ status: 'completed' })] });
    expect(coachInterrupts(input({ plans: done, metrics: nights }))).toEqual([]);
  });
});

describe('the evening work is about to eat', () => {
  const dinner = plans({
    [TODAY]: [item({ id: 'pi-dinner', start: '18:00', end: '18:45', title: 'Dinner together', area: 'family' })],
  });

  it('speaks up inside the window, with the minutes in it', () => {
    const found = nextInterrupt(input({ plans: dinner, nowMinutes: 17 * 60 + 15 }))!;
    expect(found.pathId).toBe('family');
    expect(found.says).toBe('Dinner together in 45 minutes.');
    expect(found.asks).toContain('6:20');
    expect(found.answers[1].effect).toMatchObject({
      kind: 'moveItem',
      itemId: 'pi-dinner',
      start: '18:20',
    });
    expect(FAMILY_LATE_MIN).toBe(20);
  });

  it('is silent two hours out, and silent once it has started', () => {
    expect(coachInterrupts(input({ plans: dinner, nowMinutes: 16 * 60 }))).toEqual([]);
    expect(coachInterrupts(input({ plans: dinner, nowMinutes: 18 * 60 }))).toEqual([]);
  });
});

describe('who speaks for what', () => {
  it('routes each area to a coach', () => {
    expect(coachForArea('family')).toBe('family');
    expect(coachForArea('relationship')).toBe('relationship');
    expect(coachForArea('work')).toBe('work');
    expect(coachForArea('admin')).toBe('money');
    // Three coaches share health; Ren speaks for it, because every health
    // trigger is about when and how hard.
    expect(coachForArea('health')).toBe('training');
    expect(coachForArea('growth')).toBe('training');
  });
});
