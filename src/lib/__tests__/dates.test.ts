/**
 * Every date-keyed helper, under whichever zone the suite is run in.
 *
 * The container is UTC and the phones are not. Run this file with
 * TZ=Australia/Sydney, TZ=Australia/Perth, TZ=Pacific/Auckland and TZ=UTC;
 * every expectation below is written from local components so the same
 * assertions hold in all four, and a helper that reads UTC where it
 * should read local fails east of Greenwich.
 */

import {
  addDays,
  dateKeyOfIso,
  dateKeyToDate,
  formatTime,
  getClockOffsetMs,
  nowDate,
  nowMinutes,
  setClockOffsetMs,
  toDateKey,
  todayKey,
  toHHMM,
  toMinutes,
  weekdayOf,
  weekStartOf,
} from '@/lib/dates';

const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min, 0, 0);

afterEach(() => {
  setClockOffsetMs(0);
  jest.useRealTimers();
});

describe('date keys', () => {
  it('are the local calendar date, whatever the zone', () => {
    expect(toDateKey(local(2026, 9, 7, 0, 30))).toBe('2026-09-07');
    expect(toDateKey(local(2026, 9, 7, 23, 30))).toBe('2026-09-07');
    expect(toDateKey(local(2026, 1, 1))).toBe('2026-01-01');
  });

  it('round-trip through dateKeyToDate at local midnight', () => {
    for (const key of ['2026-09-07', '2026-02-28', '2026-12-31', '2026-10-04']) {
      const d = dateKeyToDate(key);
      expect(d.getHours()).toBe(0);
      expect(toDateKey(d)).toBe(key);
    }
  });

  it('todayKey follows the local clock across local midnight', () => {
    jest.useFakeTimers().setSystemTime(local(2026, 9, 7, 23, 59));
    expect(todayKey()).toBe('2026-09-07');
    jest.setSystemTime(local(2026, 9, 8, 0, 1));
    expect(todayKey()).toBe('2026-09-08');
  });

  /**
   * An ISO timestamp names an instant; the day it belongs to is a local
   * question. Slicing the first ten characters answers it in UTC, which is
   * a different day for most of the working morning east of Greenwich.
   */
  it('dateKeyOfIso reads the local day of an instant', () => {
    const at = local(2026, 9, 8, 7, 0);
    expect(dateKeyOfIso(at.toISOString())).toBe('2026-09-08');
    const late = local(2026, 9, 8, 23, 30);
    expect(dateKeyOfIso(late.toISOString())).toBe('2026-09-08');
  });

  it('dateKeyOfIso disagrees with a UTC slice exactly when the zone does', () => {
    const at = local(2026, 9, 8, 7, 0);
    const offsetMin = -at.getTimezoneOffset();
    const utcSlice = at.toISOString().slice(0, 10);
    if (offsetMin > 7 * 60) {
      // 07:00 local is still yesterday in UTC: the slice is wrong here.
      expect(utcSlice).toBe('2026-09-07');
    } else {
      expect(utcSlice).toBe('2026-09-08');
    }
    expect(dateKeyOfIso(at.toISOString())).toBe('2026-09-08');
  });
});

