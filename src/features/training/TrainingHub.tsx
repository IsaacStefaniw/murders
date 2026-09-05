import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { effortWords } from '@/features/training/effort';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { estimate1Rm, latest, metricDef, trend } from '@/features/model/metrics';
import { QuestionCard } from '@/features/model/QuestionCard';
import { LevelCard } from '@/features/paths/LevelCard';
import { weekOf } from '@/features/training/programme';
import { useAppStore } from '@/state/store';
import { strengthBaseline } from '@/features/training/baseline';
import { latestMaxes } from '@/features/training/level';
import { assessStrength, BAND_LABEL, type StrengthLift } from '@/features/training/standards';

const LIFTS = [
  { label: 'Bench', key: 'strength.bench.e1rm' },
  { label: 'Squat', key: 'strength.squat.e1rm' },
  { label: 'Deadlift', key: 'strength.deadlift.e1rm' },
  { label: 'Press', key: 'strength.ohp.e1rm' },
];

/**
 * Training v2 hub section — complexity behind the glass. The user sees
 * their numbers, this week's prescription, and at most ONE question.
 */
const LIFT_LABEL: Record<StrengthLift, string> = {
  bench: 'bench',
  squat: 'squat',
  deadlift: 'deadlift',
  ohp: 'overhead press',
};

