import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useNotificationSync } from '@/features/notifications/useNotificationSync';
import { StyleSheet, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAppStore } from '@/state/store';
import { onNotificationTap } from '@/lib/notifications';
import { listenForPurchases } from '@/lib/purchases';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000 },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);

  const markOpened = useAppStore((s) => s.markOpened);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  // Stamped once per launch, after hydration so the previous value is the
  // real one rather than the empty default.
  useEffect(() => {
    if (hydrated) markOpened();
  }, [hydrated, markOpened]);

  // StoreKit, for the life of the app: renewals, restores and purchases
  // finished elsewhere arrive here, and the entitlement is re-read.
  useEffect(() => {
    if (!hydrated) return undefined;
    return listenForPurchases();
  }, [hydrated]);

  // A tapped notification lands on the thing it was about: the wind-down
  // opens the breathing session, everything else opens today.
  useEffect(() => {
    if (!hydrated) return undefined;
    return onNotificationTap((data) => {
      router.push(data.kind === 'wind_down' ? '/session/breathe' : '/(tabs)/today');
    });
  }, [hydrated, router]);

  // Keeps the OS queue in step with what the app intends. No-ops entirely
  // while notifications are off, which is the default.
  useNotificationSync();

  const palette = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={styles.root}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        value={{
          ...navTheme,
          colors: {
            ...navTheme.colors,
            background: palette.background,
            card: palette.surface,
            text: palette.text,
            primary: palette.accent,
            border: palette.border,
          },
        }}
      >
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="interview" />
          <Stack.Screen name="plan-review" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="check-in/morning" options={{ presentation: 'modal' }} />
          <Stack.Screen name="check-in/evening" options={{ presentation: 'modal' }} />
          <Stack.Screen name="goals/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="session/breathe" options={{ presentation: 'modal' }} />
          <Stack.Screen name="session/meditate" options={{ presentation: 'modal' }} />
          <Stack.Screen name="session/workout" options={{ presentation: 'modal' }} />
          <Stack.Screen name="session/review/[goalId]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
