// Pathway audit — NOT part of the default suite (does not match *.test.ts).
//
//   PATH_N=1000 npx jest --testMatch "<rootDir>/src/features/sim/__tests__/pathways.audit.ts"
//
// Writes a Markdown + JSON report to PATH_OUT (default /tmp).

import { writeFileSync } from 'fs';
import { join } from 'path';

import { auditPath, renderAudit, PATH_IDS, type PathAudit } from '@/features/sim/pathways';

const N = Number(process.env.PATH_N ?? 1000);
const OUT = process.env.PATH_OUT ?? '/tmp';

jest.setTimeout(60 * 60 * 1000);

it(`audits ${N} profiles through each of the ${PATH_IDS.length} pathways`, () => {
  const audits: PathAudit[] = [];
  for (const path of PATH_IDS) {
    const t0 = Date.now();
    audits.push(auditPath(path, N));
     
    console.log(`  ${path}: ${N} profiles · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  const md = renderAudit(audits);
  writeFileSync(join(OUT, 'pathway-audit.json'), JSON.stringify(audits, null, 2));
  writeFileSync(join(OUT, 'pathway-audit.md'), md);
   
  console.log('\n' + md);
  expect(audits.length).toBe(PATH_IDS.length);
});
