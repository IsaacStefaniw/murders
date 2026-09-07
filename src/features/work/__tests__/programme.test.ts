import { observe, type MetricObservation } from '@/features/model/metrics';
import {
  assessWork,
  buildExecutiveBlock,
  deepHoursTarget,
  retargetBlock,
  variantOf,
  weekOfBlock,
} from '@/features/work/programme';

const hours = (value: number, daysAgo: number): MetricObservation => ({
  ...observe('work.deepHours', value),
  at: new Date(Date.now() - daysAgo * 86400e3).toISOString(),
});

describe('the focus block', () => {
  it('a maker and a back-to-back manager get materially different weeks', () => {
    const maker = buildExecutiveBlock({ style: 'maker', meetingLoad: 'light' });
    const manager = buildExecutiveBlock({ style: 'manager', meetingLoad: 'heavy' });
    expect(maker.weeks[0].deepHoursTarget).toBeGreaterThan(manager.weeks[0].deepHoursTarget * 2);
    // Week 2's practice differs by role: one-on-ones vs a defended morning.
    expect(manager.weeks[1].practice.title).toContain('one-on-one');
    expect(maker.weeks[1].practice.title).toContain('meeting-free morning');
    // Same four-week arc for both.
    expect(maker.weeks.map((w) => w.theme)).toEqual([
      'Audit & protect',
      'The one lever',
      'Subtract',
      'Review & reset',
    ]);
  });

  it('every week differs between the manager and the maker variant, not only week 2', () => {
    const maker = buildExecutiveBlock({ style: 'maker' });
    const manager = buildExecutiveBlock({ style: 'manager' });
    for (let i = 0; i < 4; i++) {
      expect(maker.weeks[i].practice.title).not.toBe(manager.weeks[i].practice.title);
    }
    // A manager's week is about other people; a maker's about the calendar.
    expect(manager.weeks[2].practice.title).toMatch(/Hand one recurring thing over/);
    expect(maker.weeks[0].practice.title).toMatch(/Book the focus block/);
  });

  it('someone on their feet or on a roster gets the close-the-shift variant', () => {
    expect(variantOf({ style: 'physical' })).toBe('hands');
    expect(variantOf({ style: 'varies' })).toBe('hands');
    expect(variantOf({ style: 'mixed' })).toBe('manager');
    const nurse = buildExecutiveBlock({ style: 'varies' });
    expect(nurse.weeks[0].practice.title).toMatch(/next one’s first move/);
    expect(nurse.weeks[0].focus).not.toMatch(/calendar/);
  });

  it('"no two weeks are the same" gets a real number, never NaN', () => {
    // The intake offers this answer and the block's arithmetic had no
    // entry for it, so the hub read "the target for your week is ~NaN h".
    const target = deepHoursTarget({ style: 'varies' });
    expect(Number.isFinite(target)).toBe(true);
    expect(target).toBeGreaterThanOrEqual(2);
    expect(target).toBeLessThan(deepHoursTarget({ style: 'mixed' }));
    // An answer the block has never heard of is treated as mixed.
    expect(deepHoursTarget({ style: 'unknown' as never })).toBe(deepHoursTarget({ style: 'mixed' }));
  });

  it('"hardly any meetings" taxes nothing, and an unknown load is taken as half', () => {
    expect(deepHoursTarget({ style: 'maker', meetingLoad: 'none' })).toBe(12);
    expect(deepHoursTarget({ style: 'maker', meetingLoad: 'light' })).toBe(12);
    expect(deepHoursTarget({ style: 'maker', meetingLoad: 'weird' as never })).toBe(
      deepHoursTarget({ style: 'maker', meetingLoad: 'half' }),
    );
  });

  it('the bottleneck answer shapes week 2, and redline pressure trims the target honestly', () => {
    const sales = buildExecutiveBlock({ style: 'mixed', bottleneck: 'sales' });
    expect(sales.weeks[1].focus).toContain('sales');
    // A multi-answer bottleneck reads its first choice.
    const admin = buildExecutiveBlock({ style: 'mixed', bottleneck: 'admin,people' });
    expect(admin.weeks[1].focus).toMatch(/batches/);
    const calm = deepHoursTarget({ style: 'maker', meetingLoad: 'half' });
    const hot = deepHoursTarget({ style: 'maker', meetingLoad: 'half', pressure: 'redline' });
    expect(hot).toBeLessThan(calm);
  });

  it('every bottleneck the intake offers has a week-2 focus line', () => {
    for (const b of ['sales', 'delivery', 'focus', 'admin', 'people', 'direction', 'visibility']) {
      const block = buildExecutiveBlock({ style: 'mixed', bottleneck: b });
      expect(block.weeks[1].focus).not.toBe(buildExecutiveBlock({ style: 'mixed' }).weeks[1].focus);
    }
  });

  it('knows which week it is and when the block is over', () => {
    const block = buildExecutiveBlock({ style: 'mixed' });
    expect(weekOfBlock(block)).toBe(1);
    block.startedAt = new Date(Date.now() - 8 * 86400e3).toISOString();
    expect(weekOfBlock(block)).toBe(2);
    block.startedAt = new Date(Date.now() - 29 * 86400e3).toISOString();
    expect(weekOfBlock(block)).toBeNull();
  });
});

