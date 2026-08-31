import {
  DEFAULT_NOTIFICATION_SETTINGS,
  isQuiet,
  plannedNotifications,
  pullOutOfQuiet,
  quietHoursFor,
  type NotificationSettings,
  type ScheduleInput,
} from '@/features/notifications/schedule';
import { protocolById } from '@/features/knowledge/protocols';
import type {
  BehaviourEvent,
  BehaviourIntention,
  DailyPlan,
  LifeProfile,
  PlanItem,
  Routine,
} from '@/types/domain';

const profile: LifeProfile = {
  firstName: 'Sam',
  priorities: ['health'],
  people: [],
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  createdAt: '',
  updatedAt: '',
};

const intention: BehaviourIntention = {
  id: 'bi-1',
  behaviour: 'alcohol',
  intentionText: 'Drink less',
  createdAt: '2026-01-01T00:00:00.000Z',
  active: true,
};

/** Four evenings, all around 9pm, on the same weekday. */
const eveningEvents = (hhmm = '21:00'): BehaviourEvent[] =>
  ['2026-03-06', '2026-03-13', '2026-03-20', '2026-03-27'].map((d, i) => {
    const [h, m] = hhmm.split(':').map(Number);
    const [y, mo, day] = d.split('-').map(Number);
    return {
      id: `be-${i}`,
      intentionId: 'bi-1',
      occurredAt: new Date(y, mo - 1, day, h, m + i).toISOString(),
    };
  });

const settings = (over: Partial<NotificationSettings> = {}): NotificationSettings => ({
  ...DEFAULT_NOTIFICATION_SETTINGS,
  enabled: true,
  ...over,
});

const input = (over: Partial<ScheduleInput> = {}): ScheduleInput => ({
  date: '2026-04-03', // a Friday, matching the events above
  profile,
  plan: null,
  routines: [],
  behaviourIntentions: [intention],
  behaviourEvents: eveningEvents(),
  metrics: [],
  settings: settings(),
  ...over,
});

const NOW = new Date('2026-04-03T09:00:00');

describe('quiet hours', () => {
  /** Someone who sleeps at one in the morning should not be silenced from ten. */
  it('derives from the person’s own night, not a fixed default', () => {
    expect(quietHoursFor(profile)).toEqual({ from: '23:00', to: '06:30' });
    expect(quietHoursFor({ ...profile, sleepTime: '01:00' }).from).toBe('01:30');
    expect(quietHoursFor(null).from).toBe('23:00');
  });

  it('handles a quiet period that wraps midnight', () => {
    const quiet = { from: '23:00', to: '06:30' };
    expect(isQuiet('23:30', quiet)).toBe(true);
    expect(isQuiet('02:00', quiet)).toBe(true);
    expect(isQuiet('06:29', quiet)).toBe(true);
    expect(isQuiet('06:30', quiet)).toBe(false);
    expect(isQuiet('21:00', quiet)).toBe(false);
  });

  /**
   * Earlier, never later — the same rule the scheduler applies to a
   * deadline. A reminder delivered after the moment it was about also
   * teaches the person that the app's timing cannot be trusted.
   */
  it('pulls a quiet-hours notification earlier rather than pushing it later', () => {
    const quiet = { from: '23:00', to: '06:30' };
    expect(pullOutOfQuiet('23:40', quiet)).toBe('22:55');
    expect(pullOutOfQuiet('02:00', quiet)).toBe('22:55');
    expect(pullOutOfQuiet('20:15', quiet)).toBe('20:15');
  });
});

