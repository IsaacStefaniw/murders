/**
 * The frame that did not break out.
 *
 * Isaac asked for intervention screens that "break out of the usual UI a
 * bit more often". A frame was built for it and it broke out of nothing:
 *
 *   - `Breakout` painted `theme.background`. So did `Screen`.
 *   - The eyebrow used `variant="label"` in `textTertiary` — the app's
 *     single most repeated label style, the one on TODAY and NOW and END
 *     OF WEEK.
 *   - The route carried `presentation: 'modal'`, shared with eleven other
 *     routes including Settings. The ten minutes after a slip arrived with
 *     the same sheet animation as the settings screen.
 *
 * So the honest reading of "break out more often" was never "use this
 * frame more" — routing more moments through a frame that looks like
 * Settings produces more screens that look like Settings. It was "make the
 * frame a break", and these tests hold the signature in place.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { Colors } from '@/constants/theme';

const SRC = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

describe('the surface', () => {
  it('is not the surface every other screen paints', () => {
    const breakout = read('components/breakout.tsx');
    const screen = read('components/screen.tsx');
    // The whole defect in one assertion: these used to be the same line.
    expect(screen).toMatch(/backgroundColor: theme\.background/);
    expect(breakout).toMatch(/useBreakoutTheme\(\)/);
  });

  it('has a palette of its own, in both schemes', () => {
    expect(Colors.breakoutLight.background).not.toBe(Colors.light.background);
    expect(Colors.breakoutDark.background).not.toBe(Colors.dark.background);
  });

  /**
   * The detail the finding missed and the hour decides. The moment this
   * frame exists for is a drink logged at eleven at night. Flipping dark
   * mode to light then is a flashbang from an app that is meant to be
   * helping, so dark mode goes deeper instead.
   */
  it('never flashes white on somebody using the app at night', () => {
    const lum = (hex: string) => {
      const h = hex.replace('#', '');
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
      const f = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    // Darker than the ordinary dark background, not lighter.
    expect(lum(Colors.breakoutDark.background)).toBeLessThan(lum(Colors.dark.background));
  });

  it('carries every colour the controls inside it ask for', () => {
    // The palette swap is a context, so a missing key is an invisible
    // control rather than a type error at the call site.
    for (const key of Object.keys(Colors.light)) {
      expect(Colors.breakoutLight).toHaveProperty(key);
      expect(Colors.breakoutDark).toHaveProperty(key);
    }
  });

  it('stays legible — every ink clears 4.5:1 on its own ground', () => {
    const lum = (hex: string) => {
      const h = hex.replace('#', '');
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
      const f = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    for (const palette of [Colors.breakoutLight, Colors.breakoutDark]) {
      for (const ink of ['text', 'textSecondary', 'textTertiary', 'accent', 'danger'] as const) {
        expect(ratio(palette.background, palette[ink])).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('the eyebrow', () => {
  it('is not the label style on every other screen', () => {
    const breakout = read('components/breakout.tsx');
    // It said "this is a break, here is who is talking" in the exact style
    // used for section headers three scrolls into a tab.
    expect(breakout).not.toMatch(/variant="label" color="textTertiary"/);
    expect(breakout).toMatch(/variant="label" color="accent"/);
  });
});

describe('the arrival', () => {
  it('is reserved for the breakout route, not shared with Settings', () => {
    const layout = read('app/_layout.tsx');
    const full = [...layout.matchAll(/presentation: 'fullScreenModal'/g)];
    expect(full.length).toBe(1);
    // And it is the one on the slip.
    const near = layout.slice(
      Math.max(0, layout.indexOf("presentation: 'fullScreenModal'") - 400),
      layout.indexOf("presentation: 'fullScreenModal'"),
    );
    expect(near).toMatch(/moment\/\[eventId\]/);
    expect(layout).toMatch(/name="settings" options=\{\{ presentation: 'modal' \}\}/);
  });
});

/**
 * The rock this broke on first.
 *
 * `Breakout` provides the inverted palette to its SUBTREE. A screen that
 * renders `<Breakout>` is not in that subtree — it is the component above
 * it — so a plain `useTheme()` in its body returns the ordinary palette
 * while everything it draws sits on the dark one. It showed up on the
 * if-then plan card: light `accentSoft` behind near-white text, the single
 * most important sentence in the flow, almost invisible.
 */
describe('a screen that renders a breakout', () => {
  it('reads the breakout palette for its own inline colours', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(join(SRC, 'app'))) {
      const src = readFileSync(file, 'utf8');
      if (!/from '@\/components\/breakout'/.test(src)) continue;
      // Comments stripped first: the file that got this wrong now explains
      // the mistake in prose, and prose is not a call site.
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      if (/\buseTheme\(\)/.test(code)) offenders.push(file.slice(SRC.length + 1));
    }
    expect(offenders).toEqual([]);
  });
});
