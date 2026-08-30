import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { nextIdea, suggestWeek } from '@/features/modalities/meals/rotation';
import { addDays, todayKey, weekdayOf } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** The coming week's dates keyed by weekday, starting today. */
function weekAhead(today: string): { date: string; weekday: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    return { date, weekday: weekdayOf(date) };
  });
}

/**
 * Nutrition coach — decide the week's dinners once, protein-first, mostly
 * whole foods. Tap any night to cycle ideas; the decided week shows up on
 * Today each evening. Structure over restriction: no calories, no rules,
 * just seven decisions made while you're not hungry.
 */
export default function MealsSession() {
  const router = useRouter();
  const theme = useTheme();
  const today = todayKey();

  const mealPlan = useAppStore((s) => s.mealPlan);
  const saveMealPlan = useAppStore((s) => s.saveMealPlan);

  const [dinners, setDinners] = useState<Record<number, string>>(
    () => mealPlan?.dinners ?? suggestWeek(today),
  );
  const [saved, setSaved] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today' as never));

  const cycle = (weekday: number) => {
    setDinners((prev) => ({ ...prev, [weekday]: nextIdea(prev[weekday] ?? '') }));
    setSaved(false);
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Nutrition
        </AppText>
        <Button title="Done" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">This week&apos;s dinners</AppText>
      <AppText variant="secondary" style={styles.sub}>
        Protein first, mostly whole foods, decided once — deciding now removes seven days of
        willpower decisions. Tap any night for a different idea.
      </AppText>

      <SectionHeader title="The week" />
      <View style={styles.stack}>
        {weekAhead(today).map(({ date, weekday }) => (
          <Pressable
            key={date}
            onPress={() => cycle(weekday)}
            accessibilityRole="button"
            accessibilityLabel={`Change ${WEEKDAYS[weekday]} dinner`}
            style={({ pressed }) => [
              styles.dayRow,
              {
                backgroundColor: pressed ? theme.surfacePressed : theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <AppText variant="caption" color="textTertiary" style={styles.dayName}>
              {date === today ? 'Tonight' : WEEKDAYS[weekday]}
            </AppText>
            <AppText variant="body" style={styles.meal}>
              {dinners[weekday]}
            </AppText>
          </Pressable>
        ))}
      </View>

      <Button
        title={saved ? 'Saved — on your Today screen ✓' : 'Lock in the week'}
        disabled={saved}
        onPress={() => {
          saveMealPlan(today, dinners);
          setSaved(true);
        }}
        style={styles.save}
      />
      <AppText variant="caption" color="textTertiary" style={styles.sub}>
        A plan that admits real life survives real life — leftovers night is deliberate. No
        calorie targets, no rules; educational structure, not dietary advice.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flexGrow: 1 },
  sub: { marginTop: Spacing.sm },
  stack: { gap: Spacing.sm },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dayName: { width: 86 },
  meal: { flex: 1, fontWeight: '500' },
  save: { marginTop: Spacing.xl },
});
