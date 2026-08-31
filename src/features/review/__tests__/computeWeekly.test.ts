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
   * Food and gambling used to be excluded here. They are counted now: a
   * count is information, and a person who chose to track something is owed
   * the number rather than protected from it.
   */
  it('counts every tracked behaviour, food and gambling included', () => {
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
    expect(stats.behaviourEventCounts.sugar).toBe(2);
    expect(stats.behaviourEventCounts.junk_food).toBe(1);
    expect(stats.behaviourEventCounts.gambling).toBe(1);
  });

  /**
   * What a count must never become. These stats are handed verbatim to the
   * weekly-narrative prompt, so the free-text detail a person wrote — "one
   * piece of Kit Kat" — stays out of them. The number is information; the
   * confession is not the model's business.
   */
  it('carries the count but never the free-text detail into the stats', () => {
    const { stats } = computeWeeklyStats({
      ...base,
      behaviourIntentions: [intention('bi-s', 'sugar')],
      behaviourEvents: [event('bi-s', '03')],
    });
    expect(stats.behaviourEventCounts.sugar).toBe(1);
    expect(JSON.stringify(stats)).not.toContain('Kit Kat');
  });
});
