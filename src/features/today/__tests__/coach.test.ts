import { coachNote, weekMomentum } from '@/features/today/coach';
import type { DailyPlan, Goal, PlanItem, Routine } from '@/types/domain';

const item = (over: Partial<PlanItem>): PlanItem => ({
  id: 'i',
  date: '2026-03-02',
  start: '12:00',
  end: '12:45',
  title: 'Strength workout',
  area: 'health',
  tier: 'should',
  status: 'completed',
  routineId: 'r1',
  fixed: false,
  ...over,
});

const routine: Routine = {
  id: 'r1',
  title: 'Strength workout',
  area: 'health',
  protocolId: 'strength',
  days: [1],
  durationMin: 45,
  preferredStart: '12:00',
  preferredEnd: '13:00',
  energy: 'any',
  flexible: true,
  protected: false,
  tier: 'should',
  active: true,
};

describe('weekMomentum', () => {
  it('counts completed meaningful items and recently moved milestones, 7-day window', () => {
    const plans: Record<string, DailyPlan> = {
      '2026-03-02': {
        date: '2026-03-02',
        items: [
          item({ id: 'a' }),
          item({ id: 'b', title: 'Work', fixed: true }),
          item({ id: 'c', status: 'skipped' }),
        ],
      },
      '2026-02-20': { date: '2026-02-20', items: [item({ id: 'old', date: '2026-02-20' })] },
    };
    const goals: Goal[] = [
      {
        id: 'g',
        title: 'G',
        area: 'work',
        status: 'active',
        createdAt: '',
        routineIds: [],
        milestones: [
          { id: 'm1', title: 'recent', done: true, doneAt: '2026-03-01T10:00:00.000Z' },
          { id: 'm2', title: 'ancient', done: true, doneAt: '2026-01-01T10:00:00.000Z' },
        ],
      },
    ];
    const m = weekMomentum('2026-03-02', plans, goals);
    expect(m.done).toBe(1); // 'Work' filtered, skipped filtered, old week filtered
    expect(m.milestonesMoved).toBe(1);
  });
});

describe('coachNote', () => {
  it('surfaces the evidence story behind a protocol-backed item, deterministically', () => {
    const note = coachNote('2026-03-02', [item({})], [routine])!;
    expect(note.protocolTitle).toBe('Strength training');
    expect(note.why).toContain('strength');
    expect(note.attribution).toContain('Peter Attia');
    expect(coachNote('2026-03-02', [item({})], [routine])).toEqual(note);
  });

  it('returns null when nothing on the plan is protocol-backed', () => {
    expect(coachNote('2026-03-02', [item({ routineId: undefined })], [routine])).toBeNull();
  });
});
