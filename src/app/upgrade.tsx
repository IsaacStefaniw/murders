import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * INTENT Plus — preview of the paywall arc (docs/MONETIZATION.md).
 * SCAFFOLDED: no billing is wired; this screen designs the moment so the
 * product carries its shape before payments exist. Placement doctrine:
 * shown once, right after "Paths starting today" — never mid-session,
 * and recovery features are never gated.
 */
export default function Upgrade() {
  const router = useRouter();
  const theme = useTheme();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/today' as never));

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          INTENT Plus
        </AppText>
        <Button title="Done" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">Your whole life, one co-pilot.</AppText>
      <AppText variant="secondary" style={styles.sub}>
        Free INTENT gives you a complete week: the interview, one active path, the adaptive plan,
        every session. Plus runs every part of your life at once — and learns faster.
      </AppText>

      <SectionHeader title="Everything in Plus" />
      <View style={styles.stack}>
        {[
          ['All five paths, together', 'Training, nutrition, money, work and habits running as one plan — the trade-offs handled for you.'],
          ['The AI coach', 'Daily briefs and weekly reviews written for your week, grounded only in the evidence library.'],
          ['Household', 'Partner sync, date nights that coordinate themselves, shared family plans.'],
          ['Calendar & health integrations', 'Real events in, real completions detected — less asking, more knowing.'],
          ['Full history & weekly reports', 'Every week you’ve won, and what actually changed.'],
        ].map(([title, body]) => (
          <Card key={title}>
            <AppText variant="heading">{title}</AppText>
            <AppText variant="caption" color="textTertiary">
              {body}
            </AppText>
          </Card>
        ))}
      </View>

      <Card style={{ borderColor: theme.accent, backgroundColor: theme.accentSoft, marginTop: Spacing.lg }}>
        <AppText variant="heading" color="accent">
          Coming with the App Store release
        </AppText>
        <AppText variant="caption" color="textTertiary">
          Billing isn&apos;t wired yet — this preview exists so the product is honest about what
          will be free forever: your plan, your sessions, and every recovery feature. We will
          never charge for someone&apos;s hardest moment.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flexGrow: 1 },
  sub: { marginTop: Spacing.sm },
  stack: { gap: Spacing.sm },
});
