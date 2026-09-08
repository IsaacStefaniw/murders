/**
 * The shopping list — the week's dinners as a list you can shop from.
 *
 * Usability finding 8: after "Lock in the week" the flow ended at a saved
 * tick, and nine people out of nine looked for a list. This screen reads
 * the locked-in week, the food preferences and whatever the person has
 * switched on under "what you take already", builds the list with the
 * pure function in `meals/shopping.ts`, and hands it to the share sheet
 * as plain text — the same pattern the household screen uses to send the
 * week to a partner. Ticks are for the trip and live only in this screen.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { ALLERGEN_DISCLAIMER } from '@/features/modalities/meals/food';
import {
  buildShoppingList,
  shareShoppingListText,
  shoppingItemLine,
} from '@/features/modalities/meals/shopping';
import { parseSupplements } from '@/features/nutrition/supplements';
import { formatDateLong } from '@/lib/dates';
import { shareText } from '@/lib/share';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

export default function ShoppingListScreen() {
  const router = useRouter();
  const theme = useTheme();

  const mealPlan = useAppStore((s) => s.mealPlan);
  const foodPreferences = useAppStore((s) => s.foodPreferences);
  const supplementsRaw = useAppStore((s) => s.paths.nutrition?.answers.supplements);

  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today' as never));

  const list = useMemo(
    () =>
      mealPlan
        ? buildShoppingList({
            dinners: mealPlan.dinners,
            prefs: foodPreferences,
            supplements: parseSupplements(supplementsRaw),
          })
        : null,
    [mealPlan, foodPreferences, supplementsRaw],
  );
  const weekLabel = mealPlan ? `week of ${formatDateLong(mealPlan.weekStart)}` : undefined;

  const send = async () => {
    if (!list) return;
    const { shared } = await shareText(shareShoppingListText(list, weekLabel), 'Shopping list');
    if (!shared) return;
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Nutrition
        </AppText>
        <Button title="Close" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">Shopping list</AppText>

      {!list ? (
        <>
          <AppText variant="secondary" style={styles.sub}>
            The list is built from the week you lock in. Decide the dinners first and it writes
            itself.
          </AppText>
          <Button
            title="Plan this week’s dinners"
            onPress={() => router.push('/session/meals' as never)}
            style={styles.action}
          />
        </>
      ) : (
        <>
          <AppText variant="secondary" style={styles.sub}>
            {list.dinners.length
              ? `The ${weekLabel}: ${list.dinners.join(' · ')}. Plus a protein anchor for lunches.`
              : 'Nothing to buy for the dinners this week — leftovers all the way. The lunch anchors are still here.'}
          </AppText>

          {list.sections.map((section) => (
            <View key={section.aisle}>
              <SectionHeader title={section.label} />
              <View style={styles.stack}>
                {section.items.map((item) => {
                  const key = `${section.aisle}:${item.name}`;
                  const done = !!ticked[key];
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setTicked((prev) => ({ ...prev, [key]: !prev[key] }))}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: done }}
                      accessibilityLabel={shoppingItemLine(item)}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          backgroundColor: pressed ? theme.surfacePressed : theme.surface,
                          borderColor: theme.border,
                          opacity: done ? 0.5 : 1,
                        },
                      ]}
                    >
                      <AppText variant="caption" color="textTertiary" style={styles.tick}>
                        {done ? '✓' : '○'}
                      </AppText>
                      <AppText
                        variant="body"
                        style={[styles.item, done && styles.done]}
                      >
                        {shoppingItemLine(item)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {list.unmatched.length ? (
            <Card style={styles.action}>
              <AppText variant="body">Your own dinners — add what they need</AppText>
              <AppText variant="caption" color="textTertiary" style={styles.gap}>
                {list.unmatched.join(' · ')}
              </AppText>
            </Card>
          ) : null}

          <Button
            title={sent ? 'Sent ✓' : 'Send the list'}
            variant="secondary"
            onPress={send}
            style={styles.action}
          />
          <AppText variant="caption" color="textTertiary" style={styles.sub}>
            Amounts are for two. Anything under Supplements or Pharmacy is there because you
            switched it on — the list never suggests one. Educational structure, not dietary or
            medical advice.
          </AppText>
          {foodPreferences.allergies.length > 0 ? (
            <Card style={styles.gap}>
              <AppText variant="caption" color="textTertiary">
                {ALLERGEN_DISCLAIMER}
              </AppText>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flexGrow: 1 },
  sub: { marginTop: Spacing.sm },
  gap: { marginTop: Spacing.sm },
  stack: { gap: Spacing.sm },
  action: { marginTop: Spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  tick: { minWidth: 20 },
  item: { flex: 1 },
  done: { textDecorationLine: 'line-through' },
});
