import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { BUILD_TAG } from '@/lib/build';
import { useTheme } from '@/hooks/use-theme';

export default function Welcome() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        {/* The wordmark. Full name on the first screen anyone sees; the
            copy below shortens to "IntentNorth" and people will shorten it
            again to "Intent", which is fine and is why the name kept it. */}
        <AppText variant="label" color="accent">
          IntentNorth
        </AppText>
        <AppText variant="display" style={styles.headline}>
          Build a life you actually follow.
        </AppText>
        <AppText variant="secondary" style={{ color: theme.textSecondary }}>
          Three minutes of questions. Then IntentNorth plans your days around what you say matters —
          and keeps learning as you live them.
        </AppText>
      </View>
      <Button title="Continue" onPress={() => router.push('/interview')} />
      <AppText variant="caption" style={styles.footnote}>
        Your answers stay on this device until you connect an account.
      </AppText>
      <AppText variant="caption" color="textTertiary" style={styles.build}>
        Build {BUILD_TAG}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  headline: { fontSize: 40, lineHeight: 46 },
  footnote: { textAlign: 'center', marginTop: Spacing.md },
  build: { textAlign: 'center', marginTop: Spacing.sm },
});
