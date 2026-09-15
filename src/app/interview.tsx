import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { optionsFor, placeholderFor, type InterviewAnswers } from '@/features/onboarding/script';
import {
  SECTION_ORDER,
  sectionDef,
  sectionsRemaining,
  setupSteps,
  type SetupSection,
} from '@/features/onboarding/sections';
import { useOnboardingStore } from '@/features/onboarding/state';
import { track } from '@/lib/telemetry';

/**
 * Setup — eight sections, and nothing deferred.
 *
 * This replaces a thirteen-question interview that sent the other
 * twenty-three questions into coaches people never opened. The reasoning,
 * the measured cost of deferring, and what each section unlocks are in
 * `features/onboarding/sections.ts`.
 *
 * Two things this screen does that the old one did not:
 *
 * **The payout lands on the same screen as the answer.** The reveal used
 * to appear small, at the top of the NEXT question, which is the app
 * telling you what changed after you have stopped looking. Now the answer
 * clears the question and the reveal takes its place, full size, and you
 * move on from there. Only questions that have something to reveal cost
 * the extra tap.
 *
 * **Skipping is offered and priced.** Every section can be skipped at its
 * first question, with one line saying what that costs. A cost named up
 * front is a decision; a cost discovered later is a grievance.
 */
export default function Interview() {
  const router = useRouter();
  const theme = useTheme();
  const { answers, setAnswer } = useOnboardingStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [textDraft, setTextDraft] = useState('');
  /** The payout, held on this screen until it is read. */
  const [payout, setPayout] = useState<string | null>(null);

  useEffect(() => {
    void track('interview_started');
  }, []);

  const steps = useMemo(() => setupSteps(answers), [answers]);
  const at = Math.min(stepIndex, steps.length - 1);
  const { step, section, opensSection } = steps[at];
  const def = sectionDef(section);
  const remaining = useMemo(() => sectionsRemaining(answers), [answers]);

  const currentValue = answers[step.id];
  const selected: string[] = Array.isArray(currentValue) ? currentValue : [];

  const goTo = (i: number) => {
    setPayout(null);
    setTextDraft('');
    if (i >= steps.length) {
      void track('interview_finished');
      router.replace('/plan-review');
      return;
    }
    setStepIndex(Math.max(0, i));
  };

  /** Answer landed: show what it bought, or move on if it bought nothing. */
  const settle = (next: InterviewAnswers) => {
    const reveal = step.reveal?.(next) ?? null;
    if (reveal) {
      setPayout(reveal);
      return;
    }
    goTo(at + 1);
  };

  const back = () => (at === 0 ? router.back() : goTo(at - 1));

  /** Everything is skippable. Sections skip whole; questions skip one. */
  const skipSection = () => {
    const nextSection = SECTION_ORDER.indexOf(section) + 1;
    const target = steps.findIndex(
      (s) => SECTION_ORDER.indexOf(s.section) >= nextSection,
    );
    goTo(target === -1 ? steps.length : target);
  };

  const submitText = () => {
    const value = textDraft.trim() || undefined;
    setAnswer(step.id, value);
    settle({ ...answers, [step.id]: value });
  };

  const toggleChip = (value: string) => {
    if (step.kind === 'single') {
      setAnswer(step.id, value);
      settle({ ...answers, [step.id]: value });
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
    step.kind === 'text' ? textDraft.trim().length > 0 : selected.length > 0;

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
            {def.title}
          </AppText>
        </View>

        {/* Eight dots. People will give you ten minutes if they can see
            the end, and "question 19 of 31" is not an end you can see. */}
        <View
          style={styles.spine}
          accessibilityRole="progressbar"
          accessibilityLabel={`Section ${SECTION_ORDER.indexOf(section) + 1} of ${SECTION_ORDER.length}: ${def.title}`}
        >
          {SECTION_ORDER.map((id: SetupSection) => (
            <View
              key={id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    id === section
                      ? theme.accent
                      : remaining.has(id)
                        ? theme.border
                        : theme.accentSoft,
                },
              ]}
            />
          ))}
        </View>

        {payout ? (
          /* The answer bought something, and it is said here rather than
             at the top of a question the person has already moved on to. */
          <View style={styles.question}>
            <AppText variant="title" color="accent">
              {payout}
            </AppText>
            <Button title="Next" onPress={() => goTo(at + 1)} />
          </View>
        ) : (
          <>
            <View style={styles.question}>
              {opensSection ? (
                <AppText variant="secondary" color="textTertiary">
                  {def.unlocks}
                </AppText>
              ) : null}

              <AppText variant="title">{step.prompt(answers)}</AppText>

              {step.kind === 'text' ? (
                <Field
                  // The question above IS the label, so it is announced
                  // rather than drawn.
                  label={step.prompt(answers)}
                  showLabel={false}
                  value={textDraft}
                  onChangeText={setTextDraft}
                  placeholder={placeholderFor(step, answers)}
                  keyboardType={step.keyboardType}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={canContinue ? submitText : undefined}
                />
              ) : (
                <View style={styles.chips}>
                  {optionsFor(step, answers).map((option) => (
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

            <View style={styles.foot}>
              {step.kind !== 'single' ? (
                <Button
                  title="Continue"
                  disabled={!canContinue}
                  onPress={step.kind === 'text' ? submitText : () => settle(answers)}
                />
              ) : null}

              {/* Priced, and offered on the section it belongs to rather
                  than buried. Skipping is a decision, not a debt. */}
              {opensSection ? (
                <Pressable
                  onPress={skipSection}
                  accessibilityRole="button"
                  accessibilityLabel={`Skip ${def.title}. ${def.skipPrice}`}
                  style={styles.skip}
                >
                  <AppText variant="caption" color="textTertiary">
                    {def.skipPrice}
                  </AppText>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => goTo(at + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Skip this question"
                  style={styles.skip}
                >
                  <AppText variant="caption" color="textTertiary">
                    Skip this one
                  </AppText>
                </Pressable>
              )}
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  spine: { flexDirection: 'row', gap: Spacing.xs, paddingTop: Spacing.xs },
  dot: { flex: 1, height: 3, borderRadius: Radius.sm },
  question: { flex: 1, justifyContent: 'center', gap: Spacing.xl },
  foot: { gap: Spacing.sm },
  skip: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
