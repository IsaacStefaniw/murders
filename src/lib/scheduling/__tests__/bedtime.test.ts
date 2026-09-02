/**
 * Zone 2 cardio at 8:45pm.
 *
 * The preferred window was 17:45–19:15 and the day was full, so the
 * placement pass's drift moved it a full window-length later and put a
 * moderate cardio session ninety minutes before bed. Drift is usually the
 * right answer — an errand at 20:00 instead of 12:45 is still the errand —
 * but some things have a bound that a busy day is not a reason to cross.
 */

import { buildDailyPlan } from '@/lib/scheduling/engine';
import { generateDailyPlan } from '@/features/planner/generate';
import { protocolById, toRoutine } from '@/features/knowledge/protocols';
import { durationMinutes, toMinutes } from '@/lib/dates';
import type { LifeProfile, Routine } from '@/types/domain';

const profile = {
  wakeTime: '06:30',
  sleepTime: '22:30',
  capacity: 'steady',
  workDays: [],
  priorities: [],
} as unknown as LifeProfile;

/** A day where the only real room left is the late evening. */
const packedDay = (routineIds: string[]) => {
  const routines = routineIds.map((id) => ({
    ...toRoutine(protocolById(id)!, profile),
    days: [0, 1, 2, 3, 4, 5, 6] as never,
  }));
  return buildDailyPlan({
    date: '2026-09-02',
    wakeTime: profile.wakeTime,
    sleepTime: profile.sleepTime,
    fixed: [{ title: 'Work', start: '07:30', end: '19:30', area: 'work' }],
    routines,
    reservedFreeFraction: 0,
  });
};

describe('nothing alerting gets scheduled up against bedtime', () => {
  it('moves a late Zone 2 to the morning instead of putting it before bed', () => {
    const zone2 = protocolById('zone2')!;
    expect(zone2.finishBeforeSleepMin).toBe(60);

    // A routine built by hand with an evening preference, on a day where
    // work runs to 21:00 — which is how the reported one got there.
    // toRoutine copies the bound; the hand-built producers did not, so it
    // is stamped at generation instead.
    const evening: Routine = {
      ...toRoutine(zone2, profile),
      preferredStart: '21:10',
      preferredEnd: '22:10',
      days: [0, 1, 2, 3, 4, 5, 6],
    };
    const plan = generateDailyPlan(
      profile,
      [evening],
      '2026-09-02',
      [{ title: 'Work', start: '07:30', end: '21:00', area: 'work' }],
    );
    const item = plan.items.find((i) => i.title === zone2.title);
    // Unplaced would satisfy the bound and fail the person: without the
    // earlier drift this is where the session was simply lost, and stalled
    // goals went from a quarter to a third. It must still be on the day.
    expect(item).toBeDefined();
    // Was 21:15–21:55, forty minutes before bed.
    const mustFinishBy = toMinutes(profile.sleepTime) - zone2.finishBeforeSleepMin!;
    expect(toMinutes(item!.end)).toBeLessThanOrEqual(mustFinishBy);
  });

  it('holds the bound for every protocol that declares one', () => {
    const bounded = ['zone2', 'vo2-intervals', 'strength', 'cold-finish', 'sauna'];
    const plan = packedDay(bounded);
    for (const id of bounded) {
      const p = protocolById(id)!;
      const item = plan.items.find((i) => i.title === p.title);
      if (!item) continue;
      const mustFinishBy = toMinutes(profile.sleepTime) - p.finishBeforeSleepMin!;
      expect({ id, end: toMinutes(item.end) }).toEqual({
        id,
        end: expect.any(Number),
      });
      expect(toMinutes(item.end)).toBeLessThanOrEqual(mustFinishBy);
    }
  });

  it('still places things with no bound wherever they fit', () => {
    // The bound is opt-in; an unbounded routine keeps its old freedom.
    const walk = protocolById('daily-walk')!;
    expect(walk.finishBeforeSleepMin).toBeUndefined();
    const plan = packedDay(['daily-walk']);
    const item = plan.items.find((i) => i.title === walk.title);
    if (item) expect(durationMinutes(item.start, item.end)).toBeGreaterThan(0);
  });
});
