import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import { PATHS } from '@/features/paths/definitions';
import { describeConstraints } from '@/features/onboarding/constraints';
import { useOnboardingStore } from '@/features/onboarding/state';
import { formatTime } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import { track } from '@/lib/telemetry';

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
  const startPath = useAppStore((s) => s.startPath);

  const plan = useMemo(() => buildLifeOperatingPlan(answers), [answers]);
  const [disabledRoutines, setDisabledRoutines] = useState<Set<string>>(new Set());
  // The first insight is the free half of the promise; this is the moment it is seen.
  useEffect(() => {
    void track('first_insight_seen');
  }, []);

  const approve = () => {
    completeOnboarding({
      profile: plan.profile,
      goals: plan.goals,
      behaviourIntentions: plan.behaviourIntentions,
      // Carried forward so the deferred questions know what has already
      // been asked, weeks later and in a different screen.
      answers,
      routines: plan.routines.map((r) =>
        disabledRoutines.has(r.id) ? { ...r, active: false } : r,
      ),
    });
    // The answers already justify these paths — start them now so day one
    // carries tailored milestones, check-ins and advice, not just blocks.
    for (const start of plan.pathStarts) startPath(start.id, start.answers);
    resetOnboarding();
    // The first insight is free; running it is Plus. The offer sits on
    // Today as a card that can be dismissed, and every locked session opens
    // it on tap — never as a gate between the plan and the first day.
    router.replace('/(tabs)/today' as never);
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
        Your plan
      </AppText>
      <AppText variant="title">
        Here&apos;s what I think matters most, {plan.profile.firstName}.
      </AppText>
      <AppText variant="secondary">
        Your first week, built from your answers. Change any of it now or later — nothing here is
        fixed.
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

      {plan.pathStarts.length > 0 ? (
        <View>
          <SectionHeader title="Programs starting today" />
          <View style={styles.stack}>
            {plan.pathStarts.map((p) => (
              <Card key={p.id}>
                <AppText variant="heading">{PATHS[p.id].title}</AppText>
                <AppText variant="caption" color="textTertiary">
                  Built from your answers — steps, check-ins and guidance from day one. Change it
                  any time under Coaches.
                </AppText>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {/*
        A heading with nothing under it reads as a bug, and it is the first
        thing some people see. Anyone who is not training and did not name
        an ambition arrives here with no goals at all — which is a fine way
        to start, and should look deliberate rather than broken.
      */}
      {plan.goals.length === 0 ? (
        <>
          <SectionHeader title="Goals" />
          <Card>
            <AppText variant="body">No goals yet, and that is a fine place to start.</AppText>
            <AppText variant="caption" color="textTertiary">
              The rhythm below is enough to begin with. Add something to work toward whenever
              you want one — IntentNorth will build the steps.
            </AppText>
          </Card>
        </>
      ) : (
        <>
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
        </>
      )}

      {describeConstraints(plan.profile.constraints).length > 0 ? (
        <View>
          <SectionHeader title="Planned around" />
          <View style={styles.stack}>
            {describeConstraints(plan.profile.constraints).map((c) => (
              <Card key={c.label}>
                <AppText variant="heading">{c.label}</AppText>
                <AppText variant="caption" color="textTertiary">
                  {c.effect}
                </AppText>
              </Card>
            ))}
          </View>
          <AppText variant="caption" color="textTertiary">
            A sensible default, not an assessment. Anything that hurts, or anything being managed,
            is a conversation for a professional.
          </AppText>
        </View>
      ) : null}

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
        This is a starting point, not a questionnaire&apos;s worth of homework — IntentNorth asks the
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
