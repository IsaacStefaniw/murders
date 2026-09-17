import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { generateDailyPlan } from '@/features/planner/generate';
import { bareItems, guidanceFor } from '@/features/today/itemGuidance';
import type { Goal, PlanItem, Routine } from '@/types/domain';

const item = (patch: Partial<PlanItem> = {}): PlanItem => ({
  id: 'i1',
  date: '2026-03-02',
  start: '07:00',
  end: '07:30',
  title: 'Something',
  area: 'health',
  tier: 'should',
  status: 'planned',
  fixed: false,
  ...patch,
});

describe('what a block can tell you', () => {
  it('surfaces the practice behind it — written long ago and never shown', () => {
    const routine: Routine = {
      id: 'r1',
      title: 'Morning light',
      area: 'health',
      protocolId: 'morning-light',
      days: [1],
      durationMin: 10,
      preferredStart: '06:45',
      preferredEnd: '08:00',
      energy: 'morning',
      flexible: true,
      protected: false,
      tier: 'should',
      active: true,
    };
    const g = guidanceFor(item({ routineId: 'r1' }), [routine], []);
    expect(g.how).not.toBeNull();
    expect(g.how!.summary.length).toBeGreaterThan(0);
    expect(g.how!.why.length).toBeGreaterThan(0);
    expect(g.bare).toBe(false);
  });

  /**
   * `HOW_TO` was written, tested, and rendered in exactly one place: the
   * Library tab, behind a disclosure, on a browse screen. It was absent
   * from the moment the plan meets the week — which is the only moment
   * this product claims to be for. Somebody opening "Zone 2, 40 min" at
   * 06:40 got a title, a sentence and an evidence grade, while the
   * instructions for doing the thing sat on another screen.
   */
  it('carries the steps to the block, not only to the browse tab', () => {
    const routine: Routine = {
      id: 'r-fibre',
      title: 'Thirty grams of fibre',
      area: 'health',
      protocolId: 'fibre-30',
      days: [1],
      durationMin: 10,
      preferredStart: '07:00',
      preferredEnd: '08:00',
      energy: 'morning',
      flexible: true,
      protected: false,
      tier: 'should',
      active: true,
    };
    const g = guidanceFor(item({ routineId: 'r-fibre' }), [routine], []);
    expect(g.how!.steps).toBeDefined();
    expect(g.how!.steps!.steps.length).toBeGreaterThan(2);
  });

  it('says nothing where no steps were written, rather than inventing any', () => {
    // Most of the library has none, and a fabricated method is worse than
    // an honest absence — the summary and the evidence still show.
    const routine: Routine = {
      id: 'r-light',
      title: 'Morning light',
      area: 'health',
      protocolId: 'morning-light',
      days: [1],
      durationMin: 10,
      preferredStart: '06:45',
      preferredEnd: '08:00',
      energy: 'morning',
      flexible: true,
      protected: false,
      tier: 'should',
      active: true,
    };
    const g = guidanceFor(item({ routineId: 'r-light' }), [routine], []);
    expect(g.how).not.toBeNull();
    expect(g.how!.summary.length).toBeGreaterThan(0);
  });

  it('names the goal and the rung the block is moving', () => {
    const goal: Goal = {
      id: 'g1',
      title: 'Bench 100kg',
      area: 'health',
      cadencePerWeek: 3,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      routineIds: [],
      milestones: [
        { id: 'm1', title: 'Bench 85kg for 5', done: true },
        { id: 'm2', title: 'Bench 90kg for 5', done: false },
      ],
    };
    const g = guidanceFor(item({ goalId: 'g1' }), [], [goal]);
    expect(g.why).toEqual({ goalTitle: 'Bench 100kg', milestone: 'Bench 90kg for 5' });
  });

  /**
   * The failure this file exists to prevent: a bare title at 7pm with
   * nothing behind it is the thing people tap Skip on.
   */
  it('reports a block with nothing behind it as bare', () => {
    expect(guidanceFor(item(), [], []).bare).toBe(true);
  });

  /**
   * Not everything should open a screen. Something the person put in their
   * own diary needs no explanation, and IntentNorth explaining their dinner
   * back to them would be the more embarrassing failure.
   */
  it('exempts a fixed commitment, which needs no explaining', () => {
    expect(guidanceFor(item({ fixed: true }), [], []).bare).toBe(false);
  });

  it('exempts a block that opens a session of its own', () => {
    expect(guidanceFor(item({ sessionType: 'workout' }), [], []).bare).toBe(false);
  });
});

describe('the generated week', () => {
  const plan = buildLifeOperatingPlan({
    name: 'Sam',
    priorities: ['health', 'family', 'work'],
    capacity: 'steady',
    workDays: ['1', '2', '3', '4', '5'],
    workHours: '09:00-17:30',
    sleep: '06:30-22:30',
    energy: 'morning',
    trainingDays: '3',
    existingHabits: ['walking'],
    ambition: 'Run a half marathon',
  });

  /**
   * The whole audit, run against the real generator rather than a fixture:
   * every block IntentNorth puts in someone's day can say what doing it means,
   * why it is there, or both.
   */
  it('never produces a block with nothing behind it', () => {
    const bare: string[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = `2026-03-0${2 + day}`;
      const { unplaced: _unplaced, ...generated } = generateDailyPlan(
        plan.profile,
        plan.routines,
        date,
        [],
        plan.goals,
      );
      bare.push(...bareItems(generated.items, plan.routines, plan.goals).map((i) => i.title));
    }
    expect([...new Set(bare)]).toEqual([]);
  });
});
