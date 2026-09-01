import { useMemo } from 'react';
import { StyleSheet, TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The only text input in the app.
 *
 * A bare `TextInput` with a placeholder is invisible to VoiceOver the
 * moment anything is typed into it — the placeholder disappears and the
 * field announces as "text field", with no indication of what it wants.
 * The app had twenty-six of them. Patching each call site would have left
 * the twenty-seventh unlabelled, so the label is a required prop here
 * instead: there is no way to render this component without one.
 *
 * `label` is announced whether or not it is drawn. `showLabel={false}` is
 * for a field whose meaning is already obvious on screen — a weight box
 * beside a reps box under a heading that says "Log a lift" — where drawing
 * two more words would be noise for people who can see it and silence for
 * people who cannot. Sighted users lose nothing; VoiceOver still hears
 * "Weight in kilograms".
 */
export interface FieldProps {
  /** Announced to VoiceOver, and drawn unless `showLabel` is false. */
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Extra context, announced as a hint and drawn under the field. */
  hint?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  /** A trailing unit drawn inside the field's row — 'kg', 'reps', '%'. */
  unit?: string;
  multiline?: boolean;
  editable?: boolean;
  showLabel?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'go' | 'send';
  style?: StyleProp<ViewStyle>;
  /** Fixed width, for numeric boxes sitting in a row. */
  width?: number;
  /**
   * 'large' is for the one input a screen is about — a goal being named, a
   * journal entry. Bigger type and more room, so the field reads as the
   * point of the page rather than a form control on it.
   */
  size?: 'default' | 'large';
  testID?: string;
}

export function Field({
  label,
  value,
  onChangeText,
  hint,
  placeholder,
  keyboardType,
  unit,
  multiline = false,
  editable = true,
  showLabel = true,
  autoFocus,
  onBlur,
  onSubmitEditing,
  returnKeyType,
  style,
  width,
  size = 'default',
  testID,
}: FieldProps) {
  const theme = useTheme();

  const inputStyle = useMemo(
    () => [
      styles.input,
      multiline && styles.multiline,
      size === 'large' && styles.large,
      {
        color: theme.text,
        borderColor: theme.border,
        backgroundColor: editable ? theme.surface : theme.surfacePressed,
      },
      width != null ? { width } : null,
    ],
    [theme, multiline, editable, width, size],
  );

  return (
    <View style={[styles.wrap, width != null ? { width } : null, style]}>
      {showLabel ? (
        <AppText variant="label" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.row}>
        <TextInput
          // The three that make a field usable without sight. The label is
          // always present; the placeholder never stands in for it.
          accessibilityLabel={label}
          accessibilityHint={hint}
          accessibilityState={{ disabled: !editable }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
          autoFocus={autoFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          testID={testID}
          style={inputStyle}
        />
        {unit ? (
          <AppText variant="secondary" color="textTertiary" style={styles.unit}>
            {unit}
          </AppText>
        ) : null}
      </View>
      {hint && showLabel ? (
        <AppText variant="caption" color="textTertiary" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/**
 * Minimum comfortable target, from Apple's Human Interface Guidelines.
 * Exported so every control in the app can reach for the same number
 * rather than each one guessing.
 */
export const MIN_TARGET = 44;

/** The hit area added around a control that is visually smaller than the floor. */
export const TARGET_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  label: { marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    // 12 top + 12 bottom + a 23pt line clears the 44pt floor with the
    // border, and keeps clearing it as the type scale grows.
    paddingVertical: Spacing.md,
    minHeight: MIN_TARGET,
    fontSize: 17,
    flexGrow: 1,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  large: { fontSize: 22, lineHeight: 30, minHeight: 120, paddingVertical: Spacing.lg },
  unit: { minWidth: 28 },
  hint: { marginTop: 2 },
});
