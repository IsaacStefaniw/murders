import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { INTERVIEW_STEPS } from '@/features/onboarding/script';
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
 */

export function YourAnswers() {
  const answers = useAppStore((s) => s.interviewAnswers);
  const answerDeferredQuestion = useAppStore((s) => s.answerDeferredQuestion);
  const [open, setOpen] = useState<string | null>(null);

  /** Single-choice steps only: free text and multi-select belong to their
   *  own screens, and a chip row cannot honestly stand in for either. */
  const steps = useMemo(
    () => INTERVIEW_STEPS.filter((s) => s.kind === 'single'),
    [],
  );

  const ordered = useMemo(() => {
    const has = (id: string) => answers[id] !== undefined && answers[id] !== '';
    return [...steps].sort((a, b) => Number(has(a.id)) - Number(has(b.id)));
  }, [steps, answers]);
  const answered = (id: string) => answers[id] !== undefined && answers[id] !== '';
  const missing = ordered.filter((s) => !answered(s.id)).length;

  return (
    <View style={styles.list}>
      <AppText variant="caption" color="textSecondary">
        {missing === 0
          ? 'Everything the app can ask, you have answered. Change any of it whenever it stops being true.'
          : `${missing} ${missing === 1 ? 'question has' : 'questions have'} not been put to you yet. Until they are, the app assumes the most cautious answer — which is usually not yours.`}
      </AppText>

      {ordered.map((step) => {
        const current = answers[step.id];
        const options = typeof step.options === 'function' ? step.options(answers) : step.options;
        if (!options || options.length === 0) return null;
        const isOpen = open === step.id;
        const chosen = options.find((o) => o.value === current);

        return (
          <Card key={step.id}>
            <AppText variant="body">{step.prompt(answers)}</AppText>
            <AppText
              variant="caption"
              color={chosen ? 'textSecondary' : 'accent'}
              style={styles.gap}
            >
              {chosen ? chosen.label : 'Not answered — the app is guessing'}
            </AppText>

            {isOpen ? (
              <View style={styles.chips}>
                {options.map((o) => (
                  <Chip
                    key={o.value}
                    label={o.label}
                    selected={o.value === current}
                    onPress={() => {
                      answerDeferredQuestion(step.id, o.value);
                      setOpen(null);
                    }}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.chips}>
                <Chip
                  label={chosen ? 'Change' : 'Answer it'}
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