export function TrainingHub() {
  const router = useRouter();

  const metrics = useAppStore((s) => s.metrics);
  const programme = useAppStore((s) => s.trainingProgramme);
  const addMetric = useAppStore((s) => s.addMetric);
  const buildTrainingBlock = useAppStore((s) => s.buildTrainingBlock);
  const trainingLevelState = useAppStore((s) => s.trainingLevelState);
  const setPathLevelStepBack = useAppStore((s) => s.setPathLevelStepBack);
  const setPathIntensityPush = useAppStore((s) => s.setPathIntensityPush);
  // Recomputed whenever a log or a metric lands, which is exactly when the
  // ladder can have moved.
  const logCount = useAppStore((s) => s.workoutLogs.length);
  const metricCount = useAppStore((s) => s.metrics.length);
  const stepBack = useAppStore((s) => s.pathLevelStepBack.training);
  const levelState = useMemo(
    () => trainingLevelState(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trainingLevelState, logCount, metricCount, stepBack],
  );

  const [logLift, setLogLift] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const week = programme ? weekOf(programme) : null;
  const knownLifts = LIFTS.filter((l) => latest(metrics, l.key));

  const profile = useAppStore((s) => s.profile);
  const { band, perLift } = useMemo(
    () => assessStrength(latestMaxes(metrics), profile ?? {}),
    [metrics, profile],
  );
  // Named plainly, because "we cannot assess you" is only useful with the
  // reason attached.
  const missingForBand: string[] = [];
  if (!profile?.weightKg) missingForBand.push('your bodyweight');
  if (profile?.sexAtBirth !== 'male' && profile?.sexAtBirth !== 'female') {
    missingForBand.push('sex at birth');
  }
  if (Object.keys(latestMaxes(metrics)).length === 0) missingForBand.push('a main lift');

  const saveLift = (key: string, w: number, r: number) => {
    const e1rm = estimate1Rm(w, r);
    addMetric(key, e1rm, `${w} kg × ${r}`);
    return e1rm;
  };

  return (
    <View>
      {/* The ladder first: it explains why the block below looks the way
          it does, and it is the thing worth coming back for. */}
      <SectionHeader title="Where you are" />
      <LevelCard
        path="training"
        level={levelState.level}
        evidence={levelState.evidence}
        progress={levelState.progress}
        steppedBack={levelState.steppedBack}
        onStepBack={(l) => setPathLevelStepBack('training', l)}
        pushing={levelState.pushing}
        onPush={(push) => setPathIntensityPush('training', push)}
      />

      {/* Where the lifts put you, and — when the app cannot say — exactly
          what is missing. "Is my training program advanced or the same for
          every other user?" deserves an answer on the screen, and when the
          honest answer is "I cannot tell yet", so does that. */}
      <Card style={styles.bandCard}>
        {band ? (
          <>
            <AppText variant="label" color="textTertiary">
              Against the population tables
            </AppText>
            <AppText variant="heading">{BAND_LABEL[band]}</AppText>
            <AppText variant="caption" color="textTertiary">
              From {Object.keys(perLift).length === 1 ? 'your' : 'the middle of your'}{' '}
              {Object.keys(perLift)
                .map((l) => LIFT_LABEL[l as StrengthLift])
                .join(', ')}
              , relative to bodyweight. These tables come from voluntary submissions to
              lifting sites — useful for placing you, not a score and not a target.
            </AppText>
          </>
        ) : (
          <>
            <AppText variant="label" color="textTertiary">
              Against the population tables
            </AppText>
            <AppText variant="heading">Not enough to say yet</AppText>
            <AppText variant="caption" color="textTertiary">
              {missingForBand.length > 0
                ? `Add ${missingForBand.join(' and ')} and IntentNorth can place your lifts and start you at the right level rather than the first one.`
                : 'Log a main lift and IntentNorth can place you.'}
            </AppText>
          </>
        )}
      </Card>

      {/* Your numbers — the simple, meaningful progress line. */}
      {knownLifts.length > 0 ? (
        <View>
          <SectionHeader title="Your strongest single lift" />
          <View style={styles.stack}>
            {knownLifts.map((l) => {
              const read = strengthBaseline(metrics, l.key)!;
              const t = trend(metrics, l.key, 90);
              return (
                <Card key={l.key} style={styles.row}>
                  <View style={styles.grow}>
                    <AppText variant="body">{l.label}</AppText>
                    <AppText variant="caption" color="textTertiary">
                      {read.fromRetest && read.observations === 1
                        ? 'From your retest'
                        : read.observations === 1
                          ? 'One session so far'
                          : `Best of ${read.observations} sessions, last 12 weeks`}
                    </AppText>
                  </View>
                  <AppText variant="heading">
                    {t && t.direction !== 'flat' ? `${t.from} → ${t.to}` : read.value}{' '}
                    {metricDef(l.key)?.unit}
                  </AppText>
                  {t?.direction === 'up' ? (
                    <AppText variant="caption" color="success">
                      ▲ {t.delta}
                    </AppText>
                  ) : null}
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* One question, not an assessment. */}
      <QuestionCard domain="training" />

      {/* The block. */}
      <SectionHeader
        title={programme && week ? `This block · Week ${week} — ${programme.weeks[week - 1].phase}` : 'Your programme'}
      />
      {programme && week ? (
        <View style={styles.stack}>
          <AppText variant="caption" color="textTertiary">
            {programme.weeks[week - 1].focus}
          </AppText>
          {programme.weeks[week - 1].sessions.map((s) => (
            <Card key={s.title}>
              <AppText variant="heading">{s.title}</AppText>
              <AppText variant="caption" color="textTertiary">
                {s.exercises[0].name} {s.exercises[0].sets} × {s.exercises[0].reps}
                {s.exercises[0].loadKg
                  ? ` @ ${s.exercises[0].loadKg} kg`
                  : s.exercises[0].rpe
                    ? ` · ${effortWords(s.exercises[0].rpe)}`
                    : ''}
                {' · ~'}
                {s.estimatedMin} min
              </AppText>
            </Card>
          ))}
          <Button
            title="Start today's session"
            onPress={() => router.push('/session/workout' as never)}
          />
        </View>
      ) : (
        <View style={styles.stack}>
          {programme ? (
            <AppText variant="secondary">
              Block complete. Retest a lift below, then rebuild — the next block starts from your
              new numbers.
            </AppText>
          ) : (
            <AppText variant="secondary">
              Four weeks: two building, one peak, then an easier week to let it all catch up.
              Sized to your days, your equipment and your numbers.
            </AppText>
          )}
          <Button
            title={programme ? 'Rebuild from my new numbers' : 'Build my 4-week block'}
            onPress={buildTrainingBlock}
          />
        </View>
      )}

      {/* Log a lift — PRs feed everything. */}
      <SectionHeader title="Log a lift" />
      <View style={styles.chips}>
        {LIFTS.map((l) => (
          <Chip
            key={l.key}
            label={l.label}
            selected={logLift === l.key}
            onPress={() => setLogLift(logLift === l.key ? null : l.key)}
          />
        ))}
      </View>
      {logLift ? (
        <View style={styles.inputRow}>
          <Field
            label={`${LIFTS.find((l) => l.key === logLift)?.label ?? 'Lift'} weight in kilograms`}
            showLabel={false}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="kg"
            width={84}
          />
          <Field
            label="Repetitions completed"
            showLabel={false}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            placeholder="reps"
            width={84}
          />
          <Button
            title="Save"
            hint="Estimates your one-rep max from this set and adds it to your numbers."
            disabled={!Number(weight) || !Number(reps)}
            onPress={() => {
              const e1rm = saveLift(logLift, Number(weight), Number(reps));
              setWeight('');
              setReps('');
              setLogLift(null);
              void e1rm;
            }}
          />
        </View>
      ) : null}
      <AppText variant="caption" color="textTertiary" style={styles.hint}>
        One normal set is enough. IntentNorth works out what you could lift once, and tracks
        whether it is going up.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bandCard: { gap: Spacing.xs },
  stack: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  hint: { marginTop: Spacing.sm },
});
