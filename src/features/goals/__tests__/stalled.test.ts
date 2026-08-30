import { detectGoalStalled, STALL_DAYS } from '@/features/goals/stalled';
import { addDays } from '@/lib/dates';
import type { Goal } from '@/types/domain';

const TODAY = '2026-03-01';

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    title: 'Grow the business',
    area: 'work',
    domain: 'business',
    status: 'active',
    createdAt: `${addDays(TODAY, -(STALL_DAYS + 7))}T09:00:00.000Z`,
    routineIds: [],
    milestones: [
      { id: 'm1', title: 'Establish the current baseline', done: false },
      { id: 'm2', title: 'Define the gap', done: false },
    ],
    ...overrides,
  };
}

describe('detectGoalStalled', () => {
  it('fires for an active goal with no milestone progress in the stall window', () => {
    const [s] = detectGoalStalled(TODAY, [goal()]);
    expect(s.kind).toBe('goal_stalled');
    expect(s.message).toContain('Grow the business');
    expect(s.message).toContain('Establish the current baseline');
    const payload = s.payload as { goalId: string; durationMin: number; date: string };
    expect(payload.goalId).toBe('g1');
    expect(payload.durationMin).toBe(30);
    expect(payload.date).toBe(addDays(TODAY, 1));
  });

  it('stays quiet while the goal is younger than the stall window', () => {
    const young = goal({ createdAt: `${addDays(TODAY, -5)}T09:00:00.000Z` });
    expect(detectGoalStalled(TODAY, [young])).toHaveLength(0);
  });

  it('a recently completed milestone counts as progress', () => {
    const moving = goal({
      milestones: [
        {
          id: 'm1',
          title: 'Baseline',
          done: true,
          doneAt: `${addDays(TODAY, -3)}T20:00:00.000Z`,
        },
        { id: 'm2', title: 'Define the gap', done: false },
      ],
    });
    expect(detectGoalStalled(TODAY, [moving])).toHaveLength(0);
  });

  it('an old completion no longer counts — the goal re-stalls', () => {
    const restalled = goal({
      milestones: [
        {
          id: 'm1',
          title: 'Baseline',
          done: true,
          doneAt: `${addDays(TODAY, -(STALL_DAYS + 2))}T20:00:00.000Z`,
        },
        { id: 'm2', title: 'Define the gap', done: false },
      ],
    });
    const [s] = detectGoalStalled(TODAY, [restalled]);
    expect(s.message).toContain('Define the gap');
  });

  it('ignores finished, paused, and milestone-less goals', () => {
    const finished = goal({
      milestones: [{ id: 'm1', title: 'Done', done: true, doneAt: '2026-01-01T00:00:00.000Z' }],
    });
    const paused = goal({ id: 'g2', status: 'paused' });
    const noMilestones = goal({ id: 'g3', milestones: undefined });
    expect(detectGoalStalled(TODAY, [finished, paused, noMilestones])).toHaveLength(0);
  });
});
