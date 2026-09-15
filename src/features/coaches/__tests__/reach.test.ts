import { COACH_LEAD_MIN, LATE_MINUTES, coachNotifications, defendedItems, latenessMessage } from '@/features/coaches/reach';
import { COACH_VOICES } from '@/features/coaches/voices';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  plannedNotifications,
  quietHoursFor,
} from '@/features/notifications/schedule';
import type { DailyPlan, LifeProfile, PlanItem } from '@/types/domain';

/**
 * A coach that can only speak to somebody already holding the phone is not
 * defending an evening, it is describing one afterwards.
 *
 * `useNotificationSync` has been mounted and `plannedNotifications` has
 * computed a queue for some time. No coach used either. This is the wiring
 * — and the family coach's entire product, per the review: stop the 17:50
 * collision when work runs over.
 */

const DATE = '2026-09-15';

const profile = (over: Partial<LifeProfile> = {}): LifeProfile =>
  ({
    firstName: 'Isaac',
    wakeTime: '06:00',
    sleepTime: '22:00',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }) as LifeProfile;

function item(over: Partial<PlanItem> = {}): PlanItem {
  return {
    id: over.id ?? `pi-${over.start ?? '18:00'}`,
    date: DATE,
    start: '18:00',
    end: '18:45',
    title: 'Dinner together',
    area: 'family',
    tier: 'should',
    status: 'planned',
    fixed: false,
    ...over,
  } as PlanItem;
}

const plan = (items: PlanItem[]): DailyPlan => ({ date: DATE, items }) as DailyPlan;

describe('what a coach defends', () => {
  it('is family and the relationship, and not the rest of the day', () => {
    const p = plan([
      item({ id: 'a', area: 'health', start: '06:00' }),
      item({ id: 'b', area: 'work', start: '09:00' }),
      item({ id: 'c', area: 'relationship', start: '20:00' }),
      item({ id: 'd', area: 'family', start: '18:00' }),
    ]);
    expect(defendedItems(p).map((i) => i.id)).toEqual(['d', 'c']);
  });

  it('leaves the diary alone', () => {
    // A fixed calendar event is the person's own; the app did not put it
    // there and does not get to defend it.
    expect(defendedItems(plan([item({ fixed: true })]))).toEqual([]);
  });

  it('says nothing about something already done', () => {
    expect(defendedItems(plan([item({ status: 'completed' })]))).toEqual([]);
  });
});

describe('the nudge', () => {
  it('lands three quarters of an hour out, from the coach, with the question', () => {
    const [n] = coachNotifications({ date: DATE, plan: plan([item()]), profile: profile() });
    expect(n.at).toBe('17:15');
    expect(n.kind).toBe('coach');
    expect(n.title).toBe(COACH_VOICES.family.name);
    expect(n.body).toBe('Dinner together in 45 minutes. Making it, or shall I move it?');
    expect(COACH_LEAD_MIN).toBe(45);
  });

  /**
   * Three notifications about three family blocks is a coach that has
   * become a calendar alert, and the first is the one that decides the
   * evening.
   */
  it('sends one a day, not one per block', () => {
    const many = plan([item({ id: 'a', start: '18:00' }), item({ id: 'b', start: '20:00' })]);
    const out = coachNotifications({ date: DATE, plan: many, profile: profile() });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('coach:a');
  });

  it('stays quiet about a block work cannot run over into', () => {
    const early = plan([item({ start: '00:20' })]);
    expect(coachNotifications({ date: DATE, plan: early, profile: profile() })).toEqual([]);
  });

  it('has nothing to say on a day with nothing to defend', () => {
    expect(coachNotifications({ date: DATE, plan: null, profile: profile() })).toEqual([]);
  });
});

describe('through the queue', () => {
  const base = {
    date: DATE,
    profile: profile(),
    plan: plan([item()]),
    routines: [],
    behaviourIntentions: [],
    behaviourEvents: [],
    metrics: [],
  };
  const now = new Date('2026-09-15T08:00:00');

  it('is on by default once notifications are on at all', () => {
    expect(DEFAULT_NOTIFICATION_SETTINGS.coach).toBe(true);
    const out = plannedNotifications(
      { ...base, settings: { ...DEFAULT_NOTIFICATION_SETTINGS, enabled: true } },
      now,
    );
    expect(out.map((n) => n.kind)).toContain('coach');
  });

  it('can be turned off on its own', () => {
    const out = plannedNotifications(
      { ...base, settings: { ...DEFAULT_NOTIFICATION_SETTINGS, enabled: true, coach: false } },
      now,
    );
    expect(out.map((n) => n.kind)).not.toContain('coach');
  });

  it('obeys quiet hours like everything else', () => {
    // A late block on somebody who sleeps early: pulled EARLIER, never later.
    const late = { ...base, plan: plan([item({ start: '23:30', end: '23:59' })]) };
    const early = profile({ sleepTime: '21:00', wakeTime: '05:00' });
    const out = plannedNotifications(
      {
        ...late,
        profile: early,
        settings: { ...DEFAULT_NOTIFICATION_SETTINGS, enabled: true },
      },
      now,
    );
    const coach = out.find((n) => n.kind === 'coach')!;
    const quiet = quietHoursFor(early);
    expect(coach.at).toBe('21:25');
    expect(quiet.from).toBe('21:30');
  });

  /**
   * An evening that work is about to eat has a deadline on it. A reminder
   * to start winding down is the same advice whenever it arrives.
   */
  it('outranks wind-down when the cap bites', () => {
    const out = plannedNotifications(
      {
        ...base,
        settings: {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          enabled: true,
          windDown: true,
          dailyCap: 1,
        },
      },
      now,
    );
    expect(out.map((n) => n.kind)).toEqual(['coach']);
  });
});

describe('the message it writes for you', () => {
  it('says the new time, in the person’s own voice', () => {
    expect(latenessMessage(item())).toBe('Running about 20 minutes late — see you at 6:20pm.');
    expect(LATE_MINUTES).toBe(20);
  });

  /**
   * It is going to somebody who did not install this and should never be
   * able to tell software was involved.
   */
  it('never signs itself, names the app, or reads as automated', () => {
    const text = latenessMessage(item());
    expect(text).not.toMatch(/IntentNorth|sent from|automatically|your coach/i);
  });
});
