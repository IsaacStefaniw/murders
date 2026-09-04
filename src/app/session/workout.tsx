import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { effortWords } from '@/features/training/effort';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { syncAppleHealth } from '@/features/health/healthkit';
import { buildWorkout } from '@/features/modalities/gym/program';
import { lastPerformance, makeSet, newLog, suggestNext } from '@/features/training/log';
import { defaultRepsFrom, SetLogger, topRepsFrom } from '@/features/training/SetLogger';
import { readinessFrom } from '@/features/health/readiness';
import { autoRegulate, weekOf } from '@/features/training/programme';
import { dateKeyToDate, durationMinutes, todayKey } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import type { LoggedSet } from '@/types/domain';

/**
 * Workout player: everything decided before the gym door — exercises,
 * sets, rests. Tick sets off, run the rest timer, done.
 */
export default function WorkoutSession() {
  const router = useRouter();
  const theme = useTheme();
  const { itemId, date } = useLocalSearchParams<{ itemId?: string; date?: string }>();
  const profile = useAppStore((s) => s.profile);
  const plans = useAppStore((s) => s.plans);
  const setItemStatus = useAppStore((s) => s.setItemStatus);
  const logCompletedActivity = useAppStore((s) => s.logCompletedActivity);

  const item = itemId && date ? plans[date]?.items.find((i) => i.id === itemId) : undefined;
  const availableMin = item
    ? durationMinutes(item.start, item.end)
    : (profile?.trainingDurationMin ?? 45);

  const programme = useAppStore((s) => s.trainingProgramme);
  const metrics = useAppStore((s) => s.metrics);
  const addMetric = useAppStore((s) => s.addMetric);

  // Cross-pathway: last night's sleep adjusts today's session.
  // With Apple Health connected the number arrives on its own.
  useEffect(() => {
    void syncAppleHealth();
  }, []);
  const today = todayKey();
  const loggedSleep = metrics.find((m) => m.key === 'sleep.hours' && m.at.slice(0, 10) === today);
  const [startedAt] = useState(() => Date.now());
  const [manualSleep, setManualSleep] = useState<number | null>(null);
  // A tap wins; otherwise today's logged value (incl. an Apple Health sync
  // landing after mount) pre-fills the chips.
  const sleptHours = manualSleep ?? loggedSleep?.value ?? null;
  const logSleep = (h: number) => {
    setManualSleep(h);
    if (!loggedSleep) addMetric('sleep.hours', h, 'pre-workout check');
  };

  // This morning's recovery read, against this person's own baseline.
  // Null for most people most weeks — nothing is invented from no data.
  const readiness = useMemo(() => readinessFrom(metrics), [metrics]);

  const session = useMemo(() => {
    const weekday = dateKeyToDate(date ?? todayKey()).getDay();
    // Training v2: when a block is active, today runs the PROGRAMME —
    // your lifts, your loads — auto-regulated to the time that exists
    // and the night that actually happened.
    const week = programme ? weekOf(programme) : null;
    if (programme && week) {
      const wk = programme.weeks[week - 1];
      const idx = Math.floor((weekday * wk.sessions.length) / 7) % wk.sessions.length;
      const adjusted = autoRegulate(wk.sessions[idx], {
        availableMin,
        sleptHours: sleptHours ?? undefined,
        age: programme.inputs.age,
        readiness: readiness?.band,
      });
      return {
        title: `Week ${week} · ${adjusted.title}`,
        estimatedMin: adjusted.estimatedMin,
        note: adjusted.note ?? wk.focus,
        exercises: adjusted.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: `${e.reps}${e.loadKg ? ` @ ${e.loadKg} kg` : e.rpe ? ` · ${effortWords(e.rpe)}` : ''}`,
          restSec: e.restSec,
          // Carried through rather than baked into the label: the set
          // logger prefills from it, and a string cannot be prefilled from.
          loadKg: e.loadKg,
        })),
      };
    }
    return buildWorkout(availableMin, profile?.trainingPreference ?? 'mixed', weekday);
  }, [availableMin, profile?.trainingPreference, date, programme, sleptHours, readiness?.band]);

  const workoutLogs = useAppStore((s) => s.workoutLogs);
  const saveWorkoutLog = useAppStore((s) => s.saveWorkoutLog);
  const sessionDate = date ?? todayKey();

  /**
   * One log per training day, derived rather than held in state: created on
   * the first set so that opening the screen and walking away leaves no
   * phantom session behind, and found again on re-entry so a set typed
   * wrong an hour ago can be corrected rather than duplicated.
   */
  const log = useMemo(
    () => workoutLogs.find((l) => l.date === sessionDate) ?? null,
    [workoutLogs, sessionDate],
  );

  const [restLeft, setRestLeft] = useState(0);

  useEffect(() => {
    if (restLeft <= 0) return;
    const t = setInterval(() => setRestLeft((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [restLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) {
    return (
      <Screen>
        <AppText variant="title">Not enough time for a real session.</AppText>
        <AppText variant="secondary">Under 15 minutes — a walk beats a rushed workout.</AppText>
        <Button title="Back" variant="ghost" onPress={() => router.back()} style={styles.footer} />
      </Screen>
    );
  }

  const totalSets = session.exercises.reduce((s, e) => s + e.sets, 0);
  const loggedSets = log?.sets ?? [];
  const completedSets = loggedSets.length;
  const allDone = completedSets >= totalSets;

  const setsFor = (name: string) =>
    loggedSets.filter((s) => s.exercise === name).sort((a, b) => a.index - b.index);

  const addSet = (name: string, restSec: number, reps: number, weightKg?: number) => {
    const current = log ?? newLog(sessionDate, session.title);
    const index = current.sets.filter((s) => s.exercise === name).length + 1;
    saveWorkoutLog({ ...current, sets: [...current.sets, makeSet(name, index, reps, weightKg)] });
    if (restSec > 0) setRestLeft(restSec);
  };

  const editSet = (setId: string, patch: Partial<LoggedSet>) => {
    if (!log) return;
    saveWorkoutLog({
      ...log,
      sets: log.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    });
  };

  const removeSet = (setId: string) => {
    if (!log) return;
    const remaining = log.sets.filter((s) => s.id !== setId);
    // Re-index within the exercise so the labels stay 1, 2, 3 rather than
    // developing a gap where a mistyped set used to be.
    const counts = new Map<string, number>();
    saveWorkoutLog({
      ...log,
      sets: remaining.map((s) => {
        const n = (counts.get(s.exercise) ?? 0) + 1;
        counts.set(s.exercise, n);
        return { ...s, index: n };
      }),
    });
  };

  const finish = () => {
    // What it actually took, not what was estimated; capped so a screen
    // left open all afternoon does not become a four-hour session.
    const elapsedMin = Math.max(1, Math.min(session.estimatedMin * 3, Math.round((Date.now() - startedAt) / 60000)));
    const note = `workout session · ${completedSets}/${totalSets} sets`;
    if (log) saveWorkoutLog({ ...log, durationMin: elapsedMin, note });
    if (itemId && date) {
      setItemStatus(date, itemId, 'completed', {
        source: 'manual',
        confidence: 1,
        at: new Date().toISOString(),
        note,
      });
    } else if (completedSets > 0) {
      // Started from "Any time" with no plan item behind it. Before this,
      // finishing here wrote nothing at all — a whole session vanished.
      logCompletedActivity({
        title: 'Workout',
        area: 'health',
        durationMin: elapsedMin,
        sessionType: 'workout',
        note,
      });
    }
    router.back();
  };

  return (
    <Screen>
      <AppText variant="label" color="accent">
        {session.title}
      </AppText>
      <AppText variant="title">~{session.estimatedMin} minutes. It&apos;s all decided.</AppText>
      {session.note ? (
        <AppText variant="caption" color="textTertiary" style={styles.note}>
          {session.note}
        </AppText>
      ) : null}

      {programme ? (
        <View style={styles.sleepRow}>
          <AppText variant="caption" color="textTertiary">
            Last night:
          </AppText>
          {[
            { label: 'Under 6h', value: 5 },
            { label: '6–7h', value: 6.5 },
            { label: '7h+', value: 8 },
          ].map((o) => (
            <Chip
              key={o.label}
              label={o.label}
              selected={sleptHours === o.value}
              onPress={() => logSleep(o.value)}
            />
          ))}
        </View>
      ) : null}

      {restLeft > 0 ? (
        <Card style={{ backgroundColor: theme.accentSoft, borderColor: theme.accent, marginTop: Spacing.lg }}>
          <AppText variant="heading" color="accent">
            Rest · {restLeft}s
          </AppText>
        </Card>
      ) : null}

      <SectionHeader title="Session" />
      <View style={styles.stack}>
        {session.exercises.map((e) => {
          const targetReps = defaultRepsFrom(e.reps);
          // Load moves on the TOP of the range, not the bottom.
          const topReps = topRepsFrom(e.reps);
          const last = lastPerformance(workoutLogs, e.name, log?.id);
          const next =
            topReps !== undefined
              ? suggestNext(workoutLogs, e.name, topReps, e.sets, log?.id)
              : null;
          // What the person walks in wanting to know, in priority order: what
          // the programme says today, else what they did last time.
          const reference = next
            ? next.reason
            : last
              ? `last time: ${last.set.weightKg ? `${last.set.weightKg} kg × ` : ''}${last.set.reps}`
              : undefined;
          return (
            <SetLogger
              key={e.name}
              exercise={e.name}
              prescribedSets={e.sets}
              prescribedReps={`${e.reps}${e.restSec > 0 ? ` · rest ${e.restSec}s` : ''}`}
              sets={setsFor(e.name)}
              suggestedWeightKg={('loadKg' in e ? e.loadKg : undefined) ?? next?.weightKg ?? last?.set.weightKg}
              suggestedReps={targetReps}
              reference={reference}
              onAddSet={(reps, weightKg) => addSet(e.name, e.restSec, reps, weightKg)}
              onEditSet={editSet}
              onRemoveSet={removeSet}
            />
          );
        })}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.note}>
        Log what you actually lifted — tap any set to correct it, today or next week. Form over
        load; leave one rep in the tank.
      </AppText>

      <View style={styles.footer}>
        <Button title={allDone ? 'Session done' : 'Finish here — it counts'} onPress={finish} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: Spacing.sm },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  stack: { gap: Spacing.sm },
  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  exerciseInfo: { flexShrink: 1, gap: 2 },
  exerciseName: { fontWeight: '600' },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
