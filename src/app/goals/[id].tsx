/**
 * Editing a goal.
 *
 * Goals were write-once: composed at creation and then fixed, with only
 * pause and drop available. That is the wrong shape for anything that lasts
 * a year. Ambitions get renamed as they get clearer, dates move for reasons
 * that have nothing to do with effort, and a list of steps drafted by a
 * parser needs a human edit more often than not.
 *
 * The steps a person adds here carry no measurable condition, so only they
 * can tick them. Inventing one from words the app did not parse would tick
 * a step off on evidence that has nothing to do with what they meant.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { describeStep, formatDay, paceLanding } from '@/features/goals/composer';
import { goalTrajectory } from '@/features/model/trajectory';
import { addDays, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

const HORIZONS = [
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '12 months', months: 12 },
];

export default function EditGoal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const goal = useAppStore((s) => s.goals.find((g) => g.id === id));
  const metrics = useAppStore((s) => s.metrics);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const updateMilestone = useAppStore((s) => s.updateMilestone);
  const addMilestone = useAppStore((s) => s.addMilestone);
  const removeMilestone = useAppStore((s) => s.removeMilestone);
  const setMilestoneDone = useAppStore((s) => s.setMilestoneDone);
  const setGoalStatus = useAppStore((s) => s.setGoalStatus);

  const [newStep, setNewStep] = useState('');
  const [confirmDrop, setConfirmDrop] = useState(false);

  if (!goal) {
    return (
      <Screen>
        <AppText variant="title">That goal is gone.</AppText>
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  // The fitted line through the readings once there are enough of them;
  // until then, where the plan's own pace lands from the latest reading.
  const trajectory = goalTrajectory(goal, metrics);
  const landing = paceLanding(goal, metrics);
  const headline =
    trajectory && trajectory.verdict !== 'not-enough-data' ? trajectory.headline : landing?.headline;
  const gapNote =
    trajectory && trajectory.verdict !== 'not-enough-data' ? trajectory.gapNote : goal.pace?.note;

  return (
    <Screen>
      <AppText variant="label" color="accent">
        Goal
      </AppText>

      <SectionHeader title="What it is" />
      <Field
        label="Goal title"
        showLabel={false}
        value={goal.title}
        onChangeText={(title) => updateGoal(goal.id, { title })}
        size="large"
        multiline
      />

      <SectionHeader title="Why" />
      <Field
        label="Why this goal matters"
        showLabel={false}
        value={goal.why ?? ''}
        onChangeText={(why) => updateGoal(goal.id, { why: why || undefined })}
        placeholder="The reason, in your words. Used when motivation dips."
        multiline
      />

      <SectionHeader title="By when" />
      <View style={styles.chips}>
        {HORIZONS.map((h) => {
          const date = addDays(todayKey(), Math.round(h.months * 30.44));
          return (
            <Chip
              key={h.months}
              label={h.label}
              selected={goal.targetDate === date}
              onPress={() => updateGoal(goal.id, { targetDate: date })}
            />
          );
        })}
        <Chip
          label="No date"
          selected={!goal.targetDate}
          onPress={() => updateGoal(goal.id, { targetDate: undefined })}
        />
      </View>
      {goal.targetDate ? (
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          Target: {formatDay(goal.targetDate)}
        </AppText>
      ) : null}
      {headline || gapNote ? (
        <Card style={styles.gap}>
          {headline ? <AppText variant="secondary">{headline}</AppText> : null}
          {gapNote ? (
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              {gapNote}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      <SectionHeader title="Steps to get there" />
      <View style={styles.stack}>
        {(goal.milestones ?? []).map((m) => (
          <Card key={m.id}>
            <Field
              label={`Step: ${m.title}`}
              showLabel={false}
              value={m.title}
              onChangeText={(title) => updateMilestone(goal.id, m.id, { title })}
            />
            <View style={styles.stepLines}>
              <AppText variant="caption" color="textTertiary">
                {describeStep(m)}
                {m.doneWhen && m.doneWhen.kind !== 'confirm' ? ' · ticks itself' : ' · you decide'}
              </AppText>
              {m.how ? (
                <AppText variant="caption" color="textSecondary">
                  How: {m.how}
                </AppText>
              ) : null}
              {m.intention ? (
                <AppText variant="caption" color="textSecondary">
                  {m.intention}
                </AppText>
              ) : null}
            </View>
            <View style={styles.stepRow}>
              <Chip
                label={m.done ? 'Done' : 'Mark done'}
                selected={m.done}
                onPress={() => setMilestoneDone(goal.id, m.id, !m.done)}
              />
              <Chip label="Remove" onPress={() => removeMilestone(goal.id, m.id)} />
            </View>
          </Card>
        ))}
      </View>
      <View style={styles.addRow}>
        <Field
          label="Add a step"
          showLabel={false}
          style={styles.grow}
          value={newStep}
          onChangeText={setNewStep}
          placeholder="Add a step"
          returnKeyType="done"
          onSubmitEditing={() => {
            if (newStep.trim()) addMilestone(goal.id, newStep.trim());
            setNewStep('');
          }}
        />
        <Chip
          label="Add"
          onPress={() => {
            if (newStep.trim()) addMilestone(goal.id, newStep.trim());
            setNewStep('');
          }}
        />
      </View>

      <SectionHeader title="Status" />
      <View style={styles.chips}>
        {(['active', 'paused'] as const).map((status) => (
          <Chip
            key={status}
            label={status === 'active' ? 'Active' : 'Paused'}
            selected={goal.status === status}
            onPress={() => setGoalStatus(goal.id, status)}
          />
        ))}
        <Chip
          label="Achieved"
          selected={goal.status === 'achieved'}
          onPress={() => setGoalStatus(goal.id, 'achieved')}
        />
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.gap}>
        Pausing keeps everything and stops the scheduling. Nothing is deleted.
      </AppText>

      {confirmDrop ? (
        <Card style={styles.gap}>
          <AppText variant="body">Drop this goal? Its history stays, its routines stop.</AppText>
          <View style={styles.chips}>
            <Chip
              label="Drop it"
              selected
              onPress={() => {
                setGoalStatus(goal.id, 'dropped');
                router.back();
              }}
            />
            <Chip label="Keep it" onPress={() => setConfirmDrop(false)} />
          </View>
        </Card>
      ) : (
        <Chip label="Drop this goal" onPress={() => setConfirmDrop(true)} />
      )}

      <Button title="Done" onPress={() => router.back()} style={styles.footer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  stepLines: { marginTop: Spacing.xs, gap: Spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  grow: { flexShrink: 1, flexGrow: 1 },
  gap: { marginTop: Spacing.sm },
  footer: { marginTop: Spacing.xxl },
});
