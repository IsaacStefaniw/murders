import { Pressable, StyleSheet } from 'react-native';

import { MIN_TARGET, TARGET_SLOP } from '@/components/field';
import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** What choosing this does, when the label alone does not say. */
  hint?: string;
  disabled?: boolean;
}

/**
 * A single choice. Chips are how nearly every decision in the app is made,
 * so their target size is the app's floor: at 10pt of padding around a
 * 21pt line this rendered 43pt tall — one point under Apple's minimum, and
 * exactly the kind of miss that never shows up until someone with unsteady
 * hands tries to use it. `minHeight` holds the floor as the type scale
 * grows, and the slop catches the tap that lands just outside.
 */
export function Chip({ label, selected = false, onPress, hint, disabled = false }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityHint={hint}
      disabled={disabled}
      hitSlop={TARGET_SLOP}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.surface,
          borderColor: selected ? theme.accent : theme.border,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText
        variant="secondary"
        style={{ color: selected ? theme.onAccent : theme.text, fontWeight: '500' }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
    minHeight: MIN_TARGET,
    justifyContent: 'center',
  },
});
