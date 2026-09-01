import { returnSummary } from '@/features/today/returning';
import type { DailyPlan, PlanItem } from '@/types/domain';

const NOW = new Date('2026-03-20T08:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400e3).toISOString();

const plan = (items: Partial<PlanItem>[]): DailyPlan => ({
  date: '2026-03-20',
  items: items.map((patch, i) => ({
    id: `i${i}`,
    date: '2026-03-20',
    start: '07:00',
    end: '07:30',
    title: 'Something',
    area: 'health',
    tier: 'should',
    status: 'planned',
    fixed: false,
    ...patch,
  })),
});

const summary = (over: Partial<Parameters<typeof returnSummary>[0]> = {}) =>
  returnSummary({
    lastOpenedAt: daysAgo(6),
    sessionsLogged: 11,
    weeksLogged: 4,
    today: plan([{ title: 'Squat session', start: '17:30' }]),
    now: NOW,
    ...over,
  });

describe('when this appears at all', () => {
  it('does not, for someone who was here yesterday', () => {
    expect(summary({ lastOpenedAt: daysAgo(1) })).toBeNull();
  });

  it('does not, for someone who has never been here', () => {
    expect(summary({ lastOpenedAt: null })).toBeNull();
  });

  it('does, after a real gap', () => {
    expect(summary({ lastOpenedAt: daysAgo(4) })?.daysAway).toBe(4);
  });
});

/**
 * The rule this whole module exists for. The morning after an absence is
 * when people delete a habit app, and what almost every one of them shows
 * is a broken streak and a tally of what was missed.
 */
describe('what it refuses to say', () => {
  it('never counts what was missed', () => {
    const text = JSON.stringify(summary());
    expect(text).not.toMatch(/missed|behind|streak|broken|lost|failed/i);
  });

  it('leads with reassurance rather than a reprimand', () => {
    expect(summary()?.headline).toBe('6 days away. Nothing to catch up on.');
  });
});

describe('what it does say', () => {
  /**
   * Levels and logged work do not decay, because they record work that
   * genuinely happened. Being told your eleven sessions are still eleven
   * sessions is the exact opposite of a broken streak.
   */
  it('names what survived the absence, first', () => {
    expect(summary()?.lines[0]).toContain('11 logged sessions across 4 weeks are still there');
  });

  it('skips that line for someone with nothing logged yet', () => {
    const lines = summary({ sessionsLogged: 0 })!.lines;
    expect(lines.some((l) => l.includes('still there'))).toBe(false);
  });

  it('points at the next thing rather than the whole day', () => {
    expect(summary()?.lines.at(-1)).toBe('Today has 1 thing on it. The next is Squat session at 17:30.');
  });

  it('offers a starting point when the day is empty', () => {
    expect(summary({ today: plan([]) })?.lines.at(-1)).toContain('One thing is a fine place to start');
  });

  it('does not count things already done as still waiting', () => {
    const done = plan([{ status: 'completed' }, { title: 'Walk', start: '18:00' }]);
    expect(summary({ today: done })?.lines.at(-1)).toContain('1 thing');
  });
});

/**
 * A week built a fortnight ago is fiction, and showing it as live is how
 * the app loses the argument about whether it understands your actual life.
 */
describe('the stale plan', () => {
  it('is admitted to after a long enough gap', () => {
    const s = summary({ lastOpenedAt: daysAgo(9) })!;
    expect(s.planIsStale).toBe(true);
    expect(s.lines.some((l) => l.includes('out of date'))).toBe(true);
  });

  it('is not claimed after a short one, where the plan is still about this life', () => {
    expect(summary({ lastOpenedAt: daysAgo(3) })?.planIsStale).toBe(false);
  });
});
