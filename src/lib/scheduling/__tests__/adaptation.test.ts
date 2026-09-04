import {
  applyMoveRoutine,
  applyProtectTime,
  applyShorten,
  detectMissedTwice,
  detectMoveOutcome,
  detectMovePattern,
  detectShrinkToFit,
  detectSlotMismatch,
} from '@/lib/scheduling/adaptation';
import type { PlanItem, Routine } from '@/types/domain';

function item(overrides: Partial<PlanItem>): PlanItem {
  return {
    id: 'i',
    date: '2026-09-01',
    start: '05:30',
    end: '06:15',
    title: 'Strength workout',
    area: 'health',
    tier: 'should',
    status: 'skipped',
    routineId: 'gym',
    fixed: false,
    ...overrides,
  };
}

const gym: Routine = {
  id: 'gym',
  title: 'Strength workout',
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
};

describe('detectSlotMismatch', () => {
  it('suggests moving a repeatedly skipped morning routine to a slot that works', () => {
    const history: PlanItem[] = [
      // Morning gym: skipped 3 of 4.
      item({ id: '1', status: 'skipped' }),
      item({ id: '2', status: 'skipped' }),
      item({ id: '3', status: 'skipped' }),
      item({ id: '4', status: 'completed' }),
      // Lunchtime items complete reliably.
      item({ id: '5', routineId: 'walk', start: '12:30', end: '13:00', status: 'completed' }),
      item({ id: '6', routineId: 'walk', start: '12:30', end: '13:00', status: 'completed' }),
      item({ id: '7', routineId: 'walk', start: '12:30', end: '13:00', status: 'completed' }),
    ];
    const suggestions = detectSlotMismatch(history, [gym]);
    expect(suggestions).toHaveLength(1);
    const s = suggestions[0];
    expect(s.kind).toBe('move_routine');
    expect(s.payload).toMatchObject({ routineId: 'gym', preferredStart: '11:30' });
    expect(s.reason).toContain('skipped 3 of the last 4');
    expect(s.confidence).toBeGreaterThan(0.5);
  });

  it('stays quiet without enough observations', () => {
    const history = [item({ id: '1' }), item({ id: '2' })];
    expect(detectSlotMismatch(history, [gym])).toHaveLength(0);
  });

  it('stays quiet when the routine is actually being completed', () => {
    const history = [
      item({ id: '1', status: 'completed' }),
      item({ id: '2', status: 'completed' }),
      item({ id: '3', status: 'skipped' }),
      item({ id: '4', status: 'completed' }),
    ];
    expect(detectSlotMismatch(history, [gym])).toHaveLength(0);
  });

  it('does not suggest a move when no alternative slot has evidence of working', () => {
    const history = [
      item({ id: '1', status: 'skipped' }),
      item({ id: '2', status: 'skipped' }),
      item({ id: '3', status: 'skipped' }),
    ];
    expect(detectSlotMismatch(history, [gym])).toHaveLength(0);
  });
});

