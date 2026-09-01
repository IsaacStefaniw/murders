import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { readinessFrom } from '@/features/health/readiness';
import { useAppStore } from '@/state/store';

/**
 * This morning's recovery read, when there is one.
 *
 * Renders nothing at all on the ordinary day, which is most days — the
 * signal is worth something precisely because it does not appear every
 * morning. A card that says "you're ready!" daily is wallpaper by week two,
 * and then says nothing on the morning it matters.
 *
 * It never diagnoses. It names the person's own numbers, says what the
 * session does about it, and stops.
 */
export function ReadinessCard() {
  const metrics = useAppStore((s) => s.metrics);
  const readiness = useMemo(() => readinessFrom(metrics), [metrics]);
  if (!readiness) return null;

  return (
    <Card style={styles.card}>
      <AppText variant="label" color="textSecondary">
        This morning
      </AppText>
      <AppText variant="heading" style={styles.gap}>
        {readiness.headline}
      </AppText>
      <View style={styles.signals}>
        {readiness.signals.map((s) => (
          <AppText key={s} variant="secondary" color="textSecondary">
            {s}
          </AppText>
        ))}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.gap}>
        Compared against your own two-week normal, never a population average — these numbers only
        mean anything relative to you.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  gap: { marginTop: Spacing.sm },
  signals: { marginTop: Spacing.sm, gap: Spacing.xs },
});
