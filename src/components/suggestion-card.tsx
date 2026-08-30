import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Suggestion } from '@/types/domain';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

/** An AI/adaptation suggestion: message, transparent reason, two buttons. */
export function SuggestionCard({ suggestion, onAccept, onDismiss }: SuggestionCardProps) {
  const theme = useTheme();
  return (
    <Card style={{ borderColor: theme.accent, backgroundColor: theme.accentSoft }}>
      <AppText variant="heading">{suggestion.message}</AppText>
      <AppText variant="caption" style={styles.reason}>
        {suggestion.reason}
      </AppText>
      <View style={styles.actions}>
        <Button title="Make the change" onPress={onAccept} style={styles.grow} />
        <Button title="Not now" onPress={onDismiss} variant="ghost" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  reason: { marginTop: Spacing.sm },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  grow: { flexGrow: 1 },
});