describe('retargetBlock — a later answer changes the target without restarting the block', () => {
  it('keeps the start date and the week, recomputes the targets', () => {
    const block = buildExecutiveBlock({ style: 'maker', meetingLoad: 'light' });
    block.startedAt = new Date(Date.now() - 10 * 86400e3).toISOString();
    const heavy = retargetBlock(block, { style: 'maker', meetingLoad: 'heavy' });
    expect(heavy.startedAt).toBe(block.startedAt);
    expect(weekOfBlock(heavy)).toBe(2);
    expect(heavy.weeks[0].deepHoursTarget).toBeLessThan(block.weeks[0].deepHoursTarget);
    expect(heavy.inputs.meetingLoad).toBe('heavy');
  });

  it('returns the same block when nothing that matters changed', () => {
    const block = buildExecutiveBlock({ style: 'maker', meetingLoad: 'light' });
    expect(retargetBlock(block, { style: 'maker', meetingLoad: 'light' })).toBe(block);
    // The default meeting load is half; saying so is not a change.
    const half = buildExecutiveBlock({ style: 'mixed' });
    expect(retargetBlock(half, { style: 'mixed', meetingLoad: 'half' })).toBe(half);
  });

  it('a pressure answer given after the block started shows in the target', () => {
    const block = buildExecutiveBlock({ style: 'mixed', meetingLoad: 'half' });
    const hot = retargetBlock(block, { style: 'mixed', meetingLoad: 'half', pressure: 'redline' });
    expect(hot.weeks[0].deepHoursTarget).toBeLessThan(block.weeks[0].deepHoursTarget);
  });
});

describe('assessWork — focus hours vs the honest target', () => {
  const inputs = { style: 'maker' as const, meetingLoad: 'heavy' as const }; // target ≈ 7

  it('asks for data first', () => {
    expect(assessWork(inputs, []).verdict).toBe('need-data');
  });

  it('meets target or climbs → on-track', () => {
    expect(assessWork(inputs, [hours(8, 2)]).verdict).toBe('on-track');
    expect(assessWork(inputs, [hours(3, 20), hours(5, 2)]).verdict).toBe('on-track');
  });

  it('under target and not improving → a calendar fix, not a discipline lecture', () => {
    const a = assessWork(inputs, [hours(5, 20), hours(4, 2)]);
    expect(a.verdict).toBe('protect');
    expect(a.message).toContain('calendar problem');
  });

  it('never says NaN to anyone', () => {
    const shift = assessWork({ style: 'varies' }, []);
    expect(shift.message).not.toMatch(/NaN/);
  });
});
