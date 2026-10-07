/**
 * "Am I better than six weeks ago?"
 *
 * The screen this feeds answers the question the product exists to
 * answer, so the tests are mostly about not answering it wrongly:
 * never a score, never a grade, honest about not having enough history,
 * and no pretending a behaviour first logged last week fell from the sky.
 */

import {
  MOVED_FRACTION,
  WINDOW_DAYS,
  headlineFor,
  spellMinutes,
  thenAndNow,
  type Comparison,
} from '@/features/health/thenAndNow';
import { addDays } from '@/lib/dates';
import type { BehaviourEvent, BehaviourIntention, DailyPlan, PlanItem } from '@/types/domain';

const TODAY = '2026-10-07';

const item = (over: Partial<PlanItem> = {}): PlanItem =>
  ({
    id: over.id ?? 'i',
    title: 'A thing',
    start: '18:00',
    end: '18:30',
    status: 'planned',
    area: 'health',
    ...over,
  }) as PlanItem;

/** `n` days back from today, each carrying the given items. */
function span(fromBack: number, toBack: number, items: () => PlanItem[]): Record<string, DailyPlan> {
  const out: Record<string, DailyPlan> = {};
  for (let b = fromBack; b >= toBack; b -= 1) {
    const date = addDays(TODAY, -b);
    out[date] = { date, items: items().map((i, n) => ({ ...i, id: `${date}-${n}`, date })) } as DailyPlan;
  }
  return out;
}

const call = (
  plans: Record<string, DailyPlan>,
  behaviourEvents: BehaviourEvent[] = [],
  behaviourIntentions: BehaviourIntention[] = [],
) => thenAndNow({ plans, behaviourEvents, behaviourIntentions, today: TODAY });

/* ── Not enough yet ───────────────────────────────────────────────────── */

describe('when there is nothing to compare against', () => {
  it('says so, and says how much history there is', () => {
    // Three weeks in: the recent window is full and the earlier one empty.
    const r = call(span(20, 0, () => [item({ status: 'completed' })]));
    expect(r.rows).toEqual([]);
    expect(r.headline).toBeNull();
    expect(r.shortfall).toBe(
      '21 days of history so far. This compares three weeks against the three before, so it starts answering at six.',
    );
  });

  it('says something different on a brand new account', () => {
    const r = call({});
    expect(r.shortfall).toBe(
      'Nothing to compare yet. This fills in once there are a few weeks behind you.',
    );
  });

  it('gets the singular right for one day', () => {
    expect(call(span(0, 0, () => [item()])).shortfall).toContain('1 day of history so far');
  });

  it('does not count days in the future as history it has', () => {
    const plans = {
      ...span(0, 0, () => [item()]),
      [addDays(TODAY, 3)]: { date: addDays(TODAY, 3), items: [item()] } as DailyPlan,
    };
    expect(call(plans).shortfall).toContain('1 day of history so far');
  });
});

/* ── The comparison ───────────────────────────────────────────────────── */

describe('three weeks against the three before', () => {
  /** 2 done of 3 recently; 3 done of 3 before. 30 minutes each. */
  const sixWeeks = () => ({
    ...span(41, 21, () => [
      item({ status: 'completed' }),
      item({ status: 'completed' }),
      item({ status: 'completed' }),
    ]),
    ...span(20, 0, () => [
      item({ status: 'completed' }),
      item({ status: 'completed' }),
      item({ status: 'skipped' }),
    ]),
  });

  it('uses two windows that neither overlap nor leave a gap', () => {
    expect(WINDOW_DAYS).toBe(21);
    const r = call(sixWeeks());
    const done = r.rows.find((x) => x.key === 'done')!;
    // 21 days × 2 done, against 21 × 3.
    expect(done.now).toBe(42);
    expect(done.then).toBe(63);
  });

  it('counts a day as "something happened" only when something did', () => {
    const plans = {
      ...span(41, 21, () => [item({ status: 'completed' })]),
      ...span(20, 0, () => [item({ status: 'skipped' })]),
    };
    const days = call(plans).rows.find((x) => x.key === 'days')!;
    expect(days.now).toBe(0);
    expect(days.then).toBe(21);
  });

  it('counts the minutes of what was done, not of what was planned', () => {
    const plans = {
      ...span(41, 21, () => [item({ status: 'completed', start: '18:00', end: '19:00' })]),
      ...span(20, 0, () => [
        item({ status: 'completed', start: '18:00', end: '18:30' }),
        item({ status: 'skipped', start: '20:00', end: '22:00' }),
      ]),
    };
    const mins = call(plans).rows.find((x) => x.key === 'minutes')!;
    expect(mins.now).toBe(21 * 30);
    expect(mins.then).toBe(21 * 60);
  });

  it("leaves the person's own diary out of it", () => {
    // `fixed` items are their calendar, not something the app asked for —
    // the same rule the day and week reviews apply.
    const plans = {
      ...span(41, 21, () => [item({ status: 'completed' })]),
      ...span(20, 0, () => [
        item({ status: 'completed' }),
        item({ status: 'completed', fixed: true, start: '09:00', end: '17:00' }),
      ]),
    };
    const r = call(plans);
    expect(r.rows.find((x) => x.key === 'done')!.now).toBe(21);
    expect(r.rows.find((x) => x.key === 'minutes')!.now).toBe(21 * 30);
  });
});

/* ── Behaviours ───────────────────────────────────────────────────────── */

