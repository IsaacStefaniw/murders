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
});
