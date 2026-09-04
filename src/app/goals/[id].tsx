/**
 * Editing a goal.
 *
 * Goals were write-once: composed at creation and then fixed, with only
 * pause and drop available. That is the wrong shape for anything that lasts
 * a year. Ambitions get renamed as they get clearer, dates move for reasons
 * that have nothing to do with effort, and a milestone ladder drafted by a
 * parser needs a human edit more often than not.
 *
 * The rungs a person adds here carry no measurable condition, so only they
 * can tick them. Inventing one from words the app did not parse would tick
 * a rung off on evidence that has nothing to do with what they meant.
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
import { goalTrajectory } from '@/features/model/trajectory';
import { addDays, formatDateLong, todayKey } from '@/lib/dates';
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

  const [newRung, setNewRung] = useState('');
  const [confirmDrop, setConfirmDrop] = useState(false);

  if (!goal) {
    return (
      <Screen>
        <AppText variant="title">That goal is gone.</AppText>
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const trajectory = goalTrajectory(goal, metrics);

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
          Target: {formatDateLong(goal.targetDate)}
        </AppText>
      ) : null}
      {trajectory ? (
        <Card style={styles.gap}>
          <AppText variant="secondary">{trajectory.headline}</AppText>
          {trajectory.gapNote ? (
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              {trajectory.gapNote}
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
            <View style={styles.rungRow}>
              <AppText variant="caption" color="textTertiary" style={styles.grow}>
                {m.doneWhen && m.doneWhen.kind !== 'confirm'
                  ? 'Ticks itself when the evidence says so'
                  : 'You decide when this is done'}
              </AppText>
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
          value={newRung}
          onChangeText={setNewRung}
          placeholder="Add a step"
          returnKeyType="done"
          onSubmitEditing={() => {
            if (newRung.trim()) addMilestone(goal.id, newRung.trim());
            setNewRung('');
          }}
        />
        <Chip
          label="Add"
          onPress={() => {
            if (newRung.trim()) addMilestone(goal.id, newRung.trim());
            setNewRung('');
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
  rungRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  grow: { flexShrink: 1, flexGrow: 1 },
  gap: { marginTop: Spacing.sm },
  footer: { marginTop: Spacing.xxl },
});
