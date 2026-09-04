import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * The offer, where it used to be a gate.
 *
 * The first cut put the paywall between the plan review and Today, so the
 * first thing a person saw after twelve questions was a price. A third of
 * a thousand reviewers named that as the moment they would leave. Nothing
 * about what is free or paid has changed — the coaches still run only with
 * Plus — but the offer now sits on Today, once, and goes away when asked.
 * Every locked session still opens the paywall on tap.
 */
export function PlusNudge() {
  const router = useRouter();
  const theme = useTheme();
  const plus = useAppStore((s) => s.entitlement.plus);
  const dismissedAt = useAppStore((s) => s.plusNudgeDismissedAt);
  const dismiss = useAppStore((s) => s.dismissPlusNudge);
  const firstName = useAppStore((s) => s.profile?.firstName);

  if (plus || dismissedAt) return null;

  return (
    <Card style={[styles.card, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
      <AppText variant="label" color="accent">
        IntentNorth Plus
      </AppText>
      <AppText variant="heading">
        {firstName ? `${firstName}, your coaches are built.` : 'Your coaches are built.'} Plus runs them.
      </AppText>
      <AppText variant="secondary">
        Free today: the shape of your day, every urge and reset tool, breathing, the two-minute
        practices, and a full view of every program. Plus places the sessions into your days and
        moves them when the day changes.
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
