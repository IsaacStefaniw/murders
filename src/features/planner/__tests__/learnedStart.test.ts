/**
 * The time the app shows against the time it runs.
 *
 * Isaac stopped using his own app. Asked why: "I opened it and it was
 * wrong — the plan didn't match my actual day." Measured across the
 * cohort, 36 of 63 active routines drift fifteen minutes or more between
 * the two, and 28 drift an hour or more.
 */

import {
  DRIFT_WORTH_SAYING,
  LEARNED_START_MIN_DAYS,
  driftsMeaningfully,
  observedStarts,
  startExplanation,
  startToShow,
} from '@/features/planner/learnedStart';
import { clashesWithWork } from '@/features/planner/atWork';
import { addDays } from '@/lib/dates';
import type { DailyPlan, LifeProfile, PlanItem, Routine, Weekday } from '@/types/domain';

const TODAY = '2026-10-22';

const routine = (over: Partial<Routine> = {}): Routine =>
  ({
    id: over.id ?? 'r1',
    title: over.title ?? 'Strength workout',
    area: 'health',
    days: over.days ?? ([1, 3, 5] as Weekday[]),
    durationMin: 45,
    preferredStart: over.preferredStart ?? '17:30',
    preferredEnd: '18:15',
    active: over.active ?? true,
    flexible: true,
    tier: 'should',
    ...over,
  }) as Routine;

/** `starts` placed on consecutive days ending today. */
const plansWith = (routineId: string, starts: string[]): Record<string, DailyPlan> => {
  const out: Record<string, DailyPlan> = {};
  starts.forEach((start, i) => {
    const date = addDays(TODAY, -(starts.length - 1 - i));
    out[date] = {
      date,
      items: [{ id: `i${i}`, date, start, end: start, title: 'x', routineId } as PlanItem],
    } as DailyPlan;
  });
  return out;
};

const profile = (over: Partial<LifeProfile> = {}): LifeProfile =>
  ({
    workStart: '08:30',
    workEnd: '18:30',
    workDays: [1, 2, 3, 4, 5] as Weekday[],
    wakeTime: '06:15',
    sleepTime: '23:00',
    ...over,
  }) as LifeProfile;

describe('where a routine actually runs', () => {
  it('reports the median placement, not the stated one', () => {
    const r = routine({ preferredStart: '17:30' });
    const obs = observedStarts(plansWith(r.id, ['18:45', '18:45', '19:00', '18:30']), [r], TODAY);
    const seen = obs.get(r.id)!;
    expect(seen.usual).toBe('18:45');
    expect(seen.drift).toBe(75);
    expect(seen.days).toBe(4);
  });

  /**
   * One session dragged to midnight by a late finish must not move the
   * reported time by two hours. A mean is the statistic a single outlier
   * owns; the person is trying to recognise their typical day.
   */
  it('is not moved by one outlier', () => {
    const r = routine({ preferredStart: '18:00' });
    const obs = observedStarts(plansWith(r.id, ['18:00', '18:00', '18:00', '23:30']), [r], TODAY);
    expect(obs.get(r.id)!.usual).toBe('18:00');
  });

  it('says nothing until there is enough of it', () => {
    expect(LEARNED_START_MIN_DAYS).toBe(3);
    const r = routine();
    expect(observedStarts(plansWith(r.id, ['19:00', '19:00']), [r], TODAY).has(r.id)).toBe(false);
    expect(observedStarts(plansWith(r.id, ['19:00', '19:00', '19:00']), [r], TODAY).has(r.id)).toBe(
      true,
    );
  });

  it('ignores days that have not happened, which are the plan talking to itself', () => {
    const r = routine();
    const plans = plansWith(r.id, ['19:00', '19:00', '19:00']);
    for (let i = 1; i <= 4; i += 1) {
      const date = addDays(TODAY, i);
      plans[date] = {
        date,
        items: [{ id: `f${i}`, date, start: '06:00', end: '06:45', title: 'x', routineId: r.id } as PlanItem],
      } as DailyPlan;
    }
    expect(observedStarts(plans, r ? [r] : [], TODAY).get(r.id)!.usual).toBe('19:00');
  });

  it('ignores the calendar, which is not something the app asked for', () => {
    const r = routine();
    const plans = plansWith(r.id, ['19:00', '19:00', '19:00']);
    const d = Object.keys(plans)[0];
    plans[d].items.push({
      id: 'fixed',
      date: d,
      start: '09:00',
      end: '17:00',
      title: 'Work',
      routineId: r.id,
      fixed: true,
    } as PlanItem);
    expect(observedStarts(plans, [r], TODAY).get(r.id)!.days).toBe(3);
  });
});

