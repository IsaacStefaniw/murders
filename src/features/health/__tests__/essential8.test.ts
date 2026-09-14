/**
 * "Can we have a health wellbeing score based on items logged for the week
 * vs unhealthy habits that provide some form of overall health tracker?"
 *
 * These pin two separate things. The first is arithmetic: the published
 * Life's Essential 8 thresholds, which are not ours to round off. The
 * second is the set of honesty constraints that made the score shippable
 * at all — four of eight components, never called a Life's Essential 8
 * score, alcohol beside it rather than inside it, and nothing anywhere
 * that subtracts.
 */

import {
  ALCOHOL_GUIDELINE,
  CATEGORY_CUTOFFS,
  activityMinutes,
  activityScore,
  alcoholWeek,
  bmiScore,
  countsAsActivity,
  nicotineFromLogs,
  nicotineScore,
  sleepScore,
  weekHealth,
  type WeekInputs,
} from '@/features/health/essential8';
import type {
  BehaviourEvent,
  BehaviourIntention,
  DailyPlan,
  PlanItem,
  Routine,
} from '@/types/domain';

const TODAY = '2026-09-14';

function item(over: Partial<PlanItem>): PlanItem {
  return {
    id: over.id ?? Math.random().toString(36).slice(2),
    date: TODAY,
    start: '07:00',
    end: '08:00',
    title: 'Session',
    area: 'health',
    tier: 'core',
    status: 'completed',
    fixed: false,
    ...over,
  } as PlanItem;
}

function plansOf(...items: PlanItem[]): Record<string, DailyPlan> {
  const out: Record<string, DailyPlan> = {};
  for (const i of items) {
    out[i.date] = out[i.date] ?? { date: i.date, items: [] };
    out[i.date].items.push(i);
  }
  return out;
}

function routine(id: string, protocolId?: string): Routine {
  return { id, title: id, area: 'health', protocolId, days: [], durationMin: 30 } as unknown as Routine;
}

function intention(id: string, behaviour: BehaviourIntention['behaviour']): BehaviourIntention {
  return { id, behaviour, intentionText: '', createdAt: TODAY, active: true };
}

function event(intentionId: string, date: string): BehaviourEvent {
  return { id: `${intentionId}-${date}-${Math.random()}`, intentionId, occurredAt: `${date}T20:00:00.000Z` };
}

/* ── The published tables ─────────────────────────────────────────────── */

describe('the AHA scoring tables', () => {
  it('scores activity on the published minute bands', () => {
    expect(activityScore(0)).toBe(0);
    expect(activityScore(1)).toBe(20);
    expect(activityScore(29)).toBe(20);
    expect(activityScore(30)).toBe(40);
    expect(activityScore(60)).toBe(60);
    expect(activityScore(90)).toBe(80);
    expect(activityScore(120)).toBe(90);
    expect(activityScore(150)).toBe(100);
    expect(activityScore(600)).toBe(100);
  });

  it('scores nicotine by status, not by count', () => {
    expect(nicotineScore('never')).toBe(100);
    expect(nicotineScore('quit5y')).toBe(75);
    expect(nicotineScore('quit1to5y')).toBe(50);
    expect(nicotineScore('inhaledNicotine')).toBe(25);
    expect(nicotineScore('smokesNow')).toBe(0);
  });

  it('costs points at BOTH ends of the sleep window', () => {
    expect(sleepScore(7)).toBe(100);
    expect(sleepScore(8.5)).toBe(100);
    // More is not better: nine hours is already off full marks, ten is 40.
    expect(sleepScore(9)).toBe(90);
    expect(sleepScore(10)).toBe(40);
    expect(sleepScore(12)).toBe(40);
    expect(sleepScore(6.5)).toBe(70);
    expect(sleepScore(5)).toBe(40);
    expect(sleepScore(4)).toBe(20);
    expect(sleepScore(3.5)).toBe(0);
  });

  it('scores BMI on the published cut points', () => {
    expect(bmiScore(22)).toBe(100);
    expect(bmiScore(24.9)).toBe(100);
    expect(bmiScore(25)).toBe(70);
    expect(bmiScore(30)).toBe(30);
    expect(bmiScore(35)).toBe(15);
    expect(bmiScore(40)).toBe(0);
  });

  it('uses the published category cutoffs', () => {
    expect(CATEGORY_CUTOFFS).toEqual({ intermediate: 50, high: 75 });
  });
});

