import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
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
            {guidance.how.why}
          </AppText>
          <AppText variant="caption" color="textTertiary">
            {GRADE_NOTE[guidance.how.evidenceLevel] ?? guidance.how.evidenceLevel}
            {guidance.how.attribution.length > 0 ? ` · ${guidance.how.attribution.join(', ')}` : ''}
          </AppText>
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
});
