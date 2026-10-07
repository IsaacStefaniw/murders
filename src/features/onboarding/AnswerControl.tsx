import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import {
  optionsFor,
  placeholderFor,
  type InterviewAnswers,
  type InterviewStep,
} from '@/features/onboarding/script';

/**
 * The control for one interview question, whatever kind it is.
 *
 * ── Why this is its own component ───────────────────────────────────────
 *
 * `DeferredQuestions` could render all three kinds — text, single, multi —
 * and `YourAnswers` could render only `single`, with a comment explaining
 * that "free text and multi-select belong to their own screens, and a chip
 * row cannot honestly stand in for either".
 *
 * That comment is right about the chip row and wrong about the conclusion.
 * The answer is the correct control per kind, not sixteen questions left
 * off the screen — and SIXTEEN is what it was: seven text and nine multi,
 * out of thirty-eight. Among them `priorities`, which decides the free
 * coach and the whole shape of the plan, and `existingHabits`, which
 * PERSONA.md §3.5 singles out because an app that misses it "would have
 * spent its first week telling someone who has meditated daily for a
 * decade to try meditating". On the one screen whose own copy promises
 * "change anything that has stopped being true".
 *
 * So the controls live here, once, and both screens use them. Writing a
 * second copy inside `YourAnswers` is how `report.tsx` and
 * `plan-review.tsx` ended up with two versions of AREA_LABELS that have
 * since drifted.
 *
 * ── Multi-select commits on Save, single commits on tap ─────────────────
 *
 * Not an inconsistency. A single-choice answer is complete the moment it
 * is tapped; a multi-select is not complete until the person has finished
 * choosing, and committing on every tap would mean the plan rebuilt from
 * a half-made answer three times on the way to the real one.
 */
export function AnswerControl({
  step,
  answers,
  onAnswer,
  /** Pre-selected for a multi step — the answer already held. */
  initialMulti = [],
  /** Pre-filled for a text step — likewise. */
  initialText = '',
}: {
  step: InterviewStep;
  answers: InterviewAnswers;
  onAnswer: (value: string | string[] | undefined) => void;
  initialMulti?: string[];
  initialText?: string;
}) {
  const [multi, setMulti] = useState<string[]>(initialMulti);
  const [text, setText] = useState(initialText);

  if (step.kind === 'text') {
    const changed = text.trim() !== initialText.trim();
    return (
      <View style={styles.stack}>
        <Field
          label={step.prompt(answers)}
          showLabel={false}
          value={text}
          onChangeText={setText}
          placeholder={placeholderFor(step, answers)}
          keyboardType={step.keyboardType}
          returnKeyType="done"
          onSubmitEditing={() => onAnswer(text.trim() || undefined)}
        />
        <Button
          // "Skip" where there is nothing to save and nothing was there
          // before; "Save" the moment the text differs from what is held.
          // A Save button over an unchanged field is a button that does
          // nothing, and this screen is full of fields that already have
          // answers in them.
          title={text.trim() ? (changed ? 'Save' : 'Saved') : initialText ? 'Clear it' : 'Skip'}
          variant={changed || !text.trim() ? (text.trim() ? 'primary' : 'ghost') : 'secondary'}
          onPress={() => onAnswer(text.trim() || undefined)}
        />
      </View>
    );
  }

  const options = optionsFor(step, answers);

  return (
    <View style={styles.stack}>
      <View style={styles.chips}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={
              step.kind === 'multi'
                ? multi.includes(option.value)
                : answers[step.id] === option.value
            }
            onPress={() => {
              if (step.kind === 'single') {
                onAnswer(option.value);
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
        <>
          {/* The cap, said rather than enforced in silence. A chip that
              stops responding with no explanation reads as a broken
              control, and for `priorities` the cap is the point: the order
              of three is what the plan is built from. */}
          {step.maxSelections ? (
            <AppText variant="caption" color="textTertiary">
              {multi.length >= step.maxSelections
                ? `That is ${step.maxSelections}. Deselect one to choose another.`
                : `Up to ${step.maxSelections}, and the order matters.`}
            </AppText>
          ) : null}
          <Button
            title={multi.length > 0 ? 'Save' : 'Skip'}
            variant={multi.length > 0 ? 'primary' : 'ghost'}
            onPress={() => onAnswer(multi.length > 0 ? multi : undefined)}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { marginTop: Spacing.md, gap: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
