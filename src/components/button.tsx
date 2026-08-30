import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const theme = useTheme();

  const background =
    variant === 'primary'
      ? theme.accent
      : variant === 'secondary'
        ? theme.accentSoft
        : variant === 'danger'
          ? theme.dangerSoft
          : 'transparent';
  const color =
    variant === 'primary'
      ? theme.onAccent
      : variant === 'danger'
        ? theme.danger
        : variant === 'secondary'
          ? theme.accent
          : theme.textSecondary;

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <AppText variant="heading" style={{ color, fontSize: 16 }}>
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg - 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
  },
});