/* ── Reading activity out of the plan ─────────────────────────────────── */

describe('what counts as activity', () => {
  const routines = [
    routine('r-mobility', 'mobility-10'),
    routine('r-sauna', 'sauna-recovery-low-heat'),
    routine('r-walk', 'daily-walk'),
    routine('r-none'),
  ];

  it('counts a gym session', () => {
    expect(countsAsActivity({ sessionType: 'workout' }, routines)).toBe(true);
  });

  it('counts a training-pillar practice that is real effort', () => {
    expect(countsAsActivity({ routineId: 'r-walk' }, routines)).toBe(true);
  });

  it('does not count mobility, sauna or a warm-up as activity', () => {
    // The whole reason this function exists: these are health-area blocks
    // and none of them is moderate-to-vigorous physical activity.
    expect(countsAsActivity({ routineId: 'r-mobility' }, routines)).toBe(false);
    expect(countsAsActivity({ routineId: 'r-sauna' }, routines)).toBe(false);
  });

  it('does not count a health block with nothing linking it to training', () => {
    expect(countsAsActivity({ routineId: 'r-none' }, routines)).toBe(false);
    expect(countsAsActivity({}, routines)).toBe(false);
  });

  it('sums only completed minutes inside the seven-day window', () => {
    const plans = plansOf(
      item({ date: '2026-09-14', start: '07:00', end: '08:00', sessionType: 'workout' }),
      item({ date: '2026-09-12', start: '07:00', end: '07:45', sessionType: 'workout' }),
      // Skipped: not completed.
      item({ date: '2026-09-11', start: '07:00', end: '09:00', sessionType: 'workout', status: 'skipped' }),
      // Skipped: outside the window.
      item({ date: '2026-09-01', start: '07:00', end: '09:00', sessionType: 'workout' }),
      // Skipped: health area, but mobility.
      item({ date: '2026-09-13', start: '07:00', end: '08:00', routineId: 'r-mobility' }),
    );
    expect(activityMinutes(plans, routines, TODAY)).toBe(105);
  });
});

/* ── Nicotine, and the thing the logs cannot tell us ──────────────────── */

describe('nicotine from what the app can see', () => {
  const ints = [intention('i-vape', 'vaping'), intention('i-smoke', 'smoking')];

  it('reads a logged vape as an inhaled nicotine product, not as zero', () => {
    const status = nicotineFromLogs(ints, [event('i-vape', '2026-09-11')], TODAY);
    expect(status).toBe('inhaledNicotine');
    expect(nicotineScore(status!)).toBe(25);
  });

  it('reads smoking ahead of vaping when both were logged', () => {
    const events = [event('i-vape', '2026-09-11'), event('i-smoke', '2026-09-12')];
    expect(nicotineFromLogs(ints, events, TODAY)).toBe('smokesNow');
  });

  it('returns unknown rather than guessing "never" from silence', () => {
    // A hundred points sit between never-smoked and quit-last-year, and an
    // empty log looks identical for both. Guessing would hand somebody a
    // number they did not earn.
    expect(nicotineFromLogs(ints, [], TODAY)).toBeNull();
    expect(nicotineFromLogs([], [], TODAY)).toBeNull();
  });

  it('ignores events older than the window', () => {
    expect(nicotineFromLogs(ints, [event('i-vape', '2026-07-01')], TODAY)).toBeNull();
  });
});

/* ── The composite, and every claim made about it ─────────────────────── */

function week(over: Partial<WeekInputs> = {}): WeekInputs {
  return {
    plans: {},
    routines: [],
    metrics: [],
    intentions: [],
    events: [],
    today: TODAY,
    ...over,
  };
}

