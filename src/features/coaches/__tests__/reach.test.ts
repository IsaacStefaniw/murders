import { COACH_LEAD_MIN, LATE_MINUTES, coachNotifications, defendedItems, latenessMessage } from '@/features/coaches/reach';
import { PROTOCOLS } from '@/features/knowledge/protocols';
import { COACH_VOICES } from '@/features/coaches/voices';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  plannedNotifications,
  quietHoursFor,
} from '@/features/notifications/schedule';
import type { DailyPlan, LifeProfile, PlanItem, Routine } from '@/types/domain';

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

/**
 * The only notification category that is on by default was the one that
 * skipped the guard — and then the obvious guard broke the coach.
 *
 * `defendedItems` filtered on area alone, so the `coach` branch (ON by
 * default, unlike `sessions`) could push "Say it to one person in 45
 * minutes. Making it, or shall I move it?" — an accountability question
 * about bereavement, from an app, at a time it chose.
 *
 * The obvious fix was to skip anything `neverNag`. Measured against the
 * library that silences 34 of 36 family and relationship practices,
 * `date-night` and `family-adventure` included, because they are marked
 * "don't score a miss" rather than "don't ask me". So the flag split, and
 * these tests pin both halves: the one practice that must never be asked
 * about ahead, and the width of everything that must still be defended.
 */
describe('a practice that refuses a schedule', () => {
  const plan = (items: Partial<PlanItem>[]): DailyPlan =>
    ({
      date: '2026-09-17',
      items: items.map((i, n) => ({
        id: `pi-${n}`,
        date: '2026-09-17',
        start: '17:15',
        end: '18:00',
        title: 'Say it to one person',
        area: 'relationship',
        tier: 'should',
        status: 'planned',
        fixed: false,
        ...i,
      })),
    }) as DailyPlan;

  const routine = (over: Partial<Routine>): Routine =>
    ({
      id: 'r-1',
      title: 'Say it to one person',
      area: 'relationship',
      days: [1, 2, 3, 4, 5],
      durationMin: 20,
      preferredStart: '17:15',
      preferredEnd: '17:35',
      energy: 'evening',
      flexible: true,
      protected: false,
      tier: 'should',
      active: true,
      ...over,
    }) as Routine;

  it('is never defended out loud', () => {
    const items = plan([{ routineId: 'r-1' }]);
    const grief = [routine({ protocolId: 'say-the-loss-out-loud' })];
    expect(defendedItems(items, grief)).toEqual([]);
    expect(coachNotifications({ date: '2026-09-17', plan: items, profile: null, routines: grief }))
      .toEqual([]);
  });

  /**
   * The half the first attempt got wrong. `device-free-meal` is `neverNag`
   * — nobody is scored on a missed family dinner — and it is exactly the
   * block the 17:15 defence was built for.
   */
  it('still defends an ordinary family block, which is the whole point', () => {
    const items = plan([{ routineId: 'r-1', title: 'Dinner together', area: 'family' }]);
    const ordinary = [routine({ protocolId: 'device-free-meal', area: 'family' })];
    expect(defendedItems(items, ordinary)).toHaveLength(1);
  });

  it('does not silence a block with no practice behind it', () => {
    // A block somebody put there themselves resolves to no protocol, and
    // an unresolvable protocol must not be read as a reason to stay quiet.
    expect(defendedItems(plan([{ routineId: 'r-1' }]), [routine({})])).toHaveLength(1);
    expect(defendedItems(plan([{}]), [])).toHaveLength(1);
  });

  /**
   * The measurement that caused the split, kept as a test so the next
   * person to reach for the wide guard sees the number first.
   *
   * If this ever fails because `neverAskAhead` has spread across the
   * library, the coach has been quietly switched off again.
   */
  it('leaves the family shelf defendable, not two money conversations', () => {
    const shelf = PROTOCOLS.filter((p) => p.area === 'family' || p.area === 'relationship');
    const nagFree = shelf.filter((p) => !p.neverNag);
    const askable = shelf.filter((p) => !p.neverAskAhead);

    // What the wide guard would have left: two, both about money.
    expect(nagFree.length).toBeLessThan(5);
    // What the narrow one leaves.
    expect(askable.length).toBeGreaterThan(shelf.length - 3);
    for (const id of ['date-night', 'family-adventure', 'device-free-meal', 'partner-reunion']) {
      expect(askable.map((p) => p.id)).toContain(id);
    }
  });

  /**
   * A flag this quiet is only honest if it is rare. Five practices, each
   * one whose own copy refuses a timetable.
   */
  it('is applied to a handful of practices, not a category', () => {
    const silent = PROTOCOLS.filter((p) => p.neverAskAhead);
    expect(silent.length).toBeGreaterThan(0);
    expect(silent.length).toBeLessThan(10);
    // Every one of them is also never scored on a miss. The stricter flag
    // implies the looser one, and data that says otherwise is a mistake.
    for (const p of silent) expect(p.neverNag).toBe(true);
  });
});
