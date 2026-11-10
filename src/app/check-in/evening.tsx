import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import {
  cleanMood,
  MOOD_CHIPS,
  MOOD_KEY,
  MOOD_RANGE,
  moodLabel,
  toReflectionMood,
} from '@/features/health/mood';
import { analyseReflection } from '@/lib/ai/agents';
import { todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/** One-minute evening reflection. Quick controls, optional text. */
export default function EveningCheckIn() {
  const router = useRouter();
  const date = todayKey();

  const saveReflection = useAppStore((s) => s.saveReflection);
  const refreshSuggestions = useAppStore((s) => s.refreshSuggestions);
  const addMetric = useAppStore((s) => s.addMetric);

  // The score out of ten, which is what gets stored as a metric. The 1–5
  // bucket on the reflection is derived from it at save — see
  // features/health/mood.ts for why there are two shapes and one write.
  const [mood, setMood] = useState<number | undefined>();
  const [wentWell, setWentWell] = useState('');
  const [gotInTheWay, setGotInTheWay] = useState('');

  const nudge = (by: number) =>
    setMood((m) => (m === undefined ? undefined : cleanMood(m + by)));

  const save = () => {
    const reflection = {
      date,
      kind: 'evening' as const,
      mood: mood === undefined ? undefined : toReflectionMood(mood),
      wentWell: wentWell.trim() || undefined,
      gotInTheWay: gotInTheWay.trim() || undefined,
    };
    saveReflection(reflection);
    // The series the model reads. Without this the score lives only on the
    // reflection, where readiness, Essential 8 and the pace inputs cannot
    // reach it — which is how a number volunteered every night for a
    // fortnight would have changed nothing.
    if (mood !== undefined) addMetric(MOOD_KEY, mood, 'evening check-in');
    refreshSuggestions();
    // Structured signal extraction runs in the background; it never blocks
    // the user and falls back deterministically when AI is unavailable.
    analyseReflection({ ...reflection, id: 'pending', createdAt: new Date().toISOString() }).catch(
      () => {},
    );
    router.back();
  };


  return (
    <Screen>
      <AppText variant="title">How was today?</AppText>

      <View style={styles.moods}>
        {MOOD_CHIPS.map((m) => (
          <Chip
            key={m.score}
            label={m.label}
            // Selected across the whole band, not just on the nose, or a
            // nudge to 7.5 would clear the "Good" chip and leave the row
            // looking as though nothing had been answered.
            selected={mood !== undefined && toReflectionMood(mood) === toReflectionMood(m.score)}
            onPress={() => setMood(mood === m.score ? undefined : m.score)}
          />
        ))}
      </View>

      {/* The half step, shown only once a chip has been tapped. Offering it
          first would turn a one-tap close into a number somebody has to
          think about, which is how an evening check-in stops happening. */}
      {mood !== undefined ? (
        <View style={styles.nudge}>
          <Chip
            label="−½"
            disabled={mood <= MOOD_RANGE.min}
            hint="A little lower than the word"
            onPress={() => nudge(-MOOD_RANGE.step)}
          />
          <AppText variant="body" color="text">
            {mood} / 10 · {moodLabel(mood)}
          </AppText>
          <Chip
            label="+½"
            disabled={mood >= MOOD_RANGE.max}
            hint="A little higher than the word"
            onPress={() => nudge(MOOD_RANGE.step)}
          />
        </View>
      ) : null}

      <SectionHeader title="What got in the way?" />
      <Field
        label="What got in the way?"
        showLabel={false}
        value={gotInTheWay}
        onChangeText={setGotInTheWay}
        placeholder="Optional"
        multiline
      />

      {/* Deliberately last (peak-end rule): the day's final cognitive act is
          retrieving something good, which lifts tomorrow's starting mood. */}
      <SectionHeader title="What went well?" />
      <Field
        label="What went well?"
        showLabel={false}
        value={wentWell}
        onChangeText={setWentWell}
        placeholder="End on a good note — one moment is plenty"
        multiline
      />

      <View style={styles.footer}>
        <Button title="Close the day" onPress={save} disabled={!mood && !wentWell && !gotInTheWay} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  moods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  footer: { marginTop: Spacing.xxl },
});
