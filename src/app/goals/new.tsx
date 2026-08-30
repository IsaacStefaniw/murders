import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { newId } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import type { Goal, LifeArea, Routine, Weekday } from '@/types/domain';

const AREAS: { value: LifeArea; label: string }[] = [
  { value: 'health', label: 'Health' },
  { value: 'family', label: 'Family' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'work', label: 'Work' },
  { value: 'growth', label: 'Growth' },
  { value: 'enjoyment', label: 'Enjoyment' },
];

const CADENCES = [1, 2, 3, 4, 5];

/** Goal → recurring behaviour → schedule. Goals must not become static lists. */
export default function NewGoal() {
  const router = useRouter();
  const theme = useTheme();
  const addGoal = useAppStore((s) => s.addGoal);

  const [title, setTitle] = useState('');
  const [area, setArea] = useState<LifeArea>('health');
  const [cadence, setCadence] = useState<number | undefined>();

  const save = () => {
    const goalId = newId('g');
    const routines: Routine[] = [];

    if (cadence) {
      const spread: Weekday[] = [1, 3, 5, 6, 2, 4, 0];
      routines.push({
        id: newId('r'),
        title: title.trim(),
        area,
        goalId,
        days: spread.slice(0, cadence).sort((a, b) => a - b),
        durationMin: 45,
        preferredStart: '12:05',
        preferredEnd: '13:30',
        energy: 'any',
        flexible: true,
        protected: false,
        tier: 'should',
        active: true,
      });
    }

    const goal: Goal = {
      id: goalId,
      title: title.trim(),
      area,
      cadencePerWeek: cadence,
      status: 'active',
      createdAt: new Date().toISOString(),
      routineIds: routines.map((r) => r.id),
    };
    addGoal(goal, routines);
    router.back();
  };

  return (
    <Screen>
      <AppText variant="title">New goal</AppText>

      <SectionHeader title="What do you want?" />
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Read 20 minutes a day"
        placeholderTextColor={theme.textTertiary}
        autoFocus
        style={[
          styles.input,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      />

      <SectionHeader title="Life area" />
      <View style={styles.chips}>
        {AREAS.map((a) => (
          <Chip
            key={a.value}
            label={a.label}
            selected={area === a.value}
            onPress={() => setArea(a.value)}
          />
        ))}
      </View>

      <SectionHeader title="Schedule it weekly?" />
      <View style={styles.chips}>
        {CADENCES.map((c) => (
          <Chip
            key={c}
            label={`${c}×`}
            selected={cadence === c}
            onPress={() => setCadence(cadence === c ? undefined : c)}
          />
        ))}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.hint}>
        {cadence
          ? `INTENT will place ${cadence} session${cadence > 1 ? 's' : ''} into your week and adapt the timing to what you actually complete.`
          : 'Without a cadence this stays an ambition — you can break it down later.'}
      </AppText>

      <View style={styles.footer}>
        <Button title="Add goal" onPress={save} disabled={title.trim().length < 3} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 17,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hint: { marginTop: Spacing.md },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
