import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

const DURATIONS = [2, 5, 10];

/** Meditation timer — a quiet screen and a number. Nothing to optimise. */
export default function MeditateSession() {
  const router = useRouter();
  const theme = useTheme();
  const { itemId, date } = useLocalSearchParams<{ itemId?: string; date?: string }>();
  const setItemStatus = useAppStore((s) => s.setItemStatus);
  const logCompletedActivity = useAppStore((s) => s.logCompletedActivity);
  const addMetric = useAppStore((s) => s.addMetric);

  const [totalSec, setTotalSec] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (totalSec === null || remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [totalSec, remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = (completed: boolean) => {
    if (completed && totalSec) {
      // Minutes feed the stillness-practice progression (features/mind).
      addMetric('mind.minutes', Math.max(1, Math.round(totalSec / 60)), 'meditation');
    }
    if (completed && itemId && date) {
      setItemStatus(date, itemId, 'completed', {
        source: 'manual',
        confidence: 1,
        at: new Date().toISOString(),
        note: 'meditation session',
      });
    } else if (completed && totalSec) {
      // Launched from "Any time" rather than a plan item — it still happened,
      // so it still belongs on the day.
      logCompletedActivity({
        title: 'Meditation',
        area: 'health',
        durationMin: Math.max(1, Math.round(totalSec / 60)),
        sessionType: 'meditate',
        note: 'meditation session',
      });
    }
    router.back();
  };

  if (totalSec === null) {
    return (
      <Screen>
        <AppText variant="label" color="accent">
          Sit
        </AppText>
        <AppText variant="title">How long have you got?</AppText>
        <View style={styles.chips}>
          {DURATIONS.map((min) => (
            <Chip
              key={min}
              label={`${min} min`}
              onPress={() => {
                setTotalSec(min * 60);
                setRemaining(min * 60);
              }}
            />
          ))}
        </View>
        <AppText variant="caption" color="textTertiary" style={styles.hint}>
          Eyes closed or soft. Attention on the breath. When the mind wanders — and it will —
          come back without a verdict.
        </AppText>
        <Button title="Not now" variant="ghost" onPress={() => close(false)} />
      </Screen>
    );
  }

  const done = remaining <= 0;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        {done ? (
          <>
            <AppText variant="title">Done.</AppText>
            <AppText variant="secondary">That counts.</AppText>
          </>
        ) : (
          <AppText style={[styles.clock, { color: theme.text }]}>
            {mm}:{ss}
          </AppText>
        )}
      </View>
      <Button
        title={done ? 'Close' : 'End early'}
        variant={done ? 'primary' : 'ghost'}
        onPress={() => close(done)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  hint: { marginTop: Spacing.xl, marginBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  clock: { fontSize: 64, fontWeight: '300', fontVariant: ['tabular-nums'], letterSpacing: 2 },
});
