/**
 * The sentences the adaptation engine writes, with the titles the app
 * actually uses in them.
 *
 * "Strength workout" survives anything. "Training that sticks" and "Date
 * night with Sam" do not survive being lower-cased and wedged in front of
 * "sessions" — and those are the titles the pathways and the interview
 * produce. Every detector is checked with both.
 */

import {
  detectMissedTwice,
  detectMoveOutcome,
  detectMovePattern,
  detectSlotMismatch,
} from '@/lib/scheduling/adaptation';
import type { PlanItem, Routine } from '@/types/domain';

const routine = (over: Partial<Routine> & { id: string; title: string }): Routine => ({
  area: 'health',
  days: [1, 3, 5],
  durationMin: 45,
  preferredStart: '05:30',
  preferredEnd: '06:30',
  energy: 'morning',
  flexible: true,
  protected: false,
  tier: 'should',
  active: true,
  ...over,
});

const item = (routineId: string, over: Partial<PlanItem> = {}): PlanItem => ({
  id: `${routineId}-${over.date ?? over.id ?? Math.random()}`,
  date: '2026-09-01',
  start: '05:30',
  end: '06:15',
  title: routineId,
  area: 'health',
  tier: 'should',
  status: 'skipped',
  routineId,
  fixed: false,
  ...over,
});

const TITLES = ['Training that sticks', 'Date night with Sam', 'Zone 2 cardio'];

/** The title appears exactly as the app names it, and the sentence has one sentence-case start. */
function expectIntact(message: string, title: string) {
  expect(message).toContain(title);
  expect(message).not.toContain(title.toLowerCase());
  expect(message.trim()).toMatch(/[.?!]$/);
}

describe('F1 the pattern sentence after four moves', () => {
  it('reads as one grammatical sentence, with the title intact', () => {
    const r = routine({ id: 'r', title: 'Training that sticks' });
    const dates = ['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-08'];
    const moves = dates.map((date) => ({ routineId: 'r', start: '17:45', date }));
    const plans = Object.fromEntries(
      dates.map((date) => [date, { items: [item('r', { date, start: '17:45', end: '18:30', status: 'completed' })] }]),
    );
    const [s] = detectMoveOutcome(moves, plans, [r]);
    expect(s.message).toBe(
      "You've moved Training that sticks to the evening 4 of the last 4 times — and completed 4 of them. Make the evening the default?",
    );
  });
});

describe('F2 no detector garbles a title', () => {
  it.each(TITLES)('detectMovePattern keeps "%s" as named', (title) => {
    const r = routine({ id: 'r', title });
    const moves = [
      { routineId: 'r', start: '18:10', date: '2026-09-01' },
      { routineId: 'r', start: '17:45', date: '2026-09-03' },
    ];
    const [s] = detectMovePattern(moves, [r]);
    expect(s).toBeDefined();
    expectIntact(s.message, title);
  });

  it.each(TITLES)('detectMissedTwice keeps "%s" as named and does not wedge it before "sessions"', (title) => {
    const r = routine({ id: 'r', title });
    const history = [item('r', { date: '2026-09-01' }), item('r', { date: '2026-09-03' })];
    const [s] = detectMissedTwice(history, [r]);
    expect(s).toBeDefined();
    expectIntact(s.message, title);
    expect(s.message).not.toMatch(new RegExp(`${title.toLowerCase()} sessions`, 'i'));
  });

  it.each(TITLES)('detectSlotMismatch keeps "%s" as named', (title) => {
    const r = routine({ id: 'r', title });
    const history = [
      item('r', { id: '1' }),
      item('r', { id: '2' }),
      item('r', { id: '3' }),
      item('walk', { id: '4', start: '12:30', end: '13:00', status: 'completed' }),
      item('walk', { id: '5', start: '12:30', end: '13:00', status: 'completed' }),
      item('walk', { id: '6', start: '12:30', end: '13:00', status: 'completed' }),
    ];
    const [s] = detectSlotMismatch(history, [r]);
    expect(s).toBeDefined();
    expectIntact(s.message, title);
    // The old sentence opened with the slot word capitalised and the
    // title lower-cased after it: "Morning training that sticks isn't
    // sticking." The slot belongs in the sentence, not in front of the name.
    expect(s.message).not.toMatch(/^(Morning|Lunchtime|Evening) /);
  });
});
