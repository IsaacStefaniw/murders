/**
 * A lived week, written where the app will find it.
 *
 * ── Why this is a test file ─────────────────────────────────────────────
 *
 * It is not a test. It is a script that needs the repo's module resolution,
 * its TypeScript and its `@/` aliases, and `jest` is the only runner in
 * this project that has all three. Run it on purpose:
 *
 *     npm run usertest:seed
 *
 * `jest.config.js` matches only files under a `__tests__` directory, so a
 * plain `npx jest` never picks this up — the npm script overrides the
 * match for this one file. That is the whole reason it is named
 * `.test.ts` and lives outside `__tests__`.
 *
 * ── What it makes ───────────────────────────────────────────────────────
 *
 * One `localStorage` blob per persona, holding the state that persona's
 * life actually arrived at after N simulated days. Three rounds of review
 * ran against a hand-written fixture instead, and both of the bugs Isaac
 * found in ten minutes of real use escaped because that fixture could not
 * express them: breakfast only lands at 4pm when the morning is full, and
 * the fixture's morning was empty.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { runUser } from '@/features/sim/engine';
import { PERSONAS, makeUserOf } from '@/features/sim/personas';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { addDays, newId, todayKey } from '@/lib/dates';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

/** How long each persona has been using the app when a reviewer meets them. */
const DAYS = Number(process.env.USERTEST_DAYS ?? 45);

/** Where the driver looks for them. */
const OUT = join(__dirname, 'seeds');

/**
 * The personas a reviewer can be. Chosen for the shapes that break things:
 * a crowded professional morning, a night-shift week, and somebody whose
 * capacity is genuinely small.
 */
const CAST = ['busy_parent_exec', 'shift_nurse', 'young_professional'] as const;

/**
 * Urges, added here rather than taken from the snapshot.
 *
 * `GroundTruth.behaviourEventRate` exists on every persona and the sim
 * loop never reads it, so the engine has no urge history to hand over and
 * says so. A snapshot that invented one would be the fixture problem again
 * in a new place. These are generated from the persona's own rate, spread
 * across the last fortnight at the hours people actually drink and scroll,
 * and the fact that they are synthetic is recorded in the brief the
 * reviewer reads.
 */
function urges(
  lessOf: string[],
  rate: number,
  lastDate: string,
  rng: () => number,
): { intentions: BehaviourIntention[]; events: BehaviourEvent[] } {
  const intentions: BehaviourIntention[] = lessOf.map((behaviour) => ({
    id: newId('bi'),
    behaviour: behaviour as BehaviourIntention['behaviour'],
    intention: behaviourInfo(behaviour as BehaviourIntention['behaviour']).intentionTemplate,
    active: true,
    createdAt: `${addDays(lastDate, -60)}T08:00:00.000Z`,
  }));

  const events: BehaviourEvent[] = [];
  for (const intention of intentions) {
    for (let back = 14; back >= 0; back -= 1) {
      if (rng() > rate) continue;
      const date = addDays(lastDate, -back);
      // Evening, where these actually happen — 20:00 to 23:00.
      const hour = 20 + Math.floor(rng() * 3);
      const min = Math.floor(rng() * 60);
      events.push({
        id: newId('ev'),
        intentionId: intention.id,
        occurredAt: `${date}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
      });
    }
  }
  return { intentions, events };
}

it('writes a lived week per persona', () => {
  mkdirSync(OUT, { recursive: true });
  const index: Record<string, unknown>[] = [];

  CAST.forEach((key, i) => {
    const user = makeUserOf(i + 1, key);
    // `startPaths` because that is what a real person gets: the approval
    // screen starts the pathways the interview justified. Running without
    // it simulates a thinner product than the one that ships.
    /**
     * Anchored so the last simulated day IS today.
     *
     * The app reads the real clock. A snapshot whose plans stop in
     * February opens on an empty Today, and a reviewer handed an empty
     * screen reviews the empty state — which is the fixture problem with
     * extra steps.
     */
    const result = runUser(user, DAYS, addDays(todayKey(), -(DAYS - 1)), {
      startPaths: true,
    });
    const snap = result.snapshot;

    const spec = PERSONAS.find((p) => p.key === key)!;
    const lessOf = (user.plan.profile.lessOf ?? []) as string[];
    const { intentions, events } = urges(
      lessOf,
      user.truth.behaviourEventRate,
      snap.lastDate,
      user.rng,
    );

    const state = {
      onboarded: true,
      // Plus on, because a reviewer blocked by a paywall is reviewing the
      // paywall. Whether the free tier is honest is its own run.
      entitlement: {
        plus: true,
        source: 'purchase',
        productId: 'lifetime',
        checkedAt: new Date().toISOString(),
      },
      profile: snap.profile,
      routines: snap.routines,
      plans: snap.plans,
      goals: snap.goals,
      behaviourIntentions: intentions,
      behaviourEvents: events,
      paths: {},
      notifications: { enabled: true },
    };

    writeFileSync(
      join(OUT, `${key}.json`),
      JSON.stringify({ state, version: 0 }, null, 0),
    );

    const days = Object.keys(snap.plans).sort();
    const items = days.flatMap((d) => snap.plans[d].items);
    const row = {
      persona: key,
      name: user.plan.profile.firstName,
      days: days.length,
      lastDate: snap.lastDate,
      routines: snap.routines.length,
      activeRoutines: snap.routines.filter((r) => r.active).length,
      goals: snap.goals.length,
      planItems: items.length,
      completed: items.filter((x) => x.status === 'completed').length,
      skipped: items.filter((x) => x.status === 'skipped').length,
      urges: events.length,
      wake: snap.profile.wakeTime,
      work: `${snap.profile.workStart}-${snap.profile.workEnd}`,
      weight: spec.weight,
    };
    index.push(row);
    console.log('SEED', JSON.stringify(row));
  });

  writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2));
  expect(index).toHaveLength(CAST.length);
});
