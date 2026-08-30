import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Spacing } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionTitle, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <AppText variant="heading" style={styles.centered}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="secondary" style={styles.centered}>
          {message}
        </AppText>
      ) : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} variant="secondary" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  centered: { textAlign: 'center' },
  action: { marginTop: Spacing.md },
});
