/**
 * Protein at breakfast, at four in the afternoon.
 *
 * Isaac, from his own plan: "Protein at breakfast is showing at 4pm."
 *
 * `engine.ts` says why, in one line:
 *
 *     const drift = routine.timeAnchored ? bounded : Infinity;
 *
 * with the comment "any hour will do, and an errand done at 20:00 instead
 * of 12:45 is still the errand". Right for an errand, wrong for a meal —
 * and nothing in the ladder ever said which was which. Of twenty-four rung
 * routines not one carried `timeAnchored`, so every one had infinite
 * drift. When the morning filled up, breakfast went wherever there was
 * room.
 *
 * The library knew. `protein-breakfast` is wake-anchored and `toRoutine`
 * gives it `timeAnchored: true`. The nutrition rung was a hand-written
 * copy of that practice, linked to nothing, so it inherited none of it —
 * and lost the safety line and the evidence grade at the same time.
 */

import { ladderFor } from '@/features/paths/programme';
import { protocolById } from '@/features/knowledge/protocols';
import { generateDailyPlan } from '@/features/planner/generate';
import { toMinutes } from '@/lib/dates';
import type { FixedCommitment } from '@/lib/scheduling/engine';
import type { LifeProfile, Routine } from '@/types/domain';

const profile = {
  firstName: 'Isaac',
  priorities: ['health'],
  capacity: 'steady',
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'mixed',
  people: [],
  moreOf: [],
  lessOf: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as unknown as LifeProfile;

const breakfast = (): Routine => {
  const built = ladderFor('nutrition', 'foundation', profile, 'g-1');
  return built.routines.find((r) => r.title === 'Protein at breakfast')!;
};

describe('the rung the ladder builds', () => {
  it('names the practice the library already had', () => {
    // Without the link there is no anchoring, no safety line and no
    // evidence grade — three things lost to a hand-written copy.
    expect(breakfast().protocolId).toBe('protein-breakfast');
    expect(protocolById('protein-breakfast')?.safety).toBeTruthy();
  });

  it('inherits that the hour is part of what it is', () => {
    expect(breakfast().timeAnchored).toBe(true);
  });

  it('keeps its own breakfast window rather than a wake-time default', () => {
    expect(breakfast().preferredStart).toBe('07:00');
    expect(breakfast().preferredEnd).toBe('09:30');
  });
});

/**
 * The bug as Isaac met it: a morning with no room in it.
 */
describe('a morning that is already full', () => {
  /**
   * Isaac's own shape, through the real planner rather than the engine:
   * a long immovable block straight through the breakfast window, which is
   * exactly what a 9am start plus an early meeting does.
   */
  const meetings: FixedCommitment[] = [
    { title: 'Immovable', start: '06:30', end: '11:00' },
  ];

  const placed = (fixed: FixedCommitment[]) =>
    generateDailyPlan(profile, [breakfast()], '2026-09-17', fixed).items.find(
      (i) => i.title === 'Protein at breakfast',
    );

  it('does not put breakfast in the afternoon', () => {
    const item = placed(meetings);
    // It may not be placed at all — that is an honest answer, and the
    // unplaced list is where the app says so. What it must never do is
    // land after lunch and still call itself breakfast.
    if (item) expect(toMinutes(item.start)).toBeLessThan(toMinutes('12:00'));
  });

  it('lands in the morning when the morning has room', () => {
    const item = placed([]);
    expect(item).toBeDefined();
    expect(toMinutes(item!.start)).toBeGreaterThanOrEqual(toMinutes('06:30'));
    expect(toMinutes(item!.start)).toBeLessThanOrEqual(toMinutes('10:00'));
  });
});

/**
 * The rule, so the next rung added to the ladder has to make the decision
 * rather than inherit infinite drift by omission.
 */
describe('every rung shaped by the clock', () => {
  const CLOCK_SHAPED = [
    ['nutrition', 'foundation', 'Protein at breakfast'],
    ['nutrition', 'developing', 'Weekly weigh-in — the trend, not the number'],
    ['recovery', 'developing', 'Evening check — did the moment come, what happened'],
  ] as const;

  it.each(CLOCK_SHAPED)('%s/%s — %s is anchored', (path, level, title) => {
    const built = ladderFor(path, level, profile, 'g-1');
    const r = built.routines.find((x) => x.title === title);
    expect(r).toBeDefined();
    expect(r!.timeAnchored).toBe(true);
  });

  /**
   * And the other side of it. Anchoring everything would make the
   * scheduler brittle in the opposite direction — most rungs are reviews
   * and planning blocks, and a review at ten instead of five is still the
   * review.
   */
  it('leaves a review free to move', () => {
    const built = ladderFor('training', 'advanced', profile, 'g-1');
    const review = built.routines.find((r) => /Block review/.test(r.title));
    expect(review).toBeDefined();
    expect(review!.timeAnchored).toBeFalsy();
  });
});
