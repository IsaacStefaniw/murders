/**
 * What each coach actually handed over.
 *
 * Isaac, 22 Oct 2026: "Still I didn't want to come back really, the gym
 * trainer was ok but nothing else incentivised it either."
 *
 * One coach of seven delivered. This counts what each one put into his
 * week, and what it owns that persists — because a coach that schedules a
 * prompt and a coach that builds a progressing programme are different
 * products wearing the same word.
 *
 *     npm run usertest:coachvalue
 */

import { runUser } from '@/features/sim/engine';
import { makeUserOf } from '@/features/sim/personas';
import { PATHS, PATH_ORDER } from '@/features/paths/definitions';
import { protocolById } from '@/features/knowledge/protocols';
import { coachForProtocol, coachForArea } from '@/features/coaches/interrupt';
import type { PathId } from '@/features/paths/definitions';

const DAYS = 45;

it('counts what each coach contributed to the target persona’s six weeks', () => {
  const user = makeUserOf(1, 'career_optimiser');
  const r = runUser(user, DAYS, '2026-09-08', { startPaths: true });
  const snap = r.snapshot;

  const byRoutine = new Map(snap.routines.map((x) => [x.id, x]));
  const owner = (routineId: string | undefined): PathId | 'unassigned' => {
    if (!routineId) return 'unassigned';
    const routine = byRoutine.get(routineId);
    if (!routine) return 'unassigned';
    const protocol = routine.protocolId ? protocolById(routine.protocolId) : undefined;
    return protocol ? coachForProtocol(protocol) : coachForArea(routine.area);
  };

  const tally = new Map<string, { routines: Set<string>; planned: number; done: number }>();
  const bump = (key: string) => {
    if (!tally.has(key)) tally.set(key, { routines: new Set(), planned: 0, done: 0 });
    return tally.get(key)!;
  };

  for (const plan of Object.values(snap.plans)) {
    for (const item of plan.items) {
      if (item.fixed || item.title === 'Work') continue;
      const key = owner(item.routineId);
      const t = bump(key);
      t.planned += 1;
      if (item.status === 'completed') t.done += 1;
      if (item.routineId) t.routines.add(item.routineId);
    }
  }

  // Active routines that produced NOTHING — a coach running on paper.
  const silent = snap.routines.filter((x) => {
    if (!x.active) return false;
    return !Object.values(snap.plans).some((p) => p.items.some((i) => i.routineId === x.id));
  });

  const rows: string[] = [];
  rows.push(`ALEX, ${DAYS} DAYS — WHAT EACH COACH PUT IN THE WEEK`);
  rows.push('coach                 started  routines  items  done   persisted artefact');

  /** Which coaches own something that survives the week and progresses. */
  const ARTEFACT: Record<PathId, string> = {
    training: 'trainingProgramme — weeks, sessions, sets, loads, auto-regulation',
    work: 'workBlock',
    nutrition: 'mealPlan — seven dinner names',
    money: 'none',
    recovery: 'none',
    relationship: 'none',
    family: 'none',
  };

  for (const id of PATH_ORDER) {
    const t = tally.get(id);
    const started = snap.paths[id] ? 'yes' : 'no ';
    rows.push(
      `${PATHS[id].title.slice(0, 20).padEnd(21)} ${started.padEnd(8)} ${String(t?.routines.size ?? 0).padStart(8)}  ${String(t?.planned ?? 0).padStart(5)}  ${String(t?.done ?? 0).padStart(4)}   ${ARTEFACT[id]}`,
    );
  }
  const un = tally.get('unassigned');
  if (un) {
    rows.push(
      `${'(no coach)'.padEnd(21)} ${'-'.padEnd(8)} ${String(un.routines.size).padStart(8)}  ${String(un.planned).padStart(5)}  ${String(un.done).padStart(4)}`,
    );
  }

  rows.push('');
  rows.push(`Coaches that put NOTHING in the week: ${PATH_ORDER.filter((id) => !tally.get(id)?.planned).map((id) => PATHS[id].title).join(', ') || 'none'}`);
  rows.push(
    `Active routines that produced no items at all: ${silent.length ? silent.map((x) => `${x.title} (${x.area})`).join(', ') : 'none'}`,
  );

  console.log('\n' + rows.join('\n') + '\n');
  expect(tally.size).toBeGreaterThan(0);
});
