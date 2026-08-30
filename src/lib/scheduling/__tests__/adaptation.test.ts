import { applyMoveRoutine, detectSlotMismatch } from '@/lib/scheduling/adaptation';
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
