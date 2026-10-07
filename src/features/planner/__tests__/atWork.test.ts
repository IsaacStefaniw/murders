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

import { atWorkLine, clashesWithWork, eveningLoad } from '@/features/planner/atWork';
import type { LifeProfile, Routine } from '@/types/domain';

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
