import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Radius, Spacing } from '@/constants/theme';
import { estimate1Rm } from '@/features/model/metrics';
import { nextQuestion, type QuestionDomain } from '@/features/model/questionEngine';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * The ONE next-best question for a domain — the whole visible surface of
 * the Progressive Question Engine. Number and set entries land as metric
 * observations or profile facts; choices merge into the path's intake
 * answers. Skip costs nothing and cools the question down for two weeks.
 */
export function QuestionCard({ domain }: { domain: QuestionDomain }) {
  const theme = useTheme();
  const profile = useAppStore((s) => s.profile);
  const metrics = useAppStore((s) => s.metrics);
  const questionLog = useAppStore((s) => s.questionLog);
  const paths = useAppStore((s) => s.paths);
  const addMetric = useAppStore((s) => s.addMetric);
  const markQuestionAsked = useAppStore((s) => s.markQuestionAsked);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const updatePathAnswers = useAppStore((s) => s.updatePathAnswers);

  const [answer, setAnswer] = useState('');
  const [answerReps, setAnswerReps] = useState('');

  const pathAnswers = Object.fromEntries(
    Object.entries(paths).map(([id, entry]) => [id, entry!.answers]),
  );
  const question = nextQuestion({ profile, metrics, askedAt: questionLog, pathAnswers, domain });
  if (!question) return null;

  const inputStyle = [
    styles.numInput,
    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
  ];

  const saveChoice = (value: string) => {
    if (question.pathId && question.answerKey) {
      updatePathAnswers(question.pathId, { [question.answerKey]: value });
    }
    markQuestionAsked(question.id);
  };

  const saveValue = () => {
    const value = Number(answer);
    if (question.input === 'setEntry' && question.metricKey) {
      addMetric(question.metricKey, estimate1Rm(value, Number(answerReps)), `${value} kg × ${answerReps}`);
    } else {
      if (question.profileKey) updateProfile({ [question.profileKey]: value });
      if (question.metricKey) addMetric(question.metricKey, value);
    }
    markQuestionAsked(question.id);
    setAnswer('');
    setAnswerReps('');
  };

  return (
    <Card style={{ borderColor: theme.accent, backgroundColor: theme.accentSoft, marginTop: Spacing.lg }}>
      <AppText variant="body">{question.prompt}</AppText>
      {question.input === 'choice' ? (
        <View style={styles.chips}>
          {(question.options ?? []).map((o) => (
            <Chip key={o.value} label={o.label} selected={false} onPress={() => saveChoice(o.value)} />
          ))}
          <Chip label="Skip" selected={false} onPress={() => markQuestionAsked(question.id)} />
        </View>
      ) : (
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
            onPress={saveValue}
          />
          <Button title="Skip" variant="ghost" onPress={() => markQuestionAsked(question.id)} />
        </View>
      )}
      <AppText variant="caption" color="textTertiary" style={styles.hint}>
        One question at a time, only where the answer changes the plan. Skip freely.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
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
