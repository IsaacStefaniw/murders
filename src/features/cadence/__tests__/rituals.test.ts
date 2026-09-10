import {
  MONTH_WINDOW_DAYS,
  nextRitual,
  ritualHistory,
  ritualKey,
  ritualsDue,
  statedPurpose,
  type RitualEntry,
} from '@/features/cadence/rituals';

const done = (...keys: string[]): Record<string, RitualEntry> =>
  Object.fromEntries(keys.map((k) => [k, { answers: {}, completedAt: '2026-09-01T00:00:00Z' }]));

/** 2026: 6 September is a Sunday, 7 September a Monday. */
const FIRST_OF_MONTH = '2026-09-01';
const SUNDAY = '2026-09-06';
const MONDAY = '2026-09-07';
const MIDWEEK = '2026-09-10';

describe('what comes due', () => {
  it('offers nothing on an ordinary midweek day', () => {
    // The day is not this module's. check-in/morning already sets it up in
    // thirty seconds, and a second day-setup would be the duplication the
    // pathway rungs were just fixed for.
    expect(ritualsDue(MIDWEEK, {})).toEqual([]);
  });

  it('offers the week at the turn of the week, both Sunday and Monday', () => {
    for (const day of [SUNDAY, MONDAY]) {
      const kinds = ritualsDue(day, {}).map((r) => r.kind);
      expect(kinds).toContain('week-review');
      expect(kinds).toContain('week-setup');
    }
  });

  it('looks back before it plans forward', () => {
    const kinds = ritualsDue(FIRST_OF_MONTH, {}).map((r) => r.kind);
    expect(kinds.indexOf('month-review')).toBeLessThan(kinds.indexOf('month-setup'));
    // 1 September 2026 is a Tuesday, so only the month is due.
    expect(kinds).toEqual(['month-review', 'month-setup']);
  });

  it('reviews the month that finished, not the one it is in', () => {
    const due = ritualsDue(FIRST_OF_MONTH, {});
    expect(due.find((r) => r.kind === 'month-review')!.periodKey).toBe('2026-08');
    expect(due.find((r) => r.kind === 'month-setup')!.periodKey).toBe('2026-09');
  });

  it('reviews the week that finished, not the one it is in', () => {
    const due = ritualsDue(MONDAY, {});
    expect(due.find((r) => r.kind === 'week-review')!.periodKey).toBe('2026-08-31');
    expect(due.find((r) => r.kind === 'week-setup')!.periodKey).toBe('2026-09-07');
  });

  it('keeps the month open for a few days, not one', () => {
    const last = `2026-09-0${MONTH_WINDOW_DAYS}`;
    expect(ritualsDue(last, {}).some((r) => r.kind === 'month-setup')).toBe(true);
    expect(ritualsDue('2026-09-06', {}).some((r) => r.kind === 'month-setup')).toBe(false);
  });
});

describe('nothing is ever nagged', () => {
  it('does not offer what has been answered', () => {
    const answered = done(ritualKey('week-setup', '2026-09-07'), ritualKey('week-review', '2026-08-31'));
    expect(ritualsDue(MONDAY, answered)).toEqual([]);
  });

  it('does not offer what has been passed on', () => {
    const skipped = {
      [ritualKey('week-setup', '2026-09-07')]: { answers: {}, completedAt: 'x', skipped: true },
      [ritualKey('week-review', '2026-08-31')]: { answers: {}, completedAt: 'x', skipped: true },
    };
    expect(ritualsDue(MONDAY, skipped)).toEqual([]);
  });

  it('a skipped setup never comes back, and the review is unaffected', () => {
    const kinds = ritualsDue(MONDAY, done(ritualKey('week-setup', '2026-09-07'))).map((r) => r.kind);
    expect(kinds).not.toContain('week-setup');
    expect(kinds).toContain('week-review');
  });
});

describe('the questions', () => {
  it('keeps every ritual to two minutes — three questions at most', () => {
    for (const day of [FIRST_OF_MONTH, SUNDAY, MONDAY]) {
      for (const r of ritualsDue(day, {}, ['Get stronger'])) {
        expect(r.questions.length).toBeGreaterThan(0);
        expect(r.questions.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it('asks which goal the month serves, but only where there are goals', () => {
    const withGoals = ritualsDue(FIRST_OF_MONTH, {}, ['Get stronger']).find(
      (r) => r.kind === 'month-setup',
    )!;
    expect(withGoals.questions.some((q) => q.goalPick)).toBe(true);
    const without = ritualsDue(FIRST_OF_MONTH, {}, []).find((r) => r.kind === 'month-setup')!;
    expect(without.questions.some((q) => q.goalPick)).toBe(false);
  });

  it('names the period so nobody wonders which week is meant', () => {
    for (const r of ritualsDue(FIRST_OF_MONTH, {}, [])) {
      expect(r.periodLabel.length).toBeGreaterThan(0);
    }
  });
});

describe('reading it back', () => {
  const answered: Record<string, RitualEntry> = {
    [ritualKey('week-setup', '2026-09-07')]: {
      answers: { for: 'Ship the release', risk: 'Thursday' },
      completedAt: '2026-09-07T08:00:00Z',
    },
    [ritualKey('month-setup', '2026-09')]: {
      answers: { for: 'Get the release out' },
      completedAt: '2026-09-01T07:00:00Z',
    },
  };

  it('gives back what the person said the period was for', () => {
    expect(statedPurpose('week-setup', '2026-09-07', answered)).toBe('Ship the release');
    expect(statedPurpose('month-setup', '2026-09', answered)).toBe('Get the release out');
  });

  it('gives nothing back for a period never set up, or one passed on', () => {
    expect(statedPurpose('week-setup', '2026-08-31', answered)).toBeNull();
    expect(
      statedPurpose('month-setup', '2026-09', {
        [ritualKey('month-setup', '2026-09')]: { answers: {}, completedAt: 'x', skipped: true },
      }),
    ).toBeNull();
  });

  it('lists the history newest first, for a review to read', () => {
    const history = ritualHistory('week-setup', {
      ...answered,
      [ritualKey('week-setup', '2026-08-31')]: { answers: { for: 'Rest' }, completedAt: 'x' },
    });
    expect(history.map((h) => h.periodKey)).toEqual(['2026-09-07', '2026-08-31']);
  });
});

describe('one at a time, where a screen has room for one', () => {
  it('offers the most significant thing due', () => {
    expect(nextRitual(FIRST_OF_MONTH, {})?.kind).toBe('month-review');
    expect(nextRitual(MONDAY, {})?.kind).toBe('week-review');
  });

  it('offers nothing on a day nothing is due', () => {
    expect(nextRitual(MIDWEEK, {})).toBeNull();
  });
});
