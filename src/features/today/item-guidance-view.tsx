import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { BALANCE_LABEL } from '@/features/knowledge/protocols';
import { guidanceFor } from '@/features/today/itemGuidance';
import { useAppStore } from '@/state/store';
import type { PlanItem } from '@/types/domain';

const GRADE_NOTE: Record<string, string> = {
  A: 'Strong evidence',
  B: 'Good evidence',
  C: 'Mixed evidence',
  D: 'Early or weak evidence',
};

/**
 * The two sentences that turn a title into an instruction.
 *
 * All of this was already written — every protocol in the library carries
 * a summary, the reason it works, its evidence grade and its caution — and
 * none of it was ever shown next to the block it produced. Someone opening
 * "Morning light, 10 min" at 6:40am got a title and three buttons.
 *
 * Shown on expand rather than always: the row stays scannable, and the
 * explanation is there for the tap that means "what is this, actually".
 */
export function ItemGuidanceView({ item }: { item: PlanItem }) {
  const routines = useAppStore((s) => s.routines);
  const goals = useAppStore((s) => s.goals);
  const guidance = useMemo(() => guidanceFor(item, routines, goals), [item, routines, goals]);

  if (!guidance.how && !guidance.why) return null;

  return (
    <View style={styles.wrap}>
      {guidance.how ? (
        <View style={styles.block}>
          <AppText variant="secondary">{guidance.how.summary}</AppText>
          <AppText variant="caption" color="textTertiary">
            {guidance.how.balance ?? guidance.how.why}
          </AppText>
          {/* A grade note under a practice that claims no research is the
              app grading somebody's marriage on a scale built for
              treatments. It says what it is instead. */}
          <AppText variant="caption" color="textTertiary">
            {guidance.how.balance
              ? BALANCE_LABEL
              : (GRADE_NOTE[guidance.how.evidenceLevel] ?? guidance.how.evidenceLevel)}
            {guidance.how.attribution.length > 0 ? ` · ${guidance.how.attribution.join(', ')}` : ''}
          </AppText>
          {/*
            The steps, at the rack rather than on the browse tab.
            `HOW_TO` existed and rendered in exactly one place: the Library
            screen, which somebody opens when they are curious — not at
            06:40 holding a dumbbell, which is the moment this whole app is
            built around.

            Under the summary and above the caution, because the order is
            what it is, how to do it, then what to watch for. Not behind a
            disclosure here, unlike the library: this view is ALREADY the
            disclosure — somebody has tapped a row to ask "what is this,
            actually" — and a second tap to reach the answer is the browse
            tab's problem repeated one level down.
          */}
          {guidance.how.steps ? (
            <View style={styles.steps}>
              {guidance.how.steps.steps.map((step, i) => (
                <AppText key={step} variant="secondary" style={styles.step}>
                  {i + 1}. {step}
                </AppText>
              ))}
              {guidance.how.steps.example ? (
                <AppText variant="caption" color="textTertiary" style={styles.step}>
                  {guidance.how.steps.example}
                </AppText>
              ) : null}
            </View>
          ) : null}
          {guidance.how.safety ? (
            <AppText variant="caption" color="must">
              {guidance.how.safety}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {guidance.why ? (
        <AppText variant="caption" color="textTertiary">
          This is here for “{guidance.why.goalTitle}”
          {guidance.why.milestone ? ` — next rung: ${guidance.why.milestone}` : ''}.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  block: { gap: Spacing.xs },
  steps: { gap: Spacing.xs, paddingTop: Spacing.xs },
  step: { lineHeight: 20 },
});
