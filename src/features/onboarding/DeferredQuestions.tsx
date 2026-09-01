import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import {
  deferredSteps,
  optionsFor,
  placeholderFor,
  type DeferTarget,
} from '@/features/onboarding/script';
import { useAppStore } from '@/state/store';

interface DeferredQuestionsProps {
  target: DeferTarget;
  /** The line above the question, saying what answering buys. */
  promise?: string;
}

/**
 * The depth the opening interview deferred, asked where it is wanted.
 *
 * ONE question at a time, and only inside the coach that consumes the
 * answer. That placement is the entire argument: four questions to set up
 * the Training coach is configuration you asked for, where the same four
 * buried in a twenty-eight-question interview from a stranger is an
 * interrogation. Same questions, opposite experience.
 *
 * Renders nothing once a pathway has everything it needs, so the card
 * disappears rather than becoming a permanent chore.
 */
export function DeferredQuestions({ target, promise }: DeferredQuestionsProps) {
  const answers = useAppStore((s) => s.interviewAnswers);
  const answerDeferredQuestion = useAppStore((s) => s.answerDeferredQuestion);

  const [multi, setMulti] = useState<string[]>([]);
  const [text, setText] = useState('');

  const outstanding = useMemo(() => deferredSteps(answers, target), [answers, target]);
  const step = outstanding[0];
  if (!step) return null;

  const submit = (value: string | string[] | undefined) => {
    answerDeferredQuestion(step.id, value);
    setMulti([]);
    setText('');
  };

  const remaining = outstanding.length - 1;

  return (
    <Card style={styles.card}>
      {promise ? (
        <AppText variant="caption" color="textTertiary">
          {promise}
        </AppText>
      ) : null}
      <AppText variant="heading" style={styles.prompt}>
        {step.prompt(answers)}
      </AppText>

      {step.kind === 'text' ? (
        <View style={styles.stack}>
          <Field
            label={step.prompt(answers)}
            showLabel={false}
            value={text}
            onChangeText={setText}
            placeholder={placeholderFor(step, answers)}
            returnKeyType="done"
            onSubmitEditing={() => submit(text.trim() || undefined)}
          />
          <Button
            title={text.trim() ? 'Save' : 'Skip'}
            variant={text.trim() ? 'primary' : 'ghost'}
            onPress={() => submit(text.trim() || undefined)}
          />
        </View>
      ) : (
        <View style={styles.stack}>
          <View style={styles.chips}>
            {optionsFor(step, answers).map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={step.kind === 'multi' && multi.includes(option.value)}
                onPress={() => {
                  if (step.kind === 'single') {
                    submit(option.value);
                    return;
                  }
                  setMulti((prev) =>
                    prev.includes(option.value)
                      ? prev.filter((v) => v !== option.value)
                      : step.maxSelections && prev.length >= step.maxSelections
                        ? prev
                        : [...prev, option.value],
                  );
                }}
              />
            ))}
          </View>
          {step.kind === 'multi' ? (
            <Button
              title={multi.length > 0 ? 'Save' : 'Skip'}
              variant={multi.length > 0 ? 'primary' : 'ghost'}
              onPress={() => submit(multi.length > 0 ? multi : undefined)}
            />
          ) : null}
        </View>
      )}

      {remaining > 0 ? (
        <AppText variant="caption" color="textTertiary" style={styles.remaining}>
          {remaining} more {remaining === 1 ? 'question' : 'questions'} and this coach has
          everything it needs.
        </AppText>
      ) : (
        <AppText variant="caption" color="textTertiary" style={styles.remaining}>
          Last one — after this the coach has everything it needs.
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.md },
  prompt: { marginTop: Spacing.xs },
  stack: { marginTop: Spacing.md, gap: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  remaining: { marginTop: Spacing.md },
});
