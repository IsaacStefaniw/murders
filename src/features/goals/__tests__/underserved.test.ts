import { detectGoalUnderserved } from '@/features/goals/underserved';
import { addDays } from '@/lib/dates';
import type { Goal, PlanItem, Routine } from '@/types/domain';

const TODAY = '2026-03-01';

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    title: 'Grow the business',
    area: 'work',
    domain: 'business',
    status: 'active',
    createdAt: `${addDays(TODAY, -14)}T09:00:00.000Z`,
    routineIds: ['r1'],
    milestones: [{ id: 'm1', title: 'Establish the current baseline', done: false }],
    ...overrides,
  };
}

function routine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'r1',
    title: 'Growth block',
    area: 'work',
    goalId: 'g1',
    days: [1],
    durationMin: 90,
    preferredStart: '09:15',
    preferredEnd: '10:45',
    energy: 'morning',
    flexible: false,
    protected: false,
    tier: 'must',
    active: true,
    ...overrides,
  };
}

function item(status: 'completed' | 'skipped', id: string): PlanItem {
  return {
    id,
    date: TODAY,
    start: '09:15',
    end: '10:45',
    title: 'Growth block',
    area: 'work',
    tier: 'must',
    status,
    routineId: 'r1',
    goalId: 'g1',
    fixed: false,
  };
}

describe('detectGoalUnderserved', () => {
  it('fires when every routine serving the goal has been rested', () => {
    const [s] = detectGoalUnderserved(TODAY, [goal()], [routine({ active: false })], []);
    expect(s.kind).toBe('plan_adjustment');
    expect(s.message).toContain('Nothing on the calendar');
    expect(s.message).toContain('Establish the current baseline');
    expect(s.payload).toMatchObject({ goalId: 'g1', durationMin: 30 });
  });

  it('fires when the recent linked blocks all slipped', () => {
    const history = [item('skipped', 'a'), item('skipped', 'b')];
    const [s] = detectGoalUnderserved(TODAY, [goal()], [routine()], history);
    expect(s.message).toContain('keep slipping');
  });

  it('stays quiet while an active routine is producing completions', () => {
    const history = [item('skipped', 'a'), item('completed', 'b')];
    expect(detectGoalUnderserved(TODAY, [goal()], [routine()], history)).toHaveLength(0);
  });

  it('gives a fresh goal a week before judging its calendar', () => {
    const young = goal({ createdAt: `${addDays(TODAY, -3)}T09:00:00.000Z` });
    expect(detectGoalUnderserved(TODAY, [young], [routine({ active: false })], [])).toHaveLength(0);
  });

  it('ignores behaviour goals and goals with all milestones done', () => {
    const behaviour = goal({ id: 'g2', domain: 'behaviour', routineIds: [] });
    const finished = goal({
      id: 'g3',
      milestones: [{ id: 'm1', title: 'Done', done: true }],
    });
    expect(detectGoalUnderserved(TODAY, [behaviour, finished], [], [])).toHaveLength(0);
  });
});
