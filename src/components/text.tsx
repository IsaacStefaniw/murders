import { StyleSheet, Text, type TextProps } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'secondary' | 'caption' | 'label';

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: ThemeColor;
}

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  const defaultColor: ThemeColor =
    variant === 'secondary' || variant === 'caption' ? 'textSecondary' : 'text';
  return (
    <Text
      style={[styles[variant], { color: theme[color ?? defaultColor] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.8 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  secondary: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