describe('the things they are cutting back on', () => {
  const intention = (over: Partial<BehaviourIntention> = {}): BehaviourIntention =>
    ({
      id: over.id ?? 'bi-1',
      behaviour: over.behaviour ?? 'alcohol',
      intentionText: 'Fewer drinks',
      active: true,
      createdAt: `${addDays(TODAY, -60)}T08:00:00.000Z`,
      ...over,
    }) as BehaviourIntention;

  const events = (intentionId: string, backs: number[]): BehaviourEvent[] =>
    backs.map((b, n) => ({
      id: `ev-${n}`,
      intentionId,
      occurredAt: `${addDays(TODAY, -b)}T21:00:00`,
    }));

  const plans = () => ({
    ...span(41, 21, () => [item({ status: 'completed' })]),
    ...span(20, 0, () => [item({ status: 'completed' })]),
  });

  it('compares the occasions in each window, fewer being the direction wanted', () => {
    const r = call(plans(), events('bi-1', [3, 5, 9, 25, 30, 33, 36]), [intention()]);
    const row = r.rows.find((x) => x.key === 'behaviour:alcohol')!;
    expect(row.now).toBe(3);
    expect(row.then).toBe(4);
    expect(row.wantMore).toBe(false);
  });

  it('stays out of it when the earlier window could not contain the logging', () => {
    // Started logging a fortnight ago. "Up from nothing" would be an
    // artefact of when the person started, not a thing that happened.
    const r = call(plans(), events('bi-1', [2, 4, 6]), [intention()]);
    expect(r.rows.some((x) => x.key.startsWith('behaviour:'))).toBe(false);
  });

  it('ignores a paused intention and another intention’s events', () => {
    const r = call(
      plans(),
      [...events('bi-1', [3, 30]), ...events('bi-other', [4, 31])],
      [intention({ active: false })],
    );
    expect(r.rows.some((x) => x.key.startsWith('behaviour:'))).toBe(false);
  });
});

/* ── The sentence ─────────────────────────────────────────────────────── */

describe('the headline', () => {
  const row = (over: Partial<Comparison>): Comparison => ({
    key: 'k',
    label: 'Things done',
    now: 10,
    then: 10,
    unit: 'count',
    wantMore: true,
    ...over,
  });

  it('names the row that moved most, with both figures', () => {
    expect(
      headlineFor([
        row({ key: 'done', now: 43, then: 45 }),
        row({ key: 'minutes', label: 'Time on them', unit: 'minutes', now: 1055, then: 1475 }),
      ]),
    ).toBe('Time on them is down: 17.6 hours, against 24.6 hours in the three weeks before.');
  });

  it('says plainly when nothing moved', () => {
    expect(headlineFor([row({ now: 18, then: 18 }), row({ key: 'b', now: 43, then: 45 })])).toBe(
      'The last three weeks look much like the three before.',
    );
  });

  it('holds its tongue below the threshold and speaks above it', () => {
    const justUnder = Math.floor(100 * (1 + MOVED_FRACTION)) - 1;
    expect(headlineFor([row({ now: justUnder, then: 100 })])).toBe(
      'The last three weeks look much like the three before.',
    );
    expect(headlineFor([row({ now: 100 + Math.ceil(100 * MOVED_FRACTION), then: 100 })])).toContain(
      'is up:',
    );
  });

  it('cannot divide by a window that held nothing', () => {
    expect(headlineFor([row({ now: 9, then: 0 })])).toBe(
      'The last three weeks look much like the three before.',
    );
  });

  it('has nothing to say about no rows', () => {
    expect(headlineFor([])).toBeNull();
  });
});

describe('minutes, spelled', () => {
  it('stays in minutes below an hour and a half', () => {
    expect(spellMinutes(0)).toBe('0 minutes');
    expect(spellMinutes(89)).toBe('89 minutes');
  });

  it('becomes hours, to one decimal', () => {
    expect(spellMinutes(90)).toBe('1.5 hours');
    expect(spellMinutes(1055)).toBe('17.6 hours');
    expect(spellMinutes(1475)).toBe('24.6 hours');
  });
});

/* ── The house rules ──────────────────────────────────────────────────── */

describe('the house rules', () => {
  it('never scores, grades, or counts a streak', () => {
    const banned = /%|score|grade|streak|better|worse|well done|keep it up|failed|only/i;
    const lines: string[] = [];
    // Across the shapes this can produce: moved up, moved down, flat,
    // not enough history, nothing at all.
    for (const rows of [
      [],
      [{ key: 'a', label: 'Things done', now: 10, then: 10, unit: 'count' as const, wantMore: true }],
      [{ key: 'a', label: 'Things done', now: 50, then: 10, unit: 'count' as const, wantMore: true }],
      [{ key: 'a', label: 'Time on them', now: 10, then: 900, unit: 'minutes' as const, wantMore: true }],
      [{ key: 'a', label: 'Alcohol', now: 2, then: 9, unit: 'count' as const, wantMore: false }],
    ]) {
      const h = headlineFor(rows);
      if (h) lines.push(h);
    }
    lines.push(call({}).shortfall!);
    lines.push(call(span(20, 0, () => [item({ status: 'completed' })])).shortfall!);
    for (const line of lines) {
      expect(line).not.toMatch(banned);
      expect(line.endsWith('.')).toBe(true);
      expect(line).not.toMatch(/undefined|NaN|\s{2,}/);
    }
  });

  it('reports a fall in drinking as down, without praising it', () => {
    const h = headlineFor([
      { key: 'a', label: 'Alcohol', now: 2, then: 9, unit: 'count', wantMore: false },
    ])!;
    expect(h).toBe('Alcohol is down: 2, against 9 in the three weeks before.');
  });
});
