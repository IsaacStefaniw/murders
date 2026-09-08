import { StyleSheet } from 'react-native';

import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { Disclosure } from '@/components/disclosure';
import { Spacing } from '@/constants/theme';
import type { CommitmentBudget } from '@/features/budget/commitment';

/**
 * What the app is asking of you this week, and what it is holding.
 *
 * The most useful thing a coach does is not adding — it is deciding what
 * not to add yet, and saying so. An app that silently withholds looks
 * broken; an app that says "one anchor, the rest waits, here is why"
 * reads as judgement, which is the thing being paid for.
 *
 * Silent in the ordinary stable case where the person has already been
 * offered their one thing, because a card that appears every day stops
 * being read on the day it matters.
 */
export function BudgetCard({ budget, showWhenStable = false }: { budget: CommitmentBudget; showWhenStable?: boolean }) {
  if (budget.state === 'stable' && !showWhenStable) return null;
  return (
    <Card style={styles.card}>
      <AppText variant="label" color="textTertiary">
        {LABEL[budget.state]}
      </AppText>
      <AppText variant="body">{budget.line}</AppText>
      <Disclosure title="Why only this much?">
        <AppText variant="secondary">{budget.because}</AppText>
        <AppText variant="caption" color="textTertiary">
          This is about what IntentNorth offers you, never about what you may do. The
          library is open, and anything in it goes onto your week the moment you say so.
        </AppText>
      </Disclosure>
    </Card>
  );
}

const LABEL: Record<CommitmentBudget['state'], string> = {
  start: 'Starting',
  stable: 'Room for one more',
  strained: 'A full fortnight',
  disrupted: 'Minimum week',
  return: 'Welcome back',
};

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, marginTop: Spacing.md },
});
