import { DISMISS_DAYS, dueCheckins, nextCheckin, whyAsking } from '@/features/checkins/due';
import { observe, type MetricObservation } from '@/features/model/metrics';
import type { CheckinSpec, Goal } from '@/types/domain';

const NOW = new Date('2026-03-01T09:00:00');

const reading = (key: string, value: number, daysAgo: number): MetricObservation => ({
  ...observe(key, value),
  at: new Date(NOW.getTime() - daysAgo * 86400e3).toISOString(),
});

const spec = (over: Partial<CheckinSpec> = {}): CheckinSpec => ({
  id: 'ci-1',
  metricKey: 'goal.g1.saved',
  label: 'Amount set aside',
  unit: '$',
  cadenceDays: 7,
  source: 'ask',
  prompt: 'How much is set aside right now?',
  ...over,
});

const goal = (over: Partial<Goal> = {}): Goal => ({
  id: 'g1',
  title: 'Save £10,000',
  area: 'admin',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  routineIds: [],
  checkins: [spec()],
  ...over,
});

describe('dueCheckins', () => {
  /**
   * The disconnected input. A goal whose progress is a number the person
   * has to supply produced no question, so no observation, so no evidence,
   * so the milestone never ticked and the trajectory said "not enough
   * data" forever.
   */
  it('asks immediately when there has never been a reading', () => {
    const due = dueCheckins([goal()], [], {}, NOW);
    expect(due).toHaveLength(1);
    expect(due[0].daysSince).toBeNull();
    expect(due[0].question).toBe('How much is set aside right now?');
  });

  it('waits until the cadence has actually elapsed', () => {
    const fresh = [reading('goal.g1.saved', 4000, 2)];
    expect(dueCheckins([goal()], fresh, {}, NOW)).toEqual([]);
  });

  it('asks once the cadence is up', () => {
    const old = [reading('goal.g1.saved', 4000, 8)];
    expect(dueCheckins([goal()], old, {}, NOW)).toHaveLength(1);
  });

  /** A 7-day check-in on day 8 is fine; nagging on the dot is not. */
  it('allows a day of grace around the cadence', () => {
    const sixDays = [reading('goal.g1.saved', 4000, 6)];
    expect(dueCheckins([goal()], sixDays, {}, NOW)).toHaveLength(1);
    const fiveDays = [reading('goal.g1.saved', 4000, 5)];
    expect(dueCheckins([goal()], fiveDays, {}, NOW)).toEqual([]);
  });

  /**
   * Asking someone to type a number the phone already has teaches them the
   * app's questions are not worth answering.
   */
  it('never asks for something HealthKit or the plan already answers', () => {
    const health = goal({ checkins: [spec({ source: 'health' })] });
    const plan = goal({ checkins: [spec({ source: 'plan' })] });
    expect(dueCheckins([health, plan], [], {}, NOW)).toEqual([]);
  });

  it('ignores goals that are not active', () => {
    expect(dueCheckins([goal({ status: 'paused' })], [], {}, NOW)).toEqual([]);
    expect(dueCheckins([goal({ status: 'achieved' })], [], {}, NOW)).toEqual([]);
  });

  /** "Not now" is a real answer, not a snooze that reappears tomorrow. */
  it('stays quiet for a fortnight after a dismissal, then returns', () => {
    const justDismissed = { 'ci-1': new Date(NOW.getTime() - 3 * 86400e3).toISOString() };
    expect(dueCheckins([goal()], [], justDismissed, NOW)).toEqual([]);

    const longAgo = {
      'ci-1': new Date(NOW.getTime() - (DISMISS_DAYS + 1) * 86400e3).toISOString(),
    };
    expect(dueCheckins([goal()], [], longAgo, NOW)).toHaveLength(1);
  });

  it('puts the most overdue first', () => {
    const goals = [
      goal({ id: 'a', checkins: [spec({ id: 'ci-a', metricKey: 'goal.a.saved' })] }),
      goal({ id: 'b', checkins: [spec({ id: 'ci-b', metricKey: 'goal.b.saved' })] }),
    ];
    const metrics = [reading('goal.a.saved', 1, 9), reading('goal.b.saved', 1, 30)];
    expect(dueCheckins(goals, metrics, {}, NOW).map((d) => d.goal.id)).toEqual(['b', 'a']);
  });
});

describe('nextCheckin', () => {
  /**
   * One question, never the list. A person who opens the app to see what to
   * do next and meets three form fields closes it; the honest way to gather
   * a fortnight of readings is a fortnight of single questions.
   */
  it('offers exactly one, however many are due', () => {
    const goals = [
      goal({ id: 'a', checkins: [spec({ id: 'ci-a', metricKey: 'goal.a.saved' })] }),
      goal({ id: 'b', checkins: [spec({ id: 'ci-b', metricKey: 'goal.b.saved' })] }),
      goal({ id: 'c', checkins: [spec({ id: 'ci-c', metricKey: 'goal.c.saved' })] }),
    ];
    expect(nextCheckin(goals, [], {}, NOW)).not.toBeNull();
    expect(dueCheckins(goals, [], {}, NOW)).toHaveLength(3);
  });

  it('is silent when nothing is due', () => {
    expect(nextCheckin([goal()], [reading('goal.g1.saved', 1, 1)], {}, NOW)).toBeNull();
    expect(nextCheckin([], [], {}, NOW)).toBeNull();
  });
});

describe('whyAsking', () => {
  it('explains what a first reading is for', () => {
    const due = nextCheckin([goal()], [], {}, NOW)!;
    expect(whyAsking(due)).toContain('First reading');
  });

  it('shows the last value and when, so the answer has an anchor', () => {
    const due = nextCheckin([goal()], [reading('goal.g1.saved', 4200, 9)], {}, NOW)!;
    expect(whyAsking(due)).toContain('4200');
    expect(whyAsking(due)).toContain('9 days ago');
  });
});
