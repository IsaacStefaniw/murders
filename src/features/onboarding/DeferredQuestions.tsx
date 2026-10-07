import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { AnswerControl } from '@/features/onboarding/AnswerControl';
import { deferredSteps, type DeferTarget } from '@/features/onboarding/script';
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

  const outstanding = useMemo(() => deferredSteps(answers, target), [answers, target]);
  const step = outstanding[0];
  if (!step) return null;

  const submit = (value: string | string[] | undefined) => {
    answerDeferredQuestion(step.id, value);
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

      {/* One implementation of the three controls, shared with
          `YourAnswers` — which rendered only `single` and so left sixteen
          of the thirty-eight questions off the screen entirely. See
          AnswerControl. The `key` resets its internal state when the next
          outstanding question takes this card's place. */}
      <AnswerControl key={step.id} step={step} answers={answers} onAnswer={submit} />

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