describe('the week composite', () => {
  it('averages only the components it actually observed', () => {
    const out = weekHealth(week({
      plans: plansOf(item({ start: '07:00', end: '09:30', sessionType: 'workout' })),
      nicotine: 'never',
    }));
    // 150 minutes = 100, never smoked = 100. Sleep and BMI unobserved.
    expect(out.observed.map((c) => c.key)).toEqual(['activity', 'nicotine']);
    expect(out.composite).toBe(100);
  });

  it('never presents itself as a Life’s Essential 8 score', () => {
    // 30 minutes = 40, never smoked = 100, mean 70 — and the headline says
    // out loud that it is two of eight, because half the construct missing
    // is half the construct missing.
    const out = weekHealth(week({
      plans: plansOf(item({ start: '07:00', end: '07:30', sessionType: 'workout' })),
      nicotine: 'never',
    }));
    expect(out.headline).toBe('70 across the 2 of 8 we can see');
    expect(out.headline).not.toMatch(/Essential/i);
  });

  it('holds activity back rather than scoring an unwatched week as a zero', () => {
    // The difference between "watched you do nothing" and "watched nothing".
    const unwatched = weekHealth(week({ nicotine: 'never' }));
    const activity = unwatched.components.find((c) => c.key === 'activity');
    expect(activity?.score).toBeNull();
    expect(activity?.blocked).toBeTruthy();

    // A week that was planned and then skipped IS a real zero.
    const skipped = weekHealth(week({
      plans: plansOf(item({ sessionType: 'workout', status: 'skipped' })),
      nicotine: 'never',
    }));
    expect(skipped.components.find((c) => c.key === 'activity')?.score).toBe(0);
  });

  it('still carries all eight components, with a reason for each blank', () => {
    const out = weekHealth(week());
    expect(out.components).toHaveLength(8);
    for (const c of out.components) {
      if (c.score === null) expect(c.blocked).toBeTruthy();
      expect(c.why.length).toBeGreaterThan(40);
    }
  });

  it('names the blood measures as missing rather than passing over them', () => {
    const out = weekHealth(week());
    const blood = out.components.filter((c) =>
      ['lipids', 'glucose', 'bloodPressure'].includes(c.key),
    );
    expect(blood).toHaveLength(3);
    expect(blood.every((c) => c.score === null && c.blocked)).toBe(true);
  });

  it('bands on the published cutoffs', () => {
    // Activity only: 150 min = 100 = high.
    const high = weekHealth(week({
      plans: plansOf(item({ start: '07:00', end: '09:30', sessionType: 'workout' })),
    }));
    expect(high.band).toBe('high');

    // Activity only: 60 min = 60 = intermediate.
    const mid = weekHealth(week({
      plans: plansOf(item({ start: '07:00', end: '08:00', sessionType: 'workout' })),
    }));
    expect(mid.band).toBe('intermediate');

    // Activity only: 30 min = 40 = low.
    const low = weekHealth(week({
      plans: plansOf(item({ start: '07:00', end: '07:30', sessionType: 'workout' })),
    }));
    expect(low.band).toBe('low');
  });

  it('says nothing observed rather than scoring an empty week as zero', () => {
    // An empty week is not a bad week; it is an unmeasured one, and a zero
    // would be the app inventing a failure.
    const out = weekHealth(week());
    expect(out.composite).toBeNull();
    expect(out.band).toBeNull();
    expect(out.headline).toBe('Nothing observed yet');
  });

  it('points at the observed component with the most published room', () => {
    const out = weekHealth(week({
      plans: plansOf(item({ start: '07:00', end: '09:30', sessionType: 'workout' })),
      nicotine: 'inhaledNicotine',
    }));
    expect(out.biggestGap?.key).toBe('nicotine');
  });

  it('reads BMI from height and weight, and sleep from the week’s nights', () => {
    const out = weekHealth(week({
      metrics: [
        { id: 'h', key: 'body.height', value: 180, at: '2026-01-01T00:00:00.000Z', source: 'user' },
        { id: 'w', key: 'body.weight', value: 88, at: '2026-09-13T00:00:00.000Z', source: 'user' },
        { id: 's1', key: 'sleep.hours', value: 7, at: '2026-09-13T00:00:00.000Z', source: 'healthkit' },
        { id: 's2', key: 'sleep.hours', value: 8, at: '2026-09-12T00:00:00.000Z', source: 'healthkit' },
      ],
    }));
    // 88 / 1.8^2 = 27.2 → 70.
    expect(out.components.find((c) => c.key === 'bmi')?.score).toBe(70);
    // Mean 7.5 hours → 100.
    expect(out.components.find((c) => c.key === 'sleep')?.score).toBe(100);
  });

  it('takes the latest weight, not the first', () => {
    const out = weekHealth(week({
      metrics: [
        { id: 'h', key: 'body.height', value: 180, at: '2026-01-01T00:00:00.000Z', source: 'user' },
        { id: 'w1', key: 'body.weight', value: 130, at: '2026-01-01T00:00:00.000Z', source: 'user' },
        { id: 'w2', key: 'body.weight', value: 88, at: '2026-09-13T00:00:00.000Z', source: 'user' },
      ],
    }));
    expect(out.components.find((c) => c.key === 'bmi')?.score).toBe(70);
  });

  it('lets a stated status beat what the logs inferred', () => {
    const out = weekHealth(week({
      intentions: [intention('i-vape', 'vaping')],
      events: [event('i-vape', '2026-09-12')],
      nicotine: 'quit5y',
    }));
    expect(out.components.find((c) => c.key === 'nicotine')?.score).toBe(75);
  });

  it('never lets a component go below the published floor of zero', () => {
    // Nothing in here subtracts. The worst any component can do is score
    // what its own table says, and a heavy week cannot drag the others down.
    const out = weekHealth(week({
      plans: plansOf(item({ start: '07:00', end: '09:30', sessionType: 'workout' })),
      intentions: [intention('i-drink', 'alcohol'), intention('i-smoke', 'smoking')],
      events: [
        event('i-drink', '2026-09-11'),
        event('i-drink', '2026-09-12'),
        event('i-drink', '2026-09-13'),
        event('i-smoke', '2026-09-12'),
      ],
    }));
    expect(out.components.find((c) => c.key === 'activity')?.score).toBe(100);
    for (const c of out.observed) expect(c.score).toBeGreaterThanOrEqual(0);
  });
});

