import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Spacing } from '@/constants/theme';
import { dueExperiments, experimentQuestion } from '@/features/knowledge/experiments';
import { personalResponse } from '@/features/knowledge/personal';
import { todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * The fortnight is up.
 *
 * The whole value of a time-boxed trial is that somebody comes back and
 * asks. A practice nobody revisits is how a week silently fills with
 * things that stopped mattering, and thin evidence is exactly the case
 * where the only way to find out is to try it and look.
 *
 * The question is answerable. Never "did it work" — nobody can tell that
 * from a fortnight of one person, and pretending otherwise is the kind of
 * false precision this library exists to avoid. What somebody can answer
 * is whether they noticed anything and whether they want to keep it.
 */
export function TrialReview() {
  const experiments = useAppStore((s) => s.experiments);
  const routines = useAppStore((s) => s.routines);
  const plans = useAppStore((s) => s.plans);
  const endTrial = useAppStore((s) => s.endTrial);
  const today = todayKey();

  const due = dueExperiments(experiments, today)[0];
  if (!due) return null;

  const mine = personalResponse(due.protocolId, routines, plans, today);

  return (
    <Card style={styles.card}>
      <AppText variant="label" color="textTertiary">
        Your two weeks are up
      </AppText>
      <AppText variant="body">{experimentQuestion(due.protocolId)}</AppText>
      {mine ? (
        <AppText variant="caption" color="textSecondary">
          {mine.line}
        </AppText>
      ) : (
        <AppText variant="caption" color="textSecondary">
          It did not make it onto many days, which is an answer too — often the most useful one.
        </AppText>
      )}
      <View style={styles.actions}>
        <Button
          title="Keep it"
          variant="secondary"
          onPress={() => endTrial(due.protocolId, 'keeping')}
        />
        <Button
          title="Drop it"
          variant="ghost"
          hint="Takes it off your week. Nothing else changes and you can add it back any time."
          onPress={() => endTrial(due.protocolId, 'dropping')}
        />
      </View>
      <AppText variant="caption" color="textTertiary">
        Dropping something is not a failure and does not go on any record. It is the half of
        this nobody else will offer you.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, marginTop: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm },
});
