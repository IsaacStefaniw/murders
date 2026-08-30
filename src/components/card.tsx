import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CardProps extends PropsWithChildren {
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/** The base surface. Cards only where they earn their border. */
export function Card({ children, onPress, style, accessibilityLabel }: CardProps) {
  const theme = useTheme();
  const surface = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: theme.border },
    style,
  ];

  if (!onPress) return <View style={surface}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        ...surface,
        pressed && { backgroundColor: theme.surfacePressed },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
});
