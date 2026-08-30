import {
  applyMoveRoutine,
  applyProtectTime,
  detectMissedTwice,
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
