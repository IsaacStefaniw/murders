/**
 * The ordering rule, pinned.
 *
 * A coach that offers rung four to somebody whose rung one is not solid is
 * the reason a person who has listened to forty hours of podcasts still
 * cannot start. These tests hold the line.
 */
import { coverage, isDormant, offerableRungs, rungFor, type Ladder } from '@/features/paths/ladder';
import { DESK_WORK_LADDER, SHIFT_WORK_LADDER, WORK_LADDERS } from '@/features/paths/ladders.work';

/** A ladder built only from practices that really exist, so nothing is dormant. */
const testLadder: Ladder = {
  id: 'test',
  pillar: 'leadership',
  variant: 'test',
  whenStuck: 'stuck',
  rungs: [
    { n: 1, title: 'One', protocolIds: ['shutdown-ritual'] },
    { n: 2, title: 'Two', protocolIds: ['strength'] },
    { n: 3, title: 'Three', protocolIds: ['morning-light'] },
  ],
};

const solidOnly =
  (...ids: string[]) =>
  (id: string) =>
    ids.includes(id);

describe('the coach offers one rung, and never one above it', () => {
  it('offers rung one when nothing is solid', () => {
    expect(rungFor(testLadder, solidOnly())?.n).toBe(1);
  });

  it('offers rung two once rung one is solid', () => {
    expect(rungFor(testLadder, solidOnly('shutdown-ritual'))?.n).toBe(2);
  });

  it('still offers rung one when rungs two AND three are solid but one is not', () => {
    // The whole point. Doing the advanced thing does not unlock it; the
    // rung below has to hold first, because that is why it is below.
    const solid = solidOnly('strength', 'morning-light');
    expect(rungFor(testLadder, solid)?.n).toBe(1);
  });

  it('returns null when the person is at the top', () => {
    const solid = solidOnly('shutdown-ritual', 'strength', 'morning-light');
    expect(rungFor(testLadder, solid)).toBeNull();
  });

  it('counts a rung solid when ANY of its practices is', () => {
    const either: Ladder = {
      ...testLadder,
      rungs: [{ n: 1, title: 'One', protocolIds: ['shutdown-ritual', 'strength'] }],
    };
    expect(rungFor(either, solidOnly('strength'))).toBeNull();
  });
});

describe('rungs whose practices have not merged yet', () => {
  it('skips a dormant rung rather than offering an empty step', () => {
    const withDormant: Ladder = {
      ...testLadder,
      rungs: [
        { n: 1, title: 'Not merged', protocolIds: ['does-not-exist-yet'] },
        { n: 2, title: 'Real', protocolIds: ['shutdown-ritual'] },
      ],
    };
    expect(isDormant(withDormant.rungs[0])).toBe(true);
    expect(offerableRungs(withDormant)).toHaveLength(1);
    expect(rungFor(withDormant, solidOnly())?.title).toBe('Real');
  });
});

describe('the encoded work ladders', () => {
  it('has three variants, because half this audience does not set its hours', () => {
    expect(WORK_LADDERS.map((l) => l.id)).toEqual([
      'work-desk',
      'work-shift',
      'work-transition',
    ]);
  });

  it('never chases anything on the between-jobs ladder', () => {
    expect(WORK_LADDERS.find((l) => l.id === 'work-transition')?.neverNag).toBe(true);
  });

  it('starts the desk ladder at the end of the working day', () => {
    // The one rung that is live today, and the one everything else sits on.
    expect(rungFor(DESK_WORK_LADDER, solidOnly())?.n).toBe(1);
    expect(isDormant(DESK_WORK_LADDER.rungs[0])).toBe(false);
  });

  it('does not start the shift ladder there, because a nurse cannot', () => {
    const shiftFirst = rungFor(SHIFT_WORK_LADDER, solidOnly());
    expect(shiftFirst?.title).not.toBe('The day has an end');
  });

  it('reports how much of each ladder the shipped library can support', () => {
    // Documents the gap rather than hiding it: most of this is waiting on
    // the research merge, and the numbers should move when it lands.
    for (const ladder of WORK_LADDERS) {
      const c = coverage(ladder);
      expect(c.total).toBeGreaterThan(0);
      expect(c.live).toBeLessThanOrEqual(c.total);
    }
  });
});
