import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { commitmentBudget } from '@/features/budget/commitment';
import {
  coachInterrupts,
  type InterruptEffect,
} from '@/features/coaches/interrupt';
import { voiceFor } from '@/features/coaches/voices';
import { nowMinutes, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * A coach, interrupting.
 *
 * Full screen and nothing else on it: the coach says one thing, asks one
 * thing, takes the answer and leaves. See `features/coaches/interrupt.ts`
 * for the rules — one at a time, two answers, and it always says why it
 * fired.
 *
 * The screen resolves the interruption by id rather than asking for "the
 * next one", because showing it has already taken it off that list.
 */
export default function CoachInterruptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const date = todayKey();

  const routines = useAppStore((s) => s.routines);
  const plans = useAppStore((s) => s.plans);
  const metrics = useAppStore((s) => s.metrics);
  const profile = useAppStore((s) => s.profile);
  const previousOpenAt = useAppStore((s) => s.previousOpenAt);
  const coachInterruptLog = useAppStore((s) => s.coachInterrupts);
  const answerInterrupt = useAppStore((s) => s.answerInterrupt);
  const applyWeeklyChanges = useAppStore((s) => s.applyWeeklyChanges);
  const setPathIntensityPush = useAppStore((s) => s.setPathIntensityPush);
  const moveItem = useAppStore((s) => s.moveItem);
  const moveItemToDate = useAppStore((s) => s.moveItemToDate);

  const interrupt = useMemo(() => {
    const budget = commitmentBudget({
      routines,
      plans,
      metrics,
      profile: profile ?? null,
      lastOpenedAt: previousOpenAt,
      today: date,
    });
    const all = coachInterrupts({
      routines,
      plans,
      metrics,
      profile: profile ?? null,
      budget,
      today: date,
      nowMinutes: nowMinutes(),
      seen: coachInterruptLog.map((i) => i.id),
    });
    return all.find((i) => i.id === id) ?? null;
     
  }, [routines, plans, metrics, profile, previousOpenAt, date, id, coachInterruptLog]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today' as never));

  const apply = (effect: InterruptEffect) => {
    switch (effect.kind) {
      case 'changes':
        applyWeeklyChanges(effect.changes);
        break;
      case 'intensity':
        setPathIntensityPush(effect.pathId, effect.push);
        break;
      case 'moveItem':
        moveItem(effect.date, effect.itemId, effect.start, 'user');
        break;
      case 'moveItemToDate':
        moveItemToDate(effect.date, effect.itemId, effect.targetDate);
        break;
      case 'none':
        break;
    }
  };

  if (!interrupt) {
    // The moment passed while the screen was opening — a dinner that
    // started, a night that got logged. Nothing to say is a real answer.
    return (
      <Screen>
        <AppText variant="title">Nothing right now.</AppText>
        <Button title="Back to today" style={styles.gap} onPress={close} />
      </Screen>
    );
  }

  const voice = voiceFor(interrupt.pathId);

  return (
    <Screen>
      <AppText variant="label" color="textTertiary">
        {voice.name} · {voice.discipline}
      </AppText>

      <View style={styles.middle}>
        <AppText variant="title">{interrupt.says}</AppText>
        <AppText variant="heading" style={styles.asks}>
          {interrupt.asks}
        </AppText>
      </View>

      {/* Two answers, never three. A third is the app hedging, and a
          person being interrupted has about four seconds of goodwill. */}
      <View style={styles.answers}>
        {interrupt.answers.map((a, i) => (
          <Button
            key={a.id}
            title={a.label}
            variant={i === 0 ? 'primary' : 'secondary'}
            onPress={() => {
              apply(a.effect);
              answerInterrupt(interrupt.id, a.id);
              close();
            }}
          />
        ))}
      </View>

      {/* It always says why. An app that asks without saying why is a
          survey wearing a coach's name. */}
      <Card style={styles.why}>
        <AppText variant="caption" color="textTertiary">
          {interrupt.because}
        </AppText>
      </Card>

      <Button title="Not now" variant="ghost" style={styles.gap} onPress={close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  middle: { marginTop: Spacing.xxl },
  asks: { marginTop: Spacing.lg },
  answers: { marginTop: Spacing.xl, gap: Spacing.sm },
  why: { marginTop: Spacing.xl },
  gap: { marginTop: Spacing.md },
});
