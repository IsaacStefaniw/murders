import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { BehaviourLog } from '@/features/behaviours/BehaviourLog';
import { standInAfterBreath } from '@/features/behaviours/tonight';
import {
  BREATH_PROTOCOLS,
  protocolDurationSec,
  type BreathProtocol,
} from '@/features/modalities/breath/protocols';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/** The pattern an urge gets: the fastest reset, no chooser in the way. */
const URGE_PROTOCOL: BreathProtocol =
  BREATH_PROTOCOLS.find((p) => p.key === 'sigh') ?? BREATH_PROTOCOLS[0];

/**
 * Breathwork session — runs entirely in the app in under two minutes.
 * A circle that breathes with you; nothing else on the screen.
 *
 * All session state derives from elapsed time since start: phase, round
 * and countdown are pure functions of the clock, so the player can't
 * drift into an inconsistent state.
 *
 * Opened with `?urge=1` the session starts at once on the fastest reset —
 * an urge has no patience for a chooser — and finishes on three honest
 * choices: it passed, go again, or it happened. The stand-in it offers is
 * the one matched to the person's own trigger, and the log it opens is
 * the same log as everywhere else. None of this is charged for.
 */
export default function BreatheSession() {
  const router = useRouter();
  const theme = useTheme();
  const { itemId, date, urge } = useLocalSearchParams<{
    itemId?: string;
    date?: string;
    urge?: string;
  }>();
  const urgeMode = urge === '1';
  const setItemStatus = useAppStore((s) => s.setItemStatus);
  const logCompletedActivity = useAppStore((s) => s.logCompletedActivity);
  const addMetric = useAppStore((s) => s.addMetric);
  const recovery = useAppStore((s) => s.paths.recovery);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);

  // The behaviour the coach is running, else the first one being worked on.
  const answers = recovery?.answers;
  const intention =
    behaviourIntentions.find((b) => b.active && b.behaviour === answers?.behaviour) ??
    behaviourIntentions.find((b) => b.active) ??
    null;
  const standIn = useMemo(() => standInAfterBreath(answers ?? {}), [answers]);

  // The urge route starts at once on the fastest reset: no chooser, no
  // second tap. Decided at first render rather than in an effect.
  const [protocol, setProtocol] = useState<BreathProtocol | null>(() =>
    urgeMode ? URGE_PROTOCOL : null,
  );
  // The clock starts on the first tick after a protocol is chosen, so the
  // render never reads the time itself. A startedAt of zero means "about
  // to start" and shows as the first phase at full length.
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  /** Rounds already completed before the current one — "go again". */
  const [doneRounds, setDoneRounds] = useState(0);
  const [logging, setLogging] = useState(false);
  const [scale] = useState(() => new Animated.Value(0.7));

  const begin = (p: BreathProtocol) => {
    setProtocol(p);
    setStartedAt(0);
  };

  useEffect(() => {
    if (!protocol) return;
    const t = setInterval(() => {
      const ms = Date.now();
      setStartedAt((s) => s || ms);
      setNow(ms);
    }, 250);
    return () => clearInterval(t);
  }, [protocol]);

  // Derive position in the protocol from elapsed time.
  const cycleSec = protocol ? protocol.phases.reduce((s, p) => s + p.seconds, 0) : 0;
  const elapsed = startedAt && now ? Math.max(0, (now - startedAt) / 1000) : 0;
  const finished = protocol !== null && startedAt > 0 && elapsed >= cycleSec * protocol.rounds;
  const round = protocol ? Math.min(protocol.rounds, Math.floor(elapsed / cycleSec) + 1) : 1;
  let phaseIndex = 0;
  let secondsLeft = 0;
  if (protocol && !finished) {
    let within = elapsed % cycleSec;
    for (let i = 0; i < protocol.phases.length; i++) {
      if (within < protocol.phases[i].seconds) {
        phaseIndex = i;
        secondsLeft = Math.ceil(protocol.phases[i].seconds - within);
        break;
      }
      within -= protocol.phases[i].seconds;
    }
  }

  // Animate the circle toward the current phase's scale.
  useEffect(() => {
    if (!protocol || finished) return;
    const phase = protocol.phases[phaseIndex];
    const anim = Animated.timing(scale, {
      toValue: phase.scale,
      duration: phase.seconds * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [protocol, phaseIndex, round, finished, startedAt, scale]);

  const close = (completed: boolean) => {
    const minutes = protocol
      ? Math.max(1, Math.round(((cycleSec * protocol.rounds) / 60) * (doneRounds + 1)))
      : 1;
    if (completed && protocol) {
      // Minutes feed the stillness-practice progression (features/mind).
      addMetric('mind.minutes', minutes, 'breathwork');
    }
    if (completed && itemId && date) {
      setItemStatus(date, itemId, 'completed', {
        source: 'manual',
        confidence: 1,
        at: new Date().toISOString(),
        note: 'breath session',
      });
    } else if (completed && protocol) {
      // Unscheduled, but it still happened — put it on the day.
      logCompletedActivity({
        title: protocol.name,
        area: 'health',
        durationMin: minutes,
        sessionType: 'breathe',
        note: 'breath session',
      });
    }
    router.back();
  };

  if (!protocol) {
    return (
      <Screen>
        <AppText variant="label" color="accent">
          Breathe
        </AppText>
        <AppText variant="title">Ninety seconds, then back to it.</AppText>
        <View style={styles.chooser}>
          {BREATH_PROTOCOLS.map((p) => (
            <Card key={p.key} onPress={() => begin(p)} accessibilityLabel={p.name}>
              <AppText variant="heading">{p.name}</AppText>
              <AppText variant="caption" color="textTertiary">
                {p.useFor} · ~{Math.round((protocolDurationSec(p) / 60) * 10) / 10} min
              </AppText>
            </Card>
          ))}
        </View>
        <Button title="Not now" variant="ghost" onPress={() => close(false)} />
      </Screen>
    );
  }

  if (finished) {
    if (urgeMode && logging && intention) {
      // The breath counted; the log is the same one as everywhere else.
      return (
        <Screen>
          <BehaviourLog intention={intention} onDone={() => close(true)} />
        </Screen>
      );
    }
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <AppText variant="title">Done.</AppText>
          <AppText variant="secondary" style={styles.phase}>
            {urgeMode
              ? 'The wave peaks and passes on its own. Most are past their worst inside ten minutes.'
              : 'Steadier. Back to it.'}
          </AppText>
          {urgeMode ? (
            <Card style={styles.standIn}>
              <AppText variant="caption" color="textTertiary">
                Still pulling?
              </AppText>
              <AppText variant="body">{standIn.line}</AppText>
            </Card>
          ) : null}
        </View>
        {urgeMode ? (
          <View style={styles.actions}>
            <Button title="It passed" onPress={() => close(true)} />
            <Button
              title="Go again"
              variant="secondary"
              onPress={() => {
                setDoneRounds((d) => d + 1);
                begin(protocol);
              }}
            />
            {intention ? (
              <Button title="It happened" variant="ghost" onPress={() => setLogging(true)} />
            ) : null}
          </View>
        ) : (
          <Button title="Close" onPress={() => close(true)} />
        )}
      </Screen>
    );
  }

  const phase = protocol.phases[phaseIndex];
  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.circle,
            { backgroundColor: theme.accentSoft, borderColor: theme.accent, transform: [{ scale }] },
          ]}
        />
        <AppText variant="title" style={styles.phase}>
          {phase.label}
        </AppText>
        <AppText variant="secondary" color="textTertiary">
          {secondsLeft}s · round {round} of {protocol.rounds}
        </AppText>
      </View>
      <Button title="Stop" variant="ghost" onPress={() => close(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chooser: { gap: Spacing.sm, marginTop: Spacing.xl, marginBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    marginBottom: Spacing.xl,
  },
  phase: { textAlign: 'center' },
  standIn: { gap: Spacing.xs, alignSelf: 'stretch' },
  actions: { gap: Spacing.sm },
});
