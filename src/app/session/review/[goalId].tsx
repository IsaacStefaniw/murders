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
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * The weekly operating review — five minutes, structured, and its output
 * is next week's focus, not a diary entry. The diary is the sensor; the
 * calendar is the actuator.
 */
export default function WeeklyReview() {
  const router = useRouter();
  const theme = useTheme();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();

  const goal = useAppStore((s) => s.goals.find((g) => g.id === goalId));
  const setMilestoneDone = useAppStore((s) => s.setMilestoneDone);
  const setGoalNextFocus = useAppStore((s) => s.setGoalNextFocus);

  const [moved, setMoved] = useState('');
  const [lever, setLever] = useState('');
  const [blocking, setBlocking] = useState('');

  if (!goal) {
    return (
      <Screen>
        <AppText variant="title">Goal not found.</AppText>
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const save = () => {
    setGoalNextFocus(goal.id, lever.trim() || undefined);
    router.back();
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
  ];

  return (
    <Screen>
      <AppText variant="label" color="accent">
        Weekly review
      </AppText>
      <AppText variant="title">{goal.title}</AppText>
      {goal.why ? (
        <AppText variant="secondary" style={styles.why}>
          Because: {goal.why}
        </AppText>
      ) : null}

      {goal.milestones?.length ? (
        <View>
          <SectionHeader title="Milestones — tap what's done" />
          <View style={styles.chips}>
            {goal.milestones.map((m) => (
              <Chip
                key={m.id}
                label={m.title}
                selected={m.done}
                onPress={() => setMilestoneDone(goal.id, m.id, !m.done)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <SectionHeader title="What moved this week?" />
      <TextInput
        value={moved}
        onChangeText={setMoved}
        placeholder="One line. Facts beat feelings."
        placeholderTextColor={theme.textTertiary}
        multiline
        style={inputStyle}
      />

      <SectionHeader title="The one lever for next week" />
      <TextInput
        value={lever}
        onChangeText={setLever}
        placeholder="This becomes your growth block's focus"
        placeholderTextColor={theme.textTertiary}
        multiline
        style={inputStyle}
      />

      <SectionHeader title="Anything blocking?" />
      <TextInput
        value={blocking}
        onChangeText={setBlocking}
        placeholder="Optional"
        placeholderTextColor={theme.textTertiary}
        multiline
        style={inputStyle}
      />

      {lever.trim() ? (
        <Card style={{ backgroundColor: theme.accentSoft, borderColor: theme.accent, marginTop: Spacing.xl }}>
          <AppText variant="caption" color="accent">
            Next growth block
          </AppText>
          <AppText variant="heading">{lever.trim()}</AppText>
        </Card>
      ) : null}

      <View style={styles.footer}>
        <Button title="Set next week's focus" onPress={save} disabled={!lever.trim()} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  why: { marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    minHeight: 52,
  },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
