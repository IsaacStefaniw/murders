import { PATHS, PATH_ORDER, type PathId } from '@/features/paths/definitions';
import { LEVEL_BLURB, LEVEL_ORDER, type PathLevel } from '@/features/paths/level';
import { rungFor } from '@/features/paths/programme';

/**
 * A level that promises something and changes nothing.
 *
 * The pathway audit found seven of the twenty-one upward steps adding no
 * practice at all, and the causes were not the same:
 *
 *   A duplicate.  Training's two middle rungs both added an aerobic
 *                 session the pathway already prescribed, so `withLadder`
 *                 dropped them — correctly — and the rung silently became
 *                 nothing. Family's middle rung had the same shape. These
 *                 were bugs and are fixed.
 *
 *   A cadence.    Money's three upper rungs and relationship's top one
 *                 define no routine on purpose: a routine has no cadence
 *                 longer than a week, so a monthly position check
 *                 scheduled weekly is that check twelve times over. Those
 *                 rungs move the milestones and the framing instead, which
 *                 is honest, and the comments in `programme.ts` say so.
 *
 * So the rule is not "every rung adds a routine". It is that every rung
 * changes SOMETHING a person can see, and that a rung which defines a
 * routine must actually deliver it.
 */

const ABOVE = LEVEL_ORDER.slice(1);

/** Levels that deliberately move milestones rather than the calendar. */
const CADENCE_ONLY: Partial<Record<PathId, PathLevel[]>> = {
  money: ['developing', 'established', 'advanced'],
  relationship: ['advanced'],
};

describe('every rung changes something', () => {
  for (const path of PATH_ORDER) {
    const def = PATHS[path];
    const built = (level: PathLevel) => def.build({ level }, null);

    for (const level of ABOVE) {
      const below = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) - 1];

      it(`${path} · ${level} adds a practice, or moves the milestones on purpose`, () => {
        const before = built(below);
        const after = built(level);
        const beforeTitles = new Set(before.routines.map((r) => r.title));
        const newRoutines = after.routines.filter((r) => !beforeTitles.has(r.title));
        const newMilestones =
          (after.goal.milestones?.length ?? 0) - (before.goal.milestones?.length ?? 0);

        if (CADENCE_ONLY[path]?.includes(level)) {
          // Allowed to add no routine, but never allowed to be a no-op.
          expect(newMilestones).toBeGreaterThan(0);
          expect(rungFor(path, level).routines).toHaveLength(0);
        } else {
          expect(newRoutines.length).toBeGreaterThan(0);
        }
      });

      it(`${path} · ${level} delivers every routine its rung defines`, () => {
        // The exact failure that made three rungs silent: a rung defined a
        // routine, the deduplication dropped it as already covered, and
        // nothing said so. A rung that defines a practice the pathway
        // already has is a rung that needs different content.
        const defined = rungFor(path, level).routines;
        if (defined.length === 0) return;
        const titles = new Set(built(level).routines.map((r) => r.title));
        for (const r of defined) expect(titles.has(r.title)).toBe(true);
      });
    }
  }
});

describe('the level copy is not writing cheques the build does not cash', () => {
  it('every path and level has a blurb describing what changed', () => {
    for (const path of PATH_ORDER) {
      for (const level of LEVEL_ORDER) {
        expect(LEVEL_BLURB[path][level].length).toBeGreaterThan(20);
      }
    }
  });
});
