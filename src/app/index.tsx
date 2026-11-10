import { Redirect } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { meOnboarding, mePathStarts } from '@/features/me/adopt';
import { ISAAC_PROFILE } from '@/features/me/profile';
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
 * ── Why it now also adopts over an EXISTING install ─────────────────────
 *
 * The first version of this ran only when `onboarded` was false, and said
 * why: *"It will not overwrite a profile that exists, because that profile
 * may hold weeks of logged sessions and this file is not the place to
 * decide they are expendable."*
 *
 * Right in general, wrong for the one install this app has. On 10 Nov
 * 2026 Isaac sent a screenshot of his TestFlight day: breakfast at
 * 12:15pm, no lifting session at all, and a four-fifteen item reading
 * *"Launching intent OS and gro…"* — a goal from the months he was
 * building this for a market he has since stopped aiming at. He said:
 * *"all showing old data I believe."* He was right.
 *
 * His store was built by the thirty-nine question interview, so none of
 * `features/me` had ever reached it, and under the old rule none of it
 * ever could. The profile in the repo had been pushed, built and shipped
 * and was still not the profile in his hand. Running the current
 * generator on `ISAAC_PROFILE` gives breakfast at 06:35 and seven items;
 * his screen had fourteen and none of the right ones.
 *
 * ── What makes this safe, which is the part the old comment got right ───
 *
 * `completeOnboarding` sets exactly six things: `onboarded`, `profile`,
 * `goals`, `routines`, `behaviourIntentions` and `interviewAnswers`. It
 * does not touch `workoutLogs`, `metrics`, `behaviourEvents`,
 * `reflections` or past `plans`. **Every logged session, reading and slip
 * survives**; what is replaced is the forward plan, which is the thing
 * that is wrong.
 *
 * ── STATED_ON is the version number ─────────────────────────────────────
 *
 * `ISAAC_PROFILE.createdAt` is the constant `${STATED_ON}T00:00:00.000Z`,
 * not a clock reading — a profile built by the interview carries a real
 * timestamp and can never equal it. So an exact comparison answers "did
 * this profile come from the repo, at this revision of it" with no extra
 * state to keep, and editing `STATED_ON` re-adopts on the next launch.
 * That is already what the constant means: *the day the facts were
 * stated.*
 *
 * The ref is not belt-and-braces: `onboarded` flips inside the same
 * action, but Zustand notifies subscribers synchronously and this effect's
 * dependency list is narrow, so a second render before the redirect could
 * otherwise call it twice and mint a second set of goals.
 */
export default function Index() {
  const theme = useTheme();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.onboarded);
  const storedCreatedAt = useAppStore((s) => s.profile?.createdAt);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const startPath = useAppStore((s) => s.startPath);
  const adopted = useRef(false);

  // True for a store built by the interview, and for one adopted at an
  // older STATED_ON. False only once this exact revision is in place.
  const stale = !onboarded || storedCreatedAt !== ISAAC_PROFILE.createdAt;

  useEffect(() => {
    if (!hydrated || !stale || adopted.current) return;
    adopted.current = true;
    completeOnboarding(meOnboarding());
    // After the profile, because `startPath` reads it to build the block.
    for (const { id, answers } of mePathStarts()) startPath(id, answers);
  }, [hydrated, stale, completeOnboarding, startPath]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }
  // One frame of the spinner while the effect runs, then Today. Nobody
  // sees Welcome, and nobody is asked a question with a known answer.
  if (stale) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }
  return <Redirect href="/(tabs)/today" />;
}
