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
 * IntentNorth Plus — preview of the paywall arc (docs/MONETIZATION.md).
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
          IntentNorth Plus
        </AppText>
        <Button title="Done" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">Your whole life, one co-pilot.</AppText>
      <AppText variant="secondary" style={styles.sub}>
        Free IntentNorth gives you a complete week: the interview, one active path, the adaptive plan,
        every session. Plus runs every part of your life at once — and learns faster.
      </AppText>

      <SectionHeader title="Everything in Plus" />
      <View style={styles.stack}>
        {/*
          Two lists, honestly separated. A paywall that describes features
          the build does not have is a promise the first week breaks, and
          it is the fastest way to lose someone who paid on the strength of
          it. Anything not yet running says so, in the same size type.
        */}
        {[
          ['All five paths, together', 'Training, nutrition, money, work and habits running as one plan — the trade-offs handled for you.'],
          ['Apple Health', 'Sleep, resting heart rate and weight read straight in, so last night shapes today’s session without you typing anything.'],
          ['Timed interventions', 'IntentNorth works out when a habit usually wins and puts something else in front of you before that window, not after.'],
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

      <SectionHeader title="Not built yet" />
      <View style={styles.stack}>
        {[
          ['Partner sync', 'The household week is real and lives on this phone. Syncing it with someone else needs accounts, which are not built.'],
          ['Calendar', 'Reading your real events in. Not built.'],
          ['Written briefs', 'A daily brief and weekly narrative in prose. The engine that would write them is wired but switched off, so today every word in the app is deterministic — no model runs anywhere.'],
        ].map(([title, body]) => (
          <Card key={title}>
            <AppText variant="heading" color="textTertiary">
              {title}
            </AppText>
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
