import { computeWeeklyStats } from '@/features/review/computeWeekly';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

const intention = (id: string, behaviour: BehaviourIntention['behaviour']): BehaviourIntention => ({
  id,
  behaviour,
  intentionText: 'Working on it',
  createdAt: '2026-03-01T00:00:00.000Z',
  active: true,
});

const event = (intentionId: string, day: string): BehaviourEvent => ({
  id: `be-${intentionId}-${day}`,
  intentionId,
  occurredAt: `2026-03-${day}T20:45:00.000Z`,
  detail: 'one piece of Kit Kat',
});

describe('computeWeeklyStats behaviour counts', () => {
  const base = {
    weekStart: '2026-03-02',
    plans: {},
    reflections: [],
  };

  it('counts behaviours that carry a count honestly', () => {
    const { stats } = computeWeeklyStats({
      ...base,
      behaviourIntentions: [intention('bi-a', 'alcohol')],
      behaviourEvents: [event('bi-a', '03'), event('bi-a', '05')],
    });
    expect(stats.behaviourEventCounts.alcohol).toBe(2);
  });

  /**
   * These stats are handed verbatim to the weekly-narrative prompt. A tally
   * of sweets eaten reaching a language model is a shaming sentence waiting
   * to be generated — so behaviours marked neverScore are counted nowhere,
   * and their signal lives in the pattern engine as timing instead.
   */
  it('never tallies food or gambling, so the narrative prompt cannot see a score', () => {
    const { stats } = computeWeeklyStats({
      ...base,
      behaviourIntentions: [
        intention('bi-s', 'sugar'),
        intention('bi-j', 'junk_food'),
        intention('bi-g', 'gambling'),
      ],
      behaviourEvents: [
        event('bi-s', '03'),
        event('bi-s', '04'),
        event('bi-j', '05'),
        event('bi-g', '06'),
      ],
    });
    expect(stats.behaviourEventCounts.sugar).toBeUndefined();
    expect(stats.behaviourEventCounts.junk_food).toBeUndefined();
    expect(stats.behaviourEventCounts.gambling).toBeUndefined();
    expect(JSON.stringify(stats)).not.toContain('Kit Kat');
  });
});