describe('which time the screen prints', () => {
  it('prints the observed one once there is enough of it', () => {
    const r = routine({ preferredStart: '17:30' });
    const obs = observedStarts(plansWith(r.id, ['18:45', '18:45', '18:45']), [r], TODAY);
    expect(startToShow(r, obs.get(r.id))).toBe('18:45');
  });

  it('prints the stated one on day one, which is all the app knows then', () => {
    const r = routine({ preferredStart: '17:30' });
    expect(startToShow(r, undefined)).toBe('17:30');
  });

  it('treats a small gap as no gap', () => {
    expect(DRIFT_WORTH_SAYING).toBe(15);
    const r = routine({ preferredStart: '18:00' });
    const obs = observedStarts(plansWith(r.id, ['18:10', '18:10', '18:10']), [r], TODAY);
    expect(driftsMeaningfully(obs.get(r.id))).toBe(false);
    expect(startExplanation(r, obs.get(r.id), profile())).toBeNull();
  });
});

describe('the sentence that explains the gap', () => {
  it('names work where work is the reason — the sentence a coach would say', () => {
    const r = routine({ preferredStart: '17:30' });
    const obs = observedStarts(plansWith(r.id, ['18:45', '18:45', '18:45']), [r], TODAY);
    expect(startExplanation(r, obs.get(r.id), profile())).toBe(
      'You asked for 17:30, and you are at work until 18:30. It runs about 18:45.',
    );
  });

  it('says the day had no room where the reason is a crowded hour', () => {
    // 20:00 is after work, so work is not the explanation.
    const r = routine({ preferredStart: '20:00' });
    const obs = observedStarts(plansWith(r.id, ['21:30', '21:30', '21:30']), [r], TODAY);
    expect(startExplanation(r, obs.get(r.id), profile())).toMatch(/does not have room/);
  });

  it('says earlier when the plan moves it earlier', () => {
    const r = routine({ preferredStart: '21:00' });
    const obs = observedStarts(plansWith(r.id, ['19:00', '19:00', '19:00']), [r], TODAY);
    expect(startExplanation(r, obs.get(r.id), profile())).toMatch(/moves it earlier/);
  });

  it('does not blame work for a block carved out of the work day', () => {
    const r = routine({ preferredStart: '09:15', duringWork: true });
    const obs = observedStarts(plansWith(r.id, ['10:30', '10:30', '10:30']), [r], TODAY);
    expect(startExplanation(r, obs.get(r.id), profile())).not.toMatch(/at work until/);
  });

  it('never prints the stated time as if it were what happens', () => {
    const r = routine({ preferredStart: '17:30' });
    const obs = observedStarts(plansWith(r.id, ['18:45', '18:45', '18:45']), [r], TODAY);
    const said = startExplanation(r, obs.get(r.id), profile())!;
    // The real time must appear, and the asked-for one must be labelled
    // as asked for rather than stated bare.
    expect(said).toContain('18:45');
    expect(said).toMatch(/You asked for 17:30/);
  });
});

describe('the clash detector, corrected', () => {
  /**
   * As first shipped, `clashesWithWork` read `preferredStart` — so it
   * announced "5 things want a time you are at work" about times the
   * scheduler had already fixed. A false alarm is a worse failure than the
   * silence it replaced: it tells somebody their week is broken while the
   * week is being handled.
   */
  it('stops reporting a routine the plan already moves clear of work', () => {
    const r = routine({ preferredStart: '17:30' });
    const p = profile();
    expect(clashesWithWork([r], p)).toHaveLength(1);

    const obs = observedStarts(plansWith(r.id, ['18:45', '18:45', '18:45']), [r], TODAY);
    expect(clashesWithWork([r], p, obs)).toHaveLength(0);
  });

  it('still reports one that really does land inside work', () => {
    const r = routine({ preferredStart: '17:30' });
    const obs = observedStarts(plansWith(r.id, ['17:30', '17:30', '17:30']), [r], TODAY);
    expect(clashesWithWork([r], profile(), obs)).toHaveLength(1);
  });

  it('falls back to the stated time before there is evidence', () => {
    // Day one: the seed is all the app has, and flagging it is honest.
    const r = routine({ preferredStart: '17:30' });
    expect(clashesWithWork([r], profile(), new Map())).toHaveLength(1);
  });
});
