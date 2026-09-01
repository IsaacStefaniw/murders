import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { distinctWeeks } from '@/features/paths/level';
import { returnSummary } from '@/features/today/returning';
import { useAppStore } from '@/state/store';

/**
 * The screen after an absence.
 *
 * Dismissible and shown once: it is a greeting, not a status panel, and a
 * greeting that will not go away is a nag.
 */
export function WelcomeBack({ date }: { date: string }) {
  const previousOpenAt = useAppStore((s) => s.previousOpenAt);
  const workoutLogs = useAppStore((s) => s.workoutLogs);
  const plans = useAppStore((s) => s.plans);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const [dismissed, setDismissed] = useState(false);

  const summary = useMemo(() => {
    const performed = workoutLogs.filter((l) => l.sets.length > 0);
    return returnSummary({
      lastOpenedAt: previousOpenAt,
      sessionsLogged: performed.length,
      weeksLogged: distinctWeeks(performed.map((l) => l.date)),
      today: plans[date],
    });
  }, [previousOpenAt, workoutLogs, plans, date]);

  if (!summary || dismissed) return null;

  return (
    <Card style={styles.card}>
      <AppText variant="heading">{summary.headline}</AppText>
      <View style={styles.lines}>
        {summary.lines.map((line) => (
          <AppText key={line} variant="secondary" color="textSecondary">
            {line}
          </AppText>
        ))}
      </View>
      <View style={styles.actions}>
        {summary.planIsStale ? (
          <Button
            title="Rebuild today"
            variant="secondary"
            hint="Builds today's plan from where things actually are now."
            onPress={() => {
              regeneratePlan(date);
              setDismissed(true);
            }}
          />
        ) : null}
        <Button title="Got it" variant="ghost" onPress={() => setDismissed(true)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  lines: { marginTop: Spacing.sm, gap: Spacing.sm },
  actions: { marginTop: Spacing.lg, gap: Spacing.sm },
});
