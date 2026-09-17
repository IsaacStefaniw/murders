/**
 * The two ladders that never met.
 *
 * A pathway has a level it SHOWS and a level it BUILDS FROM, and only one
 * of them ever moved.
 *
 * `pathLevelState` computes the rung from the log, and `LevelCard` prints
 * it: Foundation, Developing, Established, Advanced. Separately,
 * `levelFromAnswers` (definitions.ts:120) reads `answers.level` and hands
 * it to `withLadder`, which is what actually decides the practices in
 * somebody's week.
 *
 * Nothing ever wrote `answers.level`. Grepping the whole codebase found it
 * read in exactly one place and assigned in none. So `levelFromAnswers`
 * returned `'foundation'` for every person on every pathway forever, while
 * the card told them they were Established.
 *
 * The bitter part is that `withLadder` exists precisely to stop this. Its
 * docstring: "an audit of 7,000 profiles found 100% of builds identical
 * across all four levels in all seven pathways: LEVEL_BLURB promised the
 * user something specific changed at each rung and nothing did." The fix
 * for that was applied one layer down and then starved of its input.
 */

import { PATHS } from '@/features/paths/definitions';
import { LEVEL_ORDER } from '@/features/paths/level';
import type { LifeProfile } from '@/types/domain';

const profile = (): LifeProfile =>
  ({
    firstName: 'Isaac',
    priorities: ['health', 'family'],
    capacity: 'moderate',
    workDays: [1, 2, 3, 4, 5],
    workStart: '09:00',
    workEnd: '17:30',
    wakeTime: '06:30',
    sleepTime: '22:30',
    energyProfile: 'morning',
    trainingDaysPerWeek: 3,
    trainingPreference: 'mixed',
    people: [],
    moreOf: [],
    lessOf: [],
  }) as LifeProfile;

const INTAKE: Record<string, Record<string, string>> = {
  nutrition: { aim: 'energy', cooking: 'normal', trouble: 'evenings' },
  money: { mode: 'clarity', automation: 'yes' },
  work: { shape: 'deep', load: 'heavy' },
  recovery: { behaviour: 'doomscrolling', trigger: 'unsure', replacement: 'breathe' },
  relationship: { aim: 'closer', window: 'evenings' },
  family: { aim: 'present', ages: 'young' },
};

describe('the rung a person earned reaches the week they are handed', () => {
  /**
   * The regression test for the whole defect: build the same pathway at
   * each of the four rungs and check the plans are not all the same.
   * Before the fix `answers.level` was never set, so every caller got the
   * foundation build and this could not have been written at all.
   */
  it.each(Object.keys(INTAKE))('gives %s a different plan at a higher rung', (path) => {
    const built = LEVEL_ORDER.map((level) =>
      PATHS[path as keyof typeof PATHS].build({ ...INTAKE[path], level }, profile()),
    );
    /**
     * Routines AND milestones, because a rung is not obliged to deliver
     * through the calendar.
     *
     * The money ladder is the case that proves it, and its own comments
     * make the argument: "a 'monthly' hour scheduled every Sunday is a
     * monthly hour twelve times over. Routines have no cadence longer than
     * a week, so the month has to live in a milestone rather than in the
     * calendar — otherwise the title says one thing and the plan does
     * another." Its higher rungs add "Three months of expenses, banked"
     * and "A drawdown plan written down" and no weekly blocks at all.
     *
     * A first version of this test compared routine titles only and
     * reported money as a ladder that does nothing. It was the test that
     * was wrong.
     */
    const shape = (p: (typeof built)[number]) =>
      [
        ...p.routines.map((r) => `r:${r.title}`),
        ...(p.goal.milestones ?? []).map((m) => `m:${m.title}`),
      ]
        .sort()
        .join('|');
    // Not every rung has to differ from its neighbour, but the top must
    // differ from the bottom or the ladder is a label.
    expect(shape(built[3])).not.toBe(shape(built[0]));
  });

  it('delivers money through milestones, not phantom weekly blocks', () => {
    // Guards the reasoning above: if somebody "fixes" the money ladder by
    // adding a weekly routine for a quarterly review, this fails.
    const advanced = PATHS.money.build({ ...INTAKE.money, level: 'advanced' }, profile());
    const foundation = PATHS.money.build({ ...INTAKE.money, level: 'foundation' }, profile());
    expect(advanced.routines.map((r) => r.title).sort()).toEqual(
      foundation.routines.map((r) => r.title).sort(),
    );
    expect((advanced.goal.milestones ?? []).length).toBeGreaterThan(
      (foundation.goal.milestones ?? []).length,
    );
  });

  it('never takes practices away as somebody climbs', () => {
    // A rung that removed things would charge people for their own
    // consistency. `withLadder` merges; this proves it.
    for (const path of Object.keys(INTAKE)) {
      const low = new Set(
        PATHS[path as keyof typeof PATHS]
          .build({ ...INTAKE[path], level: 'foundation' }, profile())
          .routines.map((r) => r.title),
      );
      const high = new Set(
        PATHS[path as keyof typeof PATHS]
          .build({ ...INTAKE[path], level: 'advanced' }, profile())
          .routines.map((r) => r.title),
      );
      for (const title of low) expect(high.has(title)).toBe(true);
    }
  });

  it('treats an unknown or absent level as foundation, never as the heavy one', () => {
    // A person the app knows nothing about gets the thin programme. The
    // default has to fail safe in that direction.
    for (const path of Object.keys(INTAKE)) {
      const def = PATHS[path as keyof typeof PATHS];
      const absent = def.build({ ...INTAKE[path] }, profile()).routines.map((r) => r.title).sort();
      const foundation = def
        .build({ ...INTAKE[path], level: 'foundation' }, profile())
        .routines.map((r) => r.title)
        .sort();
      expect(absent).toEqual(foundation);

      const nonsense = def
        .build({ ...INTAKE[path], level: 'expert' }, profile())
        .routines.map((r) => r.title)
        .sort();
      expect(nonsense).toEqual(foundation);
    }
  });
});
