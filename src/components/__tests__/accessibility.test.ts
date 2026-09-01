import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', '..');

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '__tests__') continue;
      out.push(...tsxFiles(full));
    } else if (entry.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

const rel = (p: string) => p.slice(SRC.length + 1);

/**
 * The floor, enforced rather than remembered.
 *
 * Twenty-nine of these shipped unlabelled. Every one was written by
 * someone who simply did not think about it in that moment, which is
 * exactly the failure a code review does not reliably catch either. So the
 * rule is structural: `Field` requires a label as a prop, and this test
 * makes `Field` the only way to render a text input.
 */
describe('text inputs', () => {
  it('exist only inside the one component that requires a label', () => {
    const offenders = tsxFiles(SRC)
      .filter((f) => readFileSync(f, 'utf8').includes('<TextInput'))
      .map(rel)
      .filter((f) => f !== join('components', 'field.tsx'));
    expect(offenders).toEqual([]);
  });
});

/**
 * A control that is invisible to VoiceOver is a control that does not
 * exist for the person using it. Pressable has no implicit role, so
 * without one it announces as unlabelled scenery.
 */
describe('pressables', () => {
  it('all declare a role', () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(SRC)) {
      const source = readFileSync(file, 'utf8');
      const pressables = (source.match(/<Pressable/g) ?? []).length;
      if (pressables === 0) continue;
      const roles = (source.match(/accessibilityRole=/g) ?? []).length;
      if (roles < pressables) offenders.push(`${rel(file)} (${pressables} pressable, ${roles} role)`);
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * Apple's minimum comfortable target is 44pt. The chip was 43 — close
 * enough to look right in every screenshot and wrong for anyone whose
 * hands are not steady.
 */
describe('touch targets', () => {
  it('are held at the floor by the shared controls', () => {
    for (const control of ['chip.tsx', 'button.tsx', 'field.tsx']) {
      const source = readFileSync(join(SRC, 'components', control), 'utf8');
      expect(source).toMatch(/minHeight: (MIN_TARGET|44)/);
    }
  });
});

/**
 * Dynamic Type. At the largest accessibility setting, 13pt renders near
 * 30pt and 17pt near 40 — so a text column pinned to a fixed width clips
 * its own contents, silently, and only for the people who set the type
 * large because they need it.
 *
 * The rule is `minWidth` for anything holding text and `width` only for
 * genuinely decorative boxes. The gutter stops aligning perfectly at
 * extreme sizes; that is the correct thing to lose.
 */
describe('large text', () => {
  const DECORATIVE = [
    'charts.tsx',      // a 10pt legend dot
    'breathe.tsx',     // the breathing circle
    'LevelCard.tsx',   // a 6pt progress bar
  ];

  it('never pins a text column to a fixed width', () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(SRC)) {
      if (DECORATIVE.some((d) => file.endsWith(d))) continue;
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (/(^|[^a-zA-Z])width: \d/.test(line) && !/minWidth|maxWidth|border\w*Width/.test(line)) {
          offenders.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * `numberOfLines` truncates with an ellipsis, which at large type turns
   * a sentence into three words and a dot. Nothing in the app uses it, and
   * this keeps it that way.
   */
  it('never truncates text to a line count', () => {
    const offenders = tsxFiles(SRC)
      .filter((f) => readFileSync(f, 'utf8').includes('numberOfLines'))
      .map(rel);
    expect(offenders).toEqual([]);
  });
});
