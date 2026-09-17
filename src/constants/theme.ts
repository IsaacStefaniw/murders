import '@/global.css';

import { Platform } from 'react-native';

/**
 * IntentNorth design tokens.
 *
 * The product should feel calm, premium, warm and deliberate. Warm paper
 * background, ink text, a single restrained accent (deep sage green), and
 * small supporting hues for the Must/Should/Could hierarchy. Nothing loud.
 */
export const Colors = {
  light: {
    background: '#F7F5F1',
    surface: '#FFFFFF',
    surfacePressed: '#EFEDE8',
    border: '#E7E4DD',
    text: '#1C1E1D',
    textSecondary: '#6E7370',
    // Darkened from #9BA09C, which measured 2.27:1 against the pressed
    // surface — under the 3:1 floor the accessibility pass had claimed and
    // never computed. Same hue, 15% darker, and the contrast test now
    // computes it on every run rather than trusting the claim.
    textTertiary: '#848885',
    accent: '#3E6B58',
    accentSoft: '#E3EDE7',
    onAccent: '#FFFFFF',
    must: '#8A5A2B',
    mustSoft: '#F3E9DC',
    should: '#3E6B58',
    shouldSoft: '#E3EDE7',
    could: '#6E7370',
    couldSoft: '#EDEBE6',
    danger: '#9C4238',
    dangerSoft: '#F5E4E1',
    success: '#3E6B58',
  },
  dark: {
    background: '#141614',
    surface: '#1E211F',
    surfacePressed: '#282C29',
    border: '#2E332F',
    text: '#F0F1EE',
    textSecondary: '#A6ACA7',
    textTertiary: '#767C77',
    accent: '#8FB8A5',
    accentSoft: '#25332C',
    onAccent: '#12241C',
    must: '#D0A66E',
    mustSoft: '#332A1D',
    should: '#8FB8A5',
    shouldSoft: '#25332C',
    could: '#A6ACA7',
    couldSoft: '#272A28',
    danger: '#D08A80',
    dangerSoft: '#372420',
    success: '#8FB8A5',
  },

  /**
   * The breakout surface — the one place the app looks different.
   *
   * ── Why this exists ──────────────────────────────────────────────────
   *
   * Isaac asked for intervention screens that "break out of the usual UI a
   * bit more often". A frame was built for it and it did not break out of
   * anything: `Breakout` painted `theme.background`, `Screen` painted
   * `theme.background`, the eyebrow used `variant="label"` in
   * `textTertiary` — the app's single most repeated label style, the one
   * on TODAY and NOW and END OF WEEK — and `presentation: 'modal'` was
   * shared with twelve routes including Settings. The ten minutes after a
   * slip arrived with the same animation as the settings screen.
   *
   * So the answer to "break out more often" was never to route more
   * moments through that frame. It was to make the frame a break.
   *
   * ── Why the ink, and not a colour ────────────────────────────────────
   *
   * No red, no alarm, nothing loud. A breakout is a de-escalation: the
   * person has just told the app something went wrong, and the screen's
   * job is to be calm and singular, not to shout. Inverting paper and ink
   * uses two colours the system already owns and says "different mode"
   * before a word is read — the same move a phone makes for a focus mode.
   *
   * ── Why dark mode does not invert ────────────────────────────────────
   *
   * The obvious symmetry is to flip dark mode to light. It is wrong, and
   * the reason is the hour: the moment this frame exists for is a drink
   * logged at eleven at night. A white screen then is a flashbang from an
   * app that is supposed to be helping. Dark mode goes DEEPER instead,
   * with a sage cast that ties it to the accent, so it reads as a
   * different surface rather than a light switch.
   */
  breakoutLight: {
    background: '#1B201D',
    surface: '#252B27',
    surfacePressed: '#2F3632',
    border: '#3A423D',
    text: '#F4F2ED',
    textSecondary: '#BCC2BD',
    textTertiary: '#939996',
    accent: '#8FBFA8',
    accentSoft: '#2B3A33',
    onAccent: '#14211B',
    must: '#D8AE77',
    mustSoft: '#3A3024',
    should: '#8FBFA8',
    shouldSoft: '#2B3A33',
    could: '#BCC2BD',
    couldSoft: '#2E3431',
    danger: '#DD9389',
    dangerSoft: '#3E2A26',
    success: '#8FBFA8',
  },
  breakoutDark: {
    background: '#0A100D',
    surface: '#141C18',
    surfacePressed: '#1D2721',
    border: '#27332C',
    text: '#EDEFEB',
    textSecondary: '#A3A9A4',
    textTertiary: '#7A817C',
    accent: '#8FBFA8',
    accentSoft: '#1B2B23',
    onAccent: '#0A100D',
    must: '#D0A66E',
    mustSoft: '#2C2519',
    should: '#8FBFA8',
    shouldSoft: '#1B2B23',
    could: '#A3A9A4',
    couldSoft: '#1C2420',
    danger: '#D08A80',
    dangerSoft: '#301F1C',
    success: '#8FBFA8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = Record<ThemeColor, string>;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const MaxContentWidth = 640;
