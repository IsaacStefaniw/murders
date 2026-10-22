/**
 * Does the time the app SHOWS match the time it actually RUNS?
 *
 * Isaac stopped using the app: "I opened it and it was wrong." The
 * routines screen prints `routine.preferredStart`. The daily plan places
 * the item wherever the scheduler decides. If those differ, the screen is
 * describing something the app does not do.
 *
 *     npm run usertest:statedtime
 */

import { runUser } from '@/features/sim/engine';
import { makeUserOf, PERSONAS } from '@/features/sim/personas';
import { toHHMM, toMinutes } from '@/lib/dates';

const DAYS = 182;

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

it('compares the stated start with where the plan actually puts it', () => {
  const rows: string[] = [];
  let drifted = 0;
  let total = 0;
  let bigDrift = 0;

  for (const [i, p] of PERSONAS.entries()) {
    const r = runUser(makeUserOf(i, p.key), DAYS, '2026-01-05', { startPaths: true });
    const snap = r.snapshot;
    const prof = snap.profile;

    const starts = new Map<string, number[]>();
    for (const plan of Object.values(snap.plans)) {
      for (const item of plan.items) {
        if (!item.routineId || item.fixed) continue;
        starts.set(item.routineId, [...(starts.get(item.routineId) ?? []), toMinutes(item.start)]);
      }
    }

    const lines: string[] = [];
    for (const routine of snap.routines) {
      if (!routine.active) continue;
      const seen = starts.get(routine.id);
      if (!seen || seen.length < 5) continue;
      total += 1;
      const stated = toMinutes(routine.preferredStart);
      const actual = median(seen);
      const gap = actual - stated;
      if (Math.abs(gap) >= 15) drifted += 1;
      if (Math.abs(gap) >= 60) bigDrift += 1;
      if (Math.abs(gap) >= 30) {
        const atWork =
          prof?.workEnd && stated < toMinutes(prof.workEnd) && prof?.workStart && stated >= toMinutes(prof.workStart)
            ? '  ← stated time is inside working hours'
            : '';
        lines.push(
          `    ${routine.title.slice(0, 30).padEnd(32)} shows ${routine.preferredStart}  runs ~${toHHMM(actual)}  (${gap > 0 ? '+' : ''}${gap} min, n=${seen.length})${atWork}`,
        );
      }
    }
    if (lines.length > 0) {
      rows.push(`${p.key}  (work ${prof?.workStart ?? '-'}-${prof?.workEnd ?? '-'})`);
      rows.push(...lines);
    }
  }

  rows.unshift(
    `STATED START vs ACTUAL PLACEMENT — ${drifted} of ${total} active routines drift 15+ min, ${bigDrift} drift an hour or more\n`,
  );
  console.log('\n' + rows.join('\n') + '\n');
  expect(total).toBeGreaterThan(0);
});
