import {
  CELL_GLYPH,
  DAY_NAMES,
  MAX_PROPOSALS,
  NUDGE_MINUTES,
  SLOT_MIN_OBSERVATIONS,
  cellSummary,
  deadSlots,
  hourLabel,
  nudgeCell,
  weekGrid,
  weekProposals,
  weekRangeLabel,
} from '@/features/review/weekReview';
import { addDays } from '@/lib/dates';
import type { DailyPlan, PlanItem, Routine } from '@/types/domain';

/**
 * The end of the week, as a grid.
 *
 * The thing under test is whether a person can see the SHAPE of the week —
 * that everything at 6am died and everything at 10am lived — and whether
 * the proposals underneath come from that evidence rather than from a
 * template.
 */

// A Monday.
const WEEK = '2026-09-07';
const DAY = (i: number) => addDays(WEEK, i);

function item(over: Partial<PlanItem> = {}): PlanItem {
  return {
    id: over.id ?? `pi-${Math.random()}`,
    date: WEEK,
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

/* ── The grid ─────────────────────────────────────────────────────────── */

describe('the grid', () => {
  it('buckets the week by the hour things start in, Monday first', () => {
    const grid = weekGrid(
      plans({
        [DAY(0)]: [item({ start: '06:00', status: 'completed' })],
        [DAY(1)]: [item({ start: '06:30', status: 'skipped' })],
        [DAY(5)]: [item({ start: '10:15', status: 'completed' })],
      }),
      WEEK,
      DAY(6),
    );

    expect(grid.rows.map((r) => r.label)).toEqual(['6am', '10am']);
    expect(grid.rows[0].cells.map((c) => c.mark)).toEqual([
      'did',
      'didnt',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
    ]);
    expect(grid.rows[1].cells[5].mark).toBe('did');
  });

  it('drops the hours the week never used, rather than ruling nineteen empty rows', () => {
    const grid = weekGrid(
      plans({ [DAY(0)]: [item({ start: '05:00' })], [DAY(0) + '']: [item({ start: '21:00' })] }),
      WEEK,
      DAY(6),
    );
    expect(grid.rows).toHaveLength(1);
  });

  it('counts an untouched item as a miss, because the week is over', () => {
    const grid = weekGrid(
      plans({ [DAY(0)]: [item({ status: 'planned' })] }),
      WEEK,
      DAY(6),
    );
    expect(grid.rows[0].cells[0].mark).toBe('didnt');
  });

  it('separates a day that has not arrived from a day with nothing on it', () => {
    // Reviewing on the Thursday: Friday is still ahead.
    const grid = weekGrid(
      plans({ [DAY(4)]: [item({ status: 'planned' })] }),
      WEEK,
      DAY(3),
    );
    expect(grid.rows[0].cells[4].mark).toBe('ahead');
    expect(grid.rows[0].cells[6].mark).toBe('empty');
    expect(CELL_GLYPH.ahead).not.toBe(CELL_GLYPH.empty);
  });

  it('marks a cell holding one done and one missed as mixed, not as done', () => {
    const grid = weekGrid(
      plans({
        [DAY(0)]: [
          item({ start: '06:00', status: 'completed' }),
          item({ start: '06:40', status: 'skipped', title: 'Walk' }),
        ],
      }),
      WEEK,
      DAY(6),
    );
    expect(grid.rows[0].cells[0].mark).toBe('mixed');
  });

  it('ignores the work block and the diary, exactly as the day review does', () => {
    const grid = weekGrid(
      plans({
        [DAY(0)]: [
          item({ title: 'Work', start: '09:00' }),
          item({ title: 'Dentist', start: '11:00', fixed: true }),
        ],
      }),
      WEEK,
      DAY(6),
    );
    expect(grid.rows).toHaveLength(0);
    expect(grid.total).toBe(0);
  });

  it('reports a count and never a rate', () => {
    const grid = weekGrid(
      plans({
        [DAY(0)]: [item({ status: 'completed' }), item({ start: '10:00', status: 'skipped' })],
      }),
      WEEK,
      DAY(6),
    );
    expect(grid.line).toBe('1 of 2 things happened.');
    expect(grid.line).not.toMatch(/%|streak|score/i);
  });

  it('keeps a day that has not arrived out of the count', () => {
    // Reviewed on the Thursday. The Saturday is still to come, so it is
    // not one of the things that failed to happen.
    const grid = weekGrid(
      plans({
        [DAY(0)]: [item({ status: 'completed' })],
        [DAY(1)]: [item({ status: 'skipped' })],
        [DAY(5)]: [item({ status: 'planned' })],
      }),
      WEEK,
      DAY(3),
    );
    expect(grid.line).toBe('1 of 2 things happened.');
  });

  it('says so plainly when the week held nothing', () => {
    expect(weekGrid({}, WEEK, DAY(6)).line).toBe('Nothing was on this week.');
  });
});

describe('the labels', () => {
  it('reads hours the way the sketch does', () => {
    expect([0, 6, 11, 12, 13, 23].map(hourLabel)).toEqual([
      '12am',
      '6am',
      '11am',
      '12pm',
      '1pm',
      '11pm',
    ]);
  });

  it('names the week, and keeps both months when it straddles two', () => {
    expect(weekRangeLabel('2026-09-07')).toBe('7–13 Sep');
    expect(weekRangeLabel('2026-09-28')).toBe('28 Sep – 4 Oct');
  });
});

/* ── Dead slots ───────────────────────────────────────────────────────── */

describe('dead slots', () => {
  const r = routine();

  it('will not call one bad Tuesday a pattern', () => {
    const found = deadSlots(
      plans({ [DAY(1)]: [item({ routineId: r.id, status: 'skipped' })] }),
      WEEK,
      [r],
      DAY(6),
    );
    expect(found).toHaveLength(0);
    expect(SLOT_MIN_OBSERVATIONS).toBe(2);
  });

  it('names the routine, the weekday and the hour once it has died twice', () => {
    const found = deadSlots(
      plans({
        [addDays(DAY(1), -7)]: [item({ routineId: r.id, status: 'skipped' })],
        [DAY(1)]: [item({ routineId: r.id, status: 'skipped' })],
      }),
      WEEK,
      [r],
      DAY(6),
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ col: 1, hour: 6, seen: 2 });
    expect(DAY_NAMES[found[0].col]).toBe('Tuesday');
  });

  it('clears the slot when the most recent week finally held it', () => {
    const found = deadSlots(
      plans({
        [addDays(DAY(1), -14)]: [item({ routineId: r.id, status: 'skipped' })],
        [addDays(DAY(1), -7)]: [item({ routineId: r.id, status: 'skipped' })],
        [DAY(1)]: [item({ routineId: r.id, status: 'completed' })],
      }),
      WEEK,
      [r],
      DAY(6),
    );
    expect(found).toHaveLength(0);
  });

  it('counts an untouched item as a death — the drowning person never taps skip', () => {
    const found = deadSlots(
      plans({
        [addDays(DAY(1), -7)]: [item({ routineId: r.id, status: 'planned' })],
        [DAY(1)]: [item({ routineId: r.id, status: 'planned' })],
      }),
      WEEK,
      [r],
      DAY(6),
    );
    expect(found).toHaveLength(1);
  });

  it('does not count a day that has not arrived as a death', () => {
    // Two real Saturdays and one still to come is two sightings, not three.
    const found = deadSlots(
      plans({
        [addDays(DAY(5), -14)]: [item({ routineId: r.id, status: 'skipped' })],
        [addDays(DAY(5), -7)]: [item({ routineId: r.id, status: 'skipped' })],
        [DAY(5)]: [item({ routineId: r.id, status: 'planned' })],
      }),
      WEEK,
      [r],
      DAY(3),
    );
    expect(found[0].seen).toBe(2);
  });

  it('ignores a routine that has since been rested', () => {
    const rested = routine({ active: false });
    const found = deadSlots(
      plans({
        [addDays(DAY(1), -7)]: [item({ routineId: rested.id, status: 'skipped' })],
        [DAY(1)]: [item({ routineId: rested.id, status: 'skipped' })],
      }),
      WEEK,
      [rested],
      DAY(6),
    );
    expect(found).toHaveLength(0);
  });
});

/* ── What changes next week ───────────────────────────────────────────── */

describe('what changes next week', () => {
  const r = routine();

  const twiceDead = plans({
    [addDays(DAY(1), -7)]: [item({ routineId: r.id, status: 'skipped' })],
    [DAY(1)]: [item({ routineId: r.id, status: 'skipped' })],
    [DAY(2)]: [item({ start: '10:00', status: 'completed', title: 'Walk' })],
  });

  const build = (p: Record<string, DailyPlan> = twiceDead) =>
    weekProposals({
      grid: weekGrid(p, WEEK, DAY(6)),
      plans: p,
      routines: [r],
      capacity: 'steady',
      today: DAY(6),
    });

  it('leads with the slot, in the person’s own words', () => {
    const [first] = build();
    expect(first.line).toBe('6am Tuesday — strength died twice.');
  });

  it('offers the two answers that exist: move it, or stop pretending', () => {
    const [first] = build();
    expect(first.actions.map((a) => a.label)).toEqual(['Move to 7am', 'Drop it']);
    expect(first.actions[0].changes?.[0]).toMatchObject({
      kind: 'move_routine',
      payload: { preferredStart: '07:00', preferredEnd: '08:00' },
    });
    expect(first.actions[1].changes?.[0].kind).toBe('deactivate_routine');
  });

  it('moves to where the completions actually are, when they agree', () => {
    const p = plans({
      [addDays(DAY(1), -7)]: [item({ routineId: r.id, status: 'skipped' })],
      [DAY(1)]: [item({ routineId: r.id, status: 'skipped' })],
      [DAY(2)]: [item({ routineId: r.id, start: '17:00', status: 'completed' })],
      [DAY(3)]: [item({ routineId: r.id, start: '17:00', status: 'completed' })],
    });
    const [first] = weekProposals({
      grid: weekGrid(p, WEEK, DAY(6)),
      plans: p,
      routines: [r],
      capacity: 'steady',
      today: DAY(6),
    });
    expect(first.actions[0].label).toBe('Move to 5pm');
  });

  it('never offers to drop the last routine holding up a connection area', () => {
    const dinner = routine({ id: 'r-dinner', title: 'Family dinner', area: 'family' });
    const p = plans({
      [addDays(DAY(1), -7)]: [item({ routineId: dinner.id, status: 'skipped' })],
      [DAY(1)]: [item({ routineId: dinner.id, status: 'skipped' })],
    });
    const [first] = weekProposals({
      grid: weekGrid(p, WEEK, DAY(6)),
      plans: p,
      routines: [dinner],
      capacity: 'steady',
      today: DAY(6),
    });
    expect(first.actions.map((a) => a.label)).toEqual(['Move to 7am']);
  });

  it('ends with the capacity dial, always, as a direct control', () => {
    const last = build().at(-1)!;
    expect(last.id).toBe('capacity');
    expect(last.actions.map((a) => a.capacity)).toEqual(['minimal', 'push']);
  });

  it('will not offer a gear that does not exist', () => {
    const p = plans({ [DAY(0)]: [item({ status: 'completed' })] });
    const at = (capacity: 'minimal' | 'push') =>
      weekProposals({ grid: weekGrid(p, WEEK, DAY(6)), plans: p, routines: [], capacity, today: DAY(6) })
        .at(-1)!
        .actions.map((a) => a.capacity);
    expect(at('minimal')).toEqual(['steady']);
    expect(at('push')).toEqual(['steady']);
  });

  it('reads the dial from the week rather than from a template', () => {
    const cleared = plans({
      [DAY(0)]: [item({ status: 'completed' }), item({ start: '10:00', status: 'completed' })],
    });
    const drowned = plans({
      [DAY(0)]: [item({ status: 'skipped' }), item({ start: '10:00', status: 'skipped' })],
    });
    const lineOf = (p: Record<string, DailyPlan>) =>
      weekProposals({ grid: weekGrid(p, WEEK, DAY(6)), plans: p, routines: [], capacity: 'steady', today: DAY(6) })
        .at(-1)!.line;
    expect(lineOf(cleared)).toBe('You cleared nearly all of it. Room for one more?');
    expect(lineOf(drowned)).toBe('More than half of it went untouched. Less next week?');
  });

  it('names the week the changes actually land on', () => {
    // On a Monday, "next week" is the week you are standing in — the app
    // must not point somebody at seven days further out than it means.
    const p = plans({ [DAY(0)]: [item({ status: 'skipped' }), item({ start: '10:00', status: 'skipped' })] });
    const dial = (forward: string) =>
      weekProposals({
        grid: weekGrid(p, WEEK, DAY(6)),
        plans: p,
        routines: [],
        capacity: 'steady',
        today: DAY(6),
        forward,
      }).at(-1)!.line;
    expect(dial('this week')).toBe('More than half of it went untouched. Less this week?');

    const quiet = plans({ [DAY(0)]: [item({ status: 'completed' }), item({ start: '10:00', status: 'skipped' })] });
    expect(
      weekProposals({
        grid: weekGrid(quiet, WEEK, DAY(6)),
        plans: quiet,
        routines: [],
        capacity: 'minimal',
        today: DAY(6),
        forward: 'this week',
      }).at(-1)!.line,
    ).toBe('Is this week the right size?');
  });

  it('never runs to more than the three the sketch draws', () => {
    expect(build().length).toBeLessThanOrEqual(MAX_PROPOSALS);
    expect(MAX_PROPOSALS).toBe(3);
  });
});

describe('the morning that is not happening', () => {
  const early = routine({ id: 'r-early', preferredStart: '06:00', preferredEnd: '07:00' });
  const late = routine({ id: 'r-late', title: 'Walk', preferredStart: '10:00', preferredEnd: '11:00' });

  const p = plans({
    [DAY(0)]: [
      item({ routineId: early.id, start: '06:00', status: 'skipped' }),
      item({ routineId: late.id, start: '10:00', title: 'Walk', status: 'completed' }),
    ],
    [DAY(2)]: [
      item({ routineId: early.id, start: '06:00', status: 'skipped' }),
      item({ routineId: late.id, start: '10:00', title: 'Walk', status: 'completed' }),
    ],
  });

  it('offers the shift only on the evidence that produces it', () => {
    const found = weekProposals({
      grid: weekGrid(p, WEEK, DAY(6)),
      plans: p,
      routines: [early, late],
      capacity: 'steady',
      today: DAY(6),
    });
    const shift = found.find((x) => x.id.startsWith('shift'));
    expect(shift?.line).toBe('Nothing before 7am happened, twice.');
    expect(shift?.actions[0].label).toBe(`Start ${NUDGE_MINUTES} min later`);
    // Only the early band moves. "Everything 30 min later" would drag the
    // 10am walk that is working into 10:30 for no reason.
    expect(shift?.actions[0].changes?.map((c) => c.routineId)).toEqual([early.id]);
    expect(shift?.actions[0].changes?.[0].payload?.preferredStart).toBe('06:30');
  });

  it('stays quiet in a week where nothing at all happened', () => {
    const nothing = plans({
      [DAY(0)]: [item({ routineId: early.id, status: 'skipped' })],
      [DAY(2)]: [item({ routineId: early.id, status: 'skipped' })],
    });
    const found = weekProposals({
      grid: weekGrid(nothing, WEEK, DAY(6)),
      plans: nothing,
      routines: [early],
      capacity: 'steady',
      today: DAY(6),
    });
    expect(found.some((x) => x.id.startsWith('shift'))).toBe(false);
  });

  it('does not count a morning that has not arrived yet', () => {
    // Reviewing on the Monday: Wednesday's 6am is still ahead, so there is
    // one sighting, not two.
    const found = weekProposals({
      grid: weekGrid(p, WEEK, DAY(0)),
      plans: p,
      routines: [early, late],
      capacity: 'steady',
      today: DAY(6),
    });
    expect(found.some((x) => x.id.startsWith('shift'))).toBe(false);
  });
});

/* ── Tap and move ─────────────────────────────────────────────────────── */

describe('tap and move', () => {
  const r = routine();

  it('moves the routine, not the Tuesday that is already over', () => {
    const grid = weekGrid(
      plans({ [DAY(1)]: [item({ routineId: r.id, status: 'skipped' })] }),
      WEEK,
      DAY(6),
    );
    const cell = grid.rows[0].cells[1];
    expect(nudgeCell(cell, [r], NUDGE_MINUTES)[0]).toMatchObject({
      kind: 'move_routine',
      routineId: r.id,
      payload: { preferredStart: '06:30' },
    });
    expect(nudgeCell(cell, [r], -NUDGE_MINUTES)[0].payload?.preferredStart).toBe('05:30');
  });

  it('has nothing to move where the cell is empty', () => {
    const grid = weekGrid(
      plans({ [DAY(1)]: [item({ routineId: r.id })] }),
      WEEK,
      DAY(6),
    );
    expect(nudgeCell(grid.rows[0].cells[0], [r], NUDGE_MINUTES)).toEqual([]);
    expect(cellSummary(grid.rows[0].cells[0])).toBeNull();
    expect(cellSummary(grid.rows[0].cells[1])).toBe('Strength');
  });

  it('will not push anything past midnight', () => {
    const late = routine({ preferredStart: '23:45', preferredEnd: '23:59' });
    const grid = weekGrid(
      plans({ [DAY(1)]: [item({ routineId: late.id, start: '23:45', end: '23:59' })] }),
      WEEK,
      DAY(6),
    );
    const [change] = nudgeCell(grid.rows[0].cells[1], [late], NUDGE_MINUTES);
    expect(change.payload?.preferredStart).toBe('23:30');
  });
});
