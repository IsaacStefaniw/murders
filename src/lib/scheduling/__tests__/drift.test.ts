import { placeRoutines, type Window } from '@/lib/scheduling/engine';
import { toHHMM } from '@/lib/dates';
import type { Routine } from '@/types/domain';

/** "Cook at home most nights" as the knowledge base actually builds it. */
const dinner: Routine = {
  id: 'r-dinner',
  title: 'Cook at home most nights',
  area: 'family',
  protocolId: 'home-cooked-nights',
  days: [0, 1, 2, 3, 4, 5, 6],
  durationMin: 35,
  preferredStart: '18:15',
  preferredEnd: '19:45',
  energy: 'evening',
  flexible: true,
  timeAnchored: true,
  protected: false,
  tier: 'could',
  active: true,
};

describe('a routine is never placed at an hour that makes it false', () => {
  it('does not put dinner in the morning when the evening is full', () => {
    // A Saturday whose evening is taken, leaving one 35-minute gap at 09:40.
    const windows: Window[] = [
      { start: 580, end: 615 },   // 09:40–10:15
      { start: 1080, end: 1100 }, // 18:00–18:20 — too short to hold it
    ];
    const { placements, unplaced } = placeRoutines(windows, [dinner]);
    const placedAt = placements[0] ? toHHMM(placements[0].start) : null;

    expect(placedAt).not.toBe('09:40');
    expect(unplaced.map((r) => r.title)).toEqual(['Cook at home most nights']);
  });

  it('still slides it within a sensible distance of its window', () => {
    // 20:10 is late for dinner but not absurd; it should still be taken.
    const windows: Window[] = [{ start: 1210, end: 1300 }];
    const { placements } = placeRoutines(windows, [dinner]);
    expect(placements[0] && toHHMM(placements[0].start)).toBe('20:10');
  });

  it('places it inside its own window when one is free', () => {
    const windows: Window[] = [{ start: 1095, end: 1200 }];
    const { placements } = placeRoutines(windows, [dinner]);
    expect(placements[0] && toHHMM(placements[0].start)).toBe('18:15');
  });
});

/**
 * The other half of the rule. Bounding every routine would be its own bug:
 * an errand does not care what time it happens, and refusing to place it
 * because midday is full would lose it for no reason.
 */
describe('a routine whose hour does not matter still goes anywhere', () => {
  const errand: Routine = {
    id: 'r-friend',
    title: 'Message a friend, make a plan',
    area: 'enjoyment',
    days: [3],
    durationMin: 15,
    preferredStart: '12:45',
    preferredEnd: '13:15',
    energy: 'midday',
    flexible: true,
    protected: false,
    tier: 'could',
    active: true,
  };

  it('takes an evening slot when the whole midday is gone', () => {
    const windows: Window[] = [{ start: 1200, end: 1260 }]; // 20:00–21:00
    const { placements, unplaced } = placeRoutines(windows, [errand]);
    expect(unplaced).toEqual([]);
    expect(placements[0] && toHHMM(placements[0].start)).toBe('20:00');
  });
});

/**
 * `toRoutine` stores the window end as (start + windowMin) % 1440, so a
 * routine anchored late enough wraps past midnight and stores an end
 * EARLIER than its start. Compared raw, that failed pass 1 every time and
 * dropped the most time-sensitive routines of all into the drift pass.
 */
describe('a window that runs past midnight', () => {
  const lateNight: Routine = {
    id: 'r-late',
    title: 'Lights down',
    area: 'health',
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 10,
    preferredStart: '23:00',
    preferredEnd: '00:30',
    energy: 'evening',
    flexible: true,
    timeAnchored: true,
    protected: false,
    tier: 'should',
    active: true,
  };

  it('is honoured rather than treated as a window that ended yesterday', () => {
    const windows: Window[] = [{ start: 1380, end: 1430 }]; // 23:00–23:50
    const { placements } = placeRoutines(windows, [lateNight]);
    expect(placements[0] && toHHMM(placements[0].start)).toBe('23:00');
  });
});
