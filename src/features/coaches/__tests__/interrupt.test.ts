import type { CommitmentBudget } from '@/features/budget/commitment';
import {
  FAMILY_LATE_MIN,
  HELD_IN_A_ROW,
  SHORT_NIGHTS_TRIGGER,
  SUGGESTION_GAP_DAYS,
  SUGGESTION_GRADES,
  coachForArea,
  coachForProtocol,
  coachInterrupts,
  maySuggest,
  nextInterrupt,
} from '@/features/coaches/interrupt';
import { COACH_VOICES } from '@/features/coaches/voices';
import { PATH_AREA } from '@/features/paths/definitions';
import type { MetricObservation } from '@/features/model/metrics';
import { PROTOCOLS, isBalance, justification, protocolById } from '@/features/knowledge/protocols';
import { addDays } from '@/lib/dates';
import type { DailyPlan, LifeArea, LifeProfile, PlanItem, Routine } from '@/types/domain';

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
  it('says nothing on an ordinary day with nothing running', () => {
    expect(nextInterrupt(input())).toBeNull();
  });

  it('says nothing about a routine that is simply going fine', () => {
    const r = routine();
    const fine = plans({
      [addDays(TODAY, -1)]: [item({ routineId: r.id, status: 'completed' })],
      [addDays(TODAY, -2)]: [item({ routineId: r.id, status: 'skipped' })],
    });
    expect(
      coachInterrupts(input({ routines: [r], plans: fine })).filter(
        (i) => !i.id.startsWith('suggest:'),
      ),
    ).toEqual([]);
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
    expect(first!.id).toMatch(/^slot:/);
    const after = nextInterrupt(
      input({ ...args, seen: [{ id: first!.id, at: `${TODAY}T08:00:00.000Z` }] }),
    );
    expect(after?.id).not.toBe(first!.id);
    expect(after?.id ?? '').not.toMatch(/^slot:/);
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
    // The count names its window: two sightings over the three weeks the
    // slot detector looks across, not a bare number to take on trust.
    expect(found.says).toBe("6am isn't working for strength. That is twice in the last 3 weeks.");
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
    expect(
      coachInterrupts(input({ routines: [r], plans: mixed })).map((i) => i.id),
    ).not.toContainEqual(expect.stringMatching(/^load:/));
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
      coachInterrupts(input({ plans: todayPlan, metrics: nights.slice(0, 2) })).map((i) => i.id),
    ).not.toContainEqual(expect.stringMatching(/^sleep:/));
  });

  it('has nothing to offer when the day is already done', () => {
    const done = plans({ [TODAY]: [item({ status: 'completed' })] });
    expect(
      coachInterrupts(input({ plans: done, metrics: nights })).map((i) => i.id),
    ).not.toContainEqual(expect.stringMatching(/^sleep:/));
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
    // "Shall I say 20 late?" — the half that turns a reminder into help.
    // The app writes it; the OS sheet sends it.
    expect(found.answers[1].message).toBe(
      'Running about 20 minutes late — see you at 6:20pm.',
    );
    expect(found.answers[0].message).toBeUndefined();
  });

  it('is silent two hours out, and silent once it has started', () => {
    const family = (nowMinutes: number) =>
      coachInterrupts(input({ plans: dinner, nowMinutes })).filter((i) =>
        i.id.startsWith('family:'),
      );
    expect(family(16 * 60)).toEqual([]);
    expect(family(18 * 60)).toEqual([]);
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


/* ── Protocol suggestions ─────────────────────────────────────────────── */

/**
 * The library holds around two hundred graded practices and the app
 * essentially never offered one: you browsed them or you did not get them.
 * A suggestion is an interruption with a particular shape — here is a
 * practice, what it is for, the grade and the caution, one tap in and one
 * tap done.
 */
describe('suggesting a practice', () => {
  const running = routine({ id: 'r-running', area: 'health' });
  const suggest = (over = {}) =>
    coachInterrupts(input({ routines: [running], ...over })).find((i) =>
      i.id.startsWith('suggest:'),
    );

  it('offers one, from a coach, with the grade and the reasoning', () => {
    const found = suggest()!;
    expect(found).toBeDefined();
    const p = protocolById(found.id.replace('suggest:', ''))!;
    // The coach's line is short, and what the practice IS sits under it at
    // reading size — a two-clause summary at title size ran to six lines
    // of 32pt and swallowed the screen.
    expect(found.says).toBe(p.title);
    expect(found.detail).toBe(p.summary);
    expect(found.asks).toContain(`${p.durationMin} minutes`);
    expect(found.because).toContain(COACH_VOICES[found.pathId].name);
    // Whichever reason the practice actually stands on, and the matching
    // label — a letter on a balance practice would be the app grading
    // somebody's marriage. See ProtocolBasis.
    expect(found.because).toContain(isBalance(p) ? p.balance : p.why);
    expect(found.because).toContain(justification(p));
    expect(found.answers[0].effect).toEqual({ kind: 'protocol', protocolId: p.id });
    expect(found.answers[1].label).toBe('Not for me');
  });

  /**
   * An unprompted suggestion is a different act from a shelf somebody
   * chose to browse. A person who goes looking can read a D and decide;
   * a person being interrupted is being told this is worth their Tuesday.
   */
  it('never offers a D or an E unprompted', () => {
    const found = suggest()!;
    const p = protocolById(found.id.replace('suggest:', ''))!;
    // Either it clears the grade bar, or it is not making a research
    // claim at all — Isaac's correction, and the one case where a low
    // letter is not what the practice is saying about itself.
    expect(maySuggest(p)).toBe(true);
    if (!isBalance(p)) expect(SUGGESTION_GRADES).toContain(p.evidenceLevel);
    expect(SUGGESTION_GRADES).toEqual(['A', 'B', 'C']);
    expect(SUGGESTION_GRADES).not.toContain('D');
    expect(SUGGESTION_GRADES).not.toContain('E');
  });

  /**
   * The D and E that ARE claims stay out. The carve-out is for practices
   * that decline to make one, not for weak evidence wearing a new label.
   */
  it('still refuses a weak practice that is making an evidence claim', () => {
    const weak = PROTOCOLS.filter(
      (p) => !isBalance(p) && (p.evidenceLevel === 'D' || p.evidenceLevel === 'E'),
    );
    expect(weak.length).toBeGreaterThan(50);
    for (const p of weak) expect(maySuggest(p)).toBe(false);
  });

  /**
   * The line that was drawn at A and B until the library was counted: one
   * A/B practice in family, none in relationship. The coach with the
   * thinnest shelf would have been the coach that never spoke. Both
   * shelves need more graded practices, and until they have them this is
   * the check that the two smallest coaches can say something at all.
   *
   * Isaac later corrected the reading: they did not need more grades.
   * They needed practices that say plainly they are not evidence claims —
   * see ProtocolBasis — which is what now makes the enjoyment coach pass
   * this alongside the other four.
   */
  it('has something to say for every coach, including the thin shelves', () => {
    const areas: LifeArea[] = ['family', 'relationship', 'health', 'work', 'admin', 'enjoyment'];
    for (const area of areas) {
      const found = coachInterrupts(
        input({
          routines: [routine({ id: `r-${area}`, area })],
          profile: profile({ priorities: [area] }),
        }),
      ).find((i) => i.id.startsWith('suggest:'));
      expect(found).toBeDefined();
      expect(protocolById(found!.id.replace('suggest:', ''))!.area).toBe(area);
    }
  });

  it('carries the practice’s own caution where it has one, not behind a tap', () => {
    // Every suggestion with a safety line must surface it.
    for (let i = 0; i < 6; i++) {
      const found = suggest({
        seen: coachInterrupts(input({ routines: [running] }))
          .filter((x) => x.id.startsWith('suggest:'))
          .map((x) => ({ id: x.id, at: '2000-01-01T00:00:00.000Z' })),
      });
      if (!found) break;
      const p = protocolById(found.id.replace('suggest:', ''))!;
      expect(found.caveat).toBe(p.safety);
    }
  });

  it('stays inside the areas the person said matter', () => {
    const found = suggest()!;
    const p = protocolById(found.id.replace('suggest:', ''))!;
    // The fixture ranks family and health. A practice from an area they
    // did not rank would be the app deciding what their week is for.
    expect(['family', 'health']).toContain(p.area);
  });

  it('says nothing to somebody whose week is empty', () => {
    // They do not need a library pointed at them; they need a plan, and
    // every other trigger exists to help them get one.
    expect(coachInterrupts(input({ routines: [] })).some((i) => i.id.startsWith('suggest:'))).toBe(
      false,
    );
    expect(
      coachInterrupts(input({ routines: [routine({ active: false })] })).some((i) =>
        i.id.startsWith('suggest:'),
      ),
    ).toBe(false);
  });

  it('never offers something already on the plan', () => {
    const found = suggest()!;
    const id = found.id.replace('suggest:', '');
    const withIt = suggest({ routines: [running, routine({ id: 'r-have', protocolId: id })] });
    expect(withIt?.id).not.toBe(found.id);
  });

  it('is the quietest thing a coach can say', () => {
    // Anything actually wrong outranks it. A suggestion is what a coach
    // says when nothing is.
    const nights = [
      sleep(addDays(TODAY, -1), 5),
      sleep(addDays(TODAY, -2), 5),
      sleep(addDays(TODAY, -3), 5),
    ];
    const all = coachInterrupts(
      input({
        routines: [running],
        plans: plans({ [TODAY]: [item({ status: 'planned' })] }),
        metrics: nights,
      }),
    );
    expect(all[all.length - 1].id).toMatch(/^suggest:/);
  });

  it('waits a fortnight between suggestions, so it is not a feed', () => {
    const yesterday = { id: 'suggest:something', at: addDays(TODAY, -1) + 'T08:00:00.000Z' };
    expect(suggest({ seen: [yesterday] })).toBeUndefined();

    const longAgo = {
      id: 'suggest:something',
      at: addDays(TODAY, -(SUGGESTION_GAP_DAYS + 1)) + 'T08:00:00.000Z',
    };
    expect(suggest({ seen: [longAgo] })).toBeDefined();
    expect(SUGGESTION_GAP_DAYS).toBe(14);
  });

  it('goes through the gate, because saying yes is one more thing to do', () => {
    expect(suggest()!.adds).toBe(true);
    expect(
      nextInterrupt(input({ routines: [running], budget: SHUT }))?.id.startsWith('suggest:'),
    ).not.toBe(true);
  });
});


/**
 * The screen resolves an interruption by id, and Today records it the
 * moment it appears. A trigger that filters on its own history would then
 * refuse to produce the thing the screen had just been opened with — which
 * is what happened, and what only a browser found.
 */
describe('resolving one that has already been shown', () => {
  const running = routine({ id: 'r-running', area: 'health' });

  it('produces it again once its own record is set aside', () => {
    const first = coachInterrupts(input({ routines: [running] })).find((i) =>
      i.id.startsWith('suggest:'),
    )!;
    const log = [{ id: first.id, at: `${TODAY}T08:00:00.000Z` }];

    // With its own record in the log, the trigger declines — both the
    // per-practice filter and the fortnight gap say no.
    expect(
      coachInterrupts(input({ routines: [running], seen: log })).some((i) => i.id === first.id),
    ).toBe(false);

    // The screen passes everything except the one it is rendering.
    expect(
      coachInterrupts(input({ routines: [running], seen: log.filter((s) => s.id !== first.id) }))
        .some((i) => i.id === first.id),
    ).toBe(true);
  });
});

/**
 * Two coaches that could not speak.
 *
 * `PATH_AREA` puts training, nutrition and recovery on the same life area,
 * and `coachForArea` resolves that collision by excluding two of them.
 * Correct for its own job; wrong as the thing that decides who offers a
 * practice. The audit: of seven coaches, nutrition could never say
 * anything at all, and every food practice in the library was offered in
 * the training coach's voice. Recovery had exactly one way in.
 */
describe('which coach owns a practice', () => {
  const offerable = PROTOCOLS.filter(maySuggest);

  it('gives every coach something to say', () => {
    const counts = new Map<string, number>();
    for (const p of offerable) {
      const id = coachForProtocol(p);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const id of Object.keys(PATH_AREA)) {
      expect({ coach: id, offerable: counts.get(id) ?? 0 }).toEqual({
        coach: id,
        offerable: expect.any(Number),
      });
      expect(counts.get(id) ?? 0).toBeGreaterThan(0);
    }
  });

  it('sends the food practices to the food coach', () => {
    const food = offerable.filter((p) => p.pillar === 'nutrition');
    expect(food.length).toBeGreaterThan(20);
    for (const p of food) expect(coachForProtocol(p)).toBe('nutrition');
  });

  it('sends the sleep practices to the recovery coach', () => {
    const sleep = offerable.filter((p) => p.pillar === 'sleep');
    expect(sleep.length).toBeGreaterThan(10);
    for (const p of sleep) expect(coachForProtocol(p)).toBe('recovery');
  });

  it('still uses the life area for everything a pillar does not settle', () => {
    const connection = offerable.filter((p) => p.pillar === 'connection');
    for (const p of connection) {
      expect(coachForProtocol(p)).toBe(coachForArea(p.area));
    }
  });
});
