/**
 * The times the plan asks for that the person is at work.
 *
 * A review run as the target persona, 06:40 on a Tuesday, one question:
 * is today a gym day, before or after work? Alex works 08:30 to 18:30.
 * Six of his nine active routines had a preferred start before 18:30 —
 * strength at 17:30, the walk at 17:45, cardio at 17:45 — and the routines
 * screen printed those times. They were impossible every working day and
 * had been since the day they were created.
 *
 * Nothing caught it because every detector in `adaptation.ts` is
 * BEHAVIOURAL: it waits for a thing to fail repeatedly and then reacts.
 * This is the other kind — a structural clash, true on day one, before any
 * evidence exists — and the app had none of it. Two facts, two screens
 * apart, never put together.
 */

import {
  atWorkLine,
  clashesWithWork,
  eveningFit,
  eveningLoad,
  pushNote,
} from '@/features/planner/atWork';
import type { LifeProfile, Routine, Weekday } from '@/types/domain';

const profile = {
  workDays: [1, 2, 3, 4, 5],
  workStart: '08:30',
  workEnd: '18:30',
  sleepTime: '23:00',
} as LifeProfile;

const routine = (over: Partial<Routine>): Routine =>
  ({
    id: `r-${Math.random()}`,
    title: 'Strength workout',
    area: 'health',
    days: [1, 3, 5],
    durationMin: 45,
    preferredStart: '17:30',
    preferredEnd: '18:15',
    energy: 'evening',
    flexible: true,
    protected: false,
    tier: 'should',
    active: true,
    ...over,
  }) as Routine;

describe('a routine that wants a time you are at work', () => {
  it('is found on the first day, with no history at all', () => {
    // The whole point. A behavioural detector costs three weeks of failure
    // before it speaks; this could speak on the first evening.
    const found = clashesWithWork([routine({})], profile);
    expect(found).toHaveLength(1);
    expect(found[0].earliestReal).toBe('18:30');
    expect(found[0].days).toEqual([1, 3, 5]);
  });

  it('says so in one sentence, with the number and the choice in it', () => {
    const line = atWorkLine(clashesWithWork([routine({})], profile), profile);
    expect(line).toMatch(/18:30/);
    expect(line).toMatch(/Strength workout/);
    expect(line).toMatch(/Move it|move/i);
  });

  it('counts them when it is the shape of the week rather than one block', () => {
    const many = [
      routine({ title: 'Strength workout', preferredStart: '17:30' }),
      routine({ title: 'The daily walk', preferredStart: '17:45' }),
      routine({ title: 'Easy cardio', preferredStart: '17:45' }),
    ];
    const line = atWorkLine(clashesWithWork(many, profile), profile);
    expect(line).toMatch(/3 things/);
    expect(line).toMatch(/18:30/);
  });

  it('leaves alone anything that already finishes after work', () => {
    expect(clashesWithWork([routine({ preferredStart: '19:30' })], profile)).toEqual([]);
  });

  /**
   * Two exemptions, both deliberate. A deep-work block at 09:15 is not a
   * clash, it is the point; and a routine anchored to the end of work
   * already moves with the finish time rather than guessing at one.
   */
  it('leaves alone work carved out of the work day', () => {
    expect(
      clashesWithWork([routine({ preferredStart: '09:15', duringWork: true })], profile),
    ).toEqual([]);
  });

  it('leaves alone a routine already anchored to the end of work', () => {
    expect(
      clashesWithWork([routine({ preferredStart: '17:30', anchorToWorkEnd: true })], profile),
    ).toEqual([]);
  });

  it('leaves alone a routine that only runs at the weekend', () => {
    expect(clashesWithWork([routine({ days: [0, 6] })], profile)).toEqual([]);
  });

  it('says nothing about a paused routine', () => {
    expect(clashesWithWork([routine({ active: false })], profile)).toEqual([]);
  });

  it('says nothing at all when there is nothing to say', () => {
    expect(atWorkLine([], profile)).toBeNull();
    expect(clashesWithWork([routine({})], null)).toEqual([]);
  });
});

/**
 * The half the person actually feels: everything pushed past the end of
 * work lands in the few hours between getting home and sleeping.
 */
describe('how crowded the hours they own are', () => {
  it('counts what wants that window, and how long it is', () => {
    const load = eveningLoad(
      [
        routine({ preferredStart: '17:30' }),
        routine({ preferredStart: '17:45' }),
        routine({ preferredStart: '19:30' }),
      ],
      profile,
    );
    expect(load).toEqual({ count: 3, hours: 4.5 });
  });

  it('does not count a genuinely early morning routine', () => {
    // 06:30 is before work starts and happens in the morning. Counting it
    // as evening pressure would be inventing a problem.
    const load = eveningLoad([routine({ preferredStart: '06:30', energy: 'morning' })], profile);
    expect(load?.count).toBe(0);
  });

  it('does not count a block carved out of the work day', () => {
    const load = eveningLoad(
      [routine({ preferredStart: '09:15', duringWork: true })],
      profile,
    );
    expect(load?.count).toBe(0);
  });

  it('says nothing without the hours to compute it from', () => {
    expect(eveningLoad([routine({})], null)).toBeNull();
  });
});

