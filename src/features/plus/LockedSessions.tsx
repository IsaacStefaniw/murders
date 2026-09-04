import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { sessionsPlusWouldRun } from '@/features/plus/entitlement';
import { formatTime } from '@/lib/dates';
import type { Routine } from '@/types/domain';

/**
 * On Today, without Plus: what the coaches built for this exact day, by
 * name and time, locked. It is computed from this person's own routines
 * — the ones the interview produced — so it is their day, not a demo.
 */
export function LockedSessions({
  routines,
  date,
  recoveryGoalId,
}: {
  routines: Routine[];
  date: string;
  recoveryGoalId?: string;
}) {
  const router = useRouter();
  const sessions = sessionsPlusWouldRun(routines, date, recoveryGoalId);
  if (sessions.length === 0) return null;
  return (
    <View>
      <SectionHeader title={`Your coaches built ${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} for today`} />
      <View style={styles.stack}>
        {sessions.map((r) => (
          <Card key={r.id} onPress={() => router.push('/upgrade' as never)} accessibilityLabel={`${r.title}, locked`}>
            <View style={styles.row}>
              <AppText variant="heading" color="textTertiary" style={styles.grow}>
                {r.title}
              </AppText>
              <AppText variant="caption" color="accent">
                Plus
              </AppText>
            </View>
            <AppText variant="caption" color="textTertiary">
              around {formatTime(r.preferredStart)} · {r.durationMin} min
            </AppText>
          </Card>
        ))}
      </View>
      <Button
        title="Run my day with Plus"
        onPress={() => router.push('/upgrade' as never)}
        style={styles.cta}
        hint="Opens IntentNorth Plus"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  grow: { flexGrow: 1, flexShrink: 1 },
  cta: { marginTop: Spacing.md },
});
