import {
  applyMoveRoutine,
  applyProtectTime,
  applyShorten,
  detectMissedTwice,
  detectMoveOutcome,
  detectMovePattern,
  detectRegrow,
  REGROW_MIN_OBSERVATIONS,
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

/**
 * The only detector in the app that proposes making something bigger.
 *
 * `detectShrinkToFit` takes a third off every time it fires, there is a
 * floor but no ceiling, and until this existed nothing anywhere in `src`
 * ever offered to put any of it back — while shrink's own reason line
 * promised "you can grow it back any time". Run twice on a bad month, a
 * 45-minute session is 20 and stays there through every good week that
 * follows.
 */
describe('detectRegrow', () => {
  // Shrunk BY THE APP from 45 to 20 — which is the only thing that earns
  // an offer back. A routine somebody simply built short has no
  // `shrunkFrom` and must never be told it "was shortened when weeks were
  // harder", which is what reading a library default used to do to every
  // minimal-capacity person.
  const shrunk: Routine = { ...gym, durationMin: 20, shrunkFrom: 45 };

  const kept = (n: number, completed: number) =>
    Array.from({ length: n }, (_, i) =>
      item({
        id: `k${i}`,
        date: `2026-09-${String(i + 1).padStart(2, '0')}`,
        status: i < completed ? 'completed' : 'skipped',
      }),
    );

  it('offers one step back once the smaller version is sticking', () => {
    const [s] = detectRegrow(kept(6, 6), [shrunk]);
    expect(s).toBeDefined();
    const payload = s.payload as { newDurationMin: number };
    expect(payload.newDurationMin).toBe(25);
    expect(s.message).toContain('Try 25?');
  });

  it('never offers past the size it was shrunk from', () => {
    const nearlyBack: Routine = { ...shrunk, durationMin: 40 };
    const [s] = detectRegrow(kept(8, 8), [nearlyBack]);
    expect((s.payload as { newDurationMin: number }).newDurationMin).toBe(45);
  });

  it('records what it shrank from, once, and forgets it when it is back', () => {
    const shrinkTo = (r: Routine, to: number) =>
      applyShorten([r], {
        id: 's', kind: 'shorten_workout', message: '', reason: '', confidence: 0.5,
        status: 'open', createdAt: '', payload: { routineId: r.id, newDurationMin: to },
      })[0];
    const once = shrinkTo({ ...gym, durationMin: 45 }, 30);
    expect(once.shrunkFrom).toBe(45);
    // Twice, and the offer back is still to where it started.
    expect(shrinkTo(once, 20).shrunkFrom).toBe(45);
    // All the way back, and the record is cleared for next time.
    expect(shrinkTo(once, 45).shrunkFrom).toBeUndefined();
  });

  /**
   * Growing is an ask and shrinking is a rescue, so this is slower to fire
   * on purpose. An ask made too early is the app not believing the week.
   */
  it('waits for more evidence than a shrink needs', () => {
    expect(detectRegrow(kept(REGROW_MIN_OBSERVATIONS - 1, 999), [shrunk])).toEqual([]);
  });

  it('says nothing while the smaller version is still being missed', () => {
    expect(detectRegrow(kept(8, 5), [shrunk])).toEqual([]);
  });

  /**
   * The bug this replaced. `buildPlan.ts:169` builds a minimal-capacity
   * person's strength session at 30 minutes where the `strength` protocol
   * says 45, so reading the library default announced "it was shortened
   * when weeks were harder" to somebody who chose 30 and had already said
   * they have the least room.
   */
  it('says nothing about a routine the person simply built short', () => {
    const chosenShort: Routine = { ...gym, durationMin: 30, protocolId: 'strength' };
    expect(detectRegrow(kept(8, 8), [chosenShort])).toEqual([]);
  });

  /**
   * And the other half: the routines that really do get shrunk and carry
   * no protocolId — Date night, Caring, Paid work — could be cut a third
   * at a time and never offered back.
   */
  it('offers back a shrunk routine that never came from the library', () => {
    const dateNight: Routine = { ...gym, title: 'Date night', durationMin: 80, shrunkFrom: 120 };
    const [s] = detectRegrow(kept(6, 6), [dateNight]);
    expect(s).toBeDefined();
    expect((s.payload as { newDurationMin: number }).newDurationMin).toBe(100);
  });

  it('is applied by the same duration-setting action as a shrink', () => {
    const [s] = detectRegrow(kept(6, 6), [shrunk]);
    expect(applyShorten([shrunk], s)[0].durationMin).toBe(25);
  });
});

/**
 * "Protect the next one" used to set tier: must — which `detectMissedTwice`
 * skips and `droppableRoutines` excludes, so the app went permanently blind
 * to the routine it had just been asked to look after, with no path back
 * down. The blindness is recorded in docs/REVIEW_STREAMS.md; what is fixed
 * here is the app asking for something it has already been given.
 */
describe('protecting something already protected', () => {
  it('is not offered again', () => {
    const history = [
      item({ id: 'a', date: '2026-09-01', status: 'skipped' }),
      item({ id: 'b', date: '2026-09-03', status: 'skipped' }),
    ];
    expect(detectMissedTwice(history, [{ ...gym, protected: true }])).toEqual([]);
    expect(detectMissedTwice(history, [gym]).length).toBe(1);
  });
});
