// Full cohort run — NOT part of the default test suite (doesn't match
// *.test.ts). Run explicitly:
//
//   SIM_USERS=2000 SIM_DAYS=182 npx jest --testMatch "<rootDir>/src/features/sim/__tests__/cohort.fullsim.ts"
//
// Writes JSON + Markdown reports to SIM_OUT (default /tmp).

import { writeFileSync } from 'fs';
import { join } from 'path';

import { runUser, type UserResult } from '@/features/sim/engine';
import { makeUser } from '@/features/sim/personas';
import { aggregate, renderMarkdown } from '@/features/sim/report';

const USERS = Number(process.env.SIM_USERS ?? 2000);
const DAYS = Number(process.env.SIM_DAYS ?? 182);
const OUT = process.env.SIM_OUT ?? '/tmp';
// SIM_GOAL_RESCUE=0 ablates the goal-stalled detector; SIM_GOAL_DIRECTION=0
// ablates the proactive underserved-goal detector.
const GOAL_RESCUE = process.env.SIM_GOAL_RESCUE !== '0';
const GOAL_DIRECTION = process.env.SIM_GOAL_DIRECTION !== '0';
// SIM_HABITS=0 ablates habit capture: the humans keep their real habits,
// but the interview never asks — plans are built blind to them.
const CAPTURE_HABITS = process.env.SIM_HABITS !== '0';
const SUFFIX = `${GOAL_RESCUE ? '' : '-no-rescue'}${GOAL_DIRECTION ? '' : '-no-direction'}${CAPTURE_HABITS ? '' : '-no-habits'}`;

jest.setTimeout(60 * 60 * 1000);

it(`simulates ${USERS} users × ${DAYS} days`, () => {
  const results: UserResult[] = [];
  const t0 = Date.now();
  for (let i = 0; i < USERS; i++) {
    results.push(
      runUser(makeUser(i, { captureHabits: CAPTURE_HABITS }), DAYS, '2026-01-05', {
        goalRescue: GOAL_RESCUE,
        goalDirection: GOAL_DIRECTION,
      }),
    );
    if (i % 200 === 199) {
       
      console.log(`  ${i + 1}/${USERS} users · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
  const rep = aggregate(results);
  writeFileSync(join(OUT, `cohort-report${SUFFIX}.json`), JSON.stringify(rep, null, 2));
  writeFileSync(join(OUT, `cohort-report${SUFFIX}.md`), renderMarkdown(rep));
   
  console.log(renderMarkdown(rep));
  expect(rep.errors).toBe(0);
});