describe('the busiest working evening', () => {
  const profile = {
    workDays: [1, 2, 3, 4, 5] as Weekday[],
    workStart: '08:30',
    workEnd: '18:30',
    sleepTime: '23:00',
  };

  const routine = (over: Partial<Routine>): Routine =>
    ({
      id: over.id ?? 'r',
      title: over.title ?? 'A thing',
      area: 'health',
      days: over.days ?? [1],
      durationMin: over.durationMin ?? 30,
      preferredStart: over.preferredStart ?? '19:00',
      active: over.active ?? true,
      flexible: true,
      ...over,
    }) as Routine;

  it('picks the day wanting the most minutes, not the most items', () => {
    const fit = eveningFit(
      [
        // Monday: three short things.
        routine({ id: 'a', days: [1], durationMin: 10 }),
        routine({ id: 'b', days: [1], durationMin: 10 }),
        routine({ id: 'c', days: [1], durationMin: 10 }),
        // Tuesday: one long one.
        routine({ id: 'd', days: [2], durationMin: 120 }),
      ],
      profile,
    );
    expect(fit).toEqual({ day: 2, count: 1, minutes: 120, windowMin: 270 });
  });

  it('measures the window from finishing work to sleeping', () => {
    expect(eveningFit([routine({})], profile)?.windowMin).toBe(270);
    expect(
      eveningFit([routine({})], { ...profile, sleepTime: '22:00' })?.windowMin,
    ).toBe(210);
  });

  it('counts a midday routine, because at work it lands in the evening', () => {
    // 12:05 is after workStart and the person is at work, so it gets
    // pushed into the only hours they own. Same rule as eveningLoad.
    const fit = eveningFit([routine({ preferredStart: '12:05', durationMin: 20 })], profile);
    expect(fit).toEqual({ day: 1, count: 1, minutes: 20, windowMin: 270 });
  });

  it('ignores a genuine morning routine', () => {
    expect(eveningFit([routine({ preferredStart: '06:30' })], profile)).toBeNull();
  });

  it('ignores a block carved out of the work day', () => {
    expect(
      eveningFit([routine({ preferredStart: '09:15', duringWork: true })], profile),
    ).toBeNull();
  });

  it('ignores a paused routine and a weekend-only one', () => {
    expect(eveningFit([routine({ active: false })], profile)).toBeNull();
    expect(eveningFit([routine({ days: [0, 6] })], profile)).toBeNull();
  });

  it('says nothing without the hours, or without work days', () => {
    expect(eveningFit([routine({})], null)).toBeNull();
    expect(eveningFit([routine({})], { ...profile, sleepTime: '' })).toBeNull();
    expect(eveningFit([routine({})], { ...profile, workDays: [] })).toBeNull();
    // Sleeping before finishing work is not a window.
    expect(eveningFit([routine({})], { ...profile, sleepTime: '17:00' })).toBeNull();
  });
});

describe('the note before asking for more', () => {
  const fit = { day: 3 as Weekday, count: 6, minutes: 145, windowMin: 270 };

  it('states what the evening already holds, with both numbers', () => {
    expect(pushNote(fit, [])).toBe(
      'More goes in the evenings. Wednesday already holds 6 things — 2.4 hours of the 4.5 hours between finishing work and sleeping.',
    );
  });

  it('adds the start-time half when there is one', () => {
    const clashes = [1, 2, 3, 4, 5].map(() => ({
      routine: {} as Routine,
      days: [1 as Weekday],
      earliestReal: '18:30',
    }));
    expect(pushNote(fit, clashes)).toContain(
      '5 of your routines want a time you are still at work.',
    );
  });

  it('never claims the week is impossible', () => {
    // The measured truth on the seeded account is 145 minutes of 270 — six
    // things and over two hours spare. The finding said "already called
    // impossible" and the arithmetic says otherwise, so this copy must not
    // make that claim on the product's behalf.
    const note = pushNote(fit, [])!;
    expect(note).not.toMatch(/impossible|cannot|won't fit|too much|unrealistic|overloaded/i);
  });

  it('spells minutes as minutes below an hour and a half', () => {
    expect(pushNote({ ...fit, minutes: 80 }, [])).toContain('80 minutes of the 4.5 hours');
  });

  it('stays quiet about a thin evening', () => {
    // Two things in five hours needs no comment, and a line that always
    // appears is decoration.
    expect(pushNote({ ...fit, count: 2, minutes: 40 }, [])).toBeNull();
    expect(pushNote(null, [])).toBeNull();
  });
});
