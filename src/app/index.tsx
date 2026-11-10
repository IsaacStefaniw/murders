import { Redirect } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { meOnboarding, mePathStarts } from '@/features/me/adopt';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * Entry gate.
 *
 * ── Why this no longer sends anybody to Welcome ─────────────────────────
 *
 * Isaac, 10 Nov 2026: *"How do you keep the profile I've made here? ... I
 * just want to access via app as well as through Claude chat."*
 *
 * This app has one user and his facts are constants in
 * `features/me/profile.ts` — in git, reviewed, pushed. The thirty-nine
 * question interview exists to discover exactly those facts, so for him
 * it is thirty-nine questions whose answers are already written down.
 *
 * So a fresh install **adopts** rather than asks: the same
 * `completeOnboarding` action the interview calls, with the stated
 * profile, and then the paths his answers justify. Install the build,
 * open it, and the week is there.
 *
 * ── What this deliberately does not touch ───────────────────────────────
 *
 * An install that is ALREADY onboarded. `onboarded` is persisted, so the
 * effect below runs only when there is nothing there — a cleared app, a
 * new phone, a fresh TestFlight install. It will not overwrite a profile
 * that exists, because that profile may hold weeks of logged sessions and
 * this file is not the place to decide they are expendable.
 *
 * The ref is not belt-and-braces: `onboarded` flips inside the same
 * action, but Zustand notifies subscribers synchronously and this effect's
 * dependency list includes `hydrated` only, so a second render before the
 * redirect could otherwise call it twice and mint a second set of goals.
 */
export default function Index() {
  const theme = useTheme();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.onboarded);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const startPath = useAppStore((s) => s.startPath);
  const adopted = useRef(false);

  useEffect(() => {
    if (!hydrated || onboarded || adopted.current) return;
    adopted.current = true;
    completeOnboarding(meOnboarding());
    // After the profile, because `startPath` reads it to build the block.
    for (const { id, answers } of mePathStarts()) startPath(id, answers);
  }, [hydrated, onboarded, completeOnboarding, startPath]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }
  // One frame of the spinner while the effect runs, then Today. Nobody
  // sees Welcome, and nobody is asked a question with a known answer.
  if (!onboarded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }
  return <Redirect href="/(tabs)/today" />;
}
