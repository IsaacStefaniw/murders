import { useRouter } from 'expo-router';
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
  const router = useRouter();
  const previousOpenAt = useAppStore((s) => s.previousOpenAt);
  const workoutLogs = useAppStore((s) => s.workoutLogs);
  const plans = useAppStore((s) => s.plans);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const restartFromAnchor = useAppStore((s) => s.restartFromAnchor);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const [dismissed, setDismissed] = useState(false);
  const [kept, setKept] = useState<string | null>(null);

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
      {/*
        The question the app never asked.

        A fortnight away is almost never "I forgot" — a roster changed, a
        child got sick, work went sideways. The app knew none of that and
        rebuilt the same week regardless, which is how it loses the
        argument about whether it understands your actual life. So it
        asks, in three answers, and each one does something real rather
        than being logged for a report nobody reads.
      */}
      {kept ? (
        <AppText variant="secondary" color="success">
          Starting again from {kept}. Everything else is paused, not gone — switch any of it
          back on in your week whenever you want it.
        </AppText>
      ) : (
        <View style={styles.actions}>
          <AppText variant="label" color="textTertiary">
            What changed?
          </AppText>
          <Button
            title="Nothing much — pick it back up"
            variant="secondary"
            hint="Rebuilds this week from today."
            onPress={() => {
              regeneratePlan(date);
              setDismissed(true);
            }}
          />
          <Button
            title="My week looks different now"
            variant="secondary"
            hint="Opens your week shape, so the plan is built around the days you actually have."
            onPress={() => {
              setDismissed(true);
              router.push('/plan/week-shape' as never);
            }}
          />
          <Button
            title="I need it smaller for a while"
            variant="secondary"
            hint="Keeps one thing and pauses the rest. Nothing is deleted."
            onPress={() => {
              updateProfile({ capacity: 'minimal' });
              const anchor = restartFromAnchor();
              setKept(anchor?.title ?? 'one thing');
            }}
          />
          <Button title="Not now" variant="ghost" onPress={() => setDismissed(true)} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  lines: { marginTop: Spacing.sm, gap: Spacing.sm },
  actions: { marginTop: Spacing.lg, gap: Spacing.sm },
});
