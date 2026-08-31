import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { buildWorkout } from '@/features/modalities/gym/program';
import { autoRegulate, weekOf } from '@/features/training/programme';
import { dateKeyToDate, todayKey, toMinutes } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

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

  const item = itemId && date ? plans[date]?.items.find((i) => i.id === itemId) : undefined;
  const availableMin = item
    ? toMinutes(item.end) - toMinutes(item.start)
    : (profile?.trainingDurationMin ?? 45);

  const programme = useAppStore((s) => s.trainingProgramme);
  const metrics = useAppStore((s) => s.metrics);
  const addMetric = useAppStore((s) => s.addMetric);

  // Cross-pathway: last night's sleep auto-regulates today's session.
  const today = todayKey();
  const loggedSleep = metrics.find((m) => m.key === 'sleep.hours' && m.at.slice(0, 10) === today);
  const [sleptHours, setSleptHours] = useState<number | null>(loggedSleep?.value ?? null);
  const logSleep = (h: number) => {
    setSleptHours(h);
    if (!loggedSleep) addMetric('sleep.hours', h, 'pre-workout check');
  };

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
      });
      return {
        title: `Week ${week} · ${adjusted.title}`,
        estimatedMin: adjusted.estimatedMin,
        note: adjusted.note ?? wk.focus,
        exercises: adjusted.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: `${e.reps}${e.loadKg ? ` @ ${e.loadKg} kg` : e.rpe ? ` @ RPE ${e.rpe}` : ''}`,
          restSec: e.restSec,
        })),
      };
    }
    return buildWorkout(availableMin, profile?.trainingPreference ?? 'mixed', weekday);
  }, [availableMin, profile?.trainingPreference, date, programme, sleptHours]);

  const [doneSets, setDoneSets] = useState<Record<string, number>>({});
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
  const completedSets = Object.values(doneSets).reduce((s, n) => s + n, 0);
  const allDone = completedSets >= totalSets;

  const tickSet = (name: string, sets: number, restSec: number) => {
    const done = doneSets[name] ?? 0;
    if (done >= sets) return;
    setDoneSets({ ...doneSets, [name]: done + 1 });
    if (done + 1 < sets && restSec > 0) setRestLeft(restSec);
  };

  const finish = () => {
    if (itemId && date) {
      setItemStatus(date, itemId, 'completed', {
        source: 'manual',
        confidence: 1,
        at: new Date().toISOString(),
        note: `workout session · ${completedSets}/${totalSets} sets`,
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
          const done = doneSets[e.name] ?? 0;
          const complete = done >= e.sets;
          return (
            <Pressable
              key={e.name}
              accessibilityRole="button"
              accessibilityLabel={`${e.name}, ${done} of ${e.sets} sets done`}
              onPress={() => tickSet(e.name, e.sets, e.restSec)}
              style={({ pressed }) => [
                styles.exercise,
                {
                  backgroundColor: pressed ? theme.surfacePressed : theme.surface,
                  borderColor: complete ? theme.accent : theme.border,
                },
              ]}
            >
              <View style={styles.exerciseInfo}>
                <AppText
                  variant="body"
                  style={[styles.exerciseName, complete && { color: theme.textTertiary }]}
                >
                  {e.name}
                </AppText>
                <AppText variant="caption" color="textTertiary">
                  {e.reps}
                  {e.restSec > 0 ? ` · rest ${e.restSec}s` : ''}
                </AppText>
              </View>
              <AppText variant="heading" color={complete ? 'success' : 'textSecondary'}>
                {done}/{e.sets}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.note}>
        Tap an exercise each time you finish a set. Form over load; leave one rep in the tank.
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
