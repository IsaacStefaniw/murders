import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import appConfig from '../../app.json';

/**
 * The icons are ours, and they are the right shape.
 *
 * Apple rejected 1.0 under guideline 2.3.8 — "the app icons appear to be
 * placeholder icons". They were: every file under assets/images was dated
 * to the afternoon the project was scaffolded, and `ios.icon` pointed at an
 * Icon Composer bundle holding `expo-symbol.svg`, which is the Expo logo on
 * Apple's system blue. It shipped to review twice.
 *
 * A readiness audit had already passed over this once, which is why the
 * check is a test rather than a checklist item.
 */

const ROOT = join(__dirname, '..', '..');
const ios = (appConfig as { expo: Record<string, any> }).expo;

/** Every icon path the config names, wherever it names one. */
const ICON_PATHS: string[] = [
  ios.icon,
  ios.android?.adaptiveIcon?.foregroundImage,
  ios.android?.adaptiveIcon?.backgroundImage,
  ios.android?.adaptiveIcon?.monochromeImage,
  ios.web?.favicon,
  ios.plugins?.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-splash-screen')?.[1]?.image,
].filter(Boolean);

/** Width and height straight out of the PNG's IHDR — no decoder needed. */
function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('app icons', () => {
  it('names at least the six the app needs', () => {
    expect(ICON_PATHS.length).toBeGreaterThanOrEqual(6);
  });

  it('every icon the config names actually exists', () => {
    for (const rel of ICON_PATHS) {
      expect({ icon: rel, exists: existsSync(join(ROOT, rel)) }).toEqual({
        icon: rel,
        exists: true,
      });
    }
  });

  it('every icon lives in our own assets, not a template bundle', () => {
    for (const rel of ICON_PATHS) {
      expect(rel.startsWith('./assets/images/')).toBe(true);
      // The specific bundle that got us rejected.
      expect(rel).not.toContain('expo.icon');
    }
  });

  it('no Expo icon bundle is left in the tree', () => {
    expect(existsSync(join(ROOT, 'assets', 'expo.icon'))).toBe(false);
  });

  it('the App Store icon is a square 1024, which is what Apple requires', () => {
    const { width, height } = pngSize(join(ROOT, ios.icon));
    expect(width).toBe(1024);
    expect(height).toBe(1024);
  });

  it('every icon is square', () => {
    for (const rel of ICON_PATHS) {
      const { width, height } = pngSize(join(ROOT, rel));
      expect({ icon: rel, square: width === height }).toEqual({ icon: rel, square: true });
    }
  });

  it('the splash paints the brand colour behind the mark', () => {
    // The splash image is transparent, so the plugin's background is what
    // anybody actually sees for the first second of the app.
    const splash = ios.plugins.find(
      (p: unknown) => Array.isArray(p) && p[0] === 'expo-splash-screen',
    );
    expect(splash[1].backgroundColor.toUpperCase()).toBe('#3E6B58');
  });

  it('they can be regenerated, so nobody has to edit a binary', () => {
    expect(existsSync(join(ROOT, 'scripts', 'make-icons.py'))).toBe(true);
  });
});
