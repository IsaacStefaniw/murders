import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import { FREE_FOREVER_PROMISE, freeAlwaysSentence } from '@/features/plus/entitlement';

/**
 * The offer, where it used to be a gate.
 *
 * The first cut put the paywall between the plan review and Today, so the
 * first thing a person saw after twelve questions was a price. A third of
 * a thousand reviewers named that as the moment they would leave. Nothing
 * about what is free or paid has changed — the coaches still run only with
 * Plus — but the offer now sits on Today, once, and goes away when asked.
 * Every locked session still opens the paywall on tap.
 *
 * Round two moved it again: shown the moment the plan was approved, before
 * a single free day had been lived, it read as a gate with a different
 * name (44% of reviewers). So it waits for the second day. On the first,
 * the day itself is the pitch.
 */
export function PlusNudge({ firstDay = false }: { firstDay?: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const plus = useAppStore((s) => s.entitlement.plus);
  const dismissedAt = useAppStore((s) => s.plusNudgeDismissedAt);
  const dismiss = useAppStore((s) => s.dismissPlusNudge);
  const firstName = useAppStore((s) => s.profile?.firstName);

  if (plus || dismissedAt || firstDay) return null;

  return (
    <Card style={[styles.card, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
      <AppText variant="label" color="accent">
        IntentNorth Plus
      </AppText>
      <AppText variant="heading">
        {firstName ? `${firstName}, your coaches are built.` : 'Your coaches are built.'} Plus runs them.
      </AppText>
      {/* Typed out by hand until now, which is exactly how a promise drifts
          from the rule that keeps it. The sentence is built from
          FREE_ALWAYS_ITEMS — the same list the paywall shows and the same
          file that enforces it — and the hardest-moment line leads, because
          that is the one reviewers asked to see before the offer. */}
      <AppText variant="secondary">{FREE_FOREVER_PROMISE}</AppText>
      <AppText variant="secondary">
        {freeAlwaysSentence()} Plus places the sessions into your days and moves them when the day
        changes.
      </AppText>
      <View style={styles.row}>
        <Button title="See what Plus includes" onPress={() => router.push('/upgrade' as never)} />
        <Button title="Not now" variant="ghost" onPress={dismiss} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
});
