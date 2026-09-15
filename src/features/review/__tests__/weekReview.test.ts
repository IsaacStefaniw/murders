import {
  CELL_GLYPH,
  DAY_NAMES,
  MAX_PROPOSALS,
  NUDGE_MINUTES,
  SLOT_MIN_OBSERVATIONS,
  SPREAD_MIN_DAYS,
  cellSummary,
  deadSlots,
  hourLabel,
  nudgeCell,
  weekGrid,
  weekLead,
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

  /**
   * Dropping empty hours keeps the grid three rows instead of nineteen,
   * and closing them up silently makes the vertical axis lie: rows at 6am,
   * 7am and 10am drawn at equal spacing say the three hours between seven
   * and ten are the same distance as the one between six and seven.
   */
  it('reports the hours it skipped, so the screen can draw the gap', () => {
    const grid = weekGrid(
      plans({
        [DAY(0)]: [
          item({ start: '06:00' }),
          item({ start: '07:00' }),
          item({ start: '10:00' }),
          item({ start: '16:00' }),
        ],
      }),
      WEEK,
      DAY(6),
    );
    expect(grid.rows.map((r) => [r.label, r.gapBefore])).toEqual([
      ['6am', 0],
      ['7am', 0],
      ['10am', 2],
      ['4pm', 5],
    ]);
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

  /**
   * The grid above this line shows ONE week and the count comes from
   * three, so a bare "died twice" is a claim nobody can check against the
   * picture beside it.
   */
  it('leads with the slot, and names the window it counted over', () => {
    const [first] = build();
    expect(first.line).toBe('6am Tuesday — strength died twice in the last 3 weeks.');
  });

  it('says it plainly when every week in the window died', () => {
    const p = plans({
      [addDays(WEEK, -14)]: [item({ routineId: r.id, status: 'skipped' })],
      [addDays(WEEK, -7)]: [item({ routineId: r.id, status: 'skipped' })],
      [WEEK]: [item({ routineId: r.id, status: 'skipped' })],
    });
    const [first] = weekProposals({
      grid: weekGrid(p, WEEK, DAY(6)),
      plans: p,
      routines: [r],
      capacity: 'steady',
      today: DAY(6),
    });
    expect(first.line).toBe('6am Monday — strength died 3 weeks running.');
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

/* ── The finding, and the evidence for it ─────────────────────────────── */

/**
 * The screen used to open with the grid and bury the sentence the app had
 * already worked out below it — asking a person to do analysis the app had
 * done, then doing it for them further down where they may never reach.
 */
describe('what the week screen says first', () => {
  const r = routine();
  const twiceDead = plans({
    [addDays(DAY(1), -7)]: [item({ routineId: r.id, status: 'skipped' })],
    [DAY(1)]: [item({ routineId: r.id, status: 'skipped' })],
    [DAY(2)]: [item({ start: '10:00', status: 'completed', title: 'Walk' })],
  });
  const at = (p: Record<string, DailyPlan>) => {
    const grid = weekGrid(p, WEEK, DAY(6));
    return weekLead(
      grid,
      weekProposals({ grid, plans: p, routines: [r], capacity: 'steady', today: DAY(6) }),
    );
  };

  it('leads with the finding, not the grid and not a count', () => {
    const lead = at(twiceDead);
    expect(lead.headline).toBe('6am Tuesday — strength died twice in the last 3 weeks.');
    expect(lead.proposal?.actions.length).toBeGreaterThan(0);
  });

  it('keeps the count as context underneath, never as the headline', () => {
    const lead = at(twiceDead);
    expect(lead.under).toBe('1 of 2 things happened.');
    expect(lead.headline).not.toBe(lead.under);
    expect(lead.under).not.toMatch(/%/);
  });

  it('points the finding at the cells it was read off', () => {
    // Monday first, so Tuesday is column 1 and 6am is hour 6.
    expect(at(twiceDead).proposal?.focus).toEqual([{ col: 1, hour: 6 }]);
  });

  it('never leads with the capacity dial — it is a standing question', () => {
    const p = plans({ [DAY(0)]: [item({ status: 'completed' })] });
    const lead = at(p);
    expect(lead.proposal).toBeNull();
    expect(lead.rest.map((x) => x.id)).toContain('capacity');
  });

  it('says what an uneventful week actually means, rather than scoring it', () => {
    const p = plans({
      [DAY(0)]: [item({ status: 'completed' })],
      [DAY(1)]: [item({ start: '10:00', title: 'Walk', status: 'skipped' })],
    });
    expect(at(p).headline).toBe('Nothing went wrong twice in the same place.');
  });

  it('does not repeat itself on a week with nothing on', () => {
    const lead = at(plans({}));
    expect(lead.headline).toBe('Nothing was on this week.');
    expect(lead.under).toBe('');
  });

  it('hands everything it did not take to the rest, in order', () => {
    const lead = at(twiceDead);
    const all = weekProposals({
      grid: weekGrid(twiceDead, WEEK, DAY(6)),
      plans: twiceDead,
      routines: [r],
      capacity: 'steady',
      today: DAY(6),
    });
    expect([lead.proposal!, ...lead.rest].map((x) => x.id)).toEqual(all.map((x) => x.id));
  });
});

/**
 * A daily routine that is failing is ONE finding about an hour, not seven
 * near-identical ones about weekdays.
 *
 * The browser caught this the moment the finding became the headline:
 * "7am Monday — protein at breakfast died twice" in 28pt above a 7am row
 * holding seven crosses, with one of them ringed and Tuesday repeating
 * the same sentence underneath.
 */
describe('an hour that is failing all week', () => {
  const daily = routine({ id: 'r-protein', title: 'Protein at breakfast', days: [0, 1, 2, 3, 4, 5, 6] });

  /** Two weeks of a 7am routine dying on every day of the week. */
  const deadHour = () => {
    const out: Record<string, PlanItem[]> = {};
    for (let w = 1; w >= 0; w--) {
      for (let col = 0; col < 7; col++) {
        const date = addDays(WEEK, col - 7 * w);
        out[date] = [item({ id: `x-${date}`, routineId: daily.id, start: '07:00', status: 'skipped' })];
      }
    }
    // Something later that lived, so the week is not a total write-off.
    out[DAY(1)] = [...(out[DAY(1)] ?? []), item({ start: '10:00', title: 'Walk', status: 'completed' })];
    return plans(out);
  };

  const first = () => {
    const p = deadHour();
    return weekProposals({
      grid: weekGrid(p, WEEK, DAY(6)),
      plans: p,
      routines: [daily],
      capacity: 'steady',
      today: DAY(6),
    })[0];
  };

  it('names the hour rather than one of its seven days', () => {
    expect(first().line).toBe('7am is not working — protein at breakfast died every day it was on.');
  });

  it('rings every cell the finding was read off, not just one', () => {
    const focus = first().focus ?? [];
    expect(focus).toHaveLength(7);
    expect(focus.every((f) => f.hour === 7)).toBe(true);
    expect([...new Set(focus.map((f) => f.col))].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('does not then repeat itself for the next weekday down the page', () => {
    const p = deadHour();
    const all = weekProposals({
      grid: weekGrid(p, WEEK, DAY(6)),
      plans: p,
      routines: [daily],
      capacity: 'steady',
      today: DAY(6),
    });
    expect(all.filter((x) => x.line.includes('protein at breakfast'))).toHaveLength(1);
  });

  it('offers the same answers a single dead slot does', () => {
    expect(first().actions.map((a) => a.label)).toEqual(['Move to 8am', 'Drop it']);
  });

  it('keeps naming the weekday while only one or two days are involved', () => {
    // Below the spread threshold, "6am Tuesday" is the more useful sentence.
    expect(SPREAD_MIN_DAYS).toBeGreaterThan(2);
    const p = plans({
      [addDays(DAY(1), -7)]: [item({ routineId: daily.id, status: 'skipped' })],
      [DAY(1)]: [item({ routineId: daily.id, status: 'skipped' })],
    });
    const [only] = weekProposals({
      grid: weekGrid(p, WEEK, DAY(6)),
      plans: p,
      routines: [daily],
      capacity: 'steady',
      today: DAY(6),
    });
    expect(only.line).toContain('Tuesday');
  });
});

/**
 * The browser found the capacity dial printing "More than half of it went
 * untouched. Less this week?" above a lone `+ Normal`, to somebody already
 * in the lowest gear — the app proposing the one thing it could not do.
 */
describe('the capacity dial', () => {
  const emptyWeek = plans({
    [DAY(0)]: [item({ status: 'skipped' })],
    [DAY(1)]: [item({ start: '10:00', title: 'Walk', status: 'skipped' })],
  });

  const dial = (capacity: 'minimal' | 'steady') =>
    weekProposals({
      grid: weekGrid(emptyWeek, WEEK, DAY(6)),
      plans: emptyWeek,
      routines: [],
      capacity,
      today: DAY(6),
    }).find((x) => x.id === 'capacity')!;

  it('never asks for a gear that has no button', () => {
    const lowest = dial('minimal');
    expect(lowest.actions.every((a) => a.capacity !== 'minimal')).toBe(true);
    expect(lowest.line).not.toMatch(/Less/);
  });

  it('still asks to shed where shedding is possible', () => {
    expect(dial('steady').line).toMatch(/Less/);
  });
});
