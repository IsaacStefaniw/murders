/**
 * Does switching the nutrition coach on break the 0.25 floor?
 *
 * ── Why this has to be measured before anything is built ────────────────
 *
 * `usertest:foodquestion` shows nutrition delivers 96 items and 42
 * completions to the target persona the moment `foodAim` is answered, and
 * ten of eleven simulated people are never asked. The obvious first
 * increment is therefore "ask everyone". The developer seat named the
 * reason that may be illegal:
 *
 *   `health_rebuilder` ends six months at 25% against a floor of 0.25.
 *   Zero margin. Her `moreOf` gives her no meal routine, so every
 *   nutrition routine is net-new volume on the persona with the least
 *   room in the cohort.
 *
 * Non-negotiable 6 says the floor is never lowered to make a build pass,
 * and two changes were reverted this month rather than lower it. So this
 * runs `scenarios.test.ts`'s own assertion — last four weeks of 182, per
 * persona, completed over planned — with the food question answered for
 * everybody, and reports who would fall through.
 *
 * It PRINTS rather than fails. The floor test that gates CI is
 * `src/features/sim/__tests__/scenarios.test.ts`; a second copy of it
 * that could go red on a measurement run would just be a flaky gate.
 *
 *     npm run usertest:nutritionfloor
 */
import { runUser } from '@/features/sim/engine';
import { PERSONAS, HABIT_KEYS, mulberry32, type SimUser } from '@/features/sim/personas';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import type { InterviewAnswers } from '@/features/onboarding/script';

const DAYS = 182;
const START = '2026-01-05';
const FLOOR = 0.25;

/**
 * `makeUserOf` with a hook before the answers are consumed.
 *
 * It must draw from `rng` in exactly `makeUserOf`'s order — HABIT_KEYS
 * first, then `spec.answers` — or the same seed yields a different person
 * and the comparison measures the harness instead of the change. That
 * mistake was made once already today; see HABIT_KEYS' comment.
 */
function userWith(id: number, key: string, patch: Partial<InterviewAnswers>): SimUser {
  const spec = PERSONAS.find((p) => p.key === key)!;
  const rng = mulberry32(1_000_003 * (id + 1));
  const trueHabits = HABIT_KEYS.filter((h) => rng() < (spec.habitOdds?.[h] ?? 0));
  const answers = { ...spec.answers(rng), ...patch } as InterviewAnswers;
  if (trueHabits.length > 0) answers.existingHabits = trueHabits;
  const truth = spec.truth(rng);
  truth.trueHabits = trueHabits;
  truth.establishedBoost = 1.15 + rng() * 0.1;
  return { id, persona: spec.key, plan: buildLifeOperatingPlan(answers), truth, rng };
}

/** The last-four-weeks rate, exactly as the gating floor test computes it. */
function lateRate(user: SimUser) {
  const r = runUser(user, DAYS, START, { startPaths: true });
  const s = r.weeks.slice(-4);
  const planned = s.reduce((a, w) => a + w.planned, 0);
  const completed = s.reduce((a, w) => a + w.completed, 0);
  return {
    rate: planned ? +(completed / planned).toFixed(2) : 1,
    planned,
    completed,
    starts: user.plan.pathStarts.map((p) => p.id),
  };
}

it('reports who falls through the floor when nutrition is switched on', () => {
  const rows = PERSONAS.map((p, i) => {
    const off = lateRate(userWith(i, p.key, {}));
    const on = lateRate(userWith(i, p.key, { foodAim: 'energy' } as Partial<InterviewAnswers>));
    return { key: p.key, off, on };
  });

  console.log('\nLAST FOUR WEEKS OF 182 — floor is 0.25, never lowered');
  console.log('persona             as shipped        food answered     nutrition started');
  for (const r of rows) {
    const started = r.on.starts.includes('nutrition');
    const flag = r.on.rate < FLOOR ? '  ← THROUGH THE FLOOR' : r.on.rate < FLOOR + 0.03 ? '  ← no margin' : '';
    console.log(
      `${r.key.padEnd(19)} ${String(r.off.rate).padEnd(5)} (${r.off.completed}/${r.off.planned})`.padEnd(40) +
        `${String(r.on.rate).padEnd(5)} (${r.on.completed}/${r.on.planned})`.padEnd(18) +
        `${started ? 'yes' : 'NO'}${flag}`,
    );
  }

  const through = rows.filter((r) => r.on.rate < FLOOR);
  const worse = rows.filter((r) => r.on.rate < r.off.rate);
  console.log(`\nthrough the floor with nutrition on: ${through.length ? through.map((r) => `${r.key} ${r.on.rate}`).join(', ') : 'none'}`);
  console.log(`worse off than shipped: ${worse.length ? worse.map((r) => `${r.key} ${r.off.rate}→${r.on.rate}`).join(', ') : 'none'}`);
  console.log(
    `personas where answering the question did NOT start nutrition: ${
      rows.filter((r) => !r.on.starts.includes('nutrition')).map((r) => r.key).join(', ') || 'none'
    }`,
  );
});
