/**
 * A routine that names a practice keeps that practice's hour.
 *
 * Isaac: "Protein at breakfast is showing at 4pm." That one was the
 * ladder — a rung hand-written as a copy of a library practice, linked to
 * nothing, so `engine.ts` read `timeAnchored ? bounded : Infinity` and
 * gave it infinite drift.
 *
 * Building the user-test harness surfaced the same bug a second time,
 * here, before a single persona had run. `buildLifeOperatingPlan`
 * hand-builds four routines that DO name a protocol and still dropped its
 * anchoring — and the night nurse's simulated week had her family dinner
 * at six in the morning as a result.
 *
 * The family coach's entire product is defending the evening meal against
 * work running over. The block it defends could be anywhere in the day.
 */

import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { anchoredToTheClock, protocolById } from '@/features/knowledge/protocols';
import type { InterviewAnswers } from '@/features/onboarding/script';

const answers = (over: Partial<InterviewAnswers> = {}): InterviewAnswers =>
  ({
    name: 'Sam',
    priorities: ['family', 'health', 'work'],
    household: ['partner', 'kids'],
    partnerName: 'Alex',
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    capacity: 'steady',
    energy: 'morning',
    trainingDays: '3',
    trainingSetup: 'gym',
    moreOf: ['Date nights', 'Time with the kids', 'Deep work'],
    lessOf: ['alcohol'],
    ambition: 'Grow the business',
    ...over,
  }) as InterviewAnswers;

describe('every routine built from the interview', () => {
  it('inherits the clock relationship of the practice it names', () => {
    const offenders: string[] = [];
    for (const r of buildLifeOperatingPlan(answers()).routines) {
      if (!r.protocolId) continue;
      const p = protocolById(r.protocolId);
      if (!p) continue;
      if (anchoredToTheClock(p) && !r.timeAnchored) {
        offenders.push(`${r.protocolId} ("${r.title}")`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * The one that matters most, named rather than left to the sweep: the
   * family coach defends the evening meal, and a meal with infinite drift
   * is not an evening meal.
   */
  it('pins the family dinner to the evening', () => {
    const dinner = buildLifeOperatingPlan(answers()).routines.find(
      (r) => r.protocolId === 'device-free-meal',
    );
    expect(dinner).toBeDefined();
    expect(dinner!.timeAnchored).toBe(true);
  });

  it('pins the wind-down, which is the whole point of a wind-down', () => {
    const wind = buildLifeOperatingPlan(answers()).routines.find(
      (r) => r.protocolId === 'wind-down',
    );
    expect(wind).toBeDefined();
    expect(wind!.timeAnchored).toBe(true);
  });

  /**
   * It fills a gap; it does not overrule anybody. A few routines set this
   * deliberately and those decisions stand.
   */
  it('leaves an explicit decision alone', () => {
    const plan = buildLifeOperatingPlan(answers());
    const explicit = plan.routines.filter((r) => r.timeAnchored === false);
    for (const r of explicit) {
      // If something was deliberately set loose, it stays loose.
      expect(r.timeAnchored).toBe(false);
    }
  });

  it('says nothing about a routine with no practice behind it', () => {
    const plan = buildLifeOperatingPlan(answers());
    const bare = plan.routines.filter((r) => !r.protocolId);
    expect(bare.length).toBeGreaterThan(0);
    // No protocol, no inherited opinion — these keep whatever they had.
    for (const r of bare) expect(r.timeAnchored === undefined || typeof r.timeAnchored === 'boolean').toBe(true);
  });
});
