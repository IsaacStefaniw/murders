import { proposeIntention } from '@/features/checkins/propose';
import type { BehaviourIntention, DailyPlan, Goal } from '@/types/domain';

const plan: DailyPlan = {
  date: '2026-09-07',
  items: [
    {
      id: 'w',
      date: '2026-09-07',
      start: '09:00',
      end: '12:00',
      title: 'Work',
      area: 'work',
      tier: 'must',
      status: 'planned',
      fixed: true,
    },
    {
      id: 'g',
      date: '2026-09-07',
      start: '12:05',
      end: '12:50',
      title: 'Strength workout',
      area: 'health',
      tier: 'should',
      status: 'planned',
      fixed: false,
    },
  ],
};

const vaping: BehaviourIntention = {
  id: 'bi1',
  behaviour: 'vaping',
  intentionText: 'Keep the vape down',
  createdAt: '',
  active: true,
};

describe('proposeIntention', () => {
  it('proposes a behaviour-specific intention anchored to today', () => {
    const p = proposeIntention({
      plan,
      behaviourIntentions: [vaping],
      behaviourEvents: [],
      goals: [],
    });
    expect(p.text).toBe('Vape stays out of reach until after strength workout.');
    expect(p.protect).toBe('vaping');
  });

  it('picks the behaviour with the most recent events when several are tracked', () => {
    const scroll: BehaviourIntention = { ...vaping, id: 'bi2', behaviour: 'doomscrolling' };
    const p = proposeIntention({
      plan,
      behaviourIntentions: [vaping, scroll],
      behaviourEvents: [
        { id: '1', intentionId: 'bi2', occurredAt: new Date().toISOString() },
        { id: '2', intentionId: 'bi2', occurredAt: new Date().toISOString() },
      ],
      goals: [],
    });
    expect(p.protect).toBe('doomscrolling');
  });

  it('guards the growth block when no behaviours are tracked', () => {
    const goal: Goal = {
      id: 'g1',
      title: 'Grow',
      area: 'work',
      domain: 'business',
      status: 'active',
      createdAt: '',
      routineIds: [],
    };
    const withBlock: DailyPlan = {
      ...plan,
      items: [
        ...plan.items,
        {
          id: 'b',
          date: '2026-09-07',
          start: '09:15',
          end: '10:45',
          title: 'Growth block',
          area: 'work',
          tier: 'must',
          status: 'planned',
          fixed: true,
          goalId: 'g1',
        },
      ],
    };
    const p = proposeIntention({
      plan: withBlock,
      behaviourIntentions: [],
      behaviourEvents: [],
      goals: [goal],
    });
    expect(p.text).toContain('growth block');
  });

  it('always proposes something', () => {
    const p = proposeIntention({ plan, behaviourIntentions: [], behaviourEvents: [], goals: [] });
    expect(p.text.length).toBeGreaterThan(5);
  });
});