describe('detectMissedTwice', () => {
  it('offers to protect the next session after two consecutive skips', () => {
    const history = [
      item({ id: '1', date: '2026-09-01', status: 'completed' }),
      item({ id: '2', date: '2026-09-02', status: 'skipped' }),
      item({ id: '3', date: '2026-09-03', status: 'skipped' }),
    ];
    const suggestions = detectMissedTwice(history, [gym]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe('protect_time');
    expect(suggestions[0].payload).toMatchObject({ routineId: 'gym' });
    // Supportive framing: nothing is "broken".
    expect(suggestions[0].reason).toContain('nothing is broken');
  });

  it('treats a single miss as noise', () => {
    const history = [
      item({ id: '1', date: '2026-09-01', status: 'completed' }),
      item({ id: '2', date: '2026-09-02', status: 'skipped' }),
    ];
    expect(detectMissedTwice(history, [gym])).toHaveLength(0);
  });

  it('stays quiet when a completion sits between the misses', () => {
    const history = [
      item({ id: '1', date: '2026-09-01', status: 'skipped' }),
      item({ id: '2', date: '2026-09-02', status: 'completed' }),
      item({ id: '3', date: '2026-09-03', status: 'skipped' }),
    ];
    expect(detectMissedTwice(history, [gym])).toHaveLength(0);
  });

  it('never fires for routines that are already must-tier', () => {
    const mustGym = { ...gym, tier: 'must' as const };
    const history = [
      item({ id: '1', date: '2026-09-01', status: 'skipped' }),
      item({ id: '2', date: '2026-09-02', status: 'skipped' }),
    ];
    expect(detectMissedTwice(history, [mustGym])).toHaveLength(0);
  });
});

describe('detectMovePattern', () => {
  it('suggests a new default after two manual moves into the same slot', () => {
    const moves = [
      { routineId: 'gym', start: '18:10', date: '2026-09-01' },
      { routineId: 'gym', start: '17:45', date: '2026-09-03' },
    ];
    const suggestions = detectMovePattern(moves, [gym]); // gym prefers 05:30 (morning)
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe('move_routine');
    expect(suggestions[0].payload).toMatchObject({ routineId: 'gym', preferredStart: '17:30' });
  });

  it('stays quiet after a single move', () => {
    expect(
      detectMovePattern([{ routineId: 'gym', start: '18:10', date: '2026-09-01' }], [gym]),
    ).toHaveLength(0);
  });

  it('stays quiet when moves land in different slots', () => {
    const moves = [
      { routineId: 'gym', start: '18:10', date: '2026-09-01' },
      { routineId: 'gym', start: '12:30', date: '2026-09-03' },
    ];
    expect(detectMovePattern(moves, [gym])).toHaveLength(0);
  });

  it('stays quiet when the moves match the current preferred slot', () => {
    const morningGym = { ...gym, preferredStart: '06:00', preferredEnd: '07:00' };
    const moves = [
      { routineId: 'gym', start: '06:30', date: '2026-09-01' },
      { routineId: 'gym', start: '07:00', date: '2026-09-03' },
    ];
    expect(detectMovePattern(moves, [morningGym])).toHaveLength(0);
  });
});

describe('detectMoveOutcome — moved-then-completed learning', () => {
  const movesTo = (start: string, dates: string[]) =>
    dates.map((date) => ({ routineId: 'gym', start, date }));
  const planWith = (dates: string[], status: 'completed' | 'skipped') =>
    Object.fromEntries(
      dates.map((date) => [
        date,
        { items: [item({ id: `x${date}`, date, start: '17:45', end: '18:30', status })] },
      ]),
    );

  it('fires with the strong copy when moved sessions were actually completed', () => {
    const dates = ['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-08'];
    const suggestions = detectMoveOutcome(movesTo('17:45', dates), planWith(dates, 'completed'), [gym]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].message).toMatch(/moved .+ to the \w+ 4 of the last 4 times .* completed 4/);
    expect(suggestions[0].payload).toMatchObject({ routineId: 'gym', preferredStart: '17:30' });
    expect(suggestions[0].confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('stays quiet when moved sessions were then skipped — a move that fails is not a preference', () => {
    const dates = ['2026-09-01', '2026-09-03', '2026-09-05'];
    expect(
      detectMoveOutcome(movesTo('17:45', dates), planWith(dates, 'skipped'), [gym]),
    ).toHaveLength(0);
  });

  it('stays quiet below three moves to the same slot', () => {
    const dates = ['2026-09-01', '2026-09-03'];
    expect(
      detectMoveOutcome(movesTo('17:45', dates), planWith(dates, 'completed'), [gym]),
    ).toHaveLength(0);
  });
});

describe('applyProtectTime', () => {
  it('raises the routine to must-tier on acceptance', () => {
    const [suggestion] = detectMissedTwice(
      [
        item({ id: '1', date: '2026-09-01', status: 'skipped' }),
        item({ id: '2', date: '2026-09-02', status: 'skipped' }),
      ],
      [gym],
    );
    const updated = applyProtectTime([gym], suggestion);
    expect(updated[0].tier).toBe('must');
  });
});

describe('applyMoveRoutine', () => {
  it('updates the target routine preferred window', () => {
    const [suggestion] = detectSlotMismatch(
      [
        item({ id: '1', status: 'skipped' }),
        item({ id: '2', status: 'skipped' }),
        item({ id: '3', status: 'skipped' }),
        item({ id: '5', routineId: 'walk', start: '12:30', end: '13:00', status: 'completed' }),
        item({ id: '6', routineId: 'walk', start: '12:30', end: '13:00', status: 'completed' }),
        item({ id: '7', routineId: 'walk', start: '12:30', end: '13:00', status: 'completed' }),
      ],
      [gym],
    );
    const updated = applyMoveRoutine([gym], suggestion);
    expect(updated[0].preferredStart).toBe('11:30');
    expect(updated[0].preferredEnd).toBe('14:00');
  });
});

describe('detectShrinkToFit', () => {
  const floorFor = () => 15;
  const skippedLots = [
    item({ id: 's1', status: 'skipped' }),
    item({ id: 's2', status: 'skipped' }),
    item({ id: 's3', status: 'skipped' }),
    item({ id: 's4', status: 'completed' }),
  ];

  it('offers a smaller version of a chronically slipping routine', () => {
    const [s] = detectShrinkToFit(skippedLots, [gym], floorFor);
    expect(s.kind).toBe('shorten_workout');
    expect(s.payload).toMatchObject({ routineId: 'gym', newDurationMin: 30 });
    expect(s.message).toContain('30-minute');
    const updated = applyShorten([gym], s);
    expect(updated[0].durationMin).toBe(30);
  });

  it('never shrinks below the modality floor', () => {
    const short = { ...gym, durationMin: 15 };
    expect(detectShrinkToFit(skippedLots, [short], floorFor)).toHaveLength(0);
  });

  it('stays quiet for routines that mostly happen or lack observations', () => {
    const mostlyDone = [
      item({ id: 'c1', status: 'completed' }),
      item({ id: 'c2', status: 'completed' }),
      item({ id: 'c3', status: 'completed' }),
      item({ id: 'c4', status: 'skipped' }),
    ];
    expect(detectShrinkToFit(mostlyDone, [gym], floorFor)).toHaveLength(0);
    expect(detectShrinkToFit(skippedLots.slice(0, 3), [gym], floorFor)).toHaveLength(0);
  });
});
