import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/** Entry gate: onboarded users land on Today, new users on Welcome. */
export default function Index() {
  const theme = useTheme();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.onboarded);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }
  return <Redirect href={onboarded ? '/(tabs)/today' : '/welcome'} />;
}
