/**
 * Food preferences — the flexibility Isaac asked for, end to end.
 *
 * The model behind this screen (`meals/food.ts`) was written, tested, and
 * imported by nothing: 28 dishes with ingredients, allergens, intolerances
 * and dietary patterns, plus a fail-closed safety gate, and the rotation
 * meanwhile served titles from a twelve-item list that knew none of it.
 * This screen is the join.
 *
 * The ordering is a safety decision. Allergies come first and read as hard
 * exclusions; enjoyment comes last and reads as a preference. Nothing here
 * calls a food good or bad — dishes are excluded because of what is in
 * them, never because of what they are worth.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import {
  ALLERGEN_DISCLAIMER,
  ALLERGEN_LABELS,
  DIETARY_PATTERN_LABELS,
  DISHES,
  INTOLERANCE_LABELS,
  rankDishes,
  type Allergen,
  type DietaryPattern,
  type Intolerance,
} from '@/features/modalities/meals/food';
import { useAppStore } from '@/state/store';

/** Add or remove one value from a list, without caring which. */
const toggle = <T,>(list: T[], value: T): T[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function FoodPreferencesScreen() {
  const router = useRouter();
  const prefs = useAppStore((s) => s.foodPreferences);
  const setFoodPreferences = useAppStore((s) => s.setFoodPreferences);
  const markFoodPreferencesAsked = useAppStore((s) => s.markFoodPreferencesAsked);

  const [dislikeText, setDislikeText] = useState('');
  const [favouriteText, setFavouriteText] = useState('');

  const ranked = useMemo(() => rankDishes(DISHES, prefs), [prefs]);
  const allowed = ranked.filter((r) => !r.excluded);
  const excluded = ranked.filter((r) => r.excluded);

  const addWord = (field: 'dislikes' | 'favourites', text: string, clear: () => void) => {
    const word = text.trim().toLowerCase();
    if (!word) return;
    if (!prefs[field].includes(word)) {
      setFoodPreferences({ [field]: [...prefs[field], word] } as never);
    }
    clear();
  };


  return (
    <Screen>
      <AppText variant="label" color="accent">
        Food
      </AppText>
      <AppText variant="title">What works for you</AppText>
      <AppText variant="secondary" style={styles.sub}>
        Everything here shapes what gets suggested. You can change it whenever — the week
        re-rotates from whatever is true now.
      </AppText>

      <SectionHeader title="Allergies" />
      <AppText variant="caption" color="textTertiary">
        Hard exclusions. A dish is only offered when we positively know it is free of these — if
        the ingredients have not been reviewed, or an allergen might be present, it is left out.
      </AppText>
      <View style={styles.chips}>
        {(Object.keys(ALLERGEN_LABELS) as Allergen[]).map((a) => (
          <Chip
            key={a}
            label={ALLERGEN_LABELS[a]}
            selected={prefs.allergies.includes(a)}
            onPress={() => setFoodPreferences({ allergies: toggle(prefs.allergies, a) })}
          />
        ))}
      </View>
      {prefs.allergies.length > 0 ? (
        <Card style={styles.warning}>
          <AppText variant="caption" color="textTertiary">
            {ALLERGEN_DISCLAIMER}
          </AppText>
        </Card>
      ) : null}

      <SectionHeader title="Intolerances" />
      <AppText variant="caption" color="textTertiary">
        Not allergies — things that reliably do not agree with you.
      </AppText>
      <View style={styles.chips}>
        {(Object.keys(INTOLERANCE_LABELS) as Intolerance[]).map((i) => (
          <Chip
            key={i}
            label={INTOLERANCE_LABELS[i]}
            selected={prefs.intolerances.includes(i)}
            onPress={() => setFoodPreferences({ intolerances: toggle(prefs.intolerances, i) })}
          />
        ))}
      </View>

      <SectionHeader title="How you eat" />
      <View style={styles.chips}>
        {(Object.keys(DIETARY_PATTERN_LABELS) as DietaryPattern[]).map((p) => (
          <Chip
            key={p}
            label={DIETARY_PATTERN_LABELS[p]}
            selected={prefs.patterns.includes(p)}
            onPress={() => setFoodPreferences({ patterns: toggle(prefs.patterns, p) })}
          />
        ))}
      </View>

      <SectionHeader title="Not for you" />
      <AppText variant="caption" color="textTertiary">
        Ingredients or dishes you would rather avoid. These are pushed down the list rather than
        removed — a dislike is a preference, not a rule.
      </AppText>
      <View style={styles.chips}>
        {prefs.dislikes.map((d) => (
          <Chip
            key={d}
            label={d}
            selected
            onPress={() => setFoodPreferences({ dislikes: toggle(prefs.dislikes, d) })}
          />
        ))}
      </View>
      <View style={styles.addRow}>
        <Field
          label="Add a food you would rather not see"
          showLabel={false}
          style={styles.grow}
          value={dislikeText}
          onChangeText={setDislikeText}
          placeholder="mushrooms"
          returnKeyType="done"
          onSubmitEditing={() => addWord('dislikes', dislikeText, () => setDislikeText(''))}
        />
        <Chip label="Add" onPress={() => addWord('dislikes', dislikeText, () => setDislikeText(''))} />
      </View>

      <SectionHeader title="Favourites" />
      <View style={styles.chips}>
        {prefs.favourites.map((f) => (
          <Chip
            key={f}
            label={f}
            selected
            onPress={() => setFoodPreferences({ favourites: toggle(prefs.favourites, f) })}
          />
        ))}
      </View>
      <View style={styles.addRow}>
        <Field
          label="Add a food you want more of"
          showLabel={false}
          style={styles.grow}
          value={favouriteText}
          onChangeText={setFavouriteText}
          placeholder="salmon"
          returnKeyType="done"
          onSubmitEditing={() => addWord('favourites', favouriteText, () => setFavouriteText(''))}
        />
        <Chip
          label="Add"
          onPress={() => addWord('favourites', favouriteText, () => setFavouriteText(''))}
        />
      </View>

      <SectionHeader title="What that leaves" />
      <Card>
        <AppText variant="heading">
          {allowed.length} {allowed.length === 1 ? 'dish' : 'dishes'} in your rotation
        </AppText>
        {allowed.length === 0 ? (
          <AppText variant="secondary" style={styles.gap}>
            Nothing in the current list clears all of that. Loosening one thing — usually a
            dietary pattern rather than an allergy — opens it back up.
          </AppText>
        ) : (
          <AppText variant="caption" color="textTertiary" style={styles.gap}>
            {allowed
              .slice(0, 6)
              .map((r) => r.dish.title)
              .join(' · ')}
            {allowed.length > 6 ? ` · +${allowed.length - 6} more` : ''}
          </AppText>
        )}
      </Card>

      {excluded.length > 0 ? (
        <Card style={styles.gap}>
          <AppText variant="body">Left out, and why</AppText>
          {excluded.slice(0, 8).map((r) => (
            <AppText key={r.dish.id} variant="caption" color="textTertiary" style={styles.gap}>
              {r.dish.title} — {reasonText(r.excluded!, r.excludedBy)}
            </AppText>
          ))}
          {excluded.length > 8 ? (
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              and {excluded.length - 8} more.
            </AppText>
          ) : null}
        </Card>
      ) : null}

      <Button
        title="Done"
        onPress={() => {
          // Having seen this screen counts as having been asked, whether or
          // not anything was declared.
          markFoodPreferencesAsked();
          router.back();
        }}
        style={styles.footer}
      />
    </Screen>
  );
}

/** Plain words. The reason is for explaining, never for persuading. */
function reasonText(reason: string, by?: string): string {
  switch (reason) {
    case 'allergen':
      return `contains ${by}`;
    case 'allergen_may_contain':
      return `may contain ${by}`;
    case 'allergen_unreviewed':
      return 'ingredients not fully reviewed, so it is left out while you have an allergy set';
    case 'intolerance':
      return `contains ${by}`;
    case 'dietary_pattern':
      return `not ${by}`;
    case 'effort':
      return 'takes longer than your weeknights allow';
    default:
      return 'excluded';
  }
}

const styles = StyleSheet.create({
  sub: { marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  grow: { flexGrow: 1, flexShrink: 1 },
  warning: { marginTop: Spacing.sm },
  gap: { marginTop: Spacing.sm },
  footer: { marginTop: Spacing.xxl },
});
