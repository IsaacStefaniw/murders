// Static render pass — NOT in the default suite.
//
//   npx jest --testMatch "<rootDir>/src/features/sim/__tests__/render.audit.ts"

import { checkLibrary, checkQuestions, type Finding } from '@/features/sim/screens';

jest.setTimeout(10 * 60 * 1000);

it('checks every question and every library entry', () => {
  const out: Finding[] = [];
  checkQuestions(out);
  checkLibrary(out);

  const byRule = new Map<string, Finding[]>();
  for (const f of out) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f]);
  const rows = [...byRule.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([rule, fs]) => `| ${rule} | ${fs.length} | ${fs[0].screen}: ${fs[0].detail} |`);
   
  console.log(['', '| rule | hits | first example |', '|---|---|---|', ...rows].join('\n'));
  for (const [rule, fs] of byRule) {
     
    console.log(`\n## ${rule}\n` + fs.map((f) => `- ${f.screen}: ${f.detail}`).join('\n'));
  }
  expect(Array.isArray(out)).toBe(true);
});
