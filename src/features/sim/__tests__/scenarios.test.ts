import { runUser } from '@/features/sim/engine';
import { makeUserOf, PERSONAS } from '@/features/sim/personas';

/**
 * Ten lives, six months each, through the real engine.
 *
 * The weighted cohort in `sim.test.ts` answers "do people adhere?" for a
 * population that is, when you read the five personas end to end, one kind
 * of person: a working adult, mostly partnered, mostly nine-to-five, all
 * under about forty-five. Every one of them leaves `weekShape` blank.
 *
 * So four of the six week shapes the product sells to had never been run at
 * all, and nothing measured whether the pathways — three of the seven
 * coaches — were worth anything over six months, because `runUser` dropped
 * `pathStarts` on the floor while the real approval screen starts them.
 *
 * This runs one of each persona for twenty-six weeks with the coaches on,
 * which is what a real user gets.
 */

const DAYS = 182;
const SCENARIOS = ['shift_nurse', 'retired_active', 'student', 'recovery_first', 'endurance_athlete'];

describe('ten lives, six months', () => {
  const runs = PERSONAS.map((p, i) => ({
    key: p.key,
    on: runUser(makeUserOf(i, p.key), DAYS, '2026-01-05', { startPaths: true }),
    off: runUser(makeUserOf(i, p.key), DAYS, '2026-01-05', { startPaths: false }),
  }));

  const donePerWeek = (r: (typeof runs)[0]['on']) =>
    r.weeks.reduce((a, w) => a + w.completed, 0) / r.weeks.length;

  it('covers every week shape the product sells to', () => {
    for (const key of SCENARIOS) expect(PERSONAS.map((p) => p.key)).toContain(key);
  });

  it('runs all ten for six months without producing an invalid session', () => {
    for (const r of runs) {
      expect({ persona: r.key, errors: r.on.errors }).toEqual({ persona: r.key, errors: 0 });
      expect({ persona: r.key, overlaps: r.on.overlapViolations }).toEqual({
        persona: r.key,
        overlaps: 0,
      });
      const contract = r.on.weeks.reduce((a, w) => a + w.contractViolations, 0);
      expect({ persona: r.key, contract }).toEqual({ persona: r.key, contract: 0 });
    }
  });

  it('the pathway coaches add real volume, not just more plan', () => {
    // The ablation the engine could not run before. Every persona should do
    // MORE with the coaches on — if a coach only adds items nobody
    // completes, it is not a coach, it is a longer list.
    const gains = runs.map((r) => ({
      key: r.key,
      gain: donePerWeek(r.on) - donePerWeek(r.off),
    }));
    const losers = gains.filter((g) => g.gain < 0);
    expect({ losers }).toEqual({ losers: [] });

    // And at the median it should be a real difference, not noise.
    const sorted = gains.map((g) => g.gain).sort((a, b) => a - b);
    expect(sorted[Math.floor(sorted.length / 2)]).toBeGreaterThan(1);
  });

  it('nobody is handed a week they complete almost none of', () => {
    // A plan somebody finishes a fifth of is not a plan, it is a weekly
    // reminder that they are failing. The weekly review exists to prune to
    // something survivable; this is the assertion that it did.
    const late = runs.map((r) => {
      const s = r.on.weeks.slice(-4);
      const planned = s.reduce((a, w) => a + w.planned, 0);
      const completed = s.reduce((a, w) => a + w.completed, 0);
      return { key: r.key, rate: planned ? +(completed / planned).toFixed(2) : 1 };
    });
    // The floor is 0.25 because that is what the worst persona currently
    // clears, not because a quarter is acceptable — health_rebuilder ends
    // six months finishing 27% of her week and shift_nurse 35%, and both
    // of those are findings rather than passes. Raise this as the pruning
    // improves; never lower it to make a build go green.
    const floor = 0.25;
    expect({ below: late.filter((l) => l.rate < floor) }).toEqual({ below: [] });
  });
});
