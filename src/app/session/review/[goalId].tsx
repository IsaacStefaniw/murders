import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import { reviewAsText, reviewPeriod, reviewQuestions } from '@/features/review/period';
import { shareText } from '@/lib/share';
import { todayKey } from '@/lib/dates';

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

  // Named for the week it is actually about. A growth block that lands on
  // a Monday was asking what moved "this week" before the week had started.
  const period = reviewPeriod(todayKey());
  const questions = reviewQuestions(period);

  const [moved, setMoved] = useState('');
  const [lever, setLever] = useState('');
  const [blocking, setBlocking] = useState('');
  const [sent, setSent] = useState(false);

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
          <SectionHeader title="Steps — tap what's done" />
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

      <SectionHeader title={questions.moved} />
      <Field
        label={questions.moved}
        showLabel={false}
        value={moved}
        onChangeText={setMoved}
        placeholder="One line. Facts beat feelings."
        multiline
      />

      <SectionHeader title={questions.lever} />
      <Field
        label={questions.lever}
        showLabel={false}
        value={lever}
        onChangeText={setLever}
        placeholder="This becomes your growth block's focus"
        multiline
      />

      <SectionHeader title="Anything blocking?" />
      <Field
        label="Anything blocking?"
        showLabel={false}
        value={blocking}
        onChangeText={setBlocking}
        placeholder="Optional"
        multiline
      />

      {lever.trim() ? (
        <Card style={{ backgroundColor: theme.accentSoft, borderColor: theme.accent, marginTop: Spacing.xl }}>
          <AppText variant="caption" color="accent">
            Next growth block
          </AppText>
          <AppText variant="heading">{lever.trim()}</AppText>
        </Card>
      ) : null}

      {/* The growth block lands in the middle of a workday, where a phone
          is the worst surface in the room and a laptop is already open.
          The share sheet has Mail in it, so the questions can go to a work
          address and be answered there. */}
      <Button
        title={sent ? 'Sent ✓' : 'Send these questions to myself'}
        variant="secondary"
        hint="Opens Mail, Messages or Notes with the questions and where the goal stands."
        onPress={async () => {
          const { shared } = await shareText(
            reviewAsText(goal.title, period, goal.milestones ?? []),
            `${goal.title} — weekly review`,
          );
          if (!shared) return;
          setSent(true);
          setTimeout(() => setSent(false), 2500);
        }}
        style={styles.sendButton}
      />

      <View style={styles.footer}>
        <Button
          title={`Set the focus for ${period.lookingForward}`}
          onPress={save}
          disabled={!lever.trim()}
        />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sendButton: { marginTop: Spacing.xl },
  why: { marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
