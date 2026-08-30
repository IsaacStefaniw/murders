import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { estimate1Rm, latest, metricDef, trend } from '@/features/model/metrics';
import { nextQuestion } from '@/features/model/questionEngine';
import { weekOf } from '@/features/training/programme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

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
export function TrainingHub() {
  const router = useRouter();
  const theme = useTheme();

  const profile = useAppStore((s) => s.profile);
  const metrics = useAppStore((s) => s.metrics);
  const questionLog = useAppStore((s) => s.questionLog);
  const programme = useAppStore((s) => s.trainingProgramme);
  const addMetric = useAppStore((s) => s.addMetric);
  const markQuestionAsked = useAppStore((s) => s.markQuestionAsked);
  const buildTrainingBlock = useAppStore((s) => s.buildTrainingBlock);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [logLift, setLogLift] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerReps, setAnswerReps] = useState('');

  const question = nextQuestion({ profile, metrics, askedAt: questionLog, domain: 'training' });
  const week = programme ? weekOf(programme) : null;
  const knownLifts = LIFTS.filter((l) => latest(metrics, l.key));

  const inputStyle = [
    styles.numInput,
    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
  ];

  const saveLift = (key: string, w: number, r: number) => {
    const e1rm = estimate1Rm(w, r);
    addMetric(key, e1rm, `${w} kg × ${r}`);
    return e1rm;
  };

  return (
    <View>
      {/* Your numbers — the simple, meaningful progress line. */}
      {knownLifts.length > 0 ? (
        <View>
          <SectionHeader title="Your numbers (est. 1RM)" />
          <View style={styles.stack}>
            {knownLifts.map((l) => {
              const now = latest(metrics, l.key)!;
              const t = trend(metrics, l.key, 90);
              return (
                <Card key={l.key} style={styles.row}>
                  <AppText variant="body" style={styles.grow}>
                    {l.label}
                  </AppText>
                  <AppText variant="heading">
                    {t && t.direction !== 'flat' ? `${t.from} → ${t.to}` : now.value}{' '}
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
      {question ? (
        <Card style={{ borderColor: theme.accent, backgroundColor: theme.accentSoft, marginTop: Spacing.lg }}>
          <AppText variant="body">{question.prompt}</AppText>
          <View style={styles.inputRow}>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              keyboardType="numeric"
              placeholder={question.input === 'setEntry' ? 'kg' : (question.unit ?? '')}
              placeholderTextColor={theme.textTertiary}
              style={inputStyle}
            />
            {question.input === 'setEntry' ? (
              <TextInput
                value={answerReps}
                onChangeText={setAnswerReps}
                keyboardType="numeric"
                placeholder="reps"
                placeholderTextColor={theme.textTertiary}
                style={inputStyle}
              />
            ) : null}
            <Button
              title="Save"
              disabled={!Number(answer) || (question.input === 'setEntry' && !Number(answerReps))}
              onPress={() => {
                const value = Number(answer);
                if (question.input === 'setEntry' && question.metricKey) {
                  saveLift(question.metricKey, value, Number(answerReps));
                } else {
                  if (question.profileKey) updateProfile({ [question.profileKey]: value });
                  if (question.metricKey) addMetric(question.metricKey, value);
                }
                markQuestionAsked(question.id);
                setAnswer('');
                setAnswerReps('');
              }}
            />
            <Button title="Skip" variant="ghost" onPress={() => markQuestionAsked(question.id)} />
          </View>
        </Card>
      ) : null}

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
                    ? ` @ RPE ${s.exercises[0].rpe}`
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
              Four phased weeks — build, build, peak, deload — sized to your days, your equipment
              and your numbers. The more lifts INTENT knows, the more exact the loads.
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
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="kg"
            placeholderTextColor={theme.textTertiary}
            style={inputStyle}
          />
          <TextInput
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            placeholder="reps"
            placeholderTextColor={theme.textTertiary}
            style={inputStyle}
          />
          <Button
            title="Save"
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
        A working set is enough — INTENT estimates your 1RM and tracks the trend.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  numInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 17,
    width: 84,
  },
  hint: { marginTop: Spacing.sm },
});
