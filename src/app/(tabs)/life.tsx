import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/** Life: goals, behaviour intentions, people. The slower-moving layer. */
export default function Life() {
  const router = useRouter();
  const theme = useTheme();

  const profile = useAppStore((s) => s.profile);
  const goals = useAppStore((s) => s.goals);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);
  const logBehaviourEvent = useAppStore((s) => s.logBehaviourEvent);

  // Rolling 7-day window. The clock read is deliberate and the computation
  // trivial; a stable-per-render anchor would only make counts staler.
  // eslint-disable-next-line react-hooks/purity
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  if (!profile) return <Screen tabbed />;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const activeIntentions = behaviourIntentions.filter((b) => b.active);

  return (
    <Screen tabbed>
      <AppText variant="label" color="textTertiary">
        Life
      </AppText>
      <AppText variant="title">What you&apos;re building</AppText>

      <SectionHeader title="Goals" />
      {activeGoals.length === 0 ? (
        <EmptyState
          title="No active goals"
          message="A goal becomes a routine, a routine becomes your days."
          actionTitle="Add a goal"
          onAction={() => router.push('/goals/new')}
        />
      ) : (
        <View style={styles.stack}>
          {activeGoals.map((goal) => (
            <Card key={goal.id}>
              <AppText variant="heading">{goal.title}</AppText>
              <AppText variant="caption" color="textTertiary">
                {goal.cadencePerWeek
                  ? `${goal.cadencePerWeek}× a week · ${goal.routineIds.length > 0 ? 'scheduled automatically' : 'not scheduled yet'}`
                  : 'Ambition — break it down when ready'}
              </AppText>
            </Card>
          ))}
          <Button title="Add a goal" variant="secondary" onPress={() => router.push('/goals/new')} />
        </View>
      )}

      <SectionHeader title="Working on" />
      {activeIntentions.length === 0 ? (
        <AppText variant="secondary">
          Nothing tracked. You can add behaviours to reduce from Settings.
        </AppText>
      ) : (
        <View style={styles.stack}>
          {activeIntentions.map((intention) => {
            const info = behaviourInfo(intention.behaviour);
            const count = behaviourEvents.filter(
              (e) => e.intentionId === intention.id && e.occurredAt >= weekAgo,
            ).length;
            return (
              <Card key={intention.id}>
                <View style={styles.intentionRow}>
                  <View style={styles.intentionInfo}>
                    <AppText variant="heading">{intention.intentionText}</AppText>
                    <AppText variant="caption" color="textTertiary">
                      {info.label} · {count === 0 ? 'clear this week' : `${count} this week`}
                    </AppText>
                  </View>
                  <Button
                    title="It happened"
                    variant="ghost"
                    onPress={() => logBehaviourEvent(intention.id)}
                  />
                </View>
                {info.safetyNote ? (
                  <AppText variant="caption" color="textTertiary" style={styles.safety}>
                    {info.safetyNote}
                  </AppText>
                ) : null}
              </Card>
            );
          })}
          <AppText variant="caption" color="textTertiary" style={styles.note}>
            Logging is data, not judgement. Trends show up in your weekly review.
          </AppText>
        </View>
      )}

      <SectionHeader title="People" />
      <Card style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }}>
        <AppText variant="heading">
          {profile.people.find((p) => p.relation === 'partner')?.name ?? 'Your household'}
        </AppText>
        <AppText variant="secondary">
          Shared calendars, date-night planning and babysitter messages arrive with accounts.
          Everything stays private unless you explicitly share it.
        </AppText>
      </Card>

      <Button
        title="Settings"
        variant="ghost"
        onPress={() => router.push('/settings')}
        style={styles.settings}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  intentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  intentionInfo: { flexShrink: 1, gap: 2 },
  safety: { marginTop: Spacing.md },
  note: { marginTop: Spacing.xs },
  settings: { marginTop: Spacing.xxl },
});
