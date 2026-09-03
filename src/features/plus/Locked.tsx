import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The locked half of the product, shown rather than hidden. Every lock says
 * what is behind it and opens the paywall on tap. Nothing here is ever
 * used on an urge, reset or lapse-recovery surface.
 */
export function LockedCard({
  title,
  body,
  cta = 'Runs with Plus',
}: {
  title: string;
  body?: string;
  cta?: string;
}) {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Card
      onPress={() => router.push('/upgrade' as never)}
      accessibilityLabel={`${title}. ${cta}`}
      style={{ borderColor: theme.accent, borderWidth: StyleSheet.hairlineWidth }}
    >
      <View style={styles.row}>
        <AppText variant="heading" style={styles.grow}>
          {title}
        </AppText>
        <AppText variant="caption" color="accent">
          {cta}
        </AppText>
      </View>
      {body ? (
        <AppText variant="caption" color="textTertiary">
          {body}
        </AppText>
      ) : null}
    </Card>
  );
}

/** A single locked line inside a list — a protocol, a session — by name. */
export function LockedRow({ title, meta }: { title: string; meta?: string }) {
  const router = useRouter();
  return (
    <Card onPress={() => router.push('/upgrade' as never)} accessibilityLabel={`${title}. Plus`}>
      <View style={styles.row}>
        <AppText variant="body" color="textTertiary" style={styles.grow}>
          {title}
        </AppText>
        <AppText variant="caption" color="accent">
          Plus
        </AppText>
      </View>
      {meta ? (
        <AppText variant="caption" color="textTertiary">
          {meta}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  grow: { flexGrow: 1, flexShrink: 1 },
});
