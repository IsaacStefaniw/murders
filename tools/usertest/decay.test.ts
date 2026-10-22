/**
 * Where adherence decays, across ten lives and twenty-six weeks.
 *
 * Measurement for the stickiness brief. NOT a retention curve: this engine
 * has no churn model, so nobody in it ever leaves. It shows the thing
 * underneath retention — whether the week a person keeps gets thinner over
 * six months — and the real curve is worse than this one, because in life
 * the people whose adherence collapses stop opening the app.
 *
 *     npm run usertest:decay
 */

import { runUser } from '@/features/sim/engine';
import { makeUserOf, PERSONAS } from '@/features/sim/personas';

const DAYS = 182;

it('reports adherence by week, per persona and pooled', () => {
  const runs = PERSONAS.map((p, i) => ({
    key: p.key,
    weight: p.weight,
    on: runUser(makeUserOf(i, p.key), DAYS, '2026-01-05', { startPaths: true }),
  }));

  const weeks = Math.min(...runs.map((r) => r.on.weeks.length));
  const rows: string[] = [];

  // Pooled, week by week.
  const pooled: { week: number; planned: number; completed: number; rate: number }[] = [];
  for (let w = 0; w < weeks; w += 1) {
    let planned = 0;
    let completed = 0;
    for (const r of runs) {
      planned += r.on.weeks[w].planned;
      completed += r.on.weeks[w].completed;
    }
    pooled.push({ week: w + 1, planned, completed, rate: planned ? completed / planned : 0 });
  }

  rows.push('POOLED ADHERENCE BY WEEK (10 personas, coaches on)');
  rows.push('week  planned  done   rate');
  for (const p of pooled) {
    rows.push(
      `${String(p.week).padStart(4)}  ${String(p.planned).padStart(7)}  ${String(p.completed).padStart(4)}   ${(p.rate * 100).toFixed(0)}%`,
    );
  }

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const first4 = mean(pooled.slice(0, 4).map((p) => p.rate));
  const last4 = mean(pooled.slice(-4).map((p) => p.rate));
  rows.push('');
  rows.push(`first 4 weeks: ${(first4 * 100).toFixed(0)}%   last 4 weeks: ${(last4 * 100).toFixed(0)}%   change: ${((last4 - first4) * 100).toFixed(0)} points`);

  // Per persona, to see who decays and who holds.
  rows.push('');
  rows.push('PER PERSONA  (first 4 → last 4 weeks)');
  for (const r of runs) {
    const rates = r.on.weeks
      .slice(0, weeks)
      .map((w) => (w.planned ? w.completed / w.planned : 0));
    const a = mean(rates.slice(0, 4));
    const b = mean(rates.slice(-4));
    const items = r.on.weeks.reduce((x, w) => x + w.planned, 0);
    rows.push(
      `${r.key.padEnd(18)} w${String(r.weight).padEnd(4)} ${(a * 100).toFixed(0)}% → ${(b * 100).toFixed(0)}%  (${((b - a) * 100).toFixed(0)} pts, ${items} items planned)`,
    );
  }

  // What the plan does to itself over time: routines switched off, and the
  // weekly-change machinery firing.
  rows.push('');
  rows.push('WHAT THE APP DID TO THE WEEK');
  for (const r of runs) {
    const off = r.on.weeks.reduce((x, w) => x + w.routinesDeactivated, 0);
    const changes = r.on.weeks.reduce((x, w) => x + w.weeklyChangesApplied, 0);
    const moves = r.on.weeks.reduce((x, w) => x + w.userMoves, 0);
    rows.push(
      `${r.key.padEnd(18)} routines switched off ${String(off).padStart(3)}   weekly changes ${String(changes).padStart(3)}   user moves ${String(moves).padStart(4)}`,
    );
  }

  console.log('\n' + rows.join('\n') + '\n');
  expect(pooled).toHaveLength(weeks);
});
