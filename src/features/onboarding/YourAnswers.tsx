import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { AnswerControl } from '@/features/onboarding/AnswerControl';
import {
  heldAnswer,
  questionsForPerson,
  unansweredCount,
} from '@/features/onboarding/yourAnswers';
import { useAppStore } from '@/state/store';

/**
 * Every question the app can ask, answerable at any time.
 *
 * Isaac: "can you take the new questionnaire at any time?" — and the
 * answer was no, which turned out to be the root of a separate bug he
 * reported in the same breath.
 *
 * ── WHY THIS WAS THE ACTUAL BUG ─────────────────────────────────────────
 *
 * Most of the interview is `deferTo`-ed: twenty-six of its steps are not
 * asked during signup, on the correct reasoning that a person should not
 * face forty questions before seeing anything. They were meant to surface
 * later, inside the pathway they belong to.
 *
 * For someone who never opens that pathway, they surface never. And
 * unanswered, the app falls back to its most conservative reading —
 * which is how somebody benching 130 kg was handed a foundation-level
 * programme. `trainingExperience` is `deferTo: 'training'`, it was never
 * asked, so the level logic had no claim to honour and started at the
 * bottom. The banding was not wrong; the question had simply never been
 * put.
 *
 * So this is not a settings screen. It is the missing half of the
 * interview: everything the app would like to know, what it currently
 * thinks, and one tap to correct it.
 *
 * ── WHY IT SHOWS WHAT IS UNANSWERED ─────────────────────────────────────
 *
 * Unanswered questions are listed first and marked, rather than hidden
 * behind a tidy list of the ones already done. An app quietly assuming
 * the most cautious answer and never mentioning it is the failure this
 * screen exists to end — so the gaps are the headline.
 *
 * ── AND WHY IT USED TO SHOW LESS THAN HALF OF THEM ──────────────────────
 *
 * This filtered to `kind === 'single'`, with a note that "free text and
 * multi-select belong to their own screens, and a chip row cannot honestly
 * stand in for either". Right about the chip row, wrong about the
 * conclusion: sixteen of the thirty-eight questions were simply absent —
 * seven text and nine multi.
 *
 * Among them `priorities`, which decides the free coach and the shape of
 * the whole plan; `existingHabits`, which PERSONA.md §3.5 singles out
 * because an app that misses it "would have spent its first week telling
 * someone who has meditated daily for a decade to try meditating"; and
 * `weight` and `birthYear`, which feed BMI and the age term. All of it on
 * the screen whose own copy promises "change anything that has stopped
 * being true", and most of it answerable nowhere else in the app once
 * signup is over.
 *
 * `AnswerControl` renders the right control per kind, and both this screen
 * and `DeferredQuestions` use it.
 *
 * ── AND IT LISTED QUESTIONS THAT DO NOT APPLY ───────────────────────────
 *
 * `skipIf` was never consulted here, where `deferredSteps` has always
 * honoured it. So a step the interview would have skipped for this person
 * was listed anyway, and counted in "n questions have not been put to you
 * yet" — the app reporting a gap it had deliberately decided not to have.
 */

export function YourAnswers() {
  const answers = useAppStore((s) => s.interviewAnswers);
  const answerDeferredQuestion = useAppStore((s) => s.answerDeferredQuestion);
  const [open, setOpen] = useState<string | null>(null);

  // Which questions apply, what is held against each, and how many are
  // genuinely gaps — all in features/onboarding/yourAnswers.ts, because
  // every one of those is a rule rather than a layout and two of them were
  // quietly wrong while they lived here.
  const ordered = useMemo(() => questionsForPerson(answers), [answers]);
  const missing = unansweredCount(answers);

  return (
    <View style={styles.list}>
      <AppText variant="caption" color="textSecondary">
        {missing === 0
          ? 'Everything the app can ask, you have answered. Change any of it whenever it stops being true.'
          : `${missing} ${missing === 1 ? 'question has' : 'questions have'} not been put to you yet. Until they are, the app assumes the most cautious answer — which is usually not yours.`}
      </AppText>

      {ordered.map((step) => {
        const isOpen = open === step.id;
        const current = heldAnswer(step, answers);

        return (
          <Card key={step.id}>
            <AppText variant="body">{step.prompt(answers)}</AppText>
            <AppText
              variant="caption"
              color={current ? 'textSecondary' : 'accent'}
              style={styles.gap}
            >
              {current ?? 'Not answered — the app is guessing'}
            </AppText>

            {isOpen ? (
              <AnswerControl
                step={step}
                answers={answers}
                initialMulti={Array.isArray(answers[step.id]) ? (answers[step.id] as string[]) : []}
                initialText={step.kind === 'text' && current ? current : ''}
                onAnswer={(value) => {
                  answerDeferredQuestion(step.id, value);
                  setOpen(null);
                }}
              />
            ) : (
              <View style={styles.chips}>
                <Chip
                  label={current ? 'Change' : 'Answer it'}
                  hint={step.prompt(answers)}
                  onPress={() => setOpen(step.id)}
                />
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  gap: { marginTop: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
});
