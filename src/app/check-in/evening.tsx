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
import { analyseReflection } from '@/lib/ai/agents';
import { todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';
import type { ReflectionMood } from '@/types/domain';

const MOODS: { value: ReflectionMood; label: string }[] = [
  { value: 1, label: 'Rough' },
  { value: 2, label: 'Off' },
  { value: 3, label: 'Fine' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

/** One-minute evening reflection. Quick controls, optional text. */
export default function EveningCheckIn() {
  const router = useRouter();
  const date = todayKey();

  const saveReflection = useAppStore((s) => s.saveReflection);
  const refreshSuggestions = useAppStore((s) => s.refreshSuggestions);

  const [mood, setMood] = useState<ReflectionMood | undefined>();
  const [wentWell, setWentWell] = useState('');
  const [gotInTheWay, setGotInTheWay] = useState('');

  const save = () => {
    const reflection = {
      date,
      kind: 'evening' as const,
      mood,
      wentWell: wentWell.trim() || undefined,
      gotInTheWay: gotInTheWay.trim() || undefined,
    };
    saveReflection(reflection);
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
        {MOODS.map((m) => (
          <Chip
            key={m.value}
            label={m.label}
            selected={mood === m.value}
            onPress={() => setMood(mood === m.value ? undefined : m.value)}
          />
        ))}
      </View>

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
  moods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  footer: { marginTop: Spacing.xxl },
});