describe('arithmetic', () => {
  it('addDays walks the calendar one day at a time', () => {
    expect(addDays('2026-09-07', 1)).toBe('2026-09-08');
    expect(addDays('2026-09-07', -7)).toBe('2026-08-31');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  /**
   * The weeks daylight saving starts: Sydney on 4 October 2026, Auckland
   * on 27 September 2026. A 23-hour day must not repeat or skip a key.
   */
  it('addDays never repeats or skips a day across a daylight-saving change', () => {
    for (const start of ['2026-09-21', '2026-09-28', '2027-03-29', '2027-04-05']) {
      let cursor = start;
      for (let i = 1; i <= 14; i += 1) {
        const next = addDays(start, i);
        expect(next).not.toBe(cursor);
        expect(addDays(cursor, 1)).toBe(next);
        cursor = next;
      }
    }
  });

  it('weekdayOf matches the calendar', () => {
    expect(weekdayOf('2026-09-07')).toBe(1); // Monday
    expect(weekdayOf('2026-09-13')).toBe(0); // Sunday
    expect(weekdayOf('2026-10-04')).toBe(0); // Sydney DST Sunday
  });
});

describe('week starts', () => {
  it('are Mondays, with Sunday belonging to the week before', () => {
    expect(weekStartOf('2026-09-07')).toBe('2026-09-07');
    expect(weekStartOf('2026-09-10')).toBe('2026-09-07');
    expect(weekStartOf('2026-09-13')).toBe('2026-09-07');
    expect(weekStartOf('2026-09-14')).toBe('2026-09-14');
  });

  it('hold through the daylight-saving weeks', () => {
    for (let i = 0; i < 7; i += 1) expect(weekStartOf(addDays('2026-09-28', i))).toBe('2026-09-28');
    for (let i = 0; i < 7; i += 1) expect(weekStartOf(addDays('2026-09-21', i))).toBe('2026-09-21');
    for (let i = 0; i < 7; i += 1) expect(weekStartOf(addDays('2027-04-05', i))).toBe('2027-04-05');
  });

  it('every day of the year maps to a Monday no more than six days back', () => {
    let day = '2026-01-01';
    for (let i = 0; i < 365; i += 1) {
      const start = weekStartOf(day);
      expect(weekdayOf(start)).toBe(1);
      expect(start <= day).toBe(true);
      expect(addDays(start, 6) >= day).toBe(true);
      day = addDays(day, 1);
    }
  });
});

describe('clock times', () => {
  it('toMinutes and toHHMM are inverses and wrap past midnight', () => {
    expect(toMinutes('13:45')).toBe(825);
    expect(toMinutes('7:05')).toBe(425);
    expect(toHHMM(825)).toBe('13:45');
    expect(toHHMM(1440)).toBe('00:00');
    expect(toHHMM(-15)).toBe('23:45');
    expect(() => toMinutes('noon')).toThrow();
  });

  it('formatTime reads the way people say it', () => {
    expect(formatTime('00:00')).toBe('12am');
    expect(formatTime('12:00')).toBe('12pm');
    expect(formatTime('13:45')).toBe('1:45pm');
    expect(formatTime('09:05')).toBe('9:05am');
  });

  it('nowMinutes is the local wall clock', () => {
    jest.useFakeTimers().setSystemTime(local(2026, 9, 8, 18, 20));
    expect(nowMinutes()).toBe(18 * 60 + 20);
  });
});

/**
 * The "tonight" window on Today opens at 17:00 local. It is decided from
 * nowMinutes(), so it must open at 17:00 in Perth and 17:00 in Auckland,
 * not at 17:00 UTC.
 */
describe('the evening window', () => {
  const EVENING_START = 17 * 60;

  it('opens at five in the afternoon, local', () => {
    jest.useFakeTimers().setSystemTime(local(2026, 9, 8, 16, 59));
    expect(nowMinutes() >= EVENING_START).toBe(false);
    jest.setSystemTime(local(2026, 9, 8, 17, 0));
    expect(nowMinutes() >= EVENING_START).toBe(true);
    jest.setSystemTime(local(2026, 9, 8, 23, 30));
    expect(nowMinutes() >= EVENING_START).toBe(true);
    expect(todayKey()).toBe('2026-09-08');
  });
});

/**
 * The preview lab's time machine. Every product read goes through
 * nowDate(), so the offset moves the day key and the clock together.
 */
describe('the clock offset', () => {
  it('moves todayKey and nowMinutes as one', () => {
    jest.useFakeTimers().setSystemTime(local(2026, 9, 8, 21, 0));
    expect(getClockOffsetMs()).toBe(0);
    setClockOffsetMs(4 * 3600e3);
    expect(nowDate().getHours()).toBe(1);
    expect(todayKey()).toBe('2026-09-09');
    expect(nowMinutes()).toBe(60);
  });

  it('is a plain offset, so a negative one goes back', () => {
    jest.useFakeTimers().setSystemTime(local(2026, 9, 8, 0, 30));
    setClockOffsetMs(-3600e3);
    expect(todayKey()).toBe('2026-09-07');
  });
});
