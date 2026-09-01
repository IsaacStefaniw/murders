import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { activeSteps, type InterviewAnswers } from '@/features/onboarding/script';
import { useOnboardingStore } from '@/features/onboarding/state';

/**
 * The Life Interview. One question at a time, quick answers, a visible
 * sense of progress. Every answer maps to structured data.
 */
export default function Interview() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboardingStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [textDraft, setTextDraft] = useState('');
  /**
   * What the last answer changed, carried onto the next question.
   *
   * This is the whole reason a nine-question interview does not read as a
   * form: each answer visibly moves the plan before the next question
   * arrives. It is shown on the following screen rather than as an extra
   * tap, so nobody pays for the reassurance with an interaction.
   */
  const [lastReveal, setLastReveal] = useState<string | null>(null);

  const steps = useMemo(() => activeSteps(answers), [answers]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const currentValue = answers[step.id];
  const selected: string[] = Array.isArray(currentValue) ? currentValue : [];

  const advance = (justAnswered?: InterviewAnswers) => {
    setTextDraft('');
    // Computed from the answers WITH this one applied — reading the store
    // here would read the value before it landed.
    setLastReveal(step.reveal?.(justAnswered ?? answers) ?? null);
    if (stepIndex >= steps.length - 1) {
      router.replace('/plan-review');
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const back = () => {
    setLastReveal(null);
    if (stepIndex === 0) {
      router.back();
    } else {
      setStepIndex(stepIndex - 1);
      setTextDraft('');
    }
  };

  const submitText = () => {
    const value = textDraft.trim() || undefined;
    setAnswer(step.id, value);
    advance({ ...answers, [step.id]: value });
  };

  const toggleChip = (value: string) => {
    if (step.kind === 'single') {
      setAnswer(step.id, value);
      advance({ ...answers, [step.id]: value });
      return;
    }
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : step.maxSelections && selected.length >= step.maxSelections
        ? selected
        : [...selected, value];
    setAnswer(step.id, next);
  };

  const canContinue =
    step.kind === 'text'
      ? step.optional || textDraft.trim().length > 0
      : selected.length > 0 || Boolean(step.optional);

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back">
            <AppText variant="secondary" color="textTertiary">
              Back
            </AppText>
          </Pressable>
          <AppText variant="caption" color="textTertiary">
            {stepIndex + 1} of {steps.length}
          </AppText>
        </View>

        {lastReveal ? (
          <AppText variant="secondary" color="accent" style={styles.reveal}>
            {lastReveal}
          </AppText>
        ) : null}

        <View style={styles.question}>
          <AppText variant="title">{step.prompt(answers)}</AppText>

          {step.kind === 'text' ? (
            <Field
              // The question above IS the label, so it is announced rather
              // than drawn — a second copy would read as a duplicate.
              label={step.prompt(answers)}
              showLabel={false}
              value={textDraft}
              onChangeText={setTextDraft}
              placeholder={step.placeholder}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={canContinue ? submitText : undefined}
            />
          ) : (
            <View style={styles.chips}>
              {step.options?.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={
                    step.kind === 'single'
                      ? currentValue === option.value
                      : selected.includes(option.value)
                  }
                  onPress={() => toggleChip(option.value)}
                />
              ))}
            </View>
          )}
        </View>

        {step.kind !== 'single' ? (
          <Button
            title={
              step.optional && (step.kind === 'text' ? !textDraft.trim() : selected.length === 0)
                ? 'Skip'
                : 'Continue'
            }
            disabled={!canContinue}
            onPress={step.kind === 'text' ? submitText : () => advance()}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  reveal: { paddingTop: Spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  question: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
