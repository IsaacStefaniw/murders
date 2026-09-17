import { buildWeeklyChanges, droppableRoutines } from '@/features/review/weeklyChanges';
import { PROTOCOLS, protocolById } from '@/features/knowledge/protocols';
import type { DailyPlan, Routine } from '@/types/domain';

const reading: Routine = {
  id: 'read',
  title: 'Read',
  area: 'growth',
  days: [1, 2, 3, 4],
  durationMin: 20,
  preferredStart: '21:25',
  preferredEnd: '21:45',
  energy: 'evening',
  flexible: true,
  protected: false,
  tier: 'could',
  active: true,
};

function planFor(date: string, status: 'completed' | 'skipped'): DailyPlan {
  return {
    date,
    items: [
      {
        id: `r-${date}`,
        date,
        start: '21:25',
        end: '21:45',
        title: 'Read',
        area: 'growth',
        tier: 'could',
        status,
        routineId: 'read',
        fixed: false,
      },
    ],
  };
}

describe('buildWeeklyChanges', () => {
  it('recovery-first: offers to shrink a struggling routine before resting it', () => {
    const plans = {
      '2026-09-07': planFor('2026-09-07', 'skipped'),
      '2026-09-08': planFor('2026-09-08', 'skipped'),
      '2026-09-09': planFor('2026-09-09', 'skipped'),
    };
    const proposal = buildWeeklyChanges({ weekStart: '2026-09-07', plans, routines: [reading] });
    expect(proposal.noticed.join(' ')).toContain('0 of 3');
    expect(proposal.changes).toHaveLength(1);
    expect(proposal.changes[0]).toMatchObject({
      kind: 'shorten_routine',
      routineId: 'read',
      payload: { newDurationMin: 15 },
    });
    expect(proposal.changes[0].description).not.toMatch(/fail|should have/i);
  });

  it('rests a struggling routine only once it is already at its floor', () => {
    const tiny: Routine = { ...reading, durationMin: 10 };
    const plans = {
      '2026-09-07': planFor('2026-09-07', 'skipped'),
      '2026-09-08': planFor('2026-09-08', 'skipped'),
      '2026-09-09': planFor('2026-09-09', 'skipped'),
    };
    const proposal = buildWeeklyChanges({ weekStart: '2026-09-07', plans, routines: [tiny] });
    expect(proposal.changes[0]).toMatchObject({ kind: 'deactivate_routine', routineId: 'read' });
  });

  it('proposes nothing when the week actually happened', () => {
    const plans = {
      '2026-09-07': planFor('2026-09-07', 'completed'),
      '2026-09-08': planFor('2026-09-08', 'completed'),
    };
    const proposal = buildWeeklyChanges({ weekStart: '2026-09-07', plans, routines: [reading] });
    expect(proposal.changes).toHaveLength(0);
  });

  it('never proposes dropping protected or must routines', () => {
    const dinner: Routine = {
      ...reading,
      id: 'dinner',
      title: 'Family dinner',
      protected: true,
      tier: 'must',
    };
    const plans = {
      '2026-09-07': {
        date: '2026-09-07',
        items: [
          {
            id: 'd1',
            date: '2026-09-07',
            start: '18:00',
            end: '18:45',
            title: 'Family dinner',
            area: 'family' as const,
            tier: 'must' as const,
            status: 'skipped' as const,
            routineId: 'dinner',
            fixed: false,
          },
          {
            id: 'd2',
            date: '2026-09-07',
            start: '19:00',
            end: '19:45',
            title: 'Family dinner',
            area: 'family' as const,
            tier: 'must' as const,
            status: 'skipped' as const,
            routineId: 'dinner',
            fixed: false,
          },
        ],
      },
    };
    const proposal = buildWeeklyChanges({ weekStart: '2026-09-07', plans, routines: [dinner] });
    expect(proposal.changes).toHaveLength(0);
  });
});

/**
 * The flag that was honoured everywhere except the two places that take
 * something away.
 *
 * `Protocol.neverNag` is written for the person three weeks after a
 * bereavement or a redundancy. The suggestion pipeline reads it, the
 * notifier reads it, and `droppableRoutines` — which feeds both the weekly
 * proposal and the End of Week grid's "Drop it" — never read `protocolId`
 * at all. `transition-anchor` carries a comment saying it is the one thing
 * meant to survive minimal-capacity trimming, and the app would shrink it
 * to the floor in week one and offer to rest it in week two.
 */
describe('practices a skipped day says nothing about', () => {
  const asRoutine = (protocolId: string): Routine => ({
    id: `r-${protocolId}`,
    protocolId,
    title: protocolById(protocolId)!.title,
    area: 'health',
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 15,
    preferredStart: '07:00',
    preferredEnd: '07:15',
    energy: 'morning',
    flexible: true,
    protected: false,
    tier: 'should',
    active: true,
  });

  it('is never offered for rest or for shrinking', () => {
    const anchor = asRoutine('transition-anchor');
    expect(droppableRoutines([anchor])).toEqual([]);
  });

  it('holds for every neverNag practice in the library, not just that one', () => {
    const flagged = PROTOCOLS.filter((p) => p.neverNag);
    expect(flagged.length).toBeGreaterThan(5);
    const routines = flagged.map((p) => asRoutine(p.id));
    expect(droppableRoutines(routines)).toEqual([]);
  });

  it('still allows an ordinary routine to be rested', () => {
    expect(droppableRoutines([reading]).map((r) => r.id)).toEqual(['read']);
  });

  /**
   * The shrink branch reads the same list, so the exemption has to cover
   * it: a fixed point cut in half has stopped being a fixed point.
   */
  it('produces no change at all from a week of misses', () => {
    const anchor = asRoutine('transition-anchor');
    const plans: Record<string, DailyPlan> = {};
    for (let i = 0; i < 7; i++) {
      const date = `2026-09-${String(7 + i).padStart(2, '0')}`;
      plans[date] = {
        date,
        items: [
          {
            id: `pi-${i}`,
            date,
            start: '07:00',
            end: '07:15',
            title: anchor.title,
            area: 'health',
            tier: 'should',
            status: i < 2 ? 'completed' : 'skipped',
            fixed: false,
            routineId: anchor.id,
          },
        ],
      } as DailyPlan;
    }
    const proposal = buildWeeklyChanges({
      weekStart: '2026-09-07',
      plans,
      routines: [anchor],
    });
    expect(proposal.changes.filter((c) => c.routineId === anchor.id)).toEqual([]);
  });
});
