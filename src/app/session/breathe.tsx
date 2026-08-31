import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import {
  BREATH_PROTOCOLS,
  protocolDurationSec,
  type BreathProtocol,
} from '@/features/modalities/breath/protocols';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * Breathwork session — runs entirely in the app in under two minutes.
 * A circle that breathes with you; nothing else on the screen.
 *
 * All session state derives from elapsed time since start: phase, round
 * and countdown are pure functions of the clock, so the player can't
 * drift into an inconsistent state.
 */
export default function BreatheSession() {
  const router = useRouter();
  const theme = useTheme();
  const { itemId, date } = useLocalSearchParams<{ itemId?: string; date?: string }>();
  const setItemStatus = useAppStore((s) => s.setItemStatus);
  const logCompletedActivity = useAppStore((s) => s.logCompletedActivity);
  const addMetric = useAppStore((s) => s.addMetric);

  const [protocol, setProtocol] = useState<BreathProtocol | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [scale] = useState(() => new Animated.Value(0.7));

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [startedAt]);

  // Derive position in the protocol from elapsed time.
  const cycleSec = protocol ? protocol.phases.reduce((s, p) => s + p.seconds, 0) : 0;
  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
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
    if (!protocol || finished || !startedAt) return;
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
    if (completed && protocol) {
      // Minutes feed the stillness-practice progression (features/mind).
      addMetric(
        'mind.minutes',
        Math.max(1, Math.round((cycleSec * protocol.rounds) / 60)),
        'breathwork',
      );
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
        durationMin: Math.max(1, Math.round((cycleSec * protocol.rounds) / 60)),
        sessionType: 'breathe',
        note: 'breath session',
      });
    }
    router.back();
  };

  if (!protocol || !startedAt) {
    return (
      <Screen>
        <AppText variant="label" color="accent">
          Breathe
        </AppText>
        <AppText variant="title">Ninety seconds, then back to it.</AppText>
        <View style={styles.chooser}>
          {BREATH_PROTOCOLS.map((p) => (
            <Card
              key={p.key}
              onPress={() => {
                setProtocol(p);
                setStartedAt(Date.now());
                setNow(Date.now());
              }}
              accessibilityLabel={p.name}
            >
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
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <AppText variant="title">Done.</AppText>
          <AppText variant="secondary">Steadier. Back to it.</AppText>
        </View>
        <Button title="Close" onPress={() => close(true)} />
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
});
