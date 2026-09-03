/**
 * The guard against the defect became the defect.
 *
 * The relationship pathway shrinks itself when someone says things are
 * hard or that there is no window — a person telling us it is bad does not
 * need three more calendar blocks, and that rule outranks the ladder. The
 * first implementation suppressed the ladder entirely, and the pathway
 * audit found what that cost: for 46% of relationship profiles all four
 * levels built something identical. The level did nothing, while the app
 * went on promising it did.
 *
 * Suppression means "add no calendar blocks", not "ignore the rung".
 */

import { PATHS } from '@/features/paths/definitions';
import { LEVEL_ORDER } from '@/features/paths/level';
import type { LifeProfile } from '@/types/domain';

const profile = {
  wakeTime: '06:30',
  sleepTime: '22:30',
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  priorities: ['relationship'],
  people: [{ id: 'p', name: 'Sam', relation: 'partner' }],
  trainingDaysPerWeek: 3,
  capacity: 'steady',
} as unknown as LifeProfile;

/**
 * The intake answers that map to each rung, alongside a temperature that
 * makes the pathway shrink itself.
 */
const buildAtEachLevel = (extra: Record<string, string>) =>
  LEVEL_ORDER.map((level) => {
    const answers = { ...extra, level };
    return PATHS.relationship.build(answers, profile);
  });

const shapeOf = (b: ReturnType<typeof PATHS.relationship.build>) => ({
  routines: b.routines.map((r) => r.title).sort(),
  minutes: b.routines.reduce((n, r) => n + r.durationMin * Math.max(1, r.days.length), 0),
  milestones: (b.goal.milestones ?? []).map((m) => m.title).sort(),
});

describe('a shrunk pathway still has rungs', () => {
  it('keeps the calendar untouched across levels when things are hard', () => {
    const builds = buildAtEachLevel({ temperature: 'hard' });
    const minutes = builds.map((b) => shapeOf(b).minutes);
    const routines = builds.map((b) => shapeOf(b).routines.join('|'));
    // The shrink is the point: no level buys more of the person's evenings.
    expect(new Set(minutes).size).toBe(1);
    expect(new Set(routines).size).toBe(1);
  });

  it('still changes what the level is ABOUT', () => {
    const builds = buildAtEachLevel({ temperature: 'hard' });
    const milestones = builds.map((b) => shapeOf(b).milestones.join('|'));
    // Four rungs, four different things being worked on.
    expect(new Set(milestones).size).toBe(LEVEL_ORDER.length);
  });

  it('does the same when there is no window rather than a hard patch', () => {
    const builds = buildAtEachLevel({ window: 'none' });
    expect(new Set(builds.map((b) => shapeOf(b).minutes)).size).toBe(1);
    expect(new Set(builds.map((b) => shapeOf(b).milestones.join('|'))).size).toBe(
      LEVEL_ORDER.length,
    );
  });

  it('still adds blocks for someone who did not say it was hard', () => {
    const builds = buildAtEachLevel({ temperature: 'good', window: 'after_bed' });
    const minutes = builds.map((b) => shapeOf(b).minutes);
    expect(new Set(minutes).size).toBeGreaterThan(1);
  });
});