/* ── Alcohol: beside the score, never inside it ───────────────────────── */

describe('alcohol', () => {
  const ints = [intention('i-drink', 'alcohol')];

  it('quotes the Australian guideline', () => {
    expect(ALCOHOL_GUIDELINE).toEqual({ perWeek: 10, perDay: 4 });
  });

  it('never appears as a component of the score', () => {
    const out = weekHealth(week({
      intentions: ints,
      events: [event('i-drink', '2026-09-12'), event('i-drink', '2026-09-13')],
      nicotine: 'never',
    }));
    expect(out.components.map((c) => c.key)).not.toContain('alcohol');
    // Two heavy nights and the composite is untouched: only nicotine is
    // observed, and it still scores 100.
    expect(out.composite).toBe(100);
  });

  it('counts occasions and days, and says it is counting occasions', () => {
    const out = alcoholWeek(ints, [
      event('i-drink', '2026-09-11'),
      event('i-drink', '2026-09-12'),
      event('i-drink', '2026-09-12'),
    ], TODAY);
    expect(out?.events).toBe(3);
    expect(out?.heaviestDay).toBe(2);
    expect(out?.line).toMatch(/counts occasions rather than drinks/);
  });

  it('is silent for somebody not working on drinking', () => {
    expect(alcoholWeek([], [], TODAY)).toBeNull();
  });

  it('says so plainly when a week had none', () => {
    const out = alcoholWeek(ints, [], TODAY);
    expect(out?.events).toBe(0);
    expect(out?.line).toBe('No drinking occasions logged this week.');
  });

  it('ignores occasions outside the week', () => {
    const out = alcoholWeek(ints, [event('i-drink', '2026-09-01')], TODAY);
    expect(out?.events).toBe(0);
  });
});
