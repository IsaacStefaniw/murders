import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { practiceState } from '@/features/mind/practice';
import { QuestionCard } from '@/features/model/QuestionCard';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * The stillness practice, as a progression — every completed breath or
 * meditation session logs its minutes; four weeks of minutes set the
 * level. A steadier nervous system is the quiet ally of every urge
 * intention, which is why this lives on the recovery path.
 */
export function MindHub() {
  const theme = useTheme();
  const metrics = useAppStore((s) => s.metrics);
  const state = useMemo(() => practiceState(metrics), [metrics]);

  return (
    <View>
      <SectionHeader title={`Stillness practice · Level ${state.level.level} — ${state.level.title}`} />
      <View style={styles.stack}>
        <Card style={{ borderColor: theme.accent }}>
          <AppText variant="body">{state.level.prescription}</AppText>
        </Card>
        <Card>
          <AppText variant="caption" color="textTertiary">
            {state.message} Every finished breath or meditation session counts automatically.
          </AppText>
        </Card>
      </View>
      <QuestionCard domain="mind" />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
});
