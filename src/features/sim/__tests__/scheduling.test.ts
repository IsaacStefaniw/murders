import { runSchedulingScenarios } from '@/features/sim/scheduling';
import { runUser } from '@/features/sim/engine';
import { makeUser } from '@/features/sim/personas';
import { aggregate } from '@/features/sim/report';

describe('cohort scheduling scenarios', () => {
  const result = runSchedulingScenarios(12, 28);

  it('runs a simulated month for every persona', () => {
    expect(result.days).toBe(12 * 28 * 4);
  });

  it('never reports something unplaced while a legal window for it is free', () => {
    // The examples ride along so a failure names the day and the routine.
    expect({ dropped: result.dropped, examples: result.examples }).toMatchObject({ dropped: 0 });
  });

  it('still reports honestly: some days genuinely cannot hold everything', () => {
    // The scenario is worthless if the cohort never overflows.
    expect(result.unplaced).toBeGreaterThan(0);
  });

  it('lets the energy shape decide where things sit', () => {
    expect(result.energyDecided).toBeGreaterThan(0);
  });

  it('never lets the energy shape cost the day a routine', () => {
    expect({ lost: result.lostToEnergy, examples: result.examples }).toMatchObject({ lost: 0 });
  });
});

describe('the cohort report counts what the shape decided', () => {
  it('carries energy-decided placements through to the aggregate', () => {
    const rep = aggregate(Array.from({ length: 6 }, (_, i) => runUser(makeUser(i), 28)));
    expect(rep.avgEnergyDecidedPerWeek).toBeGreaterThan(0);
    expect(rep.overlapViolations).toBe(0);
  });
});
