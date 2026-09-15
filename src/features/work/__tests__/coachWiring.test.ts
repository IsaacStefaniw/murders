import { PROTOCOLS, protocolById, toRoutine } from '@/features/knowledge/protocols';
import { QUESTIONS } from '@/features/model/questionEngine';
import { PATHS } from '@/features/paths/definitions';
import type { LifeProfile } from '@/types/domain';

/**
 * The work coach's wiring, from the review.
 *
 * Three findings, all of them "the app asks and then does not read":
 * `direct-reports` duplicated `team` and wrote to a key nobody reads; the
 * decision journal is the best-evidenced practice the coach owns and
 * `build()` never added it; and the deep-work block asserted a 09:15 it
 * never got from the person.
 */

const profile = (over: Partial<LifeProfile> = {}): LifeProfile =>
  ({
    firstName: 'Isaac',
    wakeTime: '06:00',
    sleepTime: '22:00',
    workStart: '09:00',
    workEnd: '17:30',
    workDays: [1, 2, 3, 4, 5],
    createdAt: '2026-01-01T00:00:00.000Z',
    trainingDaysPerWeek: 3,
    trainingDurationMin: 45,
    priorities: ['work'],
    people: [],
    moreOf: [],
    lessOf: [],
    energyProfile: 'morning',
    trainingPreference: 'gym',
    ...over,
  }) as LifeProfile;

const build = (answers: Record<string, string>, p = profile()) =>
  PATHS.work.build({ style: 'maker', ...answers }, p);

describe('the question that was asked twice', () => {
  /**
   * "How many people report to you?" wrote to `directs`. The work path
   * reads `answers.team`, where the same question already lives as an
   * option. Every answer to the second copy went nowhere.
   */
  it('is gone, and the surviving one is the one that is read', () => {
    expect(QUESTIONS.some((q) => q.id === 'direct-reports')).toBe(false);
    expect(QUESTIONS.some((q) => q.answerKey === 'directs')).toBe(false);

    const withTeam = build({ team: 'directs' });
    expect(withTeam.routines.some((r) => r.title.includes('One-on-ones'))).toBe(true);
    const alone = build({ team: 'solo' });
    expect(alone.routines.some((r) => r.title.includes('One-on-ones'))).toBe(false);
  });
});

describe('the decision journal', () => {
  it('exists at grade B and is now actually built', () => {
    expect(protocolById('decision-journal')?.evidenceLevel).toBe('B');
    const plan = build({ decisionLoad: 'weekly' });
    expect(plan.routines.some((r) => r.protocolId === 'decision-journal')).toBe(true);
  });

  it('takes its cadence from the answer', () => {
    const weekly = build({ decisionLoad: 'weekly' }).routines.find(
      (r) => r.protocolId === 'decision-journal',
    )!;
    const daily = build({ decisionLoad: 'daily' }).routines.find(
      (r) => r.protocolId === 'decision-journal',
    )!;
    expect(weekly.days).toEqual([5]);
    expect(daily.days).toEqual([3, 5]);
  });

  /**
   * Somebody making a consequential call a few times a year does not need
   * a standing Friday slot, and giving them one is how a week fills with
   * things that get deleted.
   */
  it('is not built for somebody who rarely makes a call like that', () => {
    for (const decisionLoad of ['rare', '', undefined]) {
      const plan = build(decisionLoad ? { decisionLoad } : {});
      expect(plan.routines.some((r) => r.protocolId === 'decision-journal')).toBe(false);
    }
  });

  it('sits against the end of their day, not against a clock time', () => {
    const r = build({ decisionLoad: 'weekly' }).routines.find(
      (r) => r.protocolId === 'decision-journal',
    )!;
    expect(r.anchorToWorkEnd).toBe(true);
  });
});

