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
import { askCheckin, assessGoal, describeCheckin, describeStep, paceLanding } from '@/features/goals/composer';
import { latest } from '@/features/model/metrics';
import { reviewAsText, reviewPeriod, reviewQuestions } from '@/features/review/period';
import { shareText } from '@/lib/share';
import { todayKey } from '@/lib/dates';

/**
 * The weekly review — five minutes, structured, and its output is next
 * week's focus, not a diary entry. The diary is the sensor; the calendar
 * is the actuator.
 *
 * It opens with the one number the goal moves on. Recording progress is
 * most of what makes a goal happen, and a review that asks three
 * open questions and never the number is a diary.
 */
export default function WeeklyReview() {
  const router = useRouter();
  const theme = useTheme();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();

  const goal = useAppStore((s) => s.goals.find((g) => g.id === goalId));
  const metrics = useAppStore((s) => s.metrics);
  const planEvents = useAppStore((s) => s.planEvents);
  const setMilestoneDone = useAppStore((s) => s.setMilestoneDone);
  const setGoalNextFocus = useAppStore((s) => s.setGoalNextFocus);
  const answerCheckin = useAppStore((s) => s.answerCheckin);

  // Named for the week it is actually about. A growth block that lands on
  // a Monday was asking what moved "this week" before the week had started.
  const period = reviewPeriod(todayKey());
  const questions = reviewQuestions(period);

  const [number, setNumber] = useState('');
  const [numberSaved, setNumberSaved] = useState(false);
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

  const ask = askCheckin(goal);
  const lastReading = ask ? latest(metrics, ask.metricKey) : null;
  const otherCheckin = ask ? null : goal.checkins?.[0];
  const assessment = assessGoal(goal, { metrics, planEvents });
  const landing = paceLanding(goal, metrics);

  const saveNumber = () => {
    if (!ask) return;
    const n = Number(number);
    if (!Number.isFinite(n) || n <= 0) return;
    answerCheckin(ask.id, ask.metricKey, n);
    setNumber('');
    setNumberSaved(true);
  };

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

      {ask ? (
        <View>
          <SectionHeader title="The one number" />
          <Card>
            <AppText variant="heading">{ask.prompt ?? ask.label}</AppText>
            <AppText variant="caption" color="textTertiary">
              {lastReading
                ? `Last time: ${ask.unit === '$' ? '$' : ''}${lastReading.value.toLocaleString('en-AU')}${ask.unit && ask.unit !== '$' ? ` ${ask.unit}` : ''}.`
                : 'First reading — everything else is measured from here.'}
            </AppText>
            <View style={styles.numberRow}>
              <Field
                label={`${ask.prompt ?? ask.label}${ask.unit ? ` in ${ask.unit}` : ''}`}
                showLabel={false}
                value={number}
                onChangeText={setNumber}
                keyboardType="decimal-pad"
                placeholder={lastReading ? String(lastReading.value) : ask.unit || '0'}
                unit={ask.unit}
                returnKeyType="done"
                onSubmitEditing={saveNumber}
                width={140}
              />
              <Chip label={numberSaved && !number ? 'Saved' : 'Save'} selected onPress={saveNumber} />
            </View>
            {landing ? (
              <AppText variant="caption" color="textSecondary" style={styles.why}>
                {landing.headline}
              </AppText>
            ) : null}
          </Card>
        </View>
      ) : otherCheckin ? (
        <View>
          <SectionHeader title="The one number" />
          <Card>
            <AppText variant="body">{describeCheckin(otherCheckin)}</AppText>
            <AppText variant="caption" color="textTertiary" style={styles.why}>
              {assessment.reason}
            </AppText>
          </Card>
        </View>
      ) : null}

      {assessment.next ? (
        <View>
          <SectionHeader title="Next step" />
          <Card>
            <AppText variant="heading">{assessment.next.title}</AppText>
            <AppText variant="caption" color="textTertiary">
              {describeStep(assessment.next)}
            </AppText>
            {assessment.next.how ? (
              <AppText variant="caption" color="textSecondary" style={styles.why}>
                How: {assessment.next.how}
              </AppText>
            ) : null}
            {assessment.next.intention ? (
              <AppText variant="caption" color="textSecondary">
                {assessment.next.intention}
              </AppText>
            ) : null}
          </Card>
        </View>
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
  numberRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
