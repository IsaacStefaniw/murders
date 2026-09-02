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
    textTertiary: '#9BA09C',
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
