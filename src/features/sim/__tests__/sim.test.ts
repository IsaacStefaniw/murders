import { runUser } from '@/features/sim/engine';
import { makeUser } from '@/features/sim/personas';
import { aggregate } from '@/features/sim/report';

describe('cohort simulator (smoke)', () => {
  const results = Array.from({ length: 12 }, (_, i) => runUser(makeUser(i), 28));
  const rep = aggregate(results);

  it('runs users through the real engine without errors or overlaps', () => {
    expect(rep.errors).toBe(0);
    expect(rep.overlapViolations).toBe(0);
  });

  it('produces sane metrics', () => {
    expect(rep.completion.early).toBeGreaterThan(0.2);
    expect(rep.completion.early).toBeLessThan(0.95);
    expect(rep.weeks).toBe(4);
    expect(Object.keys(rep.personas).length).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic for a given seed', () => {
    const again = aggregate(Array.from({ length: 12 }, (_, i) => runUser(makeUser(i), 28)));
    expect(again.completion.early).toBeCloseTo(rep.completion.early, 10);
  });

  it('executes modality sessions through the real generators without contract violations', () => {
    expect(rep.contractViolations).toBe(0);
    expect(rep.modalities.workout?.sessions).toBeGreaterThan(0);
    // Time pressure hits some sessions; the gym coach shrinks, never abandons.
    expect(rep.modalities.workout?.shortened).toBeGreaterThan(0);
  });

  it('tracks goal-milestone progression per domain', () => {
    expect(rep.goalProgress.usersWithMilestoneGoals).toBeGreaterThan(0);
    expect(rep.goalProgress.milestonesDone).toBeGreaterThan(0);
    expect(Object.keys(rep.goalProgress.byDomain)).toContain('business');
  });

  it('the goal-stalled rescue reduces goals still stalled at the end', () => {
    // Longer horizon so stalls can form and the detector can act on them.
    const withRescue = aggregate(
      Array.from({ length: 12 }, (_, i) => runUser(makeUser(i), 70)),
    );
    const withoutRescue = aggregate(
      Array.from({ length: 12 }, (_, i) => runUser(makeUser(i), 70, '2026-01-05', { goalRescue: false })),
    );
    expect(withRescue.goalProgress.goalsStalledAtEndPct).toBeLessThanOrEqual(
      withoutRescue.goalProgress.goalsStalledAtEndPct,
    );
    expect(withRescue.detectors.goal_stalled?.shown ?? 0).toBeGreaterThan(0);
  });
});
