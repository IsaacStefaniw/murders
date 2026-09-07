import fs from 'fs';
import path from 'path';

/**
 * The words the work coach must not put on a screen.
 *
 * "Executive block" stopped reviewers who are not executives, which is
 * most people with a job; on screen it is "your focus block". Comments
 * and identifiers keep the old name because the store imports it.
 */
const FILES = [
  'src/features/work/WorkHub.tsx',
  'src/features/work/WorkNumbers.tsx',
  'src/features/work/programme.ts',
  'src/features/work/review.ts',
  'src/features/work/focus.ts',
  'src/features/knowledge/protocols.work.ts',
];

function withoutComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('the work coach’s words', () => {
  it.each(FILES)('%s never says "executive block" on screen', (file) => {
    const src = withoutComments(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
    expect(src).not.toMatch(/executive block/i);
  });

  it('never claims a block outproduces an afternoon, or that refocusing takes 23 minutes', () => {
    const src = FILES.map((f) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')).join('\n');
    expect(src).not.toMatch(/23 minutes/);
    expect(src).not.toMatch(/prescri/i);
  });
});
