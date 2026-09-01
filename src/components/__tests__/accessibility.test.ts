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
