import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function Welcome() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <AppText variant="label" color="accent">
          Intent
        </AppText>
        <AppText variant="display" style={styles.headline}>
          Build a life you actually follow.
        </AppText>
        <AppText variant="secondary" style={{ color: theme.textSecondary }}>
          Ten questions. Then INTENT plans your days around what you say matters — and adapts to
          what actually happens.
        </AppText>
      </View>
      <Button title="Continue" onPress={() => router.push('/interview')} />
      <AppText variant="caption" style={styles.footnote}>
        Your answers stay on this device until you connect an account.
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
});
