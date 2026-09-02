// Journey simulation — NOT in the default suite (does not match *.test.ts).
//
//   J_USERS=300 J_DAYS=14 npx jest --testMatch "<rootDir>/src/features/sim/__tests__/journeys.sim.ts"

import { writeFileSync } from 'fs';
import { join } from 'path';

import { runJourneys, summarise } from '@/features/sim/journeys';

const USERS = Number(process.env.J_USERS ?? 200);
const DAYS = Number(process.env.J_DAYS ?? 14);
const OUT = process.env.J_OUT ?? '/tmp';

jest.setTimeout(60 * 60 * 1000);

it(`drives ${USERS} people through ${DAYS} days`, () => {
  const result = runJourneys(USERS, DAYS);
  writeFileSync(join(OUT, 'journey-report.json'), JSON.stringify(result.violations.slice(0, 200), null, 2));
   
  console.log('\n' + summarise(result));
  expect(result.actions).toBeGreaterThan(0);
});
