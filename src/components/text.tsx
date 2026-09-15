import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The type scale.
 *
 * ── What was wrong with the last one ────────────────────────────────────
 *
 * 34 / 26 / 18 / 16 / 15 / 14 / 12. The bottom four steps are ratios of
 * 1.125, 1.07 and 1.07 — differences a person cannot see, which means the
 * app had seven names for type and about four sizes. `secondary` against
 * `body` was the clearest case: one point apart, and the reviewer's line
 * was that the distinction "exists in code and not in the eye".
 *
 * ── The constraint that shapes it ───────────────────────────────────────
 *
 * The reading floor is 14pt and it is not negotiable: below that the
 * smallest Dynamic Type step is already hard for the reading-glasses
 * market in docs/MARKETS.md, and there is a test holding the line. With a
 * floor at 14 and a ceiling around 36, six even steps would need a ratio
 * of 1.17 — which is the same invisible-difference problem in a new suit.
 *
 * So there are FIVE sizes rather than seven, and the scale steps by about
 * a quarter each time:
 *
 *     36  display    the one number or sentence a screen is about
 *     28  title      the screen's own name
 *     21  heading    a card's subject
 *     17  body       everything a person reads
 *     14  caption    the aside, the source, the unit
 *     12  label      an uppercase eyebrow, not a size step
 *
 * `secondary` is body SIZE in the quieter colour, which is what it always
 * actually was: it already defaulted to `textSecondary`, so the one point
 * of size was a second signal for a distinction colour had already made.
 * Removing it makes the scale honest and changes nothing a reader relies
 * on.
 *
 * ── Numbers ─────────────────────────────────────────────────────────────
 *
 * `numeric` turns on tabular figures, so a column of times lines up
 * instead of wandering with the width of a 1. Every screen in this app
 * that matters is a column of times.
 */

type Variant = 'display' | 'title' | 'heading' | 'body' | 'secondary' | 'caption' | 'label';

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: ThemeColor;
  /**
   * Tabular figures, for anything that sits in a column with other
   * numbers — times, durations, dollars, counts. Proportional digits are
   * right for a number inside a sentence and wrong for a column.
   */
  numeric?: boolean;
}

export function AppText({ variant = 'body', color, numeric, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  const defaultColor: ThemeColor =
    variant === 'secondary' || variant === 'caption' ? 'textSecondary' : 'text';
  return (
    <Text
      style={[
        styles[variant],
        numeric ? styles.tabular : null,
        { color: theme[color ?? defaultColor] },
        style,
      ]}
      {...rest}
    />
  );
}

/**
 * The face, said once.
 *
 * `Fonts` has been defined in `theme.ts` and used by nothing since it was
 * written, which on the web preview meant the app rendered in whatever
 * the browser felt like rather than in the stack the project chose.
 */
const face = { fontFamily: Fonts?.sans };

const styles = StyleSheet.create({
  display: { ...face, fontSize: 36, lineHeight: 42, fontWeight: '700', letterSpacing: -0.8 },
  title: { ...face, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6 },
  heading: { ...face, fontSize: 21, lineHeight: 27, fontWeight: '600', letterSpacing: -0.3 },
  body: { ...face, fontSize: 17, lineHeight: 24, fontWeight: '400' },
  // Body size, quieter colour. The colour was always doing the work.
  secondary: { ...face, fontSize: 17, lineHeight: 24, fontWeight: '400' },
  caption: { ...face, fontSize: 14, lineHeight: 19, fontWeight: '400' },
  label: {
    ...face,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tabular: { fontVariant: ['tabular-nums'] },
});
