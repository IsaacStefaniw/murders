/**
 * How much of what the app asks for happens while the person is at work.
 *
 * Isaac stopped using the app, and when asked why said: "I opened it and
 * it was wrong." His week had five routines wanting a start before 18:30,
 * and he finishes at 18:30. `atWork.ts` detects and announces that;
 * nothing prevents it.
 *
 * This measures whether that is him or everybody, and gives the baseline
 * any fix has to beat.
 *
 *     npm run usertest:atwork
 */

import { runUser } from '@/features/sim/engine';
import { makeUserOf, PERSONAS } from '@/features/sim/personas';
import { clashesWithWork } from '@/features/planner/atWork';
import { toMinutes } from '@/lib/dates';
import type { PlanItem } from '@/types/domain';

const DAYS = 182;

it('counts the items the plan puts inside working hours', () => {
  const rows: string[] = [];
  rows.push('ITEMS SCHEDULED WHILE THE PERSON IS AT WORK');
  rows.push('persona             work          items  atWork  share   done@work  done@free');

  let totalItems = 0;
  let totalAtWork = 0;

  for (const [i, p] of PERSONAS.entries()) {
    const user = makeUserOf(i, p.key);
    const r = runUser(user, DAYS, '2026-01-05', { startPaths: true });
    const snap = r.snapshot;
    const prof = snap.profile;
    if (!prof?.workStart || !prof.workEnd || !prof.workDays?.length) {
      rows.push(`${p.key.padEnd(18)} (no work hours)`);
      continue;
    }
    const ws = toMinutes(prof.workStart);
    const we = toMinutes(prof.workEnd);
    const workDays = new Set(prof.workDays);

    let items = 0;
    let atWork = 0;
    let doneAtWork = 0;
    let doneFree = 0;

    for (const [date, plan] of Object.entries(snap.plans)) {
      const day = new Date(`${date}T00:00:00`).getDay();
      for (const item of plan.items as PlanItem[]) {
        if (item.fixed || item.title === 'Work') continue;
        items += 1;
        const start = toMinutes(item.start);
        const inWork = workDays.has(day as never) && start >= ws && start < we;
        if (inWork) {
          atWork += 1;
          if (item.status === 'completed') doneAtWork += 1;
        } else if (item.status === 'completed') {
          doneFree += 1;
        }
      }
    }
    totalItems += items;
    totalAtWork += atWork;

    // The structural clash, from the detector the app already ships.
    const clashes = clashesWithWork(snap.routines, prof);
    const atWorkRate = atWork ? (doneAtWork / atWork) * 100 : 0;
    const freeRate = items - atWork ? (doneFree / (items - atWork)) * 100 : 0;
    rows.push(
      `${p.key.padEnd(18)} ${`${prof.workStart}-${prof.workEnd}`.padEnd(13)} ${String(items).padStart(5)}  ${String(atWork).padStart(6)}  ${`${((atWork / items) * 100).toFixed(0)}%`.padStart(5)}   ${`${atWorkRate.toFixed(0)}%`.padStart(8)}   ${`${freeRate.toFixed(0)}%`.padStart(8)}   routines clashing: ${clashes.length}`,
    );
  }

  rows.push('');
  rows.push(
    `POOLED: ${totalAtWork} of ${totalItems} items (${((totalAtWork / totalItems) * 100).toFixed(1)}%) are scheduled inside working hours`,
  );

  console.log('\n' + rows.join('\n') + '\n');
  expect(totalItems).toBeGreaterThan(0);
});
