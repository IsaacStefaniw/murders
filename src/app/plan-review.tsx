import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { useOnboardingStore } from '@/features/onboarding/state';
import { formatTime } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

const AREA_LABELS: Record<string, string> = {
  family: 'Family',
  relationship: 'Relationship',
  health: 'Health',
  work: 'Work',
  growth: 'Personal growth',
  enjoyment: 'Enjoyment',
  admin: 'Life admin',
};

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** "Here's what I think matters most." The user edits, then approves. */
export default function PlanReview() {
  const router = useRouter();
  const theme = useTheme();
  const answers = useOnboardingStore((s) => s.answers);
  const resetOnboarding = useOnboardingStore((s) => s.reset);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const plan = useMemo(() => buildLifeOperatingPlan(answers), [answers]);
  const [disabledRoutines, setDisabledRoutines] = useState<Set<string>>(new Set());

  const approve = () => {
    completeOnboarding({
      ...plan,
      routines: plan.routines.map((r) =>
        disabledRoutines.has(r.id) ? { ...r, active: false } : r,
      ),
    });
    resetOnboarding();
    router.replace('/(tabs)/today');
  };

  const toggleRoutine = (id: string) => {
    setDisabledRoutines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Screen>
      <AppText variant="label" color="accent" style={styles.top}>
        Your Life Operating Plan
      </AppText>
      <AppText variant="title">
        Here&apos;s what I think matters most, {plan.profile.firstName}.
      </AppText>

      <SectionHeader title="Priorities" />
      <View style={styles.pillars}>
        {plan.profile.priorities.map((area, index) => (
          <Card key={area} style={styles.pillar}>
            <AppText variant="caption" color="textTertiary">
              {index + 1}
            </AppText>
            <AppText variant="heading">{AREA_LABELS[area] ?? area}</AppText>
          </Card>
        ))}
      </View>

      <SectionHeader title="Starting goals" />
      <View style={styles.stack}>
        {plan.goals.map((goal) => (
          <Card key={goal.id}>
            <AppText variant="heading">{goal.title}</AppText>
            <AppText variant="caption" color="textTertiary">
              {AREA_LABELS[goal.area]}
              {goal.cadencePerWeek ? ` · ${goal.cadencePerWeek}× a week` : ''}
              {goal.milestones?.length ? ` · ${goal.milestones.length} milestones mapped` : ''}
            </AppText>
          </Card>
        ))}
      </View>

      <SectionHeader title="Weekly rhythm" />
      <View style={styles.stack}>
        {plan.routines.map((routine) => (
          <Card key={routine.id} style={styles.routineRow}>
            <View style={styles.routineInfo}>
              <AppText variant="body" style={styles.routineTitle}>
                {routine.title}
              </AppText>
              <AppText variant="caption" color="textTertiary">
                {routine.days.length === 7
                  ? 'Every day'
                  : routine.days.map((d) => DAY_LETTERS[d]).join(' ')}
                {' · around '}
                {formatTime(routine.preferredStart)}
                {routine.protected ? ' · protected' : ''}
              </AppText>
            </View>
            <Switch
              value={!disabledRoutines.has(routine.id)}
              onValueChange={() => toggleRoutine(routine.id)}
              trackColor={{ true: theme.accent }}
              accessibilityLabel={`Include ${routine.title}`}
            />
          </Card>
        ))}
      </View>

      <AppText variant="caption" color="textTertiary" style={styles.progressive}>
        This is a starting point, not a questionnaire&apos;s worth of homework — INTENT asks the
        rest one question at a time, at the moments the answers matter.
      </AppText>

      <View style={styles.footer}>
        <Button title="This is my plan" onPress={approve} />
        <Button
          title="Change my answers"
          variant="ghost"
          onPress={() => router.replace('/interview')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { marginBottom: Spacing.sm },
  pillars: { flexDirection: 'row', gap: Spacing.sm },
  pillar: { flex: 1, gap: Spacing.xs },
  stack: { gap: Spacing.sm },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  routineInfo: { flexShrink: 1, gap: 2 },
  routineTitle: { fontWeight: '600' },
  progressive: { marginTop: Spacing.xl },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
