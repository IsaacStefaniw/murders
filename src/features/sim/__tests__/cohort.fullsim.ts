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

jest.setTimeout(60 * 60 * 1000);

it(`simulates ${USERS} users × ${DAYS} days`, () => {
  const results: UserResult[] = [];
  const t0 = Date.now();
  for (let i = 0; i < USERS; i++) {
    results.push(runUser(makeUser(i), DAYS));
    if (i % 200 === 199) {
      // eslint-disable-next-line no-console
      console.log(`  ${i + 1}/${USERS} users · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
  const rep = aggregate(results);
  writeFileSync(join(OUT, 'cohort-report.json'), JSON.stringify(rep, null, 2));
  writeFileSync(join(OUT, 'cohort-report.md'), renderMarkdown(rep));
  // eslint-disable-next-line no-console
  console.log(renderMarkdown(rep));
  expect(rep.errors).toBe(0);
});
