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
    'DragToMove.tsx',  // a shadow offset, not a layout width
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

/**
 * The three shared controls, held to the floor by their own source.
 *
 * A control that reaches VoiceOver as "button" with no name, or a chip
 * that does not say whether it is selected, is a control that works for
 * sighted people only. The shape is pinned here so a refactor that drops
 * a prop fails a test rather than a person.
 */
describe('the shared controls', () => {
  const source = (name: string) => readFileSync(join(SRC, 'components', name), 'utf8');

  it('Button is a button, named by its title, and says when it is disabled', () => {
    const s = source('button.tsx');
    expect(s).toMatch(/accessibilityRole="button"/);
    expect(s).toMatch(/accessibilityLabel=\{title\}/);
    expect(s).toMatch(/accessibilityState=\{\{ disabled/);
    expect(s).toMatch(/title: string;/);
  });

  it('Chip is a button that announces selected and disabled', () => {
    const s = source('chip.tsx');
    expect(s).toMatch(/accessibilityRole="button"/);
    expect(s).toMatch(/accessibilityState=\{\{ selected, disabled \}\}/);
    // The visible label is the accessible name: it is the only text child.
    expect(s).toMatch(/label: string;/);
    expect(s).toMatch(/\{label\}/);
  });

  it('Field requires a label and hands it to the input whether or not it is drawn', () => {
    const s = source('field.tsx');
    expect(s).toMatch(/^\s+label: string;/m);
    expect(s).not.toMatch(/label\?: string/);
    expect(s).toMatch(/accessibilityLabel=\{label\}/);
    expect(s).toMatch(/accessibilityHint=\{hint\}/);
    expect(s).toMatch(/accessibilityState=\{\{ disabled: !editable \}\}/);
  });

  it('every hint prop on the shared controls reaches accessibilityHint', () => {
    for (const control of ['button.tsx', 'chip.tsx', 'field.tsx']) {
      expect(source(control)).toMatch(/accessibilityHint=\{hint\}/);
    }
  });
});

/**
 * Type sizes. The reading floor for anything a person is expected to read
 * is 14pt: below that, the smallest Dynamic Type step is already hard for
 * the reading-glasses market in docs/MARKETS.md. `label` is an uppercase
 * eyebrow at 12pt — a heading decoration, not a caption — and is reported
 * rather than pinned.
 */
describe('type sizes', () => {
  const sizes = (): Record<string, number> => {
    const s = readFileSync(join(SRC, 'components', 'text.tsx'), 'utf8');
    const out: Record<string, number> = {};
    for (const m of s.matchAll(/^\s+(\w+): \{[^}]*?fontSize: (\d+)/gms)) out[m[1]] = Number(m[2]);
    return out;
  };

  it('captions are at least 14pt, secondary at least 15, body at least 16', () => {
    const t = sizes();
    expect(t.caption).toBeGreaterThanOrEqual(14);
    expect(t.secondary).toBeGreaterThanOrEqual(15);
    expect(t.body).toBeGreaterThanOrEqual(16);
    expect(Object.keys(t).sort()).toEqual(['body', 'caption', 'display', 'heading', 'label', 'secondary', 'title']);
  });

  /**
   * charts.tsx draws 9pt axis ticks. Every chart carries an
   * accessibilityLabel that says the numbers in words, so the ticks are
   * decoration for people who can see them — but 9pt is small for the
   * reading-glasses market and is reported as open in the QA report
   * rather than pinned here.
   */
  it('no screen or feature sets a font size under 14 on text a person reads', () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(SRC)) {
      if (file.endsWith(join('components', 'charts.tsx'))) continue;
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/fontSize: (\d+)/);
        if (m && Number(m[1]) < 14 && !file.endsWith(join('components', 'text.tsx'))) {
          offenders.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
