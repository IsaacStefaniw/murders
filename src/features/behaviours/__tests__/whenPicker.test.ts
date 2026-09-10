import {
  DAYS_BACK,
  dayChoices,
  occurredAtFrom,
  PARTS_OF_DAY,
  timeChoicesFor,
  whenSummary,
} from '@/features/behaviours/whenPicker';

/** Thursday 10 September 2026, 9:15pm. */
const evening = new Date(2026, 8, 10, 21, 15);
/** The same Thursday, 8:20am — before any part of the day has finished. */
const earlyMorning = new Date(2026, 8, 10, 8, 20);

describe('choosing a day', () => {
  it('names today and yesterday, then the weekday', () => {
    const days = dayChoices(evening);
    expect(days).toHaveLength(DAYS_BACK);
    expect(days[0].label).toBe('Today');
    expect(days[1].label).toBe('Yesterday');
    // Thursday minus two is Tuesday — the day Isaac could not log.
    expect(days[2].label).toBe('Tuesday');
  });

  it('reaches back a week, which is the case that prompted this', () => {
    const days = dayChoices(evening);
    expect(days[days.length - 1].offsetDays).toBe(6);
  });
});

describe('choosing a time', () => {
  it('offers only parts of the day for an earlier day', () => {
    expect(timeChoicesFor(2, evening)).toEqual(PARTS_OF_DAY);
    expect(timeChoicesFor(2, evening).every((t) => t.approximate)).toBe(true);
  });

  it('offers exact recent times for today, and marks them exact', () => {
    const times = timeChoicesFor(0, evening);
    expect(times[0].label).toBe('Just now');
    expect(times[0].approximate).toBe(false);
    // 9:15pm less thirty minutes.
    expect(times[1].label).toBe('20:45');
  });

  it('also offers the stretches of today that are well past', () => {
    const keys = timeChoicesFor(0, evening).map((t) => t.key);
    // At 9:15pm the morning and afternoon are behind us and worth offering.
    expect(keys).toContain('morning');
    expect(keys).toContain('afternoon');
    // The evening is not: it would sit inside the exact chips just above it.
    expect(keys).not.toContain('evening');
  });

  it('offers no stretch of today that has not happened', () => {
    const keys = timeChoicesFor(0, earlyMorning).map((t) => t.key);
    for (const part of PARTS_OF_DAY) expect(keys).not.toContain(part.key);
  });

  it('never offers a clock time from before this morning', () => {
    // 00:40 — subtracting three hours would land on yesterday.
    const justAfterMidnight = new Date(2026, 8, 10, 0, 40);
    for (const t of timeChoicesFor(0, justAfterMidnight)) {
      expect(t.minuteOfDay).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('the timestamp it records', () => {
  it('puts an earlier day on that day, at the middle of the stretch', () => {
    const at = new Date(occurredAtFrom(evening, 2, PARTS_OF_DAY[2]));
    expect(at.getDate()).toBe(8);
    expect(at.getHours()).toBe(20);
  });

  it('never records something in the future', () => {
    const at = new Date(occurredAtFrom(earlyMorning, 0, PARTS_OF_DAY[3]));
    expect(at.getTime()).toBeLessThanOrEqual(earlyMorning.getTime());
  });

  it('keeps an exact recent choice exact', () => {
    const times = timeChoicesFor(0, evening);
    const at = new Date(occurredAtFrom(evening, 0, times[1]));
    expect(at.getHours()).toBe(20);
    expect(at.getMinutes()).toBe(45);
  });
});

describe('what the screen says it is recording', () => {
  it('never shows a clock time the person did not give', () => {
    const days = dayChoices(evening);
    const summary = whenSummary(days[2], PARTS_OF_DAY[2]);
    expect(summary).toBe('Tuesday, evening');
    expect(summary).not.toMatch(/\d/);
  });

  it('shows the clock time when there was one', () => {
    const times = timeChoicesFor(0, evening);
    expect(whenSummary(dayChoices(evening)[0], times[1])).toBe('Today at 20:45');
    expect(whenSummary(dayChoices(evening)[0], times[0])).toBe('Just now');
  });
});
