/**
 * Training history — every session, still editable.
 *
 * Isaac's report was "you can't adjust the reps or weight you've done".
 * Fixing that inside the player only fixes it for today; a set you typed
 * wrong on Tuesday is discovered on Saturday. Sessions stay open here for
 * as long as they exist, and every correction re-derives the strength
 * baseline rather than layering a second number on top of the first.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { bestE1rm, volumeOf } from '@/features/training/log';
import { SetLogger } from '@/features/training/SetLogger';
import { formatDateLong } from '@/lib/dates';
import { useAppStore } from '@/state/store';

export default function TrainingHistory() {
  const router = useRouter();
  const workoutLogs = useAppStore((s) => s.workoutLogs);
  const updateLoggedSet = useAppStore((s) => s.updateLoggedSet);
  const removeLoggedSet = useAppStore((s) => s.removeLoggedSet);
  const removeWorkoutLog = useAppStore((s) => s.removeWorkoutLog);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const logs = [...workoutLogs].sort((a, b) => b.date.localeCompare(a.date));

  if (logs.length === 0) {
    return (
      <Screen>
        <AppText variant="label" color="accent">
          Training
        </AppText>
        <AppText variant="title">No sessions logged yet</AppText>
        <EmptyState
          title="Nothing here yet"
          message="Log a workout and every set stays here — editable, and feeding your strength numbers."
          actionTitle="Start a workout"
          onAction={() => router.push('/session/workout')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="label" color="accent">
        Training
      </AppText>
      <AppText variant="title">Every session, still editable</AppText>

      <SectionHeader title="Sessions" />
      <View style={styles.stack}>
        {logs.map((log) => {
          const open = openId === log.id;
          const exercises = [...new Set(log.sets.map((s) => s.exercise))];
          const volume = volumeOf(log.sets);
          return (
            <Card key={log.id}>
              <View style={styles.header}>
                <View style={styles.headerInfo}>
                  <AppText variant="heading">{log.title}</AppText>
                  <AppText variant="caption" color="textTertiary">
                    {formatDateLong(log.date)} · {log.sets.length} sets
                    {volume > 0 ? ` · ${Math.round(volume).toLocaleString()} kg lifted` : ''}
                  </AppText>
                </View>
                <Chip
                  label={open ? 'Close' : 'Edit'}
                  selected={open}
                  onPress={() => setOpenId(open ? null : log.id)}
                />
              </View>

              {!open ? (
                <AppText variant="caption" color="textTertiary" style={styles.gap}>
                  {exercises.join(' · ')}
                </AppText>
              ) : (
                <View style={styles.gap}>
                  {exercises.map((name) => {
                    const sets = log.sets
                      .filter((s) => s.exercise === name)
                      .sort((a, b) => a.index - b.index);
                    const best = bestE1rm([log], name);
                    return (
                      <View key={name} style={styles.exercise}>
                        <SetLogger
                          exercise={name}
                          prescribedSets={sets.length}
                          prescribedReps={
                            best ? `best set here ≈ ${best.value} kg estimated max` : 'as performed'
                          }
                          sets={sets}
                          onAddSet={() => {}}
                          onEditSet={(setId, patch) => updateLoggedSet(log.id, setId, patch)}
                          onRemoveSet={(setId) => removeLoggedSet(log.id, setId)}
                        />
                      </View>
                    );
                  })}
                  {confirmDelete === log.id ? (
                    <View style={styles.confirmRow}>
                      <AppText variant="caption" color="textTertiary">
                        Delete this session and the numbers it produced?
                      </AppText>
                      <Chip
                        label="Delete"
                        selected
                        onPress={() => {
                          removeWorkoutLog(log.id);
                          setConfirmDelete(null);
                          setOpenId(null);
                        }}
                      />
                      <Chip label="Keep" onPress={() => setConfirmDelete(null)} />
                    </View>
                  ) : (
                    <Chip label="Delete session" onPress={() => setConfirmDelete(log.id)} />
                  )}
                </View>
              )}
            </Card>
          );
        })}
      </View>

      <AppText variant="caption" color="textTertiary" style={styles.note}>
        Editing a set re-derives your estimated max for that lift — the old number is replaced, not
        kept beside it.
      </AppText>
      <Button title="Back" variant="ghost" onPress={() => router.back()} style={styles.note} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  headerInfo: { flexShrink: 1, gap: 2 },
  gap: { marginTop: Spacing.sm },
  exercise: { marginBottom: Spacing.sm },
  confirmRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  note: { marginTop: Spacing.lg },
});