describe('plannedNotifications', () => {
  it('says nothing at all when notifications are off', () => {
    expect(plannedNotifications(input({ settings: settings({ enabled: false }) }), NOW)).toEqual([]);
  });

  it('schedules an intervention ahead of the behaviour’s usual window', () => {
    const out = plannedNotifications(input(), NOW);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('intervention');
    expect(out[0].at).toBe('20:15'); // window opens 21:00, lead of 45 minutes
  });

  it('says nothing about a behaviour with no pattern yet', () => {
    const thin = eveningEvents().slice(0, 2);
    expect(plannedNotifications(input({ behaviourEvents: thin }), NOW)).toEqual([]);
  });

  it('says nothing on a day the pattern does not touch', () => {
    expect(plannedNotifications(input({ date: '2026-04-01' }), NOW)).toEqual([]);
  });

  /**
   * The copy is where the behaviour engine's whole design could quietly
   * slip. It reports patterns, never verdicts, and a push is the loudest
   * possible place to break that.
   */
  it('names the time and the plan, never the behaviour’s worth', () => {
    const body = plannedNotifications(input(), NOW)[0].body.toLowerCase();
    for (const word of ['bad', 'guilt', 'shame', 'failed', 'cheat', 'willpower', 'should']) {
      expect(body).not.toContain(word);
    }
  });

  /**
   * The failure mode here is not a bug — it is a person turning
   * notifications off, and with them the one nudge that would have landed.
   */
  it('never exceeds the daily cap, and drops by priority rather than by time', () => {
    const items: PlanItem[] = ['08:00', '12:00', '15:00', '17:00'].map((start, i) => ({
      id: `item-${i}`,
      date: '2026-04-03',
      start,
      end: '18:00',
      title: `Session ${i}`,
      area: 'health',
      tier: 'should',
      status: 'planned',
      fixed: false,
    }));
    const plan: DailyPlan = { date: '2026-04-03', items };
    const out = plannedNotifications(
      input({ plan, settings: settings({ sessions: true, windDown: true, dailyCap: 2 }) }),
      NOW,
    );
    expect(out).toHaveLength(2);
    // The intervention survives the cap; four sessions do not crowd it out.
    expect(out.some((n) => n.kind === 'intervention')).toBe(true);
  });

  it('returns them in time order once the cap has been applied', () => {
    const plan: DailyPlan = {
      date: '2026-04-03',
      items: [
        {
          id: 'item-a',
          date: '2026-04-03',
          start: '12:00',
          end: '13:00',
          title: 'Session',
          area: 'health',
          tier: 'should',
          status: 'planned',
          fixed: false,
        },
      ],
    };
    const out = plannedNotifications(
      input({ plan, settings: settings({ sessions: true }) }),
      NOW,
    );
    expect(out.map((n) => n.at)).toEqual(['12:00', '20:15']);
  });

  /**
   * A notification for 19:45 scheduled at 20:10 fires immediately, which
   * reads as a bug because it is one.
   */
  it('never schedules something already past, on today', () => {
    const late = new Date('2026-04-03T21:00:00');
    expect(plannedNotifications(input(), late)).toEqual([]);
  });

  it('still schedules a past-looking time for a future day', () => {
    // Same wall-clock time, but the day has not happened yet.
    const out = plannedNotifications(input({ date: '2026-04-10' }), new Date('2026-04-03T21:00:00'));
    expect(out).toHaveLength(1);
  });

  /**
   * `neverNag` says in data that a practice must never produce a missed-it
   * message. A push notification is the loudest possible one.
   */
  it('never sends a session reminder for a neverNag protocol', () => {
    const routine: Routine = {
      id: 'r-1',
      title: 'Gentle practice',
      area: 'health',
      protocolId: 'transition-anchor',
      days: [5],
      tier: 'should',
      durationMin: 15,
      preferredStart: '12:00',
      preferredEnd: '13:00',
      energy: 'any',
      flexible: true,
      protected: false,
      active: true,
    };
    const plan: DailyPlan = {
      date: '2026-04-03',
      items: [
        {
          id: 'item-n',
          date: '2026-04-03',
          start: '12:00',
          end: '12:15',
          title: 'Gentle practice',
          area: 'health',
          tier: 'should',
          status: 'planned',
          fixed: false,
          routineId: 'r-1',
        },
      ],
    };
    const out = plannedNotifications(
      input({
        plan,
        routines: [routine],
        behaviourEvents: [],
        settings: settings({ sessions: true }),
      }),
      NOW,
    );
    // The assertion is only worth anything if the protocol really is
    // neverNag, so prove that first rather than guarding the expectation.
    expect(protocolById('transition-anchor')?.neverNag).toBe(true);
    expect(out).toEqual([]);
  });

  it('never reminds about something already done or fixed in the calendar', () => {
    const plan: DailyPlan = {
      date: '2026-04-03',
      items: [
        {
          id: 'done',
          date: '2026-04-03',
          start: '12:00',
          end: '13:00',
          title: 'Done already',
          area: 'health',
          tier: 'should',
          status: 'completed',
          fixed: false,
        },
        {
          id: 'work',
          date: '2026-04-03',
          start: '14:00',
          end: '15:00',
          title: 'Work',
          area: 'work',
          tier: 'must',
          status: 'planned',
          fixed: true,
        },
      ],
    };
    const out = plannedNotifications(
      input({ plan, behaviourEvents: [], settings: settings({ sessions: true }) }),
      NOW,
    );
    expect(out).toEqual([]);
  });

  it('gives every notification a stable id, so rescheduling is idempotent', () => {
    const a = plannedNotifications(input(), NOW);
    const b = plannedNotifications(input(), NOW);
    expect(a.map((n) => n.id)).toEqual(b.map((n) => n.id));
    expect(new Set(a.map((n) => n.id)).size).toBe(a.length);
  });

  it('pulls a late-night intervention out of quiet hours rather than into the small hours', () => {
    const out = plannedNotifications(
      input({ behaviourEvents: eveningEvents('23:55') }),
      NOW,
    );
    expect(out).toHaveLength(1);
    expect(out[0].at).toBe('22:55');
  });
});
