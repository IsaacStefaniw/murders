/**
 * The top rung six coaches could never reach.
 *
 * `earnedLevel` read `if (level === 'advanced' && !evidence.standardsMet)
 * break`, with no test for whether the pathway HAS a standard to meet.
 * `standardsMet` is only ever computed by `trainingEvidence`;
 * `completionEvidence`, which the other six use, returns false by
 * construction. So `advanced` was not difficult for nutrition, money,
 * work, recovery, relationship and family — it was unreachable.
 *
 * Measured before the fix was written: two years of perfect daily
 * adherence left all six at `established`, and the sentence each of them
 * printed on its own hub was "Advanced also needs the strength standards
 * for this level" — the default `standardText`, leaking training's
 * vocabulary into the coach whose practices are date night and reading to
 * your kids.
 *
 * Two docstrings in `level.ts` disagreed, which is how it survived.
 * `LevelEvidence.standardsMet`: "Pathways without one pass `true` and are
 * gated on volume alone." `completionEvidence`: "`standardsMet` is false
 * by construction — there is nothing to prove." Both are fair readings of
 * an ambiguous name, and the consumer took the one meaning "blocked
 * forever".
 */

import {
  completionEvidence,
  earnedLevel,
  levelFor,
  levelProgress,
  type LevelEvidence,
} from '@/features/paths/level';
import type { PathId } from '@/features/paths/definitions';

const SIX: PathId[] = ['nutrition', 'money', 'work', 'recovery', 'relationship', 'family'];

/** A person who did the work `everyN` days for `weeks` weeks. */
const log = (weeks: number, everyN = 2): LevelEvidence => {
  const dates: string[] = [];
  const start = new Date('2024-01-01').getTime();
  for (let i = 0; i < weeks * 7; i += everyN) {
    dates.push(new Date(start + i * 86400e3).toISOString().slice(0, 10));
  }
  return completionEvidence(dates);
};

describe('a pathway with no standard to prove', () => {
  it('can reach its own top rung', () => {
    // A year at three a week. Before this, every one of these was
    // `established` and stayed there forever.
    const ev = log(52);
    for (const path of SIX) {
      expect(earnedLevel(path, ev)).toBe('advanced');
    }
  });

  it('is never told it needs strength standards', () => {
    // The family coach said this. Out loud, on its own hub, as the answer
    // to "what comes next".
    const ev = log(52);
    for (const path of SIX) {
      const progress = levelProgress(path, levelFor(path, null, ev, null), ev);
      expect(progress.blockedBy).toBeNull();
      expect(progress.text).not.toMatch(/strength/i);
    }
  });

  it('still has to earn it — eight months or more of real work', () => {
    // A rung anybody reaches in a month is not a rung. These gates are
    // written and they are not soft: nutrition wants 90 sessions across
    // 32 weeks, family 40 weeks.
    const oneMonth = log(4);
    for (const path of SIX) {
      expect(earnedLevel(path, oneMonth)).not.toBe('advanced');
    }
    const threeMonths = log(12);
    for (const path of SIX) {
      expect(earnedLevel(path, threeMonths)).not.toBe('advanced');
    }
  });

  it('climbs in order, without skipping a rung', () => {
    expect(earnedLevel('nutrition', log(1))).toBe('foundation');
    expect(earnedLevel('nutrition', log(4))).toBe('developing');
    expect(earnedLevel('nutrition', log(12))).toBe('established');
    expect(earnedLevel('nutrition', log(52))).toBe('advanced');
  });
});

/**
 * The gate exists for a reason and it still holds where the reason
 * applies. An advanced training block carries top singles and an
 * overreach week, and handing those to somebody whose log does not
 * support them is the one case in this file with a physical cost.
 */
describe('training, which does have a standard', () => {
  it('still refuses the top rung on volume alone', () => {
    const ev: LevelEvidence = { sessions: 500, weeks: 100, standardsMet: false };
    expect(earnedLevel('training', ev)).not.toBe('advanced');
  });

  it('opens it once the lifts back it up', () => {
    const ev: LevelEvidence = { sessions: 500, weeks: 100, standardsMet: true };
    expect(earnedLevel('training', ev)).toBe('advanced');
  });

  it('still says what is missing, in its own vocabulary', () => {
    const ev: LevelEvidence = { sessions: 500, weeks: 100, standardsMet: false };
    const progress = levelProgress('training', 'established', ev, 'the strength standards');
    expect(progress.blockedBy).toBe('the strength standards');
  });
});
