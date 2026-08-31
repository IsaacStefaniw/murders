import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { protocolById } from '@/features/knowledge/protocols';
import { MindHub } from '@/features/mind/MindHub';
import { MoneyHub } from '@/features/money/MoneyHub';
import { NutritionHub } from '@/features/nutrition/NutritionHub';
import { PATHS, type PathId } from '@/features/paths/definitions';
import { TrainingHub } from '@/features/training/TrainingHub';
import { WorkHub } from '@/features/work/WorkHub';
import { formatTime } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * A path hub: promise → intake → the week, explained. After the intake the
 * hub answers, on one screen: what am I doing this week, why those blocks,
 * what number is mine, and what's the next milestone.
 */
export default function PathHub() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const def = PATHS[id as PathId];

  const profile = useAppStore((s) => s.profile);
  const paths = useAppStore((s) => s.paths);
  const goals = useAppStore((s) => s.goals);
  const routines = useAppStore((s) => s.routines);
  const startPath = useAppStore((s) => s.startPath);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const setMilestoneDone = useAppStore((s) => s.setMilestoneDone);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [retaking, setRetaking] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/life' as never));

  if (!def) {
    return (
      <Screen>
        <AppText variant="title">Unknown path</AppText>
        <Button title="Back" variant="secondary" onPress={close} />
      </Screen>
    );
  }

  const entry = paths[def.id];
  const inputStyle = [
    styles.numInput,
    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
  ];

  const build = () => {
    const patch: { age?: number; weightKg?: number } = {};
    for (const ask of def.personalNumbers ?? []) {
      const n = Number(numbers[ask.key]);
      if (Number.isFinite(n) && n > 0) patch[ask.key] = n;
    }
    if (Object.keys(patch).length > 0) updateProfile(patch);
    startPath(def.id, answers);
    setRetaking(false);
  };

  // ── Intake ─────────────────────────────────────────────────────────────
  if (!entry || retaking) {
    const allAnswered = def.questions.every((q) => answers[q.key]);
    return (
      <Screen>
        <View style={styles.topRow}>
          <AppText variant="label" color="textTertiary" style={styles.grow}>
            Path
          </AppText>
          <Button title="Done" variant="ghost" onPress={close} />
        </View>
        <AppText variant="title">{def.title}</AppText>
        <AppText variant="secondary" style={styles.sub}>
          {def.promise}
        </AppText>

        {def.questions.map((q) => (
          <View key={q.key}>
            <SectionHeader title={q.question} />
            <View style={styles.chips}>
              {q.options.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={answers[q.key] === o.value}
                  onPress={() => setAnswers((prev) => ({ ...prev, [q.key]: o.value }))}
                />
              ))}
            </View>
          </View>
        ))}

        {(def.personalNumbers ?? []).map((ask) => (
          <View key={ask.key}>
            <SectionHeader title={`${ask.label} (optional)`} />
            <TextInput
              value={numbers[ask.key] ?? ''}
              onChangeText={(t) => setNumbers((prev) => ({ ...prev, [ask.key]: t }))}
              keyboardType="numeric"
              placeholder="—"
              placeholderTextColor={theme.textTertiary}
              style={inputStyle}
            />
            <AppText variant="caption" color="textTertiary" style={styles.why}>
              {ask.why}
            </AppText>
          </View>
        ))}

        <Button
          title="Build my program"
          disabled={!allAnswered}
          onPress={build}
          style={styles.buildButton}
        />
        {!allAnswered ? (
          <AppText variant="caption" color="textTertiary" style={styles.why}>
            Every question here changes the program — that&apos;s why they&apos;re asked.
          </AppText>
        ) : null}
      </Screen>
    );
  }

  // ── Hub ────────────────────────────────────────────────────────────────
  const goal = goals.find((g) => g.id === entry.goalId);
  const pathRoutines = routines.filter((r) => r.goalId === entry.goalId && r.active);
  const insights = def.insights(entry.answers, profile);
  const milestonesDone = goal?.milestones?.filter((m) => m.done).length ?? 0;
  const sessionRoute =
    def.id === 'work' && goal ? `/session/review/${goal.id}` : def.sessionRoute;
  const sessionLabel = def.id === 'work' ? 'Run the weekly review' : def.sessionLabel;

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Path
        </AppText>
        <Button title="Done" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">{def.title}</AppText>

      {sessionRoute && sessionLabel ? (
        <Card
          onPress={() => router.push(sessionRoute as never)}
          style={{
            backgroundColor: theme.accentSoft,
            borderColor: theme.accent,
            marginTop: Spacing.lg,
          }}
          accessibilityLabel={sessionLabel}
        >
          <AppText variant="heading" color="accent">
            {sessionLabel}
          </AppText>
        </Card>
      ) : null}

      {def.id === 'training' ? <TrainingHub /> : null}
      {def.id === 'nutrition' ? <NutritionHub /> : null}
      {def.id === 'money' ? <MoneyHub /> : null}
      {def.id === 'work' ? <WorkHub /> : null}
      {def.id === 'recovery' ? <MindHub /> : null}

      <SectionHeader title="Yours, specifically" />
      <View style={styles.stack}>
        {insights.map((line, i) => (
          <Card key={i}>
            <AppText variant="body">{line}</AppText>
          </Card>
        ))}
      </View>

      {goal?.milestones?.length ? (
        <View>
          <SectionHeader
            title={`Milestones · ${milestonesDone} of ${goal.milestones.length}`}
          />
          <View style={styles.chips}>
            {goal.milestones.map((m) => (
              <Chip
                key={m.id}
                label={m.done ? `✓ ${m.title}` : m.title}
                selected={m.done}
                onPress={() => setMilestoneDone(goal.id, m.id, !m.done)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <SectionHeader title="Your week, and why" />
      <View style={styles.stack}>
        {pathRoutines.map((r) => {
          const why = r.protocolId ? protocolById(r.protocolId)?.why : undefined;
          return (
            <Card key={r.id}>
              <AppText variant="heading">{r.title}</AppText>
              <AppText variant="caption" color="textTertiary">
                {r.days.length >= 7 ? 'Every day' : r.days.map((d) => DAY_LETTERS[d]).join(' ')}
                {' · around '}
                {formatTime(r.preferredStart)} · {r.durationMin} min
              </AppText>
              {why ? (
                <AppText variant="caption" style={styles.whyLine}>
                  {why}
                </AppText>
              ) : null}
            </Card>
          );
        })}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.why}>
        These are scheduled into your real days automatically — and adapt as INTENT learns when
        they actually happen for you.
      </AppText>

      <Button
        title="Retune — retake the questions"
        variant="ghost"
        onPress={() => setRetaking(true)}
        style={styles.buildButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flexGrow: 1 },
  sub: { marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stack: { gap: Spacing.sm },
  numInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 17,
    width: 120,
  },
  why: { marginTop: Spacing.sm },
  whyLine: { marginTop: Spacing.xs, fontStyle: 'italic' },
  buildButton: { marginTop: Spacing.xl },
});