describe('the block that asserted an hour nobody gave it', () => {
  /**
   * Without calendar access the coach never asserts a time it did not get
   * from the person. A stated work start is a time it did get; 09:15 is
   * not, and a nurse finishing at seven in the morning was being handed a
   * thinking block mid-afternoon.
   */
  it('starts from their work day, whenever that is', () => {
    const nine = build({ meetingLoad: 'half' }).routines.find((r) => r.protocolId === 'deep-work')!;
    expect(nine.preferredStart).toBe('09:15');

    const nurse = build({ meetingLoad: 'half' }, profile({ workStart: '19:00', workEnd: '07:00' }))
      .routines.find((r) => r.protocolId === 'deep-work')!;
    expect(nurse.preferredStart).toBe('19:15');
  });

  it('opens the heavy-meeting week at the very start of it', () => {
    const r = build({ meetingLoad: 'heavy' }, profile({ workStart: '08:00' })).routines.find(
      (x) => x.protocolId === 'deep-work',
    )!;
    expect(r.preferredStart).toBe('08:00');
    // The window stays tight so the scheduler cannot drift it into the
    // meetings it exists to get ahead of.
    expect(r.preferredEnd).toBe('09:15');
  });

  it('carries the work-start anchor in the library too, not only in the build', () => {
    // Somebody who adds it from the library gets the same honesty.
    const p = protocolById('deep-work')!;
    expect(p.anchor.kind).toBe('workStart');
  });

  /**
   * A D that talks like a B is the one thing that would make a reader stop
   * trusting the grades — which are the only reason to believe anything
   * else in the library.
   */
  it('no longer claims a study it does not have', () => {
    const p = protocolById('deep-work')!;
    expect(p.evidenceLevel).toBe('D');
    expect(p.why).not.toMatch(/routinely outproduces/);
    expect(p.why).toMatch(/practice rather than evidence/);
  });
});


/* ── The same defect, everywhere it lived ─────────────────────────────── */

/**
 * The review named one fixed 09:15. Counting them found twenty-two.
 *
 * Every practice that happens DURING work was pinned to a clock time, and
 * every one of those times is a nine-to-five assumption. `shutdown-ritual`
 * had already been fixed once — a nurse finishing at seven in the morning
 * was getting a closing ritual in the late afternoon — and the pattern was
 * never generalised, so the other twenty-one stayed wrong.
 *
 * About half of this audience is not on a nine-to-five. Fixing one of
 * twenty-two would have been the work coach looking tidy while the rest of
 * the library kept handing shift workers a thinking block in the middle of
 * their sleep.
 */
describe('nothing that happens during work asserts a clock time', () => {
  const duringWork = PROTOCOLS.filter((p) => p.duringWork);

  it('found far more than the one the review named', () => {
    expect(duringWork.length).toBeGreaterThanOrEqual(40);
  });

  /**
   * `timeAnchored` already means "the hour is part of what this IS", and
   * it is the right exemption: a nap at three in the morning on a night
   * shift is about the body clock, and avoiding the heat of the day is
   * about the heat of the day. Those stay on a clock. Everything else
   * moves with the person's hours.
   */
  it('anchors every one of them to the person’s own day', () => {
    const offenders = duringWork
      .filter((p) => p.anchor.kind === 'fixed' && !p.anchor.timeAnchored)
      .map((p) => `${p.id} (fixed ${p.anchor.start ?? ''})`);
    expect(offenders).toEqual([]);
  });

  it('keeps a fallback for somebody who never gave us their hours', () => {
    for (const p of duringWork) {
      if (p.anchor.kind !== 'workStart') continue;
      expect(typeof p.anchor.start).toBe('string');
    }
    const noHours = toRoutine(protocolById('deep-work')!, null);
    expect(noHours.preferredStart).toBe('09:15');
  });

  it('moves a shift worker’s whole work library with their shift', () => {
    const night = profile({ workStart: '19:00', workEnd: '07:00' });
    for (const p of duringWork) {
      if (p.anchor.kind !== 'workStart') continue;
      const r = toRoutine(p, night);
      // Every one lands relative to 19:00 rather than to somebody else's
      // morning. The planner then clamps it inside the shift.
      const expected = (19 * 60 + (p.anchor.offsetMin ?? 0) + 1440) % 1440;
      const [h, m] = r.preferredStart.split(':').map(Number);
      expect(h * 60 + m).toBe(expected);
    }
  });

  it('leaves the body-clock ones on the clock, and says which they are', () => {
    const anchored = duringWork.filter((p) => p.anchor.timeAnchored).map((p) => p.id);
    expect(anchored).toEqual(
      expect.arrayContaining(['night-shift-light', 'on-shift-nap', 'heat-work-week']),
    );
  });

  /**
   * The five that are genuinely about closing a day or a week sit against
   * its end rather than a number of minutes in, because "twenty Friday
   * minutes" on a six-hour day is not seven and a half hours after you
   * started.
   */
  it('puts the end-of-day practices against the end of the day', () => {
    for (const id of [
      'decision-journal',
      'accomplishment-log',
      'work-made-visible',
      'notification-audit',
      'load-and-control-review',
      'receipts-as-you-go',
      'tax-set-aside',
      'shutdown-ritual',
    ]) {
      expect(protocolById(id)?.anchorToWorkEnd).toBe(true);
    }
  });
});
